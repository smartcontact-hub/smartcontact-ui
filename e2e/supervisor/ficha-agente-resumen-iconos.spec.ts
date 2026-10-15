import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL RESUMEN Y LA CABECERA DE LA FICHA DE AGENTE, CON LOS ICONOS DE LA LISTA (revisión de producto del 2026-10-15).
 *
 *   1. «Canales» (antes «Atiende por»): el icono de cada canal, con su nombre para el lector, como la columna Canales.
 *   2. La extensión, con el icono de dónde suena (navegador o teléfono) y no la palabra, bajo el nombre y en el resumen.
 *   3. Grabación, con el REC propio y sin rojo, que en la app dice «error»: relleno si graba y de contorno si no, en el
 *      color de las demás filas; en la lista, en el gris de los demás glifos (DD-209 §4).
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const fila = (page: Page, clave: string) => page.locator('.resumen__facts .resumen__pair', { has: page.locator('dt', { hasText: clave }) });

test('Canales y Extensión se dicen con iconos, con su nombre para el lector, y sin la palabra «navegador»', async ({ page }) => {
  // Tom Hanks (1): teléfono en sus grupos y extensión de navegador.
  await goto(page, 'admin/agentes/editar/1');
  await expect(page.locator('.resumen__facts dt', { hasText: 'Atiende por' })).toHaveCount(0);
  await expect(fila(page, 'Canales').getByRole('img', { name: 'Teléfono', exact: true })).toBeVisible();

  const extension = fila(page, 'Extensión');
  await expect(extension.getByRole('img', { name: 'Navegador', exact: true })).toBeVisible();
  await expect(extension.locator('dd')).toContainText('122');
  const cabecera = page.locator('.headline__meta');
  await expect(cabecera.getByRole('img', { name: 'Navegador', exact: true })).toBeVisible();
  await expect(cabecera).not.toContainText(/navegador/i);
  await expect(extension.locator('dd')).not.toContainText(/navegador/i);
});

test('Grabación lleva su REC sin rojo: relleno si graba y de contorno si no, en el color de las demás filas', async ({ page }) => {
  const icono = (p: Page, clave: string) => fila(p, clave).locator('.sc-icon-tile sc-icon');
  const color = (p: Page, clave: string) => icono(p, clave).evaluate((e) => getComputedStyle(e).color);

  // Denzel Washington (3) graba; Tom Hanks (1), no.
  await goto(page, 'admin/agentes/editar/3');
  await expect(fila(page, 'Grabación').locator('dd')).toHaveText('Sí');
  await expect(icono(page, 'Grabación').locator('.sc-icon--filled')).toHaveCount(1);
  expect(await color(page, 'Grabación'), 'el color de las demás filas, sin uno propio').toBe(await color(page, 'Salientes'));
  await goto(page, 'admin/agentes/editar/1');
  await expect(fila(page, 'Grabación').locator('dd')).toHaveText('No');
  await expect(icono(page, 'Grabación').locator('.sc-icon--filled')).toHaveCount(0);
  expect(await color(page, 'Grabación')).toBe(await color(page, 'Salientes'));

  // En la lista, el REC va en el gris de los demás glifos de la fila (los canales), no en el rojo de los errores.
  await goto(page, 'admin/agentes');
  const filaLista = page.locator('tbody tr', { hasText: 'Denzel Washington' });
  const rec = await filaLista.locator('.recording').evaluate((e) => getComputedStyle(e).color);
  const canal = await filaLista.locator('.sc-channel-row__item').first().evaluate((e) => getComputedStyle(e).color);
  expect(rec).toBe(canal);
});

test('la tarjeta de datos es la misma en agente, grupo y usuario, y sus baldosas llevan el color de la cifra destacada', async ({ page }) => {
  // DD-209 §6: la tarjeta plana (blanca y con borde fino) en las tres fichas, y la baldosa en el degradado de la marca,
  // el de la tarjeta destacada que tiene encima (ley de similitud: el mismo color, la misma familia de datos).
  const medir = () =>
    page.evaluate(() => {
      const card = document.querySelector('.ficha-summary .resumen__facts')!;
      const cs = getComputedStyle(card);
      const tiles = [...card.querySelectorAll('.sc-icon-tile')];
      const destacada = document.querySelector('.ficha-summary .resumen__kpi--destacada')!;
      return {
        tarjeta: [cs.backgroundColor, cs.borderTopWidth, cs.borderTopColor, cs.borderTopLeftRadius, cs.boxShadow].join(' | '),
        baldosas: tiles.length,
        delColorDeLaDestacada: tiles.filter((t) => getComputedStyle(t).backgroundColor === getComputedStyle(destacada).backgroundColor).length,
      };
    });
  const vistas = [];
  for (const ruta of ['admin/agentes/editar/3', 'admin/grupos/editar/11', 'admin/usuarios/editar/3']) {
    await goto(page, ruta);
    const m = await medir();
    expect(m.baldosas, `${ruta}: la tarjeta tiene baldosas`).toBeGreaterThan(0);
    expect(m.delColorDeLaDestacada, `${ruta}: todas del color de la destacada`).toBe(m.baldosas);
    vistas.push(m.tarjeta);
  }
  expect(new Set(vistas).size, `la misma tarjeta en las tres: ${vistas.join(' ‖ ')}`).toBe(1);
});
