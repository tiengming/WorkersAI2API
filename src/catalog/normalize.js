import { isPlainObject } from '../utils.js';
import { shortModelId } from './ranking.js';

const TASK_ALIASES = {
	'text generation': 'text-generation',
	'text-generation': 'text-generation',
	'text embeddings': 'text-embeddings',
	'text-embeddings': 'text-embeddings',
	embeddings: 'text-embeddings',
	embedding: 'text-embeddings',
	'text-to-image': 'text-to-image',
	'text to image': 'text-to-image',
	'image generation': 'text-to-image',
	'automatic speech recognition': 'automatic-speech-recognition',
	'speech recognition': 'automatic-speech-recognition',
	'speech to text': 'automatic-speech-recognition',
	'text-to-speech': 'text-to-speech',
	'text to speech': 'text-to-speech',
	translation: 'translation',
	summarization: 'summarization',
	'text classification': 'text-classification',
	'image classification': 'image-classification',
	'image-to-text': 'image-to-text',
	'image to text': 'image-to-text',
	'object detection': 'object-detection',
	'dumb pipe': 'dumb-pipe',
};

export function normalizeTask(value) {
	if (!value) return 'unknown';
	const raw = typeof value === 'string'
		? value
		: (value.name || value.id || value.task || '');
	const key = String(raw).trim().toLowerCase();
	if (!key) return 'unknown';
	return TASK_ALIASES[key] || key.replace(/\s+/g, '-');
}

const KNOWN_TASKS = new Set(Object.values(TASK_ALIASES));

function resolveDeclaredTask(raw, props) {
	for (const value of [raw?.task, raw?.task_name, props?.task]) {
		const task = normalizeTask(value);
		if (task !== 'unknown') return task;
	}
	// OpenRouter-shaped rows sometimes carry a generic `type` such as "chat".
	// Only accept it when it maps to a real Workers AI task.
	const type = normalizeTask(raw?.type);
	return KNOWN_TASKS.has(type) ? type : 'unknown';
}

function modalityList(value) {
	if (!value) return null;
	const list = Array.isArray(value)
		? value
		: String(value).split(/[,+/|]/);
	const normalized = [...new Set(
		list
			.map((item) => String(item).trim().toLowerCase())
			.filter(Boolean),
	)];
	return normalized.length ? normalized : null;
}

/**
 * Extract modalities from either the OpenRouter architecture shape or the
 * native Workers AI properties. Returns null when the API gives us nothing,
 * so callers can fall back to task-based defaults.
 */
export function explicitModalities(raw) {
	const architecture = raw?.architecture || {};
	let input = modalityList(
		architecture.input_modalities
		|| raw?.input_modalities
		|| raw?.modalities?.input,
	);
	let output = modalityList(
		architecture.output_modalities
		|| raw?.output_modalities
		|| raw?.modalities?.output,
	);

	const modality = String(architecture.modality || raw?.modality || '').toLowerCase();
	if ((!input || !output) && /->|→/.test(modality)) {
		const [left, right] = modality.split(/->|→/);
		input ||= modalityList(left);
		output ||= modalityList(right);
	}
	return { input, output };
}

/**
 * Infer the Workers AI task when the API response omits it.
 *
 * The `?format=openrouter` response is OpenRouter-shaped: it has no `task`
 * field at all. Without inference every model shows up as "unknown". The
 * native response always carries `task`, so this is a safety net, not the
 * primary source of truth.
 */
export function inferTask(raw, props = {}, modalities = null) {
	const id = String(raw?.id || '').toLowerCase();
	const name = String(raw?.name || '').toLowerCase();
	const text = `${id} ${name}`;
	const mods = modalities || explicitModalities(raw);
	const input = mods.input || [];
	const output = mods.output || [];

	const propTask = normalizeTask(props.task);
	if (propTask !== 'unknown') return propTask;

	if (/rerank/.test(text)) return 'text-classification';

	if (/embedding|embed-|bge-|plamo-embedding|embeddinggemma/.test(text)
		|| output.includes('embedding') || output.includes('embeddings')) {
		return 'text-embeddings';
	}

	if (/melotts|aura-|text[- ]to[- ]speech|\btts\b/.test(text) || output.includes('audio')) {
		return 'text-to-speech';
	}

	if (/smart-turn|dumb[- ]pipe/.test(text)) return 'dumb-pipe';

	if (/llava|moondream/.test(text)) return 'image-to-text';

	if (/whisper|nova-3|transcrib|speech[- ]to[- ]text|\basr\b|deepgram\/flux/.test(text)
		|| (input.includes('audio') && output.includes('text'))) {
		return 'automatic-speech-recognition';
	}

	if (/resnet|image[- ]classification/.test(text)) return 'image-classification';

	// Image generation: only trust the id/name when the model is not a
	// vision-language or image-to-text model (those output text, not images).
	const looksLikeChat = /vision|instruct|chat|multimodal/.test(text);
	const looksLikeImageToText = /image[- ]to[- ]text|llava|moondream/.test(text);
	if (output.includes('image')
		|| (!looksLikeChat && !looksLikeImageToText && /stable-diffusion|sdxl|flux|dreamshaper|lucid-origin|phoenix|diffusion|text[- ]to[- ]image|image[- ]generat/.test(text))) {
		return 'text-to-image';
	}

	if (input.includes('image') && output.includes('text') && !looksLikeChat) return 'image-to-text';

	if (/m2m100|indictrans|translat/.test(text)) return 'translation';
	if (/bart.*cnn|summar/.test(text)) return 'summarization';
	if (/classif|sentiment|distilbert|sst-2|toxic/.test(text)) return 'text-classification';

	return 'text-generation';
}

