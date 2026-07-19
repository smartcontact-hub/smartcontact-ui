import { expect, test, type Page } from '@playwright/test';

import {
  asegurarBuildFresco,
  disableAnimations,
  forceDarkTheme,
  forceLightTheme,
  goto,
} from './helpers';

/**
 * SE LEE EN LOS DOS TEMAS.
 *
 * Por qué existe: los tokens `--sc-color-*` son la paleta PRIMITIVA y no se
 * remapean en oscuro — `07-dark.css` no define ni uno solo. Escribir
 * `background: var(--sc-color-slate-100)` en una hoja de página es, por tanto,
 * escribir un valor FIJO. En claro se ve bien y nadie se entera; en oscuro se
 * queda claro. Y si encima el texto es semántico (`--sc-text-*`, que sube a un
 * gris claro), el resultado es gris claro sobre gris claro.
 *
 * Eso es lo que se midió el 2026-07-19 en 28 rutas:
 *   - `.rules-status--inactive`  1.40:1  — la palabra INACTIVA no se leía
 *   - `.avatar`                  1.09:1  — círculo blanco en grupos y agentes
 *   - `.nav-item--active` (AED)  1.09:1  — el item SELECCIONADO, invisible
 *   - `.memory-failed-chip`      2.16:1  — el chip que AVISA de los errores
 *   - `td.…__id` en fila fallida 1.30:1
 *   - 32 tokens `--sc-label-*` sin valor oscuro → chips, pastillas y etiquetas
 *     pintaban islas pastel sobre el lienzo oscuro en media aplicación.
 *
 * Ninguna prueba lo cazó porque ninguna miraba el color. El comportamiento era
 * correcto; solo estaba ilegible.
 *
 * **Y por eso corre también en CLARO**: al ir a arreglar el oscuro salieron
 * cuatro fallos de AA que llevaban ahí desde siempre y que nadie buscaba (el
 * tono `muted` de `.sc-label` y `.status-pill` medía 1.92:1). Una red que solo
 * mira un tema sugiere que el otro está comprobado, y no lo estaba.
 *
 * Dos aserciones por ruta y tema, que son dos preguntas distintas:
 *   1. ¿Alguna superficie desentona con el tema? (el defecto original)
 *   2. ¿Se lee el texto que va encima? (el defecto DEL REVÉS: al oscurecer un
 *      fondo puedes dejar texto oscuro encima; ya pasó con `sc-label[info]`)
 *
 * Los colores los normaliza el CANVAS, no un regex. Una primera versión de
 * esta medición parseaba `color(srgb 0.99 0.88 0.88 / .5)` con `/\d+/g`,
 * sacaba `[0, 996078, 0]` y reportaba un defecto que no existía.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const TEMAS = [
  { nombre: 'oscuro', aplicar: forceDarkTheme, claseRaiz: true },
  { nombre: 'claro', aplicar: forceLightTheme, claseRaiz: false },
] as const;

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

/**
 * SUB-AA CONOCIDO, MEDIDO Y NO ARREGLADO — todo en tema CLARO.
 *
 * Los cuatro que quedan tienen algo en común y por eso están juntos: **ninguno
 * es CSS de la app**. Todo lo que dependía de una hoja de página está
 * arreglado. Estos cuatro salen de valores del propio DS / del Kit, así que
 * cambiarlos cambia el aspecto de TODAS las pantallas y de cualquier app que
 * consuma el DS. No es una decisión que deba colarse dentro de un arreglo de
 * contraste: necesita a Rafa, y a Marta para los dos de botón.
 *
 * Se fijan AQUÍ, con su número, no se esconden: cualquier OTRO fallo rompe la
 * prueba. Cada línea se borra el día que se decida su valor.
 *
 *  1. ~~`--sc-text-subtle`~~ — **RESUELTO el 2026-07-19**. Rafa eligió: AA por
 *     delante de la jerarquía. Sube de slate-400 (2.04:1) a slate-600 (4.52),
 *     con lo que se iguala a `secondary` y el tercer nivel de gris desaparece
 *     en claro. Ver `customs-catalog` §1.7. Su par ya no se informa: se gatea.
 *
 *  2. `--sc-text-secondary` sobre `--sc-bg-default` → **4.25:1**, y sobre
 *     slate-100 → **3.92:1**. Límite ya documentado y aceptado a propósito en
 *     `customs-catalog` §1.5: subirlo a slate-700 lo arreglaría pero lo deja
 *     a un paso de `--sc-text-primary` y entonces "secundario" no significa
 *     nada. Se cambiaría un fallo de contraste por uno de jerarquía.
 *
 *  3. `p-button-danger` — blanco sobre red-500 → **3.76:1**. Preset del DS.
 *
 *  4. `p-button-secondary` + `outlined` — etiqueta en slate-500 sobre blanco
 *     → **2.95:1**. Es el botón "Añadir" de AED, un control primario de la
 *     pantalla. Preset del DS.
 */
