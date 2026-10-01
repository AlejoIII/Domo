/**
 * Captura PNGs reales de la app en dev para la landing.
 * Uso: npm run dev (y API en :3000) → npm run screenshots:marketing
 */
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'marketing');
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const loginEmail = process.env.MARKETING_SCREENSHOT_EMAIL ?? 'admin@demo.com';
const loginPassword = process.env.MARKETING_SCREENSHOT_PASSWORD ?? 'admin123';

const COOKIE_CONSENT = JSON.stringify({
  essential: true,
  analytics: false,
  updatedAt: new Date().toISOString(),
});

async function dismissCookieBanner(page) {
  const essentials = page.getByRole('button', { name: /solo esenciales/i });
  if (await essentials.isVisible().catch(() => false)) {
    await essentials.click();
    await page.waitForTimeout(300);
  }
}

async function capture() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  // Landing (sin sesión)
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
      colorScheme: 'light',
    });
    const page = await context.newPage();
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: join(outDir, 'landing-hero-full.png'),
      fullPage: false,
    });
    await context.close();
  }

  // Dashboard — recorte nítido para el hero (2x)
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 820 },
      deviceScaleFactor: 2,
      colorScheme: 'light',
    });
    await context.addInitScript((consent) => {
      localStorage.setItem('domo-cookie-consent', consent);
    }, COOKIE_CONSENT);

    const page = await context.newPage();
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('usuario@empresa.com').fill(loginEmail);
    await page.getByPlaceholder('Mínimo 6 caracteres').fill(loginPassword);
    await page.getByRole('button', { name: /entrar|iniciar sesión/i }).click();
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 });
    if (page.url().includes('/onboarding')) {
      await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' });
    }
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15_000 });
    await dismissCookieBanner(page);

    const shell = page.locator('div.flex.min-h-screen.bg-background.text-foreground').first();
    await shell.waitFor({ state: 'visible' });
    const box = await shell.boundingBox();
    if (box) {
      const clipHeight = Math.min(box.height, 720);
      await page.screenshot({
        path: join(outDir, 'dashboard-hero.png'),
        clip: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: clipHeight,
        },
      });
    }

    await shell.screenshot({ path: join(outDir, 'dashboard-full.png') });
    const main = page.locator('main').first();
    if (await main.count()) {
      await main.screenshot({ path: join(outDir, 'dashboard-main.png') });
    }
    await context.close();
  }

  await browser.close();
  console.log(`Screenshots guardados en ${outDir}`);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
