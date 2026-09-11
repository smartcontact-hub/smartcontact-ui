#!/usr/bin/env node
/**
 * El estado de TODAS las cajas abiertas, en una pantalla y con veredicto.
 *
 * Por qué existe (medido el 2026-09-10, no teórico): había NUEVE worktrees vivos, tres de ellos
 * con su trabajo en `main` desde hacía días, y una rama viviendo en DOS cajas a la vez
 * (`verdict-avisa-pr-fundido` y su `-2`: el mismo SHA `4964d47` en la local y en `origin`).
 * Nada de eso era visible sin encadenar cuatro comandos de git y de gh a mano, así que en la
 * práctica no lo miraba nadie.
 *
 * Contesta la pregunta que se hace al final de cada sesión, «¿puedo cerrar este chat?», para
 * todas a la vez. Una caja se cierra cuando está VACÍA: el PR fundido y el CI leído. Verde y sin
 * fundir no es trabajo entregado, porque los cinco sitios sirven `main` (NEXT-SESSION.md).
 *
 * No duplica `ci:verdict`, que es el veredicto PROFUNDO de UNA rama (lee el run del workflow y lo
 * casa con tu HEAD). Esto es la vista ancha: qué cajas hay y cuál pide algo.
 *
 * Exit: 0 si ninguna caja pide acción · 1 si alguna la pide (rojo, duplicado o trabajo sin subir).
 *
 * Uso:  npm run sesiones
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// `stderr: 'pipe'` a propósito: sin esto, un git que se queja (un árbol bare, una rama que no
// existe) escupe su «fatal: …» por encima de la tabla y el comando parece roto sin estarlo.
const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const shSafe = (cmd, args, fallback = '') => {
  try {
    return sh(cmd, args);
  } catch {
    return fallback;
  }
};

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

// ── Lógica pura (la que prueba el test) ────────────────────────────────────────

/**
 * La convención de este repo: un worktree `…-2` empuja a la rama SIN sufijo (el mismo tropiezo
 * que arregló el PR #95 en `ci:verdict`). Sin esto, una rama pusheada y verde sale como «sin PR»
 * y te manda a abrir un segundo PR de lo que ya está subido.
 */
export const enOrigin = (rama) => (rama ?? '').replace(/-\d+$/, '');
export const prDe = (rama, lista) =>
  // La rama EXACTA primero: `feat/dd-30` es una rama, no la caja `-30` de `feat/dd`.
  (lista ?? []).find((p) => p.headRefName === rama) ?? (lista ?? []).find((p) => p.headRefName === enOrigin(rama));

export const checksDe = (pr) => {
  const cs = pr?.statusCheckRollup ?? [];
  if (!cs.length) return { estado: 'sin-checks', pendientes: [], rojos: [] };
  const rojos = cs.filter((c) => ['FAILURE', 'TIMED_OUT', 'CANCELLED'].includes(c.conclusion ?? ''));
  const pendientes = cs.filter((c) => !c.conclusion);
  if (rojos.length) return { estado: 'rojo', pendientes, rojos };
  if (pendientes.length) return { estado: 'pendiente', pendientes, rojos };
  return { estado: 'verde', pendientes, rojos };
};

const nombresDe = (checks) => checks.map((c) => c.name || c.context).join(', ');

/**
 * El veredicto de UNA caja, a partir de datos ya leídos. Dos trampas medidas el 2026-09-10, las
 * dos descubiertas probando este script contra el repo de verdad:
 *
 * 1. **Este repo funde con SQUASH.** El commit de la rama nunca entra en `main`: entra uno nuevo
 *    con «(#NN)» al final. Así que `origin/main..rama` sigue contando 1 para siempre y contar
 *    commits NO dice si el trabajo está dentro. Quien lo sabe es el PR. (El #95 se fundió en
 *    `c20939c` y su `765dc48` no es ancestro de main.) Por eso `fundido` manda sobre `sinFundir`.
 * 2. **Las fechas no se comparan como texto.** git da `+02:00` y GitHub da `Z`, así que
 *    «18:44+02:00» sale mayor que «17:16Z» siendo media hora ANTERIOR, y una rama quieta se
 *    anunciaba como «commits nuevos encima». Se comparan como instantes.
 */
