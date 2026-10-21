// @ts-check
/**
 * LAS DOS REGLAS DEL ÍNDICE DE UNA FICHA, puras y sin Angular (DD-217): cuándo lleva ✓ una sección y cuándo se dice
 * que falta algo. Las usan las fichas de grupo, agente, usuario y tipificación por `alta-secciones.ts`, y las prueba
 * `scripts/__tests__/alta-secciones.test.mjs` dentro de `verify`.
 *
 * El ✓ dice «la viste tal como está y no le falta nada». Una sección guarda, al dejarla, su FIRMA: lo que otra sección
 * decide de ella (en el grupo, los canales que marca General). Si la firma cambia, el ✓ se va sin ponerse en rojo: lo
 * que hay ahora no lo has visto. Medido el 2026-10-20: quitar Teléfono dejaba Distribución y colas con su ✓ aunque ya
 * no había nada de lo que se rellenó, y quitar todos los canales la dejaba con ✓ junto al rojo de General.
 *
 * Lo que falta (DD-219, que enmienda DD-217): «Crear» y «Guardar» siguen apagados mientras falte algo, y el resumen
 * dice qué. Bajo el campo, el aviso sale desde el principio en gris, como ayuda, y pasa a rojo cuando se TOCA el campo
 * y se deja vacío; el índice no se pone en rojo por eso, porque se dice donde se mira. Lo guardado que ya venía sin
 * algo se dice desde que se abre la ficha (DD-142, DD-199). El INTENTO (pulsar con algo pendiente) sigue apuntando lo
 * que faltaba entonces, por si se llega a pulsar sin el botón, como con Intro en un campo.
 */

/**
 * Las secciones con ✓: se dejaron con la firma que tienen ahora, están completas y no son la abierta.
 * @param {{
 *   ids: readonly string[],
 *   abierta: string,
 *   dejadas: ReadonlyMap<string, string>,
 *   firma: (id: string) => string,
 *   completa: (id: string) => boolean,
 * }} o
 * @returns {Set<string>}
 */
export function seccionesHechas({ ids, abierta, dejadas, firma, completa }) {
  return new Set(ids.filter((id) => id !== abierta && dejadas.get(id) === firma(id) && completa(id)));
}

/**
 * Da por dejada la sección `id` con la firma que tiene al dejarla. Un mapa nuevo: el de antes no cambia.
 * @param {ReadonlyMap<string, string>} dejadas
 * @param {string} id
 * @param {string} firma
 * @returns {Map<string, string>}
 */
export function dejarSeccion(dejadas, id, firma) {
  return new Map(dejadas).set(id, firma);
}

/**
 * ¿Se dice ya en rojo que falta `falta`? Si faltaba al pulsar Crear o Guardar (`intento`, `null` si aún no se pulsó),
 * si lo guardado ya venía sin ello (`guardado`, vacío en un alta) o si se tocó su campo y se dejó (`tocados`; el índice
 * no los pasa: lo que se toca se dice bajo el campo, donde se está mirando).
 * @param {string} falta
 * @param {ReadonlySet<string> | null} intento
 * @param {ReadonlySet<string>} guardado
 * @param {ReadonlySet<string>} [tocados]
 * @returns {boolean}
 */
export function seDice(falta, intento, guardado, tocados) {
  return (intento?.has(falta) ?? false) || guardado.has(falta) || (tocados?.has(falta) ?? false);
}

/**
 * La firma de un juego de opciones: la misma, sea cual sea el orden en que se marcaron.
 * @param {Iterable<string>} valores
 * @returns {string}
 */
export function firmaDe(valores) {
  return [...new Set(valores)].sort().join(',');
}
