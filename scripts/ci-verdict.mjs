#!/usr/bin/env node
/**
 * El veredicto del CI, leído de la fuente y comparado con TU commit.
 *
 * LEARNINGS #7: el log que cuenta es el del CI, el wrapper/watcher no tiene voto, y sin
 * `--workflow ci` el `--limit 1` devuelve el run de «Auto-merge auditoría» (skipped) y cantas
 * verde con el `ci` en rojo. Esto fija los tres detalles en un comando para no reescribirlos.
 *
 * Exit: 0 verde sobre HEAD · 1 rojo · 2 pendiente/en curso · 3 el run es de OTRO commit
 *       (un check atado a un commit viejo es un snapshot, no el estado de hoy — #17 s39).
 *
 * Uso:  npm run ci:verdict            (rama actual)
 *       npm run ci:verdict -- main    (otra rama)
 */
import { execFileSync } from 'node:child_process';

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

const rama = process.argv[2] || sh('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
const head = sh('git', ['rev-parse', 'HEAD']);

let runs;
try {
  runs = JSON.parse(
    sh('gh', ['run', 'list', '--branch', rama, '--workflow', 'ci', '--limit', '1', '--json', 'headSha,conclusion,status,url,createdAt']),
  );
} catch (e) {
  console.error(`✗ no pude leer el CI (${e.message.split('\n')[0]}). ¿gh autenticado? ¿existe la rama en origin?`);
  process.exit(2);
}
if (!runs.length) {
  console.log(`○ sin runs del workflow ci en la rama ${rama} (¿aún no has pusheado?).`);
  process.exit(2);
}
const r = runs[0];
const mismo = r.headSha === head;
const sha = r.headSha.slice(0, 7);
if (!mismo) {
  console.log(`△ el último run de ci en ${rama} es de ${sha}, y tu HEAD es ${head.slice(0, 7)}: describe OTRO commit, no el tuyo. ${r.url}`);
  process.exit(3);
}
if (r.status !== 'completed') {
  console.log(`… ci en ${rama} sobre ${sha}: ${r.status}. Espera y repite. ${r.url}`);
  process.exit(2);
}
if (r.conclusion === 'success') {
  console.log(`✓ ci VERDE en ${rama} sobre ${sha} (tu HEAD). ${r.url}`);
  process.exit(0);
}
console.log(`✗ ci ${r.conclusion.toUpperCase()} en ${rama} sobre ${sha}. Lee el fallo: gh run view --log-failed ${r.url.split('/').pop()}`);
process.exit(1);
