import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PREFLIGHT, carpetaEfectiva, evaluar, escrituras } from '../hooks/bash-guard.mjs';

// Cada patrón del hook se prueba EN ROJO (el comando que motivó la regla) y EN VERDE (la forma
// correcta y los vecinos legítimos). Un guardián que solo se ha visto pasar no prueba que sepa
// fallar, y uno con falsos positivos enseña a ignorarlo (LEARNINGS 2).

// `distRancio: () => null` en los tres: sin él, el test lee el `dist/` REAL de la máquina, y basta con
// editar una fuente del DS sin reconstruir para que `npm run e2e` salga denegado y el test rojo
// (2026-09-24, en mitad de un preflight). El caso rancio se prueba aparte, inyectado. Por lo mismo,
// `listarPreflights: () => []`: sin él, un build en un test lee los procesos vivos de la máquina. Y
// `usaPreflight: () => true` en `verde` y `rojo`: las carpetas de mentira (`/repo`, `/wt`) no están en
// el disco, y sin él ningún push de un test se juzgaría como de este repo. Cómo reconoce el hook un
// árbol de este repo se prueba aparte, en el disco.
const verde = { preflight: () => ({ ok: true, motivo: 'ok' }), sinIndexar: () => [], distRancio: () => null, listarPreflights: () => [], usaPreflight: () => true };
const rojo = { preflight: () => ({ ok: false, motivo: 'no hay marca' }), sinIndexar: () => [], distRancio: () => null, listarPreflights: () => [], usaPreflight: () => true };
/** Árbol con fuentes nuevas todavía fuera del índice. */
const sinAdd = {
  distRancio: () => null,
  preflight: () => ({ ok: true, motivo: 'ok' }),
  sinIndexar: () => ['projects/supervisor/src/app/features/lab/admin/admin-lab.model.ts'],
};
const deny = (cmd, ctx, regla) => {
  const r = evaluar(cmd, ctx);
  assert.equal(r.decision, 'deny', `debía denegar: ${cmd}`);
  assert.match(r.reason, regla);
};
const allow = (cmd, ctx = verde) => assert.equal(evaluar(cmd, ctx).decision, 'allow', `debía dejar pasar: ${cmd}`);

