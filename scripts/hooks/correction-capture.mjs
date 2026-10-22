#!/usr/bin/env node
/**
 * Hook `UserPromptSubmit` — la corrección se registra EN EL MOMENTO, no al cerrar; y el CIERRE
 * dispara `/reflect` él solo.
 *
 * Por qué: `/reflect` corre al final de la sesión, cuando la corrección ya se ha olvidado o
 * racionalizado. Medido el 2026-09-09: las seis reglas más rotas de LEARNINGS (de 3 a 5 sesiones
 * cada una) están TODAS en la tarjeta de CLAUDE.md que viaja en cada turno, y siguen siendo prosa.
 * Más texto no las dispara; lo que falta es que una máquina vea el momento en que el usuario corrige.
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
  // Lo que ya estaba hecho y vuelve deshecho (frases reales del 2026-09-23: «el espacio… que se había
  // hecho ya», «un marco que sobra que se había aprobado ya»). Con el «ya»: sin él es un relato, no un reproche.
  /\b(?:ya se hab[ií]a (?:hecho|aprobado|decidido)|se hab[ií]a (?:hecho|aprobado|decidido) ya)\b/i,
  // La queja VISUAL, que es la que se quiere contar por tipo (`npm run correcciones`, 2026-09-27): sin
  // «no», «otra vez» ni «te dije», un «esto se ve torcido» no entraba en el registro. Estrechas a
  // propósito: el adjetivo del defecto, no el verbo suelto («se ve bien» no dispara).
  /\bse ven? (?:raro|mal|torcid[oa]s?|descuadrad[oa]s?|apelotonad[oa]s?|apretad[oa]s?|pegad[oa]s?)\b/i,
  /\b(?:descuadrad|apelotonad)[oa]s?\b/i,
  /(?<!\bno )\bme chocan?\b/i,
  // El gusto y el parecido (2026-10-05: «No me gusta que haya tanto layout shift», «no se parece en
  // nada al telefono»). En el historial de prompts (leído el 2026-10-06), 11 de 13 «no me gusta»
  // distintos eran quejas del trabajo; los otros dos, de una app y de un enlace. «No se parece», solo
  // con «nada»: suelto salió en un texto del propio agente pegado de vuelta.
  /\bno me gusta\b/i,
  /\bno se parece (?:en )?nada\b/i,
  // Lo que pidió y no se construyó, y el criterio rebatido (2026-10-13: «No me lo has hecho en local… y me has
  // mezclado fuentes», «pero no tiene sentido poner… algunas con icono y otras sin»). En el historial de prompts
  // (leído ese día), los dos «no tiene sentido» eran quejas de un trabajo ya hecho.
  /\bno me (?:lo )?has hecho\b/i,
  /\bme has mezclado\b/i,
  /\bno tiene sentido\b/i,
];

// Cierre = el verbo ABRE la frase y no lleva más objeto que la sesión. «cerramos el ticket en
// Jira» o «el botón de cerrar sesión no va» hablan de otra cosa: un falso positivo aquí arranca un
// /reflect a mitad de tarea, que es peor que no tenerlo (LEARNINGS #2).
// Delante del verbo cabe RELLENO, una o varias palabras enteras: «Y ya con eso yo creo que
// cerramos». Con solo «venga|vale|ok|okey|bueno|bien» se escapaban «pues cerramos», «entonces
// cerramos?» o «pues voy a cerrar esta sesion», frases de cierre reales de los transcripts de tres
// semanas (medido el 2026-10-16).
const RELLENO = String.raw`(?:venga|vale|okey|ok|bueno|bien|pues|entonces|gracias|perfecto|genial|de\s+acuerdo|ya|y|as[ií]\s+que|luego|despu[eé]s|con\s+eso|(?:yo\s+)?creo\s+que)`;
const ARRANQUE = String.raw`^[\s,.:;¿¡–-]*(?:${RELLENO}[\s,.:;¿¡–-]+)*`;
const SESION = String.raw`(?:(?:la|esta)\s+)?sesi[oó]n`;
// Detrás del verbo, solo la sesión o un remate («ya», «por hoy», «con protocolo»…), y nada más
// hasta el final.
const OBJETO = String.raw`(?:\s+(?:ya|aqu[ií]|por\s+hoy|por\s+aqu[ií]|esto|el\s+d[ií]a|${SESION}|con\s+(?:el\s+)?protocolo(?:\s+de\s+cierre)?))*\s*[.!?…]*\s*$`;
const cierre = (cuerpo) => new RegExp(ARRANQUE + cuerpo + OBJETO, 'i');
const CIERRES = [
  /^\s*\/reflect\b/i,
  cierre(String.raw`(?:cerramos|cierro)\b`),
  cierre(String.raw`cierra\s+${SESION}`),
  cierre(String.raw`(?:voy\s+a\s+|vamos\s+a\s+|puedo\s+|podemos\s+|quiero\s+|hay\s+que\s+|toca\s+)?cerrar\s+${SESION}`),
  cierre(String.raw`(?:el\s+)?protocolo\s+de\s+cierre`),
];

/**
 * El cierre suele venir AL FINAL de un mensaje más largo: «¿algo más que hacer o cerramos esta
 * sesión?». Anclar solo al principio se lo perdía — pasó con un mensaje real del 2026-09-10, con
 * el hook recién puesto delante. Se parte por fin de frase y por el «o» que abre la alternativa:
 * «arregla el bug o cerramos el ticket» sigue en verde porque lo que va detrás del verbo no es la
 * sesión. Y por el «y» que encadena órdenes: «adelante, y commit y push y cerramos» (2026-09-23) se
 * escapó entero porque su última frase empezaba por «y commit».
 * Se prueban TODOS los trozos, no solo el último: «vale cierra todo de verdad y entonces cerramos.
 * Sigue tu criterio.» (2026-10) lleva el cierre en el del medio.
 */
