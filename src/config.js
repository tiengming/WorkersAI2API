import { isPlainObject, parseJsonObject, sha256Hex } from './utils.js';

export const CONFIG_KEY = 'config:v2';
const LEGACY_CONFIG_KEY = 'config';

export const DEFAULT_SETTINGS = {
	/** Optional AI Gateway id. Adds `cf-aig-gateway-id` to upstream requests. */
	gatewayId: '',
	gatewaySkipCache: false,
	/** Allow unauthenticated /v1 access when no API keys exist. */
	allowPublic: false,
	/** Hard cap per Cloudflare account, per UTC day. Never raise above your plan's free allocation. */
	dailyNeurons: 10000,
	/** Default max output tokens used for quota reservation when a client omits max_tokens. */
	defaultMaxOutputTokens: 1024,
	/** Optional map of alias -> @cf model id. */
	aliases: {},
	/** Optional map of model id -> performance score (0-100), for operators with their own evals. */
	benchmarks: {},
};

let memory = { config: null, expires: 0 };

export function resetConfigCache() {
	memory = { config: null, expires: 0 };
}

export function defaultConfig() {
	return {
		version: 2,
		accounts: [],
		apiKeys: [],
		settings: { ...DEFAULT_SETTINGS },
	};
}

function normalizeAccount(account, index) {
	const accountId = String(account.accountId || account.account_id || '').trim();
	const apiToken = String(account.apiToken || account.api_token || account.token || '').trim();
	return {
		id: account.id || accountId || `account-${index + 1}`,
		name: String(account.name || `Account ${index + 1}`).trim(),
		accountId,
		apiToken,
		status: account.status === 'disabled' ? 'disabled' : 'active',
		createdAt: account.createdAt || new Date().toISOString(),
	};
}

function normalizeConfig(input) {
	const base = defaultConfig();
	const data = isPlainObject(input) ? input : {};

	const accounts = Array.isArray(data.accounts) ? data.accounts.map(normalizeAccount) : [];
	const apiKeys = Array.isArray(data.apiKeys) ? data.apiKeys.map((key) => ({
		id: key.id || key.key || `key-${Math.random().toString(36).slice(2)}`,
		name: String(key.name || 'API key'),
		hash: key.hash || null,
		// Legacy plaintext keys are migrated lazily in getConfig().
		legacyKey: key.hash ? null : (key.key || null),
		prefix: key.prefix || (key.key ? String(key.key).slice(0, 10) : 'sk-wa-'),
		last4: key.last4 || (key.key ? String(key.key).slice(-4) : ''),
		createdAt: key.createdAt || new Date().toISOString(),
		lastUsedAt: key.lastUsedAt || null,
		enabled: key.enabled !== false,
	})) : [];

	const settings = {
		...DEFAULT_SETTINGS,
		...(isPlainObject(data.settings) ? data.settings : {}),
		aliases: {
			...(isPlainObject(data.settings?.aliases) ? data.settings.aliases : {}),
			...(isPlainObject(data.aliases) ? data.aliases : {}),
			...(isPlainObject(data.customModelMap) ? data.customModelMap : {}),
		},
		benchmarks: {
			...(isPlainObject(data.settings?.benchmarks) ? data.settings.benchmarks : {}),
		},
	};

	settings.dailyNeurons = Math.max(0, Number(settings.dailyNeurons) || DEFAULT_SETTINGS.dailyNeurons);
	settings.defaultMaxOutputTokens = Math.max(1, Number(settings.defaultMaxOutputTokens) || 1024);
	settings.gatewaySkipCache = settings.gatewaySkipCache === true;
	settings.allowPublic = settings.allowPublic === true;

	return { version: 2, accounts, apiKeys, settings };
}

async function migrateLegacyKeys(env, config) {
	let changed = false;
	for (const key of config.apiKeys) {
		if (!key.hash && key.legacyKey) {
			key.hash = await sha256Hex(key.legacyKey);
			key.prefix = key.legacyKey.slice(0, 10);
			key.last4 = key.legacyKey.slice(-4);
			delete key.legacyKey;
			changed = true;
		}
	}
	if (changed) await env.KV.put(CONFIG_KEY, JSON.stringify(config));
	return config;
}

export async function getConfig(env, { force = false } = {}) {
	const now = Date.now();
	if (!force && memory.config && now < memory.expires) return memory.config;

	let raw = await env.KV.get(CONFIG_KEY);
	if (!raw) {
		const legacyRaw = await env.KV.get(LEGACY_CONFIG_KEY);
		let legacy = null;
		if (legacyRaw) {
			try {
				legacy = JSON.parse(legacyRaw);
			} catch {
				legacy = null;
			}
		}
		const config = normalizeConfig(legacy);
		await env.KV.put(CONFIG_KEY, JSON.stringify(config));
		const migrated = await migrateLegacyKeys(env, config);
		memory = { config: migrated, expires: now + 30_000 };
		return migrated;
	}

	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		parsed = {};
	}
	const config = normalizeConfig(parsed);
	if (config.apiKeys.some((key) => !key.hash && key.legacyKey)) {
		await migrateLegacyKeys(env, config);
	}
	memory = { config, expires: now + 30_000 };
	return config;
}

export async function saveConfig(env, config) {
	const normalized = normalizeConfig(config);
	await env.KV.put(CONFIG_KEY, JSON.stringify(normalized));
	memory = { config: normalized, expires: Date.now() + 30_000 };
	return normalized;
}

export async function updateConfig(env, updater) {
	const config = await getConfig(env, { force: true });
	const next = updater(structuredClone(config)) || config;
	return saveConfig(env, next);
}

export async function getAccounts(env) {
	const config = await getConfig(env);
	return config.accounts;
}

export async function getActiveAccounts(env) {
	const config = await getConfig(env);
	return config.accounts.filter((account) => account.status === 'active' && account.accountId && account.apiToken);
}

export async function getSettings(env) {
	const config = await getConfig(env);
	return config.settings;
}

export function accountAuthHeaders(account) {
	return { Authorization: `Bearer ${account.apiToken}` };
}

export { parseJsonObject };
