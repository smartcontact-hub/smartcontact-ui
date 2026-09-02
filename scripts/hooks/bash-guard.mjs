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
import { fileURLToPath } from 'node:url';
import { estadoPreflight } from '../preflight-mark.mjs';

export const BYPASS = /#\s*sc:ok\b/;

const GATES = /^(npm run (?:-[-a-z]+ )*(verify|preflight(:fast|:scope)?|e2e(:[a-z-]+)?|test:[a-z-]+|lint|typecheck|docs:[a-z-]+|audit:[a-z-]+|tokens:[a-z-]+|guard:[a-z-]+|ci:verdict)|npx playwright test|node --test|gh run (watch|view))\b/;

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

/** Parte un comando compuesto en segmentos por `;`, `&&`, `|` (no `||`). Ignora comillas simples. */
function segmentos(cmdCrudo) {
  const cmd = sinHeredocs(cmdCrudo);
  const out = [];
  let cur = '';
  let q = null;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (q) {
      cur += c;
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

/**
 * Evalúa un comando. `ctx.preflight(cwd)` se inyecta para poder testear sin git.
 * Devuelve { decision: 'allow' | 'deny', reason }.
 */
export function evaluar(cmd, ctx = {}) {
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
          'Haz: (1) commitea todo, (2) `npm run preflight:scope --run` (o `preflight` / `preflight:fast`) UNA vez, ' +
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
