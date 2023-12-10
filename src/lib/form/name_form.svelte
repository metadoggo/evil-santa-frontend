<script lang="ts">
	import { auth } from '$lib/firebase';
	import { authStore } from '$lib/store/auth_store';
	import { showError, showSuccess } from '$lib/util/notif';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { updateProfile } from 'firebase/auth';

	const modalStore = getModalStore();

	let name: string;

	async function onSubmit() {
		if (!auth.currentUser) {
			showError('Please sign in');
		}
		if (!name) {
			showError('Please enter your name');
			return;
		}
		updateProfile(auth.currentUser!, {
			displayName: name
		})
			.then(() => {
				auth.currentUser?.getIdToken(true);
				modalStore.close();
				showSuccess();
			})
			.catch(() => {
				showError('Failed to update your name, please try again lager.');
			});
	}
</script>

<div class="w-full h-full card bg-primary rounded-3xl py-10 px-8 sm:w-2/3 lg:w-1/2">
	<form on:submit|preventDefault={onSubmit} class="flex flex-col items-center w-full h-full">
		<header class="text-2xl mb-6"><strong>Full name</strong></header>
		<main class="mb-10">
			<label class="label text-center">
				<span>Please enter your full name</span>
				<input
					bind:value={name}
					name="name"
					placeholder="E.g. John Smith"
					class="input p-2 !mt-5"
				/>
			</label>
		</main>
		<footer>
			<button class="btn variant-filled-secondary bg-secondary" type="submit">Submit</button>
		</footer>
	</form>
</div>
