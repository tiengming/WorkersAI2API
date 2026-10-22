import { handleAdminApi } from './admin.js';
import { isAdmin, verifyApiKey } from './auth.js';
import { getSettings, updateConfig } from './config.js';
import { getCatalog, findModel, publicModel } from './catalog/index.js';
import { catalogResponse, resolveModel } from './proxy/models.js';
import { handleChat, handleResponses } from './proxy/chat.js';
import { handleEmbeddings } from './proxy/embeddings.js';
import { handleImages, handleRerank, handleRun } from './proxy/media.js';
import { handleSpeech, handleTranscription } from './proxy/audio.js';
import { AnthropicError, handleAnthropicCountTokens, handleAnthropicMessages } from './proxy/anthropic.js';
import { InferenceError } from './proxy/inference.js';
import { handleAdminPage, handleLandingPage } from './ui/pages.js';
import { handleDocsPage } from './ui/docs.js';
import {
	RequestError,
	cors,
	json,
	openAIError,
	preflight,
} from './utils.js';

const HTML_HEADERS = {
	'Content-Type': 'text/html; charset=utf-8',
	'Cache-Control': 'no-store',
	'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; base-uri 'none'; form-action 'self'",
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function setupResponse(request) {
	if (new URL(request.url).pathname.startsWith('/v1/')) {
		return json({
			error: {
				message: 'KV binding "KV" is missing. Create a KV namespace and bind it as KV before using the API.',
				type: 'configuration_error',
				code: 'kv_not_configured',
			},
		}, { status: 503 });
	}
	return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Setup required</title>
<style>body{font-family:ui-sans-serif,system-ui,sans-serif;max-width:720px;margin:10vh auto;padding:24px;line-height:1.6;background:#0b0d10;color:#e8eaed}code{background:#1b1f24;padding:2px 6px;border-radius:4px}</style></head>
<body><h1>KV binding missing</h1><p>Create a KV namespace and bind it as <code>KV</code>, then reload this page.</p>
<p>Workers: <code>wrangler kv namespace create KV</code> and put the id in <code>wrangler.jsonc</code>.<br>Pages: Settings → Bindings → KV namespace → variable name <code>KV</code>.</p></body></html>`, { status: 503, headers: HTML_HEADERS });
}

function apiUnauthorized(reason, anthropic = false) {
	const message = reason === 'no_keys'
		? 'No API keys exist and public access is disabled. Create a key in /admin, or set allowPublic=true.'
		: 'Incorrect or missing API key. Use Authorization: Bearer sk-wa-… or x-api-key.';
	if (anthropic) {
		return new AnthropicError(message, 401, 'authentication_error').toResponse();
	}
	return openAIError(message, { status: 401, code: 'invalid_api_key', type: 'authentication_error' });
}

async function touchKey(env, ctx, key) {
	if (!key?.hash) return;
	const last = key.lastUsedAt ? Date.parse(key.lastUsedAt) : 0;
	if (Date.now() - last < 10 * 60_000) return;
	ctx?.waitUntil?.(updateConfig(env, (config) => {
		const stored = config.apiKeys.find((item) => item.id === key.id);
		if (stored) stored.lastUsedAt = new Date().toISOString();
		return config;
	}).catch(() => {}));
}

async function previewJson(request) {
	try {
		return await request.clone().json();
	} catch {
		return null;
	}
}

async function previewForm(request) {
	try {
		return await request.clone().formData();
	} catch {
		return null;
	}
}

function openAIDefault(requested, catalog) {
	if (requested === 'whisper-1') {
		return catalog.models.find((model) => model.free && model.task === 'automatic-speech-recognition' && model.id.endsWith('/whisper'));
	}
	if (requested === 'tts-1' || requested === 'tts-1-hd') {
		return catalog.models.find((model) => model.free && model.task === 'text-to-speech' && model.id.includes('melotts'));
	}
	if (requested === 'dall-e-3' || requested === 'dall-e-2') {
		return catalog.models.find((model) => model.free && model.task === 'text-to-image' && model.id.endsWith('/flux-1-schnell'));
	}
	return null;
}

async function handleV1(request, env, ctx) {
	const url = new URL(request.url);
	const path = url.pathname;
	const anthropicEndpoint = path === '/v1/messages' || path === '/v1/messages/count_tokens';

	const auth = await verifyApiKey(request, env);
	if (!auth.ok) return apiUnauthorized(auth.reason, anthropicEndpoint);
	await touchKey(env, ctx, auth.key);

	if (path === '/v1/models' && request.method === 'GET') {
		const includePaid = url.searchParams.get('include_paid') === '1' && await isAdmin(request, env);
		const data = await catalogResponse(env, ctx, {
			includePaid,
			task: url.searchParams.get('task'),
			search: url.searchParams.get('search'),
			sort: url.searchParams.get('sort') || 'performance',
			limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : null,
		});
		return json(data, {
			headers: {
				'x-workers-ai-catalog-source': data.meta?.source || 'unknown',
				'Cache-Control': 'public, max-age=60',
			},
		});
	}

	if (path.startsWith('/v1/models/') && request.method === 'GET') {
		const requested = decodeURIComponent(path.slice('/v1/models/'.length));
		const catalog = await getCatalog(env, ctx);
		const model = findModel(catalog, requested);
		if (!model) throw new RequestError(`Model "${requested}" not found.`, { status: 404, code: 'model_not_found' });
		if (model.requires_paid && !(await isAdmin(request, env))) {
			throw new RequestError(`Model "${model.id}" requires a Workers Paid plan.`, { status: 403, code: 'model_requires_paid_plan' });
		}
		return json(publicModel(model));
	}

	const catalog = await getCatalog(env, ctx);
	const settings = await getSettings(env);
	const resolve = (name, options) => resolveModel(catalog, name, settings, options);

	if ((path === '/v1/chat/completions' || path === '/v1/completions') && request.method === 'POST') {
		const body = await previewJson(request);
		if (!body?.model) throw new RequestError('model is required', { status: 400, code: 'missing_model' });
		const model = resolve(body.model, { task: 'text-generation' });
		return handleChat(request, env, ctx, model, { legacyCompletions: path === '/v1/completions' });
	}

	if (path === '/v1/responses' && request.method === 'POST') {
		const body = await previewJson(request);
		if (!body?.model) throw new RequestError('model is required', { status: 400, code: 'missing_model' });
		const model = resolve(body.model, { task: 'text-generation' });
		return handleResponses(request, env, ctx, model);
	}

	if (path === '/v1/embeddings' && request.method === 'POST') {
		const body = await previewJson(request);
		if (!body?.model) throw new RequestError('model is required', { status: 400, code: 'missing_model' });
		const model = resolve(body.model, { task: 'text-embeddings' });
		return handleEmbeddings(request, env, ctx, model);
	}

	if (path === '/v1/images/generations' && request.method === 'POST') {
		const body = await previewJson(request);
		if (!body?.model) throw new RequestError('model is required', { status: 400, code: 'missing_model' });
		const model = openAIDefault(body.model, catalog) || resolve(body.model, { task: 'text-to-image' });
		return handleImages(request, env, ctx, model);
	}

	if (path === '/v1/audio/transcriptions' && request.method === 'POST') {
		const form = await previewForm(request);
		const requested = String(form?.get('model') || 'whisper-1');
		const model = openAIDefault(requested, catalog) || resolve(requested, { task: 'automatic-speech-recognition' });
		return handleTranscription(request, env, ctx, model);
	}

	if (path === '/v1/audio/speech' && request.method === 'POST') {
		const body = await previewJson(request);
		if (!body?.model) throw new RequestError('model is required', { status: 400, code: 'missing_model' });
		const model = openAIDefault(body.model, catalog) || resolve(body.model, { task: 'text-to-speech' });
		return handleSpeech(request, env, ctx, model);
	}

	if (path === '/v1/rerank' && request.method === 'POST') {
		const body = await previewJson(request);
		if (!body?.model) throw new RequestError('model is required', { status: 400, code: 'missing_model' });
		const model = resolve(body.model, { task: 'text-classification' });
		return handleRerank(request, env, ctx, model);
	}

	if (path === '/v1/run' && request.method === 'POST') {
		const body = await previewJson(request);
		if (!body?.model) throw new RequestError('model is required', { status: 400, code: 'missing_model' });
		const model = resolve(body.model);
		return handleRun(request, env, ctx, model);
	}

	if (path === '/v1/messages' && request.method === 'POST') {
		const body = await previewJson(request);
		if (!body?.model) throw new AnthropicError('model is required.', 400, 'invalid_request_error');
		const model = resolve(body.model, { task: 'text-generation' });
		return handleAnthropicMessages(request, env, ctx, model);
	}

	if (path === '/v1/messages/count_tokens' && request.method === 'POST') {
		const body = await previewJson(request);
		if (!body?.model) throw new AnthropicError('model is required.', 400, 'invalid_request_error');
		const model = resolve(body.model, { task: 'text-generation' });
		return handleAnthropicCountTokens(request, env, ctx, model);
	}

	throw new RequestError(`Unknown endpoint: ${request.method} ${path}`, { status: 404, code: 'not_found' });
}

function errorResponse(error, request) {
	const path = new URL(request.url).pathname;
	if (path === '/v1/messages' || path === '/v1/messages/count_tokens') {
		if (error instanceof InferenceError) {
			return new AnthropicError(error.message, error.status, error.status === 401 ? 'authentication_error' : 'api_error').toResponse();
		}
		if (error instanceof RequestError) {
			return new AnthropicError(error.message, error.status, error.status === 404 ? 'not_found_error' : 'invalid_request_error').toResponse();
		}
	}
	if (typeof error?.toResponse === 'function') return error.toResponse();
	console.error('Unhandled error', error);
	return openAIError('Internal server error', { status: 500, code: 'internal_error', type: 'server_error' });
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		if (request.method === 'OPTIONS') return preflight(request);

		try {
			if (url.pathname === '/robots.txt') {
				return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
			}

			if (url.pathname === '/favicon.ico' || url.pathname === '/favicon.svg') {
				const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#f6821f"/><path d="M16 40h32M16 24h32M24 16l-8 8 8 8M40 32l8 8-8 8" stroke="#0b0d10" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
				return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' } });
			}

			if (!env.KV) return setupResponse(request);

			if (url.pathname.startsWith('/api/')) {
				return cors(await handleAdminApi(request, env, ctx), request);
			}

			if (url.pathname.startsWith('/v1/')) {
				return cors(await handleV1(request, env, ctx), request);
			}

			if (url.pathname === '/') {
				return new Response(await handleLandingPage(request, env, ctx), { headers: HTML_HEADERS });
			}

			if (url.pathname === '/admin' || url.pathname === '/admin/') {
				return new Response(await handleAdminPage(request, env, ctx), { headers: HTML_HEADERS });
			}

			if (url.pathname.startsWith('/docs/')) {
				const page = handleDocsPage(url.pathname.slice('/docs/'.length).replace(/\/$/, ''));
				if (page) return new Response(page, { headers: HTML_HEADERS });
			}

			return new Response('404 Not Found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
		} catch (error) {
			return cors(errorResponse(error, request), request);
		}
	},
};

export { QuotaGuard } from './quota-do.js';
