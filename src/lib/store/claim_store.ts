import { PUBLIC_API_URL } from '$env/static/public';
import { auth } from '$lib/firebase';
import { writable } from 'svelte/store';
import { doFetch } from './async_store';

export type ClaimStore = {
	games: Record<string, number>;
};

export const claimStore = writable<ClaimStore>({
	games: {}
});

auth.onIdTokenChanged(async (u) => {
	if (!u) {
		claimStore.set({ games: {} });
		return;
	}
	const idResult = await u.getIdTokenResult();
	claimStore.set({
		games: (idResult.claims.g || {}) as Record<string, number>
	});
});

export async function acceptInvitation(id: string) {
	const res = await doFetch(`${PUBLIC_API_URL}/accept/${id}`);
	if (!res.ok) {
		console.error('Error accept invitation:', await res.text());
	}
	return res.ok;
}