test('#7 push: sin marca fresca → deny; con marca → allow; tags/borrados/dry-run no cuentan', () => {
  deny('git push origin main', rojo, /LEARNINGS #7/);
  deny('git add -A && git commit -m "x" && git push', rojo, /LEARNINGS #7/);
  allow('git push origin main', verde);
  allow('git push origin archive/learnings-2026-09-02', rojo);
  allow('git push --tags', rojo);
  allow('git push origin --delete feat/vieja', rojo);
  allow('git push origin :feat/vieja', rojo);
  allow('git push --dry-run', rojo);
  allow('git push origin main # sc:ok', rojo);
});

test('#2 cadena con fuentes sin `git add` → deny; ya indexadas o gate que lee disco → allow', () => {
  // ROJO: el caso que motivó la regla. `verify` salió verde sobre 908 ficheros y mi trabajo
  // (35 nuevos, sin añadir) no estaba entre ellos; al commitear pasaron a 932 y salieron 2 fallos.
  deny('npm run verify', sinAdd, /LEARNINGS #2/);
  deny('npm run preflight:scope -- --run', sinAdd, /git ls-files/);
  deny('npm run tokens:guard', sinAdd, /ÍNDICE/);
  deny('npm run audit:seed-pii', sinAdd, /git add/);
  // El motivo tiene que decir QUÉ fichero, o el deny no se puede accionar.
  deny('npm run verify', sinAdd, /admin-lab\.model\.ts/);

  // VERDE: el árbol ya indexado es el caso normal.
  allow('npm run verify', verde);
  allow('npm run preflight:scope -- --run', verde);
  // Vecinos que NO enumeran por índice: leen el disco, así que no les afecta.
  allow('npm run lint', sinAdd);
  allow('npm run typecheck', sinAdd);
  allow('npm run audit:text-styles', sinAdd);
  allow('npm run e2e', sinAdd);
  // Y el escape explícito sigue valiendo.
  allow('npm run verify # sc:ok', sinAdd);
});

test('#1 `claude mcp list` no dice qué herramientas te llegan → deny; vecinos y escape → allow', () => {
  deny('claude mcp list', verde, /LEARNINGS #1/);
  deny('cd /tmp && claude mcp list 2>&1 | head -40', verde, /LEARNINGS #1/);
  deny('claude mcp get playwright', verde, /LEARNINGS #1/);
  // El motivo tiene que ENSEÑAR el instrumento correcto, o el deny solo estorba.
  deny('claude mcp list', verde, /ToolSearch/);
  allow('claude mcp list # sc:ok', verde);
  // Vecinos legítimos: añadir o quitar un server no es medir alcance.
  allow('claude mcp add foo npx foo', verde);
  allow('claude mcp remove foo', verde);
  // Y no nos comemos otros `list`.
  allow('npm list --depth=0', verde);
  allow('gh pr list --state open', verde);
});

test('#7 veredicto de CI: la run más reciente sin acotar → deny; ci:verdict o --workflow → allow', () => {
  // El rojo: el comando exacto con el que leí «completed/success» de la auditoría semanal y creí
  // que era el CI (s46).
  deny('gh run list --branch main --limit 1 --json status,conclusion', verde, /LEARNINGS #7/);
  deny('gh run list --limit 1', verde, /LEARNINGS #7/);
  deny('gh run list --branch main --limit=1 --jq ".[0].conclusion"', verde, /LEARNINGS #7/);
  // Los verdes: el gate que sí contesta, acotar por workflow, y listar varias para filtrar a mano.
  allow('npm run ci:verdict');
  allow('npm run ci:verdict -- main');
  allow('gh run list --branch main --limit 1 --workflow ci');
  allow('gh run list --branch main --limit 8 --json workflowName,status,conclusion,headSha');
  allow('gh pr checks 226');
  allow('gh run list --branch main --limit 1 # sc:ok');
});

test('#7 exit enmascarado: algo detrás del gate → deny; gate al final o pipefail → allow', () => {
  deny('npm run verify 2>&1 | tail -3; echo "VERIFY=$?"', verde, /exit/);
  deny('(npm run verify && npm run e2e) > log 2>&1; echo "LANE_EXIT=$?"', verde, /exit/);
  deny('gh run watch 123 --exit-status; echo "CI=$?"', verde, /exit/);
  // Misma familia: `gh pr checks` sale 1 si algún check no está en verde, y ese exit es el
  // veredicto. Un `| head` detrás lo cambia por el del `head`, que siempre es 0.
  deny('gh pr checks 99 2>&1 | head -8', verde, /exit/);
  deny('npm run docs:coherence | tail -2', verde, /exit/);
  deny('npm run -s ci:verdict main; echo "(exit $?)"', verde, /exit/); // con flags: se coló en s41 hasta que lo usé yo
  deny('npm run --silent docs:guard 2>&1 | tail -1', verde, /exit/);
  deny('node --test scripts/__tests__/x.test.mjs | grep pass', verde, /exit/); // el runner enmascara igual (s41)
  allow('npm run verify');
  allow('npm run verify 2>&1 > /tmp/log');
  allow('git status && npm run docs:guard && npm run docs:coherence');
  allow('set -o pipefail; npm run verify 2>&1 | tee log');
  allow('npm run verify 2>&1 | tee log; exit ${pipestatus[1]}');
  deny('npm run verify || echo "falló"', verde, /exit/); // el echo devuelve 0: el rojo se pierde igual
  allow('npm run verify || exit 1');
  allow('tail -20 verify.log'); // leer el log en otra llamada es la forma correcta
});

test('#12 secretos: volcar config con credenciales → deny; proyectar claves → allow', () => {
  deny('cat ~/.claude.json', verde, /LEARNINGS #12/);
  deny("node -e \"console.log(JSON.stringify(require(process.env.HOME+'/.claude.json')))\"", verde, /LEARNINGS #12/);
  deny('cat .env', verde, /LEARNINGS #12/);
  deny('head -50 .npmrc', verde, /LEARNINGS #12/);
  allow("jq '.mcpServers | keys' ~/.claude.json");
  allow("node -e \"console.log(Object.keys(require(process.env.HOME+'/.claude.json').mcpServers))\"");
  allow('grep -c FIGMA .env');
  allow('cat .claude/settings.local.json'); // permisos, no credenciales: fuera del patrón a propósito
  allow('cat package.json');
});

// Medido el 2026-09-28 en macOS con un proceso de usar y tirar que fija `process.title` y lleva una
// variable ficticia: `pgrep -l -f` sacaba su ENTORNO detrás del título (en un `ng serve` real, con un
// token de sesión), `ps` no, pero su columna de comando enseña los argumentos de todos, y un proceso
// auxiliar de la máquina lleva un `--token` en los suyos. La plataforma se inyecta porque `-a` y `-l`
// cambian de sentido entre macOS y Linux.
test('#12 procesos: la línea de comandos entera a pantalla → deny; PIDs, ejecutable, contar o sc:ok → allow', () => {
  const mac = { ...verde, plataforma: 'darwin' };
  const linux = { ...verde, plataforma: 'linux' };
  // ROJO: el comando que imprimió el entorno, y sus variantes.
  deny('pgrep -fl "ng serve"', mac, /LEARNINGS #12/);
  deny('pgrep -lf ng', mac, /ENTORNO/);
  deny('pgrep -f -l "ng serve" | head -5', mac, /LEARNINGS #12/);
  deny("pgrep -ilf 'ng serve' | grep 4413", mac, /LEARNINGS #12/); // grep a secas deja pasar la línea entera
  deny('pgrep -lf ng 2>/dev/null', mac, /LEARNINGS #12/); // tira los errores, no la lista
  // En Linux, `-a` es `--list-full`.
  deny('pgrep -af "ng serve"', linux, /LEARNINGS #12/);
  deny('pgrep -a -f ng', linux, /LEARNINGS #12/);
  deny('pgrep --list-full node', linux, /LEARNINGS #12/);
  // `ps` con la columna de comando: pedida, o la que traen las columnas por defecto.
  deny('ps aux | grep "[n]g serve"', mac, /LEARNINGS #12/);
  deny('ps -ef | grep node', linux, /LEARNINGS #12/);
  deny('ps -o pid=,command= -p 89041', mac, /LEARNINGS #12/);
  deny('ps -eo pid,args | grep ng', linux, /LEARNINGS #12/);
  deny('ps axo pid,command', mac, /LEARNINGS #12/);
  deny('ps -p 89041', mac, /LEARNINGS #12/); // en macOS la columna por defecto es el comando CON argumentos
  deny('ps -O rss -p 89041', mac, /LEARNINGS #12/); // -O suma columnas a las de por defecto
  deny('pgrep -f ng | xargs ps -o command= -p', mac, /LEARNINGS #12/);
  deny('for p in $(pgrep -f ng); do ps -o args= -p $p; done', mac, /LEARNINGS #12/);
  deny('ps aux > procesos.txt', mac, /LEARNINGS #12/); // un fichero lo imprime el siguiente `cat`, y el repo es público
  // El motivo enseña la forma que sí sirve.
  deny('pgrep -fl ng', mac, /ps -o pid=,ppid=,comm=/);
  deny('ps aux', mac, /sin `-l` ni `-a`/);

  // VERDE: solo PIDs, solo el ejecutable, o la lista reducida a un número o a un sí/no.
  allow('pgrep -f "ng serve"', mac);
  allow('pgrep -f "ng serve"', linux);
  allow('pgrep -l node', mac); // -l sin -f: el PID y el nombre del ejecutable
  allow('pgrep -af "ng serve"', mac); // en macOS -a solo suma los ancestros: siguen siendo PIDs
  allow('pgrep -lf "ng serve"', linux); // en Linux -l es el nombre, con -f o sin él
  allow("pgrep -f 'node -l -a'", mac); // eso es el patrón, no opciones
  allow('ps -o pid=,ppid=,comm=', mac);
  allow('ps -p 89041 -o pid=,etime=,comm=', mac);
  allow('ps -o pid= -o comm= -p 89041', linux);
  allow('ps -p 89041', linux); // en Linux la columna por defecto es el nombre
  allow('ps -c -p 89041', mac); // -c: solo el ejecutable
  allow('pgrep -fl "ng serve" | wc -l', mac);
  allow('ps aux | grep -c node', mac);
  allow('ps aux | grep node | wc -l', mac);
  allow('pgrep -fl ng >/dev/null && echo vivo', mac);
  allow('ps -p 89041 > /dev/null 2>&1 || echo muerto', mac);
  allow('pgrep -f ng | xargs ps -o pid=,comm= -p', mac);
  allow('pgrep -fl "ng serve" # sc:ok', mac);
  // Vecinos que nombran `ps` o `pgrep` sin ejecutarlos, o que miran otra cosa.
  allow('man ps', mac);
  allow('echo "ps aux" > nota.txt', mac);
  allow("cat > nota.md <<'EOF'\npgrep -fl ng\nEOF", mac);
  allow('pkill -f "ng serve"', mac);
  allow('lsof -nP -iTCP -sTCP:LISTEN', mac);
});

// Medido el 2026-09-28 con un recuento que no imprime ningún valor (`printenv | grep -c
// '^CLAUDE_CODE_MESSAGING_TOKEN='` dio 1): el entorno de la herramienta Bash lleva un token de sesión,
// así que volcar el entorno ENTERO lo imprime en el transcript. En Linux (sesiones cloud),
// `/proc/<pid>/environ` es ese mismo entorno. Los volcados de bash y zsh se midieron con
// `env -i SC_FAKE_SECRET=xyz`. Las aserciones buscan la frase de ESTA regla: `#12` también es la de
// los ficheros de config y la de los procesos, y un rojo de otra no prueba nada de esta.
test('#12 entorno: el entorno entero a pantalla → deny; lanzar con env, una variable con nombre, solo nombres, contar o sc:ok → allow', () => {
  const ENTORNO = /LEARNINGS #12 — «.+» vuelca el entorno ENTERO/;
  // ROJO: los volcados de bash y zsh, con o sin ruta y detrás de lo que lanza otro comando.
  deny('env', verde, ENTORNO);
  deny('printenv', verde, ENTORNO);
  deny('export -p', verde, ENTORNO);
  deny('export', verde, ENTORNO);
  deny('declare -x', verde, ENTORNO);
  deny('declare -p', verde, ENTORNO);
  deny('typeset -x', verde, ENTORNO);
  deny('typeset', verde, ENTORNO);
  deny('set', verde, ENTORNO);
  deny('/usr/bin/env', verde, ENTORNO);
  deny('sudo env', verde, ENTORNO);
  deny('cd /tmp && env', verde, ENTORNO);
  deny('(cd /tmp && printenv)', verde, ENTORNO);
  deny('env -0', verde, ENTORNO);
  deny('env -u CLAUDE_CODE_MESSAGING_TOKEN', verde, ENTORNO); // quitar una no protege las demás
  // Un filtro que deja pasar la línea entera, o un trozo del valor, sigue imprimiéndolo. Los dos
  // primeros son reales: salieron al pasar por el hook los comandos de las sesiones anteriores.
  deny('env | grep -i cloudflare', verde, ENTORNO);
  deny('env | grep -i "^GIT" || echo "(sin variables GIT)"', verde, ENTORNO);
  deny('env | grep TOKEN', verde, ENTORNO);
  deny('printenv | sort | head -20', verde, ENTORNO);
  deny('set | grep -i token', verde, ENTORNO);
  deny('env | cut -d= -f2', verde, ENTORNO); // el campo 2 es el valor
  deny('env | cut -c1-40', verde, ENTORNO);
  deny("env | sed 's/=.*/=&/'", verde, ENTORNO); // `&` devuelve lo casado: el valor entero
  deny('env 2>/dev/null', verde, ENTORNO); // tira los errores, no la lista
  deny('env > entorno.txt', verde, ENTORNO); // un fichero lo imprime el siguiente `cat`, y el repo es público
  // `env` que lanza un volcado le pasa el entorno entero; `sh -c` lleva el comando dentro.
  deny('env FOO=1 printenv', verde, ENTORNO);
  deny("bash -c 'env | grep TOKEN'", verde, ENTORNO);
  deny("zsh -lc 'printenv'", verde, ENTORNO);
  // Linux: el entorno de un proceso, leído de /proc.
  deny('cat /proc/*/environ', verde, ENTORNO);
  deny("tr '\\0' '\\n' < /proc/1234/environ", verde, ENTORNO);
  deny('strings /proc/self/environ | grep KEY', verde, ENTORNO);
  // El motivo enseña las proyecciones que sí sirven.
  deny('env', verde, /printenv HOME/);
  deny('printenv', verde, /env \| cut -d= -f1/);
  deny('set', verde, /printenv \| grep -c/);

  // VERDE: `env` como lanzador de otro programa.
  allow('env VAR=x cmd');
  allow('env -i PATH=/usr/bin:/bin node scripts/x.mjs');
  allow('env NODE_OPTIONS=--max-old-space-size=4096 npx ng build');
  allow('env -u NODE_OPTIONS node scripts/x.mjs');
  // Con el entorno vaciado (`-i`) solo sale lo que ya va escrito en la línea: así se prueba con valores falsos.
  allow("env -i SC_FAKE_SECRET=xyz sh -c 'env'");
  allow('env -i SC_FAKE_SECRET=xyz /usr/bin/env');
  // Una variable por su nombre, solo los nombres, o un número.
  allow('printenv HOME');
  allow('printenv HOME PATH');
  allow('echo $HOME');
  allow('env | cut -d= -f1');
  allow('env | cut -f1 -d= | sort');
  allow("env | awk -F= '{print $1}'");
  allow("env | sed 's/=.*//'");
  allow('env | grep TOKEN | cut -d= -f1');
  // Enmascarar también vale: así miraban el entorno dos sesiones anteriores, y la primera versión de
  // la regla las denegaba.
  allow("env | grep -iE 'cloudflare|^CF_' | sed 's/=.*/=<set>/' || echo \"ninguna\"");
  allow('env | grep -iE "CLOUDFLARE|CF_API|WRANGLER" | sed -E \'s/=.*/=<set>/\' 2>&1');
  allow('env | wc -l');
  allow('printenv | grep -c CLAUDE_CODE_MESSAGING_TOKEN');
  allow('env | grep -q TOKEN && echo hay');
  allow('env > /dev/null 2>&1');
  allow("tr '\\0' '\\n' < /proc/1/environ | cut -d= -f1");
  // Asignar, pedir una con nombre o fijar opciones del shell no vuelca nada.
  allow('export FOO=bar');
  allow('export PATH=/opt/node/bin:$PATH; npm run lint');
  allow('export -p FOO');
  allow('declare -x FOO=1');
  allow('declare -p FOO');
  allow('declare -f');
  allow('typeset -x FOO=1');
  allow('set -o pipefail');
  allow('set -e');
  allow('set -- a b');
  allow('env # sc:ok');
  // Vecinos que nombran el entorno sin volcarlo.
  allow("cat > nota.md <<'EOF'\nenv | grep TOKEN\nprintenv\nEOF");
  allow('grep -rn "printenv" scripts/');
  allow('grep -rn "/proc/self/environ" scripts/');
  allow('ls -la /proc/1/environ');
  allow('npm run env');
  allow('which env');
  allow('man printenv');
  allow('compgen -e');
});

test('#12 base de diff: `main...rama` → deny; `main..rama` → allow', () => {
  deny('git diff main...feat/x --stat', verde, /base de fusión/);
  deny('git diff origin/main...HEAD', verde, /base de fusión/);
  allow('git diff main..feat/x --stat');
  allow('git diff origin/main..HEAD --name-only');
  allow('git log main...feat/x'); // en `log` los tres puntos son la diferencia simétrica: otra cosa
  allow('git diff main...feat/x # sc:ok');
});

test('#11 zsh: `for f in $VAR` → deny; enumerado, $(…) o ${=VAR} → allow', () => {
  deny('for f in $FILES; do sed -i "" "s/a/b/" "$f"; done', verde, /LEARNINGS #11/);
  deny('for f in "$LISTA"\ndo echo $f\ndone', verde, /LEARNINGS #11/);
  allow('for f in a.ts b.ts; do echo $f; done');
  allow('for f in $(grep -rl foo src); do echo $f; done && grep -rl foo src || echo ninguno');
  allow('for f in ${=FILES}; do echo $f; done');
  allow('for i in 1 2 3; do echo $i; done');
});

test('#5 build durante un preflight → deny; sin preflight vivo, o con sc:ok → allow', () => {
  const corriendo = { ...verde, preflightVivo: () => 43948 };
  const parado = { ...verde, preflightVivo: () => null };
  deny('npm run build:supervisor', corriendo, /LEARNINGS #5/);
  deny('npm run build', corriendo, /LEARNINGS #5/);
  deny('ng build sc-docs --configuration production', corriendo, /LEARNINGS #5/);
  allow('npm run build:supervisor', parado);
  allow('npm run build:supervisor # sc:ok', corriendo);
  // Vecinos legítimos: leer o servir no reescribe `dist/`.
  allow('node scripts/spa-server.mjs dist/supervisor/browser 4322', corriendo);
  allow('ls -d dist/*', corriendo);
});

/*
 * #5 — ¿de QUÉ árbol es el preflight vivo? Medido el 2026-09-28 en macOS: con el único preflight
 * vivo en OTRO worktree, `npm run build:supervisor` salía denegado en este. Tres fallos juntos:
 * `pgrep -af` no lista la línea de comandos en macOS (allí `-a` es «incluye a los antepasados») y
 * solo imprime PIDs; aun con ella, npm lo lanza con ruta RELATIVA y el árbol no sale en el texto; y
 * el patrón sin anclar casaba con cualquier shell que lo NOMBRARA. En los cuatro primeros, el
 * listado y el cwd de cada PID van inyectados: no dependen de lo que corra en la máquina.
 */
const ESTE = '/u/dev/smartcontact-ui/.claude/worktrees/magical-vaughan-5cf689';
const OTRO = '/u/dev/smartcontact-ui/.claude/worktrees/goofy-matsumoto-803f2a';
/** Las líneas que imprime `pgrep` y el cwd de cada PID, inyectados; un PID sin cwd legible no sale. */
const procesos = (lineas, cwdDe, cwd = ESTE) => ({
  ...verde,
  cwd,
  listarPreflights: () => lineas,
  cwdsDe: (pids) => new Map(pids.map((pid) => [pid, cwdDe(pid)]).filter(([, dir]) => dir)),
});

test('#5 preflight de OTRO árbol, tal cual lo lista `pgrep` en macOS (PIDs pelados) → allow', () => {
  allow('npm run build:supervisor', procesos(['43948'], (pid) => (pid === 43948 ? OTRO : null)));
});

test('#5 preflight de OTRO árbol con su línea de comandos: npm lo lanza con ruta relativa y el árbol no sale → allow', () => {
  allow('npm run build:supervisor', procesos(['43948 node scripts/preflight-scope.mjs --run'], () => OTRO));
});

test('#5 un cwd que no se puede leer (el proceso ya murió, o no es tuyo) no cuenta → allow', () => {
  allow('npm run build:supervisor', procesos(['43948'], () => null));
});

test('#5 preflight de ESTE árbol → deny con su pid; y el `cd <ruta> &&` manda sobre la sesión', () => {
  deny('npm run build:supervisor', procesos(['43948'], () => ESTE), /LEARNINGS #5/);
  // Con varios vivos, el motivo nombra el de este árbol: el pid es lo que deja comprobarlo.
  deny('ng build supervisor', procesos(['17655', '43948'], (pid) => (pid === 43948 ? ESTE : OTRO)), /pid 43948/);
  deny(`cd ${OTRO} && npm run build`, procesos(['17655'], () => OTRO), /LEARNINGS #5/);
});

/*
 * #5 — el preflight COMPLETO lanzado a mano (`npm run preflight`) no pasa nunca por
 * `preflight-scope.mjs`, así que el patrón del `node` no lo veía y un build a la vez salía permitido.
 * Medido el 2026-09-29 en macOS, en la cadena viva y en una réplica lanzada a mano: lo único que vive
 * de principio a fin es el `npm`, cuyo título es `npm run preflight` con el hueco del argv relleno de
 * espacios (con `$` solo no casa), y su `sh -c` hijo. El `npm` se queda en la carpeta desde la que se
 * lanzó (una subcarpeta, si fue desde ahí); el `sh -c` va a la raíz. `verify` ya reconstruye `dist/`,
 * así que la ventana es la cadena entera, no solo los builds de `en-paralelo.mjs`.
 *
 * Aquí `pgrep` se simula con el patrón del propio hook sobre líneas medidas: qué líneas cuentan. Con
 * qué casa el `pgrep` de verdad lo contesta la prueba con procesos de abajo.
 */
const tabla = (filas, cwd = ESTE) => ({
  ...verde,
  cwd,
  listarPreflights: () => filas.filter(([, linea]) => new RegExp(PREFLIGHT).test(linea)).map(([pid]) => String(pid)),
  cwdsDe: (pids) => new Map(filas.filter(([pid]) => pids.includes(pid)).map(([pid, , dir]) => [pid, dir])),
});
/** El envoltorio con el que la herramienta Bash corre un comando (medido): lo lleva en medio. */
const envoltorio = (cmd) =>
  `/bin/zsh -c -l setopt NO_EXTENDED_GLOB NO_BARE_GLOB_QUAL 2>/dev/null || true && eval '${cmd}' < /dev/null && pwd -P >| /tmp/claude-85dc-cwd`;

test('#5 `npm run preflight` a mano en ESTE árbol → deny, con el título tal cual lo da cada forma de lanzarlo', () => {
  deny('npm run build:supervisor', tabla([[19939, 'npm run preflight   ', ESTE]]), /pid 19939/); // macOS: relleno de espacios
  deny('npm run build:supervisor', tabla([[19939, 'npm run preflight', ESTE]]), /LEARNINGS #5/); // sin relleno
  deny('ng build supervisor', tabla([[19939, 'npm run preflight --foo     ', ESTE]]), /LEARNINGS #5/); // `npm run preflight -- --foo`
});

test('#5 `npm run preflight` de OTRO árbol, o un shell que solo lo NOMBRA → allow', () => {
  allow('npm run build:supervisor', tabla([[19939, 'npm run preflight   ', OTRO]]));
  // El envoltorio de la herramienta Bash y un bucle de espera llevan el texto, pero no empiezan por `npm`.
  allow('npm run build:supervisor', tabla([[31200, envoltorio('npm run preflight > /tmp/p.log 2>&1'), ESTE]]));
  allow('npm run build:supervisor', tabla([[31201, '/bin/sh -c while sleep 15; do :; done # espera a npm run preflight', ESTE]]));
  // Otro script que empieza igual no es la cadena completa.
  allow('npm run build:supervisor', tabla([[31202, 'npm run preflight-foo   ', ESTE]]));
});

// Con procesos PROPIOS de verdad, porque dos cosas solo las contesta el sistema: con qué casa el
// `pgrep` real (el de macOS no entiende `\S`: el patrón que lo usaba perdía el `node` con ruta
// absoluta) y qué cwd devuelven `lsof` y `/proc`. Cada árbol es una carpeta temporal: los
// preflights de otros worktrees de la máquina tienen otro cwd y no cambian nada. Y los falsos
// viven lo justo, porque las esperas de otras sesiones SÍ los ven como preflights.
const FALSO = `// Se va solo si quien lo lanzó muere (un test cortado), y al minuto pase lo que pase.
const padre = process.ppid;
setInterval(() => process.ppid !== padre && process.exit(0), 250);
setTimeout(() => process.exit(0), 60_000);
console.log('listo');
`;
const ESPERA_QUE_LO_NOMBRA =
  'echo listo; n=0; while [ $n -lt 60 ] && kill -0 $PPID 2>/dev/null; do sleep 1; n=$((n+1)); done # espera a node scripts/preflight-scope.mjs --run';
/** El `npm` de un `npm run preflight` lanzado a mano: npm pone su título por el mismo `process.title`. */
const FALSO_NPM = `process.title = 'npm run preflight';\n${FALSO}`;
const ESPERA_QUE_NOMBRA_NPM = ESPERA_QUE_LO_NOMBRA.replace(/# espera a .*/, '# espera a npm run preflight');

test('#5 con procesos de verdad: `npm run preflight` cuenta por el título del `npm` y su cwd, no el shell que lo nombra', { timeout: 30_000 }, async (t) => {
  if (spawnSync('pgrep', ['-f', 'x^']).error) return t.skip('sin `pgrep` en esta máquina');
  const base = mkdtempSync(join(tmpdir(), 'bash-guard-npm-'));
  const arbol = (nombre) => {
    const dir = join(base, nombre);
    mkdirSync(join(dir, 'projects', 'supervisor'), { recursive: true });
    writeFileSync(join(dir, '.git'), 'gitdir: x\n');
    writeFileSync(join(dir, 'falso-npm.mjs'), FALSO_NPM);
    return dir;
  };
  const [conNpm, conEspera, vacio] = ['npm', 'espera', 'vacio'].map(arbol);
  const lanza = (cmd, args, opciones) => spawn(cmd, args, { ...opciones, stdio: ['ignore', 'pipe', 'ignore'] });
  const hijos = [
    // Lanzado desde una subcarpeta (medido): el `npm` se queda en ella, no sube a la raíz.
    lanza(process.execPath, [join(conNpm, 'falso-npm.mjs')], { cwd: join(conNpm, 'projects', 'supervisor') }),
    lanza('/bin/sh', ['-c', ESPERA_QUE_NOMBRA_NPM], { cwd: conEspera }),
  ];
  try {
    await Promise.all(hijos.map((h) => new Promise((listo, fallo) => (h.stdout.once('data', listo), h.once('error', fallo)))));
    const decide = (cwd) => evaluar('npm run build:supervisor', { ...verde, cwd, listarPreflights: undefined });
    const r = decide(conNpm);
    assert.equal(r.decision, 'deny', 'el `npm run preflight` de este árbol');
    assert.match(r.reason, new RegExp(`pid ${hijos[0].pid}\\b`), 'y el pid es el del `npm`');
    assert.equal(decide(join(conNpm, 'projects', 'supervisor')).decision, 'deny', 'desde la subcarpeta donde vive');
    assert.equal(decide(conEspera).decision, 'allow', 'un shell que solo nombra `npm run preflight`');
    assert.equal(decide(vacio).decision, 'allow', 'un árbol sin preflight');
  } finally {
    for (const h of hijos) h.kill();
    rmSync(base, { recursive: true, force: true });
  }
});

test('#5 con procesos de verdad: cuenta el `node` del preflight por su cwd, no el shell que lo nombra', { timeout: 30_000 }, async (t) => {
  if (spawnSync('pgrep', ['-f', 'x^']).error) return t.skip('sin `pgrep` en esta máquina');
  const base = mkdtempSync(join(tmpdir(), 'bash-guard-'));
  const arbol = (nombre) => {
    const dir = join(base, nombre);
    mkdirSync(join(dir, 'scripts'), { recursive: true });
    mkdirSync(join(dir, 'projects', 'supervisor'), { recursive: true });
    writeFileSync(join(dir, '.git'), 'gitdir: x\n'); // un worktree lleva `.git` como FICHERO
    writeFileSync(join(dir, 'scripts', 'preflight-scope.mjs'), FALSO);
    return dir;
  };
  const [conNpm, conRuta, conEspera, vacio] = ['npm', 'ruta', 'espera', 'vacio'].map(arbol);
  const lanza = (cmd, args, opciones) => spawn(cmd, args, { ...opciones, stdio: ['ignore', 'pipe', 'ignore'] });
  const hijos = [
    // Como lo deja npm (medido): `node` suelto, el script con ruta RELATIVA y el cwd en el árbol.
    lanza(process.execPath, ['scripts/preflight-scope.mjs', '--run'], { cwd: conNpm, argv0: 'node' }),
    lanza(process.execPath, ['scripts/preflight-scope.mjs', '--run'], { cwd: conRuta }),
    // Un shell que solo NOMBRA al preflight, como el bucle que espera a que acabe.
    lanza('/bin/sh', ['-c', ESPERA_QUE_LO_NOMBRA], { cwd: conEspera }),
  ];
  try {
    await Promise.all(hijos.map((h) => new Promise((listo, fallo) => (h.stdout.once('data', listo), h.once('error', fallo)))));
    const decide = (cwd) => evaluar('npm run build:supervisor', { ...verde, cwd, listarPreflights: undefined }).decision;
    assert.equal(decide(conNpm), 'deny', 'el preflight tal cual lo lanza npm');
    assert.equal(decide(conRuta), 'deny', '`node` con ruta absoluta');
    // Desde una subcarpeta, npm sube hasta su `package.json` y reescribe el mismo `dist/`.
    assert.equal(decide(join(conNpm, 'projects', 'supervisor')), 'deny', 'desde una subcarpeta de su árbol');
    assert.equal(decide(conEspera), 'allow', 'un shell que solo nombra al preflight');
    assert.equal(decide(vacio), 'allow', 'un árbol sin preflight');
    // La carrera corriente: uno acabó entre el `pgrep` y el `lsof`. `lsof` sale con 1 e imprime
    // solo el vivo, y ese sigue contando.
    const muerto = spawnSync(process.execPath, ['-e', '']).pid;
    const lista = () => [String(muerto), String(hijos[0].pid)];
    const r = evaluar('npm run build:supervisor', { ...verde, cwd: conNpm, listarPreflights: lista });
    assert.match(r.reason, new RegExp(`pid ${hijos[0].pid}\\b`), 'un PID muerto en el lote no tapa al vivo');
  } finally {
    for (const h of hijos) h.kill();
    rmSync(base, { recursive: true, force: true });
  }
});

test('#5 Playwright con el DS editado después del último `dist/` → deny; con dist al día, sin e2e o sc:ok → allow', () => {
  const rancio = { ...verde, distRancio: () => 'projects/ui-smartcontact/src/lib/theme/sc-preset/index.ts' };
  const alDia = { ...verde, distRancio: () => null };
  deny('npx playwright test e2e/components.spec.ts -g "MVP" --reporter=line', rancio, /LEARNINGS #5/);
  deny('SC_SUPERVISOR_URL=http://localhost:4417 npx playwright test -c playwright.supervisor.config.ts theme-contrast', rancio, /dist/);
  deny('npm run e2e:visual', rancio, /build:components/);
  allow('npx playwright test e2e/components.spec.ts', alDia);
  allow('npx playwright test e2e/components.spec.ts # sc:ok', rancio);
  // Vecinos: leer el informe, construir o servir no miden nada.
  allow('npx playwright show-report', rancio);
  allow('npm run build:components', { ...rancio, preflightVivo: () => false });
  allow('npx ng serve supervisor --port 4417', rancio);
});

test('#11 formateador ajeno: `prettier --write` sin config del repo → deny; con config, `--check` o sc:ok → allow', () => {
  const sinConfig = { ...verde, usaPrettier: () => false };
  const conConfig = { ...verde, usaPrettier: () => true };
  deny('npx prettier --write projects/supervisor/src/app/x.component.html', sinConfig, /NO adopta prettier/);
  deny('prettier -w e2e/supervisor/x.spec.ts', sinConfig, /LEARNINGS #11/);
  // El día que el repo adopte prettier, el guardián se calla solo: mira, no asume.
  allow('npx prettier --write projects/supervisor/src/app/x.component.html', conConfig);
  // `--check` no escribe: es justo lo que sí sirve para mirar si algo está fuera de estilo.
  allow('npx prettier --check projects/supervisor/src/app/x.component.html', sinConfig);
  allow('npx prettier --write x.html # sc:ok', sinConfig);
  // Y no confunde a otros comandos que nombran el fichero.
  allow('grep -rn "prettier --write" docs/', sinConfig);
});

test('portada pública: un nombre o atribución en un PR o commit → deny; resumen sin destinatario → allow', () => {
  // El caso real: la portada del #167, con el cuerpo en un heredoc como lo escribe una sesión.
  const pr = (cuerpo) => `gh pr create --title "x" --body "$(cat <<'EOF'\n${cuerpo}\nEOF\n)"`;
  const commit = (cuerpo) => `git commit -m "$(cat <<'EOF'\n${cuerpo}\nEOF\n)"`;
  deny(pr('**Para Rafa, en llano:** en Agentes la página ya no hace scroll.'), verde, /nombre de una persona/);
  // Desde el 2026-09-24, el nombre en cualquier parte del cuerpo: el «Por qué» de 28 de los 60
  // commits anteriores contaba quién lo había pedido en vez del criterio.
  deny(commit('fix: x\n\n**Por qué.** Esto lo pidió Rafa (2026-09-23).'), verde, /nombre de una persona/);
  // Un identificador de demo o una ruta no son el nombre como palabra: pasan.
  allow(commit('fix: el perfil Rafael_3AED firma la tabla\n\nMedido en /Users/rafareses/dev.'));
  deny(pr('## Qué cambia\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)'), verde, /Generated with/);
  deny(pr('Resumen.\n\nhttps://claude.ai/code/session_01TAvmx7HBGPN4hitHprrhqp'), verde, /enlace a la sesión/);
  deny("git commit -m \"$(cat <<'EOF'\nfix: x\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>\nEOF\n)\"", verde, /co-autor/);
  deny('gh pr edit 167 --body "Para Rafa en llano: algo"', verde, /Portada pública/);
  allow(pr('**En resumen:** en Agentes la página ya no hace scroll.'));
  // La rama lleva el alias del autor como prefijo (lo pone la app al crear la caja): es un ref, no
  // una firma. Denegarlo tumbó el `gh pr create --head` del #269. En la prosa, sigue cayendo.
  const RAMA = 'areses/frosty-lichterman-93fcb6';
  const alias = RAMA.split('/')[0];
  allow(`gh pr create --base main --head ${RAMA} --title "x" --body-file c.md`);
  deny(`gh pr create --head ${RAMA} --title "fix: lo revisó ${alias}"`, verde, /nombre de una persona/);
  deny(pr(`Rama ${RAMA}.\n\n**Para Rafa:** algo`), verde, /nombre de una persona/);
  allow("git commit -m \"$(cat <<'EOF'\nfix: x\n\nCo-authored-by: x <x@y.z>\nEOF\n)\""); // un co-autor humano no es atribución
  // Vecinos legítimos: leer o buscar el texto no es publicarlo, y citarlo a propósito tiene salida.
  allow('gh pr view 167 --json body | grep -c "Para Rafa, en llano"');
  allow('git log --grep "claude.ai/code/session_" --oneline');
  allow('git commit -m "docs: la portada ya no lleva Generated with Claude Code" # sc:ok');
});

test('prosa y heredocs no son comandos: los dos falsos positivos reales del primer día', () => {
  allow("printf '\\n# la lee el hook de git push.\\n' >> .gitignore", rojo);
  allow("python3 - <<'EOF'\ns = s + ' && npm run lint'\nopen(p,'w').write(s)\nEOF\ngrep -n lint scripts/x.mjs", verde);
  allow('cat <<EOF > nota.txt\ngit push origin main\nEOF', rojo);
  allow('echo "npm run verify" > recordatorio.txt');
});

test('un comando corriente pasa sin ruido', () => {
  allow('ls -la');
  allow('git status -sb');
  allow('npm run tokens:gen');
  allow('npx ng build supervisor --configuration production');
  allow('gh run list --branch main --workflow ci --limit 1 --json headSha,conclusion');
});

// Una denegación tira el comando ENTERO, así que un `cat > fichero <<'EOF'` que viajaba con el
// gate NO llega a escribirse. Pasó tres veces el 2026-09-09 y una dejó `deploy-record.yml` sin
// crear: nadie se enteró hasta que `docs:guard` vio el enlace roto. El hook no puede salvar la
// escritura, pero el motivo tiene que NOMBRARLA.
test('una denegación avisa de los ficheros que el mismo comando iba a escribir', () => {
  const r = evaluar("cat > .github/workflows/x.yml <<'EOF'\nname: x\nEOF\nnpm run test:unit | tail -5");
  assert.equal(r.decision, 'deny');
  assert.match(r.reason, /también escribía \.github\/workflows\/x\.yml/);
  assert.match(r.reason, /NO se ha escrito/);
});

test('sin escrituras, el motivo no gana ruido', () => {
  const r = evaluar('npm run verify | tail -5');
  assert.equal(r.decision, 'deny');
  assert.doesNotMatch(r.reason, /también escribía/);
});

/*
 * #5 — un bucle de espera cuyo `pgrep -f` casa con la línea de comandos de un SHELL no termina
 * nunca, y el síntoma miente del todo: parece que la otra sesión no acaba, y la máquina lleva
 * rato libre. El 2026-09-12 costó tres esperas muertas seguidas (una la mató el sistema por
 * memoria) con varias cajas trabajando a la vez.
 *
 * ⚠️ La regla se estrenó DENEGÁNDOSE A SÍ MISMA: el comando que escribía este test llevaba el
 * bucle dentro de un heredoc, y un heredoc es texto, no un comando. Por eso mira el texto sin
 * heredocs, y por eso el patrón se compone aquí en vez de escribirse entero.
 */
const PATRON_ESPERA = ['pre' + 'flight', 'scope'].join('-');

test('#5 espera que se casa sola: el patrón también fuera del `pgrep` → deny', () => {
  const r = evaluar(`until ! pgrep -f "${PATRON_ESPERA}" >/dev/null; do sleep 20; done; echo ${PATRON_ESPERA}`, {
    cwd: '/tmp',
  });
  assert.equal(r.decision, 'deny');
  assert.match(r.reason, /se encuentra a SÍ MISMO/);
});

// ROJO que motivó el arreglo (2026-09-28, macOS): pgrep se salta a sí mismo y a sus antepasados, así
// que un bucle solo no se ve; pero DOS a la vez ven cada uno el shell del otro y ninguno acaba. El
// patrón era el que el motivo de este mismo hook recomendaba, «apunta al proceso», sin anclar.
test('#5 espera con `pgrep -f` sin anclar → deny, y el motivo enseña a anclar con `^`', () => {
  const bucle = 'until ! pgrep -f "node scripts/x.mjs"; do sleep 5; done';
  deny(bucle, verde, /LEARNINGS #5/);
  const r = evaluar(bucle, verde);
  assert.match(r.reason, /pgrep -f "\^node scripts\/preflight-scope\.mjs"/, 'el motivo tiene que dar la forma ANCLADA');
  assert.doesNotMatch(r.reason, /pgrep -f "node /, 'ni recomendar la forma sin anclar, que era una de estas esperas');
  assert.doesNotMatch(r.reason, /grep -v \$\$/, 'ni `grep -v $$`: quita tu shell, no el de la espera hermana');
  assert.doesNotMatch(r.reason, /pgrep -(fl|lf)\b/, 'ni `pgrep -fl`, que la regla #12 de procesos deniega en macOS');
  // El comando de ese día, tal cual lo daba el motivo del hook.
  deny(`until ! pgrep -f "node scripts/${PATRON_ESPERA}.mjs" >/dev/null; do sleep 15; done; echo listo`, verde, /SIN ANCLAR/);
  // `-f` dentro de un racimo de flags, y el `pgrep` en el cuerpo del bucle en vez de en la condición.
  deny('while pgrep -fl "node scripts/x.mjs" >/dev/null; do sleep 5; done', verde, /LEARNINGS #5/);
  deny('while true; do pgrep -f node >/dev/null || break; sleep 5; done', verde, /«node»/);
});

test('#5 y sus vecinos legítimos pasan: ancla, `-x`, `pgrep` suelto, texto que lo nombra y heredoc', () => {
  // El ancla: la línea de un shell empieza por `/bin/zsh`, nunca por `node`.
  allow('until ! pgrep -f "^node scripts/x.mjs"; do sleep 5; done');
  allow(`until ! pgrep -f '^node scripts/${PATRON_ESPERA}.mjs' >/dev/null; do sleep 20; done`);
  // `-x` exige la línea EXACTA: tampoco casa con un shell.
  allow('until ! pgrep -xf "node scripts/x.mjs --run"; do sleep 5; done');
  // Sin bucle no se espera a nada, aunque el patrón vaya sin anclar.
  allow('pgrep -f "node scripts/x.mjs"');
  allow(`pgrep -f ${PATRON_ESPERA} && echo ${PATRON_ESPERA}`);
  // Mirar qué casa ANTES del bucle es lo que pide el motivo: ese `pgrep` no espera a nada.
  allow('pgrep -f "^node scripts/x.mjs"; until ! pgrep -f "^node scripts/x.mjs"; do sleep 5; done');
  // Buscar la frase no es ejecutarla.
  allow(`grep -rn 'until ! pgrep -f "node scripts' docs/`);
  // Un patrón en una variable no se lee desde aquí: no se opina.
  allow('until ! pgrep -f "$PATRON"; do sleep 5; done');
  // Escribir un fichero que HABLA del bucle no es ejecutarlo — el falso positivo que se cazó solo.
  allow(`cat > t.mjs <<'EOF'\nuntil ! pgrep -f "${PATRON_ESPERA}"; do sleep 1; done\nEOF`);
  allow('until ! pgrep -f "node scripts/x.mjs"; do sleep 5; done # sc:ok');
});

test('escrituras(): cuenta las de verdad e ignora /dev, /tmp y los descriptores', () => {
  assert.deepEqual(escrituras('npm run verify > /tmp/x.log 2>&1'), []);
  assert.deepEqual(escrituras('cmd 2>/dev/null'), []);
  assert.deepEqual(escrituras('npm run build > salida.log 2>&1'), ['salida.log']);
  assert.deepEqual(escrituras("cat > a.txt <<'EOF'\n> esto es texto del heredoc\nEOF"), ['a.txt']);
});

// ROJO que motivó el arreglo (2026-09-20): el splitter no honraba la barra invertida, así que una
// comilla doble ESCAPADA dentro de otra cerraba el entrecomillado, y a partir de ahí el DATO se
// leía como comandos. Un `node -e` cuyo texto citaba un patrón con «git push» dentro se denegó como
// si fuera un push, y mandó a repetir un preflight que no hacía falta.
test('segmentos: una comilla escapada no abre la veda dentro de una cadena', () => {
  const cmd = [
    'node -e "',
    '  const casos = [',
    '    [\'grep -E \\"a|b|git push|c\\" fichero.yml\', false],',
    '  ];',
    '"',
  ].join('\n');
  assert.match(cmd, /\\"a\|b\|git push/, 'el caso debe llevar la comilla ESCAPADA, que es lo que rompía');
  const r = evaluar(cmd, { cwd: process.cwd() });
  assert.notEqual(r.decision, 'deny', 'el patrón entrecomillado es un DATO, no un push');
});

// 2026-09-27: `cd <worktree> && git push` y `cd <worktree> && npx playwright test` se juzgaban contra
// el árbol de la SESIÓN, y se denegaron con la marca y el `dist/` del worktree al día.
test('carpeta del comando: `cd <ruta> &&` manda sobre el cwd de la sesión; con variables, manda la sesión', () => {
  const soloElWorktree = {
    ...verde,
    cwd: '/repo',
    preflight: (dir) => ({ ok: dir === '/wt', motivo: 'no hay marca' }),
    distRancio: (dir) => (dir === '/wt' ? null : 'projects/ui-smartcontact/src/lib/x.scss'),
  };
  // ROJO de antes, VERDE ahora: los dos comandos de ese día.
  allow('cd /wt && git push -u origin HEAD:rama', soloElWorktree);
  allow('export PATH=/opt/node/bin:$PATH; cd /wt && npx playwright test -c x.config.ts', soloElWorktree);
  // Sin `cd`, o con uno que no se puede resolver, sigue mandando el árbol de la sesión.
  deny('git push -u origin rama', soloElWorktree, /LEARNINGS #7/);
  deny('cd $WT && git push', soloElWorktree, /LEARNINGS #7/);
  deny('npx playwright test', soloElWorktree, /LEARNINGS #5/);
  assert.equal(carpetaEfectiva('cd sub && ls', '/repo'), '/repo/sub');
  assert.equal(carpetaEfectiva('ls && cd /otra', '/repo'), '/repo', 'un cd DETRÁS no cambia dónde corre lo de delante');
});

// 2026-10-01: una sesión de este repo también empuja OTROS repositorios (`cd <otro> && git push`), y
// ahí la regla pedía una marca que solo escribe la cadena de ESTE: no se podía cumplir nunca, y la
// única salida era `# sc:ok`. Va sin `usaPreflight` inyectado, porque lo que se prueba es cómo
// reconoce el hook, en el DISCO, un árbol de este repo. `RAIZ` es el checkout que corre el test.
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Dentro de un hook de git, `GIT_DIR` apunta al repositorio de verdad: el `git init` va sin él.
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

test('#7 push en un repositorio sin la cadena de preflight → allow; en un árbol de este repo sin marca → deny', () => {
  const base = mkdtempSync(join(tmpdir(), 'bash-guard-push-'));
  const enDisco = { sinIndexar: () => [], distRancio: () => null, listarPreflights: () => [] };
  try {
    // Un repositorio recién creado: ni `scripts/preflight-mark.mjs` ni marca.
    const otro = join(base, 'otro');
    mkdirSync(otro);
    spawnSync('git', ['init', '-q'], { cwd: otro, env: SIN_GIT });
    // VERDE, y rojo hasta este cambio: el push de ese día desde una sesión de este repo, el cierre
    // entero (añadir, commitear y empujar) y una sesión abierta en el otro repositorio.
    allow(`cd "${otro}" && git push`, { ...enDisco, cwd: RAIZ });
    allow(`cd "${otro}" && git add notas.md && git commit -m "notas" -- notas.md && git push`, { ...enDisco, cwd: RAIZ });
    allow('git push', { ...enDisco, cwd: otro });

    // ROJO: un árbol de este repo sin marca. El checkout de verdad, desde su raíz y desde una
    // subcarpeta, con la marca contestada «no» (la suya depende de la última cadena)…
    const sinMarca = { ...enDisco, cwd: otro, preflight: rojo.preflight };
    deny(`cd "${RAIZ}" && git push`, sinMarca, /LEARNINGS #7/);
    deny(`cd "${join(RAIZ, 'projects', 'supervisor')}" && git push -u origin HEAD`, sinMarca, /LEARNINGS #7/);
    // …y uno montado como un worktree (`.git` FICHERO y el script de la marca), sin marca y con la
    // lectura de la marca de verdad.
    const arbol = join(base, 'worktree');
    mkdirSync(join(arbol, 'scripts'), { recursive: true });
    writeFileSync(join(arbol, '.git'), 'gitdir: x\n');
    writeFileSync(join(arbol, 'scripts', 'preflight-mark.mjs'), '');
    deny(`cd "${arbol}" && git push`, { ...enDisco, cwd: otro }, /LEARNINGS #7 — .*no hay marca de preflight/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

/** Este repo (con el script que escribe la marca, que es lo que mira `usaPreflight`), un worktree suyo y otro
 *  repo ajeno, de verdad en el disco; y el `ctx` de una sesión abierta en este, con la marca contestada «no». */
function reposDePrueba(t) {
  const raiz = realpathSync(mkdtempSync(join(tmpdir(), 'bash-guard-repos-')));
  t.after(() => rmSync(raiz, { recursive: true, force: true }));
  const git = (cwd, ...args) =>
    spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd, env: SIN_GIT, encoding: 'utf8' });
  const propio = join(raiz, 'propio');
  const otro = join(raiz, 'otro');
  const wt = join(raiz, 'wt');
  for (const d of [propio, otro]) {
    mkdirSync(join(d, 'sub'), { recursive: true });
    git(d, 'init', '-q');
  }
  mkdirSync(join(propio, 'scripts'));
  writeFileSync(join(propio, 'scripts', 'preflight-mark.mjs'), '');
  git(propio, 'add', '-A');
  git(propio, 'commit', '-q', '-m', 'x');
  assert.equal(git(propio, 'worktree', 'add', '-q', wt, '-b', 'rama').status, 0, 'el worktree de este repo debe existir');
  const ctx = { sinIndexar: () => [], distRancio: () => null, listarPreflights: () => [], preflight: rojo.preflight, cwd: propio };
  return { raiz, propio, otro, wt, ctx };
}

// 2026-10-01: `false && cd <otro repo> && git push` se denegó con el motivo de #7 aunque el push era de OTRO
// repositorio, y un subagente que barría el cuaderno privado del autor se quedó con sus commits sin subir.
// #301 arregló el cierre que corría de verdad (`cd <otro> && … && git push`), pero `carpetaEfectiva` solo
// sigue los `cd` que ABREN el comando: con algo delante (`false &&`, `git add -A &&`), dentro de un `( … )`,
// o tras empujar al otro repo, el push se juzgaba en la carpeta de la sesión. Con repos de verdad: este (con
// el script de la marca, que es lo que mira `usaPreflight`), un worktree suyo y otro ajeno.
test('#7 cada push se juzga en la carpeta de SU segmento: un `cd` que no abre el comando, un subshell o la vuelta a este repo', (t) => {
  const { propio, otro, wt, ctx } = reposDePrueba(t);
  // ROJO de antes, VERDE ahora: el comando del informe y sus parientes (algo delante del `cd`, o un subshell).
  allow(`false && cd ${otro} && git push`, ctx);
  allow(`git add -A && cd ${otro} && git push`, ctx);
  allow(`git status; cd ${otro}/sub; git push origin main`, ctx);
  allow(`(cd ${otro} && git push) && echo hecho`, ctx);
  // Lo de este repo sigue exigiendo marca: su worktree, con o sin algo delante del `cd`.
  deny(`false && cd ${wt} && git push`, ctx, /LEARNINGS #7/);
  deny(`git fetch && cd ${wt} && git push`, ctx, /LEARNINGS #7/);
  // ROJO de antes, y era un hueco: cada push cuenta en SU carpeta, y el que vuelve a este repo no se cuela.
  deny(`cd ${otro} && git push && cd ${propio} && git push`, ctx, /LEARNINGS #7/);
  // Un `cd` que no se sabe adónde va (variable) puede ser este repo, venga uno de donde venga.
  deny('cd $CUADERNO && git push', ctx, /LEARNINGS #7/);
  deny(`cd ${otro} && cd $DESTINO && git push`, ctx, /LEARNINGS #7/);
  // El `cd` de un subshell no sale de él: el push de después corre aquí.
  deny(`(cd ${otro} && git push); git push`, ctx, /LEARNINGS #7/);
  // Salida explícita; y con la marca en verde, tampoco se deniega.
  allow(`cd ${propio} && git push # sc:ok`, ctx);
  allow(`cd ${propio} && git push`, { ...ctx, preflight: verde.preflight });
});

// 2026-10-04: `git -C <ruta> push` no empieza por `git push`, así que el guardián no lo reconocía como un
// push: el del informe (`git -C <otro repo> push`) pasaba solo por eso, y el de ESTE repo con `-C` se
// colaba sin marca (medido sobre main con repos reales). `-C` es el `cd` de git: la ruta cuenta desde la
// carpeta del segmento, y varios `-C` encadenan.
test('#7 `git -C <ruta> push` se juzga en su ruta: la de otro repo pasa; la de este, o una que no se sabe, pide marca', (t) => {
  const { raiz, propio, otro, wt, ctx } = reposDePrueba(t);
  // VERDE: el repo ajeno, con la sesión en este, con `-C` sobre un `cd`, entrecomillado, o desde una subcarpeta.
  allow(`git -C ${otro} push`, ctx);
  allow(`git -C ${otro}/sub push origin main`, ctx);
  allow(`git -C "${otro}" push`, ctx);
  allow(`cd ${propio} && git -C ${otro} push`, ctx);
  allow(`cd ${raiz} && git -C otro push`, ctx); // la ruta relativa cuenta desde la carpeta del segmento
  allow(`git -C ${otro} push`, { ...ctx, cwd: otro });
  // ROJO de antes, y era un hueco: el push de este repo, de su worktree o de una subcarpeta, desde donde sea.
  deny(`git -C ${propio} push`, ctx, /LEARNINGS #7/);
  deny(`git -C ${propio} push`, { ...ctx, cwd: otro }, /LEARNINGS #7/);
  deny(`git -C ${wt} push -u origin HEAD`, ctx, /LEARNINGS #7/);
  deny(`git -C ${propio}/sub push`, { ...ctx, cwd: otro }, /LEARNINGS #7/);
  deny(`cd ${otro} && git -C ${propio} push`, ctx, /LEARNINGS #7/);
  deny(`cd ${raiz} && git -C propio push`, { ...ctx, cwd: otro }, /LEARNINGS #7/);
  deny(`git -C ${otro} -C ../propio push`, { ...ctx, cwd: otro }, /LEARNINGS #7/); // varios `-C` encadenan
  // Un `-c clave=valor` delante tampoco quita que sea un push.
  deny('git -c http.extraheader=x push', ctx, /LEARNINGS #7/);
  allow('git -c http.extraheader=x push', { ...ctx, cwd: otro });
  // Una ruta que no se sabe adónde va manda la sesión, venga de donde venga.
  deny('git -C $CUADERNO push', ctx, /LEARNINGS #7/);
  deny(`cd ${otro} && git -C $DESTINO push`, ctx, /LEARNINGS #7/);
  // Lo que ya no era un push de commits sigue sin serlo, con `-C` o sin él; y la salida explícita.
  allow(`git -C ${propio} push --dry-run`, ctx);
  allow(`git -C ${propio} push origin --delete rama-vieja`, ctx);
  allow(`git -C ${propio} status`, ctx);
  allow(`git -C ${propio} log --oneline`, ctx);
  allow(`git -C ${propio} push # sc:ok`, ctx);
  allow(`git -C ${propio} push`, { ...ctx, preflight: verde.preflight });
});

test('#21 sacar la rama de otra sesión para trabajar en ella → deny; desde main, un fichero suelto o sc:ok → allow', () => {
  // ROJO: los dos comandos de ese día, sobre ramas cuya sesión seguía viva en la nube.
  deny('git checkout -q -b pr-256 origin/feat/indice-unico', verde, /LEARNINGS #21/);
  deny('git worktree add -q -b adapt-257 ../w257 origin/claude/ui-improvement-reddit-iykxgx', verde, /list_sessions/);
  deny('git switch -c revisar origin/feat/otra', verde, /LEARNINGS #21/);
  deny('git checkout --track origin/feat/otra', verde, /origin\/feat\/otra/);
  // VERDE: partir de main es lo normal; leer un fichero de otra rama o fundirla no es trabajar en ella.
  allow('git checkout -q -B claude/mi-rama origin/main');
  allow('git switch -c nueva origin/main');
  allow('git worktree add ../wt origin/main');
  allow('git checkout origin/feat/otra -- docs/DECISIONS.md');
  allow('git merge --no-ff origin/feat/otra');
  allow('git checkout -q -b pr-256 origin/feat/indice-unico # sc:ok');
});
