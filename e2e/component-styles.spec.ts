import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

/**
 * RED DE CAJA Y TIPO DE LOS COMPONENTES DEL DS.
 *
 * Por qué existe (DD-63, 2026-09-10). El aspecto de cada componente lo vigilan hoy dos cosas:
 * aserciones de métrica escritas a mano en `components.spec.ts`, y una captura por componente.
 * Al preguntarse si esas capturas servían para algo se midió, de paso, la cobertura de las
 * aserciones — y ahí salió el agujero que justifica este fichero:
 *
 *   · 38 componentes tienen captura;
 *   · **16 de ellos no aseveran NI UNA propiedad de caja ni de tipo** (`sc-section-card`,
 *     `sc-datatable`, `sc-command-palette`, `sc-photo-upload`… la lista entera, en DD-63);
 *   · 25 no aseveran nada de tipografía.
 *
 * En esos 16 la captura no era «la última línea» del test: era la ÚNICA. El contraejemplo que
 * lo destapó es concreto: otra sesión cambió cinco propiedades de `sc-section-card` (padding
 * 24.5 → 22.75, icono 16 → 14, gap 12.25 → 8.75, título 18/24 → 14/20 y la línea de la
 * cabecera fuera) y de las cinco aserciones de su test no se movió ninguna.
 *
 * NO sustituye a las capturas ni compite con ellas — se reparten el trabajo:
 *
 *   · la captura ve **cualquier** cambio visual (un icono, una sombra, un color), pero es
 *     `-darwin` y depende del render de la máquina, así que **no puede correr en el CI**;
 *   · esto ve **caja, tipo y color en números**, que es un subconjunto más pobre, pero cruza
 *     de máquina —`22.75px` es `22.75px` en cualquier sitio— y por eso **sí corre en el CI**,
 *     que es donde hoy no hay nada mirando el aspecto de estos 16 componentes;
 *   · y `component-structure.spec.ts` fija la ESTRUCTURA del DOM.
 *
 * La otra ventaja, prosaica y diaria: esto se lee en un `git diff`. «padding-left: 24.5px →
 * 22.75px» dice qué pasó; un PNG binario obliga a abrir un visor y adivinar.
 *
 * Lo que NO ve, y hay que decirlo: cualquier cambio que no toque estas propiedades. Para eso
 * están las capturas en local, y los ojos.
 *
 * Actualizar tras un cambio DELIBERADO:
 *   SC_UPDATE_STYLES=1 npx playwright test component-styles
 * y **revisa el diff del JSON antes de commitear**: ahí se ve exactamente lo que moviste.
 */

const BASELINE = join(process.cwd(), 'e2e', 'baselines', 'component-styles.json');
const UPDATING = process.env['SC_UPDATE_STYLES'] === '1';

/**
 * Las propiedades que se congelan. Acotadas a propósito: son las que el Kit ESPECIFICA y las
 * que mueve un token, y son estables entre plataformas.
 *
 * ⚠️ `width` y `height` están FUERA, y no por gusto: **no cruzan de plataforma**. Medido en el
 * primer run de este fichero en CI (34414537272), con el baseline generado en el Mac de Rafa:
 * 24 de las 38 páginas en rojo y **el diff entero en `width`** —`108.55px` frente a `110px`,
 * `189px` frente a `233px`—, más una sola `height` (21 frente a 22). Ni un padding, ni un gap,
 * ni un radio, ni un tamaño de letra, ni un color se movieron. Un ancho es el del TEXTO
 * renderizado y el del contenedor disponible, o sea hinting de fuente y ancho de barra de
 * scroll (overlay en macOS, sólida en el Linux del runner); un padding es un número que sale
 * del token y no lo toca ninguna de las dos cosas.
 *
 * Lo que se pierde con esa exclusión: un componente cuyo TAMAÑO sea contrato (el 28/42/56 de
 * `sc-avatar`, el alto de `sc-toggleswitch`) no lo vigila esta red. Lo vigilan las aserciones
 * de `components.spec.ts`, que sí los aseveran uno a uno, y ahí es donde deben estar: un
 * tamaño que el Kit fija merece un número escrito a mano, no un baseline generado.
 *
 * Fuera quedan también `box-shadow` y `transform` (los mueve una animación a medio terminar) y
 * el tema oscuro, que aquí no se captura.
 */
