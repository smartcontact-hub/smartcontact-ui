import { expect, test } from '@playwright/test';

const HOME = '/#/private/cuscare/tickets?lang=es';
const TRIGGER = 'Filtrar por Tipo de solicitud';

test('abrir sin elegir, cerrar y volver mantiene el estado neutral', async ({ page }) => {
  await page.goto(HOME);
  const trigger = page.getByRole('button', { name: TRIGGER, exact: true });
  await expect(trigger).toHaveText('—');
  await expect(trigger).toHaveAttribute('aria-description', 'Sin filtro aplicado');
  const original = await page.locator('.tickets__count').innerText();
  await trigger.click();
  await page.getByRole('heading', { name: 'Tickets', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await trigger.click();
  await page.getByRole('button', { name: 'IA', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Buscar tipo' }).fill('inexistente-xyz');
  await expect(page.getByRole('status').filter({ hasText: 'Ningún tipo coincide' })).toBeVisible();
  await expect(page.locator('.tickets__count')).toHaveText(original);
  await page.getByRole('heading', { name: 'Tickets', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await trigger.click();
  await expect(page.getByRole('button', { name: 'IA', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('searchbox', { name: 'Buscar tipo' })).toHaveValue('');
  await expect(page.getByRole('option', { name: 'Baja', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Eliminar filtros', exact: true })).toHaveCount(0);
});

test('selección inmediata persiste al cerrar, se revierte al desmarcar y reinicia al salir de Tickets', async ({ page }) => {
  await page.goto(HOME);
  const trigger = page.getByRole('button', { name: TRIGGER, exact: true });
  await trigger.click();
  await page.getByRole('button', { name: 'Agente', exact: true }).click();
  await page.getByRole('option', { name: 'Baja', exact: true }).click();
  await expect(trigger).toHaveText('1 tipo');
  await expect(page.locator('.tickets__count')).toContainText('filtrado de 3280');
  await page.getByRole('heading', { name: 'Tickets', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await trigger.click();
  await expect(page.getByRole('option', { name: 'Baja', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('option', { name: 'Baja', exact: true }).click();
  await expect(trigger).toHaveText('—');
  await expect(page.locator('.tickets__count')).toHaveText('1–10 de 3280 resultados');
  await page.getByRole('searchbox', { name: 'Buscar tipo' }).press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await trigger.click();
  await expect(page.getByRole('button', { name: 'Agente', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Agente', exact: true }).click();
  await page.getByRole('option', { name: 'Baja', exact: true }).click();
  await page.getByRole('heading', { name: 'Tickets', exact: true }).click();
  await page.getByRole('link', { name: 'Panel de control', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Carga de trabajo', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Tickets', exact: true }).click();
  await expect(trigger).toHaveText('—');
  await expect(page.locator('.tickets__count')).toHaveText('1–10 de 3280 resultados');
});

test('sin resultados conserva el filtro y ofrece una recuperación visible', async ({ page }) => {
  await page.goto(HOME);
  await page.getByRole('textbox', { name: 'Filtrar por Source', exact: true }).fill('sin-ticket-xyz');
  const empty = page.locator('.tickets__empty');
  await expect(empty).toContainText('Ningún ticket coincide con estos filtros');
  await expect(page.locator('.tickets__count')).toContainText('0–0');
  await empty.getByRole('button', { name: 'Eliminar filtros', exact: true }).click();
  await expect(empty).toHaveCount(0);
  await expect(page.locator('.tickets__count')).toHaveText('1–10 de 3280 resultados');
});

for (const width of [1024, 1280, 1440, 1920]) {
  test(`tabla acotada, prioridades y scroll por teclado a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(HOME);
    const region = page.getByRole('region', { name: 'Tabla de tickets', exact: true });
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#tickets-scroll-hint')).toContainText('Desplázate horizontalmente');
    const metrics = await page.evaluate(() => {
      const viewport = document.querySelector('.p-datatable-table-container')!;
      const headers = [...document.querySelectorAll('thead tr:first-child th')];
      const request = headers.find(e => e.textContent?.trim() === 'Tipo de solicitud')!;
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        tableWidth: document.querySelector('.cc-table table')!.getBoundingClientRect().width,
        requestWidth: request.getBoundingClientRect().width,
        requestRight: request.getBoundingClientRect().right,
        viewportRight: viewport.getBoundingClientRect().right,
        headers: headers.map(e => e.textContent?.trim()),
      };
    });
    expect(metrics.documentWidth).toBeLessThanOrEqual(width);
    expect(metrics.requestWidth).toBeGreaterThanOrEqual(260);
    expect(metrics.requestWidth).toBeLessThanOrEqual(320);
    expect(metrics.tableWidth).toBeLessThanOrEqual(3168);
    expect(metrics.headers.slice(1, 4)).toEqual(['ID', 'Estado', 'Tipo de solicitud']);
    expect(metrics.requestRight).toBeLessThanOrEqual(metrics.viewportRight);
    await region.press('ArrowRight');
    await expect.poll(() => region.evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
  });
}


test('preparar orígenes sin tipos no cambia la página de resultados', async ({ page }) => {
  await page.goto(HOME);
  await page.getByRole('button', { name: 'Página 2', exact: true }).click();
  await expect(page.locator('.tickets__count')).toContainText('11–20');
  await page.getByRole('button', { name: TRIGGER, exact: true }).click();
  await page.getByRole('button', { name: 'IA', exact: true }).click();
  await page.getByRole('heading', { name: 'Tickets', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.tickets__count')).toContainText('11–20');
});

test('ocultar columnas elimina overflow y restaurarlas recupera la indicación', async ({ page }) => {
  await page.goto(HOME);
  await page.getByRole('button', { name: 'Gestionar columnas', exact: true }).click();
  const manager = page.getByRole('dialog', { name: 'Manage columns', exact: true });
  const checks = manager.getByRole('checkbox');
  await expect(checks).toHaveCount(19);
  for (const check of await checks.all()) {
    const label = await check.getAttribute('aria-label');
    if (!['Show column ID', 'Show column Status', 'Show column Request type'].includes(label ?? '')) await check.uncheck();
  }
  const region = page.getByRole('region', { name: 'Tabla de tickets', exact: true });
  await expect(region).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#tickets-scroll-hint')).toHaveText('');
  expect(await region.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
  await manager.getByRole('button').click();
  await expect(region).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#tickets-scroll-hint')).not.toHaveText('');
});
