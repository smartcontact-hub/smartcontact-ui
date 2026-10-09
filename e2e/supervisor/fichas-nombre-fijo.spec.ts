import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL NOMBRE DE LA FICHA SE QUEDA A LA VISTA AL BAJAR, Y BORRARLA PIDE ESCRIBIRLO (DD-145 y DD-170).
 *
 * La segunda revisión con el equipo (2026-10-01) pidió el nombre del grupo fijo arriba al bajar: en Distribución y
 * colas, la sección más larga (1865 px de recorrido a 1440×900), el nombre se iba con la cabecera y no quedaba nada
 * que dijera qué grupo se edita. Desde DD-170 el nombre vive en la columna del índice, que ya se queda fija al bajar:
 * la copia muda de arriba (`sc-nombre-fijo`) sobra. Lo que fija, en las tres fichas:
 *   1. Al bajar, el nombre y su línea de datos siguen donde estaban, y lo que se ve ahí es la cabecera de verdad: un
 *      solo `h1`, el nombre escrito una sola vez y ninguna copia.
 *   2. Por debajo de 1340, igual: el nombre sigue encima del índice al bajar, y la franja del resumen no queda tapada.
 *   3. Un salto de canal («Ir a») deja el título del canal arriba y a la vista: nada fijo lo tapa.
 *   4. Borrar pide escribir el nombre (`sc-delete-entity-dialog` en modo `single`): «Eliminar» espera al nombre
 *      exacto.
 *
 * Cambió con DD-187: la ficha de agente mide en Configuración con «Avanzado» abierto. Su sección Grupos, la de antes,
 * ya no da para bajar: su tabla llega al pie y se desplaza dentro (DD-187 §7).
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Las que tienen recorrido de verdad: a 1440×900 solo Distribución y colas no cabe. Agente y usuario, a 1366×660 (el
 * portátil con el navegador abierto): con el contenido arriba (DD-170), a 768 solo bajaban 43 px. El agente, en
 * Configuración con su subsección plegada «Avanzado» abierta (`abrir`): medido el 2026-10-09, 661 px de recorrido, y
 * 203 con ella plegada. */
const LARGAS: readonly { ruta: string; ancho: number; alto: number; abrir?: string }[] = [
  { ruta: 'admin/grupos/editar/11?seccion=distribucion', ancho: 1440, alto: 900 },
  { ruta: 'admin/agentes/editar/1?seccion=configuracion', ancho: 1366, alto: 660, abrir: 'Avanzado' },
  { ruta: 'admin/usuarios/editar/1?seccion=acceso', ancho: 1366, alto: 660 },
  { ruta: 'admin/grupos/editar/11?seccion=distribucion', ancho: 1280, alto: 720 },
];

/** Mide con las fuentes cargadas: antes, la de iconos ocupa el ancho de su ligadura. */
const fuentes = (page: Page) => page.evaluate(() => document.fonts.ready.then(() => undefined));

/** El primer texto de la cabecera (el nombre y su línea de datos): su caja y lo que dice. */
const cabecera = (page: Page) =>
  page.evaluate(() => {
    const texto = (sel: string) => {
      const el = document.querySelector(`.page__rail .headline ${sel}`)!;
      const paseo = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let t = paseo.nextNode();
      while (t && !t.textContent?.trim()) t = paseo.nextNode();
      const rango = document.createRange();
      rango.selectNodeContents(t!);
      const r = rango.getClientRects()[0]!;
      return { x: r.left, y: r.top, alto: r.height, texto: t!.textContent!.trim() };
    };
    return { nombre: texto('.headline__name'), meta: texto('.headline__meta') };
  });

