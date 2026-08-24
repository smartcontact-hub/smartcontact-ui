import { expect, test } from '@playwright/test';

/**
 * Smoke de fundaciones: la demo levanta y el puente --p-* → --sc-* RENDERIZA
 * la métrica del Kit al pixel (computed styles, no sólo CSS estático).
 * Valores esperados = export del Kit (verificados también por tokens:parity).
 */

test('la demo levanta y renderiza las fundaciones', async ({ page }) => {
  await page.goto('/#/fundamentos/escala-color');
  await expect(page.getByRole('heading', { name: 'Escala y color' })).toBeVisible();
  // La escala resuelve: la barra de --sc-scale-1 mide 14px de ancho.
  const bar = page.locator('tr', { hasText: '--sc-scale-1' }).first().locator('.scale-bar');
  await expect(bar).toBeVisible();
  const width = await bar.evaluate((el) => getComputedStyle(el).width);
  expect(width).toBe('14px');
});

test('el preset pinta el botón con la métrica del Kit (10.5/7, radio 6)', async ({ page }) => {
  await page.goto('/#/fundamentos/tema');
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
  await page.goto('/#/fundamentos/tema');
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
  await page.goto('/#/fundamentos/escala-color');
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.getByRole('button', { name: 'Claro / oscuro' }).click();
  const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(after).not.toBe(before);
});

/**
 * Agrupar Fundamentos movió tres rutas planas bajo `/fundamentos/*`. Los redirects son la
 * promesa de que no muere ningún enlace ya repartido (docs, marcadores, previews por rama);
 * sin este test la promesa es sólo un comentario en `app.routes.ts`.
 */
test('las rutas planas de antes de agrupar siguen llevando a su sitio', async ({ page }) => {
  const compat: ReadonlyArray<readonly [string, string]> = [
    ['/#/foundations', '#/fundamentos/escala-color'],
    ['/#/foundations-type', '#/fundamentos/tipografia'],
    ['/#/theme', '#/fundamentos/tema'],
  ];
  for (const [viejo, destino] of compat) {
    await page.goto(viejo);
    await expect(page, `${viejo} debería redirigir a ${destino}`).toHaveURL(
      new RegExp(`${destino}$`),
    );
  }
});

/**
 * La barra superior baja a CUATRO secciones a propósito (Fundamentos · Componentes · Uso real
 * · Reglas): siete destinos planos sin jerarquía era el motivo de agrupar. Este assert existe
 * para que un quinto entre por decisión —tocando el número— y no por goteo.
 */
test('el top-nav se queda en cuatro secciones', async ({ page }) => {
  await page.goto('/#/fundamentos/escala-color');
  const nav = page.getByRole('navigation', { name: 'Secciones' });
  await expect(nav.getByRole('link')).toHaveCount(4);
});
