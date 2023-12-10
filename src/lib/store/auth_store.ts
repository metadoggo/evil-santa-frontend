import { PUBLIC_API_URL } from '$env/static/public';
import { auth } from '$lib/firebase';
import { writable } from 'svelte/store';
import { doFetch } from './async_store';
import type { User } from 'firebase/auth';

export const authStore = writable<User|null>();

auth.authStateReady().then(() => authStore.set(auth.currentUser));
auth.onAuthStateChanged((user) => authStore.set(user));

export async function acceptInvitation(id: string) {
	const res = await doFetch(`${PUBLIC_API_URL}/accept/${id}`);
	if (!res.ok) {
		console.error('Error accept invitation:', await res.text());
	}
	return res.ok;
}
