import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceDarkTheme, forceLightTheme, goto } from './helpers';

/**
 * LA CIFRA PRINCIPAL DEL RESUMEN, CON COLOR (DD-161).
 *
 * La revisión de producto del 2026-10-04 pidió para el resumen la imagen de la vista previa de ProgressSpinner en
 * primeng.dev: una tarjeta con degradado y color, la cifra grande y el anillo que se llena. El widget ya era ese
 * ejemplo pasado a nuestros tokens (DD-126), sobre el tinte claro de todas las tarjetas. Lo que fija:
 *   1. una sola tarjeta destacada por resumen (la cifra principal: agentes del grupo, grupos del agente, servicios del
 *      usuario): si todo destaca, nada destaca;
 *   2. su fondo es un degradado de los tokens de marca, y su texto se lee (AA, 4,5:1) sobre cada tono del degradado,
 *      en claro y en oscuro;
 *   3. el arco del anillo se ve sobre la tarjeta (3:1, lo que pide un elemento gráfico).
 */

test.use({ storageState: { cookies: [], origins: [] } });

const FICHAS = [
  { nombre: 'grupo', ruta: 'admin/grupos/editar/11' },
  { nombre: 'alta de grupo', ruta: 'admin/grupos/crear' },
  { nombre: 'agente', ruta: 'admin/agentes/editar/1' },
  { nombre: 'usuario', ruta: 'admin/usuarios/editar/1' },
] as const;

/** Contraste WCAG entre dos colores `rgb(...)`. */
const medir = (page: Page) =>
  page.locator('.resumen__kpi--destacada').evaluate((tarjeta) => {
    const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const lum = (c: string) => {
      const [r, g, b] = rgb(c).map((v) => v / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const contraste = (a: string, b: string) => {
      const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (l1! + 0.05) / (l2! + 0.05);
    };
    const fondo = getComputedStyle(tarjeta).backgroundImage;
    const tonos = fondo.match(/rgba?\([^)]+\)/g) ?? [];
    const cifra = getComputedStyle(tarjeta.querySelector('.resumen__count')!).color;
    const rotulo = getComputedStyle(tarjeta.querySelector('.resumen__label')!).color;
    const arco = tarjeta.querySelector('.p-progressspinner-circle-range');
    const trazo = arco ? getComputedStyle(arco).stroke : null;
    return {
      degradado: fondo.startsWith('linear-gradient'),
      tonos: tonos.length,
      cifra: Math.min(...tonos.map((t) => contraste(cifra, t))),
      rotulo: Math.min(...tonos.map((t) => contraste(rotulo, t))),
      arco: trazo ? Math.min(...tonos.map((t) => contraste(trazo, t))) : null,
    };
  });

for (const tema of ['claro', 'oscuro'] as const) {
  for (const { nombre, ruta } of FICHAS) {
    test(`${nombre} · ${tema}: una tarjeta destacada, con degradado de marca, texto AA y anillo a la vista`, async ({ page }) => {
      await (tema === 'oscuro' ? forceDarkTheme : forceLightTheme)(page);
      await disableAnimations(page);
      await goto(page, ruta);
      await expect(page.locator('.resumen__kpi--destacada'), 'una sola por resumen').toHaveCount(1);
      const m = await medir(page);
      expect(m.degradado, 'el fondo es un degradado').toBe(true);
      expect(m.tonos, 'con al menos dos tonos').toBeGreaterThanOrEqual(2);
      expect(m.cifra, 'la cifra sobre el tono más difícil').toBeGreaterThanOrEqual(4.5);
      expect(m.rotulo, 'el rótulo sobre el tono más difícil').toBeGreaterThanOrEqual(4.5);
      if (m.arco !== null) expect(m.arco, 'el arco del anillo').toBeGreaterThanOrEqual(3);
    });
  }
}
