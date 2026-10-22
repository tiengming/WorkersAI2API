import {
	adminCookie,
	adminToken,
	hasAdminPassword,
	isAdmin,
} from './auth.js';
import {
	getAccounts,
	getConfig,
	getSettings,
	updateConfig,
} from './config.js';
import { catalogResponse } from './proxy/models.js';
import { getUsageSummary, refreshCloudUsage } from './usage.js';
import { dailyLimit } from './quota.js';
import {
	RequestError,
	json,
	randomId,
	sha256Hex,
	timingSafeEqual,
} from './utils.js';

async function requireAdmin(request, env) {
	if (!(await isAdmin(request, env))) {
		throw new RequestError('Unauthorized. Sign in at /admin.', { status: 401, code: 'unauthorized', type: 'authentication_error' });
	}
}

function publicAccount(account) {
	return {
		id: account.id,
		name: account.name,
		accountId: account.accountId,
		status: account.status,
		createdAt: account.createdAt,
		tokenPreview: account.apiToken ? `••••${String(account.apiToken).slice(-4)}` : '',
	};
}

function publicKey(key) {
	return {
		id: key.id,
		name: key.name,
		prefix: key.prefix,
		last4: key.last4,
		createdAt: key.createdAt,
		lastUsedAt: key.lastUsedAt,
		enabled: key.enabled !== false,
	};
}

function sanitizeSettings(settings, env, patch = {}) {
	const maxDaily = Math.max(1, Number(env.MAX_DAILY_NEURONS) || 10_000);
	const next = { ...settings };

	if (patch.gatewayId !== undefined) next.gatewayId = String(patch.gatewayId || '').trim().slice(0, 120);
	if (patch.gatewaySkipCache !== undefined) next.gatewaySkipCache = patch.gatewaySkipCache === true;
	if (patch.allowPublic !== undefined) next.allowPublic = patch.allowPublic === true;
	if (patch.defaultMaxOutputTokens !== undefined) {
		next.defaultMaxOutputTokens = Math.min(131_072, Math.max(1, Number(patch.defaultMaxOutputTokens) || 1024));
	}
	if (patch.dailyNeurons !== undefined) {
		const value = Number(patch.dailyNeurons);
		if (!Number.isFinite(value) || value < 1) throw new RequestError('dailyNeurons must be a positive number', { status: 400 });
		if (value > maxDaily) {
			throw new RequestError(`dailyNeurons cannot exceed ${maxDaily.toLocaleString()} (the free allowance guard). Set MAX_DAILY_NEURONS only on a paid plan.`, {
				status: 400,
				code: 'quota_limit_exceeded',
			});
		}
		next.dailyNeurons = value;
	}
	if (patch.aliases !== undefined) {
		if (!patch.aliases || typeof patch.aliases !== 'object' || Array.isArray(patch.aliases)) {
			throw new RequestError('aliases must be an object mapping alias -> @cf/model', { status: 400 });
		}
		const aliases = {};
		for (const [alias, target] of Object.entries(patch.aliases)) {
			if (!/^[@a-zA-Z0-9._/-]+$/.test(alias) || !String(target).startsWith('@cf/')) {
				throw new RequestError(`Invalid alias: ${alias}`, { status: 400 });
			}
			aliases[alias] = String(target);
		}
		next.aliases = aliases;
	}
	if (patch.benchmarks !== undefined) {
		if (!patch.benchmarks || typeof patch.benchmarks !== 'object' || Array.isArray(patch.benchmarks)) {
			throw new RequestError('benchmarks must be an object mapping model id -> 0-100', { status: 400 });
		}
		const benchmarks = {};
		for (const [id, score] of Object.entries(patch.benchmarks)) {
			const value = Number(score);
			if (!id.startsWith('@cf/') || !Number.isFinite(value) || value < 0 || value > 100) {
				throw new RequestError(`Invalid benchmark entry: ${id}`, { status: 400 });
			}
			benchmarks[id] = value;
		}
		next.benchmarks = benchmarks;
	}
	return next;
}

