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
 *
 * Con UNA sola versión no hay con qué compararla: la prueba comprueba si cumple. Cada tarea tiene una sola misión, y
 * cumple si sale bien y sin ayuda al menos la `meta` de las veces (el 80 % si el plan no dice otra: con 6 personas, 5).
 */

/**
 * @typedef {{ readonly id: string, readonly nombre: string, readonly url: string }} Version
 * @typedef {{ readonly id: string, readonly titulo: string, readonly gemelas: readonly string[], readonly nota?: string }} Tarea
 * @typedef {{ readonly id: string, readonly versiones: readonly Version[], readonly tareas: readonly Tarea[], readonly meta?: number }} PlanMinimo
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

/** Con una sola versión, lo que cada tarea tiene que salir bien y sin ayuda para que cumpla, si el plan no dice otra. */
export const META = 0.8;

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
  if (ids.length === 1) return cumplimiento(plan, propios, base);
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
      facilidad: `Gana ${nombre(x)} por facilidad: al resolverla no hay diferencia que cuente, pero ${a} ${veces(a)} la vieron más fácil en ${nombre(x)}; ${alReves}.`,
      tiempo: `Gana ${nombre(x)} por tiempo: ni al resolverla ni en facilidad hay diferencia que cuente, pero ${a} ${veces(a)} tardaron al menos un 50 % más en ${otro}; ${alReves}.`,
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

/**
 * Con una sola versión no hay ganadora: cada tarea cumple o no la meta, y la frase dice cuáles no llegan.
 * @param {PlanMinimo} plan
 * @param {readonly Resultado[]} propios
 * @param {{ personas: number, resumen: object[] }} base
 */
function cumplimiento(plan, propios, base) {
  const meta = plan.meta ?? META;
  const tareas = plan.tareas.map((t) => {
    const hechos = propios.flatMap((r) => r.pasos.filter((p) => p.mision.startsWith(`${t.id}-`) && limpio(p) !== null));
    const limpias = hechos.filter((p) => limpio(p) === true).length;
    return { id: t.id, titulo: t.titulo, intentos: hechos.length, limpias, cumple: hechos.length > 0 && limpias / hechos.length >= meta };
  });
  const todo = { ...base, meta, tareas, ganadora: null, motivo: null };
  if (!propios.length) return { ...todo, frase: 'Aún no hay resultados.' };
  const porcentaje = `${Math.round(meta * 100)} %`;
  const pocas = propios.length < 5 ? ' Con menos de 5 personas es solo una pista.' : '';
  const medidas = tareas.filter((t) => t.intentos > 0);
  const fallan = medidas.filter((t) => !t.cumple);
  if (!fallan.length) {
    const cuales = medidas.length === 1 ? 'la tarea sale' : `las ${medidas.length} tareas salen`;
    return { ...todo, frase: `Cumple: ${cuales} bien y sin ayuda al menos el ${porcentaje} de las veces.${pocas}` };
  }
  const lista = fallan.map((t) => `«${t.titulo}», ${t.limpias} de ${t.intentos}`).join('; ');
  return {
    ...todo,
    frase: `No cumple en ${fallan.length} de ${medidas.length}: ${lista} bien y sin ayuda, y la meta es el ${porcentaje}.${pocas}`,
  };
}

/* ───────────────────────────── El informe: métricas con su sigla y qué hacer (DD-256 §8) ───────────────────────────── */

/** El participante del ensayo: quien modera hace la prueba por el camino corto. Se ve, no cuenta, y es la referencia. */
export const ENSAYO = 'ensayo';

/**
 * Las referencias contra las que se lee cada métrica, con su fuente. Son medias del sector, no metas: sirven para
 * saber si una cifra es rara, no para aprobar una versión.
 */
export const REFERENCIAS = {
  /** Tasa de éxito media en tareas de usabilidad (MeasuringU, ~1.200 tareas). */
  tsr: 0.78,
  /** Media de la pregunta única de facilidad (MeasuringU, SEQ). */
  seq: 5.5,
  /** Lostness: por encima, la persona se ha perdido (Smith, 1996). */
  lostness: 0.4,
};

