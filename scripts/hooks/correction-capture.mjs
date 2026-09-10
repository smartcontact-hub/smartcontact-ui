#!/usr/bin/env node
/**
 * Hook `UserPromptSubmit` — la corrección se registra EN EL MOMENTO, no al cerrar; y el CIERRE
 * dispara `/reflect` él solo.
 *
 * Por qué: `/reflect` corre al final de la sesión, cuando la corrección ya se ha olvidado o
 * racionalizado. Medido el 2026-09-09: las seis reglas más rotas de LEARNINGS (de 3 a 5 sesiones
 * cada una) están TODAS en la tarjeta de CLAUDE.md que viaja en cada turno, y siguen siendo prosa.
 * Más texto no las dispara; lo que falta es que una máquina vea el momento en que Rafa corrige.
 *
 * Y por qué el ENRUTADO (2026-09-10): apuntar la corrección no la mecaniza. `/reflect` decidía en
 * PROSA dónde iba cada lección, y «lo apunto en LEARNINGS» valía como cierre — que es exactamente
 * la curva que el CHECK K y el CHECK O vinieron a cortar. Ahora cada corrección tiene que acabar
 * en una MÁQUINA (hook o gate, con la ruta del fichero que existe) o llevar escrita la
 * justificación de por qué una máquina no puede verla. Esa justificación es el precio de la
 * prosa; el hook de Stop cobra la deuda antes de dejar cerrar.
 *
 * Qué hace:
 *   · mensaje que suena a corrección (patrones ESTRECHOS, en su idioma) → lo apunta en
 *     `correcciones.jsonl` (carpeta del proyecto de Claude, fuera del repo) y pide nombrar la regla;
 *   · mensaje de CIERRE («cerramos», «cierra la sesión», `/reflect`) → mete en el contexto la orden
 *     de invocar la skill `reflect` y de enrutar lo pendiente.
 *
 * Entrada: JSON por stdin (prompt, session_id, cwd). Salida: texto plano → contexto de Claude.
 * CLI:
 *   `--listar [horas]`                        correcciones recientes, con id y ruta o PENDIENTE.
 *   `--enrutar <id> <destino> "<motivo>"`     ata una corrección a dónde acabó.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { dirProyectoClaude } from '../memory-shape.mjs';

const PATRONES = [
  /^\s*no[,.;:]\s/i,
  /\botra vez\b/i,
  /\bya te (lo )?(he )?dich[oa]\b/i,
  /\bte (lo )?(dije|he dicho|he pedido|pedí)\b/i,
  /\bpara lerdos\b/i,
  /\bno me refer[ií]a\b|\bno me refiero\b/i,
  /\bno era eso\b|\beso no es\b/i,
  /\bte has (saltado|pasado|equivocado|colado|liado)\b/i,
  /\bno hagas\b|\bdeja de\b/i,
  /\best[áa] mal\b/i,
  /\bpor qu[eé] (no )?(has|lo has|me has|hiciste|lo hiciste)\b/i,
  /\bcontra (tus|mis) bias\b/i,
];

// Cierre = el verbo ABRE la frase y no lleva más objeto que la sesión. «cerramos el ticket en
// Jira» o «el botón de cerrar sesión no va» hablan de otra cosa: un falso positivo aquí arranca un
// /reflect a mitad de tarea, que es peor que no tenerlo (LEARNINGS #2).
const CIERRES = [
  /^\s*\/reflect\b/i,
  /^\s*(?:venga|vale|ok|okey|bueno|bien)?[\s,.:;¿–-]*cerramos\b(?:\s+(?:ya|aqu[ií]|por\s+hoy|por\s+aqu[ií]|esto|el\s+d[ií]a|(?:la|esta)\s+sesi[oó]n|sesi[oó]n))?\s*[.!?…]*\s*$/i,
  /^\s*(?:venga|vale|ok|okey|bueno|bien)?[\s,.:;¿–-]*cierra\s+(?:la\s+)?sesi[oó]n\b/i,
  /^\s*(?:vamos\s+a\s+|podemos\s+|quiero\s+|hay\s+que\s+|toca\s+)?cerrar\s+(?:la\s+)?sesi[oó]n\b/i,
];

/**
 * El cierre suele venir AL FINAL de un mensaje más largo: «¿algo más que hacer o cerramos esta
 * sesión?». Anclar solo al principio se lo perdía — pasó con el mensaje de Rafa del 2026-09-10, con
 * el hook recién puesto delante. Se parte por fin de frase y por el «o» que abre la alternativa, y
 * se prueba la ÚLTIMA frase: «arregla el bug o cerramos el ticket» sigue en verde porque lo que va
 * detrás del verbo no es la sesión.
 */
