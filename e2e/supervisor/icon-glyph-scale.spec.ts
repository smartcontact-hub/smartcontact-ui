import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LOS ICONOS PINTAN EL TAMAÑO QUE PROMETEN, Y NINGUNO PISA SU TEXTO.
 *
 * Qué vigila y por qué existe (2026-09-14). Los tamaños de icono del DS vienen
 * del Kit, que dibuja con PrimeIcons, y PrimeIcons llena su caja. Material
 * Symbols no: su glifo típico ocupa 18 de las 24 unidades, así que un icono de
 * 12 pintaba 9 y todos los botones de icono de la app se veían enanos. El
 * arreglo es UNA regla, `scale: calc(24 / 18)` en `material-symbols.css`, que
 * agranda el dibujo sin tocar la caja. Este spec vigila los dos modos en que
 * eso se rompe sin que ningún gate estático lo vea:
 *
 *  1. **Un icono sin calibrar.** Alguien pinta Material con su propia clase o
 *     pisa `scale` → vuelve a verse enano. Se mide el `scale` COMPUTADO de cada
 *     glifo, no la regla escrita.
 *  2. **Un icono que roza su texto.** Con la calibración, un tamaño fijado a
 *     ojo para compensar lo enano (`[size]="20"` junto a una etiqueta de 14)
 *     compensa dos veces y el dibujo se come el hueco. Pasó en el menú de AED
 *     el mismo día: el glifo `groups` quedó a 1,9px de «Grupos».
 *
 * La tinta se mide con `measureText` sobre la fuente real, no con la caja: la
 * caja no cambia (esa es la gracia de `scale`), lo que crece es el dibujo.
 * El umbral de 2px sale del barrido de ese día: el hueco legítimo más estrecho
 * de la app era 2,9 (`groups`, glifo ancho, en AED) y el roto, 1,9.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** 24 unidades de rejilla / 18 de glifo típico. Escrito, no leído del CSS: es el control. */
const ESCALA = 24 / 18;
/** Hueco mínimo entre la tinta del icono y el texto de su misma línea. */
const HUECO_MINIMO = 2;

/* Las pantallas con más iconos de cada familia: listas, fichas, AED y Conversaciones. */
const RUTAS = [
  'conversaciones',
  'conversaciones/reglas/nueva',
  'config/aed/servicio',
  'config/sistema',
  'admin/usuarios',
  'admin/usuarios/crear',
  'admin/grupos/editar/1',
  'admin/agentes',
  'admin/agentes/editar/1',
  'admin/labels',
  'admin/plantillas',
  'admin/repositorios',
];

type Hallazgos = { medidos: number; sinCalibrar: string[]; rozan: string[] };

for (const ruta of RUTAS) {
  test(`iconos calibrados y sin rozar su texto · /${ruta}`, async ({ page }) => {
    await goto(page, ruta);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    const h = await page.evaluate(
      ({ escala, huecoMinimo }): Hallazgos => {
        const FUENTE = '"Material Symbols Outlined Variable"';
        if (!document.fonts.check(`14px ${FUENTE}`)) {
          throw new Error('La fuente de iconos no ha cargado: measureText mediría la de reserva.');
        }
        const ctx = document.createElement('canvas').getContext('2d')!;
        const ruta = (el: Element): string => {
          const partes: string[] = [];
          for (let e: Element | null = el, i = 0; e && i < 3; e = e.parentElement, i++) {
            partes.unshift(e.tagName.toLowerCase() + (e.classList[0] ? `.${e.classList[0]}` : ''));
          }
          return partes.join(' > ');
        };
        const out: Hallazgos = { medidos: 0, sinCalibrar: [], rozan: [] };

        document.querySelectorAll('.sc-icon, .sc-icon-font').forEach((el) => {
          const pseudo = el.classList.contains('sc-icon-font') ? '::before' : null;
          const cs = getComputedStyle(el, pseudo);
          if (!cs.fontFamily.includes('Material Symbols')) return;
          const glifo = pseudo ? cs.content.replace(/^"|"$/g, '') : (el.textContent ?? '').trim();
          const caja = el.getBoundingClientRect();
          if (!glifo || glifo === 'none' || !caja.width || !el.checkVisibility()) return;
          out.medidos++;

          const s = cs.scale === 'none' ? 1 : parseFloat(cs.scale);
          if (Math.abs(s - escala) > 0.001) {
            out.sinCalibrar.push(`${ruta(el)} "${glifo}" scale=${cs.scale}`);
            return;
          }

          ctx.font = `${cs.fontSize} ${FUENTE}`;
          const m = ctx.measureText(glifo);
          const tinta = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * s;
          const cx = caja.x + caja.width / 2;
          const cy = caja.y + caja.height / 2;

          /* El texto de su línea, dentro del control que lo contiene (o 4 niveles). */
          let cont: Element = el;
          for (let i = 0; i < 4 && cont.parentElement; i++) {
            cont = cont.parentElement;
            if (cont.matches('a, button, li, tr, td, th, label, [role="menuitem"], [role="option"], [role="tab"]')) break;
          }
          const paseo = document.createTreeWalker(cont, NodeFilter.SHOW_TEXT);
          for (let t = paseo.nextNode(); t; t = paseo.nextNode()) {
            const padre = t.parentElement;
            if (!t.textContent?.trim() || !padre || padre.closest('.sc-icon, .sc-icon-font, sc-icon')) continue;
            if (!padre.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
            const rango = document.createRange();
            rango.selectNodeContents(t);
            for (const r of rango.getClientRects()) {
              if (!(r.top < cy && r.bottom > cy)) continue;
              const hueco = Math.max(r.left - (cx + tinta / 2), cx - tinta / 2 - r.right);
              if (hueco < huecoMinimo) {
                out.rozan.push(`${ruta(el)} "${glifo}" ${cs.fontSize} a ${hueco.toFixed(1)}px de «${t.textContent.trim().slice(0, 24)}»`);
              }
            }
          }
        });
        return out;
      },
      { escala: ESCALA, huecoMinimo: HUECO_MINIMO },
    );

    expect(h.medidos, 'no se midió ningún icono: el selector o la página cambiaron').toBeGreaterThan(0);
    expect(h.sinCalibrar, 'iconos Material sin la calibración del glifo (se verán enanos)').toEqual([]);
    expect(h.rozan, `iconos a menos de ${HUECO_MINIMO}px de su texto`).toEqual([]);
  });
}
