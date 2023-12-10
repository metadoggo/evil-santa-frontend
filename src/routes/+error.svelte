<script lang="ts">
	import { page } from '$app/stores';
	import '../app.postcss';

	const emojis: Record<number, string> = {
		404: '🤷‍♀️',
		401: '🔐',
		403: '👮🏽',
		420: '🫠',
		500: '💥'
	};
</script>

<div class="flex flex-col items-center justify-center h-full">
	<div class="text-9xl">
		{emojis[$page.status] ?? emojis[500]}
	</div>
	<h1 class="flex items-center gap-4 text-4xl">
		<span class="">{$page.status}</span>
		<span class="text-surface-400">|</span>
		<span class="text-surface-400">{$page.error?.message || 'Error'}</span>
	</h1>
	<a class="btn mt-16 p-4 block hover:variant-soft-primary" href="/">
		<div class="text-4xl">🏡</div>
		<div>Home</div>
	</a>
</div>
