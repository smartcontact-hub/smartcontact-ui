/**
 * JUEGO DE DATOS DE LA DEMO — el mismo Supervisor con otros datos, sin tocar los de siempre (DD-123).
 *
 *   ?datos=tortura   los textos al límite: nombres, títulos y correos muy largos, y la mitad de las
 *                    descripciones vacías. Para ver una pantalla donde se rompe, no donde luce.
 *   ?datos=demo      vuelve a los de siempre.
 *
 * Por qué: una pantalla se juzga con los datos que tiene delante, y los de la demo miden todos de 7 a
 * 18 letras y no tienen un solo vacío (500 agentes medidos el 2026-09-27). Con ellos no se ve una
 * columna que envuelve ni un hueco que se queda sin dato.
 *
 * Cómo: lo aplica `createVersionedStorage`, por donde pasan todos los almacenes persistidos (agentes,
 * grupos, usuarios, etiquetas, plantillas, repositorios, monitores), así que ninguna pantalla lo sabe.
 * Cada juego guarda en SUS claves (`sc-agents@tortura`): probar uno no pisa lo editado en el otro. La
 * elección se recuerda en `sessionStorage`: sobrevive a recargar y no a cerrar la pestaña, para que nadie
 * se quede en tortura sin saberlo.
 */
export type JuegoDeDatos = 'demo' | 'tortura';

const JUEGOS: readonly string[] = ['demo', 'tortura'];
const CLAVE_SESION = 'sc-datos';

const esJuego = (v: string | null): v is JuegoDeDatos => v !== null && JUEGOS.includes(v);

/** El juego pedido en la URL (y lo recuerda), o el de la sesión, o `demo`. */
export function juegoDeDatos(): JuegoDeDatos {
  if (typeof window === 'undefined') return 'demo';
  try {
    const pedido = new URLSearchParams(window.location.search).get('datos');
    if (esJuego(pedido)) {
      window.sessionStorage.setItem(CLAVE_SESION, pedido);
      return pedido;
    }
    const guardado = window.sessionStorage.getItem(CLAVE_SESION);
    return esJuego(guardado) ? guardado : 'demo';
  } catch {
    return 'demo'; // almacenamiento bloqueado: los datos de siempre
  }
}

/** La clave de almacenamiento de un juego: la de siempre para `demo`, con sufijo para los demás. */
export const claveDelJuego = (clave: string, juego: JuegoDeDatos): string =>
  juego === 'demo' ? clave : `${clave}@${juego}`;

/** Un apellido compuesto de verdad: el largo que tiene un nombre español real, no uno inventado. */
const COLA_PERSONA = ' Fernández-Villaverde de la Concepción';
const COLA_COSA = ' — atención de incidencias de segundo nivel en horario extendido';
const DESCRIPCION_LARGA =
  'Descripción larga a propósito: cubre el caso de quien documenta con detalle para qué sirve esto, ' +
  'cuándo se usa, quién lo mantiene y qué excepciones tiene, en una sola frase que no cabe en una línea.';
const CORREO_LARGO = '.atencion-al-cliente-internacional';

/**
 * Estira los textos de cada elemento sin tocar su forma: `name` y `title` más largos (con cola de
 * persona si el elemento tiene correo), el correo más largo, y la descripción larga en los pares y
 * VACÍA en los impares. Ni ids, ni códigos, ni referencias: las relaciones entre almacenes siguen igual.
 */
export function torturar<T>(items: readonly T[]): readonly T[] {
  return items.map((item, i) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    const o: Record<string, unknown> = { ...(item as Record<string, unknown>) };
    const persona = typeof o['email'] === 'string';
    for (const campo of ['name', 'title']) {
      if (typeof o[campo] === 'string') o[campo] = `${o[campo]}${persona ? COLA_PERSONA : COLA_COSA}`;
    }
    if (typeof o['description'] === 'string') o['description'] = i % 2 ? '' : DESCRIPCION_LARGA;
    if (typeof o['email'] === 'string') o['email'] = (o['email'] as string).replace('@', `${CORREO_LARGO}@`);
    return o as T;
  });
}
