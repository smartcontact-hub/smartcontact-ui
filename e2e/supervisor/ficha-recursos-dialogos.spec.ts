import { expect, test, type Locator, type Page } from '@playwright/test';

import { kitPx } from '../kit-metrics';
import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * CREAR DESDE LA FICHA ES UN DIÁLOGO, NO UNA CAJA DENTRO DE OTRA.
 *
 * En Recursos de la ficha de grupo, cada «+» (agenda, plantillas y etiqueta) crea sin salir de la ficha:
 * abre un `sc-dialog` con el formulario de su pantalla dentro. Medido el 2026-10-01: el formulario seguía pintando
 * su propia tarjeta (320 px con borde, sombra y radio) dentro del diálogo de 440, con su título repetido
 * («Nuevo/a tipificación» dos veces) y su propio `role="dialog"`. La ficha le pasaba `flush`, pero el formulario no
 * tenía esa entrada y el atributo no hacía nada. Y el diálogo decía «Nuevo/a tipificación» bajo un botón que dice
 * «Nueva tipificación» (la etiqueta, «Nueva label» bajo «Nueva etiqueta»).
 *
 * `sc-dialog` traía además dos `role="dialog"` anidados, el `p-dialog` sin nombre y su `section`. Desde DD-140 es uno,
 * el de PrimeNG, con su título de nombre: con un «+» abierto, la página tiene UN diálogo, y el formulario no añade otro.
 *
 * Lo que fija:
 *   1. Cada «+» abre su diálogo, que se llama como su botón; dentro, el formulario no abre otro, va a sangre (sin
 *      borde ni sombra) y a todo el ancho, y el título sale una vez.
 *   2. La tipificación no tiene «+» (DD-173): es un árbol con su ficha, y no cabe en un diálogo. Desde DD-187 se elige
 *      en General › Postconversación. Se crea en Repositorios, y su alta lleva su título con género: «Nueva
 *      tipificación», no «Nuevo/a». Y cada «+» rima con su desplegable: mediano, relleno y de su mismo alto.
 *   3. (Fundido en el 2.)
 *   4. Recursos ya no enseña Etiquetas (DD-142), y el grupo conserva las suyas al guardar: el campo se queda hecho y
 *      apagado, por si vuelve.
 *   5. Cada «+» es el botón de solo icono de primeng.dev, redondo y con borde, en gris, a la derecha de su desplegable
 *      y a su alto (DD-167).
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Los «+» de Recursos, por su nombre: «Nueva agenda», «Nueva plantilla» (chat y email). */
const masDeRecursos = (page: Page) =>
  page.locator('#group-section-resources').getByRole('button', { name: /^Nueva (agenda|plantilla|etiqueta)$/ });

/** Caja y ancho del formulario dentro del diálogo, contra el hueco del cuerpo de `sc-dialog`. */
const cajaDelFormulario = (dialogo: Locator) =>
  dialogo.locator('.panel').evaluate((el) => {
    const cs = getComputedStyle(el);
    const contenido = el.closest('.sc-dialog__body') as HTMLElement;
    const cc = getComputedStyle(contenido);
    const hueco = contenido.getBoundingClientRect().width - parseFloat(cc.paddingLeft) - parseFloat(cc.paddingRight);
    return {
      sombra: cs.boxShadow,
      borde: cs.borderTopWidth,
      sobraDeAncho: Math.round(hueco - el.getBoundingClientRect().width),
    };
  });

test('grupo 11 · cada «+» de Recursos abre su diálogo con el nombre de su botón, y el formulario va a sangre', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  const botones = masDeRecursos(page);
  const n = await botones.count();
  // Agenda y plantillas de chat y de email (la etiqueta salió con DD-142; la tipificación, a General con DD-187): si faltan, la
  // prueba no recorre lo que dice.
  expect(n, 'los «+» de Recursos').toBeGreaterThanOrEqual(3);

  for (let i = 0; i < n; i++) {
    const boton = botones.nth(i);
    const nombre = (await boton.getAttribute('aria-label'))!;
    await boton.click();

    const dialogo = page.getByRole('dialog', { name: nombre, exact: true });
    await expect(dialogo, `${nombre}: el diálogo se llama como su botón`).toHaveCount(1);
    await expect(page.getByRole('dialog'), `${nombre}: un solo diálogo en la página`).toHaveCount(1);
    await expect(
      page.locator(':is(sc-repo-form-panel, sc-template-form-panel, sc-label-form-panel) [role="dialog"]'),
      `${nombre}: el formulario no abre un diálogo propio`,
    ).toHaveCount(0);
    await expect(dialogo.getByText(nombre, { exact: true }), `${nombre}: el título, una vez`).toHaveCount(1);

    const caja = await cajaDelFormulario(dialogo);
    expect(caja.sombra, `${nombre}: sin sombra propia`).toBe('none');
    expect(caja.borde, `${nombre}: sin borde propio`).toBe('0px');
    expect(caja.sobraDeAncho, `${nombre}: a todo el ancho del diálogo`).toBeLessThanOrEqual(1);

    await dialogo.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.locator('section.sc-dialog')).toHaveCount(0);
  }
});

