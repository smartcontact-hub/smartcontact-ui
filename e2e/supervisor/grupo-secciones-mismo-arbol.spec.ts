import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LAS CUATRO SECCIONES DE LA FICHA DE GRUPO, EN EL MISMO ÁRBOL (DD-182).
 *
 * Hasta el 2026-10-06 solo «Distribución y colas» seguía Section → Subsection → Slot (DD-157): General, Recursos
 * y Agentes eran una tarjeta blanca con bloques propios de la hoja de la ficha. Lo que fija, en las cuatro:
 *   1. la sección va sobre el fondo gris (`subtle`);
 *   2. cada bloque es un `sc-subsection`, con su título;
 *   3. ya no queda ningún bloque dibujado a mano (`.sub-section`).
 * General gana «Postconversación» con DD-187: comentarios y tipificación, que hasta entonces estaba en Recursos.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const SECCIONES = [
  { clave: 'general', titulos: ['Identidad', 'Canales', 'Postconversación'] },
  { clave: 'distribucion', titulos: ['Reglas comunes', 'Teléfono', 'Chat', 'Email'] },
  { clave: 'recursos', titulos: ['Repositorios', 'Ficha de cliente'] },
  { clave: 'agentes', titulos: ['Agentes asignados'] },
] as const;

for (const { clave, titulos } of SECCIONES) {
  test(`grupo · ${clave} · sobre el gris y con sus subsecciones`, async ({ page }) => {
    await goto(page, `admin/grupos/editar/11?seccion=${clave}`);
    await expect(page.locator('.sc-subsection').first()).toBeVisible();
    expect(await page.locator('.sub-section').count()).toBe(0);
    expect(await page.locator('.sc-subsection__title').allTextContents()).toEqual(titulos);
    const fondo = await page.locator('sc-section-card > *').first().evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(fondo).toBe('rgb(247, 248, 250)');
  });
}
