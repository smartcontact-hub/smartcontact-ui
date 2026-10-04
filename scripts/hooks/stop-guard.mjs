#!/usr/bin/env node
/**
 * Hook `Stop` — cinco deudas que no dejan cerrar, las cinco leídas del MISMO transcript:
 *
 *   1. «un push sin leer el veredicto del CI no está terminado» (LEARNINGS #7, s35: seis pushes
 *      rojos seguidos escribiendo «preflight verde» sin abrir el CI ni una vez). Si el último
 *      `git push` de commits no va seguido de una lectura del CI (`npm run ci:verdict`,
 *      `gh run list|view|watch`, `gh pr checks`), bloquea con el comando exacto. Cuenta el push que
 *      CORRIÓ (su resultado no vino con error, o enseña el ref subido), con `git push` en posición de comando (no dentro de
 *      comillas ni del cuerpo de un heredoc) y en un árbol de ESTE repo: el de otro no tiene su CI.
 *   2. si en la sesión se invocó la skill `reflect` y quedan correcciones de ESTA sesión sin
 *      enrutar, bloquea con la lista y el `--enrutar` exacto. Reflexionar es decidir dónde va cada
 *      lección; sin la ruta escrita, «lo apunto en LEARNINGS» vuelve a valer como cierre y la
 *      prosa gana otra vez (2026-09-10: 54 commits de prosa por 4 de hooks). Sin `reflect` no
 *      bloquea: parar a mitad de tarea no es cerrar.
 *   3. el PARTE DE CIERRE. El usuario no programa: su coste no es lo que yo he tecleado, es lo que le
 *      llega. Un cierre que dice «pusheado, CI verde» le cuenta el trámite y se calla lo único
 *      que decide algo — qué cambia en su día a día, por qué le conviene, y qué le toca a él.
 *      Así que el cierre lleva tres líneas fijas, cortas y en su idioma, y la del PORQUÉ no puede
 *      llevar jerga: si el beneficio solo se sabe decir con «hook» o «gate», no está entendido.
 *      (Norma de proceso, 2026-09-10.) Y en castellano, el contenido y no solo las etiquetas: lo
 *      mide `fallosDeIdioma`, fuera del código y de los nombres técnicos (2026-09-28).
 *   4. dentro del parte, «¿es seguro cerrar?»: si la caja está vacía o queda algo solo aquí
 *      dentro. Y esta NO se cree lo que yo escribo: el hook MIDE el árbol (sin commitear, sin
 *      pushear, sin upstream) y me desmiente si pongo «sí» con trabajo colgando. Un «todo subido»
 *      afirmado sin mirar es exactamente la regla #17 en su versión más cara: el usuario cierra la
 *      ventana y el contexto no vuelve. (Norma de proceso, 2026-09-10.) Lo que main ya lleva no
 *      cuelga: una rama fundida por squash y borrada no desmiente un «sí» (2026-09-28).
 *
 *   5. la REVISIÓN PREVIA de una pantalla (DD-123, 2026-09-27): si la sesión escribió plantillas u
 *      hojas del Supervisor con Edit/Write y no corrió `npm run revision` DESPUÉS, bloquea una vez.
 *      El primer filtro visual de una pantalla no puede ser el usuario: la revisión la captura a
 *      1440, mide la agrupación y deja las capturas para mirarlas con `better-layout`.
 *
 * `stop_hook_active` evita el bucle: a la segunda deja parar.
 *
 * Entrada: JSON por stdin (transcript_path, session_id, cwd, stop_hook_active).
 * Salida: JSON de decisión.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  carpetaDelPush,
  carpetasPorSegmento,
  esPushDeCommits as esPushDelGuardian,
  segmentos,
  usaPreflight,
} from './bash-guard.mjs';
import { DESTINO_AYUDA, pendientes, rutaRegistro } from './correction-capture.mjs';

/**
 * Lo que va entre comillas es un DATO, no un comando: un patrón de `grep`, un mensaje de commit,
 * el cuerpo de un PR. Se sustituye por un hueco antes de buscar el push.
 *
 * La excepción es la cadena que SÍ es un comando, y no se distingue por lo que dice —`rg 'git
 * push'` y `bash -c "git push"` llevan lo mismo dentro— sino por el `-c` que la precede. Se
 * reinyecta con un `;` delante para que quede en posición de comando.
 */
