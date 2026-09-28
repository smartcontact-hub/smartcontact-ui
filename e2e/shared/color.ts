/**
 * Color EFECTIVO medido en el navegador: el que ve el usuario, no el que declara el CSS. Para las
 * e2e y para cualquier sonda de un solo uso que mida contraste.
 *
 * Por qué existe: `getComputedStyle` sirve cada color en su propia sintaxis —`rgb()`, `rgba()`,
 * `color(srgb r g b / a)` con canales de 0 a 1, `oklch()`…— y un regex sobre esa cadena devuelve
 * basura sin avisar: `/\d+/g` sobre `color(srgb 0.99 0.88 0.88 / 0.5)` saca `[0, 99, 0]`. Y aunque
 * el color se lea bien, una capa translúcida no se ve tal cual: se ve compuesta sobre lo que tiene
 * debajo. Las dos trampas mordieron:
 *   · la primera versión de `theme-contrast` (s18) sacaba `[0, 996078, 0]` y reportó un defecto
 *     que no existía;
 *   · una sonda del resumen de las fichas (DD-126, 2026-09-27) leyó los colores con su propio regex
 *     y dio en oscuro 20,91 (texto) y 4,27 (anillo); compuestas las capas eran 15,57 y 3,18. Las
 *     cifras malas llegaron a una página de decisión antes de corregirse.
 * La regla en prosa (LEARNINGS #2) no paró la segunda; un instrumento compartido y probado, sí.
 * Aquí el color lo normaliza el CANVAS, las capas se componen de la raíz a la hoja, y
 * `color.spec.ts` se pone en rojo si alguien cambia el canvas por un regex.
 *
 * Uso, en una e2e o en una sonda:
 *
 *   const { color, fondo, ratio } = await locator.evaluate(colorEfectivo);  // el texto
 *   const { ratio } = await locator.evaluate(colorEfectivo, 'stroke');      // el arco de un anillo SVG
 *   ratioContraste([111, 119, 132], [255, 255, 255]);                      // en Node, ya medidos
 *
 * Qué NO compone (si la pieza lo usa, mídela con una captura): `opacity` por debajo de 1, `filter`,
 * `mix-blend-mode`, e imágenes o degradados de fondo. Bajo la raíz supone blanco.
 */

/** Un color en 0-255 por canal, ya compuesto: sin alfa. */
export type Rgb = [number, number, number];
type Rgba = [number, number, number, number];

/**
 * Todas las piezas, en UNA función AUTOSUFICIENTE: su fuente viaja tal cual al navegador (ver
 * `enNavegador`), así que dentro no puede haber nada que cierre sobre el módulo. Lo que no toca el
 * DOM (`sobre`, `luminancia`, `ratioContraste`) sirve también en Node: ver el `export` de abajo.
 * Es el mismo código en los dos lados; no hay una copia que se afile y otra que no.
 */
export const kitColor = () => {
  let cx: CanvasRenderingContext2D | undefined;

  /** Cualquier sintaxis CSS → [r, g, b, a], r g b en 0-255 y a en 0-1. La normaliza el canvas. */
  const rgba = (css: string): Rgba => {
    if (!cx) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 1;
      cx = cv.getContext('2d', { willReadFrequently: true })!;
    }
    /* Un color que el canvas no entiende (una `var()`, una cadena vacía) no da error: se queda el
     * ANTERIOR, en silencio. Con dos centinelas se nota: si sobrevive el centinela las dos veces,
     * no lo ha leído. */
    cx.fillStyle = '#000';
    cx.fillStyle = css;
    if (cx.fillStyle === '#000000') {
      cx.fillStyle = '#fff';
      cx.fillStyle = css;
      if (cx.fillStyle === '#ffffff')
        throw new Error(`el canvas no entiende «${css}»: pásale un color resuelto, no una variable`);
    }
    cx.clearRect(0, 0, 1, 1);
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0]!, d[1]!, d[2]!, d[3]! / 255];
  };

  /** `arriba` compuesto sobre `abajo`, que ya es opaco: lo que se ve. */
  const sobre = (arriba: Rgba, abajo: Rgb | Rgba): Rgba => {
    const a = arriba[3];
    return [
      Math.round(arriba[0] * a + abajo[0] * (1 - a)),
      Math.round(arriba[1] * a + abajo[1] * (1 - a)),
      Math.round(arriba[2] * a + abajo[2] * (1 - a)),
      1,
    ];
  };

  /** Fondo EFECTIVO: los fondos de la cadena de ancestros, compuestos de la raíz a la hoja. Sin
   *  esto, un `color-mix(... transparent)` se lee como si fuera opaco. */
  const fondo = (el: Element): Rgba => {
    const cadena: Rgba[] = [];
    for (let n: Element | null = el; n; n = n.parentElement)
      cadena.unshift(rgba(getComputedStyle(n).backgroundColor));
    let acc: Rgba = [255, 255, 255, 1];
    for (const c of cadena) acc = sobre(c, acc);
    return acc;
  };

  /** Luminancia relativa (WCAG 2.x). */
  const luminancia = ([r, g, b]: readonly number[]): number => {
    const f = (v: number): number => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
  };

  /** Ratio de contraste (WCAG 2.x), en cualquier orden: de 1 a 21. */
  const ratioContraste = (a: readonly number[], b: readonly number[]): number => {
    const [hi, lo] =
      luminancia(a) > luminancia(b) ? [luminancia(a), luminancia(b)] : [luminancia(b), luminancia(a)];
    return (hi + 0.05) / (lo + 0.05);
  };

  return { rgba, sobre, fondo, luminancia, ratioContraste };
};

export type KitColor = ReturnType<typeof kitColor>;

/** En Node, las piezas que no tocan el DOM. */
export const { sobre, luminancia, ratioContraste } = kitColor();

/**
 * Prepara una función para `page.evaluate` o `locator.evaluate` con el kit DENTRO.
 *
 * Playwright no manda al navegador la función: manda su FUENTE (`fn.toString()`). Lo que cierre
 * sobre un import no viaja, y allí revienta con un `ReferenceError`. Por eso la función no importa
 * el kit: lo recibe como PRIMER argumento, y esta envoltura lo monta en el navegador desde el
 * fuente de `kitColor`. Lo que pasa Playwright (el elemento, el `arg`) va detrás.
 *
 *   await page.evaluate(enNavegador((kit, umbral: number) => ...), 4.5);
 */
export const enNavegador = <A extends unknown[], R>(
  fn: (kit: KitColor, ...args: A) => R,
): ((...args: A) => R) =>
  new Function('...args', `return (${fn})((${kitColor})(), ...args);`) as (...args: A) => R;

/**
 * En el navegador: el color efectivo de `propiedad` sobre el fondo efectivo del elemento, y su
 * ratio. `propiedad` va como en CSS: `color` (el texto, por defecto), `stroke` para el arco de un
 * anillo SVG, `border-bottom-color` para un separador.
 */
export const colorEfectivo = enNavegador(
  (kit, el: Element, propiedad: string = 'color'): { color: Rgb; fondo: Rgb; ratio: number } => {
    const fondo = kit.fondo(el);
    const color = kit.sobre(kit.rgba(getComputedStyle(el).getPropertyValue(propiedad)), fondo);
    return {
      color: [color[0], color[1], color[2]],
      fondo: [fondo[0], fondo[1], fondo[2]],
      ratio: kit.ratioContraste(color, fondo),
    };
  },
);
