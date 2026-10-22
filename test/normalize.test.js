import { describe, expect, it } from 'vitest';
import { normalizeModel, normalizeTask, endpointForTask } from '../src/catalog/normalize.js';
import snapshot from '../src/data/catalog-snapshot.js';

const PRICING = {
	items: [
		{ kind: 'input_token', usd: 0.06, neurons: 5500, unit: 'per M input tokens' },
		{ kind: 'output_token', usd: 0.4, neurons: 36400, unit: 'per M output tokens' },
	],
	tokens: {
		input_usd_per_million: 0.06,
		output_usd_per_million: 0.4,
		input_neurons_per_million: 5500,
		output_neurons_per_million: 36400,
	},
	display: '$0.06 / input · $0.4 / output',
};

describe('normalizeModel', () => {
	it('normalizes the default models API shape', () => {
		const raw = {
			id: '@cf/zai-org/glm-4.7-flash',
			name: 'GLM 4.7 Flash',
			task: { name: 'Text Generation' },
			description: 'Fast multilingual model with reasoning.',
			properties: [
				{ property_id: 'function_calling', value: 'true' },
				{ property_id: 'reasoning', value: 'true' },
				{ property_id: 'context_window', value: '131072' },
			],
		};
		const result = normalizeModel(raw, { pricing: PRICING, freeQuota: 10_000 });
		expect(result.task).toBe('text-generation');
		expect(result.context_window).toBe(131072);
		expect(result.capabilities.function_calling).toBe(true);
		expect(result.capabilities.reasoning).toBe(true);
		expect(result.openai_compatible).toBe(true);
		expect(result.free).toBe(true);
		expect(result.pricing.tokens.output_neurons_per_million).toBe(36400);
		expect(result.free_daily_output_tokens).toBe(274_725);
		expect(result.aliases).toContain('glm-4.7-flash');
	});

	it('normalizes OpenRouter marketplace format', () => {
		const raw = {
			id: '@cf/test/vision',
			name: 'Vision',
			created: 1_760_000_000,
			context_length: 200_000,
			architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] },
			supported_parameters: ['tools', 'reasoning', 'structured_outputs'],
			pricing: { prompt: '0.0000001', completion: '0.0000004' },
		};
		const result = normalizeModel(raw);
		expect(result.capabilities.vision).toBe(true);
		expect(result.capabilities.function_calling).toBe(true);
		expect(result.capabilities.reasoning).toBe(true);
		expect(result.context_window).toBe(200_000);
		expect(result.pricing.tokens.input_usd_per_million).toBeCloseTo(0.1);
		expect(result.pricing.tokens.output_usd_per_million).toBeCloseTo(0.4);
		expect(result.created_at).toBe(new Date(1_760_000_000_000).toISOString());
	});

	it('excludes paid models from the free set', () => {
		const result = normalizeModel(
			{ id: '@cf/moonshotai/kimi-k2.6', task: { name: 'Text Generation' } },
			{ paidOnly: new Set(['@cf/moonshotai/kimi-k2.6']) },
		);
		expect(result.requires_paid).toBe(true);
		expect(result.free).toBe(false);
	});

	it('maps tasks to OpenAI-style endpoints', () => {
		expect(endpointForTask('text-generation')).toBe('/v1/chat/completions');
		expect(endpointForTask('text-embeddings')).toBe('/v1/embeddings');
		expect(endpointForTask('text-to-image')).toBe('/v1/images/generations');
		expect(endpointForTask('automatic-speech-recognition')).toBe('/v1/audio/transcriptions');
		expect(endpointForTask('translation')).toBe('/v1/run');
	});

	it('normalizes task aliases', () => {
		expect(normalizeTask({ name: 'Text Embeddings' })).toBe('text-embeddings');
		expect(normalizeTask('Automatic Speech Recognition')).toBe('automatic-speech-recognition');
	});

	it('infers tasks for OpenRouter-shaped rows that omit task', () => {
		const cases = [
			[{ id: '@cf/meta/llama-3.2-11b-vision-instruct', architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] } }, 'text-generation'],
			[{ id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', type: 'chat', architecture: { input_modalities: ['text'], output_modalities: ['text'] } }, 'text-generation'],
			[{ id: '@cf/moonshotai/kimi-k2.6', architecture: { input_modalities: ['text'], output_modalities: ['text'] } }, 'text-generation'],
			[{ id: '@cf/baai/bge-m3', architecture: { input_modalities: ['text'], output_modalities: ['text'] } }, 'text-embeddings'],
			[{ id: '@cf/deepgram/aura-2-en', architecture: { input_modalities: ['text'], output_modalities: ['audio'] } }, 'text-to-speech'],
			[{ id: '@cf/deepgram/flux', architecture: { input_modalities: ['audio'], output_modalities: ['text'] } }, 'automatic-speech-recognition'],
			[{ id: '@cf/black-forest-labs/flux-1-schnell', architecture: { input_modalities: ['text'], output_modalities: ['image'] } }, 'text-to-image'],
			[{ id: '@cf/llava-hf/llava-1.5-7b-hf', architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] } }, 'image-to-text'],
			[{ id: '@cf/baai/bge-reranker-base', architecture: { input_modalities: ['text'], output_modalities: ['text'] } }, 'text-classification'],
			[{ id: '@cf/meta/m2m100-1.2b', architecture: { input_modalities: ['text'], output_modalities: ['text'] } }, 'translation'],
			[{ id: '@cf/facebook/bart-large-cnn', architecture: { input_modalities: ['text'], output_modalities: ['text'] } }, 'summarization'],
			[{ id: '@cf/huggingface/distilbert-sst-2-int8', architecture: { input_modalities: ['text'], output_modalities: ['text'] } }, 'text-classification'],
			[{ id: '@cf/microsoft/resnet-50', architecture: { input_modalities: ['image'], output_modalities: ['text'] } }, 'image-classification'],
			[{ id: '@cf/pipecat-ai/smart-turn-v2', architecture: { input_modalities: ['audio'], output_modalities: ['text'] } }, 'dumb-pipe'],
		];
		for (const [raw, expected] of cases) {
			expect(normalizeModel(raw).task).toBe(expected);
		}
	});

	it('keeps deprecated free models callable but flagged', () => {
		const result = normalizeModel({ id: '@cf/meta/llama-3.1-8b-instruct', task: { name: 'Text Generation' }, deprecated: true });
		expect(result.deprecated).toBe(true);
		expect(result.free).toBe(true);
	});

	it('infers the correct task for every bundled model when task is missing', () => {
		for (const model of snapshot.models) {
			const result = normalizeModel({ ...model, task: undefined, task_name: undefined, type: undefined });
			expect({ id: model.id, task: result?.task }).toEqual({ id: model.id, task: model.task });
		}
	});

	it('rejects non-Workers-AI models', () => {
		expect(normalizeModel({ id: 'gpt-4o' })).toBeNull();
	});
});
