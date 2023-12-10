const algo = {
	name: 'RSASSA-PKCS1-v1_5',
	hash: { name: 'SHA-256' }
};

let googlePublicKeys: GooglePublicKey[];

async function fetchPublicKey(): Promise<GooglePublicKey[]> {
	if (!googlePublicKeys) {
		const res = await fetch(
			'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
		);
		if (res.ok) {
			const data = await res.json<GooglePublicKeysResult>();
			googlePublicKeys = data.keys;
		}
	}
	return googlePublicKeys;
}

fetchPublicKey();

export type CustomClaims = {
	games: Record<string, number>;
};

type GooglePublicKeysResult = {
	keys: GooglePublicKey[];
};

type GooglePublicKey = {
	kty: string;
	use: string;
	e: string;
	alg: string;
	kid: string;
	n: string;
};

export interface JwkCertificate {
	kty: string;
	alg: string;
	use?: string;
	kid: string;
	n: string;
	e: string;
}

interface JsonWebKey {
	alg?: string;
	crv?: string;
	d?: string;
	dp?: string;
	dq?: string;
	e?: string;
	ext?: boolean;
	k?: string;
	key_ops?: string[];
	kty?: string;
	n?: string;
	oth?: RsaOtherPrimesInfo[];
	p?: string;
	q?: string;
	qi?: string;
	use?: string;
	x?: string;
	y?: string;
}

export type JsonWebToken = {
	header: {
		alg: string;
		kid: string;
		typ: string;
	};
	payload: CustomClaims & {
		iss: string;
		aud: string;
		auth_time: number;
		user_id: string;
		sub: string;
		iat: number;
		exp: number;
		email: string;
		email_verified: boolean;
		firebase: {
			identities: {
				email: string[];
			};
			sign_in_provider: string;
		};
	};
	signature: string;
	raw: {
		header: string;
		payload: string;
		signature: string;
	};
};

/**
 * Parse the JWT and validate it.
 *
 * We are just checking that the signature is valid, but you can do more that.
 * For example, check that the payload has the expected entries or if the signature is expired..
 */
export async function isValidJwt(token: JsonWebToken) {
	// Is the token expired?
	let expiryDate = new Date(token.payload.exp * 1000);
	let currentDate = new Date(Date.now());
	if (expiryDate <= currentDate) {
		console.log('expired token');
		return false;
	}

	return isValidJwtSignature(token);
}

/**
 * Parse and decode a JWT.
 * A JWT is three, base64 encoded, strings concatenated with ‘.’:
 *   a header, a payload, and the signature.
 * The signature is “URL safe”, in that ‘/+’ characters have been replaced by ‘_-’
 *
 * Steps:
 * 1. Split the token at the ‘.’ character
 * 2. Base64 decode the individual parts
 * 3. Retain the raw Bas64 encoded strings to verify the signature
 */
export function decodeJwt(token: string): JsonWebToken {
	const parts = token.split('.');
	const header = JSON.parse(atob(parts[0]));
	const payload = JSON.parse(atob(parts[1]));
	const signature = atob(parts[2].replace(/_/g, '/').replace(/-/g, '+'));
	return {
		header: header,
		payload: {
			...payload,
			games: payload.w || {}
		},
		signature: signature,
		raw: { header: parts[0], payload: parts[1], signature: parts[2] }
	};
}

/**
 * Validate the JWT.
 *
 * Steps:
 * Reconstruct the signed message from the Base64 encoded strings.
 * Load the RSA public key into the crypto library.
 * Verify the signature with the message and the key.
 */
async function isValidJwtSignature(token: JsonWebToken) {
	const encoder = new TextEncoder();
	const data = encoder.encode([token.raw.header, token.raw.payload].join('.'));
	const signature = new Uint8Array(Array.from(token.signature).map((c) => c.charCodeAt(0)));
	const pubKeys = await fetchPublicKey();
	const pubkey = pubKeys.find((key) => key.kid === token.header.kid)!;
	const key = await crypto.subtle.importKey('jwk', pubkey, algo, true, ['verify']);
	return crypto.subtle.verify(algo, key, signature, data);
}

export async function hasGameClaim(jwt: JsonWebToken, gameId: string): Promise<boolean> {
	return (await isValidJwt(jwt)) && jwt.payload.games[gameId] > 0;
}
