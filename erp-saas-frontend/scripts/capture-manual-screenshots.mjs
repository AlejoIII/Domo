/**
 * Captura pantallas para manuales PDF.
 * Requiere: frontend + API + login demo.
 * Salida: erp-saas-backend/docs/user-manuals/assets/
 */
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { printManualDevHint } from './ensure-dev-servers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, '..');
const assetsDir = join(frontendRoot, '..', 'erp-saas-backend', 'docs', 'user-manuals', 'assets');

const contentUrl = pathToFileURL(
  join(frontendRoot, '..', 'erp-saas-backend', 'docs', 'user-manuals', 'manuals.content.mjs'),
).href;

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const loginEmail = process.env.MARKETING_SCREENSHOT_EMAIL ?? 'admin@demo.com';
const loginPassword = process.env.MARKETING_SCREENSHOT_PASSWORD ?? 'admin123';

async function dismissOverlays(page) {
  const essentials = page.getByRole('button', { name: /solo esenciales/i });
  if (await essentials.isVisible().catch(() => false)) {
    await essentials.click();
    await page.waitForTimeout(200);
  }
  const closeDialog = page.getByRole('button', { name: /^cerrar$/i });
  if (await closeDialog.isVisible().catch(() => false)) {
    await closeDialog.click().catch(() => {});
  }
}

async function waitForAppShell(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => {});
  await dismissOverlays(page);
  const main = page.locator('main').first();
  await main.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
  await page.waitForFunction(
    () => {
      const spinners = document.querySelectorAll('[aria-busy="true"], [data-testid="page-loading"]');
      return spinners.length === 0;
    },
    { timeout: 15_000 },
  ).catch(() => {});
  await page.waitForTimeout(400);
}

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('usuario@empresa.com').fill(loginEmail);
  await page.getByPlaceholder('Mínimo 6 caracteres').fill(loginPassword);
  await page.getByRole('button', { name: /entrar|iniciar sesión/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 45_000 });
  if (page.url().includes('/onboarding')) {
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
  }
  await waitForAppShell(page);
}

async function main() {
  const { MANUAL_SCREENSHOT_ROUTES } = await import(contentUrl);
  await mkdir(assetsDir, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    if (String(err?.message ?? err).includes("Executable doesn't exist")) {
      console.error(
        '\nPlaywright no tiene Chromium instalado en esta máquina.\n' +
          'Ejecuta desde erp-saas-frontend:\n\n  npm run manuals:prepare\n\n' +
          'Luego vuelve a lanzar: npm run manuals:build\n',
      );
    }
    throw err;
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });
  await context.addInitScript(() => {
    localStorage.setItem(
      'domo-cookie-consent',
      JSON.stringify({ essential: true, analytics: false, updatedAt: new Date().toISOString() }),
    );
  });

  const page = await context.newPage();
  await login(page);

  for (const route of MANUAL_SCREENSHOT_ROUTES) {
    await page.goto(`${baseURL}${route.path}`, { waitUntil: 'domcontentloaded' });
    await waitForAppShell(page);
    if (page.url().includes('/login')) {
      console.warn(`SKIP ${route.file} — redirigió a login`);
      continue;
    }
    if (page.url().includes('/plan-limit')) {
      console.warn(`WARN ${route.file} — plan-limit (${route.path})`);
    }
    const out = join(assetsDir, route.file);
    const mainBox = await page.locator('main').first().boundingBox().catch(() => null);
    if (mainBox && mainBox.width > 200 && mainBox.height > 200) {
      await page.screenshot({
        path: out,
        clip: {
          x: Math.max(0, mainBox.x),
          y: Math.max(0, mainBox.y),
          width: Math.min(mainBox.width, 1440),
          height: Math.min(mainBox.height, 820),
        },
      });
    } else {
      await page.screenshot({ path: out, fullPage: false });
    }
    console.log(`OK ${route.file} ← ${route.path}`);
  }

  await browser.close();
  console.log(`Capturas en ${assetsDir}`);
}

main().catch((err) => {
  const msg = String(err?.message ?? err);
  if (msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('ECONNREFUSED')) {
    console.error('\nNo hay servidor web en', baseURL);
    printManualDevHint();
  } else {
    console.error(err);
  }
  process.exit(1);
});