const CONOCIDOS_CLARO = [
  // 1 · --sc-text-subtle: FUERA de esta lista desde el 2026-07-19. Ya cumple.
  'fg=rgb(111,119,132)', // 2 · --sc-text-secondary (slate-600) sobre lienzo
  'bg=rgb(239,68,68) fg=rgb(255,255,255)', // 3 · p-button-danger
  'fg=rgb(143,151,163)', // 4 · slate-500: etiqueta de p-button-secondary outlined
];

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
    if (r.width === 0 || r.height === 0) continue; // no pinta nada
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const id = `${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 44)}`;

    // --- Pregunta 1: superficies. Solo elementos con fondo PROPIO y tamaño.
    const tieneFondo = parse(cs.backgroundColor)[3] > 0;
    if (tieneFondo && r.width >= 30 && r.height >= 14) {
      const bgSup = fondoEfectivo(el);
      if (lum(bgSup) > umbral) {
        claras.push(`${id} bg=rgb(${bgSup.slice(0, 3)}) L=${lum(bgSup).toFixed(2)}`);
        continue; // ya reportado; su texto se juzgará cuando se arregle el fondo
      }
    }

    // --- Pregunta 2: legibilidad. Cualquier elemento con texto PROPIO, TENGA
    // O NO fondo propio. La primera versión exigía fondo propio y por eso se
    // saltaba el caso más común de todos: el texto vive en un `<span>` sin
    // fondo dentro de un contenedor que sí lo tiene. Con ese filtro,
    // `.memory-failed-chip` (rojo oscuro sobre fondo oscuro) pasaba en verde.
    const propio = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
    if (!propio) continue;

    // Los controles INACTIVOS están exentos de 1.4.3 por la propia norma. No es
    // una excusa: un botón deshabilitado tiene que parecer deshabilitado.
    if (el.closest('[disabled],[aria-disabled="true"],.is-disabled')) continue;

    // Los iconos de Material Symbols son LIGATURAS: llegan aquí como nodos de
    // texto y el DOM no los distingue de una palabra. Pero son gráficos, así
    // que su umbral es el de 1.4.11 (3:1 no-textual), no el de texto. Medirlos
    // con 4.5 llenaría esto de falsos positivos y la red acabaría silenciada.
    const esIcono =
      el.classList.contains('sc-icon') || /material symbols/i.test(cs.fontFamily);

    const bg = fondoEfectivo(el);
    const fg = sobre(parse(cs.color), bg);
    const fs = parseFloat(cs.fontSize);
    const grande = fs >= 24 || (fs >= 18.66 && Number(cs.fontWeight) >= 700);
    const umbralAA = esIcono || grande ? 3 : 4.5;
    const c = ratio(bg, fg);
    if (c < umbralAA) {
      ilegibles.push(
        `${id}${esIcono ? ' [icono 3:1]' : ''} bg=rgb(${bg.slice(0, 3)}) fg=rgb(${fg.slice(0, 3)}) ${c.toFixed(2)}:1 (${fs}px)`,
      );
    }
  }
  return { claras, ilegibles };
};

/**
 * VALIDAR EL VALIDADOR. Sin esto la sonda mediría el tema equivocado y pasaría
 * en VERDE, que es la peor forma de fallar: una red que dice "comprobado" sin
 * haber comprobado nada. Ya me pasó una vez inventándome una clase `sc-theme-dark`
 * que no existe — las lecturas salieron incoherentes y tardé en verlo.
 */
const asegurarTema = async (page: Page, oscuro: boolean): Promise<void> => {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('sc-dark')))
    .toBe(oscuro);
};

for (const { nombre, aplicar, claseRaiz } of TEMAS) {
  test.describe(`tema ${nombre}`, () => {
    test.beforeEach(async ({ page }) => {
      await aplicar(page);
      await disableAnimations(page);
    });

    for (const ruta of RUTAS) {
      /* La pregunta de las SUPERFICIES solo tiene sentido en oscuro: en claro
       * una superficie oscura es legítima (el botón primario, la sidebar), así
       * que "hay algo oscuro" no significaría nada. En claro el defecto
       * equivalente lo caza la segunda pregunta, que sí vale en los dos. */
      if (claseRaiz) {
        test(`${ruta} · ninguna superficie se queda en claro`, async ({ page }) => {
          await goto(page, ruta);
          await asegurarTema(page, claseRaiz);
          const { claras } = await page.evaluate(medir, L_CLARO);
          expect(claras, `superficies claras en tema oscuro:\n${claras.join('\n')}`).toEqual([]);
        });
      }

      test(`${ruta} · el texto se lee sobre su fondo`, async ({ page }) => {
        await goto(page, ruta);
        // El orden importa: el guardián resuelve el valor esperado SEGÚN EL TEMA,
        // así que primero hay que confirmar cuál está aplicado.
        await asegurarTema(page, claseRaiz);
        await asegurarBuildFresco(page);
        const { ilegibles } = await page.evaluate(medir, L_CLARO);
        // La lista de conocidos es SOLO del tema claro: en oscuro no se
        // perdona ninguno, porque en oscuro no queda ninguno.
        const conocidos = claseRaiz ? [] : CONOCIDOS_CLARO;
        const reales = ilegibles.filter((l) => !conocidos.some((c) => l.includes(c)));
        expect(reales, `texto bajo AA en tema ${nombre}:\n${reales.join('\n')}`).toEqual([]);
      });
    }
  });
}
