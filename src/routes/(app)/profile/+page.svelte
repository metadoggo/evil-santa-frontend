<script lang="ts">
	import { auth } from '$lib/firebase';
	import NameForm from '$lib/form/name_form.svelte';
	import { authStore } from '$lib/store/auth_store';
	import { showSuccess } from '$lib/util/notif';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { signOut } from 'firebase/auth';

	const modalStore = getModalStore();

	function onEditNameClick() {
		if (!auth.currentUser) {
			return;
		}
		modalStore.trigger({
			type: 'component',
			component: {
				ref: NameForm
			}
		});
	}

	function onCopyClick() {
		navigator.clipboard.writeText(auth.currentUser?.uid || '');
		showSuccess();
	}

	async function onSignOutClick() {
		modalStore.trigger({
			type: 'confirm',
			title: 'Really sign out?',
			body: 'Are you sure you want to sign out?',
			response(r) {
				if (r) {
					signOut(auth);
				}
			}
		});
	}
</script>

<div class="card p-4 m-20 max-w-md mx-auto">
	<header class="card-header"><h2 class="h2 mb-4">Profile</h2></header>
	{#if !$authStore}
		Please sign in
	{:else}
		<dl class="list-dl">
			<div>
				<span class="text-2xl w-6 text-center">#</span>
				<span class="flex-auto">
					<dt class="text-surface-400">ID</dt>
					<dd>{$authStore.uid}</dd>
				</span>
				<button on:click={onCopyClick} class="btn variant-filled-primary">Copy</button>
			</div>
			<div>
				<span class="text-2xl w-6 text-center">📧</span>
				<span class="flex-auto">
					<dt class="text-surface-400">Email</dt>
					<dd>{$authStore.email}</dd>
				</span>
			</div>
			<div>
				<span class="text-2xl w-6 text-center">😄</span>
				<span class="flex-auto">
					<dt class="text-surface-400">Name</dt>
					<dd>{$authStore.displayName || ''}</dd>
				</span>
				<button on:click={onEditNameClick} class="btn variant-filled-primary">Change</button>
			</div>
		</dl>
	{/if}
</div>
{#if $authStore}
	<button class="btn variant-ghost-error mx-auto block" on:click={onSignOutClick}>Sign out</button>
{/if}
