#!/usr/bin/env node
/**
 * Ejecuta Prisma CLI asegurando DATABASE_DIRECT_URL.
 * Si no está definida, reutiliza DATABASE_URL (caso sin PgBouncer).
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

if (!process.env.DATABASE_DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DATABASE_DIRECT_URL = process.env.DATABASE_URL;
  console.warn(
    '[prisma] DATABASE_DIRECT_URL no definida — usando DATABASE_URL (sin pooler).',
  );
}

if (!process.env.DATABASE_URL) {
  console.error(
    'Falta DATABASE_URL. Copia .env.example a .env y ajusta la conexión PostgreSQL.',
  );
  process.exit(1);
}

if (!process.env.DATABASE_DIRECT_URL) {
  console.error(
    'Falta DATABASE_DIRECT_URL. En desarrollo suele ser la misma que DATABASE_URL.',
  );
  process.exit(1);
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Uso: node scripts/run-prisma.js <args prisma…>');
  process.exit(1);
}

const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, '..'),
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
