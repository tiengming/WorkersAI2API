import { nav, shell } from './pages.js';
import { resolveLang, t } from './i18n.js';

function wrapTables(html) {
	return html
		.replace(/<table>/g, '<div class="table-scroll"><table>')
		.replace(/<\/table>/g, '</table></div>');
}

function docsNav(lang) {
	return `${nav(lang)}<div class="wrap" style="padding-top:14px">
<a class="tiny" href="/?lang=${lang}">← ${t(lang, 'docs.nav.home')}</a>
<span class="tiny">/</span> <a class="tiny" href="/docs/api?lang=${lang}">${t(lang, 'docs.nav.api')}</a>
<span class="tiny">/</span> <a class="tiny" href="/docs/free-tier?lang=${lang}">${t(lang, 'docs.nav.freeTier')}</a>
<span class="tiny">/</span> <a class="tiny" href="/docs/workers-ai-vs-ai-gateway?lang=${lang}">${t(lang, 'docs.nav.vs')}</a>
</div>`;
}

const VS_EN = `<article class="docs wrap">
<h1>Workers AI vs AI Gateway</h1>
<p>These are two different layers. Workers AI <em>runs</em> models. AI Gateway <em>controls</em> requests to models — including Workers AI and external providers. They compose; they do not replace each other.</p>

<h2>The short version</h2>
<table><thead><tr><th></th><th>Workers AI</th><th>AI Gateway</th></tr></thead><tbody>
<tr><td><strong>What it is</strong></td><td>Serverless inference on Cloudflare GPUs plus the model catalog.</td><td>A proxy/control plane in front of AI providers.</td></tr>
<tr><td><strong>Runs models?</strong></td><td>Yes. Cloudflare-hosted and partner models.</td><td>No. It forwards to Workers AI, OpenAI, Anthropic, Google, etc.</td></tr>
<tr><td><strong>Billing</strong></td><td>Neurons. $0.011 per 1,000 neurons; 10,000 free neurons per day, resets 00:00 UTC.</td><td>Gateway itself is free on the standard plan. It can enable prepaid “unified billing” credits for Workers AI frontier models.</td></tr>
<tr><td><strong>Free tier</strong></td><td>10,000 neurons/day. Some models require Workers Paid or AI Gateway prepaid credits.</td><td>Does not add free inference. Caching can avoid repeated inference cost.</td></tr>
<tr><td><strong>Core features</strong></td><td>Model catalog, OpenAI-compatible chat/embeddings, native run API, function calling, LoRA, batch, prompt caching.</td><td>Analytics, logging, caching, rate limiting, retries/fallback, guardrails, dynamic routing, unified billing.</td></tr>
<tr><td><strong>Auth</strong></td><td>Cloudflare API token with Workers AI permission.</td><td>Cloudflare API token; optional gateway authentication token.</td></tr>
</tbody></table>

<h2>How they connect</h2>
<p>You can send a Workers AI request through a gateway by adding the <code>cf-aig-gateway-id</code> header to the same Cloudflare API URL. The model still runs on Workers AI and still consumes neurons. The gateway only observes and controls the request.</p>
<pre><code>POST https://api.cloudflare.com/client/v4/accounts/&lt;account_id&gt;/ai/v1/chat/completions
Authorization: Bearer &lt;api_token&gt;
cf-aig-gateway-id: default

{"model":"@cf/zai-org/glm-4.7-flash","messages":[...]}</code></pre>
<p>Workers AI also exposes a binding option (<code>env.AI.run(model, input, { gateway: { id, skipCache, cacheTtl } })</code>) and AI Gateway exposes its own REST base URL. This project uses the header form because it keeps the same upstream path for every account and works with the REST API.</p>

<h2>What this project uses</h2>
<ul>
<li><strong>Workers AI</strong> is the inference provider. All model calls go to <code>api.cloudflare.com/client/v4/accounts/{id}/ai/...</code>.</li>
<li><strong>AI Gateway is optional.</strong> Set a gateway id in the admin settings and every request gains <code>cf-aig-gateway-id</code>. This gives you gateway analytics, caching and logs without changing the model or quota model.</li>
<li>The gateway does <strong>not</strong> bypass the free-neuron limit. The local quota guard still reserves and settles neurons per account per day.</li>
<li>Gateway caching can reduce neuron spend on repeated identical prompts. The app also forwards <code>x-session-affinity</code>, which improves Workers AI prefix-cache hit rates.</li>
</ul>

<div class="callout">If you only need OpenAI-compatible access to free Workers AI models, you do not need AI Gateway. Add it when you want observability, caching, retries across providers, or prepaid billing for frontier models.</div>

<h2>When to use which</h2>
<ul>
<li>Use <strong>Workers AI directly</strong> for simple, cost-controlled, free-tier usage — the default here.</li>
<li>Use <strong>AI Gateway in front of Workers AI</strong> for logs, latency metrics, cache controls and rate limiting.</li>
<li>Use <strong>AI Gateway with other providers</strong> when you want one control plane across Workers AI, OpenAI, Anthropic and others.</li>
<li>Use <strong>AI Gateway unified billing</strong> only if you intentionally move beyond the free allocation; paid-only frontier models require it or a Workers Paid plan.</li>
</ul>
<p class="tiny">Sources: Cloudflare Workers AI pricing, limits, errors and OpenAI-compatibility docs; AI Gateway Workers AI provider docs. Checked October 2026.</p>
</article>`;

