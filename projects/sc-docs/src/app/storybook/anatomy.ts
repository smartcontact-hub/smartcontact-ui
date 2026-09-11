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

/**
 * La cadena de etiquetas desde `el` hacia dentro, por el PRIMER hijo elemento de cada nivel, con
 * sus clases. Devuelve una línea por nivel, ya sangrada:
 *
 *   sc-button
 *     p-button
 *       button.p-button.p-component
 */
export function anatomiaDe(el: Element, profundidad = 6): string[] {
  const lineas: string[] = [];
  let actual: Element | null = el;
  for (let i = 0; actual && i < profundidad; i += 1) {
    const clases = clasesDe(actual);
    lineas.push('  '.repeat(i) + actual.tagName.toLowerCase() + clases.map((c) => `.${c}`).join(''));
    actual = actual.firstElementChild;
  }
  return lineas;
}
