#!/usr/bin/env node
/**
 * El veredicto del CI, leído de la fuente y comparado con TU commit.
 *
 * LEARNINGS #7: el log que cuenta es el del CI, el wrapper/watcher no tiene voto, y sin
 * `--workflow ci` el `--limit 1` devuelve el run de «Auto-merge auditoría» (skipped) y cantas
 * verde con el `ci` en rojo. Esto fija los tres detalles en un comando para no reescribirlos.
 *
 * Y responde a la pregunta que de verdad se hace quien lo corre —«¿puedo fundir ya?»—, no solo a
 * «¿está verde?». Con el CI en verde hay dos formas de no poder fundir, y las dice las dos:
 *
 *   · el PR ya está MERGED (exit 4): un verde sobre una rama fundida es un snapshot de algo que ya
 *     no existe, y proponer fundirlo gasta un turno de Rafa (LEARNINGS #5, s43: leí `state` una
 *     vez, releí una proyección más corta que ya no lo incluía, y pregunté «¿lo fundo?» sobre un
 *     PR que el auto-merge había cerrado hacía tres minutos);
 *   · el PR está en CONFLICTO con la base (exit 5): s44, el propio #95 de este comando estaba
 *     verde y `CONFLICTING` a la vez, y el verde lo cantó el comando mientras el conflicto lo vi a
 *     mano en el PR.
 *
 * La rama por defecto es la de ORIGIN que sigue tu HEAD, no el nombre local: los worktrees de este
 * repo usan sufijo (`…-list-2`) sobre la misma rama remota, y con el nombre local `gh run list`
 * devuelve cero runs y el comando canta «¿aún no has pusheado?» sobre algo pusheado y verde.
 * Ojo al caso de una rama recién sacada de `origin/main` y aún sin pushear: su upstream ES
 * `origin/main`, así que lee el CI de main — y en cuanto commiteas, la comparación de sha lo dice
 * con el exit 3 («describe OTRO commit») en vez de venderte ese verde como tuyo.
 *
 * Con una rama PEDIDA a mano (`-- main`) el sha contra el que se compara es el tip de esa rama en
 * origin, no tu HEAD: preguntas por OTRA rama, así que tu HEAD no pinta nada. Comparar con él daba
 * un `△ describe OTRO commit` garantizado — y justo `-- main` es lo que el aviso del exit 4 te
 * manda correr al fundir, o sea que el propio comando se mandaba a un callejón (medido s44, al
 * leer main después de fundir el #95). El tip se lee con `git ls-remote`, no con el ref local
 * `origin/<rama>`: ese ref es tan viejo como tu último `fetch`, y un sha rancio aquí es
 * exactamente el falso «OTRO commit» que veníamos a quitar (LEARNINGS #5).
 *
 * Exit: 0 verde sobre HEAD · 1 rojo · 2 pendiente/en curso · 3 el run es de OTRO commit
 *       (un check atado a un commit viejo es un snapshot, no el estado de hoy — #17 s39)
 *       · 4 el PR de la rama ya está fundido · 5 el PR está en conflicto con la base.
 *
 * Uso:  npm run ci:verdict            (rama actual)
 *       npm run ci:verdict -- main    (otra rama)
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// `stdio` explícito: por defecto `execFileSync` REENVÍA el stderr del hijo al nuestro, así que el
// `git rev-parse @{upstream}` de una rama sin upstream escupía un `fatal: no upstream configured`
// por encima del veredicto aunque su `catch` ya lo tuviera contemplado. Capturado, no impreso: el
// mensaje sigue en `e.stderr` para quien lo necesite.
const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/**
 * El nombre con el que `gh` conoce la rama: el de origin que sigue tu HEAD si lo hay, y si no el
 * local. `upstream` llega como `origin/arebury/x` (o vacío si la rama no sigue a nadie).
 */
export function ramaPorDefecto(upstream, local) {
  const u = String(upstream || '').trim();
  const m = /^[^/]+\/(.+)$/.exec(u);
  return m ? m[1] : local;
}

/** La primera línea con contenido del fallo: el stderr del hijo si lo hay, y si no el `message`. */
export const motivo = (e) =>
  String(e?.stderr || '').trim().split('\n')[0] || String(e?.message || '').split('\n')[0] || 'sin detalle';

/**
 * El sha de una línea de `git ls-remote origin refs/heads/<rama>` (`<sha>\t<ref>`). Cadena vacía si
 * la rama no existe en origin: `ls-remote` no falla en ese caso, devuelve NADA — y quien lo trate
 * como error se pierde el único aviso útil («esa rama no está en origin»).
 */
export function shaDeLsRemote(salida) {
  const sha = String(salida || '').trim().split(/\s+/)[0] || '';
  return /^[0-9a-f]{40}$/.test(sha) ? sha : '';
}

/**
 * La decisión, separada de la recogida para poder ponerle delante cada caso malo (LEARNINGS #2).
 * `pr` es el PR de la rama (o null); `runs` lo que devuelve `gh run list --limit 1`; `head` el sha
 * contra el que se compara y `etiqueta` cómo se llama en el mensaje (tu HEAD, o el tip de origin).
 */