export function veredictoDe({
  sinFundir = 0,
  abierto = null,
  fundido = null,
  ultimoCommitISO = '',
  sucio = false,
  bloqueado = false,
  noFundidos = 0,
} = {}) {
  const v = veredictoBase({ sinFundir, abierto, fundido, ultimoCommitISO });
  return protegeLoQueSePierde(v, { sucio, bloqueado, noFundidos });
}

/**
 * La red de seguridad: **ningún veredicto que diga «borra» sale si hay algo dentro que perder.**
 *
 * Los dos casos son medidos, no hipótesis. Al estrenar el comando el 2026-09-11 propuso borrar:
 *  - `checkbox-demo-label-projection` como **VACÍA** — tenía dos ficheros modificados sin
 *    commitear y encima estaba `locked`.
 *  - `arebury/analizar-PRs-2` como **CERRADA** — dentro vivía `393d0ab`, que no estaba en main.
 *    `avanzoTrasFundir` no lo cazó porque compara la FECHA del último commit con `mergedAt`, y
 *    ese commit era ANTERIOR al merge sin ir incluido en él. La fecha nunca podía verlo.
 *
 * Por eso `noFundidos` se mide por CONTENIDO (`git cherry origin/main <rama>` cuenta las líneas
 * que empiezan por `+`: commits cuyo parche no está en main, aunque el squash haya reescrito los
 * shas). Un comando que borra por ti tiene que equivocarse SIEMPRE hacia el lado de no borrar.
 */
export function protegeLoQueSePierde(v, { sucio = false, bloqueado = false, noFundidos = 0 } = {}) {
  const proponeBorrar = v.veredicto === 'CERRADA' || v.veredicto === 'VACÍA';
  if (proponeBorrar) {
    if (sucio) {
      return { veredicto: 'SIN GUARDAR', color: C.red, accion: 'cambios sin commitear dentro · NO lo borres' };
    }
    if (noFundidos > 0) {
      return {
        veredicto: 'SIN SUBIR',
        color: C.cyan,
        accion: `${noFundidos} commit${noFundidos === 1 ? '' : 's'} que NO están en main (medido por contenido) · falta subirlos`,
      };
    }
    if (bloqueado) {
      return { veredicto: 'BLOQUEADO', color: C.yellow, accion: 'worktree `locked`: alguien lo reservó · no lo borres' };
    }
  }
  // No propone borrar, pero si hay cambios sin guardar la caja tampoco se cierra: se dice al lado.
  if (sucio) return { ...v, accion: `${v.accion} · ⚠ cambios sin commitear` };
  return v;
}

function veredictoBase({ sinFundir = 0, abierto = null, fundido = null, ultimoCommitISO = '' } = {}) {
  const avanzoTrasFundir =
    Boolean(fundido?.mergedAt) &&
    Boolean(ultimoCommitISO) &&
    Date.parse(ultimoCommitISO) > Date.parse(fundido.mergedAt);

  if (fundido && !avanzoTrasFundir) {
    return { veredicto: 'CERRADA', color: C.dim, accion: `su PR #${fundido.number} está fundido · borra el worktree` };
  }
  if (fundido && avanzoTrasFundir) {
    return {
      veredicto: 'SIN SUBIR',
      color: C.cyan,
      accion: `commits NUEVOS encima del PR #${fundido.number}, ya fundido · falta subirlos`,
    };
  }
  if (abierto) {
    const checks = checksDe(abierto);
    if (abierto.mergeable === 'CONFLICTING') {
      return { veredicto: 'CONFLICTO', color: C.red, accion: `PR #${abierto.number} · choca con main · rebasa` };
    }
    if (checks.estado === 'rojo') {
      return { veredicto: 'ROJA', color: C.red, accion: `PR #${abierto.number} · falla ${nombresDe(checks.rojos)}` };
    }
    if (checks.estado === 'pendiente') {
      return {
        veredicto: 'ESPERA',
        color: C.yellow,
        accion: `PR #${abierto.number} · corriendo ${nombresDe(checks.pendientes)}`,
      };
    }
    if (checks.estado === 'sin-checks') {
      return { veredicto: 'ESPERA', color: C.yellow, accion: `PR #${abierto.number} · el CI aún no ha arrancado` };
    }
    return { veredicto: 'LISTA', color: C.green, accion: `PR #${abierto.number} verde · FÚNDELO y lee ci:verdict` };
  }
  if (sinFundir === 0) {
    return { veredicto: 'VACÍA', color: C.dim, accion: 'sin trabajo dentro · borra el worktree' };
  }
  return {
    veredicto: 'SIN SUBIR',
    color: C.cyan,
    accion: `${sinFundir} commit${sinFundir === 1 ? '' : 's'} dentro y ningún PR · falta subirlo`,
  };
}

