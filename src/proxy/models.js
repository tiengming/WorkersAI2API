import { findModel, getCatalog, publicModel } from '../catalog/index.js';
import { getSettings } from '../config.js';
import { RequestError } from '../utils.js';

export async function loadCatalog(env, ctx, { force = false } = {}) {
	return getCatalog(env, ctx, { force });
}

export function resolveModel(catalog, requested, settings, { task = null, freeOnly = true } = {}) {
	const model = findModel(catalog, requested, settings?.aliases || {});
	if (!model) {
		const needle = String(requested || '').toLowerCase();
		const suggestions = catalog.models
			.filter((item) => item.free && (!task || item.task === task))
			.filter((item) => !needle || item.id.toLowerCase().includes(needle.slice(0, 3)))
			.slice(0, 5)
			.map((item) => item.id);
		const error = new RequestError(
			`Model "${requested}" was not found in the live Workers AI catalog. Call GET /v1/models for the current list.`,
			{ status: 404, code: 'model_not_found', extra: { suggestions } },
		);
		throw error;
	}
	if (freeOnly && model.requires_paid) {
		throw new RequestError(
			`Model "${model.id}" requires a Workers Paid plan or AI Gateway prepaid credits and is not available in the free catalog.`,
			{ status: 403, code: 'model_requires_paid_plan' },
		);
	}
	if (task && model.task !== task) {
		throw new RequestError(
			`Model "${model.id}" is a ${model.task} model, not ${task}.`,
			{ status: 400, code: 'model_task_mismatch' },
		);
	}
	return model;
}

export async function catalogResponse(env, ctx, {
	includePaid = false,
	task = null,
	search = null,
	sort = 'performance',
	limit = null,
} = {}) {
	const catalog = await loadCatalog(env, ctx);
	let models = catalog.models.filter((model) => model.free || includePaid);
	if (task) models = models.filter((model) => model.task === task);
	if (search) {
		const needle = String(search).toLowerCase();
		models = models.filter((model) => model.id.toLowerCase().includes(needle)
			|| model.name.toLowerCase().includes(needle)
			|| model.description.toLowerCase().includes(needle));
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
		updated: (a, b) => (Date.parse(b.created_at || 0) || 0) - (Date.parse(a.created_at || 0) || 0),
	};
	models = [...models].sort(sorters[sort] || sorters.performance);
	if (limit) models = models.slice(0, limit);

	return {
		object: 'list',
		data: models.map(publicModel),
		meta: {
			...catalog.meta,
			returned: models.length,
			include_paid: includePaid,
			sort,
		},
	};
}

export { publicModel, getSettings };
