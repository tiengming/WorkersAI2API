import { getActiveAccounts, getSettings } from '../config.js';
import { parsePricingMarkdown, PRICING_URL } from './pricing.js';
import { normalizeOpenRouterModel, normalizeApiModel } from './normalize.js';
import { rankModels, shortModelId } from './ranking.js';
import snapshot from '../data/catalog-snapshot.js';

const CATALOG_KEY = 'catalog:cache:v2';
const PRICING_KEY = 'pricing:cache:v2';
const CATALOG_TTL_MS = 15 * 60 * 1000;
const PRICING_TTL_MS = 6 * 60 * 60 * 1000;

let inflight = null;

async function fetchJson(url, init = {}) {
	const response = await fetch(url, init);
	const text = await response.text();
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 160)}`);
	}
	if (!response.ok || data?.success === false) {
		const message = data?.errors?.[0]?.message || text.slice(0, 200);
		throw new Error(`Cloudflare API ${response.status}: ${message}`);
	}
	return data;
}

function shuffle(items) {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

async function fetchModelsPage(account, page, format) {
	const params = new URLSearchParams({
		per_page: '100',
		page: String(page),
		hide_experimental: 'false',
		include_deprecated: 'false',
	});
	if (format) params.set('format', format);
	const url = `https://api.cloudflare.com/client/v4/accounts/${account.accountId}/ai/models/search?${params}`;
	const data = await fetchJson(url, {
		headers: {
			Authorization: `Bearer ${account.apiToken}`,
			Accept: 'application/json',
		},
	});
	return {
		models: Array.isArray(data.result) ? data.result : (Array.isArray(data.data) ? data.data : []),
		openrouter: format === 'openrouter' || Array.isArray(data.data),
	};
}

async function fetchAllModels(env) {
	const accounts = shuffle(await getActiveAccounts(env)).slice(0, 3);
	if (accounts.length === 0) throw new Error('No active Cloudflare account configured');

	let lastError = null;
	for (const account of accounts) {
		for (const format of ['openrouter', null]) {
			try {
				const models = [];
				let openrouter = false;
				for (let page = 1; page <= 10; page += 1) {
					const result = await fetchModelsPage(account, page, format);
					openrouter = result.openrouter;
					models.push(...result.models);
					if (result.models.length < 100) break;
				}
				if (models.length > 0) {
					return {
						models,
						openrouter,
						account: { id: account.id, name: account.name, accountId: account.accountId },
					};
				}
			} catch (error) {
				lastError = error;
			}
		}
	}
	throw lastError || new Error('Unable to fetch models');
}

async function getPricing(env, { force = false } = {}) {
	const now = Date.now();
	let cached = null;
	try {
		cached = await env.KV.get(PRICING_KEY, 'json');
	} catch {
		cached = null;
	}

	if (!force && cached && now - cached.fetched_at < PRICING_TTL_MS) return cached;

	try {
		const response = await fetch(PRICING_URL, {
			headers: { Accept: 'text/markdown, text/plain;q=0.9, */*;q=0.5', 'User-Agent': 'WorkersAI2API/2.0' },
			cf: { cacheEverything: true, cacheTtl: 3600 },
		});
		if (!response.ok) throw new Error(`Pricing docs ${response.status}`);
		const markdown = await response.text();
		const parsed = parsePricingMarkdown(markdown);
		const record = { ...parsed, fetched_at: now };
		await env.KV.put(PRICING_KEY, JSON.stringify(record), { expirationTtl: 7 * 24 * 60 * 60 });
		return record;
	} catch (error) {
		if (cached) return { ...cached, stale: true, error: error.message };
		const fallback = snapshot.pricing || { models: {}, paidOnly: [], freeDailyNeurons: 10_000 };
		return { ...fallback, fetched_at: 0, stale: true, error: error.message };
	}
}

function snapshotById() {
	const map = new Map();
	for (const model of snapshot.models || []) map.set(model.id, model);
	return map;
}

function mergeWithSnapshot(model, snapshotMap) {
	const base = snapshotMap.get(model.id);
	if (!base) return model;
	return {
		...base,
		...model,
		// Prefer live API values, fall back to snapshot metadata when absent.
		name: model.name || base.name,
		description: model.description || base.description,
		context_window: model.context_window || base.context_window,
		max_output_tokens: model.max_output_tokens || base.max_output_tokens,
		capabilities: { ...(base.capabilities || {}), ...(model.capabilities || {}) },
		pricing: model.pricing?.items?.length ? model.pricing : base.pricing,
		requires_paid: model.requires_paid || base.requires_paid,
		free: model.free && base.free !== false,
		free_daily_output_tokens: model.free_daily_output_tokens || base.free_daily_output_tokens,
		aliases: [...new Set([...(base.aliases || []), ...(model.aliases || [])])],
	};
}

