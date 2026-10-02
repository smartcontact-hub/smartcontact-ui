import { expect, test, type Locator, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * CREAR DESDE LA FICHA ES UN DIÁLOGO, NO UNA CAJA DENTRO DE OTRA.
 *
 * En Recursos de la ficha de grupo, cada «+» (tipificación, agenda, plantillas y etiqueta) crea sin salir de la ficha:
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
 *   2. Crear una tipificación desde la ficha sigue funcionando: se cierra el diálogo y su categoría queda elegida.
 *   3. En Repositorios, el alta de cada repositorio lleva su título con género: «Nueva tipificación», no «Nuevo/a».
 *   4. Recursos ya no enseña Etiquetas (DD-142), y el grupo conserva las suyas al guardar: el campo se queda hecho y
 *      apagado, por si vuelve.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const masDeRecursos = (page: Page) =>
  page.locator('#group-section-resources sc-button.field__label-row__action button');

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
  // Tipificación, agenda y plantillas de chat y de email (la etiqueta salió con DD-142): si faltan, la prueba no
  // recorre lo que dice.
  expect(n, 'los «+» de Recursos').toBeGreaterThanOrEqual(4);

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

test('grupo 11 · crear una tipificación desde la ficha la deja elegida', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  await page.getByRole('button', { name: 'Nueva tipificación', exact: true }).click();
  const dialogo = page.locator('section.sc-dialog');
  const categoria = `E2E Categoría ${Date.now()}`;
  await dialogo.getByLabel('Nombre').fill(`E2E Tipificación ${Date.now()}`);
  await dialogo.getByLabel('Código').fill('E2E-001');
  await dialogo.getByLabel('Categoría').fill(categoria);
  await dialogo.getByRole('button', { name: 'Crear', exact: true }).click();

  await expect(page.locator('section.sc-dialog')).toHaveCount(0);
  await expect(page.locator('sc-select:has(#group-typification)')).toContainText(categoria);
});

test('Repositorios › Tipificaciones · el alta lleva su título con género', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  await page.getByRole('button', { name: 'Crear', exact: true }).click();
  const panel = page.locator('sc-repo-form-panel');
  await expect(panel.locator('.panel__title')).toHaveText('Nueva tipificación');
  await expect(panel).not.toContainText('Nuevo/a');
});

test('grupo 11 · Recursos no enseña Etiquetas, y el grupo conserva las suyas al guardar', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  const recursos = page.locator('#group-section-resources');
  // La tipificación a la vista: así el cero de abajo no es de una sección sin pintar.
  await expect(recursos.locator('#group-typification')).toBeVisible();
  await expect(recursos.locator('#group-labels')).toHaveCount(0);
  await expect(recursos.getByText('Etiquetas', { exact: true })).toHaveCount(0);
  // El resumen cuenta lo que se ve: tres agendas y seis plantillas, sin las dos etiquetas del grupo.
  await expect(page.locator('.ficha-summary')).toContainText(/Recursos\s*9(?!\d)/);

  // Guardar no las tira: el grupo 11 sigue con las suyas, por si Etiquetas vuelve.
  await pickSelectOption(page, page.locator('#group-typification'), 'Consulta');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Grupo "Online Support" actualizado')).toBeVisible();
  const etiquetas = await page.evaluate(
    () => (JSON.parse(localStorage.getItem('sc-groups') ?? '[]') as { id: number; labels?: number[] }[]).find((g) => g.id === 11)?.labels,
  );
  expect(etiquetas).toEqual([3, 6]);
});
