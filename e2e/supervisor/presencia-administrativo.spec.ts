import { expect, test } from '@playwright/test';

import { disableAnimations, forceDarkTheme, forceLightTheme, goto } from './helpers';

/**
 * «ADMINISTRATIVO», EN MARRÓN (DD-176).
 *
 * El estado Administrativo de un agente se pintaba en amarillo (la severidad `warn`, la de los avisos). Pasa al color
 * de etiqueta `brown`, nuevo en la paleta del DS y hecho con primitivos del Kit. Tintado como las demás etiquetas
 * (DD-185; lleno chocaba con el resto): fondo `amber-100` y texto `amber-900`; en oscuro, `amber-800` al 45 % y texto
 * `amber-200`. Lo que fija, en la tabla de agentes del grupo, en claro y en oscuro: la burbuja del avatar, con su
 * punto cálido (marrón, nunca gris ni azul). El listado de agentes ya no lleva burbuja (DD-187 §8): el estado ayuda a
 * decidir en la tabla del grupo, no en Administración.
 */

test.use({ storageState: { cookies: [], origins: [] } });


for (const oscuro of [false, true]) {
  for (const ruta of ['admin/grupos/editar/11?seccion=agentes']) {
    test(`${ruta} · Administrativo, en marrón en la burbuja del avatar · ${oscuro ? 'oscuro' : 'claro'}`, async ({ page }) => {
      await (oscuro ? forceDarkTheme : forceLightTheme)(page);
      await disableAnimations(page);
      await goto(page, ruta);
      // El estado va en la burbuja del avatar (DD-185): su palabra, oculta a la vista y dicha al lector, y su color.
      const avatar = page.locator('sc-presence-avatar', { has: page.locator('.visually-hidden', { hasText: 'Administrativo' }) }).first();
      await expect(avatar).toBeVisible();
      const c = await avatar.evaluate((el) => {
        const punto = el.querySelector('.p-badge') as HTMLElement;
        const n = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
        return { fondo: n(getComputedStyle(punto).backgroundColor), estilo: punto.getAttribute('style') ?? '' };
      });
      expect(c.estilo, 'el color de etiqueta marrón').toContain('--sc-label-brown-dot');
      const [r, g, b] = c.fondo;
      // Marrón: rojo por encima de verde, y verde por encima de azul.
      expect(r! > g! && g! > b!, `punto marrón (${c.fondo})`).toBe(true);
    });
  }
}