const PROPS = [
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'gap',
  'min-height',
  'border-radius',
  'border-top-width',
  'border-bottom-width',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'background-color',
] as const;

/**
 * Las páginas que se recorren, con el componente que cada una DEBE renderizar. El par no es
 * decorativo: es lo que hace determinista la lectura.
 *
 * sc-docs usa `withHashLocation()`, así que un `page.goto('/#/components/x')` NO recarga —
 * cambia el hash y Angular monta la vista nueva **después**. Sin esperar a algo propio de la
 * ruta destino, `evaluateAll` se lleva las anclas de la página ANTERIOR: medido al escribir
 * esto, la primera pasada guardó en `badge` las seis anclas de `avatar`, y en `card` las cinco
 * de `button`. El baseline salía con un desfase de una página y la segunda pasada lo delataba.
 * Es el mismo motivo por el que `component-structure.spec.ts` espera por su tag.
 *
 * Que la lista sea explícita, y no un `readdir` del directorio de páginas, también es a
 * propósito: así se lee y se revisa en un PR, y no crece sola con una carpeta a medio hacer.
 */
const COMPONENTS = [
  { route: 'avatar', tag: 'sc-avatar' },
  { route: 'badge', tag: 'sc-badge' },
  { route: 'bulkactionbar', tag: 'sc-bulk-action-bar' },
  { route: 'bulkeditmenu', tag: 'sc-bulk-edit-menu' },
  { route: 'bulktranscriptionmodal', tag: 'sc-bulk-transcription-modal' },
  { route: 'button', tag: 'sc-button' },
  { route: 'card', tag: 'sc-card' },
  { route: 'checkbox', tag: 'sc-checkbox' },
  { route: 'chip', tag: 'sc-chip' },
  { route: 'colordotpicker', tag: 'sc-color-dot-picker' },
  { route: 'columnselector', tag: 'sc-column-selector' },
  { route: 'commandpalette', tag: 'sc-command-palette' },
  { route: 'datatable', tag: 'sc-datatable' },
  { route: 'datepicker', tag: 'sc-datepicker' },
  { route: 'divider', tag: 'sc-divider' },
  { route: 'emptystate', tag: 'sc-empty-state' },
  { route: 'formdangerzone', tag: 'sc-form-danger-zone' },
  { route: 'formsectionnav', tag: 'sc-form-section-nav' },
  { route: 'grouppopover', tag: 'sc-group-popover' },
  { route: 'inlinerenamecell', tag: 'sc-inline-rename-cell' },
  { route: 'inputgroup', tag: 'sc-inputgroup' },
  { route: 'inputnumber', tag: 'sc-inputnumber' },
  { route: 'inputtext', tag: 'sc-inputtext' },
  { route: 'keyboardshortcuts', tag: 'sc-keyboard-shortcuts' },
  { route: 'message', tag: 'sc-message' },
  { route: 'multiselect', tag: 'sc-multiselect' },
  { route: 'panel', tag: 'sc-panel' },
  { route: 'photoupload', tag: 'sc-photo-upload' },
  { route: 'progressbar', tag: 'sc-progressbar' },
  { route: 'radiobutton', tag: 'sc-radiobutton' },
  { route: 'search', tag: 'sc-search' },
  { route: 'sectioncard', tag: 'sc-section-card' },
  { route: 'select', tag: 'sc-select' },
  { route: 'skeleton', tag: 'sc-skeleton' },
  { route: 'stickyformheader', tag: 'sc-sticky-form-header' },
  { route: 'tag', tag: 'sc-tag' },
  { route: 'textarea', tag: 'sc-textarea' },
  { route: 'toggleswitch', tag: 'sc-toggleswitch' },
] as const;

type Estilos = Record<string, Record<string, string>>;

