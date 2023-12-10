<script lang="ts">
	import { page } from '$app/stores';
	import PlayerForm from '$lib/form/player_form.svelte';
	import { derivedById } from '$lib/store/async_store';
	import { gameStore } from '$lib/store/game_store';
	import { showError } from '$lib/util/notif';
	import { onMount } from 'svelte';

	const game = derivedById(gameStore, $page.params.gameId);

	onMount(() => {
		if (!$game) {
			gameStore.fetchOne($page.params.gameId).catch(showError);
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
	<li class="crumb">New</li>
</ol>

<main class="max-w-screen-sm mx-auto my-8">
	<PlayerForm gameId={$page.params.gameId} />
</main>
