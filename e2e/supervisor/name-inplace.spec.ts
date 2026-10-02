import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL NOMBRE DE LA FICHA SE EDITA EN SU SITIO (`sc-name-inplace`, el Inplace nativo de primeng.dev).
 *
 * Lo que se mide es lo que se ve y lo que queda guardable:
 * 1. Pulsar el título abre el campo con el nombre y el foco, y la cabecera no se mueve (el relleno nativo del
 *    Inplace se compensa: sin eso, lo que va debajo bajaba 12,5px; en la de grupo, el índice; en las de
 *    agente y usuario, la tira de pestañas).
 * 2. Un nombre de otro grupo avisa como en General; Escape devuelve el de antes y la ficha queda sin cambios.
 * 3. Enter deja el nombre nuevo en el título, en General (es el mismo campo) y con Guardar encendido.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const titulo = (page: Page) => page.locator('.headline__name .p-inplace-display');
const campo = (page: Page) => page.locator('.name-inplace__input');
const guardar = (page: Page) => page.getByRole('button', { name: 'Guardar' });
/** Lo que va justo debajo de la cabecera: el índice en la ficha de grupo. */
const yIndice = (page: Page) => page.locator('.page__rail').evaluate((el) => el.getBoundingClientRect().y);

test('grupo · el título se edita en su sitio sin mover la cabecera', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');
  const antes = (await titulo(page).innerText()).trim();
  const y = await yIndice(page);

  await titulo(page).click();
  await expect(campo(page)).toBeFocused();
  await expect(campo(page)).toHaveValue(antes);
  expect(await yIndice(page), 'editar no debe empujar el índice').toBeCloseTo(y, 0);
});

test('grupo · nombre repetido avisa, y Escape lo devuelve', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');
  const antes = (await titulo(page).innerText()).trim();

  await titulo(page).click();
  await campo(page).fill('ACD outbound');
  await expect(page.locator('.name-inplace__error')).toHaveText('Ya hay un grupo con este nombre');
  await expect(guardar(page)).toBeDisabled();

  await page.keyboard.press('Escape');
  await expect(campo(page)).toHaveCount(0);
  await expect(titulo(page)).toHaveText(antes);
  await expect(guardar(page)).toBeDisabled();
});

test('grupo · Enter deja el nombre nuevo, también en General, y se puede guardar', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  await titulo(page).click();
  await campo(page).fill('ACD Demo renombrado');
  await page.keyboard.press('Enter');

  await expect(titulo(page)).toHaveText('ACD Demo renombrado');
  await expect(guardar(page)).toBeEnabled();
  // General abre sola: el campo Nombre es el mismo que el del título.
  await expect(page.locator('#group-section-general').getByRole('textbox', { name: 'Nombre' })).toHaveValue('ACD Demo renombrado');
});

test('agente · el título también se edita en su sitio', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1');
  await titulo(page).click();
  await campo(page).fill('Tom Hanks Jr.');
  await page.keyboard.press('Enter');
  await expect(titulo(page)).toHaveText('Tom Hanks Jr.');
  await expect(guardar(page)).toBeEnabled();
});
