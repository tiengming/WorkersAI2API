import { env, runInDurableObject, SELF } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ACCOUNT,
	API_KEY,
	BASE_MODEL,
	adminCookie,
	authHeaders,
	makeModel,
	seedCatalog,
	seedConfig,
} from './fixtures.js';
import { resetConfigCache } from '../src/config.js';
import { quotaStatus } from '../src/quota.js';
import { utcDay } from '../src/utils.js';

const ORIGIN = 'https://gateway.test';

function url(path) {
	return `${ORIGIN}${path}`;
}

function post(path, body, headers = authHeaders()) {
	return SELF.fetch(url(path), {
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	});
}

function chatBody(model = BASE_MODEL.id, extra = {}) {
	return {
		model,
		messages: [{ role: 'user', content: 'hello' }],
		...extra,
	};
}

function upstreamChat(usage = { prompt_tokens: 100, completion_tokens: 50 }) {
	return {
		id: 'chatcmpl-test',
		object: 'chat.completion',
		created: 1,
		model: BASE_MODEL.id,
		choices: [{
			index: 0,
			message: { role: 'assistant', content: 'hi there' },
			finish_reason: 'stop',
		}],
		usage: { ...usage, total_tokens: (usage.prompt_tokens || 0) + (usage.completion_tokens || 0) },
	};
}

function mockFetch(handler) {
	const fn = vi.fn(handler);
	vi.stubGlobal('fetch', fn);
	return fn;
}

