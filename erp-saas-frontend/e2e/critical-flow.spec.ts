import { expect, test, type Page } from '@playwright/test';

test.describe('Critical business flow @critical', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
  });

  async function loginAsDemo(page: Page) {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  }

  test('login → create order → invoice → register payment', async ({ page }) => {
    await loginAsDemo(page);

    await page.goto('/orders/new');
    await expect(page.getByRole('heading', { name: 'Nuevo pedido' })).toBeVisible();

    const clientSelect = page.getByLabel('Cliente');
    await expect.poll(async () => clientSelect.locator('option').count()).toBeGreaterThan(1);
    await clientSelect.selectOption({ label: 'Acme Corp' });
    await page.getByLabel('Estado').selectOption({ label: 'Confirmado' });

    const productSelect = page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: 'Manual / sin producto' }) });
    await expect.poll(async () => productSelect.locator('option').count()).toBeGreaterThan(1);
    await productSelect.selectOption({ index: 1 });

    const createOrderResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/orders')
        && response.request().method() === 'POST'
        && response.ok(),
    );
    await page.getByRole('button', { name: 'Crear pedido' }).click();
    const orderResponse = await createOrderResponse;
    const orderPayload = (await orderResponse.json()) as { data?: { id?: string } };
    const orderId = orderPayload.data?.id;
    expect(orderId).toBeTruthy();

    await expect(page).toHaveURL(/\/orders$/);
    await page.goto(`/orders/${orderId}`);
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));

    await page.getByRole('button', { name: 'Convertir a factura' }).click();
    await expect(page).toHaveURL(/\/invoices\/[0-9a-f-]+$/i);

    await expect(page.getByRole('heading', { name: 'Cobros' })).toBeVisible();
    await expect(page.getByText('Sin cobros registrados')).toBeVisible();

    const pendingCard = page.locator('div.rounded-lg.border').filter({ hasText: 'Pendiente' });
    const pendingText = await pendingCard.locator('.font-semibold').textContent();
    expect(pendingText?.trim()).not.toBe('');

    const pendingAmount = parseMoney(pendingText!);
    expect(pendingAmount).toBeGreaterThan(0);

    const paymentAmount = Math.max(1, Math.round(pendingAmount / 2 * 100) / 100);
    await page.getByLabel('Importe').fill(String(paymentAmount));
    await page.getByRole('button', { name: 'Registrar cobro' }).click();

    await expect(page.getByText('Sin cobros registrados')).not.toBeVisible();
    await expect(page.locator('ul li').filter({ hasText: /€/ }).first()).toBeVisible();

    const paidCard = page.locator('div.rounded-lg.border').filter({ hasText: 'Cobrado' });
    const paidText = await paidCard.locator('.font-semibold').textContent();
    expect(parseMoney(paidText!)).toBeGreaterThan(0);
  });
});

function parseMoney(value: string): number {
  const normalized = value
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:[,.]|$))/g, '')
    .replace(',', '.');
  return Number.parseFloat(normalized);
}
