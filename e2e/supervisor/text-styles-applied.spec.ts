import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LOS 12 TEXT STYLES, PUESTOS — Y MEDIDOS EN LA PANTALLA.
 *
 * Qué vigila y por qué existe (2026-09-10). `audit:text-styles` ya comprueba dos
 * cosas ESTÁTICAS: que las 12 clases `.sc-text-*` resuelven a su text style de
 * Figma, y que ninguna se pone encima de un `<sc-*>`. Lo que no puede ver es la
 * tercera, que es la que se rompe: **si la clase LLEGA al píxel**.
 *
 * El barrido de este día quitó `font-size` y `font-weight` de dos sitios que los
 * declaraban a mano (`styles/_forms.scss` y la hoja compartida de AED) y los
 * sustituyó por la clase en la plantilla. Ese cambio tiene un modo de fallo
 * silencioso y caro: si la clase no llegara —orden de hojas, especificidad, un
 * `@import` que el navegador hoistea—, la etiqueta no se queda sin estilo, se
 * queda HEREDANDO el del cuerpo (14px), y la pantalla sigue pareciendo correcta
 * de lejos. Ningún gate estático puede distinguir eso.
 *
 * Por eso los números van ESCRITOS y no leídos de un token: este spec es el
 * control independiente del gate estático (LEARNINGS #2, «cierra con una
 * observación que NO dependa de tu inventario»). Si alguien mueve el text style
 * en Figma, `audit:text-styles` se pone rojo primero y estos números se
 * actualizan a mano, a conciencia.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** `Caption/caption-semibold` — el text style de las etiquetas de campo desde el 2026-09-13.
 * Eran `caption-regular`; subieron a semibold en las seis pantallas a la vez para escribirse
 * igual que los rótulos de bloque, que rotulan lo mismo (hand-off DS, segunda vuelta a Servicio). */
const CAPTION_SEMIBOLD = { fontSize: '12px', lineHeight: '18px', fontWeight: '600' };
/** `Body/body-semibold` — el de los títulos de sección de AED. */
const BODY_SEMIBOLD = { fontSize: '14px', lineHeight: '20px', fontWeight: '600' };
/** `Body/body-regular` — el nombre de cada ajuste en la LISTA DE AJUSTES de Grupos. */
const BODY_REGULAR_AJUSTE = { fontSize: '14px', lineHeight: '20px', fontWeight: '400' };

const leer = async (page: import('@playwright/test').Page, selector: string) =>
  page.locator(selector).first().evaluate((el: HTMLElement) => {
    const cs = getComputedStyle(el);
    return { fontSize: cs.fontSize, lineHeight: cs.lineHeight, fontWeight: cs.fontWeight };
  });

/**
 * Las dos familias de pantalla, que ANTES del barrido medían distinto y por eso
 * están las dos aquí:
 *   · AED leía la hoja compartida `aed-defaults-page.component.scss`, con los
 *     tres ejes ya en tokens de ROL → la clase entró sin mover un píxel;
 *   · las de admin leían `styles/_forms.scss`, con `font-weight: medium` → ahí
 *     el peso BAJÓ de 500 a 400, que es la convergencia que se buscaba.
 * Si mañana solo una de las dos se rompe, este reparto lo dice.
 */
type Estilo = { fontSize: string; lineHeight: string; fontWeight: string };
const ETIQUETAS: ReadonlyArray<{
  ruta: string;
  nombre: string;
  selector?: string;
  estilo: Estilo;
  rol: string;
}> = [
  { ruta: 'config/aed/servicio', nombre: 'AED · servicio', estilo: CAPTION_SEMIBOLD, rol: 'Caption/caption-semibold' },
  /* Grupos dejó el formulario de campos el 2026-09-13: es una LISTA DE AJUSTES, nombre a la
   * izquierda y control a la derecha, y el nombre se lee como texto de fila, no como rótulo. */
  {
    ruta: 'config/aed/grupos',
    nombre: 'AED · grupos',
    selector: '.setting-row__label',
    estilo: BODY_REGULAR_AJUSTE,
    rol: 'Body/body-regular',
  },
  { ruta: 'admin/usuarios/crear', nombre: 'admin · alta de usuario', estilo: CAPTION_SEMIBOLD, rol: 'Caption/caption-semibold' },
  { ruta: 'admin/grupos/crear', nombre: 'admin · alta de grupo', estilo: CAPTION_SEMIBOLD, rol: 'Caption/caption-semibold' },
];