const stylesOf = async (page: Page, route: string, tag: string, esperados?: number): Promise<Estilos> => {
  await page.goto(`/#/components/${route}`);
  // Best-effort y acotada, como en `component-structure`: la espera es de conveniencia, no
  // una aserción. Sin timeout tumba el build sin que falle nada (ya pasó con el datepicker).
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
  // LA espera que importa: hasta que el componente de ESTA ruta está en el DOM, las anclas
  // que se leen son las de la página anterior (ver el comentario de COMPONENTS). Y si la
  // ruta se renombra, esto falla en vez de congelar un baseline vacío en verde para siempre.
  //
  // `toBeAttached` y NO `toBeVisible`: hay demos cuyo componente nace oculto porque es un
  // overlay que se abre con un atajo (`sc-command-palette` resolvió 33 veces a un nodo con
  // `hidden`). Lo que se necesita aquí es que la vista destino esté MONTADA, no que se vea.
  //
  // Y ACOTADO al `<main class="demo-main">` que envuelve al `router-outlet`, porque el shell
  // monta un `<sc-command-palette>` global FUERA de él (`app.component.html`): sin acotar, la
  // espera de la ruta `commandpalette` se cumple en CUALQUIER página y deja de esperar nada.
  // Eso puso el CI en rojo el 2026-09-10 con `commandpalette` leyendo la página de
  // `columnselector` —la ruta anterior de la lista—, y el `toHaveCount` de abajo no lo tapó
  // porque las dos páginas tienen UNA ancla. Medido con sonda: en `/columnselector`,
  // `sc-command-palette` resuelve y `main.demo-main sc-command-palette` no.
  await expect(page.locator(`main.demo-main ${tag}`).first()).toBeAttached({ timeout: 15_000 });

  // Animaciones a cero ANTES de medir. Es lo mismo que hacía `animations: 'disabled'` en la
  // captura que esto sustituye, y aquí no es un detalle: `sc-message` monta con la animación
  // de entrada de PrimeNG, y leerlo a media entrada daba alturas distintas en cada pasada
  // (5.15px, 8.78px, 19.09px sobre un valor final de 19.11px). Con la duración a 0 la
  // animación salta a su estado final, que es el que se quiere congelar.
  await page.addStyleTag({
    content: '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }',
  });

  const anclas = page.locator('[data-testid]');

  // Esperar al NÚMERO, no a «que haya alguno». `evaluateAll` lee en una pasada y no
  // reintenta: si la página aún pinta, se lleva las que haya. Es el flake que tumbó el CI
  // tres veces en la red hermana, y `toHaveCount` lo convierte en espera determinista.
  if (esperados !== undefined) {
    await expect(
      anclas,
      `${route}: la página debería tener ${esperados} anclas [data-testid]. Si de verdad ` +
        'cambiaron, regenera con SC_UPDATE_STYLES=1; si no, es que no terminó de pintar.',
    ).toHaveCount(esperados, { timeout: 15_000 });
  } else {
    // Primera generación: sin número que esperar, se exige que el conteo se estabilice entre
    // dos muestras para no congelar un baseline pintado a medias.
    let previo = -1;
    for (let i = 0; i < 10; i++) {
      const n = await anclas.count();
      if (n === previo && n > 0) break;
      previo = n;
      await page.waitForTimeout(200);
    }
  }

  // Por cada ancla se leen el propio nodo Y los descendientes que DEFINEN CAJA, hasta 3
  // niveles. Sin descender, esta red no mide nada útil en la mitad del catálogo: el
  // `data-testid` vive en el host del wrapper (`<sc-section-card>`), que es transparente —
  // padding 0, sin radio, sin borde— y la caja de verdad está dentro (`.section-card__head`,
  // dos niveles más abajo, es quien lleva el `padding-top: 24.5px` del Kit). Medido: con solo
  // el host, un cambio real de ese padding pasaba en VERDE.
  //
  // Y se descarta lo que no aporta: un nodo sin padding, sin gap, sin radio y sin borde no
  // tiene caja que congelar, y meterlo multiplicaría el baseline por ocho para guardar ceros.
  // Si un padding pasa a 0, su nodo DESAPARECE de la lista y el diff lo enseña igual.
  const leidos = await anclas.evaluateAll(
    (els, props) => {
      const neutro = (s: CSSStyleDeclaration) =>
        s.paddingTop === '0px' &&
        s.paddingRight === '0px' &&
        s.paddingBottom === '0px' &&
        s.paddingLeft === '0px' &&
        (s.gap === 'normal' || s.gap === '0px') &&
        s.borderRadius === '0px' &&
        s.borderTopWidth === '0px' &&
        s.borderBottomWidth === '0px';
      const lee = (el: Element) => {
        const s = getComputedStyle(el);
        const valores: Record<string, string> = {};
        for (const p of props) {
          // Redondeo a 2 decimales en los valores en px. El layout devuelve subpíxeles con
          // más precisión de la que significa nada, y esa cola es ruido que solo sirve para
          // poner la red roja sin que haya cambiado nada.
          valores[p] = s
            .getPropertyValue(p)
            .replace(/(-?\d+\.\d+)px/g, (_m, n) => `${Math.round(parseFloat(n) * 100) / 100}px`);
        }
        return valores;
      };
      // Nombre estable de un nodo: su etiqueta más su primera clase. No se usa el índice
      // entre hermanos salvo para desambiguar, porque un hermano nuevo lo correría entero.
      const nombre = (el: Element) => {
        const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
        return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
      };
      const salida: [string, Record<string, string>][] = [];
      for (const el of els) {
        const testid = el.getAttribute('data-testid') ?? '?';
        salida.push([testid, lee(el)]);
        const baja = (n: Element, d: number, ruta: string) => {
          if (d > 3) return;
          for (const c of Array.from(n.children)) {
            const s = getComputedStyle(c);
            const clave = `${ruta} > ${nombre(c)}`;
            if (!neutro(s)) salida.push([clave, lee(c)]);
            baja(c, d + 1, clave);
          }
        };
        baja(el, 1, testid);
      }
      return salida;
    },
    PROPS as unknown as string[],
  );

  // Ordenado por clave para que el JSON no dependa del orden de pintado, y con el índice
  // detrás cuando un testid se repite en la página (varias historias del mismo demo).
  const salida: Estilos = {};
  const vistos = new Map<string, number>();
  for (const [testid, valores] of leidos) {
    const n = vistos.get(testid) ?? 0;
    vistos.set(testid, n + 1);
    salida[n === 0 ? testid : `${testid}#${n + 1}`] = valores;
  }
  return Object.fromEntries(Object.entries(salida).sort(([a], [b]) => a.localeCompare(b)));
};