/**
 * El mismo título de commit en dos RAMAS distintas = alguien repitió trabajo que ya existía.
 *
 * Dos cajas de la MISMA rama (`x` y su `x-2`, la convención de `enOrigin`) NO son duplicado: son
 * gemelas, y las cuenta `gemelasDe`. Medido el 2026-09-11 con la primera versión de este script:
 * cantaba «funde una y borra la otra» sobre `analizar-PRs` y `analizar-PRs-2`, que eran el mismo
 * SHA y el mismo PR #103. Y la evidencia que lo justificaba (`verdict-avisa-pr-fundido` y su `-2`)
 * era esto mismo: la local `-2` y la remota sin sufijo en `4964d47`, un solo trabajo.
 */
export function duplicadosDe(cajas) {
  const porSujeto = new Map();
  for (const c of cajas) {
    for (const s of c.sujetos ?? []) {
      if (!porSujeto.has(s)) porSujeto.set(s, []);
      porSujeto.get(s).push(c.nombre);
    }
  }
  return [...porSujeto.entries()]
    .filter(([, ramas]) => new Set(ramas.map(enOrigin)).size > 1)
    .map(([sujeto, ramas]) => {
      const yaDentro = ramas.filter((r) => cajas.find((c) => c.nombre === r)?.veredicto === 'CERRADA');
      const sobra = ramas.filter((r) => !yaDentro.includes(r));
      let detalle;
      if (yaDentro.length && !sobra.length) {
        detalle = `las ${ramas.length} son la MISMA cosa y ya está fundida · borra los ${ramas.length} worktrees`;
      } else if (yaDentro.length) {
        detalle = `ya está fundido desde ${yaDentro.join(', ')} · lo de ${sobra.join(', ')} SOBRA`;
      } else {
        detalle = `en ${ramas.join('  y  ')} · funde una y borra la otra`;
      }
      return { sujeto, ramas, detalle };
    });
}

/** La misma rama en más de una caja: no es trabajo repetido, es un worktree de más. */
export function gemelasDe(cajas) {
  const porRama = new Map();
  for (const c of cajas) {
    const r = enOrigin(c.nombre);
    if (!porRama.has(r)) porRama.set(r, []);
    porRama.get(r).push(c.nombre);
  }
  return [...porRama.entries()].filter(([, cs]) => cs.length > 1).map(([rama, cajas]) => ({ rama, cajas }));
}

/** Los worktrees de verdad. El árbol principal puede estar `bare`, y entonces no es una caja. */
export function parseaWorktrees(porcelain) {
  const out = [];
  for (const bloque of (porcelain ?? '').split('\n\n')) {
    const ruta = bloque.match(/^worktree (.+)$/m)?.[1];
    if (!ruta || /^bare$/m.test(bloque)) continue;
    // `locked` = alguien lo reservó a propósito (`git worktree lock`). No se propone borrarlo.
    out.push({
      ruta,
      rama: bloque.match(/^branch refs\/heads\/(.+)$/m)?.[1],
      bloqueado: /^locked/m.test(bloque),
    });
  }
  return out;
}

// ── El comando ─────────────────────────────────────────────────────────────────