const VS_ZH = `<article class="docs wrap">
<h1>Workers AI 与 AI Gateway</h1>
<p>这是两个不同的层。Workers AI <em>运行</em>模型；AI Gateway <em>控制</em>发往模型的请求——包括 Workers AI 和外部提供商。它们可以组合使用，但不是互相替代。</p>

<h2>一句话区分</h2>
<table><thead><tr><th></th><th>Workers AI</th><th>AI Gateway</th></tr></thead><tbody>
<tr><td><strong>是什么</strong></td><td>Cloudflare GPU 上的无服务器推理，以及模型目录。</td><td>位于 AI 提供商前面的代理 / 控制平面。</td></tr>
<tr><td><strong>运行模型？</strong></td><td>是。Cloudflare 托管模型与合作伙伴模型。</td><td>否。它转发到 Workers AI、OpenAI、Anthropic、Google 等。</td></tr>
<tr><td><strong>计费</strong></td><td>按 Neurons。每 1,000 Neurons $0.011；每天 10,000 免费 Neurons，UTC 00:00 重置。</td><td>标准计划下网关本身免费。可为 Workers AI 前沿模型启用预付“统一计费”额度。</td></tr>
<tr><td><strong>免费额度</strong></td><td>每天 10,000 Neurons。部分模型需要 Workers Paid 或 AI Gateway 预付额度。</td><td>不增加免费推理。缓存可以避免重复推理成本。</td></tr>
<tr><td><strong>核心能力</strong></td><td>模型目录、OpenAI 兼容对话 / 向量、原生 run API、函数调用、LoRA、批处理、提示缓存。</td><td>分析、日志、缓存、限流、重试 / 故障转移、护栏、动态路由、统一计费。</td></tr>
<tr><td><strong>认证</strong></td><td>具备 Workers AI 权限的 Cloudflare API Token。</td><td>Cloudflare API Token；可选的网关认证 Token。</td></tr>
</tbody></table>

<h2>它们如何连接</h2>
<p>在同一个 Cloudflare API URL 上添加 <code>cf-aig-gateway-id</code> 请求头，就能让 Workers AI 请求经过网关。模型仍在 Workers AI 上运行，仍然消耗 Neurons；网关只负责观察和控制请求。</p>
<pre><code>POST https://api.cloudflare.com/client/v4/accounts/&lt;account_id&gt;/ai/v1/chat/completions
Authorization: Bearer &lt;api_token&gt;
cf-aig-gateway-id: default

{"model":"@cf/zai-org/glm-4.7-flash","messages":[...]}</code></pre>
<p>Workers AI 也提供绑定调用方式（<code>env.AI.run(model, input, { gateway: { id, skipCache, cacheTtl } })</code>），AI Gateway 还有自己的 REST 基础地址。本项目使用请求头方式，因为它让所有账号共用同一条上游路径，并且兼容 REST API。</p>

<h2>本项目如何使用</h2>
<ul>
<li><strong>Workers AI 是推理提供方。</strong>所有模型调用都发送到 <code>api.cloudflare.com/client/v4/accounts/{id}/ai/...</code>。</li>
<li><strong>AI Gateway 是可选项。</strong>在管理后台填写网关 ID 后，每个请求都会带上 <code>cf-aig-gateway-id</code>，从而获得网关分析、缓存与日志，不改变模型与额度模型。</li>
<li>网关<strong>不会</strong>绕过免费 Neuron 上限。本地额度保护仍会按账号、按天预留并结算 Neurons。</li>
<li>网关缓存可以减少重复提示的 Neuron 消耗。本项目还会转发 <code>x-session-affinity</code>，提升 Workers AI 前缀缓存的命中率。</li>
</ul>

<div class="callout">如果你只需要通过 OpenAI 兼容接口访问免费 Workers AI 模型，不需要 AI Gateway。需要可观测性、缓存、跨提供商重试或前沿模型预付计费时，再接入它。</div>

<h2>如何选择</h2>
<ul>
<li>简单、可控、免费额度优先：<strong>直接使用 Workers AI</strong>——本项目的默认方式。</li>
<li>需要日志、延迟指标、缓存控制和限流：<strong>在 Workers AI 前加 AI Gateway</strong>。</li>
<li>需要同时管理 Workers AI、OpenAI、Anthropic 等：<strong>用 AI Gateway 统一控制面</strong>。</li>
<li>只有明确要超出免费额度时才使用 <strong>AI Gateway 统一计费</strong>；付费前沿模型需要它或 Workers Paid 计划。</li>
</ul>
<p class="tiny">来源：Cloudflare Workers AI 定价、限制、错误与 OpenAI 兼容文档；AI Gateway 的 Workers AI 提供商文档。核对时间：2026 年 10 月。</p>
</article>`;

