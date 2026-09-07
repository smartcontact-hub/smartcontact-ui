#!/usr/bin/env node
/**
 * La barra de UX de pantalla vive DOS VECES, y nada lo vigilaba.
 *
 * `AGENTS.md` §«UX de pantalla» la escribe para quien toca el código, y
 * `projects/sc-docs/src/app/pages/patrones/patrones.component.ts` la pinta navegable para
 * quien la lee. El pie de esa página afirma que son la misma («está también en AGENTS.md»),
 * pero la afirmación no la sostenía nada: medido el 2026-09-06, la copia navegable había
 * perdido por el camino la regla de la paleta en oscuro del principio 1.
 *
 * QUÉ COMPARA, Y QUÉ NO. Compara el NÚMERO de principios y, por cada uno, que la copia
 * navegable siga diciendo lo que ese principio tiene de load-bearing (`FRAGMENTOS`). NO
 * compara la prosa ni los títulos: son dos registros distintos a propósito —AGENTS es
 * imperativo para un agente, la página es prosa para una persona, con su tríada
 * aplica/evita/ya-lo-tienes— y compararlos literalmente sería 100% ruido, que es como se
 * enseña a ignorar un guardián (LEARNINGS #2).
 *
 * El modo de fallo real que ataja es el de la ADICIÓN: alguien añade el principio 8 a AGENTS
 * y la página se queda en 7, o recorta una regla al reescribir una tarjeta.
 *
 * Módulo PURO (sin I/O, sin exit): lo llama el check L de `docs:coherence` y lo prueba
 * `scripts/__tests__/patrones-parity.test.mjs`.
 */

/** Principios numerados de AGENTS: `1. **Título.** cuerpo…` */
export const RE_TITULO_AGENTS = /^(\d+)\. \*\*(.+?)\.?\*\*/gm;

/** Entradas del array `principles` de la página: `title: '…'`. */
export const RE_TITULO_DOCS = /title:\s*'([^']+)'/g;

/**
 * Lo que cada principio NO puede perder al reescribirse, por número.
 * Una entrada por principio, y cada patrón está aquí porque su ausencia sería una pérdida
 * real de contenido, no un cambio de redacción.
 */
export const FRAGMENTOS = {
  1: [/--sc-/, /oscuro/i], //  el contrato de token, y que la paleta no voltea de tema
  2: [/sc-skeleton/, /layout shift/i], //  el componente y el defecto que evita
  3: [/subt[ií]tulo/i], //  el caso concreto: un título no lleva subtítulo que lo repita
  4: [/sc-icon/, /emoji/i], //  una sola librería, y el emoji fuera
  5: [/kebab/i, /KPI/i], //  dónde va lo secundario y qué no se repite
  6: [/4[.,]5:1/, /3:1/, /teclado/i], //  los dos umbrales y el teclado
  7: [/transform/, /opacity/, /aspect-ratio/], //  qué se anima y cómo se reserva el hueco
};

/** Recorta §«UX de pantalla» de AGENTS.md, hasta el siguiente encabezado de nivel 2. */
export function sliceUx(agentsMd) {
  const i = agentsMd.indexOf('## UX de pantalla');
  if (i < 0) return '';
  const j = agentsMd.indexOf('\n## ', i + 1);
  return j < 0 ? agentsMd.slice(i) : agentsMd.slice(i, j);
}

/** Títulos numerados de la sección, en orden. */
export function titulosAgents(slice) {
  return [...slice.matchAll(RE_TITULO_AGENTS)].map((m) => ({ n: Number(m[1]), titulo: m[2].trim() }));
}

/**
 * Entradas de la página: título + todo su texto (aplica/evita/ya-lo-tienes) concatenado.
 * El texto se toma del bloque entre llaves de cada entrada, que es donde viven los tres
 * campos, para no depender del orden en que estén escritos.
 */
export function entradasDocs(ts) {
  const entradas = [];
  const re = /\{\s*\n\s*icon:[\s\S]*?\n\s{4}\},/g;
  for (const m of ts.matchAll(re)) {
    const bloque = m[0];
    const t = bloque.match(/title:\s*'([^']+)'/);
    entradas.push({ titulo: t ? t[1] : '', texto: bloque });
  }
  return entradas;
}

/** Compara las dos copias. Devuelve la lista de problemas (vacía = cuadran). */
export function compararPatrones(agentsMd, patronesTs) {
  const problemas = [];
  const slice = sliceUx(agentsMd);
  if (!slice) {
    problemas.push('no encuentro la sección «UX de pantalla» en AGENTS.md — ¿se renombró?');
    return problemas;
  }
  const enAgents = titulosAgents(slice);
  const enDocs = entradasDocs(patronesTs);

  if (!enAgents.length || !enDocs.length) {
    problemas.push(
      `no consigo leer los principios (AGENTS ${enAgents.length}, página ${enDocs.length}) — ` +
        'cambió el formato; arregla el lector antes de fiarte de este check.',
    );
    return problemas;
  }

  if (enAgents.length !== enDocs.length) {
    problemas.push(
      `AGENTS tiene ${enAgents.length} principios y la página ${enDocs.length}. ` +
        'Alguien añadió o quitó uno en un lado. La página se edita en ' +
        'projects/sc-docs/src/app/pages/patrones/patrones.component.ts.',
    );
  }

  for (const { n, titulo } of enAgents) {
    const entrada = enDocs[n - 1];
    if (!entrada) continue;
    for (const patron of FRAGMENTOS[n] ?? []) {
      if (!patron.test(entrada.texto)) {
        problemas.push(
          `principio ${n} («${titulo}»): la página ya no dice ${patron} — ` +
            `su tarjeta («${entrada.titulo}») perdió una regla al reescribirse.`,
        );
      }
    }
  }

  for (const n of Object.keys(FRAGMENTOS).map(Number)) {
    if (n > enAgents.length) {
      problemas.push(
        `FRAGMENTOS describe un principio ${n} que ya no existe en AGENTS — quita su entrada.`,
      );
    }
  }

  return problemas;
}
