#!/usr/bin/env node
/**
 * Hook `Stop` — «un push sin leer el veredicto del CI no está terminado» (LEARNINGS #7, s35:
 * seis pushes rojos seguidos escribiendo «preflight verde» sin abrir el CI ni una vez).
 *
 * Lee el transcript de la sesión: si el último `git push` de commits no va seguido de una
 * lectura del CI (`npm run ci:verdict`, `gh run list|view|watch`), bloquea el cierre UNA vez
 * con el comando exacto. `stop_hook_active` evita el bucle: a la segunda deja parar.
 *
 * Entrada: JSON por stdin (transcript_path, stop_hook_active). Salida: JSON de decisión.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
    let comandos;
    try {
      comandos = comandosBash(readFileSync(ruta, 'utf8'));
    } catch {
      return;
    }
    if (!necesitaVeredicto(comandos)) return;
    process.stdout.write(
      JSON.stringify({
        decision: 'block',
        reason:
          'LEARNINGS #7 — has pusheado y no has leído el veredicto del CI. Corre `npm run ci:verdict` (espera si está en curso; si está rojo, `gh run view --log-failed`) y cuéntale a Rafa el resultado LEÍDO, no el exit del wrapper.',
      }),
    );
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