const API_EN = `<article class="docs wrap">
<h1>API reference</h1>
<p>Base URL: <code>https://&lt;your-worker&gt;/v1</code>. Authenticate with <code>Authorization: Bearer sk-wa-…</code> or <code>x-api-key</code>. If no keys exist and <code>allowPublic</code> is off, requests are rejected.</p>
<pre><code>curl https://your-worker/v1/models \\
  -H "Authorization: Bearer $KEY"</code></pre>

<h2>Endpoints</h2>
<table><thead><tr><th>Method</th><th>Path</th><th>Purpose</th></tr></thead><tbody>
<tr><td>GET</td><td><code>/v1/models</code></td><td>Dynamic free catalog, sorted by estimated performance. Supports <code>task</code>, <code>search</code>, <code>sort</code> and <code>limit</code>.</td></tr>
<tr><td>GET</td><td><code>/v1/models/{id}</code></td><td>One model with pricing, capabilities and rank.</td></tr>
<tr><td>POST</td><td><code>/v1/chat/completions</code></td><td>OpenAI chat, streaming SSE, tools, vision where supported.</td></tr>
<tr><td>POST</td><td><code>/v1/completions</code></td><td>Legacy text completion adapter (non-streaming).</td></tr>
<tr><td>POST</td><td><code>/v1/responses</code></td><td>OpenAI Responses API for GPT-OSS models (non-streaming).</td></tr>
<tr><td>POST</td><td><code>/v1/embeddings</code></td><td>Text embeddings.</td></tr>
<tr><td>POST</td><td><code>/v1/images/generations</code></td><td>Text-to-image, returns <code>b64_json</code>.</td></tr>
<tr><td>POST</td><td><code>/v1/audio/transcriptions</code></td><td>Multipart audio transcription.</td></tr>
<tr><td>POST</td><td><code>/v1/audio/speech</code></td><td>Text-to-speech, returns audio bytes.</td></tr>
<tr><td>POST</td><td><code>/v1/rerank</code></td><td>Jina/Cohere-style rerank.</td></tr>
<tr><td>POST</td><td><code>/v1/run</code></td><td>Generic <code>{model, inputs}</code> passthrough for any catalog task.</td></tr>
<tr><td>POST</td><td><code>/v1/messages</code></td><td>Anthropic Messages API, including streaming and tools.</td></tr>
<tr><td>POST</td><td><code>/v1/messages/count_tokens</code></td><td>Approximate token count.</td></tr>
</tbody></table>

<h2>Model objects</h2>
<p><code>/v1/models</code> returns standard OpenAI fields plus live metadata:</p>
<pre><code>{
  "id": "@cf/zai-org/glm-4.7-flash",
  "object": "model",
  "owned_by": "Zhipu AI",
  "task": "text-generation",
  "context_window": 131072,
  "capabilities": {"reasoning": true, "function_calling": true, ...},
  "pricing": {
    "tokens": {
      "input_usd_per_million": 0.06,
      "output_usd_per_million": 0.4,
      "input_neurons_per_million": 5500,
      "output_neurons_per_million": 36400
    },
    "display": "$0.06 / input · $0.4 / output"
  },
  "free": true,
  "requires_paid": false,
  "deprecated": false,
  "free_daily_output_tokens": 274725,
  "performance": {"score": 50.9, "tier": "B", "rank": 7, "basis": [...]}
}</code></pre>
<p>Paid-only models are hidden from <code>/v1/models</code> and rejected by the proxy. They remain visible in the admin model browser. Deprecated models stay callable during Cloudflare's grace period and carry <code>"deprecated": true</code>.</p>

<h2>Chat example</h2>
<pre><code>curl https://your-worker/v1/chat/completions \\
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\
  -d '{
    "model": "@cf/zai-org/glm-4.7-flash",
    "messages": [{"role":"user","content":"Explain neurons in one paragraph."}],
    "stream": true
  }'</code></pre>
<p>Short names are accepted when unique: <code>"model":"glm-4.7-flash"</code>. Add aliases in settings if you want stable client-facing names.</p>

<h2>Quota and errors</h2>
<p>Successful responses include <code>x-workers-ai-model</code>, <code>x-workers-ai-account</code>, <code>x-quota-remaining</code> and <code>x-quota-limit</code>.</p>
<table><thead><tr><th>Status</th><th>Code</th><th>Meaning</th></tr></thead><tbody>
<tr><td>401</td><td><code>invalid_api_key</code></td><td>Missing/incorrect key, or no keys exist while public access is disabled.</td></tr>
<tr><td>403</td><td><code>model_requires_paid_plan</code></td><td>Model needs Workers Paid or AI Gateway prepaid credits.</td></tr>
<tr><td>404</td><td><code>model_not_found</code></td><td>Not in the live free catalog.</td></tr>
<tr><td>429</td><td><code>insufficient_quota</code></td><td>All accounts exhausted their daily free allocation (Cloudflare code 3036) or the request estimate exceeds the daily budget.</td></tr>
<tr><td>429</td><td><code>capacity_exceeded</code></td><td>Workers AI is temporarily out of capacity (code 3040). Retry later.</td></tr>
<tr><td>502</td><td><code>upstream_error</code></td><td>Cloudflare returned an unexpected error.</td></tr>
</tbody></table>

<h2>AI Gateway</h2>
<p>Set a gateway id in Settings to add <code>cf-aig-gateway-id</code> to every upstream request. Optional client headers <code>cf-aig-cache-ttl</code>, <code>cf-aig-cache-key</code> and <code>cf-aig-skip-cache</code> are forwarded only when a gateway is configured. <code>x-session-affinity</code> is always forwarded to improve prefix caching.</p>
</article>`;

