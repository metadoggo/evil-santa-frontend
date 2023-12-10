<script lang="ts">
	import { page } from '$app/stores';
	import { derivedById, sortByName } from '$lib/store/async_store';
	import { gameStore } from '$lib/store/game_store';
	import { usePlayerStore } from '$lib/store/player_store';
	import { showError } from '$lib/util/notif';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';

	const game = derivedById(gameStore, $page.params.gameId);
	const playerStore = usePlayerStore($page.params.gameId);
	const players = derived(playerStore, ($playerStore) => {
		return Object.values($playerStore).sort(sortByName);
	});
	onMount(() => {
		playerStore.fetchAll().catch(showError);
		if (!$game) {
			gameStore.fetchOne($page.params.gameId);
		}
	});
</script>

<ol class="breadcrumb m-4">
	<li class="crumb"><a class="anchor" href="/">🏠</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb"><a class="anchor" href="/games">Games</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb">
		<a class="anchor" href="/games/{$page.params.gameId}"
			>{$game ? $game.name : $page.params.gameId}</a
		>
	</li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li>Players</li>
</ol>

<main class="max-w-screen-md my-8 text-center mx-auto">
	<nav class="my-8 flex justify-center flex-wrap gap-4">
		{#each $players as player}
			<a href="players/{player.id}" class=" p-4 w-48 flex flex-col items-center">
				<Avatar
					src={player.images.length ? player.images[0] : undefined}
					initials={player.name
						.split(' ')
						.map((s) => s[0])
						.join('')
						.substring(0, 2)}
					rounded="rounded-full"
					class="w-full"
				/>
				<div class="p-4">{player.name}</div>
			</a>
		{/each}
	</nav>
	<a href="players/new" class="btn variant-ghost-primary">
		<span>＋</span>
		<span>New player</span>
	</a>
</main>
