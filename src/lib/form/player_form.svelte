<script lang="ts">
	import { goto } from '$app/navigation';
	import type { AsyncResult } from '$lib/store/async_store';
	import ImageGallery from '$lib/ui/image_gallery.svelte';
	import { showError, showSuccess } from '$lib/util/notif';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { usePlayerStore, type Player } from '$lib/store/player_store';
	import { authStore } from '$lib/store/auth_store';
	import { auth } from '$lib/firebase';

	type Form = {
		name: string;
		images: string[];
		age?: number;
	};

	export let gameId: string;
	export let player: Player | undefined = undefined;

	const modalStore = getModalStore();
	const playerStore = usePlayerStore(gameId);
	const form: Form = {
		name: player?.name || '',
		images: player?.images ? [...player.images] : [],
		age: player?.age
	};

	let inFlight = false;

	async function onSubmit() {
		if (!auth.currentUser) {
			showError('Please sign in');
			return;
		}
		inFlight = true;
		if (player) {
			const updateRes = await playerStore.patch(player.id, undefined, form);
			if (updateRes.ok) {
				showSuccess();
				return;
			} else {
				showError(`${updateRes.status}: ${updateRes.message}`);
			}
		} else {
			const createRes = await playerStore.create(form);
			auth.currentUser.getIdTokenResult(true);
			if (createRes.ok) {
				showSuccess();
				goto(`${createRes.id}/edit`);
				return;
			} else {
				showError(`${createRes.status}: ${createRes.message}`);
			}
		}
		inFlight = false;
	}

	function deletePlayer() {
		if (!player) {
			return;
		}
		modalStore.trigger({
			type: 'confirm',
			title: 'Delete ' + player.name,
			body: 'This will permanently remove the player',
			response(r) {
				if (r && player) {
					playerStore.delete(player.id).then(() => goto('..'));
				}
			}
		});
	}
</script>

<form on:submit|preventDefault={onSubmit} class="p-4 card">
	<header class="">
		<ImageGallery
			bind:images={form.images}
			purpose="player"
			params={player ? { game_id: gameId, player_id: player.id } : undefined}
			on:update={onSubmit}
		/>
	</header>
	<main class="my-4">
		<label class="label">
			<span>Name</span>
			<input name="name" bind:value={form.name} placeholder="E.g. John" class="input p-2" />
		</label>
		<label class="label">
			<span>Age</span>
			<input
				name="age"
				bind:value={form.age}
				type="number"
				placeholder="E.g. 12"
				class="input p-2"
			/>
		</label>
	</main>
	<footer class="flex justify-between gap-4 mt-2">
		<a href="." class="btn variant-ringed">← Back</a>
		<button
			type="button"
			class="btn variant-ringed-error"
			disabled={inFlight || !player}
			on:click={() => deletePlayer()}>Delete</button
		>
		<button class="btn variant-filled-primary" type="submit" disabled={inFlight}>Save</button>
	</footer>
</form>
