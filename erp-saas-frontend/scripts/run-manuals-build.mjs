/**
 * Capturas + PDFs. Requiere frontend y API ya en marcha (comprueba antes de Playwright).
 */
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { printManualDevHint } from './ensure-dev-servers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, '..');
const backendRoot = join(frontendRoot, '..', 'erp-saas-backend');

const baseURL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const apiHealth =
  process.env.MANUALS_API_HEALTH_URL ?? 'http://localhost:3000/api/v1/health';

async function ping(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, shell: true, stdio: 'inherit', env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function main() {
  const feOk = await ping(`${baseURL}/`);
  const apiOk = await ping(apiHealth);
  if (!feOk || !apiOk) {
    if (!feOk) console.error(`Frontend no disponible: ${baseURL}`);
    if (!apiOk) console.error(`API no disponible: ${apiHealth}`);
    printManualDevHint();
    process.exit(1);
  }

  console.log('Frontend y API detectados. Capturando pantallas…\n');
  run('node', ['scripts/capture-manual-screenshots.mjs'], frontendRoot);
  run('npm', ['run', 'manuals:generate'], backendRoot);
}

main();
