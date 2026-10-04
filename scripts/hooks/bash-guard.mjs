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
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import { NOMBRE_RE } from '../audit-personal-names.mjs';
import { estadoPreflight } from '../preflight-mark.mjs';

export const BYPASS = /#\s*sc:ok\b/;

/** La cadena y los DOS gates que enumeran por índice. Estrecho a propósito: `npm run lint` o
 *  un `e2e` leen el disco y no les afecta. */
const CADENA_CIEGA = /^npm run (?:-[-a-z]+ )*(verify|preflight(:scope)?|tokens:guard|audit:seed-pii)\b/;

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
 * Parte un comando compuesto en segmentos por `;`, `&&`, `||`, `|` y saltos de línea, y apunta tras
 * cada uno qué lo separa del siguiente: solo un `|` le pasa su salida. Lo entrecomillado no se
 * parte: ahí dentro un `|` o un `;` son texto.
 *
 * La barra invertida cuenta (2026-09-20). Antes no, y una comilla doble ESCAPADA cerraba el
 * entrecomillado: a partir de ahí el DATO se leía como comandos. Un `node -e "… '…\"a|git push|b\"…' …"`
 * se denegó como si fuera un push de verdad y mandó a repetir un preflight que no hacía falta.
 * Dentro de comillas SIMPLES la barra no escapa nada, y aquí tampoco.
 */
function partes(cmdCrudo) {
  const cmd = sinHeredocs(cmdCrudo);
  const out = [];
  let cur = '';
  let q = null;
  const cierra = (sep) => {
    out.push({ texto: cur.trim(), sep });
    cur = '';
  };
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
      cierra('||');
      i++;
      continue;
    }
    if (c === '|' || c === ';' || (c === '&' && cmd[i + 1] === '&')) {
      cierra(c === '&' ? '&&' : c);
      if (c === '&') i++;
      continue;
    }
    if (c === '\n') {
      cierra('\n');
      continue;
    }
    cur += c;
  }
  cierra('');
  return out.filter((p) => p.texto);
}

const segmentos = (cmd) => partes(cmd).map((p) => p.texto);

/** Las tuberías del comando: cada una, sus etapas en orden (las que se pasan la salida con `|`). */
function tuberias(cmd) {
  const out = [];
  let etapas = [];
  for (const p of partes(cmd)) {
    etapas.push(p.texto);
    if (p.sep !== '|') {
      out.push(etapas);
      etapas = [];
    }
  }
  if (etapas.length) out.push(etapas);
  return out;
}

/**
 * Las palabras de una etapa como las recibe el programa: con las comillas resueltas (`-o "pid=,comm="`
 * da `-o` y `pid=,comm=`, y `'node -l'` es UNA palabra, un patrón y no una opción). Un `$(…)` o un
 * `` `…` `` cuenta como una palabra opaca: sus opciones son de otro comando.
 */
