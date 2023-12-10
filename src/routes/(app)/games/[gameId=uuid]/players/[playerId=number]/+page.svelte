<script lang="ts">
	import { page } from '$app/stores';
	import { derivedById } from '$lib/store/async_store';
	import { gameStore } from '$lib/store/game_store';
	import { useHeroStore } from '$lib/store/hero_store';
	import { usePlayerStore } from '$lib/store/player_store';
	import { showError } from '$lib/util/notif';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { expoInOut } from 'svelte/easing';
	import { derived } from 'svelte/store';
	import { fade } from 'svelte/transition';

	const game = derivedById(gameStore, $page.params.gameId);
	const playerStore = usePlayerStore($page.params.gameId);
	const player = derivedById(playerStore, parseInt($page.params.playerId, 10));
	const images = derived(player, ($player) => $player?.images || []);
	const heroImage = useHeroStore($images, 1600);

	onMount(() => {
		if (!$player) {
			playerStore.fetchOne($page.params.playerId).catch(showError);
		}
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
		<a class="anchor" href="/games/{$page.params.gameId}">{$game?.name || $page.params.gameId}</a>
	</li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb">
		<a class="anchor" href="/games/{$page.params.gameId}/players">Players</a>
	</li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb">{$player?.name || '--'}</li>
</ol>

<main class="max-w-screen-md my-8 text-center mx-auto">
	{#if $player}
		<div class="w-64 h-64 relative mx-auto">
			{#key $heroImage}
				<div
					in:fade={{ duration: 600, easing: expoInOut }}
					out:fade={{ duration: 600, easing: expoInOut }}
					class="absolute"
				>
					<Avatar
						src={$heroImage}
						initials={$player.name}
						rounded="rounded-full"
						class="w-full h-full"
					/>
				</div>
			{/key}
		</div>
		<h1 class="h1">
			{$player.name || ''}
		</h1>
		<div>
			<span>Age: </span>
			<span>{$player.age || ''}</span>
		</div>
		<a href={$player ? `${$player.id}/edit` : '#'} class="btn variant-ghost-primary my-4">✏️ Edit</a
		>
	{:else}
		Loading...
	{/if}
</main>
