<script lang="ts">
	import { page } from '$app/stores';
	import { gameStore } from '$lib/store/game_store';
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';
	import {
		derivedById,
		sortByCreatedAt,
		sortByName,
		type UpdateResponse
	} from '$lib/store/async_store';
	import { showError, showInfo, showSuccess } from '$lib/util/notif';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import Steal from '$lib/ui/steal.svelte';
	import { usePlayerStore, type Player } from '$lib/store/player_store';
	import { usePresentStore, type Present } from '$lib/store/present_store';
	import { usePlayEventStore } from '$lib/store/play_event_store';
	import { play } from '$lib/util/play';
	import { claimStore } from '$lib/store/claim_store';

	const modalStore = getModalStore();
	const game = derivedById(gameStore, $page.params.gameId);
	const playEventStore = usePlayEventStore($page.params.gameId);
	const playerStore = usePlayerStore($page.params.gameId);
	const players = derived(playerStore, ($playerStore) => {
		return Object.values($playerStore).sort(sortByName);
	});
	const presentStore = usePresentStore($page.params.gameId);
	const presents = derived(presentStore, ($presentStore) => {
		return Object.values($presentStore).sort(sortByCreatedAt);
	});

	const currentPlayer = derived([game, playerStore], ([$game, $playerStore]) => {
		if ($game?.player_id && $playerStore) {
			return $playerStore[$game.player_id];
		}
	});

	const currentPresent = derived([game, presentStore], ([$game, $presentStore]) => {
		if ($game?.present_id && $presentStore) {
			return $presentStore[$game.present_id];
		}
	});

	const gameState = derived([players, presents], ([$players, $presents]) => {
		const map: Record<number, Present> = {};
		for (const p of $presents) {
			if (p.player_id) {
				map[p.player_id] = p;
			}
		}
		const waiting: Player[] = [];
		const played: Player[] = [];
		for (const p of $players) {
			if (map[p.id]) {
				played.push(p);
			} else {
				waiting.push(p);
			}
		}
		const opened: Present[] = [];
		const wrapped: Present[] = [];
		for (const p of $presents) {
			if (p.player_id) {
				opened.push(p);
			} else {
				wrapped.push(p);
			}
		}
		return {
			waiting,
			played,
			opened,
			wrapped
		};
	});

	const canPlay = derived([claimStore, game], ([$claimStore, $game]) => {
		return $game?.id && $claimStore.games[$game.id] >= 2;
	});

	const playEvents = derived(playEventStore, ($playEventStore) => {
		return Object.values($playEventStore).sort(sortByCreatedAt);
	});

	function setGameState(data: Record<string, any>) {
		gameStore.update((s) => {
			const item = s[$game.id];
			for (const k in data) {
				// @ts-ignore: How can this be done in a type-safe manner?
				item[k] = data[k];
			}
			s[$game.id] = item;
			return s;
		});
	}

	onMount(() => {
		if (!$game) {
			gameStore.fetchOne($page.params.gameId).catch(showError);
		}
		if (!$players.length) {
			playerStore.fetchAll();
		}
		if (!$presents.length) {
			presentStore.fetchAll();
		}
		playEventStore.fetchAll();
	});

	async function openPresent(p: Present) {
		if (!$currentPlayer) {
			showError('Roll!');
			return;
		}
		if ($modalStore.length) {
			return;
		}
		await onPickClick(p.id);
		showKeepOrStealDialog();
	}

	function showKeepOrStealDialog() {
		modalStore.trigger({
			type: 'component',
			component: {
				ref: Steal,
				props: {
					gameId: $page.params.gameId,
					present: $currentPresent,
					opened: $gameState.opened
				}
			},
			backdropClasses: 'pointer-events-none',
			response(r?: Present) {
				if (!r || !currentPlayer) {
					return;
				}
				if ($currentPresent !== r) {
					onStealClick(r.id);
				} else {
					onKeepClick();
				}
			}
		});
	}

	async function move<T extends UpdateResponse>(
		action: string,
		body?: Record<string, any>
	): Promise<T | undefined> {
		const res = await play($game.id, action, body);
		if (res.ok) {
			showSuccess();
			return await res.json<T>();
		} else {
			showError(`${res.status}: ${await res.text()}`);
		}
	}

	async function onStartClick() {
		showInfo('Starting game...');
		const res = await move('start');
		if (res) {
			setGameState({
				updated_at: res.updated_at,
				startedAt: new Date(res.started_at)
			});
		}
	}

	async function onResetClick() {
		showInfo('Resetting game...');
		const res = await move('reset');
		presentStore.update((s) => {
			for (const p of Object.values($presentStore)) {
				s[p.id] = {
					...p,
					player_id: undefined
				};
			}
			return s;
		});

		setGameState({
			...res,
			started_at: undefined,
			player_id: undefined,
			present_id: undefined
		});

		playEventStore.set({});
	}

	async function onRollClick() {
		showInfo('Rolling...');
		const res = await move('roll');
		if (res) {
			setGameState(res);
		}
	}

	async function onPickClick(presentId: number) {
		if (!$currentPlayer) {
			showError('Roll!');
			return;
		}
		if ($modalStore.length) {
			return;
		}
		showInfo('Opening present...');
		const res = await move(`pick`, { present_id: presentId });
		if (res) {
			setGameState(res);
		}
	}

	async function onKeepClick() {
		if (!$currentPlayer || !$currentPresent) {
			return;
		}
		showInfo('Good choice!');
		const res = await move('keep');
		const player = $currentPlayer;
		const present = $currentPresent;
		presentStore.update((s) => {
			s[present.id] = {
				...present,
				player_id: player.id
			};
			return s;
		});
		if (res) {
			setGameState({
				...res,
				player_id: undefined,
				present_id: undefined
			});
		}
	}

	async function onStealClick(presentId: number) {
		if (!$currentPlayer || !$currentPresent) {
			return;
		}
		showInfo('Stealing present...');
		const res = await move(`steal`, { present_id: presentId });
		const player = $currentPlayer;
		const present = $currentPresent;
		presentStore.update((s) => {
			const stealPresent = s[presentId];
			s[present.id] = {
				...present,
				player_id: stealPresent.player_id
			};
			s[presentId] = {
				...stealPresent,
				player_id: player.id
			};
			return s;
		});
		if (res) {
			setGameState({
				...res,
				player_id: undefined,
				present_id: undefined
			});
		}
	}
