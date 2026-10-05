import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Red del Dashboard (adaptación del Monitor del Supervisor).
 *
 * Nació de dos defectos que llegaron a revisión antes que a ninguna prueba (2026-09-14): el asistente de
 * widget cambiaba de tamaño hasta 76 px al tocar una categoría, y la rejilla no tenía comprobado
 * ningún ancho de tablet o móvil. Mide geometría, no aspecto: una captura no ve un salto que dura
 * lo que tarda en cargar la lista.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Cajas del asistente que no deben moverse mientras se configura un widget. */
const geometria = (page: Page) =>
  page.evaluate(() =>
    Object.fromEntries(
      ['.p-dialog', '.assistant__stage', 'p-listbox', '.assistant__description', 'sc-select'].map((sel) => {
        const r = document.querySelector(sel)?.getBoundingClientRect();
        return [sel, r ? [r.x, r.y, r.width, r.height].map(Math.round).join(',') : null];
      }),
    ),
  );

test('el asistente de widget no cambia de tamaño al cambiar de categoría', async ({ page }) => {
  await goto(page, 'dashboard');
  await page.getByRole('button', { name: 'Añadir widget' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('p-listbox')).toBeVisible();

  const base = await geometria(page);
  expect(Object.values(base).every(Boolean), `falta alguna caja del asistente: ${JSON.stringify(base)}`).toBe(true);

  for (const categoria of ['Grupos', 'Agentes', 'Nodo IA', 'Tipificaciones', 'Campañas', 'Servicios']) {
    const radio = dialog.getByRole('radio', { name: categoria });
    await radio.click();
    await expect(radio).toHaveAttribute('aria-checked', 'true');
    expect(await geometria(page), `saltó al elegir «${categoria}»`).toEqual(base);
  }
});

test('el ⋮ de un widget dice en el foco que abre un menú, y si ya está abierto (DD-171)', async ({ page }) => {
  await goto(page, 'dashboard');
  // Acotado a un widget (sc-dashboard-widget-card): la pestaña del monitor tiene su propio ⋮, con el mismo
  // texto de aria-label pero sin popup que anunciar aquí (otro componente, monitor-tabs).
  const masAcciones = page.locator('sc-dashboard-widget-card').first().getByRole('button', { name: /^Más acciones de / });
  await expect(masAcciones).toHaveAttribute('aria-haspopup', 'menu');
  await expect(masAcciones).toHaveAttribute('aria-expanded', 'false');
  const controla = await masAcciones.getAttribute('aria-controls');
  expect(controla, 'apunta al id del p-menu').toBeTruthy();

  await masAcciones.click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('id', `${controla}_list`);
  await expect(masAcciones).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(masAcciones).toHaveAttribute('aria-expanded', 'false');
});

test('pulsar otra pestaña cambia el monitor que se ve', async ({ page }) => {
  await goto(page, 'dashboard');
  const pestanas = page.getByRole('tab');
  await expect(pestanas).toHaveCount(2);
  const titulos = () => page.locator('sc-dashboard-widget-card h2').allTextContents();
  const antes = await titulos();

  await pestanas.nth(1).click();
  await expect(pestanas.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect.poll(titulos).not.toEqual(antes);
});

for (const ancho of [1440, 1024, 768, 390]) {
  test(`la rejilla cabe sin scroll lateral a ${ancho}px`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 900 });
    await goto(page, 'dashboard');
    await expect(page.locator('sc-dashboard-widget-card').first()).toBeVisible();
    /* Se mide con las fuentes cargadas. Medido el 2026-09-27, en `main` igual que en la rama: al pintarse la
     * primera tarjeta, la fuente de iconos aún está cargando, los iconos de la barra se leen como palabras
     * («notifications», «play_arrow») y la barra mide 707 en vez de 632. A 768 eso eran 47 px de scroll que
     * un momento después ya no estaban. Un desborde de verdad sigue ahí después de cargar. */
    await page.evaluate(() => document.fonts.ready);

    /* El scroll de la app vive en `main`, no en el documento: medido con el desborde fabricado, el del
     * documento daba 0 igual. */
    const medida = await page.evaluate(() => ({
      scroll: Math.max(
        ...[document.documentElement, document.querySelector('main#main-content')].map((e) => (e ? e.scrollWidth - e.clientWidth : 0)),
      ),
      fuera: [...document.querySelectorAll('sc-dashboard-widget-card')]
        .map((c) => c.getBoundingClientRect())
        .filter((r) => r.right > window.innerWidth + 1 || r.left < -1).length,
    }));
    expect(medida).toEqual({ scroll: 0, fuera: 0 });
  });
}

