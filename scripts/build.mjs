/**
 * Build the single-file Pages bundle (/_worker.js) from src/index.js.
 * Workers deployments do not need this file: wrangler bundles src/index.js.
 */
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));

const result = await build({
	entryPoints: [join(ROOT, 'src', 'index.js')],
	bundle: true,
	format: 'esm',
	platform: 'neutral',
	target: ['es2022'],
	outfile: join(ROOT, '_worker.js'),
	legalComments: 'none',
	banner: {
		js: `/*! Workers AI2API v${pkg.version} — independent project, MIT */`,
	},
});

if (result.errors?.length) {
	console.error(result.errors);
	process.exitCode = 1;
} else {
	const stats = await readFile(join(ROOT, '_worker.js'));
	console.log(`Built _worker.js (${(stats.byteLength / 1024).toFixed(1)} KiB)`);
}
