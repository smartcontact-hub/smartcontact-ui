#!/usr/bin/env node
/**
 * Hook `Stop` — tres deudas que no dejan cerrar, las tres leídas del MISMO transcript:
 *
 *   1. «un push sin leer el veredicto del CI no está terminado» (LEARNINGS #7, s35: seis pushes
 *      rojos seguidos escribiendo «preflight verde» sin abrir el CI ni una vez). Si el último
 *      `git push` de commits no va seguido de una lectura del CI (`npm run ci:verdict`,
 *      `gh run list|view|watch`), bloquea con el comando exacto.
 *   2. si en la sesión se invocó la skill `reflect` y quedan correcciones de ESTA sesión sin
 *      enrutar, bloquea con la lista y el `--enrutar` exacto. Reflexionar es decidir dónde va cada
 *      lección; sin la ruta escrita, «lo apunto en LEARNINGS» vuelve a valer como cierre y la
 *      prosa gana otra vez (2026-09-10: 54 commits de prosa por 4 de hooks). Sin `reflect` no
 *      bloquea: parar a mitad de tarea no es cerrar.
 *   3. el PARTE DE CIERRE. Rafa no programa: su coste no es lo que yo he tecleado, es lo que le
 *      llega. Un cierre que dice «pusheado, CI verde» le cuenta el trámite y se calla lo único
 *      que decide algo — qué cambia en su día a día, por qué le conviene, y qué le toca a él.
 *      Así que el cierre lleva tres líneas fijas, cortas y en su idioma, y la del PORQUÉ no puede
 *      llevar jerga: si el beneficio solo se sabe decir con «hook» o «gate», no está entendido.
 *      (Petición de Rafa, 2026-09-10.)
 *   4. dentro del parte, «¿es seguro cerrar?»: si la caja está vacía o queda algo solo aquí
 *      dentro. Y esta NO se cree lo que yo escribo: el hook MIDE el árbol (sin commitear, sin
 *      pushear, sin upstream) y me desmiente si pongo «sí» con trabajo colgando. Un «todo subido»
 *      afirmado sin mirar es exactamente la regla #17 en su versión más cara: Rafa cierra la
 *      ventana y el contexto no vuelve. (Petición de Rafa, 2026-09-10.)
 *
 * `stop_hook_active` evita el bucle: a la segunda deja parar.
 *
 * Entrada: JSON por stdin (transcript_path, session_id, cwd, stop_hook_active).
 * Salida: JSON de decisión.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { DESTINO_AYUDA, pendientes, rutaRegistro } from './correction-capture.mjs';

const esPushDeCommits = (cmd) =>
  /\bgit\s+push\b/.test(cmd) && !/--tags\b|refs\/tags|\barchive\//.test(cmd) && !/--delete\b|\s:[A-Za-z]/.test(cmd) && !/--dry-run\b/.test(cmd);
const esLecturaCI = (cmd) => /\bci:verdict\b|\bgh run (list|view|watch)\b/.test(cmd);

/** Comandos Bash del transcript (jsonl), en orden. */
export function comandosBash(jsonl) {
  const out = [];
  for (const linea of jsonl.split('\n')) {
    if (!linea.includes('"tool_use"') || !linea.includes('"Bash"')) continue;
    try {
      const ev = JSON.parse(linea);
      const contenido = ev?.message?.content;
      if (!Array.isArray(contenido)) continue;
      for (const c of contenido) if (c.type === 'tool_use' && c.name === 'Bash' && c.input?.command) out.push(c.input.command);
    } catch {
      /* línea no JSON */
    }
  }
  return out;
}

/** true si hay un push de commits sin lectura del CI después. */
export function necesitaVeredicto(comandos) {
  const ultimoPush = comandos.map(esPushDeCommits).lastIndexOf(true);
  if (ultimoPush < 0) return false;
  return !comandos.slice(ultimoPush + 1).some(esLecturaCI);
}

/**
 * true si la skill `reflect` se invocó en la sesión: por herramienta (`Skill`) o porque Rafa
 * escribió `/reflect` (que el transcript guarda como `<command-name>`).
 */
export function invocoReflect(jsonl) {
  for (const linea of jsonl.split('\n')) {
    if (!linea.includes('reflect')) continue;
    let ev;
    try {
      ev = JSON.parse(linea);
    } catch {
      continue;
    }
    const c = ev?.message?.content;
    const esComando = (t) => /<command-name>\/reflect<\/command-name>/.test(String(t || ''));
    if (esComando(c)) return true;
    if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (b?.type === 'tool_use' && b.name === 'Skill' && /(^|:)reflect$/.test(String(b.input?.skill || ''))) return true;
      if (b?.type === 'text' && esComando(b.text)) return true;
    }
  }
  return false;
}

