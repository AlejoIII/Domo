import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const png = readFileSync(join(root, 'src/assets/brand/domo-mark.png'));
const b64 = png.toString('base64');
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
  <image width="512" height="512" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,${b64}"/>
</svg>`;

for (const out of [
  join(root, 'public/brand/domo-mark.svg'),
  join('C:/Users/Alejandro/Projects/erp-saas-frontend/public/brand/domo-mark.svg'),
]) {
  try {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, svg);
    console.log('OK', out);
  } catch (e) {
    console.warn('Skip', out, e.message);
  }
}
