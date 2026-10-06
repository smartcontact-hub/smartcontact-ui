import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA TABLA DE AGENTES DE LA FICHA DE GRUPO, COMPACTA Y SIN PAGINAR (DD-176).
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

/* LA CABECERA, UNA FILA DE TEXTO ALINEADA CON SUS CONTROLES (DD-176). Hasta entonces cada cabecera de casillas apilaba
 * su rótulo y su casilla de «todos», y la fila de cabeceras medía 54 con «Agente» y «Estado» flotando a media altura.
 * Elegido tras ver cómo lo hacen los SaaS de referencia (Zendesk, HubSpot, Genesys) y los sistemas de diseño (Carbon,
 * Atlassian, NN/g): rótulos de texto, sin controles en las cabeceras de datos; solo la primera columna, Asignado, lleva
 * su casilla de «todos». */
test('la cabecera es una fila de texto: Asignado con su casilla delante, y cada rótulo sobre los controles de su columna', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const tabla = page.locator('sc-agent-channel-table');
  await tabla.locator('tbody tr').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  const alto = await tabla.locator('thead tr').evaluate((tr) => tr.getBoundingClientRect().height);
  expect(alto, 'una sola fila de cabecera').toBeLessThanOrEqual(42);
  const m = await tabla.locator('table').evaluate((t) => {
    const ths = [...t.querySelectorAll('thead th')];
    const fila = t.querySelector('tbody tr')!;
    const control = (i: number) => fila.children[i]!.querySelector('sc-checkbox, sc-toggleswitch')?.getBoundingClientRect();
    return ths.map((th, i) => {
      const casilla = th.querySelector('sc-checkbox')?.getBoundingClientRect();
      const rango = document.createRange();
      const texto = [...th.querySelectorAll('span:not(.visually-hidden)')].find((s) => !s.querySelector('*') && s.textContent!.trim()) ?? th;
      rango.selectNodeContents(texto);
      return {
        nombre: th.getAttribute('aria-label'),
        casilla: casilla ? { left: casilla.left, centro: casilla.top + casilla.height / 2 } : null,
        texto: { left: rango.getBoundingClientRect().left, centro: rango.getBoundingClientRect().top + rango.getBoundingClientRect().height / 2 },
        control: control(i) ? control(i)!.left : null,
      };
    });
  });
  const col = (nombre: string) => m.find((c) => c.nombre === nombre)!;
  const asignado = col('Asignado');
  expect(asignado.casilla, 'Asignado: su casilla de todos').not.toBeNull();
  expect(Math.abs(asignado.casilla!.left - asignado.control!), 'Asignado: sobre las casillas de sus filas').toBeLessThanOrEqual(0.5);
  expect(asignado.texto.left, 'Asignado: el rótulo, detrás de la casilla').toBeGreaterThan(asignado.casilla!.left);
  expect(Math.abs(asignado.texto.centro - asignado.casilla!.centro), 'Asignado: casilla y rótulo, a la misma altura').toBeLessThanOrEqual(1);
  for (const nombre of ['Teléfono', 'Chat', 'Email', 'Habilitado']) {
    const c = col(nombre);
    expect(c.casilla, `${nombre}: sin controles en la cabecera`).toBeNull();
    expect(Math.abs(c.texto.left - c.control!), `${nombre}: el rótulo, sobre los controles de su columna`).toBeLessThanOrEqual(1);
  }
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
