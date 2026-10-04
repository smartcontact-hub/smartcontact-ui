import { expect, test, type Locator, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL ESTADO DE CADA AGENTE, EN SU PROPIA COLUMNA (DD-156).
 *
 * La referencia de producto de la asignación («4. Agentes y revisión») pide el estado de la persona como un dato
 * aparte, tras el agente. Iba pegado al nombre (DD-149): cada etiqueta empezaba donde acababa su nombre y se comía el
 * sitio del email. Medido el 2026-10-04: en la ficha a 1440, siete de diez emails recortados y 63 px de diferencia
 * entre la etiqueta que más a la izquierda empezaba y la que más a la derecha. Lo que fija, en la ficha y en el panel:
 *   1. «Estado» es la columna que sigue a «Agente», y la etiqueta de cada persona va en ella, no en la del agente;
 *   2. las etiquetas empiezan en la misma vertical, fila a fila;
 *   3. en el panel, que mide lo que lleva (DD-131), ningún email de su primera página sale recortado;
 *   4. y la guarda: donde la ficha cabía, sigue cabiendo sin desplazar la tabla en horizontal, y con los emails enteros.
 *      Son los dos casos más justos de la matriz de DD-156: un canal a 1440 (11 px de margen) y dos a 1536 (3 px). La
 *      primera versión de DD-156 cabía a 1440 pero recortaba cuatro emails de diez, y ninguna prueba lo vio.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
  await page.setViewportSize({ width: 1440, height: 900 });
});

const SUPERFICIES = [
  { nombre: 'ficha', ruta: 'admin/grupos/editar/11?seccion=agentes', panel: null },
  { nombre: 'panel', ruta: 'admin/grupos', panel: 'ACD demo cuscare' },
] as const;

async function abrir(page: Page, ruta: string, panel: string | null): Promise<Locator> {
  await goto(page, ruta);
  if (panel) await page.getByRole('button', { name: `Asignar agentes de ${panel}` }).click();
  const tabla = page.locator('sc-agent-channel-table');
  await expect(tabla.locator('tbody tr').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return tabla;
}

/** Los rótulos de las cabeceras, en orden: cada `th` lleva el de su columna como nombre accesible. */
const cabeceras = (tabla: Locator) =>
  tabla.locator('thead th').evaluateAll((ths) => ths.map((th) => th.getAttribute('aria-label') ?? ''));

for (const { nombre, ruta, panel } of SUPERFICIES) {
  test(`${nombre}: el estado va en su propia columna, tras el agente, y alineado fila a fila`, async ({ page }) => {
    const tabla = await abrir(page, ruta, panel);
    const rotulos = await cabeceras(tabla);
    const agente = rotulos.indexOf('Agente');
    expect(agente, 'la columna «Agente»').toBeGreaterThanOrEqual(0);
    expect(rotulos[agente + 1], 'la columna que sigue a «Agente»').toBe('Estado');

    const tom = tabla.locator('tbody tr', { hasText: 'Tom Hanks' });
    await expect(tom.locator('td').nth(agente + 1), 'su estado, en la columna Estado').toHaveText('Disponible');
    await expect(tom.locator('td').nth(agente).locator('sc-tag'), 'y no en la del agente').toHaveCount(0);

    const inicios = await tabla
      .locator('tbody tr')
      .evaluateAll(
        (filas, columna) =>
          filas
            .map((fila) => fila.querySelectorAll(':scope > td')[columna]?.querySelector('sc-tag'))
            .filter((tag): tag is Element => !!tag)
            .map((tag) => tag.getBoundingClientRect().left),
        agente + 1,
      );
    expect(inicios.length, 'filas con estado').toBeGreaterThanOrEqual(5);
    expect(Math.max(...inicios) - Math.min(...inicios), 'de la etiqueta más a la izquierda a la más a la derecha').toBeLessThanOrEqual(1);
  });
}

test('panel: ningún email de la primera página sale recortado', async ({ page }) => {
  const tabla = await abrir(page, 'admin/grupos', 'ACD demo cuscare');
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
    const tabla = await abrir(page, `admin/grupos/editar/${grupo}?seccion=agentes`, null);
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
