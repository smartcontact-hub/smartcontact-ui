import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL MOLDE DE LAS PANTALLAS DE AJUSTES CON ÍNDICE, MEDIDO EN TODAS LAS QUE LO USAN.
 *
 * Nació el 2026-09-06 (DD-53) como red ANTES de subir a `_page.scss` el molde que los tres
 * formularios de admin declaraban byte a byte (LEARNINGS #16), porque esas reglas son
 * GLOBALES (0,1,0) y una regla encapsulada de componente (0,2,0) les gana siempre: dejarse
 * un `padding` scoped «por si acaso» desvía una pantalla sin que nada se queje.
 *
 * El 2026-09-14 el molde cambió de forma: las fichas de agente, grupo y usuario pasan al de
 * Contact Center (`.page__inner--rail`), que hasta ese día vivía escrito a mano en
 * `settings-shell.component.scss`. Este fichero mide ahora las cinco pantallas con las
 * mismas aserciones. `--with-panel` sigue existiendo para el constructor de reglas.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/**
 * Las tres altas comparten molde, Y ES EL DE CONTACT CENTER: desde el 2026-09-14 las fichas
 * de agente, grupo y usuario y las tres pantallas de `config/aed` pintan `.page__inner--rail`.
 * Hasta ese día las fichas tenían otro molde (rail 240 pegado al borde + columna de 1100
 * flotando) y la misma app parecía dos. Medir las cinco con el MISMO bloque de aserciones es
 * lo que impide que vuelvan a separarse.
 */
/* El alta de GRUPO salió de aquí el 2026-09-23: su ficha dejó de tener índice lateral y pasó a una
 * tira de pestañas, así que no tiene rail que medir y su tope es 1600 y no 1200 (`.ficha-tabs` en
 * `_page.scss`). Lo que este spec fija —que el molde de ajustes no se desvíe página a página—
 * sigue vigilando las otras cuatro, que sí lo usan; la de grupo la mide `ficha-grupo.spec.ts`. */
const FORMULARIOS = [
  { ruta: 'admin/usuarios/crear', nombre: 'alta de usuario' },
  { ruta: 'admin/agentes/crear', nombre: 'alta de agente' },
  { ruta: 'config/aed/agentes', nombre: 'contact center · agentes' },
  { ruta: 'config/aed/grupos', nombre: 'contact center · grupos' },
] as const;

/** Los computados que definen el molde, leídos en el nodo exacto (no en un padre). */
const medirMolde = (page: Page) =>
  page.evaluate(() => {
    const nodo = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`no existe ${sel} en esta página`);
      return { el, s: getComputedStyle(el) };
    };
    const inner = nodo('.page__inner--rail');
    const rail = nodo('.page__rail');
    const main = nodo('.page__main');
    return {
      inner: {
        display: inner.s.display,
        direccion: inner.s.flexDirection,
        padding: inner.s.padding,
        maxWidth: inner.s.maxWidth,
        gap: inner.s.columnGap,
      },
      main: {
        minWidth: main.s.minWidth,
        ancho: Math.round(main.el.getBoundingClientRect().width),
      },
      rail: {
        position: rail.s.position,
        top: rail.s.top,
        ancho: Math.round(rail.el.getBoundingClientRect().width),
      },
    };
  });

for (const { ruta, nombre } of FORMULARIOS) {
  test(`${nombre} · el molde de ajustes mide lo mismo que Contact Center`, async ({ page }) => {
    await goto(page, ruta);
    const m = await medirMolde(page);

    // La pieza: rail + contenido en fila, con tope de 1200 y el aire de la maqueta
    // (`--sc-spacing-1-625` = 22.75px arriba · `--sc-spacing-2` = 28px a los lados y entre
    // columnas).
    expect(m.inner.display).toBe('flex');
    expect(m.inner.direccion).toBe('row');
    expect(m.inner.maxWidth).toBe('1200px');
    expect(m.inner.padding).toBe('22.75px 28px');
    expect(m.inner.gap).toBe('28px');

    // El rail: 196 reales, y SE QUEDA fijo con el mismo `top` que el relleno de arriba.
    expect(m.rail.position).toBe('sticky');
    expect(m.rail.top).toBe('22.75px');
    expect(m.rail.ancho).toBe(196);

    // La columna de contenido se come el resto: 1200 − 2×28 − 196 − 28 = 920 a 1440,
    // el ancho del `Block` 393:12587.
    expect(m.main.minWidth).toBe('0px');
    expect(m.main.ancho).toBe(920);
  });

  test(`${nombre} · por debajo de 1024 el índice sube encima del contenido`, async ({ page }) => {
    await goto(page, ruta);
    await page.setViewportSize({ width: 1000, height: 900 });

    // El colapso es una media query: se resuelve al reflow, así que se sondea en
    // vez de leerse una sola vez.
    await expect.poll(async () => (await medirMolde(page)).inner.direccion).toBe('column');
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