/** z para un intervalo del 95 %. */
const Z = 1.96;

/**
 * Intervalo de confianza del 95 % de una proporción con el método de Wald ajustado (Agresti-Coull), el que recomienda
 * MeasuringU con muestras pequeñas: con 6 personas, «5 de 6» es «entre el 42 % y el 99 %».
 * @param {number} x
 * @param {number} n
 * @returns {[number, number]}
 */
function waldAjustado(x, n) {
  const na = n + Z * Z;
  const pa = (x + (Z * Z) / 2) / na;
  const m = Z * Math.sqrt((pa * (1 - pa)) / na);
  return [Math.max(0, pa - m), Math.min(1, pa + m)];
}

/** @param {readonly number[]} xs */
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** @param {readonly number[]} xs */
const mediaGeometrica = (xs) => (xs.length ? Math.exp(xs.reduce((a, b) => a + Math.log(b), 0) / xs.length) : null);

/**
 * Lostness de un intento (Smith, 1996): √((N/S − 1)² + (R/N − 1)²), con S las pantallas que visitó, N las distintas y
 * R las del camino corto. 0 es ir derecho; más de 0,4, perderse.
 * @param {readonly string[]} pantallas
 * @param {number} r
 */
function lostnessDe(pantallas, r) {
  const s = pantallas.length;
  if (!s || !r) return null;
  const n = new Set(pantallas).size;
  return Math.sqrt((n / s - 1) ** 2 + (Math.min(r, n) / n - 1) ** 2);
}

/** @param {number} x */
const pct = (x) => `${Math.round(x * 100)} %`;

/** «45 s», «1 min 20 s». @param {number} s */
const seg = (s) => {
  const r = Math.round(s);
  return r < 60 ? `${r} s` : `${Math.floor(r / 60)} min${r % 60 ? ` ${r % 60} s` : ''}`;
};

/** @param {number} x */
const coma = (x) => (Math.round(x * 10) / 10).toString().replace('.', ',');

/**
 * Las métricas de una versión en una tarea, con la sigla con que las nombra cualquiera que haga UX research.
 * @typedef {{
 *   id: string, nombre: string, n: number,
 *   tsr: { exitos: number, pct: number, ic: [number, number] } | null,
 *   tot: number | null, seq: number | null,
 *   fcs: { bueno: string, aciertos: number, pct: number } | null,
 *   lostness: number | null, ayuda: number | null, enVacio: number, preferida: number,
 * }} MetricasVersion
 * @typedef {'alta' | 'media' | 'baja'} Gravedad
 * @typedef {{
 *   regla: string, gravedad: Gravedad, version: string, nombre: string, tarea: string | null,
 *   sigla: string, titulo: string, evidencia: string, accion: string,
 * }} Hallazgo
 */

/**
 * El informe tras la prueba: por tarea y versión, las métricas con su sigla; y los hallazgos, cada uno con lo que se
 * vio y qué hacer, por gravedad. El ensayo no cuenta como persona: de él salen el primer clic bueno (FCS) y el camino
 * corto (Lostness).
 * @param {PlanMinimo} plan
 * @param {readonly Resultado[]} resultados
 */
