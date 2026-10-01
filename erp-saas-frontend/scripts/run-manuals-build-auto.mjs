/**
 * Arranca API + frontend si hace falta, captura pantallas y genera PDFs.
 */
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDevServers, shutdownOwned } from './ensure-dev-servers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, '..');
const backendRoot = join(frontendRoot, '..', 'erp-saas-backend');

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, shell: true, stdio: 'inherit', env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function main() {
  let started = false;
  try {
    const result = await ensureDevServers();
    started = result.started;
    if (started) {
      console.log('\nServidores arrancados para capturas. Puede tardar 1–2 min la primera vez.\n');
    }
    run('node', ['scripts/capture-manual-screenshots.mjs'], frontendRoot);
    run('npm', ['run', 'manuals:generate'], backendRoot);
  } finally {
    if (started) {
      console.log('\nDeteniendo servidores iniciados por manuals:build:auto…');
      shutdownOwned();
    }
  }
}

process.on('SIGINT', () => {
  shutdownOwned();
  process.exit(130);
});

main().catch((err) => {
  console.error(err);
  shutdownOwned();
  process.exit(1);
});