export async function handleAdminApi(request, env, ctx) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	// ---- public ----
	if (path === '/api/health' && method === 'GET') {
		const settings = await getSettings(env);
		return json({
			ok: true,
			version: '2.0.0',
			configured: hasAdminPassword(env),
			kv: Boolean(env.KV),
			quota: env.QUOTA ? 'durable-object' : 'kv',
			daily_neurons: dailyLimit(settings, env),
			ai_gateway: Boolean(settings.gatewayId),
		});
	}

	if (path === '/api/auth/status' && method === 'GET') {
		return json({
			configured: hasAdminPassword(env),
			authenticated: await isAdmin(request, env),
		});
	}

	if (path === '/api/auth/login' && method === 'POST') {
		const body = await request.json().catch(() => ({}));
		if (!hasAdminPassword(env)) {
			throw new RequestError('ADMIN_PASSWORD is not configured on this deployment.', { status: 503, code: 'not_configured' });
		}
		if (!timingSafeEqual(String(body.password || ''), String(env.ADMIN_PASSWORD).trim())) {
			throw new RequestError('Incorrect password.', { status: 401, code: 'invalid_password', type: 'authentication_error' });
		}
		const token = await adminToken(env);
		const secure = new URL(request.url).protocol === 'https:';
		return json({ ok: true }, { headers: { 'Set-Cookie': adminCookie(token, { secure }) } });
	}

	if (path === '/api/auth/logout' && method === 'POST') {
		const secure = new URL(request.url).protocol === 'https:';
		return json({ ok: true }, { headers: { 'Set-Cookie': adminCookie('', { clear: true, secure }) } });
	}

	if (path === '/api/catalog' && method === 'GET') {
		const data = await catalogResponse(env, ctx, {
			includePaid: url.searchParams.get('include_paid') === '1',
			task: url.searchParams.get('task'),
			search: url.searchParams.get('search'),
			sort: url.searchParams.get('sort') || 'performance',
			limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : null,
		});
		return json(data);
	}

	// Aggregate-only public stats. Never expose account ids, names or key data.
	if (path === '/api/stats' && method === 'GET') {
		const summary = await getUsageSummary(env, ctx);
		return json({
			total_accounts: summary.totalAccounts,
			usage_percentage: summary.usagePercentage,
			free_daily_neurons: summary.limit,
			quota_backend: summary.quotaBackend,
		});
	}

	// ---- admin ----
	await requireAdmin(request, env);

	if (path === '/api/usage/summary' && method === 'GET') {
		return json(await getUsageSummary(env, ctx));
	}

	if (path === '/api/admin/overview' && method === 'GET') {
		const config = await getConfig(env, { force: true });
		const usage = await getUsageSummary(env, ctx);
		return json({
			version: '2.0.0',
			accounts: config.accounts.map(publicAccount),
			keys: config.apiKeys.map(publicKey),
			settings: { ...config.settings },
			usage,
			environment: {
				adminPassword: hasAdminPassword(env),
				kv: Boolean(env.KV),
				quota: env.QUOTA ? 'durable-object' : 'kv',
				maxDailyNeurons: Number(env.MAX_DAILY_NEURONS) || 10_000,
			},
		});
	}

	if (path === '/api/admin/catalog' && method === 'GET') {
		return json(await catalogResponse(env, ctx, {
			includePaid: true,
			task: url.searchParams.get('task'),
			search: url.searchParams.get('search'),
			sort: url.searchParams.get('sort') || 'performance',
			limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : null,
		}));
	}

	if (path === '/api/admin/catalog/refresh' && method === 'POST') {
		const data = await catalogResponse(env, ctx, { includePaid: true, sort: 'performance' });
		return json(data);
	}

	if (path === '/api/admin/accounts' && method === 'GET') {
		return json({ accounts: (await getAccounts(env)).map(publicAccount) });
	}

	if (path === '/api/admin/accounts' && method === 'POST') {
		const body = await request.json().catch(() => ({}));
		const accountId = String(body.accountId || '').trim();
		const apiToken = String(body.apiToken || '').trim();
		const name = String(body.name || '').trim() || 'Cloudflare account';
		if (!/^[a-f0-9]{32}$/i.test(accountId)) throw new RequestError('accountId must be the 32-character Cloudflare account ID.', { status: 400 });
		if (apiToken.length < 20) throw new RequestError('apiToken looks too short.', { status: 400 });

		let created;
		await updateConfig(env, (config) => {
			if (config.accounts.some((item) => item.accountId === accountId)) {
				throw new RequestError('This Cloudflare account is already configured.', { status: 409, code: 'duplicate_account' });
			}
			created = {
				id: randomId('acc_'),
				name,
				accountId,
				apiToken,
				status: 'active',
				createdAt: new Date().toISOString(),
			};
			config.accounts.push(created);
			return config;
		});
		ctx?.waitUntil?.(catalogResponse(env, ctx, { includePaid: true }).catch(() => {}));
		return json({ account: publicAccount(created) }, { status: 201 });
	}

	const accountMatch = path.match(/^\/api\/admin\/accounts\/([^/]+)$/);
	if (accountMatch) {
		const id = decodeURIComponent(accountMatch[1]);
		if (method === 'PATCH' || method === 'PUT') {
			const body = await request.json().catch(() => ({}));
			let updated;
			await updateConfig(env, (config) => {
				const account = config.accounts.find((item) => item.id === id);
				if (!account) throw new RequestError('Account not found.', { status: 404 });
				if (body.name !== undefined) account.name = String(body.name).trim().slice(0, 80) || account.name;
				if (body.apiToken) account.apiToken = String(body.apiToken).trim();
				if (body.status) account.status = body.status === 'disabled' ? 'disabled' : 'active';
				updated = account;
				return config;
			});
			return json({ account: publicAccount(updated) });
		}
		if (method === 'DELETE') {
			await updateConfig(env, (config) => {
				config.accounts = config.accounts.filter((item) => item.id !== id);
				return config;
			});
			return json({ ok: true });
		}
	}

	if (path === '/api/admin/accounts/test' && method === 'POST') {
		const body = await request.json().catch(() => ({}));
		const accountId = String(body.accountId || '').trim();
		const token = String(body.apiToken || '').trim();
		if (!accountId || !token) throw new RequestError('accountId and apiToken are required.', { status: 400 });
		const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search?per_page=1`, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		});
		const data = await response.json().catch(() => ({}));
		if (!response.ok || data.success === false) {
			return json({
				ok: false,
				status: response.status,
				error: data.errors?.[0]?.message || response.statusText,
			}, { status: 200 });
		}
		return json({ ok: true, models: Array.isArray(data.result) ? data.result.length : 0 });
	}

	if (path === '/api/admin/keys' && method === 'GET') {
		return json({ keys: (await getConfig(env)).apiKeys.map(publicKey) });
	}

	if (path === '/api/admin/keys' && method === 'POST') {
		const body = await request.json().catch(() => ({}));
		const plaintext = `sk-wa-${randomId('')}`;
		const hash = await sha256Hex(plaintext);
		const record = {
			id: randomId('key_'),
			name: String(body.name || 'API key').trim().slice(0, 80),
			hash,
			prefix: plaintext.slice(0, 10),
			last4: plaintext.slice(-4),
			createdAt: new Date().toISOString(),
			lastUsedAt: null,
			enabled: true,
		};
		await updateConfig(env, (config) => {
			config.apiKeys.push(record);
			return config;
		});
		return json({ key: publicKey(record), plaintext }, { status: 201 });
	}

	const keyMatch = path.match(/^\/api\/admin\/keys\/([^/]+)$/);
	if (keyMatch) {
		const id = decodeURIComponent(keyMatch[1]);
		if (method === 'PATCH' || method === 'PUT') {
			const body = await request.json().catch(() => ({}));
			let updated;
			await updateConfig(env, (config) => {
				const key = config.apiKeys.find((item) => item.id === id);
				if (!key) throw new RequestError('Key not found.', { status: 404 });
				if (body.name !== undefined) key.name = String(body.name).trim().slice(0, 80) || key.name;
				if (body.enabled !== undefined) key.enabled = body.enabled === true;
				updated = key;
				return config;
			});
			return json({ key: publicKey(updated) });
		}
		if (method === 'DELETE') {
			await updateConfig(env, (config) => {
				config.apiKeys = config.apiKeys.filter((item) => item.id !== id);
				return config;
			});
			return json({ ok: true });
		}
	}

	if (path === '/api/admin/settings' && method === 'GET') {
		return json({ settings: await getSettings(env) });
	}

	if (path === '/api/admin/settings' && (method === 'PUT' || method === 'PATCH')) {
		const body = await request.json().catch(() => ({}));
		let saved;
		await updateConfig(env, (config) => {
			config.settings = sanitizeSettings(config.settings, env, body);
			saved = config.settings;
			return config;
		});
		return json({ settings: saved });
	}

	if (path === '/api/admin/usage' && method === 'GET') {
		const force = url.searchParams.get('force') === '1';
		if (force) await refreshCloudUsage(env, { limit: 20 }).catch(() => null);
		return json(await getUsageSummary(env, ctx, { force: true }));
	}

	throw new RequestError(`Admin API route not found: ${path}`, { status: 404, code: 'not_found' });
}