const API_ZH = `<article class="docs wrap">
<h1>接口参考</h1>
<p>基础地址：<code>https://&lt;your-worker&gt;/v1</code>。使用 <code>Authorization: Bearer sk-wa-…</code> 或 <code>x-api-key</code> 认证。如果没有任何密钥且 <code>allowPublic</code> 关闭，请求会被拒绝。</p>
<pre><code>curl https://your-worker/v1/models \\
  -H "Authorization: Bearer $KEY"</code></pre>

<h2>端点</h2>
<table><thead><tr><th>方法</th><th>路径</th><th>用途</th></tr></thead><tbody>
<tr><td>GET</td><td><code>/v1/models</code></td><td>动态免费目录，按估算性能排序。支持 <code>task</code>、<code>search</code>、<code>sort</code>、<code>limit</code>。</td></tr>
<tr><td>GET</td><td><code>/v1/models/{id}</code></td><td>单个模型的价格、能力与排名。</td></tr>
<tr><td>POST</td><td><code>/v1/chat/completions</code></td><td>OpenAI 对话，支持 SSE 流式、工具，以及模型支持的视觉输入。</td></tr>
<tr><td>POST</td><td><code>/v1/completions</code></td><td>旧版文本补全适配（非流式）。</td></tr>
<tr><td>POST</td><td><code>/v1/responses</code></td><td>GPT-OSS 模型的 OpenAI Responses API（非流式）。</td></tr>
<tr><td>POST</td><td><code>/v1/embeddings</code></td><td>文本向量。</td></tr>
<tr><td>POST</td><td><code>/v1/images/generations</code></td><td>文本生图，返回 <code>b64_json</code>。</td></tr>
<tr><td>POST</td><td><code>/v1/audio/transcriptions</code></td><td>multipart 音频转写。</td></tr>
<tr><td>POST</td><td><code>/v1/audio/speech</code></td><td>文本转语音，返回音频字节。</td></tr>
<tr><td>POST</td><td><code>/v1/rerank</code></td><td>Jina / Cohere 风格重排。</td></tr>
<tr><td>POST</td><td><code>/v1/run</code></td><td>通用 <code>{model, inputs}</code> 透传，适用于目录中的任意任务。</td></tr>
<tr><td>POST</td><td><code>/v1/messages</code></td><td>Anthropic Messages API，支持流式与工具。</td></tr>
<tr><td>POST</td><td><code>/v1/messages/count_tokens</code></td><td>近似 token 计数。</td></tr>
</tbody></table>

<h2>模型对象</h2>
<p><code>/v1/models</code> 返回标准 OpenAI 字段以及实时元数据：</p>
<pre><code>{
  "id": "@cf/zai-org/glm-4.7-flash",
  "object": "model",
  "owned_by": "Zhipu AI",
  "task": "text-generation",
  "context_window": 131072,
  "capabilities": {"reasoning": true, "function_calling": true, ...},
  "pricing": {
    "tokens": {
      "input_usd_per_million": 0.06,
      "output_usd_per_million": 0.4,
      "input_neurons_per_million": 5500,
      "output_neurons_per_million": 36400
    },
    "display": "$0.06 / input · $0.4 / output"
  },
  "free": true,
  "requires_paid": false,
  "deprecated": false,
  "free_daily_output_tokens": 274725,
  "performance": {"score": 50.9, "tier": "B", "rank": 7, "basis": [...]}
}</code></pre>
<p>付费模型不会出现在 <code>/v1/models</code> 中，代理也会拒绝它们；它们仍可在管理后台查看。已弃用模型在 Cloudflare 的宽限期内仍可调用，并带有 <code>"deprecated": true</code>。</p>

<h2>对话示例</h2>
<pre><code>curl https://your-worker/v1/chat/completions \\
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\
  -d '{
    "model": "@cf/zai-org/glm-4.7-flash",
    "messages": [{"role":"user","content":"用一段话解释 Neurons。"}],
    "stream": true
  }'</code></pre>
<p>短名称在唯一时会自动匹配：<code>"model":"glm-4.7-flash"</code>。需要稳定的客户端名称时，可在设置中配置别名。</p>

<h2>额度与错误</h2>
<p>成功响应会包含 <code>x-workers-ai-model</code>、<code>x-workers-ai-account</code>、<code>x-quota-remaining</code> 和 <code>x-quota-limit</code>。</p>
<table><thead><tr><th>状态</th><th>代码</th><th>含义</th></tr></thead><tbody>
<tr><td>401</td><td><code>invalid_api_key</code></td><td>密钥缺失或错误；或没有任何密钥且公开访问关闭。</td></tr>
<tr><td>403</td><td><code>model_requires_paid_plan</code></td><td>模型需要 Workers Paid 或 AI Gateway 预付额度。</td></tr>
<tr><td>404</td><td><code>model_not_found</code></td><td>不在实时免费目录中。</td></tr>
<tr><td>429</td><td><code>insufficient_quota</code></td><td>所有账号的每日免费额度已耗尽（Cloudflare 错误码 3036），或请求估算超过每日预算。</td></tr>
<tr><td>429</td><td><code>capacity_exceeded</code></td><td>Workers AI 暂时容量不足（错误码 3040），稍后重试。</td></tr>
<tr><td>502</td><td><code>upstream_error</code></td><td>Cloudflare 返回了意外错误。</td></tr>
</tbody></table>

<h2>AI Gateway</h2>
<p>在设置中填写网关 ID 后，所有上游请求都会带上 <code>cf-aig-gateway-id</code>。只有在配置了网关时，客户端的 <code>cf-aig-cache-ttl</code>、<code>cf-aig-cache-key</code> 和 <code>cf-aig-skip-cache</code> 才会被转发。<code>x-session-affinity</code> 始终转发，用于提升前缀缓存命中率。</p>
</article>`;

