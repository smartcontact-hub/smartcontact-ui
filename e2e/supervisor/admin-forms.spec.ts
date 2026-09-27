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

test('usuarios · crear un usuario lo deja en su ficha y lo añade al listado', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');

  const name = `E2E Usuario ${Date.now()}`;
  await page.locator('#user-name').fill(name);
  await page.locator('#user-email').fill('e2e.usuario@smartcontact.test');
  await page.locator('#user-identifier').fill('E2E-001');

  const save = page.getByRole('button', { name: 'Crear usuario' });
  await expect(save).toBeEnabled();
  await save.click();

  // Crear deja en la edición del usuario nuevo, como grupo y agente (DD-128; hasta el 2026-09-27 volvía al
  // listado). Que además salga en el listado se comprueba entrando a la lista.
  await expect(page).toHaveURL(/admin\/usuarios\/editar\/\d+$/);
  await expect(page.locator('.headline__name')).toHaveText(name);
  await goto(page, 'admin/usuarios');
  await expect(page.locator('tbody tr', { hasText: name })).toHaveCount(1);
});

test('usuarios · el botón de guardar exige los campos obligatorios', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');

  // Formulario vacío: «Crear usuario» no debe estar disponible.
  await expect(page.getByRole('button', { name: 'Crear usuario' })).toBeDisabled();

  await page.locator('#user-name').fill('Solo nombre');
  await page.locator('#user-email').fill('sin-arroba');

  // Email inválido → sigue bloqueado (validación real, no solo "hay texto").
  await expect(page.getByRole('button', { name: 'Crear usuario' })).toBeDisabled();
});

/*
 * El alta de grupo es la PROPIA FICHA en modo alta desde el 2026-09-26 (DD-121; del 2026-09-23 a ese
 * día fue un diálogo sobre la lista): «Nuevo grupo» la abre con los valores por defecto y Teléfono
 * marcado, y «Crear grupo», arriba, crea y deja en su edición. Que además salga en el listado se
 * comprueba entrando a la lista.
 */
test('grupos · crear un grupo lo deja en su ficha y lo añade al listado', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await page.getByRole('button', { name: 'Nuevo grupo' }).click();
  await expect(page).toHaveURL(/admin\/grupos\/crear$/);

  const name = `E2E Grupo ${Date.now()}`;
  await page.locator('#group-name').fill(name);
  await page.getByRole('button', { name: 'Crear grupo' }).click();

  // El alta navega a la edición del grupo recién creado.
  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+$/);
  await expect(page.locator('.headline__name')).toHaveText(name);

  await goto(page, 'admin/grupos');
  await expect(page.locator('tbody tr', { hasText: name })).toHaveCount(1);
});
