import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * ORDENAR POR CUALQUIER COLUMNA, Y LA BARRA A UNA ALTURA (DD-180).
 *
 * En Grupos se ordena por todas las columnas, y en Agentes por todas menos Estado, que cambia sola. Hasta el
 * 2026-10-06 no se ordenaban Teléfono, Canales ni Servicios en Grupos, ni Canales ni Grupos en Agentes. Lo que fija:
 *   1. qué cabeceras ordenan, en las columnas que salen de partida;
 *   2. las columnas nuevas ordenan de verdad: Canales por cuántos tiene la fila, Servicios y Grupos por su cifra;
 *   3. cada cabecera, con su flecha, cabe en su columna en los cuatro idiomas (al ponerla, cinco se salían, hasta 16 px);
 *   4. el botón «Columnas» mide lo mismo que el buscador de su barra (medía 27 contra 32,5).
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const conIdioma = async (page: Page, idioma: string) =>
  page.addInitScript((l) => {
    try {
      localStorage.setItem('sc-language', l);
    } catch {
      /* contexto sin storage */
    }
  }, idioma);

/** Las cabeceras con texto de la tabla y si ordenan (`aria-sort` solo lo llevan las ordenables). */
const cabeceras = (page: Page) =>
  page.locator('sc-datatable thead th').evaluateAll((ths) =>
    ths
      .map((th) => ({ campo: th.getAttribute('data-field') ?? '', ordena: th.hasAttribute('aria-sort') }))
      .filter((c) => c.campo && !c.campo.startsWith('__')),
  );

/** El valor de una columna en las primeras filas, tal como se ve: los canales, por sus iconos. */
const valores = (page: Page, campo: string) =>
  page.evaluate((f) => {
    const ths = [...document.querySelectorAll('sc-datatable thead th')];
    const i = ths.findIndex((t) => t.getAttribute('data-field') === f);
    return [...document.querySelectorAll('sc-datatable tbody tr')].slice(0, 25).map((tr) => {
      const td = tr.children[i] as HTMLElement | undefined;
      const canales = new Set([...(td?.querySelectorAll('[data-channel]') ?? [])].map((e) => e.getAttribute('data-channel')));
      return canales.size || td?.querySelector('sc-channel-icon') ? canales.size : Number((td?.innerText ?? '').trim()) || 0;
    });
  }, campo);

const ordenarDescendente = async (page: Page, campo: string) => {
  const th = page.locator(`sc-datatable thead th[data-field="${campo}"]`);
  await th.click();
  await expect(th).toHaveAttribute('aria-sort', 'ascending');
  await th.click();
  await expect(th).toHaveAttribute('aria-sort', 'descending');
};

const descendente = (xs: readonly number[]) => xs.every((x, i) => i === 0 || xs[i - 1]! >= x);

test('Grupos ordena por todas sus columnas', async ({ page }) => {
  await goto(page, '/admin/grupos');
  expect(await cabeceras(page)).toEqual([
    { campo: 'name', ordena: true },
    { campo: 'phone', ordena: true },
    { campo: 'channels', ordena: true },
    { campo: 'priority', ordena: true },
    { campo: 'strategy', ordena: true },
    { campo: 'services', ordena: true },
    { campo: 'agents', ordena: true },
  ]);
  for (const campo of ['channels', 'services']) {
    await ordenarDescendente(page, campo);
    const xs = await valores(page, campo);
    expect(new Set(xs).size, `${campo}: la semilla trae valores distintos`).toBeGreaterThan(1);
    expect(descendente(xs), `${campo}: ${xs.join(', ')}`).toBe(true);
  }
});

test('Agentes ordena por todas menos Estado', async ({ page }) => {
  await goto(page, '/admin/agentes');
  const todas = await cabeceras(page);
  // «Estado» ya no sale de inicio (su burbuja va en el avatar, DD-185): todas las que salen ordenan.
  expect(todas.filter((c) => !c.ordena).map((c) => c.campo)).toEqual([]);
  for (const campo of ['channels', 'groups']) {
    await ordenarDescendente(page, campo);
    const xs = await valores(page, campo);
    expect(new Set(xs).size, `${campo}: la semilla trae valores distintos`).toBeGreaterThan(1);
    expect(descendente(xs), `${campo}: ${xs.join(', ')}`).toBe(true);
  }
});

for (const idioma of ['es', 'en', 'fr', 'pt']) {
  test(`cada cabecera cabe con su flecha y «Columnas» va a la altura del buscador (${idioma})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await conIdioma(page, idioma);
    for (const ruta of ['/admin/grupos', '/admin/agentes']) {
      await goto(page, ruta);
      await expect(page.locator('sc-datatable thead th[aria-sort]').first()).toBeVisible();
      const salidas = await page.locator('sc-datatable thead th[aria-sort]').evaluateAll((ths) =>
        ths.flatMap((th) => {
          const flecha = th.querySelector('.p-datatable-sort-icon')!.getBoundingClientRect();
          const caja = th.getBoundingClientRect();
          const borde = caja.right - parseFloat(getComputedStyle(th).paddingRight);
          return flecha.right > borde + 0.5 ? [`${th.textContent?.trim()} +${(flecha.right - borde).toFixed(1)}`] : [];
        }),
      );
      expect(salidas, `${ruta}: cabeceras cuya flecha se sale`).toEqual([]);
      const alto = async (selector: string) => (await page.locator(selector).boundingBox())!.height;
      expect(await alto('.page__action-bar .page__columns button')).toBeCloseTo(
        await alto('.page__action-bar .page__search input'),
        0,
      );
    }
  });
}

/* La barra, en dos grupos (DD-180 §4): Columnas y el buscador, a `0-875` (12,25) como dos hermanos; la descarga, detrás
 * del separador y solo con su aire del tema, 14 por lado. Medido antes: Columnas a 24,5 del buscador y la descarga a
 * 53,5, porque el globo de Columnas y el separador sumaban cada uno un hueco de la barra. */
test('la barra: Columnas junto al buscador, y la descarga detrás del separador con su aire', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const ruta of ['/admin/grupos', '/admin/agentes']) {
    await goto(page, ruta);
    const m = await page.locator('.page__action-bar').evaluate((barra) => {
      const r = (s: string) => barra.querySelector(s)!.getBoundingClientRect();
      const [columnas, buscador, separador] = [r('.page__columns'), r('.page__search'), r('sc-divider .p-divider')];
      const descarga = [...barra.querySelectorAll('sc-button')].at(-1)!.getBoundingClientRect();
      return {
        columnasBuscador: buscador.left - columnas.right,
        antesDelSeparador: separador.left - buscador.right,
        despuesDelSeparador: descarga.left - separador.right,
      };
    });
    expect(m.columnasBuscador, `${ruta}: Columnas → buscador`).toBeCloseTo(12.25, 0);
    expect(m.antesDelSeparador, `${ruta}: buscador → separador`).toBeCloseTo(14, 0);
    expect(m.despuesDelSeparador, `${ruta}: separador → descarga`).toBeCloseTo(14, 0);
  }
});
