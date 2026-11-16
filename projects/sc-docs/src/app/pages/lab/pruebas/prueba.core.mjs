// @ts-check
/**
 * PRUEBAS CON USUARIOS, las reglas puras y sin Angular (DD-256). Las usan la página de cada prueba en el Lab y sus
 * pantallas de inicio y fin, y las prueba `scripts/__tests__/prueba-usuarios.test.mjs` dentro de `verify`.
 *
 * Una prueba compara VERSIONES (cada una es un enlace) con TAREAS. Cada persona prueba todas las versiones, en un
 * orden que se alterna (P1 empieza por A, P2 por B), y en cada vuelta hace la misión GEMELA de la tarea: el mismo
 * trabajo con otros datos, para que la segunda versión no salga beneficiada porque ya se sabe la tarea.
 *
 * El veredicto sigue una regla fijada antes de mirar los datos: gana quien más veces se resuelve bien y SIN ayuda; si
 * empatan, la facilidad (SEQ, 1 a 7); luego el tiempo, solo si una tarda al menos un 50 % más; y al final la
 * preferencia. Cada criterio cuenta solo las veces en que las versiones se separan y aplica una prueba de signos: con
 * 5 a 10 personas, una diferencia solo cuenta si p < 0,10 (el umbral que usa MeasuringU con muestras pequeñas). Con 6
 * personas hace falta un 5 a 0; un 4 a 2 es empate, y entonces decide lo que se vio en las sesiones.
 */

/**
 * @typedef {{ readonly id: string, readonly nombre: string, readonly url: string }} Version
 * @typedef {{ readonly id: string, readonly titulo: string, readonly gemelas: readonly string[], readonly nota?: string }} Tarea
 * @typedef {{ readonly id: string, readonly versiones: readonly Version[], readonly tareas: readonly Tarea[] }} PlanMinimo
 * @typedef {{ version: string, url: string, mision: string, titulo: string, enunciado: string, nota?: string }} Paso
 * @typedef {{ readonly bien: number, readonly total: number, readonly titular?: string }} Comprobacion
 * @typedef {{
 *   version: string, mision: string, ms: number, clics: number, primerClic: string | null,
 *   enVacio: readonly string[], pantallas: readonly string[],
 *   ayudas: readonly { readonly ms: number, readonly pantalla: string }[],
 *   comprobacion: Comprobacion | null, moderador: 'si' | 'medias' | 'no' | null, facilidad: number | null,
 * }} PasoResultado
 * @typedef {{
 *   v: 1, prueba: string, participante: string, orden: readonly string[], pasos: readonly PasoResultado[],
 *   preferencia?: { readonly version: string | null, readonly porque: string },
 * }} Resultado
 */

/** El prefijo del resultado que se copia al acabar: `SCP1.<datos>`. Se reconoce aunque venga dentro de otro texto. */
export const CODIGO_RESULTADO = 'SCP1.';

/** La p por debajo de la cual una diferencia cuenta con pocas personas. */
export const UMBRAL = 0.1;

/** Lo que una versión tiene que tardar de más para que el tiempo cuente: un 50 %. */
export const FACTOR_TIEMPO = 1.5;

/* ───────────────────────────── El enlace (copia del de `prueba-enlace.core.mjs` del Supervisor) ───────────────────────────── */

/**
 * @param {unknown} valor
 * @returns {string}
 */
export function codificar(valor) {
  const bytes = new TextEncoder().encode(JSON.stringify(valor));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * @param {string} texto
 * @returns {unknown}
 */
export function decodificar(texto) {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(b64 + '==='.slice((b64.length + 3) % 4));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0))));
}

/* ───────────────────────────── El orden y los pasos de cada persona ───────────────────────────── */

/**
 * El número de una persona: `P3` → 3. Sin número, la 1.
 * @param {string} participante
 */
export function numeroDe(participante) {
  const m = /(\d+)/.exec(participante);
  return m ? Math.max(1, Number(m[1])) : 1;
}

/**
 * El orden de las versiones para una persona: se rota una posición por persona (P1 ABC, P2 BCA, P3 CAB).
 * @param {PlanMinimo} plan
 * @param {string} participante
 * @returns {string[]}
 */
export function ordenDeVersiones(plan, participante) {
  const ids = plan.versiones.map((v) => v.id);
  const s = (numeroDe(participante) - 1) % ids.length;
  return [...ids.slice(s), ...ids.slice(0, s)];
}

/**
 * Lo que hará una persona, paso a paso: cada versión en su orden y, en la vuelta n, la gemela n de cada tarea.
 * @param {PlanMinimo} plan
 * @param {string} participante
 * @returns {Paso[]}
 */
export function pasosDe(plan, participante) {
  const orden = ordenDeVersiones(plan, participante);
  for (const t of plan.tareas) {
    if (t.gemelas.length < orden.length) {
      throw new Error(`La tarea «${t.id}» necesita una misión gemela por versión (${orden.length}).`);
    }
  }
  return orden.flatMap((id, vuelta) => {
    const v = /** @type {Version} */ (plan.versiones.find((x) => x.id === id));
    return plan.tareas.map((t) => ({
      version: id,
      url: v.url,
      mision: `${t.id}-${vuelta + 1}`,
      titulo: t.titulo,
      enunciado: t.gemelas[vuelta],
      ...(t.nota ? { nota: t.nota } : {}),
    }));
  });
}

