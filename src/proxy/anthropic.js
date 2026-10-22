import { inferenceHeaders, runInference } from './inference.js';
import { RequestError, estimateTokens, json } from '../utils.js';
import { actualChatNeurons } from '../quota.js';

function blockText(content) {
	if (typeof content === 'string') return content;
	if (!Array.isArray(content)) return '';
	return content.filter((block) => block.type === 'text').map((block) => block.text || '').join('');
}

export function anthropicToOpenAI(body) {
	const messages = [];

	if (body.system) {
		messages.push({ role: 'system', content: blockText(body.system) });
	}

	for (const message of body.messages || []) {
		const role = message.role;
		const content = message.content;

		if (role === 'assistant') {
			let text = '';
			const toolCalls = [];
			for (const block of Array.isArray(content) ? content : [{ type: 'text', text: content }]) {
				if (block.type === 'text') text += block.text || '';
				else if (block.type === 'tool_use') {
					toolCalls.push({
						id: block.id,
						type: 'function',
						function: { name: block.name, arguments: JSON.stringify(block.input || {}) },
					});
				}
			}
			const assistant = { role: 'assistant', content: text || null };
			if (toolCalls.length) assistant.tool_calls = toolCalls;
			messages.push(assistant);
			continue;
		}

		if (role === 'user') {
			const parts = [];
			for (const block of Array.isArray(content) ? content : [{ type: 'text', text: content }]) {
				if (block.type === 'tool_result') {
					messages.push({
						role: 'tool',
						tool_call_id: block.tool_use_id,
						content: blockText(block.content),
					});
				} else if (block.type === 'text') {
					parts.push({ type: 'text', text: block.text || '' });
				} else if (block.type === 'image') {
					const source = block.source || {};
					const url = source.type === 'url' && source.url
						? source.url
						: source.data ? `data:${source.media_type || 'image/png'};base64,${source.data}` : null;
					if (url) parts.push({ type: 'image_url', image_url: { url } });
				}
			}
			if (parts.length) messages.push({ role: 'user', content: parts });
			continue;
		}

		const text = blockText(content);
		if (text) messages.push({ role, content: text });
	}

	if (messages.length && messages[0].role === 'assistant') {
		messages.unshift({ role: 'user', content: '_' });
	}

	const openai = {
		messages,
		max_tokens: body.max_tokens,
		stream: body.stream === true,
	};
	if (body.temperature !== undefined) openai.temperature = body.temperature;
	if (body.top_p !== undefined) openai.top_p = body.top_p;
	if (body.stop_sequences !== undefined) openai.stop = body.stop_sequences;
	if (body.metadata?.user_id) openai.user = body.metadata.user_id;

	if (Array.isArray(body.tools) && body.tools.length) {
		openai.tools = body.tools.map((tool) => ({
			type: 'function',
			function: {
				name: tool.name,
				description: tool.description || '',
				parameters: tool.input_schema || { type: 'object', properties: {} },
			},
		}));
	}
	if (body.tool_choice) {
		if (body.tool_choice.type === 'auto') openai.tool_choice = 'auto';
		else if (body.tool_choice.type === 'any') openai.tool_choice = 'required';
		else if (body.tool_choice.type === 'tool' && body.tool_choice.name) {
			openai.tool_choice = { type: 'function', function: { name: body.tool_choice.name } };
		}
	}
	return openai;
}

function stopReason(finishReason) {
	if (finishReason === 'tool_calls') return 'tool_use';
	if (finishReason === 'length') return 'max_tokens';
	if (finishReason === 'content_filter') return 'end_turn';
	return 'end_turn';
}

export function openAIToAnthropic(data, model) {
	const choice = data.choices?.[0] || {};
	const message = choice.message || {};
	const content = [];

	if (message.content) content.push({ type: 'text', text: message.content });
	for (const call of message.tool_calls || []) {
		let input = {};
		try {
			input = typeof call.function?.arguments === 'string' ? JSON.parse(call.function.arguments) : (call.function?.arguments || {});
		} catch {
			input = {};
		}
		content.push({ type: 'tool_use', id: call.id, name: call.function?.name, input });
	}
	if (content.length === 0) content.push({ type: 'text', text: '' });

	return {
		id: `msg_${crypto.randomUUID()}`,
		type: 'message',
		role: 'assistant',
		content,
		model,
		stop_reason: stopReason(choice.finish_reason),
		stop_sequence: null,
		usage: {
			input_tokens: data.usage?.prompt_tokens || 0,
			output_tokens: data.usage?.completion_tokens || 0,
		},
	};
}

