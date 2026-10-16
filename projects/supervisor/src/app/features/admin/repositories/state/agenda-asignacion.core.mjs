// @ts-check
/**
 * A QUIÉN SE ASIGNA UNA AGENDA, sin Angular (DD-211 §1). Puro para probarlo con node:test
 * (`scripts/__tests__/agenda-asignacion.test.mjs`); lo usan el árbol «Grupos y agentes» del editor de agenda y su
 * guardado.
 *
 * Una asignación tiene dos partes:
 * - `grupos`: los grupos marcados ENTEROS. Son dinámicos: quien entre después en el grupo también tendrá la agenda
 *   (se guarda en el grupo, `Group.schedules`).
 * - `agentes`: las PERSONAS que la tienen, también las que la tienen por un grupo entero. La selección es por persona,
 *   no por fila: un agente marcado lo está en todos los grupos donde aparece.
 *
 * Las reglas, decididas con producto el 2026-10-16:
 * - Marcar un grupo marca a todos sus agentes, y con ellos en los otros grupos donde estén.
 * - Marcar uno a uno a todos los agentes de un grupo equivale a marcar el grupo: pasa a entero (dinámico).
 * - Desmarcar a un agente lo quita de todos sus grupos, y los grupos enteros que lo tenían pasan a parcial: dejan de
 *   ser dinámicos.
 * - Un grupo sin agentes solo está entero si se marca él.
 *
 * La estructura (`Estructura`) es lo que pinta el árbol: cada grupo con sus agentes y, aparte, los que no están en
 * ningún grupo («Sin grupo», que nunca es dinámico). `claves` da el estado de cada casilla con las claves de sus nodos.
 */

/**
 * @typedef {{ readonly grupos: readonly number[]; readonly agentes: readonly number[] }} Asignacion
 * @typedef {{ readonly id: number; readonly miembros: readonly number[] }} GrupoDeArbol
 * @typedef {{ readonly grupos: readonly GrupoDeArbol[]; readonly sinGrupo: readonly number[] }} Estructura
 * @typedef {{ readonly checked: boolean; readonly partialChecked: boolean }} EstadoDeCasilla
 * @typedef {{ readonly tipo: 'agente' | 'grupo' | 'sinGrupo'; readonly id: number; readonly marcar: boolean }} Intencion
 */

/** La clave del nodo de un grupo, de un agente dentro de él, de «Sin grupo» y de un agente sin grupo. */
export const claveGrupo = (/** @type {number} */ g) => `g${g}`;
export const claveAgente = (/** @type {number} */ g, /** @type {number} */ a) => `g${g}-a${a}`;
export const CLAVE_SIN_GRUPO = 'sin';
export const claveSinGrupo = (/** @type {number} */ a) => `sin-a${a}`;

/** @param {Iterable<number>} ids */
const ordenados = (ids) => [...new Set(ids)].sort((x, y) => x - y);

/**
 * Cada grupo con sus agentes, sacados de los vínculos grupo-agente, en el orden de los vínculos y sin repetir.
 * @template {{ readonly id: number }} G
 * @param {readonly G[]} grupos
 * @param {readonly { readonly groupId: number; readonly agentId: number }[]} vinculos
 * @returns {(G & { readonly miembros: readonly number[] })[]}
 */
export function gruposConMiembros(grupos, vinculos) {
  /** @type {Map<number, Set<number>>} */
  const porGrupo = new Map();
  for (const v of vinculos) porGrupo.set(v.groupId, (porGrupo.get(v.groupId) ?? new Set()).add(v.agentId));
  return grupos.map((g) => ({ ...g, miembros: [...(porGrupo.get(g.id) ?? [])] }));
}

/**
 * La estructura del árbol: cada grupo con sus agentes y, aparte, los agentes que no están en ninguno. La sacan de aquí
 * el árbol, el editor y el listado de agendas, para que los tres vean lo mismo.
 * @param {readonly GrupoDeArbol[]} grupos
 * @param {readonly number[]} agentes
 * @returns {Estructura}
 */
export function estructuraDe(grupos, agentes) {
  const enGrupo = new Set(grupos.flatMap((g) => g.miembros));
  return { grupos: grupos.map((g) => ({ id: g.id, miembros: g.miembros })), sinGrupo: agentes.filter((a) => !enGrupo.has(a)) };
}

/**
 * Las dos reglas que se cumplen siempre: los agentes de un grupo entero están marcados, y un grupo con agentes que los
 * tiene a todos marcados está entero.
 * @param {Asignacion} asig
 * @param {Estructura} estructura
 * @returns {Asignacion}
 */
export function normalizar(asig, estructura) {
  const grupos = new Set(asig.grupos);
  const agentes = new Set(asig.agentes);
  for (const g of estructura.grupos) if (grupos.has(g.id)) for (const m of g.miembros) agentes.add(m);
  for (const g of estructura.grupos) {
    if (g.miembros.length > 0 && g.miembros.every((m) => agentes.has(m))) grupos.add(g.id);
  }
  return { grupos: ordenados(grupos), agentes: ordenados(agentes) };
}

