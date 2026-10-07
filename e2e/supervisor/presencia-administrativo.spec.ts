import { expect, test } from '@playwright/test';

import { disableAnimations, forceDarkTheme, forceLightTheme, goto } from './helpers';

/**
 * «ADMINISTRATIVO», EN MARRÓN (DD-176).
 *
 * El estado Administrativo de un agente se pintaba en amarillo (la severidad `warn`, la de los avisos). Pasa al color
 * de etiqueta `brown`, nuevo en la paleta del DS y hecho con primitivos del Kit. Tintado como las demás etiquetas
 * (DD-185; lleno chocaba con el resto): fondo `amber-100` y texto `amber-900`; en oscuro, `amber-800` al 45 % y texto
 * `amber-200`. Lo que fija, en el listado de agentes y en la tabla de agentes del grupo, en claro y en oscuro: la
 * etiqueta, con fondo cálido (marrón o ámbar, nunca gris ni azul) y su texto a AA.
 */

test.use({ storageState: { cookies: [], origins: [] } });

/** Luminancia relativa (WCAG) de un `rgb(...)`. */
const lum = (rgb: number[]) =>
  rgb
    .map((v) => v / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i]!, 0);

for (const oscuro of [false, true]) {
  for (const ruta of ['admin/agentes', 'admin/grupos/editar/11?seccion=agentes']) {
    test(`${ruta} · Administrativo, en marrón y legible · ${oscuro ? 'oscuro' : 'claro'}`, async ({ page }) => {
      await (oscuro ? forceDarkTheme : forceLightTheme)(page);
      await disableAnimations(page);
      await goto(page, ruta);
      const etiqueta = page.locator('sc-tag', { hasText: 'Administrativo' }).first();
      await expect(etiqueta).toBeVisible();
      const c = await etiqueta.evaluate((el) => {
        const caja = el.querySelector('.p-tag') ?? el.firstElementChild!;
        const cs = getComputedStyle(caja);
        const n = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
        return { fondo: n(cs.backgroundColor), texto: n(cs.color), color: (caja as HTMLElement).style.getPropertyValue('--label-bg') };
      });
      // En oscuro el amarillo de aviso también parece marrón: lo que distingue es que sea el color de etiqueta `brown`.
      expect(c.color, 'el color de etiqueta marrón').toContain('--sc-label-brown-bg');
      const [r, g, b] = c.fondo;
      // Cálido: rojo por encima de verde, y verde por encima de azul.
      expect(r! > g! && g! > b!, `fondo marrón (${c.fondo})`).toBe(true);
      const [l1, l2] = [lum(c.fondo), lum(c.texto)].sort((x, y) => y - x);
      expect((l1! + 0.05) / (l2! + 0.05), 'texto a AA sobre el marrón').toBeGreaterThanOrEqual(4.5);
    });
  }
}
