import { expect, test } from '@playwright/test';

import { colorEfectivo, enNavegador, ratioContraste } from './color';

/**
 * EL INSTRUMENTO DE COLOR, CONTRA CASOS CUYA RESPUESTA YA SE SABE (LEARNINGS #2).
 *
 * `color(srgb 0.99 0.88 0.88 / .5)` es el caso que ya engañó a un regex: `getComputedStyle` lo
 * sirve así, con canales de 0 a 1 y alfa. Sobre blanco, la cuenta exacta es 255 · (c · ½ + ½):
 * 253,7 · 239,7 · 239,7. El canvas guarda 8 bits, así que se admite un escalón y nada más. Un
 * parser de regex no se acerca: `/\d+/g` lee [0, 99, 0] y sin alfa; `/[\d.]+/g` toma los canales
 * de 0 a 1 como si fueran de 0 a 255, y sale un gris de 128. Con cualquiera de los dos en lugar del
 * canvas, los dos primeros tests se ponen en rojo.
 */
const CAPA = 'color(srgb 0.99 0.88 0.88 / .5)';
const FONDO_EXACTO = [0.99, 0.88, 0.88].map((c) => 255 * (c * 0.5 + 0.5));
/** El texto negro al 50 % sobre ese fondo. */
const TEXTO_EXACTO = FONDO_EXACTO.map((c) => c * 0.5);

/** A un escalón de 8 bits, canal a canal. */
const aUnEscalon = (medido: number[], exacto: number[]): void => {
  const lejos = medido.filter((v, i) => Math.abs(v - exacto[i]!) > 1);
  expect(lejos, `medido [${medido}], exacto [${exacto.map((v) => v.toFixed(1))}]`).toEqual([]);
};

test.describe('color efectivo de una capa translúcida', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(`
      <div style="background: #fff">
        <div id="capa" style="background-color: ${CAPA}">
          <span id="texto" style="color: rgb(0 0 0 / 0.5)">Texto</span>
        </div>
      </div>`);
  });

  test('una capa color(srgb …) al 50 % se compone sobre el blanco de debajo', async ({ page }) => {
    const capa = page.locator('#capa');
    // El estímulo es el que produce el navegador, no uno inyectado (LEARNINGS #1).
    expect(await capa.evaluate((el) => getComputedStyle(el).backgroundColor)).toMatch(/^color\(srgb /);
    const { fondo } = await capa.evaluate(colorEfectivo);
    aUnEscalon(fondo, FONDO_EXACTO);
  });

  test('el texto translúcido se compone sobre el fondo de sus ancestros, y el ratio sale de ahí', async ({
    page,
  }) => {
    // El `span` no tiene fondo propio: el suyo es el de la cadena, compuesto.
    const { color, fondo, ratio } = await page.locator('#texto').evaluate(colorEfectivo);
    aUnEscalon(fondo, FONDO_EXACTO);
    aUnEscalon(color, TEXTO_EXACTO);
    // 3,9:1. Si el alfa del texto se perdiera, saldría negro opaco: 18,8.
    expect(ratio).toBeCloseTo(ratioContraste(TEXTO_EXACTO, FONDO_EXACTO), 1);
  });
});

test('un color que el canvas no entiende no se cuela como el anterior', async ({ page }) => {
  const leer = (css: string) => page.evaluate(enNavegador((kit, c: string) => kit.rgba(c)), css);
  await expect(leer('var(--sc-bg-canvas)')).rejects.toThrow(/no entiende/);
  // El centinela no confunde el negro de verdad con un color ilegible.
  expect(await leer('rgb(0, 0, 0)')).toEqual([0, 0, 0, 1]);
});

test('ratioContraste da los valores de referencia de WCAG', () => {
  expect(ratioContraste([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
  expect(ratioContraste([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5);
  // #767676, el gris más claro que cumple AA sobre blanco.
  expect(ratioContraste([118, 118, 118], [255, 255, 255])).toBeCloseTo(4.54, 2);
});
