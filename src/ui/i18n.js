/**
 * Bilingual UI strings. Chinese is the default; English stays available via
 * the language switch (?lang=en) or the `lang` cookie.
 */
export const LANGS = ['zh', 'en'];
export const DEFAULT_LANG = 'zh';

export const DICT = {
	'brand.name': { zh: 'Workers AI2API', en: 'Workers AI2API' },
	'nav.admin': { zh: '管理', en: 'Admin' },
	'nav.status.checking': { zh: '检测中', en: 'checking' },
	'nav.status.live': { zh: '目录实时', en: 'catalog live' },
	'nav.status.cached': { zh: '目录缓存', en: 'catalog cached' },
	'nav.status.offline': { zh: '离线', en: 'offline' },
	'nav.lang.zh': { zh: '中文', en: '中文' },
	'nav.lang.en': { zh: 'EN', en: 'EN' },

	'common.copy': { zh: '复制', en: 'Copy' },
	'common.copied': { zh: '已复制', en: 'Copied' },
	'common.loading': { zh: '加载中…', en: 'Loading…' },
	'common.refresh': { zh: '刷新', en: 'Refresh' },
	'common.refreshing': { zh: '刷新中…', en: 'Refreshing…' },
	'common.save': { zh: '保存设置', en: 'Save settings' },
	'common.allTasks': { zh: '全部任务', en: 'All tasks' },
	'common.search': { zh: '搜索模型…', en: 'Search models…' },
	'common.noData': { zh: '暂无数据', en: 'No data yet' },
	'common.close': { zh: '关闭', en: 'Close' },
	'common.enable': { zh: '启用', en: 'Enable' },
	'common.disable': { zh: '禁用', en: 'Disable' },
	'common.delete': { zh: '删除', en: 'Delete' },
	'common.active': { zh: '启用', en: 'active' },
	'common.disabled': { zh: '已禁用', en: 'disabled' },
	'common.never': { zh: '从未', en: 'never' },
	'common.set': { zh: '已设置', en: 'set' },
	'common.missing': { zh: '未设置', en: 'missing' },
	'common.bound': { zh: '已绑定', en: 'bound' },
	'common.deprecated': { zh: '已弃用', en: 'deprecated' },
	'common.paidOnly': { zh: '需付费计划', en: 'paid plan' },
	'common.free': { zh: '免费', en: 'free' },

	'landing.title': { zh: 'Workers AI2API — OpenAI 兼容的 Workers AI 网关', en: 'Workers AI2API — OpenAI-compatible Workers AI gateway' },
	'landing.metaDesc': { zh: '把全部免费 Cloudflare Workers AI 模型封装为一个 OpenAI 兼容接口。', en: 'OpenAI-compatible gateway for every free Cloudflare Workers AI model.' },
	'landing.eyebrow': { zh: '独立项目 · Cloudflare Workers AI', en: 'Independent · Cloudflare Workers AI' },
	'landing.h1': { zh: '所有免费的 Workers AI 模型。<br>一个 OpenAI 兼容端点。', en: 'Every free Workers AI model.<br>One OpenAI-compatible endpoint.' },
	'landing.lead': { zh: '动态模型目录、按账号核算的免费 Neurons、流式对话、向量、图像、语音与 Anthropic Messages，全部跑在边缘网络。', en: 'A dynamic model catalog, per-account free-neuron accounting, and streaming chat, embeddings, images, audio and Anthropic Messages — deployed at the edge.' },
	'landing.stat.freeModels': { zh: '免费模型 · 目录', en: 'free models, catalog' },
	'landing.stat.neurons': { zh: '每账号每日免费 Neurons', en: 'free neurons / account / day' },
	'landing.stat.accounts': { zh: '已接入账号', en: 'accounts connected' },
	'landing.stat.usage': { zh: '今日额度已用', en: 'of daily quota used' },
	'landing.ledger.title': { zh: '免费额度账本', en: 'Free tier ledger' },
	'landing.ledger.caption': { zh: '每账号 · 每日 · UTC 00:00 重置', en: 'per account · per day · resets 00:00 UTC' },
	'landing.ledger.backend': { zh: '记账后端', en: 'quota backend' },
	'landing.ledger.remaining': { zh: '剩余 Neurons', en: 'neurons remaining' },
	'landing.ledger.note': { zh: '硬上限：预留 + 结算，永远不越过 10,000 Neurons。', en: 'Hard ceiling: reserve, then settle. Never past 10,000 neurons.' },
	'landing.catalog.title': { zh: '免费模型目录', en: 'Free model catalog' },
	'landing.catalog.sub': { zh: '含 Cloudflare 托管与第三方合作模型', en: 'Cloudflare-hosted and partner models' },
	'landing.sort.performance': { zh: '性能', en: 'Performance' },
	'landing.sort.price': { zh: '价格', en: 'Price' },
	'landing.sort.context': { zh: '上下文', en: 'Context' },
	'landing.sort.name': { zh: '名称', en: 'Name' },
	'landing.sort.updated': { zh: '更新时间', en: 'Updated' },
	'landing.table.model': { zh: '模型', en: 'Model' },
	'landing.table.task': { zh: '任务', en: 'Task' },
	'landing.table.context': { zh: '上下文', en: 'Context' },
	'landing.table.caps': { zh: '能力', en: 'Capabilities' },
	'landing.table.price': { zh: '价格（USD）', en: 'Price (USD)' },
	'landing.table.daily': { zh: '免费日输出', en: 'Free daily output' },
	'landing.table.tier': { zh: '等级', en: 'Tier' },
	'landing.table.neurons': { zh: '输出 Neurons / M', en: 'Neurons/M output' },
	'landing.noMatch': { zh: '没有符合筛选条件的模型。', en: 'No models match this filter.' },
	'landing.count': { zh: '显示 {shown} / {total} 个免费模型', en: '{shown} of {total} free models' },
	'landing.footnote': { zh: '性能等级为透明启发式估算（参数量、能力、上下文、发布时间、价格），可在管理后台用自测基准覆盖。价格来自 Cloudflare 实时定价页；免费额度为每账号每天 10,000 Neurons。', en: 'Ranking is a transparent estimate from parameters, capabilities, context, recency and price; override it with your own benchmarks in admin. Prices come from Cloudflare\'s live pricing page; the free allowance is 10,000 neurons per account per UTC day.' },
	'landing.coverage': { zh: '{free} 个免费 · {partners} 个合作方模型 · {authors} 家提供方', en: '{free} free · {partners} partner models · {authors} providers' },
	'landing.paidNote': { zh: '需 Workers Paid 或 AI Gateway 预付额度的模型不会出现在免费目录中，代理会返回 403。通过 AI Gateway 访问的 OpenAI / Anthropic 等外部 API 不属于 Workers AI 免费额度。', en: 'Models requiring Workers Paid or AI Gateway prepaid credits stay out of the free catalog; the proxy returns 403. External APIs reached through AI Gateway (OpenAI, Anthropic, etc.) are not part of the free Workers AI allowance.' },
	'landing.cards.vs.title': { zh: 'Workers AI 与 AI Gateway 的区别', en: 'Workers AI vs AI Gateway' },
	'landing.cards.vs.body': { zh: '一个运行模型并按 Neurons 计费；另一个是缓存、日志、重试与统一计费的控制层。', en: 'One runs models and bills neurons. The other is a control layer for caching, logs, retries and unified billing.' },
	'landing.cards.vs.link': { zh: '阅读分析 →', en: 'Read the analysis →' },
	'landing.cards.api.title': { zh: 'OpenAI 兼容接口', en: 'OpenAI-compatible API' },
	'landing.cards.api.body': { zh: '/v1/chat/completions、embeddings、images、audio、rerank、Anthropic Messages 以及通用的 /v1/run。', en: '/v1/chat/completions, embeddings, images, audio, rerank, Anthropic Messages and a generic /v1/run.' },
	'landing.cards.api.link': { zh: '接口文档 →', en: 'Endpoint reference →' },
	'landing.cards.quota.title': { zh: '免费额度硬保护', en: 'Hard free-tier guard' },
	'landing.cards.quota.body': { zh: '原子预留让并发请求也无法越过每日 10,000 Neurons 的免费额度。', en: 'Atomic per-account reservations stop requests before the 10,000-neuron daily allocation is exceeded.' },
	'landing.cards.quota.link': { zh: '核算方式 →', en: 'How accounting works →' },
	'landing.footer': { zh: 'Workers AI2API v2 · 独立项目，与 Cloudflare 无隶属关系。模型数据与价格归 Cloudflare 所有。', en: 'Workers AI2API v2 · Independent project, not affiliated with Cloudflare. Model data and prices belong to Cloudflare.' },

	'task.text-generation': { zh: '文本生成', en: 'Text' },
	'task.text-embeddings': { zh: '向量', en: 'Embeddings' },
	'task.text-to-image': { zh: '图像生成', en: 'Image' },
	'task.automatic-speech-recognition': { zh: '语音转文本', en: 'Speech → text' },
	'task.text-to-speech': { zh: '文本转语音', en: 'Text → speech' },
	'task.text-classification': { zh: '分类 / 重排', en: 'Classification' },
	'task.image-to-text': { zh: '图像转文本', en: 'Image → text' },
	'task.translation': { zh: '翻译', en: 'Translation' },
	'task.summarization': { zh: '摘要', en: 'Summarization' },
	'task.image-classification': { zh: '图像分类', en: 'Image classification' },
	'task.object-detection': { zh: '目标检测', en: 'Object detection' },
	'task.dumb-pipe': { zh: '语音管道', en: 'Dumb pipe' },
	'task.unknown': { zh: '未知', en: 'Unknown' },

	'cap.reasoning': { zh: '推理', en: 'reasoning' },
	'cap.tools': { zh: '工具调用', en: 'tools' },
	'cap.vision': { zh: '视觉', en: 'vision' },
	'cap.audio_in': { zh: '音频输入', en: 'audio in' },
	'cap.audio_out': { zh: '音频输出', en: 'audio out' },
	'cap.json': { zh: 'JSON', en: 'JSON' },
	'cap.streaming': { zh: '流式', en: 'streaming' },
	'cap.multilingual': { zh: '多语言', en: 'multilingual' },

	'detail.title': { zh: '模型详情', en: 'Model details' },
	'detail.id': { zh: '模型 ID', en: 'Model ID' },
	'detail.author': { zh: '提供方', en: 'Provider' },
	'detail.task': { zh: '任务', en: 'Task' },
	'detail.context': { zh: '上下文窗口', en: 'Context window' },
	'detail.maxOutput': { zh: '最大输出', en: 'Max output' },
	'detail.caps': { zh: '能力', en: 'Capabilities' },
	'detail.price': { zh: '价格', en: 'Pricing' },
	'detail.daily': { zh: '免费日输出', en: 'Free daily output' },
	'detail.rank': { zh: '性能排名', en: 'Performance rank' },
	'detail.score': { zh: '估算得分', en: 'Estimated score' },
	'detail.endpoints': { zh: '可用端点', en: 'Endpoints' },
	'detail.aliases': { zh: '别名', en: 'Aliases' },
	'detail.docs': { zh: 'Cloudflare 文档 ↗', en: 'Cloudflare docs ↗' },
	'detail.copyId': { zh: '复制模型 ID', en: 'Copy model ID' },
	'detail.released': { zh: '发布时间', en: 'Released' },

	'price.input_token': { zh: '输入 token', en: 'input token' },
	'price.output_token': { zh: '输出 token', en: 'output token' },
	'price.cached_input_token': { zh: '缓存输入 token', en: 'cached input token' },
	'price.audio_minute': { zh: '音频分钟', en: 'audio minute' },
	'price.character': { zh: '字符', en: 'character' },
	'price.step': { zh: '步', en: 'step' },
	'price.image': { zh: '图像', en: 'image' },
	'price.image_tile': { zh: '图像 tile', en: 'image tile' },
	'price.image_megapixel': { zh: '图像百万像素', en: 'image megapixel' },
	'price.input_image_tile_step': { zh: '输入图像 tile 步', en: 'input image tile step' },
	'price.output_image_tile_step': { zh: '输出图像 tile 步', en: 'output image tile step' },

	'admin.title': { zh: '管理 — Workers AI2API', en: 'Admin — Workers AI2API' },
	'admin.signinTitle': { zh: '登录 — Workers AI2API', en: 'Sign in — Workers AI2API' },
	'admin.login.title': { zh: '管理员登录', en: 'Admin sign in' },
	'admin.login.sub': { zh: '使用本部署配置的 ADMIN_PASSWORD。', en: 'Use the ADMIN_PASSWORD configured on this deployment.' },
	'admin.login.password': { zh: '密码', en: 'Password' },
	'admin.login.submit': { zh: '登录', en: 'Sign in' },
	'admin.login.back': { zh: '← 返回公开首页', en: '← Back to public site' },
	'admin.nav.overview': { zh: '总览', en: 'Overview' },
	'admin.nav.models': { zh: '模型', en: 'Models' },
	'admin.nav.accounts': { zh: '账号', en: 'Accounts' },
	'admin.nav.keys': { zh: 'API 密钥', en: 'API keys' },
	'admin.nav.settings': { zh: '设置', en: 'Settings' },
	'admin.nav.logout': { zh: '退出登录', en: 'Sign out' },
	'admin.overview.title': { zh: '总览', en: 'Overview' },
	'admin.overview.sub': { zh: '免费 Neuron 核算、已接入账号与实时用量。', en: 'Free-neuron accounting, connected accounts and live usage.' },
	'admin.kpi.used': { zh: '今日已用 Neurons', en: 'neurons used today' },
	'admin.kpi.limit': { zh: '每日免费额度', en: 'daily free allowance' },
	'admin.kpi.remaining': { zh: '剩余 Neurons', en: 'neurons remaining' },
	'admin.kpi.accounts': { zh: '活跃账号', en: 'active accounts' },
	'admin.quota.title': { zh: '每日额度', en: 'Daily quota' },
	'admin.quota.note': { zh: '本地原子记账：已用 {used} + 预留 {reserved}。云端分析：{cloud}。后端：{backend}。', en: 'Local atomic accounting: {used} used + {reserved} reserved. Cloud analytics: {cloud}. Backend: {backend}.' },
	'admin.quota.refresh': { zh: '刷新云端分析', en: 'Refresh analytics' },
	'admin.quota.refreshed': { zh: '已刷新。本地 {local} n；云端 {cloud} n。', en: 'Refreshed. Local {local} n; cloud {cloud} n.' },
	'admin.env.title': { zh: '运行环境', en: 'Environment' },
	'admin.env.version': { zh: '版本', en: 'Version' },
	'admin.env.kv': { zh: 'KV', en: 'KV' },
	'admin.env.quota': { zh: '额度后端', en: 'Quota' },
	'admin.env.maxDaily': { zh: '每日上限', en: 'Max daily' },
	'admin.env.adminPassword': { zh: '管理密码', en: 'Admin password' },
	'admin.perAccount.title': { zh: '按账号', en: 'Per account' },
	'admin.topModels.title': { zh: '今日热门模型', en: 'Top models today' },
	'admin.noAccounts': { zh: '还没有活跃账号。', en: 'No active accounts.' },
	'admin.noUsage': { zh: '暂无云端用量数据。', en: 'No cloud usage data yet.' },
	'admin.models.title': { zh: '模型', en: 'Models' },
	'admin.models.includePaid': { zh: '包含付费模型', en: 'include paid-only' },
	'admin.models.refresh': { zh: '刷新目录', en: 'Refresh catalog' },
	'admin.models.footnote': { zh: '只有免费模型会被 /v1 接受。付费模型默认隐藏，仅用于查看。价格与能力来自 Cloudflare 文档和模型 API。', en: 'Free models are the only ones accepted by /v1. Paid-only models are shown for visibility and excluded by default. Prices and capabilities are refreshed from Cloudflare docs and the models API.' },
	'admin.models.source': { zh: '来源：{source} · {free} 免费 / {paid} 付费 / {deprecated} 已弃用 · 更新于 {time}', en: 'Source: {source} · {free} free / {paid} paid / {deprecated} deprecated · updated {time}' },
	'admin.models.coverage': { zh: '{partner} 个合作方模型 · {authors} 家提供方 · {tasks} 类任务', en: '{partner} partner models · {authors} providers · {tasks} task types' },
	'admin.models.noMatch': { zh: '没有符合条件的模型。', en: 'No models.' },
	'admin.models.count': { zh: '{n} 个模型', en: '{n} models' },
	'admin.accounts.title': { zh: '账号', en: 'Accounts' },
	'admin.accounts.sub': { zh: '每个 Cloudflare 账号每天提供 10,000 个免费 Neurons。请求会在账号之间自动故障转移。', en: 'Each Cloudflare account contributes 10,000 free neurons per UTC day. Requests fail over between accounts.' },
	'admin.accounts.addTitle': { zh: '添加账号', en: 'Add account' },
	'admin.accounts.name': { zh: '名称', en: 'Name' },
	'admin.accounts.accountId': { zh: 'Account ID', en: 'Account ID' },
	'admin.accounts.token': { zh: 'API Token（Workers AI Read & Edit）', en: 'API token (Workers AI Read & Edit)' },
	'admin.accounts.add': { zh: '添加账号', en: 'Add account' },
	'admin.accounts.test': { zh: '测试 Token', en: 'Test token' },
	'admin.accounts.added': { zh: '账号已添加。', en: 'Account added.' },
	'admin.accounts.tokenWorks': { zh: 'Token 可用，可见模型数：{n}', en: 'Token works. Models visible: {n}' },
	'admin.accounts.hint': { zh: '在 Cloudflare Dashboard → My Profile → API Tokens 创建 Workers AI 模板 Token。若需要云端用量核对，再添加 Account Analytics Read 权限。', en: 'Create a token at Cloudflare Dashboard → My Profile → API Tokens → Workers AI template. Add “Account Analytics Read” if you want cloud usage reconciliation.' },
	'admin.accounts.table.account': { zh: '账号', en: 'Account' },
	'admin.accounts.table.token': { zh: 'Token', en: 'Token' },
	'admin.accounts.table.status': { zh: '状态', en: 'Status' },
	'admin.accounts.table.added': { zh: '添加时间', en: 'Added' },
	'admin.accounts.table.actions': { zh: '操作', en: 'Actions' },
	'admin.accounts.confirm': { zh: '确定移除这个账号？', en: 'Remove this account?' },
	'admin.accounts.noAccounts': { zh: '还没有账号。', en: 'No accounts yet.' },
	'admin.keys.title': { zh: 'API 密钥', en: 'API keys' },
	'admin.keys.sub': { zh: '密钥以 SHA-256 哈希存储，明文只显示一次。', en: 'Keys are stored as SHA-256 hashes. The plaintext is shown once.' },
	'admin.keys.name': { zh: '密钥名称', en: 'Key name' },
	'admin.keys.create': { zh: '创建密钥', en: 'Create key' },
	'admin.keys.created': { zh: '密钥已创建。请立即复制，之后不再显示。', en: 'Key created. Copy it now; it is not shown again.' },
	'admin.keys.copyNow': { zh: '立即复制这个密钥：', en: 'Copy this key now:' },
	'admin.keys.confirm': { zh: '确定删除这个密钥？', en: 'Delete this key?' },
	'admin.keys.table.key': { zh: '密钥', en: 'Key' },
	'admin.keys.table.status': { zh: '状态', en: 'Status' },
	'admin.keys.table.lastUsed': { zh: '最后使用', en: 'Last used' },
	'admin.keys.table.created': { zh: '创建时间', en: 'Created' },
	'admin.keys.table.actions': { zh: '操作', en: 'Actions' },
	'admin.keys.noKeys': { zh: '还没有 API 密钥。', en: 'No API keys yet.' },
	'admin.settings.title': { zh: '设置', en: 'Settings' },
	'admin.settings.sub': { zh: 'AI Gateway 是可选项；免费 Neuron 保护始终是权威。', en: 'AI Gateway is optional; the free-neuron guard remains authoritative.' },
	'admin.settings.runtime': { zh: '运行时', en: 'Runtime' },
	'admin.settings.gateway': { zh: 'AI Gateway ID（可选）', en: 'AI Gateway ID (optional)' },
	'admin.settings.daily': { zh: '每账号每日 Neurons', en: 'Daily neurons per account' },
	'admin.settings.defaultMax': { zh: '默认最大输出 tokens', en: 'Default max output tokens' },
	'admin.settings.public': { zh: '公开访问（无需 API 密钥）', en: 'Public access (no API keys)' },
	'admin.settings.quotaHint': { zh: '每日上限受 MAX_DAILY_NEURONS 限制（默认 10,000）。免费计划不要调高：Cloudflare 会开始返回 3036。', en: 'The daily cap is clamped by MAX_DAILY_NEURONS (default 10,000). Do not raise it on a free plan: Cloudflare will start returning error 3036.' },
	'admin.settings.aliases': { zh: '模型别名', en: 'Model aliases' },
	'admin.settings.aliasesHint': { zh: 'JSON 对象：客户端名称 → @cf/ 模型 ID。', en: 'JSON object mapping a client-facing name to an @cf/ model id.' },
	'admin.settings.benchmarks': { zh: '性能覆盖值', en: 'Performance overrides' },
	'admin.settings.benchmarksHint': { zh: 'JSON 对象：模型 ID → 0-100 的自测分数。覆盖值会参与性能排序。', en: 'JSON object mapping model id to a 0-100 score from your own evals. Overrides drive the performance sort.' },
	'admin.settings.saved': { zh: '设置已保存。', en: 'Settings saved.' },
	'admin.settings.invalidJson': { zh: 'JSON 无效：{error}', en: 'Invalid JSON: {error}' },
	'admin.setupWarning': { zh: '请先设置 ADMIN_PASSWORD 环境变量，再使用管理面板。', en: 'Set the ADMIN_PASSWORD environment variable before using the admin panel.' },

	'docs.nav.home': { zh: '首页', en: 'Home' },
	'docs.nav.api': { zh: '接口', en: 'API' },
	'docs.nav.freeTier': { zh: '免费额度', en: 'Free tier' },
	'docs.nav.vs': { zh: 'Workers AI vs AI Gateway', en: 'Workers AI vs AI Gateway' },
	'docs.footer': { zh: 'Workers AI2API v2 · 价格与限额归 Cloudflare 所有。', en: 'Workers AI2API v2 · Prices and limits belong to Cloudflare.' },
};

export function t(lang, key, vars = {}) {
	const entry = DICT[key];
	const template = entry ? (entry[lang] || entry.en) : key;
	return String(template).replace(/\{(\w+)\}/g, (_, name) => (
		vars[name] == null ? '' : String(vars[name])
	));
}

export function resolveLang(request) {
	let url;
	try {
		url = new URL(request.url);
	} catch {
		url = null;
	}

	const query = url?.searchParams.get('lang');
	if (LANGS.includes(query)) return query;

	const cookie = request.headers.get('Cookie') || '';
	const match = cookie.match(/(?:^|;\s*)lang=(zh|en)\b/);
	if (match) return match[1];

	const accept = request.headers.get('Accept-Language') || '';
	if (/(^|,)\s*en\b/i.test(accept) && !/(^|,)\s*zh\b/i.test(accept)) return 'en';

	return DEFAULT_LANG;
}

export function clientDictionary(lang) {
	const out = {};
	for (const key of Object.keys(DICT)) {
		const entry = DICT[key];
		out[key] = entry ? (entry[lang] || entry.en) : key;
	}
	return out;
}