export function endpointForTask(task) {
	switch (task) {
		case 'text-generation': return '/v1/chat/completions';
		case 'text-embeddings': return '/v1/embeddings';
		case 'text-to-image': return '/v1/images/generations';
		case 'automatic-speech-recognition': return '/v1/audio/transcriptions';
		case 'text-to-speech': return '/v1/audio/speech';
		default: return '/v1/run';
	}
}

function propsOf(raw) {
	const out = {};
	const props = raw?.properties ?? raw?.property ?? raw?.capabilities;
	if (Array.isArray(props)) {
		for (const item of props) {
			if (typeof item === 'string') out[item] = true;
			else if (item?.property_id) out[item.property_id] = item.value;
			else if (isPlainObject(item)) Object.assign(out, item);
		}
	} else if (isPlainObject(props)) {
		Object.assign(out, props);
	}
	return out;
}

function truthy(value) {
	return value === true
		|| value === 1
		|| ['true', 'yes', '1', 'supported'].includes(String(value ?? '').toLowerCase());
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
		output: explicit.output || fallback.output,
	};
}

function taskModalities(task) {
	switch (task) {
		case 'text-to-image': return { input: ['text'], output: ['image'] };
		case 'automatic-speech-recognition': return { input: ['audio'], output: ['text'] };
		case 'text-to-speech': return { input: ['text'], output: ['audio'] };
		case 'image-to-text': return { input: ['image'], output: ['text'] };
		default: return { input: ['text'], output: ['text'] };
	}
}

function inferCapabilities(raw, props, modalities, task, description) {
	const supported = new Set([
		...(raw.supported_parameters || []),
		...(props.supported_parameters || []),
	]);
	const text = `${description || ''} ${raw.name || ''} ${raw.id || ''}`.toLowerCase();
	const input = modalities.input || [];
	const output = modalities.output || [];

	const functionCalling = truthy(props.function_calling)
		|| truthy(props.tool_calling)
		|| supported.has('tools')
		|| supported.has('tool_choice')
		|| /\bfunction calling\b|\btool[- ]calling\b/.test(text);

	const reasoning = truthy(props.reasoning)
		|| supported.has('reasoning')
		|| supported.has('reasoning_effort')
		|| /\breasoning\b|\bthinking\b/.test(text);

	const structured = truthy(props.structured_output)
		|| supported.has('structured_outputs')
		|| supported.has('response_format')
		|| /\bstructured output\b/.test(text);

	return {
		function_calling: Boolean(functionCalling),
		reasoning: Boolean(reasoning),
		structured_output: Boolean(structured),
		vision: input.includes('image') || input.includes('video'),
		audio_input: input.includes('audio'),
		audio_output: output.includes('audio'),
		streaming: props.streaming === undefined ? task.includes('text') : truthy(props.streaming),
		multilingual: /\bmultilingual\b|\b100\+ languages\b/.test(text),
	};
}

function pricingFromOpenRouter(raw) {
	const prices = raw?.pricing;
	if (!isPlainObject(prices)) return null;
	const perToken = (value) => {
		const number = Number(value);
		return Number.isFinite(number) ? number * 1_000_000 : null;
	};
	const input = perToken(prices.prompt ?? prices.input);
	const output = perToken(prices.completion ?? prices.output);
	const cached = perToken(prices.input_cache_read ?? prices.cached_input);
	if (input == null && output == null) return null;
	const usdToNeurons = (usd) => Math.ceil(usd * (1_000_000 / 11));
	const tokens = {};
	const items = [];
	if (input != null) {
		tokens.input_usd_per_million = input;
		tokens.input_neurons_per_million = usdToNeurons(input);
		items.push({ kind: 'input_token', usd: input, neurons: usdToNeurons(input), unit: 'per M input tokens' });
	}
	if (output != null) {
		tokens.output_usd_per_million = output;
		tokens.output_neurons_per_million = usdToNeurons(output);
		items.push({ kind: 'output_token', usd: output, neurons: usdToNeurons(output), unit: 'per M output tokens' });
	}
	if (cached != null) {
		tokens.cached_input_usd_per_million = cached;
		tokens.cached_input_neurons_per_million = usdToNeurons(cached);
		items.push({ kind: 'cached_input_token', usd: cached, neurons: usdToNeurons(cached), unit: 'per M cached input tokens' });
	}
	return {
		items,
		tokens,
		display: items.map((item) => `$${item.usd} / ${item.kind.replace(/_/g, ' ')}`).join(' · '),
		source: 'cloudflare-models-api',
	};
}

