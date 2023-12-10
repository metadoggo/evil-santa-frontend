<script lang="ts">
	import { auth } from '$lib/firebase';
	import { sortByCreatedAt } from '$lib/store/async_store';
	import { acceptInvitation, claimStore } from '$lib/store/claim_store';
	import { gameStore, type Game } from '$lib/store/game_store';
	import NameLink from '$lib/ui/name_link.svelte';
	import { showError, showSuccess } from '$lib/util/notif';
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';

	const my = derived(
		[gameStore, claimStore],
		([$gameStore, $claimStore], set) => {
			if (!$gameStore) {
				return;
			}
			const gameClaims = $claimStore.games;
			const myGames: Game[] = [];
			const myInvitations: Game[] = [];
			const games = Object.keys($gameStore);
			for (const id of games) {
				if (Object.hasOwn(gameClaims, id)) {
					myGames.push($gameStore[id]);
				} else {
					myInvitations.push($gameStore[id]);
				}
			}
			myGames.sort(sortByCreatedAt);
			set({
				games: myGames,
				invitations: myInvitations
			});
		},
		{ games: [], invitations: [] } as { games: Game[]; invitations: Game[] }
	);

	onMount(() => {
		gameStore.fetchAll().catch(showError);
	});

	async function accept(id: string) {
		if (!auth.currentUser) {
			showError('Please sign in');
			return;
		}
		if (await acceptInvitation(id)) {
			await auth.currentUser?.getIdToken(true);
			showSuccess('Success - please refresh this page!');
		} else {
			showError('Something went wrong');
		}
	}
</script>

<ol class="breadcrumb m-4">
	<li class="crumb"><a class="anchor" href="/">🏠</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li>Games</li>
</ol>

<main class="max-w-screen-md my-8 mx-auto">
	{#if $my.invitations.length}
		<h2 class="h2">Invitations</h2>
		<p>You have invitations to watch games</p>
		<nav class="list-nav my-8">
			<ol class="list">
				{#each $my.invitations as game}
					<li>
						<span class="badge text-6xl">💌</span>
						<span class="flex-auto">{game.name}</span>
						<button class="btn variant-filled-primary" on:click={() => accept(game.id)}
							>Accept</button
						>
					</li>
				{/each}
			</ol>
		</nav>
		<hr class="my-8" />
	{/if}
	<nav class="my-8 flex justify-center flex-wrap gap-4">
		{#each $my.games as game}
			<NameLink
				href="games/{game.id}"
				image={game.images.length ? game.images[0] : undefined}
				name={game.name}
			/>
		{/each}
	</nav>
	<div class="text-center my-12">
		<a href="/games/new" class="btn variant-ghost-primary">
			<span>＋</span>
			<span>New game</span>
		</a>
	</div>
</main>