function main() {
  // Sin esto el veredicto es rancio y miente en la dirección peor: con un `origin/main` viejo una
  // rama ya fundida sale «SIN SUBIR» y te manda a abrir un PR de trabajo que ya está dentro. Pasó
  // probando este mismo script: el #95 llevaba fundido veinte minutos.
  shSafe('git', ['fetch', 'origin', 'main', '--quiet']);

  const worktrees = parseaWorktrees(shSafe('git', ['worktree', 'list', '--porcelain']));
  const aqui = shSafe('git', ['rev-parse', '--show-toplevel']);
  const actual = worktrees.find((w) => w.ruta === aqui)?.rama ?? null;

  const CAMPOS = 'number,headRefName,state,mergeable,statusCheckRollup,url,mergedAt';
  const abiertos = JSON.parse(shSafe('gh', ['pr', 'list', '--state', 'open', '--limit', '50', '--json', CAMPOS], '[]'));
  const fundidos = JSON.parse(shSafe('gh', ['pr', 'list', '--state', 'merged', '--limit', '40', '--json', CAMPOS], '[]'));

  const cajas = [];
  for (const w of worktrees) {
    if (!w.rama || w.rama === 'main') continue;
    const abierto = prDe(w.rama, abiertos) ?? null;
    // Lo que decide si se puede borrar, leído del worktree REAL y no de la rama:
    //  · `status --porcelain` en SU ruta (no en la mía): ficheros a medio editar.
    //  · `git cherry` marca con `+` los commits cuyo parche NO está en main, y con `-` los que
    //    sí (aunque el squash les cambiara el sha). Es la única medida que ve un commit local
    //    anterior al merge que se quedó fuera de él.
    const sucio = shSafe('git', ['-C', w.ruta, 'status', '--porcelain']) !== '';
    const noFundidos = shSafe('git', ['cherry', 'origin/main', w.rama])
      .split('\n')
      .filter((l) => l.startsWith('+')).length;
    const v = veredictoDe({
      sinFundir: Number(shSafe('git', ['rev-list', '--count', `origin/main..${w.rama}`], '0')) || 0,
      abierto,
      fundido: abierto ? null : (prDe(w.rama, fundidos) ?? null),
      ultimoCommitISO: shSafe('git', ['log', '-1', '--format=%cI', w.rama]),
      sucio,
      bloqueado: w.bloqueado,
      noFundidos,
    });
    cajas.push({
      nombre: w.rama,
      ...v,
      sujetos: shSafe('git', ['log', '--format=%s', `origin/main..${w.rama}`]).split('\n').filter(Boolean),
      esTuya: w.rama === actual,
    });
  }

  const ancho = Math.max(20, ...cajas.map((c) => c.nombre.length));
  console.log(`\n${C.bold}TUS CAJAS ABIERTAS${C.reset} ${C.dim}(un worktree = un chat = una caja)${C.reset}\n`);
  if (!cajas.length) console.log(`  ${C.dim}ninguna: solo está el árbol principal.${C.reset}`);
  for (const c of cajas) {
    const tuya = c.esTuya ? `${C.bold} ← estás aquí${C.reset}` : '';
    console.log(`  ${c.color}${c.veredicto.padEnd(10)}${C.reset} ${c.nombre.padEnd(ancho)}  ${C.dim}${c.accion}${C.reset}${tuya}`);
  }

  const gemelas = gemelasDe(cajas);
  if (gemelas.length) {
    console.log(`\n${C.yellow}${C.bold}◇ MISMA RAMA EN DOS CAJAS${C.reset} — no es trabajo repetido, es un worktree de más:`);
    for (const g of gemelas) {
      console.log(`  ${C.dim}·${C.reset} ${g.rama} ${C.dim}vive en ${g.cajas.join('  y  ')} · quédate con la que usas y borra la otra${C.reset}`);
    }
  }

  const duplicados = duplicadosDe(cajas);
  if (duplicados.length) {
    console.log(`\n${C.red}${C.bold}⚠ TRABAJO DUPLICADO${C.reset} — el mismo título de commit vive en dos ramas DISTINTAS:`);
    for (const d of duplicados) {
      console.log(`  ${C.dim}·${C.reset} «${d.sujeto.slice(0, 64)}${d.sujeto.length > 64 ? '…' : ''}»`);
      console.log(`    ${C.dim}${d.detalle}${C.reset}`);
    }
  }

  const piden = cajas.filter((c) => ['ROJA', 'SIN SUBIR', 'CONFLICTO', 'SIN GUARDAR'].includes(c.veredicto));
  const listas = cajas.filter((c) => c.veredicto === 'LISTA');
  // Solo entra aquí lo que la red de `protegeLoQueSePierde` ya dejó pasar: sin ficheros sueltos,
  // sin commits fuera de main y sin `locked`.
  const sobran = cajas.filter((c) => ['CERRADA', 'VACÍA'].includes(c.veredicto));

  console.log('');
  if (listas.length) console.log(`${C.green}▶ Funde ya:${C.reset} ${listas.map((c) => c.accion.split(' ')[1]).join(', ')}`);
  if (sobran.length) console.log(`${C.dim}▶ Worktrees que sobran (${sobran.length}): ${sobran.map((c) => c.nombre).join(', ')}${C.reset}`);
  if (!piden.length && !duplicados.length && !listas.length) console.log(`${C.green}✓ Nada pide acción.${C.reset}`);
  console.log('');

  process.exit(piden.length || duplicados.length ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
