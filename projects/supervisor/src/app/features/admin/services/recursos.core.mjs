// @ts-check
/**
 * LO QUE UNA FICHA RECIBE DE REPOSITORIOS (su sección Recursos), sin Angular: qué se ofrece, qué cuenta y qué se guarda.
 *
 * POR QUÉ (DD-164). Hasta el 2026-10-04 las fichas de grupo y de agente ofrecían agendas inactivas, y contaban (y
 * guardaban de vuelta) las que ya se habían borrado: al borrar una agenda en Repositorios, su id se queda en los
 * grupos y agentes que la tenían. Las dos fichas lo calculaban cada una a su manera; aquí se calcula una vez, y lo
 * prueba `scripts/__tests__/recursos.test.mjs` dentro de `verify`.
 */

/**
 * Los ids que siguen existiendo, en el orden en que se pusieron. Lo borrado ni se ofrece, ni se cuenta, ni se guarda.
 * @param {Iterable<number>} ids
 * @param {Iterable<{ readonly id: number }>} existentes
 * @returns {number[]}
 */
export function idsVivos(ids, existentes) {
  const vivos = new Set([...existentes].map((e) => e.id));
  return [...ids].filter((id) => vivos.has(id));
}

/**
 * Las agendas que se ofrecen: las activas, y las ya puestas aunque estén inactivas. Una inactiva puesta no se apaga
 * en el desplegable, como los horarios: apagada, no se podría quitar.
 * @template {{ readonly id: number, readonly status: string }} A
 * @param {readonly A[]} agendas
 * @param {Iterable<number>} puestas
 * @returns {A[]}
 */
export function agendasOfrecidas(agendas, puestas) {
  const ya = new Set(puestas);
  return agendas.filter((a) => a.status === 'active' || ya.has(a.id));
}

/**
 * ¿Sigue existiendo la categoría de tipificación? Una categoría sin ninguna tipificación ni se cuenta ni se enlaza.
 * @param {string | null | undefined} categoria
 * @param {readonly { readonly category: string }[]} tipificaciones
 * @returns {boolean}
 */
export function tipificacionViva(categoria, tipificaciones) {
  return !!categoria && tipificaciones.some((t) => t.category === categoria);
}
