import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * FUERA DE LAS CELDAS, EL VACÍO SE ESCRIBE (DD-197, «si el vacío significa algo, se escribe»).
 *
 * Una celda sin dato lleva «—» con «Sin dato» para el lector; un dato suelto del resumen no es una celda, y un «—»
 * ahí no dice nada. Medido el 2026-10-12 en el alta de agente: «Atiende por», «Extensión» y «Salientes» decían «—».
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('el resumen del alta de agente escribe lo que falta en vez de «—»', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  const datos = page.locator('.resumen__pairs');
  await expect(datos).toContainText('Sin canales');
  await expect(datos).toContainText('Sin extensión');
  await expect(datos).toContainText('Ninguno');
  await expect(datos).not.toContainText('—');
});
