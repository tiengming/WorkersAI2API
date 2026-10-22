/**
 * Small, dependency-free helpers shared by the Worker.
 */

export const VERSION = '2.0.0';

export function json(data, init = {}) {
	const headers = new Headers(init.headers || {});
	if (!headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json; charset=utf-8');
	}
	return new Response(JSON.stringify(data), { ...init, headers });
}

export function openAIError(message, {
	status = 400,
	type = 'invalid_request_error',
	code = null,
	param = null,
	extra = {},
} = {}) {
	return json({
		error: {
			message,
			type,
			param,
			code,
			...extra,
		},
	}, { status });
}

export class RequestError extends Error {
	constructor(message, { status = 400, type = 'invalid_request_error', code = null, param = null, extra = {}, headers = {} } = {}) {
		super(message);
		this.name = 'RequestError';
		this.status = status;
		this.type = type;
		this.code = code;
		this.param = param;
		this.extra = extra;
		this.headers = headers;
	}

	toResponse() {
		return json({
			error: { message: this.message, type: this.type, param: this.param, code: this.code, ...this.extra },
		}, { status: this.status, headers: this.headers });
	}
}

export function cors(response, request) {
	const origin = request?.headers?.get('Origin') || '*';
	const headers = new Headers(response.headers);
	headers.set('Access-Control-Allow-Origin', origin);
	headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
	headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-session-affinity, anthropic-version, anthropic-beta');
	headers.set('Access-Control-Expose-Headers', 'x-workers-ai-model, x-workers-ai-account, x-quota-remaining, x-quota-limit, x-request-id');
	headers.set('Vary', 'Origin');
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function preflight(request) {
	return cors(new Response(null, { status: 204 }), request);
}

export async function sha256Hex(value) {
	const data = new TextEncoder().encode(String(value));
	const digest = await crypto.subtle.digest('SHA-256', data);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomId(prefix = '') {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
	return prefix ? `${prefix}${hex}` : hex;
}

/** Compare two strings without an obvious timing side-channel. */
export function timingSafeEqual(a, b) {
	const left = new TextEncoder().encode(String(a ?? ''));
	const right = new TextEncoder().encode(String(b ?? ''));
	if (left.length !== right.length) return false;
	let diff = 0;
	for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
	return diff === 0;
}

export function bearerToken(request) {
	const header = request.headers.get('Authorization') || '';
	if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
	return null;
}

export function utcDay(date = new Date()) {
	return date.toISOString().slice(0, 10);
}

export function nextUtcMidnight(date = new Date()) {
	const next = new Date(date);
	next.setUTCHours(24, 0, 0, 0);
	return next.toISOString();
}

export function secondsUntilUtcMidnight(date = new Date()) {
	return Math.max(0, Math.floor((Date.parse(nextUtcMidnight(date)) - date.getTime()) / 1000));
}

export function clamp(number, min, max) {
	return Math.min(max, Math.max(min, number));
}

export function round(number, places = 2) {
	const factor = 10 ** places;
	return Math.round(number * factor) / factor;
}

export async function readJson(request) {
	try {
		return await request.json();
	} catch {
		return null;
	}
}

/**
 * Rough token estimate. Workers AI does not expose a tokenizer endpoint, so we
 * deliberately over-estimate: 3.6 chars/token for text plus 850 tokens/image.
 * Over-estimating is safe for quota reservations (it can only make us stricter).
 */
export function estimateTokens(value) {
	let chars = 0;
	let images = 0;

	const walk = (node) => {
		if (node == null) return;
		if (typeof node === 'string') {
			chars += node.length;
			return;
		}
		if (typeof node === 'number' || typeof node === 'boolean') {
			chars += String(node).length;
			return;
		}
		if (Array.isArray(node)) {
			for (const item of node) walk(item);
			return;
		}
		if (typeof node === 'object') {
			if (node.type === 'image_url' || node.type === 'image' || node.image_url || node.source?.type === 'base64') {
				images += 1;
			}
			for (const [key, item] of Object.entries(node)) {
				chars += key.length;
				walk(item);
			}
		}
	};

	walk(value);
	return Math.ceil(chars / 3.6) + images * 850;
}

export function truncate(value, length = 400) {
	const text = typeof value === 'string' ? value : JSON.stringify(value);
	if (!text) return '';
	return text.length > length ? `${text.slice(0, length)}…` : text;
}

export function isPlainObject(value) {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function parseJsonObject(value) {
	if (isPlainObject(value)) return value;
	if (typeof value !== 'string' || !value.trim()) return {};
	try {
		const parsed = JSON.parse(value);
		return isPlainObject(parsed) ? parsed : {};
	} catch {
		return {};
	}
}
