<script lang="ts">
	import { usePlayerStore, type Player } from '$lib/store/player_store';
	import type { Present } from '$lib/store/present_store';
	import { getModalStore } from '@skeletonlabs/skeleton';

	export let gameId: string;
	export let present: Present;
	export let opened: Present[];

	const modalStore = getModalStore();
	const playerStore = usePlayerStore(gameId);

	function onAcceptClick() {
		$modalStore[0].response!(present);
		modalStore.close();
	}

	function stealPresent(p: Present) {
		$modalStore[0].response!(p);
		modalStore.close();
	}
</script>

<div class="card flex flex-col items-center gap-4 pointer-events-auto">
	<button
		type="button"
		class="snap-end bg-surface-700 h-64 rounded-xl p-2"
		on:click={onAcceptClick}
	>
		<img
			src={present.unwrapped_images[0]}
			alt="Unwrapped present"
			class="h-full object-cover aspect-square rounded-md"
		/>
	</button>
	{#if opened.length}
		<h3 class="h3 text-center">Keep or steal?</h3>
		<div class="grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
			{#each opened as p}
				<button
					type="button"
					class="snap-end bg-surface-700 h-48 rounded-xl p-2"
					on:click={() => stealPresent(p)}
				>
					<img
						src={p.unwrapped_images[0]}
						alt="Opened present"
						class="h-full object-cover aspect-square rounded-md"
					/>
				</button>
			{/each}
		</div>
	{/if}
</div>