/** Lo que se ve en un punto: el texto del elemento de arriba del todo, y si es la cabecera o el resumen. */
const enElPunto = (page: Page, x: number, y: number) =>
  page.evaluate(
    ([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return {
        texto: el?.textContent?.trim() ?? '',
        cabecera: !!el?.closest('.page__rail .headline'),
        muda: !!el?.closest('[aria-hidden="true"]'),
        resumen: !!el?.closest('.ficha-summary'),
      };
    },
    [x, y] as const,
  );

const bajar = (page: Page, y: number) =>
  page.evaluate((y) => {
    const raiz = document.querySelector('main#main-content')!;
    raiz.scrollTo(0, y);
    return new Promise<number>((listo) => requestAnimationFrame(() => requestAnimationFrame(() => listo(raiz.scrollTop))));
  }, y);

for (const f of LARGAS) {
  test(`${f.ruta} a ${f.ancho} · al bajar, el nombre y sus datos se quedan donde estaban, y son la cabecera`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: f.ancho, height: f.alto });
    await goto(page, f.ruta);
    if (f.abrir) {
      const plegada = page.getByRole('button', { name: new RegExp(f.abrir) });
      await plegada.click();
      await expect(plegada).toHaveAttribute('aria-expanded', 'true');
    }
    await fuentes(page);
    const recorrido = await page.evaluate(() => {
      const m = document.querySelector('main#main-content')!;
      return m.scrollHeight - m.clientHeight;
    });
    expect(recorrido, 'la sección tiene que dar para bajar: si cabe, esta prueba no mide nada').toBeGreaterThan(50);
    const reposo = await cabecera(page);

    expect(await bajar(page, 99999), 'ha bajado').toBeGreaterThan(50);
    const bajado = await cabecera(page);
    for (const [antes, ahora] of [
      [reposo.nombre, bajado.nombre],
      [reposo.meta, bajado.meta],
    ] as const) {
      expect(Math.round(ahora.y), `«${antes.texto}», a la misma altura`).toBe(Math.round(antes.y));
      const visto = await enElPunto(page, ahora.x + 4, ahora.y + ahora.alto / 2);
      expect(visto.texto, `«${antes.texto}» sigue a la vista`).toContain(antes.texto);
      expect(visto.cabecera, 'lo que se ve es la cabecera de verdad').toBe(true);
      expect(visto.muda, 'y no una copia muda').toBe(false);
    }
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByText(reposo.nombre.texto, { exact: true }), 'el nombre, escrito una sola vez').toHaveCount(1);
    await expect(page.locator('sc-nombre-fijo'), 'sin copia').toHaveCount(0);
  });
}

test('por debajo de 1340, al bajar un poco, la franja del resumen no queda tapada', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await fuentes(page);
  await bajar(page, 40);
  const franja = await page.evaluate(() => {
    const r = document.querySelector('.ficha-summary')!.getBoundingClientRect();
    return { x: r.left + 12, y: Math.max(r.top + 12, 70) };
  });
  expect((await enElPunto(page, franja.x, franja.y)).resumen, 'la franja del resumen no queda tapada').toBe(true);
});

test('un salto de canal deja el título del canal arriba y a la vista, sin nada fijo encima', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await fuentes(page);
  // Chat y no Email: Email es el último y el salto no lo puede subir hasta arriba, así que no se mediría nada.
  await page.getByRole('navigation', { name: 'Canales de esta sección' }).getByRole('link', { name: 'Chat', exact: true }).click();
  const titulo = page.locator('#group-channel-chat-title');
  await expect(titulo).toBeFocused();
  const m = await titulo.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const zona = document.querySelector('main#main-content')!.getBoundingClientRect();
    const arriba = document.elementFromPoint(r.left + 4, r.top + r.height / 2);
    return { arriba: r.top - zona.top, visto: !!arriba && (arriba === el || el.contains(arriba)) };
  });
  expect(m.arriba, 'el salto lleva el canal arriba: si no sube, esta prueba no mide nada').toBeLessThan(160);
  expect(m.arriba, 'dentro de la zona que se desplaza').toBeGreaterThanOrEqual(0);
  expect(m.visto, 'nada lo tapa').toBe(true);
});

const BORRAR = [
  { ruta: 'admin/grupos/editar/11', listado: '/admin/grupos' },
  { ruta: 'admin/agentes/editar/1', listado: '/admin/agentes' },
  { ruta: 'admin/usuarios/editar/1', listado: '/admin/usuarios' },
] as const;

for (const b of BORRAR) {
  test(`${b.ruta} · borrar pide escribir el nombre: «Eliminar» espera al nombre exacto`, async ({ page }) => {
    await goto(page, b.ruta);
    const nombre = (await cabecera(page)).nombre.texto;
    await page.locator('.page__rail').getByRole('button', { name: 'Eliminar' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByText('Escribe el nombre para confirmar:')).toBeVisible();
    const confirmar = dialogo.getByTestId('delete-confirm-btn').getByRole('button');
    const campo = dialogo.getByRole('textbox');
    await expect(confirmar).toBeDisabled();
    await campo.fill(nombre.slice(0, -1));
    await expect(confirmar, 'un nombre a medias no basta').toBeDisabled();
    await campo.fill(nombre);
    await expect(confirmar).toBeEnabled();
    await confirmar.click();
    await expect(page).toHaveURL(new RegExp(`${b.listado}$`));
  });
}
