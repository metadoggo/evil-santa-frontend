<script lang="ts">
	import { AppBar, AppShell, LightSwitch } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { auth } from '$lib/firebase';
	import { showError } from '$lib/util/notif';

	onMount(() => {
		auth.authStateReady().then(() => {
			if (!auth.currentUser) {
				showError('Please sign in to continue');
				goto('/sign-in');
			}
		});
	});
</script>

<AppShell regionPage="relative" slotPageHeader="sticky top-0 z-10" slotSidebarLeft="w-0 sm:w-24">
	<svelte:fragment slot="header"
		><AppBar>
			<svelte:fragment slot="lead">
				<h1>Evil Santa</h1>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<LightSwitch />
				<a href="/profile" class="btn-icon text-4xl">👷🏼</a>
			</svelte:fragment>
			<a class="btn hover:variant-soft-primary" href="/">Home</a>
			<a class="btn hover:variant-soft-primary" href="/games">My Games</a>
		</AppBar>
	</svelte:fragment>
	<slot />
</AppShell>