export const ultimaFrase = (texto) =>
  String(texto)
    .split(/[.!?\n,]+|\s+o\s+/i)
    .map((c) => c.trim())
    .filter(Boolean)
    .at(-1) ?? '';

// Los mensajes de OTRA SESIÓN entran por el mismo hueco que los de Rafa, y su cuerpo suele traer
// «te dije» o «rectifico lo que te dije»: es el agente que escribe corrigiéndose A SÍ MISMO, no
// Rafa corrigiéndote a ti, que es el momento para el que existe este hook (ver cabecera). Contarlos
// infla la cuenta de la sesión y deja PENDIENTES de enrutar lecciones que no son tuyas.
// Medido s43: 2 de las 6 correcciones registradas en 24 h eran esto (LEARNINGS #2, un guardián con
// falsos positivos enseña a ignorarlo).
const SOBRE_DE_AGENTE = /^\s*<cross-session-message\b/i;
export const esDeOtroAgente = (texto) => typeof texto === 'string' && SOBRE_DE_AGENTE.test(texto);

export const esCorreccion = (texto) =>
  typeof texto === 'string' && !esDeOtroAgente(texto) && PATRONES.some((p) => p.test(texto));

// El sobre también filtra el CIERRE, y desde que `ultimaFrase` existe no es opcional: los patrones
// de CIERRES siguen anclados en `^`, pero se prueban además contra la última frase del mensaje, que
// no lo está. Un sobre de otra sesión acabado en «…o cerramos esta sesión?» arrancaría un /reflect
// a mitad de tarea sin que Rafa haya dicho nada — el falso positivo que CIERRES evita arriba.
export const esCierre = (texto) =>
  typeof texto === 'string' &&
  !esDeOtroAgente(texto) &&
  CIERRES.some((p) => p.test(texto) || p.test(ultimaFrase(texto)));

/** Raíz del repo (este fichero vive en `scripts/hooks/`). */
export const RAIZ = resolve(fileURLToPath(import.meta.url), '../../..');

export const DESTINO_AYUDA = 'hook | gate | tarjeta | regla#N | memoria | no-mecanizable';
const DESTINOS_FIJOS = new Set(['hook', 'gate', 'tarjeta', 'memoria', 'no-mecanizable']);
const JUSTIFICAN = new Set(['memoria', 'no-mecanizable']);
const MIN_MOTIVO = 40;

export const destinoValido = (d) => DESTINOS_FIJOS.has(d) || /^regla#\d+$/.test(String(d || ''));

export function rutaRegistro(cwd) {
  const dir = dirProyectoClaude(cwd);
  return dir ? join(dir, 'correcciones.jsonl') : null;
}

/**
 * Id corto y estable. Se escribe al registrar; las entradas anteriores al enrutador no lo llevan y
 * caen al sello de tiempo. Derivarlo del `ts` para TODAS era el diseño obvio y estaba mal: dos
 * correcciones seguidas caen en el mismo milisegundo y comparten id, así que enrutar una enrutaba
 * las dos. Lo cazó la sonda en rojo, no el verde (LEARNINGS #6).
 */
export const idDe = (e) => e.id || `t${String(Date.parse(e.ts)).slice(-5)}`;

/** Apunta la corrección y devuelve cuántas lleva esta sesión (0 si no hay dónde apuntar). */
export function registrar({ prompt, session_id, cwd }) {
  const ruta = rutaRegistro(cwd);
  if (!ruta) return 0;
  mkdirSync(join(ruta, '..'), { recursive: true });
  appendFileSync(
    ruta,
    JSON.stringify({ ts: new Date().toISOString(), id: randomBytes(3).toString('hex'), session_id, cwd, prompt: prompt.slice(0, 300) }) + '\n',
  );
  return correcciones(leer(ruta)).filter((e) => e.session_id === session_id).length;
}

