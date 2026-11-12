import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL NOMBRE REPETIDO SE PERMITE TAMBIÉN EN LOS PANELES DE ALTA RÁPIDA (DD-235).
 *
 * Variables (y los demás repositorios de panel) y Etiquetas no se referencian por nombre, sino por ID: crear una con
 * el nombre de otra no avisa y se guarda. Hasta DD-251 el ejemplo era Horarios, que ahora tiene su editor.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const filas = (page: Page, nombre: string) => page.getByRole('row').filter({ hasText: nombre });

test('Variables: crear con el nombre de otra no avisa y se guarda', async ({ page }) => {
  await goto(page, 'admin/variables');
  const antes = await filas(page, 'Nombre del agente').count();
  await page.locator('sc-top-bar').getByRole('button', { name: /^Nuev/ }).click();
  const panel = page.locator('sc-repo-form-panel');
  const campo = panel.getByRole('textbox', { name: 'Nombre' });
  await expect(campo).toBeFocused();
  await campo.pressSequentially('Nombre del agente');
  await panel.getByRole('textbox', { name: 'Clave' }).pressSequentially('{otro_agente}');
  await panel.getByRole('button', { name: 'Crear' }).click();
  await expect(panel).toHaveCount(0);
  await expect(filas(page, 'Nombre del agente')).toHaveCount(antes + 1);
});

test('Etiquetas: crear con el nombre de otra no avisa y se guarda', async ({ page }) => {
  await goto(page, 'admin/labels');
  const nombre = 'Soporte Nivel 1';
  const antes = await filas(page, nombre).count();
  await page.locator('sc-top-bar').getByRole('button', { name: /^Nuev/ }).click();
  const panel = page.locator('sc-label-form-panel');
  const campo = panel.getByRole('textbox', { name: 'Nombre' });
  await expect(campo).toBeFocused();
  await campo.pressSequentially(nombre);
  await panel.getByRole('textbox', { name: 'Descripción' }).pressSequentially('Otra con el mismo nombre');
  await panel.getByRole('button', { name: 'Crear' }).click();
  await expect(panel).toHaveCount(0);
  await expect(filas(page, nombre)).toHaveCount(antes + 1);
});
