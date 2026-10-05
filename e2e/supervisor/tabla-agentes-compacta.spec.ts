import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA TABLA DE AGENTES DE LA FICHA DE GRUPO, COMPACTA Y SIN PAGINAR (DD-171).
 *
 * Medido el 2026-10-05 a 1440, en el grupo 11 (tres canales): la tabla medía 912 en una caja de 731 y desplazaba 181 px
 * de lado. El hueco estaba en las columnas de casillas: todas a 104 o 100, para rótulos de 32 a 72 y una casilla de 16.
 * Y paginaba de 10 en 10 (DD-151, sin un porqué), cuando la tabla ya desplaza por dentro con la cabecera fija y llega
 * al pie de la pantalla (DD-160). Lo que fija:
 *   1. A 1440, con tres canales y sin niveles, la tabla cabe en su caja: no desplaza de lado.
 *   2. Cada columna de casillas mide su rótulo: Chat y Email, más estrechas que Teléfono.
 *   3. Sin paginación: están todas las filas del filtro, y lo que no cabe lo desplaza la tabla por dentro.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('a 1440, con tres canales, la tabla de agentes cabe sin desplazar de lado', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const caja = page.locator('sc-agent-channel-table .p-datatable-table-container');
  await caja.locator('tbody tr').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  const m = await caja.evaluate((c) => ({ caja: c.clientWidth, tabla: c.scrollWidth }));
  expect(m.tabla, `la tabla (${m.tabla}) cabe en su caja (${m.caja})`).toBeLessThanOrEqual(m.caja);
});

test('cada columna de casillas mide su rótulo', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  await page.locator('sc-agent-channel-table tbody tr').first().waitFor();
  const anchos = await page.locator('sc-agent-channel-table thead th').evaluateAll((ths) =>
    Object.fromEntries(ths.map((th) => [th.getAttribute('aria-label') ?? '', Math.round(th.getBoundingClientRect().width)])),
  );
  expect(anchos['Chat']!, 'Chat, más estrecha que Teléfono').toBeLessThan(anchos['Teléfono']!);
  expect(anchos['Email']!, 'Email, más estrecha que Teléfono').toBeLessThan(anchos['Teléfono']!);
});

test('sin paginación: todas las filas del filtro, y la tabla desplaza por dentro', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const tabla = page.locator('sc-agent-channel-table');
  await tabla.locator('tbody tr').first().waitFor();
  await expect(tabla.locator('.p-paginator')).toHaveCount(0);
  // Asignados: los 13 del grupo, todos en la tabla.
  await expect(tabla.locator('tbody tr')).toHaveCount(13);
  // Todos: los de la lista entera, también sin páginas.
  await tabla.getByRole('button', { name: 'Todos' }).click();
  await expect.poll(() => tabla.locator('tbody tr').count()).toBeGreaterThan(13);
});

/* LA CABECERA, EN UNA FILA Y ALINEADA (DD-171): las columnas de casillas llevan su icono y su casilla de «todos» al
 * lado, en la vertical de las casillas de sus filas; Habilitado, su icono sobre sus interruptores. Hasta entonces cada
 * cabecera de casillas apilaba su rótulo y su casilla, y la fila de cabeceras medía 54 con «Agente» y «Estado» flotando
 * a media altura. */
const COLUMNAS_DE_CASILLAS = [
  { nombre: 'Asignado', icono: 'person_check' },
  { nombre: 'Teléfono', icono: 'call' },
  { nombre: 'Chat', icono: 'chat_bubble' },
  { nombre: 'Email', icono: 'mail' },
] as const;

