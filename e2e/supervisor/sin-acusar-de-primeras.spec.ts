import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion } from './helpers';

/**
 * LO QUE FALTA SE DICE CUANDO YA HUBO OCASIÓN DE RELLENARLO (DD-199).
 *
 * Al encender «Tipificar llamadas» en un grupo guardado, el desplegable que aparece nacía en rojo: borde, texto y aviso
 * debajo, y el punto rojo en General, antes de poder elegir nada. Un obligatorio vacío no es un error, es algo por
 * rellenar: parecía que la persona se había equivocado sin haber hecho nada. Lo mismo al duplicar un agente (llega sin
 * nombre ni extensión a propósito) y al quitar los canales de uno guardado.
 *
 * La ocasión es dejar la sección sin ello, en el alta y al editar, o que lo guardado ya viniera sin ello (eso lo mide
 * `telefono-saliente.spec.ts`: un grupo con Teléfono y sin número lo dice al abrir). Hasta entonces, el motivo junto a
 * «Guardar» y el resumen dicen qué falta, sin rojo.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const conPunto = (page: Page) => page.locator('sc-form-section-nav .form-nav__item--has-error');
const avisos = (page: Page, seccion: string) => page.locator(`#${seccion} .field__error`);

test('grupo · encender «Tipificar» no acusa: el desplegable nace sin rojo; al dejar General sin elegir, sí', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1?seccion=general');
  await page.getByRole('switch', { name: /^Tipificar/ }).click();

  const desplegable = page.locator('#group-typification');
  await expect(desplegable).toBeVisible();
  await expect(desplegable).not.toHaveAttribute('aria-invalid', 'true');
  await expect(avisos(page, 'group-section-general')).toHaveCount(0);
  await expect(conPunto(page)).toHaveCount(0);
  // Lo que falta lo dice el motivo junto a «Guardar», que no deja guardar sin ella.
  await expect(page.locator('.form-save-reason')).toHaveText('Elige una tipificación');
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeDisabled();

  await irASeccion(page, 'Distribución y colas');
  await expect(conPunto(page)).toContainText('General');
  await irASeccion(page, 'General');
  await expect(avisos(page, 'group-section-general')).toHaveText(['Elige una tipificación']);
  await expect(desplegable).toHaveAttribute('aria-invalid', 'true');
});

test('agente · duplicar no acusa al abrir; al dejar General sin nombre, sí', async ({ page }) => {
  await goto(page, 'admin/agentes/crear?seedFromId=7');
  await expect(page.locator('.ficha-summary')).toContainText('Falta: nombre');
  await expect(conPunto(page)).toHaveCount(0);

  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(conPunto(page)).toContainText('General');
});

test('agente · editar: quitar los canales no acusa hasta dejar General', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/3');
  const general = page.locator('#agent-section-general');
  for (const canal of ['Teléfono', 'Chat', 'Email']) {
    const casilla = general.getByRole('checkbox', { name: canal, exact: true });
    if (await casilla.isChecked()) await casilla.click();
  }
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeDisabled();
  await expect(avisos(page, 'agent-section-general')).toHaveCount(0);
  await expect(conPunto(page)).toHaveCount(0);

  await irASeccion(page, 'Configuración');
  await expect(conPunto(page)).toContainText('General');
  await irASeccion(page, 'General');
  await expect(avisos(page, 'agent-section-general')).toHaveCount(1);
});
