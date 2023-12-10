import { PUBLIC_API_URL } from "$env/static/public";
import { doFetch } from "$lib/store/async_store";

export function play(gameId:string, action: string, body?: Record<string, any>) {
  const init: RequestInit = { method:'POST' };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = {
      'Content-Type': 'application/json'
    };
  }
  const q = new URLSearchParams({action}).toString();
  return doFetch(`${PUBLIC_API_URL}/play/${gameId}?${q}`, init);
}

export const startGame = (gameId:string) => play(gameId, 'start');
export const resetGame = (gameId:string) => play(gameId, 'reset');
export const roll = (gameId:string) => play(gameId, 'roll');
export const pick = (gameId:string,presentId:string) => play(gameId, 'pick', {present_id:presentId});
export const keep = (gameId:string) => play(gameId, 'keep');
export const steal = (gameId:string,presentId:string) => play(gameId, 'steal', {present_id:presentId});

