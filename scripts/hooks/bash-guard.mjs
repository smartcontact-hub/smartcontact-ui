#!/usr/bin/env node
/**
 * Hook `PreToolUse` (Bash) — la guía en el PUNTO DE DECISIÓN, no en un fichero leído en t=0.
 *
 * Cada patrón de aquí es una regla de LEARNINGS que estaba escrita y se rompió igual con la
 * prosa delante (≥8 reincidencias de #7, 3 de #12). Un hook no depende de que nadie se acuerde:
 * se dispara cuando el comando se ESCRIBE, que es el único momento en que la regla sirve.
 *
 * Solo hay dos salidas: dejar pasar o DENEGAR con la regla como motivo (`PreToolUse` no tiene
 * "aviso suave"). Por eso cada denegación trae la forma correcta del comando y, para los casos
 * legítimos, una salida explícita: poner `# sc:ok` en el comando lo deja pasar. Pedirlo cuesta
 * un segundo y deja escrito que fue a propósito.
 *
 * Un guardián con falsos positivos enseña a ignorarlo (LEARNINGS #2): los patrones son ESTRECHOS
 * y cada uno tiene su caso rojo y verde en `scripts/__tests__/bash-guard.test.mjs`.
 *
 * Entrada: JSON por stdin (tool_input.command, cwd). Salida: JSON de decisión por stdout.
 */
import { execFileSync } from 'node:child_process';
import * as fsSync from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { estadoPreflight } from '../preflight-mark.mjs';

export const BYPASS = /#\s*sc:ok\b/;

const GATES = /^(npm run (?:-[-a-z]+ )*(verify|preflight(:scope)?|e2e(:[a-z-]+)?|test:[a-z-]+|lint|typecheck|docs:[a-z-]+|audit:[a-z-]+|tokens:[a-z-]+|guard:[a-z-]+|ci:verdict)|npx playwright test|node --test|gh run (watch|view)|gh pr checks)\b/;

/** Quita los CUERPOS de heredoc (`<<'EOF' … EOF`): son datos, no comandos. El segundo falso
 *  positivo del hook fue un script Python embebido que decía `npm run lint` en una línea. */
export function sinHeredocs(cmd) {
  const lineas = cmd.split('\n');
  const out = [];
  let fin = null;
  for (const l of lineas) {
    if (fin !== null) {
      if (l.trim() === fin) fin = null;
      continue;
    }
    const m = l.match(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z_0-9]*)\1/);
    if (m) {
      fin = m[2];
      out.push(l.slice(0, m.index));
      continue;
    }
    out.push(l);
  }
  return out.join('\n');
}

/** Ficheros que el comando ESCRIBÍA (redirección `>`/`>>`), fuera de `/dev` y `/tmp`.
 *
 *  Existe porque una denegación tira el comando ENTERO: si el mismo `Bash` traía un
 *  `cat > fichero <<'EOF'` junto al gate, ese fichero NO se escribe y **no se entera nadie**.
 *  Pasó tres veces en la sesión del 2026-09-09; la peor dejó `deploy-record.yml` sin crear y lo
 *  cazó `docs:guard` mucho después, como un enlace roto en el README. El hook no puede permitir
 *  la escritura (no parte comandos), pero sí puede DECIRLO en el motivo. */
