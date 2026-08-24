import { expect, test, type Page } from '@playwright/test';

import { L_CLARO, medir } from './shared/contrast-probe';
import { disableAnimations } from './shared/deterministic';

/**
 * LAS SEVERIDADES DEL DS, MEDIDAS DONDE SÍ SE RENDERIZAN.
 *
 * Por qué existe, y por qué no bastaba con la red que ya había: `theme-contrast`
 * recorre el DOM VIVO del supervisor y calcula contraste bien —su sonda es la
 * misma que usa esta, importada, no copiada—. Pero solo puede medir lo que la
 * pantalla pinta, y el supervisor no pinta ni un botón `variant="warn"` ni un
 * toast abierto. Cero referencias a `warn` en toda aquella suite.
 *
 * El precio de ese hueco, medido el 2026-08-24: de los cinco cuadros de icono
 * del toast, TRES no llegaban al 3:1 de WCAG 1.4.11 con su glifo blanco —
 * success 2.28, warn 2.15, secondary 2.95— y llevaban meses así con la suite
 * de contraste en verde. Esa es la peor combinación posible: parecía medido.
 *
 * sc-docs sí las pinta todas, porque ese es su trabajo. Así que la red no
 * necesitaba mejor matemática, necesitaba mirar a otro sitio.
 *
 * De las DOS preguntas que hace la suite hermana, aquí se hace UNA: **¿se lee lo
 * que va encima?** (iconos incluidos: las ligaduras de Material Symbols llegan
 * como texto y su listón es el 3:1 de gráficos).
 *
 * La otra —«¿alguna superficie desentona con el tema?»— NO se hace, y no es un
 * recorte: es que no aplica al sujeto. Esa pregunta caza hojas de página que
 * escriben una primitiva fija y se quedan claras en oscuro. Aquí el sujeto son
 * colores de ACENTO, y un botón `warn` sólido TIENE que ser brillante en los dos
 * temas. La primera versión de esta red sí la hacía y reportaba
 * `p-button-warn L=0.63` como defecto: un falso positivo por construcción.
 *
 * El barrido va acotado al lienzo de la demo, no a la página: sc-docs tiene su
 * propio chrome de documentación y sin acotar salían 84 hallazgos de los que
 * casi ninguno era del DS.
 */

/** El toggle de sc-docs pone `.sc-dark` en `documentElement` directamente
 *  (`app.component.ts`); no hay `localStorage` de por medio como en el
 *  supervisor. No inventes otro mecanismo: este es el que usa la app. */
const TEMAS = [
  { nombre: 'claro', oscuro: false },
  { nombre: 'oscuro', oscuro: true },
] as const;

/**
 * Las demos que pintan la rampa de severidades entera. No es una muestra: son
 * TODAS las que la tienen.
 *
 *  · `button` / `badge` → `variant=` con las 6
 *  · `tag` / `message`  → `severity=` con las 6 y 4 respectivamente
 *  · `toast`            → hay que LANZARLOS (ver abajo)
 */
const DEMOS = ['button', 'badge', 'tag', 'message'] as const;

/** El lienzo donde `story-canvas` monta la instancia. Todo lo de fuera es
 *  documentación, no producto. */
const LIENZO = '.sb-canvas__pane';

/** El toast NO vive en el lienzo: PrimeNG lo cuelga del `body` en su propio
 *  contenedor. Medir `.sb-canvas__pane` para el toast daría cero elementos y
 *  un verde vacío — el peor resultado posible. */
const CONTENEDOR_TOAST = '.p-toast';

/**
 * SUB-AA CONOCIDO EN LAS DEMOS, con su número.
 *
 * Misma disciplina que la lista hermana del supervisor: se fijan aquí, no se
 * esconden, y cualquier OTRO fallo rompe la prueba. Cada línea se borra el día
 * que se decida su valor. Si esta lista crece sin que nadie lo note, la red ha
 * dejado de servir — que es exactamente cómo murió la cobertura que esta
 * suite viene a reponer.
 */
