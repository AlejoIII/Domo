#!/usr/bin/env node
/**
 * Ejecuta Prisma CLI asegurando DATABASE_URL / DATABASE_DIRECT_URL.
 * Si no hay .env, copia .env.example. Si falta DIRECT_URL, usa DATABASE_URL.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const raw of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
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

function ensureEnvFile() {
  if (fs.existsSync(envPath)) return;
  if (!fs.existsSync(examplePath)) {
    console.error('No existe .env ni .env.example en erp-saas-backend/.');
    process.exit(1);
  }
  fs.copyFileSync(examplePath, envPath);
  console.warn('[prisma] Creado .env desde .env.example. Revisa DATABASE_URL si hace falta.');
}

ensureEnvFile();
loadDotEnv(envPath);

if (!process.env.DATABASE_DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DATABASE_DIRECT_URL = process.env.DATABASE_URL;
  console.warn(
    '[prisma] DATABASE_DIRECT_URL no definida — usando DATABASE_URL (sin pooler).',
  );
}

if (!process.env.DATABASE_URL) {
  console.error(
    'Falta DATABASE_URL en .env. Ejemplo:\n' +
      '  DATABASE_URL=postgresql://erp:erp@localhost:5433/erp_saas?schema=public\n' +
      '  DATABASE_DIRECT_URL=postgresql://erp:erp@localhost:5433/erp_saas?schema=public',
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
  cwd: root,
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
