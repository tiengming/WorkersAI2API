export const PRICING_URL = 'https://developers.cloudflare.com/workers-ai/platform/pricing/index.md';

const MODEL_ID_RE = /@cf\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+/;

function parseKind(text) {
	const value = text.toLowerCase();
	if (value.includes('cached input token')) return 'cached_input_token';
	if (value.includes('input token')) return 'input_token';
	if (value.includes('output token')) return 'output_token';
	if (value.includes('audio minute')) return 'audio_minute';
	if (value.includes('character')) return 'character';
	if (value.includes('step')) {
		if (value.includes('input')) return 'input_image_tile_step';
		if (value.includes('output')) return 'output_image_tile_step';
		return 'step';
	}
	if (value.includes('tile')) return 'image_tile';
	if (value.includes('image')) return 'image';
	if (value.includes('megapixel') || value.includes('mp')) return 'image_megapixel';
	return 'unknown';
}

function parseSegments(cell) {
	return String(cell)
		.split(/<br\s*\/?>/i)
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => {
			const numberMatch = part.match(/([\d.]+)/);
			if (!numberMatch) return null;
			const value = Number(numberMatch[1]);
			if (!Number.isFinite(value)) return null;
			const descriptor = part.replace(/^\$?\s*[\d.]+\s*/, '').trim();
			const isNeurons = /neuron/i.test(descriptor);
			return {
				value,
				descriptor,
				kind: parseKind(descriptor),
				isNeurons,
				raw: part,
			};
		})
		.filter(Boolean);
}

function displayFor(items) {
	const labels = {
		input_token: 'input',
		output_token: 'output',
		cached_input_token: 'cached input',
		audio_minute: 'audio minute',
		character: '1k chars',
		step: 'step',
		image_tile: 'tile',
		image: 'image',
		image_megapixel: 'MP',
		input_image_tile_step: 'input tile/step',
		output_image_tile_step: 'output tile/step',
	};
	return items.map((item) => `$${item.usd} / ${labels[item.kind] || item.kind}`).join(' · ');
}

/**
 * Parse the Cloudflare Workers AI pricing page (markdown form).
 * Cloudflare changes this table regularly; the parser is intentionally
 * tolerant and falls back to the raw units it cannot classify.
 */
export function parsePricingMarkdown(markdown) {
	const models = {};
	const text = String(markdown || '');

	for (const line of text.split(/\r?\n/)) {
		if (!line.trim().startsWith('|')) continue;
		const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
		if (cells.length < 2) continue;

		const modelId = cells[0].match(MODEL_ID_RE)?.[0];
		if (!modelId) continue;
		if (/websocket/i.test(cells[0]) && !models[modelId]) {
			// Keep both the standard and WebSocket rows; the standard one is added first.
		}

		const usdSegments = parseSegments(cells[1]).filter((item) => !item.isNeurons);
		const neuronSegments = parseSegments(cells[2] || '').filter((item) => item.isNeurons);

		const items = [];
		const length = Math.max(usdSegments.length, neuronSegments.length);
		for (let i = 0; i < length; i += 1) {
			const usd = usdSegments[i];
			const neurons = neuronSegments[i];
			if (!usd && !neurons) continue;
			const kind = usd?.kind !== 'unknown' ? usd.kind : neurons?.kind;
			items.push({
				kind: kind || 'unknown',
				usd: usd?.value ?? null,
				neurons: neurons?.value ?? null,
				unit: usd?.descriptor || neurons?.descriptor || '',
			});
		}

		if (items.length === 0) continue;

		// A second row for the same model (e.g. the WebSocket variant) is kept
		// as a separate entry when it has different units.
		if (models[modelId] && /websocket/i.test(cells[0])) {
			models[`${modelId}#websocket`] = { items, display: displayFor(items), source: PRICING_URL };
			continue;
		}
		if (models[modelId]) continue;

		const tokens = {};
		const byKind = Object.fromEntries(items.map((item) => [item.kind, item]));
		const usdToNeurons = (usd) => Math.ceil(usd * (1_000_000 / 11)); // $0.011 / 1k neurons
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
			source: PRICING_URL,
		};
	}

	const paidMatch = text.match(/Some models require a paid billing method[\s\S]*?This applies to([\s\S]*?)\.\s*You can access/i);
	const paidOnly = paidMatch
		? [...paidMatch[1].matchAll(/`(@cf\/[^`]+)`/g)].map((match) => match[1].trim())
		: [];

	const freeMatch = text.match(/([\d,]+)\s+Neurons per day/i);
	const freeDailyNeurons = freeMatch ? Number(freeMatch[1].replace(/,/g, '')) : null;

	const updatedMatch = text.match(/Last updated\s+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/i);

	return {
		models,
		paidOnly,
		freeDailyNeurons,
		updatedAt: updatedMatch?.[1] || null,
		source: PRICING_URL,
	};
}

export function priceForModel(pricing, modelId) {
	if (!pricing?.models) return null;
	return pricing.models[modelId] || null;
}
