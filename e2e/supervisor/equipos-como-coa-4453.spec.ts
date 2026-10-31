import { expect, test } from '@playwright/test';

import { goto } from './helpers';

/**
 * EQUIPOS COMO SU PÁGINA DE COA (SISMAC-4453, DD-245):
 *   1. el nombre avisa como Agendas y Plantillas: en gris bajo el campo desde el principio, en rojo al dejarlo vacío, y el
 *      tooltip de «Crear equipo» dice lo mismo («El nombre es obligatorio»);
 *   2. pulsar la cifra de agentes del listado abre el equipo ya en «Agentes»;
 *   3. la tabla de agentes enseña la foto de cada uno (o el avatar genérico si no tiene).
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('el nombre: gris al empezar, rojo al dejarlo vacío, y el tooltip del botón dice lo mismo', async ({ page }) => {
  await goto(page, 'admin/equipos/crear');
  const campo = page.locator('#grupo-agentes-name');
  const gris = page.locator('.sc-field__msg:not(.sc-field__msg--error)', { hasText: 'El nombre es obligatorio' });
  const rojo = page.locator('.sc-field__msg--error', { hasText: 'El nombre es obligatorio' });
  await expect(gris).toHaveCount(1);
  await expect(rojo).toHaveCount(0);

  const crear = page.locator('sc-top-bar').getByRole('button', { name: 'Crear equipo' });
  await expect(crear).toBeDisabled();
  await crear.locator('..').hover();
  await expect(page.locator('.p-tooltip')).toHaveText('El nombre es obligatorio');

  await campo.focus();
  await page.locator('#grupo-agentes-description').focus();
  await expect(rojo).toHaveCount(1);
  await expect(gris).toHaveCount(0);

  await campo.fill('Inglés');
  await expect(rojo).toHaveCount(0);
  await expect(crear).toBeEnabled();
});

test('la cifra de agentes del listado abre el equipo ya en «Agentes»', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await goto(page, 'admin/equipos');
  const fila = page.getByTestId('repo-table').locator('tbody tr').first();
  await fila.locator('sc-group-popover').getByRole('button').click();
  await expect(page).toHaveURL(/\/admin\/equipos\/editar\/\d+\?seccion=agentes$/);
  await expect(page.locator('#equipo-agentes')).toBeInViewport();
  await expect(page.locator('#equipo-agentes sc-assign-bar')).toBeInViewport();
});

test('la tabla de agentes enseña la foto del agente', async ({ page }) => {
  await goto(page, 'admin/equipos/crear');
  const fotos = page.locator('#equipo-agentes tbody sc-presence-avatar img');
  await expect(fotos.first()).toBeVisible();
});
