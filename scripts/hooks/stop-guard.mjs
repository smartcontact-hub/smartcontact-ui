#!/usr/bin/env node
/**
 * Hook `Stop` — dos deudas que no dejan cerrar, las dos leídas del MISMO transcript:
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
 *
 * `stop_hook_active` evita el bucle: a la segunda deja parar.
 *
 * Entrada: JSON por stdin (transcript_path, session_id, cwd, stop_hook_active).
 * Salida: JSON de decisión.
 */
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
    if (!pend.length) return;
    return bloquear(motivoSinEnrutar(pend));
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
