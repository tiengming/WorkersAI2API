import { inferenceHeaders, runInference } from './inference.js';
import { json, RequestError } from '../utils.js';

function parseSize(size, fallback = 1024) {
	const match = String(size || '').match(/(\d+)\s*[x×]\s*(\d+)/i);
	if (!match) return { width: fallback, height: fallback };
	return { width: Number(match[1]), height: Number(match[2]) };
}

export async function handleImages(request, env, ctx, model) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw new RequestError('Invalid JSON body', { status: 400 });
	}
	if (!body.prompt) {
		throw new RequestError('prompt is required', { status: 400, code: 'missing_prompt', param: 'prompt' });
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
			steps: Number(body.steps ?? body.num_steps ?? 4),
		};
		if (body.seed != null) upstreamBody.seed = Number(body.seed) + index;
		if (body.negative_prompt) upstreamBody.negative_prompt = body.negative_prompt;
		if (body.guidance != null) upstreamBody.guidance = Number(body.guidance);

		const result = await runInference(request, env, ctx, {
			model,
			task: 'image',
			body: upstreamBody,
		});
		const response = await result.response.json();
		const image = response?.result?.image || response?.image || response?.result?.images?.[0];
		if (!image) {
			await result.settle(result.estimate);
			throw new RequestError('Cloudflare returned no image data.', { status: 502, code: 'upstream_invalid_response' });
		}
		await result.settle(result.estimate);
		lastResult = result;
		data.push({
			b64_json: image,
			url: response?.result?.url || undefined,
			revised_prompt: body.prompt,
		});
	}

	const headers = inferenceHeaders(lastResult, { 'Content-Type': 'application/json; charset=utf-8' });
	return json({
		created: Math.floor(Date.now() / 1000),
		data,
		model: body.model || model.id,
	}, { headers });
}

/** Generic passthrough for models that do not have a dedicated OpenAI-shaped endpoint. */
export async function handleRun(request, env, ctx, model) {	let body;
	try {
		body = await request.json();
	} catch {
		throw new RequestError('Invalid JSON body', { status: 400 });
	}
	const inputs = body.inputs ?? body.input ?? body;

	const result = await runInference(request, env, ctx, {
		model,
		task: 'generic',
		body: inputs,
		endpoint: 'native',
	});

	const response = await result.response.json();
	await result.settle(result.estimate);
	const headers = inferenceHeaders(result, { 'Content-Type': 'application/json; charset=utf-8' });
	return json({
		model: body.model || model.id,
		task: model.task,
		result: response?.result ?? response,
		raw: response,
	}, { headers });
}

/** Jina/Cohere-style rerank endpoint backed by @cf/baai/bge-reranker-base. */
export async function handleRerank(request, env, ctx, model) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw new RequestError('Invalid JSON body', { status: 400 });
	}
	if (!body.query) throw new RequestError('query is required', { status: 400, code: 'missing_query' });
	if (!Array.isArray(body.documents) || body.documents.length === 0) {
		throw new RequestError('documents must be a non-empty array', { status: 400, code: 'missing_documents' });
	}
	const documents = body.documents.map((document) => (typeof document === 'string' ? document : (document.text || document.content || '')));
	const topN = Math.min(documents.length, Math.max(1, Number(body.top_n || body.top_k) || documents.length));

	const result = await runInference(request, env, ctx, {
		model,
		task: 'generic',
		body: { query: body.query, contexts: documents.map((text) => ({ text })), top_k: topN },
		endpoint: 'native',
	});

	const data = await result.response.json();
	await result.settle(result.estimate);
	const raw = data?.result?.response || data?.result || data?.response || [];
	const results = (Array.isArray(raw) ? raw : []).map((item) => {
		const index = Number(item.id ?? item.index);
		return {
			index: Number.isFinite(index) ? index : null,
			relevance_score: Number(item.score ?? item.relevance_score ?? 0),
			...(body.return_documents === false ? {} : { document: documents[index] ?? null }),
		};
	}).filter((item) => item.index != null).sort((a, b) => b.relevance_score - a.relevance_score).slice(0, topN);

	const headers = inferenceHeaders(result, { 'Content-Type': 'application/json; charset=utf-8' });
	return json({ id: `rerank_${Date.now()}`, model: body.model || model.id, results }, { headers });
}