test('la leyenda del anillo va pegada a su cifra, no detrás de la flecha invisible', async ({ page }) => {
  /* «5 de 9 conectados» es una pieza: la leyenda completa la cifra. Medido el 2026-09-27: la flecha de «ver el
   * detalle», invisible hasta pasar el ratón pero ocupando su sitio, quedaba entre el anillo y la leyenda y los
   * separaba 36 px en vez de 14 (DD-125). Se mide del borde del anillo (su caja) a la leyenda. */
  await goto(page, 'dashboard');
  const anillo = page.locator('.kpi--ring').first();
  await expect(anillo).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const hueco = await anillo.evaluate((k) => {
    const gauge = k.querySelector('sc-gauge')!.getBoundingClientRect();
    const leyenda = k.querySelector('.kpi__caption')!.getBoundingClientRect();
    return Math.round((leyenda.left - gauge.right) * 10) / 10;
  });
  expect(hueco, 'del anillo a «de N conectados»').toBeLessThanOrEqual(14.5);
});

test('en el primer monitor, la tabla, el anillo y su detalle cuentan los mismos agentes', async ({ page }) => {
  /* Medido el 2026-09-27 (DD-127): la cabecera de la tabla nombraba 10 agentes y la tabla enseñaba 8, y el detalle
   * del anillo daba por disponibles a Denzel, en pausa en la tabla, y a Leonardo, desconectado. Aquí se mide sobre
   * lo pintado: una fila por agente de la cabecera, y el anillo y su detalle cuentan los estados de esas filas. */
  await goto(page, 'dashboard');
  const tabla = page.locator('sc-dashboard-widget-card').filter({ has: page.locator('sc-dashboard-agents-table') });
  await expect(tabla.locator('tbody tr').first()).toBeVisible();
  const { nombrados, filas } = await tabla.evaluate((card) => ({
    nombrados: (card.querySelector('.widget__entities')?.getAttribute('title') ?? '').split(', ').filter(Boolean),
    filas: [...card.querySelectorAll('tbody tr')].map((tr) => ({
      nombre: tr.querySelector('.agents-table__agent')?.textContent?.trim() ?? '',
      estado: tr.querySelector('sc-badge')?.getAttribute('aria-label') ?? '',
    })),
  }));
  expect(filas.map((f) => f.nombre), 'una fila por agente que nombra la cabecera').toEqual(nombrados);

  const disponibles = filas.filter((f) => f.estado === 'Disponible').map((f) => f.nombre);
  const conectados = filas.filter((f) => f.estado !== 'Desconectado').length;
  const anillo = page.locator('.kpi--ring').first();
  await expect(anillo.locator('.sc-gauge__value'), 'el anillo cuenta los disponibles de la tabla').toHaveText(String(disponibles.length));
  await expect(anillo.locator('.kpi__caption'), 'y los conectados').toHaveText(`de ${conectados} conectados`);

  await anillo.locator('.kpi__open').click();
  const quien = page.locator('.p-drawer .detail__who .sc-text-body-semibold');
  await expect(quien, 'el detalle lista tantos como dice el anillo').toHaveCount(disponibles.length);
  expect(await quien.allTextContents(), 'y son los disponibles de la tabla').toEqual(disponibles);
});

