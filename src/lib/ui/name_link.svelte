<script lang="ts">
	export let href: string;
	export let image: string | undefined;
	export let name: string;
</script>

<a {href} class="card bg-initial card-hover overflow-hidden w-48">
	<header>
		<img src={image} alt={name} class="bg-black/50 w-full aspect-square object-cover" />
	</header>
	<section class="p-4">{name}</section>
</a>