for (const { ruta, nombre, selector, estilo, rol } of ETIQUETAS) {
  test(`${nombre} · la etiqueta de campo mide ${rol}`, async ({ page }) => {
    await goto(page, ruta);
    const sel = selector ?? '.field__label';
    await expect(page.locator(sel).first()).toBeVisible();
    expect(await leer(page, sel), `${ruta}: la etiqueta no está midiendo el text style`).toEqual(
      estilo,
    );
  });
}

/**
 * LA MIGRACIÓN A LA CLASE (2026-09-11): 165 reglas de pantalla dejaron de declarar los tres
 * números en la hoja y sus elementos llevan ahora `.sc-text-*` en la plantilla. El modo de
 * fallo es el mismo de arriba —la clase no llega y el texto HEREDA— y se mide en dos textos
 * que antes tenían sus valores en la hoja: el nombre del agente en la lista de admin
 * (`Body/body-semibold`, el dato que identifica la fila) y la etiqueta del tema en Sistema
 * (`Body/body-regular`). Si la clase no pintara, el nombre bajaría a 400 y la etiqueta a 14/21.
 */
const BODY_REGULAR = { fontSize: '14px', lineHeight: '20px', fontWeight: '400' };

test('admin/agentes · el nombre del agente mide Body/body-semibold por la clase', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const nombre = page.locator('.cell-name').first();
  await expect(nombre).toBeVisible();
  await expect(nombre).toHaveClass(/sc-text-body-semibold/);
  expect(await leer(page, '.cell-name')).toEqual(BODY_SEMIBOLD);
});

test('config/sistema · la etiqueta del tema mide Body/body-regular por la clase', async ({ page }) => {
  await goto(page, 'config/sistema');
  const etiqueta = page.locator('.theme-row__label').first();
  await expect(etiqueta).toBeVisible();
  await expect(etiqueta).toHaveClass(/sc-text-body-regular/);
  expect(await leer(page, '.theme-row__label')).toEqual(BODY_REGULAR);
});

for (const ruta of ['config/aed/servicio', 'config/aed/agentes', 'config/aed/grupos'] as const) {
  test(`${ruta} · el título de sub-sección mide Body/body-semibold`, async ({ page }) => {
    await goto(page, ruta);
    await expect(page.locator('.sub-section__title').first()).toBeVisible();
    expect(await leer(page, '.sub-section__title')).toEqual(BODY_SEMIBOLD);
  });
}

/**
 * LA CAPA `app` GANA AL TEMA, Y HAY QUE VERLO EN EL NAVEGADOR.
 *
 * DD-66 movió la gramática de tabla-lista al TEMA (`@layer primeng`) y dejó la piel propia de
 * transcripciones en la app, pero dentro de `@layer app`, declarada DESPUÉS de `primeng` en
 * `styles/_layers.scss`. Antes esa piel iba SIN CAPA, que gana siempre; ahora gana por orden
 * declarado — y ese orden depende de que la declaración salga en el documento ANTES de que
 * PrimeNG inyecte la suya al arrancar. Eso no lo puede comprobar ningún gate estático.
 *
 * La prueba es de resultado, no de mecanismo. Hasta el 2026-09-13 medía el padding propio de la
 * celda; ese padding se fue (la tabla lleva ya la piel de Aura, como las demás), así que el testigo
 * pasa a ser lo que la app SÍ sigue pintando por encima del tema: el tinte de la fila con
 * transcripción fallida, frente al fondo que el tema da a todas las filas.
 *
 * ⚠️ Medido el 2026-09-13: el ORDEN de capas hoy no se puede invertir desde la app. PrimeNG
 * inserta su `@layer reset, primeng` al principio del documento al arrancar, antes que
 * `_layers.scss`, así que `app` queda siempre la última (invertir `_layers.scss` o anteponer
 * `@layer reset, app, primeng` al `<head>` no cambió nada). Lo que sí se rompe, y esto caza, es
 * que el tinte deje de llegar: la regla borrada, movida a la hoja encapsulada del componente o
 * metida en una capa que pierde. Visto rojo quitando la regla `is-failed` de la hoja global.
 */
