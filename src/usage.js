import { getActiveAccounts, getSettings } from './config.js';
import { dailyLimit, quotaStatus, reconcileQuota } from './quota.js';
import { utcDay } from './utils.js';

const USAGE_KEY = 'usage:cloud:v2';
const SUMMARY_KEY = 'usage:summary:v2';
const SUMMARY_TTL_MS = 30_000;

async function queryGraphQL(account, startDateTime) {
	const query = `
		query GetAIUsage($accountId: String!, $start: String!) {
			viewer {
				accounts(filter: { accountTag: $accountId }) {
					aiInferenceAdaptiveGroups(
						filter: { datetime_geq: $start }
						limit: 1000
					) {
						count
						sum { totalNeurons }
						dimensions { date modelId }
					}
				}
			}
		}
	`;
	const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${account.apiToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query, variables: { accountId: account.accountId, start: startDateTime } }),
	});
	if (!response.ok) throw new Error(`GraphQL ${response.status}: ${response.statusText}`);
	const result = await response.json();
	if (result.errors?.length) throw new Error(result.errors[0].message);
	return result?.data?.viewer?.accounts?.[0]?.aiInferenceAdaptiveGroups || [];
}

function processGroups(groups) {
	const today = utcDay();
	const history = {};
	for (let i = 6; i >= 0; i -= 1) {
		const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
		history[date] = 0;
	}
	const models = {};
	let todayTotal = 0;

	for (const group of groups) {
		const date = group.dimensions?.date;
		const model = group.dimensions?.modelId || 'unknown';
		const neurons = Number(group.sum?.totalNeurons) || 0;
		if (date === today) {
			todayTotal += neurons;
			models[model] = models[model] || { model, neurons: 0, requests: 0 };
			models[model].neurons += neurons;
			models[model].requests += Number(group.count) || 0;
		}
		if (history[date] !== undefined) history[date] += neurons;
	}

	return {
		todayTotal,
		models: Object.values(models).sort((a, b) => b.neurons - a.neurons),
		history: Object.keys(history).sort().map((date) => ({ date, neurons: history[date] })),
	};
}

export async function refreshCloudUsage(env, { limit = 10 } = {}) {
	const accounts = await getActiveAccounts(env);
	const settings = await getSettings(env);
	const dayLimit = dailyLimit(settings, env);
	const today = utcDay();
	const startToday = `${today}T00:00:00Z`;
	const startWeek = new Date(Date.parse(`${today}T00:00:00Z`) - 6 * 86_400_000).toISOString().split('.')[0] + 'Z';

	const details = {};
	await Promise.all(accounts.slice(0, limit).map(async (account) => {
		try {
			const [todayGroups, weekGroups] = await Promise.all([
				queryGraphQL(account, startToday),
				queryGraphQL(account, startWeek),
			]);
			const parsed = processGroups(todayGroups);
			const week = processGroups(weekGroups);
			details[account.id] = {
				status: 'ok',
				cloudUsed: parsed.todayTotal,
				models: parsed.models,
				history: week.history,
				error: null,
				checkedAt: Date.now(),
			};
			await reconcileQuota(env, account.id, parsed.todayTotal, dayLimit);
		} catch (error) {
			details[account.id] = {
				status: 'error',
				cloudUsed: null,
				models: [],
				history: [],
				error: error.message,
				checkedAt: Date.now(),
			};
		}
	}));

	const record = { accounts: details, fetchedAt: Date.now() };
	await env.KV.put(USAGE_KEY, JSON.stringify(record), { expirationTtl: 86_400 });
	return record;
}

export async function getCloudUsage(env, { force = false } = {}) {
	if (!force) {
		const cached = await env.KV.get(USAGE_KEY, 'json').catch(() => null);
		if (cached && Date.now() - cached.fetchedAt < 5 * 60_000) return cached;
		if (cached) return cached;
	}
	return refreshCloudUsage(env);
}

export async function getUsageSummary(env, ctx, { force = false } = {}) {
	const settings = await getSettings(env);
	const limit = dailyLimit(settings, env);
	const accounts = await getActiveAccounts(env);

	if (!force) {
		const cached = await env.KV.get(SUMMARY_KEY, 'json').catch(() => null);
		if (cached && Date.now() - cached.fetchedAt < SUMMARY_TTL_MS && cached.limit === limit) return cached;
	}

	const local = await Promise.all(accounts.map(async (account) => {
		const status = await quotaStatus(env, account.id, limit);
		return {
			id: account.id,
			name: account.name,
			accountId: account.accountId,
			used: status.used || 0,
			reserved: status.reserved || 0,
			remaining: status.remaining ?? limit,
			limit,
			error: status.error || null,
		};
	}));

	const cloud = await getCloudUsage(env, { force: false }).catch(() => null);
	const models = new Map();
	for (const account of accounts) {
		const detail = cloud?.accounts?.[account.id];
		for (const item of detail?.models || []) {
			const existing = models.get(item.model) || { model: item.model, neurons: 0, requests: 0 };
			existing.neurons += item.neurons;
			existing.requests += item.requests;
			models.set(item.model, existing);
		}
	}

	const used = local.reduce((sum, item) => sum + item.used, 0);
	const reserved = local.reduce((sum, item) => sum + item.reserved, 0);
	const totalLimit = accounts.length * limit;
	const summary = {
		totalNeuronsToday: used,
		cloudNeuronsToday: Object.values(cloud?.accounts || {}).reduce((sum, item) => sum + (item.cloudUsed || 0), 0),
		reservedNeurons: reserved,
		totalAccounts: accounts.length,
		totalLimit,
		usagePercentage: totalLimit > 0 ? Math.round((used / totalLimit) * 10000) / 100 : 0,
		remainingNeurons: Math.max(0, totalLimit - used - reserved),
		modelsToday: [...models.values()].sort((a, b) => b.neurons - a.neurons),
		accounts: local,
		quotaBackend: env.QUOTA ? 'durable-object' : 'kv',
		cloudUsageError: cloud ? undefined : 'Cloud analytics unavailable; using local accounting.',
		fetchedAt: Date.now(),
		limit,
	};

	await env.KV.put(SUMMARY_KEY, JSON.stringify(summary), { expirationTtl: 3600 });
	return summary;
}
