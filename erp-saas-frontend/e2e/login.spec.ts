import { expect, test } from '@playwright/test';

test.describe('Auth', () => {
  test('shows login form and validates empty submit', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
    await page.getByRole('button', { name: /entrar|iniciar/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});