test('grupo 11 · cada «+» de Recursos es el solo icono del Kit, secundario y relleno, a la talla de su desplegable', async ({ page }) => {
  // DD-187, que enmienda DD-167: el «+» rima con su campo. Junto a un desplegable mediano, el botón mediano de solo
  // icono, tan alto como él, a su derecha con el hueco de la casa (7).
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  const botones = masDeRecursos(page);
  await expect(botones).toHaveCount(3);
  const ancho = parseFloat(kitPx('button.root.iconOnlyWidth'));

  for (const boton of await botones.all()) {
    const nombre = (await boton.getAttribute('aria-label'))!;
    const clases = await boton.evaluate((el) => [...el.classList]);
    expect(['p-button-icon-only', 'p-button-secondary'].filter((c) => !clases.includes(c)), `${nombre}: solo icono y en gris`).toEqual([]);
    expect(['p-button-rounded', 'p-button-outlined', 'p-button-sm'].filter((c) => clases.includes(c)), `${nombre}: relleno y mediano`).toEqual([]);

    const g = await boton.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const c = el.closest('.field')!.querySelector('.p-select, .p-multiselect')!.getBoundingClientRect();
      return { ancho: b.width, alto: b.height, altoCampo: c.height, hueco: b.left - c.right, centros: b.top + b.height / 2 - (c.top + c.height / 2) };
    });
    expect(g.ancho, `${nombre}: el ancho del solo icono del Kit`).toBeCloseTo(ancho, 1);
    expect(g.alto, `${nombre}: tan alto como su desplegable`).toBeCloseTo(g.altoCampo, 1);
    expect(g.hueco, `${nombre}: a la derecha del desplegable, con 7 de hueco`).toBeCloseTo(7, 0);
    expect(Math.abs(g.centros), `${nombre}: a la altura del desplegable`).toBeLessThanOrEqual(1);
  }
});

test('grupo 11 · la tipificación se elige en General y no tiene «+»: se crea en su ficha, con su título con género', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=general');
  await expect(page.locator('sc-select:has(#group-typification)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nueva tipificación', exact: true })).toHaveCount(0);

  await goto(page, 'admin/tipificaciones');
  await page.locator('sc-top-bar').getByRole('button', { name: 'Nueva tipificación', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/crear$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nueva tipificación');
  await expect(page.locator('main')).not.toContainText('Nuevo/a');
});

test('grupo 11 · Recursos no enseña Etiquetas, y el grupo conserva las suyas al guardar', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  const recursos = page.locator('#group-section-resources');
  // Las agendas a la vista: así el cero de abajo no es de una sección sin pintar.
  await expect(recursos.locator('sc-multiselect:has(#group-agendas)')).toBeVisible();
  await expect(recursos.locator('#group-labels')).toHaveCount(0);
  await expect(recursos.getByText('Etiquetas', { exact: true })).toHaveCount(0);
  // El resumen cuenta lo que se ve: tres agendas y seis plantillas, sin las dos etiquetas. La tipificación ya no es de
  // Recursos: la elige la Postconversación de General (DD-187).
  await expect(page.locator('.ficha-summary')).toContainText(/Recursos\s*9(?!\d)/);

  // Guardar no las tira: el grupo 11 sigue con las suyas, por si Etiquetas vuelve. El cambio: quitarle una agenda.
  await recursos.locator('sc-multiselect:has(#group-agendas) .p-multiselect').click();
  await page.locator('.p-multiselect-overlay .p-multiselect-option').filter({ hasText: 'Ventas Nacional' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Grupo "Online Support" actualizado')).toBeVisible();
  const etiquetas = await page.evaluate(
    () => (JSON.parse(localStorage.getItem('sc-groups') ?? '[]') as { id: number; labels?: number[] }[]).find((g) => g.id === 11)?.labels,
  );
  expect(etiquetas).toEqual([3, 6]);
});
