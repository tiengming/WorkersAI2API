/**
 * Regenerate src/data/catalog-snapshot.js from Cloudflare's public docs.
 *
 * The snapshot is only a fallback/enrichment source. At runtime the Worker
 * always prefers the live /ai/models/search API plus the live pricing page.
 *
 * Usage:
 *   node scripts/sync-catalog.mjs
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parsePricingMarkdown, PRICING_URL } from '../src/catalog/pricing.js';
import { normalizeModel } from '../src/catalog/normalize.js';
import { rankModels } from '../src/catalog/ranking.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELS_INDEX = 'https://developers.cloudflare.com/workers-ai/models/index.md';

async function fetchText(url) {
	const response = await fetch(url, { headers: { 'User-Agent': 'WorkersAI2API-catalog-sync/2.0' } });
	if (!response.ok) throw new Error(`${url} -> ${response.status}`);
	return response.text();
}

function taskAndAuthor(markdown) {
	const lines = markdown.split(/\r?\n/);
	const index = lines.findIndex((line) => line.startsWith('# '));
	for (let i = index + 1; i < Math.min(lines.length, index + 12); i += 1) {
		const line = lines[i].trim();
		if (line.includes(' • ')) {
			const [task, ...author] = line.split(' • ');
			return { task: task.trim(), author: author.join(' • ').trim() };
		}
	}
	return { task: 'Text Generation', author: 'Cloudflare' };
}

function modelInfo(markdown, label) {
	const expression = new RegExp(`\\|\\s*${label}[^|]*\\|([^|]+)\\|`, 'i');
	const match = markdown.match(expression);
	return match ? match[1].replace(/\[[^\]]*\]\([^)]*\)/g, '').trim() : null;
}

function parseModelPage(markdown, pricing, paidOnly, freeQuota) {
	const id = markdown.match(/`(@cf\/[^`]+)`/)?.[1];
	if (!id) return null;

	const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	const description = frontmatter?.[1]?.match(/^description:\s*(.+)$/m)?.[1]?.trim() || '';
	const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || id.split('/').pop();
	const { task, author } = taskAndAuthor(markdown);

	const contextRaw = modelInfo(markdown, 'Context Window');
	const context = contextRaw ? Number(contextRaw.replace(/[^\d]/g, '')) : null;
	const functionCalling = /function calling[^|]*\|\s*Yes/i.test(markdown);
	const reasoning = /reasoning[^|]*\|\s*Yes/i.test(markdown);
	const requiresPaid = paidOnly.has(id) || /requires the Workers Paid plan/i.test(markdown);
	const deprecated = /\bdeprecated\b/i.test(markdown.slice(0, 2500));

	const raw = {
		id,
		name: title,
		author,
		task: { name: task },
		description,
		context_window: context,
		properties: {
			function_calling: functionCalling,
			reasoning,
			structured_output: /structured output|json mode/i.test(markdown),
			streaming: true,
		},
	};

	const model = normalizeModel(raw, {
		paidOnly,
		pricing: pricing.models[id],
		freeQuota,
	});
	if (!model) return null;
	model.requires_paid = requiresPaid;
	model.free = !requiresPaid && !deprecated;
	model.deprecated = deprecated;
	model.source = 'docs-snapshot';
	model.docs_url = `https://developers.cloudflare.com/workers-ai/models/${id.split('/').pop()}/`;
	return model;
}

async function mapLimit(items, limit, worker) {
	const results = new Array(items.length);
	let cursor = 0;
	async function run() {
		while (cursor < items.length) {
			const index = cursor;
			cursor += 1;
			results[index] = await worker(items[index], index);
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
	return results;
}

async function main() {
	console.log('Fetching pricing…');
	const pricingMarkdown = await fetchText(PRICING_URL);
	const pricing = parsePricingMarkdown(pricingMarkdown);
	const freeQuota = pricing.freeDailyNeurons || 10000;
	console.log(`  ${Object.keys(pricing.models).length} priced models, ${pricing.paidOnly.length} paid-only`);

	console.log('Fetching model index…');
	const index = await fetchText(MODELS_INDEX);
	const slugs = [...new Set(
		[...index.matchAll(/https:\/\/developers\.cloudflare\.com\/workers-ai\/models\/([A-Za-z0-9._-]+)\//g)]
			.map((match) => match[1]),
	)].filter((slug) => slug !== 'index');
	console.log(`  ${slugs.length} model pages`);

	const models = [];
	let done = 0;
	await mapLimit(slugs, 6, async (slug) => {
		const url = `https://developers.cloudflare.com/workers-ai/models/${slug}/index.md`;
		try {
			const markdown = await fetchText(url);
			const model = parseModelPage(markdown, pricing, new Set(pricing.paidOnly), freeQuota);
			if (model) models.push(model);
		} catch (error) {
			console.warn(`  ! ${slug}: ${error.message}`);
		}
		done += 1;
		if (done % 10 === 0) console.log(`  ${done}/${slugs.length}`);
	});

	const ranked = rankModels(models);
	const output = {
		generated_at: new Date().toISOString(),
		free_daily_neurons: freeQuota,
		pricing: {
			models: pricing.models,
			paidOnly: pricing.paidOnly,
			freeDailyNeurons: freeQuota,
			updatedAt: pricing.updatedAt,
			source: PRICING_URL,
		},
		models: ranked,
	};

	const target = join(ROOT, 'src', 'data', 'catalog-snapshot.js');
	await writeFile(target, `export default ${JSON.stringify(output, null, '\t')};\n`, 'utf8');
	console.log(`Wrote ${models.length} models to ${target}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
