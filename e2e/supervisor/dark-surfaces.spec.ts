import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceDarkTheme, goto } from './helpers';

/**
 * EL TEMA OSCURO ES OSCURO ENTERO.
 *
 * Por qué existe: los tokens `--sc-color-*` son la paleta PRIMITIVA y no se
 * remapean en oscuro — `07-dark.css` no define ni uno solo. Escribir
 * `background: var(--sc-color-slate-100)` en una hoja de página es, por tanto,
 * escribir un valor FIJO. En claro se ve bien y nadie se entera; en oscuro se
 * queda claro. Y si encima el texto de encima sí es semántico (`--sc-text-*`,
 * que sube a un gris claro), el resultado es gris claro sobre gris claro.
 *
 * Eso es exactamente lo que se midió el 2026-07-19 en 28 rutas:
 *   - `.rules-status--inactive`  1.40:1  — la palabra INACTIVA no se leía
 *   - `.avatar`                  1.09:1  — círculo blanco en grupos y agentes
 *   - `.nav-item--active` (AED)  1.09:1  — el item SELECCIONADO, invisible
 *   - `.nav-item__icon`          1.21:1
 *   - 32 tokens `--sc-label-*` sin valor oscuro → chips, pastillas y etiquetas
 *     pintaban islas pastel sobre el lienzo oscuro en media aplicación.
 *
 * Ninguna prueba lo cazó porque ninguna miraba en oscuro. El comportamiento
 * era correcto; solo estaba ilegible. Esta es la afirmación que faltaba.
 *
 * Dos aserciones por ruta, que responden a dos preguntas distintas:
 *   1. ¿Queda alguna superficie CLARA? (el defecto original)
 *   2. ¿Se lee el texto que va encima? (el defecto DEL REVÉS: al oscurecer un
 *      fondo puedes dejar texto oscuro encima; ya pasó con `sc-label[info]`,
 *      que emparejaba texto crudo con fondo de la familia `label`)
 *
 * Los colores los normaliza el CANVAS, no un regex. Una primera versión de
 * esta medición parseaba `color(srgb 0.99 0.88 0.88 / .5)` con `/\d+/g`,
 * sacaba `[0, 996078, 0]` y reportaba un defecto que no existía.
 */

test.use({ storageState: { cookies: [], origins: [] }, colorScheme: 'dark' });

test.beforeEach(async ({ page }) => {
  await forceDarkTheme(page);
  await disableAnimations(page);
});

/**
 * Una ruta por familia de pantalla. Las nueve de repositorios comparten
 * plantilla, así que van tres como muestra; el resto es cobertura real.
 */
const RUTAS = [
  'conversaciones',
  'conversaciones/reglas',
  'conversaciones/categorias',
  'conversaciones/entidades',
  'admin/usuarios',
  'admin/grupos',
  'admin/agentes',
  'admin/labels',
  'admin/plantillas',
  'admin/repositorios',
  'admin/agendas',
  'admin/reglas-ia',
  'config/aed/servicio',
  'config/aed/agentes',
  'config/aed/grupos',
  'config/seguridad',
  'config/sistema',
] as const;

/** Umbral de luminancia por encima del cual una superficie es "clara". El
 *  lienzo oscuro más claro del tema (`--sc-bg-surface`, slate-900) mide 0.02,
 *  así que 0.5 deja muchísimo margen: solo salta lo que de verdad es claro. */
const L_CLARO = 0.5;

/** Recorre `main` en el navegador y devuelve las superficies problemáticas. */
const medir = (umbral: number) => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true })!;

  /** Cualquier sintaxis CSS → [r,g,b,a]. La normaliza el navegador. */
  const parse = (css: string): [number, number, number, number] => {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = css;
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0]!, d[1]!, d[2]!, d[3]! / 255];
  };
  const sobre = (
    fg: [number, number, number, number],
    bg: [number, number, number, number],
  ): [number, number, number, number] => {
    const a = fg[3];
    return [
      Math.round(fg[0] * a + bg[0] * (1 - a)),
      Math.round(fg[1] * a + bg[1] * (1 - a)),
      Math.round(fg[2] * a + bg[2] * (1 - a)),
      1,
    ];
  };
  const lum = ([r, g, b]: number[]): number => {
    const f = (v: number): number => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
  };
  const ratio = (a: number[], b: number[]): number => {
    const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
    return (hi + 0.05) / (lo + 0.05);
  };
  /** Fondo EFECTIVO: compone la cadena de ancestros de raíz a hoja. Sin esto,
   *  un `color-mix(... transparent)` se lee como si fuera opaco. */
  const fondoEfectivo = (el: Element): [number, number, number, number] => {
    const cadena: [number, number, number, number][] = [];
    for (let n: Element | null = el; n; n = n.parentElement)
      cadena.unshift(parse(getComputedStyle(n).backgroundColor));
    let acc: [number, number, number, number] = [255, 255, 255, 1];
    for (const c of cadena) acc = sobre(c, acc);
    return acc;
  };

  const claras: string[] = [];
  const ilegibles: string[] = [];

  for (const el of document.querySelectorAll('main#main-content *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 30 || r.height < 14) continue;
    const cs = getComputedStyle(el);
    if (parse(cs.backgroundColor)[3] === 0) continue; // sin fondo propio

    const bg = fondoEfectivo(el);
    const id = `${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 44)}`;

    if (lum(bg) > umbral) {
      claras.push(`${id} bg=rgb(${bg.slice(0, 3)}) L=${lum(bg).toFixed(2)}`);
      continue;
    }

    // Texto PROPIO: si el elemento solo contiene hijos, su `color` no pinta
    // nada y el ratio no significaría nada.
    const propio = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
    if (!propio) continue;
    const fg = sobre(parse(cs.color), bg);
    const fs = parseFloat(cs.fontSize);
    const grande = fs >= 24 || (fs >= 18.66 && Number(cs.fontWeight) >= 700);
    const umbralAA = grande ? 3 : 4.5;
    const c = ratio(bg, fg);
    if (c < umbralAA) {
      ilegibles.push(`${id} bg=rgb(${bg.slice(0, 3)}) fg=rgb(${fg.slice(0, 3)}) ${c.toFixed(2)}:1 (${fs}px)`);
    }
  }
  return { claras, ilegibles };
};

/** VALIDAR EL VALIDADOR: sin `.sc-dark` esto no mide nada y pasaría en verde. */
const asegurarOscuro = async (page: Page): Promise<void> => {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('sc-dark')))
    .toBe(true);
};

for (const ruta of RUTAS) {
  test(`${ruta} · ninguna superficie se queda en claro`, async ({ page }) => {
    await goto(page, ruta);
    await asegurarOscuro(page);
    const { claras } = await page.evaluate(medir, L_CLARO);
    expect(claras, `superficies claras en tema oscuro:\n${claras.join('\n')}`).toEqual([]);
  });

  test(`${ruta} · el texto se lee sobre su fondo`, async ({ page }) => {
    await goto(page, ruta);
    await asegurarOscuro(page);
    const { ilegibles } = await page.evaluate(medir, L_CLARO);
    expect(ilegibles, `texto bajo AA en tema oscuro:\n${ilegibles.join('\n')}`).toEqual([]);
  });
}