function upstreamJson(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

function catalogWithPaid() {
	const free = makeModel({
		...BASE_MODEL,
		name: 'Test Chat 120B',
		description: 'Large reasoning model with tool calling and 120B parameters.',
		context_window: 128_000,
	});
	const small = makeModel({
		...BASE_MODEL,
		id: '@cf/test/chat-7b',
		name: 'Test Chat 7B',
		description: 'Small text generation model.',
		context_window: 8_000,
		properties: {},
	});
	const paid = makeModel({
		...BASE_MODEL,
		id: '@cf/test/chat-paid',
		name: 'Test Paid',
	});
	paid.requires_paid = true;
	paid.free = false;
	return [free, small, paid];
}

beforeEach(async () => {
	// Quota state lives in a Durable Object, which per-test isolated storage does
	// not clear, so reset the instance used by these tests explicitly.
	const stub = env.QUOTA.get(env.QUOTA.idFromName(`${ACCOUNT.id}:${utcDay()}`));
	await runInDurableObject(stub, async (_instance, state) => {
		await state.storage.deleteAll();
	});
	await seedConfig();
	await seedCatalog(catalogWithPaid());
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('public endpoints', () => {
	it('reports health without authentication', async () => {
		const response = await SELF.fetch(url('/api/health'));
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toMatchObject({
			ok: true,
			version: '2.0.0',
			configured: true,
			kv: true,
			quota: 'durable-object',
			daily_neurons: 10_000,
		});
	});

	it('serves the landing page', async () => {
		const response = await SELF.fetch(url('/'));
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/html');
		expect(await response.text()).toContain('Workers AI2API');
	});

	it('rejects unauthenticated API requests when keys exist', async () => {
		const response = await SELF.fetch(url('/v1/models'));
		expect(response.status).toBe(401);
		const data = await response.json();
		expect(data.error.code).toBe('invalid_api_key');
	});

	it('rejects anonymous access when no keys exist and public access is off', async () => {
		await seedConfig({ apiKeys: [] });
		const response = await SELF.fetch(url('/v1/models'), {
			headers: { Authorization: `Bearer ${API_KEY}` },
		});
		expect(response.status).toBe(401);
		const data = await response.json();
		expect(data.error.message).toContain('No API keys exist');
	});

	it('accepts x-api-key authentication', async () => {
		const response = await SELF.fetch(url('/v1/models'), {
			headers: { 'x-api-key': API_KEY },
		});
		expect(response.status).toBe(200);
	});

	it('exposes aggregate-only public stats', async () => {
		mockFetch(async () => {
			throw new Error('network disabled in tests');
		});
		const response = await SELF.fetch(url('/api/stats'));
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toMatchObject({
			total_accounts: 1,
			free_daily_neurons: 10_000,
			quota_backend: 'durable-object',
		});
		expect(data.accounts).toBeUndefined();
	});

	it('keeps the detailed usage summary behind admin auth', async () => {
		const response = await SELF.fetch(url('/api/usage/summary'));
		expect(response.status).toBe(401);
	});
});

describe('GET /v1/models', () => {
	it('returns free models only, sorted by performance', async () => {
		const response = await SELF.fetch(url('/v1/models'), { headers: authHeaders() });
		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data.object).toBe('list');
		expect(data.data).toHaveLength(2);
		expect(data.data.map((model) => model.id)).toEqual(['@cf/test/chat', '@cf/test/chat-7b']);
		expect(data.data.every((model) => model.free && !model.requires_paid)).toBe(true);
		expect(data.data[0].performance.score).toBeGreaterThan(data.data[1].performance.score);
		expect(typeof data.data[0].performance.rank).toBe('number');
		expect(data.data[0].pricing.display).toContain('$0.011');
		expect(data.meta.include_paid).toBe(false);
		expect(data.meta.free_daily_neurons).toBe(10_000);
		expect(response.headers.get('x-workers-ai-catalog-source')).toBe('test');
	});

	it('filters by task and searches by name', async () => {
		const filtered = await SELF.fetch(url('/v1/models?task=text-embeddings'), { headers: authHeaders() });
		expect((await filtered.json()).data).toHaveLength(0);

		const searched = await SELF.fetch(url('/v1/models?search=7b'), { headers: authHeaders() });
		const data = await searched.json();
		expect(data.data.map((model) => model.id)).toEqual(['@cf/test/chat-7b']);
	});

	it('hides paid models in the public catalog', async () => {
		const response = await SELF.fetch(url('/v1/models?include_paid=1'), { headers: authHeaders() });
		const data = await response.json();
		expect(data.data.map((model) => model.id)).not.toContain('@cf/test/chat-paid');
	});

	it('returns 403 for a paid-only model detail unless authenticated as admin', async () => {
		const response = await SELF.fetch(url('/v1/models/@cf/test/chat-paid'), { headers: authHeaders() });
		expect(response.status).toBe(403);
		expect((await response.json()).error.code).toBe('model_requires_paid_plan');

		const admin = await SELF.fetch(url('/v1/models/@cf/test/chat-paid'), {
			headers: authHeaders(),
			// Cookie is forwarded independently of the bearer token.
		});
		expect(admin.status).toBe(403);

		const withAdmin = await SELF.fetch(url('/v1/models/@cf/test/chat-paid'), {
			headers: { ...authHeaders(), Cookie: await adminCookie() },
		});
		expect(withAdmin.status).toBe(200);
		expect((await withAdmin.json()).id).toBe('@cf/test/chat-paid');
	});

	it('returns 404 for unknown models', async () => {
		const response = await SELF.fetch(url('/v1/models/@cf/test/missing'), { headers: authHeaders() });
		expect(response.status).toBe(404);
		expect((await response.json()).error.code).toBe('model_not_found');
	});
});

describe('POST /v1/chat/completions', () => {
	it('proxies to Workers AI and settles the real neuron usage', async () => {
		const fetchMock = mockFetch(async () => upstreamJson(upstreamChat()));

		const response = await post('/v1/chat/completions', chatBody());
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.model).toBe(BASE_MODEL.id);
		expect(data.choices[0].message.content).toBe('hi there');
		expect(data.usage.estimated_neurons).toBe(1);
		expect(response.headers.get('x-workers-ai-account')).toBe(ACCOUNT.name);
		expect(response.headers.get('x-quota-remaining')).toBe('9999');

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [target, init] = fetchMock.mock.calls[0];
		expect(target).toBe(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT.accountId}/ai/v1/chat/completions`);
		expect(init.headers.get('Authorization')).toBe(`Bearer ${ACCOUNT.apiToken}`);
		const sent = JSON.parse(init.body);
		expect(sent.model).toBe(BASE_MODEL.id);
		expect(sent.messages).toHaveLength(1);

		const status = await quotaStatus(env, ACCOUNT.id, 10_000);
		expect(status.used).toBe(1);
		expect(status.reserved).toBe(0);
	});

	it('resolves an alias configured by the operator', async () => {
		await seedConfig({ settings: { aliases: { cheap: '@cf/test/chat-7b' } } });
		const fetchMock = mockFetch(async () => upstreamJson({ ...upstreamChat(), model: '@cf/test/chat-7b' }));

		const response = await post('/v1/chat/completions', chatBody('cheap'));
		expect(response.status).toBe(200);
		const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(sent.model).toBe('@cf/test/chat-7b');
	});

	it('rejects paid-only models before calling upstream', async () => {
		const fetchMock = mockFetch(async () => upstreamJson(upstreamChat()));
		const response = await post('/v1/chat/completions', chatBody('@cf/test/chat-paid'));
		expect(response.status).toBe(403);
		const data = await response.json();
		expect(data.error.code).toBe('model_requires_paid_plan');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('validates the request body', async () => {
		const missingModel = await post('/v1/chat/completions', { messages: [] });
		expect(missingModel.status).toBe(400);
		expect((await missingModel.json()).error.code).toBe('missing_model');

		const missingMessages = await post('/v1/chat/completions', { model: BASE_MODEL.id });
		expect(missingMessages.status).toBe(400);
		expect((await missingMessages.json()).error.code).toBe('invalid_messages');
	});

	it('surfaces Cloudflare error 3036 as quota exhaustion and blocks further spend', async () => {
		const fetchMock = mockFetch(async () => upstreamJson({
			success: false,
			errors: [{ code: 3036, message: 'Daily free allocation of 10,000 neurons exceeded.' }],
		}, 429));

		const response = await post('/v1/chat/completions', chatBody());
		expect(response.status).toBe(429);
		const data = await response.json();
		expect(data.error.code).toBe('insufficient_quota');
		expect(data.error.message).toContain('10,000 neurons');
		expect(fetchMock).toHaveBeenCalledTimes(1);

		const status = await quotaStatus(env, ACCOUNT.id, 10_000);
		expect(status.used).toBe(10_000);
		expect(status.remaining).toBe(0);

		const blocked = await post('/v1/chat/completions', chatBody());
		expect(blocked.status).toBe(429);
		expect((await blocked.json()).error.code).toBe('insufficient_quota');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('fails closed when the estimated request exceeds the daily allowance', async () => {
		await seedConfig({ settings: { dailyNeurons: 10 } });
		const fetchMock = mockFetch(async () => upstreamJson(upstreamChat()));
		const response = await post('/v1/chat/completions', chatBody(BASE_MODEL.id, {
			max_tokens: 32_000,
		}));
		expect(response.status).toBe(429);
		const data = await response.json();
		expect(data.error.code).toBe('insufficient_quota');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('streams SSE and settles usage after the stream ends', async () => {
		const sse = [
			`data: ${JSON.stringify({ id: 'chatcmpl-test', model: BASE_MODEL.id, choices: [{ delta: { content: 'Hello' } }] })}\n\n`,
			`data: ${JSON.stringify({ id: 'chatcmpl-test', choices: [{ delta: { content: ' world' } }], usage: { prompt_tokens: 100, completion_tokens: 50 } })}\n\n`,
			'data: [DONE]\n\n',
		].join('');
		mockFetch(async () => new Response(sse, { headers: { 'Content-Type': 'text/event-stream' } }));

		const response = await post('/v1/chat/completions', chatBody(BASE_MODEL.id, { stream: true }));
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/event-stream');
		const text = await response.text();
		expect(text).toContain('Hello');
		expect(text).toContain('[DONE]');

		const status = await quotaStatus(env, ACCOUNT.id, 10_000);
		expect(status.used).toBe(1);
		expect(status.reserved).toBe(0);
	});

	it('supports legacy text completions', async () => {
		mockFetch(async () => upstreamJson(upstreamChat()));
		const response = await post('/v1/completions', { model: BASE_MODEL.id, prompt: 'hello' });
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.object).toBe('text_completion');
		expect(data.choices[0].text).toBe('hi there');
	});
});

describe('Anthropic compatibility', () => {
	it('translates /v1/messages requests and responses', async () => {
		const fetchMock = mockFetch(async () => upstreamJson(upstreamChat()));

		const response = await post('/v1/messages', {
			model: BASE_MODEL.id,
			max_tokens: 128,
			system: 'Be concise.',
			messages: [{ role: 'user', content: 'hello' }],
		}, { ...authHeaders(), 'anthropic-version': '2023-06-01' });

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.type).toBe('message');
		expect(data.role).toBe('assistant');
		expect(data.content).toEqual([{ type: 'text', text: 'hi there' }]);
		expect(data.usage).toEqual({ input_tokens: 100, output_tokens: 50 });

		const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(sent.model).toBe(BASE_MODEL.id);
		expect(sent.messages[0]).toEqual({ role: 'system', content: 'Be concise.' });
		expect(sent.max_tokens).toBe(128);
	});

	it('returns Anthropic-shaped authentication errors', async () => {
		const response = await SELF.fetch(url('/v1/messages'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ model: BASE_MODEL.id, max_tokens: 10, messages: [] }),
		});
		expect(response.status).toBe(401);
		const data = await response.json();
		expect(data.type).toBe('error');
		expect(data.error.type).toBe('authentication_error');
	});

	it('counts tokens without calling upstream', async () => {
		const fetchMock = mockFetch(async () => upstreamJson(upstreamChat()));
		const response = await post('/v1/messages/count_tokens', {
			model: BASE_MODEL.id,
			messages: [{ role: 'user', content: 'hello world' }],
		});
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.input_tokens).toBeGreaterThan(0);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('admin API', () => {
	it('logs in with the configured password and sets a session cookie', async () => {
		const bad = await post('/api/auth/login', { password: 'wrong' });
		expect(bad.status).toBe(401);

		const response = await post('/api/auth/login', { password: 'test-password' });
		expect(response.status).toBe(200);
		const cookie = response.headers.get('set-cookie');
		expect(cookie).toContain('admin_token=');
		expect(cookie).toContain('HttpOnly');
		expect(cookie).toContain('SameSite=Strict');
	});

	it('rejects admin routes without a session', async () => {
		const response = await SELF.fetch(url('/api/admin/overview'));
		expect(response.status).toBe(401);
		expect((await response.json()).error.code).toBe('unauthorized');
	});

	it('returns an overview without leaking key hashes or tokens', async () => {
		mockFetch(async () => {
			throw new Error('network disabled in tests');
		});
		const response = await SELF.fetch(url('/api/admin/overview'), {
			headers: { Cookie: await adminCookie() },
		});
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.version).toBe('2.0.0');
		expect(data.accounts[0].tokenPreview).toMatch(/^••••/);
		expect(data.accounts[0].apiToken).toBeUndefined();
		expect(data.keys[0].hash).toBeUndefined();
		expect(data.keys[0].prefix).toBe('sk-wa-test');
		expect(data.environment.maxDailyNeurons).toBe(10_000);
		expect(data.usage.limit).toBe(10_000);
	});

	it('refuses to raise the daily limit above the free allowance', async () => {
		const headers = { ...authHeaders(), Cookie: await adminCookie() };
		const rejected = await SELF.fetch(url('/api/admin/settings'), {
			method: 'PUT',
			headers,
			body: JSON.stringify({ dailyNeurons: 20_000 }),
		});
		expect(rejected.status).toBe(400);
		expect((await rejected.json()).error.code).toBe('quota_limit_exceeded');

		const accepted = await SELF.fetch(url('/api/admin/settings'), {
			method: 'PUT',
			headers,
			body: JSON.stringify({ dailyNeurons: 5_000, allowPublic: true }),
		});
		expect(accepted.status).toBe(200);
		const data = await accepted.json();
		expect(data.settings.dailyNeurons).toBe(5_000);
		expect(data.settings.allowPublic).toBe(true);
	});

	it('creates an API key once and stores only its hash', async () => {
		const response = await SELF.fetch(url('/api/admin/keys'), {
			method: 'POST',
			headers: { ...authHeaders(), Cookie: await adminCookie() },
			body: JSON.stringify({ name: 'CI key' }),
		});
		expect(response.status).toBe(201);
		const data = await response.json();
		expect(data.plaintext).toMatch(/^sk-wa-/);
		expect(data.key.hash).toBeUndefined();

		const listed = await SELF.fetch(url('/api/admin/keys'), {
			headers: { Cookie: await adminCookie() },
		});
		const keys = (await listed.json()).keys;
		expect(keys.some((key) => key.id === data.key.id)).toBe(true);
		expect(keys.every((key) => key.hash === undefined)).toBe(true);

		resetConfigCache();
		const used = await SELF.fetch(url('/v1/models'), {
			headers: { Authorization: `Bearer ${data.plaintext}` },
		});
		expect(used.status).toBe(200);
	});
});
