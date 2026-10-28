import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LOS PLACEHOLDERS DE LAS FICHAS DE REPOSITORIOS SE ESCRIBEN IGUAL (DD-238).
 *
 * El nombre lleva un ejemplo con «Ej: » (no «Ej.» ni un rótulo suelto como «Título de la plantilla») y la descripción,
 * donde la hay, «Breve descripción...». Agentes y Grupos no llevan placeholder: su nombre se escribe en el título.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

for (const [ficha, ruta, conDescripcion] of [
  ['agendas', 'admin/agendas/crear', true],
  ['tipificaciones', 'admin/tipificaciones/crear', true],
  ['equipos', 'admin/equipos/crear', true],
  ['plantillas', 'admin/plantillas/crear', false],
] as const) {
  test(`${ficha}: el nombre lleva «Ej: …»${conDescripcion ? ' y la descripción, «Breve descripción...»' : ''}`, async ({ page }) => {
    await goto(page, ruta);
    await expect(page.locator('input[placeholder^="Ej: "]').first()).toBeVisible();
    await expect(page.locator('input[placeholder^="Ej."]')).toHaveCount(0);
    if (conDescripcion) await expect(page.locator('input[placeholder="Breve descripción..."]').first()).toBeVisible();
  });
}
