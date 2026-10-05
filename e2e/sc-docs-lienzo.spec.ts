import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * EL LIENZO Y EL CÓDIGO DE SC-DOCS RESPIRAN.
 *
 * Medido el 2026-10-05 sobre las capturas de `main`:
 *   1. En la tabla de API, los títulos de «Dos sentidos» y «Salidas» van pegados a la tabla de encima (0 px) y se leen
 *      como su última fila. Entre grupos, al menos el doble que entre un título y su tabla (AGENTS, «UX de pantalla» 9).
 *   2. Las demos que agrupan con `.row` o `.col` salen con los hijos pegados: `component-page.scss`, que las definía,
 *      no lo importa nadie desde la migración de julio. Entre hermanos, 14; también entre un control y su línea de
 *      lectura («Valor: …»), que con la caja en flex sumaba el margen del párrafo.
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

test('la línea de lectura de una demo va a 14 de su control, como un hermano más, no al doble', async ({ page }) => {
  // En flex, el margen del párrafo se suma al hueco: «Valor: …» quedaba a 28 de su control, el escalón de entre
  // grupos, como si fuera otra cosa. Doce líneas así en diez páginas (medido el 2026-10-05).
  await gotoPage(page, 'datepicker');
  const huecos = await huecosEntreHijos(historia(page, 'Con valor').locator('.sb-canvas__pane .col'));
  expect(huecos.length, 'el control y su línea de lectura').toBeGreaterThan(0);
  for (const h of huecos) expect(h, 'datepicker «Con valor» · del control a «Valor:»').toBeCloseTo(14, 0);
});

test('una `.col` del lienzo llega a su tope, y un control `fluid` dentro la llena', async ({ page }) => {
  // El lienzo es una fila flex: la `.col`, sin crecer, medía lo que su hijo más ancho, y «Fluid» no se distinguía de
  // los demás (textarea «Estados», medido el 2026-10-05: columna de 238 frente a un tope de 640).
  await gotoPage(page, 'textarea');
  const m = await historia(page, 'Estados')
    .locator('.sb-canvas__pane')
    .evaluate((pane) => {
      const col = pane.querySelector(':scope > .col')!;
      const fluido = [...col.querySelectorAll('textarea')].find((t) => t.placeholder === 'Fluid')!;
      const s = getComputedStyle(pane);
      const libre = pane.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      const tope = Math.min(libre, 40 * parseFloat(getComputedStyle(document.documentElement).fontSize));
      return { tope, col: col.getBoundingClientRect().width, fluido: fluido.getBoundingClientRect().width };
    });
  expect(m.col, 'la columna, hasta su tope de 40rem').toBeCloseTo(m.tope, 0);
  expect(m.fluido, '«Fluid» llena su columna').toBeCloseTo(m.col, 0);
});

/* Lo que ocupa el ancho de su contenedor, puesto suelto en el lienzo (una fila flex), medía 0: Progress Bar no
 * enseñaba ninguna barra, y el Playground de Skeleton salía vacío (medido el 2026-10-05). */
for (const [slug, tag] of [
  ['progressbar', 'sc-progressbar'],
  ['skeleton', 'sc-skeleton'],
] as const) {
  test(`${slug}: cada <${tag}> del lienzo se ve, no mide 0`, async ({ page }) => {
    await gotoPage(page, slug);
    const anchos = await page.locator(`.sb-canvas__pane ${tag}`).evaluateAll((els) =>
      els.map((e) => {
        // Un host con `display: contents` no tiene caja (mide 0 siempre): lo que se pinta es su primer hijo.
        const caja = getComputedStyle(e).display === 'contents' ? (e.firstElementChild ?? e) : e;
        return Math.round(caja.getBoundingClientRect().width);
      }),
    );
    expect(anchos.length, `${slug}: hay <${tag}> en el lienzo`).toBeGreaterThan(0);
    for (const w of anchos) expect(w, `${slug} · <${tag}>`).toBeGreaterThan(24);
  });
}

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