export function escrituras(cmd) {
  const salida = new Set();
  for (const m of sinHeredocs(cmd).matchAll(/(?<![0-9&])>>?\s*(["']?)([^\s;&|>"']+)\1/g)) {
    const f = m[2];
    if (f.startsWith('/dev/') || f.startsWith('/tmp/') || f.startsWith('/private/tmp/')) continue;
    salida.add(f);
  }
  return [...salida];
}

/**
 * Parte un comando compuesto en segmentos por `;`, `&&`, `|` (no `||`). Lo entrecomillado no se
 * parte: ahí dentro un `|` o un `;` son texto.
 *
 * La barra invertida cuenta (2026-09-20). Antes no, y una comilla doble ESCAPADA cerraba el
 * entrecomillado: a partir de ahí el DATO se leía como comandos. Un `node -e "… '…\"a|git push|b\"…' …"`
 * se denegó como si fuera un push de verdad y mandó a repetir un preflight que no hacía falta.
 * Dentro de comillas SIMPLES la barra no escapa nada, y aquí tampoco.
 */
function segmentos(cmdCrudo) {
  const cmd = sinHeredocs(cmdCrudo);
  const out = [];
  let cur = '';
  let q = null;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (q) {
      cur += c;
      // `\"` dentro de comillas dobles es una comilla literal, no el cierre.
      if (c === '\\' && q === '"' && i + 1 < cmd.length) {
        cur += cmd[i + 1];
        i++;
        continue;
      }
      if (c === q) q = null;
      continue;
    }
    if (c === "'" || c === '"') {
      q = c;
      cur += c;
      continue;
    }
    if (c === '|' && cmd[i + 1] === '|') {
      out.push(cur);
      cur = '';
      i++;
      continue;
    }
    if (c === '|' || c === ';' || (c === '&' && cmd[i + 1] === '&')) {
      out.push(cur);
      cur = '';
      if (c === '&') i++;
      continue;
    }
    if (c === '\n') {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

// Un segmento es un COMANDO si empieza por él (tras asignaciones de entorno, `cd x &&` ya está
// partido). Casar por substring dispararía sobre prosa: el primer falso positivo del hook fue un
// `printf '... el hook de git push'`, denegado en su primer minuto de vida.
const empiezaPor = (seg, re) => re.test(seg.replace(/^(\s*[A-Za-z_][A-Za-z_0-9]*=\S*\s+)*/, '').replace(/^\(\s*/, ''));
const esPushDeCommits = (seg) =>
  empiezaPor(seg, /^git\s+push\b/) && !/--tags\b|refs\/tags|\barchive\//.test(seg) && !/--delete\b|\s:[A-Za-z]/.test(seg) && !/--dry-run\b/.test(seg);

/** Reconstruyen `dist/`: si corren a la vez que un preflight, se lo comen bajo los pies. */
const BUILDS = /^(npm run (?:-[-a-z]+ )*build(:[a-z-]+)?|ng build)\b/;

/** Lanzan Playwright contra apps que leen el DS de `dist/` (paths del tsconfig), no del fuente. */
const E2E = /^(npx\s+playwright\s+test|npm run (?:-[-a-z]+ )*e2e(:[a-z-]+)?)\b/;

/**
 * ¿Hay un fichero del DS editado DESPUÉS del último build de `dist/ui-smartcontact`? Devuelve su
 * ruta (el primero que encuentra) o null. Sin `dist/` no opina: el server ya falla con su mensaje.
 */
function distRancio(cwd) {
  const { existsSync, statSync, readdirSync } = fsSync;
  const marca = resolve(cwd, 'dist/ui-smartcontact/package.json');
  const raiz = resolve(cwd, 'projects/ui-smartcontact/src');
  if (!existsSync(marca) || !existsSync(raiz)) return null;
  const construido = statSync(marca).mtimeMs;
  const pendientes = [raiz];
  while (pendientes.length) {
    const dir = pendientes.pop();
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = resolve(dir, e.name);
      if (e.isDirectory()) pendientes.push(p);
      else if (/\.(ts|scss|css|html)$/.test(e.name) && !e.name.endsWith('.spec.ts') && statSync(p).mtimeMs > construido)
        return p.slice(cwd.length + 1);
    }
  }
  return null;
}

/**
 * ¿Hay un preflight vivo AHORA sobre ESTE árbol?
 *
 * El patrón está acotado a base de falsos positivos medidos:
 *   · `node …/preflight-*.mjs`, no cualquier línea que MENCIONE «preflight-scope» — si no, un
 *     `until ! pgrep -f "preflight-scope"` esperando a que termine se detecta a sí mismo.
 *   · y la ruta tiene que ser la de este cwd: en esta máquina conviven ocho worktrees, y el
 *     Playwright de otro no toca mi `dist/`.
 */
/** ¿Este repo ADOPTA prettier? (config propia, o la clave `prettier` del package.json)
 *
 *  Se mira en vez de asumir: el día que el repo adopte prettier, el guardián deja de
 *  disparar solo, sin que nadie tenga que acordarse de quitarlo. */
function usaPrettier(cwd) {
  const { existsSync, readFileSync } = fsSync;
  const marcas = [
    '.prettierrc', '.prettierrc.json', '.prettierrc.yml', '.prettierrc.yaml',
    '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.mjs', '.prettierrc.toml',
    'prettier.config.js', 'prettier.config.cjs', 'prettier.config.mjs',
  ];
  if (marcas.some((m) => existsSync(resolve(cwd, m)))) return true;
  try {
    return 'prettier' in JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8'));
  } catch {
    return false;
  }
}

function preflightVivo(cwd) {
  try {
    const salida = execFileSync('pgrep', ['-af', 'node .*(preflight-scope|preflight-fast)\\.mjs'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return salida
      .split('\n')
      .filter(Boolean)
      .some((linea) => linea.includes(cwd) || !linea.includes('/worktrees/'));
  } catch {
    return false; // `pgrep` sin coincidencias sale 1: no hay nada corriendo.
  }
}

/**
 * Evalúa un comando. `ctx.preflight(cwd)` se inyecta para poder testear sin git.
 * Devuelve { decision: 'allow' | 'deny', reason }.
 */
export function evaluar(cmd, ctx = {}) {
  const r = evaluarBase(cmd, ctx);
  if (r.decision !== 'deny') return r;
  const perdidas = escrituras(cmd);
  if (perdidas.length === 0) return r;
  return {
    ...r,
    reason:
      `${r.reason}\n\n⚠️ Y OJO: este comando también escribía ${perdidas.join(', ')}. ` +
      'Al denegarlo NO se ha escrito ninguno. Sepáralos: primero el fichero, en su propia llamada.',
  };
}

function evaluarBase(cmd, ctx = {}) {
  if (BYPASS.test(cmd)) return { decision: 'allow', reason: 'sc:ok explícito' };
  const cwd = ctx.cwd || process.cwd();
  const preflight = ctx.preflight || estadoPreflight;
  const segs = segmentos(cmd);

  // #7 (a) — push sin preflight fresco sobre el árbol FINAL.
  if (segs.some(esPushDeCommits)) {
    const st = preflight(cwd);
    if (!st.ok)
      return {
        decision: 'deny',
        reason:
          `LEARNINGS #7 — no se pushea sin preflight en verde sobre ESTE árbol: ${st.motivo}. ` +
          'Haz: (1) commitea todo, (2) `npm run preflight:scope -- --run` (o `preflight`) UNA vez ' +
          '(el `--` es obligatorio: sin él npm se come el flag y el script solo imprime el plan), ' +
          '(3) vuelve a pushear. Si Rafa te ha dicho explícitamente que pushees sin cadena, añade `# sc:ok` al comando y díselo en el mensaje.',
      };
  }

  // #7 (b) — el exit que se reporta es el del ÚLTIMO proceso: nada detrás de un gate.
  const idxGate = segs.map((s) => empiezaPor(s, GATES)).lastIndexOf(true);
  if (idxGate >= 0 && idxGate < segs.length - 1 && !/^set -o pipefail/.test(segs[0])) {
    const cola = segs.slice(idxGate + 1);
    // Inocuo: solo `exit …` detrás (`|| exit 1`, `; exit $?`), o un `exit ${pipestatus[N]}` al
    // FINAL (devuelve el del gate). OJO: `|| echo "falló"` también enmascara — el echo devuelve 0.
    const inocua = cola.every((s) => /^exit\b/.test(s)) || /^exit\s+\$\{?(PIPESTATUS|pipestatus)\b/.test(cola[cola.length - 1]);
    if (!inocua)
      return {
        decision: 'deny',
        reason:
          `LEARNINGS #7 — «${cola[0]}» detrás del gate convierte su exit en el tuyo (así se vendieron 3 rojos como verdes). ` +
          'Deja el gate como ÚLTIMO comando y lee su log en otra llamada; si necesitas el tubo, `set -o pipefail; …` o `exit ${pipestatus[1]}`.',
      };
  }

  // #12 (c) — volcar un fichero de config con secretos imprime el secreto en el transcript.
  const SECRETOS = /(~\/\.claude\.json|(^|[\s/'"])\.claude\.json|(^|[\s/'"])\.env(\.[a-z]+)?\b|\.npmrc\b|\.auth\/|\bmcp\.json)/;
  if (
    segs.some((s) => empiezaPor(s, /^(cat|less|more|head|tail|bat|jq|node\s+-e|python3?\s+-c)\b/) && SECRETOS.test(s)) &&
    !/\bkeys\b|Object\.keys|grep -[cl]\b|wc -|--keys|\bmask/.test(cmd)
  )
    return {
      decision: 'deny',
      reason:
        'LEARNINGS #12 — ese fichero lleva credenciales y volcarlo entero las imprime (pasó con el token de Figma; hubo que rotarlo). ' +
        "Proyecta solo las claves: `jq 'keys'`, `jq '.mcpServers | keys'`, `node -e \"console.log(Object.keys(require(...)))\"`, o `grep -c`.",
    };

  // #1 — `claude mcp list` NO contesta «¿puedo llamar a esa herramienta?».
  //
  // El repertorio de herramientas de una sesión se FIJA al arrancar: un servidor añadido después
  // sale «✔ Connected» en el CLI y es inalcanzable desde dentro. En s44 declaré «no hay Playwright
  // MCP conectado» tras correr esto desde el worktree; Rafa enseñó su terminal con
  // `playwright: ✔ Connected`. Las dos salidas eran ciertas: medí el sujeto equivocado, y encima
  // le hice decidir el montaje del navegador sobre esa premisa sin verificar.
  if (segs.some((s) => empiezaPor(s, /^claude\s+mcp\s+(list|get)\b/)))
    return {
      decision: 'deny',
      reason:
        'LEARNINGS #1 — `claude mcp list` dice qué servidores ve el CLI, NO qué herramientas te llegan a TI: el repertorio ' +
        'se fija al arrancar la sesión, así que uno añadido después sale «✔ Connected» y no puedes llamarlo (s44: Playwright). ' +
        'Pregúntaselo a la sesión con `ToolSearch` → `select:mcp__<servidor>__<tool>`: o te devuelve el esquema o no lo tienes. ' +
        'Y si falta, la frase es «no me llega a esta sesión» (lo arregla reiniciar), no «no está conectado» — y no lo sustituyas ' +
        'por otro servidor sin avisar. Si de verdad quieres la vista del CLI, añade `# sc:ok`.',
    };

  // #12 (a) — `git diff main...rama` compara contra la BASE DE FUSIÓN, no contra main de hoy.
  if (segs.some((s) => empiezaPor(s, /^git\s+diff\b/) && /\b(origin\/)?main\.\.\.[A-Za-z]/.test(s)))
    return {
      decision: 'deny',
      reason:
        'LEARNINGS #12 — `main...rama` usa la base de fusión: enseña cambios ya aplicados y esconde lo que main tiene de más (casi borra 432 ficheros en s35). ' +
        'Para «qué cambia si mergeo» usa DOS puntos: `git diff main..rama`. Si de verdad quieres la base de fusión, añade `# sc:ok`.',
    };

  // #11 — zsh no parte `$VAR` por palabras: `for f in $FILES` itera UNA vez sobre todo el texto.
  if (segs.some((s) => empiezaPor(s, /^for\s+\w+\s+in\s+"?\$\{?[A-Za-z_][A-Za-z_0-9]*\}?"?\s*(do\b|$)/)))
    return {
      decision: 'deny',
      reason:
        'LEARNINGS #11 — en zsh `for f in $VAR` NO hace word-splitting: el bucle corre una vez con la lista entera y no hace nada (s11: migración de 12 iconos inexistente). ' +
        'Enumera los ficheros, usa `for f in $(…)`, o `${=VAR}`; y pega la verificación de outcome en el mismo comando (`&& grep …`).',
    };

  // #5 — construir MIENTRAS corre el preflight le cambia el `dist/` bajo los pies.
  // El síntoma engaña del todo: los e2e mueren con `Cannot find module '@smartcontact-hub/icons'`,
  // que parece una dependencia rota y no lo es — los paths del tsconfig apuntan a `dist/`, y esa
  // carpeta se está reescribiendo mientras el runner la lee. Cuesta la pasada entera (10-25 min)
  // y manda a buscar el fallo al sitio equivocado.
  if (segs.some((seg) => empiezaPor(seg, BUILDS)) && (ctx.preflightVivo || preflightVivo)(cwd))
    return {
      decision: 'deny',
      reason:
        'LEARNINGS #5 — hay un preflight corriendo y esto reescribe `dist/` bajo sus pies: sus e2e caerán con ' +
        "`Cannot find module '@smartcontact-hub/icons'`, que parece una dependencia rota y es tu build. " +
        'Espera a que termine (o párala) y construye después. Si sabes que ese preflight ya no importa, añade `# sc:ok`.',
    };

  // #5 — medir el DS con un `dist/` más viejo que tu edición.
  //
  // Las apps (y sc-docs) importan `@smartcontact-hub/components` de `dist/ui-smartcontact`, y
  // `ng serve` no vigila `dist/`. Editar el preset o un componente y lanzar Playwright sin
  // reconstruir mide el DS de ANTES, y el resultado se lee como si fuera el tuyo. El 2026-09-14
  // costó un «con la clave falla 4/4, sin ella pasa 1/1» que era el mismo `dist/` en las dos
  // pasadas, un arreglo mudado a otro fichero por esa falsa causa y un «75 de 75» que no incluía
  // los cambios de componentes. Solo se vio al medir una variable y encontrarla sin cambiar.
  if (segs.some((s) => empiezaPor(s, E2E))) {
    const rancio = (ctx.distRancio || distRancio)(cwd);
    if (rancio)
      return {
        decision: 'deny',
        reason:
          `LEARNINGS #5 — \`${rancio}\` es más nuevo que \`dist/ui-smartcontact\`, y las apps leen el DS de \`dist/\`: ` +
          'este Playwright mediría el DS de ANTES de tu edición. Haz `npm run build:components` y REINICIA el `ng serve` ' +
          'que vayas a usar (no vigila `dist/`). Si mides a propósito un build viejo, añade `# sc:ok`.',
      };
  }

  // #11 — un formateador que el repo NO adopta reescribe ficheros enteros que no tocabas.
  //
  // Medido el 2026-09-11: `prettier --write` sobre tres ficheros dejó 450 líneas cambiadas para
  // un cambio de 13, con SUS defaults (comillas dobles en plantillas Angular, atributos partidos
  // uno por línea), porque este repo no tiene config de prettier y `verify` no mira el formato.
  // El precio no fue el diff: fue que al rebasar, ese ruido chocó con `main` en dos ficheros,
  // resolví el conflicto hacia el lado equivocado y hubo que abortar el rebase y rehacer las
  // ediciones a mano. Un diff inflado no es cosmético: convierte un rebase limpio en uno con
  // conflictos y te hace decidir sobre líneas que no escribiste.
  if (
    segs.some(
      (s) =>
        empiezaPor(s, /^(npx\s+)?prettier\b/) &&
        /(^|\s)(--write|-w)(\s|$)/.test(s),
    ) &&
    !(ctx.usaPrettier || usaPrettier)(cwd)
  )
    return {
      decision: 'deny',
      reason:
        'LEARNINGS #11 — este repo NO adopta prettier (sin `.prettierrc*`, sin clave `prettier` en ' +
        '`package.json`, y `verify` no comprueba formato), así que `--write` impone defaults AJENOS: ' +
        '450 líneas reformateadas por un cambio de 13 el 2026-09-11, y el ruido acabó en un conflicto ' +
        'de rebase resuelto hacia el lado equivocado. Edita solo las líneas que cambias y copia el ' +
        'estilo del fichero. Si de verdad toca formatear (o el repo ya adoptó prettier y esto se ' +
        'quedó viejo), añade `# sc:ok`.',
    };

  // Portada de PR y mensaje de commit: el repo es PÚBLICO (decisión de Rafa, 2026-09-14).
  //
  // En 9 de los PRs #146-#167 la portada abría con un rótulo dirigido a Rafa por su nombre: la
  // regla del parte llano es para el mensaje del CHAT al cerrar, y se llevó sola a un documento
  // que lee cualquiera. La atribución de la herramienta (la línea de Claude Code, el co-autor y
  // el enlace a la sesión) ya la apaga `attribution` en `.claude/settings.json`; esto caza lo que
  // un ajuste no ve: el rótulo, y la atribución escrita a mano por una sesión con otra config.
  //
  // Mira el comando CRUDO, no `segs`: el cuerpo viaja casi siempre en un heredoc, y ahí es donde
  // está el texto. Un `--body-file` no lo ve; estrecho a propósito (LEARNINGS #2).
  const PUBLICA = /^(git\s+commit|gh\s+pr\s+(create|edit))\b/;
  const NO_EN_PUBLICO = [
    [/Para Rafa,?\s+en llano/i, 'un rótulo dirigido a Rafa por su nombre'],
    [/Generated with \[?Claude Code/i, 'la línea «Generated with Claude Code»'],
    [/Co-Authored-By:\s*Claude/i, 'el co-autor Claude'],
    [/claude\.ai\/code\/session_/i, 'el enlace a la sesión de claude.ai'],
  ];
  if (segs.some((s) => empiezaPor(s, PUBLICA))) {
    const hallado = NO_EN_PUBLICO.find(([re]) => re.test(cmd));
    if (hallado)
      return {
        decision: 'deny',
        reason:
          `Portada pública (AGENTS.md §Pull requests y commits) — este texto lleva ${hallado[1]}, y el repo es público. ` +
          'El resumen llano de arriba va sin destinatario (`**En resumen:**`) y sin atribución de la herramienta. ' +
          'Quítalo y repite. Si citas la regla a propósito (un commit que habla de ella), añade `# sc:ok`.',
      };
  }

  // #5 — un bucle de espera cuyo patrón SE CASA A SÍ MISMO no termina nunca.
  //
  // `until ! pgrep -f "preflight-scope"; do sleep; done` corre dentro de un shell cuya propia
  // línea de comandos contiene «preflight-scope», así que `pgrep -f` se encuentra a sí mismo y la
  // condición nunca se cumple. El 2026-09-12 costó tres esperas muertas (una de ellas la mató el
  // sistema por memoria) antes de ver que la máquina llevaba rato libre: el síntoma es «la otra
  // sesión no acaba nunca», y la causa es tu propio `pgrep`.
  //
  // El arreglo es apuntar al PROCESO, no a la cadena: `pgrep -f "node scripts/preflight-scope.mjs"`
  // no casa con el shell que espera, o `pgrep -f pat | grep -v $$`.
  const esperaQueSeCasaSolaMisma = (cmd) => {
    const m = cmd.match(/pgrep\s+(?:-[a-zA-Z]+\s+)*-f\s+["']?([^"'|;)\s]+)["']?/);
    if (!m) return null;
    const patron = m[1];
    if (patron.length < 4) return null;
    // ¿El patrón aparece FUERA del propio `pgrep`? Entonces el comando se encuentra a sí mismo.
    const sinPgrep = cmd.replace(/pgrep[^;|&\n]*/g, '');
    return sinPgrep.includes(patron) ? patron : null;
  };
  /* Sobre el texto SIN heredocs: escribir un fichero que HABLA de este bucle no es ejecutarlo, y
   * la primera versión se denegó a sí misma tres veces al crear su propio test. */
  const sinDocs = sinHeredocs(cmd);
  if (/\b(until|while)\b/.test(sinDocs)) {
    const patron = esperaQueSeCasaSolaMisma(sinDocs);
    if (patron)
      return {
        decision: 'deny',
        reason:
          `LEARNINGS #5 — este bucle espera a que muera «${patron}», y su propia línea de comandos contiene ese texto: ` +
          '`pgrep -f` se encuentra a SÍ MISMO y la condición no se cumple nunca. El síntoma es «la otra sesión no acaba», ' +
          'y la causa eres tú (2026-09-12: tres esperas muertas con la máquina libre). ' +
          'Apunta al proceso y no a la cadena —`pgrep -f "node scripts/preflight-scope.mjs"`— o filtra tu propio PID (`| grep -v $$`).',
      };
  }

  return { decision: 'allow', reason: '' };
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
      /* sin entrada: dejar pasar */
    }
    if (input.tool_name && input.tool_name !== 'Bash') return;
    const cmd = input.tool_input?.command;
    if (!cmd) return;
    let r;
    try {
      r = evaluar(cmd, { cwd: input.cwd });
    } catch (e) {
      // Un hook roto no puede bloquear el trabajo: falla ABIERTO y lo dice.
      process.stderr.write(`bash-guard: error interno (${e.message}); dejo pasar.\n`);
      return;
    }
    if (r.decision === 'deny') {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: r.reason },
        }),
      );
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
