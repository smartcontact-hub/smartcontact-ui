import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA TABLA DE AGENTES DE LA FICHA DE GRUPO, COMPACTA Y SIN PAGINAR (DD-176).
 *
 * Medido el 2026-10-05 a 1440, en el grupo 11 (tres canales): la tabla medía 912 en una caja de 731 y desplazaba 181 px
 * de lado. El hueco estaba en las columnas de casillas: todas a 104 o 100, para rótulos de 32 a 72 y una casilla de 16.
 * Y paginaba de 10 en 10 (DD-151, sin un porqué), cuando la tabla ya desplaza por dentro con la cabecera fija y llega
 * al pie de la pantalla (DD-160). Lo que fija:
 *   1. A 1440, con uno o dos canales y sin niveles, la tabla cabe en su caja; con tres desplaza 59 px (DD-181).
 *   2. Cada columna de casillas mide su rótulo: Chat y Email, más estrechas que Teléfono.
 *   3. Sin paginación: están todas las filas del filtro, y lo que no cabe lo desplaza la tabla por dentro.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/* Con las casillas de «todos» en cada columna (DD-181), las de canales y Habilitado ganan 23 px cada una: a 1440 caben
 * uno o dos canales (el grupo 12, Teléfono y Chat), y con los tres (el 11) la tabla desplaza 59 px de lado, sin cortar
 * ningún nombre de la semilla. */
for (const [grupo, desplaza] of [[12, 0], [11, 59]] as const) {
  test(`a 1440, en el grupo ${grupo}, la tabla de agentes desplaza de lado ${desplaza} px como mucho`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, `admin/grupos/editar/${grupo}?seccion=agentes`);
    const caja = page.locator('sc-agent-channel-table .p-datatable-table-container');
    await caja.locator('tbody tr').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const m = await caja.evaluate((c) => ({ caja: c.clientWidth, tabla: c.scrollWidth }));
    expect(m.tabla - m.caja, `la tabla (${m.tabla}) en su caja (${m.caja})`).toBeLessThanOrEqual(desplaza);
    const cortados = await page.locator('sc-agent-channel-table .assign__name-label').evaluateAll((ns) =>
      ns.filter((n) => n.scrollWidth > n.clientWidth).map((n) => n.textContent),
    );
    expect(cortados, 'ningún nombre de la semilla se corta').toEqual([]);
  });
}

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
 * Desde DD-181, Asignado, cada canal y Habilitado llevan su casilla de «todos» DELANTE del rótulo, en la misma fila y
 * en la vertical de los controles de sus filas: se marca una columna entera sin volver a la cabecera de dos pisos. */
test('la cabecera es una fila de texto: cada columna de controles con su casilla delante, sobre los controles de sus filas', async ({
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
  for (const nombre of ['Asignado', 'Teléfono', 'Chat', 'Email', 'Habilitado']) {
    const c = col(nombre);
    expect(c.casilla, `${nombre}: su casilla de todos`).not.toBeNull();
    expect(Math.abs(c.casilla!.left - c.control!), `${nombre}: sobre los controles de sus filas`).toBeLessThanOrEqual(0.5);
    expect(c.texto.left, `${nombre}: el rótulo, detrás de la casilla`).toBeGreaterThan(c.casilla!.left);
    expect(Math.abs(c.texto.centro - c.casilla!.centro), `${nombre}: casilla y rótulo, a la misma altura`).toBeLessThanOrEqual(1);
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
