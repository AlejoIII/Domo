import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const backendRoot = process.env.E2E_BACKEND_PATH
  ? path.resolve(process.env.E2E_BACKEND_PATH)
  : path.resolve(frontendRoot, '../erp-saas-backend');

if (!existsSync(path.join(backendRoot, 'package.json'))) {
  console.error(
    `[e2e] Backend not found at ${backendRoot}. Set E2E_BACKEND_PATH to the backend repo.`,
  );
  process.exit(1);
}

const distMain = path.join(backendRoot, 'dist/main.js');
if (!existsSync(distMain)) {
  console.error(`[e2e] Missing ${distMain}. Run "npm run build" in the backend first.`);
  process.exit(1);
}

const env = {
  ...process.env,
  NODE_ENV: 'development',
  PORT: process.env.E2E_BACKEND_PORT ?? '3000',
  DATABASE_URL:
    process.env.DATABASE_URL
    ?? 'postgresql://erp:erp@localhost:5432/erp_saas_e2e?schema=public',
  JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-jwt-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'e2e-jwt-refresh-secret',
  EMAIL_VERIFICATION_ENABLED: 'false',
  EMAIL_PROVIDER: 'console',
  CORS_ORIGIN:
    process.env.CORS_ORIGIN ?? 'http://127.0.0.1:4173,http://localhost:4173',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://127.0.0.1:4173',
  STORAGE_DRIVER: 'local',
};

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function prepareDatabase() {
  console.log('[e2e] Applying migrations…');
  await run('npx', ['prisma', 'migrate', 'deploy'], backendRoot);
  console.log('[e2e] Seeding database…');
  await run('npm', ['run', 'db:seed'], backendRoot);
}

function startServer() {
  console.log('[e2e] Starting backend API…');
  const server = spawn('node', ['dist/main.js'], {
    cwd: backendRoot,
    env,
    stdio: 'inherit',
  });

  const shutdown = (signal) => {
    if (!server.killed) server.kill(signal);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  server.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}

await prepareDatabase();
startServer();
