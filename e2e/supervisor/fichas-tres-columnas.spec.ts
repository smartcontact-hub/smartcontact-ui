import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LAS FICHAS EN TRES COLUMNAS: EL NOMBRE ENCIMA DEL ÍNDICE, Y EL CONTENIDO Y EL RESUMEN ARRIBA (DD-170, que enmienda
 * DD-144).
 *
 * El marco de la ficha de grupo en Figma (Landing page, 2467:7078) sube el nombre a la columna del índice y deja la
 * página en tres columnas sin fila de cabecera: a la izquierda quién es y dónde estás, en el centro la sección y a la
 * derecha el resumen. Medido antes, a 1440: el nombre en la columna del contenido (x=332, y=79) y la tarjeta 56 px
 * por debajo (y=135).
 *
 * Lo que fija, en las tres fichas, al crear y al editar:
 *   1. A 1440, el nombre va arriba de la columna del índice, y la tarjeta y el resumen arrancan a su altura.
 *   2. Del nombre al índice, el hueco de la columna (14).
 *   3. La columna del contenido es la que crece: índice 196 y resumen 240 en cualquier ancho.
 *   4. El resumen no enseña su rótulo, y la región conserva su nombre («Resumen»).
 *   5. «Eliminar» va bajo el índice al editar, a 28 de su última fila (el aire entre grupos); en el alta no hay.
 *   6. Por debajo de 1340: el nombre sigue encima del índice, y el resumen pasa a una franja encima del contenido, en
 *      su columna.
 *   7. Un nombre que no cabe en 196 salta a una segunda línea, sin cortarse; uno que no cabe en dos, se corta en la
 *      segunda. Al pulsarlo para editarlo (el campo es de una línea), lo de debajo no se mueve.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const FICHAS = [
  { ruta: 'admin/grupos/editar/11', edita: true },
  { ruta: 'admin/grupos/crear', edita: false },
  { ruta: 'admin/agentes/editar/1', edita: true },
  { ruta: 'admin/agentes/crear', edita: false },
  { ruta: 'admin/usuarios/editar/1', edita: true },
  { ruta: 'admin/usuarios/crear', edita: false },
] as const;

/** Mide con las fuentes cargadas: antes, la de iconos ocupa el ancho de su ligadura y las filas miden otra cosa. */
const fuentes = (page: Page) => page.evaluate(() => document.fonts.ready.then(() => undefined));

const cajas = async (page: Page) => {
  await fuentes(page);
  return page.evaluate(() => {
    const caja = (sel: string) => {
      const r = document.querySelector(sel)?.getBoundingClientRect();
      return r ? { top: Math.round(r.top), left: Math.round(r.left), bottom: Math.round(r.bottom), ancho: Math.round(r.width) } : null;
    };
    return {
      indice: caja('.page__rail'),
      titulo: caja('main#main-content h1'),
      datos: caja('.headline__meta'),
      menu: caja('.page__rail sc-form-section-nav'),
      contenido: caja('.page__main'),
      tarjeta: caja('.page__main sc-section-card'),
      resumen: caja('.ficha-summary'),
      tituloEnElIndice: !!document.querySelector('.page__rail h1'),
    };
  });
};

for (const f of FICHAS) {
  test(`${f.ruta} · el nombre va encima del índice, y la tarjeta y el resumen arrancan a su altura`, async ({ page }) => {
    await goto(page, f.ruta);
    const m = await cajas(page);
    expect(m.tituloEnElIndice, 'el nombre, en la columna del índice').toBe(true);
    expect(m.titulo!.top, 'el nombre, arriba de su columna').toBe(m.indice!.top);
    expect(m.titulo!.left, 'el nombre, en la vertical del índice').toBe(m.indice!.left);
    expect(m.tarjeta!.top, 'la tarjeta, a la altura del nombre').toBe(m.indice!.top);
    expect(m.resumen!.top, 'el resumen, a la altura del nombre').toBe(m.indice!.top);
    expect(m.menu!.top - m.datos!.bottom, 'del nombre al índice, el hueco de la columna').toBe(14);
  });
}

test('la columna del contenido es la que crece: índice 196 y resumen 240 en cualquier ancho', async ({ page }) => {
  // 1920: la página llega a su tope (1600), y el contenido se queda con todo lo que sobra.
  for (const [ancho, contenido] of [
    [1440, 812],
    [1920, 1052],
  ] as const) {
    await page.setViewportSize({ width: ancho, height: 900 });
    await goto(page, 'admin/grupos/editar/11');
    const m = await cajas(page);
    expect(m.indice!.ancho, `${ancho}: el índice`).toBe(196);
    expect(m.resumen!.ancho, `${ancho}: el resumen`).toBe(240);
    expect(m.contenido!.ancho, `${ancho}: el contenido`).toBe(contenido);
  }
});

test('el resumen no enseña su rótulo, y la región conserva su nombre', async ({ page }) => {
  for (const { ruta } of FICHAS) {
    await goto(page, ruta);
    await expect(page.getByRole('region', { name: 'Resumen' }), ruta).toBeVisible();
    const alto = await page.locator('.ficha-summary .resumen__title').evaluate((e) => e.getBoundingClientRect().height);
    expect(alto, `${ruta}: el rótulo, oculto a la vista`).toBeLessThanOrEqual(1);
  }
});

