/**
 * Comprueba que Vite y la API respondan; opcionalmente los arranca.
 */
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, '..');
const backendRoot = join(frontendRoot, '..', 'erp-saas-backend');

const baseURL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const apiHealth =
  process.env.MANUALS_API_HEALTH_URL ?? 'http://localhost:3000/api/v1/health';

const waitMs = Number(process.env.MANUALS_DEV_WAIT_MS ?? 180_000);
const pollMs = 1500;

/** @type {import('node:child_process').ChildProcess[]} */
const owned = [];

function npmRun(cwd, script) {
  const child = spawn('npm', ['run', script], {
    cwd,
    shell: true,
    stdio: 'pipe',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  child.stdout?.on('data', (buf) => {
    const line = buf.toString();
    if (/error|Error|listening|Nest application|Local:/i.test(line)) {
      process.stderr.write(`[${script}] ${line}`);
    }
  });
  child.stderr?.on('data', (buf) => process.stderr.write(`[${script}] ${buf}`));
  return child;
}

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

async function waitFor(label, url, deadline) {
  process.stdout.write(`Esperando ${label} (${url})…\n`);
  while (Date.now() < deadline) {
    if (await ping(url)) {
      process.stdout.write(`OK ${label}\n`);
      return true;
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  return false;
}

export async function ensureDevServers() {
  const feOk = await ping(`${baseURL}/`);
  const apiOk = await ping(apiHealth);

  if (feOk && apiOk) {
    process.stdout.write('Frontend y API ya están en marcha.\n');
    return { started: false };
  }

  const deadline = Date.now() + waitMs;

  if (!apiOk) {
    process.stdout.write('Arrancando API (erp-saas-backend → npm run start:dev)…\n');
    owned.push(npmRun(backendRoot, 'start:dev'));
  }
  if (!feOk) {
    process.stdout.write('Arrancando frontend (npm run dev)…\n');
    owned.push(npmRun(frontendRoot, 'dev'));
  }

  if (!apiOk && !(await waitFor('API', apiHealth, deadline))) {
    shutdownOwned();
    throw new Error(
      `La API no respondió en ${apiHealth}.\n` +
        'Abre otra terminal, ejecuta en erp-saas-backend: npm run start:dev\n' +
        '(PostgreSQL/Redis/.env deben estar configurados).',
    );
  }
  if (!feOk && !(await waitFor('frontend', `${baseURL}/`, deadline))) {
    shutdownOwned();
    throw new Error(
      `El frontend no respondió en ${baseURL}.\n` +
        'Abre otra terminal, ejecuta en erp-saas-frontend: npm run dev',
    );
  }

  return { started: true };
}

export function shutdownOwned() {
  for (const p of owned) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(p.pid), '/f', '/t'], { shell: true, stdio: 'ignore' });
      } else {
        p.kill('SIGTERM');
      }
    } catch {
      /* ignore */
    }
  }
  owned.length = 0;
}

export function printManualDevHint() {
  console.error(`
No se pudo conectar a la app en ${baseURL}.

Opción A — dos terminales y luego manuals:build:
  Terminal 1: cd ..\\erp-saas-backend  && npm run start:dev
  Terminal 2: cd erp-saas-frontend      && npm run dev
  Terminal 3: npm run manuals:build

Opción B — arrancar todo automáticamente (más lento la primera vez):
  npm run manuals:build:auto
`);
}
