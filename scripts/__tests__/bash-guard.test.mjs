import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { carpetaEfectiva, evaluar, escrituras } from '../hooks/bash-guard.mjs';

// Cada patrón del hook se prueba EN ROJO (el comando que motivó la regla) y EN VERDE (la forma
// correcta y los vecinos legítimos). Un guardián que solo se ha visto pasar no prueba que sepa
// fallar, y uno con falsos positivos enseña a ignorarlo (LEARNINGS 2).

// `distRancio: () => null` en los tres: sin él, el test lee el `dist/` REAL de la máquina, y basta con
// editar una fuente del DS sin reconstruir para que `npm run e2e` salga denegado y el test rojo
// (2026-09-24, en mitad de un preflight). El caso rancio se prueba aparte, inyectado. Por lo mismo,
// `listarPreflights: () => []`: sin él, un build en un test lee los procesos vivos de la máquina.
const verde = { preflight: () => ({ ok: true, motivo: 'ok' }), sinIndexar: () => [], distRancio: () => null, listarPreflights: () => [] };
const rojo = { preflight: () => ({ ok: false, motivo: 'no hay marca' }), sinIndexar: () => [], distRancio: () => null, listarPreflights: () => [] };
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
  allow('pgrep -fl "node scripts/x.mjs"; until ! pgrep -f "^node scripts/x.mjs"; do sleep 5; done');
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