export function leer(ruta, horas = Infinity) {
  if (!ruta || !existsSync(ruta)) return [];
  const desde = Date.now() - horas * 3600 * 1000;
  const out = [];
  for (const linea of readFileSync(ruta, 'utf8').split('\n')) {
    if (!linea.trim()) continue;
    try {
      const e = JSON.parse(linea);
      if (Date.parse(e.ts) >= desde) out.push(e);
    } catch {
      /* línea corrupta: se ignora */
    }
  }
  return out;
}

// Un registro, dos tipos de entrada. Las de antes del enrutador no llevan `tipo`: son correcciones.
export const correcciones = (entradas) => entradas.filter((e) => e.tipo !== 'ruta');
export const rutas = (entradas) => entradas.filter((e) => e.tipo === 'ruta');

/** Correcciones de una sesión sin entrada de ruta, con su id ya calculado. */
export function pendientes(ruta, session_id) {
  const entradas = leer(ruta);
  const atadas = new Set(rutas(entradas).map((r) => r.ref));
  return correcciones(entradas)
    .filter((e) => e.session_id === session_id)
    .map((e) => ({ ...e, id: idDe(e) }))
    .filter((e) => !atadas.has(e.id));
}

/** Rutas de `scripts/` citadas en el motivo que EXISTEN como fichero. */
export function ficherosCitados(motivo, root = RAIZ) {
  const out = [];
  for (const m of String(motivo || '').matchAll(/scripts\/[\w./-]*[\w/]/g)) {
    try {
      if (statSync(join(root, m[0])).isFile()) out.push(m[0]);
    } catch {
      /* no existe: no cuenta */
    }
  }
  return out;
}

/**
 * Qué hace válida una ruta: la mecanizable tiene que APUNTAR AL FICHERO (y que exista); la que se
 * queda en prosa tiene que decir POR QUÉ una máquina no puede verlo. Sin eso, «lo apunto en
 * LEARNINGS» vuelve a valer como cierre, que es lo que esto viene a cortar.
 */
export function validarRuta({ destino, motivo, root = RAIZ }) {
  if (!destinoValido(destino)) return { ok: false, error: `destino «${destino}» no válido. Elige uno de: ${DESTINO_AYUDA}.` };
  const texto = String(motivo || '').trim();
  if (!texto) return { ok: false, error: 'falta el motivo.' };

  if (destino === 'hook' || destino === 'gate') {
    const citados = ficherosCitados(texto, root);
    const bajoHooks = citados.filter((f) => f.startsWith('scripts/hooks/'));
    if (destino === 'hook' && !bajoHooks.length)
      return {
        ok: false,
        error: `destino «hook»: el motivo tiene que citar la ruta del hook, bajo scripts/hooks/, y que exista${citados.length ? ` (citas ${citados.join(', ')}, que no está en scripts/hooks/)` : ''}.`,
      };
    if (!citados.length) return { ok: false, error: 'destino «gate»: el motivo tiene que citar la ruta del script, bajo scripts/, y que exista.' };
    return { ok: true, ficheros: citados };
  }

  if (JUSTIFICAN.has(destino) || destino.startsWith('regla#')) {
    if (!/^porque\b/i.test(texto))
      return { ok: false, error: `destino «${destino}»: el motivo es la justificación de por qué una máquina NO puede verlo; tiene que empezar por «porque».` };
    if (texto.length < MIN_MOTIVO)
      return { ok: false, error: `destino «${destino}»: la justificación mide ${texto.length} caracteres y necesita ≥${MIN_MOTIVO}.` };
  }
  return { ok: true, ficheros: [] };
}

/** Ata una corrección ya registrada a dónde acabó. Devuelve `{ok, error}`. */
export function enrutar({ id, destino, motivo, cwd = process.cwd(), root = RAIZ }) {
  const ruta = rutaRegistro(cwd);
  if (!ruta) return { ok: false, error: 'no hay carpeta de proyecto de Claude donde apuntar.' };
  const entradas = leer(ruta);
  const corr = correcciones(entradas).find((e) => idDe(e) === id);
  if (!corr) return { ok: false, error: `no hay ninguna corrección con id «${id}». Míralas con --listar.` };
  const v = validarRuta({ destino, motivo, root });
  if (!v.ok) return v;
  appendFileSync(
    ruta,
    JSON.stringify({
      ts: new Date().toISOString(),
      tipo: 'ruta',
      ref: id,
      destino,
      motivo: String(motivo).trim(),
      session_id: corr.session_id,
      cwd,
    }) + '\n',
  );
  return { ok: true, corr };
}