test.describe('caja y tipo de los componentes del DS', () => {
  // Un solo test que recorre todas: así el baseline se escribe de una vez y no queda a
  // medias si una página falla por el camino. Mismo motivo que en `component-structure`.
  test('los estilos computados coinciden con el baseline', async ({ page }) => {
    test.setTimeout(180_000);

    const previo: Record<string, Estilos> | null =
      existsSync(BASELINE) && !UPDATING
        ? (JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, Estilos>)
        : null;

    const actual: Record<string, Estilos> = {};
    for (const { route, tag } of COMPONENTS) {
      // Solo las claves RAÍZ son anclas del DOM: las que llevan ` > ` son descendientes que
      // añade la lectura, y contarlas aquí pediría a `toHaveCount` un número que no existe.
      const anclasPrevias = previo?.[route] ? Object.keys(previo[route]).filter((k) => !k.includes(' > ')).length : undefined;
      actual[route] = await stylesOf(page, route, tag, anclasPrevias);
    }

    // Un baseline ausente NO se regenera solo en CI: si alguien lo borra, la red muere a
    // gritos en vez de auto-curarse en verde para siempre, que es como una red desaparece
    // sin que nadie se entere.
    if (!existsSync(BASELINE) && process.env['CI']) {
      throw new Error(
        `Falta el baseline de estilos (${BASELINE}). En CI no se genera solo: ` +
          'créalo en local con SC_UPDATE_STYLES=1 y commitéalo.',
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

    const expected = previo ?? (JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, Estilos>);

    // Página a página y con `soft`, para que un cambio transversal de tokens enseñe TODOS los
    // componentes que movió y no corte en el primero.
    for (const { route } of COMPONENTS) {
      expect.soft(actual[route], `${route}: la caja o el tipo de algún elemento cambió`).toEqual(expected[route]);
    }
  });
});
