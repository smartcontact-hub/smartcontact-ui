import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * CAMBIAR DE IDIOMA CAMBIA LA PANTALLA QUE TIENES DELANTE, SIN RECARGAR.
 *
 * El idioma se cambia en Configuración → Sistema, y esa misma página lleva los selectores de la política de
 * contraseñas. Sus opciones salían de un `computed()` con `translate.instant()` que no leía el idioma: al
 * pulsar «Inglés» toda la página pasaba a inglés menos esos selectores, que seguían en «8 caracteres» hasta
 * recargar (medido el 2026-09-15; 18 casos así en la app, que vigila `i18n:check` H). Una pantalla que se
 * monta DESPUÉS del cambio ya nace en el idioma bueno: por eso el caso que se ve es este.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sc-language', 'es');
    } catch {
      /* contexto sin storage — ignorar */
    }
  });
});

test('Sistema · al pasar a inglés, los selectores de la misma página también cambian', async ({ page }) => {
  await goto(page, 'config/sistema');
  const longitud = page.locator('sc-select.policy-row__select').first();
  await expect(longitud, 'la prueba parte del español: si no, no mide el cambio').toContainText('8 caracteres');

  // El idioma se elige con `sc-selectbutton` (DD-112): botones con `aria-pressed` dentro de un grupo con nombre.
  await page.getByRole('group', { name: 'Idioma de la interfaz' }).getByRole('button', { name: 'Inglés' }).click();
  await expect(page.getByRole('button', { name: 'English' }), 'el cambio de idioma no llegó').toHaveAttribute('aria-pressed', 'true');

  await expect(longitud).toContainText('8 characters');
});
