/*! Workers AI2API v2.0.0 — independent project, MIT */

// src/utils.js
function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}
function openAIError(message, {
  status = 400,
  type = "invalid_request_error",
  code = null,
  param = null,
  extra = {}
} = {}) {
  return json({
    error: {
      message,
      type,
      param,
      code,
      ...extra
    }
  }, { status });
}
var RequestError = class extends Error {
  constructor(message, { status = 400, type = "invalid_request_error", code = null, param = null, extra = {}, headers = {} } = {}) {
    super(message);
    this.name = "RequestError";
    this.status = status;
    this.type = type;
    this.code = code;
    this.param = param;
    this.extra = extra;
    this.headers = headers;
  }
  toResponse() {
    return json({
      error: { message: this.message, type: this.type, param: this.param, code: this.code, ...this.extra }
    }, { status: this.status, headers: this.headers });
  }
};
function cors(response, request) {
  const origin = request?.headers?.get("Origin") || "*";
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key, x-session-affinity, anthropic-version, anthropic-beta");
  headers.set("Access-Control-Expose-Headers", "x-workers-ai-model, x-workers-ai-account, x-quota-remaining, x-quota-limit, x-request-id");
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function preflight(request) {
  return cors(new Response(null, { status: 204 }), request);
}
async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomId(prefix = "") {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return prefix ? `${prefix}${hex}` : hex;
}
function timingSafeEqual(a, b) {
  const left = new TextEncoder().encode(String(a ?? ""));
  const right = new TextEncoder().encode(String(b ?? ""));
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}
function bearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return null;
}
function utcDay(date = /* @__PURE__ */ new Date()) {
  return date.toISOString().slice(0, 10);
}
function estimateTokens(value) {
  let chars = 0;
  let images = 0;
  const walk = (node) => {
    if (node == null) return;
    if (typeof node === "string") {
      chars += node.length;
      return;
    }
    if (typeof node === "number" || typeof node === "boolean") {
      chars += String(node).length;
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node === "object") {
      if (node.type === "image_url" || node.type === "image" || node.image_url || node.source?.type === "base64") {
        images += 1;
      }
      for (const [key, item] of Object.entries(node)) {
        chars += key.length;
        walk(item);
      }
    }
  };
  walk(value);
  return Math.ceil(chars / 3.6) + images * 850;
}
function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

// src/config.js
var CONFIG_KEY = "config:v2";
var LEGACY_CONFIG_KEY = "config";
var DEFAULT_SETTINGS = {
  /** Optional AI Gateway id. Adds `cf-aig-gateway-id` to upstream requests. */
  gatewayId: "",
  gatewaySkipCache: false,
  /** Allow unauthenticated /v1 access when no API keys exist. */
  allowPublic: false,
  /** Hard cap per Cloudflare account, per UTC day. Never raise above your plan's free allocation. */
  dailyNeurons: 1e4,
  /** Default max output tokens used for quota reservation when a client omits max_tokens. */
  defaultMaxOutputTokens: 1024,
  /** Optional map of alias -> @cf model id. */
  aliases: {},
  /** Optional map of model id -> performance score (0-100), for operators with their own evals. */
  benchmarks: {}
};
var memory = { config: null, expires: 0 };
function defaultConfig() {
  return {
    version: 2,
    accounts: [],
    apiKeys: [],
    settings: { ...DEFAULT_SETTINGS }
  };
}
function normalizeAccount(account, index) {
  const accountId = String(account.accountId || account.account_id || "").trim();
  const apiToken = String(account.apiToken || account.api_token || account.token || "").trim();
  return {
    id: account.id || accountId || `account-${index + 1}`,
    name: String(account.name || `Account ${index + 1}`).trim(),
    accountId,
    apiToken,
    status: account.status === "disabled" ? "disabled" : "active",
    createdAt: account.createdAt || (/* @__PURE__ */ new Date()).toISOString()
  };
}
function normalizeConfig(input) {
  const base = defaultConfig();
  const data = isPlainObject(input) ? input : {};
  const accounts = Array.isArray(data.accounts) ? data.accounts.map(normalizeAccount) : [];
  const apiKeys = Array.isArray(data.apiKeys) ? data.apiKeys.map((key) => ({
    id: key.id || key.key || `key-${Math.random().toString(36).slice(2)}`,
    name: String(key.name || "API key"),
    hash: key.hash || null,
    // Legacy plaintext keys are migrated lazily in getConfig().
    legacyKey: key.hash ? null : key.key || null,
    prefix: key.prefix || (key.key ? String(key.key).slice(0, 10) : "sk-wa-"),
    last4: key.last4 || (key.key ? String(key.key).slice(-4) : ""),
    createdAt: key.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    lastUsedAt: key.lastUsedAt || null,
    enabled: key.enabled !== false
  })) : [];
  const settings = {
    ...DEFAULT_SETTINGS,
    ...isPlainObject(data.settings) ? data.settings : {},
    aliases: {
      ...isPlainObject(data.settings?.aliases) ? data.settings.aliases : {},
      ...isPlainObject(data.aliases) ? data.aliases : {},
      ...isPlainObject(data.customModelMap) ? data.customModelMap : {}
    },
    benchmarks: {
      ...isPlainObject(data.settings?.benchmarks) ? data.settings.benchmarks : {}
    }
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
async function getConfig(env, { force = false } = {}) {
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
    const config2 = normalizeConfig(legacy);
    await env.KV.put(CONFIG_KEY, JSON.stringify(config2));
    const migrated = await migrateLegacyKeys(env, config2);
    memory = { config: migrated, expires: now + 3e4 };
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
  memory = { config, expires: now + 3e4 };
  return config;
}
async function saveConfig(env, config) {
  const normalized = normalizeConfig(config);
  await env.KV.put(CONFIG_KEY, JSON.stringify(normalized));
  memory = { config: normalized, expires: Date.now() + 3e4 };
  return normalized;
}
async function updateConfig(env, updater) {
  const config = await getConfig(env, { force: true });
  const next = updater(structuredClone(config)) || config;
  return saveConfig(env, next);
}
async function getAccounts(env) {
  const config = await getConfig(env);
  return config.accounts;
}
async function getActiveAccounts(env) {
  const config = await getConfig(env);
  return config.accounts.filter((account) => account.status === "active" && account.accountId && account.apiToken);
}
async function getSettings(env) {
  const config = await getConfig(env);
  return config.settings;
}

// src/auth.js
function hasAdminPassword(env) {
  return Boolean(env.ADMIN_PASSWORD && String(env.ADMIN_PASSWORD).trim());
}
async function adminToken(env) {
  return sha256Hex(String(env.ADMIN_PASSWORD).trim());
}
async function isAdmin(request, env) {
  if (!hasAdminPassword(env)) return false;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : bearerToken(request);
  if (!token) return false;
  return timingSafeEqual(token, await adminToken(env));
}
function adminCookie(token, { clear = false, secure = true } = {}) {
  const parts = [
    `admin_token=${clear ? "" : token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${clear ? 0 : 86400}`
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
async function verifyApiKey(request, env) {
  const config = await getConfig(env);
  const enabled = config.apiKeys.filter((key2) => key2.enabled !== false);
  if (enabled.length === 0) {
    if (config.settings.allowPublic) return { ok: true, key: null, public: true };
    return { ok: false, reason: "no_keys" };
  }
  const provided = request.headers.get("x-api-key") || bearerToken(request);
  if (!provided) return { ok: false, reason: "missing" };
  const hash = await sha256Hex(provided);
  const key = enabled.find((item) => item.hash && timingSafeEqual(item.hash, hash));
  if (!key) return { ok: false, reason: "invalid" };
  return { ok: true, key, public: false };
}

// src/catalog/pricing.js
var PRICING_URL = "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md";
var MODEL_ID_RE = /@cf\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+/;
function parseKind(text) {
  const value = text.toLowerCase();
  if (value.includes("cached input token")) return "cached_input_token";
  if (value.includes("input token")) return "input_token";
  if (value.includes("output token")) return "output_token";
  if (value.includes("audio minute")) return "audio_minute";
  if (value.includes("character")) return "character";
  if (value.includes("step")) {
    if (value.includes("input")) return "input_image_tile_step";
    if (value.includes("output")) return "output_image_tile_step";
    return "step";
  }
  if (value.includes("tile")) return "image_tile";
  if (value.includes("image")) return "image";
  if (value.includes("megapixel") || value.includes("mp")) return "image_megapixel";
  return "unknown";
}
function parseSegments(cell) {
  return String(cell).split(/<br\s*\/?>/i).map((part) => part.trim()).filter(Boolean).map((part) => {
    const numberMatch = part.match(/([\d.]+)/);
    if (!numberMatch) return null;
    const value = Number(numberMatch[1]);
    if (!Number.isFinite(value)) return null;
    const descriptor = part.replace(/^\$?\s*[\d.]+\s*/, "").trim();
    const isNeurons = /neuron/i.test(descriptor);
    return {
      value,
      descriptor,
      kind: parseKind(descriptor),
      isNeurons,
      raw: part
    };
  }).filter(Boolean);
}
function displayFor(items) {
  const labels = {
    input_token: "input",
    output_token: "output",
    cached_input_token: "cached input",
    audio_minute: "audio minute",
    character: "1k chars",
    step: "step",
    image_tile: "tile",
    image: "image",
    image_megapixel: "MP",
    input_image_tile_step: "input tile/step",
    output_image_tile_step: "output tile/step"
  };
  return items.map((item) => `$${item.usd} / ${labels[item.kind] || item.kind}`).join(" \xB7 ");
}
function parsePricingMarkdown(markdown) {
  const models = {};
  const text = String(markdown || "");
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 2) continue;
    const modelId = cells[0].match(MODEL_ID_RE)?.[0];
    if (!modelId) continue;
    if (/websocket/i.test(cells[0]) && !models[modelId]) {
    }
    const usdSegments = parseSegments(cells[1]).filter((item) => !item.isNeurons);
    const neuronSegments = parseSegments(cells[2] || "").filter((item) => item.isNeurons);
    const items = [];
    const length = Math.max(usdSegments.length, neuronSegments.length);
    for (let i = 0; i < length; i += 1) {
      const usd = usdSegments[i];
      const neurons = neuronSegments[i];
      if (!usd && !neurons) continue;
      const kind = usd?.kind !== "unknown" ? usd.kind : neurons?.kind;
      items.push({
        kind: kind || "unknown",
        usd: usd?.value ?? null,
        neurons: neurons?.value ?? null,
        unit: usd?.descriptor || neurons?.descriptor || ""
      });
    }
    if (items.length === 0) continue;
    if (models[modelId] && /websocket/i.test(cells[0])) {
      models[`${modelId}#websocket`] = { items, display: displayFor(items), source: PRICING_URL };
      continue;
    }
    if (models[modelId]) continue;
    const tokens = {};
    const byKind = Object.fromEntries(items.map((item) => [item.kind, item]));
    const usdToNeurons = (usd) => Math.ceil(usd * (1e6 / 11));
    if (byKind.input_token) {
      tokens.input_usd_per_million = byKind.input_token.usd;
      tokens.input_neurons_per_million = byKind.input_token.neurons ?? usdToNeurons(byKind.input_token.usd);
    }
    if (byKind.output_token) {
      tokens.output_usd_per_million = byKind.output_token.usd;
      tokens.output_neurons_per_million = byKind.output_token.neurons ?? usdToNeurons(byKind.output_token.usd);
    }
    if (byKind.cached_input_token) {
      tokens.cached_input_usd_per_million = byKind.cached_input_token.usd;
      tokens.cached_input_neurons_per_million = byKind.cached_input_token.neurons ?? usdToNeurons(byKind.cached_input_token.usd);
    }
    models[modelId] = {
      items,
      tokens,
      display: displayFor(items),
      source: PRICING_URL
    };
  }
  const paidMatch = text.match(/Some models require a paid billing method[\s\S]*?This applies to([\s\S]*?)\.\s*You can access/i);
  const paidOnly = paidMatch ? [...paidMatch[1].matchAll(/`(@cf\/[^`]+)`/g)].map((match) => match[1].trim()) : [];
  const freeMatch = text.match(/([\d,]+)\s+Neurons per day/i);
  const freeDailyNeurons = freeMatch ? Number(freeMatch[1].replace(/,/g, "")) : null;
  const updatedMatch = text.match(/Last updated\s+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/i);
  return {
    models,
    paidOnly,
    freeDailyNeurons,
    updatedAt: updatedMatch?.[1] || null,
    source: PRICING_URL
  };
}

// src/catalog/ranking.js
var SIZE_MIN = 7;
var SIZE_MAX = 12.1;
function shortModelId(id) {
  return String(id || "").split("/").pop();
}
function extractSizes(text) {
  if (!text) return { total: null, active: null };
  const value = String(text).toLowerCase();
  const moe = value.match(/(\d+(?:\.\d+)?)\s*b\s*[-_/ ]?a\s*(\d+(?:\.\d+)?)\s*b/);
  if (moe) return { total: Number(moe[1]), active: Number(moe[2]) };
  const backbone = value.match(/(\d+(?:\.\d+)?)\s*b\s*(?:backbone\s*)?param/);
  if (backbone) return { total: Number(backbone[1]), active: null };
  const all = [...value.matchAll(/(\d+(?:\.\d+)?)\s*b\b/g)].map((match) => Number(match[1])).filter((number) => number >= 0.3 && number <= 2e3);
  if (all.length) return { total: Math.max(...all), active: null };
  return { total: null, active: null };
}
function modelSizes(model) {
  const fromId = extractSizes(`${model?.id || ""} ${model?.name || ""}`);
  const fromDescription = extractSizes(model?.description || "");
  return {
    total: fromId.total || fromDescription.total || null,
    active: fromId.active || fromDescription.active || null
  };
}
function normalize(value, min, max) {
  return Math.max(0, Math.min(100, (value - min) / (max - min) * 100));
}
function recencyScore(model) {
  const raw = model?.created_at || model?.created || model?.release_date;
  const time = typeof raw === "number" ? raw * 1e3 : Date.parse(raw || "");
  if (!Number.isFinite(time)) return 45;
  const months = (Date.now() - time) / (1e3 * 60 * 60 * 24 * 30.44);
  return Math.max(0, Math.min(100, 100 - months * 2.2));
}
function priceScore(model) {
  const output = Number(model?.pricing?.tokens?.output_usd_per_million);
  if (!Number.isFinite(output) || output <= 0) return 45;
  return normalize(Math.log10(output), Math.log10(0.05), Math.log10(15));
}
function performanceScore(model, overrides = {}) {
  const sizes = modelSizes(model);
  const effectiveParams = sizes.active || sizes.total;
  const size = effectiveParams ? normalize(Math.log10(effectiveParams), SIZE_MIN, SIZE_MAX) : 40;
  const caps = model?.capabilities || {};
  let capability = 30;
  if (caps.reasoning) capability += 20;
  if (caps.function_calling) capability += 18;
  if (caps.vision) capability += 10;
  if (caps.structured_output) capability += 8;
  if (caps.audio_output || caps.audio_input) capability += 6;
  capability = Math.min(100, capability);
  const context = Number(model?.context_window) || 0;
  const contextScore = context > 0 ? normalize(Math.log10(context), Math.log10(4e3), Math.log10(1e6)) : 30;
  const recency = recencyScore(model);
  const price = priceScore(model);
  const override = overrides?.[model?.id] ?? overrides?.[shortModelId(model?.id)];
  const overrideScore = Number.isFinite(Number(override)) ? Number(override) : null;
  const weights = overrideScore == null ? { size: 0.35, capability: 0.25, context: 0.15, recency: 0.15, price: 0.1 } : { size: 0.18, capability: 0.14, context: 0.08, recency: 0.08, price: 0.07, override: 0.45 };
  const score = size * weights.size + capability * weights.capability + contextScore * weights.context + recency * weights.recency + price * weights.price + (overrideScore == null ? 0 : overrideScore * weights.override);
  return {
    score: Math.round(score * 10) / 10,
    tier: tierFor(score),
    basis: [
      effectiveParams ? `${effectiveParams}B ${sizes.active ? "active" : "parameters"}` : "size unknown",
      `${context ? `${Math.round(context / 1e3)}k context` : "context unknown"}`,
      caps.reasoning ? "reasoning" : null,
      caps.function_calling ? "tools" : null,
      caps.vision ? "vision" : null,
      overrideScore == null ? "heuristic score" : "operator benchmark"
    ].filter(Boolean),
    components: {
      size: Math.round(size),
      capability: Math.round(capability),
      context: Math.round(contextScore),
      recency: Math.round(recency),
      price: Math.round(price),
      override: overrideScore
    }
  };
}
function tierFor(score) {
  if (score >= 80) return "S";
  if (score >= 65) return "A";
  if (score >= 50) return "B";
  if (score >= 35) return "C";
  return "D";
}
function rankModels(models, overrides = {}) {
  const ranked = models.map((model) => ({
    ...model,
    performance: performanceScore(model, overrides)
  }));
  ranked.sort((a, b) => {
    const diff = b.performance.score - a.performance.score;
    if (diff) return diff;
    return (b.context_window || 0) - (a.context_window || 0);
  });
  return ranked.map((model, index) => {
    model.performance.rank = index + 1;
    return model;
  });
}

// src/catalog/normalize.js
var TASK_ALIASES = {
  "text generation": "text-generation",
  "text-generation": "text-generation",
  "text embeddings": "text-embeddings",
  "text-embeddings": "text-embeddings",
  embeddings: "text-embeddings",
  embedding: "text-embeddings",
  "text-to-image": "text-to-image",
  "text to image": "text-to-image",
  "image generation": "text-to-image",
  "automatic speech recognition": "automatic-speech-recognition",
  "speech recognition": "automatic-speech-recognition",
  "speech to text": "automatic-speech-recognition",
  "text-to-speech": "text-to-speech",
  "text to speech": "text-to-speech",
  translation: "translation",
  summarization: "summarization",
  "text classification": "text-classification",
  "image classification": "image-classification",
  "image-to-text": "image-to-text",
  "image to text": "image-to-text",
  "object detection": "object-detection",
  "dumb pipe": "dumb-pipe"
};
function normalizeTask(value) {
  if (!value) return "unknown";
  const raw = typeof value === "string" ? value : value.name || value.id || value.task || "";
  const key = String(raw).trim().toLowerCase();
  if (!key) return "unknown";
  return TASK_ALIASES[key] || key.replace(/\s+/g, "-");
}
var KNOWN_TASKS = new Set(Object.values(TASK_ALIASES));
function resolveDeclaredTask(raw, props) {
  for (const value of [raw?.task, raw?.task_name, props?.task]) {
    const task = normalizeTask(value);
    if (task !== "unknown") return task;
  }
  const type = normalizeTask(raw?.type);
  return KNOWN_TASKS.has(type) ? type : "unknown";
}
function modalityList(value) {
  if (!value) return null;
  const list = Array.isArray(value) ? value : String(value).split(/[,+/|]/);
  const normalized = [...new Set(
    list.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
  )];
  return normalized.length ? normalized : null;
}
function explicitModalities(raw) {
  const architecture = raw?.architecture || {};
  let input = modalityList(
    architecture.input_modalities || raw?.input_modalities || raw?.modalities?.input
  );
  let output = modalityList(
    architecture.output_modalities || raw?.output_modalities || raw?.modalities?.output
  );
  const modality = String(architecture.modality || raw?.modality || "").toLowerCase();
  if ((!input || !output) && /->|→/.test(modality)) {
    const [left, right] = modality.split(/->|→/);
    input ||= modalityList(left);
    output ||= modalityList(right);
  }
  return { input, output };
}
function inferTask(raw, props = {}, modalities = null) {
  const id = String(raw?.id || "").toLowerCase();
  const name = String(raw?.name || "").toLowerCase();
  const text = `${id} ${name}`;
  const mods = modalities || explicitModalities(raw);
  const input = mods.input || [];
  const output = mods.output || [];
  const propTask = normalizeTask(props.task);
  if (propTask !== "unknown") return propTask;
  if (/rerank/.test(text)) return "text-classification";
  if (/embedding|embed-|bge-|plamo-embedding|embeddinggemma/.test(text) || output.includes("embedding") || output.includes("embeddings")) {
    return "text-embeddings";
  }
  if (/melotts|aura-|text[- ]to[- ]speech|\btts\b/.test(text) || output.includes("audio")) {
    return "text-to-speech";
  }
  if (/smart-turn|dumb[- ]pipe/.test(text)) return "dumb-pipe";
  if (/llava|moondream/.test(text)) return "image-to-text";
  if (/whisper|nova-3|transcrib|speech[- ]to[- ]text|\basr\b|deepgram\/flux/.test(text) || input.includes("audio") && output.includes("text")) {
    return "automatic-speech-recognition";
  }
  if (/resnet|image[- ]classification/.test(text)) return "image-classification";
  const looksLikeChat = /vision|instruct|chat|multimodal/.test(text);
  const looksLikeImageToText = /image[- ]to[- ]text|llava|moondream/.test(text);
  if (output.includes("image") || !looksLikeChat && !looksLikeImageToText && /stable-diffusion|sdxl|flux|dreamshaper|lucid-origin|phoenix|diffusion|text[- ]to[- ]image|image[- ]generat/.test(text)) {
    return "text-to-image";
  }
  if (input.includes("image") && output.includes("text") && !looksLikeChat) return "image-to-text";
  if (/m2m100|indictrans|translat/.test(text)) return "translation";
  if (/bart.*cnn|summar/.test(text)) return "summarization";
  if (/classif|sentiment|distilbert|sst-2|toxic/.test(text)) return "text-classification";
  return "text-generation";
}
function endpointForTask(task) {
  switch (task) {
    case "text-generation":
      return "/v1/chat/completions";
    case "text-embeddings":
      return "/v1/embeddings";
    case "text-to-image":
      return "/v1/images/generations";
    case "automatic-speech-recognition":
      return "/v1/audio/transcriptions";
    case "text-to-speech":
      return "/v1/audio/speech";
    default:
      return "/v1/run";
  }
}
function propsOf(raw) {
  const out = {};
  const props = raw?.properties ?? raw?.property ?? raw?.capabilities;
  if (Array.isArray(props)) {
    for (const item of props) {
      if (typeof item === "string") out[item] = true;
      else if (item?.property_id) out[item.property_id] = item.value;
      else if (isPlainObject(item)) Object.assign(out, item);
    }
  } else if (isPlainObject(props)) {
    Object.assign(out, props);
  }
  return out;
}
function truthy(value) {
  return value === true || value === 1 || ["true", "yes", "1", "supported"].includes(String(value ?? "").toLowerCase());
}
function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return null;
}
function parseModalities(raw, task) {
  const explicit = explicitModalities(raw);
  const fallback = taskModalities(task);
  return {
    input: explicit.input || fallback.input,
    output: explicit.output || fallback.output
  };
}
function taskModalities(task) {
  switch (task) {
    case "text-to-image":
      return { input: ["text"], output: ["image"] };
    case "automatic-speech-recognition":
      return { input: ["audio"], output: ["text"] };
    case "text-to-speech":
      return { input: ["text"], output: ["audio"] };
    case "image-to-text":
      return { input: ["image"], output: ["text"] };
    default:
      return { input: ["text"], output: ["text"] };
  }
}
function inferCapabilities(raw, props, modalities, task, description) {
  const supported = /* @__PURE__ */ new Set([
    ...raw.supported_parameters || [],
    ...props.supported_parameters || []
  ]);
  const text = `${description || ""} ${raw.name || ""} ${raw.id || ""}`.toLowerCase();
  const input = modalities.input || [];
  const output = modalities.output || [];
  const functionCalling = truthy(props.function_calling) || truthy(props.tool_calling) || supported.has("tools") || supported.has("tool_choice") || /\bfunction calling\b|\btool[- ]calling\b/.test(text);
  const reasoning = truthy(props.reasoning) || supported.has("reasoning") || supported.has("reasoning_effort") || /\breasoning\b|\bthinking\b/.test(text);
  const structured = truthy(props.structured_output) || supported.has("structured_outputs") || supported.has("response_format") || /\bstructured output\b/.test(text);
  return {
    function_calling: Boolean(functionCalling),
    reasoning: Boolean(reasoning),
    structured_output: Boolean(structured),
    vision: input.includes("image") || input.includes("video"),
    audio_input: input.includes("audio"),
    audio_output: output.includes("audio"),
    streaming: props.streaming === void 0 ? task.includes("text") : truthy(props.streaming),
    multilingual: /\bmultilingual\b|\b100\+ languages\b/.test(text)
  };
}
function pricingFromOpenRouter(raw) {
  const prices = raw?.pricing;
  if (!isPlainObject(prices)) return null;
  const perToken = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number * 1e6 : null;
  };
  const input = perToken(prices.prompt ?? prices.input);
  const output = perToken(prices.completion ?? prices.output);
  const cached = perToken(prices.input_cache_read ?? prices.cached_input);
  if (input == null && output == null) return null;
  const usdToNeurons = (usd) => Math.ceil(usd * (1e6 / 11));
  const tokens = {};
  const items = [];
  if (input != null) {
    tokens.input_usd_per_million = input;
    tokens.input_neurons_per_million = usdToNeurons(input);
    items.push({ kind: "input_token", usd: input, neurons: usdToNeurons(input), unit: "per M input tokens" });
  }
  if (output != null) {
    tokens.output_usd_per_million = output;
    tokens.output_neurons_per_million = usdToNeurons(output);
    items.push({ kind: "output_token", usd: output, neurons: usdToNeurons(output), unit: "per M output tokens" });
  }
  if (cached != null) {
    tokens.cached_input_usd_per_million = cached;
    tokens.cached_input_neurons_per_million = usdToNeurons(cached);
    items.push({ kind: "cached_input_token", usd: cached, neurons: usdToNeurons(cached), unit: "per M cached input tokens" });
  }
  return {
    items,
    tokens,
    display: items.map((item) => `$${item.usd} / ${item.kind.replace(/_/g, " ")}`).join(" \xB7 "),
    source: "cloudflare-models-api"
  };
}
function createdTimestamp(raw) {
  if (raw?.created) return Number(raw.created);
  if (raw?.created_at) {
    const time = Date.parse(raw.created_at);
    return Number.isFinite(time) ? Math.floor(time / 1e3) : null;
  }
  return null;
}
function normalizeModel(raw, { paidOnly = /* @__PURE__ */ new Set(), pricing = null, freeQuota = 1e4 } = {}) {
  if (!raw?.id || !String(raw.id).startsWith("@cf/")) return null;
  const id = String(raw.id);
  const props = propsOf(raw);
  const declaredTask = resolveDeclaredTask(raw, props);
  const task = declaredTask === "unknown" ? inferTask(raw, props) : declaredTask;
  const description = String(raw.description || "");
  const modalities = parseModalities(raw, task);
  const capabilities = inferCapabilities(raw, props, modalities, task, description);
  const short = shortModelId(id);
  const contextWindow = firstNumber(
    raw.context_length,
    raw.context_window,
    props.context_window,
    raw.limits?.context_window,
    raw.top_provider?.context_length
  );
  const maxOutput = firstNumber(
    raw.max_output_tokens,
    props.max_output_tokens,
    raw.limits?.max_output_tokens,
    raw.top_provider?.max_completion_tokens
  );
  const price = pricing || pricingFromOpenRouter(raw);
  const requiresPaid = paidOnly.has(id) || truthy(props.requires_paid) || truthy(raw.requires_paid) || truthy(raw.requires_workers_paid);
  const outputRate = Number(price?.tokens?.output_neurons_per_million);
  const inputRate = Number(price?.tokens?.input_neurons_per_million);
  const dailyTokens = outputRate > 0 ? Math.floor(freeQuota / outputRate * 1e6) : inputRate > 0 ? Math.floor(freeQuota / inputRate * 1e6) : null;
  const created = createdTimestamp(raw);
  const deprecated = truthy(raw.deprecated) || truthy(props.deprecated);
  return {
    id,
    name: String(raw.name || short.replace(/-/g, " ")),
    author: String(raw.author?.name || raw.author || raw.source_name || id.split("/")[0].replace("@cf", "")),
    task,
    description,
    context_window: contextWindow,
    max_output_tokens: maxOutput,
    modalities,
    capabilities,
    pricing: price || { items: [], tokens: {}, display: "\u2014", source: null },
    requires_paid: Boolean(requiresPaid),
    deprecated: Boolean(deprecated),
    // Deprecated models remain callable during Cloudflare's 3-month grace
    // period, so they stay in the catalog (clearly flagged) instead of
    // silently disappearing from a free user's options.
    free: !requiresPaid,
    free_daily_output_tokens: dailyTokens,
    created_at: created ? new Date(created * 1e3).toISOString() : raw.created_at || null,
    created_unix: created,
    docs_url: `https://developers.cloudflare.com/workers-ai/models/${short}/`,
    openai_compatible: task === "text-generation" || task === "text-embeddings",
    endpoints: [endpointForTask(task), "/v1/run"].filter((value, index, all) => all.indexOf(value) === index),
    aliases: [id, short]
  };
}

// src/data/catalog-snapshot.js
var catalog_snapshot_default = {
  "generated_at": "2026-10-22T04:40:40.185Z",
  "free_daily_neurons": 1e4,
  "pricing": {
    "models": {
      "@cf/meta/llama-3.2-1b-instruct": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.027,
            "neurons": 2457,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.201,
            "neurons": 18252,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.027,
          "input_neurons_per_million": 2457,
          "output_usd_per_million": 0.201,
          "output_neurons_per_million": 18252
        },
        "display": "$0.027 / input \xB7 $0.201 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-3.2-3b-instruct": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.051,
            "neurons": 4625,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.335,
            "neurons": 30475,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.051,
          "input_neurons_per_million": 4625,
          "output_usd_per_million": 0.335,
          "output_neurons_per_million": 30475
        },
        "display": "$0.051 / input \xB7 $0.335 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-3.1-8b-instruct-fp8-fast": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.045,
            "neurons": 4119,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.384,
            "neurons": 34868,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.045,
          "input_neurons_per_million": 4119,
          "output_usd_per_million": 0.384,
          "output_neurons_per_million": 34868
        },
        "display": "$0.045 / input \xB7 $0.384 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-3.2-11b-vision-instruct": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.049,
            "neurons": 4410,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.676,
            "neurons": 61493,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.049,
          "input_neurons_per_million": 4410,
          "output_usd_per_million": 0.676,
          "output_neurons_per_million": 61493
        },
        "display": "$0.049 / input \xB7 $0.676 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-3.1-70b-instruct-fp8-fast": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.293,
            "neurons": 26668,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 2.253,
            "neurons": 204805,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.293,
          "input_neurons_per_million": 26668,
          "output_usd_per_million": 2.253,
          "output_neurons_per_million": 204805
        },
        "display": "$0.293 / input \xB7 $2.253 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.293,
            "neurons": 26668,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 2.253,
            "neurons": 204805,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.293,
          "input_neurons_per_million": 26668,
          "output_usd_per_million": 2.253,
          "output_neurons_per_million": 204805
        },
        "display": "$0.293 / input \xB7 $2.253 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.497,
            "neurons": 45170,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 4.881,
            "neurons": 443756,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.497,
          "input_neurons_per_million": 45170,
          "output_usd_per_million": 4.881,
          "output_neurons_per_million": 443756
        },
        "display": "$0.497 / input \xB7 $4.881 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/deepseek-ai/deepseek-v4-flash-0731": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.44,
            "neurons": 4e4,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.014,
            "neurons": 1273,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1.32,
            "neurons": 12e4,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.44,
          "input_neurons_per_million": 4e4,
          "output_usd_per_million": 1.32,
          "output_neurons_per_million": 12e4,
          "cached_input_usd_per_million": 0.014,
          "cached_input_neurons_per_million": 1273
        },
        "display": "$0.44 / input \xB7 $0.014 / cached input \xB7 $1.32 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/deepseek-ai/deepseek-v4.1-flash-1017": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.3,
            "neurons": 27273,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 6e-3,
            "neurons": 545,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1.2,
            "neurons": 109091,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.3,
          "input_neurons_per_million": 27273,
          "output_usd_per_million": 1.2,
          "output_neurons_per_million": 109091,
          "cached_input_usd_per_million": 6e-3,
          "cached_input_neurons_per_million": 545
        },
        "display": "$0.3 / input \xB7 $0.006 / cached input \xB7 $1.2 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/deepseek-ai/deepseek-v4-pro-0813": {
        "items": [
          {
            "kind": "input_token",
            "usd": 1.32,
            "neurons": 12e4,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.044,
            "neurons": 4e3,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 3.96,
            "neurons": 36e4,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 1.32,
          "input_neurons_per_million": 12e4,
          "output_usd_per_million": 3.96,
          "output_neurons_per_million": 36e4,
          "cached_input_usd_per_million": 0.044,
          "cached_input_neurons_per_million": 4e3
        },
        "display": "$1.32 / input \xB7 $0.044 / cached input \xB7 $3.96 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/mistral/mistral-7b-instruct-v0.1": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.11,
            "neurons": 1e4,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.19,
            "neurons": 17300,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.11,
          "input_neurons_per_million": 1e4,
          "output_usd_per_million": 0.19,
          "output_neurons_per_million": 17300
        },
        "display": "$0.11 / input \xB7 $0.19 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/mistralai/mistral-small-3.1-24b-instruct": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.351,
            "neurons": 31876,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.555,
            "neurons": 50488,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.351,
          "input_neurons_per_million": 31876,
          "output_usd_per_million": 0.555,
          "output_neurons_per_million": 50488
        },
        "display": "$0.351 / input \xB7 $0.555 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-3.1-8b-instruct": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.282,
            "neurons": 25608,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.827,
            "neurons": 75147,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.282,
          "input_neurons_per_million": 25608,
          "output_usd_per_million": 0.827,
          "output_neurons_per_million": 75147
        },
        "display": "$0.282 / input \xB7 $0.827 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-3.1-8b-instruct-fp8": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.152,
            "neurons": 13778,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.287,
            "neurons": 26128,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.152,
          "input_neurons_per_million": 13778,
          "output_usd_per_million": 0.287,
          "output_neurons_per_million": 26128
        },
        "display": "$0.152 / input \xB7 $0.287 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-3.1-8b-instruct-awq": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.123,
            "neurons": 11161,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.266,
            "neurons": 24215,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.123,
          "input_neurons_per_million": 11161,
          "output_usd_per_million": 0.266,
          "output_neurons_per_million": 24215
        },
        "display": "$0.123 / input \xB7 $0.266 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-3-8b-instruct": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.282,
            "neurons": 25608,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.827,
            "neurons": 75147,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.282,
          "input_neurons_per_million": 25608,
          "output_usd_per_million": 0.827,
          "output_neurons_per_million": 75147
        },
        "display": "$0.282 / input \xB7 $0.827 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-3-8b-instruct-awq": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.123,
            "neurons": 11161,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.266,
            "neurons": 24215,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.123,
          "input_neurons_per_million": 11161,
          "output_usd_per_million": 0.266,
          "output_neurons_per_million": 24215
        },
        "display": "$0.123 / input \xB7 $0.266 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-2-7b-chat-fp16": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.556,
            "neurons": 50505,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 6.667,
            "neurons": 606061,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.556,
          "input_neurons_per_million": 50505,
          "output_usd_per_million": 6.667,
          "output_neurons_per_million": 606061
        },
        "display": "$0.556 / input \xB7 $6.667 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-guard-3-8b": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.484,
            "neurons": 44003,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.03,
            "neurons": 2730,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.484,
          "input_neurons_per_million": 44003,
          "output_usd_per_million": 0.03,
          "output_neurons_per_million": 2730
        },
        "display": "$0.484 / input \xB7 $0.03 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/llama-4-scout-17b-16e-instruct": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.27,
            "neurons": 24545,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.85,
            "neurons": 77273,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.27,
          "input_neurons_per_million": 24545,
          "output_usd_per_million": 0.85,
          "output_neurons_per_million": 77273
        },
        "display": "$0.27 / input \xB7 $0.85 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/google/gemma-3-12b-it": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.345,
            "neurons": 31371,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.556,
            "neurons": 50560,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.345,
          "input_neurons_per_million": 31371,
          "output_usd_per_million": 0.556,
          "output_neurons_per_million": 50560
        },
        "display": "$0.345 / input \xB7 $0.556 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/qwen/qwq-32b": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.66,
            "neurons": 6e4,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1,
            "neurons": 90909,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.66,
          "input_neurons_per_million": 6e4,
          "output_usd_per_million": 1,
          "output_neurons_per_million": 90909
        },
        "display": "$0.66 / input \xB7 $1 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/qwen/qwen2.5-coder-32b-instruct": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.66,
            "neurons": 6e4,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1,
            "neurons": 90909,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.66,
          "input_neurons_per_million": 6e4,
          "output_usd_per_million": 1,
          "output_neurons_per_million": 90909
        },
        "display": "$0.66 / input \xB7 $1 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/qwen/qwen3-30b-a3b-fp8": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.051,
            "neurons": 4625,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.335,
            "neurons": 30475,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.051,
          "input_neurons_per_million": 4625,
          "output_usd_per_million": 0.335,
          "output_neurons_per_million": 30475
        },
        "display": "$0.051 / input \xB7 $0.335 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/qwen/qwen3.8-27b": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.45,
            "neurons": 40909,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 3.2,
            "neurons": 290909,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.45,
          "input_neurons_per_million": 40909,
          "output_usd_per_million": 3.2,
          "output_neurons_per_million": 290909
        },
        "display": "$0.45 / input \xB7 $3.2 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/openai/gpt-oss-120b": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.35,
            "neurons": 31818,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.75,
            "neurons": 68182,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.35,
          "input_neurons_per_million": 31818,
          "output_usd_per_million": 0.75,
          "output_neurons_per_million": 68182
        },
        "display": "$0.35 / input \xB7 $0.75 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/openai/gpt-oss-20b": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.2,
            "neurons": 18182,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.3,
            "neurons": 27273,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.2,
          "input_neurons_per_million": 18182,
          "output_usd_per_million": 0.3,
          "output_neurons_per_million": 27273
        },
        "display": "$0.2 / input \xB7 $0.3 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/aisingapore/gemma-sea-lion-v4-27b-it": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.351,
            "neurons": 31876,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.555,
            "neurons": 50488,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.351,
          "input_neurons_per_million": 31876,
          "output_usd_per_million": 0.555,
          "output_neurons_per_million": 50488
        },
        "display": "$0.351 / input \xB7 $0.555 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/ibm-granite/granite-4.0-h-micro": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.017,
            "neurons": 1542,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.112,
            "neurons": 10158,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.017,
          "input_neurons_per_million": 1542,
          "output_usd_per_million": 0.112,
          "output_neurons_per_million": 10158
        },
        "display": "$0.017 / input \xB7 $0.112 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/zai-org/glm-4.7-flash": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.06,
            "neurons": 5500,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.4,
            "neurons": 36400,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.06,
          "input_neurons_per_million": 5500,
          "output_usd_per_million": 0.4,
          "output_neurons_per_million": 36400
        },
        "display": "$0.06 / input \xB7 $0.4 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/zai-org/glm-5.2": {
        "items": [
          {
            "kind": "input_token",
            "usd": 1.4,
            "neurons": 127273,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.26,
            "neurons": 23636,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 4.4,
            "neurons": 4e5,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 1.4,
          "input_neurons_per_million": 127273,
          "output_usd_per_million": 4.4,
          "output_neurons_per_million": 4e5,
          "cached_input_usd_per_million": 0.26,
          "cached_input_neurons_per_million": 23636
        },
        "display": "$1.4 / input \xB7 $0.26 / cached input \xB7 $4.4 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/zai-org/glm-5.3": {
        "items": [
          {
            "kind": "input_token",
            "usd": 1.4,
            "neurons": 127273,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.26,
            "neurons": 23636,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 4.4,
            "neurons": 4e5,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 1.4,
          "input_neurons_per_million": 127273,
          "output_usd_per_million": 4.4,
          "output_neurons_per_million": 4e5,
          "cached_input_usd_per_million": 0.26,
          "cached_input_neurons_per_million": 23636
        },
        "display": "$1.4 / input \xB7 $0.26 / cached input \xB7 $4.4 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/zai-org/glm-5.3-flash": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.15,
            "neurons": 13636,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.03,
            "neurons": 2727,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.5,
            "neurons": 45455,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.15,
          "input_neurons_per_million": 13636,
          "output_usd_per_million": 0.5,
          "output_neurons_per_million": 45455,
          "cached_input_usd_per_million": 0.03,
          "cached_input_neurons_per_million": 2727
        },
        "display": "$0.15 / input \xB7 $0.03 / cached input \xB7 $0.5 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/nvidia/nemotron-3-120b-a12b": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.5,
            "neurons": 45455,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1.5,
            "neurons": 136364,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.5,
          "input_neurons_per_million": 45455,
          "output_usd_per_million": 1.5,
          "output_neurons_per_million": 136364
        },
        "display": "$0.5 / input \xB7 $1.5 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/moonshotai/kimi-k2.5": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.6,
            "neurons": 54545,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.1,
            "neurons": 9091,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 3,
            "neurons": 272727,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.6,
          "input_neurons_per_million": 54545,
          "output_usd_per_million": 3,
          "output_neurons_per_million": 272727,
          "cached_input_usd_per_million": 0.1,
          "cached_input_neurons_per_million": 9091
        },
        "display": "$0.6 / input \xB7 $0.1 / cached input \xB7 $3 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/moonshotai/kimi-k2.6": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.95,
            "neurons": 86364,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.16,
            "neurons": 14545,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 4,
            "neurons": 363636,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.95,
          "input_neurons_per_million": 86364,
          "output_usd_per_million": 4,
          "output_neurons_per_million": 363636,
          "cached_input_usd_per_million": 0.16,
          "cached_input_neurons_per_million": 14545
        },
        "display": "$0.95 / input \xB7 $0.16 / cached input \xB7 $4 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/moonshotai/kimi-k2.7-code": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.95,
            "neurons": 86364,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.19,
            "neurons": 17273,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 4,
            "neurons": 363636,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.95,
          "input_neurons_per_million": 86364,
          "output_usd_per_million": 4,
          "output_neurons_per_million": 363636,
          "cached_input_usd_per_million": 0.19,
          "cached_input_neurons_per_million": 17273
        },
        "display": "$0.95 / input \xB7 $0.19 / cached input \xB7 $4 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/google/gemma-4-26b-a4b-it": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.1,
            "neurons": 9091,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.3,
            "neurons": 27273,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.1,
          "input_neurons_per_million": 9091,
          "output_usd_per_million": 0.3,
          "output_neurons_per_million": 27273
        },
        "display": "$0.1 / input \xB7 $0.3 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/daily-co/phonellm-mini-alpha-2": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.06,
            "neurons": 5455,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.24,
            "neurons": 21818,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.06,
          "input_neurons_per_million": 5455,
          "output_usd_per_million": 0.24,
          "output_neurons_per_million": 21818
        },
        "display": "$0.06 / input \xB7 $0.24 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/baai/bge-small-en-v1.5": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.02,
            "neurons": 1841,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.02,
          "input_neurons_per_million": 1841
        },
        "display": "$0.02 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/baai/bge-base-en-v1.5": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.067,
            "neurons": 6058,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.067,
          "input_neurons_per_million": 6058
        },
        "display": "$0.067 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/baai/bge-large-en-v1.5": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.204,
            "neurons": 18582,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.204,
          "input_neurons_per_million": 18582
        },
        "display": "$0.204 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/baai/bge-m3": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.012,
            "neurons": 1075,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.012,
          "input_neurons_per_million": 1075
        },
        "display": "$0.012 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/pfnet/plamo-embedding-1b": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.019,
            "neurons": 1689,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.019,
          "input_neurons_per_million": 1689
        },
        "display": "$0.019 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/qwen/qwen3-embedding-0.6b": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.012,
            "neurons": 1075,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.012,
          "input_neurons_per_million": 1075
        },
        "display": "$0.012 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/black-forest-labs/flux-1-schnell": {
        "items": [
          {
            "kind": "image_tile",
            "usd": 528e-7,
            "neurons": 4.8,
            "unit": "per 512x512 tile"
          },
          {
            "kind": "step",
            "usd": 1056e-7,
            "neurons": 9.6,
            "unit": "per step"
          }
        ],
        "tokens": {},
        "display": "$0.0000528 / tile \xB7 $0.0001056 / step",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/leonardo/lucid-origin": {
        "items": [
          {
            "kind": "image_tile",
            "usd": 6996e-6,
            "neurons": 636,
            "unit": "per 512x512 tile"
          },
          {
            "kind": "step",
            "usd": 132e-6,
            "neurons": 12,
            "unit": "per step"
          }
        ],
        "tokens": {},
        "display": "$0.006996 / tile \xB7 $0.000132 / step",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/leonardo/phoenix-1.0": {
        "items": [
          {
            "kind": "image_tile",
            "usd": 583e-5,
            "neurons": 530,
            "unit": "per 512x512 tile"
          },
          {
            "kind": "step",
            "usd": 11e-5,
            "neurons": 10,
            "unit": "per step"
          }
        ],
        "tokens": {},
        "display": "$0.00583 / tile \xB7 $0.00011 / step",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/black-forest-labs/flux-2-dev": {
        "items": [
          {
            "kind": "input_image_tile_step",
            "usd": 21e-5,
            "neurons": 18.75,
            "unit": "per input 512x512 tile, per step"
          },
          {
            "kind": "output_image_tile_step",
            "usd": 41e-5,
            "neurons": 37.5,
            "unit": "per output 512x512 tile, per step"
          }
        ],
        "tokens": {},
        "display": "$0.00021 / input tile/step \xB7 $0.00041 / output tile/step",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/black-forest-labs/flux-2-klein-4b": {
        "items": [
          {
            "kind": "image_tile",
            "usd": 59e-6,
            "neurons": 5.37,
            "unit": "per input 512x512 tile"
          },
          {
            "kind": "image_tile",
            "usd": 287e-6,
            "neurons": 26.05,
            "unit": "per output 512x512 tile"
          }
        ],
        "tokens": {},
        "display": "$0.000059 / tile \xB7 $0.000287 / tile",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/black-forest-labs/flux-2-klein-9b": {
        "items": [
          {
            "kind": "image_megapixel",
            "usd": 0.015,
            "neurons": 1363.64,
            "unit": "per first MP (1024x1024)"
          },
          {
            "kind": "image_megapixel",
            "usd": 2e-3,
            "neurons": 181.82,
            "unit": "per subsequent MP"
          },
          {
            "kind": "image",
            "usd": 2e-3,
            "neurons": 181.82,
            "unit": "per input image MP"
          }
        ],
        "tokens": {},
        "display": "$0.015 / MP \xB7 $0.002 / MP \xB7 $0.002 / image",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/openai/whisper": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 5e-4,
            "neurons": 41.14,
            "unit": "per audio minute"
          }
        ],
        "tokens": {},
        "display": "$0.0005 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/openai/whisper-large-v3-turbo": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 5e-4,
            "neurons": 46.63,
            "unit": "per audio minute"
          }
        ],
        "tokens": {},
        "display": "$0.0005 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/myshell-ai/melotts": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 2e-4,
            "neurons": 18.63,
            "unit": "per audio minute"
          }
        ],
        "tokens": {},
        "display": "$0.0002 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/deepgram/aura-1": {
        "items": [
          {
            "kind": "character",
            "usd": 0.015,
            "neurons": 1,
            "unit": "per 1k characters input"
          }
        ],
        "tokens": {},
        "display": "$0.015 / 1k chars",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/deepgram/nova-3": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 52e-4,
            "neurons": 472.73,
            "unit": "per audio minute input"
          }
        ],
        "tokens": {},
        "display": "$0.0052 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/deepgram/nova-3#websocket": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 92e-4,
            "neurons": 836.36,
            "unit": "per audio minute input"
          }
        ],
        "display": "$0.0092 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/pipecat-ai/smart-turn-v2": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 33795e-8,
            "neurons": 0.51,
            "unit": "per audio minute input"
          }
        ],
        "tokens": {},
        "display": "$0.00033795 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/deepgram/aura-2-en": {
        "items": [
          {
            "kind": "character",
            "usd": 0.03,
            "neurons": 2727.27,
            "unit": "per 1k characters input"
          }
        ],
        "tokens": {},
        "display": "$0.03 / 1k chars",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/deepgram/aura-2-es": {
        "items": [
          {
            "kind": "character",
            "usd": 0.03,
            "neurons": 2727.27,
            "unit": "per 1k characters input"
          }
        ],
        "tokens": {},
        "display": "$0.03 / 1k chars",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/deepgram/flux": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 77e-4,
            "neurons": 700,
            "unit": "per audio minute"
          }
        ],
        "tokens": {},
        "display": "$0.0077 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/huggingface/distilbert-sst-2-int8": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.026,
            "neurons": 2394,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.026,
          "input_neurons_per_million": 2394
        },
        "display": "$0.026 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/baai/bge-reranker-base": {
        "items": [
          {
            "kind": "input_token",
            "usd": 3e-3,
            "neurons": 283,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 3e-3,
          "input_neurons_per_million": 283
        },
        "display": "$0.003 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/meta/m2m100-1.2b": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.342,
            "neurons": 31050,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.342,
            "neurons": 31050,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.342,
          "input_neurons_per_million": 31050,
          "output_usd_per_million": 0.342,
          "output_neurons_per_million": 31050
        },
        "display": "$0.342 / input \xB7 $0.342 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/microsoft/resnet-50": {
        "items": [
          {
            "kind": "image",
            "usd": 2.51,
            "neurons": 228055,
            "unit": "per M images"
          }
        ],
        "tokens": {},
        "display": "$2.51 / image",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/ai4bharat/indictrans2-en-indic-1B": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.342,
            "neurons": 31050,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.342,
            "neurons": 31050,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.342,
          "input_neurons_per_million": 31050,
          "output_usd_per_million": 0.342,
          "output_neurons_per_million": 31050
        },
        "display": "$0.342 / input \xB7 $0.342 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/moondream/moondream3.1-9B-A2B": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.3,
            "neurons": 27273,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1,
            "neurons": 90909,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.3,
          "input_neurons_per_million": 27273,
          "output_usd_per_million": 1,
          "output_neurons_per_million": 90909
        },
        "display": "$0.3 / input \xB7 $1 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/cloudflare/clef": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.24,
            "neurons": 21818,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.24,
          "input_neurons_per_million": 21818
        },
        "display": "$0.24 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/cloudflare/clef-omni": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.15,
            "neurons": 13636,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.15,
          "input_neurons_per_million": 13636
        },
        "display": "$0.15 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/cloudflare/clef-flash": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.038,
            "neurons": 3455,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.038,
          "input_neurons_per_million": 3455
        },
        "display": "$0.038 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "@cf/cloudflare/clairic": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.1,
            "neurons": 9091,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.1,
          "input_neurons_per_million": 9091
        },
        "display": "$0.1 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      }
    },
    "paidOnly": [
      "@cf/moonshotai/kimi-k2.6",
      "@cf/moonshotai/kimi-k2.7-code",
      "@cf/zai-org/glm-5.2",
      "@cf/zai-org/glm-5.3",
      "@cf/zai-org/glm-5.3-flash",
      "@cf/deepseek-ai/deepseek-v4-flash-0731",
      "@cf/deepseek-ai/deepseek-v4.1-flash-1017",
      "@cf/deepseek-ai/deepseek-v4-pro-0813"
    ],
    "freeDailyNeurons": 1e4,
    "updatedAt": "Oct 20, 2026",
    "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
  },
  "models": [
    {
      "id": "@cf/zai-org/glm-5.3",
      "name": "glm-5.3",
      "author": "Zhipu AI",
      "task": "text-generation",
      "description": "GLM-5.3 is Z.ai's flagship agentic coding model, pairing a 1M-token context window with reasoning, function calling, and structured outputs to power multi-step, tool-driven development workflows.",
      "context_window": 1048576,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": true,
        "structured_output": true,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 1.4,
            "neurons": 127273,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.26,
            "neurons": 23636,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 4.4,
            "neurons": 4e5,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 1.4,
          "input_neurons_per_million": 127273,
          "output_usd_per_million": 4.4,
          "output_neurons_per_million": 4e5,
          "cached_input_usd_per_million": 0.26,
          "cached_input_neurons_per_million": 23636
        },
        "display": "$1.4 / input \xB7 $0.26 / cached input \xB7 $4.4 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": true,
      "deprecated": false,
      "free": false,
      "free_daily_output_tokens": 25e3,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/glm-5.3/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/zai-org/glm-5.3",
        "glm-5.3"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 62.6,
        "tier": "B",
        "basis": [
          "size unknown",
          "1049k context",
          "reasoning",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 76,
          "context": 100,
          "recency": 45,
          "price": 78,
          "override": null
        },
        "rank": 1
      }
    },
    {
      "id": "@cf/deepseek-ai/deepseek-v4-pro-0813",
      "name": "deepseek-v4-pro-0813",
      "author": "DeepSeek",
      "task": "text-generation",
      "description": "DeepSeek V4 Pro is a high-capability reasoning model from DeepSeek with a one million token context window, built for long-horizon agentic workflows and complex, multi-step problem-solving",
      "context_window": 1048576,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 1.32,
            "neurons": 12e4,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.044,
            "neurons": 4e3,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 3.96,
            "neurons": 36e4,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 1.32,
          "input_neurons_per_million": 12e4,
          "output_usd_per_million": 3.96,
          "output_neurons_per_million": 36e4,
          "cached_input_usd_per_million": 0.044,
          "cached_input_neurons_per_million": 4e3
        },
        "display": "$1.32 / input \xB7 $0.044 / cached input \xB7 $3.96 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": true,
      "deprecated": false,
      "free": false,
      "free_daily_output_tokens": 27777,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/deepseek-v4-pro-0813/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/deepseek-ai/deepseek-v4-pro-0813",
        "deepseek-v4-pro-0813"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 60.4,
        "tier": "B",
        "basis": [
          "size unknown",
          "1049k context",
          "reasoning",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 68,
          "context": 100,
          "recency": 45,
          "price": 77,
          "override": null
        },
        "rank": 2
      }
    },
    {
      "id": "@cf/moonshotai/kimi-k2.6",
      "name": "kimi-k2.6",
      "author": "Moonshot AI",
      "task": "text-generation",
      "description": "Kimi K2.6 is a frontier-scale open-source 1T parameter model with a 262.1k context window, multi-turn tool calling, vision inputs, and structured outputs for agentic workloads.",
      "context_window": 262144,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": true,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.95,
            "neurons": 86364,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.16,
            "neurons": 14545,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 4,
            "neurons": 363636,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.95,
          "input_neurons_per_million": 86364,
          "output_usd_per_million": 4,
          "output_neurons_per_million": 363636,
          "cached_input_usd_per_million": 0.16,
          "cached_input_neurons_per_million": 14545
        },
        "display": "$0.95 / input \xB7 $0.16 / cached input \xB7 $4 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": true,
      "deprecated": false,
      "free": false,
      "free_daily_output_tokens": 27500,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/kimi-k2.6/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/moonshotai/kimi-k2.6",
        "kimi-k2.6"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 53.8,
        "tier": "B",
        "basis": [
          "size unknown",
          "262k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 56,
          "context": 76,
          "recency": 45,
          "price": 77,
          "override": null
        },
        "rank": 3
      }
    },
    {
      "id": "@cf/moonshotai/kimi-k2.7-code",
      "name": "kimi-k2.7-code",
      "author": "Moonshot AI",
      "task": "text-generation",
      "description": "Kimi K2.7 is a frontier-scale open-source 1T parameter model with a 262.1k context window, multi-turn tool calling, vision inputs, and structured outputs for agentic workloads.",
      "context_window": 262144,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": true,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.95,
            "neurons": 86364,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.19,
            "neurons": 17273,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 4,
            "neurons": 363636,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.95,
          "input_neurons_per_million": 86364,
          "output_usd_per_million": 4,
          "output_neurons_per_million": 363636,
          "cached_input_usd_per_million": 0.19,
          "cached_input_neurons_per_million": 17273
        },
        "display": "$0.95 / input \xB7 $0.19 / cached input \xB7 $4 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": true,
      "deprecated": false,
      "free": false,
      "free_daily_output_tokens": 27500,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/kimi-k2.7-code/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/moonshotai/kimi-k2.7-code",
        "kimi-k2.7-code"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 53.8,
        "tier": "B",
        "basis": [
          "size unknown",
          "262k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 56,
          "context": 76,
          "recency": 45,
          "price": 77,
          "override": null
        },
        "rank": 4
      }
    },
    {
      "id": "@cf/deepseek-ai/deepseek-v4-flash-0731",
      "name": "deepseek-v4-flash-0731",
      "author": "DeepSeek",
      "task": "text-generation",
      "description": '"DeepSeek-V4-Flash-0731 is the official release of DeepSeek-V4-Flash, superseding the preview version, with substantially enhanced agentic capabilities. "',
      "context_window": 1048576,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.44,
            "neurons": 4e4,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.014,
            "neurons": 1273,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1.32,
            "neurons": 12e4,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.44,
          "input_neurons_per_million": 4e4,
          "output_usd_per_million": 1.32,
          "output_neurons_per_million": 12e4,
          "cached_input_usd_per_million": 0.014,
          "cached_input_neurons_per_million": 1273
        },
        "display": "$0.44 / input \xB7 $0.014 / cached input \xB7 $1.32 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": true,
      "deprecated": false,
      "free": false,
      "free_daily_output_tokens": 83333,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/deepseek-v4-flash-0731/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/deepseek-ai/deepseek-v4-flash-0731",
        "deepseek-v4-flash-0731"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 53.5,
        "tier": "B",
        "basis": [
          "size unknown",
          "1049k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 48,
          "context": 100,
          "recency": 45,
          "price": 57,
          "override": null
        },
        "rank": 5
      }
    },
    {
      "id": "@cf/zai-org/glm-5.2",
      "name": "glm-5.2",
      "author": "Zhipu AI",
      "task": "text-generation",
      "description": "Z.ai's flagship agentic coding model",
      "context_window": 262144,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 1.4,
            "neurons": 127273,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.26,
            "neurons": 23636,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 4.4,
            "neurons": 4e5,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 1.4,
          "input_neurons_per_million": 127273,
          "output_usd_per_million": 4.4,
          "output_neurons_per_million": 4e5,
          "cached_input_usd_per_million": 0.26,
          "cached_input_neurons_per_million": 23636
        },
        "display": "$1.4 / input \xB7 $0.26 / cached input \xB7 $4.4 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": true,
      "deprecated": false,
      "free": false,
      "free_daily_output_tokens": 25e3,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/glm-5.2/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/zai-org/glm-5.2",
        "glm-5.2"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 52,
        "tier": "B",
        "basis": [
          "size unknown",
          "262k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 48,
          "context": 76,
          "recency": 45,
          "price": 78,
          "override": null
        },
        "rank": 6
      }
    },
    {
      "id": "@cf/zai-org/glm-4.7-flash",
      "name": "glm-4.7-flash",
      "author": "Zhipu AI",
      "task": "text-generation",
      "description": "GLM-4.7-Flash is a fast and efficient multilingual text generation model with a 131,072 token context window. Optimized for dialogue, instruction-following, and multi-turn tool calling across 100+ languages.",
      "context_window": 131072,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": true
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.06,
            "neurons": 5500,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.4,
            "neurons": 36400,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.06,
          "input_neurons_per_million": 5500,
          "output_usd_per_million": 0.4,
          "output_neurons_per_million": 36400
        },
        "display": "$0.06 / input \xB7 $0.4 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 274725,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/zai-org/glm-4.7-flash",
        "glm-4.7-flash"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 50.9,
        "tier": "B",
        "basis": [
          "size unknown",
          "131k context",
          "reasoning",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 68,
          "context": 63,
          "recency": 45,
          "price": 36,
          "override": null
        },
        "rank": 7
      }
    },
    {
      "id": "@cf/ibm-granite/granite-4.0-h-micro",
      "name": "granite-4.0-h-micro",
      "author": "IBM",
      "task": "text-generation",
      "description": "Granite 4.0 instruct models deliver strong performance across benchmarks, achieving industry-leading results in key agentic tasks like instruction following and function calling. These efficiencies make the models well-suited for a wide range of use cases like retrieval-augmented generation (RAG), multi-agent workflows, and edge deployments.",
      "context_window": 131e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.017,
            "neurons": 1542,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.112,
            "neurons": 10158,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.017,
          "input_neurons_per_million": 1542,
          "output_usd_per_million": 0.112,
          "output_neurons_per_million": 10158
        },
        "display": "$0.017 / input \xB7 $0.112 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 984445,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/granite-4.0-h-micro/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/ibm-granite/granite-4.0-h-micro",
        "granite-4.0-h-micro"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 43.6,
        "tier": "C",
        "basis": [
          "size unknown",
          "131k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 48,
          "context": 63,
          "recency": 45,
          "price": 14,
          "override": null
        },
        "rank": 8
      }
    },
    {
      "id": "@cf/baai/bge-base-en-v1.5",
      "name": "bge-base-en-v1.5",
      "author": "BAAI",
      "task": "text-embeddings",
      "description": "BAAI general embedding (Base) model that transforms any given text into a 768-dimensional vector",
      "context_window": 153600,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.067,
            "neurons": 6058,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.067,
          "input_neurons_per_million": 6058
        },
        "display": "$0.067 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 1650709,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/embeddings",
        "/v1/run"
      ],
      "aliases": [
        "@cf/baai/bge-base-en-v1.5",
        "bge-base-en-v1.5"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 42.7,
        "tier": "C",
        "basis": [
          "size unknown",
          "154k context",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 66,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 9
      }
    },
    {
      "id": "@cf/nvidia/nemotron-3-120b-a12b",
      "name": "nemotron-3-120b-a12b",
      "author": "NVIDIA",
      "task": "text-generation",
      "description": "NVIDIA Nemotron 3 Super is a hybrid MoE model with leading accuracy for multi-agent applications and specialized agentic AI systems.",
      "context_window": 256e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.5,
            "neurons": 45455,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1.5,
            "neurons": 136364,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.5,
          "input_neurons_per_million": 45455,
          "output_usd_per_million": 1.5,
          "output_neurons_per_million": 136364
        },
        "display": "$0.5 / input \xB7 $1.5 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 73333,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/nemotron-3-120b-a12b/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/nvidia/nemotron-3-120b-a12b",
        "nemotron-3-120b-a12b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 41,
        "tier": "C",
        "basis": [
          "12B active",
          "256k context",
          "reasoning",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 68,
          "context": 75,
          "recency": 45,
          "price": 60,
          "override": null
        },
        "rank": 10
      }
    },
    {
      "id": "@cf/cloudflare/clairic",
      "name": "clairic",
      "author": "Cloudflare",
      "task": "text-generation",
      "description": "Clairic is a System One-style model that can extract, compute, estimate, and forecast values from inputs. It is strongly typed and outputs confidence scores and probabilities against its outputs. This model is in preview from the Cloudflare Workers AI team.",
      "context_window": 65536,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.1,
            "neurons": 9091,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.1,
          "input_neurons_per_million": 9091
        },
        "display": "$0.1 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 1099989,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/clairic/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/cloudflare/clairic",
        "clairic"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 40.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "66k context",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 51,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 11
      }
    },
    {
      "id": "@cf/baai/bge-m3",
      "name": "bge-m3",
      "author": "BAAI",
      "task": "text-embeddings",
      "description": "Multi-Functionality, Multi-Linguality, and Multi-Granularity embeddings model.",
      "context_window": 6e4,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.012,
            "neurons": 1075,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.012,
          "input_neurons_per_million": 1075
        },
        "display": "$0.012 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 9302325,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/bge-m3/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/embeddings",
        "/v1/run"
      ],
      "aliases": [
        "@cf/baai/bge-m3",
        "bge-m3"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 40.1,
        "tier": "C",
        "basis": [
          "size unknown",
          "60k context",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 49,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 12
      }
    },
    {
      "id": "@cf/deepseek-ai/deepseek-v4.1-flash-1017",
      "name": "deepseek-v4.1-flash-1017",
      "author": "DeepSeek",
      "task": "text-generation",
      "description": "We introduce DeepSeek-V4.1-Flash, a multimodal Mixture-of-Experts (MoE) model with 552B backbone parameters and support for contexts of up to one million tokens. The model natively processes images and text, and generates text autoregressively.",
      "context_window": 1048576,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.3,
            "neurons": 27273,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 6e-3,
            "neurons": 545,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1.2,
            "neurons": 109091,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.3,
          "input_neurons_per_million": 27273,
          "output_usd_per_million": 1.2,
          "output_neurons_per_million": 109091,
          "cached_input_usd_per_million": 6e-3,
          "cached_input_neurons_per_million": 545
        },
        "display": "$0.3 / input \xB7 $0.006 / cached input \xB7 $1.2 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": true,
      "deprecated": false,
      "free": false,
      "free_daily_output_tokens": 91666,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/deepseek-v4.1-flash-1017/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/deepseek-ai/deepseek-v4.1-flash-1017",
        "deepseek-v4.1-flash-1017"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 39.3,
        "tier": "C",
        "basis": [
          "552B parameters",
          "1049k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 48,
          "context": 100,
          "recency": 45,
          "price": 56,
          "override": null
        },
        "rank": 13
      }
    },
    {
      "id": "@cf/deepgram/aura-2-es",
      "name": "aura-2-es",
      "author": "Deepgram",
      "task": "text-to-speech",
      "description": "Aura-2 is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "audio"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": true,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "character",
            "usd": 0.03,
            "neurons": 2727.27,
            "unit": "per 1k characters input"
          }
        ],
        "tokens": {},
        "display": "$0.03 / 1k chars",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/aura-2-es/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/audio/speech",
        "/v1/run"
      ],
      "aliases": [
        "@cf/deepgram/aura-2-es",
        "aura-2-es"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 38.8,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 36,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 14
      }
    },
    {
      "id": "@cf/deepgram/aura-1",
      "name": "aura-1",
      "author": "Deepgram",
      "task": "text-to-speech",
      "description": "Aura is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "audio"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": true,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "character",
            "usd": 0.015,
            "neurons": 1,
            "unit": "per 1k characters input"
          }
        ],
        "tokens": {},
        "display": "$0.015 / 1k chars",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/aura-1/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/audio/speech",
        "/v1/run"
      ],
      "aliases": [
        "@cf/deepgram/aura-1",
        "aura-1"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 38.8,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 36,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 15
      }
    },
    {
      "id": "@cf/deepgram/flux",
      "name": "flux",
      "author": "Deepgram",
      "task": "automatic-speech-recognition",
      "description": "Flux is the first conversational speech recognition model built specifically for voice agents.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "audio"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": true,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 77e-4,
            "neurons": 700,
            "unit": "per audio minute"
          }
        ],
        "tokens": {},
        "display": "$0.0077 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/flux/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/audio/transcriptions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/deepgram/flux",
        "flux"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 38.8,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 36,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 16
      }
    },
    {
      "id": "@cf/deepgram/aura-2-en",
      "name": "aura-2-en",
      "author": "Deepgram",
      "task": "text-to-speech",
      "description": "Aura-2 is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "audio"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": true,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "character",
            "usd": 0.03,
            "neurons": 2727.27,
            "unit": "per 1k characters input"
          }
        ],
        "tokens": {},
        "display": "$0.03 / 1k chars",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/aura-2-en/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/audio/speech",
        "/v1/run"
      ],
      "aliases": [
        "@cf/deepgram/aura-2-en",
        "aura-2-en"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 38.8,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 36,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 17
      }
    },
    {
      "id": "@cf/myshell-ai/melotts",
      "name": "melotts",
      "author": "MyShell",
      "task": "text-to-speech",
      "description": "MeloTTS is a high-quality multi-lingual text-to-speech library by MyShell.ai.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "audio"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": true,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 2e-4,
            "neurons": 18.63,
            "unit": "per audio minute"
          }
        ],
        "tokens": {},
        "display": "$0.0002 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/melotts/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/audio/speech",
        "/v1/run"
      ],
      "aliases": [
        "@cf/myshell-ai/melotts",
        "melotts"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 38.8,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 36,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 18
      }
    },
    {
      "id": "@cf/deepgram/nova-3",
      "name": "nova-3",
      "author": "Deepgram",
      "task": "automatic-speech-recognition",
      "description": "Transcribe audio using Deepgram\u2019s speech-to-text model",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "audio"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": true,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 52e-4,
            "neurons": 472.73,
            "unit": "per audio minute input"
          }
        ],
        "tokens": {},
        "display": "$0.0052 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/nova-3/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/audio/transcriptions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/deepgram/nova-3",
        "nova-3"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 38.8,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 36,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 19
      }
    },
    {
      "id": "@cf/openai/whisper",
      "name": "whisper",
      "author": "OpenAI",
      "task": "automatic-speech-recognition",
      "description": "Whisper is a general-purpose speech recognition model. It is trained on a large dataset of diverse audio and is also a multitasking model that can perform multilingual speech recognition, speech translation, and language identification.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "audio"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": true,
        "audio_output": false,
        "streaming": true,
        "multilingual": true
      },
      "pricing": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 5e-4,
            "neurons": 41.14,
            "unit": "per audio minute"
          }
        ],
        "tokens": {},
        "display": "$0.0005 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/whisper/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/audio/transcriptions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/openai/whisper",
        "whisper"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 38.8,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 36,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 20
      }
    },
    {
      "id": "@cf/openai/whisper-tiny-en",
      "name": "whisper-tiny-en",
      "author": "OpenAI",
      "task": "automatic-speech-recognition",
      "description": "Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation. Trained on 680k hours of labelled data, Whisper models demonstrate a strong ability to generalize to many datasets and domains without the need for fine-tuning. This is the English-only version of the Whisper Tiny model which was trained on the task of speech recognition.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "audio"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": true,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/whisper-tiny-en/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/audio/transcriptions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/openai/whisper-tiny-en",
        "whisper-tiny-en"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 38.8,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 36,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 21
      }
    },
    {
      "id": "@cf/openai/whisper-large-v3-turbo",
      "name": "whisper-large-v3-turbo",
      "author": "OpenAI",
      "task": "automatic-speech-recognition",
      "description": '"Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation. "',
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "audio"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": true,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 5e-4,
            "neurons": 46.63,
            "unit": "per audio minute"
          }
        ],
        "tokens": {},
        "display": "$0.0005 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/audio/transcriptions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/openai/whisper-large-v3-turbo",
        "whisper-large-v3-turbo"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 38.8,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 36,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 22
      }
    },
    {
      "id": "@cf/google/gemma-4-26b-a4b-it",
      "name": "gemma-4-26b-a4b-it",
      "author": "Google",
      "task": "text-generation",
      "description": "Gemma 4 is Google's most intelligent family of open models, built from Gemini 3 research to maximize intelligence-per-parameter.",
      "context_window": 256e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.1,
            "neurons": 9091,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.3,
            "neurons": 27273,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.1,
          "input_neurons_per_million": 9091,
          "output_usd_per_million": 0.3,
          "output_neurons_per_million": 27273
        },
        "display": "$0.1 / input \xB7 $0.3 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 366663,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/google/gemma-4-26b-a4b-it",
        "gemma-4-26b-a4b-it"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 38.2,
        "tier": "C",
        "basis": [
          "4B active",
          "256k context",
          "reasoning",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 68,
          "context": 75,
          "recency": 45,
          "price": 31,
          "override": null
        },
        "rank": 23
      }
    },
    {
      "id": "@cf/daily-co/phonellm-mini-alpha-2",
      "name": "phonellm-mini-alpha-2",
      "author": "daily-co",
      "task": "text-generation",
      "description": "PhoneLLM is an open model tuned for voice agents. The model is based on Nemotron Nano 30B base capabilities and excels at typical voice agent tasks with thinking disabled.",
      "context_window": 262140,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.06,
            "neurons": 5455,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.24,
            "neurons": 21818,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.06,
          "input_neurons_per_million": 5455,
          "output_usd_per_million": 0.24,
          "output_neurons_per_million": 21818
        },
        "display": "$0.06 / input \xB7 $0.24 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 458337,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/phonellm-mini-alpha-2/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/daily-co/phonellm-mini-alpha-2",
        "phonellm-mini-alpha-2"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.9,
        "tier": "C",
        "basis": [
          "30B parameters",
          "262k context",
          "reasoning",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 68,
          "context": 76,
          "recency": 45,
          "price": 28,
          "override": null
        },
        "rank": 24
      }
    },
    {
      "id": "@cf/openai/gpt-oss-120b",
      "name": "gpt-oss-120b",
      "author": "OpenAI",
      "task": "text-generation",
      "description": "OpenAI\u2019s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases \u2013 gpt-oss-120b is for production, general purpose, high reasoning use-cases.",
      "context_window": 128e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.35,
            "neurons": 31818,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.75,
            "neurons": 68182,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.35,
          "input_neurons_per_million": 31818,
          "output_usd_per_million": 0.75,
          "output_neurons_per_million": 68182
        },
        "display": "$0.35 / input \xB7 $0.75 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 146666,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/openai/gpt-oss-120b",
        "gpt-oss-120b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.9,
        "tier": "C",
        "basis": [
          "120B parameters",
          "128k context",
          "reasoning",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 68,
          "context": 63,
          "recency": 45,
          "price": 47,
          "override": null
        },
        "rank": 25
      }
    },
    {
      "id": "@cf/zai-org/glm-5.3-flash",
      "name": "glm-5.3-flash",
      "author": "Zhipu AI",
      "task": "text-generation",
      "description": "The first natively multimodal model in the GLM-5 series. With 320B total parameters and just 18B active parameters, it outperforms GLM-5.2 across benchmarks and real-world workloads at one-tenth the price, while approaching Claude Opus 4.8 on coding and agentic benchmarks.",
      "context_window": 1048576,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.15,
            "neurons": 13636,
            "unit": "per M input tokens"
          },
          {
            "kind": "cached_input_token",
            "usd": 0.03,
            "neurons": 2727,
            "unit": "per M cached input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.5,
            "neurons": 45455,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.15,
          "input_neurons_per_million": 13636,
          "output_usd_per_million": 0.5,
          "output_neurons_per_million": 45455,
          "cached_input_usd_per_million": 0.03,
          "cached_input_neurons_per_million": 2727
        },
        "display": "$0.15 / input \xB7 $0.03 / cached input \xB7 $0.5 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": true,
      "deprecated": false,
      "free": false,
      "free_daily_output_tokens": 219997,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/glm-5.3-flash/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/zai-org/glm-5.3-flash",
        "glm-5.3-flash"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.8,
        "tier": "C",
        "basis": [
          "320B parameters",
          "1049k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 48,
          "context": 100,
          "recency": 45,
          "price": 40,
          "override": null
        },
        "rank": 26
      }
    },
    {
      "id": "@cf/qwen/qwen3.8-27b",
      "name": "qwen3.8-27b",
      "author": "Qwen",
      "task": "text-generation",
      "description": "Qwen 3.8 27B is a 27-billion-parameter instruction-tuned language model from Alibaba's Qwen family, designed for vision, efficient general-purpose text generation and agentic workloads.",
      "context_window": 262144,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.45,
            "neurons": 40909,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 3.2,
            "neurons": 290909,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.45,
          "input_neurons_per_million": 40909,
          "output_usd_per_million": 3.2,
          "output_neurons_per_million": 290909
        },
        "display": "$0.45 / input \xB7 $3.2 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 34375,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/qwen/qwen3.8-27b",
        "qwen3.8-27b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.4,
        "tier": "C",
        "basis": [
          "27B parameters",
          "262k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 48,
          "context": 76,
          "recency": 45,
          "price": 73,
          "override": null
        },
        "rank": 27
      }
    },
    {
      "id": "@cf/baai/bge-reranker-base",
      "name": "bge-reranker-base",
      "author": "BAAI",
      "task": "text-classification",
      "description": '"Different from embedding model, reranker uses question and document as input and directly output similarity instead of embedding. You can get a relevance score by inputting query and passage to the reranker. And the score can be mapped to a float value in [0,1] by sigmoid function.\\n\\n"',
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 3e-3,
            "neurons": 283,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 3e-3,
          "input_neurons_per_million": 283
        },
        "display": "$0.003 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 35335689,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/bge-reranker-base/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/run"
      ],
      "aliases": [
        "@cf/baai/bge-reranker-base",
        "bge-reranker-base"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 28
      }
    },
    {
      "id": "@cf/baai/bge-large-en-v1.5",
      "name": "bge-large-en-v1.5",
      "author": "BAAI",
      "task": "text-embeddings",
      "description": "BAAI general embedding (Large) model that transforms any given text into a 1024-dimensional vector",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.204,
            "neurons": 18582,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.204,
          "input_neurons_per_million": 18582
        },
        "display": "$0.204 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 538155,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/bge-large-en-v1.5/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/embeddings",
        "/v1/run"
      ],
      "aliases": [
        "@cf/baai/bge-large-en-v1.5",
        "bge-large-en-v1.5"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 29
      }
    },
    {
      "id": "@cf/baai/bge-small-en-v1.5",
      "name": "bge-small-en-v1.5",
      "author": "BAAI",
      "task": "text-embeddings",
      "description": "BAAI general embedding (Small) model that transforms any given text into a 384-dimensional vector",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.02,
            "neurons": 1841,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.02,
          "input_neurons_per_million": 1841
        },
        "display": "$0.02 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 5431830,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/bge-small-en-v1.5/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/embeddings",
        "/v1/run"
      ],
      "aliases": [
        "@cf/baai/bge-small-en-v1.5",
        "bge-small-en-v1.5"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 30
      }
    },
    {
      "id": "@cf/huggingface/distilbert-sst-2-int8",
      "name": "distilbert-sst-2-int8",
      "author": "HuggingFace",
      "task": "text-classification",
      "description": "Distilled BERT model that was finetuned on SST-2 for sentiment classification",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.026,
            "neurons": 2394,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.026,
          "input_neurons_per_million": 2394
        },
        "display": "$0.026 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 4177109,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/distilbert-sst-2-int8/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/run"
      ],
      "aliases": [
        "@cf/huggingface/distilbert-sst-2-int8",
        "distilbert-sst-2-int8"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 31
      }
    },
    {
      "id": "@cf/lykon/dreamshaper-8-lcm",
      "name": "dreamshaper-8-lcm",
      "author": "lykon",
      "task": "text-to-image",
      "description": "Stable Diffusion model that has been fine-tuned to be better at photorealism without sacrificing range.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "image"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/dreamshaper-8-lcm/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/images/generations",
        "/v1/run"
      ],
      "aliases": [
        "@cf/lykon/dreamshaper-8-lcm",
        "dreamshaper-8-lcm"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 32
      }
    },
    {
      "id": "@cf/google/embeddinggemma-300m",
      "name": "embeddinggemma-300m",
      "author": "Google",
      "task": "text-embeddings",
      "description": "EmbeddingGemma is a 300M parameter, state-of-the-art for its size, open embedding model from Google, built from Gemma 3 (with T5Gemma initialization) and the same research and technology used to create Gemini models. EmbeddingGemma produces vector representations of text, making it well-suited for search and retrieval tasks, including classification, clustering, and semantic similarity search. This model was trained with data in 100+ spoken languages.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/embeddinggemma-300m/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/embeddings",
        "/v1/run"
      ],
      "aliases": [
        "@cf/google/embeddinggemma-300m",
        "embeddinggemma-300m"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 33
      }
    },
    {
      "id": "@cf/black-forest-labs/flux-2-dev",
      "name": "flux-2-dev",
      "author": "Black Forest Labs",
      "task": "text-to-image",
      "description": "FLUX.2 [dev] is an image model from Black Forest Labs where you can generate highly realistic and detailed images, with multi-reference support.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "image"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_image_tile_step",
            "usd": 21e-5,
            "neurons": 18.75,
            "unit": "per input 512x512 tile, per step"
          },
          {
            "kind": "output_image_tile_step",
            "usd": 41e-5,
            "neurons": 37.5,
            "unit": "per output 512x512 tile, per step"
          }
        ],
        "tokens": {},
        "display": "$0.00021 / input tile/step \xB7 $0.00041 / output tile/step",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/flux-2-dev/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/images/generations",
        "/v1/run"
      ],
      "aliases": [
        "@cf/black-forest-labs/flux-2-dev",
        "flux-2-dev"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 34
      }
    },
    {
      "id": "@cf/black-forest-labs/flux-1-schnell",
      "name": "flux-1-schnell",
      "author": "Black Forest Labs",
      "task": "text-to-image",
      "description": '"FLUX.1 [schnell] is a 12 billion parameter rectified flow transformer capable of generating images from text descriptions. "',
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "image"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "image_tile",
            "usd": 528e-7,
            "neurons": 4.8,
            "unit": "per 512x512 tile"
          },
          {
            "kind": "step",
            "usd": 1056e-7,
            "neurons": 9.6,
            "unit": "per step"
          }
        ],
        "tokens": {},
        "display": "$0.0000528 / tile \xB7 $0.0001056 / step",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/images/generations",
        "/v1/run"
      ],
      "aliases": [
        "@cf/black-forest-labs/flux-1-schnell",
        "flux-1-schnell"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 35
      }
    },
    {
      "id": "@cf/leonardo/lucid-origin",
      "name": "lucid-origin",
      "author": "Leonardo",
      "task": "text-to-image",
      "description": `"Lucid Origin from Leonardo.AI is their most adaptable and prompt-responsive model to date. Whether you're generating images with sharp graphic design, stunning full-HD renders, or highly specific creative direction, it adheres closely to your prompts, renders text with accuracy, and supports a wide array of visual styles and aesthetics \u2013 from stylized concept art to crisp product mockups.\\n"`,
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "image"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "image_tile",
            "usd": 6996e-6,
            "neurons": 636,
            "unit": "per 512x512 tile"
          },
          {
            "kind": "step",
            "usd": 132e-6,
            "neurons": 12,
            "unit": "per step"
          }
        ],
        "tokens": {},
        "display": "$0.006996 / tile \xB7 $0.000132 / step",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/lucid-origin/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/images/generations",
        "/v1/run"
      ],
      "aliases": [
        "@cf/leonardo/lucid-origin",
        "lucid-origin"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 36
      }
    },
    {
      "id": "@cf/leonardo/phoenix-1.0",
      "name": "phoenix-1.0",
      "author": "Leonardo",
      "task": "text-to-image",
      "description": "Phoenix 1.0 is a model by Leonardo.Ai that generates images with exceptional prompt adherence and coherent text.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "image"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "image_tile",
            "usd": 583e-5,
            "neurons": 530,
            "unit": "per 512x512 tile"
          },
          {
            "kind": "step",
            "usd": 11e-5,
            "neurons": 10,
            "unit": "per step"
          }
        ],
        "tokens": {},
        "display": "$0.00583 / tile \xB7 $0.00011 / step",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/phoenix-1.0/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/images/generations",
        "/v1/run"
      ],
      "aliases": [
        "@cf/leonardo/phoenix-1.0",
        "phoenix-1.0"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 37
      }
    },
    {
      "id": "@cf/pipecat-ai/smart-turn-v2",
      "name": "smart-turn-v2",
      "author": "Pipecat",
      "task": "dumb-pipe",
      "description": "An open source, community-driven, native audio turn detection model in 2nd version",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "audio_minute",
            "usd": 33795e-8,
            "neurons": 0.51,
            "unit": "per audio minute input"
          }
        ],
        "tokens": {},
        "display": "$0.00033795 / audio minute",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/smart-turn-v2/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/run"
      ],
      "aliases": [
        "@cf/pipecat-ai/smart-turn-v2",
        "smart-turn-v2"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 38
      }
    },
    {
      "id": "@cf/microsoft/resnet-50",
      "name": "resnet-50",
      "author": "Microsoft",
      "task": "image-classification",
      "description": "50 layers deep image classification CNN trained on more than 1M images from ImageNet",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "image",
            "usd": 2.51,
            "neurons": 228055,
            "unit": "per M images"
          }
        ],
        "tokens": {},
        "display": "$2.51 / image",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/resnet-50/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/run"
      ],
      "aliases": [
        "@cf/microsoft/resnet-50",
        "resnet-50"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 39
      }
    },
    {
      "id": "@cf/stabilityai/stable-diffusion-xl-base-1.0",
      "name": "stable-diffusion-xl-base-1.0",
      "author": "Stability.ai",
      "task": "text-to-image",
      "description": "Diffusion-based text-to-image generative model by Stability AI. Generates and modify images based on text prompts.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "image"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-base-1.0/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/images/generations",
        "/v1/run"
      ],
      "aliases": [
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        "stable-diffusion-xl-base-1.0"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 40
      }
    },
    {
      "id": "@cf/bytedance/stable-diffusion-xl-lightning",
      "name": "stable-diffusion-xl-lightning",
      "author": "ByteDance",
      "task": "text-to-image",
      "description": "SDXL-Lightning is a lightning-fast text-to-image generation model. It can generate high-quality 1024px images in a few steps.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "image"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-lightning/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/images/generations",
        "/v1/run"
      ],
      "aliases": [
        "@cf/bytedance/stable-diffusion-xl-lightning",
        "stable-diffusion-xl-lightning"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 41
      }
    },
    {
      "id": "@cf/runwayml/stable-diffusion-v1-5-inpainting",
      "name": "stable-diffusion-v1-5-inpainting",
      "author": "RunwayML",
      "task": "text-to-image",
      "description": "Stable Diffusion Inpainting is a latent text-to-image diffusion model capable of generating photo-realistic images given any text input, with the extra capability of inpainting the pictures by using a mask.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "image"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/stable-diffusion-v1-5-inpainting/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/images/generations",
        "/v1/run"
      ],
      "aliases": [
        "@cf/runwayml/stable-diffusion-v1-5-inpainting",
        "stable-diffusion-v1-5-inpainting"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 37.3,
        "tier": "C",
        "basis": [
          "size unknown",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 40,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 42
      }
    },
    {
      "id": "@cf/openai/gpt-oss-20b",
      "name": "gpt-oss-20b",
      "author": "OpenAI",
      "task": "text-generation",
      "description": "OpenAI\u2019s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases \u2013 gpt-oss-20b is for lower latency, and local or specialized use-cases.",
      "context_window": 128e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.2,
            "neurons": 18182,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.3,
            "neurons": 27273,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.2,
          "input_neurons_per_million": 18182,
          "output_usd_per_million": 0.3,
          "output_neurons_per_million": 27273
        },
        "display": "$0.2 / input \xB7 $0.3 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 366663,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/gpt-oss-20b/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/openai/gpt-oss-20b",
        "gpt-oss-20b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 36.3,
        "tier": "C",
        "basis": [
          "20B parameters",
          "128k context",
          "reasoning",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 68,
          "context": 63,
          "recency": 45,
          "price": 31,
          "override": null
        },
        "rank": 43
      }
    },
    {
      "id": "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
      "name": "deepseek-r1-distill-qwen-32b",
      "author": "DeepSeek",
      "task": "text-generation",
      "description": "DeepSeek-R1-Distill-Qwen-32B is a model distilled from DeepSeek-R1 based on Qwen2.5. It outperforms OpenAI-o1-mini across various benchmarks, achieving new state-of-the-art results for dense models.",
      "context_window": 8e4,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.497,
            "neurons": 45170,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 4.881,
            "neurons": 443756,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.497,
          "input_neurons_per_million": 45170,
          "output_usd_per_million": 4.881,
          "output_neurons_per_million": 443756
        },
        "display": "$0.497 / input \xB7 $4.881 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 22534,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/deepseek-r1-distill-qwen-32b/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
        "deepseek-r1-distill-qwen-32b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 35.4,
        "tier": "C",
        "basis": [
          "32B parameters",
          "80k context",
          "reasoning",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 50,
          "context": 54,
          "recency": 45,
          "price": 80,
          "override": null
        },
        "rank": 44
      }
    },
    {
      "id": "@cf/swiss-ai/apertus-v1.5-8b",
      "name": "apertus-v1.5-8b",
      "author": "swiss-ai",
      "task": "text-generation",
      "description": '"Apertus 1.5 is an 8B parameter language model designed to advance the state of multilingual, multimodal, fully open, and transparent AI. The models support a wide range of languages, handle contexts of up to 262,144 tokens, and it uses only fully open training data whilst delivering performance comparable to other models of similar size. For access, please fill out this form: https://forms.gle/kgvmkr6ucHN3xNuH6"',
      "context_window": 262144,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": true
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/apertus-v1.5-8b/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/swiss-ai/apertus-v1.5-8b",
        "apertus-v1.5-8b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 34.6,
        "tier": "D",
        "basis": [
          "8B parameters",
          "262k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 48,
          "context": 76,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 45
      }
    },
    {
      "id": "@cf/moondream/moondream3.1-9B-A2B",
      "name": "moondream3.1-9B-A2B",
      "author": "moondream",
      "task": "image-to-text",
      "description": "Moondream 3 is a fast, efficient 9B mixture-of-experts vision language model (2B active parameters) that delivers frontier-level visual reasoning for tasks like object detection, pointing, OCR, and structured output.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "image"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": true,
        "structured_output": true,
        "vision": true,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.3,
            "neurons": 27273,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1,
            "neurons": 90909,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.3,
          "input_neurons_per_million": 27273,
          "output_usd_per_million": 1,
          "output_neurons_per_million": 90909
        },
        "display": "$0.3 / input \xB7 $1 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 11e4,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/moondream3.1-9B-A2B/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/run"
      ],
      "aliases": [
        "@cf/moondream/moondream3.1-9B-A2B",
        "moondream3.1-9B-A2B"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 33.5,
        "tier": "D",
        "basis": [
          "2B active",
          "context unknown",
          "reasoning",
          "vision",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 68,
          "context": 30,
          "recency": 45,
          "price": 53,
          "override": null
        },
        "rank": 46
      }
    },
    {
      "id": "@cf/meta/llama-4-scout-17b-16e-instruct",
      "name": "llama-4-scout-17b-16e-instruct",
      "author": "Meta",
      "task": "text-generation",
      "description": "Meta's Llama 4 Scout is a 17 billion parameter model with 16 experts that is natively multimodal. These models leverage a mixture-of-experts architecture to offer industry-leading performance in text and image understanding.",
      "context_window": 131e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.27,
            "neurons": 24545,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.85,
            "neurons": 77273,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.27,
          "input_neurons_per_million": 24545,
          "output_usd_per_million": 0.85,
          "output_neurons_per_million": 77273
        },
        "display": "$0.27 / input \xB7 $0.85 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 129411,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/meta/llama-4-scout-17b-16e-instruct",
        "llama-4-scout-17b-16e-instruct"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 33.2,
        "tier": "D",
        "basis": [
          "17B parameters",
          "131k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 48,
          "context": 63,
          "recency": 45,
          "price": 50,
          "override": null
        },
        "rank": 47
      }
    },
    {
      "id": "@cf/meta/llama-3.2-11b-vision-instruct",
      "name": "llama-3.2-11b-vision-instruct",
      "author": "Meta",
      "task": "text-generation",
      "description": '" The Llama 3.2-Vision instruction-tuned models are optimized for visual recognition, image reasoning, captioning, and answering general questions about an image."',
      "context_window": 128e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.049,
            "neurons": 4410,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.676,
            "neurons": 61493,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.049,
          "input_neurons_per_million": 4410,
          "output_usd_per_million": 0.676,
          "output_neurons_per_million": 61493
        },
        "display": "$0.049 / input \xB7 $0.676 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 162620,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/meta/llama-3.2-11b-vision-instruct",
        "llama-3.2-11b-vision-instruct"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 33.2,
        "tier": "D",
        "basis": [
          "11B parameters",
          "128k context",
          "reasoning",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 50,
          "context": 63,
          "recency": 45,
          "price": 46,
          "override": null
        },
        "rank": 48
      }
    },
    {
      "id": "@cf/qwen/qwen3-30b-a3b-fp8",
      "name": "qwen3-30b-a3b-fp8",
      "author": "Qwen",
      "task": "text-generation",
      "description": "Qwen3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models. Built upon extensive training, Qwen3 delivers groundbreaking advancements in reasoning, instruction-following, agent capabilities, and multilingual support.",
      "context_window": 32768,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": true
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.051,
            "neurons": 4625,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.335,
            "neurons": 30475,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.051,
          "input_neurons_per_million": 4625,
          "output_usd_per_million": 0.335,
          "output_neurons_per_million": 30475
        },
        "display": "$0.051 / input \xB7 $0.335 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 328137,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/qwen/qwen3-30b-a3b-fp8",
        "qwen3-30b-a3b-fp8"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 32.8,
        "tier": "D",
        "basis": [
          "3B active",
          "33k context",
          "reasoning",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 68,
          "context": 38,
          "recency": 45,
          "price": 33,
          "override": null
        },
        "rank": 49
      }
    },
    {
      "id": "@cf/mistralai/mistral-small-3.1-24b-instruct",
      "name": "mistral-small-3.1-24b-instruct",
      "author": "MistralAI",
      "task": "text-generation",
      "description": "Building upon Mistral Small 3 (2501), Mistral Small 3.1 (2503) adds state-of-the-art vision understanding and enhances long context capabilities up to 128k tokens without compromising text performance. With 24 billion parameters, this model achieves top-tier capabilities in both text and vision tasks.",
      "context_window": 128e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.351,
            "neurons": 31876,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.555,
            "neurons": 50488,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.351,
          "input_neurons_per_million": 31876,
          "output_usd_per_million": 0.555,
          "output_neurons_per_million": 50488
        },
        "display": "$0.351 / input \xB7 $0.555 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 198066,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/mistralai/mistral-small-3.1-24b-instruct",
        "mistral-small-3.1-24b-instruct"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 32.4,
        "tier": "D",
        "basis": [
          "24B parameters",
          "128k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 48,
          "context": 63,
          "recency": 45,
          "price": 42,
          "override": null
        },
        "rank": 50
      }
    },
    {
      "id": "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      "name": "llama-3.3-70b-instruct-fp8-fast",
      "author": "Meta",
      "task": "text-generation",
      "description": "Llama 3.3 70B quantized to fp8 precision, optimized to be faster.",
      "context_window": 24e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.293,
            "neurons": 26668,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 2.253,
            "neurons": 204805,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.293,
          "input_neurons_per_million": 26668,
          "output_usd_per_million": 2.253,
          "output_neurons_per_million": 204805
        },
        "display": "$0.293 / input \xB7 $2.253 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 48826,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        "llama-3.3-70b-instruct-fp8-fast"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 30.3,
        "tier": "D",
        "basis": [
          "70B parameters",
          "24k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 48,
          "context": 32,
          "recency": 45,
          "price": 67,
          "override": null
        },
        "rank": 51
      }
    },
    {
      "id": "@cf/qwen/qwq-32b",
      "name": "qwq-32b",
      "author": "Qwen",
      "task": "text-generation",
      "description": "QwQ is the reasoning model of the Qwen series. Compared with conventional instruction-tuned models, QwQ, which is capable of thinking and reasoning, can achieve significantly enhanced performance in downstream tasks, especially hard problems. QwQ-32B is the medium-sized reasoning model, which is capable of achieving competitive performance against state-of-the-art reasoning models, e.g., DeepSeek-R1, o1-mini.",
      "context_window": 24e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": true,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.66,
            "neurons": 6e4,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1,
            "neurons": 90909,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.66,
          "input_neurons_per_million": 6e4,
          "output_usd_per_million": 1,
          "output_neurons_per_million": 90909
        },
        "display": "$0.66 / input \xB7 $1 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 11e4,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/qwq-32b/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/qwen/qwq-32b",
        "qwq-32b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 29.4,
        "tier": "D",
        "basis": [
          "32B parameters",
          "24k context",
          "reasoning",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 50,
          "context": 32,
          "recency": 45,
          "price": 53,
          "override": null
        },
        "rank": 52
      }
    },
    {
      "id": "@cf/utter-project/eurollm-9b-it",
      "name": "eurollm-9b-it",
      "author": "utter-project",
      "task": "text-generation",
      "description": '"EuroLLM-9B is a 9B parameter model trained on 4 trillion tokens divided across the considered languages and several data sources: Web data, parallel data (en-xx and xx-en), and high-quality datasets. For access, please fill out this form: https://forms.gle/kgvmkr6ucHN3xNuH6"',
      "context_window": 32e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": true,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/eurollm-9b-it/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/utter-project/eurollm-9b-it",
        "eurollm-9b-it"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 28.9,
        "tier": "D",
        "basis": [
          "9B parameters",
          "32k context",
          "tools",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 48,
          "context": 38,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 53
      }
    },
    {
      "id": "@cf/aisingapore/gemma-sea-lion-v4-27b-it",
      "name": "gemma-sea-lion-v4-27b-it",
      "author": "aisingapore",
      "task": "text-generation",
      "description": "SEA-LION stands for Southeast Asian Languages In One Network, which is a collection of Large Language Models (LLMs) which have been pretrained and instruct-tuned for the Southeast Asia (SEA) region.",
      "context_window": 128e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.351,
            "neurons": 31876,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.555,
            "neurons": 50488,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.351,
          "input_neurons_per_million": 31876,
          "output_usd_per_million": 0.555,
          "output_neurons_per_million": 50488
        },
        "display": "$0.351 / input \xB7 $0.555 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 198066,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/gemma-sea-lion-v4-27b-it/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/aisingapore/gemma-sea-lion-v4-27b-it",
        "gemma-sea-lion-v4-27b-it"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 27.9,
        "tier": "D",
        "basis": [
          "27B parameters",
          "128k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 63,
          "recency": 45,
          "price": 42,
          "override": null
        },
        "rank": 54
      }
    },
    {
      "id": "@cf/cloudflare/clef",
      "name": "clef",
      "author": "Cloudflare",
      "task": "text-generation",
      "description": "Clef is a 27B multimodal decision model that turns a state and a schema of typed questions into decisions. It reads the state as text, JSON, images, or video, and returns a probability for every allowed option of every question.",
      "context_window": 65536,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.24,
            "neurons": 21818,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.24,
          "input_neurons_per_million": 21818
        },
        "display": "$0.24 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 458337,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/clef/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/cloudflare/clef",
        "clef"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 26.3,
        "tier": "D",
        "basis": [
          "27B parameters",
          "66k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 51,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 55
      }
    },
    {
      "id": "@cf/cloudflare/clef-omni",
      "name": "clef-omni",
      "author": "Cloudflare",
      "task": "text-generation",
      "description": "Clef-omni is a multimodal decision model built on a 30B-parameter mixture-of-experts (3B active) backbone. It turns a state and a schema of typed questions into decisions, reads the state as text, JSON, images, audio, or video, and returns a probability for every allowed option of every question.",
      "context_window": 64e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.15,
            "neurons": 13636,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.15,
          "input_neurons_per_million": 13636
        },
        "display": "$0.15 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 733352,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/clef-omni/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/cloudflare/clef-omni",
        "clef-omni"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 26.3,
        "tier": "D",
        "basis": [
          "30B parameters",
          "64k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 50,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 56
      }
    },
    {
      "id": "@cf/llava-hf/llava-1.5-7b-hf",
      "name": "llava-1.5-7b-hf",
      "author": "llava-hf",
      "task": "image-to-text",
      "description": "LLaVA is an open-source chatbot trained by fine-tuning LLaMA/Vicuna on GPT-generated multimodal instruction-following data. It is an auto-regressive language model, based on the transformer architecture.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "image"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": true,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/llava-1.5-7b-hf/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/run"
      ],
      "aliases": [
        "@cf/llava-hf/llava-1.5-7b-hf",
        "llava-1.5-7b-hf"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 25.8,
        "tier": "D",
        "basis": [
          "7B parameters",
          "context unknown",
          "vision",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 40,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 57
      }
    },
    {
      "id": "@cf/meta/llama-3.2-3b-instruct",
      "name": "llama-3.2-3b-instruct",
      "author": "Meta",
      "task": "text-generation",
      "description": "The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.",
      "context_window": 8e4,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": true
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.051,
            "neurons": 4625,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.335,
            "neurons": 30475,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.051,
          "input_neurons_per_million": 4625,
          "output_usd_per_million": 0.335,
          "output_neurons_per_million": 30475
        },
        "display": "$0.051 / input \xB7 $0.335 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 328137,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-3.2-3b-instruct/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/meta/llama-3.2-3b-instruct",
        "llama-3.2-3b-instruct"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 25.7,
        "tier": "D",
        "basis": [
          "3B parameters",
          "80k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 54,
          "recency": 45,
          "price": 33,
          "override": null
        },
        "rank": 58
      }
    },
    {
      "id": "@cf/qwen/qwen2.5-coder-32b-instruct",
      "name": "qwen2.5-coder-32b-instruct",
      "author": "Qwen",
      "task": "text-generation",
      "description": '"Qwen2.5-Coder is the latest series of Code-Specific Qwen large language models (formerly known as CodeQwen). As of now, Qwen2.5-Coder has covered six mainstream model sizes, 0.5, 1.5, 3, 7, 14, 32 billion parameters, to meet the needs of different developers. Qwen2.5-Coder brings the following improvements upon CodeQwen1.5:"',
      "context_window": 32768,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.66,
            "neurons": 6e4,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 1,
            "neurons": 90909,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.66,
          "input_neurons_per_million": 6e4,
          "output_usd_per_million": 1,
          "output_neurons_per_million": 90909
        },
        "display": "$0.66 / input \xB7 $1 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 11e4,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/qwen2.5-coder-32b-instruct/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/qwen/qwen2.5-coder-32b-instruct",
        "qwen2.5-coder-32b-instruct"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 25.2,
        "tier": "D",
        "basis": [
          "32B parameters",
          "33k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 38,
          "recency": 45,
          "price": 53,
          "override": null
        },
        "rank": 59
      }
    },
    {
      "id": "@cf/meta/llama-3.2-1b-instruct",
      "name": "llama-3.2-1b-instruct",
      "author": "Meta",
      "task": "text-generation",
      "description": "The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.",
      "context_window": 6e4,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": true
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.027,
            "neurons": 2457,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.201,
            "neurons": 18252,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.027,
          "input_neurons_per_million": 2457,
          "output_usd_per_million": 0.201,
          "output_neurons_per_million": 18252
        },
        "display": "$0.027 / input \xB7 $0.201 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 547885,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-3.2-1b-instruct/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/meta/llama-3.2-1b-instruct",
        "llama-3.2-1b-instruct"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 24,
        "tier": "D",
        "basis": [
          "1B parameters",
          "60k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 49,
          "recency": 45,
          "price": 24,
          "override": null
        },
        "rank": 60
      }
    },
    {
      "id": "@cf/meta/llama-guard-3-8b",
      "name": "llama-guard-3-8b",
      "author": "Meta",
      "task": "text-generation",
      "description": "Llama Guard 3 is a Llama-3.1-8B pretrained model, fine-tuned for content safety classification. Similar to previous versions, it can be used to classify content in both LLM inputs (prompt classification) and in LLM responses (response classification). It acts as an LLM \u2013 it generates text in its output that indicates whether a given prompt or response is safe or unsafe, and if unsafe, it also lists the content categories violated.",
      "context_window": 131072,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.484,
            "neurons": 44003,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.03,
            "neurons": 2730,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.484,
          "input_neurons_per_million": 44003,
          "output_usd_per_million": 0.03,
          "output_neurons_per_million": 2730
        },
        "display": "$0.484 / input \xB7 $0.03 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 3663003,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-guard-3-8b/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/meta/llama-guard-3-8b",
        "llama-guard-3-8b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 23.7,
        "tier": "D",
        "basis": [
          "8B parameters",
          "131k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 63,
          "recency": 45,
          "price": 0,
          "override": null
        },
        "rank": 61
      }
    },
    {
      "id": "@cf/cloudflare/clef-flash",
      "name": "clef-flash",
      "author": "Cloudflare",
      "task": "text-generation",
      "description": "Clef-flash is a fast 9B multimodal decision model that turns a state and a schema of typed questions into decisions. It reads the state as text, JSON, images, or video, and returns a probability for every allowed option of every question.",
      "context_window": 24576,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.038,
            "neurons": 3455,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.038,
          "input_neurons_per_million": 3455
        },
        "display": "$0.038 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 2894356,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/clef-flash/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/cloudflare/clef-flash",
        "clef-flash"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 23.7,
        "tier": "D",
        "basis": [
          "9B parameters",
          "25k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 33,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 62
      }
    },
    {
      "id": "@cf/black-forest-labs/flux-2-klein-4b",
      "name": "flux-2-klein-4b",
      "author": "Black Forest Labs",
      "task": "text-to-image",
      "description": "FLUX.2 [klein] is an ultra-fast, distilled image model. It unifies image generation and editing in a single model, delivering state-of-the-art quality enabling interactive workflows, real-time previews, and latency-critical applications.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "image"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "image_tile",
            "usd": 59e-6,
            "neurons": 5.37,
            "unit": "per input 512x512 tile"
          },
          {
            "kind": "image_tile",
            "usd": 287e-6,
            "neurons": 26.05,
            "unit": "per output 512x512 tile"
          }
        ],
        "tokens": {},
        "display": "$0.000059 / tile \xB7 $0.000287 / tile",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/images/generations",
        "/v1/run"
      ],
      "aliases": [
        "@cf/black-forest-labs/flux-2-klein-4b",
        "flux-2-klein-4b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 23.3,
        "tier": "D",
        "basis": [
          "4B parameters",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 63
      }
    },
    {
      "id": "@cf/black-forest-labs/flux-2-klein-9b",
      "name": "flux-2-klein-9b",
      "author": "Black Forest Labs",
      "task": "text-to-image",
      "description": "FLUX.2 [klein] 9B is a 9 billion parameter model that can generate images from text descriptions and supports multi-reference editing capabilities.",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "image"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "image_megapixel",
            "usd": 0.015,
            "neurons": 1363.64,
            "unit": "per first MP (1024x1024)"
          },
          {
            "kind": "image_megapixel",
            "usd": 2e-3,
            "neurons": 181.82,
            "unit": "per subsequent MP"
          },
          {
            "kind": "image",
            "usd": 2e-3,
            "neurons": 181.82,
            "unit": "per input image MP"
          }
        ],
        "tokens": {},
        "display": "$0.015 / MP \xB7 $0.002 / MP \xB7 $0.002 / image",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/flux-2-klein-9b/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/images/generations",
        "/v1/run"
      ],
      "aliases": [
        "@cf/black-forest-labs/flux-2-klein-9b",
        "flux-2-klein-9b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 23.3,
        "tier": "D",
        "basis": [
          "9B parameters",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 64
      }
    },
    {
      "id": "@cf/pfnet/plamo-embedding-1b",
      "name": "plamo-embedding-1b",
      "author": "pfnet",
      "task": "text-embeddings",
      "description": '"PLaMo-Embedding-1B is a Japanese text embedding model developed by Preferred Networks, Inc.\\n\\nIt can convert Japanese text input into numerical vectors and can be used for a wide range of applications, including information retrieval, text classification, and clustering."',
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.019,
            "neurons": 1689,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.019,
          "input_neurons_per_million": 1689
        },
        "display": "$0.019 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 5920663,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/plamo-embedding-1b/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/embeddings",
        "/v1/run"
      ],
      "aliases": [
        "@cf/pfnet/plamo-embedding-1b",
        "plamo-embedding-1b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 23.3,
        "tier": "D",
        "basis": [
          "1B parameters",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 65
      }
    },
    {
      "id": "@cf/meta/llama-3.1-8b-instruct-fp8",
      "name": "llama-3.1-8b-instruct-fp8",
      "author": "Meta",
      "task": "text-generation",
      "description": "Llama 3.1 8B quantized to FP8 precision",
      "context_window": 32e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.152,
            "neurons": 13778,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.287,
            "neurons": 26128,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.152,
          "input_neurons_per_million": 13778,
          "output_usd_per_million": 0.287,
          "output_neurons_per_million": 26128
        },
        "display": "$0.152 / input \xB7 $0.287 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 382731,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/meta/llama-3.1-8b-instruct-fp8",
        "llama-3.1-8b-instruct-fp8"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 23,
        "tier": "D",
        "basis": [
          "8B parameters",
          "32k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 38,
          "recency": 45,
          "price": 31,
          "override": null
        },
        "rank": 66
      }
    },
    {
      "id": "@cf/mistral/mistral-7b-instruct-v0.2-lora",
      "name": "mistral-7b-instruct-v0.2-lora",
      "author": "MistralAI",
      "task": "text-generation",
      "description": "The Mistral-7B-Instruct-v0.2 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-7B-v0.2.",
      "context_window": 15e3,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/mistral-7b-instruct-v0.2-lora/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/mistral/mistral-7b-instruct-v0.2-lora",
        "mistral-7b-instruct-v0.2-lora"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 22.3,
        "tier": "D",
        "basis": [
          "7B parameters",
          "15k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 24,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 67
      }
    },
    {
      "id": "@cf/ai4bharat/indictrans2-en-indic-1B",
      "name": "indictrans2-en-indic-1B",
      "author": "ai4bharat",
      "task": "translation",
      "description": "IndicTrans2 is the first open-source transformer-based multilingual NMT model that supports high-quality translations across all the 22 scheduled Indic languages",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": true
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.342,
            "neurons": 31050,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.342,
            "neurons": 31050,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.342,
          "input_neurons_per_million": 31050,
          "output_usd_per_million": 0.342,
          "output_neurons_per_million": 31050
        },
        "display": "$0.342 / input \xB7 $0.342 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 322061,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/indictrans2-en-indic-1B/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/run"
      ],
      "aliases": [
        "@cf/ai4bharat/indictrans2-en-indic-1B",
        "indictrans2-en-indic-1B"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 22.1,
        "tier": "D",
        "basis": [
          "1B parameters",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 34,
          "override": null
        },
        "rank": 68
      }
    },
    {
      "id": "@cf/meta/m2m100-1.2b",
      "name": "m2m100-1.2b",
      "author": "Meta",
      "task": "translation",
      "description": "Multilingual encoder-decoder (seq-to-seq) model trained for Many-to-Many multilingual translation",
      "context_window": null,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": true
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.342,
            "neurons": 31050,
            "unit": "per M input tokens"
          },
          {
            "kind": "output_token",
            "usd": 0.342,
            "neurons": 31050,
            "unit": "per M output tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.342,
          "input_neurons_per_million": 31050,
          "output_usd_per_million": 0.342,
          "output_neurons_per_million": 31050
        },
        "display": "$0.342 / input \xB7 $0.342 / output",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 322061,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/m2m100-1.2b/",
      "openai_compatible": false,
      "endpoints": [
        "/v1/run"
      ],
      "aliases": [
        "@cf/meta/m2m100-1.2b",
        "m2m100-1.2b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 22.1,
        "tier": "D",
        "basis": [
          "1.2B parameters",
          "context unknown",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 30,
          "recency": 45,
          "price": 34,
          "override": null
        },
        "rank": 69
      }
    },
    {
      "id": "@cf/google/gemma-2b-it-lora",
      "name": "gemma-2b-it-lora",
      "author": "Google",
      "task": "text-generation",
      "description": "This is a Gemma-2B base model that Cloudflare dedicates for inference with LoRA adapters. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models.",
      "context_window": 8192,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/gemma-2b-it-lora/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/google/gemma-2b-it-lora",
        "gemma-2b-it-lora"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 20.7,
        "tier": "D",
        "basis": [
          "2B parameters",
          "8k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 13,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 70
      }
    },
    {
      "id": "@cf/meta-llama/llama-2-7b-chat-hf-lora",
      "name": "llama-2-7b-chat-hf-lora",
      "author": "Meta",
      "task": "text-generation",
      "description": '"This is a Llama2 base model that Cloudflare dedicated for inference with LoRA adapters. Llama 2 is a collection of pretrained and fine-tuned generative text models ranging in scale from 7 billion to 70 billion parameters. This is the repository for the 7B fine-tuned model, optimized for dialogue use cases and converted for the Hugging Face Transformers format. "',
      "context_window": 8192,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-2-7b-chat-hf-lora/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/meta-llama/llama-2-7b-chat-hf-lora",
        "llama-2-7b-chat-hf-lora"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 20.7,
        "tier": "D",
        "basis": [
          "7B parameters",
          "8k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 13,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 71
      }
    },
    {
      "id": "@cf/qwen/qwen3-embedding-0.6b",
      "name": "qwen3-embedding-0.6b",
      "author": "Qwen",
      "task": "text-embeddings",
      "description": '"The Qwen3 Embedding model series is the latest proprietary model of the Qwen family, specifically designed for text embedding and ranking tasks. "',
      "context_window": 8192,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [
          {
            "kind": "input_token",
            "usd": 0.012,
            "neurons": 1075,
            "unit": "per M input tokens"
          }
        ],
        "tokens": {
          "input_usd_per_million": 0.012,
          "input_neurons_per_million": 1075
        },
        "display": "$0.012 / input",
        "source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": 9302325,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/qwen3-embedding-0.6b/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/embeddings",
        "/v1/run"
      ],
      "aliases": [
        "@cf/qwen/qwen3-embedding-0.6b",
        "qwen3-embedding-0.6b"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 20.7,
        "tier": "D",
        "basis": [
          "0.6B parameters",
          "8k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 13,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 72
      }
    },
    {
      "id": "@cf/google/gemma-7b-it-lora",
      "name": "gemma-7b-it-lora",
      "author": "Google",
      "task": "text-generation",
      "description": '"  This is a Gemma-7B base model that Cloudflare dedicates for inference with LoRA adapters. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models."',
      "context_window": 3500,
      "max_output_tokens": null,
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "capabilities": {
        "function_calling": false,
        "reasoning": false,
        "structured_output": false,
        "vision": false,
        "audio_input": false,
        "audio_output": false,
        "streaming": true,
        "multilingual": false
      },
      "pricing": {
        "items": [],
        "tokens": {},
        "display": "\u2014",
        "source": null
      },
      "requires_paid": false,
      "deprecated": false,
      "free": true,
      "free_daily_output_tokens": null,
      "created_at": null,
      "created_unix": null,
      "docs_url": "https://developers.cloudflare.com/workers-ai/models/gemma-7b-it-lora/",
      "openai_compatible": true,
      "endpoints": [
        "/v1/chat/completions",
        "/v1/run"
      ],
      "aliases": [
        "@cf/google/gemma-7b-it-lora",
        "gemma-7b-it-lora"
      ],
      "source": "docs-snapshot",
      "performance": {
        "score": 18.8,
        "tier": "D",
        "basis": [
          "7B parameters",
          "4k context",
          "heuristic score"
        ],
        "components": {
          "size": 0,
          "capability": 30,
          "context": 0,
          "recency": 45,
          "price": 45,
          "override": null
        },
        "rank": 73
      }
    }
  ]
};

// src/catalog/index.js
var CATALOG_KEY = "catalog:cache:v3";
var PRICING_KEY = "pricing:cache:v2";
var CATALOG_TTL_MS = 15 * 60 * 1e3;
var PRICING_TTL_MS = 6 * 60 * 60 * 1e3;
var inflight = null;
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
    per_page: "100",
    page: String(page),
    hide_experimental: "false",
    include_deprecated: "true"
  });
  if (format) params.set("format", format);
  const url = `https://api.cloudflare.com/client/v4/accounts/${account.accountId}/ai/models/search?${params}`;
  const data = await fetchJson(url, {
    headers: {
      Authorization: `Bearer ${account.apiToken}`,
      Accept: "application/json"
    }
  });
  return Array.isArray(data.result) ? data.result : Array.isArray(data.data) ? data.data : [];
}
async function fetchFormat(account, format) {
  const models = [];
  for (let page = 1; page <= 10; page += 1) {
    const pageModels = await fetchModelsPage(account, page, format);
    models.push(...pageModels);
    if (pageModels.length < 100) break;
  }
  return models;
}
function mergeFormats(native, openrouter) {
  const byId = /* @__PURE__ */ new Map();
  for (const raw of openrouter) {
    if (raw?.id) byId.set(String(raw.id), { ...raw });
  }
  for (const raw of native) {
    if (!raw?.id) continue;
    const key = String(raw.id);
    const existing = byId.get(key);
    byId.set(key, existing ? { ...existing, ...raw } : { ...raw });
  }
  return [...byId.values()];
}
async function fetchAllModels(env) {
  const accounts = shuffle(await getActiveAccounts(env)).slice(0, 3);
  if (accounts.length === 0) throw new Error("No active Cloudflare account configured");
  let lastError = null;
  for (const account of accounts) {
    const [nativeResult, openrouterResult] = await Promise.allSettled([
      fetchFormat(account, null),
      fetchFormat(account, "openrouter")
    ]);
    const native = nativeResult.status === "fulfilled" ? nativeResult.value : [];
    const openrouter = openrouterResult.status === "fulfilled" ? openrouterResult.value : [];
    const models = mergeFormats(native, openrouter);
    if (models.length > 0) {
      return {
        models,
        formats: {
          native: native.length,
          openrouter: openrouter.length,
          merged: models.length
        },
        account: { id: account.id, name: account.name, accountId: account.accountId }
      };
    }
    lastError = nativeResult.status === "rejected" ? nativeResult.reason : openrouterResult.status === "rejected" ? openrouterResult.reason : lastError;
  }
  throw lastError || new Error("Unable to fetch models");
}
async function getPricing(env, { force = false } = {}) {
  const now = Date.now();
  let cached = null;
  try {
    cached = await env.KV.get(PRICING_KEY, "json");
  } catch {
    cached = null;
  }
  if (!force && cached && now - cached.fetched_at < PRICING_TTL_MS) return cached;
  try {
    const response = await fetch(PRICING_URL, {
      headers: { Accept: "text/markdown, text/plain;q=0.9, */*;q=0.5", "User-Agent": "WorkersAI2API/2.0" },
      cf: { cacheEverything: true, cacheTtl: 3600 }
    });
    if (!response.ok) throw new Error(`Pricing docs ${response.status}`);
    const markdown = await response.text();
    const parsed = parsePricingMarkdown(markdown);
    const record = { ...parsed, fetched_at: now };
    await env.KV.put(PRICING_KEY, JSON.stringify(record), { expirationTtl: 7 * 24 * 60 * 60 });
    return record;
  } catch (error) {
    if (cached) return { ...cached, stale: true, error: error.message };
    const fallback = catalog_snapshot_default.pricing || { models: {}, paidOnly: [], freeDailyNeurons: 1e4 };
    return { ...fallback, fetched_at: 0, stale: true, error: error.message };
  }
}
function snapshotById() {
  const map = /* @__PURE__ */ new Map();
  for (const model of catalog_snapshot_default.models || []) map.set(model.id, model);
  return map;
}
function tally(models, key) {
  const out = {};
  for (const model of models) {
    const value = model[key] || "unknown";
    out[value] = (out[value] || 0) + 1;
  }
  return out;
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
    capabilities: { ...base.capabilities || {}, ...model.capabilities || {} },
    pricing: model.pricing?.items?.length ? model.pricing : base.pricing,
    requires_paid: model.requires_paid || base.requires_paid,
    deprecated: Boolean(model.deprecated || base.deprecated),
    free: model.free && base.free !== false,
    free_daily_output_tokens: model.free_daily_output_tokens || base.free_daily_output_tokens,
    aliases: [.../* @__PURE__ */ new Set([...base.aliases || [], ...model.aliases || []])]
  };
}
async function buildCatalog(env) {
  const settings = await getSettings(env);
  const freeQuota = Number(settings.dailyNeurons) || 1e4;
  const snapshotMap = snapshotById();
  let pricing;
  let live;
  try {
    [pricing, live] = await Promise.allSettled([getPricing(env), fetchAllModels(env)]).then((results) => [
      results[0].status === "fulfilled" ? results[0].value : null,
      results[1].status === "fulfilled" ? results[1].value : null
    ]);
  } catch {
    pricing = null;
    live = null;
  }
  const paidOnly = new Set(pricing?.paidOnly || []);
  const pricingMap = pricing?.models || {};
  let models = [];
  let source = "bundled-snapshot";
  if (live?.models?.length) {
    models = live.models.map((raw) => normalizeModel(raw, {
      paidOnly,
      pricing: pricingMap[String(raw.id)],
      freeQuota
    })).filter(Boolean);
    if (models.length > 0) source = "cloudflare-models-api";
  }
  if (models.length === 0) {
    models = (catalog_snapshot_default.models || []).map((model) => ({
      ...model,
      pricing: pricingMap[model.id] || model.pricing,
      requires_paid: model.requires_paid || paidOnly.has(model.id),
      free: !(model.requires_paid || paidOnly.has(model.id))
    }));
  }
  const byId = /* @__PURE__ */ new Map();
  for (const model of models) {
    const merged = mergeWithSnapshot(model, snapshotMap);
    merged.requires_paid = Boolean(merged.requires_paid || paidOnly.has(merged.id));
    merged.free = !merged.requires_paid;
    byId.set(merged.id, merged);
  }
  for (const base of catalog_snapshot_default.models || []) {
    if (byId.has(base.id)) continue;
    const requiresPaid = base.requires_paid || paidOnly.has(base.id);
    if (!requiresPaid) continue;
    byId.set(base.id, {
      ...base,
      pricing: pricingMap[base.id] || base.pricing,
      requires_paid: true,
      free: false
    });
  }
  const ranked = rankModels([...byId.values()], settings.benchmarks || {});
  const now = Date.now();
  const authors = tally(ranked, "author");
  const tasks = tally(ranked, "task");
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
      deprecated_models: ranked.filter((model) => model.deprecated).length,
      partner_models: ranked.filter((model) => model.author && model.author !== "Cloudflare").length,
      authors,
      tasks,
      formats: live?.formats || null,
      account: live?.account || null,
      stale: source !== "cloudflare-models-api",
      version: catalog_snapshot_default.generated_at || null
    }
  };
}
async function refresh(env) {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const result = await buildCatalog(env);
      const ttl = result.meta.source === "cloudflare-models-api" ? 7 * 24 * 60 * 60 : 60 * 60;
      await env.KV.put(CATALOG_KEY, JSON.stringify(result), { expirationTtl: ttl });
      return result;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
async function getCatalog(env, ctx, { force = false } = {}) {
  let cached = null;
  try {
    cached = await env.KV.get(CATALOG_KEY, "json");
  } catch {
    cached = null;
  }
  const age = cached ? Date.now() - cached.meta.fetched_at : Infinity;
  if (!force && cached && age < CATALOG_TTL_MS) return cached;
  if (!force && cached) {
    ctx?.waitUntil?.(refresh(env).catch(() => {
    }));
    return { ...cached, meta: { ...cached.meta, stale: true } };
  }
  try {
    return await refresh(env);
  } catch (error) {
    if (cached) return { ...cached, meta: { ...cached.meta, stale: true, error: error.message } };
    const models = (catalog_snapshot_default.models || []).map((model) => ({ ...model }));
    return {
      models,
      meta: {
        source: "bundled-snapshot",
        fetched_at: Date.now(),
        free_daily_neurons: 1e4,
        total_models: models.length,
        free_models: models.filter((model) => model.free).length,
        paid_models: models.filter((model) => model.requires_paid).length,
        deprecated_models: models.filter((model) => model.deprecated).length,
        partner_models: models.filter((model) => model.author && model.author !== "Cloudflare").length,
        authors: tally(models, "author"),
        tasks: tally(models, "task"),
        stale: true,
        error: error.message
      }
    };
  }
}
function findModel(catalog, requested, customAliases = {}) {
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
function publicModel(model) {
  return {
    id: model.id,
    object: "model",
    created: model.created_unix || 0,
    owned_by: model.author || "cloudflare",
    name: model.name,
    description: model.description,
    created_at: model.created_at,
    task: model.task,
    context_window: model.context_window,
    max_output_tokens: model.max_output_tokens,
    capabilities: model.capabilities,
    modalities: model.modalities,
    pricing: model.pricing,
    free: model.free,
    requires_paid: model.requires_paid,
    deprecated: model.deprecated,
    free_daily_output_tokens: model.free_daily_output_tokens,
    performance: model.performance,
    endpoints: model.endpoints,
    aliases: model.aliases,
    docs_url: model.docs_url
  };
}

// src/proxy/models.js
async function loadCatalog(env, ctx, { force = false } = {}) {
  return getCatalog(env, ctx, { force });
}
function resolveModel(catalog, requested, settings, { task = null, freeOnly = true } = {}) {
  const model = findModel(catalog, requested, settings?.aliases || {});
  if (!model) {
    const needle = String(requested || "").toLowerCase();
    const suggestions = catalog.models.filter((item) => item.free && (!task || item.task === task)).filter((item) => !needle || item.id.toLowerCase().includes(needle.slice(0, 3))).slice(0, 5).map((item) => item.id);
    const error = new RequestError(
      `Model "${requested}" was not found in the live Workers AI catalog. Call GET /v1/models for the current list.`,
      { status: 404, code: "model_not_found", extra: { suggestions } }
    );
    throw error;
  }
  if (freeOnly && model.requires_paid) {
    throw new RequestError(
      `Model "${model.id}" requires a Workers Paid plan or AI Gateway prepaid credits and is not available in the free catalog.`,
      { status: 403, code: "model_requires_paid_plan" }
    );
  }
  if (task && model.task !== task) {
    throw new RequestError(
      `Model "${model.id}" is a ${model.task} model, not ${task}.`,
      { status: 400, code: "model_task_mismatch" }
    );
  }
  return model;
}
async function catalogResponse(env, ctx, {
  includePaid = false,
  task = null,
  search = null,
  sort = "performance",
  limit = null
} = {}) {
  const catalog = await loadCatalog(env, ctx);
  let models = catalog.models.filter((model) => model.free || includePaid);
  if (task) models = models.filter((model) => model.task === task);
  if (search) {
    const needle = String(search).toLowerCase();
    models = models.filter((model) => model.id.toLowerCase().includes(needle) || model.name.toLowerCase().includes(needle) || model.description.toLowerCase().includes(needle));
  }
  const sorters = {
    performance: (a, b) => (b.performance?.score || 0) - (a.performance?.score || 0),
    price: (a, b) => {
      const av = Number(a.pricing?.tokens?.output_usd_per_million ?? a.pricing?.items?.[0]?.usd ?? Infinity);
      const bv = Number(b.pricing?.tokens?.output_usd_per_million ?? b.pricing?.items?.[0]?.usd ?? Infinity);
      return av - bv;
    },
    context: (a, b) => (b.context_window || 0) - (a.context_window || 0),
    name: (a, b) => a.name.localeCompare(b.name),
    updated: (a, b) => (Date.parse(b.created_at || 0) || 0) - (Date.parse(a.created_at || 0) || 0)
  };
  models = [...models].sort(sorters[sort] || sorters.performance);
  if (limit) models = models.slice(0, limit);
  if (sort === "performance") {
    models = models.map((model, index) => ({
      ...model,
      performance: { ...model.performance || {}, rank: index + 1 }
    }));
  }
  return {
    object: "list",
    data: models.map(publicModel),
    meta: {
      ...catalog.meta,
      returned: models.length,
      include_paid: includePaid,
      sort
    }
  };
}

// src/quota.js
var NEURONS_PER_USD = 1e6 / 11;
var FALLBACK_INPUT_NEURONS_PER_MILLION = 5e4;
var FALLBACK_OUTPUT_NEURONS_PER_MILLION = 15e4;
function dailyLimit(settings, env) {
  const configured = Number(settings?.dailyNeurons) || Number(env?.FREE_DAILY_NEURONS) || 1e4;
  return Math.max(0, configured);
}
function tokenRates(model) {
  const tokens = model?.pricing?.tokens || {};
  return {
    input: Number(tokens.input_neurons_per_million) || FALLBACK_INPUT_NEURONS_PER_MILLION,
    output: Number(tokens.output_neurons_per_million) || FALLBACK_OUTPUT_NEURONS_PER_MILLION,
    cached: Number(tokens.cached_input_neurons_per_million) || null
  };
}
function costForTokens(tokens, rates) {
  return Math.max(1, Math.ceil(
    tokens.input / 1e6 * rates.input + tokens.cached / 1e6 * (rates.cached || rates.input) + tokens.output / 1e6 * rates.output
  ));
}
function estimateChatNeurons(model, body, settings) {
  const rates = tokenRates(model);
  const promptTokens = estimateTokens(body?.messages || body?.prompt || "") + estimateTokens(body?.tools || null);
  const requested = Number(body?.max_tokens ?? body?.max_completion_tokens);
  const fallbackOutput = Math.min(
    Number(settings?.defaultMaxOutputTokens) || 1024,
    Number(model?.max_output_tokens) || 1024
  );
  const outputTokens = Number.isFinite(requested) && requested > 0 ? requested : fallbackOutput;
  return costForTokens({ input: promptTokens, cached: 0, output: outputTokens }, rates);
}
function estimateEmbeddingNeurons(model, body) {
  const rates = tokenRates(model);
  const tokens = estimateTokens(body?.input || "");
  return costForTokens({ input: tokens, cached: 0, output: 0 }, rates);
}
function estimateImageNeurons(model, body) {
  const items = model?.pricing?.items || [];
  const steps = Math.max(1, Number(body?.steps) || 4);
  const perStep = items.find((item) => item.kind === "step")?.neurons || 0;
  const perTile = items.find((item) => item.kind === "image_tile")?.neurons || items.find((item) => item.kind === "image")?.neurons || 0;
  const estimate = perStep * steps + perTile;
  return Math.max(1, Math.ceil(estimate || 1e3));
}
function estimateSpeechNeurons(model, body) {
  const items = model?.pricing?.items || [];
  const chars = String(body?.input || body?.prompt || "").length;
  const perKChar = items.find((item) => item.kind === "character")?.neurons;
  const perMinute = items.find((item) => item.kind === "audio_minute")?.neurons;
  if (perKChar) return Math.max(1, Math.ceil(chars / 1e3 * perKChar));
  if (perMinute) return Math.max(1, Math.ceil(perMinute));
  return 1e3;
}
function estimateTranscriptionNeurons(model) {
  const perMinute = (model?.pricing?.items || []).find((item) => item.kind === "audio_minute")?.neurons;
  return Math.max(1, Math.ceil(perMinute || 1e3));
}
function estimateNeuronsForTask(model, task, body, settings) {
  switch (task) {
    case "chat":
      return estimateChatNeurons(model, body, settings);
    case "embeddings":
      return estimateEmbeddingNeurons(model, body);
    case "image":
      return estimateImageNeurons(model, body);
    case "speech":
      return estimateSpeechNeurons(model, body);
    case "transcription":
      return estimateTranscriptionNeurons(model);
    default: {
      const rates = tokenRates(model);
      const inputTokens = estimateTokens(body);
      return Math.max(1e3, costForTokens({ input: inputTokens, cached: 0, output: 0 }, rates));
    }
  }
}
function actualChatNeurons(model, usage) {
  if (!usage) return null;
  const rates = tokenRates(model);
  const prompt = Number(usage.prompt_tokens ?? usage.input_tokens ?? 0);
  const completion = Number(usage.completion_tokens ?? usage.output_tokens ?? 0);
  if (!prompt && !completion) return null;
  const cached = Number(
    usage.prompt_tokens_details?.cached_tokens ?? usage.input_tokens_details?.cached_tokens ?? usage.cached_tokens ?? 0
  );
  return costForTokens({
    input: Math.max(0, prompt - cached),
    cached: Math.max(0, cached),
    output: completion
  }, rates);
}
function estimateTokensFromText(text) {
  if (!text) return 0;
  return Math.ceil(String(text).length / 3.6);
}
function quotaStub(env, accountId, day) {
  if (!env.QUOTA) return null;
  const id = env.QUOTA.idFromName(`${accountId}:${day}`);
  return env.QUOTA.get(id);
}
async function callBackend(env, accountId, day, action, payload) {
  const stub = quotaStub(env, accountId, day);
  if (stub) {
    const response = await stub.fetch(`https://quota.internal/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, ...payload })
    });
    return response.json();
  }
  return kvBackend(env, accountId, day, action, payload);
}
async function kvBackend(env, accountId, day, action, payload) {
  const key = `quota:${accountId}:${day}`;
  const limit = Math.max(0, Number(payload.limit) || 0);
  let record = { used: 0, reserved: 0 };
  try {
    record = await env.KV.get(key, "json") || record;
  } catch {
    record = { used: 0, reserved: 0 };
  }
  const remaining = () => Math.max(0, limit - record.used - record.reserved);
  switch (action) {
    case "reserve": {
      const amount = Math.max(0, Math.ceil(Number(payload.amount) || 0));
      if (record.used + record.reserved + amount > limit) {
        return { ok: false, used: record.used, reserved: record.reserved, remaining: remaining(), limit };
      }
      record.reserved += amount;
      break;
    }
    case "settle": {
      record.reserved = Math.max(0, record.reserved - Math.max(0, Math.ceil(Number(payload.reserved) || 0)));
      record.used += Math.max(0, Math.ceil(Number(payload.actual) || 0));
      break;
    }
    case "reconcile": {
      record.used = Math.max(record.used, Math.max(0, Math.ceil(Number(payload.used) || 0)));
      break;
    }
    case "exhaust": {
      record.used = limit;
      record.reserved = 0;
      break;
    }
    case "status":
      break;
    default:
      return { ok: false, error: "not found" };
  }
  record.updatedAt = Date.now();
  await env.KV.put(key, JSON.stringify(record), { expirationTtl: 172800 });
  return {
    ok: true,
    used: record.used,
    reserved: record.reserved,
    remaining: remaining(),
    limit
  };
}
async function reserveQuota(env, accountId, amount, limit, day = utcDay()) {
  try {
    return await callBackend(env, accountId, day, "reserve", { amount, limit });
  } catch (error) {
    return { ok: false, error: `Quota backend unavailable: ${error.message}`, remaining: 0, limit };
  }
}
async function settleQuota(env, accountId, reserved, actual, limit, day = utcDay()) {
  try {
    return await callBackend(env, accountId, day, "settle", { reserved, actual, limit });
  } catch {
    return { ok: false };
  }
}
async function reconcileQuota(env, accountId, used, limit, day = utcDay()) {
  try {
    return await callBackend(env, accountId, day, "reconcile", { used, limit });
  } catch {
    return { ok: false };
  }
}
async function exhaustQuota(env, accountId, limit, day = utcDay()) {
  try {
    return await callBackend(env, accountId, day, "exhaust", { limit });
  } catch {
    return { ok: false };
  }
}
async function quotaStatus(env, accountId, limit, day = utcDay()) {
  try {
    return await callBackend(env, accountId, day, "status", { limit });
  } catch (error) {
    return { ok: false, error: error.message, used: 0, remaining: 0, limit };
  }
}

// src/usage.js
var USAGE_KEY = "usage:cloud:v2";
var SUMMARY_KEY = "usage:summary:v2";
var SUMMARY_TTL_MS = 3e4;
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
  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.apiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables: { accountId: account.accountId, start: startDateTime } })
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
    const date = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    history[date] = 0;
  }
  const models = {};
  let todayTotal = 0;
  for (const group of groups) {
    const date = group.dimensions?.date;
    const model = group.dimensions?.modelId || "unknown";
    const neurons = Number(group.sum?.totalNeurons) || 0;
    if (date === today) {
      todayTotal += neurons;
      models[model] = models[model] || { model, neurons: 0, requests: 0 };
      models[model].neurons += neurons;
      models[model].requests += Number(group.count) || 0;
    }
    if (history[date] !== void 0) history[date] += neurons;
  }
  return {
    todayTotal,
    models: Object.values(models).sort((a, b) => b.neurons - a.neurons),
    history: Object.keys(history).sort().map((date) => ({ date, neurons: history[date] }))
  };
}
async function refreshCloudUsage(env, { limit = 10 } = {}) {
  const accounts = await getActiveAccounts(env);
  const settings = await getSettings(env);
  const dayLimit = dailyLimit(settings, env);
  const today = utcDay();
  const startToday = `${today}T00:00:00Z`;
  const startWeek = new Date(Date.parse(`${today}T00:00:00Z`) - 6 * 864e5).toISOString().split(".")[0] + "Z";
  const details = {};
  await Promise.all(accounts.slice(0, limit).map(async (account) => {
    try {
      const [todayGroups, weekGroups] = await Promise.all([
        queryGraphQL(account, startToday),
        queryGraphQL(account, startWeek)
      ]);
      const parsed = processGroups(todayGroups);
      const week = processGroups(weekGroups);
      details[account.id] = {
        status: "ok",
        cloudUsed: parsed.todayTotal,
        models: parsed.models,
        history: week.history,
        error: null,
        checkedAt: Date.now()
      };
      await reconcileQuota(env, account.id, parsed.todayTotal, dayLimit);
    } catch (error) {
      details[account.id] = {
        status: "error",
        cloudUsed: null,
        models: [],
        history: [],
        error: error.message,
        checkedAt: Date.now()
      };
    }
  }));
  const record = { accounts: details, fetchedAt: Date.now() };
  await env.KV.put(USAGE_KEY, JSON.stringify(record), { expirationTtl: 86400 });
  return record;
}
async function getCloudUsage(env, { force = false } = {}) {
  if (!force) {
    const cached = await env.KV.get(USAGE_KEY, "json").catch(() => null);
    if (cached && Date.now() - cached.fetchedAt < 5 * 6e4) return cached;
    if (cached) return cached;
  }
  return refreshCloudUsage(env);
}
async function getUsageSummary(env, ctx, { force = false } = {}) {
  const settings = await getSettings(env);
  const limit = dailyLimit(settings, env);
  const accounts = await getActiveAccounts(env);
  if (!force) {
    const cached = await env.KV.get(SUMMARY_KEY, "json").catch(() => null);
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
      error: status.error || null
    };
  }));
  const cloud = await getCloudUsage(env, { force: false }).catch(() => null);
  const models = /* @__PURE__ */ new Map();
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
    usagePercentage: totalLimit > 0 ? Math.round(used / totalLimit * 1e4) / 100 : 0,
    remainingNeurons: Math.max(0, totalLimit - used - reserved),
    modelsToday: [...models.values()].sort((a, b) => b.neurons - a.neurons),
    accounts: local,
    quotaBackend: env.QUOTA ? "durable-object" : "kv",
    cloudUsageError: cloud ? void 0 : "Cloud analytics unavailable; using local accounting.",
    fetchedAt: Date.now(),
    limit
  };
  await env.KV.put(SUMMARY_KEY, JSON.stringify(summary), { expirationTtl: 3600 });
  return summary;
}

// src/admin.js
async function requireAdmin(request, env) {
  if (!await isAdmin(request, env)) {
    throw new RequestError("Unauthorized. Sign in at /admin.", { status: 401, code: "unauthorized", type: "authentication_error" });
  }
}
function publicAccount(account) {
  return {
    id: account.id,
    name: account.name,
    accountId: account.accountId,
    status: account.status,
    createdAt: account.createdAt,
    tokenPreview: account.apiToken ? `\u2022\u2022\u2022\u2022${String(account.apiToken).slice(-4)}` : ""
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
    enabled: key.enabled !== false
  };
}
function sanitizeSettings(settings, env, patch = {}) {
  const maxDaily = Math.max(1, Number(env.MAX_DAILY_NEURONS) || 1e4);
  const next = { ...settings };
  if (patch.gatewayId !== void 0) next.gatewayId = String(patch.gatewayId || "").trim().slice(0, 120);
  if (patch.gatewaySkipCache !== void 0) next.gatewaySkipCache = patch.gatewaySkipCache === true;
  if (patch.allowPublic !== void 0) next.allowPublic = patch.allowPublic === true;
  if (patch.defaultMaxOutputTokens !== void 0) {
    next.defaultMaxOutputTokens = Math.min(131072, Math.max(1, Number(patch.defaultMaxOutputTokens) || 1024));
  }
  if (patch.dailyNeurons !== void 0) {
    const value = Number(patch.dailyNeurons);
    if (!Number.isFinite(value) || value < 1) throw new RequestError("dailyNeurons must be a positive number", { status: 400 });
    if (value > maxDaily) {
      throw new RequestError(`dailyNeurons cannot exceed ${maxDaily.toLocaleString()} (the free allowance guard). Set MAX_DAILY_NEURONS only on a paid plan.`, {
        status: 400,
        code: "quota_limit_exceeded"
      });
    }
    next.dailyNeurons = value;
  }
  if (patch.aliases !== void 0) {
    if (!patch.aliases || typeof patch.aliases !== "object" || Array.isArray(patch.aliases)) {
      throw new RequestError("aliases must be an object mapping alias -> @cf/model", { status: 400 });
    }
    const aliases = {};
    for (const [alias, target] of Object.entries(patch.aliases)) {
      if (!/^[@a-zA-Z0-9._/-]+$/.test(alias) || !String(target).startsWith("@cf/")) {
        throw new RequestError(`Invalid alias: ${alias}`, { status: 400 });
      }
      aliases[alias] = String(target);
    }
    next.aliases = aliases;
  }
  if (patch.benchmarks !== void 0) {
    if (!patch.benchmarks || typeof patch.benchmarks !== "object" || Array.isArray(patch.benchmarks)) {
      throw new RequestError("benchmarks must be an object mapping model id -> 0-100", { status: 400 });
    }
    const benchmarks = {};
    for (const [id, score] of Object.entries(patch.benchmarks)) {
      const value = Number(score);
      if (!id.startsWith("@cf/") || !Number.isFinite(value) || value < 0 || value > 100) {
        throw new RequestError(`Invalid benchmark entry: ${id}`, { status: 400 });
      }
      benchmarks[id] = value;
    }
    next.benchmarks = benchmarks;
  }
  return next;
}
async function handleAdminApi(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  if (path === "/api/health" && method === "GET") {
    const settings = await getSettings(env);
    return json({
      ok: true,
      version: "2.0.0",
      configured: hasAdminPassword(env),
      kv: Boolean(env.KV),
      quota: env.QUOTA ? "durable-object" : "kv",
      daily_neurons: dailyLimit(settings, env),
      ai_gateway: Boolean(settings.gatewayId)
    });
  }
  if (path === "/api/auth/status" && method === "GET") {
    return json({
      configured: hasAdminPassword(env),
      authenticated: await isAdmin(request, env)
    });
  }
  if (path === "/api/auth/login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (!hasAdminPassword(env)) {
      throw new RequestError("ADMIN_PASSWORD is not configured on this deployment.", { status: 503, code: "not_configured" });
    }
    if (!timingSafeEqual(String(body.password || ""), String(env.ADMIN_PASSWORD).trim())) {
      throw new RequestError("Incorrect password.", { status: 401, code: "invalid_password", type: "authentication_error" });
    }
    const token = await adminToken(env);
    const secure = new URL(request.url).protocol === "https:";
    return json({ ok: true }, { headers: { "Set-Cookie": adminCookie(token, { secure }) } });
  }
  if (path === "/api/auth/logout" && method === "POST") {
    const secure = new URL(request.url).protocol === "https:";
    return json({ ok: true }, { headers: { "Set-Cookie": adminCookie("", { clear: true, secure }) } });
  }
  if (path === "/api/catalog" && method === "GET") {
    const data = await catalogResponse(env, ctx, {
      includePaid: url.searchParams.get("include_paid") === "1",
      task: url.searchParams.get("task"),
      search: url.searchParams.get("search"),
      sort: url.searchParams.get("sort") || "performance",
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : null
    });
    return json(data);
  }
  if (path === "/api/stats" && method === "GET") {
    const summary = await getUsageSummary(env, ctx);
    return json({
      total_accounts: summary.totalAccounts,
      usage_percentage: summary.usagePercentage,
      free_daily_neurons: summary.limit,
      quota_backend: summary.quotaBackend
    });
  }
  await requireAdmin(request, env);
  if (path === "/api/usage/summary" && method === "GET") {
    return json(await getUsageSummary(env, ctx));
  }
  if (path === "/api/admin/overview" && method === "GET") {
    const config = await getConfig(env, { force: true });
    const usage = await getUsageSummary(env, ctx);
    return json({
      version: "2.0.0",
      accounts: config.accounts.map(publicAccount),
      keys: config.apiKeys.map(publicKey),
      settings: { ...config.settings },
      usage,
      environment: {
        adminPassword: hasAdminPassword(env),
        kv: Boolean(env.KV),
        quota: env.QUOTA ? "durable-object" : "kv",
        maxDailyNeurons: Number(env.MAX_DAILY_NEURONS) || 1e4
      }
    });
  }
  if (path === "/api/admin/catalog" && method === "GET") {
    return json(await catalogResponse(env, ctx, {
      includePaid: true,
      task: url.searchParams.get("task"),
      search: url.searchParams.get("search"),
      sort: url.searchParams.get("sort") || "performance",
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : null
    }));
  }
  if (path === "/api/admin/catalog/refresh" && method === "POST") {
    const data = await catalogResponse(env, ctx, { includePaid: true, sort: "performance" });
    return json(data);
  }
  if (path === "/api/admin/accounts" && method === "GET") {
    return json({ accounts: (await getAccounts(env)).map(publicAccount) });
  }
  if (path === "/api/admin/accounts" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const accountId = String(body.accountId || "").trim();
    const apiToken = String(body.apiToken || "").trim();
    const name = String(body.name || "").trim() || "Cloudflare account";
    if (!/^[a-f0-9]{32}$/i.test(accountId)) throw new RequestError("accountId must be the 32-character Cloudflare account ID.", { status: 400 });
    if (apiToken.length < 20) throw new RequestError("apiToken looks too short.", { status: 400 });
    let created;
    await updateConfig(env, (config) => {
      if (config.accounts.some((item) => item.accountId === accountId)) {
        throw new RequestError("This Cloudflare account is already configured.", { status: 409, code: "duplicate_account" });
      }
      created = {
        id: randomId("acc_"),
        name,
        accountId,
        apiToken,
        status: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      config.accounts.push(created);
      return config;
    });
    ctx?.waitUntil?.(catalogResponse(env, ctx, { includePaid: true }).catch(() => {
    }));
    return json({ account: publicAccount(created) }, { status: 201 });
  }
  const accountMatch = path.match(/^\/api\/admin\/accounts\/([^/]+)$/);
  if (accountMatch) {
    const id = decodeURIComponent(accountMatch[1]);
    if (method === "PATCH" || method === "PUT") {
      const body = await request.json().catch(() => ({}));
      let updated;
      await updateConfig(env, (config) => {
        const account = config.accounts.find((item) => item.id === id);
        if (!account) throw new RequestError("Account not found.", { status: 404 });
        if (body.name !== void 0) account.name = String(body.name).trim().slice(0, 80) || account.name;
        if (body.apiToken) account.apiToken = String(body.apiToken).trim();
        if (body.status) account.status = body.status === "disabled" ? "disabled" : "active";
        updated = account;
        return config;
      });
      return json({ account: publicAccount(updated) });
    }
    if (method === "DELETE") {
      await updateConfig(env, (config) => {
        config.accounts = config.accounts.filter((item) => item.id !== id);
        return config;
      });
      return json({ ok: true });
    }
  }
  if (path === "/api/admin/accounts/test" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const accountId = String(body.accountId || "").trim();
    const token = String(body.apiToken || "").trim();
    if (!accountId || !token) throw new RequestError("accountId and apiToken are required.", { status: 400 });
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search?per_page=1`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      return json({
        ok: false,
        status: response.status,
        error: data.errors?.[0]?.message || response.statusText
      }, { status: 200 });
    }
    return json({ ok: true, models: Array.isArray(data.result) ? data.result.length : 0 });
  }
  if (path === "/api/admin/keys" && method === "GET") {
    return json({ keys: (await getConfig(env)).apiKeys.map(publicKey) });
  }
  if (path === "/api/admin/keys" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const plaintext = `sk-wa-${randomId("")}`;
    const hash = await sha256Hex(plaintext);
    const record = {
      id: randomId("key_"),
      name: String(body.name || "API key").trim().slice(0, 80),
      hash,
      prefix: plaintext.slice(0, 10),
      last4: plaintext.slice(-4),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastUsedAt: null,
      enabled: true
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
    if (method === "PATCH" || method === "PUT") {
      const body = await request.json().catch(() => ({}));
      let updated;
      await updateConfig(env, (config) => {
        const key = config.apiKeys.find((item) => item.id === id);
        if (!key) throw new RequestError("Key not found.", { status: 404 });
        if (body.name !== void 0) key.name = String(body.name).trim().slice(0, 80) || key.name;
        if (body.enabled !== void 0) key.enabled = body.enabled === true;
        updated = key;
        return config;
      });
      return json({ key: publicKey(updated) });
    }
    if (method === "DELETE") {
      await updateConfig(env, (config) => {
        config.apiKeys = config.apiKeys.filter((item) => item.id !== id);
        return config;
      });
      return json({ ok: true });
    }
  }
  if (path === "/api/admin/settings" && method === "GET") {
    return json({ settings: await getSettings(env) });
  }
  if (path === "/api/admin/settings" && (method === "PUT" || method === "PATCH")) {
    const body = await request.json().catch(() => ({}));
    let saved;
    await updateConfig(env, (config) => {
      config.settings = sanitizeSettings(config.settings, env, body);
      saved = config.settings;
      return config;
    });
    return json({ settings: saved });
  }
  if (path === "/api/admin/usage" && method === "GET") {
    const force = url.searchParams.get("force") === "1";
    if (force) await refreshCloudUsage(env, { limit: 20 }).catch(() => null);
    return json(await getUsageSummary(env, ctx, { force: true }));
  }
  throw new RequestError(`Admin API route not found: ${path}`, { status: 404, code: "not_found" });
}

// src/proxy/inference.js
var InferenceError = class extends Error {
  constructor(message, { status = 502, code = "upstream_error", headers = {}, extra = {} } = {}) {
    super(message);
    this.name = "InferenceError";
    this.status = status;
    this.code = code;
    this.headers = headers;
    this.extra = extra;
  }
  toResponse() {
    return openAIError(this.message, {
      status: this.status,
      type: this.status === 429 ? "insufficient_quota" : "upstream_error",
      code: this.code,
      extra: this.extra
    });
  }
};
function shuffle2(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function upstreamPath(task, model, endpoint = "openai") {
  if (endpoint === "responses") return "/ai/v1/responses";
  if (endpoint === "native" || !model.openai_compatible) return `/ai/run/${model.id}`;
  if (task === "embeddings") return "/ai/v1/embeddings";
  return "/ai/v1/chat/completions";
}
function parseCloudflareError(text) {
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
  }
  const code = data?.errors?.[0]?.code ?? data?.error?.code ?? null;
  const message = data?.errors?.[0]?.message || data?.error?.message || data?.message || String(text || "").slice(0, 500) || "Unknown upstream error";
  return { code, message, data };
}
function classifyError(status, parsed) {
  const code = Number(parsed.code);
  if (code === 3036 || /daily free allocation/i.test(parsed.message)) {
    return { retry: true, exhaust: true, status: 429, code: "insufficient_quota", message: "The daily free allocation of 10,000 neurons is exhausted for this account. It resets at 00:00 UTC." };
  }
  if (code === 5035 || /requires a workers paid plan/i.test(parsed.message)) {
    return { retry: true, status: 403, code: "model_requires_paid_plan", message: "This model requires a Workers Paid plan or AI Gateway prepaid credits and is excluded from the free catalog." };
  }
  if (code === 3040 || /capacity temporarily exceeded/i.test(parsed.message)) {
    return { retry: true, status: 429, code: "capacity_exceeded", message: "Workers AI capacity is temporarily exceeded. Please retry." };
  }
  if (code === 5007 || code === 3042 || status === 404) {
    return { retry: false, status: 404, code: "model_not_found", message: parsed.message };
  }
  if (status === 413 || code === 3006) {
    return { retry: false, status: 413, code: "request_too_large", message: parsed.message };
  }
  if (status === 400 || status === 422) {
    return { retry: false, status: 400, code: "invalid_request", message: parsed.message };
  }
  if (status === 401 || status === 403) {
    return { retry: true, status: 403, code: "account_forbidden", message: parsed.message };
  }
  if (status === 429) {
    return { retry: true, status: 429, code: "rate_limited", message: parsed.message };
  }
  return { retry: status >= 500, status: 502, code: "upstream_error", message: parsed.message };
}
async function runInference(request, env, ctx, {
  model,
  task,
  body,
  stream = false,
  endpoint = "openai",
  rawBody = null,
  contentType = "application/json"
}) {
  const settings = await getSettings(env);
  const accounts = shuffle2(await getActiveAccounts(env));
  if (accounts.length === 0) {
    throw new InferenceError("No active Cloudflare account configured. Add one in the admin panel.", {
      status: 503,
      code: "no_accounts"
    });
  }
  const limit = Number(settings.dailyNeurons) || 1e4;
  const estimate = estimateNeuronsForTask(model, task, body, settings);
  const promptTokens = estimateTokens(body?.messages || body?.input || body?.prompt || "");
  const path = upstreamPath(task, model, endpoint);
  if (estimate > limit) {
    throw new InferenceError(
      `This request needs an estimated ${estimate.toLocaleString()} neurons, which is more than the entire daily free allowance (${limit.toLocaleString()}). Reduce the prompt or max_tokens.`,
      { status: 429, code: "insufficient_quota", extra: { estimated_neurons: estimate, daily_limit: limit } }
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
        limit
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
      "Content-Type": contentType,
      Accept: stream ? "text/event-stream" : "application/json"
    });
    if (settings.gatewayId) headers.set("cf-aig-gateway-id", String(settings.gatewayId));
    if (settings.gatewaySkipCache) headers.set("cf-aig-skip-cache", "true");
    const affinity = request.headers.get("x-session-affinity");
    if (affinity) headers.set("x-session-affinity", affinity);
    for (const name of ["cf-aig-cache-ttl", "cf-aig-cache-key", "cf-aig-skip-cache"]) {
      const value = request.headers.get(name);
      if (value && settings.gatewayId) headers.set(name, value);
    }
    let response;
    try {
      response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${account.accountId}${path}`,
        {
          method: "POST",
          headers,
          body: rawBody ?? JSON.stringify(body)
        }
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
        settle
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
      extra: { upstream_code: parsed.code, account: account.name }
    });
    if (!decision.retry) throw lastError;
  }
  if (exhausted.length > 0 && exhausted.length === accounts.length) {
    throw new InferenceError(
      `All ${accounts.length} Cloudflare account(s) have used their daily free allocation of ${limit.toLocaleString()} neurons. Resets at 00:00 UTC.`,
      {
        status: 429,
        code: "insufficient_quota",
        extra: { accounts: exhausted, daily_limit: limit }
      }
    );
  }
  throw lastError || new InferenceError("All Cloudflare accounts failed", { status: 502 });
}
async function settleFromJson(result, dataExceptUsage) {
  const usage = dataExceptUsage?.usage || dataExceptUsage?.result?.usage || null;
  const actual = actualChatNeurons(result.model, usage);
  const status = await result.settle(actual ?? result.estimate, usage);
  return { actual: actual ?? result.estimate, status };
}
function inferenceHeaders(result, extra = {}) {
  const headers = new Headers(extra);
  headers.set("x-workers-ai-model", result.model.id);
  headers.set("x-workers-ai-account", result.account.name);
  headers.set("x-quota-limit", String(result.limit));
  return headers;
}
function instrumentStream(result, { requestedModel, extraHeaders = {} } = {}) {
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let usage = null;
  const transform = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.usage) usage = parsed.usage;
          const delta = parsed.choices?.[0]?.delta?.content;
          if (typeof delta === "string") text += delta;
          if (typeof parsed.choices?.[0]?.text === "string") text += parsed.choices[0].text;
          if (parsed.model) parsed.model = requestedModel || parsed.model;
        } catch {
        }
      }
    },
    async flush() {
      const actual = actualChatNeurons(result.model, usage) ?? Math.max(
        1,
        Math.ceil((result.promptTokens || 0) / 1e6 * 5e4 + estimateTokensFromText(text) / 1e6 * 15e4)
      );
      await result.settle(actual, usage);
    }
  });
  const headers = inferenceHeaders(result, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    ...extraHeaders
  });
  return new Response(result.response.body.pipeThrough(transform), { status: 200, headers });
}

// src/proxy/chat.js
var PASSTHROUGH_FIELDS = [
  "temperature",
  "top_p",
  "n",
  "stop",
  "max_tokens",
  "max_completion_tokens",
  "presence_penalty",
  "frequency_penalty",
  "logit_bias",
  "logprobs",
  "top_logprobs",
  "seed",
  "user",
  "tools",
  "tool_choice",
  "parallel_tool_calls",
  "response_format",
  "metadata",
  "modalities",
  "audio",
  "prediction",
  "reasoning_effort",
  "web_search_options",
  "store",
  "chat_template_kwargs",
  "options"
];
async function handleChat(request, env, ctx, model, { legacyCompletions = false } = {}) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new RequestError("Invalid JSON body", { status: 400 });
  }
  const requestedModel = String(body.model || model.id);
  const stream = body.stream === true;
  if (legacyCompletions) {
    if (stream) {
      throw new RequestError("Streaming is not supported on /v1/completions. Use /v1/chat/completions.", {
        status: 400,
        code: "stream_not_supported"
      });
    }
    if (body.prompt == null) {
      throw new RequestError("prompt is required", { status: 400, code: "missing_prompt" });
    }
    const prompt = Array.isArray(body.prompt) ? body.prompt.join("\n") : String(body.prompt);
    body.messages = [{ role: "user", content: prompt }];
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    throw new RequestError("messages must be a non-empty array", { status: 400, code: "invalid_messages", param: "messages" });
  }
  const upstreamBody = {
    model: model.id,
    messages: body.messages,
    stream
  };
  for (const field of PASSTHROUGH_FIELDS) {
    if (body[field] !== void 0) upstreamBody[field] = body[field];
  }
  if (stream) {
    upstreamBody.stream_options = { include_usage: true, ...body.stream_options || {} };
  }
  const result = await runInference(request, env, ctx, {
    model,
    task: "chat",
    body: upstreamBody,
    stream
  });
  if (stream) {
    return instrumentStream(result, { requestedModel });
  }
  let data;
  try {
    data = await result.response.json();
  } catch {
    const text = await result.response.text().catch(() => "");
    await result.settle(result.estimate);
    throw new RequestError(`Cloudflare returned a non-JSON response: ${text.slice(0, 200)}`, { status: 502, code: "upstream_invalid_response" });
  }
  const settlement = await settleFromJson(result, data);
  const headers = inferenceHeaders(result, { "Content-Type": "application/json; charset=utf-8" });
  headers.set("x-quota-remaining", String(settlement.status?.remaining ?? 0));
  if (legacyCompletions) {
    return json(toTextCompletion(data, requestedModel), { headers });
  }
  if (data.model !== void 0) data.model = requestedModel;
  if (data.usage && settlement.actual) data.usage.estimated_neurons = settlement.actual;
  return json(data, { headers });
}
function toTextCompletion(data, requestedModel) {
  const choices = (data.choices || []).map((choice, index) => ({
    text: choice.message?.content ?? choice.text ?? "",
    index: choice.index ?? index,
    logprobs: null,
    finish_reason: choice.finish_reason ?? "stop"
  }));
  return {
    id: data.id || `cmpl_${Date.now()}`,
    object: "text_completion",
    created: data.created || Math.floor(Date.now() / 1e3),
    model: requestedModel,
    choices,
    usage: data.usage
  };
}
async function handleResponses(request, env, ctx, model) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new RequestError("Invalid JSON body", { status: 400 });
  }
  if (body.stream === true) {
    throw new RequestError("The Responses API only supports stream: false on Workers AI.", { status: 400, code: "stream_not_supported" });
  }
  if (!model.id.includes("gpt-oss")) {
    throw new RequestError("The /v1/responses endpoint is only available for @cf/openai/gpt-oss-20b and @cf/openai/gpt-oss-120b.", {
      status: 400,
      code: "unsupported_model"
    });
  }
  const upstreamBody = { ...body, model: model.id, stream: false };
  const result = await runInference(request, env, ctx, {
    model,
    task: "chat",
    body: upstreamBody,
    endpoint: "responses"
  });
  const data = await result.response.json();
  const settlement = await settleFromJson(result, data);
  const headers = inferenceHeaders(result, { "Content-Type": "application/json; charset=utf-8" });
  headers.set("x-quota-remaining", String(settlement.status?.remaining ?? 0));
  if (data.model) data.model = body.model || model.id;
  return json(data, { headers });
}

// src/proxy/embeddings.js
async function handleEmbeddings(request, env, ctx, model) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new RequestError("Invalid JSON body", { status: 400 });
  }
  if (body.input == null) {
    throw new RequestError("input is required", { status: 400, code: "missing_input", param: "input" });
  }
  if (model.task !== "text-embeddings") {
    throw new RequestError(`Model "${model.id}" is not an embeddings model.`, { status: 400, code: "model_task_mismatch" });
  }
  const upstreamBody = { model: model.id, input: body.input };
  if (body.encoding_format) upstreamBody.encoding_format = body.encoding_format;
  if (body.user) upstreamBody.user = body.user;
  const result = await runInference(request, env, ctx, {
    model,
    task: "embeddings",
    body: upstreamBody
  });
  const data = await result.response.json();
  const usage = data.usage || null;
  const actual = usage?.prompt_tokens ? Math.ceil(usage.prompt_tokens / 1e6 * (model.pricing?.tokens?.input_neurons_per_million || 5e4)) : result.estimate;
  const settlement = await result.settle(Math.max(1, actual), usage || { prompt_tokens: null, total_tokens: null });
  const headers = inferenceHeaders(result, { "Content-Type": "application/json; charset=utf-8" });
  headers.set("x-quota-remaining", String(settlement?.remaining ?? 0));
  if (data.model) data.model = body.model || model.id;
  return json(data, { headers });
}

// src/proxy/media.js
function parseSize(size, fallback = 1024) {
  const match = String(size || "").match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!match) return { width: fallback, height: fallback };
  return { width: Number(match[1]), height: Number(match[2]) };
}
async function handleImages(request, env, ctx, model) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new RequestError("Invalid JSON body", { status: 400 });
  }
  if (!body.prompt) {
    throw new RequestError("prompt is required", { status: 400, code: "missing_prompt", param: "prompt" });
  }
  const count = Math.min(4, Math.max(1, Number(body.n) || 1));
  const { width, height } = parseSize(body.size);
  const data = [];
  let lastResult = null;
  for (let index = 0; index < count; index += 1) {
    const upstreamBody = {
      prompt: String(body.prompt),
      width,
      height,
      steps: Number(body.steps ?? body.num_steps ?? 4)
    };
    if (body.seed != null) upstreamBody.seed = Number(body.seed) + index;
    if (body.negative_prompt) upstreamBody.negative_prompt = body.negative_prompt;
    if (body.guidance != null) upstreamBody.guidance = Number(body.guidance);
    const result = await runInference(request, env, ctx, {
      model,
      task: "image",
      body: upstreamBody
    });
    const response = await result.response.json();
    const image = response?.result?.image || response?.image || response?.result?.images?.[0];
    if (!image) {
      await result.settle(result.estimate);
      throw new RequestError("Cloudflare returned no image data.", { status: 502, code: "upstream_invalid_response" });
    }
    await result.settle(result.estimate);
    lastResult = result;
    data.push({
      b64_json: image,
      url: response?.result?.url || void 0,
      revised_prompt: body.prompt
    });
  }
  const headers = inferenceHeaders(lastResult, { "Content-Type": "application/json; charset=utf-8" });
  return json({
    created: Math.floor(Date.now() / 1e3),
    data,
    model: body.model || model.id
  }, { headers });
}
async function handleRun(request, env, ctx, model) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new RequestError("Invalid JSON body", { status: 400 });
  }
  const inputs = body.inputs ?? body.input ?? body;
  const result = await runInference(request, env, ctx, {
    model,
    task: "generic",
    body: inputs,
    endpoint: "native"
  });
  const response = await result.response.json();
  await result.settle(result.estimate);
  const headers = inferenceHeaders(result, { "Content-Type": "application/json; charset=utf-8" });
  return json({
    model: body.model || model.id,
    task: model.task,
    result: response?.result ?? response,
    raw: response
  }, { headers });
}
async function handleRerank(request, env, ctx, model) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new RequestError("Invalid JSON body", { status: 400 });
  }
  if (!body.query) throw new RequestError("query is required", { status: 400, code: "missing_query" });
  if (!Array.isArray(body.documents) || body.documents.length === 0) {
    throw new RequestError("documents must be a non-empty array", { status: 400, code: "missing_documents" });
  }
  const documents = body.documents.map((document) => typeof document === "string" ? document : document.text || document.content || "");
  const topN = Math.min(documents.length, Math.max(1, Number(body.top_n || body.top_k) || documents.length));
  const result = await runInference(request, env, ctx, {
    model,
    task: "generic",
    body: { query: body.query, contexts: documents.map((text) => ({ text })), top_k: topN },
    endpoint: "native"
  });
  const data = await result.response.json();
  await result.settle(result.estimate);
  const raw = data?.result?.response || data?.result || data?.response || [];
  const results = (Array.isArray(raw) ? raw : []).map((item) => {
    const index = Number(item.id ?? item.index);
    return {
      index: Number.isFinite(index) ? index : null,
      relevance_score: Number(item.score ?? item.relevance_score ?? 0),
      ...body.return_documents === false ? {} : { document: documents[index] ?? null }
    };
  }).filter((item) => item.index != null).sort((a, b) => b.relevance_score - a.relevance_score).slice(0, topN);
  const headers = inferenceHeaders(result, { "Content-Type": "application/json; charset=utf-8" });
  return json({ id: `rerank_${Date.now()}`, model: body.model || model.id, results }, { headers });
}

// src/proxy/audio.js
async function handleTranscription(request, env, ctx, model) {
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new RequestError('Expected multipart/form-data with an audio "file" field.', { status: 400, code: "invalid_form_data" });
  }
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new RequestError("file is required", { status: 400, code: "missing_file", param: "file" });
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new RequestError("Audio file is larger than the 25 MB limit.", { status: 413, code: "request_too_large" });
  }
  const language = form.get("language");
  const prompt = form.get("prompt");
  const responseFormat = form.get("response_format") || "json";
  const temperature = form.get("temperature");
  const body = {};
  if (language) body.language = String(language);
  if (prompt) body.prompt = String(prompt);
  if (temperature) body.temperature = Number(temperature);
  if (responseFormat === "verbose_json") body.vtt = true;
  const result = await runInference(request, env, ctx, {
    model,
    task: "transcription",
    body,
    endpoint: "native",
    rawBody: await file.arrayBuffer(),
    contentType: file.type || "audio/mpeg"
  });
  const contentType = result.response.headers.get("Content-Type") || "";
  let data;
  if (contentType.includes("json")) {
    data = await result.response.json();
  } else {
    const text2 = await result.response.text();
    data = { text: text2 };
  }
  const output = data?.result ?? data;
  const text = output?.text ?? "";
  await result.settle(result.estimate, null);
  const headers = inferenceHeaders(result, { "Content-Type": "application/json; charset=utf-8" });
  if (responseFormat === "text") {
    headers.set("Content-Type", "text/plain; charset=utf-8");
    return new Response(text, { headers });
  }
  if (responseFormat === "vtt") {
    headers.set("Content-Type", "text/vtt; charset=utf-8");
    return new Response(output?.vtt || text, { headers });
  }
  if (responseFormat === "srt") {
    headers.set("Content-Type", "application/x-subrip; charset=utf-8");
    return new Response(output?.vtt ? vttToSrt(output.vtt) : text, { headers });
  }
  if (responseFormat === "verbose_json") {
    return json({
      task: "transcribe",
      language: language || null,
      duration: output?.duration ?? null,
      text,
      segments: output?.segments || null,
      words: output?.words || null
    }, { headers });
  }
  return json({ text }, { headers });
}
function vttToSrt(vtt) {
  return String(vtt).replace(/^WEBVTT[^\n]*\n+/i, "").replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, "$1,$2").replace(/\n{3,}/g, "\n\n").trim();
}
async function handleSpeech(request, env, ctx, model) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new RequestError("Invalid JSON body", { status: 400 });
  }
  if (!body.input) {
    throw new RequestError("input is required", { status: 400, code: "missing_input", param: "input" });
  }
  let input;
  if (model.id.includes("melotts")) {
    input = { prompt: String(body.input), lang: body.language || body.lang || "en" };
  } else if (model.id.includes("aura")) {
    input = { text: String(body.input) };
    if (body.voice) input.voice = String(body.voice);
  } else {
    input = { prompt: String(body.input) };
  }
  const result = await runInference(request, env, ctx, {
    model,
    task: "speech",
    body: input,
    endpoint: "native"
  });
  const upstreamType = result.response.headers.get("Content-Type") || "audio/mpeg";
  if (upstreamType.includes("json")) {
    const data = await result.response.json();
    const audio = data?.result?.audio || data?.audio || data?.result;
    await result.settle(result.estimate);
    if (typeof audio === "string") {
      const bytes = Uint8Array.from(atob(audio), (char) => char.charCodeAt(0));
      return new Response(bytes, {
        headers: inferenceHeaders(result, { "Content-Type": "audio/mpeg" })
      });
    }
    throw new RequestError("Cloudflare returned an unexpected TTS payload.", { status: 502, code: "upstream_invalid_response" });
  }
  const transform = new TransformStream({
    async flush() {
      await result.settle(result.estimate);
    }
  });
  const headers = inferenceHeaders(result, { "Content-Type": upstreamType });
  headers.set("Content-Disposition", 'inline; filename="speech.mp3"');
  return new Response(result.response.body.pipeThrough(transform), { headers });
}

// src/proxy/anthropic.js
function blockText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.filter((block) => block.type === "text").map((block) => block.text || "").join("");
}
function anthropicToOpenAI(body) {
  const messages = [];
  if (body.system) {
    messages.push({ role: "system", content: blockText(body.system) });
  }
  for (const message of body.messages || []) {
    const role = message.role;
    const content = message.content;
    if (role === "assistant") {
      let text2 = "";
      const toolCalls = [];
      for (const block of Array.isArray(content) ? content : [{ type: "text", text: content }]) {
        if (block.type === "text") text2 += block.text || "";
        else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            type: "function",
            function: { name: block.name, arguments: JSON.stringify(block.input || {}) }
          });
        }
      }
      const assistant = { role: "assistant", content: text2 || null };
      if (toolCalls.length) assistant.tool_calls = toolCalls;
      messages.push(assistant);
      continue;
    }
    if (role === "user") {
      const parts = [];
      for (const block of Array.isArray(content) ? content : [{ type: "text", text: content }]) {
        if (block.type === "tool_result") {
          messages.push({
            role: "tool",
            tool_call_id: block.tool_use_id,
            content: blockText(block.content)
          });
        } else if (block.type === "text") {
          parts.push({ type: "text", text: block.text || "" });
        } else if (block.type === "image") {
          const source = block.source || {};
          const url = source.type === "url" && source.url ? source.url : source.data ? `data:${source.media_type || "image/png"};base64,${source.data}` : null;
          if (url) parts.push({ type: "image_url", image_url: { url } });
        }
      }
      if (parts.length) messages.push({ role: "user", content: parts });
      continue;
    }
    const text = blockText(content);
    if (text) messages.push({ role, content: text });
  }
  if (messages.length && messages[0].role === "assistant") {
    messages.unshift({ role: "user", content: "_" });
  }
  const openai = {
    messages,
    max_tokens: body.max_tokens,
    stream: body.stream === true
  };
  if (body.temperature !== void 0) openai.temperature = body.temperature;
  if (body.top_p !== void 0) openai.top_p = body.top_p;
  if (body.stop_sequences !== void 0) openai.stop = body.stop_sequences;
  if (body.metadata?.user_id) openai.user = body.metadata.user_id;
  if (Array.isArray(body.tools) && body.tools.length) {
    openai.tools = body.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description || "",
        parameters: tool.input_schema || { type: "object", properties: {} }
      }
    }));
  }
  if (body.tool_choice) {
    if (body.tool_choice.type === "auto") openai.tool_choice = "auto";
    else if (body.tool_choice.type === "any") openai.tool_choice = "required";
    else if (body.tool_choice.type === "tool" && body.tool_choice.name) {
      openai.tool_choice = { type: "function", function: { name: body.tool_choice.name } };
    }
  }
  return openai;
}
function stopReason(finishReason) {
  if (finishReason === "tool_calls") return "tool_use";
  if (finishReason === "length") return "max_tokens";
  if (finishReason === "content_filter") return "end_turn";
  return "end_turn";
}
function openAIToAnthropic(data, model) {
  const choice = data.choices?.[0] || {};
  const message = choice.message || {};
  const content = [];
  if (message.content) content.push({ type: "text", text: message.content });
  for (const call of message.tool_calls || []) {
    let input = {};
    try {
      input = typeof call.function?.arguments === "string" ? JSON.parse(call.function.arguments) : call.function?.arguments || {};
    } catch {
      input = {};
    }
    content.push({ type: "tool_use", id: call.id, name: call.function?.name, input });
  }
  if (content.length === 0) content.push({ type: "text", text: "" });
  return {
    id: `msg_${crypto.randomUUID()}`,
    type: "message",
    role: "assistant",
    content,
    model,
    stop_reason: stopReason(choice.finish_reason),
    stop_sequence: null,
    usage: {
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0
    }
  };
}
async function handleAnthropicMessages(request, env, ctx, model) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new AnthropicError("Invalid JSON body.", 400, "invalid_request_error");
  }
  if (!Array.isArray(body.messages)) {
    throw new AnthropicError("messages field is required and must be an array.", 400, "invalid_request_error");
  }
  if (!body.max_tokens) {
    throw new AnthropicError("max_tokens is required.", 400, "invalid_request_error");
  }
  const requestedModel = body.model || model.id;
  const stream = body.stream === true;
  const openaiBody = anthropicToOpenAI({ ...body, messages: body.messages });
  openaiBody.model = model.id;
  if (stream) openaiBody.stream_options = { include_usage: true };
  const result = await runInference(request, env, ctx, {
    model,
    task: "chat",
    body: openaiBody,
    stream
  });
  const headers = inferenceHeaders(result, {
    "Content-Type": stream ? "text/event-stream; charset=utf-8" : "application/json; charset=utf-8",
    "Cache-Control": stream ? "no-cache, no-transform" : "no-store",
    "anthropic-version": request.headers.get("anthropic-version") || "2023-06-01"
  });
  if (stream) {
    return new Response(anthropicStream(result, requestedModel), { headers });
  }
  const data = await result.response.json();
  const usage = data.usage || null;
  const actual = actualChatNeurons(model, usage) ?? result.estimate;
  const settlement = await result.settle(Math.max(1, actual), usage);
  headers.set("x-quota-remaining", String(settlement?.remaining ?? 0));
  return json(openAIToAnthropic(data, requestedModel), { headers });
}
function handleAnthropicCountTokens(request, env, ctx, model) {
  return request.json().then((body) => {
    const text = JSON.stringify(body.messages || "") + JSON.stringify(body.system || "") + JSON.stringify(body.tools || "");
    return json({ input_tokens: estimateTokens(text) });
  }).catch(() => {
    throw new AnthropicError("Invalid JSON body.", 400, "invalid_request_error");
  });
}
var AnthropicError = class extends Error {
  constructor(message, status = 400, type = "invalid_request_error") {
    super(message);
    this.status = status;
    this.type = type;
  }
  toResponse() {
    return json({ type: "error", error: { type: this.type, message: this.message } }, { status: this.status });
  }
};
function anthropicStream(result, model) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let started = false;
  let finished = false;
  let blockIndex = -1;
  let openBlock = null;
  let toolBlockIndex = -1;
  let inputTokens = 0;
  let outputTokens = 0;
  let text = "";
  let toolArgs = "";
  let finishReason = null;
  const emit = (controller, event, data) => {
    controller.enqueue(encoder.encode(`event: ${event}
data: ${JSON.stringify(data)}

`));
  };
  const start = (controller) => {
    if (started) return;
    started = true;
    emit(controller, "message_start", {
      type: "message_start",
      message: {
        id: `msg_${crypto.randomUUID()}`,
        type: "message",
        role: "assistant",
        content: [],
        model,
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: inputTokens, output_tokens: outputTokens }
      }
    });
  };
  const closeBlock = (controller) => {
    if (openBlock == null) return;
    emit(controller, "content_block_stop", { type: "content_block_stop", index: blockIndex });
    openBlock = null;
  };
  const finish = async (controller) => {
    if (finished) return;
    finished = true;
    start(controller);
    closeBlock(controller);
    emit(controller, "message_delta", {
      type: "message_delta",
      delta: { stop_reason: stopReason(finishReason), stop_sequence: null },
      usage: { output_tokens: outputTokens }
    });
    emit(controller, "message_stop", { type: "message_stop" });
    const usage = { prompt_tokens: inputTokens, completion_tokens: outputTokens };
    const actual = actualChatNeurons(result.model, usage) ?? result.estimate;
    await result.settle(Math.max(1, actual), usage);
  };
  const transform = new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        let event;
        try {
          event = JSON.parse(payload);
        } catch {
          continue;
        }
        if (event.usage) {
          inputTokens = event.usage.prompt_tokens || inputTokens;
          outputTokens = event.usage.completion_tokens || outputTokens;
        }
        const choice = event.choices?.[0];
        if (!choice) continue;
        const delta = choice.delta || {};
        start(controller);
        if (Array.isArray(delta.tool_calls) && delta.tool_calls.length) {
          for (const call of delta.tool_calls) {
            const isNew = toolBlockIndex !== call.index;
            if (isNew) {
              closeBlock(controller);
              blockIndex += 1;
              toolBlockIndex = call.index;
              openBlock = "tool";
              toolArgs = "";
              emit(controller, "content_block_start", {
                type: "content_block_start",
                index: blockIndex,
                content_block: {
                  type: "tool_use",
                  id: call.id || `tool_${crypto.randomUUID()}`,
                  name: call.function?.name || "",
                  input: {}
                }
              });
            }
            const args = call.function?.arguments;
            if (args) {
              toolArgs += args;
              emit(controller, "content_block_delta", {
                type: "content_block_delta",
                index: blockIndex,
                delta: { type: "input_json_delta", partial_json: args }
              });
            }
          }
        } else if (typeof delta.content === "string" && delta.content.length) {
          if (openBlock !== "text") {
            closeBlock(controller);
            blockIndex += 1;
            openBlock = "text";
            emit(controller, "content_block_start", {
              type: "content_block_start",
              index: blockIndex,
              content_block: { type: "text", text: "" }
            });
          }
          text += delta.content;
          emit(controller, "content_block_delta", {
            type: "content_block_delta",
            index: blockIndex,
            delta: { type: "text_delta", text: delta.content }
          });
        }
        if (choice.finish_reason) finishReason = choice.finish_reason;
      }
    },
    async flush(controller) {
      await finish(controller);
    }
  });
  return result.response.body.pipeThrough(transform);
}

// src/ui/i18n.js
var LANGS = ["zh", "en"];
var DEFAULT_LANG = "zh";
var DICT = {
  "brand.name": { zh: "Workers AI2API", en: "Workers AI2API" },
  "nav.admin": { zh: "\u7BA1\u7406", en: "Admin" },
  "nav.status.checking": { zh: "\u68C0\u6D4B\u4E2D", en: "checking" },
  "nav.status.live": { zh: "\u76EE\u5F55\u5B9E\u65F6", en: "catalog live" },
  "nav.status.cached": { zh: "\u76EE\u5F55\u7F13\u5B58", en: "catalog cached" },
  "nav.status.offline": { zh: "\u79BB\u7EBF", en: "offline" },
  "nav.lang.zh": { zh: "\u4E2D\u6587", en: "\u4E2D\u6587" },
  "nav.lang.en": { zh: "EN", en: "EN" },
  "common.copy": { zh: "\u590D\u5236", en: "Copy" },
  "common.copied": { zh: "\u5DF2\u590D\u5236", en: "Copied" },
  "common.loading": { zh: "\u52A0\u8F7D\u4E2D\u2026", en: "Loading\u2026" },
  "common.refresh": { zh: "\u5237\u65B0", en: "Refresh" },
  "common.refreshing": { zh: "\u5237\u65B0\u4E2D\u2026", en: "Refreshing\u2026" },
  "common.save": { zh: "\u4FDD\u5B58\u8BBE\u7F6E", en: "Save settings" },
  "common.allTasks": { zh: "\u5168\u90E8\u4EFB\u52A1", en: "All tasks" },
  "common.search": { zh: "\u641C\u7D22\u6A21\u578B\u2026", en: "Search models\u2026" },
  "common.noData": { zh: "\u6682\u65E0\u6570\u636E", en: "No data yet" },
  "common.close": { zh: "\u5173\u95ED", en: "Close" },
  "common.enable": { zh: "\u542F\u7528", en: "Enable" },
  "common.disable": { zh: "\u7981\u7528", en: "Disable" },
  "common.delete": { zh: "\u5220\u9664", en: "Delete" },
  "common.active": { zh: "\u542F\u7528", en: "active" },
  "common.disabled": { zh: "\u5DF2\u7981\u7528", en: "disabled" },
  "common.never": { zh: "\u4ECE\u672A", en: "never" },
  "common.set": { zh: "\u5DF2\u8BBE\u7F6E", en: "set" },
  "common.missing": { zh: "\u672A\u8BBE\u7F6E", en: "missing" },
  "common.bound": { zh: "\u5DF2\u7ED1\u5B9A", en: "bound" },
  "common.deprecated": { zh: "\u5DF2\u5F03\u7528", en: "deprecated" },
  "common.paidOnly": { zh: "\u9700\u4ED8\u8D39\u8BA1\u5212", en: "paid plan" },
  "common.free": { zh: "\u514D\u8D39", en: "free" },
  "landing.title": { zh: "Workers AI2API \u2014 OpenAI \u517C\u5BB9\u7684 Workers AI \u7F51\u5173", en: "Workers AI2API \u2014 OpenAI-compatible Workers AI gateway" },
  "landing.metaDesc": { zh: "\u628A\u5168\u90E8\u514D\u8D39 Cloudflare Workers AI \u6A21\u578B\u5C01\u88C5\u4E3A\u4E00\u4E2A OpenAI \u517C\u5BB9\u63A5\u53E3\u3002", en: "OpenAI-compatible gateway for every free Cloudflare Workers AI model." },
  "landing.eyebrow": { zh: "\u72EC\u7ACB\u9879\u76EE \xB7 Cloudflare Workers AI", en: "Independent \xB7 Cloudflare Workers AI" },
  "landing.h1": { zh: "\u6240\u6709\u514D\u8D39\u7684 Workers AI \u6A21\u578B\u3002<br>\u4E00\u4E2A OpenAI \u517C\u5BB9\u7AEF\u70B9\u3002", en: "Every free Workers AI model.<br>One OpenAI-compatible endpoint." },
  "landing.lead": { zh: "\u52A8\u6001\u6A21\u578B\u76EE\u5F55\u3001\u6309\u8D26\u53F7\u6838\u7B97\u7684\u514D\u8D39 Neurons\u3001\u6D41\u5F0F\u5BF9\u8BDD\u3001\u5411\u91CF\u3001\u56FE\u50CF\u3001\u8BED\u97F3\u4E0E Anthropic Messages\uFF0C\u5168\u90E8\u8DD1\u5728\u8FB9\u7F18\u7F51\u7EDC\u3002", en: "A dynamic model catalog, per-account free-neuron accounting, and streaming chat, embeddings, images, audio and Anthropic Messages \u2014 deployed at the edge." },
  "landing.stat.freeModels": { zh: "\u514D\u8D39\u6A21\u578B \xB7 \u76EE\u5F55", en: "free models, catalog" },
  "landing.stat.neurons": { zh: "\u6BCF\u8D26\u53F7\u6BCF\u65E5\u514D\u8D39 Neurons", en: "free neurons / account / day" },
  "landing.stat.accounts": { zh: "\u5DF2\u63A5\u5165\u8D26\u53F7", en: "accounts connected" },
  "landing.stat.usage": { zh: "\u4ECA\u65E5\u989D\u5EA6\u5DF2\u7528", en: "of daily quota used" },
  "landing.ledger.title": { zh: "\u514D\u8D39\u989D\u5EA6\u8D26\u672C", en: "Free tier ledger" },
  "landing.ledger.caption": { zh: "\u6BCF\u8D26\u53F7 \xB7 \u6BCF\u65E5 \xB7 UTC 00:00 \u91CD\u7F6E", en: "per account \xB7 per day \xB7 resets 00:00 UTC" },
  "landing.ledger.backend": { zh: "\u8BB0\u8D26\u540E\u7AEF", en: "quota backend" },
  "landing.ledger.remaining": { zh: "\u5269\u4F59 Neurons", en: "neurons remaining" },
  "landing.ledger.note": { zh: "\u786C\u4E0A\u9650\uFF1A\u9884\u7559 + \u7ED3\u7B97\uFF0C\u6C38\u8FDC\u4E0D\u8D8A\u8FC7 10,000 Neurons\u3002", en: "Hard ceiling: reserve, then settle. Never past 10,000 neurons." },
  "landing.catalog.title": { zh: "\u514D\u8D39\u6A21\u578B\u76EE\u5F55", en: "Free model catalog" },
  "landing.catalog.sub": { zh: "\u542B Cloudflare \u6258\u7BA1\u4E0E\u7B2C\u4E09\u65B9\u5408\u4F5C\u6A21\u578B", en: "Cloudflare-hosted and partner models" },
  "landing.sort.performance": { zh: "\u6027\u80FD", en: "Performance" },
  "landing.sort.price": { zh: "\u4EF7\u683C", en: "Price" },
  "landing.sort.context": { zh: "\u4E0A\u4E0B\u6587", en: "Context" },
  "landing.sort.name": { zh: "\u540D\u79F0", en: "Name" },
  "landing.sort.updated": { zh: "\u66F4\u65B0\u65F6\u95F4", en: "Updated" },
  "landing.table.model": { zh: "\u6A21\u578B", en: "Model" },
  "landing.table.task": { zh: "\u4EFB\u52A1", en: "Task" },
  "landing.table.context": { zh: "\u4E0A\u4E0B\u6587", en: "Context" },
  "landing.table.caps": { zh: "\u80FD\u529B", en: "Capabilities" },
  "landing.table.price": { zh: "\u4EF7\u683C\uFF08USD\uFF09", en: "Price (USD)" },
  "landing.table.daily": { zh: "\u514D\u8D39\u65E5\u8F93\u51FA", en: "Free daily output" },
  "landing.table.tier": { zh: "\u7B49\u7EA7", en: "Tier" },
  "landing.table.neurons": { zh: "\u8F93\u51FA Neurons / M", en: "Neurons/M output" },
  "landing.noMatch": { zh: "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u6A21\u578B\u3002", en: "No models match this filter." },
  "landing.count": { zh: "\u663E\u793A {shown} / {total} \u4E2A\u514D\u8D39\u6A21\u578B", en: "{shown} of {total} free models" },
  "landing.footnote": { zh: "\u6027\u80FD\u7B49\u7EA7\u4E3A\u900F\u660E\u542F\u53D1\u5F0F\u4F30\u7B97\uFF08\u53C2\u6570\u91CF\u3001\u80FD\u529B\u3001\u4E0A\u4E0B\u6587\u3001\u53D1\u5E03\u65F6\u95F4\u3001\u4EF7\u683C\uFF09\uFF0C\u53EF\u5728\u7BA1\u7406\u540E\u53F0\u7528\u81EA\u6D4B\u57FA\u51C6\u8986\u76D6\u3002\u4EF7\u683C\u6765\u81EA Cloudflare \u5B9E\u65F6\u5B9A\u4EF7\u9875\uFF1B\u514D\u8D39\u989D\u5EA6\u4E3A\u6BCF\u8D26\u53F7\u6BCF\u5929 10,000 Neurons\u3002", en: "Ranking is a transparent estimate from parameters, capabilities, context, recency and price; override it with your own benchmarks in admin. Prices come from Cloudflare's live pricing page; the free allowance is 10,000 neurons per account per UTC day." },
  "landing.coverage": { zh: "{free} \u4E2A\u514D\u8D39 \xB7 {partners} \u4E2A\u5408\u4F5C\u65B9\u6A21\u578B \xB7 {authors} \u5BB6\u63D0\u4F9B\u65B9", en: "{free} free \xB7 {partners} partner models \xB7 {authors} providers" },
  "landing.paidNote": { zh: "\u9700 Workers Paid \u6216 AI Gateway \u9884\u4ED8\u989D\u5EA6\u7684\u6A21\u578B\u4E0D\u4F1A\u51FA\u73B0\u5728\u514D\u8D39\u76EE\u5F55\u4E2D\uFF0C\u4EE3\u7406\u4F1A\u8FD4\u56DE 403\u3002\u901A\u8FC7 AI Gateway \u8BBF\u95EE\u7684 OpenAI / Anthropic \u7B49\u5916\u90E8 API \u4E0D\u5C5E\u4E8E Workers AI \u514D\u8D39\u989D\u5EA6\u3002", en: "Models requiring Workers Paid or AI Gateway prepaid credits stay out of the free catalog; the proxy returns 403. External APIs reached through AI Gateway (OpenAI, Anthropic, etc.) are not part of the free Workers AI allowance." },
  "landing.cards.vs.title": { zh: "Workers AI \u4E0E AI Gateway \u7684\u533A\u522B", en: "Workers AI vs AI Gateway" },
  "landing.cards.vs.body": { zh: "\u4E00\u4E2A\u8FD0\u884C\u6A21\u578B\u5E76\u6309 Neurons \u8BA1\u8D39\uFF1B\u53E6\u4E00\u4E2A\u662F\u7F13\u5B58\u3001\u65E5\u5FD7\u3001\u91CD\u8BD5\u4E0E\u7EDF\u4E00\u8BA1\u8D39\u7684\u63A7\u5236\u5C42\u3002", en: "One runs models and bills neurons. The other is a control layer for caching, logs, retries and unified billing." },
  "landing.cards.vs.link": { zh: "\u9605\u8BFB\u5206\u6790 \u2192", en: "Read the analysis \u2192" },
  "landing.cards.api.title": { zh: "OpenAI \u517C\u5BB9\u63A5\u53E3", en: "OpenAI-compatible API" },
  "landing.cards.api.body": { zh: "/v1/chat/completions\u3001embeddings\u3001images\u3001audio\u3001rerank\u3001Anthropic Messages \u4EE5\u53CA\u901A\u7528\u7684 /v1/run\u3002", en: "/v1/chat/completions, embeddings, images, audio, rerank, Anthropic Messages and a generic /v1/run." },
  "landing.cards.api.link": { zh: "\u63A5\u53E3\u6587\u6863 \u2192", en: "Endpoint reference \u2192" },
  "landing.cards.quota.title": { zh: "\u514D\u8D39\u989D\u5EA6\u786C\u4FDD\u62A4", en: "Hard free-tier guard" },
  "landing.cards.quota.body": { zh: "\u539F\u5B50\u9884\u7559\u8BA9\u5E76\u53D1\u8BF7\u6C42\u4E5F\u65E0\u6CD5\u8D8A\u8FC7\u6BCF\u65E5 10,000 Neurons \u7684\u514D\u8D39\u989D\u5EA6\u3002", en: "Atomic per-account reservations stop requests before the 10,000-neuron daily allocation is exceeded." },
  "landing.cards.quota.link": { zh: "\u6838\u7B97\u65B9\u5F0F \u2192", en: "How accounting works \u2192" },
  "landing.footer": { zh: "Workers AI2API v2 \xB7 \u72EC\u7ACB\u9879\u76EE\uFF0C\u4E0E Cloudflare \u65E0\u96B6\u5C5E\u5173\u7CFB\u3002\u6A21\u578B\u6570\u636E\u4E0E\u4EF7\u683C\u5F52 Cloudflare \u6240\u6709\u3002", en: "Workers AI2API v2 \xB7 Independent project, not affiliated with Cloudflare. Model data and prices belong to Cloudflare." },
  "task.text-generation": { zh: "\u6587\u672C\u751F\u6210", en: "Text" },
  "task.text-embeddings": { zh: "\u5411\u91CF", en: "Embeddings" },
  "task.text-to-image": { zh: "\u56FE\u50CF\u751F\u6210", en: "Image" },
  "task.automatic-speech-recognition": { zh: "\u8BED\u97F3\u8F6C\u6587\u672C", en: "Speech \u2192 text" },
  "task.text-to-speech": { zh: "\u6587\u672C\u8F6C\u8BED\u97F3", en: "Text \u2192 speech" },
  "task.text-classification": { zh: "\u5206\u7C7B / \u91CD\u6392", en: "Classification" },
  "task.image-to-text": { zh: "\u56FE\u50CF\u8F6C\u6587\u672C", en: "Image \u2192 text" },
  "task.translation": { zh: "\u7FFB\u8BD1", en: "Translation" },
  "task.summarization": { zh: "\u6458\u8981", en: "Summarization" },
  "task.image-classification": { zh: "\u56FE\u50CF\u5206\u7C7B", en: "Image classification" },
  "task.object-detection": { zh: "\u76EE\u6807\u68C0\u6D4B", en: "Object detection" },
  "task.dumb-pipe": { zh: "\u8BED\u97F3\u7BA1\u9053", en: "Dumb pipe" },
  "task.unknown": { zh: "\u672A\u77E5", en: "Unknown" },
  "cap.reasoning": { zh: "\u63A8\u7406", en: "reasoning" },
  "cap.tools": { zh: "\u5DE5\u5177\u8C03\u7528", en: "tools" },
  "cap.vision": { zh: "\u89C6\u89C9", en: "vision" },
  "cap.audio_in": { zh: "\u97F3\u9891\u8F93\u5165", en: "audio in" },
  "cap.audio_out": { zh: "\u97F3\u9891\u8F93\u51FA", en: "audio out" },
  "cap.json": { zh: "JSON", en: "JSON" },
  "cap.streaming": { zh: "\u6D41\u5F0F", en: "streaming" },
  "cap.multilingual": { zh: "\u591A\u8BED\u8A00", en: "multilingual" },
  "detail.title": { zh: "\u6A21\u578B\u8BE6\u60C5", en: "Model details" },
  "detail.id": { zh: "\u6A21\u578B ID", en: "Model ID" },
  "detail.author": { zh: "\u63D0\u4F9B\u65B9", en: "Provider" },
  "detail.task": { zh: "\u4EFB\u52A1", en: "Task" },
  "detail.context": { zh: "\u4E0A\u4E0B\u6587\u7A97\u53E3", en: "Context window" },
  "detail.maxOutput": { zh: "\u6700\u5927\u8F93\u51FA", en: "Max output" },
  "detail.caps": { zh: "\u80FD\u529B", en: "Capabilities" },
  "detail.price": { zh: "\u4EF7\u683C", en: "Pricing" },
  "detail.daily": { zh: "\u514D\u8D39\u65E5\u8F93\u51FA", en: "Free daily output" },
  "detail.rank": { zh: "\u6027\u80FD\u6392\u540D", en: "Performance rank" },
  "detail.score": { zh: "\u4F30\u7B97\u5F97\u5206", en: "Estimated score" },
  "detail.endpoints": { zh: "\u53EF\u7528\u7AEF\u70B9", en: "Endpoints" },
  "detail.aliases": { zh: "\u522B\u540D", en: "Aliases" },
  "detail.docs": { zh: "Cloudflare \u6587\u6863 \u2197", en: "Cloudflare docs \u2197" },
  "detail.copyId": { zh: "\u590D\u5236\u6A21\u578B ID", en: "Copy model ID" },
  "detail.released": { zh: "\u53D1\u5E03\u65F6\u95F4", en: "Released" },
  "price.input_token": { zh: "\u8F93\u5165 token", en: "input token" },
  "price.output_token": { zh: "\u8F93\u51FA token", en: "output token" },
  "price.cached_input_token": { zh: "\u7F13\u5B58\u8F93\u5165 token", en: "cached input token" },
  "price.audio_minute": { zh: "\u97F3\u9891\u5206\u949F", en: "audio minute" },
  "price.character": { zh: "\u5B57\u7B26", en: "character" },
  "price.step": { zh: "\u6B65", en: "step" },
  "price.image": { zh: "\u56FE\u50CF", en: "image" },
  "price.image_tile": { zh: "\u56FE\u50CF tile", en: "image tile" },
  "price.image_megapixel": { zh: "\u56FE\u50CF\u767E\u4E07\u50CF\u7D20", en: "image megapixel" },
  "price.input_image_tile_step": { zh: "\u8F93\u5165\u56FE\u50CF tile \u6B65", en: "input image tile step" },
  "price.output_image_tile_step": { zh: "\u8F93\u51FA\u56FE\u50CF tile \u6B65", en: "output image tile step" },
  "admin.title": { zh: "\u7BA1\u7406 \u2014 Workers AI2API", en: "Admin \u2014 Workers AI2API" },
  "admin.signinTitle": { zh: "\u767B\u5F55 \u2014 Workers AI2API", en: "Sign in \u2014 Workers AI2API" },
  "admin.login.title": { zh: "\u7BA1\u7406\u5458\u767B\u5F55", en: "Admin sign in" },
  "admin.login.sub": { zh: "\u4F7F\u7528\u672C\u90E8\u7F72\u914D\u7F6E\u7684 ADMIN_PASSWORD\u3002", en: "Use the ADMIN_PASSWORD configured on this deployment." },
  "admin.login.password": { zh: "\u5BC6\u7801", en: "Password" },
  "admin.login.submit": { zh: "\u767B\u5F55", en: "Sign in" },
  "admin.login.back": { zh: "\u2190 \u8FD4\u56DE\u516C\u5F00\u9996\u9875", en: "\u2190 Back to public site" },
  "admin.nav.overview": { zh: "\u603B\u89C8", en: "Overview" },
  "admin.nav.models": { zh: "\u6A21\u578B", en: "Models" },
  "admin.nav.accounts": { zh: "\u8D26\u53F7", en: "Accounts" },
  "admin.nav.keys": { zh: "API \u5BC6\u94A5", en: "API keys" },
  "admin.nav.settings": { zh: "\u8BBE\u7F6E", en: "Settings" },
  "admin.nav.logout": { zh: "\u9000\u51FA\u767B\u5F55", en: "Sign out" },
  "admin.overview.title": { zh: "\u603B\u89C8", en: "Overview" },
  "admin.overview.sub": { zh: "\u514D\u8D39 Neuron \u6838\u7B97\u3001\u5DF2\u63A5\u5165\u8D26\u53F7\u4E0E\u5B9E\u65F6\u7528\u91CF\u3002", en: "Free-neuron accounting, connected accounts and live usage." },
  "admin.kpi.used": { zh: "\u4ECA\u65E5\u5DF2\u7528 Neurons", en: "neurons used today" },
  "admin.kpi.limit": { zh: "\u6BCF\u65E5\u514D\u8D39\u989D\u5EA6", en: "daily free allowance" },
  "admin.kpi.remaining": { zh: "\u5269\u4F59 Neurons", en: "neurons remaining" },
  "admin.kpi.accounts": { zh: "\u6D3B\u8DC3\u8D26\u53F7", en: "active accounts" },
  "admin.quota.title": { zh: "\u6BCF\u65E5\u989D\u5EA6", en: "Daily quota" },
  "admin.quota.note": { zh: "\u672C\u5730\u539F\u5B50\u8BB0\u8D26\uFF1A\u5DF2\u7528 {used} + \u9884\u7559 {reserved}\u3002\u4E91\u7AEF\u5206\u6790\uFF1A{cloud}\u3002\u540E\u7AEF\uFF1A{backend}\u3002", en: "Local atomic accounting: {used} used + {reserved} reserved. Cloud analytics: {cloud}. Backend: {backend}." },
  "admin.quota.refresh": { zh: "\u5237\u65B0\u4E91\u7AEF\u5206\u6790", en: "Refresh analytics" },
  "admin.quota.refreshed": { zh: "\u5DF2\u5237\u65B0\u3002\u672C\u5730 {local} n\uFF1B\u4E91\u7AEF {cloud} n\u3002", en: "Refreshed. Local {local} n; cloud {cloud} n." },
  "admin.env.title": { zh: "\u8FD0\u884C\u73AF\u5883", en: "Environment" },
  "admin.env.version": { zh: "\u7248\u672C", en: "Version" },
  "admin.env.kv": { zh: "KV", en: "KV" },
  "admin.env.quota": { zh: "\u989D\u5EA6\u540E\u7AEF", en: "Quota" },
  "admin.env.maxDaily": { zh: "\u6BCF\u65E5\u4E0A\u9650", en: "Max daily" },
  "admin.env.adminPassword": { zh: "\u7BA1\u7406\u5BC6\u7801", en: "Admin password" },
  "admin.perAccount.title": { zh: "\u6309\u8D26\u53F7", en: "Per account" },
  "admin.topModels.title": { zh: "\u4ECA\u65E5\u70ED\u95E8\u6A21\u578B", en: "Top models today" },
  "admin.noAccounts": { zh: "\u8FD8\u6CA1\u6709\u6D3B\u8DC3\u8D26\u53F7\u3002", en: "No active accounts." },
  "admin.noUsage": { zh: "\u6682\u65E0\u4E91\u7AEF\u7528\u91CF\u6570\u636E\u3002", en: "No cloud usage data yet." },
  "admin.models.title": { zh: "\u6A21\u578B", en: "Models" },
  "admin.models.includePaid": { zh: "\u5305\u542B\u4ED8\u8D39\u6A21\u578B", en: "include paid-only" },
  "admin.models.refresh": { zh: "\u5237\u65B0\u76EE\u5F55", en: "Refresh catalog" },
  "admin.models.footnote": { zh: "\u53EA\u6709\u514D\u8D39\u6A21\u578B\u4F1A\u88AB /v1 \u63A5\u53D7\u3002\u4ED8\u8D39\u6A21\u578B\u9ED8\u8BA4\u9690\u85CF\uFF0C\u4EC5\u7528\u4E8E\u67E5\u770B\u3002\u4EF7\u683C\u4E0E\u80FD\u529B\u6765\u81EA Cloudflare \u6587\u6863\u548C\u6A21\u578B API\u3002", en: "Free models are the only ones accepted by /v1. Paid-only models are shown for visibility and excluded by default. Prices and capabilities are refreshed from Cloudflare docs and the models API." },
  "admin.models.source": { zh: "\u6765\u6E90\uFF1A{source} \xB7 {free} \u514D\u8D39 / {paid} \u4ED8\u8D39 / {deprecated} \u5DF2\u5F03\u7528 \xB7 \u66F4\u65B0\u4E8E {time}", en: "Source: {source} \xB7 {free} free / {paid} paid / {deprecated} deprecated \xB7 updated {time}" },
  "admin.models.coverage": { zh: "{partner} \u4E2A\u5408\u4F5C\u65B9\u6A21\u578B \xB7 {authors} \u5BB6\u63D0\u4F9B\u65B9 \xB7 {tasks} \u7C7B\u4EFB\u52A1", en: "{partner} partner models \xB7 {authors} providers \xB7 {tasks} task types" },
  "admin.models.noMatch": { zh: "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u6A21\u578B\u3002", en: "No models." },
  "admin.models.count": { zh: "{n} \u4E2A\u6A21\u578B", en: "{n} models" },
  "admin.accounts.title": { zh: "\u8D26\u53F7", en: "Accounts" },
  "admin.accounts.sub": { zh: "\u6BCF\u4E2A Cloudflare \u8D26\u53F7\u6BCF\u5929\u63D0\u4F9B 10,000 \u4E2A\u514D\u8D39 Neurons\u3002\u8BF7\u6C42\u4F1A\u5728\u8D26\u53F7\u4E4B\u95F4\u81EA\u52A8\u6545\u969C\u8F6C\u79FB\u3002", en: "Each Cloudflare account contributes 10,000 free neurons per UTC day. Requests fail over between accounts." },
  "admin.accounts.addTitle": { zh: "\u6DFB\u52A0\u8D26\u53F7", en: "Add account" },
  "admin.accounts.name": { zh: "\u540D\u79F0", en: "Name" },
  "admin.accounts.accountId": { zh: "Account ID", en: "Account ID" },
  "admin.accounts.token": { zh: "API Token\uFF08Workers AI Read & Edit\uFF09", en: "API token (Workers AI Read & Edit)" },
  "admin.accounts.add": { zh: "\u6DFB\u52A0\u8D26\u53F7", en: "Add account" },
  "admin.accounts.test": { zh: "\u6D4B\u8BD5 Token", en: "Test token" },
  "admin.accounts.added": { zh: "\u8D26\u53F7\u5DF2\u6DFB\u52A0\u3002", en: "Account added." },
  "admin.accounts.tokenWorks": { zh: "Token \u53EF\u7528\uFF0C\u53EF\u89C1\u6A21\u578B\u6570\uFF1A{n}", en: "Token works. Models visible: {n}" },
  "admin.accounts.hint": { zh: "\u5728 Cloudflare Dashboard \u2192 My Profile \u2192 API Tokens \u521B\u5EFA Workers AI \u6A21\u677F Token\u3002\u82E5\u9700\u8981\u4E91\u7AEF\u7528\u91CF\u6838\u5BF9\uFF0C\u518D\u6DFB\u52A0 Account Analytics Read \u6743\u9650\u3002", en: "Create a token at Cloudflare Dashboard \u2192 My Profile \u2192 API Tokens \u2192 Workers AI template. Add \u201CAccount Analytics Read\u201D if you want cloud usage reconciliation." },
  "admin.accounts.table.account": { zh: "\u8D26\u53F7", en: "Account" },
  "admin.accounts.table.token": { zh: "Token", en: "Token" },
  "admin.accounts.table.status": { zh: "\u72B6\u6001", en: "Status" },
  "admin.accounts.table.added": { zh: "\u6DFB\u52A0\u65F6\u95F4", en: "Added" },
  "admin.accounts.table.actions": { zh: "\u64CD\u4F5C", en: "Actions" },
  "admin.accounts.confirm": { zh: "\u786E\u5B9A\u79FB\u9664\u8FD9\u4E2A\u8D26\u53F7\uFF1F", en: "Remove this account?" },
  "admin.accounts.noAccounts": { zh: "\u8FD8\u6CA1\u6709\u8D26\u53F7\u3002", en: "No accounts yet." },
  "admin.keys.title": { zh: "API \u5BC6\u94A5", en: "API keys" },
  "admin.keys.sub": { zh: "\u5BC6\u94A5\u4EE5 SHA-256 \u54C8\u5E0C\u5B58\u50A8\uFF0C\u660E\u6587\u53EA\u663E\u793A\u4E00\u6B21\u3002", en: "Keys are stored as SHA-256 hashes. The plaintext is shown once." },
  "admin.keys.name": { zh: "\u5BC6\u94A5\u540D\u79F0", en: "Key name" },
  "admin.keys.create": { zh: "\u521B\u5EFA\u5BC6\u94A5", en: "Create key" },
  "admin.keys.created": { zh: "\u5BC6\u94A5\u5DF2\u521B\u5EFA\u3002\u8BF7\u7ACB\u5373\u590D\u5236\uFF0C\u4E4B\u540E\u4E0D\u518D\u663E\u793A\u3002", en: "Key created. Copy it now; it is not shown again." },
  "admin.keys.copyNow": { zh: "\u7ACB\u5373\u590D\u5236\u8FD9\u4E2A\u5BC6\u94A5\uFF1A", en: "Copy this key now:" },
  "admin.keys.confirm": { zh: "\u786E\u5B9A\u5220\u9664\u8FD9\u4E2A\u5BC6\u94A5\uFF1F", en: "Delete this key?" },
  "admin.keys.table.key": { zh: "\u5BC6\u94A5", en: "Key" },
  "admin.keys.table.status": { zh: "\u72B6\u6001", en: "Status" },
  "admin.keys.table.lastUsed": { zh: "\u6700\u540E\u4F7F\u7528", en: "Last used" },
  "admin.keys.table.created": { zh: "\u521B\u5EFA\u65F6\u95F4", en: "Created" },
  "admin.keys.table.actions": { zh: "\u64CD\u4F5C", en: "Actions" },
  "admin.keys.noKeys": { zh: "\u8FD8\u6CA1\u6709 API \u5BC6\u94A5\u3002", en: "No API keys yet." },
  "admin.settings.title": { zh: "\u8BBE\u7F6E", en: "Settings" },
  "admin.settings.sub": { zh: "AI Gateway \u662F\u53EF\u9009\u9879\uFF1B\u514D\u8D39 Neuron \u4FDD\u62A4\u59CB\u7EC8\u662F\u6743\u5A01\u3002", en: "AI Gateway is optional; the free-neuron guard remains authoritative." },
  "admin.settings.runtime": { zh: "\u8FD0\u884C\u65F6", en: "Runtime" },
  "admin.settings.gateway": { zh: "AI Gateway ID\uFF08\u53EF\u9009\uFF09", en: "AI Gateway ID (optional)" },
  "admin.settings.daily": { zh: "\u6BCF\u8D26\u53F7\u6BCF\u65E5 Neurons", en: "Daily neurons per account" },
  "admin.settings.defaultMax": { zh: "\u9ED8\u8BA4\u6700\u5927\u8F93\u51FA tokens", en: "Default max output tokens" },
  "admin.settings.public": { zh: "\u516C\u5F00\u8BBF\u95EE\uFF08\u65E0\u9700 API \u5BC6\u94A5\uFF09", en: "Public access (no API keys)" },
  "admin.settings.quotaHint": { zh: "\u6BCF\u65E5\u4E0A\u9650\u53D7 MAX_DAILY_NEURONS \u9650\u5236\uFF08\u9ED8\u8BA4 10,000\uFF09\u3002\u514D\u8D39\u8BA1\u5212\u4E0D\u8981\u8C03\u9AD8\uFF1ACloudflare \u4F1A\u5F00\u59CB\u8FD4\u56DE 3036\u3002", en: "The daily cap is clamped by MAX_DAILY_NEURONS (default 10,000). Do not raise it on a free plan: Cloudflare will start returning error 3036." },
  "admin.settings.aliases": { zh: "\u6A21\u578B\u522B\u540D", en: "Model aliases" },
  "admin.settings.aliasesHint": { zh: "JSON \u5BF9\u8C61\uFF1A\u5BA2\u6237\u7AEF\u540D\u79F0 \u2192 @cf/ \u6A21\u578B ID\u3002", en: "JSON object mapping a client-facing name to an @cf/ model id." },
  "admin.settings.benchmarks": { zh: "\u6027\u80FD\u8986\u76D6\u503C", en: "Performance overrides" },
  "admin.settings.benchmarksHint": { zh: "JSON \u5BF9\u8C61\uFF1A\u6A21\u578B ID \u2192 0-100 \u7684\u81EA\u6D4B\u5206\u6570\u3002\u8986\u76D6\u503C\u4F1A\u53C2\u4E0E\u6027\u80FD\u6392\u5E8F\u3002", en: "JSON object mapping model id to a 0-100 score from your own evals. Overrides drive the performance sort." },
  "admin.settings.saved": { zh: "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002", en: "Settings saved." },
  "admin.settings.invalidJson": { zh: "JSON \u65E0\u6548\uFF1A{error}", en: "Invalid JSON: {error}" },
  "admin.setupWarning": { zh: "\u8BF7\u5148\u8BBE\u7F6E ADMIN_PASSWORD \u73AF\u5883\u53D8\u91CF\uFF0C\u518D\u4F7F\u7528\u7BA1\u7406\u9762\u677F\u3002", en: "Set the ADMIN_PASSWORD environment variable before using the admin panel." },
  "docs.nav.home": { zh: "\u9996\u9875", en: "Home" },
  "docs.nav.api": { zh: "\u63A5\u53E3", en: "API" },
  "docs.nav.freeTier": { zh: "\u514D\u8D39\u989D\u5EA6", en: "Free tier" },
  "docs.nav.vs": { zh: "Workers AI vs AI Gateway", en: "Workers AI vs AI Gateway" },
  "docs.footer": { zh: "Workers AI2API v2 \xB7 \u4EF7\u683C\u4E0E\u9650\u989D\u5F52 Cloudflare \u6240\u6709\u3002", en: "Workers AI2API v2 \xB7 Prices and limits belong to Cloudflare." }
};
function t(lang, key, vars = {}) {
  const entry = DICT[key];
  const template = entry ? entry[lang] || entry.en : key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => vars[name] == null ? "" : String(vars[name]));
}
function resolveLang(request) {
  let url;
  try {
    url = new URL(request.url);
  } catch {
    url = null;
  }
  const query = url?.searchParams.get("lang");
  if (LANGS.includes(query)) return query;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)lang=(zh|en)\b/);
  if (match) return match[1];
  const accept = request.headers.get("Accept-Language") || "";
  if (/(^|,)\s*en\b/i.test(accept) && !/(^|,)\s*zh\b/i.test(accept)) return "en";
  return DEFAULT_LANG;
}
function clientDictionary(lang) {
  const out = {};
  for (const key of Object.keys(DICT)) {
    const entry = DICT[key];
    out[key] = entry ? entry[lang] || entry.en : key;
  }
  return out;
}

// src/ui/pages.js
var BASE_CSS = `
:root{color-scheme:light dark;--bg:#eef1f4;--bg-2:#e7ebef;--panel:#ffffff;--panel-2:#f5f7f9;--ink:#0b0e13;--muted:#5b6572;--line:#d6dce3;--accent:#e8590c;--accent-2:#ff9a5c;--accent-ink:#ffffff;--ok:#0b7a53;--warn:#9a5b00;--bad:#b42318;--shadow:0 1px 2px rgba(8,12,20,.05),0 14px 40px rgba(8,12,20,.07);--display:"Bahnschrift","DIN Alternate","Segoe UI Variable Display","Segoe UI",system-ui,sans-serif;--mono:"Cascadia Code","SFMono-Regular",Consolas,"Liberation Mono",monospace}
@media (prefers-color-scheme:dark){:root{--bg:#080a0d;--bg-2:#0c0f13;--panel:#11151a;--panel-2:#171c22;--ink:#eef1f4;--muted:#98a2ae;--line:#242c36;--accent:#ff7a1a;--accent-2:#ffb066;--accent-ink:#120b05;--ok:#4ade80;--warn:#fbbf24;--bad:#f87171;--shadow:0 1px 2px rgba(0,0,0,.5),0 22px 60px rgba(0,0,0,.35)}}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 "Segoe UI",ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}
h1,h2,h3,.brand,.ledger-big b,.kpi b,.stat b{font-family:var(--display);font-weight:700}
code,pre,.mono,.price,.rank,.tier,.stamp,.pill{font-family:var(--mono)}
.wrap{max-width:1200px;margin:0 auto;padding:0 24px}
.nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.nav .wrap{display:flex;align-items:center;gap:14px;height:64px}
.brand{display:flex;align-items:center;gap:10px;font-size:15px;letter-spacing:-.02em;text-decoration:none;white-space:nowrap}
.brand .mark{width:28px;height:28px;border-radius:8px;background:var(--accent);display:grid;place-items:center;color:var(--accent-ink);font:800 15px/1 var(--display)}
.nav .spacer{flex:1}
.pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:5px 10px;font-size:11px;color:var(--muted);background:var(--panel);white-space:nowrap}
.dot{width:7px;height:7px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 3px color-mix(in srgb,var(--ok) 18%,transparent)}
.dot.off{background:var(--bad);box-shadow:none}
.dot.warn{background:var(--warn);box-shadow:none}
.lang-switch{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--panel)}
.lang-switch a{padding:6px 10px;font:600 11px/1 var(--mono);color:var(--muted);text-decoration:none}
.lang-switch a+a{border-left:1px solid var(--line)}
.lang-switch a.active{background:var(--ink);color:var(--bg)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:9px;padding:9px 14px;font:600 13px/1 inherit;cursor:pointer;text-decoration:none;transition:border-color .15s,background .15s,transform .15s;white-space:nowrap}
.btn:hover{border-color:var(--muted)}
.btn:active{transform:translateY(1px)}
.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.btn.primary:hover{filter:brightness(1.06)}
.btn.danger{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 35%,var(--line))}
.btn.sm{padding:6px 10px;font-size:11.5px;border-radius:7px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.hero{position:relative;border-bottom:1px solid var(--line);overflow:hidden}
.hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:64px 64px;opacity:.27;mask-image:linear-gradient(180deg,#000 0%,transparent 84%);pointer-events:none}
.hero-grid{position:relative;display:grid;grid-template-columns:minmax(0,1.22fr) minmax(330px,.78fr);gap:44px;align-items:center;padding:74px 0 60px}
.eyebrow{display:flex;align-items:center;gap:10px;font:700 10.5px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.eyebrow::before{content:"";width:26px;height:1px;background:var(--accent)}
h1{font-size:clamp(38px,4.8vw,58px);line-height:1.04;letter-spacing:-.045em;margin:0 0 20px;max-width:820px}
html[lang^="zh"] h1{font-size:clamp(32px,3.3vw,46px);line-height:1.14;letter-spacing:-.01em;max-width:820px;word-break:keep-all}
.hero p.lead{font-size:17.5px;color:var(--muted);max-width:640px;margin:0 0 28px}
.endpoint{display:flex;align-items:stretch;max-width:640px;border:1px solid var(--line);border-radius:11px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)}
.endpoint code{flex:1;padding:14px 16px;font-size:12.5px;overflow:auto;white-space:nowrap;display:flex;align-items:center}
.endpoint button{border:0;border-left:1px solid var(--line);background:var(--panel-2);padding:0 16px;font:700 11px/1 var(--mono);letter-spacing:.04em;cursor:pointer;color:var(--ink);text-transform:uppercase}
.endpoint button:hover{color:var(--accent)}
.hero-meta{margin:16px 0 0;font:600 11px/1.5 var(--mono);color:var(--muted);letter-spacing:.01em}
.ledger{position:relative;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:var(--shadow);overflow:hidden}
.ledger::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 7%,transparent),transparent 46%)}
.ledger-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px}
.ledger-head>span:first-child{font:700 10px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.stamp{border:2px solid var(--accent);color:var(--accent);font:800 10px/1 var(--mono);letter-spacing:.14em;padding:6px 7px;border-radius:4px;transform:rotate(-6deg)}
.ledger-big{display:flex;flex-direction:column;gap:7px}
.ledger-big b{font-size:clamp(46px,5.6vw,64px);line-height:.95;letter-spacing:-.055em}
.ledger-big span{font-size:11.5px;color:var(--muted)}
.meter{position:relative;height:14px;margin:20px 0 8px;border:1px solid var(--line);border-radius:4px;background:var(--panel-2);overflow:hidden}
.meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--accent-2));transition:width .5s ease}
.meter::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),var(--panel) calc(10% - 1px) 10%)}
.meter-labels{display:flex;justify-content:space-between;gap:10px;font:600 10.5px/1.2 var(--mono);color:var(--muted);margin-bottom:18px}
.ledger-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 14px;padding:0}
.ledger-grid div{border-top:1px solid var(--line);padding-top:10px;min-width:0}
.ledger-grid dt{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.ledger-grid dd{margin:5px 0 0;font:700 14px/1.2 var(--mono);overflow:hidden;text-overflow:ellipsis}
.block{padding:56px 0}
.block-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:18px}
.block-head h2{font-size:clamp(24px,3vw,32px);letter-spacing:-.03em;margin:0}
.block-head p{margin:6px 0 0;color:var(--muted);font-size:13px}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
input,select,textarea{font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:9px 11px;min-width:0}
input:focus,select:focus,textarea:focus,button:focus-visible,a:focus-visible{outline:2px solid color-mix(in srgb,var(--accent) 55%,transparent);outline-offset:2px}
textarea{width:100%;min-height:100px;resize:vertical;font-family:var(--mono);font-size:12.5px}
.table-wrap{border:1px solid var(--line);border-radius:14px;overflow:auto;background:var(--panel);box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse;font-size:13px;min-width:920px}
th{text-align:left;font:700 10px/1.2 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--muted);padding:13px 14px;border-bottom:1px solid var(--line);background:var(--panel-2);position:sticky;top:0;z-index:1;white-space:nowrap}
td{padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
tbody tr.model-row{cursor:pointer}
tbody tr.model-row:hover td{background:color-mix(in srgb,var(--accent) 5%,transparent)}
.model-name{font-weight:650;letter-spacing:-.01em}
.model-id{font-size:11px;color:var(--muted);word-break:break-all}
.badge{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:5px;padding:2px 6px;font:600 10px/1.35 var(--mono);color:var(--muted);margin:1px 3px 1px 0;white-space:nowrap}
.badge.hot{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}
.badge.paid{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 45%,var(--line))}
.rank{display:inline-grid;place-items:center;width:27px;height:27px;border-radius:7px;background:var(--panel-2);font:700 10.5px/1 var(--mono);color:var(--muted)}
.tier{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:6px;font:800 11px/1 var(--mono)}
.tier.S{background:var(--ink);color:var(--bg)}
.tier.A{background:var(--accent);color:var(--accent-ink)}
.tier.B{background:color-mix(in srgb,var(--accent) 24%,var(--panel-2))}
.tier.C{background:var(--panel-2);color:var(--muted)}
.tier.D{background:transparent;border:1px solid var(--line);color:var(--muted)}
.price{font-size:11.5px;white-space:normal;overflow-wrap:anywhere}
.muted{color:var(--muted)}
.small{font-size:12px}
.tiny{font-size:11.5px;color:var(--muted)}
.nowrap{white-space:nowrap}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;box-shadow:var(--shadow)}
.card h3{margin:0 0 8px;font-size:16px;letter-spacing:-.01em}
.card p{margin:0 0 14px;color:var(--muted);font-size:13px}
.card a{font-weight:600;text-decoration:none;color:var(--accent);font-size:12.5px}
.usage-bar{height:9px;border-radius:99px;background:var(--panel-2);overflow:hidden;border:1px solid var(--line)}
.usage-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent-2));width:0;transition:width .4s}
.split{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.list{list-style:none;margin:0;padding:0}
.list li{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px}
.list li:last-child{border-bottom:0}
.note{border:1px solid var(--line);border-left:3px solid var(--accent);background:var(--panel);border-radius:0 10px 10px 0;padding:12px 14px;font-size:13px;color:var(--muted)}
footer{border-top:1px solid var(--line);padding:30px 0 52px;color:var(--muted);font-size:12px}
.login{min-height:100vh;display:grid;place-items:center;padding:24px}
.login .card{width:100%;max-width:410px}
.field{display:block;margin-bottom:14px}
.field span{display:block;font-size:11px;font-weight:700;letter-spacing:.03em;color:var(--muted);margin-bottom:6px}
.field input{width:100%}
.msg{font-size:12.5px;padding:9px 11px;border-radius:8px;margin:10px 0;display:none}
.msg.show{display:block}
.msg.ok{background:color-mix(in srgb,var(--ok) 12%,transparent);color:var(--ok)}
.msg.err{background:color-mix(in srgb,var(--bad) 12%,transparent);color:var(--bad)}
.app{display:grid;grid-template-columns:216px 1fr;min-height:calc(100vh - 64px)}
.side{border-right:1px solid var(--line);padding:22px 14px;background:var(--panel)}
.side button{display:flex;align-items:center;gap:9px;width:100%;text-align:left;background:none;border:0;border-radius:8px;padding:9px 11px;font:600 12.5px/1 inherit;color:var(--muted);cursor:pointer;margin-bottom:2px}
.side button:hover{background:var(--panel-2);color:var(--ink)}
.side button.active{background:var(--panel-2);color:var(--ink);box-shadow:inset 2px 0 0 var(--accent)}
.main{padding:28px 30px 64px;min-width:0}
.tab{display:none}
.tab.active{display:block}
.main h2{font-size:24px;letter-spacing:-.03em;margin:0 0 4px}
.main .sub{color:var(--muted);font-size:12.5px;margin:0 0 22px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
.kpi{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:15px}
.kpi b{display:block;font-size:22px;letter-spacing:-.03em}
.kpi span{font-size:11px;color:var(--muted)}
.form{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;align-items:end}
.form.inline{grid-template-columns:1fr auto}
.form .wide{grid-column:1/-1}
.row-actions{display:flex;gap:6px;flex-wrap:wrap}
.kv{display:grid;grid-template-columns:130px 1fr;gap:8px;font-size:12.5px;margin:0}
.kv dt{color:var(--muted)}
.kv dd{margin:0;word-break:break-all}
pre.code{background:var(--panel-2);border:1px solid var(--line);border-radius:9px;padding:12px;overflow:auto;font-size:12px}
details summary{cursor:pointer;font-weight:600;font-size:13px}
dialog{border:1px solid var(--line);border-radius:16px;padding:0;background:var(--panel);color:var(--ink);width:min(640px,calc(100% - 28px));max-height:min(86vh,820px);box-shadow:0 30px 90px rgba(0,0,0,.4)}
dialog::backdrop{background:rgba(4,6,9,.58);backdrop-filter:blur(4px)}
.dlg-head{display:flex;align-items:flex-start;gap:14px;padding:20px 22px 14px;border-bottom:1px solid var(--line)}
.dlg-head h3{margin:0 0 4px;font-size:19px;letter-spacing:-.02em}
.dlg-head .model-id{font-size:11px}
.dlg-head .btn{margin-left:auto}
.dlg-body{padding:18px 22px 24px;overflow:auto}
.dlg-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 16px}
.dlg-grid div{border-top:1px solid var(--line);padding-top:9px;min-width:0}
.dlg-grid dt{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.dlg-grid dd{margin:4px 0 0;font-size:12.5px;word-break:break-word}
.dlg-section{margin:16px 0 0}
.dlg-section h4{font:700 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
.docs{max-width:880px;padding:52px 0 80px}
.docs h1{font-size:38px;margin-bottom:10px}
.docs h2{font-size:22px;letter-spacing:-.02em;margin:34px 0 10px}
.docs h3{font-size:16px;margin:22px 0 8px}
.docs p,.docs li{color:var(--muted);font-size:14.5px}
.docs strong{color:var(--ink)}
.docs code{background:var(--panel-2);border:1px solid var(--line);border-radius:4px;padding:1px 5px;font-size:12.5px}
.docs pre{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px;overflow:auto;font-size:12.5px;line-height:1.55}
.docs pre code{background:none;border:0;padding:0}
.docs code{overflow-wrap:anywhere}
.docs table{min-width:0;font-size:13px;margin:12px 0}
.docs .table-scroll{overflow-x:auto;border:1px solid var(--line);border-radius:10px;margin:12px 0;background:var(--panel)}
.docs .table-scroll table{margin:0;min-width:560px}
.docs th,.docs td{padding:9px 11px}
.docs table td:first-child,.docs table th:first-child{white-space:nowrap}
.docs ul,.docs ol{padding-left:20px}
.docs .callout{border-left:3px solid var(--accent);background:var(--panel);padding:12px 15px;border-radius:0 8px 8px 0;margin:18px 0;font-size:13.5px;color:var(--muted)}
@media(max-width:980px){.hero-grid{grid-template-columns:1fr;gap:30px;padding:54px 0 48px}.ledger{max-width:560px}.cards{grid-template-columns:1fr}.app{grid-template-columns:1fr}.side{border-right:0;border-bottom:1px solid var(--line);display:flex;gap:6px;overflow:auto;padding:12px}.side button{width:auto;white-space:nowrap}.main{padding:20px 18px 52px}.split,.form,.kpis{grid-template-columns:1fr 1fr}}
@media(max-width:680px){.cards,.split,.form,.dlg-grid{grid-template-columns:1fr}.wrap{padding:0 16px}.hero{padding:0}.endpoint code{font-size:10.5px}.main{padding:18px 14px 48px}.block{padding:42px 0}h1{font-size:36px}.nav .wrap{height:56px;gap:8px}.nav .pill{display:none}.brand{font-size:13px}.brand .mark{width:24px;height:24px}.lang-switch a{padding:6px 8px}.nav .btn.sm{padding:6px 9px}.models-table{border:0;background:transparent;box-shadow:none;overflow:visible}.models-table table{min-width:0;display:block}.models-table thead{display:none}.models-table tbody{display:block}.models-table tbody tr{display:block;border:1px solid var(--line);border-radius:12px;background:var(--panel);margin-bottom:10px;padding:10px 12px}.models-table tbody td{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:4px 10px;min-width:0;border:0;padding:4px 0;font-size:12.5px}.models-table tbody td::before{content:attr(data-label);font:700 9.5px/1.5 var(--mono);text-transform:uppercase;letter-spacing:.07em;color:var(--muted);flex:0 0 84px;padding-top:1px}.models-table tbody td:first-child{display:none}.models-table tbody td:nth-child(2){display:block;padding-bottom:8px;margin-bottom:4px;border-bottom:1px solid var(--line)}.models-table tbody td:nth-child(2)::before{display:none}.models-table tbody tr.model-row:hover td{background:transparent}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;
var CLIENT_HELPERS = `
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const I=window.__I18N__||{};
const T=(k,v={})=>String(I[k]??k).replace(/\\{(\\w+)\\}/g,(_,n)=>v[n]==null?'':String(v[n]));
async function api(path,opt={}){const r=await fetch(path,{...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||d.error||('HTTP '+r.status));return d}
function nf(n){return Number(n||0).toLocaleString(window.__LANG__==='zh'?'zh-CN':'en-US')}
function money(v){return Number(v)<0.01?'$'+Number(v).toFixed(4):'$'+Number(v).toFixed(3)}
function setMsg(el,text,ok=true){el.textContent=text;el.className='msg show '+(ok?'ok':'err')}
function copyText(text){return navigator.clipboard.writeText(text)}
function taskLabel(t){return T('task.'+t)}
function caps(m){const c=m.capabilities||{};return [c.reasoning&&T('cap.reasoning'),c.function_calling&&T('cap.tools'),c.vision&&T('cap.vision'),c.audio_input&&T('cap.audio_in'),c.audio_output&&T('cap.audio_out'),c.structured_output&&T('cap.json'),c.streaming&&T('cap.streaming')].filter(Boolean)}
function tier(m){return m.performance?.tier||'C'}
function priceKind(k){const key='price.'+k;return I[key]?T(key):k}
function priceOf(m){const t=m.pricing?.tokens||{};if(t.input_usd_per_million!=null||t.output_usd_per_million!=null){const i=t.input_usd_per_million!=null?money(t.input_usd_per_million):'\u2014';const o=t.output_usd_per_million!=null?money(t.output_usd_per_million):'\u2014';return i+' / '+o+' /M'}return m.pricing?.display||'\u2014'}
`;
function escapeAttr(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}
function shell({ title, description = "", body, script = "", authenticated = null, lang = "zh" }) {
  const dictionary = JSON.stringify(clientDictionary(lang)).replace(/</g, "\\u003c");
  const authScript = authenticated === null ? "" : `window.__AUTHENTICATED__=${authenticated ? "true" : "false"};`;
  return `<!doctype html><html lang="${lang === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeAttr(title)}</title><meta name="description" content="${escapeAttr(description)}">
<style>${BASE_CSS}</style></head><body>${body}
<script>window.__LANG__=${JSON.stringify(lang)};window.__I18N__=${dictionary};${authScript}</script>
<script>${CLIENT_HELPERS}${script}</script></body></html>`;
}
function nav(lang, { status = false } = {}) {
  return `<header class="nav"><div class="wrap">
<a class="brand" href="/?lang=${lang}"><span class="mark">W</span> ${t(lang, "brand.name")}</a>
${status ? `<span class="pill"><span class="dot" id="health-dot"></span><span id="health-text">${t(lang, "nav.status.checking")}</span></span>` : ""}
<span class="spacer"></span>
<div class="lang-switch" role="group" aria-label="Language">
<a href="?lang=zh" hreflang="zh" class="${lang === "zh" ? "active" : ""}">${t(lang, "nav.lang.zh")}</a>
<a href="?lang=en" hreflang="en" class="${lang === "en" ? "active" : ""}">${t(lang, "nav.lang.en")}</a>
</div>
<a class="btn sm" href="/admin?lang=${lang}">${t(lang, "nav.admin")}</a>
</div></header>`;
}
var LANDING_SCRIPT = `
const state={models:[],meta:{}};
async function load(){
  try{
    const [cat,stats]=await Promise.all([api('/api/catalog?include_paid=0'),api('/api/stats').catch(()=>({}))]);
    state.models=cat.data||[];state.meta=cat.meta||{};
    $('#health-text').textContent=state.meta.stale?T('nav.status.cached'):T('nav.status.live');
    $('#health-dot').className='dot'+(state.meta.stale?' warn':'');
    $('#stat-models').textContent=nf(state.meta.free_models??state.models.length);
    $('#stat-neurons').textContent=nf(state.meta.free_daily_neurons||10000);
    $('#stat-accounts').textContent=nf(stats.total_accounts||0);
    const pct=Number(stats.usage_percentage)||0;
    $('#stat-usage').textContent=pct.toFixed(pct>=10?0:1)+'%';
    $('#usage-fill').style.width=Math.min(100,pct)+'%';
    const daily=Number(stats.free_daily_neurons)||10000;
    const total=daily*(Number(stats.total_accounts)||0);
    $('#stat-remaining').textContent=total?nf(Math.max(0,Math.round(total*(1-pct/100)))):'\u2014';
    $('#stat-backend').textContent=stats.quota_backend||'\u2014';
    const authors=Object.keys(state.meta.authors||{}).length;
    $('#coverage').textContent=T('landing.coverage',{free:state.meta.free_models??state.models.length,partners:state.meta.partner_models??0,authors});
    const tasks=[...new Set(state.models.map(m=>m.task))].sort();
    $('#task-filter').innerHTML='<option value="">'+esc(T('common.allTasks'))+'</option>'+tasks.map(t=>'<option value="'+esc(t)+'">'+esc(taskLabel(t))+'</option>').join('');
    render();
  }catch(e){
    $('#health-text').textContent=T('nav.status.offline');
    $('#health-dot').className='dot off';
    const el=$('#error');el.textContent=e.message;el.className='msg show err';
  }
}
function render(){
  const q=($('#search').value||'').toLowerCase();const task=$('#task-filter').value;
  let rows=state.models.filter(m=>(!task||m.task===task)&&(!q||(m.id+' '+m.name+' '+m.description).toLowerCase().includes(q)));
  const sort=$('#sort').value;
  const cmp={performance:(a,b)=>(b.performance?.score||0)-(a.performance?.score||0),price:(a,b)=>{const av=a.pricing?.tokens?.output_usd_per_million??a.pricing?.items?.[0]?.usd??Infinity;const bv=b.pricing?.tokens?.output_usd_per_million??b.pricing?.items?.[0]?.usd??Infinity;return av-bv},context:(a,b)=>(b.context_window||0)-(a.context_window||0),name:(a,b)=>a.name.localeCompare(b.name),updated:(a,b)=>(Date.parse(b.created_at||0)||0)-(Date.parse(a.created_at||0)||0)};
  rows=[...rows].sort(cmp[sort]||cmp.performance);
  $('#model-rows').innerHTML=rows.map((m,i)=>{
    const t=m.performance||{};const c=caps(m);
    return '<tr class="model-row" data-id="'+esc(m.id)+'" tabindex="0">'+
      '<td><span class="rank">'+(t.rank||i+1)+'</span></td>'+
      '<td><div class="model-name">'+esc(m.name)+'</div><div class="model-id">'+esc(m.id)+'</div>'+(m.deprecated?'<span class="badge paid">'+esc(T('common.deprecated'))+'</span>':'')+'</td>'+
      '<td data-label="'+esc(T('landing.table.task'))+'"><span class="badge">'+esc(taskLabel(m.task))+'</span></td>'+
      '<td data-label="'+esc(T('landing.table.context'))+'" class="nowrap">'+(m.context_window?nf(m.context_window)+' tok':'\u2014')+'</td>'+
      '<td data-label="'+esc(T('landing.table.caps'))+'">'+(c.length?c.map(x=>'<span class="badge">'+esc(x)+'</span>').join(''):'<span class="muted">\u2014</span>')+'</td>'+
      '<td data-label="'+esc(T('landing.table.price'))+'" class="price">'+esc(priceOf(m))+'</td>'+
      '<td data-label="'+esc(T('landing.table.daily'))+'" class="nowrap">'+(m.free_daily_output_tokens?nf(m.free_daily_output_tokens)+' tok/day':'\u2014')+'</td>'+
      '<td data-label="'+esc(T('landing.table.tier'))+'"><span class="tier '+tier(m)+'">'+tier(m)+'</span> <span class="tiny">'+(t.score??'\u2014')+'</span></td></tr>';
  }).join('')||'<tr><td colspan="8" class="muted" style="padding:24px">'+esc(T('landing.noMatch'))+'</td></tr>';
  $('#model-count').textContent=T('landing.count',{shown:rows.length,total:state.models.length});
}
function openModel(id){
  const m=state.models.find(x=>x.id===id);if(!m)return;
  const t=m.performance||{};const c=caps(m);
  const items=(m.pricing?.items||[]).map(it=>'<li><span class="mono small">'+esc(priceKind(it.kind))+'</span><span class="price">'+(it.usd!=null?'$'+it.usd:'')+(it.neurons!=null?' \xB7 '+nf(it.neurons)+' n':'')+'</span></li>').join('')||'<li class="muted">\u2014</li>';
  const rows=[
    [T('detail.id'),'<span class="mono">'+esc(m.id)+'</span> <button class="btn sm" data-copy-id="'+esc(m.id)+'">'+esc(T('common.copy'))+'</button>'],
    [T('detail.author'),esc(m.owned_by||m.author||'\u2014')],
    [T('detail.task'),esc(taskLabel(m.task))],
    [T('detail.context'),m.context_window?nf(m.context_window)+' tok':'\u2014'],
    [T('detail.maxOutput'),m.max_output_tokens?nf(m.max_output_tokens)+' tok':'\u2014'],
    [T('detail.daily'),m.free_daily_output_tokens?nf(m.free_daily_output_tokens)+' tok/day':'\u2014'],
    [T('detail.rank'),'#'+(t.rank||'\u2014')+' \xB7 '+T('detail.score')+' '+(t.score??'\u2014')+' ('+tier(m)+')'],
    [T('detail.released'),m.created?new Date(m.created*1000).toLocaleDateString(window.__LANG__==='zh'?'zh-CN':'en-US'):'\u2014'],
  ];
  $('#dlg-head').innerHTML='<div><h3>'+esc(m.name)+'</h3><div class="model-id">'+esc(m.id)+'</div></div>'+(m.deprecated?'<span class="badge paid">'+esc(T('common.deprecated'))+'</span>':'')+'<button class="btn sm" data-close="1">'+esc(T('common.close'))+'</button>';
  $('#dlg-body').innerHTML='<dl class="dlg-grid">'+rows.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+v+'</dd></div>').join('')+'</dl>'+
    '<div class="dlg-section"><h4>'+esc(T('detail.caps'))+'</h4>'+(c.length?c.map(x=>'<span class="badge">'+esc(x)+'</span>').join(''):'<span class="muted">\u2014</span>')+'</div>'+
    '<div class="dlg-section"><h4>'+esc(T('detail.price'))+'</h4><ul class="list">'+items+'</ul></div>'+
    '<div class="dlg-section"><h4>'+esc(T('detail.endpoints'))+'</h4>'+(m.endpoints||[]).map(x=>'<span class="badge">'+esc(x)+'</span>').join('')+'</div>'+
    '<div class="dlg-section"><h4>'+esc(T('detail.aliases'))+'</h4>'+(m.aliases||[]).map(x=>'<span class="badge">'+esc(x)+'</span>').join('')+'</div>'+
    '<div class="dlg-section"><a class="btn sm" href="'+esc(m.docs_url||'https://developers.cloudflare.com/workers-ai/models/')+'" target="_blank" rel="noopener">'+esc(T('detail.docs'))+'</a></div>';
  const d=$('#model-dialog');
  if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
}
$('#task-filter').addEventListener('change',render);$('#sort').addEventListener('change',render);$('#search').addEventListener('input',render);
$('#copy').addEventListener('click',async()=>{try{await copyText($('#endpoint').textContent.trim());$('#copy').textContent=T('common.copied');setTimeout(()=>$('#copy').textContent=T('common.copy'),1400)}catch{}});
$('#model-rows').addEventListener('click',e=>{const tr=e.target.closest('tr[data-id]');if(tr)openModel(tr.dataset.id)});
$('#model-rows').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr[data-id]');if(tr){e.preventDefault();openModel(tr.dataset.id)}}});
$('#model-dialog').addEventListener('click',async(e)=>{
  if(e.target===$('#model-dialog')){e.target.close();return}
  const close=e.target.closest('[data-close]');if(close){$('#model-dialog').close();return}
  const copy=e.target.closest('[data-copy-id]');if(copy){try{await copyText(copy.dataset.copyId);copy.textContent=T('common.copied')}catch{}}
});
$('#endpoint').textContent=location.origin+'/v1';
load();
`;
async function handleLandingPage(request) {
  const lang = resolveLang(request);
  const body = `${nav(lang, { status: true })}
<main>
<section class="hero"><div class="wrap hero-grid">
<div class="hero-copy">
<p class="eyebrow">${t(lang, "landing.eyebrow")}</p>
<h1>${t(lang, "landing.h1")}</h1>
<p class="lead">${t(lang, "landing.lead")}</p>
<div class="endpoint"><code id="endpoint">/v1</code><button id="copy">${t(lang, "common.copy")}</button></div>
<p class="hero-meta" id="coverage">\u2014</p>
<div id="error" class="msg err"></div>
</div>
<aside class="ledger" aria-label="${t(lang, "landing.ledger.title")}">
<div class="ledger-head"><span>${t(lang, "landing.ledger.title")}</span><span class="stamp">FREE</span></div>
<div class="ledger-big"><b id="stat-neurons">10,000</b><span>${t(lang, "landing.stat.neurons")}</span></div>
<div class="meter" role="img" aria-label="${t(lang, "landing.stat.usage")}"><i id="usage-fill"></i></div>
<div class="meter-labels"><span id="stat-usage">0%</span><span>${t(lang, "landing.ledger.caption")}</span></div>
<dl class="ledger-grid">
<div><dt>${t(lang, "landing.stat.freeModels")}</dt><dd id="stat-models">\u2014</dd></div>
<div><dt>${t(lang, "landing.stat.accounts")}</dt><dd id="stat-accounts">\u2014</dd></div>
<div><dt>${t(lang, "landing.ledger.backend")}</dt><dd id="stat-backend">\u2014</dd></div>
<div><dt>${t(lang, "landing.ledger.remaining")}</dt><dd id="stat-remaining">\u2014</dd></div>
</dl>
<p class="tiny">${t(lang, "landing.ledger.note")}</p>
</aside>
</div></section>

<section class="block" id="models"><div class="wrap">
<div class="block-head"><div><h2>${t(lang, "landing.catalog.title")}</h2><p id="model-count">${t(lang, "common.loading")}</p></div>
<div class="toolbar">
<input id="search" aria-label="${t(lang, "common.search")}" placeholder="${t(lang, "common.search")}" style="width:210px">
<select id="task-filter" aria-label="${t(lang, "landing.table.task")}"><option value="">${t(lang, "common.allTasks")}</option></select>
<select id="sort" aria-label="${t(lang, "landing.table.tier")}"><option value="performance">${t(lang, "landing.sort.performance")}</option><option value="price">${t(lang, "landing.sort.price")}</option><option value="context">${t(lang, "landing.sort.context")}</option><option value="updated">${t(lang, "landing.sort.updated")}</option><option value="name">${t(lang, "landing.sort.name")}</option></select>
</div></div>
<div class="table-wrap models-table"><table><thead><tr><th>#</th><th>${t(lang, "landing.table.model")}</th><th>${t(lang, "landing.table.task")}</th><th>${t(lang, "landing.table.context")}</th><th>${t(lang, "landing.table.caps")}</th><th>${t(lang, "landing.table.price")}</th><th>${t(lang, "landing.table.daily")}</th><th>${t(lang, "landing.table.tier")}</th></tr></thead><tbody id="model-rows"><tr><td colspan="8" style="padding:24px" class="muted">${t(lang, "common.loading")}</td></tr></tbody></table></div>
<p class="tiny" style="margin-top:10px">${t(lang, "landing.footnote")}</p>
<p class="tiny">${t(lang, "landing.paidNote")}</p>
</div></section>

<section class="block"><div class="wrap"><div class="cards">
<div class="card"><h3>${t(lang, "landing.cards.vs.title")}</h3><p>${t(lang, "landing.cards.vs.body")}</p><a href="/docs/workers-ai-vs-ai-gateway?lang=${lang}">${t(lang, "landing.cards.vs.link")}</a></div>
<div class="card"><h3>${t(lang, "landing.cards.api.title")}</h3><p>${t(lang, "landing.cards.api.body")}</p><a href="/docs/api?lang=${lang}">${t(lang, "landing.cards.api.link")}</a></div>
<div class="card"><h3>${t(lang, "landing.cards.quota.title")}</h3><p>${t(lang, "landing.cards.quota.body")}</p><a href="/docs/free-tier?lang=${lang}">${t(lang, "landing.cards.quota.link")}</a></div>
</div></div></section>
</main>
<dialog id="model-dialog"><div class="dlg-head" id="dlg-head"></div><div class="dlg-body" id="dlg-body"></div></dialog>
<footer><div class="wrap">${t(lang, "landing.footer")}</div></footer>`;
  return shell({
    title: t(lang, "landing.title"),
    description: t(lang, "landing.metaDesc"),
    body,
    script: LANDING_SCRIPT,
    lang
  });
}
var ADMIN_LOGIN_SCRIPT = `
$('#login-form').addEventListener('submit',async(e)=>{e.preventDefault();try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({password:$('#password').value})});location.reload()}catch(err){const m=$('#login-msg');m.textContent=err.message;m.className='msg show err'}});
`;
var ADMIN_SCRIPT = `
const state={overview:null,catalog:null,tab:'overview'};
async function boot(){
  if(!window.__AUTHENTICATED__)return;
  $('#logout').addEventListener('click',async()=>{await api('/api/auth/logout',{method:'POST'});location.reload()});
  $$('.side button[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
  bindOverview();bindModels();bindAccounts();bindKeys();bindSettings();
  await Promise.all([loadOverview(),loadModels()]);
}
function switchTab(tab){state.tab=tab;$$('.side button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$$('.tab').forEach(t=>t.classList.toggle('active',t.id==='tab-'+tab));if(tab==='usage')loadOverview();if(tab==='models')loadModels();if(tab==='accounts')loadAccounts();if(tab==='keys')loadKeys();if(tab==='settings')loadSettings()}
async function loadOverview(){
  try{const d=await api('/api/admin/overview');state.overview=d;const u=d.usage;
    $('#kpi-used').textContent=nf(u.totalNeuronsToday);$('#kpi-limit').textContent=nf(u.totalLimit);$('#kpi-remaining').textContent=nf(u.remainingNeurons);$('#kpi-accounts').textContent=nf(u.totalAccounts);
    $('#usage-pct').textContent=(u.usagePercentage||0)+'%';$('#usage-bar').style.width=Math.min(100,u.usagePercentage||0)+'%';
    $('#usage-note').textContent=T('admin.quota.note',{used:nf(u.totalNeuronsToday),reserved:nf(u.reservedNeurons),cloud:nf(u.cloudNeuronsToday),backend:u.quotaBackend});
    $('#account-usage').innerHTML=(u.accounts||[]).map(a=>'<li><span>'+esc(a.name)+'<br><span class="tiny mono">'+esc(a.accountId)+'</span></span><span class="price">'+nf(a.used)+' / '+nf(a.limit)+(a.error?' <span class="badge paid">error</span>':'')+'</span></li>').join('')||'<li class="muted">'+esc(T('admin.noAccounts'))+'</li>';
    $('#model-usage').innerHTML=(u.modelsToday||[]).slice(0,8).map(m=>'<li><span class="mono small">'+esc(m.model)+'</span><span class="price">'+nf(m.neurons)+' n</span></li>').join('')||'<li class="muted">'+esc(T('admin.noUsage'))+'</li>';
    $('#env-info').innerHTML='<dt>'+T('admin.env.version')+'</dt><dd>'+esc(d.version)+'</dd><dt>'+T('admin.env.kv')+'</dt><dd>'+(d.environment.kv?T('common.bound'):T('common.missing'))+'</dd><dt>'+T('admin.env.quota')+'</dt><dd>'+esc(d.environment.quota)+'</dd><dt>'+T('admin.env.maxDaily')+'</dt><dd>'+nf(d.environment.maxDailyNeurons)+'</dd><dt>'+T('admin.env.adminPassword')+'</dt><dd>'+(d.environment.adminPassword?T('common.set'):T('common.missing'))+'</dd>';
  }catch(e){location.reload()}
}
function bindOverview(){$('#refresh-usage').addEventListener('click',async(e)=>{const btn=e.target;btn.disabled=true;btn.textContent=T('common.refreshing');try{const d=await api('/api/admin/usage?force=1');$('#usage-note').textContent=T('admin.quota.refreshed',{local:nf(d.totalNeuronsToday),cloud:nf(d.cloudNeuronsToday)});await loadOverview()}catch(err){alert(err.message)}finally{btn.disabled=false;btn.textContent=T('admin.quota.refresh')}})}
async function loadModels(){
  try{const cat=await api('/api/admin/catalog');state.catalog=cat;
    $('#catalog-meta').textContent=T('admin.models.source',{source:cat.meta.source||'?',free:cat.meta.free_models||0,paid:cat.meta.paid_models||0,deprecated:cat.meta.deprecated_models||0,time:new Date(cat.meta.fetched_at).toLocaleString()});
    $('#catalog-coverage').textContent=T('admin.models.coverage',{partner:cat.meta.partner_models||0,authors:Object.keys(cat.meta.authors||{}).length,tasks:Object.keys(cat.meta.tasks||{}).length});
    const tasks=[...new Set(cat.data.map(m=>m.task))].sort();
    $('#model-task').innerHTML='<option value="">'+esc(T('common.allTasks'))+'</option>'+tasks.map(t=>'<option value="'+esc(t)+'">'+esc(taskLabel(t))+'</option>').join('');
    renderAdminModels();
  }catch(e){$('#catalog-meta').textContent=e.message}
}
function renderAdminModels(){
  const cat=state.catalog;if(!cat)return;const q=($('#model-search').value||'').toLowerCase();const task=$('#model-task').value;const paid=$('#model-paid').checked;
  let models=cat.data.filter(m=>(!task||m.task===task)&&(paid||m.free)&&(!q||(m.id+' '+m.name+' '+m.description).toLowerCase().includes(q)));
  models=models.map((m,i)=>({...m,performance:{...(m.performance||{}),rank:i+1}}));
  $('#admin-model-rows').innerHTML=models.map(m=>{
    const t=m.performance||{};
    return '<tr><td><span class="rank">'+(t.rank||'\u2014')+'</span></td><td><div class="model-name">'+esc(m.name)+'</div><div class="model-id">'+esc(m.id)+'</div>'+(m.requires_paid?'<span class="badge paid">'+esc(T('common.paidOnly'))+'</span>':'')+(m.deprecated?'<span class="badge paid">'+esc(T('common.deprecated'))+'</span>':'')+'</td>'+
    '<td data-label="'+esc(T('landing.table.task'))+'"><span class="badge">'+esc(taskLabel(m.task))+'</span></td><td data-label="'+esc(T('landing.table.context'))+'" class="nowrap">'+(m.context_window?nf(m.context_window):'\u2014')+'</td><td data-label="'+esc(T('landing.table.caps'))+'">'+caps(m).map(x=>'<span class="badge">'+esc(x)+'</span>').join('')+'</td>'+
    '<td data-label="'+esc(T('landing.table.price'))+'" class="price">'+esc(priceOf(m))+'</td><td data-label="'+esc(T('landing.table.neurons'))+'" class="nowrap">'+nf(m.pricing?.tokens?.output_neurons_per_million)+' n/M</td><td data-label="'+esc(T('landing.table.tier'))+'"><span class="tier '+tier(m)+'">'+tier(m)+'</span> '+(t.score??'\u2014')+'</td></tr>';
  }).join('')||'<tr><td colspan="8" class="muted" style="padding:20px">'+esc(T('admin.models.noMatch'))+'</td></tr>';
  $('#admin-model-count').textContent=T('admin.models.count',{n:models.length});
}
function bindModels(){
  ['#model-search','#model-task','#model-paid'].forEach(s=>$(s)?.addEventListener('input',renderAdminModels));
  $('#refresh-catalog').addEventListener('click',async(e)=>{const btn=e.target;btn.disabled=true;btn.textContent=T('common.refreshing');try{state.catalog=await api('/api/admin/catalog/refresh',{method:'POST'});renderAdminModels();$('#catalog-meta').textContent=T('admin.models.source',{source:state.catalog.meta.source,free:state.catalog.meta.free_models||0,paid:state.catalog.meta.paid_models||0,deprecated:state.catalog.meta.deprecated_models||0,time:new Date(state.catalog.meta.fetched_at).toLocaleString()});$('#catalog-coverage').textContent=T('admin.models.coverage',{partner:state.catalog.meta.partner_models||0,authors:Object.keys(state.catalog.meta.authors||{}).length,tasks:Object.keys(state.catalog.meta.tasks||{}).length})}catch(err){alert(err.message)}finally{btn.disabled=false;btn.textContent=T('admin.models.refresh')}});
}
async function loadAccounts(){
  try{const d=await api('/api/admin/accounts');$('#account-rows').innerHTML=d.accounts.map(a=>'<tr><td><div class="model-name">'+esc(a.name)+'</div><div class="model-id">'+esc(a.accountId)+'</div></td><td class="mono tiny">'+esc(a.tokenPreview)+'</td><td><span class="badge '+(a.status==='active'?'':'paid')+'">'+esc(a.status==='active'?T('common.active'):T('common.disabled'))+'</span></td><td>'+new Date(a.createdAt).toLocaleDateString()+'</td><td class="row-actions"><button class="btn sm" data-toggle-account="'+esc(a.id)+'" data-status="'+(a.status==='active'?'disabled':'active')+'">'+(a.status==='active'?T('common.disable'):T('common.enable'))+'</button><button class="btn sm danger" data-del-account="'+esc(a.id)+'">'+T('common.delete')+'</button></td></tr>').join('')||'<tr><td colspan="5" class="muted" style="padding:20px">'+esc(T('admin.accounts.noAccounts'))+'</td></tr>';
    $$('[data-del-account]').forEach(b=>b.onclick=async()=>{if(!confirm(T('admin.accounts.confirm')))return;await api('/api/admin/accounts/'+encodeURIComponent(b.dataset.delAccount),{method:'DELETE'});loadAccounts();loadOverview()});
    $$('[data-toggle-account]').forEach(b=>b.onclick=async()=>{await api('/api/admin/accounts/'+encodeURIComponent(b.dataset.toggleAccount),{method:'PATCH',body:JSON.stringify({status:b.dataset.status})});loadAccounts()});
  }catch(e){alert(e.message)}
}
function bindAccounts(){
  $('#account-form').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.target);try{await api('/api/admin/accounts',{method:'POST',body:JSON.stringify({name:f.get('name'),accountId:f.get('accountId'),apiToken:f.get('apiToken')})});setMsg($('#account-msg'),T('admin.accounts.added'),true);e.target.reset();loadAccounts();loadOverview()}catch(err){setMsg($('#account-msg'),err.message,false)}});
  $('#test-account').addEventListener('click',async()=>{const f=new FormData($('#account-form'));try{const d=await api('/api/admin/accounts/test',{method:'POST',body:JSON.stringify({accountId:f.get('accountId'),apiToken:f.get('apiToken')})});setMsg($('#account-msg'),d.ok?T('admin.accounts.tokenWorks',{n:d.models}):(d.error||'Token failed'),d.ok)}catch(err){setMsg($('#account-msg'),err.message,false)}});
}
async function loadKeys(){
  try{const d=await api('/api/admin/keys');$('#key-rows').innerHTML=d.keys.map(k=>'<tr><td><div class="model-name">'+esc(k.name)+'</div><div class="model-id">'+esc(k.prefix)+'\u2026'+esc(k.last4)+'</div></td><td><span class="badge '+(k.enabled?'':'paid')+'">'+(k.enabled?T('common.active'):T('common.disabled'))+'</span></td><td class="tiny">'+(k.lastUsedAt?new Date(k.lastUsedAt).toLocaleString():T('common.never'))+'</td><td>'+new Date(k.createdAt).toLocaleDateString()+'</td><td class="row-actions"><button class="btn sm" data-toggle-key="'+esc(k.id)+'" data-enabled="'+(!k.enabled)+'">'+(k.enabled?T('common.disable'):T('common.enable'))+'</button><button class="btn sm danger" data-del-key="'+esc(k.id)+'">'+T('common.delete')+'</button></td></tr>').join('')||'<tr><td colspan="5" class="muted" style="padding:20px">'+esc(T('admin.keys.noKeys'))+'</td></tr>';
    $$('[data-del-key]').forEach(b=>b.onclick=async()=>{if(!confirm(T('admin.keys.confirm')))return;await api('/api/admin/keys/'+encodeURIComponent(b.dataset.delKey),{method:'DELETE'});loadKeys()});
    $$('[data-toggle-key]').forEach(b=>b.onclick=async()=>{await api('/api/admin/keys/'+encodeURIComponent(b.dataset.toggleKey),{method:'PATCH',body:JSON.stringify({enabled:b.dataset.enabled==='true'})});loadKeys()});
  }catch(e){alert(e.message)}
}
function bindKeys(){
  $('#key-form').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.target);try{const d=await api('/api/admin/keys',{method:'POST',body:JSON.stringify({name:f.get('name')})});e.target.reset();$('#new-key').style.display='block';$('#new-key-value').textContent=d.plaintext;setMsg($('#key-msg'),T('admin.keys.created'),true);loadKeys()}catch(err){setMsg($('#key-msg'),err.message,false)}});
  $('#copy-key').addEventListener('click',async()=>{await copyText($('#new-key-value').textContent);$('#copy-key').textContent=T('common.copied');setTimeout(()=>$('#copy-key').textContent=T('common.copy'),1200)});
}
async function loadSettings(){
  try{const d=await api('/api/admin/settings');const s=d.settings;
    $('#gateway-id').value=s.gatewayId||'';$('#allow-public').checked=!!s.allowPublic;$('#daily-neurons').value=s.dailyNeurons||10000;$('#default-max').value=s.defaultMaxOutputTokens||1024;
    $('#aliases').value=JSON.stringify(s.aliases||{},null,2);$('#benchmarks').value=JSON.stringify(s.benchmarks||{},null,2);
  }catch(e){alert(e.message)}
}
function bindSettings(){
  $('#settings-form').addEventListener('submit',async(e)=>{e.preventDefault();
    let aliases,benchmarks;try{aliases=JSON.parse($('#aliases').value||'{}');benchmarks=JSON.parse($('#benchmarks').value||'{}')}catch(err){setMsg($('#settings-msg'),T('admin.settings.invalidJson',{error:err.message}),false);return}
    try{await api('/api/admin/settings',{method:'PUT',body:JSON.stringify({gatewayId:$('#gateway-id').value,allowPublic:$('#allow-public').checked,dailyNeurons:Number($('#daily-neurons').value),defaultMaxOutputTokens:Number($('#default-max').value),aliases,benchmarks})});setMsg($('#settings-msg'),T('admin.settings.saved'),true);loadOverview()}catch(err){setMsg($('#settings-msg'),err.message,false)}});
}
boot();
`;
function loginBody(lang) {
  return `<div class="login"><div class="card">
<div class="brand" style="margin-bottom:18px"><span class="mark">W</span> ${t(lang, "brand.name")}</div>
<h2 style="font-size:22px;letter-spacing:-.03em;margin:0 0 4px">${t(lang, "admin.login.title")}</h2>
<p class="sub" style="margin:0 0 18px">${t(lang, "admin.login.sub")}</p>
<form id="login-form"><label class="field"><span>${t(lang, "admin.login.password")}</span><input type="password" id="password" autocomplete="current-password" required autofocus></label>
<button class="btn primary" style="width:100%" type="submit">${t(lang, "admin.login.submit")}</button></form>
<div id="login-msg" class="msg"></div>
<p class="tiny" style="margin-top:16px"><a href="/?lang=${lang}">${t(lang, "admin.login.back")}</a></p>
</div></div>`;
}
function adminBody(lang) {
  return `${nav(lang)}
<div class="app">
<aside class="side">
<button data-tab="overview" class="active">${t(lang, "admin.nav.overview")}</button>
<button data-tab="models">${t(lang, "admin.nav.models")}</button>
<button data-tab="accounts">${t(lang, "admin.nav.accounts")}</button>
<button data-tab="keys">${t(lang, "admin.nav.keys")}</button>
<button data-tab="settings">${t(lang, "admin.nav.settings")}</button>
<button id="logout" style="margin-top:14px;color:var(--bad)">${t(lang, "admin.nav.logout")}</button>
</aside>
<main class="main">
<section id="tab-overview" class="tab active">
<h2>${t(lang, "admin.overview.title")}</h2><p class="sub">${t(lang, "admin.overview.sub")}</p>
<div class="kpis"><div class="kpi"><b id="kpi-used">\u2014</b><span>${t(lang, "admin.kpi.used")}</span></div><div class="kpi"><b id="kpi-limit">\u2014</b><span>${t(lang, "admin.kpi.limit")}</span></div><div class="kpi"><b id="kpi-remaining">\u2014</b><span>${t(lang, "admin.kpi.remaining")}</span></div><div class="kpi"><b id="kpi-accounts">\u2014</b><span>${t(lang, "admin.kpi.accounts")}</span></div></div>
<div class="split">
<div class="card"><h3>${t(lang, "admin.quota.title")} <span id="usage-pct" class="muted"></span></h3><div class="usage-bar"><i id="usage-bar"></i></div><p class="tiny" id="usage-note" style="margin-top:10px"></p><button class="btn sm" id="refresh-usage" style="margin-top:10px">${t(lang, "admin.quota.refresh")}</button></div>
<div class="card"><h3>${t(lang, "admin.env.title")}</h3><dl class="kv" id="env-info"></dl></div>
</div>
<div class="split" style="margin-top:16px">
<div class="card"><h3>${t(lang, "admin.perAccount.title")}</h3><ul class="list" id="account-usage"><li class="muted">${t(lang, "common.loading")}</li></ul></div>
<div class="card"><h3>${t(lang, "admin.topModels.title")}</h3><ul class="list" id="model-usage"><li class="muted">${t(lang, "common.loading")}</li></ul></div>
</div>
</section>

<section id="tab-models" class="tab">
<h2>${t(lang, "admin.nav.models")}</h2><p class="sub" id="catalog-meta">${t(lang, "common.loading")}</p>
<div class="toolbar"><input id="model-search" placeholder="${t(lang, "common.search")}" style="width:220px"><select id="model-task"><option value="">${t(lang, "common.allTasks")}</option></select><label class="pill"><input type="checkbox" id="model-paid" style="width:auto;margin-right:4px"> ${t(lang, "admin.models.includePaid")}</label><button class="btn sm" id="refresh-catalog">${t(lang, "admin.models.refresh")}</button><span class="tiny" id="admin-model-count"></span></div>
<p class="tiny" id="catalog-coverage" style="margin:10px 0 0"></p>
<div class="table-wrap models-table" style="margin-top:12px"><table><thead><tr><th>#</th><th>${t(lang, "landing.table.model")}</th><th>${t(lang, "landing.table.task")}</th><th>${t(lang, "landing.table.context")}</th><th>${t(lang, "landing.table.caps")}</th><th>${t(lang, "landing.table.price")}</th><th>${t(lang, "landing.table.neurons")}</th><th>${t(lang, "landing.table.tier")}</th></tr></thead><tbody id="admin-model-rows"></tbody></table></div>
<p class="tiny" style="margin-top:10px">${t(lang, "admin.models.footnote")}</p>
</section>

<section id="tab-accounts" class="tab">
<h2>${t(lang, "admin.nav.accounts")}</h2><p class="sub">${t(lang, "admin.accounts.sub")}</p>
<div class="card" style="margin-bottom:16px"><h3>${t(lang, "admin.accounts.addTitle")}</h3>
<form class="form" id="account-form">
<label class="field"><span>${t(lang, "admin.accounts.name")}</span><input name="name" placeholder="Personal" required></label>
<label class="field"><span>${t(lang, "admin.accounts.accountId")}</span><input name="accountId" placeholder="32 hex characters" required></label>
<label class="field wide"><span>${t(lang, "admin.accounts.token")}</span><input name="apiToken" type="password" autocomplete="off" required></label>
<div class="row-actions wide"><button class="btn primary" type="submit">${t(lang, "admin.accounts.add")}</button><button class="btn" type="button" id="test-account">${t(lang, "admin.accounts.test")}</button></div>
</form><div id="account-msg" class="msg"></div>
<p class="tiny">${t(lang, "admin.accounts.hint")}</p></div>
<div class="table-wrap"><table><thead><tr><th>${t(lang, "admin.accounts.table.account")}</th><th>${t(lang, "admin.accounts.table.token")}</th><th>${t(lang, "admin.accounts.table.status")}</th><th>${t(lang, "admin.accounts.table.added")}</th><th>${t(lang, "admin.accounts.table.actions")}</th></tr></thead><tbody id="account-rows"></tbody></table></div>
</section>

<section id="tab-keys" class="tab">
<h2>${t(lang, "admin.nav.keys")}</h2><p class="sub">${t(lang, "admin.keys.sub")}</p>
<div class="card" style="margin-bottom:16px"><form class="form inline" id="key-form"><label class="field"><span>${t(lang, "admin.keys.name")}</span><input name="name" placeholder="LobeChat" required></label><button class="btn primary" type="submit">${t(lang, "admin.keys.create")}</button></form><div id="key-msg" class="msg"></div>
<div id="new-key" style="display:none;margin-top:8px"><div class="note"><div class="tiny" style="margin-bottom:6px">${t(lang, "admin.keys.copyNow")}</div><div style="display:flex;gap:8px;align-items:center"><code id="new-key-value" style="word-break:break-all;flex:1"></code><button class="btn sm" id="copy-key">${t(lang, "common.copy")}</button></div></div></div></div>
<div class="table-wrap"><table><thead><tr><th>${t(lang, "admin.keys.table.key")}</th><th>${t(lang, "admin.keys.table.status")}</th><th>${t(lang, "admin.keys.table.lastUsed")}</th><th>${t(lang, "admin.keys.table.created")}</th><th>${t(lang, "admin.keys.table.actions")}</th></tr></thead><tbody id="key-rows"></tbody></table></div>
</section>

<section id="tab-settings" class="tab">
<h2>${t(lang, "admin.nav.settings")}</h2><p class="sub">${t(lang, "admin.settings.sub")}</p>
<form id="settings-form">
<div class="card" style="margin-bottom:16px"><h3>${t(lang, "admin.settings.runtime")}</h3><div class="form">
<label class="field"><span>${t(lang, "admin.settings.gateway")}</span><input id="gateway-id" placeholder="default"></label>
<label class="field"><span>${t(lang, "admin.settings.daily")}</span><input id="daily-neurons" type="number" min="1" max="10000"></label>
<label class="field"><span>${t(lang, "admin.settings.defaultMax")}</span><input id="default-max" type="number" min="1" max="131072"></label>
<label class="field"><span>${t(lang, "admin.settings.public")}</span><input id="allow-public" type="checkbox" style="width:auto"></label>
</div><p class="tiny">${t(lang, "admin.settings.quotaHint")}</p></div>
<div class="card" style="margin-bottom:16px"><h3>${t(lang, "admin.settings.aliases")}</h3><p class="tiny">${t(lang, "admin.settings.aliasesHint")}</p><textarea id="aliases"></textarea></div>
<div class="card" style="margin-bottom:16px"><h3>${t(lang, "admin.settings.benchmarks")}</h3><p class="tiny">${t(lang, "admin.settings.benchmarksHint")}</p><textarea id="benchmarks"></textarea></div>
<div class="row-actions"><button class="btn primary" type="submit">${t(lang, "common.save")}</button></div><div id="settings-msg" class="msg"></div>
</form>
</section>
</main></div>`;
}
async function handleAdminPage(request, env) {
  const lang = resolveLang(request);
  const authenticated = await isAdmin(request, env);
  const setupWarning = hasAdminPassword(env) ? "" : `<div class="note" style="margin:16px 24px">${t(lang, "admin.setupWarning")}</div>`;
  const body = authenticated ? `${adminBody(lang)}${setupWarning}` : loginBody(lang);
  return shell({
    title: t(lang, authenticated ? "admin.title" : "admin.signinTitle"),
    body,
    script: authenticated ? ADMIN_SCRIPT : ADMIN_LOGIN_SCRIPT,
    authenticated,
    lang
  });
}

// src/ui/docs.js
function wrapTables(html) {
  return html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, "</table></div>");
}
function docsNav(lang) {
  return `${nav(lang)}<div class="wrap" style="padding-top:14px">
<a class="tiny" href="/?lang=${lang}">\u2190 ${t(lang, "docs.nav.home")}</a>
<span class="tiny">/</span> <a class="tiny" href="/docs/api?lang=${lang}">${t(lang, "docs.nav.api")}</a>
<span class="tiny">/</span> <a class="tiny" href="/docs/free-tier?lang=${lang}">${t(lang, "docs.nav.freeTier")}</a>
<span class="tiny">/</span> <a class="tiny" href="/docs/workers-ai-vs-ai-gateway?lang=${lang}">${t(lang, "docs.nav.vs")}</a>
</div>`;
}
var VS_EN = `<article class="docs wrap">
<h1>Workers AI vs AI Gateway</h1>
<p>These are two different layers. Workers AI <em>runs</em> models. AI Gateway <em>controls</em> requests to models \u2014 including Workers AI and external providers. They compose; they do not replace each other.</p>

<h2>The short version</h2>
<table><thead><tr><th></th><th>Workers AI</th><th>AI Gateway</th></tr></thead><tbody>
<tr><td><strong>What it is</strong></td><td>Serverless inference on Cloudflare GPUs plus the model catalog.</td><td>A proxy/control plane in front of AI providers.</td></tr>
<tr><td><strong>Runs models?</strong></td><td>Yes. Cloudflare-hosted and partner models.</td><td>No. It forwards to Workers AI, OpenAI, Anthropic, Google, etc.</td></tr>
<tr><td><strong>Billing</strong></td><td>Neurons. $0.011 per 1,000 neurons; 10,000 free neurons per day, resets 00:00 UTC.</td><td>Gateway itself is free on the standard plan. It can enable prepaid \u201Cunified billing\u201D credits for Workers AI frontier models.</td></tr>
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
<li>Use <strong>Workers AI directly</strong> for simple, cost-controlled, free-tier usage \u2014 the default here.</li>
<li>Use <strong>AI Gateway in front of Workers AI</strong> for logs, latency metrics, cache controls and rate limiting.</li>
<li>Use <strong>AI Gateway with other providers</strong> when you want one control plane across Workers AI, OpenAI, Anthropic and others.</li>
<li>Use <strong>AI Gateway unified billing</strong> only if you intentionally move beyond the free allocation; paid-only frontier models require it or a Workers Paid plan.</li>
</ul>
<p class="tiny">Sources: Cloudflare Workers AI pricing, limits, errors and OpenAI-compatibility docs; AI Gateway Workers AI provider docs. Checked October 2026.</p>
</article>`;
var VS_ZH = `<article class="docs wrap">
<h1>Workers AI \u4E0E AI Gateway</h1>
<p>\u8FD9\u662F\u4E24\u4E2A\u4E0D\u540C\u7684\u5C42\u3002Workers AI <em>\u8FD0\u884C</em>\u6A21\u578B\uFF1BAI Gateway <em>\u63A7\u5236</em>\u53D1\u5F80\u6A21\u578B\u7684\u8BF7\u6C42\u2014\u2014\u5305\u62EC Workers AI \u548C\u5916\u90E8\u63D0\u4F9B\u5546\u3002\u5B83\u4EEC\u53EF\u4EE5\u7EC4\u5408\u4F7F\u7528\uFF0C\u4F46\u4E0D\u662F\u4E92\u76F8\u66FF\u4EE3\u3002</p>

<h2>\u4E00\u53E5\u8BDD\u533A\u5206</h2>
<table><thead><tr><th></th><th>Workers AI</th><th>AI Gateway</th></tr></thead><tbody>
<tr><td><strong>\u662F\u4EC0\u4E48</strong></td><td>Cloudflare GPU \u4E0A\u7684\u65E0\u670D\u52A1\u5668\u63A8\u7406\uFF0C\u4EE5\u53CA\u6A21\u578B\u76EE\u5F55\u3002</td><td>\u4F4D\u4E8E AI \u63D0\u4F9B\u5546\u524D\u9762\u7684\u4EE3\u7406 / \u63A7\u5236\u5E73\u9762\u3002</td></tr>
<tr><td><strong>\u8FD0\u884C\u6A21\u578B\uFF1F</strong></td><td>\u662F\u3002Cloudflare \u6258\u7BA1\u6A21\u578B\u4E0E\u5408\u4F5C\u4F19\u4F34\u6A21\u578B\u3002</td><td>\u5426\u3002\u5B83\u8F6C\u53D1\u5230 Workers AI\u3001OpenAI\u3001Anthropic\u3001Google \u7B49\u3002</td></tr>
<tr><td><strong>\u8BA1\u8D39</strong></td><td>\u6309 Neurons\u3002\u6BCF 1,000 Neurons $0.011\uFF1B\u6BCF\u5929 10,000 \u514D\u8D39 Neurons\uFF0CUTC 00:00 \u91CD\u7F6E\u3002</td><td>\u6807\u51C6\u8BA1\u5212\u4E0B\u7F51\u5173\u672C\u8EAB\u514D\u8D39\u3002\u53EF\u4E3A Workers AI \u524D\u6CBF\u6A21\u578B\u542F\u7528\u9884\u4ED8\u201C\u7EDF\u4E00\u8BA1\u8D39\u201D\u989D\u5EA6\u3002</td></tr>
<tr><td><strong>\u514D\u8D39\u989D\u5EA6</strong></td><td>\u6BCF\u5929 10,000 Neurons\u3002\u90E8\u5206\u6A21\u578B\u9700\u8981 Workers Paid \u6216 AI Gateway \u9884\u4ED8\u989D\u5EA6\u3002</td><td>\u4E0D\u589E\u52A0\u514D\u8D39\u63A8\u7406\u3002\u7F13\u5B58\u53EF\u4EE5\u907F\u514D\u91CD\u590D\u63A8\u7406\u6210\u672C\u3002</td></tr>
<tr><td><strong>\u6838\u5FC3\u80FD\u529B</strong></td><td>\u6A21\u578B\u76EE\u5F55\u3001OpenAI \u517C\u5BB9\u5BF9\u8BDD / \u5411\u91CF\u3001\u539F\u751F run API\u3001\u51FD\u6570\u8C03\u7528\u3001LoRA\u3001\u6279\u5904\u7406\u3001\u63D0\u793A\u7F13\u5B58\u3002</td><td>\u5206\u6790\u3001\u65E5\u5FD7\u3001\u7F13\u5B58\u3001\u9650\u6D41\u3001\u91CD\u8BD5 / \u6545\u969C\u8F6C\u79FB\u3001\u62A4\u680F\u3001\u52A8\u6001\u8DEF\u7531\u3001\u7EDF\u4E00\u8BA1\u8D39\u3002</td></tr>
<tr><td><strong>\u8BA4\u8BC1</strong></td><td>\u5177\u5907 Workers AI \u6743\u9650\u7684 Cloudflare API Token\u3002</td><td>Cloudflare API Token\uFF1B\u53EF\u9009\u7684\u7F51\u5173\u8BA4\u8BC1 Token\u3002</td></tr>
</tbody></table>

<h2>\u5B83\u4EEC\u5982\u4F55\u8FDE\u63A5</h2>
<p>\u5728\u540C\u4E00\u4E2A Cloudflare API URL \u4E0A\u6DFB\u52A0 <code>cf-aig-gateway-id</code> \u8BF7\u6C42\u5934\uFF0C\u5C31\u80FD\u8BA9 Workers AI \u8BF7\u6C42\u7ECF\u8FC7\u7F51\u5173\u3002\u6A21\u578B\u4ECD\u5728 Workers AI \u4E0A\u8FD0\u884C\uFF0C\u4ECD\u7136\u6D88\u8017 Neurons\uFF1B\u7F51\u5173\u53EA\u8D1F\u8D23\u89C2\u5BDF\u548C\u63A7\u5236\u8BF7\u6C42\u3002</p>
<pre><code>POST https://api.cloudflare.com/client/v4/accounts/&lt;account_id&gt;/ai/v1/chat/completions
Authorization: Bearer &lt;api_token&gt;
cf-aig-gateway-id: default

{"model":"@cf/zai-org/glm-4.7-flash","messages":[...]}</code></pre>
<p>Workers AI \u4E5F\u63D0\u4F9B\u7ED1\u5B9A\u8C03\u7528\u65B9\u5F0F\uFF08<code>env.AI.run(model, input, { gateway: { id, skipCache, cacheTtl } })</code>\uFF09\uFF0CAI Gateway \u8FD8\u6709\u81EA\u5DF1\u7684 REST \u57FA\u7840\u5730\u5740\u3002\u672C\u9879\u76EE\u4F7F\u7528\u8BF7\u6C42\u5934\u65B9\u5F0F\uFF0C\u56E0\u4E3A\u5B83\u8BA9\u6240\u6709\u8D26\u53F7\u5171\u7528\u540C\u4E00\u6761\u4E0A\u6E38\u8DEF\u5F84\uFF0C\u5E76\u4E14\u517C\u5BB9 REST API\u3002</p>

<h2>\u672C\u9879\u76EE\u5982\u4F55\u4F7F\u7528</h2>
<ul>
<li><strong>Workers AI \u662F\u63A8\u7406\u63D0\u4F9B\u65B9\u3002</strong>\u6240\u6709\u6A21\u578B\u8C03\u7528\u90FD\u53D1\u9001\u5230 <code>api.cloudflare.com/client/v4/accounts/{id}/ai/...</code>\u3002</li>
<li><strong>AI Gateway \u662F\u53EF\u9009\u9879\u3002</strong>\u5728\u7BA1\u7406\u540E\u53F0\u586B\u5199\u7F51\u5173 ID \u540E\uFF0C\u6BCF\u4E2A\u8BF7\u6C42\u90FD\u4F1A\u5E26\u4E0A <code>cf-aig-gateway-id</code>\uFF0C\u4ECE\u800C\u83B7\u5F97\u7F51\u5173\u5206\u6790\u3001\u7F13\u5B58\u4E0E\u65E5\u5FD7\uFF0C\u4E0D\u6539\u53D8\u6A21\u578B\u4E0E\u989D\u5EA6\u6A21\u578B\u3002</li>
<li>\u7F51\u5173<strong>\u4E0D\u4F1A</strong>\u7ED5\u8FC7\u514D\u8D39 Neuron \u4E0A\u9650\u3002\u672C\u5730\u989D\u5EA6\u4FDD\u62A4\u4ECD\u4F1A\u6309\u8D26\u53F7\u3001\u6309\u5929\u9884\u7559\u5E76\u7ED3\u7B97 Neurons\u3002</li>
<li>\u7F51\u5173\u7F13\u5B58\u53EF\u4EE5\u51CF\u5C11\u91CD\u590D\u63D0\u793A\u7684 Neuron \u6D88\u8017\u3002\u672C\u9879\u76EE\u8FD8\u4F1A\u8F6C\u53D1 <code>x-session-affinity</code>\uFF0C\u63D0\u5347 Workers AI \u524D\u7F00\u7F13\u5B58\u7684\u547D\u4E2D\u7387\u3002</li>
</ul>

<div class="callout">\u5982\u679C\u4F60\u53EA\u9700\u8981\u901A\u8FC7 OpenAI \u517C\u5BB9\u63A5\u53E3\u8BBF\u95EE\u514D\u8D39 Workers AI \u6A21\u578B\uFF0C\u4E0D\u9700\u8981 AI Gateway\u3002\u9700\u8981\u53EF\u89C2\u6D4B\u6027\u3001\u7F13\u5B58\u3001\u8DE8\u63D0\u4F9B\u5546\u91CD\u8BD5\u6216\u524D\u6CBF\u6A21\u578B\u9884\u4ED8\u8BA1\u8D39\u65F6\uFF0C\u518D\u63A5\u5165\u5B83\u3002</div>

<h2>\u5982\u4F55\u9009\u62E9</h2>
<ul>
<li>\u7B80\u5355\u3001\u53EF\u63A7\u3001\u514D\u8D39\u989D\u5EA6\u4F18\u5148\uFF1A<strong>\u76F4\u63A5\u4F7F\u7528 Workers AI</strong>\u2014\u2014\u672C\u9879\u76EE\u7684\u9ED8\u8BA4\u65B9\u5F0F\u3002</li>
<li>\u9700\u8981\u65E5\u5FD7\u3001\u5EF6\u8FDF\u6307\u6807\u3001\u7F13\u5B58\u63A7\u5236\u548C\u9650\u6D41\uFF1A<strong>\u5728 Workers AI \u524D\u52A0 AI Gateway</strong>\u3002</li>
<li>\u9700\u8981\u540C\u65F6\u7BA1\u7406 Workers AI\u3001OpenAI\u3001Anthropic \u7B49\uFF1A<strong>\u7528 AI Gateway \u7EDF\u4E00\u63A7\u5236\u9762</strong>\u3002</li>
<li>\u53EA\u6709\u660E\u786E\u8981\u8D85\u51FA\u514D\u8D39\u989D\u5EA6\u65F6\u624D\u4F7F\u7528 <strong>AI Gateway \u7EDF\u4E00\u8BA1\u8D39</strong>\uFF1B\u4ED8\u8D39\u524D\u6CBF\u6A21\u578B\u9700\u8981\u5B83\u6216 Workers Paid \u8BA1\u5212\u3002</li>
</ul>
<p class="tiny">\u6765\u6E90\uFF1ACloudflare Workers AI \u5B9A\u4EF7\u3001\u9650\u5236\u3001\u9519\u8BEF\u4E0E OpenAI \u517C\u5BB9\u6587\u6863\uFF1BAI Gateway \u7684 Workers AI \u63D0\u4F9B\u5546\u6587\u6863\u3002\u6838\u5BF9\u65F6\u95F4\uFF1A2026 \u5E74 10 \u6708\u3002</p>
</article>`;
var API_EN = `<article class="docs wrap">
<h1>API reference</h1>
<p>Base URL: <code>https://&lt;your-worker&gt;/v1</code>. Authenticate with <code>Authorization: Bearer sk-wa-\u2026</code> or <code>x-api-key</code>. If no keys exist and <code>allowPublic</code> is off, requests are rejected.</p>
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
    "display": "$0.06 / input \xB7 $0.4 / output"
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
var API_ZH = `<article class="docs wrap">
<h1>\u63A5\u53E3\u53C2\u8003</h1>
<p>\u57FA\u7840\u5730\u5740\uFF1A<code>https://&lt;your-worker&gt;/v1</code>\u3002\u4F7F\u7528 <code>Authorization: Bearer sk-wa-\u2026</code> \u6216 <code>x-api-key</code> \u8BA4\u8BC1\u3002\u5982\u679C\u6CA1\u6709\u4EFB\u4F55\u5BC6\u94A5\u4E14 <code>allowPublic</code> \u5173\u95ED\uFF0C\u8BF7\u6C42\u4F1A\u88AB\u62D2\u7EDD\u3002</p>
<pre><code>curl https://your-worker/v1/models \\
  -H "Authorization: Bearer $KEY"</code></pre>

<h2>\u7AEF\u70B9</h2>
<table><thead><tr><th>\u65B9\u6CD5</th><th>\u8DEF\u5F84</th><th>\u7528\u9014</th></tr></thead><tbody>
<tr><td>GET</td><td><code>/v1/models</code></td><td>\u52A8\u6001\u514D\u8D39\u76EE\u5F55\uFF0C\u6309\u4F30\u7B97\u6027\u80FD\u6392\u5E8F\u3002\u652F\u6301 <code>task</code>\u3001<code>search</code>\u3001<code>sort</code>\u3001<code>limit</code>\u3002</td></tr>
<tr><td>GET</td><td><code>/v1/models/{id}</code></td><td>\u5355\u4E2A\u6A21\u578B\u7684\u4EF7\u683C\u3001\u80FD\u529B\u4E0E\u6392\u540D\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/chat/completions</code></td><td>OpenAI \u5BF9\u8BDD\uFF0C\u652F\u6301 SSE \u6D41\u5F0F\u3001\u5DE5\u5177\uFF0C\u4EE5\u53CA\u6A21\u578B\u652F\u6301\u7684\u89C6\u89C9\u8F93\u5165\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/completions</code></td><td>\u65E7\u7248\u6587\u672C\u8865\u5168\u9002\u914D\uFF08\u975E\u6D41\u5F0F\uFF09\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/responses</code></td><td>GPT-OSS \u6A21\u578B\u7684 OpenAI Responses API\uFF08\u975E\u6D41\u5F0F\uFF09\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/embeddings</code></td><td>\u6587\u672C\u5411\u91CF\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/images/generations</code></td><td>\u6587\u672C\u751F\u56FE\uFF0C\u8FD4\u56DE <code>b64_json</code>\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/audio/transcriptions</code></td><td>multipart \u97F3\u9891\u8F6C\u5199\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/audio/speech</code></td><td>\u6587\u672C\u8F6C\u8BED\u97F3\uFF0C\u8FD4\u56DE\u97F3\u9891\u5B57\u8282\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/rerank</code></td><td>Jina / Cohere \u98CE\u683C\u91CD\u6392\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/run</code></td><td>\u901A\u7528 <code>{model, inputs}</code> \u900F\u4F20\uFF0C\u9002\u7528\u4E8E\u76EE\u5F55\u4E2D\u7684\u4EFB\u610F\u4EFB\u52A1\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/messages</code></td><td>Anthropic Messages API\uFF0C\u652F\u6301\u6D41\u5F0F\u4E0E\u5DE5\u5177\u3002</td></tr>
<tr><td>POST</td><td><code>/v1/messages/count_tokens</code></td><td>\u8FD1\u4F3C token \u8BA1\u6570\u3002</td></tr>
</tbody></table>

<h2>\u6A21\u578B\u5BF9\u8C61</h2>
<p><code>/v1/models</code> \u8FD4\u56DE\u6807\u51C6 OpenAI \u5B57\u6BB5\u4EE5\u53CA\u5B9E\u65F6\u5143\u6570\u636E\uFF1A</p>
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
    "display": "$0.06 / input \xB7 $0.4 / output"
  },
  "free": true,
  "requires_paid": false,
  "deprecated": false,
  "free_daily_output_tokens": 274725,
  "performance": {"score": 50.9, "tier": "B", "rank": 7, "basis": [...]}
}</code></pre>
<p>\u4ED8\u8D39\u6A21\u578B\u4E0D\u4F1A\u51FA\u73B0\u5728 <code>/v1/models</code> \u4E2D\uFF0C\u4EE3\u7406\u4E5F\u4F1A\u62D2\u7EDD\u5B83\u4EEC\uFF1B\u5B83\u4EEC\u4ECD\u53EF\u5728\u7BA1\u7406\u540E\u53F0\u67E5\u770B\u3002\u5DF2\u5F03\u7528\u6A21\u578B\u5728 Cloudflare \u7684\u5BBD\u9650\u671F\u5185\u4ECD\u53EF\u8C03\u7528\uFF0C\u5E76\u5E26\u6709 <code>"deprecated": true</code>\u3002</p>

<h2>\u5BF9\u8BDD\u793A\u4F8B</h2>
<pre><code>curl https://your-worker/v1/chat/completions \\
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\
  -d '{
    "model": "@cf/zai-org/glm-4.7-flash",
    "messages": [{"role":"user","content":"\u7528\u4E00\u6BB5\u8BDD\u89E3\u91CA Neurons\u3002"}],
    "stream": true
  }'</code></pre>
<p>\u77ED\u540D\u79F0\u5728\u552F\u4E00\u65F6\u4F1A\u81EA\u52A8\u5339\u914D\uFF1A<code>"model":"glm-4.7-flash"</code>\u3002\u9700\u8981\u7A33\u5B9A\u7684\u5BA2\u6237\u7AEF\u540D\u79F0\u65F6\uFF0C\u53EF\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u522B\u540D\u3002</p>

<h2>\u989D\u5EA6\u4E0E\u9519\u8BEF</h2>
<p>\u6210\u529F\u54CD\u5E94\u4F1A\u5305\u542B <code>x-workers-ai-model</code>\u3001<code>x-workers-ai-account</code>\u3001<code>x-quota-remaining</code> \u548C <code>x-quota-limit</code>\u3002</p>
<table><thead><tr><th>\u72B6\u6001</th><th>\u4EE3\u7801</th><th>\u542B\u4E49</th></tr></thead><tbody>
<tr><td>401</td><td><code>invalid_api_key</code></td><td>\u5BC6\u94A5\u7F3A\u5931\u6216\u9519\u8BEF\uFF1B\u6216\u6CA1\u6709\u4EFB\u4F55\u5BC6\u94A5\u4E14\u516C\u5F00\u8BBF\u95EE\u5173\u95ED\u3002</td></tr>
<tr><td>403</td><td><code>model_requires_paid_plan</code></td><td>\u6A21\u578B\u9700\u8981 Workers Paid \u6216 AI Gateway \u9884\u4ED8\u989D\u5EA6\u3002</td></tr>
<tr><td>404</td><td><code>model_not_found</code></td><td>\u4E0D\u5728\u5B9E\u65F6\u514D\u8D39\u76EE\u5F55\u4E2D\u3002</td></tr>
<tr><td>429</td><td><code>insufficient_quota</code></td><td>\u6240\u6709\u8D26\u53F7\u7684\u6BCF\u65E5\u514D\u8D39\u989D\u5EA6\u5DF2\u8017\u5C3D\uFF08Cloudflare \u9519\u8BEF\u7801 3036\uFF09\uFF0C\u6216\u8BF7\u6C42\u4F30\u7B97\u8D85\u8FC7\u6BCF\u65E5\u9884\u7B97\u3002</td></tr>
<tr><td>429</td><td><code>capacity_exceeded</code></td><td>Workers AI \u6682\u65F6\u5BB9\u91CF\u4E0D\u8DB3\uFF08\u9519\u8BEF\u7801 3040\uFF09\uFF0C\u7A0D\u540E\u91CD\u8BD5\u3002</td></tr>
<tr><td>502</td><td><code>upstream_error</code></td><td>Cloudflare \u8FD4\u56DE\u4E86\u610F\u5916\u9519\u8BEF\u3002</td></tr>
</tbody></table>

<h2>AI Gateway</h2>
<p>\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199\u7F51\u5173 ID \u540E\uFF0C\u6240\u6709\u4E0A\u6E38\u8BF7\u6C42\u90FD\u4F1A\u5E26\u4E0A <code>cf-aig-gateway-id</code>\u3002\u53EA\u6709\u5728\u914D\u7F6E\u4E86\u7F51\u5173\u65F6\uFF0C\u5BA2\u6237\u7AEF\u7684 <code>cf-aig-cache-ttl</code>\u3001<code>cf-aig-cache-key</code> \u548C <code>cf-aig-skip-cache</code> \u624D\u4F1A\u88AB\u8F6C\u53D1\u3002<code>x-session-affinity</code> \u59CB\u7EC8\u8F6C\u53D1\uFF0C\u7528\u4E8E\u63D0\u5347\u524D\u7F00\u7F13\u5B58\u547D\u4E2D\u7387\u3002</p>
</article>`;
var FREE_EN = `<article class="docs wrap">
<h1>The hard free-tier guard</h1>
<p>Cloudflare gives every account <strong>10,000 neurons per day</strong> at no charge, resetting at <strong>00:00 UTC</strong>. The app treats that as a hard ceiling, not a suggestion.</p>

<h2>How a request is accounted</h2>
<ol>
<li><strong>Estimate.</strong> The proxy estimates prompt tokens (over-estimating at ~3.6 chars/token plus 850 tokens per image) and output tokens (<code>max_tokens</code>, or the configured default). It multiplies by the model's live neuron rates.</li>
<li><strong>Reserve.</strong> A Durable Object atomically checks <code>used + reserved + estimate \u2264 limit</code>. If it passes, the amount is reserved before any upstream call.</li>
<li><strong>Call with failover.</strong> If an account has no quota or returns 3036, the next account is tried. Other 429/5xx errors also fail over; client errors (400/404/413) do not.</li>
<li><strong>Settle.</strong> After the body is consumed, actual <code>usage</code> tokens are converted to neurons and the reservation is released. Streaming responses settle when the stream flushes.</li>
<li><strong>Reconcile.</strong> The usage tab queries Cloudflare GraphQL analytics (<code>aiInferenceAdaptiveGroups</code>) and takes the higher of local and cloud usage. This catches usage from the dashboard/playground or other apps.</li>
</ol>

<div class="callout">If the Durable Object binding is missing, the app falls back to KV accounting. It still enforces the cap best-effort, but KV is not atomic under concurrency. Bind <code>QUOTA</code> for a strict guarantee.</div>

<h2>Why reserve the maximum?</h2>
<p>Cloudflare bills after inference; there is no pre-flight neuron quote. Reserving an upper bound means concurrent requests cannot collectively overshoot. If the model produces fewer tokens, the difference is released at settlement. A crash between reserve and settle leaves the reservation in place until the UTC day rolls over \u2014 a fail-safe direction.</p>

<h2>What is excluded</h2>
<p>Cloudflare marks certain models as requiring a Workers Paid plan or AI Gateway prepaid credits. They are <strong>not</strong> in the free catalog and the proxy rejects them with <code>403 model_requires_paid_plan</code>. The list is parsed from the live pricing page, not hardcoded; as of October 2026 it includes Kimi K2.6/K2.7, GLM-5.2/5.3/5.3-Flash, and DeepSeek V4 Flash/Pro variants.</p>

<h2>Catalog coverage</h2>
<p>The catalog merges the native <code>/ai/models/search</code> response (authoritative task names) with the OpenRouter-shaped response (pricing, context, modalities), then enriches it with the public docs snapshot. It includes Cloudflare-hosted and partner models: Meta, Mistral, Qwen, Google, OpenAI, DeepSeek, Moonshot, Zhipu, Deepgram, Black Forest Labs, Leonardo, RunwayML, Stability, IBM, NVIDIA, BAAI and others. External providers reached through AI Gateway (OpenAI, Anthropic, Google APIs) are <strong>not</strong> Workers AI models and are not part of the free neuron pool.</p>

<h2>Tuning</h2>
<ul>
<li><code>settings.dailyNeurons</code> defaults to 10,000 and cannot exceed <code>MAX_DAILY_NEURONS</code> (default 10,000).</li>
<li><code>settings.defaultMaxOutputTokens</code> controls the reservation when clients omit <code>max_tokens</code>. Lower it if you see avoidable quota rejections.</li>
<li>Larger contexts can exceed the entire daily allowance in one request. The proxy rejects those with an explicit estimate before calling upstream.</li>
<li>With multiple accounts, the aggregate budget is <code>accounts \xD7 10,000</code>; each account is tracked separately.</li>
</ul>

<h2>What it does not do</h2>
<p>It does not create free quota, bypass Cloudflare's rate limits, or make paid-only models free. It only ensures this app never intentionally spends past the free allocation.</p>
</article>`;
var FREE_ZH = `<article class="docs wrap">
<h1>\u514D\u8D39\u989D\u5EA6\u786C\u4FDD\u62A4</h1>
<p>Cloudflare \u4E3A\u6BCF\u4E2A\u8D26\u53F7\u63D0\u4F9B<strong>\u6BCF\u5929 10,000 Neurons</strong> \u7684\u514D\u8D39\u989D\u5EA6\uFF0C\u5728 <strong>UTC 00:00</strong> \u91CD\u7F6E\u3002\u672C\u9879\u76EE\u628A\u5B83\u5F53\u4F5C\u786C\u4E0A\u9650\uFF0C\u800C\u4E0D\u662F\u5EFA\u8BAE\u503C\u3002</p>

<h2>\u4E00\u6B21\u8BF7\u6C42\u5982\u4F55\u8BB0\u8D26</h2>
<ol>
<li><strong>\u4F30\u7B97\u3002</strong>\u4EE3\u7406\u4F1A\u4F30\u7B97\u63D0\u793A tokens\uFF08\u6309\u7EA6 3.6 \u5B57\u7B26/token\uFF0C\u6BCF\u5F20\u56FE\u7247\u989D\u5916 850 tokens \u8FDB\u884C\u9AD8\u4F30\uFF09\u548C\u8F93\u51FA tokens\uFF08<code>max_tokens</code> \u6216\u914D\u7F6E\u7684\u9ED8\u8BA4\u503C\uFF09\uFF0C\u518D\u4E58\u4EE5\u6A21\u578B\u7684\u5B9E\u65F6 Neuron \u8D39\u7387\u3002</li>
<li><strong>\u9884\u7559\u3002</strong>Durable Object \u539F\u5B50\u68C0\u67E5 <code>\u5DF2\u7528 + \u9884\u7559 + \u4F30\u7B97 \u2264 \u4E0A\u9650</code>\u3002\u901A\u8FC7\u540E\u624D\u5728\u8C03\u7528\u4E0A\u6E38\u4E4B\u524D\u9884\u7559\u989D\u5EA6\u3002</li>
<li><strong>\u5E26\u6545\u969C\u8F6C\u79FB\u8C03\u7528\u3002</strong>\u67D0\u4E2A\u8D26\u53F7\u6CA1\u6709\u989D\u5EA6\u6216\u8FD4\u56DE 3036 \u65F6\uFF0C\u81EA\u52A8\u5C1D\u8BD5\u4E0B\u4E00\u4E2A\u8D26\u53F7\u3002\u5176\u4ED6 429/5xx \u4E5F\u4F1A\u8F6C\u79FB\uFF1B\u5BA2\u6237\u7AEF\u9519\u8BEF\uFF08400/404/413\uFF09\u4E0D\u4F1A\u3002</li>
<li><strong>\u7ED3\u7B97\u3002</strong>\u54CD\u5E94\u4F53\u6D88\u8D39\u5B8C\u6210\u540E\uFF0C\u7528\u5B9E\u9645 <code>usage</code> tokens \u6362\u7B97 Neurons \u5E76\u91CA\u653E\u9884\u7559\u3002\u6D41\u5F0F\u54CD\u5E94\u5728\u6D41\u7ED3\u675F\u65F6\u7ED3\u7B97\u3002</li>
<li><strong>\u6838\u5BF9\u3002</strong>\u7528\u91CF\u9875\u4F1A\u67E5\u8BE2 Cloudflare GraphQL \u5206\u6790\uFF08<code>aiInferenceAdaptiveGroups</code>\uFF09\uFF0C\u53D6\u672C\u5730\u4E0E\u4E91\u7AEF\u7528\u91CF\u7684\u8F83\u5927\u503C\u3002\u8FD9\u6837\u80FD\u8986\u76D6 Dashboard / Playground \u6216\u5176\u4ED6\u5E94\u7528\u7684\u6D88\u8017\u3002</li>
</ol>

<div class="callout">\u5982\u679C\u7F3A\u5C11 Durable Object \u7ED1\u5B9A\uFF0C\u5E94\u7528\u4F1A\u9000\u5316\u4E3A KV \u8BB0\u8D26\u3002\u5B83\u4ECD\u4F1A\u5C3D\u529B\u6267\u884C\u4E0A\u9650\uFF0C\u4F46 KV \u5728\u5E76\u53D1\u4E0B\u4E0D\u662F\u539F\u5B50\u7684\u3002\u9700\u8981\u4E25\u683C\u4FDD\u8BC1\u65F6\u8BF7\u7ED1\u5B9A <code>QUOTA</code>\u3002</div>

<h2>\u4E3A\u4EC0\u4E48\u8981\u6309\u6700\u5927\u503C\u9884\u7559\uFF1F</h2>
<p>Cloudflare \u5728\u63A8\u7406\u5B8C\u6210\u540E\u624D\u8BA1\u8D39\uFF0C\u6CA1\u6709\u8C03\u7528\u524D\u7684 Neuron \u62A5\u4EF7\u3002\u9884\u7559\u4E0A\u754C\u53EF\u4EE5\u786E\u4FDD\u5E76\u53D1\u8BF7\u6C42\u4E0D\u4F1A\u5408\u8BA1\u8D85\u652F\u3002\u5982\u679C\u6A21\u578B\u5B9E\u9645\u8F93\u51FA\u66F4\u5C11\uFF0C\u5DEE\u989D\u4F1A\u5728\u7ED3\u7B97\u65F6\u91CA\u653E\u3002\u5982\u679C\u5728\u9884\u7559\u4E0E\u7ED3\u7B97\u4E4B\u95F4\u5D29\u6E83\uFF0C\u9884\u7559\u4F1A\u4FDD\u7559\u5230 UTC \u8DE8\u5929\u2014\u2014\u8FD9\u662F\u504F\u5B89\u5168\u7684\u5931\u8D25\u65B9\u5411\u3002</p>

<h2>\u54EA\u4E9B\u6A21\u578B\u88AB\u6392\u9664</h2>
<p>Cloudflare \u5C06\u90E8\u5206\u6A21\u578B\u6807\u8BB0\u4E3A\u9700\u8981 Workers Paid \u8BA1\u5212\u6216 AI Gateway \u9884\u4ED8\u989D\u5EA6\u3002\u5B83\u4EEC<strong>\u4E0D\u4F1A</strong>\u8FDB\u5165\u514D\u8D39\u76EE\u5F55\uFF0C\u4EE3\u7406\u4F1A\u4EE5 <code>403 model_requires_paid_plan</code> \u62D2\u7EDD\u3002\u540D\u5355\u4ECE\u5B9E\u65F6\u5B9A\u4EF7\u9875\u89E3\u6790\uFF0C\u800C\u975E\u786C\u7F16\u7801\uFF1B\u622A\u81F3 2026 \u5E74 10 \u6708\u5305\u62EC Kimi K2.6/K2.7\u3001GLM-5.2/5.3/5.3-Flash\uFF0C\u4EE5\u53CA DeepSeek V4 Flash/Pro \u7CFB\u5217\u3002</p>

<h2>\u76EE\u5F55\u8986\u76D6\u8303\u56F4</h2>
<p>\u76EE\u5F55\u4F1A\u5408\u5E76\u539F\u751F <code>/ai/models/search</code> \u54CD\u5E94\uFF08\u6743\u5A01\u4EFB\u52A1\u540D\u79F0\uFF09\u4E0E OpenRouter \u5F62\u72B6\u7684\u54CD\u5E94\uFF08\u4EF7\u683C\u3001\u4E0A\u4E0B\u6587\u3001\u6A21\u6001\uFF09\uFF0C\u518D\u8865\u5145\u516C\u5F00\u6587\u6863\u5FEB\u7167\u3002\u5B83\u5305\u542B Cloudflare \u6258\u7BA1\u6A21\u578B\u4E0E\u5408\u4F5C\u4F19\u4F34\u6A21\u578B\uFF1AMeta\u3001Mistral\u3001Qwen\u3001Google\u3001OpenAI\u3001DeepSeek\u3001Moonshot\u3001Zhipu\u3001Deepgram\u3001Black Forest Labs\u3001Leonardo\u3001RunwayML\u3001Stability\u3001IBM\u3001NVIDIA\u3001BAAI \u7B49\u3002\u901A\u8FC7 AI Gateway \u8BBF\u95EE\u7684\u5916\u90E8\u63D0\u4F9B\u5546\uFF08OpenAI\u3001Anthropic\u3001Google API\uFF09<strong>\u4E0D\u662F</strong> Workers AI \u6A21\u578B\uFF0C\u4E5F\u4E0D\u5C5E\u4E8E\u514D\u8D39 Neuron \u6C60\u3002</p>

<h2>\u8C03\u4F18</h2>
<ul>
<li><code>settings.dailyNeurons</code> \u9ED8\u8BA4 10,000\uFF0C\u4E14\u4E0D\u80FD\u8D85\u8FC7 <code>MAX_DAILY_NEURONS</code>\uFF08\u9ED8\u8BA4 10,000\uFF09\u3002</li>
<li><code>settings.defaultMaxOutputTokens</code> \u63A7\u5236\u5BA2\u6237\u7AEF\u672A\u4F20 <code>max_tokens</code> \u65F6\u7684\u9884\u7559\u91CF\u3002\u5982\u679C\u7ECF\u5E38\u51FA\u73B0\u53EF\u907F\u514D\u7684\u989D\u5EA6\u62D2\u7EDD\uFF0C\u53EF\u4EE5\u8C03\u4F4E\u5B83\u3002</li>
<li>\u8F83\u5927\u7684\u4E0A\u4E0B\u6587\u53EF\u80FD\u5728\u4E00\u6B21\u8BF7\u6C42\u4E2D\u8017\u5C3D\u6574\u65E5\u989D\u5EA6\u3002\u4EE3\u7406\u4F1A\u5728\u8C03\u7528\u4E0A\u6E38\u524D\u7528\u660E\u786E\u4F30\u7B97\u62D2\u7EDD\u8FD9\u7C7B\u8BF7\u6C42\u3002</li>
<li>\u591A\u8D26\u53F7\u65F6\u603B\u9884\u7B97\u662F <code>\u8D26\u53F7\u6570 \xD7 10,000</code>\uFF1B\u6BCF\u4E2A\u8D26\u53F7\u5355\u72EC\u8BB0\u8D26\u3002</li>
</ul>

<h2>\u5B83\u4E0D\u505A\u4EC0\u4E48</h2>
<p>\u5B83\u4E0D\u4F1A\u521B\u9020\u514D\u8D39\u989D\u5EA6\u3001\u7ED5\u8FC7 Cloudflare \u7684\u901F\u7387\u9650\u5236\uFF0C\u4E5F\u4E0D\u4F1A\u8BA9\u4ED8\u8D39\u6A21\u578B\u53D8\u514D\u8D39\u3002\u5B83\u53EA\u4FDD\u8BC1\u672C\u5E94\u7528\u4E0D\u4F1A\u4E3B\u52A8\u82B1\u8D85\u514D\u8D39\u989D\u5EA6\u3002</p>
</article>`;
var DOCS = {
  "workers-ai-vs-ai-gateway": {
    en: { title: "Workers AI vs AI Gateway \u2014 Workers AI2API", html: VS_EN },
    zh: { title: "Workers AI \u4E0E AI Gateway \u2014 Workers AI2API", html: VS_ZH }
  },
  api: {
    en: { title: "API reference \u2014 Workers AI2API", html: API_EN },
    zh: { title: "\u63A5\u53E3\u53C2\u8003 \u2014 Workers AI2API", html: API_ZH }
  },
  "free-tier": {
    en: { title: "Free-tier guard \u2014 Workers AI2API", html: FREE_EN },
    zh: { title: "\u514D\u8D39\u989D\u5EA6\u786C\u4FDD\u62A4 \u2014 Workers AI2API", html: FREE_ZH }
  }
};
function handleDocsPage(slug, request) {
  const doc = DOCS[slug];
  if (!doc) return null;
  const lang = request ? resolveLang(request) : "zh";
  const content = doc[lang] || doc.en;
  const body = `${docsNav(lang)}<main>${wrapTables(content.html)}</main><footer><div class="wrap">${t(lang, "docs.footer")}</div></footer>`;
  return shell({ title: content.title, body, lang });
}

// src/quota-do.js
var QuotaGuard = class {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const day = String(body.day || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return Response.json({ ok: false, error: "invalid day" }, { status: 400 });
    }
    const limit = Math.max(0, Number(body.limit) || 0);
    const key = `day:${day}`;
    return this.state.blockConcurrencyWhile(async () => {
      let record = await this.state.storage.get(key);
      if (!record) record = { used: 0, reserved: 0, updatedAt: Date.now() };
      const remaining = () => Math.max(0, limit - record.used - record.reserved);
      switch (url.pathname) {
        case "/reserve": {
          const amount = Math.max(0, Math.ceil(Number(body.amount) || 0));
          if (record.used + record.reserved + amount > limit) {
            return Response.json({
              ok: false,
              used: record.used,
              reserved: record.reserved,
              remaining: remaining(),
              limit
            });
          }
          record.reserved += amount;
          record.updatedAt = Date.now();
          await this.state.storage.put(key, record);
          return Response.json({
            ok: true,
            reserved: record.reserved,
            used: record.used,
            remaining: remaining(),
            limit
          });
        }
        case "/settle": {
          const reserved = Math.max(0, Math.ceil(Number(body.reserved) || 0));
          const actual = Math.max(0, Math.ceil(Number(body.actual) || 0));
          record.reserved = Math.max(0, record.reserved - reserved);
          record.used += actual;
          record.updatedAt = Date.now();
          await this.state.storage.put(key, record);
          return Response.json({
            ok: true,
            used: record.used,
            reserved: record.reserved,
            remaining: remaining(),
            limit
          });
        }
        case "/reconcile": {
          const used = Math.max(0, Math.ceil(Number(body.used) || 0));
          record.used = Math.max(record.used, used);
          record.updatedAt = Date.now();
          await this.state.storage.put(key, record);
          return Response.json({ ok: true, used: record.used, reserved: record.reserved, remaining: remaining(), limit });
        }
        case "/exhaust": {
          record.used = limit;
          record.reserved = 0;
          record.updatedAt = Date.now();
          await this.state.storage.put(key, record);
          return Response.json({ ok: true, used: record.used, remaining: 0, limit });
        }
        case "/status": {
          return Response.json({
            ok: true,
            used: record.used,
            reserved: record.reserved,
            remaining: remaining(),
            limit
          });
        }
        default:
          return Response.json({ ok: false, error: "not found" }, { status: 404 });
      }
    });
  }
};

// src/index.js
var HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; base-uri 'none'; form-action 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};
function htmlHeaders(request) {
  const headers = { ...HTML_HEADERS };
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang");
  if (lang === "zh" || lang === "en") {
    const secure = url.protocol === "https:" ? "; Secure" : "";
    headers["Set-Cookie"] = `lang=${resolveLang(request)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  }
  return headers;
}
function setupResponse(request) {
  if (new URL(request.url).pathname.startsWith("/v1/")) {
    return json({
      error: {
        message: 'KV binding "KV" is missing. Create a KV namespace and bind it as KV before using the API.',
        type: "configuration_error",
        code: "kv_not_configured"
      }
    }, { status: 503 });
  }
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Setup required</title>
<style>body{font-family:ui-sans-serif,system-ui,sans-serif;max-width:720px;margin:10vh auto;padding:24px;line-height:1.6;background:#0b0d10;color:#e8eaed}code{background:#1b1f24;padding:2px 6px;border-radius:4px}</style></head>
<body><h1>KV binding missing</h1><p>Create a KV namespace and bind it as <code>KV</code>, then reload this page.</p>
<p>Workers: <code>wrangler kv namespace create KV</code> and put the id in <code>wrangler.jsonc</code>.<br>Pages: Settings \u2192 Bindings \u2192 KV namespace \u2192 variable name <code>KV</code>.</p></body></html>`, { status: 503, headers: HTML_HEADERS });
}
function apiUnauthorized(reason, anthropic = false) {
  const message = reason === "no_keys" ? "No API keys exist and public access is disabled. Create a key in /admin, or set allowPublic=true." : "Incorrect or missing API key. Use Authorization: Bearer sk-wa-\u2026 or x-api-key.";
  if (anthropic) {
    return new AnthropicError(message, 401, "authentication_error").toResponse();
  }
  return openAIError(message, { status: 401, code: "invalid_api_key", type: "authentication_error" });
}
async function touchKey(env, ctx, key) {
  if (!key?.hash) return;
  const last = key.lastUsedAt ? Date.parse(key.lastUsedAt) : 0;
  if (Date.now() - last < 10 * 6e4) return;
  ctx?.waitUntil?.(updateConfig(env, (config) => {
    const stored = config.apiKeys.find((item) => item.id === key.id);
    if (stored) stored.lastUsedAt = (/* @__PURE__ */ new Date()).toISOString();
    return config;
  }).catch(() => {
  }));
}
async function previewJson(request) {
  try {
    return await request.clone().json();
  } catch {
    return null;
  }
}
async function previewForm(request) {
  try {
    return await request.clone().formData();
  } catch {
    return null;
  }
}
function openAIDefault(requested, catalog) {
  if (requested === "whisper-1") {
    return catalog.models.find((model) => model.free && model.task === "automatic-speech-recognition" && model.id.endsWith("/whisper"));
  }
  if (requested === "tts-1" || requested === "tts-1-hd") {
    return catalog.models.find((model) => model.free && model.task === "text-to-speech" && model.id.includes("melotts"));
  }
  if (requested === "dall-e-3" || requested === "dall-e-2") {
    return catalog.models.find((model) => model.free && model.task === "text-to-image" && model.id.endsWith("/flux-1-schnell"));
  }
  return null;
}
async function handleV1(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const anthropicEndpoint = path === "/v1/messages" || path === "/v1/messages/count_tokens";
  const auth = await verifyApiKey(request, env);
  if (!auth.ok) return apiUnauthorized(auth.reason, anthropicEndpoint);
  await touchKey(env, ctx, auth.key);
  if (path === "/v1/models" && request.method === "GET") {
    const includePaid = url.searchParams.get("include_paid") === "1" && await isAdmin(request, env);
    const data = await catalogResponse(env, ctx, {
      includePaid,
      task: url.searchParams.get("task"),
      search: url.searchParams.get("search"),
      sort: url.searchParams.get("sort") || "performance",
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : null
    });
    return json(data, {
      headers: {
        "x-workers-ai-catalog-source": data.meta?.source || "unknown",
        "Cache-Control": "public, max-age=60"
      }
    });
  }
  if (path.startsWith("/v1/models/") && request.method === "GET") {
    const requested = decodeURIComponent(path.slice("/v1/models/".length));
    const catalog2 = await getCatalog(env, ctx);
    const model = findModel(catalog2, requested);
    if (!model) throw new RequestError(`Model "${requested}" not found.`, { status: 404, code: "model_not_found" });
    if (model.requires_paid && !await isAdmin(request, env)) {
      throw new RequestError(`Model "${model.id}" requires a Workers Paid plan.`, { status: 403, code: "model_requires_paid_plan" });
    }
    return json(publicModel(model));
  }
  const catalog = await getCatalog(env, ctx);
  const settings = await getSettings(env);
  const resolve = (name, options) => resolveModel(catalog, name, settings, options);
  if ((path === "/v1/chat/completions" || path === "/v1/completions") && request.method === "POST") {
    const body = await previewJson(request);
    if (!body?.model) throw new RequestError("model is required", { status: 400, code: "missing_model" });
    const model = resolve(body.model, { task: "text-generation" });
    return handleChat(request, env, ctx, model, { legacyCompletions: path === "/v1/completions" });
  }
  if (path === "/v1/responses" && request.method === "POST") {
    const body = await previewJson(request);
    if (!body?.model) throw new RequestError("model is required", { status: 400, code: "missing_model" });
    const model = resolve(body.model, { task: "text-generation" });
    return handleResponses(request, env, ctx, model);
  }
  if (path === "/v1/embeddings" && request.method === "POST") {
    const body = await previewJson(request);
    if (!body?.model) throw new RequestError("model is required", { status: 400, code: "missing_model" });
    const model = resolve(body.model, { task: "text-embeddings" });
    return handleEmbeddings(request, env, ctx, model);
  }
  if (path === "/v1/images/generations" && request.method === "POST") {
    const body = await previewJson(request);
    if (!body?.model) throw new RequestError("model is required", { status: 400, code: "missing_model" });
    const model = openAIDefault(body.model, catalog) || resolve(body.model, { task: "text-to-image" });
    return handleImages(request, env, ctx, model);
  }
  if (path === "/v1/audio/transcriptions" && request.method === "POST") {
    const form = await previewForm(request);
    const requested = String(form?.get("model") || "whisper-1");
    const model = openAIDefault(requested, catalog) || resolve(requested, { task: "automatic-speech-recognition" });
    return handleTranscription(request, env, ctx, model);
  }
  if (path === "/v1/audio/speech" && request.method === "POST") {
    const body = await previewJson(request);
    if (!body?.model) throw new RequestError("model is required", { status: 400, code: "missing_model" });
    const model = openAIDefault(body.model, catalog) || resolve(body.model, { task: "text-to-speech" });
    return handleSpeech(request, env, ctx, model);
  }
  if (path === "/v1/rerank" && request.method === "POST") {
    const body = await previewJson(request);
    if (!body?.model) throw new RequestError("model is required", { status: 400, code: "missing_model" });
    const model = resolve(body.model, { task: "text-classification" });
    return handleRerank(request, env, ctx, model);
  }
  if (path === "/v1/run" && request.method === "POST") {
    const body = await previewJson(request);
    if (!body?.model) throw new RequestError("model is required", { status: 400, code: "missing_model" });
    const model = resolve(body.model);
    return handleRun(request, env, ctx, model);
  }
  if (path === "/v1/messages" && request.method === "POST") {
    const body = await previewJson(request);
    if (!body?.model) throw new AnthropicError("model is required.", 400, "invalid_request_error");
    const model = resolve(body.model, { task: "text-generation" });
    return handleAnthropicMessages(request, env, ctx, model);
  }
  if (path === "/v1/messages/count_tokens" && request.method === "POST") {
    const body = await previewJson(request);
    if (!body?.model) throw new AnthropicError("model is required.", 400, "invalid_request_error");
    const model = resolve(body.model, { task: "text-generation" });
    return handleAnthropicCountTokens(request, env, ctx, model);
  }
  throw new RequestError(`Unknown endpoint: ${request.method} ${path}`, { status: 404, code: "not_found" });
}
function errorResponse(error, request) {
  const path = new URL(request.url).pathname;
  if (path === "/v1/messages" || path === "/v1/messages/count_tokens") {
    if (error instanceof InferenceError) {
      return new AnthropicError(error.message, error.status, error.status === 401 ? "authentication_error" : "api_error").toResponse();
    }
    if (error instanceof RequestError) {
      return new AnthropicError(error.message, error.status, error.status === 404 ? "not_found_error" : "invalid_request_error").toResponse();
    }
  }
  if (typeof error?.toResponse === "function") return error.toResponse();
  console.error("Unhandled error", error);
  return openAIError("Internal server error", { status: 500, code: "internal_error", type: "server_error" });
}
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return preflight(request);
    try {
      if (url.pathname === "/robots.txt") {
        return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      if (url.pathname === "/favicon.ico" || url.pathname === "/favicon.svg") {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#f6821f"/><path d="M16 40h32M16 24h32M24 16l-8 8 8 8M40 32l8 8-8 8" stroke="#0b0d10" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
        return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
      }
      if (!env.KV) return setupResponse(request);
      if (url.pathname.startsWith("/api/")) {
        return cors(await handleAdminApi(request, env, ctx), request);
      }
      if (url.pathname.startsWith("/v1/")) {
        return cors(await handleV1(request, env, ctx), request);
      }
      if (url.pathname === "/") {
        return new Response(await handleLandingPage(request, env, ctx), { headers: htmlHeaders(request) });
      }
      if (url.pathname === "/admin" || url.pathname === "/admin/") {
        return new Response(await handleAdminPage(request, env, ctx), { headers: htmlHeaders(request) });
      }
      if (url.pathname.startsWith("/docs/")) {
        const page = handleDocsPage(url.pathname.slice("/docs/".length).replace(/\/$/, ""), request);
        if (page) return new Response(page, { headers: htmlHeaders(request) });
      }
      return new Response("404 Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    } catch (error) {
      return cors(errorResponse(error, request), request);
    }
  }
};
export {
  QuotaGuard,
  index_default as default
};
