<script lang="ts">
	import { type Game, gameStore } from '$lib/store/game_store';
	import { goto } from '$app/navigation';
	import ImageGallery from '$lib/ui/image_gallery.svelte';
	import { showError, showSuccess } from '$lib/util/notif';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { auth } from '$lib/firebase';

	type Form = {
		name: string;
		images: string[];
		users: UserPermission[];
	};

	type UserPermission = {
		userId: string;
		permission: number;
	};

	export let game: Game | undefined = undefined;

	const modalStore = getModalStore();
	const form: Form = {
		name: game?.name || '',
		images: game?.images ? [...game.images] : [],
		users: game?.users
			? Object.keys(game.users).map((userId) => ({ userId, permission: game!.users[userId] }))
			: []
	};

	let inFlight = false;

	async function onSubmit() {
		inFlight = true;
		const data: Record<string, any> = {
			...form,
			users: form.users.reduce(
				(acc, item) => {
					acc[item.userId] = item.permission;
					return acc;
				},
				{} as Record<string, number>
			)
		};
		if (game) {
			const updateRes = await gameStore.patch(game.id, undefined, data);
			if (updateRes.ok) {
				showSuccess();
				return;
			} else {
				showError(`${updateRes.status}: ${updateRes.message}`);
			}
		} else {
			const createRes = await gameStore.create(data);
			if (createRes.ok) {
				auth.currentUser?.getIdTokenResult(true);
				goto(`${createRes.id}/edit`);
			} else {
				showError(`${createRes.status}: ${createRes.message}`);
			}
		}
		inFlight = false;
	}

	function deleteGame() {
		if (!game) {
			return;
		}
		modalStore.trigger({
			type: 'confirm',
			title: 'Delete ' + game.name,
			body: 'This will permanently remove the game',
			response(r) {
				if (r && game) {
					gameStore.delete(game.id).then(() => goto('..'));
				}
			}
		});
	}
</script>

<form on:submit|preventDefault={onSubmit} class="p-4 card">
	{#if game}
		<header class="">
			<ImageGallery
				bind:images={form.images}
				purpose="game"
				params={game ? { game_id: game.id } : undefined}
				on:update={onSubmit}
			/>
		</header>
	{/if}
	<main class="my-4">
		<label class="label">
			<span>Name</span>
			<input
				name="name"
				bind:value={form.name}
				placeholder="E.g. The Smith's Xmas"
				class="input p-2"
			/>
		</label>
	</main>
	<footer class="flex justify-between gap-4 mt-2">
		<a href="." class="btn variant-ringed">← Back</a>
		<button
			type="button"
			class="btn variant-ringed-error"
			disabled={inFlight || !game}
			on:click={() => deleteGame()}>Delete</button
		>
		<button class="btn variant-filled-primary" type="submit" disabled={inFlight}>Save</button>
	</footer>
</form>
