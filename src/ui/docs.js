import { NAV, shell } from './pages.js';

const nav = `${NAV}<div class="wrap" style="padding-top:14px"><a class="tiny" href="/">← Home</a> <span class="tiny">/</span> <a class="tiny" href="/docs/api">API</a> <span class="tiny">/</span> <a class="tiny" href="/docs/free-tier">Free tier</a> <span class="tiny">/</span> <a class="tiny" href="/docs/workers-ai-vs-ai-gateway">Workers AI vs AI Gateway</a></div>`;

const DOCS = {
	'workers-ai-vs-ai-gateway': {
		title: 'Workers AI vs AI Gateway — Workers AI2API',
		html: `<article class="docs wrap">
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
</article>`,
	},
	api: {
		title: 'API reference — Workers AI2API',
		html: `<article class="docs wrap">
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
  "free_daily_output_tokens": 274725,
  "performance": {"score": 50.9, "tier": "B", "rank": 7, "basis": [...]}
}</code></pre>
<p>Paid-only models are hidden from <code>/v1/models</code> and rejected by the proxy. They remain visible in the admin model browser.</p>

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
</article>`,
	},
	'free-tier': {
		title: 'Free-tier guard — Workers AI2API',
		html: `<article class="docs wrap">
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

<h2>Tuning</h2>
<ul>
<li><code>settings.dailyNeurons</code> defaults to 10,000 and cannot exceed <code>MAX_DAILY_NEURONS</code> (default 10,000).</li>
<li><code>settings.defaultMaxOutputTokens</code> controls the reservation when clients omit <code>max_tokens</code>. Lower it if you see avoidable quota rejections.</li>
<li>Larger contexts can exceed the entire daily allowance in one request. The proxy rejects those with an explicit estimate before calling upstream.</li>
<li>With multiple accounts, the aggregate budget is <code>accounts × 10,000</code>; each account is tracked separately.</li>
</ul>

<h2>What it does not do</h2>
<p>It does not create free quota, bypass Cloudflare's rate limits, or make paid-only models free. It only ensures this app never intentionally spends past the free allocation.</p>
</article>`,
	},
};

export function handleDocsPage(slug) {
	const doc = DOCS[slug];
	if (!doc) return null;
	const body = `${nav}<main>${doc.html}</main><footer><div class="wrap">Workers AI2API v2 · Prices and limits belong to Cloudflare.</div></footer>`;
	return shell({ title: doc.title, body });
}
