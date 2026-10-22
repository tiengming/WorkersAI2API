import { estimateTokens, utcDay, clamp } from './utils.js';

export const NEURONS_PER_USD = 1_000_000 / 11; // $0.011 per 1,000 neurons
export const FALLBACK_INPUT_NEURONS_PER_MILLION = 50_000;
export const FALLBACK_OUTPUT_NEURONS_PER_MILLION = 150_000;

export function dailyLimit(settings, env) {
	const configured = Number(settings?.dailyNeurons) || Number(env?.FREE_DAILY_NEURONS) || 10_000;
	return Math.max(0, configured);
}

function tokenRates(model) {
	const tokens = model?.pricing?.tokens || {};
	return {
		input: Number(tokens.input_neurons_per_million) || FALLBACK_INPUT_NEURONS_PER_MILLION,
		output: Number(tokens.output_neurons_per_million) || FALLBACK_OUTPUT_NEURONS_PER_MILLION,
		cached: Number(tokens.cached_input_neurons_per_million) || null,
	};
}

function costForTokens(tokens, rates) {
	return Math.max(1, Math.ceil(
		(tokens.input / 1_000_000) * rates.input
		+ (tokens.cached / 1_000_000) * (rates.cached || rates.input)
		+ (tokens.output / 1_000_000) * rates.output,
	));
}

export function estimateChatNeurons(model, body, settings) {
	const rates = tokenRates(model);
	const promptTokens = estimateTokens(body?.messages || body?.prompt || '') + estimateTokens(body?.tools || null);
	const requested = Number(body?.max_tokens ?? body?.max_completion_tokens);
	const fallbackOutput = Math.min(
		Number(settings?.defaultMaxOutputTokens) || 1024,
		Number(model?.max_output_tokens) || 1024,
	);
	const outputTokens = Number.isFinite(requested) && requested > 0 ? requested : fallbackOutput;
	return costForTokens({ input: promptTokens, cached: 0, output: outputTokens }, rates);
}

export function estimateEmbeddingNeurons(model, body) {
	const rates = tokenRates(model);
	const tokens = estimateTokens(body?.input || '');
	return costForTokens({ input: tokens, cached: 0, output: 0 }, rates);
}

export function estimateImageNeurons(model, body) {
	const items = model?.pricing?.items || [];
	const steps = Math.max(1, Number(body?.steps) || 4);
	const perStep = items.find((item) => item.kind === 'step')?.neurons || 0;
	const perTile = items.find((item) => item.kind === 'image_tile')?.neurons
		|| items.find((item) => item.kind === 'image')?.neurons
		|| 0;
	const estimate = perStep * steps + perTile;
	return Math.max(1, Math.ceil(estimate || 1_000));
}

export function estimateSpeechNeurons(model, body) {
	const items = model?.pricing?.items || [];
	const chars = String(body?.input || body?.prompt || '').length;
	const perKChar = items.find((item) => item.kind === 'character')?.neurons;
	const perMinute = items.find((item) => item.kind === 'audio_minute')?.neurons;
	if (perKChar) return Math.max(1, Math.ceil((chars / 1000) * perKChar));
	if (perMinute) return Math.max(1, Math.ceil(perMinute));
	return 1_000;
}

export function estimateTranscriptionNeurons(model) {
	const perMinute = (model?.pricing?.items || []).find((item) => item.kind === 'audio_minute')?.neurons;
	return Math.max(1, Math.ceil(perMinute || 1_000));
}

export function estimateNeuronsForTask(model, task, body, settings) {
	switch (task) {
		case 'chat':
			return estimateChatNeurons(model, body, settings);
		case 'embeddings':
			return estimateEmbeddingNeurons(model, body);
		case 'image':
			return estimateImageNeurons(model, body);
		case 'speech':
			return estimateSpeechNeurons(model, body);
		case 'transcription':
			return estimateTranscriptionNeurons(model);
		default: {
			// Native / generic tasks have no usage report, so reserve from the
			// input size at the model's token rate with a conservative floor.
			const rates = tokenRates(model);
			const inputTokens = estimateTokens(body);
			return Math.max(1_000, costForTokens({ input: inputTokens, cached: 0, output: 0 }, rates));
		}
	}
}

