import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

/**
 * RED DE ESTRUCTURA DE LOS COMPONENTES DEL DS.
 *
 * El repo no tiene ni un test de componente Angular (0 `TestBed`), y eso lleva
 * meses bloqueando los refactores del DS (B2, B4): tocar cinco componentes
 * núcleo sin forma de saber si el HTML resultante cambia es apostar. Esta es
 * esa red, montada sobre lo que YA funciona aquí — Playwright y `sc-demo`, que
 * renderiza todos los componentes.
 *
 * Qué fija: el HTML RENDERIZADO de cada componente, normalizado. Un refactor
 * que reorganiza plantillas sin querer cambiar la salida deja esto intacto; si
 * algo se mueve, el diff dice exactamente qué.
 *
 * Por qué no `toMatchSnapshot` de Playwright: sus baselines se escriben con
 * sufijo de plataforma y ensucian el repo con ficheros `-darwin` (ya pasó con
 * la suite visual, que además falla 39 de 54 en macOS). Aquí el baseline es un
 * JSON propio, legible y revisable en un `git diff`.
 *
 * NO sustituye a los tests de comportamiento ni a la suite visual: fija
 * ESTRUCTURA. Que el DOM no cambie no dice que el componente funcione — dice
 * que tu refactor no lo movió, que es justo la pregunta de un refactor.
 *
 * Actualizar tras un cambio DELIBERADO:
 *   SC_UPDATE_STRUCTURE=1 npx playwright test component-structure
 * y revisa el diff del JSON antes de commitear: ahí se ve lo que cambiaste.
 */

const BASELINE = join(process.cwd(), 'e2e', 'baselines', 'component-structure.json');
const UPDATING = process.env['SC_UPDATE_STRUCTURE'] === '1';

/**
 * Componentes cubiertos. Los 5 primeros son los de B2 (los que duplican el
 * bloque label + mensaje); el resto entra porque comparte plantilla de campo y
 * cualquier extracción los rozaría.
 */
const COMPONENTS = [
  { route: 'inputtext', tag: 'sc-inputtext' },
  { route: 'select', tag: 'sc-select' },
  { route: 'multiselect', tag: 'sc-multiselect' },
  { route: 'datepicker', tag: 'sc-datepicker' },
  { route: 'inputnumber', tag: 'sc-inputnumber' },
  { route: 'textarea', tag: 'sc-textarea' },
  { route: 'checkbox', tag: 'sc-checkbox' },
] as const;

/**
 * Normaliza lo que cambia entre compilaciones sin que cambie nada real. Sin
 * esto el arnés fallaría en cada build y acabaría desactivado, que es el
 * destino de toda red ruidosa:
 *  - `_ngcontent-ng-cNNN` / `_nghost-ng-cNNN`: el hash de encapsulación de
 *    Angular cambia cuando recompila el componente.
 *  - ids autogenerados (`sc-inputnumber-7`, `pn_id_12`): llevan un contador de
 *    instancia global que depende del orden de render de la página.
 */
const normalize = (html: string): string =>
  html
    .replace(/\s*_ng(content|host)-[a-z0-9-]+=""/g, '')
    .replace(/(sc-[a-z]+)-\d+/g, '$1-N')
    .replace(/pn_id_\d+/g, 'pn_id_N')
    .replace(/\s+/g, ' ')
    .trim();

const structureOf = async (page: Page, route: string, tag: string): Promise<string[]> => {
  await page.goto(`/#/components/${route}`);
  // Best-effort: acotada y sin `throw`. La espera es de conveniencia; la
  // aserción de verdad es la de abajo. Sin acotar tumba el build sin que falle
  // ninguna aserción (pasó en CI con el datepicker).
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
  // Que exista al menos uno: si la ruta del demo cambia de nombre, este test
  // debe fallar en vez de fijar un baseline vacío y dar verde para siempre.
  await expect(page.locator(tag).first()).toBeVisible();
  const raw = await page.locator(tag).evaluateAll((els) => els.map((el) => el.outerHTML));
  return raw.map(normalize);
};

test.describe('estructura de los componentes del DS', () => {
  // Un solo test que recorre todos: así el baseline se escribe de una vez y no
  // queda a medias si un componente falla por el camino.
  test('el HTML renderizado coincide con el baseline', async ({ page }) => {
    const actual: Record<string, string[]> = {};
    for (const { route, tag } of COMPONENTS) {
      actual[tag] = await structureOf(page, route, tag);
    }

    // Un baseline ausente NO se regenera solo en CI: si alguien lo borra, la
    // red debe morir a gritos y no auto-curarse en verde para siempre, que es
    // como una red deja de existir sin que nadie se entere.
    if (!existsSync(BASELINE) && process.env['CI']) {
      throw new Error(
        `Falta el baseline de estructura (${BASELINE}). En CI no se genera solo: ` +
          'créalo en local con SC_UPDATE_STRUCTURE=1 y commitéalo.',
      );
    }

    if (UPDATING || !existsSync(BASELINE)) {
      writeFileSync(BASELINE, `${JSON.stringify(actual, null, 2)}\n`);
      test.info().annotations.push({
        type: 'baseline',
        description: `escrito ${BASELINE} — revisa el diff antes de commitear`,
      });
      return;
    }

    const expected = JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, string[]>;

    // Se compara componente a componente para que el fallo diga CUÁL se movió,
    // en vez de escupir un diff de miles de líneas de todo el DS junto.
    //
    // `expect.soft` y no `expect`: en un refactor transversal —que es para lo
    // que existe esta red— se tocan varios componentes a la vez, y una
    // aserción dura corta en el primero y te esconde los otros cuatro. Lo
    // aprendí usándola: al extraer el campo compartido solo vi `sc-inputtext`
    // y tuve que adivinar si los demás estaban bien.
    for (const { tag } of COMPONENTS) {
      expect
        .soft(actual[tag], `${tag}: nº de instancias renderizadas en el demo`)
        .toHaveLength(expected[tag]?.length ?? -1);
      expect.soft(actual[tag], `${tag}: el HTML renderizado cambió`).toEqual(expected[tag]);
    }
  });
});
