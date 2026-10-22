import { describe, expect, it } from 'vitest';
import { normalizeModel, normalizeTask, endpointForTask } from '../src/catalog/normalize.js';

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

	it('rejects non-Workers-AI models', () => {
		expect(normalizeModel({ id: 'gpt-4o' })).toBeNull();
	});
});
