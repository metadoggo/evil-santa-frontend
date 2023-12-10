import type { Writable } from 'svelte/store';
import { useStore, type Identifiable, type Schedulable, type ID } from './async_store';

export type Game = Identifiable<string> &
	Schedulable & {
		name: string;
		users: Record<string, number>;
		images: string[];
		startedAt?: Date;
		player_id?: number;
		present_id?: number;
	};

function gameBuilder<T extends Identifiable<string> & Record<string, any>>(data: T): Game {
	return {
		id: data.id,
		name: data.name,
		users: data.users,
		images: data.images,
		player_id: data.player_id,
		present_id: data.present_id,
		startedAt: data.started_at ? new Date(data.started_at) : undefined,
		createdAt: new Date(data.created_at),
		updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
	} as Game;
}

function gameUpdater(
	store: Writable<Record<string, Game>>,
	id: string,
	data: Record<string, any>
) {
	store.update((s) => {
		const item = s[id];
		s[id] = {
			...item,
			name: data.name ?? item.name,
			users: data.users ?? item.users,
			images: data.images ?? item.images,
			createdAt: new Date(data.created_at) ?? item.createdAt,
			updatedAt: data.updated_at ? new Date(data.updated_at) : item.updatedAt,
			startedAt: data.started_at ? new Date(data.started_at) : item.startedAt,
			player_id: data.player_id ?? item.player_id,
			present_id: data.present_id ?? item.present_id,
		};
		return s;
	});
}

export const gameStore = useStore<Game, string>(`games`, undefined, gameBuilder, gameUpdater);

export type BelongsToGame<T extends ID> = Identifiable<T> & {
	game_id: string;
};
