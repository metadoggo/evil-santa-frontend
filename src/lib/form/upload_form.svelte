<script lang="ts" context="module">
	export type UploadPurpose =
		| 'profile'
		| 'game'
		| 'player'
		| 'present-wrapped'
		| 'present-unwrapped';
</script>

<script lang="ts">
	import { doFetch } from '$lib/store/async_store';

	import { showError, showSuccess, showWarning } from '$lib/util/notif';
	import { FileDropzone, ProgressRadial, getModalStore } from '@skeletonlabs/skeleton';

	export let purpose: UploadPurpose;
	export let multiple: boolean = true;
	export let params: Record<string, string> | undefined = undefined;

	const modalStore = getModalStore();
	const abortCtrl = new AbortController();

	let files: FileList | undefined;
	let inFlight = false;
	let isConfirmStop = false;

	function clearFiles() {
		files = undefined;
	}

	async function onSubmit(event: { currentTarget: EventTarget & HTMLFormElement }) {
		if (!files?.length) {
			return;
		}
		const form = new FormData(event.currentTarget);
		for (const k in params) {
			form.set(k, params[k]);
		}
		let q = new URLSearchParams({ purpose });

		showWarning('Uploading...');

		inFlight = true;
		const res = await doFetch('/uploads?' + q.toString(), {
			method: 'POST',
			signal: abortCtrl.signal,
			body: form
		});
		inFlight = false;
		if (res.ok) {
			const data: string[] = await res.json();
			showSuccess();
			$modalStore[0].response!(multiple ? data : data[0]);
			modalStore.close();
		} else {
			showError(`${res.status}: ${await res.text()}`);
		}
	}

	function onCancelClick() {
		if (inFlight) {
			isConfirmStop = true;
		} else {
			modalStore.close();
		}
	}

	const onDontStopClick = () => (isConfirmStop = false);
	const onStopUploadClick = () => {
		abortCtrl.abort();
		modalStore.close();
		isConfirmStop = false;
	};
</script>

<form on:submit|preventDefault={onSubmit} class="w-full sm:mx-8 p-4 card pointer-events-auto">
	<header>Upload images</header>
	<main class="relative">
		<FileDropzone
			name="files"
			{multiple}
			bind:files
			accept=".jpg, .png, .jpeg, .gif, .webp|image/*"
			disabled={inFlight}
			class="max-w-full"
		>
			<svelte:fragment slot="lead">
				{#if files?.length}
					<section class="flex flex-wrap justify-center gap-4">
						{#each Array.from(files) as file}
							<img src={URL.createObjectURL(file)} alt={file.name} class="h-36 w-36 object-cover" />
						{/each}
					</section>
				{:else}
					<span class="text-9xl">🏞️</span>
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="message">Upload an image</svelte:fragment>
			<svelte:fragment slot="meta">PNG, JPG, and WEBP allowed</svelte:fragment>
		</FileDropzone>
		{#if files?.length}
			<button
				class="btn-icon absolute top-4 right-4"
				type="button"
				disabled={inFlight}
				on:click|stopPropagation={clearFiles}>❌</button
			>
		{/if}
		{#if inFlight}
			<div class="absolute inset-0 flex justify-center items-center">
				<ProgressRadial width="w-24" stroke={90} strokeLinecap="round" />
			</div>
		{/if}
		{#if isConfirmStop}
			<div class="absolute w-full h-full inset-0 flex items-end justify-center p-4">
				<div class="card variant-filled">
					<header class="card-title"><h2 class="h2">Stop uploading?</h2></header>
					<section class="p-4">Are you sure you wish to stop uploads?</section>
					<footer class="card-footer flex justify-center gap-4 p-0">
						<button class="btn variant-ghost-error" type="button" on:click={onDontStopClick}
							>Don't stop</button
						>
						<button class="btn variant-filled-primary" type="button" on:click={onStopUploadClick}
							>Stop uploads</button
						>
					</footer>
				</div>
			</div>
		{/if}
	</main>
	<footer class="flex justify-center gap-4 mt-2">
		<button
			class="btn variant-ghost-error"
			type="button"
			disabled={isConfirmStop}
			on:click={onCancelClick}>Cancel</button
		>
		<button
			class="btn variant-filled-primary"
			type="submit"
			disabled={!params || inFlight || !files?.length}>Upload</button
		>
	</footer>
</form>