test('en «Colas y agentes», el panel de grupos cuenta agentes reales, no una cifra que escale con las colas', async ({ page }) => {
  /* DD-127 dejaba esto anotado como "no cubierto": `buildWidget`, case `group-panel`, sacaba «conectados» de
   * `int(3,4) * n` (n = colas del panel, 4 aquí) — 12 o 16, sin relación con los 10 agentes reales de la demo
   * (entonces 9 conectados y 5 disponibles). El detalle truncaba en silencio a los 9 que hay de verdad: la cifra
   * de arriba no tenía techo, el detalle sí. Las cifras esperadas son las de la tabla del primer monitor, que
   * enseña a esos 10 agentes con su estado de Administración (DD-139): la prueba no depende de cuántos hay en
   * cada estado, y una cifra que escale con las colas la sigue tumbando. */
  await goto(page, 'dashboard');
  const tabla = page.locator('sc-dashboard-widget-card').filter({ has: page.locator('sc-dashboard-agents-table') });
  await expect(tabla.locator('tbody tr').first()).toBeVisible();
  const estados = await tabla.locator('tbody tr sc-badge').evaluateAll((badges) => badges.map((b) => b.getAttribute('aria-label')));
  expect(estados.length, 'la tabla del primer monitor enseña a los 10 agentes de la demo').toBe(10);
  const conectados = estados.filter((e) => e !== 'Desconectado').length;
  const disponibles = estados.filter((e) => e === 'Disponible').length;

  await page.getByRole('tab').nth(1).click();
  const panel = page.locator('sc-dashboard-widget-card').filter({ has: page.locator('sc-dashboard-group-panel') });
  await expect(panel).toBeVisible();

  const stat = (etiqueta: string) => panel.locator('.panel__stat', { hasText: etiqueta });
  await expect(stat('Conectados').locator('.panel__digits'), 'los agentes de la demo que no están desconectados').toHaveText(String(conectados));
  await expect(stat('Disponibles').locator('.panel__digits'), 'los agentes de la demo disponibles').toHaveText(String(disponibles));

  await stat('Conectados').locator('.panel__open').click();
  const quien = page.locator('.p-drawer .detail__who .sc-text-body-semibold');
  await expect(quien, 'el detalle lista tantos como dice la cifra de arriba, sin truncar en silencio').toHaveCount(conectados);
});

test('con textos largos (`?datos=tortura`), la tabla cabe en su tarjeta, los títulos no se recortan y el detalle es de una línea', async ({ page }) => {
  /* Medido el 2026-09-27 con los nombres estirados (DD-124): el nombre de agente empujaba las cifras 183 px fuera de
   * la tarjeta, sin «Transferidas» ni «T. medio»; «Tabla de agentes» se recortaba antes que la lista de a quién
   * vigila; y en el detalle del anillo cada nombre bajaba a tres líneas. Una tabla recorta el nombre con «…» y
   * lleva el entero en el `title`; las cifras y sus cabeceras, en una línea. */
  await goto(page, 'dashboard?datos=tortura');
  const tabla = page.locator('sc-dashboard-widget-card').filter({ has: page.locator('sc-dashboard-agents-table') });
  await expect(tabla.locator('tbody tr').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  const medida = await tabla.evaluate((card) => {
    const anchoDelTexto = (el: Element): number => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return r.getBoundingClientRect().width;
    };
    const scroller = card.querySelector('.p-datatable-table-container')!;
    return {
      fuera: scroller.scrollWidth - scroller.clientWidth,
      // Una etiqueta en línea partida en dos devuelve dos rectángulos.
      cabecerasPartidas: [...card.querySelectorAll('thead .sc-datatable__header-label')].filter((l) => l.getClientRects().length > 1).map((l) => l.textContent?.trim()),
      nombresSinEntero: [...card.querySelectorAll('tbody tr .agents-table__agent')]
        .map((c) => c.textContent?.trim() ?? '')
        .filter((nombre, i) => ![...card.querySelectorAll('tbody tr')][i].querySelector(`[title="${CSS.escape(nombre)}"]`)),
      titulosRecortados: [...document.querySelectorAll('.widget__title')]
        .filter((t) => anchoDelTexto(t) > t.getBoundingClientRect().width + 0.01)
        .map((t) => t.textContent?.trim()),
    };
  });
  expect(medida.fuera, 'la tabla no se sale de su tarjeta').toBe(0);
  expect(medida.cabecerasPartidas, 'las cabeceras, en una línea').toEqual([]);
  expect(medida.nombresSinEntero, 'cada nombre lleva el entero en el title').toEqual([]);
  expect(medida.titulosRecortados, 'el título cede después que la lista de a quién vigila').toEqual([]);

  await page.locator('.kpi--ring .kpi__open').first().click();
  const detalle = page.locator('.p-drawer');
  await expect(detalle.locator('tbody tr').first()).toBeVisible();
  const filas = await detalle.evaluate((d) => ({
    cabecerasPartidas: [...d.querySelectorAll('thead .sc-datatable__header-label')].filter((l) => l.getClientRects().length > 1).map((l) => l.textContent?.trim()),
    nombres: [...d.querySelectorAll('.detail__who .sc-text-body-semibold')].map((n) => ({
      texto: n.textContent?.trim() ?? '',
      lineas: Math.round(n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).lineHeight)),
      entero: n.getAttribute('title'),
    })),
  }));
  expect(filas.cabecerasPartidas, 'la cabecera del detalle, en una línea').toEqual([]);
  expect(filas.nombres.filter((n) => n.lineas > 1).map((n) => n.texto), 'cada nombre en una línea').toEqual([]);
  expect(filas.nombres.filter((n) => n.entero !== n.texto).map((n) => n.texto), 'y con el entero en el title').toEqual([]);
});