test('`@layer app` gana al tema: la fila fallida de transcripciones conserva su tinte', async ({
  page,
}) => {
  await goto(page, 'conversaciones');
  await expect(page.locator('sc-datatable.memory-conversations tbody > tr').first()).toBeVisible();
  const medido = await page.evaluate(() => {
    const fila = document.querySelector('sc-datatable.memory-conversations tbody > tr.is-failed');
    const normal = document.querySelector(
      'sc-datatable.memory-conversations tbody > tr:not(.is-failed):not(.is-selected)',
    );
    const probe = document.createElement('div');
    probe.style.background = 'var(--sc-bg-danger-subtle)';
    document.body.appendChild(probe);
    const esperado = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      hayFallida: !!fila,
      fallida: fila && getComputedStyle(fila).backgroundColor,
      normal: normal && getComputedStyle(normal).backgroundColor,
      esperado,
    };
  });
  expect(medido.hayFallida, 'los datos de demo traen una fila fallida').toBe(true);
  expect(medido.fallida, 'si sale igual que una fila normal, la piel de Memory perdió contra el tema').toBe(
    medido.esperado,
  );
  expect(medido.fallida).not.toBe(medido.normal);
});

/**
 * LA SEGUNDA PASADA (2026-09-11, tarde) — Y EL ÚNICO MODO DE FALLO NUEVO.
 *
 * El barrido de la mañana dejó fuera lo que no estaba en su inventario: las celdas de
 * las nueve listas de repositorio, el título de las 13 pantallas, la barra lateral de
 * Configuración y seis muebles más. Aquí se miden los que cubren esa familia entera.
 *
 * El segundo test NO mide tipografía: mide el MARGEN. El bloque compartido de
 * `typography.css` declara `margin: 0` para las 12 clases, y `.page__heading` necesita
 * conservar su separación con el cuerpo. Con la misma especificidad decide el orden del
 * bundle, y ese orden es una consecuencia del empaquetado (los `@import` de las capas
 * suben a la cabecera), no una decisión de nadie. Por eso el selector lleva el elemento
 * (`h1.page__heading`, 0-1-1) y por eso esto se vigila desde el navegador: si alguien
 * quita el `h1` o mueve el orden de `main.scss`, el título se pega al contenido y la
 * pantalla sigue pareciendo razonable — que es justo el fallo que hay que cazar aquí.
 *
 * Medido con el fallo puesto: con `.page__heading` a secas el margen AGUANTA hoy (entonces 21px, 14 desde el 2026-09-14),
 * así que un gate estático no vería nada. Lo que este test fija es que siga aguantando.
 */
const H3_SEMIBOLD = { fontSize: '18px', lineHeight: '24px', fontWeight: '600' };

test('admin/agendas · la celda destacada de una lista de repositorio mide Body/body-semibold', async ({
  page,
}) => {
  await goto(page, 'admin/agendas');
  const destacada = page.locator('.table__cell--emphasis').first();
  await expect(destacada).toBeVisible();
  await expect(destacada).toHaveClass(/sc-text-body-semibold/);
  expect(await leer(page, '.table__cell--emphasis')).toEqual(BODY_SEMIBOLD);

});

/**
 * SIN MONOESPACIADA EN EL PRODUCTO (2026-09-13, Rafa: «no queremos cosas en mono»).
 *
 * Códigos, claves e identificadores iban en `--sc-font-family-mono`, un token escrito a mano
 * que no está en el Kit; Figma los dibuja en Inter. Ahora son texto de celda. Tipificaciones es
 * la testigo porque su columna Código era la última `kind: 'mono'` de las listas de repositorio.
 * Se mide la familia CALCULADA de cada celda, no la clase: un `<code>` o un `<kbd>` sale en mono
 * por la hoja del navegador sin que ninguna clase lo diga (así se escapó el «⌘K» del buscador).
 */
test('admin/tipificaciones · ninguna celda ni el buscador salen en monoespaciada', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  await expect(page.locator('sc-datatable tbody > tr').first()).toBeVisible();
  const enMono = await page.evaluate(() =>
    [...document.querySelectorAll('sc-datatable td *, sc-datatable td, sc-search *')]
      .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()))
      .filter((el) => /mono|menlo|consolas/i.test(getComputedStyle(el).fontFamily))
      .map((el) => el.textContent?.trim()),
  );
  expect(enMono, 'textos que siguen en monoespaciada').toEqual([]);
});

test('admin/agendas · el título de página mide Heading/h3-semibold y conserva su margen', async ({
  page,
}) => {
  await goto(page, 'admin/agendas');
  const titulo = page.locator('h1.page__heading');
  await expect(titulo).toBeVisible();
  await expect(titulo).toHaveClass(/sc-text-h3-semibold/);
  expect(await leer(page, 'h1.page__heading')).toEqual(H3_SEMIBOLD);

  const margen = await titulo.evaluate((el: HTMLElement) => getComputedStyle(el).marginBottom);
  expect(
    margen,
    'si sale 0px, la clase se llevó por delante el margen: mira la especificidad de `h1.page__heading` en `_page.scss`',
  ).toBe('14px'); // `scale/1`: el 1rem de Aura entre título y contenido (2026-09-14)
});