const FREE_EN = `<article class="docs wrap">
<h1>The hard free-tier guard</h1>
<p>Cloudflare gives every account <strong>10,000 neurons per day</strong> at no charge, resetting at <strong>00:00 UTC</strong>. The app treats that as a hard ceiling, not a suggestion.</p>

<h2>How a request is accounted</h2>
<ol>
<li><strong>Estimate.</strong> The proxy estimates prompt tokens (over-estimating at ~3.6 chars/token plus 850 tokens per image) and output tokens (<code>max_tokens</code>, or the configured default). It multiplies by the model's live neuron rates.</li>
<li><strong>Reserve.</strong> A Durable Object atomically checks <code>used + reserved + estimate ≤ limit</code>. If it passes, the amount is reserved before any upstream call.</li>
<li><strong>Call with failover.</strong> If an account has no quota or returns 3036, the next account is tried. Other 429/5xx errors also fail over; client errors (400/404/413) do not.</li>
<li><strong>Settle.</strong> After the body is consumed, actual <code>usage</code> tokens are converted to neurons and the reservation is released. Streaming responses settle when the stream flushes.</li>
<li><strong>Reconcile.</strong> The usage tab queries Cloudflare GraphQL analytics (<code>aiInferenceAdaptiveGroups</code>) and takes the higher of local and cloud usage. This catches usage from the dashboard/playground or other apps.</li>
</ol>

<div class="callout">If the Durable Object binding is missing, the app falls back to KV accounting. It still enforces the cap best-effort, but KV is not atomic under concurrency. Bind <code>QUOTA</code> for a strict guarantee.</div>

<h2>Why reserve the maximum?</h2>
<p>Cloudflare bills after inference; there is no pre-flight neuron quote. Reserving an upper bound means concurrent requests cannot collectively overshoot. If the model produces fewer tokens, the difference is released at settlement. A crash between reserve and settle leaves the reservation in place until the UTC day rolls over — a fail-safe direction.</p>

<h2>What is excluded</h2>
<p>Cloudflare marks certain models as requiring a Workers Paid plan or AI Gateway prepaid credits. They are <strong>not</strong> in the free catalog and the proxy rejects them with <code>403 model_requires_paid_plan</code>. The list is parsed from the live pricing page, not hardcoded; as of October 2026 it includes Kimi K2.6/K2.7, GLM-5.2/5.3/5.3-Flash, and DeepSeek V4 Flash/Pro variants.</p>

<h2>Catalog coverage</h2>
<p>The catalog merges the native <code>/ai/models/search</code> response (authoritative task names) with the OpenRouter-shaped response (pricing, context, modalities), then enriches it with the public docs snapshot. It includes Cloudflare-hosted and partner models: Meta, Mistral, Qwen, Google, OpenAI, DeepSeek, Moonshot, Zhipu, Deepgram, Black Forest Labs, Leonardo, RunwayML, Stability, IBM, NVIDIA, BAAI and others. External providers reached through AI Gateway (OpenAI, Anthropic, Google APIs) are <strong>not</strong> Workers AI models and are not part of the free neuron pool.</p>

<h2>Tuning</h2>
<ul>
<li><code>settings.dailyNeurons</code> defaults to 10,000 and cannot exceed <code>MAX_DAILY_NEURONS</code> (default 10,000).</li>
<li><code>settings.defaultMaxOutputTokens</code> controls the reservation when clients omit <code>max_tokens</code>. Lower it if you see avoidable quota rejections.</li>
<li>Larger contexts can exceed the entire daily allowance in one request. The proxy rejects those with an explicit estimate before calling upstream.</li>
<li>With multiple accounts, the aggregate budget is <code>accounts × 10,000</code>; each account is tracked separately.</li>
</ul>

<h2>What it does not do</h2>
<p>It does not create free quota, bypass Cloudflare's rate limits, or make paid-only models free. It only ensures this app never intentionally spends past the free allocation.</p>
</article>`;

