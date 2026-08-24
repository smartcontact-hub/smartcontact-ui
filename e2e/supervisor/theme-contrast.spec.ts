import { expect, test, type Page } from '@playwright/test';

import {
  asegurarBuildFresco,
  disableAnimations,
  forceDarkTheme,
  forceLightTheme,
  goto,
} from './helpers';
import { L_CLARO, medir } from '../shared/contrast-probe';

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
  // 1 · --sc-text-subtle          → FUERA desde el 2026-07-19 (§1.7). Cumple.
  // 3 · p-button-danger           → FUERA desde el 2026-07-19 (§1.8). Cumple.
  // 4 · p-button-secondary outlined → FUERA desde el 2026-07-19 (§1.8). Cumple.
  //
  // Queda UNO, y es el único de toda la app: `--sc-text-secondary` sobre el
  // LIENZO (no sobre tarjeta). 4.25:1, y 3.92 sobre slate-100. Aceptado a
  // propósito en §1.5 — subirlo a slate-700 lo pega a `text-primary` y cambia
  // un fallo de contraste por uno de jerarquía. Sobre tarjeta (que es donde
  // vive la mayor parte del texto secundario) mide 4.52 y cumple.
  'fg=rgb(111,119,132)',
];


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
          const { claras } = await page.evaluate(medir, { umbral: L_CLARO });
          expect(claras, `superficies claras en tema oscuro:\n${claras.join('\n')}`).toEqual([]);
        });
      }

      test(`${ruta} · el texto se lee sobre su fondo`, async ({ page }) => {
        await goto(page, ruta);
        // El orden importa: el guardián resuelve el valor esperado SEGÚN EL TEMA,
        // así que primero hay que confirmar cuál está aplicado.
        await asegurarTema(page, claseRaiz);
        await asegurarBuildFresco(page);
        const { ilegibles } = await page.evaluate(medir, { umbral: L_CLARO });
        // La lista de conocidos es SOLO del tema claro: en oscuro no se
        // perdona ninguno, porque en oscuro no queda ninguno.
        const conocidos = claseRaiz ? [] : CONOCIDOS_CLARO;
        const reales = ilegibles.filter((l) => !conocidos.some((c) => l.includes(c)));
        expect(reales, `texto bajo AA en tema ${nombre}:\n${reales.join('\n')}`).toEqual([]);
      });
    }

    /* LA SIDEBAR DESPLEGADA, UNA VEZ POR TEMA — no por ruta, porque es la misma
     * en las 17.
     *
     * Existe porque arreglar el filtro de opacidad ABRIÓ un hueco al cerrar el
     * otro: en reposo la sidebar está colapsada (`--sidebar-label-opacity: 0`),
     * así que ahora sus etiquetas y chevrones se saltan con razón — no se ven.
     * Pero es que se ven en cuanto pasas el ratón, y ahí es donde estaban los
     * 2,57:1 de los chevrones. Sin este test, la corrección del filtro habría
     * dejado la navegación entera sin medir y nadie se habría enterado.
     *
     * Y se mide CON HOVER puesto a propósito: la fila bajo el puntero se aclara
     * con su propio `rgb(255 255 255 / 0.05)`, que es medio punto de contraste
     * menos. El caso vinculante es ese, no el reposo. */
    test(`la sidebar desplegada se lee`, async ({ page }) => {
      await goto(page, RUTAS[0]);
      await asegurarTema(page, claseRaiz);
      await asegurarBuildFresco(page);
      await page.locator('aside').first().hover();
      await expect
        .poll(() =>
          page.evaluate(
            () => getComputedStyle(document.querySelector('.nav-item__label')!).opacity,
          ),
        )
        .toBe('1');
      const { ilegibles } = await page.evaluate(medir, { umbral: L_CLARO });
      const conocidos = claseRaiz ? [] : CONOCIDOS_CLARO;
      const reales = ilegibles.filter((l) => !conocidos.some((c) => l.includes(c)));
      expect(
        reales,
        `texto bajo AA en la sidebar desplegada (tema ${nombre}):\n${reales.join('\n')}`,
      ).toEqual([]);
    });
  });
}