export function informe(plan, resultados) {
  const propios = resultados.filter((r) => r.prueba === plan.id);
  const ensayo = unicos(propios).find((r) => r.participante === ENSAYO) ?? null;
  const personas = unicos(propios.filter((r) => r.participante !== ENSAYO));
  const nombre = (/** @type {string} */ id) => plan.versiones.find((v) => v.id === id)?.nombre ?? id;
  const variasTareas = plan.tareas.length > 1;
  const enTarea = (/** @type {PasoResultado} */ p, /** @type {Tarea} */ t) => p.mision.startsWith(`${t.id}-`);

  const tareas = plan.tareas.map((t) => {
    const versiones = plan.versiones.map((v) => {
      const pasos = personas.flatMap((r) => r.pasos.filter((p) => p.version === v.id && enTarea(p, t)));
      const ref = ensayo?.pasos.find((p) => p.version === v.id && enTarea(p, t)) ?? null;
      const corregidos = pasos.filter((p) => limpio(p) !== null);
      const exitos = corregidos.filter((p) => limpio(p) === true).length;
      const bien = pasos.filter((p) => exito(p) === true);
      const facil = /** @type {number[]} */ (pasos.map((p) => p.facilidad).filter((f) => f != null));
      const bueno = ref?.primerClic ?? null;
      const conClic = pasos.filter((p) => p.primerClic);
      const lost = ref?.pantallas.length
        ? /** @type {number[]} */ (pasos.map((p) => lostnessDe(p.pantallas, ref.pantallas.length)).filter((l) => l !== null))
        : [];
      /** @type {MetricasVersion} */
      const m = {
        id: v.id,
        nombre: v.nombre,
        n: pasos.length,
        tsr: corregidos.length
          ? { exitos, pct: exitos / corregidos.length, ic: waldAjustado(exitos, corregidos.length) }
          : null,
        tot: mediaGeometrica(bien.map((p) => p.ms / 1000)),
        seq: media(facil),
        fcs:
          bueno && conClic.length
            ? {
                bueno,
                aciertos: conClic.filter((p) => p.primerClic === bueno).length,
                pct: conClic.filter((p) => p.primerClic === bueno).length / conClic.length,
              }
            : null,
        lostness: media(lost),
        ayuda: pasos.length ? pasos.filter((p) => p.ayudas.length).length / pasos.length : null,
        enVacio: pasos.reduce((n, p) => n + p.enVacio.length, 0),
        preferida: personas.filter((r) => r.preferencia?.version === v.id).length,
      };
      return { m, pasos };
    });
    return { tarea: t, versiones };
  });

  /** @type {Hallazgo[]} */
  const hallazgos = [];
  for (const { tarea: t, versiones } of tareas) {
    const tarea = variasTareas ? t.titulo : null;
    const en = variasTareas ? ` en «${t.titulo}»` : '';
    for (const { m, pasos } of versiones) {
      if (!m.n) continue;
      /** @param {Omit<Hallazgo, 'version' | 'nombre' | 'tarea'>} h */
      const anota = (h) => hallazgos.push({ ...h, version: m.id, nombre: m.nombre, tarea });

      // TSR: la tarea no sale. Con lo que más falta, si la rama corrige y lo dice.
      if (m.tsr && m.tsr.pct < (plan.meta ?? REFERENCIAS.tsr)) {
        const titulares = contar(
          pasos.filter((p) => limpio(p) === false && p.comprobacion?.titular).map((p) => /** @type {string} */ (p.comprobacion?.titular)),
        );
        const [falta, veces] = titulares[0] ?? [null, 0];
        anota({
          regla: 'tsr-bajo',
          gravedad: m.tsr.pct < 0.5 ? 'alta' : 'media',
          sigla: 'TSR',
          titulo: `${m.nombre}: la tarea no sale${en}`,
          evidencia: `TSR ${m.tsr.exitos} de ${m.n} (${pct(m.tsr.pct)}; entre el ${pct(m.tsr.ic[0])} y el ${pct(m.tsr.ic[1])}), ${plan.meta ? `por debajo de la meta del ${pct(plan.meta)}` : `por debajo del ${pct(REFERENCIAS.tsr)} de media`}.${falta ? ` Lo que más falta: «${falta}» (${veces} ${veces === 1 ? 'vez' : 'veces'}).` : ''}`,
          accion: falta
            ? `Haz que no se pueda pasar por alto lo que más se queda sin hacer: «${falta}».`
            : 'Busca en las sesiones el paso donde se tuerce: la tarea no sale sola.',
        });
      }

      // Atasco: varias personas piden ayuda en la misma pantalla.
      const atascos = contar(pasos.flatMap((p) => [...new Set(p.ayudas.map((a) => a.pantalla))]));
      for (const [pantalla, k] of atascos) {
        if (k < 2) continue;
        anota({
          regla: 'atasco',
          gravedad: k >= m.n / 2 ? 'alta' : 'media',
          sigla: 'Ayuda',
          titulo: `${m.nombre}: se atascan en ${pantalla}${en}`,
          evidencia: `${k} personas pidieron ayuda en ${pantalla}.`,
          accion: `Lo que hay que hacer en ${pantalla} no se ve: revisa qué esperaban encontrar ahí y ponlo a la vista.`,
        });
      }

      // FCS: el primer clic no va donde va el camino corto.
      if (m.fcs && m.fcs.pct < 0.5) {
        const otros = contar(pasos.map((p) => p.primerClic).filter((c) => c && c !== m.fcs?.bueno).map(String));
        const [dondeVan, k] = otros[0] ?? [null, 0];
        anota({
          regla: 'primer-clic',
          gravedad: m.fcs.pct < 0.34 ? 'alta' : 'media',
          sigla: 'FCS',
          titulo: `${m.nombre}: no encuentran por dónde empezar${en}`,
          evidencia: `FCS ${m.fcs.aciertos} de ${m.n} (${pct(m.fcs.pct)}): el camino corto empieza en «${m.fcs.bueno}».${dondeVan ? ` El primer clic más repetido fue «${dondeVan}» (${k}).` : ''}`,
          accion: dondeVan
            ? `Haz que «${m.fcs.bueno}» destaque, o pon la entrada donde la buscan: «${dondeVan}».`
            : `Haz que «${m.fcs.bueno}» destaque desde donde empiezan.`,
        });
      }

      // Clic en vacío repetido: algo parece pulsable y no lo es.
      const vacios = contar(pasos.flatMap((p) => [...new Set(p.enVacio)]).filter((c) => !c.startsWith('espacio vacío')));
      for (const [donde, k] of vacios) {
        if (k < 2) continue;
        anota({
          regla: 'vacio',
          gravedad: 'media',
          sigla: 'Clic en vacío',
          titulo: `${m.nombre}: parece pulsable y no lo es${en}`,
          evidencia: `«${donde}»: ${k} personas lo pulsaron y no hizo nada.`,
          accion: 'Hazlo pulsable, que es lo que esperan, o quítale el aspecto de control.',
        });
      }

      // SEQ: se percibe difícil.
      if (m.seq !== null && m.seq < REFERENCIAS.seq) {
        anota({
          regla: 'seq-bajo',
          gravedad: m.seq < 4.5 ? 'media' : 'baja',
          sigla: 'SEQ',
          titulo: `${m.nombre}: se percibe difícil${en}`,
          evidencia: `SEQ ${coma(m.seq)} sobre 7, por debajo de la media de ${coma(REFERENCIAS.seq)}.`,
          accion: 'Busca el paso que más dudas dio en las sesiones: aunque salga, cuesta.',
        });
      }

      // Lostness: dan vueltas.
      if (m.lostness !== null && m.lostness > REFERENCIAS.lostness) {
        anota({
          regla: 'perdidos',
          gravedad: 'media',
          sigla: 'Lostness',
          titulo: `${m.nombre}: dan vueltas${en}`,
          evidencia: `Lostness ${coma(m.lostness)} de media; por encima de ${coma(REFERENCIAS.lostness)} es perderse.`,
          accion: 'Acerca el destino o dale un acceso directo desde donde empiezan.',
        });
      }
    }

    // ToT: una versión mucho más lenta que la más rápida (a partir de un 50 %).
    const conTiempo = versiones.filter(({ m }) => m.tot !== null);
    const rapida = conTiempo.reduce((a, b) => (a && /** @type {number} */ (a.m.tot) <= /** @type {number} */ (b.m.tot) ? a : b), conTiempo[0]);
    for (const { m } of conTiempo) {
      if (!rapida || m.id === rapida.m.id || /** @type {number} */ (m.tot) < /** @type {number} */ (rapida.m.tot) * FACTOR_TIEMPO) continue;
      hallazgos.push({
        regla: 'lenta',
        gravedad: 'baja',
        version: m.id,
        nombre: m.nombre,
        tarea,
        sigla: 'ToT',
        titulo: `${m.nombre}: cuesta más tiempo${en}`,
        evidencia: `ToT ${seg(/** @type {number} */ (m.tot))} frente a ${seg(/** @type {number} */ (rapida.m.tot))} en ${rapida.m.nombre}, contando solo lo que salió bien.`,
        accion: 'Mira qué paso añade el tiempo: suele ser un desvío o una confirmación de más.',
      });
    }

    // La paradoja preferencia-rendimiento: la prefieren, pero se resuelve peor.
    const conPref = versiones.filter(({ m }) => m.tsr);
    const masPreferida = [...conPref].sort((a, b) => b.m.preferida - a.m.preferida)[0];
    const mejor = [...conPref].sort((a, b) => /** @type {number} */ (b.m.tsr?.pct) - /** @type {number} */ (a.m.tsr?.pct))[0];
    if (
      masPreferida &&
      mejor &&
      masPreferida.m.id !== mejor.m.id &&
      masPreferida.m.preferida > Math.max(0, ...conPref.filter((x) => x !== masPreferida).map((x) => x.m.preferida)) &&
      /** @type {number} */ (mejor.m.tsr?.pct) > /** @type {number} */ (masPreferida.m.tsr?.pct)
    ) {
      const p = masPreferida.m;
      hallazgos.push({
        regla: 'paradoja',
        gravedad: 'media',
        version: p.id,
        nombre: p.nombre,
        tarea,
        sigla: 'Preferencia',
        titulo: `${p.nombre}: gusta más, pero funciona peor${en}`,
        evidencia: `La prefieren ${p.preferida} personas, pero su TSR es ${pct(/** @type {number} */ (p.tsr?.pct))} frente a ${pct(/** @type {number} */ (mejor.m.tsr?.pct))} en ${mejor.m.nombre} (la paradoja preferencia-rendimiento).`,
        accion: `Decide por lo que funciona y llévate a ${mejor.m.nombre} lo que gusta de ${p.nombre}: lo dicen en el «por qué».`,
      });
    }
  }

  const peso = { alta: 0, media: 1, baja: 2 };
  const orden = (/** @type {string} */ id) => plan.versiones.findIndex((v) => v.id === id);
  hallazgos.sort((a, b) => peso[a.gravedad] - peso[b.gravedad] || orden(a.version) - orden(b.version));

  return {
    personas: personas.length,
    conEnsayo: ensayo !== null,
    tareas: tareas.map(({ tarea: t, versiones }) => ({ id: t.id, titulo: t.titulo, versiones: versiones.map(({ m }) => m) })),
    hallazgos,
    nombre,
  };
}

