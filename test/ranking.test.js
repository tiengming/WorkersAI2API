import { describe, expect, it } from 'vitest';
import { modelSizes, performanceScore, rankModels, tierFor } from '../src/catalog/ranking.js';

function model(id, overrides = {}) {
	return {
		id,
		name: id.split('/').pop(),
		capabilities: {
			reasoning: false,
			function_calling: true,
			vision: false,
			structured_output: false,
			streaming: true,
		},
		context_window: 32_000,
		pricing: { tokens: { output_usd_per_million: 1 } },
		...overrides,
	};
}

describe('modelSizes', () => {
	it('reads dense parameter counts', () => {
		expect(modelSizes(model('@cf/meta/llama-3.3-70b-instruct-fp8-fast')).total).toBe(70);
	});

	it('reads MoE total and active parameters', () => {
		expect(modelSizes(model('@cf/nvidia/nemotron-3-120b-a12b'))).toEqual({ total: 120, active: 12 });
	});

	it('reads parameters from the description', () => {
		expect(modelSizes(model('@cf/deepseek-ai/deepseek-v4.1-flash-1017', {
			description: 'A multimodal mixture-of-experts model with 552B backbone parameters.',
		})).total).toBe(552);
	});
});

describe('performanceScore', () => {
	it('ranks a frontier reasoning model above an old small model', () => {
		const big = model('@cf/openai/gpt-oss-120b', {
			context_window: 128_000,
			capabilities: { reasoning: true, function_calling: true, vision: false, streaming: true },
			pricing: { tokens: { output_usd_per_million: 0.75 } },
		});
		const small = model('@cf/meta/llama-3.2-1b-instruct', {
			context_window: 8_000,
			capabilities: { reasoning: false, function_calling: false, vision: false, streaming: true },
			pricing: { tokens: { output_usd_per_million: 0.201 } },
		});
		expect(performanceScore(big).score).toBeGreaterThan(performanceScore(small).score);
	});

	it('applies operator benchmark overrides', () => {
		const value = model('@cf/x/y');
		const base = performanceScore(value).score;
		const overridden = performanceScore(value, { '@cf/x/y': 100 }).score;
		expect(overridden).toBeGreaterThan(base);
		expect(overridden).toBeLessThanOrEqual(100);
	});

	it('assigns tiers monotonically', () => {
		expect(tierFor(85)).toBe('S');
		expect(tierFor(70)).toBe('A');
		expect(tierFor(55)).toBe('B');
		expect(tierFor(40)).toBe('C');
		expect(tierFor(10)).toBe('D');
	});

	it('sorts and numbers ranks', () => {
		const ranked = rankModels([
			model('@cf/meta/llama-3.2-1b-instruct'),
			model('@cf/openai/gpt-oss-120b', { context_window: 128_000 }),
		]);
		expect(ranked[0].id).toBe('@cf/openai/gpt-oss-120b');
		expect(ranked[0].performance.rank).toBe(1);
		expect(ranked[1].performance.rank).toBe(2);
	});
});