const FREE_ZH = `<article class="docs wrap">
<h1>免费额度硬保护</h1>
<p>Cloudflare 为每个账号提供<strong>每天 10,000 Neurons</strong> 的免费额度，在 <strong>UTC 00:00</strong> 重置。本项目把它当作硬上限，而不是建议值。</p>

<h2>一次请求如何记账</h2>
<ol>
<li><strong>估算。</strong>代理会估算提示 tokens（按约 3.6 字符/token，每张图片额外 850 tokens 进行高估）和输出 tokens（<code>max_tokens</code> 或配置的默认值），再乘以模型的实时 Neuron 费率。</li>
<li><strong>预留。</strong>Durable Object 原子检查 <code>已用 + 预留 + 估算 ≤ 上限</code>。通过后才在调用上游之前预留额度。</li>
<li><strong>带故障转移调用。</strong>某个账号没有额度或返回 3036 时，自动尝试下一个账号。其他 429/5xx 也会转移；客户端错误（400/404/413）不会。</li>
<li><strong>结算。</strong>响应体消费完成后，用实际 <code>usage</code> tokens 换算 Neurons 并释放预留。流式响应在流结束时结算。</li>
<li><strong>核对。</strong>用量页会查询 Cloudflare GraphQL 分析（<code>aiInferenceAdaptiveGroups</code>），取本地与云端用量的较大值。这样能覆盖 Dashboard / Playground 或其他应用的消耗。</li>
</ol>

<div class="callout">如果缺少 Durable Object 绑定，应用会退化为 KV 记账。它仍会尽力执行上限，但 KV 在并发下不是原子的。需要严格保证时请绑定 <code>QUOTA</code>。</div>

<h2>为什么要按最大值预留？</h2>
<p>Cloudflare 在推理完成后才计费，没有调用前的 Neuron 报价。预留上界可以确保并发请求不会合计超支。如果模型实际输出更少，差额会在结算时释放。如果在预留与结算之间崩溃，预留会保留到 UTC 跨天——这是偏安全的失败方向。</p>

<h2>哪些模型被排除</h2>
<p>Cloudflare 将部分模型标记为需要 Workers Paid 计划或 AI Gateway 预付额度。它们<strong>不会</strong>进入免费目录，代理会以 <code>403 model_requires_paid_plan</code> 拒绝。名单从实时定价页解析，而非硬编码；截至 2026 年 10 月包括 Kimi K2.6/K2.7、GLM-5.2/5.3/5.3-Flash，以及 DeepSeek V4 Flash/Pro 系列。</p>

<h2>目录覆盖范围</h2>
<p>目录会合并原生 <code>/ai/models/search</code> 响应（权威任务名称）与 OpenRouter 形状的响应（价格、上下文、模态），再补充公开文档快照。它包含 Cloudflare 托管模型与合作伙伴模型：Meta、Mistral、Qwen、Google、OpenAI、DeepSeek、Moonshot、Zhipu、Deepgram、Black Forest Labs、Leonardo、RunwayML、Stability、IBM、NVIDIA、BAAI 等。通过 AI Gateway 访问的外部提供商（OpenAI、Anthropic、Google API）<strong>不是</strong> Workers AI 模型，也不属于免费 Neuron 池。</p>

<h2>调优</h2>
<ul>
<li><code>settings.dailyNeurons</code> 默认 10,000，且不能超过 <code>MAX_DAILY_NEURONS</code>（默认 10,000）。</li>
<li><code>settings.defaultMaxOutputTokens</code> 控制客户端未传 <code>max_tokens</code> 时的预留量。如果经常出现可避免的额度拒绝，可以调低它。</li>
<li>较大的上下文可能在一次请求中耗尽整日额度。代理会在调用上游前用明确估算拒绝这类请求。</li>
<li>多账号时总预算是 <code>账号数 × 10,000</code>；每个账号单独记账。</li>
</ul>

<h2>它不做什么</h2>
<p>它不会创造免费额度、绕过 Cloudflare 的速率限制，也不会让付费模型变免费。它只保证本应用不会主动花超免费额度。</p>
</article>`;

const DOCS = {
	'workers-ai-vs-ai-gateway': {
		en: { title: 'Workers AI vs AI Gateway — Workers AI2API', html: VS_EN },
		zh: { title: 'Workers AI 与 AI Gateway — Workers AI2API', html: VS_ZH },
	},
	api: {
		en: { title: 'API reference — Workers AI2API', html: API_EN },
		zh: { title: '接口参考 — Workers AI2API', html: API_ZH },
	},
	'free-tier': {
		en: { title: 'Free-tier guard — Workers AI2API', html: FREE_EN },
		zh: { title: '免费额度硬保护 — Workers AI2API', html: FREE_ZH },
	},
};

export function handleDocsPage(slug, request) {
	const doc = DOCS[slug];
	if (!doc) return null;
	const lang = request ? resolveLang(request) : 'zh';
	const content = doc[lang] || doc.en;
	const body = `${docsNav(lang)}<main>${wrapTables(content.html)}</main><footer><div class="wrap">${t(lang, 'docs.footer')}</div></footer>`;
	return shell({ title: content.title, body, lang });
}