export const frases = (texto) =>
  String(texto)
    .split(/[.!?\n,]+|\s+[oy]\s+/i)
    .map((c) => c.trim())
    .filter(Boolean);

export const ultimaFrase = (texto) => frases(texto).at(-1) ?? '';

// Los mensajes de OTRA SESIÓN entran por el mismo hueco que los del usuario, y su cuerpo suele traer
// «te dije» o «rectifico lo que te dije»: es el agente que escribe corrigiéndose A SÍ MISMO, no
// el usuario corrigiéndote a ti, que es el momento para el que existe este hook (ver cabecera). Contarlos
// infla la cuenta de la sesión y deja PENDIENTES de enrutar lecciones que no son tuyas.
// Medido s43: 2 de las 6 correcciones registradas en 24 h eran esto (LEARNINGS #2, un guardián con
// falsos positivos enseña a ignorarlo).
// Lo mismo con los sobres de la HERRAMIENTA: el aviso de una tarea de fondo o de un monitor
// (`<task-notification>`) y el arranque de una tarea programada (`<scheduled-task>`). El veredicto
// del CI dice «está en CONFLICTO… Rebasa primero» y casaba como si el usuario te corrigiera: 3 de las 6
// apuntadas en 48 h el 2026-09-14, más una tarea programada.
// Y los avisos de la APP: que una sesión hija terminó un turno (`<side-sessions-event>`) o que el
// monitor de un PR vio algo (`<ci-monitor-event>`). Llegan con uno o varios `<system-reminder>`
// DELANTE, y el primero cita lo que contó la hija («trae otra vez main», «deja de desplazarse»):
// el sobre no está al principio del texto, sino detrás de los recordatorios. 4 de las apuntadas
// entre el 2026-10-20 y el 22. En los transcripts (2.415 mensajes distintos, medido el 2026-10-22)
// llegaban así 71 avisos de sesión hija, 25 del monitor y 11 mensajes de otra sesión; del monitor,
// otros 123 sin recordatorio.
const SOBRE_DE_AGENTE =
  /^<(?:cross-session-message|task-notification|scheduled-task|side-sessions-event|ci-monitor-event)\b/i;