export async function handleAnthropicMessages(request, env, ctx, model) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw new AnthropicError('Invalid JSON body.', 400, 'invalid_request_error');
	}
	if (!Array.isArray(body.messages)) {
		throw new AnthropicError('messages field is required and must be an array.', 400, 'invalid_request_error');
	}
	if (!body.max_tokens) {
		throw new AnthropicError('max_tokens is required.', 400, 'invalid_request_error');
	}
	const requestedModel = body.model || model.id;
	const stream = body.stream === true;

	const openaiBody = anthropicToOpenAI({ ...body, messages: body.messages });
	openaiBody.model = model.id;
	if (stream) openaiBody.stream_options = { include_usage: true };

	const result = await runInference(request, env, ctx, {
		model,
		task: 'chat',
		body: openaiBody,
		stream,
	});

	const headers = inferenceHeaders(result, {
		'Content-Type': stream ? 'text/event-stream; charset=utf-8' : 'application/json; charset=utf-8',
		'Cache-Control': stream ? 'no-cache, no-transform' : 'no-store',
		'anthropic-version': request.headers.get('anthropic-version') || '2023-06-01',
	});

	if (stream) {
		return new Response(anthropicStream(result, requestedModel), { headers });
	}

	const data = await result.response.json();
	const usage = data.usage || null;
	const actual = actualChatNeurons(model, usage) ?? result.estimate;
	const settlement = await result.settle(Math.max(1, actual), usage);
	headers.set('x-quota-remaining', String(settlement?.remaining ?? 0));
	return json(openAIToAnthropic(data, requestedModel), { headers });
}

export function handleAnthropicCountTokens(request, env, ctx, model) {
	return request.json().then((body) => {
		const text = JSON.stringify(body.messages || '') + JSON.stringify(body.system || '') + JSON.stringify(body.tools || '');
		return json({ input_tokens: estimateTokens(text) });
	}).catch(() => {
		throw new AnthropicError('Invalid JSON body.', 400, 'invalid_request_error');
	});
}

export class AnthropicError extends Error {
	constructor(message, status = 400, type = 'invalid_request_error') {
		super(message);
		this.status = status;
		this.type = type;
	}

	toResponse() {
		return json({ type: 'error', error: { type: this.type, message: this.message } }, { status: this.status });
	}
}

/**
 * OpenAI SSE -> Anthropic Messages SSE.
 * Also settles the quota reservation when the stream ends.
 */
function anthropicStream(result, model) {
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();
	let buffer = '';
	let started = false;
	let finished = false;
	let blockIndex = -1;
	let openBlock = null; // 'text' | 'tool'
	let toolBlockIndex = -1;
	let inputTokens = 0;
	let outputTokens = 0;
	let text = '';
	let toolArgs = '';
	let finishReason = null;

	const emit = (controller, event, data) => {
		controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
	};

	const start = (controller) => {
		if (started) return;
		started = true;
		emit(controller, 'message_start', {
			type: 'message_start',
			message: {
				id: `msg_${crypto.randomUUID()}`,
				type: 'message',
				role: 'assistant',
				content: [],
				model,
				stop_reason: null,
				stop_sequence: null,
				usage: { input_tokens: inputTokens, output_tokens: outputTokens },
			},
		});
	};

	const closeBlock = (controller) => {
		if (openBlock == null) return;
		emit(controller, 'content_block_stop', { type: 'content_block_stop', index: blockIndex });
		openBlock = null;
	};

	const finish = async (controller) => {
		if (finished) return;
		finished = true;
		start(controller);
		closeBlock(controller);
		emit(controller, 'message_delta', {
			type: 'message_delta',
			delta: { stop_reason: stopReason(finishReason), stop_sequence: null },
			usage: { output_tokens: outputTokens },
		});
		emit(controller, 'message_stop', { type: 'message_stop' });
		const usage = { prompt_tokens: inputTokens, completion_tokens: outputTokens };
		const actual = actualChatNeurons(result.model, usage) ?? result.estimate;
		await result.settle(Math.max(1, actual), usage);
	};

	const transform = new TransformStream({
		transform(chunk, controller) {
			buffer += decoder.decode(chunk, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed.startsWith('data:')) continue;
				const payload = trimmed.slice(5).trim();
				if (payload === '[DONE]') continue;
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
							openBlock = 'tool';
							toolArgs = '';
							emit(controller, 'content_block_start', {
								type: 'content_block_start',
								index: blockIndex,
								content_block: {
									type: 'tool_use',
									id: call.id || `tool_${crypto.randomUUID()}`,
									name: call.function?.name || '',
									input: {},
								},
							});
						}
						const args = call.function?.arguments;
						if (args) {
							toolArgs += args;
							emit(controller, 'content_block_delta', {
								type: 'content_block_delta',
								index: blockIndex,
								delta: { type: 'input_json_delta', partial_json: args },
							});
						}
					}
				} else if (typeof delta.content === 'string' && delta.content.length) {
					if (openBlock !== 'text') {
						closeBlock(controller);
						blockIndex += 1;
						openBlock = 'text';
						emit(controller, 'content_block_start', {
							type: 'content_block_start',
							index: blockIndex,
							content_block: { type: 'text', text: '' },
						});
					}
					text += delta.content;
					emit(controller, 'content_block_delta', {
						type: 'content_block_delta',
						index: blockIndex,
						delta: { type: 'text_delta', text: delta.content },
					});
				}

				if (choice.finish_reason) finishReason = choice.finish_reason;
			}
		},
		async flush(controller) {
			await finish(controller);
		},
	});

	return result.response.body.pipeThrough(transform);
}
