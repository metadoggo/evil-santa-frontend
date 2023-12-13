import { useStore, type CreateResponse, type Schedulable } from './async_store';
import type { BelongsToGame } from './game_store';

export type Player = BelongsToGame<number> &
	Schedulable & {
		game_id: string;
		name: string;
		images: string[];
	};

function playerBuilder(data: CreateResponse<number>): Player {
	return {
		id: data.id,
		game_id: data.game_id,
		name: data.name,
		images: data.images,
		createdAt: new Date(data.created_at),
		updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
	} as Player;
}

export function usePlayerStore(gameId:string) {
	return useStore<Player, number>(`games/${gameId}/players`, undefined, playerBuilder);
}
