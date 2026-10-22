import { env, runInDurableObject } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	dailyLimit,
	estimateChatNeurons,
	estimateEmbeddingNeurons,
	estimateNeuronsForTask,
	exhaustQuota,
	quotaStatus,
	reconcileQuota,
	reserveQuota,
	settleQuota,
} from '../src/quota.js';
import { makeModel, PRICING } from './fixtures.js';
import { utcDay } from '../src/utils.js';

const DAY = '2026-03-01';
const ACCOUNT_ID = 'acc_quota';
const LIMIT = 10_000;

async function clearQuota() {
	const stub = env.QUOTA.get(env.QUOTA.idFromName(`${ACCOUNT_ID}:${DAY}`));
	await runInDurableObject(stub, async (_instance, state) => {
		await state.storage.deleteAll();
	});
}

beforeEach(async () => {
	await clearQuota();
});

describe('QuotaGuard Durable Object', () => {
	it('reserves neurons atomically and reports the remaining allowance', async () => {
		const first = await reserveQuota(env, ACCOUNT_ID, 1_500, LIMIT, DAY);
		expect(first).toMatchObject({ ok: true, used: 0, reserved: 1_500, remaining: 8_500, limit: LIMIT });

		const second = await reserveQuota(env, ACCOUNT_ID, 2_500, LIMIT, DAY);
		expect(second).toMatchObject({ ok: true, reserved: 4_000, remaining: 6_000 });

		const status = await quotaStatus(env, ACCOUNT_ID, LIMIT, DAY);
		expect(status).toMatchObject({ ok: true, used: 0, reserved: 4_000, remaining: 6_000 });
	});

	it('refuses a reservation that would exceed the daily limit', async () => {
		await reserveQuota(env, ACCOUNT_ID, 9_000, LIMIT, DAY);
		const denied = await reserveQuota(env, ACCOUNT_ID, 1_001, LIMIT, DAY);
		expect(denied.ok).toBe(false);
		expect(denied.remaining).toBe(1_000);
		expect(denied.used).toBe(0);

		const exactly = await reserveQuota(env, ACCOUNT_ID, 1_000, LIMIT, DAY);
		expect(exactly.ok).toBe(true);
		expect(exactly.remaining).toBe(0);

		const exhausted = await reserveQuota(env, ACCOUNT_ID, 1, LIMIT, DAY);
		expect(exhausted.ok).toBe(false);
	});

	it('settles a reservation into real usage and releases the difference', async () => {
		await reserveQuota(env, ACCOUNT_ID, 5_000, LIMIT, DAY);
		const settled = await settleQuota(env, ACCOUNT_ID, 5_000, 120, LIMIT, DAY);
		expect(settled).toMatchObject({ ok: true, used: 120, remaining: 9_880 });

		const status = await quotaStatus(env, ACCOUNT_ID, LIMIT, DAY);
		expect(status.used).toBe(120);
		expect(status.reserved).toBe(0);
	});

	it('never lets the reservation amount go negative after settlement', async () => {
		await reserveQuota(env, ACCOUNT_ID, 100, LIMIT, DAY);
		await settleQuota(env, ACCOUNT_ID, 500, 50, LIMIT, DAY);
		const status = await quotaStatus(env, ACCOUNT_ID, LIMIT, DAY);
		expect(status.reserved).toBe(0);
		expect(status.used).toBe(50);
	});

	it('reconciles with the authoritative cloud usage without lowering local usage', async () => {
		await settleQuota(env, ACCOUNT_ID, 0, 300, LIMIT, DAY);

		const raised = await reconcileQuota(env, ACCOUNT_ID, 4_200, LIMIT, DAY);
		expect(raised.used).toBe(4_200);
		expect(raised.remaining).toBe(5_800);

		const lowered = await reconcileQuota(env, ACCOUNT_ID, 100, LIMIT, DAY);
		expect(lowered.used).toBe(4_200);
	});

	it('exhausts the account after Cloudflare reports error 3036', async () => {
		const result = await exhaustQuota(env, ACCOUNT_ID, LIMIT, DAY);
		expect(result).toMatchObject({ ok: true, used: LIMIT, remaining: 0 });

		const denied = await reserveQuota(env, ACCOUNT_ID, 1, LIMIT, DAY);
		expect(denied.ok).toBe(false);
		expect(denied.remaining).toBe(0);
	});

	it('keeps separate counters per UTC day and per account', async () => {
		await reserveQuota(env, ACCOUNT_ID, 1_000, LIMIT, DAY);
		const nextDay = await quotaStatus(env, ACCOUNT_ID, LIMIT, '2026-03-02');
		expect(nextDay.used).toBe(0);
		expect(nextDay.remaining).toBe(LIMIT);

		const otherAccount = await quotaStatus(env, 'acc_other', LIMIT, DAY);
		expect(otherAccount.used).toBe(0);
	});

	it('rejects an invalid day instead of writing a bogus record', async () => {
		const stub = env.QUOTA.get(env.QUOTA.idFromName(`${ACCOUNT_ID}:bad-day`));
		const response = await stub.fetch('https://quota.internal/reserve', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ day: 'not-a-day', amount: 1, limit: LIMIT }),
		});
		expect(response.status).toBe(400);
		expect((await response.json()).ok).toBe(false);
	});
});