export function actualChatNeurons(model, usage) {
	if (!usage) return null;
	const rates = tokenRates(model);
	const prompt = Number(usage.prompt_tokens ?? usage.input_tokens ?? 0);
	const completion = Number(usage.completion_tokens ?? usage.output_tokens ?? 0);
	if (!prompt && !completion) return null;
	const cached = Number(
		usage.prompt_tokens_details?.cached_tokens
		?? usage.input_tokens_details?.cached_tokens
		?? usage.cached_tokens
		?? 0,
	);
	return costForTokens({
		input: Math.max(0, prompt - cached),
		cached: Math.max(0, cached),
		output: completion,
	}, rates);
}

export function estimateTokensFromText(text) {
	if (!text) return 0;
	return Math.ceil(String(text).length / 3.6);
}

// ---------------------------------------------------------------------------
// Durable Object / KV transport
// ---------------------------------------------------------------------------

function quotaStub(env, accountId, day) {
	if (!env.QUOTA) return null;
	const id = env.QUOTA.idFromName(`${accountId}:${day}`);
	return env.QUOTA.get(id);
}

async function callBackend(env, accountId, day, action, payload) {
	const stub = quotaStub(env, accountId, day);
	if (stub) {
		const response = await stub.fetch(`https://quota.internal/${action}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ day, ...payload }),
		});
		return response.json();
	}
	return kvBackend(env, accountId, day, action, payload);
}

async function kvBackend(env, accountId, day, action, payload) {
	const key = `quota:${accountId}:${day}`;
	const limit = Math.max(0, Number(payload.limit) || 0);
	let record = { used: 0, reserved: 0 };
	try {
		record = (await env.KV.get(key, 'json')) || record;
	} catch {
		record = { used: 0, reserved: 0 };
	}
	const remaining = () => Math.max(0, limit - record.used - record.reserved);

	switch (action) {
		case 'reserve': {
			const amount = Math.max(0, Math.ceil(Number(payload.amount) || 0));
			if (record.used + record.reserved + amount > limit) {
				return { ok: false, used: record.used, reserved: record.reserved, remaining: remaining(), limit };
			}
			record.reserved += amount;
			break;
		}
		case 'settle': {
			record.reserved = Math.max(0, record.reserved - Math.max(0, Math.ceil(Number(payload.reserved) || 0)));
			record.used += Math.max(0, Math.ceil(Number(payload.actual) || 0));
			break;
		}
		case 'reconcile': {
			record.used = Math.max(record.used, Math.max(0, Math.ceil(Number(payload.used) || 0)));
			break;
		}
		case 'exhaust': {
			record.used = limit;
			record.reserved = 0;
			break;
		}
		case 'status':
			break;
		default:
			return { ok: false, error: 'not found' };
	}

	record.updatedAt = Date.now();
	await env.KV.put(key, JSON.stringify(record), { expirationTtl: 172_800 });
	return {
		ok: true,
		used: record.used,
		reserved: record.reserved,
		remaining: remaining(),
		limit,
	};
}

export async function reserveQuota(env, accountId, amount, limit, day = utcDay()) {
	try {
		return await callBackend(env, accountId, day, 'reserve', { amount, limit });
	} catch (error) {
		// Fail closed: if accounting is unavailable we do not spend quota blindly.
		return { ok: false, error: `Quota backend unavailable: ${error.message}`, remaining: 0, limit };
	}
}

export async function settleQuota(env, accountId, reserved, actual, limit, day = utcDay()) {
	try {
		return await callBackend(env, accountId, day, 'settle', { reserved, actual, limit });
	} catch {
		return { ok: false };
	}
}

export async function reconcileQuota(env, accountId, used, limit, day = utcDay()) {
	try {
		return await callBackend(env, accountId, day, 'reconcile', { used, limit });
	} catch {
		return { ok: false };
	}
}

export async function exhaustQuota(env, accountId, limit, day = utcDay()) {
	try {
		return await callBackend(env, accountId, day, 'exhaust', { limit });
	} catch {
		return { ok: false };
	}
}

export async function quotaStatus(env, accountId, limit, day = utcDay()) {
	try {
		return await callBackend(env, accountId, day, 'status', { limit });
	} catch (error) {
		return { ok: false, error: error.message, used: 0, remaining: 0, limit };
	}
}

export function quotaMode(env) {
	return env.QUOTA ? 'durable-object' : 'kv';
}

export { clamp };