/**
 * La sesión que viaja en el enlace: todo lo que el Supervisor necesita, sin tener que conocer el plan.
 * @param {PlanMinimo} plan
 * @param {string} participante
 * @param {string} fin la dirección a la que vuelve al acabar (la pantalla de fin de sc-docs)
 */
export function sesionDe(plan, participante, fin) {
  return {
    v: 1,
    prueba: plan.id,
    participante,
    orden: ordenDeVersiones(plan, participante),
    pasos: pasosDe(plan, participante),
    paso: 0,
    resultados: [],
    fin,
  };
}

/**
 * La dirección del primer paso, con la sesión en el enlace.
 * @param {ReturnType<typeof sesionDe>} sesion
 */
export const enlaceDelPrimerPaso = (sesion) => `${sesion.pasos[0].url}#prueba=${codificar(sesion)}`;

/* ───────────────────────────── Leer resultados ───────────────────────────── */

/**
 * @param {unknown} r
 * @returns {r is Resultado}
 */
function esResultado(r) {
  if (!r || typeof r !== 'object') return false;
  const o = /** @type {Record<string, unknown>} */ (r);
  return o['v'] === 1 && typeof o['prueba'] === 'string' && typeof o['participante'] === 'string' && Array.isArray(o['pasos']);
}

/**
 * El código que se copia al acabar.
 * @param {Resultado} resultado
 */
export const codigoDeResultado = (resultado) => `${CODIGO_RESULTADO}${codificar(resultado)}`;

/**
 * Los resultados que haya en un texto: códigos `SCP1.…` pegados (varios, aunque vengan entre otras palabras) o el
 * JSON de un fichero descargado.
 * @param {string} texto
 * @returns {Resultado[]}
 */
export function leerResultados(texto) {
  /** @type {Resultado[]} */
  const leidos = [];
  for (const m of texto.matchAll(/SCP1\.([A-Za-z0-9_-]+)/g)) {
    try {
      const r = decodificar(m[1]);
      if (esResultado(r)) leidos.push(r);
    } catch {
      // un código cortado al pegarlo: se ignora
    }
  }
  if (leidos.length) return leidos;
  try {
    const j = JSON.parse(texto);
    for (const r of Array.isArray(j) ? j : [j]) if (esResultado(r)) leidos.push(r);
  } catch {
    // no es JSON
  }
  return leidos;
}

/* ───────────────────────────── El veredicto ───────────────────────────── */

/**
 * La p de dos colas de la prueba de signos (binomial exacta con p = 0,5) para `a` veces a favor y `b` en contra.
 * @param {number} a
 * @param {number} b
 */
export function pSignos(a, b) {
  const n = a + b;
  if (n === 0) return 1;
  const m = Math.min(a, b);
  let suma = 0;
  let c = 1;
  for (let i = 0; i <= m; i++) {
    suma += c;
    c = (c * (n - i)) / (i + 1);
  }
  return Math.min(1, (2 * suma) / 2 ** n);
}

/**
 * ¿Salió bien? Si la rama corrige sola, manda la corrección; si no, lo que marcó quien modera. `null` = no se sabe.
 * @param {PasoResultado} p
 * @returns {boolean | null}
 */
export function exito(p) {
  if (p.comprobacion) return p.comprobacion.bien === p.comprobacion.total;
  if (p.moderador === 'si') return true;
  if (p.moderador === 'no' || p.moderador === 'medias') return false;
  return null;
}

/**
 * Bien y sin pedir ayuda: lo que decide.
 * @param {PasoResultado} p
 * @returns {boolean | null}
 */
export function limpio(p) {
  const e = exito(p);
  return e === null ? null : e && p.ayudas.length === 0;
}

/**
 * Una persona que mandó su resultado dos veces cuenta una: vale el último.
 * @param {readonly Resultado[]} rs
 */
function unicos(rs) {
  /** @type {Map<string, Resultado>} */
  const por = new Map();
  for (const r of rs) por.set(r.participante, r);
  return [...por.values()];
}

