import { getActiveAccounts, getSettings } from '../config.js';
import { estimateNeuronsForTask, reserveQuota, settleQuota, exhaustQuota, actualChatNeurons, estimateTokensFromText } from '../quota.js';
import { json, openAIError, estimateTokens, utcDay } from '../utils.js';

export class InferenceError extends Error {
	constructor(message, { status = 502, code = 'upstream_error', headers = {}, extra = {} } = {}) {
		super(message);
		this.name = 'InferenceError';
		this.status = status;
		this.code = code;
		this.headers = headers;
		this.extra = extra;
	}

	toResponse() {
		return openAIError(this.message, {
			status: this.status,
			type: this.status === 429 ? 'insufficient_quota' : 'upstream_error',
			code: this.code,
			extra: this.extra,
		});
	}
}

function shuffle(items) {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

export function upstreamPath(task, model, endpoint = 'openai') {
	if (endpoint === 'responses') return '/ai/v1/responses';
	if (endpoint === 'native' || !model.openai_compatible) return `/ai/run/${model.id}`;
	if (task === 'embeddings') return '/ai/v1/embeddings';
	return '/ai/v1/chat/completions';
}

function parseCloudflareError(text) {
	let data = null;
	try {
		data = JSON.parse(text);
	} catch {
		// HTML/proxy errors
	}
	const code = data?.errors?.[0]?.code ?? data?.error?.code ?? null;
	const message = data?.errors?.[0]?.message
		|| data?.error?.message
		|| data?.message
		|| String(text || '').slice(0, 500)
		|| 'Unknown upstream error';
	return { code, message, data };
}

function classifyError(status, parsed) {
	const code = Number(parsed.code);
	if (code === 3036 || /daily free allocation/i.test(parsed.message)) {
		return { retry: true, exhaust: true, status: 429, code: 'insufficient_quota', message: 'The daily free allocation of 10,000 neurons is exhausted for this account. It resets at 00:00 UTC.' };
	}
	if (code === 5035 || /requires a workers paid plan/i.test(parsed.message)) {
		return { retry: true, status: 403, code: 'model_requires_paid_plan', message: 'This model requires a Workers Paid plan or AI Gateway prepaid credits and is excluded from the free catalog.' };
	}
	if (code === 3040 || /capacity temporarily exceeded/i.test(parsed.message)) {
		return { retry: true, status: 429, code: 'capacity_exceeded', message: 'Workers AI capacity is temporarily exceeded. Please retry.' };
	}
	if (code === 5007 || code === 3042 || status === 404) {
		return { retry: false, status: 404, code: 'model_not_found', message: parsed.message };
	}
	if (status === 413 || code === 3006) {
		return { retry: false, status: 413, code: 'request_too_large', message: parsed.message };
	}
	if (status === 400 || status === 422) {
		return { retry: false, status: 400, code: 'invalid_request', message: parsed.message };
	}
	if (status === 401 || status === 403) {
		return { retry: true, status: 403, code: 'account_forbidden', message: parsed.message };
	}
	if (status === 429) {
		return { retry: true, status: 429, code: 'rate_limited', message: parsed.message };
	}
	return { retry: status >= 500, status: 502, code: 'upstream_error', message: parsed.message };
}

/**
 * Calls Workers AI with per-account free-quota reservations and failover.
 * The caller must call `result.settle(actual, usage)` once the body is consumed.
 */
export async function runInference(request, env, ctx, {
	model,
	task,
	body,
	stream = false,
	endpoint = 'openai',
	rawBody = null,
	contentType = 'application/json',
}) {
	const settings = await getSettings(env);
	const accounts = shuffle(await getActiveAccounts(env));
	if (accounts.length === 0) {
		throw new InferenceError('No active Cloudflare account configured. Add one in the admin panel.', {
			status: 503,
			code: 'no_accounts',
		});
	}

	const limit = Number(settings.dailyNeurons) || 10_000;
	const estimate = estimateNeuronsForTask(model, task, body, settings);
	const promptTokens = estimateTokens(body?.messages || body?.input || body?.prompt || '');
	const path = upstreamPath(task, model, endpoint);

	if (estimate > limit) {
		throw new InferenceError(
			`This request needs an estimated ${estimate.toLocaleString()} neurons, which is more than the entire daily free allowance (${limit.toLocaleString()}). Reduce the prompt or max_tokens.`,
			{ status: 429, code: 'insufficient_quota', extra: { estimated_neurons: estimate, daily_limit: limit } },
		);
	}

	const exhausted = [];
	let lastError = null;

	for (const account of accounts) {
		const reservation = await reserveQuota(env, account.id, estimate, limit);
		if (!reservation.ok) {
			exhausted.push({
				account: account.name,
				remaining: reservation.remaining ?? 0,
				used: reservation.used ?? 0,
				limit,
			});
			continue;
		}

		let settled = false;
		const settle = async (actual, usage = null) => {
			if (settled) return null;
			settled = true;
			const value = Math.max(0, Math.ceil(Number(actual) || 0));
			const status = await settleQuota(env, account.id, estimate, value, limit);
			if (usage) {
				status.usage = usage;
			}
			return status;
		};

		const headers = new Headers({
			Authorization: `Bearer ${account.apiToken}`,
			'Content-Type': contentType,
			Accept: stream ? 'text/event-stream' : 'application/json',
		});
		if (settings.gatewayId) headers.set('cf-aig-gateway-id', String(settings.gatewayId));
		if (settings.gatewaySkipCache) headers.set('cf-aig-skip-cache', 'true');
		const affinity = request.headers.get('x-session-affinity');
		if (affinity) headers.set('x-session-affinity', affinity);
		for (const name of ['cf-aig-cache-ttl', 'cf-aig-cache-key', 'cf-aig-skip-cache']) {
			const value = request.headers.get(name);
			if (value && settings.gatewayId) headers.set(name, value);
		}

		let response;
		try {
			response = await fetch(
				`https://api.cloudflare.com/client/v4/accounts/${account.accountId}${path}`,
				{
					method: 'POST',
					headers,
					body: rawBody ?? JSON.stringify(body),
				},
			);
		} catch (error) {
			await settle(0);
			lastError = new InferenceError(`Connection to Cloudflare failed: ${error.message}`, { status: 502 });
			continue;
		}

		if (response.ok) {
			return {
				response,
				account,
				model,
				estimate,
				limit,
				promptTokens,
				settle,
			};
		}

		const text = await response.text();
		const parsed = parseCloudflareError(text);
		const decision = classifyError(response.status, parsed);
		await settle(0);
		if (decision.exhaust) await exhaustQuota(env, account.id, limit);

		lastError = new InferenceError(decision.message, {
			status: decision.status,
			code: decision.code,
			extra: { upstream_code: parsed.code, account: account.name },
		});

		if (!decision.retry) throw lastError;
	}

	if (exhausted.length > 0 && exhausted.length === accounts.length) {
		throw new InferenceError(
			`All ${accounts.length} Cloudflare account(s) have used their daily free allocation of ${limit.toLocaleString()} neurons. Resets at 00:00 UTC.`,
			{
				status: 429,
				code: 'insufficient_quota',
				extra: { accounts: exhausted, daily_limit: limit },
			},
		);
	}

	throw lastError || new InferenceError('All Cloudflare accounts failed', { status: 502 });
}

export async function settleFromJson(result, dataExceptUsage) {
	const usage = dataExceptUsage?.usage || dataExceptUsage?.result?.usage || null;
	const actual = actualChatNeurons(result.model, usage);
	const status = await result.settle(actual ?? result.estimate, usage);
	return { actual: actual ?? result.estimate, status };
}

export function settleFromText(result, text) {
	const actual = estimateTokensFromText(text);
	return result.settle(Math.max(1, Math.ceil((result.promptTokens || 0) / 1e6 * 50_000 + actual / 1e6 * 150_000)), null);
}

export function inferenceHeaders(result, extra = {}) {
	const headers = new Headers(extra);
	headers.set('x-workers-ai-model', result.model.id);
	headers.set('x-workers-ai-account', result.account.name);
	headers.set('x-quota-limit', String(result.limit));
	return headers;
}

/**
 * Wrap an SSE stream, observe usage/content, and settle quota at the end.
 */
export function instrumentStream(result, { requestedModel, extraHeaders = {} } = {}) {
	const decoder = new TextDecoder();
	let buffer = '';
	let text = '';
	let usage = null;

	const transform = new TransformStream({
		transform(chunk, controller) {
			controller.enqueue(chunk);
			buffer += decoder.decode(chunk, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed.startsWith('data:')) continue;
				const payload = trimmed.slice(5).trim();
				if (!payload || payload === '[DONE]') continue;
				try {
					const parsed = JSON.parse(payload);
					if (parsed.usage) usage = parsed.usage;
					const delta = parsed.choices?.[0]?.delta?.content;
					if (typeof delta === 'string') text += delta;
					if (typeof parsed.choices?.[0]?.text === 'string') text += parsed.choices[0].text;
					if (parsed.model) parsed.model = requestedModel || parsed.model;
				} catch {
					// keep original bytes untouched; only bookkeeping failed
				}
			}
		},
		async flush() {
			const actual = actualChatNeurons(result.model, usage) ?? Math.max(
				1,
				Math.ceil(((result.promptTokens || 0) / 1e6) * 50_000 + (estimateTokensFromText(text) / 1e6) * 150_000),
			);
			await result.settle(actual, usage);
		},
	});

	const headers = inferenceHeaders(result, {
		'Content-Type': 'text/event-stream; charset=utf-8',
		'Cache-Control': 'no-cache, no-transform',
		Connection: 'keep-alive',
		...extraHeaders,
	});

	return new Response(result.response.body.pipeThrough(transform), { status: 200, headers });
}

export { utcDay, json };
