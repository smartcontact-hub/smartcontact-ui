import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LAS FICHAS EN TRES COLUMNAS: ÍNDICE, CONTENIDO Y RESUMEN ARRANCAN A LA MISMA ALTURA (DD-144).
 *
 * Pedido el 2026-10-01: el contenido sube arriba, con el título dentro, y el resumen se alinea con el índice, sin el
 * rótulo «Resumen». Hasta hoy el título iba en una fila propia encima de las tres columnas (DD-121 §2, DD-122 §8):
 * medido a 1440, el título en y=79 y las tres columnas en y≈135, el resumen gastaba 25 px en su rótulo y «Eliminar»
 * iba arriba a la derecha.
 *
 * Lo que fija, en las tres fichas, al crear y al editar:
 *   1. A 1440, el índice, el título y el resumen arrancan a la misma altura, y el título va en la columna del
 *      contenido: su borde izquierdo es el de la tarjeta de la sección.
 *   2. El resumen no enseña su rótulo, y la región conserva su nombre («Resumen»).
 *   3. «Eliminar» va bajo el índice, al editar; en el alta no hay.
 *   4. Por debajo de 1340: el título arriba, a todo lo ancho; luego el resumen, en su franja; y después, índice y
 *      contenido.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const FICHAS = [
  { ruta: 'admin/grupos/editar/11', edita: true },
  { ruta: 'admin/grupos/crear', edita: false },
  { ruta: 'admin/agentes/editar/1', edita: true },
  { ruta: 'admin/agentes/crear', edita: false },
  { ruta: 'admin/usuarios/editar/1', edita: true },
  { ruta: 'admin/usuarios/crear', edita: false },
] as const;

const cajas = (page: Page) =>
  page.evaluate(() => {
    const caja = (sel: string) => {
      const r = document.querySelector(sel)?.getBoundingClientRect();
      return r ? { top: Math.round(r.top), left: Math.round(r.left), bottom: Math.round(r.bottom) } : null;
    };
    return {
      indice: caja('.page__rail'),
      titulo: caja('main#main-content h1'),
      tarjeta: caja('.page__main sc-section-card'),
      resumen: caja('.ficha-summary'),
    };
  });

for (const f of FICHAS) {
  test(`${f.ruta} · índice, título y resumen arrancan a la misma altura, y el título va con el contenido`, async ({ page }) => {
    await goto(page, f.ruta);
    const m = await cajas(page);
    expect(m.titulo!.top, 'el título, a la altura del índice').toBe(m.indice!.top);
    expect(m.resumen!.top, 'el resumen, a la altura del índice').toBe(m.indice!.top);
    expect(m.titulo!.left, 'el título, en la columna del contenido').toBe(m.tarjeta!.left);
  });
}

test('el resumen no enseña su rótulo, y la región conserva su nombre', async ({ page }) => {
  for (const { ruta } of FICHAS) {
    await goto(page, ruta);
    await expect(page.getByRole('region', { name: 'Resumen' }), ruta).toBeVisible();
    const alto = await page.locator('.ficha-summary .resumen__title').evaluate((e) => e.getBoundingClientRect().height);
    expect(alto, `${ruta}: el rótulo, oculto a la vista`).toBeLessThanOrEqual(1);
  }
});

test('«Eliminar» va bajo el índice al editar, y en el alta no hay', async ({ page }) => {
  for (const { ruta, edita } of FICHAS) {
    await goto(page, ruta);
    const eliminar = page.locator('.page__rail').getByRole('button', { name: 'Eliminar', exact: true });
    if (!edita) {
      await expect(eliminar, ruta).toHaveCount(0);
      continue;
    }
    await expect(eliminar, ruta).toBeVisible();
    const indice = await page.locator('.page__rail sc-form-section-nav').boundingBox();
    const boton = await eliminar.boundingBox();
    expect(boton!.y, `${ruta}: «Eliminar», debajo del índice`).toBeGreaterThan(indice!.y + indice!.height);
  }
});

test('por debajo de 1340: el título arriba, luego el resumen, y después índice y contenido', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const { ruta } of FICHAS) {
    await goto(page, ruta);
    const m = await cajas(page);
    expect(m.titulo!.bottom, `${ruta}: el título, encima del resumen`).toBeLessThanOrEqual(m.resumen!.top);
    expect(m.resumen!.bottom, `${ruta}: el resumen, encima del índice`).toBeLessThanOrEqual(m.indice!.top);
    expect(m.titulo!.left, `${ruta}: el título, a todo lo ancho`).toBe(m.indice!.left);
  }
});