test('«Eliminar» va bajo el índice al editar, y en el alta no hay', async ({ page }) => {
  for (const { ruta, edita } of FICHAS) {
    await goto(page, ruta);
    const eliminar = page.locator('.page__rail').getByRole('button', { name: 'Eliminar', exact: true });
    if (!edita) {
      await expect(eliminar, ruta).toHaveCount(0);
      continue;
    }
    await expect(eliminar, ruta).toBeVisible();
    await fuentes(page);
    const aire = await page.evaluate(() => {
      const filas = document.querySelectorAll('.page__rail .form-nav__item');
      const ultima = filas[filas.length - 1]!.getBoundingClientRect();
      const boton = document.querySelector('.page__rail .ficha-eliminar .p-button')!.getBoundingClientRect();
      return Math.round(boton.top - ultima.bottom);
    });
    expect(aire, `${ruta}: de la última fila del índice a «Eliminar»`).toBe(28);
  }
});

test('por debajo de 1340: el nombre sigue encima del índice, y el resumen va en una franja encima del contenido', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const { ruta } of FICHAS) {
    await goto(page, ruta);
    const m = await cajas(page);
    expect(m.titulo!.top, `${ruta}: el nombre, arriba de la columna del índice`).toBe(m.indice!.top);
    expect(m.titulo!.left, `${ruta}: el nombre, en la vertical del índice`).toBe(m.indice!.left);
    expect(m.resumen!.top, `${ruta}: la franja del resumen, a la altura del nombre`).toBe(m.indice!.top);
    expect(m.resumen!.left, `${ruta}: la franja, en la columna del contenido`).toBe(m.contenido!.left);
    expect(m.resumen!.bottom, `${ruta}: la franja, encima del contenido`).toBeLessThanOrEqual(m.contenido!.top);
  }
});

/** El nombre del grupo, escrito en el campo de General: el título lo sigue según se escribe. */
const nombrar = async (page: Page, nombre: string) => {
  await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(nombre);
  await expect(page.locator('main#main-content h1')).toContainText(nombre.slice(0, 12));
  await fuentes(page);
  // El texto del título: el del Inplace al editar, el del propio `h1` en el alta.
  return page.evaluate(() => {
    const h1 = document.querySelector('main#main-content h1')!;
    const texto = (h1.querySelector('.name-inplace__text') ?? h1) as HTMLElement;
    const lineas = Math.round(texto.getBoundingClientRect().height / parseFloat(getComputedStyle(texto).lineHeight));
    return { lineas, cortado: texto.scrollHeight > texto.clientHeight + 1 };
  });
};

for (const ruta of ['admin/grupos/crear', 'admin/grupos/editar/11']) {
  test(`${ruta} · un nombre que no cabe en 196 salta a la segunda línea; uno que no cabe en dos, se corta en ella`, async ({
    page,
  }) => {
    await goto(page, ruta);
    // 270 px a la letra del título: no cabe en una línea de 196, y sí en dos.
    const largo = await nombrar(page, 'Atención al cliente Madrid Norte');
    expect(largo, 'en dos líneas, entero').toEqual({ lineas: 2, cortado: false });
    const enorme = await nombrar(page, 'Atención al cliente de la delegación de Madrid Norte y Castilla-La Mancha');
    expect(enorme, 'en dos líneas, cortado al final de la segunda').toEqual({ lineas: 2, cortado: true });
  });
}

test('al pulsar un nombre de dos líneas para editarlo, lo de debajo no se mueve', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  expect((await nombrar(page, 'Atención al cliente Madrid Norte')).lineas, 'el nombre, en dos líneas').toBe(2);
  const arribaDelIndice = () => page.locator('.page__rail sc-form-section-nav').evaluate((el) => el.getBoundingClientRect().top);
  const antes = await arribaDelIndice();
  // El campo es de una línea: sin conservar el alto del título, el índice subía 24 px.
  await page.locator('.name-inplace .p-inplace-display').click();
  await expect(page.locator('.name-inplace__input')).toBeFocused();
  expect(await arribaDelIndice(), 'editando, el índice donde estaba').toBe(antes);
  await page.keyboard.press('Escape');
  await expect(page.locator('.name-inplace__input')).toHaveCount(0);
  expect(await arribaDelIndice(), 'al cerrar, también').toBe(antes);
});

test('al editar el nombre, el campo no tapa la línea de datos', async ({ page }) => {
  for (const ruta of ['admin/grupos/editar/11', 'admin/agentes/editar/1']) {
    await goto(page, ruta);
    await fuentes(page);
    await page.locator('.name-inplace .p-inplace-display').click();
    const campo = page.locator('.name-inplace__input');
    await expect(campo, ruta).toBeFocused();
    const m = await page.evaluate(() => {
      const meta = document.querySelector('.headline__meta')!;
      const rango = document.createRange();
      rango.selectNodeContents(meta);
      return {
        campo: document.querySelector('.name-inplace__input')!.getBoundingClientRect().bottom,
        datos: rango.getBoundingClientRect().top,
      };
    });
    // Con 0 entre los dos, el borde del campo caía en y=109 y el texto de los datos empezaba en 102,75.
    expect(m.campo, `${ruta}: el campo acaba antes que la línea de datos`).toBeLessThanOrEqual(m.datos);
    await page.keyboard.press('Escape');
  }
});
