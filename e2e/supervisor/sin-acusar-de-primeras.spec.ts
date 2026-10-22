import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion } from './helpers';

/**
 * LO QUE FALTA NO SE ACUSA DE PRIMERAS: EN GRIS HASTA DEJAR EL CAMPO VACÍO (DD-219, que sustituye la ocasión de DD-217 y
 * DD-199).
 *
 * Al encender «Tipificar llamadas» en un grupo guardado, el desplegable que aparece nacía en rojo: borde, texto y aviso
 * debajo, y el punto rojo en General, antes de poder elegir nada. Un obligatorio vacío no es un error, es algo por
 * rellenar: parecía que la persona se había equivocado sin haber hecho nada. Lo mismo al duplicar un agente (llega sin
 * email ni extensión a propósito) y al quitar los canales de uno guardado.
 *
 * DD-199 lo decía al dejar la sección; DD-217, al pulsar «Crear» o «Guardar»; DD-219 lo dice en gris bajo el campo y en
 * «Falta: …» del resumen, con el botón apagado, y en rojo si se intenta guardar igual (Ctrl+S). Lo guardado que ya venía
 * sin algo se dice al abrir: `telefono-saliente.spec.ts`.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const conPunto = (page: Page) => page.locator('sc-form-section-nav .form-nav__item--has-error');
const estado = (page: Page) => page.locator('.resumen__status');
/** Lo que dice cada campo que falta: el error de un campo del DS (`[error]`) o el que va bajo un grupo de casillas. */
const avisos = (page: Page, seccion: string) => page.locator(`#${seccion} :is(.field__error, .sc-field__msg--error)`);
/** El mismo aviso, en gris: la ayuda de un campo del DS o la que va bajo un grupo de casillas. */
const gris = (page: Page, seccion: string, texto: string) =>
  page.locator(`#${seccion} :is(.field__help, .sc-field__msg:not(.sc-field__msg--error))`).filter({ hasText: texto });
const guardarConTeclado = (page: Page) => page.keyboard.press('ControlOrMeta+s');

test('grupo · encender «Tipificar» no acusa, tampoco al dejar General: gris y «Guardar» apagado; con Ctrl+S, en rojo', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/editar/1?seccion=general');
  await page.getByRole('switch', { name: /^Tipificar/ }).click();

  const desplegable = page.locator('#group-typification');
  await expect(desplegable).toBeVisible();
  await expect(gris(page, 'group-section-general', 'La tipificación es obligatoria')).toHaveCount(1);
  await expect(desplegable).not.toHaveAttribute('aria-invalid', 'true');
  await expect(avisos(page, 'group-section-general')).toHaveCount(0);
  await expect(conPunto(page)).toHaveCount(0);
  // Hay un cambio, pero falta la tipificación: «Guardar» apagado, y el resumen dice qué falta.
  await expect(page.locator('.form-save-reason')).toHaveText('Cambios sin guardar');
  const guardar = page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' });
  await expect(guardar).toBeDisabled();
  await expect(estado(page)).toContainText('Falta: tipificación');

  await irASeccion(page, 'Distribución y colas');
  await expect(conPunto(page)).toHaveCount(0);

  // Ctrl+S no guarda: lleva a General, al desplegable, y lo dice en rojo en el campo y en el índice.
  await guardarConTeclado(page);
  await expect(conPunto(page)).toContainText('General');
  await expect(conPunto(page)).toContainText('Tipificación');
  await expect(avisos(page, 'group-section-general')).toHaveText(['La tipificación es obligatoria']);
  await expect(desplegable).toHaveAttribute('aria-invalid', 'true');
});

test('agente · duplicar no acusa al abrir ni al dejar General; «Falta: …» lleva al primer campo', async ({ page }) => {
  await goto(page, 'admin/agentes/crear?seedFromId=7');
  // El nombre ya viene, como el de la copia de un grupo («… (1)», DD-217): faltan el email y la extensión.
  await expect(estado(page)).toContainText('Falta: email, extensión');
  await expect(gris(page, 'agent-section-general', 'El email es obligatorio')).toHaveCount(1);
  await expect(avisos(page, 'agent-section-general')).toHaveCount(0);
  await expect(conPunto(page)).toHaveCount(0);
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Crear agente' })).toBeDisabled();

  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(conPunto(page)).toHaveCount(0);

  await estado(page).getByRole('button', { name: 'email' }).click();
  await expect(page.locator('#agent-email')).toBeFocused();
  await expect(conPunto(page)).toHaveCount(0);
});

test('agente · editar: quitar los canales no acusa, tampoco al dejar General: gris y «Guardar» apagado; con Ctrl+S, en rojo', async ({
  page,
}) => {
  await goto(page, 'admin/agentes/editar/3');
  const general = page.locator('#agent-section-general');
  for (const canal of ['Teléfono', 'Chat', 'Email']) {
    const casilla = general.getByRole('checkbox', { name: canal, exact: true });
    if (await casilla.isChecked()) await casilla.click();
  }
  await expect(gris(page, 'agent-section-general', 'Hace falta al menos un canal')).toHaveCount(1);
  await expect(avisos(page, 'agent-section-general')).toHaveCount(0);
  await expect(conPunto(page)).toHaveCount(0);
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeDisabled();
  await expect(estado(page)).toContainText('Falta: un canal');

  await irASeccion(page, 'Configuración');
  await expect(conPunto(page)).toHaveCount(0);

  await guardarConTeclado(page);
  await expect(conPunto(page).filter({ hasText: 'General' })).toContainText('Hace falta al menos un canal');
  await expect(avisos(page, 'agent-section-general')).toHaveText(['Hace falta al menos un canal']);
});
