import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA IDENTIDAD DE LA PÁGINA SE DICE UNA VEZ — Y AHORA SE VE.
 *
 * Historia, porque el veredicto se ha movido dos veces y conviene no volver:
 *
 *   S59 ("todo arriba") quitó la banda de título de cada página y dejó la
 *   identidad SOLO en el breadcrumb de la TopBar. Cuatro páginas se quedaron a
 *   medias y decían su nombre DOS veces —barra y banda, misma clave i18n—; lo
 *   cazó Rafa en pantalla. El arreglo escondió el `<h1>` (`visually-hidden`):
 *   existía para lectores de pantalla y nadie lo veía.
 *
 *   Al medir la referencia (Snow UI, `/orders`) apareció que el título de
 *   página NO vive en la barra: vive en el CUERPO, con peso de subtítulo
 *   (16px/600) y sin banda. Lo que sobraba en S59 era el CHROME —icono, borde,
 *   sombra, sticky—, no el título. Así que el `<h1>` se destapa como
 *   `.page__heading`, y el trail gana un padre para que la barra y el título
 *   no digan la misma palabra.
 *
 * Lo que fija este fichero:
 *   1. Cada página tiene EXACTAMENTE UN `<h1>` — ni cero (documento sin
 *      encabezado) ni dos.
 *   2. En las páginas de CONTENIDO ese `<h1>` se VE (altura real, no 1px) y
 *      su texto coincide con la última miga.
 *   3. La miga de esas páginas tiene AL MENOS DOS tramos. Sin esto, el punto 2
 *      reintroduce el tartamudeo de S59: la barra diciendo "Reglas" y el
 *      cuerpo diciendo "Reglas" 95px más abajo.
 *   4. En los FORMULARIOS el `<h1>` sigue OCULTO: su identidad la pinta el
 *      chrome propio (cabecera sticky / ficha), y un título más sería el
 *      duplicado de siempre por otra puerta.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Una por familia de pantalla, incluidas las cuatro que estaban mal en S17. */
const CONTENIDO = [
  { ruta: 'admin/repositorios', nombre: 'hub de repositorios' },
  { ruta: 'admin/agendas', nombre: 'repositorio · agendas' },
  { ruta: 'config/aed/servicio', nombre: 'AED · servicio' },
  { ruta: 'config/aed/agentes', nombre: 'AED · agentes' },
  { ruta: 'config/aed/grupos', nombre: 'AED · grupos' },
  { ruta: 'config/seguridad', nombre: 'config · seguridad' },
  { ruta: 'admin/labels', nombre: 'labels' },
  { ruta: 'admin/usuarios', nombre: 'usuarios' },
  { ruta: 'admin/plantillas', nombre: 'plantillas' },
  { ruta: 'conversaciones/reglas', nombre: 'reglas' },
  { ruta: 'conversaciones/categorias', nombre: 'categorías' },
] as const;

/** Formularios: el `<h1>` se queda oculto a propósito. */
const FORMULARIOS = [
  { ruta: 'admin/usuarios/crear', nombre: 'alta de usuario' },
  { ruta: 'conversaciones/reglas/nueva', nombre: 'constructor de reglas' },
] as const;

const CRUMBS = 'sc-top-bar sc-breadcrumb .p-breadcrumb-list > li';

for (const { ruta, nombre } of CONTENIDO) {
  test(`${nombre} · la identidad se dice UNA vez, y se ve`, async ({ page }) => {
    await goto(page, ruta);

    const h1 = page.locator('main#main-content h1');
    await expect(h1).toHaveCount(1);

    const medido = await h1.evaluate((el: HTMLElement) => ({
      texto: (el.textContent ?? '').trim(),
      alto: Math.round(el.getBoundingClientRect().height),
      ancho: Math.round(el.getBoundingClientRect().width),
    }));

    // Se ve DE VERDAD: `.visually-hidden` lo dejaba en 1x1, así que cualquier
    // vuelta atrás a aquel modelo rompe aquí y no en una revisión visual.
    expect(medido.alto).toBeGreaterThanOrEqual(16);
    expect(medido.ancho).toBeGreaterThan(2);

    // Y dice lo mismo que la miga actual: si divergen, una de las dos miente
    // sobre dónde está el usuario.
    const crumbs = page.locator(CRUMBS);
    // Punto 3: sin padre, el título del cuerpo sería un eco de la barra.
    expect(await crumbs.count()).toBeGreaterThanOrEqual(2);
    expect(medido.texto).toBe((await crumbs.last().innerText()).trim());
  });
}

for (const { ruta, nombre } of FORMULARIOS) {
  test(`${nombre} · el h1 sigue oculto (lo pinta su propio chrome)`, async ({ page }) => {
    await goto(page, ruta);

    const h1 = page.locator('main#main-content h1');
    await expect(h1).toHaveCount(1);

    const alto = await h1.evaluate((el: HTMLElement) =>
      Math.round(el.getBoundingClientRect().height),
    );
    expect(alto).toBeLessThanOrEqual(2);
  });
}

/**
 * El título mide lo mismo en TODAS las páginas de contenido. Se comprueba
 * aparte porque lo garantiza una clase compartida (`.page__heading`) y una
 * regla encapsulada de componente le gana siempre a la global, sin avisar de
 * nada. Nació con un motivo concreto: 9 hojas de página arrastraban un
 * `.page__title` MUERTO de la banda de S59. Ese CSS ya está borrado (S22), así
 * que hoy este test vigila que no vuelva a aparecer una regla de página que
 * pise el tamaño del título en una ruta y no en las demás.
 */
test('el título de página mide igual en todas partes', async ({ page }) => {
  const medidas: { ruta: string; size: string; weight: string }[] = [];

  for (const { ruta } of CONTENIDO) {
    await goto(page, ruta);
    const h1 = page.locator('main#main-content h1');
    medidas.push({
      ruta,
      ...(await h1.evaluate((el: HTMLElement) => {
        const cs = getComputedStyle(el);
        return { size: cs.fontSize, weight: cs.fontWeight };
      })),
    });
  }

  const distintos = [...new Set(medidas.map((m) => `${m.size}/${m.weight}`))];
  expect(distintos, JSON.stringify(medidas, null, 1)).toHaveLength(1);
  // 16px/600 es lo medido en la referencia (`--sc-*-subtitle-1`).
  expect(distintos[0]).toBe('16px/600');
});