/**
 * Quita a unas personas y, con ellas, deja de ser entero todo grupo que las tenía.
 * @param {Asignacion} asig
 * @param {Estructura} estructura
 * @param {readonly number[]} personas
 * @returns {Asignacion}
 */
function quitarPersonas(asig, estructura, personas) {
  const fuera = new Set(personas);
  const agentes = asig.agentes.filter((a) => !fuera.has(a));
  const rotos = new Set(estructura.grupos.filter((g) => g.miembros.some((m) => fuera.has(m))).map((g) => g.id));
  return { grupos: asig.grupos.filter((g) => !rotos.has(g)), agentes };
}

/**
 * Aplica lo que se pulsó en el árbol.
 * @param {Asignacion} asig
 * @param {Estructura} estructura
 * @param {Intencion} intencion
 * @returns {Asignacion}
 */
export function aplicar(asig, estructura, intencion) {
  const { tipo, id, marcar } = intencion;
  if (tipo === 'agente') {
    return marcar
      ? normalizar({ grupos: asig.grupos, agentes: [...asig.agentes, id] }, estructura)
      : quitarPersonas(asig, estructura, [id]);
  }
  if (tipo === 'sinGrupo') {
    return marcar
      ? normalizar({ grupos: asig.grupos, agentes: [...asig.agentes, ...estructura.sinGrupo] }, estructura)
      : quitarPersonas(asig, estructura, estructura.sinGrupo);
  }
  const grupo = estructura.grupos.find((g) => g.id === id);
  if (!grupo) return asig;
  if (marcar) return normalizar({ grupos: [...asig.grupos, id], agentes: [...asig.agentes, ...grupo.miembros] }, estructura);
  const sinEl = { grupos: asig.grupos.filter((g) => g !== id), agentes: asig.agentes };
  return grupo.miembros.length > 0 ? quitarPersonas(sinEl, estructura, grupo.miembros) : sinEl;
}

/**
 * El estado de cada casilla del árbol, con el formato de `selectionKeys` de `p-treetable`.
 * @param {Asignacion} asig
 * @param {Estructura} estructura
 * @returns {Record<string, EstadoDeCasilla>}
 */
export function claves(asig, estructura) {
  /** @type {Record<string, EstadoDeCasilla>} */
  const out = {};
  const grupos = new Set(asig.grupos);
  const agentes = new Set(asig.agentes);
  const padre = (/** @type {string} */ clave, /** @type {boolean} */ entero, /** @type {number} */ marcados) => {
    if (entero) out[clave] = { checked: true, partialChecked: false };
    else if (marcados > 0) out[clave] = { checked: false, partialChecked: true };
  };
  for (const g of estructura.grupos) {
    let marcados = 0;
    for (const m of g.miembros) {
      if (!agentes.has(m)) continue;
      marcados++;
      out[claveAgente(g.id, m)] = { checked: true, partialChecked: false };
    }
    padre(claveGrupo(g.id), grupos.has(g.id), marcados);
  }
  let sueltos = 0;
  for (const a of estructura.sinGrupo) {
    if (!agentes.has(a)) continue;
    sueltos++;
    out[claveSinGrupo(a)] = { checked: true, partialChecked: false };
  }
  padre(CLAVE_SIN_GRUPO, estructura.sinGrupo.length > 0 && sueltos === estructura.sinGrupo.length, sueltos);
  return out;
}

/**
 * Lo guardado, como asignación: los grupos que la llevan y las personas que la llevan sueltas, más los agentes de esos
 * grupos. Normaliza también al leer: un grupo cuyos agentes ya la tienen todos (sueltos o por otro grupo entero) se
 * ve entero, como si se hubieran marcado uno a uno, y se guardará entero. El árbol no tiene otra forma de pintarlo:
 * con todos sus agentes marcados, la casilla del grupo está marcada.
 * @param {readonly number[]} gruposConAgenda
 * @param {readonly number[]} agentesConAgenda
 * @param {Estructura} estructura
 * @returns {Asignacion}
 */
export function deLoGuardado(gruposConAgenda, agentesConAgenda, estructura) {
  return normalizar({ grupos: gruposConAgenda, agentes: agentesConAgenda }, estructura);
}

/**
 * Lo que se guarda: los grupos enteros, en cada grupo, y las personas que no la tienen ya por un grupo entero, en
 * cada agente.
 * @param {Asignacion} asig
 * @param {Estructura} estructura
 * @returns {{ readonly grupos: readonly number[]; readonly agentesSueltos: readonly number[] }}
 */
export function paraGuardar(asig, estructura) {
  const enteros = new Set(asig.grupos);
  const cubiertos = new Set(estructura.grupos.filter((g) => enteros.has(g.id)).flatMap((g) => g.miembros));
  return { grupos: ordenados(asig.grupos), agentesSueltos: ordenados(asig.agentes.filter((a) => !cubiertos.has(a))) };
}
