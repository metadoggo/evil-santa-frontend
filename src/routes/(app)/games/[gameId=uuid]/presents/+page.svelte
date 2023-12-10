<script lang="ts">
	import { page } from '$app/stores';
	import { derivedById, sortByCreatedAt } from '$lib/store/async_store';
	import { gameStore } from '$lib/store/game_store';
	import { usePresentStore } from '$lib/store/present_store';
	import NameLink from '$lib/ui/name_link.svelte';
	import { showError } from '$lib/util/notif';
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';

	const game = derivedById(gameStore, $page.params.gameId);
	const presentStore = usePresentStore($page.params.gameId);
	const presents = derived(presentStore, ($presentStore) => {
		return Object.values($presentStore).sort(sortByCreatedAt);
	});

	onMount(() => {
		presentStore.fetchAll().catch(showError);
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
	<li>Presents</li>
</ol>

<main class="max-w-screen-md my-8 text-center mx-auto">
	<nav class="my-8 flex justify-center flex-wrap gap-4">
		{#each $presents as present}
			<NameLink
				href="presents/{present.id}"
				image={present.wrapped_images.length ? present.wrapped_images[0] : undefined}
				name={present.name}
			/>
		{/each}
	</nav>
	<a href="presents/new" class="btn variant-ghost-primary">
		<span>＋</span>
		<span>New present</span>
	</a>
</main>
