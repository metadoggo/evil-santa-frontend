<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { auth } from '$lib/firebase';

	onMount(() => {
		auth.authStateReady().then(() => {
			console.log('mounted auth layout');
			if (auth.currentUser) {
				getToastStore().trigger({
					message: 'You are already signed in!',
					background: 'background-variant-success'
				});
				goto('/');
			}
		});
	});
</script>

<div class="flex justify-center items-center h-full">
	<slot />
</div>
