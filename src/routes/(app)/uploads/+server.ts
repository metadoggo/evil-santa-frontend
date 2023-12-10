import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { decodeJwt, hasGameClaim, isValidJwt } from '$lib/util/auth';
import { uploadFile } from '$lib/util/upload';
import { PUBLIC_MEDIA_URL_PREFIX } from '$env/static/public';
import type { UploadPurpose } from '$lib/form/upload_form.svelte';

export const POST: RequestHandler = async ({ request, url, locals }) => {
	const bucket = locals.FILE_BUCKET;
	if (!bucket) {
		throw error(500, {
			message:
				'Must run in cloudflare workers environment. Run the wrangler-proxy locally: wrangler dev node_modules/wrangler-proxy/dist/worker.js --remote'
		});
	}

	const authorization = request.headers.get('Authorization');
	if (!authorization || authorization.length < 7) {
		throw error(401);
	}

	const token = decodeJwt(authorization.slice(7));
	if (!token) {
		throw error(401);
	}

	if (!isValidJwt(token)) {
		throw error(401);
	}

	const purpose = url.searchParams.get('purpose') as UploadPurpose;
	const form = await request.formData();
	let gameId = form.get('game_id');
	let playerId = form.get('player_id');
	let presentId = form.get('present_id');
	let path: string = '';
	switch (purpose) {
		case 'profile':
			path = `u/${token.payload.sub}.`;
			break;
		case 'game':
			gameId = form.get('game_id');
			if (!gameId) {
				throw error(400, 'Missing game id');
			}
			if (!hasGameClaim(token, gameId.toString())) {
				throw error(403);
			}
			path = `g/${gameId}`;
			break;
		case 'player':
			gameId = form.get('game_id');
			if (!gameId) {
				throw error(400, 'Missing game id');
			}
			if (!hasGameClaim(token, gameId.toString())) {
				throw error(403);
			}
			playerId = form.get('player_id');
			if (!playerId) {
				throw error(400, 'Missing player id');
			}
			path = `g/${gameId}/${playerId}`;
			break;
		case 'present-wrapped':
		case 'present-unwrapped':
			gameId = form.get('game_id');
			if (!gameId) {
				throw error(400, 'Missing game id');
			}
			if (!hasGameClaim(token, gameId.toString())) {
				throw error(403);
			}
			presentId = form.get('present_id');
			if (!presentId) {
				throw error(400, 'Missing present id');
			}
			path = `g/${gameId}/${presentId}/${purpose==='present-wrapped'?'w':'u'}`;
			break;
		default:
			throw error(400, 'Missing purpose');
	}

	const files = form.getAll('files') as File[];
	if (!files || !files.length) {
		throw error(400, {
			message: 'No file data '
		});
	}
	const images: string[] = [];
	const prefix = new Date().getTime().toString(36);
	for (let i = 0; i < files.length; i++) {
		const file = files[i];

		if (!file.name) {
			throw error(400, {
				message: 'No content received'
			});
		}

		const filename = await uploadFile(locals.FILE_BUCKET, path, file, `${prefix}${i.toString(36)}`);
		if (filename) {
			images.push(`${PUBLIC_MEDIA_URL_PREFIX}/${path}/${filename}`);
		}
	}

	return new Response(JSON.stringify(images));
};
