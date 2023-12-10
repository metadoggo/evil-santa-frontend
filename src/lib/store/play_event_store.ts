import type { Writable } from 'svelte/store';
import { useStore, type Identifiable, type Schedulable, type ID, type Data } from './async_store';
import { PUBLIC_API_URL } from '$env/static/public';
import { browser } from '$app/environment';
import { usePresentStore } from './present_store';
import { gameStore } from './game_store';

export type PlayEvent = Identifiable<string> &
	Schedulable & {
		startedAt?: Date;
		game_id: number;
		player_id: number;
		present_id?: number;
		from_player_id?: number;
		from_present_id?: number;
	};

function playEventBuilder<T extends Identifiable<string> & Record<string, any>>(
	data: T
): PlayEvent {
	return {
		id: data.id,
		game_id: data.game_id,
		player_id: data.player_id,
		present_id: data.present_id,
		from_player_id: data.from_player_id,
		from_present_id: data.from_present_id,
		startedAt: data.started_at ? new Date(data.started_at) : undefined,
		createdAt: new Date(data.created_at)
	} as PlayEvent;
}

function playEventUpdater(
	store: Writable<Record<string, PlayEvent>>,
	id: string,
	data: Record<string, any>
) {
	store.update((s) => {
		const item = s[id];
		s[id] = {
			...item,
			createdAt: new Date(data.created_at) ?? item.createdAt,
			startedAt: data.started_at ? new Date(data.started_at) : item.startedAt,
			game_id: data.game_id ?? item.game_id,
			player_id: data.player_id ?? item.player_id,
			present_id: data.present_id ?? item.present_id,
			from_player_id: data.from_player_id ?? item.from_player_id,
			from_present_id: data.from_present_id ?? item.from_present_id
		};
		return s;
	});
}

export function usePlayEventStore(gameId: string) {
	return useStore(
		`games/${gameId}/events`,
		undefined,
		playEventBuilder,
		playEventUpdater,
		(_, update) => {
			if (browser) {
				const eventSource = new EventSource(`${PUBLIC_API_URL}/games/${gameId}/stream`);

				function listener(e: MessageEvent) {
					const item: Data<string> = JSON.parse(e.data);
					const ev = playEventBuilder(item);
					update((s) => {
						s[item.id] = ev;
						return s;
					});

					const presentStore = usePresentStore(gameId);
					if (ev.from_present_id) {
						if (ev.from_present_id === ev.present_id) {
							presentStore.update((s) => {
								const p = s[ev.present_id!];
								p.player_id = ev.player_id;
								s[p.id] = p;
								return s;
							});
						} else {
							presentStore.update((s) => {
								const p1 = s[ev.present_id!];
								p1.player_id = ev.from_player_id;
								s[p1.id] = p1;
								const p2 = s[ev.from_present_id!];
								p2.player_id = ev.player_id;
								s[p2.id] = p2;
								return s;
							});
						}
						gameStore.update((s) => {
							s[gameId].present_id =undefined;
							s[gameId].player_id =undefined;
							return s;
						});
					} else if (ev.present_id) {
						gameStore.update((s) => {
							s[gameId].present_id =ev.present_id;
							return s;
						});
					} else {
						gameStore.update((s) => {
							s[gameId].player_id =ev.player_id;
							return s;
						});
					}
				}


				eventSource.addEventListener('message', listener);

				return () => {
					eventSource.removeEventListener('message', listener);
				};
			}
		}
	);
}
