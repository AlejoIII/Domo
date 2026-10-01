import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const markB64 = readFileSync(join(root, 'src/assets/brand/domo-mark.png')).toString('base64');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 208 48" fill="none" role="img" aria-label="Domo">
  <image x="0" y="2" width="44" height="44" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,${markB64}"/>
  <text x="52" y="32" fill="#0B5E47" font-family="Segoe UI, system-ui, sans-serif" font-size="24" font-weight="700" letter-spacing="3.5">DOMO</text>
</svg>`;

const out = join(root, 'public/brand/domo-logo-horizontal.svg');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log('OK', out);
