<script lang="ts">
	import { usePresentStore, type Present } from '$lib/store/present_store';
	import { goto } from '$app/navigation';
	import ImageGallery from '$lib/ui/image_gallery.svelte';
	import { showError, showSuccess } from '$lib/util/notif';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { auth } from '$lib/firebase';

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
		name: present?.name || `Present number ${Object.keys($presentStore).length + 1}`,
		wrapped_images: present?.wrapped_images ? [...present.wrapped_images] : [],
		unwrapped_images: present?.unwrapped_images ? [...present.unwrapped_images] : []
	};

	let inFlight = false;

	async function onSubmit() {
		if (!auth.currentUser) {
			showError('Please sign in');
			return;
		}
		if (!form.name) {
			showError('Name is required');
		}
		inFlight = true;
		if (present) {
			const updateRes = await presentStore.patch(present.id, undefined, form);
			inFlight = false;
			if (updateRes.ok) {
				showSuccess();
			} else {
				showError(`${updateRes.status}: ${updateRes.message}`);
			}
		} else {
			const createRes = await presentStore.create(form);
			inFlight = false;
			if (createRes.ok) {
				showSuccess();
				auth.currentUser.getIdTokenResult(true);
				goto(`${createRes.id}/edit`);
			} else {
				showError(`${createRes.status}: ${createRes.message}`);
			}
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
	{#if present}
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
	{/if}
	<main class="my-4">
		<label class="label">
			<span>Name/number</span>
			<input
				name="name"
				bind:value={form.name}
				placeholder="E.g. Present 1"
				required
				class="input p-2"
			/>
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