for (const datos of ['demo', 'tortura'] as const) {
  test(`el detalle de «Conversaciones en curso» cabe en su panel sin cortar el tiempo (datos ${datos})`, async ({ page }) => {
    /* Medido en producción el 2026-09-28 a 1440: el panel medía los 20rem de PrimeNG y la segunda línea de cada
     * conversación («Cliente #56705 · Atención al cliente») no cedía ancho, así que la tabla medía 300 px en una caja
     * de 287,5 y el tiempo salía cortado («9:1»). La prueba de tortura de arriba abre el detalle del anillo, cuya
     * segunda línea es un estado corto, y no lo veía. Con los datos de siempre no se recorta nada; con tortura, las
     * dos líneas recortan con «…» y llevan el entero en el `title` (DD-124). */
    await goto(page, `dashboard?datos=${datos}`);
    const tarjeta = page
      .locator('sc-dashboard-widget-card')
      .filter({ has: page.getByRole('heading', { name: 'Conversaciones en curso' }) });
    await tarjeta.locator('.kpi__open').click();
    const detalle = page.locator('.p-drawer');
    await expect(detalle.locator('tbody tr').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const medida = await detalle.evaluate((d) => {
      const scroller = d.querySelector('.p-datatable-table-container')!;
      const borde = scroller.getBoundingClientRect().right;
      const lineas = [...d.querySelectorAll('.detail__name, .detail__sub')];
      return {
        fuera: scroller.scrollWidth - scroller.clientWidth,
        // `.detail__time` es un span en línea: su `scrollWidth` es 0. Se mide su borde contra el del contenedor.
        tiemposCortados: [...d.querySelectorAll('.detail__time')]
          .filter((t) => t.getBoundingClientRect().right > borde + 0.5)
          .map((t) => t.textContent?.trim()),
        recortadas: lineas.filter((l) => l.scrollWidth > l.clientWidth).map((l) => l.textContent?.trim()),
        sinEntero: lineas.filter((l) => l.getAttribute('title') !== l.textContent?.trim()).map((l) => l.textContent?.trim()),
      };
    });
    expect(medida.fuera, 'la tabla no se sale del panel').toBe(0);
    expect(medida.tiemposCortados, 'ningún tiempo cortado por el borde').toEqual([]);
    expect(medida.sinEntero, 'cada línea lleva el entero en el title').toEqual([]);
    if (datos === 'demo') expect(medida.recortadas, 'con los datos de siempre no se recorta nada').toEqual([]);
    else expect(medida.recortadas.length, 'los textos de tortura no caben: si nada recorta, la prueba no prueba').toBeGreaterThan(0);
  });
}
