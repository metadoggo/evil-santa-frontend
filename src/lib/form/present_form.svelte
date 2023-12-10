<script lang="ts">
	import { usePresentStore, type Present } from '$lib/store/present_store';
	import { goto } from '$app/navigation';
	import type { AsyncResult } from '$lib/store/async_store';
	import ImageGallery from '$lib/ui/image_gallery.svelte';
	import { showError, showSuccess } from '$lib/util/notif';
	import { getModalStore } from '@skeletonlabs/skeleton';

	type Form = {
		name: string;
		wrapped_images: string[];
		unwrapped_images: string[];
	};

	export let gameId: string;
	export let present: Present | undefined = undefined;

	const uploadParams = present ? { game_id: gameId, present_id: present.id } : undefined;

	const modalStore = getModalStore();
	const presentStore = usePresentStore(gameId);
	const form: Form = {
		name: present?.name || '',
		wrapped_images: present?.wrapped_images ? [...present.wrapped_images] : [],
		unwrapped_images: present?.unwrapped_images ? [...present.unwrapped_images] : []
	};

	let inFlight = false;

	async function onSubmit() {
		inFlight = true;
		let res: AsyncResult;
		if (present) {
			res = await presentStore.put(present.id, undefined, form);
		} else {
			res = await presentStore.create(form);
			auth.currentUser?.getIdTokenResult(true);
		}
		inFlight = false;
		if (res.ok) {
			showSuccess();
			if (res.id) {
				goto(`${res.id}/edit`);
				return;
			}
		} else {
			showError(`${res.status}: ${res.message}`);
		}
	}

	function deletePresent() {
		if (!present) {
			return;
		}
		modalStore.trigger({
			type: 'confirm',
			title: 'Delete ' + present.name,
			body: 'This will permanently remove the present',
			response(r) {
				if (r && present) {
					presentStore.delete(present.id).then(() => goto('..'));
				}
			}
		});
	}
</script>

<form on:submit|preventDefault={onSubmit} class="p-4 card">
	<header class="">
		<h3 class="h3">Images (wrapped)</h3>
		<ImageGallery
			bind:images={form.wrapped_images}
			purpose="present-wrapped"
			params={uploadParams}
			on:update={onSubmit}
		/>
		<h3 class="h3">Images (Unwrapped)</h3>
		<ImageGallery
			bind:images={form.unwrapped_images}
			purpose="present-unwrapped"
			params={uploadParams}
			on:update={onSubmit}
		/>
	</header>
	<main class="my-4">
		<label class="label">
			<span>Name</span>
			<input name="name" bind:value={form.name} placeholder="E.g. Present 1" class="input p-2" />
		</label>
	</main>
	<footer class="flex justify-between gap-4 mt-2">
		<a href="." class="btn variant-ringed">← Back</a>
		<button
			type="button"
			class="btn variant-ringed-error"
			disabled={inFlight || !present}
			on:click={() => deletePresent()}>Delete</button
		>
		<button class="btn variant-filled-primary" type="submit" disabled={inFlight}>Save</button>
	</footer>
</form>