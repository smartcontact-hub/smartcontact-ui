import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA GRAMÁTICA DE TABLA-LISTA, FIJADA EN NÚMEROS.
 *
 * Por qué existe: la piel `.list-table` (`styles/_sc-datatable-list.scss`) se
 * agarra a clases INTERNAS de PrimeNG (`.p-datatable-thead`, `.p-datatable-tbody`).
 * Eso no es API pública. Una subida de PrimeNG puede renombrarlas y entonces las
 * tablas revierten al aspecto del preset —filas de 42px, cabecera oscura— **sin
 * que falle ningún test**, porque el comportamiento seguiría intacto. Era el
 * agujero más grande que dejó B4: lo más cuidado era lo menos protegido.
 *
 * Qué fija: los valores COMPUTADOS, que son el contrato de diseño de S59
 * («cabecera sentence-case gris medium, no UPPERCASE tracked», sin fondo). No se
 * comparan contra otra tabla a propósito: cuando todas migren no quedará control
 * contra el que comparar, así que los números tienen que valer por sí mismos.
 *
 * Si este test se pone rojo tras actualizar PrimeNG, la piel necesita nuevos
 * selectores — no bajes los números.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/**
 * Todas las páginas que deben pintar con la gramática de tabla-lista.
 *
 * `altoFila` NO es igual en todas y no debería serlo: lo fija el contenido más
 * alto de la fila (agentes y grupos llevan avatar, que mide más que una línea
 * de texto). Lo que sí tiene que ser idéntico es el resto — paddings,
 * tipografía de cabecera, bordes y el reparto de columnas.
 */
const PAGINAS = [
  { ruta: 'admin/labels', nombre: 'labels', altoFila: 54 },
  { ruta: 'admin/plantillas', nombre: 'plantillas', altoFila: 54 },
  { ruta: 'admin/usuarios', nombre: 'usuarios', altoFila: 54 },
  { ruta: 'admin/agentes', nombre: 'agentes', altoFila: 63 },
  { ruta: 'admin/grupos', nombre: 'grupos', altoFila: 63 },
  // El trío de memory, migrado el 2026-07-19. Entraron aquí en el MISMO
  // commit que la migración, y eso no es formalismo: sin esta línea el spec
  // pasaba en verde sin visitar la página, y el "108/108" que traían los
  // informes de migración no probaba nada sobre lo migrado.
  { ruta: 'conversaciones/reglas', nombre: 'reglas', altoFila: 54 },
  { ruta: 'conversaciones/categorias', nombre: 'categorias', altoFila: 54 },
  { ruta: 'conversaciones/entidades', nombre: 'entidades', altoFila: 54 },
] as const;

/** Las tablas cuya fila ABRE algo tienen que anunciarlo con el cursor. */
const ABREN_FILA = [
  { ruta: 'admin/usuarios', nombre: 'usuarios' },
  { ruta: 'admin/agentes', nombre: 'agentes' },
  { ruta: 'admin/grupos', nombre: 'grupos' },
  { ruta: 'conversaciones/reglas', nombre: 'reglas' },
  { ruta: 'conversaciones/categorias', nombre: 'categorias' },
  { ruta: 'conversaciones/entidades', nombre: 'entidades' },
] as const;

/**
 * Las tres de memory abren un MODAL, no una ruta. El test de teclado de abajo
 * comprueba la URL, que para ellas no cambia; se les mide el cursor y el
 * `tabindex` igual, y la apertura por teclado la fija `sibling-pages.spec.ts`,
 * que sabe esperar al diálogo.
 */
const ABREN_MODAL = new Set(['conversaciones/reglas', 'conversaciones/categorias', 'conversaciones/entidades']);

/** El contrato, medido sobre la tabla original antes de migrarla (B4). */
const GRAMATICA = {
  paddingCelda: '12.25px', // --sc-spacing-0-875
  cabecera: {
    fontSize: '12px', // --sc-font-size-100
    fontWeight: '500', // --sc-font-weight-medium
    // slate-600 desde 2026-07-19. Era slate-500 `rgb(143,151,163)` y daba
    // 2.95:1 — bajo AA. Ver customs-catalog §1.5. Si esto vuelve al valor
    // anterior, es que `tokens:import` pisó la divergencia.
    color: 'rgb(111, 119, 132)', // --sc-text-secondary
    padding: '12.25px',
  },
  anchoCasilla: 40,
  tableLayout: 'fixed',
} as const;

