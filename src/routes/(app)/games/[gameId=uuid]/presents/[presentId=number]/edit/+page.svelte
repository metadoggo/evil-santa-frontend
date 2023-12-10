<script lang="ts">
	import { page } from '$app/stores';
	import PresentForm from '$lib/form/present_form.svelte';
	import { derivedById } from '$lib/store/async_store';
	import { gameStore } from '$lib/store/game_store';
	import { usePresentStore } from '$lib/store/present_store';
	import { showError } from '$lib/util/notif';
	import { onMount } from 'svelte';

	const game = derivedById(gameStore, $page.params.gameId);
	const presentStore = usePresentStore($page.params.gameId);
	const present = derivedById(presentStore, parseInt($page.params.presentId, 10));

	onMount(() => {
		if (!$present) {
			presentStore.fetchOne($page.params.presentId).catch(showError);
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
	<li class="crumb">
		<a class="anchor" href="/games/{$page.params.gameId}/presents/{$page.params.presentId}"
			>{$present?.name || $page.params.presentId}</a
		>
	</li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li>Edit</li>
</ol>

<main class="max-w-screen-sm mx-auto my-8">
	{#if $present}
		<PresentForm gameId={$page.params.gameId} present={$present} />
	{:else}
		Loading...
	{/if}
</main>
