import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL NOMBRE DE LA FICHA SE QUEDA ARRIBA AL BAJAR, Y BORRARLA PIDE ESCRIBIRLO (DD-145).
 *
 * La segunda revisión con el equipo (2026-10-01) pidió el nombre del grupo fijo arriba al bajar: en Distribución y
 * colas, la sección más larga (1865 px de recorrido a 1440×900), el nombre se iba con la cabecera y no quedaba nada
 * que dijera qué grupo se edita. Lo que fija, en las tres fichas:
 *   1. Al bajar, el nombre y su línea de datos siguen donde estaban, encima del contenido, y lo que pasa por debajo
 *      no se ve a través.
 *   2. En reposo lo que se ve y se pulsa es la cabecera de verdad (el nombre se edita en su sitio), y la copia de
 *      arriba no se oye: un solo `h1`.
 *   3. Por debajo de 1340 la cabecera va a todo lo ancho, encima del resumen: la copia sale solo cuando queda fija en
 *      la columna del contenido, sin tapar la franja del resumen.
 *   4. Un salto de canal («Ir a») deja el título del canal debajo del nombre fijo, no tapado por él.
 *   5. Borrar pide escribir el nombre (`sc-delete-entity-dialog` en modo `single`): «Eliminar» espera al nombre
 *      exacto.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Las que tienen recorrido de verdad (medido el 2026-10-01): a 1440×900 solo Distribución y colas no cabe. */
const LARGAS = [
  { ruta: 'admin/grupos/editar/11?seccion=distribucion', ancho: 1440, alto: 900 },
  { ruta: 'admin/agentes/editar/1?seccion=grupos', ancho: 1366, alto: 768 },
  { ruta: 'admin/usuarios/editar/1?seccion=acceso', ancho: 1366, alto: 768 },
] as const;

/** Mide con las fuentes cargadas: antes, la de iconos ocupa el ancho de su ligadura. */
const fuentes = (page: Page) => page.evaluate(() => document.fonts.ready.then(() => undefined));

/** El primer texto de la cabecera de verdad (el nombre y su línea de datos): su caja y lo que dice. */
const cabecera = (page: Page) =>
  page.evaluate(() => {
    const texto = (sel: string) => {
      const el = document.querySelector(`.ficha-rail > .headline ${sel}`)!;
      const paseo = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let t = paseo.nextNode();
      while (t && !t.textContent?.trim()) t = paseo.nextNode();
      const rango = document.createRange();
      rango.selectNodeContents(t!);
      const r = rango.getBoundingClientRect();
      return { x: r.left, y: r.top, alto: r.height, texto: t!.textContent!.trim() };
    };
    return { nombre: texto('.headline__name'), meta: texto('.headline__meta') };
  });

/** Lo que se ve en un punto: el texto del elemento de arriba del todo, y si es la cabecera de verdad o una copia muda. */
const enElPunto = (page: Page, x: number, y: number) =>
  page.evaluate(
    ([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return {
        texto: el?.textContent?.trim() ?? '',
        cabecera: !!el?.closest('.ficha-rail > .headline'),
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
  test(`${f.ruta} · al bajar, el nombre y sus datos se quedan donde estaban, encima del contenido`, async ({ page }) => {
    await page.setViewportSize({ width: f.ancho, height: f.alto });
    await goto(page, f.ruta);
    await fuentes(page);
    const recorrido = await page.evaluate(() => {
      const m = document.querySelector('main#main-content')!;
      return m.scrollHeight - m.clientHeight;
    });
    expect(recorrido, 'la sección tiene que dar para bajar: si cabe, esta prueba no mide nada').toBeGreaterThan(50);
    const reposo = await cabecera(page);

    expect(await bajar(page, 99999), 'ha bajado').toBeGreaterThan(50);
    for (const linea of [reposo.nombre, reposo.meta]) {
      const visto = await enElPunto(page, linea.x + 4, linea.y + linea.alto / 2);
      expect(visto.texto, `«${linea.texto}» sigue a la vista donde estaba`).toBe(linea.texto);
      expect(visto.muda, 'la copia de arriba no se oye: el título de verdad es el h1').toBe(true);
    }
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });
}

test('en reposo, lo que se ve y se pulsa es la cabecera de verdad, y hay un solo h1', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await fuentes(page);
  const reposo = await cabecera(page);
  const visto = await enElPunto(page, reposo.nombre.x + 4, reposo.nombre.y + reposo.nombre.alto / 2);
  expect(visto.cabecera, 'el nombre que se pulsa para editarlo es el de la cabecera').toBe(true);
  expect(visto.muda).toBe(false);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(reposo.nombre.texto);
});

test('por debajo de 1340 la copia sale solo al quedar fija, en la columna del contenido, sin tapar el resumen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await fuentes(page);
  const reposo = await cabecera(page);

  // Un poco: la cabecera de arriba se va y la franja del resumen sigue a la vista, sin nada encima.
  await bajar(page, 40);
  const franja = await page.evaluate(() => {
    const r = document.querySelector('.ficha-summary')!.getBoundingClientRect();
    return { x: r.left + 12, y: Math.max(r.top + 12, 70) };
  });
  expect((await enElPunto(page, franja.x, franja.y)).resumen, 'la franja del resumen no queda tapada').toBe(true);

  // Del todo: el nombre, arriba de la columna del contenido, a la altura del índice.
  await bajar(page, 99999);
  const punto = await page.evaluate(() => {
    const contenido = document.querySelector('.ficha-rail > .page__main')!.getBoundingClientRect();
    const indice = document.querySelector('.ficha-rail > .page__rail')!.getBoundingClientRect();
    return { x: contenido.left + 4, y: indice.top + 10 };
  });
  const visto = await enElPunto(page, punto.x, punto.y);
  expect(visto.texto, 'el nombre, arriba de la columna del contenido').toBe(reposo.nombre.texto);
  expect(visto.muda).toBe(true);
});

test('un salto de canal deja el título del canal debajo del nombre fijo, no tapado', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await fuentes(page);
  const reposo = await cabecera(page);
  const finDelNombre = reposo.meta.y + reposo.meta.alto;
  // Chat y no Email: Email es el último y el salto no lo puede subir hasta arriba, así que no se mediría nada.
  await page.getByRole('navigation', { name: 'Canales de esta sección' }).getByRole('link', { name: 'Chat', exact: true }).click();
  const titulo = page.locator('#group-channel-chat-title');
  await expect(titulo).toBeFocused();
  const arriba = await titulo.evaluate((el) => el.getBoundingClientRect().top);
  expect(arriba, 'el salto lleva el canal arriba: si no sube, esta prueba no mide nada').toBeLessThan(finDelNombre + 120);
  expect(arriba, 'el título del canal queda debajo de la línea de datos del nombre fijo').toBeGreaterThan(finDelNombre);
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
