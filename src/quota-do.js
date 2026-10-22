/**
 * Durable Object that makes daily free-neuron accounting atomic.
 *
 * One instance per `accountId:UTC-day`. A reservation is taken before the
 * upstream request and settled afterwards with the real token usage. If the
 * worker crashes between the two calls, the reservation simply expires when
 * the UTC day rolls over, so we never exceed the upstream free allocation.
 */
export class QuotaGuard {
	constructor(state, env) {
		this.state = state;
		this.env = env;
	}

	async fetch(request) {
		const url = new URL(request.url);
		const body = await request.json().catch(() => ({}));
		const day = String(body.day || '');
		if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
			return Response.json({ ok: false, error: 'invalid day' }, { status: 400 });
		}

		const limit = Math.max(0, Number(body.limit) || 0);
		const key = `day:${day}`;

		return this.state.blockConcurrencyWhile(async () => {
			let record = await this.state.storage.get(key);
			if (!record) record = { used: 0, reserved: 0, updatedAt: Date.now() };

			const remaining = () => Math.max(0, limit - record.used - record.reserved);

			switch (url.pathname) {
				case '/reserve': {
					const amount = Math.max(0, Math.ceil(Number(body.amount) || 0));
					if (record.used + record.reserved + amount > limit) {
						return Response.json({
							ok: false,
							used: record.used,
							reserved: record.reserved,
							remaining: remaining(),
							limit,
						});
					}
					record.reserved += amount;
					record.updatedAt = Date.now();
					await this.state.storage.put(key, record);
					return Response.json({
						ok: true,
						reserved: record.reserved,
						used: record.used,
						remaining: remaining(),
						limit,
					});
				}

				case '/settle': {
					const reserved = Math.max(0, Math.ceil(Number(body.reserved) || 0));
					const actual = Math.max(0, Math.ceil(Number(body.actual) || 0));
					record.reserved = Math.max(0, record.reserved - reserved);
					record.used += actual;
					record.updatedAt = Date.now();
					await this.state.storage.put(key, record);
					return Response.json({
						ok: true,
						used: record.used,
						reserved: record.reserved,
						remaining: remaining(),
						limit,
					});
				}

				case '/reconcile': {
					const used = Math.max(0, Math.ceil(Number(body.used) || 0));
					record.used = Math.max(record.used, used);
					record.updatedAt = Date.now();
					await this.state.storage.put(key, record);
					return Response.json({ ok: true, used: record.used, reserved: record.reserved, remaining: remaining(), limit });
				}

				case '/exhaust': {
					record.used = limit;
					record.reserved = 0;
					record.updatedAt = Date.now();
					await this.state.storage.put(key, record);
					return Response.json({ ok: true, used: record.used, remaining: 0, limit });
				}

				case '/status': {
					return Response.json({
						ok: true,
						used: record.used,
						reserved: record.reserved,
						remaining: remaining(),
						limit,
					});
				}

				default:
					return Response.json({ ok: false, error: 'not found' }, { status: 404 });
			}
		});
	}
}