function createdTimestamp(raw) {
	if (raw?.created) return Number(raw.created);
	if (raw?.created_at) {
		const time = Date.parse(raw.created_at);
		return Number.isFinite(time) ? Math.floor(time / 1000) : null;
	}
	return null;
}

export function normalizeModel(raw, { paidOnly = new Set(), pricing = null, freeQuota = 10_000 } = {}) {
	if (!raw?.id || !String(raw.id).startsWith('@cf/')) return null;
	const id = String(raw.id);
	const props = propsOf(raw);
	const declaredTask = resolveDeclaredTask(raw, props);
	const task = declaredTask === 'unknown'
		? inferTask(raw, props)
		: declaredTask;
	const description = String(raw.description || '');
	const modalities = parseModalities(raw, task);
	const capabilities = inferCapabilities(raw, props, modalities, task, description);
	const short = shortModelId(id);

	const contextWindow = firstNumber(
		raw.context_length,
		raw.context_window,
		props.context_window,
		raw.limits?.context_window,
		raw.top_provider?.context_length,
	);

	const maxOutput = firstNumber(
		raw.max_output_tokens,
		props.max_output_tokens,
		raw.limits?.max_output_tokens,
		raw.top_provider?.max_completion_tokens,
	);

	const price = pricing || pricingFromOpenRouter(raw);
	const requiresPaid = paidOnly.has(id)
		|| truthy(props.requires_paid)
		|| truthy(raw.requires_paid)
		|| truthy(raw.requires_workers_paid);

	const outputRate = Number(price?.tokens?.output_neurons_per_million);
	const inputRate = Number(price?.tokens?.input_neurons_per_million);
	const dailyTokens = outputRate > 0
		? Math.floor((freeQuota / outputRate) * 1_000_000)
		: inputRate > 0
			? Math.floor((freeQuota / inputRate) * 1_000_000)
			: null;

	const created = createdTimestamp(raw);
	const deprecated = truthy(raw.deprecated) || truthy(props.deprecated);

	return {
		id,
		name: String(raw.name || short.replace(/-/g, ' ')),
		author: String(raw.author?.name || raw.author || raw.source_name || id.split('/')[0].replace('@cf', '')),
		task,
		description,
		context_window: contextWindow,
		max_output_tokens: maxOutput,
		modalities,
		capabilities,
		pricing: price || { items: [], tokens: {}, display: '—', source: null },
		requires_paid: Boolean(requiresPaid),
		deprecated: Boolean(deprecated),
		// Deprecated models remain callable during Cloudflare's 3-month grace
		// period, so they stay in the catalog (clearly flagged) instead of
		// silently disappearing from a free user's options.
		free: !requiresPaid,
		free_daily_output_tokens: dailyTokens,
		created_at: created ? new Date(created * 1000).toISOString() : (raw.created_at || null),
		created_unix: created,
		docs_url: `https://developers.cloudflare.com/workers-ai/models/${short}/`,
		openai_compatible: task === 'text-generation' || task === 'text-embeddings',
		endpoints: [endpointForTask(task), '/v1/run'].filter((value, index, all) => all.indexOf(value) === index),
		aliases: [id, short],
	};
}

/** Normalize the default (non-OpenRouter) /ai/models/search response. */
export function normalizeApiModel(raw, options) {
	return normalizeModel(raw, options);
}

export function normalizeOpenRouterModel(raw, options) {
	return normalizeModel(raw, options);
}

export function buildAliasIndex(models, customAliases = {}) {
	const index = new Map();
	for (const model of models) {
		for (const alias of [model.id, shortModelId(model.id)]) {
			index.set(alias.toLowerCase(), model);
		}
	}
	for (const [alias, target] of Object.entries(customAliases || {})) {
		const model = index.get(String(target).toLowerCase()) || models.find((item) => item.id === target);
		if (model) index.set(String(alias).toLowerCase(), model);
	}
	return index;
}
