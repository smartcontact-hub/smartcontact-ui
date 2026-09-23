import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Journeys de los formularios admin: rellenar → guardar → verlo en el listado.
 *
 * Es la red que faltaba: hasta ahora nada conducía el Supervisor, así que un
 * refactor transversal (sc-button, sc-field-wrapper) no tenía forma de
 * demostrar que los formularios seguían funcionando.
 *
 * Storage limpio por test → cada store admin re-siembra su SEED.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('usuarios · crear un usuario lo añade al listado', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');

  const name = `E2E Usuario ${Date.now()}`;
  await page.locator('#user-name').fill(name);
  await page.locator('#user-email').fill('e2e.usuario@smartcontact.test');
  await page.locator('#user-identifier').fill('E2E-001');

  const save = page.getByRole('button', { name: /guardar|save/i });
  await expect(save).toBeEnabled();
  await save.click();

  // Guardar navega al listado; la fila nueva debe estar ahí.
  await expect(page).toHaveURL(/admin\/usuarios$/);
  await expect(page.locator('tbody tr', { hasText: name })).toHaveCount(1);
});

test('usuarios · el botón de guardar exige los campos obligatorios', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');

  // Formulario vacío: Guardar no debe estar disponible.
  await expect(page.getByRole('button', { name: /guardar|save/i })).toBeDisabled();

  await page.locator('#user-name').fill('Solo nombre');
  await page.locator('#user-email').fill('sin-arroba');

  // Email inválido → sigue bloqueado (validación real, no solo "hay texto").
  await expect(page.getByRole('button', { name: /guardar|save/i })).toBeDisabled();
});

/*
 * El alta de grupo es un DIÁLOGO corto sobre la lista desde el 2026-09-23: nombre y canales, y lo
 * demás nace con los valores por defecto. Crear deja en la ficha del grupo, ya en edición (como
 * Contact Center), que es donde se le asignan agentes. Que además salga en el listado se comprueba
 * entrando a la lista.
 */
test('grupos · crear un grupo lo deja en su ficha y lo añade al listado', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await page.getByRole('button', { name: 'Nuevo grupo' }).click();

  const name = `E2E Grupo ${Date.now()}`;
  await page.locator('#group-create-name').fill(name);
  await page.getByRole('dialog', { name: 'Nuevo grupo' }).getByRole('button', { name: 'Crear' }).click();

  // El alta navega a la edición del grupo recién creado.
  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+$/);
  await expect(page.locator('.headline__name')).toHaveText(name);

  await goto(page, 'admin/grupos');
  await expect(page.locator('tbody tr', { hasText: name })).toHaveCount(1);
});