const CONOCIDOS: readonly string[] = [
  /* ── success · el paso del Kit no llega (light) ─────────────────────────────
   * `green-500` con texto blanco da **2.28:1** en botón y badge, y `green-600`
   * sobre blanco da **3.30** en el texto de message y **3.16** en el summary del
   * toast. No es nuestro: el export dice `{green.500}` para el sólido, así que
   * arreglarlo es DIVERGIR del Kit. Existe precedente exacto —`danger` se movió
   * de red-500 a red-600 el 2026-07-19 por esto mismo, y lo decidió Rafa— pero es
   * una decisión de marca, no un arreglo, y no se cuela dentro de otro trabajo. */
  'fg=rgb(255,255,255) 2.28:1',
  'fg=rgb(22,163,74) 3.30:1',
  'fg=rgb(22,163,74) 3.16:1',

  /* ── danger · el BADGE se quedó atrás ───────────────────────────────────────
   * `red-500` con blanco da **3.76:1**. El BOTÓN ya se arregló en julio subiendo
   * a red-600 (4.83); el badge comparte el defecto y no se tocó entonces. Aquí es
   * aún más claro que es un descuido y no una decisión: los dos hermanos deberían
   * decir lo mismo. */
  'p-badge-danger p-component bg=rgb(239,68,68)',

  /* ── secondary · el gris de marca sobre grises claros ───────────────────────
   * `slate-600` sobre slate-100/200 da 3.88-3.92:1 en botón, tag y badge. Es el
   * mismo límite ya aceptado a propósito en `customs-catalog` §1.5 para
   * `--sc-text-secondary`: subirlo lo pega a `text-primary` y cambia un fallo de
   * contraste por uno de jerarquía. Misma razón, mismo veredicto. */
  'fg=rgb(111,119,132) 3.92:1',
  'fg=rgb(121,142,171) 3.88:1',
  'fg=rgb(143,151,163) 2.95:1',

  /* ── danger en OSCURO, al filo ──────────────────────────────────────────────
   * `red-500` sobre el lienzo oscuro da **4.49:1** contra un listón de 4.5. Se
   * fija con su número precisamente porque está a una centésima: no es un fallo
   * que merezca mover la marca, pero tampoco un margen del que fiarse, y si el
   * lienzo se aclara un punto se convierte en uno de verdad. */
  'fg=rgb(239,68,68) 4.49:1',

  /* ── danger · el SUMMARY del toast, en los dos temas ────────────────────────
   * Claro: `red-600` sobre su fondo pálido = **4.45:1**, o sea que se queda a
   * CINCO CENTÉSIMAS del listón. Oscuro: `red-500` sobre el fondo compuesto =
   * **3.83:1**. Los dos valores son del Kit tal cual (`error.color` = {red.600}
   * en claro, {red.500} en oscuro), así que arreglarlos es divergir.
   *
   * Estos dos solo se ven desde que la medición es DETERMINISTA. Antes de apagar
   * el motion, el toast se medía a mitad de transición y su fondo efectivo salía
   * distinto en cada vuelta: 3 pasadas sobre el mismo árbol daban 2 verdes y 1
   * rojo. La inestabilidad no era ruido encima de la señal — era la señal,
   * escondida. */
  'fg=rgb(220,38,38) 4.45:1',
  'fg=rgb(239,68,68) 3.83:1',

  /* ── 🚨 EL QUE NO ES UNA DECISIÓN DE MARCA ──────────────────────────────────
   * En OSCURO, las variantes `outlined`, `text` y `link` del botón PRIMARIO
   * pintan `#1b273d` (blue-700, el primario CLARO) sobre el lienzo `#181d26`:
   * **1.13:1**, o sea invisibles. Los otros tres fallos de esta lista son
   * matices de 3.x contra 4.5; este es texto que no se ve.
   *
   * Medido, y no resuelto, el 2026-08-24. Lo que SÍ se sabe:
   *   · los tokens resuelven BIEN: `--p-button-text-primary-color`,
   *     `--p-button-link-color` y `--p-button-outlined-primary-color` valen los
   *     tres `#798eab` (blue-300) en ese mismo elemento.
   *   · las únicas reglas que casan son `.p-button` → `var(--p-button-primary-color)`
   *     (que vale `#181d26`) y `.p-button-text` → `var(--p-button-text-primary-color)`
   *     (`#798eab`). **Ninguna de las dos produce `#1b273d`.**
   *   · no hay `adoptedStyleSheets` (0), ni estilo inline, ni `!important`.
   *
   * O sea que el valor pintado no sale de ninguna declaración que case, lo que
   * apunta a una interacción de capas de cascada (`@layer`) y no a un token mal
   * puesto. Se deja fijado con la evidencia en vez de adivinar el arreglo: es un
   * bug de verdad y merece que alguien lo mire con las devtools abiertas. */
  'fg=rgb(27,39,61) 1.13:1',
];