// Un mensaje REAL del usuario también llega con recordatorios delante (la nota de sesiones
// enlazadas, el aviso de worktree) y su texto detrás: por eso no basta con «empieza por
// `<system-reminder>`». Se quitan, y lo que queda es lo que escribió el usuario.
const RECORDATORIOS = /^(?:\s*<system-reminder\b[^>]*>[\s\S]*?<\/system-reminder>)*\s*/i;
const sinRecordatorios = (texto) => String(texto).replace(RECORDATORIOS, '');
// Lo PEGADO tampoco lo escribió el usuario: la app lo envuelve en `<pasted_content id="…">`, con el
// mismo id al cerrar. Era la respuesta de otra sesión («como te dije»), una nota de revisión («lo que
// está mal») o la transcripción de una reunión: en los transcripts (2026-10-22), 4 mensajes contaban
// como corrección solo por lo pegado, 3 de ellos entre los 9 apuntados en 72 h. Lo que el usuario
// escribe alrededor se sigue mirando.
const PEGADO = /<pasted_content\b([^>]*)>[\s\S]*?<\/pasted_content\1>/gi;
export const textoDelUsuario = (texto) => sinRecordatorios(texto).replace(PEGADO, ' ');

export const esDeOtroAgente = (texto) => {
  if (typeof texto !== 'string') return false;
  const resto = sinRecordatorios(texto);
  // Solo recordatorios, sin texto detrás: lo puso la app, no el usuario.
  if (!resto) return /<\/system-reminder>/i.test(texto);
  return SOBRE_DE_AGENTE.test(resto);
};

// Los patrones se prueban contra el texto del usuario: los recordatorios citan a otros (lo que contó
// una hija, el estado de las sesiones) y lo pegado es de otros, aunque el mensaje sí sea suyo.
export const esCorreccion = (texto) =>
  typeof texto === 'string' && !esDeOtroAgente(texto) && PATRONES.some((p) => p.test(textoDelUsuario(texto)));

// El sobre también filtra el CIERRE, y desde que se prueban los trozos no es opcional: los patrones
// de CIERRES siguen anclados en `^`, pero se prueban además contra cada frase del mensaje, que no lo
// está. Un sobre de otra sesión acabado en «…o cerramos esta sesión?» arrancaría un /reflect a mitad
// de tarea sin que el usuario haya dicho nada — el falso positivo que CIERRES evita arriba.
// Los trozos del MEDIO solo cuentan en un mensaje corto: un texto pegado (lo que dijo otra sesión,
// una transcripción de reunión) trae los cierres de otros. En tres semanas de transcripts
// (2026-10-16), los cierres reales que solo caza un trozo del medio miden ≤473 caracteres, y los
// falsos, ≥2.202. Pasado el tope se vuelve a lo de antes: el mensaje entero y su última frase.
// El tope mide el texto del USUARIO: el aviso de una hija y la nota de sesiones enlazadas pasan
// solos de 1.000 caracteres, y con ellos delante «vale cierra todo y entonces cerramos. Sigue tu
// criterio.» perdía el trozo del medio.
const TOPE_TROZOS = 1000;
export const esCierre = (texto) => {
  if (typeof texto !== 'string' || esDeOtroAgente(texto)) return false;
  const propio = textoDelUsuario(texto);
  const trozos = propio.length <= TOPE_TROZOS ? frases(propio) : [ultimaFrase(propio)];
  return [propio, ...trozos].some((f) => CIERRES.some((p) => p.test(f)));
};

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

/**
 * Apunta la corrección y devuelve cuántas lleva esta sesión (0 si no hay dónde apuntar).
 * Se apunta el texto del USUARIO, no el mensaje entero: con recordatorios delante, los 300
 * caracteres eran el recordatorio, y `--listar` enseñaba un aviso de la app donde había un mensaje
 * real con texto pegado (2026-10-22: así se contó como aviso uno que no lo era).
 */
export function registrar({ prompt, session_id, cwd }) {
  const ruta = rutaRegistro(cwd);
  if (!ruta) return 0;
  mkdirSync(join(ruta, '..'), { recursive: true });
  const propio = textoDelUsuario(prompt).trim().slice(0, 300);
  appendFileSync(
    ruta,
    JSON.stringify({ ts: new Date().toISOString(), id: randomBytes(3).toString('hex'), session_id, cwd, prompt: propio }) + '\n',
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
