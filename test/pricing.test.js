import { describe, expect, it } from 'vitest';
import { parsePricingMarkdown, priceForModel } from '../src/catalog/pricing.js';

const SAMPLE = `# Pricing

Our free allocation allows anyone to use a total of **10,000 Neurons per day**. Last updated Oct 20, 2026.

Note

Some models require a paid billing method. This applies to \`@cf/moonshotai/kimi-k2.6\`, \`@cf/zai-org/glm-5.3\`, and \`@cf/deepseek-ai/deepseek-v4-pro-0813\`. You can access these models with either the Workers Paid plan or prepaid AI Gateway credits.

## LLM model pricing

| Model | Price in Tokens | Price in Neurons |
| --- | --- | --- |
| @cf/test/chat-small | $0.06 per M input tokens <br> $0.4 per M output tokens | 5500 neurons per M input tokens <br> 36400 neurons per M output tokens |
| @cf/test/chat-cached | $0.3 per M input tokens <br> $0.006 per M cached input tokens <br> $1.2 per M output tokens | 27273 neurons per M input tokens <br> 545 neurons per M cached input tokens <br> 109091 neurons per M output tokens |

## Embeddings model pricing

| Model | Price in Tokens | Price in Neurons |
| --- | --- | --- |
| @cf/test/embed | $0.012 per M input tokens | 1075 neurons per M input tokens |

## Image model pricing

| Model | Price in Tokens | Price in Neurons |
| --- | --- | --- |
| @cf/test/image | $0.0000528 per 512x512 tile <br> $0.0001056 per step | 4.80 neurons per 512x512 tile <br> 9.60 neurons per step |

## Audio model pricing

| Model | Price in Tokens | Price in Neurons |
| --- | --- | --- |
| @cf/test/tts | $0.015 per 1k characters input | 1363.64 neurons per 1k characters input |
| @cf/test/asr | $0.0005 per audio minute | 41.14 neurons per audio minute |
`;

describe('parsePricingMarkdown', () => {
	const parsed = parsePricingMarkdown(SAMPLE);

	it('reads the free daily allocation', () => {
		expect(parsed.freeDailyNeurons).toBe(10_000);
	});

	it('extracts paid-only model ids', () => {
		expect(parsed.paidOnly).toEqual([
			'@cf/moonshotai/kimi-k2.6',
			'@cf/zai-org/glm-5.3',
			'@cf/deepseek-ai/deepseek-v4-pro-0813',
		]);
	});

	it('normalizes token prices and neurons', () => {
		const price = priceForModel(parsed, '@cf/test/chat-small');
		expect(price.tokens).toMatchObject({
			input_usd_per_million: 0.06,
			output_usd_per_million: 0.4,
			input_neurons_per_million: 5500,
			output_neurons_per_million: 36400,
		});
	});

	it('handles cached input pricing', () => {
		const price = priceForModel(parsed, '@cf/test/chat-cached');
		expect(price.tokens.cached_input_usd_per_million).toBe(0.006);
		expect(price.tokens.cached_input_neurons_per_million).toBe(545);
	});

	it('keeps non-token units', () => {
		const image = priceForModel(parsed, '@cf/test/image');
		expect(image.items.map((item) => item.kind)).toEqual(['image_tile', 'step']);
		expect(image.items[0].neurons).toBe(4.8);

		const tts = priceForModel(parsed, '@cf/test/tts');
		expect(tts.items[0].kind).toBe('character');

		const asr = priceForModel(parsed, '@cf/test/asr');
		expect(asr.items[0].kind).toBe('audio_minute');
	});

	it('derives neurons from USD when the neuron column is absent', () => {
		const parsed = parsePricingMarkdown('| @cf/x/y | $0.011 per M input tokens | |');
		expect(parsed.models['@cf/x/y'].tokens.input_neurons_per_million).toBe(1000);
	});
});

describe('parsePricingMarkdown robustness', () => {
	it('returns empty structures for garbage input', () => {
		const parsed = parsePricingMarkdown('not a pricing page');
		expect(parsed.models).toEqual({});
		expect(parsed.paidOnly).toEqual([]);
		expect(parsed.freeDailyNeurons).toBeNull();
	});

	it('handles the real pricing page shape', async () => {
		// No network in unit tests: just assert the parser accepts <br/> variants.
		const parsed = parsePricingMarkdown('| @cf/a/b | $1 per M input tokens<br/>$2 per M output tokens | 90909 neurons per M input tokens<br/>181818 neurons per M output tokens |');
		expect(parsed.models['@cf/a/b'].tokens.output_neurons_per_million).toBe(181818);
	});
});
