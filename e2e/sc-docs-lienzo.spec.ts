import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * EL LIENZO Y EL CÓDIGO DE SC-DOCS RESPIRAN.
 *
 * Medido el 2026-10-05 sobre las capturas de `main`:
 *   1. En la tabla de API, los títulos de «Dos sentidos» y «Salidas» van pegados a la tabla de encima (0 px) y se leen
 *      como su última fila. Entre grupos, al menos el doble que entre un título y su tabla (AGENTS, «UX de pantalla» 9).
 *   2. Las demos que agrupan con `.row` o `.col` salen con los hijos pegados: `component-page.scss`, que las definía,
 *      no lo importa nadie desde la migración de julio. Entre hermanos, 14.
 *   3. «Copiar» flota encima de la primera línea del código cuando es larga (radiobutton, «Grupo»).
 *   4. Una línea de código sin cortar estira la columna del Playground por debajo de «Controles» (formdangerzone).
 *
 * Con el viewport de las capturas de `components.spec` (el de Playwright por defecto, 1280 × 720): a 1440 cabían.
 */

const gotoPage = async (page: Page, slug: string): Promise<void> => {
  await page.goto(`/#/components/${slug}`);
  await page.locator('app-story-props-table table').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
};

/** La historia por su nombre: la sección cuyo primer título lo dice tal cual. */
const historia = (page: Page, nombre: string): Locator =>
  page.locator('section.sb-host__story').filter({ has: page.locator('> .sb-host__section-title', { hasText: new RegExp(`^${nombre}$`) }) });

/** Los huecos entre hijos consecutivos de una caja: en horizontal si comparten fila; en vertical si no. */
const huecosEntreHijos = (caja: Locator) =>
  caja.evaluate((el) => {
    const r = [...el.children].map((c) => c.getBoundingClientRect()).filter((b) => b.width > 0 && b.height > 0);
    const huecos: number[] = [];
    for (let i = 1; i < r.length; i++) {
      const [a, b] = [r[i - 1]!, r[i]!];
      huecos.push(Math.abs(a.top - b.top) < 2 ? b.left - a.right : b.top - a.bottom);
    }
    return huecos;
  });

test('la tabla de API separa sus grupos: entre grupos, al menos el doble que entre un título y su tabla', async ({ page }) => {
  await gotoPage(page, 'datatable');
  const medidas = await page.locator('app-story-props-table').evaluate((host) => {
    const titulos = [...host.querySelectorAll('.sb-host__section-title')];
    return titulos.map((t) => {
      const tabla = t.nextElementSibling!.getBoundingClientRect();
      const anterior = t.previousElementSibling?.getBoundingClientRect() ?? null;
      const titulo = t.getBoundingClientRect();
      return { texto: t.textContent!.trim(), dentro: tabla.top - titulo.bottom, entre: anterior ? titulo.top - anterior.bottom : null };
    });
  });
  const conAnterior = medidas.filter((m) => m.entre !== null);
  expect(conAnterior.length, 'datatable tiene más de un grupo en su API').toBeGreaterThan(0);
  for (const m of conAnterior) {
    expect(m.entre!, `«${m.texto}»: el hueco con la tabla de encima`).toBeGreaterThanOrEqual(2 * m.dentro - 0.5);
  }
});

// Una página por prueba: al cambiar solo el hash, la página anterior sigue montada mientras llega la nueva.
test('las demos con `.row` separan a sus hijos con el hueco de los hermanos (14)', async ({ page }) => {
  await gotoPage(page, 'radiobutton');
  const fila = page.locator('.sb-canvas__pane .row').first();
  for (const h of await huecosEntreHijos(fila)) expect(h, 'radiobutton · .row').toBeGreaterThanOrEqual(13.5);
});

test('las demos con `.col` separan a sus hijos con el hueco de los hermanos (14)', async ({ page }) => {
  await gotoPage(page, 'inputtext');
  const columna = page.locator('.sb-canvas__pane .col').first();
  for (const h of await huecosEntreHijos(columna)) expect(h, 'inputtext · .col').toBeGreaterThanOrEqual(13.5);
});

test('«Copiar» no tapa la primera línea del código, aunque sea larga', async ({ page }) => {
  await gotoPage(page, 'radiobutton');
  const snippet = historia(page, 'Grupo').locator('.sb-snippet');
  const cruce = await snippet.evaluate((el) => {
    const boton = el.querySelector('.sb-snippet__copy')!.getBoundingClientRect();
    const texto = el.querySelector('pre code')!.firstChild!;
    const fin = (texto.textContent ?? '').indexOf('\n');
    const rango = document.createRange();
    rango.setStart(texto, 0);
    rango.setEnd(texto, fin < 0 ? (texto.textContent ?? '').length : fin);
    const linea = rango.getClientRects()[0]!;
    const seCruzan = linea.left < boton.right && linea.right > boton.left && linea.top < boton.bottom && linea.bottom > boton.top;
    return { seCruzan, linea: [Math.round(linea.left), Math.round(linea.right), Math.round(linea.top), Math.round(linea.bottom)], boton: [Math.round(boton.left), Math.round(boton.right), Math.round(boton.top), Math.round(boton.bottom)] };
  });
  expect(cruce.seCruzan, `línea ${cruce.linea} · botón ${cruce.boton}`).toBe(false);
});

test('una línea de código larga no estira la columna del Playground por debajo de «Controles»', async ({ page }) => {
  await gotoPage(page, 'formdangerzone');
  // La columna no crece (lleva `min-width: 0`): lo que se sale es su contenido, el código y la anatomía, que se cuelan
  // por debajo de «Controles». Se mide el borde derecho de lo que hay dentro, no el de la caja.
  const { derechoDelContenido, controles } = await page
    .locator('.sb-host__play')
    .first()
    .evaluate((el) => {
      const [principal, panel] = [...el.children] as HTMLElement[];
      const hijos = [...principal!.querySelectorAll('.sb-snippet, .sb-anatomy, .sb-canvas')];
      return {
        derechoDelContenido: Math.max(...hijos.map((h) => h.getBoundingClientRect().right)),
        controles: panel!.getBoundingClientRect().left,
      };
    });
  expect(derechoDelContenido, 'el borde derecho del código y la anatomía').toBeLessThanOrEqual(controles);
});