for (const { ruta, nombre, altoFila } of PAGINAS) {
  test(`${nombre} · la piel .list-table impone la gramática de la casa`, async ({ page }) => {
    await goto(page, ruta);

    const tabla = page.locator('sc-datatable.list-table').first();
    await expect(tabla).toBeVisible();

    const medido = await tabla.evaluate((host: HTMLElement) => {
      const cs = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);
      const th = host.querySelector('.p-datatable-thead th:not(.sc-datatable__check)')!;
      const tr = host.querySelector('.p-datatable-tbody > tr')!;
      const td = tr.querySelector('td:not(.sc-datatable__check)')!;
      // NO todas las list-table tienen selección: el trío de memory nunca la
      // tuvo. La casilla se mide SOLO si existe; exigirla convertía una
      // diferencia legítima en un fallo (y así petó la primera vez).
      const thCheck = host.querySelector('.p-datatable-thead th.sc-datatable__check');
      const banda = host.querySelector('.p-datatable-header');
      return {
        altoFila: Math.round(tr.getBoundingClientRect().height),
        paddingCelda: cs(td, 'padding-top'),
        cabecera: {
          fontSize: cs(th, 'font-size'),
          fontWeight: cs(th, 'font-weight'),
          color: cs(th, 'color'),
          padding: cs(th, 'padding-top'),
        },
        anchoCasilla: thCheck ? Math.round(thCheck.getBoundingClientRect().width) : null,
        tableLayout: cs(host.querySelector('.p-datatable-table')!, 'table-layout'),
        // La banda de caption de PrimeNG se pinta aunque no proyectes nada:
        // si reaparece, deja una franja vacía sobre la cabecera.
        bandaCaptionVisible: banda ? getComputedStyle(banda).display !== 'none' : false,
      };
    });

    expect(medido.altoFila).toBe(altoFila);
    expect(medido.paddingCelda).toBe(GRAMATICA.paddingCelda);
    expect(medido.cabecera).toEqual(GRAMATICA.cabecera);
    // `null` = esta tabla no tiene selección, que es una decisión de la
    // página, no una desviación de la gramática.
    if (medido.anchoCasilla !== null) expect(medido.anchoCasilla).toBe(GRAMATICA.anchoCasilla);
    expect(medido.tableLayout).toBe(GRAMATICA.tableLayout);
    expect(medido.bandaCaptionVisible).toBe(false);
  });
}

test('en oscuro el separador de fila SE VE (no puede volver a 1.00:1)', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sc-theme', 'dark');
    } catch {
      /* sin storage — ignorar */
    }
  });
  await goto(page, 'admin/labels');

  const medido = await page.locator('sc-datatable.list-table').first().evaluate((host: HTMLElement) => {
    const bg = getComputedStyle(host.closest('.table-card') ?? host).backgroundColor;
    const td = host.querySelector('.p-datatable-tbody > tr > td')!;
    const borde = getComputedStyle(td).borderBottomColor;
    const rgb = (s: string) => s.match(/\d+/g)!.slice(0, 3).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    const l1 = lum(rgb(borde));
    const l2 = lum(rgb(bg));
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return { temaOscuro: bg !== 'rgb(255, 255, 255)', ratio: (hi + 0.05) / (lo + 0.05) };
  });

  // VALIDAR EL VALIDADOR: si el tema no se aplicó, esto no mide nada.
  expect(medido.temaOscuro).toBe(true);
  // Antes de arreglarlo daba exactamente 1.00 — el separador no existía.
  expect(medido.ratio).toBeGreaterThan(1.1);
});

for (const { ruta, nombre } of ABREN_FILA) {
  test(`${nombre} · la fila que abre lo anuncia con el cursor`, async ({ page }) => {
    await goto(page, ruta);
    const fila = page.locator('sc-datatable.list-table .p-datatable-tbody > tr').first();
    await expect(fila).toBeVisible();
    /* Al pintar el `<tr>` el DS, `pSelectableRowDisabled` (modo multiple) le
     * quita la clase de la que PrimeNG saca el cursor. La migración dejó
     * agentes abriendo EN SILENCIO —medido `cursor: auto`— hasta que la clase
     * `--clickable` se movió a la piel compartida. Esto lo fija. */
    await expect(fila).toHaveCSS('cursor', 'pointer');
  });
}

for (const { ruta, nombre } of ABREN_FILA) {
  test(`${nombre} · la fila se abre TAMBIÉN con el teclado (WCAG 2.1.1)`, async ({ page }) => {
    await goto(page, ruta);
    const fila = page.locator('sc-datatable.list-table .p-datatable-tbody > tr').first();
    await expect(fila).toBeVisible();

    /* Estas tres listas abrían la ficha al clicar y NO eran alcanzables por
     * teclado: cero `tabindex`, cero `keydown`, cero enlaces — comprobado en
     * el árbol anterior a la migración. La acción existía solo para quien usa
     * ratón, que es un fallo de WCAG 2.1.1, no una carencia estética. */
    await expect(fila).toHaveAttribute('tabindex', '0');

    if (ABREN_MODAL.has(ruta)) return; // su Enter lo cubre sibling-pages.spec.ts
    await fila.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/(editar|nuevo)\//);
  });
}
