/**
 * Heuristic performance ranking for Workers AI models.
 *
 * Cloudflare does not publish a single benchmark number per model, and new
 * models appear faster than third-party leaderboards are updated. The score
 * below is therefore an explicitly transparent estimate built from:
 *   - parameter count (dense or MoE active parameters)
 *   - declared capabilities (reasoning, tools, vision, structured output)
 *   - context window
 *   - release recency
 *   - output price tier (a useful proxy for model class on CF's catalog)
 *
 * Operators can override any score with `settings.benchmarks` (0-100), e.g.
 * from their own evaluations or an internal leaderboard.
 */

const SIZE_MIN = 7; // log10(10M)
const SIZE_MAX = 12.1; // log10(~1.25T)

export function shortModelId(id) {
	return String(id || '').split('/').pop();
}

function extractSizes(text) {
	if (!text) return { total: null, active: null };
	const value = String(text).toLowerCase();

	// 30b-a3b, 120b-a12b, 26b-a4b, or "552B backbone parameters"
	const moe = value.match(/(\d+(?:\.\d+)?)\s*b\s*[-_/ ]?a\s*(\d+(?:\.\d+)?)\s*b/);
	if (moe) return { total: Number(moe[1]), active: Number(moe[2]) };

	const backbone = value.match(/(\d+(?:\.\d+)?)\s*b\s*(?:backbone\s*)?param/);
	if (backbone) return { total: Number(backbone[1]), active: null };

	const all = [...value.matchAll(/(\d+(?:\.\d+)?)\s*b\b/g)]
		.map((match) => Number(match[1]))
		.filter((number) => number >= 0.3 && number <= 2_000);
	if (all.length) return { total: Math.max(...all), active: null };
	return { total: null, active: null };
}

export function modelSizes(model) {
	const fromId = extractSizes(`${model?.id || ''} ${model?.name || ''}`);
	const fromDescription = extractSizes(model?.description || '');
	return {
		total: fromId.total || fromDescription.total || null,
		active: fromId.active || fromDescription.active || null,
	};
}

function normalize(value, min, max) {
	return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function recencyScore(model) {
	const raw = model?.created_at || model?.created || model?.release_date;
	const time = typeof raw === 'number' ? raw * 1000 : Date.parse(raw || '');
	if (!Number.isFinite(time)) return 45;
	const months = (Date.now() - time) / (1000 * 60 * 60 * 24 * 30.44);
	return Math.max(0, Math.min(100, 100 - months * 2.2));
}

function priceScore(model) {
	const output = Number(model?.pricing?.tokens?.output_usd_per_million);
	if (!Number.isFinite(output) || output <= 0) return 45;
	// $0.05/M -> 0, $15/M -> 100 (log scale)
	return normalize(Math.log10(output), Math.log10(0.05), Math.log10(15));
}

export function performanceScore(model, overrides = {}) {
	const sizes = modelSizes(model);
	const effectiveParams = sizes.active || sizes.total;
	const size = effectiveParams
		? normalize(Math.log10(effectiveParams), SIZE_MIN, SIZE_MAX)
		: 40;

	const caps = model?.capabilities || {};
	let capability = 30;
	if (caps.reasoning) capability += 20;
	if (caps.function_calling) capability += 18;
	if (caps.vision) capability += 10;
	if (caps.structured_output) capability += 8;
	if (caps.audio_output || caps.audio_input) capability += 6;
	capability = Math.min(100, capability);

	const context = Number(model?.context_window) || 0;
	const contextScore = context > 0 ? normalize(Math.log10(context), Math.log10(4_000), Math.log10(1_000_000)) : 30;

	const recency = recencyScore(model);
	const price = priceScore(model);

	const override = overrides?.[model?.id] ?? overrides?.[shortModelId(model?.id)];
	const overrideScore = Number.isFinite(Number(override)) ? Number(override) : null;

	const weights = overrideScore == null
		? { size: 0.35, capability: 0.25, context: 0.15, recency: 0.15, price: 0.10 }
		: { size: 0.18, capability: 0.14, context: 0.08, recency: 0.08, price: 0.07, override: 0.45 };

	const score = (size * weights.size)
		+ (capability * weights.capability)
		+ (contextScore * weights.context)
		+ (recency * weights.recency)
		+ (price * weights.price)
		+ (overrideScore == null ? 0 : overrideScore * weights.override);

	return {
		score: Math.round(score * 10) / 10,
		tier: tierFor(score),
		basis: [
			effectiveParams ? `${effectiveParams}B ${sizes.active ? 'active' : 'parameters'}` : 'size unknown',
			`${context ? `${Math.round(context / 1000)}k context` : 'context unknown'}`,
			caps.reasoning ? 'reasoning' : null,
			caps.function_calling ? 'tools' : null,
			caps.vision ? 'vision' : null,
			overrideScore == null ? 'heuristic score' : 'operator benchmark',
		].filter(Boolean),
		components: {
			size: Math.round(size),
			capability: Math.round(capability),
			context: Math.round(contextScore),
			recency: Math.round(recency),
			price: Math.round(price),
			override: overrideScore,
		},
	};
}

export function tierFor(score) {
	if (score >= 80) return 'S';
	if (score >= 65) return 'A';
	if (score >= 50) return 'B';
	if (score >= 35) return 'C';
	return 'D';
}

export function rankModels(models, overrides = {}) {
	const ranked = models.map((model) => ({
		...model,
		performance: performanceScore(model, overrides),
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
