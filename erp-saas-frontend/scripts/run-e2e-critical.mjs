import { spawnSync } from 'node:child_process';

process.env.E2E_FULL_STACK = '1';
process.env.CI = process.env.CI ?? '';

const result = spawnSync(
  'npx',
  ['playwright', 'test', 'e2e/critical-flow.spec.ts'],
  { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' },
);

process.exit(result.status ?? 1);