test('la cabecera va en una fila: cada columna de casillas, su casilla de todos al lado de su icono y sobre las de sus filas', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const tabla = page.locator('sc-agent-channel-table');
  await tabla.locator('tbody tr').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  const alto = await tabla.locator('thead tr').evaluate((tr) => tr.getBoundingClientRect().height);
  expect(alto, 'una sola fila de cabecera').toBeLessThanOrEqual(42);
  for (const { nombre, icono } of COLUMNAS_DE_CASILLAS) {
    const th = tabla.getByRole('columnheader', { name: nombre, exact: true });
    await expect(th.locator(`.sc-icon-font--${icono}`), `${nombre}: su icono`).toHaveCount(1);
    const m = await th.evaluate((el) => {
      const casilla = el.querySelector('sc-checkbox')!.getBoundingClientRect();
      const icono = el.querySelector('.assign__head-icon')!.getBoundingClientRect();
      const indice = [...el.parentElement!.children].indexOf(el);
      const fila = el.closest('table')!.querySelector('tbody tr')!.children[indice]!.querySelector('sc-checkbox')!.getBoundingClientRect();
      return {
        juntos: icono.left > casilla.right && icono.left - casilla.right < 12,
        mismaAltura: Math.abs(icono.top + icono.height / 2 - (casilla.top + casilla.height / 2)),
        vertical: Math.abs(casilla.left - fila.left),
      };
    });
    expect(m.juntos, `${nombre}: el icono, al lado de la casilla`).toBe(true);
    expect(m.mismaAltura, `${nombre}: casilla e icono, a la misma altura`).toBeLessThanOrEqual(1);
    expect(m.vertical, `${nombre}: la casilla de todos, sobre las de las filas`).toBeLessThanOrEqual(0.5);
  }
  const habilitado = tabla.getByRole('columnheader', { name: 'Habilitado', exact: true });
  await expect(habilitado.locator('.sc-icon-font--toggle_on'), 'Habilitado: su icono').toHaveCount(1);
  const centros = await habilitado.evaluate((el) => {
    const icono = el.querySelector('.assign__head-icon')!.getBoundingClientRect();
    const indice = [...el.parentElement!.children].indexOf(el);
    const interruptor = el.closest('table')!.querySelector('tbody tr')!.children[indice]!.querySelector('sc-toggleswitch')!.getBoundingClientRect();
    return Math.abs(icono.left + icono.width / 2 - (interruptor.left + interruptor.width / 2));
  });
  expect(centros, 'Habilitado: el icono, centrado sobre los interruptores').toBeLessThanOrEqual(1);
});

test('pulsar el icono de una cabecera hace lo que su casilla', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const tabla = page.locator('sc-agent-channel-table');
  await tabla.locator('tbody tr').first().waitFor();
  // Chat está a medias: marcarlo en todos cambia a varios agentes, y eso se confirma (DD-151).
  await tabla.getByRole('columnheader', { name: 'Chat', exact: true }).locator('.sc-icon-font--chat_bubble').click();
  await expect(page.getByRole('alertdialog', { name: 'Confirmar cambios colectivos' })).toBeVisible();
});

test('la barra: el selector y el buscador, centrados y de borde a borde de la tabla', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const tabla = page.locator('sc-agent-channel-table');
  await tabla.locator('tbody tr').first().waitFor();
  const m = await tabla.evaluate((el) => {
    const r = (s: string) => el.querySelector(s)!.getBoundingClientRect();
    const [selector, buscador, caja] = [r('sc-selectbutton .p-selectbutton'), r('sc-search'), r('.table-card')];
    return {
      altos: Math.abs(selector.height - buscador.height),
      centros: Math.abs(selector.top + selector.height / 2 - (buscador.top + buscador.height / 2)),
      izquierda: Math.abs(selector.left - caja.left),
      derecha: Math.abs(buscador.right - caja.right),
    };
  });
  // El selector, en su tamaño pequeño, lleva su carril gris: 1,5 más que el campo (34 frente a 32,5), y centrados.
  expect(m.altos, 'casi la misma altura').toBeLessThanOrEqual(1.5);
  expect(m.centros, 'centrados en la misma línea').toBeLessThanOrEqual(0.5);
  expect(m.izquierda, 'el selector, en el borde izquierdo de la tabla').toBeLessThanOrEqual(0.5);
  expect(m.derecha, 'el buscador, en el borde derecho de la tabla').toBeLessThanOrEqual(0.5);
});