/**
 * Cuántas veces sale cada valor, de más a menos.
 * @param {readonly string[]} xs
 * @returns {[string, number][]}
 */
function contar(xs) {
  /** @type {Map<string, number>} */
  const c = new Map();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1]);
}

/** @param {unknown} v */
const celda = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Los datos en bruto para una hoja de cálculo: una fila por intento, con cada métrica por intento. El ensayo va
 * marcado. Sin nombres: las personas son P1, P2…
 * @param {PlanMinimo} plan
 * @param {readonly Resultado[]} resultados
 */
export function csvDeResultados(plan, resultados) {
  const cab = [
    'participante', 'ensayo', 'version', 'nombre_version', 'tarea', 'mision', 'vuelta', 'exito', 'sin_ayuda',
    'comprobacion_bien', 'comprobacion_total', 'lo_que_falta', 'moderador', 'segundos', 'clics', 'clics_en_vacio',
    'ayudas', 'primer_clic', 'pantallas_visitadas', 'pantallas_distintas', 'seq', 'prefiere', 'por_que',
  ];
  const sn = (/** @type {boolean | null} */ b) => (b === null ? '' : b ? 'si' : 'no');
  const filas = unicos(resultados.filter((r) => r.prueba === plan.id)).flatMap((r) =>
    r.pasos.map((p, i) => {
      const t = plan.tareas.find((x) => p.mision.startsWith(`${x.id}-`));
      return [
        r.participante, r.participante === ENSAYO ? 'si' : 'no', p.version,
        plan.versiones.find((v) => v.id === p.version)?.nombre ?? p.version, t?.titulo ?? '', p.mision, i + 1,
        sn(exito(p)), sn(limpio(p)), p.comprobacion?.bien ?? '', p.comprobacion?.total ?? '',
        p.comprobacion?.titular ?? '', p.moderador ?? '', Math.round(p.ms / 1000), p.clics, p.enVacio.length,
        p.ayudas.length, p.primerClic ?? '', p.pantallas.length, new Set(p.pantallas).size, p.facilidad ?? '',
        r.preferencia ? (r.preferencia.version ?? 'igual') : '', r.preferencia?.porque ?? '',
      ].map(celda).join(',');
    }),
  );
  return `${[cab.join(','), ...filas].join('\n')}\n`;
}

