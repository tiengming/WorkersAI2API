import { env } from 'cloudflare:test';
import { normalizeModel } from '../src/catalog/normalize.js';
import { rankModels } from '../src/catalog/ranking.js';
import { resetConfigCache } from '../src/config.js';
import { sha256Hex } from '../src/utils.js';

export const API_KEY = 'sk-wa-test-key';
export const ACCOUNT = {
	id: 'acc_test',
	name: 'Test account',
	accountId: '0123456789abcdef0123456789abcdef',
	apiToken: 'test-api-token-1234567890',
	status: 'active',
	createdAt: '2026-01-01T00:00:00.000Z',
};

export const BASE_MODEL = {
	id: '@cf/test/chat',
	name: 'Test Chat',
	task: { name: 'Text Generation' },
	description: 'A test text generation model with tool calling.',
	context_window: 32_000,
	properties: { function_calling: true, reasoning: true, streaming: true },
};

export const PRICING = {
	items: [
		{ kind: 'input_token', usd: 0.011, neurons: 1000, unit: 'per M input tokens' },
		{ kind: 'output_token', usd: 0.011, neurons: 1000, unit: 'per M output tokens' },
	],
	tokens: {
		input_usd_per_million: 0.011,
		output_usd_per_million: 0.011,
		input_neurons_per_million: 1000,
		output_neurons_per_million: 1000,
	},
	display: '$0.011 / input · $0.011 / output',
	source: 'test',
};

export function makeModel(raw = {}, pricing = PRICING) {
	return normalizeModel(raw, { pricing, freeQuota: 10_000 });
}

export function buildCatalog(models) {
	const ranked = rankModels(models);
	return {
		models: ranked,
		meta: {
			source: 'test',
			fetched_at: Date.now(),
			free_daily_neurons: 10_000,
			total_models: ranked.length,
			free_models: ranked.filter((model) => model.free).length,
			paid_models: ranked.filter((model) => model.requires_paid).length,
			stale: false,
		},
	};
}

export async function seedConfig(overrides = {}) {
	const hash = await sha256Hex(API_KEY);
	const config = {
		version: 2,
		accounts: [{ ...ACCOUNT, ...(overrides.account || {}) }],
		apiKeys: overrides.apiKeys || [{
			id: 'key_test',
			name: 'Test key',
			hash,
			prefix: 'sk-wa-test',
			last4: 'key',
			createdAt: '2026-01-01T00:00:00.000Z',
			lastUsedAt: null,
			enabled: true,
		}],
		settings: {
			gatewayId: '',
			gatewaySkipCache: false,
			allowPublic: false,
			dailyNeurons: 10_000,
			defaultMaxOutputTokens: 1024,
			aliases: {},
			benchmarks: {},
			...(overrides.settings || {}),
		},
	};
	await env.KV.put('config:v2', JSON.stringify(config));
	resetConfigCache();
	return config;
}

export async function seedCatalog(models) {
	const catalog = buildCatalog(models);
	await env.KV.put('catalog:cache:v3', JSON.stringify(catalog));
	return catalog;
}

export function authHeaders(key = API_KEY) {
	return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

export const CHAT_PATH = `/client/v4/accounts/${ACCOUNT.accountId}/ai/v1/chat/completions`;

export async function adminCookie() {
	return `admin_token=${await sha256Hex('test-password')}`;
}