export function veredicto({ rama, head, runs, pr, etiqueta = 'tu HEAD' }) {
  if (pr && pr.state === 'MERGED') {
    const en = pr.mergeCommit?.oid ? ` en ${pr.mergeCommit.oid.slice(0, 7)}` : '';
    return {
      exit: 4,
      linea:
        `△ el PR #${pr.number} de ${rama} ya está MERGED${en}: no queda nada que fundir, y el ` +
        `verde de esta rama describe un árbol que ya no es main. Lee el CI de main: ` +
        `npm run ci:verdict -- main`,
    };
  }
  // El conflicto se dice ANTES de mirar el run, y por la misma razón que el MERGED de arriba: el
  // verde describe un árbol que va a cambiar. Rebasar reescribe el commit, así que ese run deja de
  // ser el tuyo en cuanto resuelvas — cantar «✓ VERDE» aquí es exactamente el turno que este
  // comando existe para no gastar (s44: el #95 estaba verde y `CONFLICTING` con el #94 a la vez, y
  // el verde me lo dijo el comando mientras el conflicto lo vi yo a mano en el PR).
  // `mergeable` llega `UNKNOWN` durante los segundos que GitHub tarda en calcularlo tras un push:
  // eso NO es «funde», así que solo hablamos con el CONFLICTING medido (LEARNINGS #17).
  if (pr && pr.state === 'OPEN' && pr.mergeable === 'CONFLICTING') {
    return {
      exit: 5,
      linea:
        `△ el PR #${pr.number} de ${rama} está en CONFLICTO con la base: el CI no es la pregunta, ` +
        `porque al rebasar cambia el commit y el run deja de ser el tuyo. Rebasa primero: ` +
        `git fetch origin && git rebase origin/main`,
    };
  }
  if (!runs.length) {
    return { exit: 2, linea: `○ sin runs del workflow ci en la rama ${rama} (¿aún no has pusheado?).` };
  }
  const r = runs[0];
  const sha = r.headSha.slice(0, 7);
  if (r.headSha !== head) {
    return {
      exit: 3,
      linea: `△ el último run de ci en ${rama} es de ${sha}, y ${etiqueta} es ${head.slice(0, 7)}: describe OTRO commit. ${r.url}`,
    };
  }
  if (r.status !== 'completed') {
    return { exit: 2, linea: `… ci en ${rama} sobre ${sha}: ${r.status}. Espera y repite. ${r.url}` };
  }
  if (r.conclusion === 'success') {
    return { exit: 0, linea: `✓ ci VERDE en ${rama} sobre ${sha} (${etiqueta}). ${r.url}` };
  }
  return {
    exit: 1,
    linea: `✗ ci ${String(r.conclusion).toUpperCase()} en ${rama} sobre ${sha}. Lee el fallo: gh run view --log-failed ${r.url.split('/').pop()}`,
  };
}

function main() {
  let upstream = '';
  try {
    upstream = sh('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  } catch {
    /* rama sin upstream: nos quedamos con el nombre local */
  }
  const ramaPedida = process.argv[2];
  const rama = ramaPedida || ramaPorDefecto(upstream, sh('git', ['rev-parse', '--abbrev-ref', 'HEAD']));

  let head;
  let etiqueta;
  if (ramaPedida) {
    head = shaDeLsRemote(sh('git', ['ls-remote', 'origin', `refs/heads/${rama}`]));
    if (!head) {
      console.error(`○ la rama ${rama} no existe en origin (nada que comparar). ¿El nombre está bien escrito?`);
      process.exit(2);
    }
    etiqueta = `el tip de origin/${rama}`;
  } else {
    head = sh('git', ['rev-parse', 'HEAD']);
    etiqueta = 'tu HEAD';
  }

  let runs;
  try {
    runs = JSON.parse(
      sh('gh', ['run', 'list', '--branch', rama, '--workflow', 'ci', '--limit', '1', '--json', 'headSha,conclusion,status,url,createdAt']),
    );
  } catch (e) {
    // Ahora que el stderr va capturado, el motivo de verdad vive en `e.stderr`; `e.message` solo
    // dice «Command failed». Sin esto, silenciar el ruido de arriba se habría llevado por delante
    // el único dato útil del fallo.
    console.error(`✗ no pude leer el CI (${motivo(e)}). ¿gh autenticado? ¿existe la rama en origin?`);
    process.exit(2);
  }

  // El estado del PR no puede tumbar la lectura del CI: si `gh pr list` falla, seguimos sin él.
  let pr = null;
  try {
    pr = JSON.parse(sh('gh', ['pr', 'list', '--head', rama, '--state', 'all', '--limit', '1', '--json', 'number,state,mergeCommit,mergeable']))[0] || null;
  } catch {
    /* sin PR legible: el veredicto es solo el del CI */
  }

  const { linea, exit } = veredicto({ rama, head, runs, pr, etiqueta });
  console.log(linea);
  process.exit(exit);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
