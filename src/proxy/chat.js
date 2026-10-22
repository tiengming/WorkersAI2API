import { instrumentStream, inferenceHeaders, runInference, settleFromJson } from './inference.js';
import { json, RequestError } from '../utils.js';

const PASSTHROUGH_FIELDS = [
	'temperature',
	'top_p',
	'n',
	'stop',
	'max_tokens',
	'max_completion_tokens',
	'presence_penalty',
	'frequency_penalty',
	'logit_bias',
	'logprobs',
	'top_logprobs',
	'seed',
	'user',
	'tools',
	'tool_choice',
	'parallel_tool_calls',
	'response_format',
	'metadata',
	'modalities',
	'audio',
	'prediction',
	'reasoning_effort',
	'web_search_options',
	'store',
	'chat_template_kwargs',
	'options',
];

export async function handleChat(request, env, ctx, model, { legacyCompletions = false } = {}) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw new RequestError('Invalid JSON body', { status: 400 });
	}

	const requestedModel = String(body.model || model.id);
	const stream = body.stream === true;

	if (legacyCompletions) {
		if (stream) {
			throw new RequestError('Streaming is not supported on /v1/completions. Use /v1/chat/completions.', {
				status: 400,
				code: 'stream_not_supported',
			});
		}
		if (body.prompt == null) {
			throw new RequestError('prompt is required', { status: 400, code: 'missing_prompt' });
		}
		const prompt = Array.isArray(body.prompt) ? body.prompt.join('\n') : String(body.prompt);
		body.messages = [{ role: 'user', content: prompt }];
	}

	if (!Array.isArray(body.messages) || body.messages.length === 0) {
		throw new RequestError('messages must be a non-empty array', { status: 400, code: 'invalid_messages', param: 'messages' });
	}

	const upstreamBody = {
		model: model.id,
		messages: body.messages,
		stream,
	};

	for (const field of PASSTHROUGH_FIELDS) {
		if (body[field] !== undefined) upstreamBody[field] = body[field];
	}

	if (stream) {
		upstreamBody.stream_options = { include_usage: true, ...(body.stream_options || {}) };
	}

	const result = await runInference(request, env, ctx, {
		model,
		task: 'chat',
		body: upstreamBody,
		stream,
	});

	if (stream) {
		return instrumentStream(result, { requestedModel });
	}

	let data;
	try {
		data = await result.response.json();
	} catch {
		const text = await result.response.text().catch(() => '');
		await result.settle(result.estimate);
		throw new RequestError(`Cloudflare returned a non-JSON response: ${text.slice(0, 200)}`, { status: 502, code: 'upstream_invalid_response' });
	}

	const settlement = await settleFromJson(result, data);
	const headers = inferenceHeaders(result, { 'Content-Type': 'application/json; charset=utf-8' });
	headers.set('x-quota-remaining', String(settlement.status?.remaining ?? 0));

	if (legacyCompletions) {
		return json(toTextCompletion(data, requestedModel), { headers });
	}

	if (data.model !== undefined) data.model = requestedModel;
	if (data.usage && settlement.actual) data.usage.estimated_neurons = settlement.actual;
	return json(data, { headers });
}

function toTextCompletion(data, requestedModel) {
	const choices = (data.choices || []).map((choice, index) => ({
		text: choice.message?.content ?? choice.text ?? '',
		index: choice.index ?? index,
		logprobs: null,
		finish_reason: choice.finish_reason ?? 'stop',
	}));
	return {
		id: data.id || `cmpl_${Date.now()}`,
		object: 'text_completion',
		created: data.created || Math.floor(Date.now() / 1000),
		model: requestedModel,
		choices,
		usage: data.usage,
	};
}

export async function handleResponses(request, env, ctx, model) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw new RequestError('Invalid JSON body', { status: 400 });
	}
	if (body.stream === true) {
		throw new RequestError('The Responses API only supports stream: false on Workers AI.', { status: 400, code: 'stream_not_supported' });
	}
	if (!model.id.includes('gpt-oss')) {
		throw new RequestError('The /v1/responses endpoint is only available for @cf/openai/gpt-oss-20b and @cf/openai/gpt-oss-120b.', {
			status: 400,
			code: 'unsupported_model',
		});
	}

	const upstreamBody = { ...body, model: model.id, stream: false };
	const result = await runInference(request, env, ctx, {
		model,
		task: 'chat',
		body: upstreamBody,
		endpoint: 'responses',
	});

	const data = await result.response.json();
	const settlement = await settleFromJson(result, data);
	const headers = inferenceHeaders(result, { 'Content-Type': 'application/json; charset=utf-8' });
	headers.set('x-quota-remaining', String(settlement.status?.remaining ?? 0));
	if (data.model) data.model = body.model || model.id;
	return json(data, { headers });
}
