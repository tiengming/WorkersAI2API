import { getConfig } from './config.js';
import { bearerToken, sha256Hex, timingSafeEqual } from './utils.js';

export function hasAdminPassword(env) {
	return Boolean(env.ADMIN_PASSWORD && String(env.ADMIN_PASSWORD).trim());
}

export async function adminToken(env) {
	return sha256Hex(String(env.ADMIN_PASSWORD).trim());
}

export async function isAdmin(request, env) {
	if (!hasAdminPassword(env)) return false;

	const cookie = request.headers.get('Cookie') || '';
	const match = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
	const token = match ? decodeURIComponent(match[1]) : bearerToken(request);
	if (!token) return false;

	return timingSafeEqual(token, await adminToken(env));
}

export function adminCookie(token, { clear = false, secure = true } = {}) {
	const parts = [
		`admin_token=${clear ? '' : token}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Strict',
		`Max-Age=${clear ? 0 : 86_400}`,
	];
	if (secure) parts.push('Secure');
	return parts.join('; ');
}

/**
 * Returns `{ ok, key }` or `{ ok: false, reason }`.
 * Keys are stored as SHA-256 hashes; plaintext is shown only once at creation.
 */
export async function verifyApiKey(request, env) {
	const config = await getConfig(env);
	const enabled = config.apiKeys.filter((key) => key.enabled !== false);

	if (enabled.length === 0) {
		if (config.settings.allowPublic) return { ok: true, key: null, public: true };
		return { ok: false, reason: 'no_keys' };
	}

	const provided = request.headers.get('x-api-key') || bearerToken(request);
	if (!provided) return { ok: false, reason: 'missing' };

	const hash = await sha256Hex(provided);
	const key = enabled.find((item) => item.hash && timingSafeEqual(item.hash, hash));
	if (!key) return { ok: false, reason: 'invalid' };
	return { ok: true, key, public: false };
}
