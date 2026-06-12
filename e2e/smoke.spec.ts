import { expect, test } from '@playwright/test';

/**
 * Smoke de fundaciones: la demo levanta y el puente --p-* → --sc-* RENDERIZA
 * la métrica del Kit al pixel (computed styles, no sólo CSS estático).
 * Valores esperados = export del Kit (verificados también por tokens:parity).
 */

test('la demo levanta y renderiza las fundaciones', async ({ page }) => {
  await page.goto('/#/foundations');
  await expect(page.getByRole('heading', { name: 'Fundaciones' })).toBeVisible();
  // La escala resuelve: la barra de --sc-scale-1 mide 14px de ancho.
  const bar = page.locator('tr', { hasText: '--sc-scale-1' }).first().locator('.scale-bar');
  await expect(bar).toBeVisible();
  const width = await bar.evaluate((el) => getComputedStyle(el).width);
  expect(width).toBe('14px');
});

test('el preset pinta el botón con la métrica del Kit (10.5/7, radio 6)', async ({ page }) => {
  await page.goto('/#/theme');
  const btn = page.getByTestId('btn-md').locator('button');
  await expect(btn).toBeVisible();
  const styles = await btn.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      paddingLeft: s.paddingLeft,
      paddingTop: s.paddingTop,
      borderRadius: s.borderRadius,
      fontSize: s.fontSize,
    };
  });
  expect(styles.paddingLeft).toBe('10.5px');
  expect(styles.paddingTop).toBe('7px');
  expect(styles.borderRadius).toBe('6px');
  expect(styles.fontSize).toBe('14px');
});

test('el form field hereda padding y radio del Kit', async ({ page }) => {
  await page.goto('/#/theme');
  const input = page.getByTestId('input-md');
  await expect(input).toBeVisible();
  const styles = await input.evaluate((el) => {
    const s = getComputedStyle(el);
    return { paddingLeft: s.paddingLeft, paddingTop: s.paddingTop, borderRadius: s.borderRadius };
  });
  expect(styles.paddingLeft).toBe('10.5px');
  expect(styles.paddingTop).toBe('7px');
  expect(styles.borderRadius).toBe('6px');
});

test('el modo oscuro flipa los tokens bajo .sc-dark', async ({ page }) => {
  await page.goto('/#/foundations');
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.getByRole('button', { name: 'Claro / oscuro' }).click();
  const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(after).not.toBe(before);
});
