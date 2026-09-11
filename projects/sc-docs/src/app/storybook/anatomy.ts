/**
 * La ANATOMÍA de un componente: qué DOM sale de verdad cuando se escribe `<sc-button …>`.
 *
 * De dónde sale (2026-09-11). Rafa miró `/#/components/button` y preguntó: «¿el código de cada uno
 * en sc-docs está basado realmente en primeng?». La doc enseñaba solo la API pública
 * (`<sc-button label=… variant=… />`), que es lo correcto para quien CONSUME el DS; lo que su
 * equipo tiene delante cuando depura CSS o escribe un selector es otra cosa: `sc-button >
 * p-button > button.p-button`. Eso no estaba en ningún sitio.
 *
 * Y no se escribe a mano. Una tabla de selectores tecleada es otro texto que puede mentir — es el
 * mismo defecto que el snippet a mano que este cambio viene a atar. Se LEE del DOM ya renderizado,
 * así que el día que PrimeNG cambie su estructura interna, la ficha lo dirá sola.
 */

/** Clases que no dicen nada de la estructura: el hash de encapsulación y los ids de instancia. */
const RUIDO = /^(ng-\w+|_ng(content|host)-.*)$/;

/** `pc286`, `pn_id_12`, `sc-inputnumber-7`: contadores de instancia, no estructura. */
const normalizarId = (c: string): string =>
  c.replace(/^pc\d+$/, 'pcN').replace(/^pn_id_\d+$/, 'pn_id_N').replace(/^(sc-[a-z]+)-\d+$/, '$1-N');

/** Las clases que describen a un elemento: las `p-*` del proveedor y las `sc-*` nuestras. */
export function clasesDe(el: Element): string[] {
  return [...el.classList]
    .filter((c) => !RUIDO.test(c))
    .map(normalizarId)
    .filter((c) => /^(p-|sc-)/.test(c))
    .sort();
}

/** ¿Este elemento ES PrimeNG? Por su etiqueta (`<p-button>`) o por sus clases (`input.p-inputtext`). */
const esPrimeNg = (el: Element): boolean =>
  el.tagName.toLowerCase().startsWith('p-') || [...el.classList].some((c) => c.startsWith('p-'));

/**
 * El camino desde el wrapper hasta SU PrimeNG, y de ahí hacia dentro.
 *
 * ⚠️ La primera versión bajaba siempre por el primer hijo, y para los campos eso no llega a
 * ninguna parte: `sc-inputtext` abre por su etiqueta (`sc-field-label > label`), así que la ficha
 * enseñaba la chrome del campo y NO el `input.p-inputtext`, que es justo lo que busca quien
 * escribe un selector. Medido en el navegador, no deducido. Ahora se busca el primer descendiente
 * que sea PrimeNG, se pinta el camino hasta él y se sigue un par de niveles por dentro.
 */
export function anatomiaDe(el: Element, profundidad = 6): string[] {
  const objetivo = [...el.querySelectorAll('*')].find(esPrimeNg) ?? null;

  const camino: Element[] = [];
  if (objetivo) {
    for (let n: Element | null = objetivo; n && n !== el; n = n.parentElement) camino.unshift(n);
  }
  const nodos: Element[] = [el, ...camino];

  // …y de ahí hacia dentro, por el primer hijo, hasta completar la profundidad.
  let dentro: Element | null = (camino.at(-1) ?? el).firstElementChild;
  while (dentro && nodos.length < profundidad) {
    nodos.push(dentro);
    dentro = dentro.firstElementChild;
  }

  return nodos
    .slice(0, profundidad)
    .map((n, i) => '  '.repeat(i) + n.tagName.toLowerCase() + clasesDe(n).map((c) => `.${c}`).join(''));
}
