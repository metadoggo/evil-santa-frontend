<script lang="ts">
	import { page } from '$app/stores';
	import { gameStore } from '$lib/store/game_store';
	import { usePlayerStore } from '$lib/store/player_store';
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';
	import { derivedById, sortByCreatedAt, sortByName } from '$lib/store/async_store';
	import { showError, showSuccess } from '$lib/util/notif';
	import NameCard from '$lib/ui/name_card.svelte';
	import { usePresentStore } from '$lib/store/present_store';
	import { auth } from '$lib/firebase';

	type Form = {
		uid: string;
	};
	const form: Form = {
		uid: ''
	};

	const game = derivedById(gameStore, $page.params.gameId);
	const playerStore = usePlayerStore($page.params.gameId);
	const players = derived(playerStore, ($playerStore) => {
		return Object.values($playerStore).sort(sortByName);
	});
	const presentStore = usePresentStore($page.params.gameId);
	const presents = derived(presentStore, ($presentStore) => {
		return Object.values($presentStore).sort(sortByCreatedAt);
	});
	const heroImage = derived(
		game,
		($game) => ($game?.images && $game.images.length && $game.images[0]) || ''
	);

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
	});

	let inFlight = false;

	async function onGrantFormSubmit() {
		if (!form.uid) {
			showError('Please enter the user id');
			return;
		}
		inFlight = true;
		try {
			const users = {
				...$game.users,
				[form.uid]: 0x1
			};

			const res = await gameStore.patch($page.params.gameId, undefined, { users });
			if (res.ok) {
				showSuccess;
				form.uid = '';
				return;
			}
			showError(`failed to save: ${res.status} ${await res.message}`);
		} catch (err) {
			showError('Error update game info');
		}
		inFlight = false;
	}
</script>

<ol class="breadcrumb m-4">
	<li class="crumb"><a class="anchor" href="/">🏠</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb"><a class="anchor" href="/games">Games</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li>{$game?.name || ''}</li>
</ol>

<main class="max-w-screen-md my-8 text-center mx-auto">
	{#if $game}
		<h1 class="h1">
			{$game.name}
		</h1>
		<div class="m-8">
			{#if $heroImage}
				<NameCard image={$heroImage} name={$game.name} class="mx-auto" />
			{/if}
			<a href="{$game.id}/edit" class="btn variant-ghost-primary my-4">✏️ Edit</a>
		</div>
		<div class="m-8 flex gap-4 justify-center">
			<a href="{$game.id}/players" class="btn variant-filled-secondary"
				>Players ({$players.length})</a
			>
			<a href="{$game.id}/presents" class="btn variant-filled-secondary"
				>Presents ({$presents.length})</a
			>
		</div>
		<div class="m-8 flex gap-4 justify-center">
			<a href="{$game.id}/play" class="btn variant-filled-primary">Play</a>
		</div>

		<div class="card m-8 p-4 w-[28rem] mx-auto text-left">
			<h4 class="h4">Users</h4>
			<ul class="list my-4">
				{#each Object.keys($game.users) as uid, i}
					<li>
						<span>{i + 1}.</span>
						{#if uid === auth.currentUser?.uid}
							<span class="flex-auto">{auth.currentUser?.displayName || uid} (you)</span>
						{:else}
							<span class="flex-auto">{uid}</span>
						{/if}
						<span>{$game.users[uid] === 0xff ? '👷‍♂️' : '🧍🏻'}</span>
					</li>
				{/each}
			</ul>
			<form class="flex gap-2" on:submit|preventDefault={onGrantFormSubmit}>
				<label class="label flex-1 flex items-center gap-2">
					<span>ID</span>
					<input
						name="uid"
						bind:value={form.uid}
						placeholder="E.g. kkoDRmZ3Fthm4tNn661a37yyNJ52"
						class="input p-2"
					/>
				</label>
				<button class="btn variant-filled-primary" disabled={inFlight}>Add</button>
			</form>
		</div>
	{:else}
		Loading...
	{/if}
</main>
