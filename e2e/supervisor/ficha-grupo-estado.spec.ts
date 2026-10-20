import { expect, test, type Locator, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * «AGENTES ASIGNADOS» SIN ESTADO: EL AGENTE, CON SU AVATAR Y SIN PUNTO (SISMAC-4058, 2026-10-20; antes, la burbuja del
 * avatar, DD-185, y antes su columna, DD-156).
 *
 * El estado de la persona se fue con el filtro de estados y equipos, que queda para otra fase: en una tabla para asignar,
 * un punto sin filtro que lo use es ruido. Lo que fija, en la ficha y en el panel del Monitor:
 *   1. ni columna «Estado» ni punto en el avatar, ni el estado dicho para el lector;
 *   2. en el panel, que mide lo que lleva (DD-131), ningún email sale recortado;
 *   3. y la guarda: donde la ficha cabía, sigue cabiendo sin desplazar la tabla en horizontal, y con los emails enteros.
 *      Son los dos casos más justos de la matriz de DD-156: un canal a 1440 y dos a 1536.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
  await page.setViewportSize({ width: 1440, height: 900 });
});

/** El panel se abre desde el Monitor: desde el 2026-10-20 la cifra del listado de grupos lleva a la ficha (SISMAC-4056). */
async function abrirPanel(page: Page, grupo: string): Promise<Locator> {
  await goto(page, 'dashboard');
  await page.getByRole('tab').nth(1).click();
  // El monitor elegido, antes de abrir nada: el de «Monitor» también tiene un widget «Grupos».
  await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
  await page
    .locator('sc-dashboard-widget-card')
    .filter({ has: page.locator('sc-dashboard-group-panel') })
    .getByRole('button', { name: 'Asignar agentes', exact: true })
    .click();
  await page.getByRole('menu').getByRole('menuitem', { name: grupo }).click();
  return esperarTabla(page);
}

async function abrir(page: Page, ruta: string): Promise<Locator> {
  await goto(page, ruta);
  return esperarTabla(page);
}

async function esperarTabla(page: Page): Promise<Locator> {
  const tabla = page.locator('sc-agent-channel-table');
  await expect(tabla.locator('tbody tr').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return tabla;
}

/** Los rótulos de las cabeceras, en orden: cada `th` lleva el de su columna como nombre accesible. */
const cabeceras = (tabla: Locator) =>
  tabla.locator('thead th').evaluateAll((ths) => ths.map((th) => th.getAttribute('aria-label') ?? ''));

const SUPERFICIES = [
  { nombre: 'ficha', abre: (page: Page) => abrir(page, 'admin/grupos/editar/11?seccion=agentes') },
  { nombre: 'panel', abre: (page: Page) => abrirPanel(page, 'ACD Demo C2CB') },
] as const;

for (const { nombre, abre } of SUPERFICIES) {
  test(`${nombre}: el agente va con su avatar, sin punto de estado ni columna «Estado»`, async ({ page }) => {
    const tabla = await abre(page);
    expect(await cabeceras(tabla), 'sin columna «Estado»').not.toContain('Estado');

    const tom = tabla.locator('tbody tr', { hasText: 'Tom Hanks' });
    await expect(tom.locator('sc-presence-avatar sc-illustrated-avatar')).toHaveCount(1);
    // Sin estado, el punto no se pinta (`display: none` en `sc-presence-avatar`).
    await expect(tom.locator('sc-presence-avatar .p-badge'), 'sin punto').toBeHidden();
    await expect(tom.locator('sc-presence-avatar .visually-hidden'), 'ni el estado dicho para el lector').toHaveCount(0);
    await expect(tom.locator('sc-tag'), 'ni etiqueta').toHaveCount(0);
  });
}

test('panel: ningún email sale recortado', async ({ page }) => {
  const tabla = await abrirPanel(page, 'ACD Demo C2CB');
  const recortados = await tabla
    .locator('.assign__email')
    .evaluateAll((emails) => emails.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
  expect(recortados).toEqual([]);
});

const CABEN = [
  { grupo: 1, canales: ['Teléfono'], ancho: 1440 },
  { grupo: 2, canales: ['Teléfono', 'Email'], ancho: 1536 },
] as const;

for (const { grupo, canales, ancho } of CABEN) {
  test(`ficha de un grupo de ${canales.length} canal(es), a ${ancho}: cabe sin desplazar y con los emails enteros`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 900 });
    const tabla = await abrir(page, `admin/grupos/editar/${grupo}?seccion=agentes`);
    const rotulos = await cabeceras(tabla);
    for (const canal of canales) expect(rotulos, `la columna ${canal}`).toContain(canal);
    const sobra = await tabla
      .locator('.p-datatable-table-container')
      .evaluate((caja) => caja.scrollWidth - caja.clientWidth);
    expect(sobra, 'lo que la tabla sobresale de su caja').toBeLessThanOrEqual(0);
    const recortados = await tabla
      .locator('.assign__email')
      .evaluateAll((emails) => emails.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
    expect(recortados, 'emails recortados').toEqual([]);
  });
}
