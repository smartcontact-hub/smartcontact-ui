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

/** `Caption/caption-regular` — el text style de las etiquetas de campo. */
const CAPTION_REGULAR = { fontSize: '12px', lineHeight: '18px', fontWeight: '400' };
/** `Body/body-semibold` — el de los títulos de sección de AED. */
const BODY_SEMIBOLD = { fontSize: '14px', lineHeight: '20px', fontWeight: '600' };

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
const ETIQUETAS: ReadonlyArray<{ ruta: string; nombre: string; selector?: string }> = [
  { ruta: 'config/aed/servicio', nombre: 'AED · servicio' },
  { ruta: 'config/aed/grupos', nombre: 'AED · grupos', selector: '.inline-field__label' },
  { ruta: 'admin/usuarios/crear', nombre: 'admin · alta de usuario' },
  { ruta: 'admin/grupos/crear', nombre: 'admin · alta de grupo' },
];

for (const { ruta, nombre, selector } of ETIQUETAS) {
  test(`${nombre} · la etiqueta de campo mide Caption/caption-regular`, async ({ page }) => {
    await goto(page, ruta);
    const sel = selector ?? '.field__label';
    await expect(page.locator(sel).first()).toBeVisible();
    expect(await leer(page, sel), `${ruta}: la etiqueta no está midiendo el text style`).toEqual(
      CAPTION_REGULAR,
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
 * La prueba es de resultado, no de mecanismo: la celda de transcripciones tiene que medir SU
 * padding (14 / 15.75, `--sc-spacing-1` y `--sc-spacing-1-125`) y no el de la gramática compartida
 * (12.25, `--sc-spacing-0-875`). Si el orden de capas se invirtiera, estos números caerían a
 * 12.25 y la pantalla seguiría
 * pareciendo razonable — que es justo el fallo que hay que cazar aquí y no en producción.
 */
test('`@layer app` gana al tema: la celda de transcripciones mantiene su padding propio', async ({
  page,
}) => {
  await goto(page, 'conversaciones');
  const celda = page.locator('sc-datatable.memory-conversations tbody > tr > td').first();
  await expect(celda).toBeVisible();
  const medido = await celda.evaluate((el: HTMLElement) => {
    const cs = getComputedStyle(el);
    return { top: cs.paddingTop, left: cs.paddingLeft };
  });
  expect(medido, 'si sale 12.25px, la piel de Memory perdió contra la gramática del tema').toEqual({
    top: '14px',
    left: '15.75px',
  });
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
 * Medido con el fallo puesto: con `.page__heading` a secas el margen AGUANTA hoy (21px),
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

  /* Y la celda MONO no lleva ninguna de las dos clases: la impondría Inter y estas
   * columnas son monoespaciadas a propósito. Es la lección 2 del barrido de la mañana,
   * puesta como aserción para que no vuelva por la puerta de una columna nueva. */
  const mono = page.locator('.table__cell--mono').first();
  if (await mono.count()) await expect(mono).not.toHaveClass(/sc-text-/);
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
  ).toBe('21px');
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
