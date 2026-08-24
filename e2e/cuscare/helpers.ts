import { expect, type Page } from '@playwright/test';

/**
 * Helpers compartidos del e2e de CusCare.
 */

/** Lo que el vigía anotó del elemento transitorio. */
export interface Sighting {
  /** ¿Llegó a ENTRAR en el DOM desde que se instaló el vigía? */
  seen: boolean;
  /** El texto que traía dentro en el instante de entrar. */
  text: string;
  /** Las clases de su subárbol — para afirmar que traía el spinner, el icono, etc. */
  classes: string[];
}

let watcherId = 0;

/**
 * ¿PASÓ POR AHÍ, O SOLO NO LO PILLASTE A TIEMPO?
 *
 * CusCare replica a propósito el retardo del original: al paginar y al buscar
 * tapa el contenido con un loader que vive **380 ms** exactos y se apaga solo
 * (`setTimeout` en `tickets-page.component.ts` y `search-page.component.ts`).
 *
 * Mirar ese estado en la pantalla es una CARRERA, y perderla no da un rojo
 * honesto sino uno que depende de la máquina. Medido el 2026-08-24: con
 * `expect(page.locator('.loadingoverlay')).toBeVisible()` justo tras el clic, el
 * test de paginación se puso rojo dos veces seguidas con un chrome-headless
 * huérfano al 125% de CPU compitiendo por la máquina, y verde (90/90, 2,0 min)
 * con la máquina limpia. El fallo además engaña: si el primer sondeo de
 * Playwright cae pasados los 380 ms el nodo ya no existe, así que reintenta
 * 10 s en vano y acusa "element(s) not found" — como si el loader no se hubiera
 * pintado nunca. Subir el timeout NO lo arregla: el problema es llegar tarde,
 * no esperar poco.
 *
 * Este vigía se instala ANTES de la acción y anota la aparición en el momento en
 * que ocurre. Los registros de un `MutationObserver` se encolan en el instante
 * de la mutación y se entregan en una microtarea, así que el apunte **sobrevive
 * aunque el nodo ya se haya ido** cuando el test lo lee: la afirmación deja de
 * depender del reloj. Es el mismo patrón que el `mouseover` de la paleta en
 * `e2e/components.spec.ts` — LEARNINGS #1: confirma que el estímulo LLEGÓ antes
 * de concluir nada sobre él.
 *
 * Se autovalida en dos ejes (LEARNINGS #2, un vigía con falsos verdes es peor
 * que no tenerlo):
 *  - **Exige que el elemento NO esté ya al instalarse.** Si estuviera, lo que
 *    viera no sería atribuible a la acción del test, y `seen: true` sería un
 *    verde regalado.
 *  - **Anota qué traía dentro** (texto y clases), no solo que algo entró: así el
 *    test afirma que apareció EL loader, con su spinner y su mensaje, y no un
 *    div cualquiera que casara con el selector.
 *
 * @returns el lector del apunte; llámalo tras la acción (con `expect.poll`, que
 *          la microtarea del observer no es instantánea desde Node).
 */
export async function watchTransient(
  page: Page,
  selector: string,
): Promise<() => Promise<Sighting>> {
  const key = `__scTransient${++watcherId}`;

  await expect(
    page.locator(selector),
    `El vigía de "${selector}" debe instalarse ANTES de que el elemento aparezca: si ya está, lo que vea no lo causó este test.`,
  ).toHaveCount(0);

  await page.evaluate(
    ([sel, k]) => {
      const store = window as unknown as Record<string, Sighting>;
      store[k] = { seen: false, text: '', classes: [] };

      const note = (el: Element) => {
        const classes = new Set<string>();
        for (const node of [el, ...Array.from(el.querySelectorAll('*'))]) {
          node.classList.forEach((c) => classes.add(c));
        }
        store[k] = { seen: true, text: (el.textContent ?? '').trim(), classes: [...classes] };
      };

      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of Array.from(record.addedNodes)) {
            if (!(node instanceof Element)) continue;
            // El transitorio puede entrar él mismo (`@if` suelto) o colgando de
            // un subárbol que se inserta entero (`@else if`).
            const hit = node.matches(sel) ? node : node.querySelector(sel);
            if (hit) note(hit);
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    },
    [selector, key] as const,
  );

  return () => page.evaluate((k) => (window as unknown as Record<string, Sighting>)[k], key);
}