async function buildCatalog(env) {
	const settings = await getSettings(env);
	const freeQuota = Number(settings.dailyNeurons) || 10_000;
	const snapshotMap = snapshotById();

	let pricing;
	let live;
	try {
		[pricing, live] = await Promise.allSettled([getPricing(env), fetchAllModels(env)]).then((results) => [
			results[0].status === 'fulfilled' ? results[0].value : null,
			results[1].status === 'fulfilled' ? results[1].value : null,
		]);
	} catch {
		pricing = null;
		live = null;
	}

	const paidOnly = new Set(pricing?.paidOnly || []);
	const pricingMap = pricing?.models || {};

	let models = [];
	let source = 'bundled-snapshot';

	if (live?.models?.length) {
		const normalize = live.openrouter ? normalizeOpenRouterModel : normalizeApiModel;
		models = live.models
			.map((raw) => normalize(raw, {
				paidOnly,
				pricing: pricingMap[String(raw.id)],
				freeQuota,
			}))
			.filter(Boolean);
		if (models.length > 0) source = 'cloudflare-models-api';
	}

	if (models.length === 0) {
		models = (snapshot.models || []).map((model) => ({
			...model,
			pricing: pricingMap[model.id] || model.pricing,
			requires_paid: model.requires_paid || paidOnly.has(model.id),
			free: !(model.requires_paid || paidOnly.has(model.id)) && !model.deprecated,
		}));
	}

	// De-duplicate and enrich with the checked-in snapshot.
	const byId = new Map();
	for (const model of models) {
		const merged = mergeWithSnapshot(model, snapshotMap);
		merged.requires_paid = Boolean(merged.requires_paid || paidOnly.has(merged.id));
		merged.free = !merged.requires_paid && !merged.deprecated;
		byId.set(merged.id, merged);
	}

	// Include paid-only models that are present in the snapshot but missing from
	// the API response (e.g. the account token cannot list them). They are
	// flagged and hidden from the free catalog, but visible to admins.
	for (const base of snapshot.models || []) {
		if (!byId.has(base.id)) {
			const requiresPaid = base.requires_paid || paidOnly.has(base.id);
			byId.set(base.id, {
				...base,
				pricing: pricingMap[base.id] || base.pricing,
				requires_paid: requiresPaid,
				free: !requiresPaid && !base.deprecated,
			});
		}
	}

	const ranked = rankModels([...byId.values()], settings.benchmarks || {});
	const now = Date.now();
	return {
		models: ranked,
		meta: {
			source,
			fetched_at: now,
			pricing_updated_at: pricing?.updatedAt || null,
			pricing_fetched_at: pricing?.fetched_at || 0,
			pricing_stale: Boolean(pricing?.stale),
			pricing_error: pricing?.error || null,
			free_daily_neurons: freeQuota,
			total_models: ranked.length,
			free_models: ranked.filter((model) => model.free).length,
			paid_models: ranked.filter((model) => model.requires_paid).length,
			account: live?.account || null,
			stale: false,
			version: snapshot.generated_at || null,
		},
	};
}

async function refresh(env) {
	if (inflight) return inflight;
	inflight = (async () => {
		try {
			const result = await buildCatalog(env);
			const ttl = result.meta.source === 'cloudflare-models-api' ? 7 * 24 * 60 * 60 : 60 * 60;
			await env.KV.put(CATALOG_KEY, JSON.stringify(result), { expirationTtl: ttl });
			return result;
		} finally {
			inflight = null;
		}
	})();
	return inflight;
}

/**
 * Returns the dynamic catalog. Requests never wait for a refresh when a stale
 * copy exists: stale-while-revalidate keeps /v1/models fast and resilient.
 */
export async function getCatalog(env, ctx, { force = false } = {}) {
	let cached = null;
	try {
		cached = await env.KV.get(CATALOG_KEY, 'json');
	} catch {
		cached = null;
	}

	const age = cached ? Date.now() - cached.meta.fetched_at : Infinity;
	if (!force && cached && age < CATALOG_TTL_MS) return cached;

	if (!force && cached) {
		ctx?.waitUntil?.(refresh(env).catch(() => {}));
		return { ...cached, meta: { ...cached.meta, stale: true } };
	}

	try {
		return await refresh(env);
	} catch (error) {
		if (cached) return { ...cached, meta: { ...cached.meta, stale: true, error: error.message } };
		return {
			models: (snapshot.models || []).map((model) => ({ ...model })),
			meta: {
				source: 'bundled-snapshot',
				fetched_at: Date.now(),
				free_daily_neurons: 10_000,
				total_models: (snapshot.models || []).length,
				free_models: (snapshot.models || []).filter((model) => model.free).length,
				paid_models: (snapshot.models || []).filter((model) => model.requires_paid).length,
				stale: true,
				error: error.message,
			},
		};
	}
}

export function findModel(catalog, requested, customAliases = {}) {
	if (!requested) return null;
	const needle = String(requested).trim().toLowerCase();
	const exact = catalog.models.find((model) => model.id.toLowerCase() === needle);
	if (exact) return exact;

	const alias = Object.entries(customAliases || {}).find(([key]) => key.toLowerCase() === needle);
	if (alias) {
		const target = catalog.models.find((model) => model.id === alias[1] || shortModelId(model.id) === alias[1]);
		if (target) return target;
	}

	const shortMatches = catalog.models.filter((model) => shortModelId(model.id).toLowerCase() === needle);
	if (shortMatches.length === 1) return shortMatches[0];

	const unique = catalog.models.filter((model) => model.id.toLowerCase().includes(needle));
	return unique.length === 1 ? unique[0] : null;
}

export function publicModel(model) {
	return {
		id: model.id,
		object: 'model',
		created: model.created_unix || 0,
		owned_by: model.author || 'cloudflare',
		name: model.name,
		task: model.task,
		context_window: model.context_window,
		max_output_tokens: model.max_output_tokens,
		capabilities: model.capabilities,
		modalities: model.modalities,
		pricing: model.pricing,
		free: model.free,
		requires_paid: model.requires_paid,
		free_daily_output_tokens: model.free_daily_output_tokens,
		performance: model.performance,
		endpoints: model.endpoints,
		aliases: model.aliases,
		docs_url: model.docs_url,
	};
}

export { snapshot };
