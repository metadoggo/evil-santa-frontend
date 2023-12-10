<script lang="ts">
	import GameForm from '$lib/form/game_form.svelte';
</script>

<ol class="breadcrumb m-4">
	<li class="crumb"><a class="anchor" href="/">🏠</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb"><a class="anchor" href="/games">Games</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li>New</li>
</ol>

<main class="max-w-screen-sm mx-auto my-8">
	<GameForm />
</main>