/**
 * El informe para pegar en un documento o un ticket: el veredicto, las métricas con su sigla y los accionables.
 * @param {PlanMinimo & { readonly titulo?: string, readonly pregunta?: string }} plan
 * @param {ReturnType<typeof informe>} inf
 * @param {ReturnType<typeof veredicto>} v
 */
export function informeEnTexto(plan, inf, v) {
  const l = [`# ${plan.titulo ?? plan.id}`, ''];
  if (plan.pregunta) l.push(plan.pregunta, '');
  l.push(`**Veredicto:** ${v.frase}`, '', `${inf.personas} personas${inf.conEnsayo ? ', con ensayo de referencia' : ''}.`, '');
  for (const t of inf.tareas) {
    l.push(`## Métricas · ${t.titulo}`, '');
    l.push('| | TSR | ToT | SEQ | FCS | Lostness | Ayuda | Clics en vacío | La prefieren |', '|---|---|---|---|---|---|---|---|---|');
    for (const m of t.versiones) {
      const celdas = [
        m.tsr ? `${m.tsr.exitos} de ${m.n} (${pct(m.tsr.pct)}; ${pct(m.tsr.ic[0])}–${pct(m.tsr.ic[1])})` : '—',
        m.tot !== null ? seg(m.tot) : '—',
        m.seq !== null ? coma(m.seq) : '—',
        m.fcs ? pct(m.fcs.pct) : '—',
        m.lostness !== null ? coma(m.lostness) : '—',
        m.ayuda !== null ? pct(m.ayuda) : '—',
        String(m.enVacio),
        String(m.preferida),
      ];
      l.push(`| ${m.nombre} | ${celdas.join(' | ')} |`);
    }
    l.push('');
  }
  l.push('## Qué hacer', '');
  if (!inf.hallazgos.length) l.push('Nada destaca en los datos: decide lo que visteis en las sesiones.', '');
  const GRAVEDAD = { alta: 'Grave', media: 'Importante', baja: 'Menor' };
  for (const h of inf.hallazgos) {
    l.push(`- **${GRAVEDAD[h.gravedad]} · ${h.titulo}** (${h.sigla}). ${h.evidencia} Qué hacer: ${h.accion}`);
  }
  l.push(
    '',
    'TSR: tasa de éxito, con ayuda cuenta como fallo; entre paréntesis, su intervalo del 95 %. ToT: tiempo en la tarea, media geométrica de lo que salió bien. SEQ: facilidad de 1 a 7 (media del sector, 5,5). FCS: primer clic igual al del ensayo. Lostness: 0 es ir derecho; más de 0,4, perderse.',
  );
  return `${l.join('\n')}\n`;
}
