import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LOS PLACEHOLDERS DE LAS FICHAS DE REPOSITORIOS SE ESCRIBEN IGUAL (DD-238).
 *
 * El nombre lleva un ejemplo con «Ej: » (no «Ej.» ni un rótulo suelto como «Título de la plantilla») y la descripción,
 * donde la hay, «Breve descripción...». Agentes, Grupos, Plantillas y Agendas no llevan placeholder en el nombre (Plantillas, por el COA
 * SISMAC-4438; Agendas, por el COA SISMAC-4440).
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

for (const [ficha, ruta, conDescripcion] of [
  ['tipificaciones', 'admin/tipificaciones/crear', true],
  ['equipos', 'admin/equipos/crear', true],
] as const) {
  test(`${ficha}: el nombre lleva «Ej: …»${conDescripcion ? ' y la descripción, «Breve descripción...»' : ''}`, async ({ page }) => {
    await goto(page, ruta);
    await expect(page.locator('input[placeholder^="Ej: "]').first()).toBeVisible();
    await expect(page.locator('input[placeholder^="Ej."]')).toHaveCount(0);
    if (conDescripcion) await expect(page.locator('input[placeholder="Breve descripción..."]').first()).toBeVisible();
  });
}

test('agendas: el título no lleva placeholder y la descripción, «Breve descripción...»', async ({ page }) => {
  await goto(page, 'admin/agendas/crear');
  await expect(page.locator('#agenda-name')).toBeVisible();
  await expect(page.locator('#agenda-name')).not.toHaveAttribute('placeholder', /.+/);
  await expect(page.locator('input[placeholder="Breve descripción..."]').first()).toBeVisible();
});
