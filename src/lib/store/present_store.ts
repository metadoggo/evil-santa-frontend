import { useStore, type CreateResponse, type Schedulable } from './async_store';
import type { BelongsToGame } from './game_store';

export type Present = BelongsToGame<number> &
	Schedulable & {
		game_id: string;
		name: string;
		player_id?: number;
		wrapped_images: string[];
		unwrapped_images: string[];
	};

function presentBuilder(data: CreateResponse<number>): Present {
	return {
		id: data.id,
		game_id: data.game_id,
		name: data.name,
		player_id: data.player_id,
		wrapped_images: data.wrapped_images,
		unwrapped_images: data.unwrapped_images,
		createdAt: new Date(data.created_at),
		updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
	} as Present;
}

export function usePresentStore(gameId:string) {
	return useStore<Present, number>(`games/${gameId}/presents`, undefined, presentBuilder);
}
