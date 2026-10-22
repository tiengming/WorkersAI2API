import { inferenceHeaders, runInference, settleFromJson } from './inference.js';
import { json, RequestError } from '../utils.js';

export async function handleEmbeddings(request, env, ctx, model) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw new RequestError('Invalid JSON body', { status: 400 });
	}
	if (body.input == null) {
		throw new RequestError('input is required', { status: 400, code: 'missing_input', param: 'input' });
	}
	if (model.task !== 'text-embeddings') {
		throw new RequestError(`Model "${model.id}" is not an embeddings model.`, { status: 400, code: 'model_task_mismatch' });
	}

	const upstreamBody = { model: model.id, input: body.input };
	if (body.encoding_format) upstreamBody.encoding_format = body.encoding_format;
	if (body.user) upstreamBody.user = body.user;

	const result = await runInference(request, env, ctx, {
		model,
		task: 'embeddings',
		body: upstreamBody,
	});

	const data = await result.response.json();
	const usage = data.usage || null;
	const actual = usage?.prompt_tokens
		? Math.ceil((usage.prompt_tokens / 1e6) * (model.pricing?.tokens?.input_neurons_per_million || 50_000))
		: result.estimate;
	const settlement = await result.settle(Math.max(1, actual), usage || { prompt_tokens: null, total_tokens: null });
	const headers = inferenceHeaders(result, { 'Content-Type': 'application/json; charset=utf-8' });
	headers.set('x-quota-remaining', String(settlement?.remaining ?? 0));

	if (data.model) data.model = body.model || model.id;
	return json(data, { headers });
}
