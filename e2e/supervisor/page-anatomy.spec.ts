import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL MOLDE DEL FORMULARIO CON RAIL, MEDIDO ANTES DE MOVERLO.
 *
 * Los tres formularios de admin (agente · grupo · usuario) declaran su layout
 * TRES VECES, byte a byte: `.page__inner--with-panel` (rejilla rail 240 + columna),
 * `.page__form` (la columna, capada a 1100) e `.ipanel` (el rail). Van a subir a
 * `styles/_page.scss` y `styles/_forms.scss`, y ahí espera una trampa con nombre
 * y apellidos, avisada por la cabecera del propio `_page.scss`: esas reglas son
 * GLOBALES (0,1,0) y una regla encapsulada de componente (0,2,0) les gana
 * siempre. Subir el modificador y dejarse el `padding` base scoped "por si
 * acaso" le devolvería 24.5/28px al rail sin que nada se quejara.
 *
 * Por eso esta red va ANTES del refactor (LEARNINGS #16): congela los computados
 * que DEFINEN el molde, para que el movimiento tenga que ser un no-op
 * demostrable y no una promesa. Los tres formularios miden lo mismo, así que el
 * mismo bloque de aserciones corre sobre los tres.
 *
 * Lo que este fichero NO fija todavía: `.ipanel { top }`. Hoy computa `auto`
 * porque el rail ya no declara `top`: la declaración que traía apuntaba a
 * `--sc-form-panel-top`, un token que se usaba y no se definía en ninguna parte
 * del repo, así que era inválida y caía a `auto` igualmente. Se retiró con el
 * molde (DD-53) y hoy quedan cero usos. El rail sigue pidiendo quedarse fijo al
 * hacer scroll y no se queda: el valor se anota en el informe del test, y la
 * aserción entra cuando el anclaje sea una decisión tomada.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Las tres altas comparten molde: mismo HTML de layout, mismo SCSS duplicado. */
const FORMULARIOS = [
  { ruta: 'admin/usuarios/crear', nombre: 'alta de usuario' },
  { ruta: 'admin/agentes/crear', nombre: 'alta de agente' },
  { ruta: 'admin/grupos/crear', nombre: 'alta de grupo' },
] as const;

/** Los computados que definen el molde, leídos en el nodo exacto (no en un padre). */
const medirMolde = (page: Page) =>
  page.evaluate(() => {
    const nodo = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`no existe ${sel} en esta página`);
      return { el, s: getComputedStyle(el) };
    };
    const inner = nodo('.page__inner');
    const form = nodo('.page__form');
    const rail = nodo('.ipanel');
    return {
      inner: {
        display: inner.s.display,
        columnas: inner.s.gridTemplateColumns,
        padding: inner.s.padding,
        maxWidth: inner.s.maxWidth,
        margin: inner.s.margin,
      },
      form: {
        maxWidth: form.s.maxWidth,
        padding: form.s.padding,
        display: form.s.display,
        direccion: form.s.flexDirection,
        minWidth: form.s.minWidth,
        ancho: Math.round(form.el.getBoundingClientRect().width),
      },
      rail: {
        position: rail.s.position,
        top: rail.s.top,
        ancho: Math.round(rail.el.getBoundingClientRect().width),
      },
    };
  });

for (const { ruta, nombre } of FORMULARIOS) {
  test(`${nombre} · el molde con rail mide lo mismo antes y después de mudarse`, async ({
    page,
  }) => {
    await goto(page, ruta);
    const m = await medirMolde(page);

    // La rejilla: rail fijo de 240 + columna que se come el resto. El `padding: 0`
    // y el `max-width: none` son del MODIFICADOR anulando la base — justo el par
    // que la trampa de especificidad rompería.
    expect(m.inner.display).toBe('grid');
    expect(m.inner.columnas).toMatch(/^240px \d/);
    expect(m.inner.padding).toBe('0px');
    expect(m.inner.maxWidth).toBe('none');

    // La columna de formulario: 1100 de tope y el aire que da la escala 14-base
    // (`--sc-spacing-1-75` = 24.5px · `--sc-spacing-2` = 28px).
    expect(m.form.maxWidth).toBe('1100px');
    expect(m.form.padding).toBe('24.5px 28px');
    expect(m.form.display).toBe('flex');
    expect(m.form.direccion).toBe('column');
    expect(m.form.minWidth).toBe('0px');

    // El rail: 240 reales, y PIDE quedarse fijo.
    expect(m.rail.position).toBe('sticky');
    expect(m.rail.ancho).toBe(240);

    // El `top` del rail se anota, no se asevera: hoy es `auto` porque el rail no
    // declara ninguno. Queda en el informe para que el arreglo se vea, no se cuente.
    test.info().annotations.push({ type: 'ipanel.top medido', description: m.rail.top });
  });

  test(`${nombre} · por debajo de 1024 la rejilla colapsa a una columna`, async ({ page }) => {
    await goto(page, ruta);
    await page.setViewportSize({ width: 1000, height: 900 });

    // El colapso es una media query: se resuelve al reflow, así que se sondea en
    // vez de leerse una sola vez.
    await expect
      .poll(async () => (await medirMolde(page)).inner.columnas.trim().split(/\s+/).length)
      .toBe(1);
  });
}

/**
 * Control negativo: una página de LISTA no debe cambiar al mudarse el molde del
 * formulario. Si el movimiento contamina `_page.scss`, esta es la que lo canta.
 */
test('la lista de usuarios conserva su arquetipo (1600) tras mudarse el molde', async ({
  page,
}) => {
  await goto(page, 'admin/usuarios');

  const medido = await page.evaluate(() => {
    const el = document.querySelector('.page__inner');
    if (!el) throw new Error('no existe .page__inner en la lista');
    const s = getComputedStyle(el);
    return { maxWidth: s.maxWidth, display: s.display };
  });

  expect(medido.maxWidth).toBe('1600px');
  expect(medido.display).not.toBe('grid');
});