</script>

<div class="flex">
	<ol class="flex-1 breadcrumb m-4">
		<li class="crumb"><a class="anchor" href="/">🏠</a></li>
		<li class="crumb-separator" aria-hidden>&rsaquo;</li>
		<li class="crumb"><a class="anchor" href="/games">Games</a></li>
		<li class="crumb-separator" aria-hidden>&rsaquo;</li>
		<li>{$game?.name || ''}</li>
	</ol>
	{#if $game?.startedAt}
		<button class="btn-icon" type="button" on:click={onResetClick}>❌</button>
	{/if}
</div>

<main class="my-8 text-center mx-auto">
	{#if !$game || !$players.length || !$presents.length}
		Loading...
	{:else}
		<div class="flex flex-col gap-4">
			<div class="snap-x scroll-px-4 snap-mandatory scroll-smooth overflow-x-auto flex gap-2">
				{#each $gameState.waiting as p}
					<img
						src={p.images[0]}
						alt={p.name}
						class="snap-end {p === $currentPlayer
							? 'bg-warning-400'
							: 'bg-surface-700'} snap-center h-48 aspect-square object-cover rounded-full p-2"
					/>
				{/each}
			</div>
			{#if $canPlay}
				{#if $currentPresent}
					<button class="btn variant-filled-primary self-center" on:click={showKeepOrStealDialog}
						>Keep or steal?</button
					>
				{:else if !$game.startedAt}
					<button class="btn variant-filled-primary self-center" on:click={onStartClick}
						>Start</button
					>
				{:else if $gameState.waiting.length}
					<button
						class="btn variant-filled-primary self-center"
						on:click={onRollClick}
						disabled={!!$currentPlayer}>Let's roll</button
					>
				{:else}
					<h2 class="h2 my-8">Game over!</h2>
				{/if}
			{/if}
			<div
				class={$gameState.waiting.length
					? 'snap-x scroll-px-4 snap-mandatory scroll-smooth overflow-x-auto p-6 flex gap-8'
					: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 place-items-center'}
			>
				{#each $gameState.opened as present}
					<div class="snap-center shrink-0 card card-hover w-48 h-48 rounded-xl relative p-2">
						<img
							src={present.unwrapped_images[0]}
							alt="Opened present {present.name}"
							class="w-full aspect-square object-cover rounded-md"
						/>
						{#if present.player_id}
							<img
								src={$playerStore[present.player_id].images[0]}
								alt="Opened present {present.name}"
								class="w-24 aspect-square object-cover rounded-full absolute -top-4 -left-4"
							/>
						{:else}
							<div
								class="w-24 aspect-square object-cover rounded-full absolute -top-4 -left-4 bg-primary-500 flex justify-center items-center text-7xl"
							>
								?
							</div>
						{/if}
					</div>
				{/each}
			</div>
			<div class="snap-x scroll-px-4 snap-mandatory scroll-smooth overflow-x-auto flex gap-2">
				{#each $gameState.wrapped as p}
					{#if p === $currentPresent}
						<div class="snap-center bg-warning-400 rounded-xl h-48 w-48 p-2">
							<img
								src={p.unwrapped_images[0]}
								alt="Opened present"
								class="h-full w-full object-cover aspect-square rounded-md"
							/>
						</div>
					{:else}
						<div class="snap-center bg-surface-700 rounded-xl h-48 w-48 p-2">
							<button
								type="button"
								class="h-full w-full aspect-square"
								on:click={() => openPresent(p)}
								disabled={!!$modalStore.length}
							>
								<img
									src={p.wrapped_images[0]}
									alt="Present"
									class="h-full w-full object-cover aspect-square rounded-md"
								/>
							</button>
						</div>
					{/if}
				{/each}
			</div>
			<div>
				{#each $playEvents as ev}
					<div class="flex items-center">
						<img
							class="h-16 aspect-square object-cover rounded-full"
							src={$playerStore[ev.player_id].images[0]}
							alt="Player"
						/>
						{#if ev.from_present_id}
							{#if ev.from_present_id === ev.present_id}
								<span class="mx-4">kept</span>
								<img
									class="h-16 aspect-square object-cover"
									src={$presentStore[ev.from_present_id].unwrapped_images[0]}
									alt="Kept present"
								/>
							{:else}
								<span class="mx-4">stole</span>
								<img
									class="h-16 aspect-square object-cover"
									src={$presentStore[ev.from_present_id].unwrapped_images[0]}
									alt="Stolen present"
								/>
								{#if ev.from_player_id}
									<span class="mx-4">from</span>
									<img
										class="h-16 aspect-square object-cover rounded-full"
										src={$playerStore[ev.from_player_id].images[0]}
										alt="Victim"
									/>
								{/if}
							{/if}
						{:else if ev.present_id}
							<span class="mx-4">picked</span>
							<img
								class="h-16 aspect-square object-cover"
								src={$presentStore[ev.present_id].wrapped_images[0]}
								alt="Kept present"
							/>
							<span class="mx-4">and got</span>
							<img
								class="h-16 aspect-square object-cover"
								src={$presentStore[ev.present_id].unwrapped_images[0]}
								alt="Kept present"
							/>
						{:else}
							<span class="mx-4">turn to play</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</main>
