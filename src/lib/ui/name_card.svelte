<script lang="ts">
	export let image: string | undefined;
	export let name: string;
	let classes: string = '';
	export { classes as class };
</script>

<div class="card bg-initial overflow-hidden w-48 {classes}">
	<header>
		<img src={image} alt={name} class="bg-black/50 w-full aspect-square object-cover" />
	</header>
	<section class="p-4">{name}</section>
</div>
