#!/usr/bin/env node
/**
 * ¿Esta rama lleva `origin/main`? Si no, el preflight mide un árbol que no es el que se va a
 * pushear, y los 8 minutos se tiran.
 *
 * Medido el 2026-09-11: dos cadenas completas seguidas sobre la misma rama porque `main` avanzó
 * dos veces (#105, #103) entre el preflight y el push, y `ci:verdict` contestó «en conflicto».
 * Antes de correr nada, `git fetch origin main` + `git merge-base --is-ancestor origin/main HEAD`
 * (el mismo par que ya usa `.githooks/pre-push` para el atajo `proto/*`). Si no es ancestro, se
 * para con la orden exacta; si no hay remoto o el fetch no llega (sin red), se avisa y se sigue:
 * un repo suelto (los tests con repo temporal) no tiene con qué compararse.
 *
 * Lo llaman `preflight-scope.mjs` (antes de gastar un minuto) y `preflight-mark.mjs` (la marca
 * no se escribe ni se da por buena sobre un árbol que no lleva main).
 *
 * Uso:  node scripts/preflight-rebase.mjs      (exit 0 = al día o sin remoto; exit 2 = rebasa)
 *       import { medirRebase } from './preflight-rebase.mjs'
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const git = (cwd, args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/**
 * ¿Fundir `origin/main` en HEAD daría conflicto? Es distinto de «va rezagada»: una rama que no
 * lleva main pero funde LIMPIA se puede pushear y el CI del PR prueba el merge igualmente.
 * `git merge-tree --write-tree` lo dice sin tocar el árbol ni el índice (git ≥ 2.38): sale 0 si
 * el merge es limpio y ≠0 si hay conflicto.
 */
export function hayConflicto(cwd = process.cwd()) {
  try {
    git(cwd, ['merge-tree', '--write-tree', 'origin/main', 'HEAD']);
    return false;
  } catch {
    return true;
  }
}

/** El veredicto como función pura de tres hechos, para que el test lo pruebe sin git. */
export function estadoRebase({ hayRemoto, fetchOk, esAncestro }) {
  if (!hayRemoto) {
    return { ok: true, aviso: 'sin remoto `origin`: no hay `origin/main` con que comparar; se sigue' };
  }
  const aviso = fetchOk ? undefined : '`git fetch origin main` no llegó (¿sin red?): se compara contra el `origin/main` que ya tenías';
  if (!esAncestro) {
    return {
      ok: false,
      motivo:
        'esta rama no lleva `origin/main`: el preflight mediría un árbol que no es el que se pushea. ' +
        'Rebasa primero — `git fetch origin && git rebase origin/main` — y lanza la cadena sobre el árbol final.',
      aviso,
    };
  }
  return { ok: true, aviso };
}

/**
 * El veredicto para DESPUÉS de la cadena (al escribir o leer la marca), que es un caso distinto:
 * aquí main ya no avanzó «antes de empezar» sino DURANTE los 8 minutos, y obligar a repetir la
 * cadena entera cada vez que otra sesión funde algo es un bucle sin salida — el 2026-09-11 había
 * TRES sesiones fundiendo en el mismo repo. Así que solo se niega cuando el merge daría
 * CONFLICTO, que es el caso que de verdad obliga a rehacer el trabajo; si funde limpio, avisa y
 * sigue (y el CI del PR prueba el merge de todas formas).
 */
export function estadoTrasLaCadena(cwd = process.cwd()) {
  const st = medirRebase(cwd);
  if (st.ok) return st;
  if (hayConflicto(cwd)) {
    return {
      ok: false,
      motivo:
        'main avanzó DURANTE la cadena y ahora funde con CONFLICTO: lo que pasó el preflight no ' +
        'es lo que acabaría en main. `git fetch origin && git rebase origin/main` y repítela.',
    };
  }
  return {
    ok: true,
    aviso: 'main avanzó durante la cadena, pero funde limpio: se sigue (el CI del PR prueba el merge).',
  };
}

/** Lee los tres hechos de un repo real y devuelve el veredicto. */
export function medirRebase(cwd = process.cwd()) {
  let hayRemoto = true;
  try {
    git(cwd, ['remote', 'get-url', 'origin']);
  } catch {
    hayRemoto = false;
  }
  let fetchOk = false;
  let esAncestro = false;
  if (hayRemoto) {
    try {
      git(cwd, ['fetch', '--quiet', 'origin', 'main']);
      fetchOk = true;
    } catch {
      fetchOk = false;
    }
    try {
      git(cwd, ['merge-base', '--is-ancestor', 'origin/main', 'HEAD']);
      esAncestro = true;
    } catch {
      esAncestro = false;
    }
  }
  return estadoRebase({ hayRemoto, fetchOk, esAncestro });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const st = medirRebase(process.cwd());
  if (st.aviso) console.log(`⚠️ ${st.aviso}`);
  if (!st.ok) {
    console.error(`✗ ${st.motivo}`);
    process.exit(2);
  }
  console.log('✓ la rama lleva `origin/main`');
}