export function aviso(n) {
  return (
    `⚠️ sc: esto suena a corrección (nº ${n} de la sesión; apuntada en correcciones.jsonl). ` +
    'Antes de contestar, di en UNA línea qué regla de LEARNINGS (#N) o ficha de memoria ya lo cubría, o «ninguna». /reflect la enruta al cerrar.'
  );
}

export function avisoCierre(pend = []) {
  const l = ['⚠️ sc: Invoca la skill reflect ahora, y enruta cada corrección pendiente con --enrutar antes de cerrar.'];
  if (!pend.length) l.push('(esta sesión no tiene correcciones pendientes de ruta.)');
  else {
    l.push(`${pend.length} pendiente(s) de esta sesión:`);
    for (const p of pend) l.push(`  [${p.id}] ${String(p.prompt).replace(/\s+/g, ' ').slice(0, 100)}`);
    l.push(`  node scripts/hooks/correction-capture.mjs --enrutar <id> <${DESTINO_AYUDA}> "<motivo>"`);
  }
  return l.join('\n');
}

function listar(horas) {
  const ruta = rutaRegistro(process.cwd());
  const entradas = leer(ruta, horas);
  const corr = correcciones(entradas);
  if (!corr.length) return `Sin correcciones registradas en las últimas ${horas} h.`;
  const porRef = new Map(rutas(leer(ruta)).map((r) => [r.ref, r]));
  const porSesion = new Map();
  for (const e of corr) porSesion.set(e.session_id, [...(porSesion.get(e.session_id) || []), e]);
  const sinRuta = corr.filter((e) => !porRef.has(idDe(e))).length;
  const lineas = [`${corr.length} corrección(es) en las últimas ${horas} h · ${sinRuta} sin enrutar:`];
  for (const [sid, es] of porSesion) {
    lineas.push(`· sesión ${String(sid).slice(0, 8)} (${es.length}):`);
    for (const e of es) {
      const r = porRef.get(idDe(e));
      lineas.push(`    [${idDe(e)}] ${e.ts.slice(0, 16)}  ${e.prompt.replace(/\s+/g, ' ').slice(0, 100)}`);
      lineas.push(r ? `             → ${r.destino}: ${r.motivo.replace(/\s+/g, ' ').slice(0, 110)}` : '             → PENDIENTE');
    }
  }
  if (sinRuta) lineas.push(`Enruta con: node scripts/hooks/correction-capture.mjs --enrutar <id> <${DESTINO_AYUDA}> "<motivo>"`);
  return lineas.join('\n');
}

async function main() {
  const iEnrutar = process.argv.indexOf('--enrutar');
  if (iEnrutar > 0) {
    const [id, destino, ...resto] = process.argv.slice(iEnrutar + 1);
    const r = enrutar({ id, destino, motivo: resto.join(' ') });
    if (!r.ok) {
      process.stderr.write(`sc --enrutar: ${r.error}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`Enrutada [${id}] → ${destino}: ${String(r.corr.prompt).replace(/\s+/g, ' ').slice(0, 80)}\n`);
    return;
  }
  const i = process.argv.indexOf('--listar');
  if (i > 0) {
    process.stdout.write(listar(Number(process.argv[i + 1]) || 48) + '\n');
    return;
  }
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const d of process.stdin) raw += d;
  let input = {};
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    return;
  }
  const corrige = esCorreccion(input.prompt);
  const cierra = esCierre(input.prompt);
  if (!corrige && !cierra) return;
  try {
    const cwd = input.cwd || process.cwd();
    const sid = input.session_id || 'sin-id';
    if (corrige) process.stdout.write(aviso(registrar({ prompt: input.prompt, session_id: sid, cwd })) + '\n');
    if (cierra) process.stdout.write(avisoCierre(pendientes(rutaRegistro(cwd), sid)) + '\n');
  } catch (e) {
    // Un hook roto no puede bloquear el trabajo: falla ABIERTO y lo dice.
    process.stderr.write(`correction-capture: ${e.message}\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
