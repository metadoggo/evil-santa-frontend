<script lang="ts">
	import UploadForm from '$lib/form/upload_form.svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { createEventDispatcher } from 'svelte';

	const modalStore = getModalStore();

	export let purpose: string;
	export let params: Record<string, string | number> | undefined = undefined;
	export let images: string[];

	const dispatch = createEventDispatcher<{ update: void }>();

	function onUploadClick() {
		modalStore.update((modals) => [
			{
				type: 'component',
				component: {
					ref: UploadForm,
					props: {
						purpose,
						params
					}
				},
				response: updateImages
			},
			...modals
		]);
	}

	function updateImages(newImages?: string[]) {
		if (!newImages) {
			return;
		}
		images = [...images, ...newImages];
		dispatch('update');
	}

	function deleteImageAt(index: number) {
		images.splice(index, 1);
		images = [...images];
		dispatch('update');
	}
</script>

<div class="flex flex-col gap-4">
	{#if images.length}
		<div
			class="snap-x scroll-px-4 snap-mandatory scroll-smooth flex gap-4 overflow-x-auto px-4 py-4 h-60"
		>
			{#each images as img, i}
				<div class="snap-center shrink-0 card card-hover w-40 h-40 relative">
					<img src={img} alt="{purpose} image {i}" class="w-full h-full object-cover" />
					<button
						class="badge-icon variant-filled-error absolute top-0 right-0"
						type="button"
						on:click={() => deleteImageAt(i)}>X</button
					>
				</div>
			{/each}
		</div>
	{:else}
		<div
			class="snap-center shrink-0 card w-40 h-40 mx-auto flex justify-center items-center text-9xl"
		>
			🏞️
		</div>
	{/if}
	<button
		class="btn variant-ghost-primary mx-auto block"
		type="button"
		disabled={!params}
		on:click={onUploadClick}>{params ? 'Upload images' : 'Save this to upload images'}</button
	>
</div>