function palabras(etapa) {
  const s = etapa.replace(/\$\([^()]*\)|`[^`]*`/g, 'SUB');
  const out = [];
  let cur = '';
  let q = null;
  let hay = false; // `''` también es una palabra
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === q) q = null;
      else if (c === '\\' && q === '"' && i + 1 < s.length) cur += s[++i];
      else cur += c;
      continue;
    }
    if (c === "'" || c === '"') {
      q = c;
      hay = true;
      continue;
    }
    if (/\s/.test(c)) {
      if (cur || hay) out.push(cur);
      cur = '';
      hay = false;
      continue;
    }
    cur += c;
  }
  if (cur || hay) out.push(cur);
  return out;
}

/** El programa que corre una etapa y sus argumentos, saltando lo que va delante y lanza OTRO comando:
 *  asignaciones de entorno, `(`, `do`, `then`, `time`, `xargs` con sus opciones… */
function programa(etapa) {
  const w = palabras(etapa.replace(/^[({]\s*/, ''));
  let i = 0;
  for (;;) {
    if (/^[A-Za-z_][A-Za-z_0-9]*=/.test(w[i] ?? '')) i++;
    else if (['do', 'then', 'else', '!', 'time', 'nohup', 'command', 'exec', 'sudo'].includes(w[i])) i++;
    else if (w[i] === 'xargs') {
      i++;
      while ((w[i] ?? '').startsWith('-')) i += /^-[IJLnPsEd]$/.test(w[i]) ? 2 : 1;
    } else break;
  }
  return { nombre: (w[i] ?? '').split('/').pop(), args: w.slice(i + 1) };
}

/**
 * ¿Este `pgrep` imprime la línea de comandos entera? Las opciones cambian de sentido según el sistema:
 * en macOS la saca `-l` junto a `-f`, y `-a` solo suma los ancestros a la búsqueda (sigue dando PIDs);
 * en Linux la saca `-a` (`--list-full`), y `-l` es el nombre del ejecutable, con `-f` o sin él.
 * `-q` calla y `-c` cuenta (en macOS no existe y sale con el uso): ninguno lista.
 */
function pgrepListaComandos(args, plataforma) {
  const fin = args.indexOf('--');
  const opciones = (fin < 0 ? args : args.slice(0, fin)).filter((a) => a.startsWith('-'));
  const cortas = opciones.filter((a) => /^-[A-Za-z]+$/.test(a)).join('');
  if (/[qc]/.test(cortas) || opciones.includes('--count')) return false;
  const mac = cortas.includes('l') && cortas.includes('f');
  const linux = cortas.includes('a') || opciones.includes('--list-full');
  if (plataforma === 'darwin') return mac;
  if (plataforma === 'linux') return linux;
  return mac || linux;
}

/**
 * ¿Este `ps` imprime la columna de comando (`command`/`args`: el programa CON sus argumentos)? Con
 * `-o` solo si se pide; sin `-o`, la traen las columnas por defecto: en macOS todas (salvo con `-c`,
 * que la deja en el ejecutable), en Linux las de estilo BSD (`ps aux`) y las de `-f`. `-O` suma
 * columnas a las de por defecto, así que la trae siempre.
 */
function psListaComandos(args, plataforma) {
  const formatos = [];
  let porDefecto = true;
  let masPorDefecto = false;
  let letras = '';
  const bsd = /^[A-Za-z]+$/.test(args[0] ?? ''); // `ps aux`: las opciones sin guion
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const largo = a.match(/^--format(?:=(.*))?$/);
    if (largo) {
      formatos.push(largo[1] ?? args[++i] ?? '');
      porDefecto = false;
      continue;
    }
    const conGuion = /^-[^-]/.test(a);
    const grupo = conGuion ? a.slice(1) : i === 0 && bsd ? a : null;
    if (!grupo) continue;
    for (let j = 0; j < grupo.length; j++) {
      const c = grupo[j];
      if (c === 'o' || c === 'O') {
        if (c === 'o') porDefecto = false;
        else masPorDefecto = true;
        formatos.push(grupo.slice(j + 1) || args[++i] || '');
        break;
      }
      if (conGuion && /[pUuGgtMN]/.test(c)) break; // lo que sigue es su argumento (`-p89041`, `-U usuario`)
      letras += c;
    }
  }
  const campos = formatos.flatMap((f) => f.split(/[\s,]+/)).map((c) => c.split(/[=:]/)[0].toLowerCase());
  if (campos.some((c) => ['command', 'args', 'cmd'].includes(c))) return true;
  if (!porDefecto) return false;
  if (plataforma === 'darwin') return !letras.includes('c');
  if (plataforma === 'linux') return bsd || /[fF]/.test(letras) || masPorDefecto;
  return true;
}

/** Etapas que reducen lo que les entra a un número o a un sí/no: nada de la lista llega a pantalla. */
function cuentaOCalla(etapa) {
  const { nombre, args } = programa(etapa);
  if (nombre === 'wc') return true;
  if (!['grep', 'egrep', 'fgrep', 'rg'].includes(nombre)) return false;
  const fin = args.indexOf('--');
  return (fin < 0 ? args : args.slice(0, fin)).some(
    (a) => (/^-[A-Za-z]+$/.test(a) && /[cq]/.test(a)) || ['--count', '--quiet', '--silent'].includes(a),
  );
}

/** La salida estándar va a `/dev/null` (`2>/dev/null` son solo los errores y no cuenta). */
const A_DEV_NULL = /(?:^|\s)(?:1|&)?>>?&?\s*\/dev\/null\b/;
const sinComillas = (s) => s.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, '');

/**
 * La etapa que lista procesos con su línea de comandos entera Y cuya lista llega a pantalla, o null.
 * No llega si una etapa de detrás la cuenta o la calla (`| wc -l`, `| grep -c`, `| grep -q`) o si
 * acaba en `/dev/null`. A un fichero sí cuenta: lo imprime el siguiente `cat`, y el repo es público.
 */
function listadoAPantalla(cmd, plataforma) {
  for (const etapas of tuberias(cmd)) {
    for (let i = 0; i < etapas.length; i++) {
      const { nombre, args } = programa(etapas[i]);
      const lista =
        (nombre === 'pgrep' && pgrepListaComandos(args, plataforma)) ||
        (nombre === 'ps' && psListaComandos(args, plataforma));
      if (!lista) continue;
      const tirada = [etapas[i], etapas[etapas.length - 1]].some((e) => A_DEV_NULL.test(sinComillas(e)));
      if (tirada || etapas.slice(i + 1).some(cuentaOCalla)) continue;
      return etapas[i];
    }
  }
  return null;
}

/** Las palabras sin las redirecciones (`> f`, `2>&1`, `</proc/…`): son del shell, no del programa. */
function sinRedirecciones(ws) {
  const out = [];
  for (let i = 0; i < ws.length; i++) {
    const m = ws[i].match(/^(?:\d+|&)?(?:>>?|<)(&?)(.*)$/);
    if (!m) out.push(ws[i]);
    else if (!m[1] && !m[2]) i++; // `> f`: el destino es la palabra siguiente
  }
  return out;
}

/** El valor de una opción, pegado (`-d=`), aparte (`-d =`) o largo (`--delimiter==`). */
function valorDe(args, corta, larga) {
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === corta) return args[i + 1];
    if (a.startsWith(corta)) return a.slice(corta.length);
    if (larga && a.startsWith(`${larga}=`)) return a.slice(larga.length + 1);
  }
  return undefined;
}

// Etapas que tiran el VALOR de cada variable o lo tapan: `cut -d= -f1`, `awk -F= '{print $1}'`,
// `sed 's/=.*//'` o `sed 's/=.*/=<set>/'` (la máscara con que ya se miraba el entorno en sesiones
// anteriores; sin `&` ni `\1`, que devolverían el valor). En línea y no en bloque: ese `*/` lo cerraría.
// Todas dejan pasar enteras las líneas de más de un valor multilínea (no llevan `=`, medido con uno
// falso); hoy no hay ninguno: 57 líneas de `env` para 57 variables (2026-09-28). Por eso el motivo
// ofrece también `awk` sobre `ENVIRON`, que no depende de eso.
function sinValores(etapa) {
  const { nombre, args } = programa(etapa);
  if (nombre === 'cut') return valorDe(args, '-d', '--delimiter') === '=' && valorDe(args, '-f', '--fields') === '1';
  if (nombre === 'awk') return valorDe(args, '-F') === '=' && args.some((a) => /^\{\s*print\s+\$1\s*;?\s*\}$/.test(a));
  if (nombre === 'sed') return args.some((a) => /^s(.)=\.\*\$?\1(?:(?!\1)[^&\\]|\\[^0-9])*\1[gpI]*$/.test(a));
  return false;
}

/** El entorno de un proceso en Linux, y los programas que lo nombran sin imprimirlo. */
const ENVIRON = /(?:^|<)\/proc\/[^/]+\/environ$/;
const NO_LEEN = new Set(['ls', 'stat', 'file', 'test', '[', 'echo', 'printf', 'realpath', 'readlink', 'wc', 'grep', 'egrep', 'fgrep', 'rg', 'man']);

/**
 * ¿Este programa, con estos argumentos, escribe el entorno ENTERO en su salida? `env` y `printenv` sin
 * nombres, `export`/`export -p`, `declare` y `typeset` sin nombres (a secas, `-x` o `-p`), `set` a secas,
 * leer `/proc/<pid>/environ`… y un `sh -c` o un `env` que lancen uno de ellos. `env -i` (o `-`) nunca:
 * vacía el entorno, así que solo sale lo que ya va escrito en la línea.
 */
function vuelcaEntorno(nombre, todas) {
  const args = sinRedirecciones(todas);
  const nombres = args.filter((a) => !/^[-+]/.test(a));
  const letras = args.filter((a) => /^[-+][A-Za-z]+$/.test(a)).join('');
  if (nombre === 'printenv') return nombres.length === 0;
  if (nombre === 'set') return args.length === 0;
  if (nombre === 'export') return nombres.length === 0 && !/[fn]/.test(letras);
  if (nombre === 'declare' || nombre === 'typeset')
    return nombres.length === 0 && !/[fF]/.test(letras) && (letras === '' || /[xp]/.test(letras));
  if (['sh', 'bash', 'zsh', 'dash', 'ksh'].includes(nombre)) {
    const c = args.findIndex((a) => /^-[A-Za-z]*c[A-Za-z]*$/.test(a));
    return c >= 0 && c + 1 < args.length && entornoAPantalla(args[c + 1]) !== null;
  }
  if (nombre === 'env') {
    let i = 0;
    for (; i < args.length && args[i].startsWith('-'); i++) {
      const a = args[i];
      if (a === '--') {
        i++;
        break;
      }
      if (a === '-' || a === '--ignore-environment' || /^-[0v]*i[0v]*$/.test(a)) return false;
      if (/^-S|^--split-string/.test(a)) return false; // el programa va dentro de la cadena
      if (/^-[uCPLU]$|^--(unset|chdir)$/.test(a)) i++; // su argumento va aparte
    }
    while (i < args.length && /^[A-Za-z_][A-Za-z_0-9]*=/.test(args[i])) i++;
    if (i >= args.length) return true;
    return vuelcaEntorno(args[i].split('/').pop(), args.slice(i + 1)); // lanza otro, que hereda el entorno
  }
  return todas.some((a) => ENVIRON.test(a)) && !NO_LEEN.has(nombre);
}

/**
 * La etapa que vuelca el entorno ENTERO y cuya salida llega a pantalla, o null. No llega si una etapa de
 * detrás la cuenta, la calla o le quita los valores, o si acaba en `/dev/null`; a un fichero sí.
 */
function entornoAPantalla(cmd) {
  for (const tuberia of tuberias(cmd)) {
    const etapas = tuberia.map((e) => e.replace(/\)+\s*$/, '')); // el cierre de `(cd x && env)`
    for (let i = 0; i < etapas.length; i++) {
      const { nombre, args } = programa(etapas[i]);
      if (!vuelcaEntorno(nombre, args)) continue;
      const tirada = [etapas[i], etapas[etapas.length - 1]].some((e) => A_DEV_NULL.test(sinComillas(e)));
      if (tirada || etapas.slice(i + 1).some((e) => cuentaOCalla(e) || sinValores(e))) continue;
      return etapas[i];
    }
  }
  return null;
}

// Un segmento es un COMANDO si empieza por él (tras asignaciones de entorno, `cd x &&` ya está
// partido). Casar por substring dispararía sobre prosa: el primer falso positivo del hook fue un
// `printf '... el hook de git push'`, denegado en su primer minuto de vida.
const empiezaPor = (seg, re) => re.test(seg.replace(/^(\s*[A-Za-z_][A-Za-z_0-9]*=\S*\s+)*/, '').replace(/^\(\s*/, ''));

/** Un valor de la línea de comandos, entrecomillado o no. */
const VALOR = String.raw`(?:"[^"]*"|'[^']*'|\S+)`;
/** Las opciones de git que pueden ir ANTES del subcomando: `-C <ruta>` (git entra en ella) y `-c <clave=valor>`. */
const OPCIONES_GIT = String.raw`(?:-C\s+${VALOR}\s+|-c\s+${VALOR}\s+)*`;
const ES_GIT_PUSH = new RegExp(String.raw`^git\s+${OPCIONES_GIT}push\b`);
const esPushDeCommits = (seg) =>
  empiezaPor(seg, ES_GIT_PUSH) && !/--tags\b|refs\/tags|\barchive\//.test(seg) && !/--delete\b|\s:[A-Za-z]/.test(seg) && !/--dry-run\b/.test(seg);

/**
 * La carpeta donde corre un `git push`: la de su segmento, o la que le da `-C <ruta>`, que es el `cd` de
 * git: la ruta cuenta desde donde esté y varios `-C` encadenan. `git -C <ruta> push` no empieza por
 * `git push`, y por eso pasaba sin que nadie lo mirara: el del informe (`git -C <otro repo> push`) solo
 * pasaba por eso, y el de ESTE repo se colaba sin marca (2026-10-04). Una ruta que no se sabe adónde
 * va (variable, `$(…)`) manda la de la sesión, como un `cd` opaco.
 */
function carpetaDelPush(seg, dir, sesion) {
  const { args } = programa(seg);
  for (let i = 0; i < args.length && args[i].startsWith('-'); i++) {
    if (args[i] === '-c') i++;
    else if (args[i] === '-C') {
      const ruta = args[++i] ?? '';
      dir = !ruta || ruta === 'SUB' || /[$`]/.test(ruta) ? sesion : irA(dir, ruta);
    }
  }
  return dir;
}

/** El destino de un segmento que es un `cd`: su ruta si es LITERAL; `null` si es un `cd` pero no se sabe
 *  adónde va (variable, `-`, sin argumento); `undefined` si el segmento no es un `cd`. */
function destinoDeCd(seg) {
  if (!/^cd(\s|$)/.test(seg)) return undefined;
  const m = seg.match(/^cd\s+(?:"([^"$`]+)"|'([^']+)'|([^\s"'$`]+))$/);
  const ruta = m ? (m[1] ?? m[2] ?? m[3]) : null;
  return ruta && ruta !== '-' ? ruta : null;
}

const irA = (dir, ruta) => (ruta === '~' || ruta.startsWith('~/') ? resolve(process.env['HOME'] ?? '/', ruta.slice(2)) : resolve(dir, ruta));

/**
 * La carpeta en que corre CADA segmento (alineada con `segmentos(cmd)`): la que dejan los `cd` literales
 * anteriores, estén donde estén.
 *
 * Por qué (2026-09-27): el hook recibe el cwd de la SESIÓN, así que `cd <worktree> && git push` o
 * `cd <worktree> && npx playwright test` se juzgaban contra el árbol principal; denegó dos veces sin motivo
 * (la marca de preflight y el `dist/` del worktree estaban al día) y hubo que saltarlo con `# sc:ok`. Aquello
 * solo seguía los `cd` que ABREN el comando, y no basta: `false && cd <otro> && git push`,
 * `git fetch && cd <wt> && npx playwright test` o un segundo push tras volver a este repo se juzgaban donde
 * no eran (2026-10-01 y 2026-10-04). Solo rutas LITERALES: un `cd` que no se sabe adónde va (variable, `-`)
 * vuelve a la carpeta de la sesión, que es lo estricto. Un `( … )` es un subshell: su `cd` no sale de él, así
 * que `(cd <otro> && git push); git push` deja el segundo push en la de la sesión. No se modela el `cd`
 * condicionado a otro test (`[ -d x ] && cd x; git push`): el repo no lo usa y complicaría lo que se lee aquí.
 */
export function carpetasPorSegmento(cmd, cwd) {
  const pila = [];
  let dir = cwd;
  return segmentos(cmd).map((seg) => {
    let s = seg;
    while (s.startsWith('(')) {
      pila.push(dir);
      s = s.slice(1).trimStart();
    }
    const cierres = sinComillas(s).match(/\)+$/)?.[0].length ?? 0;
    const enSuCarpeta = dir;
    const ruta = destinoDeCd(s.slice(0, s.length - cierres).trimEnd());
    if (ruta !== undefined) dir = ruta === null ? cwd : irA(dir, ruta);
    for (let i = 0; i < cierres && pila.length; i++) dir = pila.pop();
    return enSuCarpeta;
  });
}

/**
 * ¿El árbol de `dir` es de ESTE repo, el que lleva la marca de preflight? Lo dice su raíz: la marca
 * la escribe y la lee `scripts/preflight-mark.mjs`, y sin ese script no hay cadena que la deje.
 *
 * Por qué (2026-10-01): una sesión de este repo también empuja OTROS repositorios (`cd <otro> &&
 * git push`), y la regla de push les pedía una marca que allí no puede escribir nadie: no se podía
 * cumplir nunca, y la única salida era `# sc:ok`. Se mira en vez de asumir, como `usaPrettier`.
 *
 * Una carpeta que NO existe cuenta como de este repo (2026-10-04): no es de otro, porque no hay nada que
 * mirar, y el `cd` que la nombra falla; con `;` o un salto de línea el push corre donde estuviera el shell. El
 * precio es `mkdir <nueva> && cd <nueva> && git init && git push`, que aún no existe cuando el hook mira y pide
 * marca o `# sc:ok`.
 */
function usaPreflight(dir) {
  if (!fsSync.existsSync(dir)) return true;
  return fsSync.existsSync(resolve(raizDelArbol(dir), 'scripts', 'preflight-mark.mjs'));
}

/** Una rama remota que no es la principal: casi siempre, la de otra sesión. */
const RAMA_AJENA = /(?:^|\s)origin\/(?!(?:main|master|HEAD)(?:\s|$))[\w./-]+/;
/** Sacarla para TRABAJAR en ella: rama local nueva o con seguimiento, o un worktree. Leer un fichero
 *  suelto (`git checkout origin/x -- f`) o fundirla no es trabajar en ella. */
const tomaRamaAjena = (seg) =>
  (empiezaPor(seg, /^git\s+(checkout|switch)\b/) && /\s(-[bBcC]|-t|--track)(\s|$)/.test(seg) && RAMA_AJENA.test(seg)) ||
  (empiezaPor(seg, /^git\s+worktree\s+add\b/) && RAMA_AJENA.test(seg));

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

/**
 * El proceso de un preflight, AL PRINCIPIO de su línea de comandos. Dos formas:
 *   · `node`, con o sin ruta, corriendo `preflight-scope.mjs` (`npm run preflight:scope -- --run`).
 *   · el `npm` de la cadena COMPLETA lanzada a mano (`npm run preflight`), que no pasa por
 *     `preflight-scope.mjs`. npm se pone de título `npm` + sus argumentos sin flags (`npm run
 *     preflight`, `npm run preflight --foo`) y rellena el resto del argv con espacios: medido el
 *     2026-09-29 en macOS, `$` a secas no casa. Es lo único que vive la cadena entera (su `sh -c` lleva
 *     el texto del `package.json`, y `en-paralelo.mjs` solo los builds del final, cuando `verify` ya
 *     reconstruyó `dist/`). `run-script` y compañía dan otro título: no los usa nadie en el repo.
 */
export const PREFLIGHT = '^([^ ]*/)?node .*preflight-scope\\.mjs|^npm run preflight( |$)';

/** `pgrep -f` a secas: un PID por línea, de los preflights de TODA la máquina. */
function listarPreflights() {
  try {
    return execFileSync('pgrep', ['-f', PREFLIGHT], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n');
  } catch {
    return []; // `pgrep` sin coincidencias sale 1: no hay nada corriendo.
  }
}

/**
 * El directorio de trabajo de cada PID; el que no se puede leer no sale. En macOS, UNA llamada a
 * `lsof` para todos: cada una cuesta de 0,4 a 1,3 s (medido el 2026-09-28), y con varios PIDs
 * cuesta lo mismo que con uno. Si alguno ya murió, `lsof` sale con 1 pero imprime el resto.
 */
function cwdsDe(pids) {
  const cwds = new Map();
  if (process.platform === 'linux') {
    for (const pid of pids) {
      try {
        cwds.set(pid, fsSync.readlinkSync(`/proc/${pid}/cwd`));
      } catch {
        /* ya murió, o no es nuestro */
      }
    }
    return cwds;
  }
  let salida;
  try {
    salida = execFileSync('lsof', ['-a', '-p', pids.join(','), '-d', 'cwd', '-Fn'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (e) {
    salida = typeof e?.stdout === 'string' ? e.stdout : '';
  }
  let pid = null;
  for (const linea of salida.split('\n')) {
    if (linea.startsWith('p')) pid = Number(linea.slice(1));
    else if (linea.startsWith('n') && pid !== null) cwds.set(pid, linea.slice(1));
  }
  return cwds;
}

/**
 * La raíz del árbol que contiene `dir`: la carpeta más cercana con `.git` (fichero en un worktree,
 * carpeta en el principal), con los enlaces resueltos. Sube por el TEXTO de la ruta y resuelve al
 * final: una subcarpeta que no existe no se puede resolver, y una enlazada llevaría al árbol del
 * enlace. Y se comparan raíces enteras, no prefijos, porque el principal CONTIENE a los de
 * `.claude/worktrees/`.
 */
function raizDelArbol(dir) {
  let raiz = dir;
  for (let d = dir; ; d = dirname(d)) {
    if (fsSync.existsSync(resolve(d, '.git'))) {
      raiz = d;
      break;
    }
    if (dirname(d) === d) break;
  }
  try {
    return fsSync.realpathSync(raiz);
  } catch {
    return raiz;
  }
}

/**
 * ¿Hay un preflight vivo AHORA sobre ESTE árbol? Devuelve su PID, o null.
 *
 * Hasta el 2026-09-28 contaba el de CUALQUIER worktree (medido en macOS: con el único vivo en otro,
 * un build en este salía denegado). Tres fallos, y un filtro para cada uno:
 *   · el patrón va anclado al PROCESO: `node`, con o sin ruta, al principio de la línea. Sin ancla
 *     contaba cualquier shell que NOMBRARA «node scripts/preflight-scope.mjs», incluido el bucle de
 *     espera que recomienda este hook (la herramienta Bash corre cada comando dentro de un
 *     `/bin/zsh -c -l '… eval <comando>'`). La ruta va con `[^ ]` y no con `\S`: el `pgrep` de
 *     macOS no entiende `\S`, y con él se perdía el `node` con ruta absoluta.
 *   · `pgrep -f` a secas, que imprime PIDs igual en macOS y en Linux. Era `-af`: en Linux añade la
 *     línea de comandos, pero en macOS `-a` es «incluye a los antepasados», así que salían PIDs
 *     pelados y el filtro por ruta los dejaba pasar todos.
 *   · el árbol sale del DIRECTORIO de trabajo de cada PID, no de su texto: npm lo lanza como
 *     `node scripts/preflight-scope.mjs`, con ruta relativa, y el árbol no sale nunca en la línea.
 *     El `npm` de `npm run preflight` se queda en la carpeta desde la que se lanzó, que puede ser
 *     una subcarpeta: por eso cuenta la RAÍZ de su cwd, no el cwd.
 *     Cuenta solo si es el del comando (`carpetasPorSegmento`): en esta máquina conviven decenas de
 *     worktrees (35 el 2026-09-28), y el preflight de otro no toca este `dist/`.
 *
 * Un cwd que no se puede leer NO cuenta. `lsof` no devuelve nada ni para un PID que ya murió ni
 * para uno de otro usuario, y lo corriente es lo primero: el preflight acabó entre el `pgrep` y el
 * `lsof`. Contarlo traería de vuelta el falso positivo que esto arregla, con un motivo que manda
 * esperar a un preflight que no es de aquí, o pararlo. No contarlo solo deja pasar el build en el
 * caso raro de un preflight de este árbol cuyo cwd no se deja leer.
 */
function preflightVivo(dir, ctx = {}) {
  const pids = (ctx.listarPreflights || listarPreflights)()
    .map((linea) => Number.parseInt(linea, 10))
    .filter(Number.isInteger);
  if (pids.length === 0) return null;
  const cwds = (ctx.cwdsDe || cwdsDe)(pids);
  const arbol = raizDelArbol(dir);
  return pids.find((pid) => cwds.has(pid) && raizDelArbol(cwds.get(pid)) === arbol) ?? null;
}

/**
 * Ficheros FUENTE nuevos que el índice de git todavía no conoce.
 *
 * Por qué importa: `token-guard.mjs` y `audit-seed-pii.mjs` enumeran con `git ls-files`, que lee
 * el ÍNDICE y no el disco (está escrito en su propio comentario, y es deliberado: así un fichero
 * borrado y aún en el índice sigue contando). La consecuencia es que un fichero NUEVO sin
 * `git add` es INVISIBLE para ellos, y la cadena sale verde sin haberlo mirado.
 *
 * Solo mira `projects/` y solo extensiones de código: un `.log` o un apunte suelto no debe
 * bloquear la cadena (un guardián con falsos positivos enseña a ignorarlo, #2).
 */
export function fuentesSinIndexar(cwd) {
  try {
    const salida = execSync('git ls-files --others --exclude-standard -- projects', {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return salida
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /\.(ts|scss|css|html)$/.test(l));
  } catch {
    return [];
  }
}

/** `pgrep` con sus flags y su patrón, entrecomillado o no. */
const PGREP = /\bpgrep((?:\s+-{1,2}[A-Za-z-]*)*)\s+("(?:[^"\\]|\\.)*"|'[^']*'|[^\s"'|;&()<>]+)/g;

/**
 * El primer patrón de `pgrep -f` SIN ANCLAR que corre dentro de un bucle `until`/`while`, o null.
 *
 * Recorre segmentos y no texto: un `pgrep` suelto antes del bucle, o un `grep` que busca la frase,
 * no esperan a nada. `-f` cuenta también dentro de un racimo (`-fl`). Un patrón en una variable no
 * se puede leer desde aquí, y no se opina.
 */
function esperaSinAncla(segs) {
  const bucles = []; // true: `until`/`while`, los que esperan; false: `for`/`select`, que también cierran con `done`
  for (const seg of segs) {
    const s = seg.replace(/^(?:(?:do|then|else|if|elif|!)\s+|[({]\s*)+/, '');
    if (/^(until|while)\b/.test(s)) bucles.push(true);
    else if (/^(for|select)\b/.test(s)) bucles.push(false);
    if (bucles.includes(true))
      for (const [, flags, crudo] of s.matchAll(PGREP)) {
        if (!/(^|\s)(-[A-Za-z]*f[A-Za-z]*|--full)(?=\s|$)/.test(flags)) continue;
        if (/(^|\s)(-[A-Za-z]*x[A-Za-z]*|--exact)(?=\s|$)/.test(flags)) continue; // la línea EXACTA no casa con un shell
        if (!crudo.startsWith("'") && /\$[\w{(]|`/.test(crudo)) continue;
        const patron = /^["']/.test(crudo) ? crudo.slice(1, -1) : crudo;
        if (!patron.startsWith('^')) return patron;
      }
    if (/^done\b/.test(s)) bucles.pop();
  }
  return null;
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
  const preflight = ctx.preflight || estadoPreflight;
  const sinIndexar = ctx.sinIndexar || fuentesSinIndexar;
  const segs = segmentos(cmd);
  const sesion = ctx.cwd || process.cwd();
  const carpetas = carpetasPorSegmento(cmd, sesion);
  /** Las carpetas en que corren los segmentos que cumplen `pred`, sin repetir: cada regla mira la de los suyos. */
  const enCarpetas = (pred) => [...new Set(segs.flatMap((s, i) => (pred(s) ? [carpetas[i]] : [])))];

  // #7 (a) — push sin preflight fresco sobre el árbol FINAL. Solo en un árbol de este repo: en otro
  // no hay cadena que escriba la marca (`usaPreflight`), y exigirla dejó a un subagente con sus commits
  // sin subir (2026-10-01). Cada push se juzga en la carpeta de SU segmento (`carpetasPorSegmento`), o en la
  // de su `-C <ruta>` (`carpetaDelPush`).
  for (const [i, seg] of segs.entries()) {
    if (!esPushDeCommits(seg)) continue;
    const dir = carpetaDelPush(seg, carpetas[i], sesion);
    if (!(ctx.usaPreflight || usaPreflight)(dir)) continue;
    const st = preflight(dir);
    if (!st.ok)
      return {
        decision: 'deny',
        reason:
          `LEARNINGS #7 — no se pushea sin preflight en verde sobre ESTE árbol: ${st.motivo}. ` +
          'Haz: (1) commitea todo, (2) `npm run preflight:scope -- --run` (o `preflight`) UNA vez ' +
          '(el `--` es obligatorio: sin él npm se come el flag y el script solo imprime el plan), ' +
          '(3) vuelve a pushear. Si el usuario te ha dicho explícitamente que pushees sin cadena, añade `# sc:ok` al comando y díselo en el mensaje.',
      };
  }

  // #7 (c) — lanzar la CADENA con fuentes nuevas sin `git add`: verde ciego.
  // Dos gates enumeran con `git ls-files`, así que no ven lo que no está en el índice.
  for (const dir of enCarpetas((sg) => CADENA_CIEGA.test(sg))) {
    const nuevos = sinIndexar(dir);
    if (nuevos.length > 0)
      return {
        decision: 'deny',
        reason:
          `LEARNINGS #2 — ${nuevos.length} fichero(s) fuente sin \`git add\` (${nuevos.slice(0, 3).join(', ')}` +
          `${nuevos.length > 3 ? ', …' : ''}). \`token-guard\` y \`audit-seed-pii\` enumeran con ` +
          '`git ls-files`, que lee el ÍNDICE: lo que no está añadido NO se mira, y la cadena sale ' +
          'verde sin haberlo visto. Haz `git add -A` primero y vuelve a lanzarla.',
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

  // #7 (c) — la run MÁS RECIENTE de una rama casi nunca es la de `ci`.
  //
  // Sobre un mismo commit de `main` conviven varios workflows (`ci`, `deploy-record`, la auditoría
  // semanal). En s46 leí `gh run list --branch main --limit 1`, vi `completed/success` y estuve a un
  // mensaje de dar el CI por verde: esa run era la de la auditoría, y `ci` seguía
  // `in_progress`. El repo ya tiene quien lo contesta bien — `ci:verdict` resuelve el run de `ci`
  // sobre el commit — y la tarjeta lo dice desde el paso 6. Estrecho a `--limit 1` a propósito
  // (LEARNINGS #2): listar varias y filtrar por `headSha` es legítimo y así lo diagnostiqué.
  if (
    segs.some(
      (s) =>
        empiezaPor(s, /^gh\s+run\s+list\b/) && /--limit[= ]\s*1(\s|$)/.test(s) && !/--workflow/.test(s),
    )
  )
    return {
      decision: 'deny',
      reason:
        'LEARNINGS #7 — `--limit 1` te da la run más reciente de CUALQUIER workflow, y en main conviven ' +
        '`ci`, `deploy-record` y la auditoría semanal: así se lee un verde que no es el del CI. ' +
        'El veredicto es `npm run ci:verdict` (o `npm run ci:verdict -- main`). ' +
        'Si de verdad quieres listar, acota con `--workflow ci`, o pide varias y filtra por `headSha`.',
    };

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

  // #12 (c) — listar procesos con su línea de comandos ENTERA imprime lo que lleve dentro.
  //
  // Medido el 2026-09-28 en macOS con un proceso de usar y tirar que fija `process.title`, como
  // `ng serve`, y lleva una variable ficticia en el entorno. El título rellena con ceros el hueco de
  // los argumentos; `pgrep -l -f` se los salta y sigue leyendo, así que detrás del título imprime el
  // ENTORNO del proceso (en un `ng serve` real, un token de sesión entre otras variables). `ps` cuenta
  // esos ceros y no llega al entorno, pero su columna de comando enseña los ARGUMENTOS de todos, y en
  // la misma máquina un proceso auxiliar lleva un `--token` en los suyos. Solo cuenta lo que llega a
  // pantalla: el `pgrep -af` de `preflightVivo` lo lee este hook y no lo imprime.
  const listado = listadoAPantalla(cmd, ctx.plataforma || process.platform);
  if (listado)
    return {
      decision: 'deny',
      reason:
        `LEARNINGS #12 — «${listado}» imprime la línea de comandos ENTERA de otros procesos, y ahí viajan secretos: ` +
        'en macOS, `pgrep -l -f` sigue leyendo detrás del título de un proceso que se retitula (`ng serve`) y saca su ENTORNO, ' +
        'token de sesión incluido (2026-09-28); `ps` con la columna de comando enseña los argumentos de todos, y alguno lleva un `--token`. ' +
        'Para ver qué corre: `pgrep -f patrón` sin `-l` ni `-a` (solo PIDs) o `ps -o pid=,ppid=,comm=` (solo el ejecutable); ' +
        'para contar, `| wc -l` o `| grep -c`; qué escucha en cada puerto, `lsof -nP -iTCP -sTCP:LISTEN`. ' +
        'Si de verdad necesitas un argumento, proyecta solo ese y añade `# sc:ok`.',
    };

  // #12 (c) — volcar el entorno ENTERO lo imprime en el transcript, token de sesión incluido.
  //
  // Medido el 2026-09-28 con un recuento que no imprime ningún valor (`printenv | grep -c
  // '^CLAUDE_CODE_MESSAGING_TOKEN='` dio 1): el entorno de la herramienta Bash lleva un token de sesión.
  // Un `env` a secas, `printenv`, `export -p`, `declare -x` o `set` lo imprimen (bash y zsh, medidos con
  // `env -i` y una variable falsa), y `env | grep TOKEN` también: `grep` deja pasar la línea entera. En
  // Linux (sesiones cloud), `/proc/<pid>/environ` es ese mismo entorno. No cuentan `env` como lanzador de
  // otro programa, una variable pedida por su nombre, ni lo que se queda en nombres o en un número.
  // Fuera a propósito: los intérpretes (`node -p process.env`, `print(os.environ)` también vuelcan).
  const volcado = entornoAPantalla(cmd);
  if (volcado)
    return {
      decision: 'deny',
      reason:
        `LEARNINGS #12 — «${volcado}» vuelca el entorno ENTERO al transcript, y en él viaja un token de sesión (medido el 2026-09-28); ` +
        'en Linux, `/proc/<pid>/environ` es ese mismo entorno. Proyecta o enmascara antes de imprimir: una variable, `printenv HOME`; ' +
        "solo los nombres, `env | cut -d= -f1` (o `awk 'BEGIN{for (k in ENVIRON) print k}'`, que no suelta las líneas de más " +
        "de un valor multilínea); si está o cuántas hay, `printenv | grep -c NOMBRE`; con el valor tapado, `| sed 's/=.*/=<set>/'`. " +
        'Para probar con valores, `env -i FALSA=x …` vacía el entorno. Si de verdad necesitas el volcado, añade `# sc:ok`.',
    };

  // #1 — `claude mcp list` NO contesta «¿puedo llamar a esa herramienta?».
  //
  // El repertorio de herramientas de una sesión se FIJA al arrancar: un servidor añadido después
  // sale «✔ Connected» en el CLI y es inalcanzable desde dentro. En s44 declaré «no hay Playwright
  // MCP conectado» tras correr esto desde el worktree; la terminal del usuario decía
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

  // #21 — sacar la rama de OTRA sesión para trabajar en ella sin mirar si sigue viva.
  //
  // El 2026-09-27 reproduje y arreglé los tres rojos del CI de #256 (~15 min) mientras su sesión,
  // viva en la nube, subía el mismo arreglo: lo vi al ir a empujar, por el tip, no al empezar. Y
  // `git worktree list`, la receta de la regla, no ve una sesión cloud; `list_sessions` sí.
  const ajena = segs.find(tomaRamaAjena);
  if (ajena) {
    const rama = ajena.match(RAMA_AJENA)[0].trim();
    return {
      decision: 'deny',
      reason:
        `LEARNINGS #21 — vas a trabajar sobre \`${rama}\`, y una rama que no es \`main\` suele ser de otra sesión, que puede ` +
        'seguir viva y empujando lo mismo. Antes de invertir trabajo, mira si lo está: su último push ' +
        `(\`git log -1 --format='%cr · %s' ${rama}\`) y, en una sesión cloud, \`list_sessions\` (su rama y su \`task_summary\`): ` +
        '`git worktree list` no la ve. Una rama, una sesión: si está viva, coordina o trabaja en tu rama. ' +
        'Si ya lo miraste o la rama es tuya, añade `# sc:ok`.',
    };
  }

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
  for (const dir of enCarpetas((seg) => empiezaPor(seg, BUILDS))) {
    const pid = (ctx.preflightVivo || preflightVivo)(dir, ctx);
    if (pid)
      return {
        decision: 'deny',
        reason:
          `LEARNINGS #5 — hay un preflight corriendo en este árbol (pid ${pid}) y esto reescribe \`dist/\` bajo sus pies: sus e2e caerán con ` +
          "`Cannot find module '@smartcontact-hub/icons'`, que parece una dependencia rota y es tu build. " +
          'Espera a que termine (o párala) y construye después. Si sabes que ese preflight ya no importa, añade `# sc:ok`.',
      };
  }

  // #5 — medir el DS con un `dist/` más viejo que tu edición.
  //
  // Las apps (y sc-docs) importan `@smartcontact-hub/components` de `dist/ui-smartcontact`, y
  // `ng serve` no vigila `dist/`. Editar el preset o un componente y lanzar Playwright sin
  // reconstruir mide el DS de ANTES, y el resultado se lee como si fuera el tuyo. El 2026-09-14
  // costó un «con la clave falla 4/4, sin ella pasa 1/1» que era el mismo `dist/` en las dos
  // pasadas, un arreglo mudado a otro fichero por esa falsa causa y un «75 de 75» que no incluía
  // los cambios de componentes. Solo se vio al medir una variable y encontrarla sin cambiar.
  for (const dir of enCarpetas((s) => empiezaPor(s, E2E))) {
    const rancio = (ctx.distRancio || distRancio)(dir);
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
    enCarpetas((s) => empiezaPor(s, /^(npx\s+)?prettier\b/) && /(^|\s)(--write|-w)(\s|$)/.test(s)).some(
      (dir) => !(ctx.usaPrettier || usaPrettier)(dir),
    )
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

  // Portada de PR y mensaje de commit: el repo es PÚBLICO (decisión del 2026-09-14).
  //
  // En 9 de los PRs #146-#167 la portada abría con un rótulo dirigido al autor por su nombre: la
  // regla del parte llano es para el mensaje del CHAT al cerrar, y se llevó sola a un documento
  // que lee cualquiera. Desde el 2026-09-24 no se nombra a nadie en ninguna parte del texto, igual
  // que en los comentarios de código (AGENTS.md §«Voz del código», `audit:personal-names`, de donde
  // sale el patrón). La atribución de la herramienta (la línea de Claude Code, el co-autor y el
  // enlace a la sesión) ya la apaga `attribution` en `.claude/settings.json`; esto caza lo que un
  // ajuste no ve: el nombre, y la atribución escrita a mano por una sesión con otra config.
  //
  // Mira el comando CRUDO, no `segs`: el cuerpo viaja casi siempre en un heredoc, y ahí es donde
  // está el texto. Un `--body-file` no lo ve; estrecho a propósito (LEARNINGS #2).
  const PUBLICA = /^(git\s+commit|gh\s+pr\s+(create|edit))\b/;
  const NO_EN_PUBLICO = [
    [NOMBRE_RE, 'el nombre de una persona (la decisión se cita por su fuente, no por quién la pidió)'],
    [/Generated with \[?Claude Code/i, 'la línea «Generated with Claude Code»'],
    [/Co-Authored-By:\s*Claude/i, 'el co-autor Claude'],
    [/claude\.ai\/code\/session_/i, 'el enlace a la sesión de claude.ai'],
  ];
  if (segs.some((s) => empiezaPor(s, PUBLICA))) {
    // La rama lleva el alias del autor como prefijo (lo pone la app al crear la caja): es un ref,
    // no una firma, y denegarlo tumbó el `gh pr create --head` del #269 (2026-09-28).
    const sinRamas = cmd.replace(new RegExp(`${NOMBRE_RE.source}\\/[\\w.-]+`, 'gi'), 'RAMA');
    const hallado = NO_EN_PUBLICO.find(([re]) => re.test(re === NOMBRE_RE ? sinRamas : cmd));
    if (hallado)
      return {
        decision: 'deny',
        reason:
          `Portada pública (AGENTS.md §Pull requests y commits) — este texto lleva ${hallado[1]}, y el repo es público. ` +
          'El resumen llano de arriba va sin destinatario (`**En resumen:**`), sin nombrar a nadie y sin atribución de la herramienta. ' +
          'Quítalo y repite. Si citas la regla a propósito (un commit que habla de ella), añade `# sc:ok`.',
      };
  }

  // #5 — un bucle de espera con `pgrep -f` SIN ANCLAR no termina nunca.
  //
  // `pgrep -f` casa contra la línea de comandos ENTERA de cada proceso, y la herramienta Bash corre
  // cada comando como `/bin/zsh -c -l '… eval '<comando>''`: el shell que espera lleva el patrón en
  // su propia línea. En Linux (procps) pgrep no se salta a sus antepasados y el bucle se encuentra a
  // SÍ MISMO; en macOS sí (`man pgrep`, `-a`), pero dos esperas a la vez se ven la UNA a la OTRA. El
  // síntoma engaña igual: «la otra sesión no acaba», con la máquina libre. El 2026-09-12 costó tres
  // esperas muertas, y el 2026-09-28 dos bucles de fondo siguieron vivos tras morir su preflight.
  // Medido ese día en macOS: cada bucle veía el shell del otro; anclados, los dos salieron a la
  // primera, y uno solo esperó a su proceso justo lo que este vivió.
  //
  // Hasta entonces solo se denegaba si el patrón salía TAMBIÉN fuera del `pgrep`, y el consejo del
  // propio motivo (`node scripts/preflight-scope.mjs`, sin anclar) era una de esas esperas. Lo que
  // sirve es ANCLAR al principio del proceso: la línea de un shell empieza por `/bin/zsh`, nunca por
  // `node`. Estricto a propósito: `[n]ode` o un `\.` esquivan su propio texto, pero no el de otro
  // shell que lo lleve literal; el ancla, sí. Con `-x` (la línea exacta) tampoco casa ningún shell.
  //
  // Sobre el texto SIN heredocs (`segmentos` los quita): escribir un fichero que HABLA de este bucle
  // no es ejecutarlo, y la primera versión se denegó a sí misma tres veces al crear su propio test.
  const sinAncla = esperaSinAncla(segs);
  if (sinAncla)
    return {
      decision: 'deny',
      reason:
        `LEARNINGS #5 — este bucle espera con \`pgrep -f\` a «${sinAncla}» SIN ANCLAR, y \`pgrep -f\` casa contra la línea ` +
        'de comandos ENTERA: la del shell que corre el bucle también lo lleva dentro. En Linux se encuentra a SÍ MISMO; en ' +
        'macOS, dos esperas a la vez se ven la una a la otra. La condición no se cumple nunca y el síntoma es «la otra sesión ' +
        'no acaba» (2026-09-12: tres esperas muertas; 2026-09-28: dos vivas tras morir su preflight). Ancla el patrón al ' +
        'principio del PROCESO, con su ejecutable: `pgrep -f "^node scripts/preflight-scope.mjs"` (la línea de un shell ' +
        'empieza por `/bin/zsh`). Y antes de fiarte, `pgrep -f` con el patrón anclado mientras el proceso vive (solo PIDs: ' +
        'con `-l`, en macOS, saca la línea entera y con ella el entorno): un ancla que ' +
        'no casa con nada sale del bucle al instante, que es el fallo contrario. Si de verdad lo quieres sin anclar, añade `# sc:ok`.',
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