/** El motivo LLEVA el comando: una lista sin el comando exacto se contesta con prosa otra vez. */
export function motivoSinEnrutar(pend) {
  return [
    `Has reflexionado y quedan ${pend.length} corrección(es) de esta sesión sin enrutar. Una lección sin destino es prosa: enruta cada una a una MÁQUINA, o escribe por qué ninguna puede verla.`,
    ...pend.map((p) => `  [${p.id}] ${String(p.prompt).replace(/\s+/g, ' ').slice(0, 100)}`),
    `Comando: node scripts/hooks/correction-capture.mjs --enrutar <id> <${DESTINO_AYUDA}> "<motivo>"`,
    'hook/gate: el motivo cita la ruta del fichero (los hooks, bajo scripts/hooks/). regla#N/memoria/no-mecanizable: motivo de ≥40 caracteres que empiece por «porque».',
  ].join('\n');
}

// ── El parte de cierre ───────────────────────────────────────────────────────────────────

/** Texto del último mensaje del asistente: el que se acaba de escribir, o sea, el cierre. */
export function ultimoMensaje(jsonl) {
  const lineas = jsonl.split('\n');
  for (let i = lineas.length - 1; i >= 0; i--) {
    if (!lineas[i].includes('"assistant"')) continue;
    let ev;
    try {
      ev = JSON.parse(lineas[i]);
    } catch {
      continue;
    }
    if (ev?.type !== 'assistant') continue;
    const c = ev?.message?.content;
    const texto = Array.isArray(c)
      ? c
          .filter((b) => b?.type === 'text')
          .map((b) => b.text)
          .join('\n')
      : typeof c === 'string'
        ? c
        : '';
    if (texto.trim()) return texto;
  }
  return '';
}

const MAX_LINEA = 200;
const MIN_CONTENIDO = 20;

/**
 * Jerga que en la línea del PORQUÉ no le dice nada a quien no programa. Lista CORTA y solo para
 * esa línea: en «Qué cambia» nombrar el hook es legítimo, en «En qué te ayuda» es esconderse.
 */
export const JERGA = /\b(hooks?|gates?|regex|jsonl|transcript|stdout|stderr|parser|wrapper|refactor|linter|payload|commits?|merge|branch|pipeline)\b/i;

/** Las tres líneas fijas. El `\**` es para que el negrita de markdown no despiste al patrón. */
export const PARTE = [
  { nombre: 'Qué cambia', re: /qu[eé]\s+cambia\s*\**\s*:\s*\**\s*(.*)$/im, min: MIN_CONTENIDO, llano: false },
  { nombre: 'En qué te ayuda', re: /en\s+qu[eé]\s+(?:te|nos|me)\s+ayuda\s*\**\s*:\s*\**\s*(.*)$/im, min: MIN_CONTENIDO, llano: true },
  { nombre: 'Rastro', re: /rastro\s*\**\s*:\s*\**\s*(.*)$/im, min: 1, llano: false },
];

export const PLANTILLA = [
  '**Cierre**',
  '- Qué cambia: <una frase, lo que pasa a partir de ahora>',
  '- En qué te ayuda: <el problema concreto que ya no vuelve, en tu idioma y sin jerga>',
  '- Tú tienes que: <decisión o paso fuera del repo; borra la línea si no hay nada>',
  '- Rastro: <PR/sha · veredicto del CI leído · docs/handoff/<frente>.md>',
  '- Seguro cerrar: <«sí» o «no» y por qué, en una frase: qué queda colgando o quién lo recoge>',
].join('\n');

/** Lo que la máquina SÍ puede ver de «¿se pierde algo si cierro?». `seguro: null` = no lo sé. */
export function estadoDelArbol(cwd = process.cwd()) {
  // `trimEnd`, no `trim`: el porcelain abre cada línea con dos huecos de estado (« M ruta»), y un
  // trim por delante se come la primera letra del fichero. Lo cazó la sonda sobre el árbol real.
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] }).trimEnd();
  const motivos = [];
  try {
    const sucio = git('status', '--porcelain').split('\n').filter(Boolean);
    const rutaDe = (l) => l.slice(3); // 2 de estado + 1 hueco, siempre
    if (sucio.length) motivos.push(`${sucio.length} fichero(s) sin commitear (${sucio.slice(0, 3).map(rutaDe).join(', ')}${sucio.length > 3 ? '…' : ''})`);
    let upstream = '';
    try {
      upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}').trim();
    } catch {
      motivos.push(`la rama ${git('rev-parse', '--abbrev-ref', 'HEAD').trim()} no está en el remoto: si se pierde el disco, se pierde el trabajo`);
    }
    if (upstream) {
      const sinPushear = Number(git('rev-list', '--count', '@{u}..HEAD'));
      if (sinPushear) motivos.push(`${sinPushear} commit(s) sin pushear a ${upstream}`);
    }
  } catch {
    return { seguro: null, motivos: [] }; // sin git (otra máquina, CI): el hook falla ABIERTO.
  }
  return { seguro: !motivos.length, motivos };
}