const irADemo = async (page: Page, demo: string, oscuro: boolean): Promise<void> => {
  /* ANTES de navegar: un toast entra animado y medirlo a mitad de transición da
   * un fondo efectivo distinto en cada vuelta. Sin esto la suite alternaba verde
   * y rojo sobre el MISMO árbol (medido: 2 de 3). */
  await disableAnimations(page);
  await page.goto(`/#/components/${demo}`);
  /* `networkidle` como espera de CONVENIENCIA, acotada: la página baja una
   * fuente de iconos de varios MB y con la máquina cargada no se calla nunca.
   * Sin el `catch` esto tumba el build sin que falle ninguna aserción — ya pasó
   * en `components.spec.ts` y está documentado allí. */
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
  await page.evaluate((d) => {
    document.documentElement.classList.toggle('sc-dark', d);
  }, oscuro);
};

/**
 * VALIDAR EL VALIDADOR antes de creerse un verde.
 *
 * Si la clase no entrara, la sonda mediría el tema CLARO dos veces y la mitad
 * oscura pasaría siempre — un verde que no significa nada. La suite hermana
 * lleva esta misma comprobación por haberse quemado con ella.
 */
const confirmarTema = async (page: Page, oscuro: boolean): Promise<void> => {
  const tiene = await page.evaluate(() => document.documentElement.classList.contains('sc-dark'));
  expect(
    tiene,
    `el tema ${oscuro ? 'OSCURO' : 'CLARO'} no llegó al DOM: la medición de abajo estaría ` +
      `mirando el tema contrario y saldría verde por el motivo equivocado.`,
  ).toBe(oscuro);
};

const noConocido = (linea: string): boolean => !CONOCIDOS.some((c) => linea.includes(c));

for (const tema of TEMAS) {
  test.describe(`severidades · tema ${tema.nombre}`, () => {
    for (const demo of DEMOS) {
      test(`${demo} · las 6 severidades se leen`, async ({ page }) => {
        await irADemo(page, demo, tema.oscuro);
        await confirmarTema(page, tema.oscuro);

        const { ilegibles } = await page.evaluate(medir, { umbral: L_CLARO, raiz: LIENZO });
        expect(ilegibles.filter(noConocido), `por debajo de AA · demo ${demo}`).toEqual([]);
      });
    }

    /**
     * El toast va aparte porque **no se pinta solo**: su demo son botones que lo
     * lanzan. Es literalmente el motivo por el que este defecto sobrevivió — una
     * red que solo navega no puede ver un componente que hay que provocar.
     */
    test('toast · las severidades se leen con el toast ABIERTO', async ({ page }) => {
      await irADemo(page, 'toast', tema.oscuro);
      await confirmarTema(page, tema.oscuro);

      /* Se lanzan los cuatro y se miden JUNTOS: el contenedor apila, así que
       * con una sola medición se cubre la rampa entera. Lanzarlos de uno en uno
       * multiplicaría por cuatro el tiempo sin medir nada más. */
      for (const etiqueta of ['Success', 'Info', 'Warn', 'Danger']) {
        await page.getByRole('button', { name: etiqueta, exact: true }).first().click();
      }

      const mensajes = page.locator('.p-toast-message');
      await expect(mensajes.first()).toBeVisible();
      /* Que estén los cuatro, no solo el primero: si el contenedor tuviera un
       * tope o alguno se cerrara solo, mediríamos menos rampa de la que creemos
       * y el verde sería parcial sin avisar. */
      await expect(mensajes).toHaveCount(4);

      const { ilegibles } = await page.evaluate(medir, {
        umbral: L_CLARO,
        raiz: CONTENEDOR_TOAST,
      });
      expect(ilegibles.filter(noConocido), 'por debajo de AA · toast abierto').toEqual([]);
    });
  });
}
