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
 *     no existe, y proponer fundirlo gasta un turno del usuario (LEARNINGS #5, s43: leí `state` una
 *     vez, releí una proyección más corta que ya no lo incluía, y pregunté «¿lo fundo?» sobre un
 *     PR que el auto-merge había cerrado hacía tres minutos);
 *   · el PR está en CONFLICTO con la base (exit 5): s44, el propio #95 de este comando estaba
 *     verde y `CONFLICTING` a la vez, y el verde lo cantó el comando mientras el conflicto lo vi a
 *     mano en el PR;
 *   · el PR de la rama está MERGED pero tu HEAD es un commit NUEVO por delante del suyo (exit 6):
 *     una sesión cloud reutiliza el mismo nombre de rama tras fundir, y el siguiente lote llega
 *     antes de abrir el PR nuevo. Hasta que lo abras no hay `pull_request` que dispare `ci.yml`, así
 *     que no hay verde ni rojo que leer — este aviso YA es la lectura (#333, medido 2026-10-05: HEAD
 *     77f544f6 con commits sobre el #330, ya fundido en 8b62576a).
 *
 * La rama por defecto es la de ORIGIN que sigue tu HEAD, no el nombre local: los worktrees de este
 * repo usan sufijo (`…-list-2`) sobre la misma rama remota, y con el nombre local la consulta
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
 *       · 4 el PR de la rama ya está fundido · 5 el PR está en conflicto con la base
 *       · 6 el PR de la rama está fundido pero tu HEAD es un commit nuevo encima: sin PR abierto,
 *         no hay CI que disparar todavía.
 *
 * Uso:  npm run ci:verdict            (rama actual)
 *       npm run ci:verdict -- main    (otra rama)
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { cliente } from './github.mjs';

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
 * Qué hacer con un rojo, según sus jobs (`null` si no se pudieron leer). Dos casos medidos en #325 (2026-10-04):
 *   · una ejecución en rojo SIN jobs: la deja así el commit del robot de `visual-baselines` sobre un PR ya abierto, y
 *     no hay log que leer;
 *   · `e2e-smoke` en rojo: casi siempre una captura de sc-docs que hay que regenerar para la rama.
 * El log se lee con `gh run view --log-failed` en el Mac; el `gh` de la nube solo tiene `api`, que da los jobs.
 */
export function pistaDelRojo({ rama, id, jobs = null }) {
  const leer = `Lee el fallo: gh run view --log-failed ${id} (en la nube: gh api repos/{owner}/{repo}/actions/runs/${id}/jobs)`;
  if (!jobs) return leer;
  if (!jobs.length) {
    return (
      'La ejecución no arrancó ningún job: pasa con el commit del robot de visual-baselines sobre un PR ya abierto. ' +
      'Sube el siguiente commit o reejecútala en GitHub.'
    );
  }
  const rojos = jobs.filter((j) => ['failure', 'timed_out', 'cancelled'].includes(j.conclusion)).map((j) => j.name);
  let pista = `falla: ${rojos.join(', ') || 'sin job en rojo'}. ${leer}`;
  if (rojos.some((n) => n.startsWith('e2e-smoke'))) {
    pista += ` · Si es una captura de sc-docs: lanza visual-baselines con rama=${rama}, revisa las PNG y sigue.`;
  }
  return pista;
}

/**
 * La decisión, separada de la recogida para poder ponerle delante cada caso malo (LEARNINGS #2).
 * `pr` es el PR de la rama (o null); `runs` la última ejecución de `ci` en la rama (lista de 0 o 1); `head` el
 * sha contra el que se compara y `etiqueta` cómo se llama en el mensaje (tu HEAD, o el tip de origin). `jobs`,
 * los de esa ejecución si está en rojo, para dar la pista (ver `pistaDelRojo`).
 */
export function veredicto({ rama, head, runs, pr, etiqueta = 'tu HEAD', jobs = null }) {
  if (pr && pr.state === 'MERGED') {
    // El MERGED solo vale si describe TU commit: `headRefOid` es el sha que ese PR llegó a ver. Si
    // es otro, hay trabajo nuevo por delante del PR fundido (una sesión cloud que reutiliza el
    // nombre de la rama tras fundir, #333) y todavía no existe el PR que dispararía el CI — eso NO
    // es «ya está fundido, no queda nada», es «aún no hay nada que leer».
    if (pr.headRefOid && pr.headRefOid !== head) {
      return {
        exit: 6,
        linea:
          `△ ${etiqueta} ${head.slice(0, 7)} no tiene PR abierto: el CI corre al abrirlo ` +
          `(pull_request). El PR #${pr.number} anterior de ${rama} ya está fundido.`,
      };
    }
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
    linea: `✗ ci ${String(r.conclusion).toUpperCase()} en ${rama} sobre ${sha}. ${pistaDelRojo({ rama, id: r.id ?? r.url.split('/').pop(), jobs })}`,
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

  // GitHub, por `gh api` (`github.mjs`): el mismo camino en el Mac y en la nube, cuyo `gh` no tiene `run` ni `pr`.
  const github = cliente();
  let runs;
  try {
    runs = github.ultimaCI(rama);
  } catch (e) {
    // Ahora que el stderr va capturado, el motivo de verdad vive en `e.stderr`; `e.message` solo
    // dice «Command failed». Sin esto, silenciar el ruido de arriba se habría llevado por delante
    // el único dato útil del fallo.
    console.error(`✗ no pude leer el CI (${motivo(e)}). ¿gh autenticado? ¿existe la rama en origin?`);
    process.exit(2);
  }

  // Medido el 2026-10-05: con un run en curso sobre el HEAD, la consulta por `branch` dio de forma
  // pasajera el run de semanas antes (otro sha) y el comando cantó «describe OTRO commit» sobre algo
  // que SÍ era tuyo y SÍ estaba corriendo. Antes de darlo por «otro commit», se pregunta por el sha
  // exacto (`ejecucionesDeCommit`, que ya existía en `github.mjs`); solo si tampoco hay run ahí es de
  // verdad otro commit.
  if (runs[0] && runs[0].headSha !== head) {
    try {
      const porSha = github.ejecucionesDeCommit(head);
      if (porSha.length) runs = porSha;
    } catch {
      /* sin runs por sha: seguimos con el de la rama, que dirá «describe OTRO commit» */
    }
  }

  // El estado del PR no puede tumbar la lectura del CI: si no se puede leer, seguimos sin él.
  let pr = null;
  try {
    pr = github.prDeRama(rama);
  } catch {
    /* sin PR legible: el veredicto es solo el del CI */
  }

  // Los jobs, solo si hay un rojo que explicar; y tampoco pueden tumbar el veredicto.
  let jobs = null;
  const r = runs[0];
  if (r && r.headSha === head && r.status === 'completed' && r.conclusion !== 'success') {
    try {
      jobs = github.jobsDe(r.id);
    } catch {
      /* sin jobs: la pista es la genérica */
    }
  }

  const { linea, exit } = veredicto({ rama, head, runs, pr, etiqueta, jobs });
  console.log(linea);
  process.exit(exit);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