const SEGURO = /seguro\s+cerrar\s*\**\s*:\s*\**\s*(.*)$/im;

/**
 * La línea del veredicto. Aquí no vale el patrón genérico: lo que se comprueba no es que esté
 * escrita, es que lo que dice CUADRE con el árbol. Decir «sí, todo subido» sin mirarlo es lo que
 * hace que Rafa cierre la ventana encima de trabajo que solo existe aquí.
 */
export function fallosDeSeguridad(mensaje, estado) {
  const m = SEGURO.exec(mensaje);
  const texto = (m?.[1] ?? '').trim();
  if (!m) return ['falta la línea «Seguro cerrar:»: di si la caja está vacía o si queda algo colgando.'];
  const dice = /^s[ií]\b|^s[ií][,.:;]/i.test(texto) ? 'sí' : /^no\b|^no[,.:;]/i.test(texto) ? 'no' : null;
  if (!dice) return ['«Seguro cerrar:» empieza por «sí» o por «no», y después el porqué en la misma frase.'];
  if (dice === 'sí' && estado?.seguro === false)
    return [`dices que es seguro cerrar y el árbol dice que no: ${estado.motivos.join('; ')}. Súbelo, o cámbialo a «no» y di qué queda.`];
  return [];
}

/** Qué le falta al parte de cierre. Lista vacía = está bien. */
export function fallosDelParte(mensaje, estado) {
  const fallos = [];
  for (const { nombre, re, min, llano } of PARTE) {
    const m = re.exec(mensaje);
    const texto = (m?.[1] ?? '').trim();
    if (!m) {
      fallos.push(`falta la línea «${nombre}:».`);
      continue;
    }
    if (texto.length < min) {
      fallos.push(`«${nombre}:» está vacía o es un titular; dilo entero en una frase.`);
      continue;
    }
    if (texto.length > MAX_LINEA) fallos.push(`«${nombre}:» mide ${texto.length} caracteres y el tope es ${MAX_LINEA}: resúmela.`);
    const jerga = llano ? JERGA.exec(texto) : null;
    if (jerga) fallos.push(`«${nombre}:» dice «${jerga[0]}». Esa línea es para Rafa, que no programa: cuéntale el efecto, no la pieza.`);
  }
  return [...fallos, ...fallosDeSeguridad(mensaje, estado)];
}

export function motivoParteDeCierre(fallos) {
  return [
    'Estás cerrando y el parte de cierre no cuadra. Rafa no lee el diff: lo que le llega es este mensaje, así que lleva cuatro líneas fijas, cortas y en su idioma.',
    ...fallos.map((f) => `  · ${f}`),
    'Vuelve a escribir el mensaje final con esta forma:',
    PLANTILLA,
  ].join('\n');
}

const bloquear = (reason) => process.stdout.write(JSON.stringify({ decision: 'block', reason }));

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (raw += d));
  process.stdin.on('end', () => {
    let input = {};
    try {
      input = JSON.parse(raw || '{}');
    } catch {
      return;
    }
    if (input.stop_hook_active) return;
    const ruta = input.transcript_path;
    if (!ruta || !existsSync(ruta)) return;
    let jsonl;
    try {
      jsonl = readFileSync(ruta, 'utf8');
    } catch {
      return;
    }
    const comandos = comandosBash(jsonl);
    if (necesitaVeredicto(comandos))
      return bloquear(
        'LEARNINGS #7 — has pusheado y no has leído el veredicto del CI. Corre `npm run ci:verdict` (espera si está en curso; si está rojo, `gh run view --log-failed`) y cuéntale a Rafa el resultado LEÍDO, no el exit del wrapper.',
      );

    if (!invocoReflect(jsonl)) return;
    let pend = [];
    try {
      pend = pendientes(rutaRegistro(input.cwd || process.cwd()), input.session_id || 'sin-id');
    } catch {
      return; // sin registro (otra máquina, CI): el hook falla ABIERTO.
    }
    if (pend.length) return bloquear(motivoSinEnrutar(pend));

    const fallos = fallosDelParte(ultimoMensaje(jsonl), estadoDelArbol(input.cwd || process.cwd()));
    if (fallos.length) return bloquear(motivoParteDeCierre(fallos));
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
