import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion } from './helpers';

/**
 * LO QUE FALTA SE DICE AL PULSAR CREAR O GUARDAR (DD-217, que sustituye la ocasión de DD-199).
 *
 * Al encender «Tipificar llamadas» en un grupo guardado, el desplegable que aparece nacía en rojo: borde, texto y aviso
 * debajo, y el punto rojo en General, antes de poder elegir nada. Un obligatorio vacío no es un error, es algo por
 * rellenar: parecía que la persona se había equivocado sin haber hecho nada. Lo mismo al duplicar un agente (llega sin
 * nombre ni extensión a propósito) y al quitar los canales de uno guardado.
 *
 * DD-199 lo decía al dejar la sección; DD-217, al pulsar «Crear» o «Guardar», que están activos (el de guardar, con
 * cambios). Lo guardado que ya venía sin algo se dice al abrir: `telefono-saliente.spec.ts`.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const conPunto = (page: Page) => page.locator('sc-form-section-nav .form-nav__item--has-error');
/** Lo que dice cada campo que falta: el error de un campo del DS (`[error]`) o el que va bajo un grupo de casillas. */
const avisos = (page: Page, seccion: string) => page.locator(`#${seccion} :is(.field__error, .sc-field__msg--error)`);

test('grupo · encender «Tipificar» no acusa, tampoco al dejar General; al pulsar «Guardar», sí', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1?seccion=general');
  await page.getByRole('switch', { name: /^Tipificar/ }).click();

  const desplegable = page.locator('#group-typification');
  await expect(desplegable).toBeVisible();
  await expect(desplegable).not.toHaveAttribute('aria-invalid', 'true');
  await expect(avisos(page, 'group-section-general')).toHaveCount(0);
  await expect(conPunto(page)).toHaveCount(0);
  // Sin motivo junto a «Guardar», que está activo: hay un cambio, y la barra solo dice eso.
  await expect(page.locator('.form-save-reason')).toHaveText('Cambios sin guardar');
  const guardar = page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' });
  await expect(guardar).toBeEnabled();

  await irASeccion(page, 'Distribución y colas');
  await expect(conPunto(page)).toHaveCount(0);

  // Al pulsar «Guardar», no guarda: lleva a General, al desplegable, y lo dice en el campo y en el índice.
  await guardar.click();
  await expect(conPunto(page)).toContainText('General');
  await expect(conPunto(page)).toContainText('La tipificación es obligatoria');
  await expect(avisos(page, 'group-section-general')).toHaveText(['La tipificación es obligatoria']);
  await expect(desplegable).toHaveAttribute('aria-invalid', 'true');
});

test('agente · duplicar no acusa al abrir ni al dejar General; al pulsar «Crear agente», sí', async ({ page }) => {
  await goto(page, 'admin/agentes/crear?seedFromId=7');
  await expect(page.locator('.ficha-summary')).not.toContainText('Falta');
  await expect(conPunto(page)).toHaveCount(0);

  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(conPunto(page)).toHaveCount(0);

  await page.locator('sc-top-bar').getByRole('button', { name: 'Crear agente' }).click();
  await expect(conPunto(page)).toContainText('General');
  // El nombre ya viene, como el de la copia de un grupo («… (1)», DD-217): lo primero que falta es el email.
  await expect(page.locator('#agent-email')).toBeFocused();
});

test('agente · editar: quitar los canales no acusa, tampoco al dejar General; al pulsar «Guardar», sí', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/3');
  const general = page.locator('#agent-section-general');
  for (const canal of ['Teléfono', 'Chat', 'Email']) {
    const casilla = general.getByRole('checkbox', { name: canal, exact: true });
    if (await casilla.isChecked()) await casilla.click();
  }
  await expect(avisos(page, 'agent-section-general')).toHaveCount(0);
  await expect(conPunto(page)).toHaveCount(0);

  await irASeccion(page, 'Configuración');
  await expect(conPunto(page)).toHaveCount(0);

  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  await expect(conPunto(page).filter({ hasText: 'General' })).toContainText('Hace falta al menos un canal');
  await expect(avisos(page, 'agent-section-general')).toHaveText(['Hace falta al menos un canal']);
});
