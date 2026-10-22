import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: './wrangler.jsonc' },
			miniflare: {
				bindings: {
					ADMIN_PASSWORD: 'test-password',
					FREE_DAILY_NEURONS: '10000',
					MAX_DAILY_NEURONS: '10000',
				},
			},
		}),
	],
	test: {
		include: ['test/**/*.test.js'],
		testTimeout: 20_000,
	},
});