/** @param {readonly number[]} xs */
function mediana(xs) {
  if (!xs.length) return null;
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

/** @typedef {'exito' | 'facilidad' | 'tiempo' | 'preferencia'} Criterio */

/** @type {readonly Criterio[]} */
const CRITERIOS = ['exito', 'facilidad', 'tiempo', 'preferencia'];

/**
 * Compara dos intentos de la misma tarea: 1 si gana el primero, -1 si el segundo, 0 si empatan, null si no se puede.
 * @param {Criterio} c
 * @param {PasoResultado} x
 * @param {PasoResultado} y
 * @returns {number | null}
 */
function comparar(c, x, y) {
  if (c === 'exito') {
    const a = limpio(x);
    const b = limpio(y);
    if (a === null || b === null) return null;
    return a === b ? 0 : a ? 1 : -1;
  }
  if (c === 'facilidad') {
    if (x.facilidad == null || y.facilidad == null) return null;
    return Math.sign(x.facilidad - y.facilidad);
  }
  // tiempo: solo entre intentos que salieron bien, y solo si uno tarda al menos un 50 % más.
  if (exito(x) !== true || exito(y) !== true) return null;
  if (x.ms * FACTOR_TIEMPO <= y.ms) return 1;
  if (y.ms * FACTOR_TIEMPO <= x.ms) return -1;
  return 0;
}

/**
 * El veredicto de una prueba con los resultados que haya.
 * @param {PlanMinimo} plan
 * @param {readonly Resultado[]} resultados
 */
export function veredicto(plan, resultados) {
  const propios = unicos(resultados.filter((r) => r.prueba === plan.id));
  const ids = plan.versiones.map((v) => v.id);
  const nombre = (/** @type {string} */ id) => plan.versiones.find((v) => v.id === id)?.nombre ?? id;
  const unaTarea = plan.tareas.length === 1;
  const veces = (/** @type {number} */ n) => (unaTarea ? (n === 1 ? 'persona' : 'personas') : n === 1 ? 'vez' : 'veces');

  /** Por persona y tarea, el intento en cada versión. */
  const intentos = propios.flatMap((r) =>
    plan.tareas.map((t) => {
      /** @type {Map<string, PasoResultado>} */
      const m = new Map();
      for (const p of r.pasos) if (p.mision.startsWith(`${t.id}-`)) m.set(p.version, p);
      return m;
    }),
  );

  /** @param {Criterio} c @param {string} x @param {string} y */
  const cuenta = (c, x, y) => {
    let a = 0;
    let b = 0;
    if (c === 'preferencia') {
      for (const r of propios) {
        if (r.preferencia?.version === x) a++;
        else if (r.preferencia?.version === y) b++;
      }
      return { a, b };
    }
    for (const m of intentos) {
      const px = m.get(x);
      const py = m.get(y);
      if (!px || !py) continue;
      const s = comparar(c, px, py);
      if (s === 1) a++;
      else if (s === -1) b++;
    }
    return { a, b };
  };

  /** @param {Criterio} c @param {string} x */
  const gana = (c, x) =>
    ids.filter((y) => y !== x).every((y) => {
      const { a, b } = cuenta(c, x, y);
      return a > b && pSignos(a, b) < UMBRAL;
    });

  const resumen = ids.map((id) => {
    const pasos = propios.flatMap((r) => r.pasos.filter((p) => p.version === id));
    const facil = pasos.map((p) => p.facilidad).filter((f) => f != null);
    const bien = pasos.filter((p) => exito(p) === true);
    return {
      id,
      nombre: nombre(id),
      intentos: pasos.length,
      limpias: pasos.filter((p) => limpio(p) === true).length,
      bien: bien.length,
      ayudas: pasos.reduce((n, p) => n + p.ayudas.length, 0),
      facilidad: mediana(/** @type {number[]} */ (facil)),
      segundos: mediana(bien.map((p) => Math.round(p.ms / 1000))),
      preferida: propios.filter((r) => r.preferencia?.version === id).length,
    };
  });

  const base = { personas: propios.length, resumen };
  if (!propios.length) return { ...base, ganadora: null, motivo: null, frase: 'Aún no hay resultados.' };

  for (const c of CRITERIOS) {
    const x = ids.find((id) => gana(c, id));
    if (!x) continue;
    const rivales = ids.filter((y) => y !== x);
    const frente = rivales
      .map((y) => {
        const { a, b } = cuenta(c, x, y);
        return { y, a, b };
      });
    const { y, a, b } = frente[0];
    const otro = rivales.length === 1 ? nombre(y) : 'las demás';
    const alReves = b === 0 ? 'ninguna al revés' : `${b} al revés`;
    /** @type {Record<Criterio, string>} */
    const frases = {
      exito: `Gana ${nombre(x)}: ${a} ${veces(a)} la resolvieron bien y sin ayuda en ${nombre(x)} y no en ${otro}; ${alReves}.`,
      facilidad: `Gana ${nombre(x)} por facilidad: se resolvieron igual, pero ${a} ${veces(a)} la vieron más fácil en ${nombre(x)}; ${alReves}.`,
      tiempo: `Gana ${nombre(x)} por tiempo: se resolvieron igual, pero ${a} ${veces(a)} tardaron al menos un 50 % más en ${otro}; ${alReves}.`,
      preferencia: `Gana ${nombre(x)} por preferencia: en lo demás empatan, y ${a} ${veces(a)} la prefieren frente a ${b} que prefieren ${otro}.`,
    };
    return { ...base, ganadora: x, motivo: c, frase: frases[c] };
  }

  const pocas = propios.length < 5 ? ' Con menos de 5 personas ninguna diferencia llega a contar.' : '';
  return {
    ...base,
    ganadora: null,
    motivo: null,
    frase: `Empate: con ${propios.length} ${propios.length === 1 ? 'persona' : 'personas'} los datos no separan las versiones.${pocas} Decide lo que visteis en las sesiones.`,
  };
}
