import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * EL REPOSITORIO DE EMAIL (DD-185): cuentas de correo y triggers, como la pestaña Emails de Voice, y no en Grupos.
 *   1. La página trae las dos listas, cada una con su «Crear» y sus acciones por fila.
 *   2. Una cuenta se crea con sus datos de servidor entrante y saliente y se ve en la lista.
 *   3. Un trigger se crea con su condición y se ve en la lista; quitarlo pide confirmación.
 *   4. El hub de Repositorios tiene su tarjeta.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('la página de Email tiene sus dos listas, cada una con «Crear»', async ({ page }) => {
  await goto(page, 'admin/emails');
  await expect(page.getByRole('heading', { name: 'Email', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cuentas de correo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Triggers' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Crear', exact: true })).toHaveCount(2);
  await expect(page.getByRole('columnheader', { name: 'Emails totales' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Editar: / })).not.toHaveCount(0);
});

test('crear una cuenta de correo con sus servidores', async ({ page }) => {
  await goto(page, 'admin/emails/cuentas/crear');
  await expect(page.getByRole('heading', { name: 'Datos del correo entrante' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Datos del correo saliente' })).toBeVisible();
  await page.locator('#mailbox-name').fill('ventas@example.com');
  await page.locator('#mailbox-incoming-host').fill('imap.example.com');
  await page.locator('#mailbox-incoming-port').fill('993');
  await page.locator('#mailbox-incoming-user').fill('ventas@example.com');
  await page.getByRole('button', { name: 'Probar entrada' }).click();
  await expect(page.getByText('Conexión correcta con el servidor de entrada')).toBeVisible();
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/emails\/cuentas\/editar\/\d+/);
  await goto(page, 'admin/emails');
  await expect(page.getByText('ventas@example.com', { exact: true })).toBeVisible();
});

test('crear un trigger con su condición, y quitarlo pide confirmación', async ({ page }) => {
  await goto(page, 'admin/emails/triggers/crear');
  await page.locator('#trigger-name').fill('Reclamaciones');
  await pickSelectOption(page, page.locator('#trigger-field'), 'Asunto');
  await pickSelectOption(page, page.locator('#trigger-operator'), 'Contenga');
  await page.locator('#trigger-value').fill('reclamación');
  await page.getByRole('button', { name: 'Crear trigger', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/emails\/triggers\/editar\/\d+/);
  await goto(page, 'admin/emails');
  await expect(page.getByText('Reclamaciones', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar: Reclamaciones' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('el hub de Repositorios tiene la tarjeta de Email', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  await expect(page.locator('.repo-card', { hasText: 'Email' })).toHaveCount(1);
});