const sinDatosEntreComillas = (cmd) =>
  cmd.replace(/(['"])((?:\\.|(?!\1)[^\\])*)\1/g, (_todo, _comilla, dentro, pos, entero) =>
    /-c\s*$/.test(entero.slice(0, pos)) ? `; ${dentro}` : ' ',
  );

/**
 * Quita los cuerpos de heredoc que son DATO: lo que se le pasa a `cat`, a `git commit -F -`, a `python3 -`
 * o a `gh pr create --body-file -`. Se queda el cuerpo cuando el comando que lo recibe es un SHELL
 * (`bash <<EOF`, `sh -s <<EOF`): ahí es un script y un `git push` de dentro SÍ es un push. Y lo que va en
 * la misma línea tras el operador (`git commit -F - <<'EOF' && git push`) es comando y se conserva.
 */
const sinDatosDeHeredoc = (cmd) => {
  const out = [];
  let fin = null;
  let esScript = false;
  for (const linea of cmd.split('\n')) {
    if (fin !== null) {
      if (linea.trim() === fin) fin = null;
      else if (esScript) out.push(linea);
      continue;
    }
    const m = linea.match(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z_0-9]*)\1/);
    if (!m) {
      out.push(linea);
      continue;
    }
    out.push(linea.slice(0, m.index) + linea.slice(m.index + m[0].length));
    fin = m[2];
    esScript = /(?:^|[\s;&|(])(?:ba|z|da|k)?sh\b[^<]*$/.test(linea.slice(0, m.index));
  }
  return out.join('\n');
};

/**
 * ¿Este comando SUBE commits?
 *
 * Por qué mira la posición y no solo la cadena (2026-09-20): esto era `/\bgit\s+push\b/` sobre el
 * comando entero, así que **leer** un fichero que habla de `git push` contaba como haberlo hecho.
 * Un `grep -E "branch|git push" .github/workflows/visual-baselines.yml` —abrir el workflow para
 * ver cómo sube las capturas— bloqueó el cierre de una sesión que no había subido nada, y mandó a
 * leer un CI que no existía. Es el mismo error que ya se corrigió en `esLecturaCI`: comprobar el
 * PROXY (que aparezca un texto) en vez de la CONDICIÓN (que se haya ejecutado el push).
 *
 * Los cuerpos de heredoc son dato (2026-10-04): el comentario de aquí dejaba abierto «una línea de heredoc que
 * EMPIECE por `git push` sigue contando», y no era estrecho: tres `git commit` de una misma sesión, con un
 * mensaje que hablaba de pushes, bloquearon tres cierres. Cuenta lo que lee un shell (`sinDatosDeHeredoc`).
 */
const esPushDeCommits = (cmd) => {
  const real = sinDatosEntreComillas(sinDatosDeHeredoc(cmd));
  return (
    /(^|[;&|\n(]|&&|\|\|)\s*(sudo\s+)?git\s+push\b/.test(real) &&
    !/--tags\b|refs\/tags|\barchive\//.test(real) &&
    !/--delete\b|\s:[A-Za-z]/.test(real) &&
    !/--dry-run\b/.test(real)
  );
};

/**
 * true si TODO push de este comando va a OTRO repositorio, que no tiene el CI de este: no hay veredicto que
 * leer. Mira con el mismo parser que `bash-guard` (`carpetasPorSegmento`, `carpetaDelPush`) y con el mismo
 * criterio de «este repo» (`usaPreflight`), desde el `cwd` que el transcript guarda en cada evento. Lo que no
 * sabe resolver cuenta como de este repo: sin `cwd`, o un push dentro de comillas (`bash -c "…"`), donde el
 * parser no ve un push. Un comando con un push a cada repo cuenta: el de este tiene su CI.
 */
const soloEmpujaOtroRepo = ({ cmd, cwd }) => {
  if (typeof cwd !== 'string' || !cwd) return false;
  const carpetas = carpetasPorSegmento(cmd, cwd);
  const destinos = segmentos(cmd).flatMap((seg, i) => (esPushDelGuardian(seg) ? [carpetaDelPush(seg, carpetas[i], cwd)] : []));
  return destinos.length > 0 && destinos.every((dir) => !usaPreflight(dir));
};

// `gh pr checks` cuenta igual que `gh run`: es la misma lectura, por el PR en vez de por el run.
// Faltaba, y bloqueó un cierre en el que el CI SÍ estaba leído (2026-09-10, esta misma sesión).
//
// ⚠️ Y las herramientas MCP de GitHub cuentan TAMBIÉN, por el mismo motivo y por uno más grave
// (2026-09-19): en una sesión cloud **`gh` no está instalado**, y `ci:verdict` lo invoca por
// dentro, así que sale `spawnSync gh ENOENT`. O sea que el único canal que este hook reconocía
// era imposible de usar ahí, y bloqueaba el cierre de una sesión que SÍ había leído el CI —
// job a job, por `mcp__github__actions_list`. Es el mismo error que tenía `docs:coherence`
// CHECK D: comprobar el PROXY (que se teclee un comando concreto) en vez de la CONDICIÓN (que
// el veredicto se haya leído). Un guardián que no se puede satisfacer enseña a saltárselo.
const esLecturaCI = (cmd) =>
  /\bci:verdict\b|\bgh run (list|view|watch)\b|\bgh pr checks\b/.test(cmd) ||
  /^mcp__github__(actions_list|actions_get|get_job_logs|get_commit|pull_request_read|get_check_run)$/.test(cmd);

/**
 * ¿El resultado enseña un ref que SUBIÓ? Es lo que imprime un push que subió algo: `abc..def  rama -> rama`
 * (avance), `+ abc...def rama -> rama (forced update)` (forzado), `* [new branch]` / `* [new tag]`. Uno
 * rechazado imprime `! [rejected]` o `! [remote rejected]`, que no casan. Solo sirve para RESCATAR: el error
 * del comando no es el del push (`git push && npm run build` sale con error si el build falla, aunque el push
 * ya esté en el remoto), y ignorarlo dejaría cerrar sin leer el CI de algo que sí se subió.
 */
const SUBIO = /^\s*[+*]?\s*(?:[0-9a-f]{7,}\.{2,3}[0-9a-f]{7,}|\[new (?:branch|tag)\])/m;

/** El texto de un `tool_result`: una cadena, o una lista de bloques de texto. */
const textoDe = (contenido) =>
  Array.isArray(contenido) ? contenido.map((b) => (typeof b?.text === 'string' ? b.text : '')).join('\n') : String(contenido ?? '');

/**
 * Los ACTOS del transcript, en orden: el comando de cada Bash y el NOMBRE de cada herramienta
 * MCP de GitHub, cada uno con el `cwd` que el transcript guarda en su evento y con `fallo` si su resultado
 * vino con error (`is_error`: un comando con salida distinta de cero, o uno que un hook denegó).
 *
 * Las dos cosas en la misma lista a propósito, porque para lo que se pregunta aquí —¿se pushó?,
 * ¿se leyó el CI?— son el mismo acto por dos canales. Mirar solo Bash dejaba ciego al canal MCP,
 * que es el ÚNICO disponible en una sesión cloud (ahí no hay `gh`).
 *
 * `fallo` solo le quita valor a un PUSH (no se subió nada): un `ci:verdict` que sale en rojo SÍ leyó el CI. Y
 * es un error SIN ref subido en su resultado (`SUBIO`): el comando entero puede fallar después de un push que
 * sí subió. Sin resultado en el transcript (aún no llegó) no es fallo: lo estricto es darlo por ejecutado.
 */
export function actosBash(jsonl) {
  const usos = [];
  const errores = new Map(); // id → texto del resultado, de los que vinieron con error
  for (const linea of jsonl.split('\n')) {
    if (!linea.includes('"tool_use"') && !linea.includes('"tool_result"')) continue;
    try {
      const ev = JSON.parse(linea);
      const contenido = ev?.message?.content;
      if (!Array.isArray(contenido)) continue;
      for (const c of contenido) {
        if (c.type === 'tool_result' && c.is_error === true) errores.set(c.tool_use_id, textoDe(c.content));
        else if (c.type !== 'tool_use') continue;
        else if (c.name === 'Bash' && c.input?.command) usos.push({ id: c.id, cmd: c.input.command, cwd: ev.cwd });
        else if (typeof c.name === 'string' && c.name.startsWith('mcp__github__')) usos.push({ id: c.id, cmd: c.name, cwd: ev.cwd });
      }
    } catch {
      /* línea no JSON */
    }
  }
  return usos.map(({ id, cmd, cwd }) => ({ cmd, cwd, fallo: errores.has(id) && !SUBIO.test(errores.get(id)) }));
}

/** Los comandos de `actosBash`, sin más: para quien solo quiere saber qué se tecleó. */
export const comandosBash = (jsonl) => actosBash(jsonl).map((a) => a.cmd);

/** Un acto, o un comando suelto (como lo pasan los tests y quien ya solo tiene el texto). */
const comoActo = (a) => (typeof a === 'string' ? { cmd: a, fallo: false } : a);

/**
 * ¿Este comando SUBE commits, lo vea quien lo vea? El patrón de aquí entiende `bash -c "git push"` y `sudo`; el
 * analizador de `bash-guard` entiende `git -C <ruta> push`, `--git-dir`, `GIT_DIR=… git push`… Cada uno ve lo
 * que el otro no, y en cuanto uno lo ve es un push (2026-10-04: el hook no veía `git -C <ruta> push`).
 */
const subeCommits = (cmd) => esPushDeCommits(cmd) || segmentos(cmd).some(esPushDelGuardian);

/** ¿Se PUSHEÓ de verdad en este repo? Corrió, y fue un push de commits, y de este repositorio. */
const empujoDeVerdad = (a) => !a.fallo && subeCommits(a.cmd) && !soloEmpujaOtroRepo(a);

/** true si hay un push de commits sin lectura del CI después. Recibe actos (`actosBash`) o comandos sueltos. */
export function necesitaVeredicto(actos) {
  const lista = actos.map(comoActo);
  const ultimoPush = lista.map(empujoDeVerdad).lastIndexOf(true);
  if (ultimoPush < 0) return false;
  return !lista.slice(ultimoPush + 1).some((a) => esLecturaCI(a.cmd));
}

/**
 * true si la skill `reflect` se invocó en la sesión: por herramienta (`Skill`) o porque el usuario
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

// ── La revisión previa a enseñar una pantalla ────────────────────────────────────────────

/** Una pantalla del Supervisor que se VE: su plantilla o su hoja (las globales de `styles/`, también). */
const RE_PANTALLA = /\/projects\/supervisor\/src\/(app\/.+\.(html|scss)|styles\/.+\.scss)$/;
const ESCRIBEN = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
/** Correr la revisión; nombrarla dentro de un dato (un `grep "npm run revision"`) no cuenta. */
const esRevision = (cmd) =>
  /\bnpm run(?: -s)? revision\b|\bscripts\/revision-pantalla\.mjs\b/.test(sinDatosEntreComillas(cmd));

/**
 * Ficheros de pantalla del Supervisor escritos DESPUÉS de la última revisión. Vacío = no hace falta.
 *
 * Hueco conocido y aceptado: una edición por shell (`sed -i`, un script) no cuenta como escribir. El
 * precio es un recordatorio de menos, no un bloqueo de más; el canal de siempre es Edit/Write.
 */
export function pantallasSinRevisar(jsonl) {
  const pendientes = new Set();
  for (const linea of jsonl.split('\n')) {
    if (!linea.includes('"tool_use"')) continue;
    let ev;
    try {
      ev = JSON.parse(linea);
    } catch {
      continue;
    }
    const contenido = ev?.message?.content;
    if (!Array.isArray(contenido)) continue;
    for (const c of contenido) {
      if (c?.type !== 'tool_use') continue;
      if (c.name === 'Bash' && typeof c.input?.command === 'string' && esRevision(c.input.command)) pendientes.clear();
      else if (ESCRIBEN.has(c.name)) {
        const ruta = String(c.input?.file_path ?? c.input?.notebook_path ?? '');
        if (RE_PANTALLA.test(ruta)) pendientes.add(ruta.replace(/^.*\/projects\//, 'projects/'));
      }
    }
  }
  return [...pendientes];
}

/** El motivo lleva el comando y lo que se hace con su salida, no solo el aviso. */
export function motivoSinRevision(rutas) {
  return [
    `Has tocado ${rutas.length} fichero(s) de pantalla del Supervisor sin pasar la revisión previa: el primer filtro visual no puede ser el usuario (DD-123).`,
    ...rutas.slice(0, 5).map((r) => `  · ${r}`),
    'Antes de enseñarlo: `npm run revision -- <ruta de cada pantalla>` (la captura a 1440 y mide la agrupación). Mira las capturas con la skill better-layout, arregla lo medible y lista al usuario lo que sea de gusto.',
    'Si paras a mitad y aún no hay nada que enseñar, dilo en el mensaje y vuelve a cerrar: a la segunda deja pasar.',
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

/**
 * ¿Main ya lleva todo lo de la rama? Devuelve el sha corto del `origin/main` con que se comparó, o
 * '' si no lo lleva o no se pudo medir.
 *
 * Es para la rama fundida por squash (2026-09-28): GitHub la borra al fundir y, desde ahí, parece
 * trabajo sin subir con todo ya en main. Podada, se queda sin upstream; sin podar, el upstream viejo
 * cuenta como «sin pushear» lo que la rama recogió de main al ponerse al día. La ascendencia no lo
 * ve, porque el squash es un commit nuevo, y `git cherry` tampoco: compara commit a commit, y el
 * squash de dos commits no es ninguno de los dos. El contenido sí: si fundir HEAD en `origin/main`
 * deja el árbol de main igual, main ya lo tiene todo. Si main retocó después las mismas líneas sale
 * conflicto o un árbol distinto, y eso es «no»: el error posible es un «no» de más, nunca un «sí» falso.
 *
 * Sin `fetch`, que no cabe en los 4 s de cada llamada: se compara con el `origin/main` que haya, y
 * por eso la nota lleva su sha. `--write-tree` pide git ≥ 2.38. Si git falla (sin `origin/main`,
 * con conflicto, que sale 1, o un git más viejo) o la primera línea no es el árbol de main, queda
 * el veredicto de siempre.
 */
function mainYaLaLleva(git) {
  try {
    const fundido = git('merge-tree', '--write-tree', 'origin/main', 'HEAD').split('\n')[0];
    // `--short` vale para lo que va detrás: el árbol sale entero y el commit, abreviado.
    const [arbolMain, shaMain] = git('rev-parse', 'origin/main^{tree}', '--short', 'origin/main').split('\n');
    return fundido === arbolMain ? shaMain : '';
  } catch {
    return '';
  }
}

/**
 * Lo que la máquina SÍ puede ver de «¿se pierde algo si cierro?». `seguro: null` = no lo sé.
 * `motivos` lleva lo que cuelga y, si la rama ya está en main, la nota que lo dice: esa no cuelga
 * nada y no cuenta para `seguro`, pero explica un «sí» que sin ella sorprendería.
 */
export function estadoDelArbol(cwd = process.cwd()) {
  // `trimEnd`, no `trim`: el porcelain abre cada línea con dos huecos de estado (« M ruta»), y un
  // trim por delante se come la primera letra del fichero. Lo cazó la sonda sobre el árbol real.
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] }).trimEnd();
  const motivos = [];
  let enMain = '';
  try {
    const sucio = git('status', '--porcelain').split('\n').filter(Boolean);
    const rutaDe = (l) => l.slice(3); // 2 de estado + 1 hueco, siempre
    if (sucio.length) motivos.push(`${sucio.length} fichero(s) sin commitear (${sucio.slice(0, 3).map(rutaDe).join(', ')}${sucio.length > 3 ? '…' : ''})`);
    let upstream = '';
    try {
      upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}').trim();
    } catch {
      /* sin upstream: si no está en el remoto, puede que ya esté en main */
    }
    const sinPushear = upstream ? Number(git('rev-list', '--count', '@{u}..HEAD')) : 0;
    if (!upstream || sinPushear) enMain = mainYaLaLleva(git);
    if (!enMain && !upstream)
      motivos.push(`la rama ${git('rev-parse', '--abbrev-ref', 'HEAD').trim()} no está en el remoto: si se pierde el disco, se pierde el trabajo`);
    if (!enMain && sinPushear) motivos.push(`${sinPushear} commit(s) sin pushear a ${upstream}`);
  } catch {
    return { seguro: null, motivos: [] }; // sin git (otra máquina, CI): el hook falla ABIERTO.
  }
  const nota = enMain ? [`ya fundida en main, comparado con ${enMain}`] : [];
  return { seguro: !motivos.length, motivos: [...motivos, ...nota] };
}

const SEGURO = /seguro\s+cerrar\s*\**\s*:\s*\**\s*(.*)$/im;

/**
 * La línea del veredicto. Aquí no vale el patrón genérico: lo que se comprueba no es que esté
 * escrita, es que lo que dice CUADRE con el árbol. Decir «sí, todo subido» sin mirarlo es lo que
 * hace que el usuario cierre la ventana encima de trabajo que solo existe aquí.
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

// ── El idioma del parte ──────────────────────────────────────────────────────────────────
// Las líneas del parte se reconocen por su etiqueta, así que unas etiquetas en castellano con el
// contenido en inglés pasaban por parte bueno (2026-09-28: una sesión cerró así tras un tramo largo
// de herramientas). Lo que se cuenta son palabras vacías, las más frecuentes de cada lengua: ninguna
// de estas es palabra de la otra («a» y «no» son de las dos, y se quedan fuera).
//
// Los umbrales se midieron sobre los textos reales del asistente en los transcripts locales del repo
// (2026-09-28): con 8 y el triple no marcan ninguno en castellano y sí los cuatro partes en inglés que
// había; con 5 ya marcan alguno en castellano, como uno que citaba una frase inglesa de la interfaz.
// Es estrecha a propósito: una entradilla en inglés delante de un parte en castellano no la marca.

const VACIAS_EN = new Set(['the', 'and', 'you', 'is', 'are', 'it', 'to', 'of', 'with', 'that', 'this']);
const VACIAS_ES = new Set(['el', 'la', 'de', 'que', 'y', 'en', 'los', 'las', 'con', 'para', 'es']);

/**
 * La prosa del mensaje: fuera los bloques de código, el `inline code` y las palabras que llevan
 * `/`, `\`, `_`, `@` o un `.`, `:` o `-` entre letras (URLs, rutas, ficheros, `figma_execute`,
 * `tokens:parity`, `--sc-text-subtle`). Todo eso va en inglés en un parte bien escrito, y no dice
 * nada de la lengua en que se le habla al usuario.
 */
function prosaDe(mensaje) {
  const lineas = [];
  let valla = null;
  for (const linea of String(mensaje).split('\n')) {
    const marca = /^\s*(`{3,}|~{3,})/.exec(linea)?.[1];
    if (valla) {
      if (marca?.[0] === valla[0] && marca.length >= valla.length) valla = null;
    } else if (marca) valla = marca;
    else lineas.push(linea);
  }
  return lineas
    .join('\n')
    .replace(/(`+)[^\n]*?\1/g, ' ')
    .split(/\s+/)
    .filter((palabra) => !/[/\\_@]|[\p{L}\d][.:-][\p{L}\d]/u.test(palabra))
    .join(' ');
}

/** Cuántas palabras vacías de cada lengua lleva la prosa del mensaje. */
export function vaciasPorLengua(mensaje) {
  const cuenta = { en: 0, es: 0 };
  for (const [palabra] of prosaDe(mensaje).toLowerCase().matchAll(/\p{L}+/gu)) {
    if (VACIAS_EN.has(palabra)) cuenta.en++;
    else if (VACIAS_ES.has(palabra)) cuenta.es++;
  }
  return cuenta;
}

const MIN_VACIAS_EN = 8;
const MARGEN_EN = 3;

/** El parte va en castellano: falla solo si el inglés domina con margen y hay texto para decidirlo. */
export function fallosDeIdioma(mensaje) {
  const { en, es } = vaciasPorLengua(mensaje);
  if (en < MIN_VACIAS_EN || en < MARGEN_EN * es) return [];
  return [
    `el mensaje va en inglés: ${en} palabras como «the», «and» o «you» frente a ${es} como «el», «de» o «que», sin contar el código ni los nombres técnicos. El usuario lee en castellano: reescríbelo entero en castellano, el contenido y no solo las etiquetas; lo que sea código o un nombre técnico, entre comillas invertidas.`,
  ];
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
    if (jerga) fallos.push(`«${nombre}:» dice «${jerga[0]}». Esa línea es para el usuario, que no programa: cuéntale el efecto, no la pieza.`);
  }
  return [...fallosDeIdioma(mensaje), ...fallos, ...fallosDeSeguridad(mensaje, estado)];
}

export function motivoParteDeCierre(fallos) {
  return [
    'Estás cerrando y el parte de cierre no cuadra. El usuario no lee el diff: lo que le llega es este mensaje, así que lleva cuatro líneas fijas, cortas y en su idioma.',
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
    if (necesitaVeredicto(actosBash(jsonl)))
      return bloquear(
        'LEARNINGS #7 — has pusheado y no has leído el veredicto del CI. Corre `npm run ci:verdict` (espera si está en curso; si está rojo, `gh run view --log-failed`). Sin `gh` —una sesión cloud— léelo con las herramientas MCP de GitHub (`actions_list` de los runs de la rama, y `list_workflow_jobs` si algo sale rojo). En los dos casos, cuéntale al usuario el resultado LEÍDO, no el exit del wrapper.',
      );

    const sinRevisar = pantallasSinRevisar(jsonl);
    if (sinRevisar.length) return bloquear(motivoSinRevision(sinRevisar));

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