test('config/aed/servicio · la barra lateral de ajustes mide Body/body-regular por la clase', async ({
  page,
}) => {
  const sel = 'sc-settings-sidebar .nav-item:not(.nav-item--active) .nav-item__label';
  await goto(page, 'config/aed/servicio');
  const item = page.locator(sel).first();
  await expect(item).toBeVisible();
  await expect(item).toHaveClass(/sc-text-body-regular/);
  expect(await leer(page, sel)).toEqual(BODY_REGULAR);
});

/**
 * LA TABLA DE TRANSCRIPCIONES ESCRIBE COMO EL RESTO (2026-09-12).
 *
 * Cuatro columnas de `/conversaciones` —Hora, Fecha, Origen, Destino— escribían el
 * texto DIRECTAMENTE en el `<td>`, y las dos numéricas lo hacían en un `<span>` que
 * no declaraba tamaño. Como el `<td>` lo pinta el DS y `html, body` no declara
 * `font-size`, ese texto heredaba los 16px del documento: 16/24 contra los 14/20 de
 * las otras diez tablas de la app, y 16 no es peldaño de la rampa (DD-54).
 *
 * El arreglo es el patrón que ya usaban las demás: un `<span>` con la clase. Este
 * test mide LA COLUMNA, no la hoja, porque el modo de fallo es silencioso — si
 * alguien añade una columna nueva sin plantilla de celda, su texto vuelve a los 16
 * del documento y la pantalla sigue pareciendo razonable.
 *
 * Se mide una columna de texto y una numérica: la numérica tiene además su propia
 * clase (`.memory-num-cell`, cifras tabulares), así que comparte elemento con la del
 * text style y es la que rompería si una ganara a la otra.
 */
test('conversaciones · la celda de la tabla mide Body/body-regular, como las otras tablas', async ({
  page,
}) => {
  await goto(page, 'conversaciones');
  const fila = page.locator('sc-datatable.memory-conversations tbody > tr').first();
  await expect(fila).toBeVisible();

  /*
   * Mide EL ELEMENTO QUE PINTA EL TEXTO, lo envuelva un `<span>` o no. Es a
   * propósito: la primera versión localizaba el `<span>` y, contra el build
   * anterior, moría con «element(s) not found» — un rojo que dice que falta un
   * nodo, no que la pantalla mide mal. Así el rojo trae la MAGNITUD (16/24 contra
   * 14/20), que es el defecto que de verdad se ve.
   */
  const medir = (celda: ReturnType<typeof fila.locator>) =>
    celda.evaluate((td: HTMLElement) => {
      const hijo = td.firstElementChild as HTMLElement | null;
      const el = hijo && hijo.textContent?.trim() ? hijo : td;
      const cs = getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        fontWeight: cs.fontWeight,
        clase: el.className || '(sin clase: el texto lo pinta el <td>)',
      };
    });

  /* Hora: columna de texto plano, una de las cuatro que escribían en el `<td>`. */
  const hora = await medir(fila.locator('td').nth(2));
  expect(
    { fontSize: hora.fontSize, lineHeight: hora.lineHeight, fontWeight: hora.fontWeight },
    `la celda de Hora mide ${hora.fontSize}/${hora.lineHeight} en ${hora.clase}: si sale 16/24 volvió a heredar del documento, y su columna necesita cellTemplate`,
  ).toEqual(BODY_REGULAR);
  expect(hora.clase, 'el texto tiene que decir su estilo por el nombre').toContain(
    'sc-text-body-regular',
  );

  /* T. Conv.: numérica. Comparte elemento con `.memory-num-cell`, así que aquí se
   * ve si una clase le ganara a la otra: las cifras siguen siendo tabulares. */
  const numero = page.locator('sc-datatable.memory-conversations .memory-num-cell').first();
  await expect(numero).toHaveClass(/sc-text-body-regular/);
  expect(
    await numero.evaluate((el: HTMLElement) => {
      const cs = getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        fontWeight: cs.fontWeight,
        numeric: cs.fontVariantNumeric,
      };
    }),
  ).toEqual({ ...BODY_REGULAR, numeric: 'tabular-nums' });
});
