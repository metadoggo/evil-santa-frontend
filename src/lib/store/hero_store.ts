import { readable } from 'svelte/store';

export function useHeroStore(images: string[], duration: number = 3000) {
	if (!images) {
		images = [];
	}
	return readable(images.length ? images[0] : undefined, (set) => {
		if (images.length > 1) {
			let idx = 0;
			const interval = setInterval(() => {
				if (++idx >= images.length) {
					idx = 0;
				}
				set(images[idx]);
			}, duration);
			return () => clearInterval(interval);
		}
	});
}
