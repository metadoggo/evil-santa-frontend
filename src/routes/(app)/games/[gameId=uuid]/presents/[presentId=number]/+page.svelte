<script lang="ts">
	import { page } from '$app/stores';
	import { derivedById } from '$lib/store/async_store';
	import { gameStore } from '$lib/store/game_store';
	import { usePresentStore } from '$lib/store/present_store';
	import NameCard from '$lib/ui/name_card.svelte';
	import { showError } from '$lib/util/notif';
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';

	const game = derivedById(gameStore, $page.params.gameId);
	const presentStore = usePresentStore($page.params.gameId);
	const present = derivedById(presentStore, parseInt($page.params.presentId, 10));
	const heroImage = derived(
		present,
		($present) =>
			($present?.wrapped_images && $present.wrapped_images.length && $present.wrapped_images[0]) ||
			''
	);

	onMount(() => {
		if (!$present) {
			presentStore.fetchOne(parseInt($page.params.presentId, 10)).catch(showError);
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
		<a class="anchor" href="/games/{$page.params.gameId}/presents">Presents</a>
	</li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb">{$present?.name || '--'}</li>
</ol>

<main class="max-w-screen-md my-8 text-center mx-auto">
	{#if $present}
		{#key $heroImage}
			<NameCard image={$heroImage} name={$present.name} class="mx-auto" />
		{/key}
		<a href={$present ? `${$present.id}/edit` : '#'} class="btn variant-ghost-primary my-4"
			>✏️ Edit</a
		>
	{/if}
</main>
