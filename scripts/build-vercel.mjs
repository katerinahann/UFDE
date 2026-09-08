import { spawnSync } from 'node:child_process';
import { cp, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// The Vite preset serves static files. Export the existing Next.js application
// rather than publishing .next server intermediates as a static website.
const root = fileURLToPath(new URL('../', import.meta.url));
const origin = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
const result = spawnSync('pnpm', ['--filter', '@ufde/web', 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, UFDE_STATIC_EXPORT: 'true', ...(origin ? { NEXT_PUBLIC_SITE_URL: origin } : {}) },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const exported = path.join(root, 'apps/web/out');
await access(path.join(exported, 'index.html'));
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await cp(exported, output, { recursive: true });
console.log('Vercel static website ready in dist/');