describe('KV fallback backend', () => {
	const kvEnv = () => ({ KV: env.KV });

	it('implements the same reserve/settle/status semantics without a Durable Object', async () => {
		const reserve = await reserveQuota(kvEnv(), 'acc_kv', 2_000, LIMIT, DAY);
		expect(reserve).toMatchObject({ ok: true, reserved: 2_000, remaining: 8_000 });

		const status = await quotaStatus(kvEnv(), 'acc_kv', LIMIT, DAY);
		expect(status.reserved).toBe(2_000);

		await settleQuota(kvEnv(), 'acc_kv', 2_000, 250, LIMIT, DAY);
		const after = await quotaStatus(kvEnv(), 'acc_kv', LIMIT, DAY);
		expect(after.used).toBe(250);
		expect(after.reserved).toBe(0);
	});

	it('refuses over-limit reservations', async () => {
		await reserveQuota(kvEnv(), 'acc_kv_limit', LIMIT, LIMIT, DAY);
		const denied = await reserveQuota(kvEnv(), 'acc_kv_limit', 1, LIMIT, DAY);
		expect(denied.ok).toBe(false);
	});
});

describe('quota estimates', () => {
	const model = makeModel({ id: '@cf/test/chat' }, PRICING);

	it('honours max_tokens and floors at one neuron', () => {
		expect(estimateChatNeurons(model, { messages: [], max_tokens: 1 }, {})).toBe(1);
		expect(estimateChatNeurons(model, { messages: [{ role: 'user', content: 'hi' }], max_tokens: 10_000 }, {}))
			.toBeGreaterThan(estimateChatNeurons(model, { messages: [], max_tokens: 100 }, {}));
	});

	it('uses the configured default output budget when max_tokens is absent', () => {
		const small = estimateChatNeurons(model, { messages: [] }, { defaultMaxOutputTokens: 100 });
		const large = estimateChatNeurons(model, { messages: [] }, { defaultMaxOutputTokens: 5_000 });
		expect(large).toBeGreaterThan(small);
	});

	it('estimates embeddings from the input length', () => {
		const short = estimateEmbeddingNeurons(model, { input: 'hi' });
		const long = estimateEmbeddingNeurons(model, { input: 'x'.repeat(100_000) });
		expect(long).toBeGreaterThan(short);
	});

	it('reserves generic native tasks from input size with a conservative floor', () => {
		const expensive = makeModel({ id: '@cf/test/expensive' }, {
			items: [],
			tokens: { input_neurons_per_million: 100_000, output_neurons_per_million: 300_000 },
			display: 'test',
			source: 'test',
		});
		expect(estimateNeuronsForTask(expensive, 'generic', { text: 'hi' }, {})).toBe(1_000);
		expect(estimateNeuronsForTask(expensive, 'generic', { text: 'x'.repeat(100_000) }, {}))
			.toBeGreaterThan(1_000);
	});

	it('derives the hard limit from settings, then env, then 10,000', () => {
		expect(dailyLimit({ dailyNeurons: 4_000 }, { FREE_DAILY_NEURONS: '10000' })).toBe(4_000);
		expect(dailyLimit({}, { FREE_DAILY_NEURONS: '7500' })).toBe(7_500);
		expect(dailyLimit({}, {})).toBe(10_000);
		expect(dailyLimit({ dailyNeurons: -5 }, {})).toBe(0);
	});

	it('uses the current UTC day by default', () => {
		expect(utcDay(new Date('2026-03-01T23:59:59Z'))).toBe('2026-03-01');
		expect(utcDay(new Date('2026-03-02T00:00:00Z'))).toBe('2026-03-02');
	});
});
