import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL SELECTOR DE COLUMNAS NATIVO Y LO QUE LA TABLA RECUERDA.
 *
 * Desde el 2026-09-24 el selector es el `p-multiselect` del ejemplo «Column Toggle» de primeng.dev/table
 * (`sc-multiselect` en `sc-list-page`), el orden se cambia arrastrando las cabeceras (`reorderableColumns`
 * nativo) y la lista guarda visibles, orden y anchos en `localStorage`. Se mide en Agentes.
 *
 * 1. Una columna que vuelves a mostrar vuelve a su sitio (el fallo de 2026-09-14: el selector anterior la
 *    mandaba al final).
 * 2. Nombre sale marcado y fijo: no se puede quitar.
 * 3. Arrastrar una cabecera la mueve, y al volver a la página sigue ahí.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const cabeceras = (page: Page) =>
  page.locator('sc-datatable thead th').evaluateAll((ths) =>
    ths.map((th) => (th.textContent ?? '').trim()).filter((t) => t.length > 0),
  );

const selector = (page: Page) => page.locator('.page__action-bar .p-multiselect');
const opcion = (page: Page, nombre: string) =>
  page.locator('.p-multiselect-overlay li[role="option"]').filter({ hasText: new RegExp(`^\\s*${nombre}\\s*$`) });

test('Agentes · ocultar «Canales» y volver a mostrarla la deja donde estaba', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  expect(antes.indexOf('Canales'), 'la prueba necesita «Canales» en medio de la tabla').toBeGreaterThan(0);
  expect(antes.indexOf('Canales'), 'si «Canales» ya es la última, no mide nada').toBeLessThan(antes.length - 1);

  await selector(page).click();
  await opcion(page, 'Canales').click();
  await expect.poll(() => cabeceras(page)).not.toContain('Canales');
  await expect(selector(page)).toContainText(`${antes.length - 1} columnas`);
  await opcion(page, 'Canales').click();

  await expect.poll(() => cabeceras(page)).toEqual(antes);
});

test('Agentes · Nombre sale marcado y no se puede quitar', async ({ page }) => {
  await goto(page, 'admin/agentes');
  await selector(page).click();
  const nombre = opcion(page, 'Nombre');
  await expect(nombre).toHaveAttribute('aria-selected', 'true');
  // `data-p-disabled` y no `aria-disabled`: el nativo marca así sus opciones apagadas y no las anuncia al lector
  // de pantalla (el mismo hueco que `sc-select` con Skills, anotado en el hand-off de fichas).
  await expect(nombre).toHaveAttribute('data-p-disabled', 'true');
  await nombre.click({ force: true });
  await expect.poll(() => cabeceras(page)).toContain('Nombre');
});

test('Agentes · arrastrar una cabecera la mueve, y al volver sigue ahí', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  expect(antes.indexOf('Canales'), 'la prueba mueve «Canales» delante de «Extensión»').toBeGreaterThan(
    antes.indexOf('Extensión'),
  );

  // Se agarra por el texto, como una persona: la directiva nativa no arrastra si lo pulsado contiene el tirador
  // de ancho (por eso `sc-datatable` envuelve el texto de la cabecera).
  await page
    .locator('sc-datatable thead th[data-field="channels"] .sc-datatable__header-label')
    .dragTo(page.locator('sc-datatable thead th[data-field="extension"]'));
  await expect.poll(async () => (await cabeceras(page)).indexOf('Canales')).toBeLessThan(antes.indexOf('Canales'));
  const movida = await cabeceras(page);

  await page.reload();
  await expect.poll(() => cabeceras(page)).toEqual(movida);
});
