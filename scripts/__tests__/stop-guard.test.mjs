import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  actosBash,
  comandosBash,
  estadoDelArbol,
  fallosDelParte,
  fallosDeSeguridad,
  invocoReflect,
  motivoParteDeCierre,
  motivoSinEnrutar,
  necesitaVeredicto,
  pantallasSinRevisar,
  ultimoMensaje,
} from '../hooks/stop-guard.mjs';
import { enrutar, pendientes, registrar, rutaRegistro } from '../hooks/correction-capture.mjs';

const ev = (cmd) =>
  JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'x', name: 'Bash', input: { command: cmd } }] } });

test('comandosBash: saca los comandos Bash del jsonl en orden e ignora el resto', () => {
  const jsonl = [ev('git status'), '{"type":"user","message":{"content":"hola"}}', 'basura no json', ev('git push')].join('\n');
  assert.deepEqual(comandosBash(jsonl), ['git status', 'git push']);
});

test('necesitaVeredicto: push sin lectura del CI después → true', () => {
  assert.equal(necesitaVeredicto(['npm run preflight', 'git push origin main']), true);
  assert.equal(necesitaVeredicto(['git push', 'npm run ci:verdict', 'git commit -m x', 'git push origin main']), true);
});

test('necesitaVeredicto: leer el CI por el PR cuenta igual que leerlo por el run', () => {
  // El patrón se quedó corto y bloqueó un cierre con el CI ya leído (2026-09-10): `gh pr checks`
  // es la MISMA lectura, por el PR en vez de por el run.
  assert.equal(necesitaVeredicto(['git push origin main', 'gh pr checks 99']), false);
  assert.equal(necesitaVeredicto(['git push origin main', 'gh pr checks 99 --watch --fail-fast']), false);
  assert.equal(necesitaVeredicto(['git push origin main', 'gh pr view 99']), true, 'ver el PR no es leer sus checks');
});

test('necesitaVeredicto: push seguido de ci:verdict o gh run → false', () => {
  assert.equal(necesitaVeredicto(['git push origin main', 'npm run ci:verdict']), false);
  assert.equal(necesitaVeredicto(['git push', 'gh run list --branch main --workflow ci --limit 1 --json conclusion']), false);
  assert.equal(necesitaVeredicto(['git push', 'sleep 60', 'gh run view 123 --log-failed']), false);
});

test('necesitaVeredicto: sin push, o solo tags/borrados → false', () => {
  assert.equal(necesitaVeredicto(['git status', 'npm run verify']), false);
  assert.equal(necesitaVeredicto(['git push origin archive/x']), false);
  assert.equal(necesitaVeredicto(['git push --tags', 'git push origin --delete rama']), false);
});

// ROJO que motivó la pieza (2026-09-20): la detección era `/\bgit\s+push\b/` sobre el comando
// entero, así que LEER un fichero que habla de `git push` contaba como haberlo hecho. Bloqueó el
// cierre de una sesión que no había subido nada.
test('necesitaVeredicto: nombrar «git push» dentro de un dato no es pushear', () => {
  assert.equal(
    necesitaVeredicto(['grep -n -E "checkout|ref:|branch|git push|BRANCH=" .github/workflows/visual-baselines.yml']),
    false,
    'un patrón de grep entre comillas es un DATO, no un comando',
  );
  assert.equal(necesitaVeredicto(["rg 'git push' scripts/"]), false);
  assert.equal(necesitaVeredicto(['echo "recuerda: git push va después del preflight"']), false);
});

test('necesitaVeredicto: un push de verdad se sigue viendo, esté donde esté', () => {
  assert.equal(necesitaVeredicto(['git push origin rama']), true, 'al principio');
  assert.equal(necesitaVeredicto(['cd repo && git push --force-with-lease origin rama']), true, 'tras &&');
  assert.equal(necesitaVeredicto(['npm run preflight; git push -u origin rama']), true, 'tras ;');
  assert.equal(necesitaVeredicto(['bash -c "git push origin rama"']), true, 'la cadena ES el comando');
  assert.equal(necesitaVeredicto(['git fetch origin\ngit push origin rama']), true, 'en otra línea');
});

// ── El cierre no se da sin enrutar cada corrección ───────────────────────────────────────
// Reflexionar es decidir dónde va cada lección. El caso ROJO es el que motiva la pieza: se invocó
// `reflect`, la corrección se quedó en prosa y la sesión cerró igual.

const evSkill = (skill) =>
  JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'x', name: 'Skill', input: { skill } }] } });
const evUsuario = (texto) => JSON.stringify({ type: 'user', message: { role: 'user', content: texto } });

test('invocoReflect: la skill por herramienta o el /reflect escrito → true', () => {
  assert.equal(invocoReflect(evSkill('reflect')), true);
  assert.equal(invocoReflect([ev('git status'), evSkill('reflect')].join('\n')), true);
  assert.equal(invocoReflect(evUsuario('<command-name>/reflect</command-name>\n            <command-args>el enrutador</command-args>')), true);
});

test('invocoReflect: sin invocarla → false, aunque la palabra ande por el transcript', () => {
  assert.equal(invocoReflect([ev('git status'), evUsuario('hola')].join('\n')), false);
  assert.equal(invocoReflect(evSkill('figma:figma-use')), false);
  assert.equal(invocoReflect(evUsuario('documenta cómo funciona /reflect en el README')), false);
  assert.equal(invocoReflect(ev('node scripts/hooks/correction-capture.mjs --listar')), false, 'leer el registro no es reflexionar');
  assert.equal(invocoReflect('basura no json\n'), false);
});

test('motivoSinEnrutar: el motivo lleva la lista y el comando exacto', () => {
  const m = motivoSinEnrutar([{ id: 'ab12cd', prompt: 'no, así no' }]);
  assert.match(m, /\[ab12cd\] no, así no/);
  assert.match(m, /--enrutar <id>/);
  assert.match(m, /hook \| gate \| tarjeta \| regla#N \| memoria \| no-mecanizable/);
});

// ── El parte de cierre ───────────────────────────────────────────────────────────────────
// El caso ROJO es el cierre de trámite: «pusheado, CI verde», que no le dice al usuario ni qué cambia
// en su día ni por qué le conviene.

// Entorno sin `GIT_*`: dentro de un hook de git esas variables apuntan al repositorio de verdad, y
// un `git init` sobre un repo temporal aterrizaría allí. Lo vigila `pre-push-hook.test.mjs`.
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

const evTexto = (texto) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: texto }] } });

const PARTE_OK = [
  '**Cierre**',
  '- Qué cambia: al cerrar una sesión te cuento en tres líneas qué ha cambiado y por qué te conviene.',
  '- En qué te ayuda: dejas de tener que preguntar «¿y esto para qué sirve?» cada vez que cierro algo.',
  '- Rastro: PR #95 · CI verde · docs/handoff/ling.md',
  '- Seguro cerrar: sí, todo subido y el PR verde; si quieres seguir mañana, lo recoge el hand-off.',
].join('\n');

const LIMPIO = { seguro: true, motivos: [] };
const SUCIO = { seguro: false, motivos: ['2 fichero(s) sin commitear (AGENTS.md, CLAUDE.md)'] };

test('ultimoMensaje: coge el texto del último mensaje del asistente y salta lo que no lo es', () => {
  assert.equal(ultimoMensaje([evTexto('primero'), ev('git status'), evTexto('el cierre')].join('\n')), 'el cierre');
  assert.equal(ultimoMensaje([evTexto('el cierre'), evUsuario('gracias')].join('\n')), 'el cierre', 'lo que escribe el usuario después no es mi cierre');
  assert.equal(ultimoMensaje('basura no json\n'), '');
});

test('fallosDelParte: el parte entero pasa; el cierre de trámite no', () => {
  assert.deepEqual(fallosDelParte(PARTE_OK, LIMPIO), []);
  assert.equal(fallosDelParte('Pusheado a main y el CI está verde.', LIMPIO).length, 4, 'ROJO: el cierre de trámite no lleva ninguna de las cuatro');
  assert.match(fallosDelParte('- Qué cambia: ahora el cierre lleva parte\n- Rastro: PR #95', LIMPIO)[0], /En qué te ayuda/);
});

test('fallosDelParte: la línea del porqué no puede esconderse detrás de la jerga ni estirarse', () => {
  const conJerga = PARTE_OK.replace('dejas de tener que preguntar «¿y esto para qué sirve?» cada vez que cierro algo', 'el hook bloquea el Stop hasta que lleve el parte');
  assert.match(fallosDelParte(conJerga, LIMPIO).join(' '), /dice «hook»/);
  const larga = PARTE_OK.replace('al cerrar una sesión', 'al cerrar una sesión ' + 'x'.repeat(200));
  assert.match(fallosDelParte(larga, LIMPIO).join(' '), /el tope es 200: resúmela/);
  assert.match(fallosDelParte('- Qué cambia:\n- En qué te ayuda:\n- Rastro:', LIMPIO).join(' '), /está vacía o es un titular/);
});

test('fallosDelParte: el negrita de markdown no despista al patrón', () => {
  const negrita = PARTE_OK.replace(/- (Qué cambia|En qué te ayuda|Rastro):/g, '- **$1:**');
  assert.deepEqual(fallosDelParte(negrita, LIMPIO), []);
});

test('motivoParteDeCierre: el motivo lleva la plantilla lista para rellenar', () => {
  const m = motivoParteDeCierre(['falta la línea «Rastro:».']);
  assert.match(m, /falta la línea «Rastro:»/);
  assert.match(m, /- En qué te ayuda: <el problema concreto/);
});

test('fallosDeSeguridad: «sí» con trabajo colgando es la mentira que se paga cerrando la ventana', () => {
  assert.deepEqual(fallosDeSeguridad(PARTE_OK, LIMPIO), []);
  assert.match(fallosDeSeguridad(PARTE_OK, SUCIO)[0], /el árbol dice que no: 2 fichero\(s\) sin commitear/, 'ROJO');
  assert.deepEqual(fallosDeSeguridad('- Seguro cerrar: no, el PR #95 se queda esperando tu OK.', SUCIO), [], 'decir que no cuadra siempre');
  assert.deepEqual(fallosDeSeguridad(PARTE_OK, { seguro: null, motivos: [] }), [], 'sin git no sé nada: falla ABIERTO');
});

test('fallosDeSeguridad: la línea existe y arranca por sí o por no', () => {
  assert.match(fallosDeSeguridad('- Rastro: PR #95', LIMPIO)[0], /falta la línea «Seguro cerrar:»/);
  assert.match(fallosDeSeguridad('- Seguro cerrar: creo que todo bien', LIMPIO)[0], /empieza por «sí» o por «no»/);
});

test('estadoDelArbol: lo mide del repo de verdad, y sin repo no inventa', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-arbol-'));
  assert.deepEqual(estadoDelArbol(dir), { seguro: null, motivos: [] }, 'sin git: no lo sé, y no bloqueo');

  for (const args of [['init', '-b', 'main'], ['config', 'user.email', 'x@y.z'], ['config', 'user.name', 'x'], ['commit', '--allow-empty', '-m', 'base']])
    spawnSync('git', args, { cwd: dir, env: SIN_GIT });
  const rama = estadoDelArbol(dir);
  assert.equal(rama.seguro, false, 'ROJO: rama que no está en ningún remoto');
  assert.match(rama.motivos.join(' '), /no está en el remoto/);

  writeFileSync(join(dir, 'suelto.txt'), 'trabajo que solo existe aquí');
  assert.match(estadoDelArbol(dir).motivos.join(' '), /1 fichero\(s\) sin commitear \(suelto.txt\)/);
});

// El porcelain abre la línea del fichero MODIFICADO con un hueco (« M ruta»); el untracked («?? ruta»)
// no. Con `trim()` en vez de `trimEnd()` la primera ruta perdía su primera letra, y con un untracked
// el caso salía verde igual: por eso este caso usa un fichero trackeado. (Lo vio la sonda, no el test.)
test('estadoDelArbol: la ruta del fichero modificado sale entera, sin comerse la primera letra', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-arbol-'));
  const correr = (...args) => spawnSync('git', args, { cwd: dir, env: SIN_GIT });
  for (const args of [['init', '-b', 'main'], ['config', 'user.email', 'x@y.z'], ['config', 'user.name', 'x']]) correr(...args);
  writeFileSync(join(dir, 'seguido.txt'), 'v1');
  correr('add', '-A');
  correr('commit', '-m', 'base');
  writeFileSync(join(dir, 'seguido.txt'), 'v2');
  assert.match(estadoDelArbol(dir).motivos.join(' '), /sin commitear \(seguido.txt\)/);
});

// De punta a punta por el proceso: es lo que Claude Code ejecuta de verdad. Sin `GIT_*`, porque el
// hook mide con git el `cwd` de la entrada y, heredándolas, mediría el repositorio de verdad.
function correrHook(entrada, projectDir) {
  const r = spawnSync(process.execPath, ['scripts/hooks/stop-guard.mjs'], {
    input: JSON.stringify(entrada),
    encoding: 'utf8',
    env: { ...SIN_GIT, SC_CLAUDE_PROJECT_DIR: projectDir },
  });
  assert.equal(r.status, 0, `el hook no puede petar: ${r.stderr}`);
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
}

test('Stop: con reflect y correcciones sin ruta bloquea; enrutada, deja cerrar; sin reflect, nunca', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-stop-'));
  const transcript = join(dir, 'sesion.jsonl');
  process.env.SC_CLAUDE_PROJECT_DIR = dir;
  try {
    registrar({ prompt: 'no, así no: mide antes de afirmar', session_id: 'S1', cwd: dir });
    registrar({ prompt: 'te lo dije: sin em dashes', session_id: 'S2', cwd: dir });
    const entrada = { transcript_path: transcript, session_id: 'S1', cwd: dir };

    writeFileSync(transcript, [ev('git status'), evUsuario('hola')].join('\n'));
    assert.equal(correrHook(entrada, dir), null, 'sin reflect no bloquea: mitad de tarea no es cierre');

    writeFileSync(transcript, [ev('git status'), evSkill('reflect'), evTexto(PARTE_OK)].join('\n'));
    const bloqueo = correrHook(entrada, dir);
    assert.equal(bloqueo?.decision, 'block', 'ROJO: reflexionó y la corrección se quedó sin destino');
    assert.match(bloqueo.reason, /1 corrección\(es\) de esta sesión sin enrutar/);
    assert.match(bloqueo.reason, /no, así no: mide antes de afirmar/);
    assert.doesNotMatch(bloqueo.reason, /em dashes/, 'las correcciones de otra sesión no cuentan');

    const [pend] = pendientes(rutaRegistro(dir), 'S1');
    assert.equal(enrutar({ id: pend.id, destino: 'gate', motivo: 'lo ve scripts/docs-coherence.mjs', cwd: dir }).ok, true);
    assert.equal(correrHook(entrada, dir), null, 'VERDE: enrutada y con parte de cierre, el Stop deja cerrar');

    writeFileSync(transcript, [ev('git status'), evSkill('reflect'), evTexto('Pusheado a main, CI verde.')].join('\n'));
    const sinParte = correrHook(entrada, dir);
    assert.equal(sinParte?.decision, 'block', 'ROJO: cerró con el trámite y sin contarle al usuario qué cambia');
    assert.match(sinParte.reason, /- En qué te ayuda:/);
    assert.match(sinParte.reason, /- Seguro cerrar:/);
    writeFileSync(transcript, [ev('git status'), evSkill('reflect'), evTexto(PARTE_OK)].join('\n'));

    assert.equal(correrHook({ ...entrada, session_id: 'S2' }, dir)?.decision, 'block', 'la otra sesión sigue debiendo la suya');
    assert.equal(correrHook({ ...entrada, stop_hook_active: true }, dir), null, 'stop_hook_active: bloquea UNA vez, no en bucle');
  } finally {
    delete process.env.SC_CLAUDE_PROJECT_DIR;
  }
});

test('Stop: el veredicto del CI manda sobre el enrutado (LEARNINGS #7 primero)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-stop-'));
  const transcript = join(dir, 'sesion.jsonl');
  process.env.SC_CLAUDE_PROJECT_DIR = dir;
  try {
    registrar({ prompt: 'no, así no', session_id: 'S3', cwd: dir });
    writeFileSync(transcript, [evSkill('reflect'), ev('git push origin main'), evTexto(PARTE_OK)].join('\n'));
    const r = correrHook({ transcript_path: transcript, session_id: 'S3', cwd: dir }, dir);
    assert.match(r.reason, /LEARNINGS #7/);
  } finally {
    delete process.env.SC_CLAUDE_PROJECT_DIR;
  }
});

// ── El canal MCP · añadido el 2026-09-19 ────────────────────────────────────────────────────
// Una sesión cloud NO tiene `gh` instalado, y `ci:verdict` lo invoca por dentro (`spawnSync gh
// ENOENT`). O sea que el único canal que el hook reconocía era IMPOSIBLE de usar ahí, y bloqueaba
// el cierre de una sesión que sí había leído el CI job a job. Mismo error que tenía
// `docs:coherence` CHECK D: comprobar el proxy en vez de la condición.

const evMcp = (nombre) =>
  JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'x', name: nombre, input: {} }] } });

test('comandosBash recoge TAMBIÉN las herramientas MCP de GitHub, en orden con las Bash', () => {
  // Solo las de GITHUB: lo que este hook pregunta es «¿se pushó?» y «¿se leyó el CI?», y ninguna
  // otra familia MCP puede contestar a eso. Meterlas todas engordaría la lista sin decir nada.
  const jsonl = [ev('git push origin main'), evMcp('mcp__github__actions_list'), evMcp('mcp__Claude_Docs__read')].join('\n');
  assert.deepEqual(comandosBash(jsonl), ['git push origin main', 'mcp__github__actions_list']);
});

test('ROJO: leer el CI por MCP cuenta como leerlo — si no, una sesión cloud no puede cerrar nunca', () => {
  assert.equal(necesitaVeredicto(['git push origin main', 'mcp__github__actions_list']), false);
  assert.equal(necesitaVeredicto(['git push origin main', 'mcp__github__get_job_logs']), false);
  assert.equal(necesitaVeredicto(['git push origin main', 'mcp__github__get_check_run']), false);
});

test('y no vale cualquier herramienta de GitHub: leer el CI es leer el CI', () => {
  assert.equal(necesitaVeredicto(['git push origin main', 'mcp__github__add_issue_comment']), true, 'comentar no es leer el CI');
  assert.equal(necesitaVeredicto(['git push origin main', 'mcp__github__create_pull_request']), true, 'abrir el PR tampoco');
  assert.equal(necesitaVeredicto(['git push origin main', 'mcp__github__search_code']), true);
});

// ── La revisión previa a enseñar una pantalla · añadido el 2026-09-27 (DD-123) ───────────────
// El primer filtro visual de una pantalla no puede ser el usuario: si la sesión escribe una
// plantilla u hoja del Supervisor, el cierre pide antes `npm run revision`.

const evEscribe = (herramienta, ruta) =>
  JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 'x', name: herramienta, input: { file_path: ruta } }] } });
const HOJA = '/repo/projects/supervisor/src/styles/_forms.scss';
const PLANTILLA = '/repo/projects/supervisor/src/app/features/auth/pages/login-page.component.html';

test('pantallasSinRevisar: escribir una pantalla sin revisar después la deja pendiente', () => {
  assert.deepEqual(pantallasSinRevisar(evEscribe('Edit', HOJA)), ['projects/supervisor/src/styles/_forms.scss']);
  assert.deepEqual(
    pantallasSinRevisar([evEscribe('Write', PLANTILLA), evEscribe('Edit', PLANTILLA)].join('\n')),
    ['projects/supervisor/src/app/features/auth/pages/login-page.component.html'],
    'la misma ruta cuenta una vez',
  );
});

test('pantallasSinRevisar: la revisión DESPUÉS la salda; la de ANTES no', () => {
  assert.deepEqual(pantallasSinRevisar([evEscribe('Edit', HOJA), ev('npm run revision -- login')].join('\n')), []);
  assert.deepEqual(pantallasSinRevisar([evEscribe('Edit', HOJA), ev('npm run -s revision -- login')].join('\n')), []);
  assert.deepEqual(
    pantallasSinRevisar([ev('npm run revision -- login'), evEscribe('Edit', HOJA)].join('\n')),
    ['projects/supervisor/src/styles/_forms.scss'],
    'ROJO: se tocó después de revisar',
  );
});

test('pantallasSinRevisar: lo que no es pantalla del Supervisor, o nombrar la revisión en un dato, no cuenta', () => {
  assert.deepEqual(pantallasSinRevisar(evEscribe('Edit', '/repo/docs/DECISIONS.md')), []);
  assert.deepEqual(pantallasSinRevisar(evEscribe('Edit', '/repo/projects/sc-docs/src/app/pages/patrones/patrones.component.html')), []);
  assert.deepEqual(pantallasSinRevisar(evEscribe('Edit', '/repo/projects/supervisor/src/app/core/auth.service.ts')), []);
  assert.deepEqual(
    pantallasSinRevisar([evEscribe('Edit', HOJA), ev('grep -n "npm run revision" AGENTS.md')].join('\n')),
    ['projects/supervisor/src/styles/_forms.scss'],
    'leer sobre la revisión no es revisar',
  );
});

test('Stop: una pantalla tocada sin revisión bloquea una vez; revisada, deja cerrar', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-stop-'));
  const transcript = join(dir, 'sesion.jsonl');
  const entrada = { transcript_path: transcript, session_id: 'S9', cwd: dir };
  writeFileSync(transcript, [evEscribe('Edit', HOJA), evTexto('Listo.')].join('\n'));
  const r = correrHook(entrada, dir);
  assert.equal(r?.decision, 'block', 'ROJO: la pantalla iba a llegar al usuario sin revisión previa');
  assert.match(r.reason, /npm run revision/);
  assert.match(r.reason, /better-layout/);
  assert.equal(correrHook({ ...entrada, stop_hook_active: true }, dir), null, 'a la segunda deja pasar');
  writeFileSync(transcript, [evEscribe('Edit', HOJA), ev('npm run revision -- config/aed/servicio'), evTexto('Listo.')].join('\n'));
  assert.equal(correrHook(entrada, dir), null, 'VERDE: revisada después del último cambio');
});

// ── El idioma del parte · añadido el 2026-09-28 ─────────────────────────────────────────────────
// ROJO que motivó la pieza: tras un tramo largo de herramientas, una sesión cerró con las etiquetas
// del parte en castellano y el contenido en inglés. Las líneas se reconocen por su etiqueta, así que
// el parte pasaba entero, y el usuario lee en castellano. Hasta aquí, un parte así solo caía si decía
// «yes» en vez de «sí», y el aviso pedía cambiar esa palabra: con «sí», el resto en inglés pasaba.

const PARTE_EN_INGLES = [
  '**Cierre**',
  '- Qué cambia: six of the seven Figma decisions are taken, and a script applies the eighty variables and checks each one before it writes it.',
  '- En qué te ayuda: nobody has to copy the values from the cards by hand, so a typo can no longer break a file that is healthy today.',
  '- Rastro: PR #270 · CI green, read with `ci:verdict` · docs/handoff/calidad-visual.md',
  '- Seguro cerrar: sí, everything is pushed and the PR is merged; the question about the two search boxes is in the hand-off.',
].join('\n');

test('ROJO: un parte con las etiquetas en castellano y el contenido en inglés no pasa', () => {
  const fallos = fallosDelParte(PARTE_EN_INGLES, LIMPIO);
  assert.equal(fallos.length, 1, `el resto del parte cumple: solo falla el idioma. Salió: ${fallos.join(' | ')}`);
  assert.match(fallos[0], /va en inglés/);
  assert.match(fallos[0], /reescríbelo entero en castellano/);
});

// El VERDE tiene que poder enrojecer: el bloque de código y los nombres técnicos llevan inglés de sobra
// para volcar el recuento si contaran como prosa. El control lo demuestra con el MISMO mensaje, sin las
// marcas de código y con los nombres partidos en palabras.
const PARTE_CON_CODIGO = [
  'Si una variable no casa, sale `Error: the node is not attached to the page`. Lo que imprime el script:',
  '',
  '```js',
  '// Apply the sizing batch to the file, and check each variable before it is written.',
  '// If the value in the file is not the one in the export, it is left for review.',
  '// The export is the source of truth: this script never invents a value.',
  'for (const variable of batch) {',
  '  // The node has to be bound to the token, or the theme will not follow it.',
  '  if (variable.valuesByMode[mode] !== expected) continue; // this is the one to review',
  '  variable.setValueForMode(mode, target); // and this is the one that is written',
  '}',
  '```',
  '',
  '**Cierre**',
  '- Qué cambia: `figma_execute` aplica ochenta variables y comprueba cada una antes de escribirla.',
  '- En qué te ayuda: un dato mal copiado ya no estropea un fichero sano, y un glifo como back_to_tab crece con su caja.',
  '- Rastro: PR #270 · `tokens:parity` y CI verdes tras el `git push` · docs/handoff/calidad-visual.md',
  '- Seguro cerrar: sí, todo subido; lo pendiente está en el hand-off.',
].join('\n');

test('VERDE: un parte en castellano con código y nombres técnicos en inglés pasa', () => {
  assert.deepEqual(fallosDelParte(PARTE_CON_CODIGO, LIMPIO), []);
});

test('el control del verde: el mismo mensaje, con el código y los nombres como prosa, no pasa', () => {
  const comoProsa = PARTE_CON_CODIGO.replace(/```\w*|`/g, '').replace(/(?<=\p{L})[_.:/-](?=\p{L})/gu, ' ');
  assert.match(fallosDelParte(comoProsa, LIMPIO).join(' '), /va en inglés/, 'si esto no enrojece, el verde de arriba no prueba nada');
});

test('Stop: tras reflect, el parte en inglés bloquea; el de castellano con su código en inglés deja cerrar', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-stop-'));
  const transcript = join(dir, 'sesion.jsonl');
  const entrada = { transcript_path: transcript, session_id: 'S-idioma', cwd: dir };
  writeFileSync(transcript, [evSkill('reflect'), evTexto(PARTE_EN_INGLES)].join('\n'));
  const r = correrHook(entrada, dir);
  assert.equal(r?.decision, 'block', 'ROJO: el cierre iba a llegarle al usuario en inglés');
  assert.match(r.reason, /va en inglés/);
  assert.match(r.reason, /- Qué cambia: <una frase/, 'y lleva la plantilla para rehacerlo');
  writeFileSync(transcript, [evSkill('reflect'), evTexto(PARTE_CON_CODIGO)].join('\n'));
  assert.equal(correrHook(entrada, dir), null, 'VERDE: en castellano deja cerrar');
});

// ── La rama ya fundida por squash · añadido el 2026-09-29 ───────────────────────────────────────
// ROJO que motivó la pieza (2026-09-28, sesión cloud): GitHub borra la rama al fundir por squash, y
// desde ahí el árbol decía «no» con todo ya en main. Tras #270, con el upstream podado: «no está en
// el remoto». Tras #264, sin podar: el upstream viejo contaba como «2 commits sin pushear» lo que la
// rama había recogido de main. El parte tuvo que decir que no aunque no se perdía nada, y el
// usuario tuvo que preguntar si podía cerrar.
//
// Se monta con un remoto de verdad (un repo desnudo) y un segundo clon que hace de GitHub: funde la
// rama por squash, sube otro PR encima y borra la rama. La rama lleva DOS commits a propósito: el
// squash no es ninguno de los dos, así que ni la ascendencia ni `git cherry` lo reconocen.

function montarSquash() {
  const raiz = mkdtempSync(join(tmpdir(), 'sc-squash-'));
  const remoto = join(raiz, 'remoto.git');
  const sesion = join(raiz, 'sesion');
  const github = join(raiz, 'github');
  const git = (cwd, ...args) => {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: SIN_GIT });
    assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
    return r.stdout.trim();
  };
  const commit = (cwd, fichero, texto, mensaje) => {
    writeFileSync(join(cwd, fichero), texto);
    git(cwd, 'add', '-A');
    git(cwd, 'commit', '-q', '-m', mensaje);
  };
  const identidad = (cwd) => {
    git(cwd, 'config', 'user.email', 'x@y.z');
    git(cwd, 'config', 'user.name', 'x');
  };

  git(raiz, 'init', '-q', '--bare', '-b', 'main', remoto);
  git(raiz, 'init', '-q', '-b', 'main', sesion);
  identidad(sesion);
  git(sesion, 'remote', 'add', 'origin', remoto);
  commit(sesion, 'a.txt', 'uno\n', 'base');
  git(sesion, 'push', '-q', '--no-verify', 'origin', 'main');
  git(sesion, 'switch', '-q', '-c', 'rama');
  commit(sesion, 'b.txt', 'dos\n', 'primer commit de la rama');
  commit(sesion, 'a.txt', 'uno\ncambio\n', 'segundo commit de la rama');
  git(sesion, 'push', '-q', '--no-verify', '-u', 'origin', 'rama');

  git(raiz, 'clone', '-q', remoto, github);
  identidad(github);
  git(github, 'merge', '-q', '--squash', 'origin/rama');
  git(github, 'commit', '-q', '-m', 'rama (#1)');
  commit(github, 'c.txt', 'otro\n', 'otro PR (#2)');
  git(github, 'push', '-q', '--no-verify', 'origin', 'main');
  git(github, 'push', '-q', '--no-verify', 'origin', '--delete', 'rama');
  return { raiz, sesion, github, git, commit };
}

const NOTA_FUNDIDA = /^ya fundida en main, comparado con [0-9a-f]{7,}$/;

test('estadoDelArbol: rama fundida por squash, con otro PR encima en main y el upstream podado → seguro', () => {
  const { sesion, git } = montarSquash();
  git(sesion, 'fetch', '-q', '--prune', 'origin');
  assert.match(git(sesion, 'status', '-sb'), /\[gone\]/, 'el estímulo: el upstream ya no existe, como tras `git remote prune`');
  assert.notEqual(
    git(sesion, 'rev-parse', 'HEAD^{tree}'),
    git(sesion, 'rev-parse', 'origin/main^{tree}'),
    'main lleva otro PR encima: comparar los dos árboles a pelo no bastaría',
  );
  const estado = estadoDelArbol(sesion);
  assert.equal(estado.seguro, true, `todo está en main y el árbol dice que no: ${estado.motivos.join('; ')}`);
  assert.deepEqual(estado.motivos, [`ya fundida en main, comparado con ${git(sesion, 'rev-parse', '--short', 'origin/main')}`]);
});

test('estadoDelArbol: la misma rama puesta al día con main, con el upstream viejo y sin él → seguro las dos', () => {
  const { sesion, git } = montarSquash();
  git(sesion, 'fetch', '-q', '--no-prune', 'origin');
  git(sesion, 'merge', '-q', '--no-edit', 'origin/main');
  assert.equal(git(sesion, 'rev-list', '--count', '@{u}..HEAD'), '3', 'el estímulo: el upstream viejo cuenta como sin subir lo que la rama recogió de main');
  const viejo = estadoDelArbol(sesion);
  assert.equal(viejo.seguro, true, `con el upstream viejo, el árbol dice que no: ${viejo.motivos.join('; ')}`);
  assert.match(viejo.motivos.join(' '), NOTA_FUNDIDA);

  git(sesion, 'fetch', '-q', '--prune', 'origin');
  const podado = estadoDelArbol(sesion);
  assert.equal(podado.seguro, true, `sin upstream, el árbol dice que no: ${podado.motivos.join('; ')}`);
  assert.match(podado.motivos.join(' '), NOTA_FUNDIDA);
});

test('estadoDelArbol: un cambio que main no tiene → no seguro, con el upstream viejo y sin él', () => {
  const { sesion, git, commit } = montarSquash();
  commit(sesion, 'd.txt', 'después de fundir\n', 'trabajo nuevo');
  git(sesion, 'fetch', '-q', '--no-prune', 'origin');
  const viejo = estadoDelArbol(sesion);
  assert.equal(viejo.seguro, false, 'ROJO: el commit nuevo solo existe aquí');
  assert.deepEqual(viejo.motivos, ['1 commit(s) sin pushear a origin/rama']);

  git(sesion, 'fetch', '-q', '--prune', 'origin');
  const podado = estadoDelArbol(sesion);
  assert.equal(podado.seguro, false, 'ROJO: el commit nuevo solo existe aquí');
  assert.deepEqual(podado.motivos, ['la rama rama no está en el remoto: si se pierde el disco, se pierde el trabajo']);
});

// El error posible de la comprobación es un «no» de más, nunca un «sí» falso: si main retocó después
// las mismas líneas, fundir la rama da conflicto aunque su trabajo ya pasara por main.
test('estadoDelArbol: si main tocó después las mismas líneas, sale conflicto y dice que no', () => {
  const { sesion, github, git, commit } = montarSquash();
  commit(github, 'a.txt', 'uno\ncambio de otro\n', 'retoque (#3)');
  git(github, 'push', '-q', '--no-verify', 'origin', 'main');
  git(sesion, 'fetch', '-q', '--prune', 'origin');
  const estado = estadoDelArbol(sesion);
  assert.equal(estado.seguro, false);
  assert.deepEqual(estado.motivos, ['la rama rama no está en el remoto: si se pierde el disco, se pierde el trabajo']);
});

test('Stop: tras fundir por squash, «Seguro cerrar: sí» deja cerrar; con un commit encima, el árbol lo desmiente', () => {
  const { raiz, sesion, git, commit } = montarSquash();
  git(sesion, 'fetch', '-q', '--prune', 'origin');
  const transcript = join(raiz, 'sesion.jsonl');
  const entrada = { transcript_path: transcript, session_id: 'S-squash', cwd: sesion };
  writeFileSync(transcript, [evSkill('reflect'), evTexto(PARTE_OK)].join('\n'));
  assert.equal(correrHook(entrada, raiz), null, 'todo está en main: el «sí» es verdad y el cierre pasa');

  commit(sesion, 'd.txt', 'después de fundir\n', 'trabajo nuevo');
  const r = correrHook(entrada, raiz);
  assert.equal(r?.decision, 'block', 'ROJO: hay un commit que main no tiene y el parte dice «sí»');
  assert.match(r.reason, /el árbol dice que no: la rama rama no está en el remoto/);
});

// ── Pushear es un ACTO, no una cadena de texto · añadido el 2026-10-04 ──────────────────────────────
// El hook contaba como push todo comando que TUVIERA `git push` en posición de comando, y en una sola
// sesión salieron tres familias de aviso falso, medidas sobre su propio transcript (12 comandos «push»,
// de los que solo 2 lo eran):
//   · cuatro que NUNCA corrieron: tres los denegó `bash-guard` (resultado con `is_error`) y un
//     `false && … git push` salió con `Exit code 1`;
//   · ocho cuyo único `git push` estaba en el texto de un heredoc (mensajes de `git commit` y scripts);
//   · y, según el hand-off, el push de OTRO repositorio, que pide leer un CI que ese repo no tiene.
// Cada una cuesta un turno de cierre. Lo que se pregunta es si SE PUSHEÓ, y eso lo dicen el resultado
// de la herramienta, de qué es dato el heredoc y en qué repo corrió.

const evUso = (id, cmd, cwd) =>
  JSON.stringify({ type: 'assistant', cwd, message: { content: [{ type: 'tool_use', id, name: 'Bash', input: { command: cmd } }] } });
const evResultado = (id, texto, error = false) =>
  JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content: texto, is_error: error }] } });

test('actosBash: cada Bash lleva su cwd y si falló; sin resultado se da por ejecutado; el canal MCP sigue entrando', () => {
  const jsonl = [
    evUso('a', 'git push origin main', '/r'),
    evResultado('a', 'To https://github.com/x/y\n   abc..def  main -> main'),
    evUso('b', 'false && git push', '/r'),
    evResultado('b', 'Exit code 1', true),
    evUso('c', 'git push origin rama', '/r'), // sin resultado: el transcript aún no lo trae
    evUso('d', 'npm run ci:verdict', '/r'),
    evResultado('d', 'Exit code 1', true), // un CI en rojo: el verdict SÍ se leyó
    evMcp('mcp__github__actions_list'),
  ].join('\n');
  assert.deepEqual(actosBash(jsonl), [
    { cmd: 'git push origin main', cwd: '/r', fallo: false },
    { cmd: 'false && git push', cwd: '/r', fallo: true },
    { cmd: 'git push origin rama', cwd: '/r', fallo: false },
    { cmd: 'npm run ci:verdict', cwd: '/r', fallo: true },
    { cmd: 'mcp__github__actions_list', cwd: undefined, fallo: false },
  ]);
  // Y `comandosBash` sigue siendo la lista de comandos, para quien solo quiere eso.
  assert.deepEqual(comandosBash(jsonl).slice(0, 2), ['git push origin main', 'false && git push']);
});

test('un push que NO corrió (denegado o con error) no obliga a leer ningún CI; uno que corrió, sí', () => {
  const denegado = [evUso('a', 'git push origin main', '/r'), evResultado('a', 'PreToolUse:Bash hook error: LEARNINGS #7 — …', true)].join('\n');
  const noCorrio = [evUso('a', 'false && cd /x && git push', '/r'), evResultado('a', 'Exit code 1', true)].join('\n');
  const rechazado = [evUso('a', 'git push origin main', '/r'), evResultado('a', 'Exit code 1', true)].join('\n');
  const hecho = [evUso('a', 'git push origin main', '/r'), evResultado('a', 'To https://github.com/x/y\n   abc..def  main -> main')].join('\n');
  const sinResultado = evUso('a', 'git push origin main', '/r');
  assert.equal(necesitaVeredicto(actosBash(denegado)), false, 'lo denegó el guardián de push: no se pusheó');
  assert.equal(necesitaVeredicto(actosBash(noCorrio)), false, '`false &&` corta la cadena');
  assert.equal(necesitaVeredicto(actosBash(rechazado)), false, 'un push con error de salida no subió nada');
  assert.equal(necesitaVeredicto(actosBash(hecho)), true, 'ROJO si se pierde: el que corrió pide leer el CI');
  assert.equal(necesitaVeredicto(actosBash(sinResultado)), true, 'sin resultado se da por hecho: lo estricto');
  // Un `ci:verdict` que sale en rojo (exit ≠ 0) ES leer el CI: el error de la herramienta no le quita el valor.
  const leidoEnRojo = [hecho, evUso('b', 'npm run ci:verdict', '/r'), evResultado('b', 'Exit code 1', true)].join('\n');
  assert.equal(necesitaVeredicto(actosBash(leidoEnRojo)), false);
});

test('un heredoc es DATO salvo que lo lea un shell: el cuerpo de un commit que habla de pushes no es un push', () => {
  const mensaje = "git commit -q -F - <<'EOF'\nUn cambio\n\n- Huecos: `cd <otro> && git push && cd <este> && git push`\nEOF";
  // ROJO de antes: esto bloqueó el cierre en tres commits de la misma sesión.
  assert.equal(necesitaVeredicto([mensaje]), false, 'el mensaje de un commit');
  assert.equal(necesitaVeredicto(["cat > notas.md <<'EOF'\ngit push origin main\nEOF"]), false, 'un fichero que habla de git push (el hueco que el comentario dejaba abierto)');
  assert.equal(necesitaVeredicto(["python3 - <<'PY'\nsubprocess.run(['x'])  # luego git push\nPY"]), false);
  // VERDE: lo que sigue siendo un push, esté donde esté respecto al heredoc.
  assert.equal(necesitaVeredicto(["bash <<'EOF'\ngit push origin rama\nEOF"]), true, 'un shell lee el heredoc: es un script');
  assert.equal(necesitaVeredicto(["git commit -q -F - <<'EOF' && git push origin rama\nmensaje\nEOF"]), true, 'tras el operador, en la misma línea');
  assert.equal(necesitaVeredicto(["git commit -q -F - <<'EOF'\nmensaje\nEOF\ngit push origin rama"]), true, 'después de cerrarlo');
});

// El push de otro repositorio no tiene CI que leer. Repos de verdad, porque lo que se mira es el disco:
// este (con el script de la marca, que es lo que reconoce `bash-guard`) y otro sin él.
function reposDelCierre(t) {
  const raiz = mkdtempSync(join(tmpdir(), 'sc-stop-repos-'));
  t.after(() => rmSync(raiz, { recursive: true, force: true }));
  const propio = join(raiz, 'propio');
  const otro = join(raiz, 'otro');
  for (const d of [propio, otro]) {
    mkdirSync(d);
    spawnSync('git', ['init', '-q'], { cwd: d, env: SIN_GIT });
  }
  mkdirSync(join(propio, 'scripts'));
  writeFileSync(join(propio, 'scripts', 'preflight-mark.mjs'), '');
  return { raiz, propio, otro };
}
const acto = (cmd, cwd) => ({ cmd, cwd, fallo: false });

test('el push de OTRO repositorio no pide leer el CI de este; el de este, con la sesión donde sea, sí', (t) => {
  const { propio, otro } = reposDelCierre(t);
  // ROJO de antes: el barrido de un repo ajeno (el cuaderno de notas) obligaba a leer un CI que no existe.
  assert.equal(necesitaVeredicto([acto(`cd ${otro} && git add -A && git commit -qm x && git push`, propio)]), false);
  assert.equal(necesitaVeredicto([acto(`cd "${otro}" && git push`, propio)]), false, 'con la ruta entrecomillada');
  assert.equal(necesitaVeredicto([acto('git push', otro)]), false, 'con la sesión abierta en él');
  assert.equal(necesitaVeredicto([acto(`git -C ${otro} push`, propio)]), false);
  assert.equal(necesitaVeredicto([acto(`false || (cd ${otro} && git push)`, propio)]), false);
  // VERDE: lo de este repo se sigue viendo, desde donde corra.
  assert.equal(necesitaVeredicto([acto('git push origin main', propio)]), true);
  assert.equal(necesitaVeredicto([acto(`cd ${propio} && git push`, otro)]), true, 'con la sesión en el otro repo');
  assert.equal(necesitaVeredicto([acto(`git -C ${propio} push`, otro)]), true);
  assert.equal(necesitaVeredicto([acto(`cd ${otro} && git push && cd ${propio} && git push`, propio)]), true, 'un comando con los dos: cuenta el de este');
  assert.equal(necesitaVeredicto([acto(`(cd ${otro} && git push); git push`, propio)]), true, 'el `cd` de un subshell no sale de él: el segundo corre en la sesión');
  assert.equal(necesitaVeredicto([acto(`cd ${otro} && git push; git push`, propio)]), false, 'sin subshell el `cd` persiste: los dos son del otro repo');
  // Y las formas con las que git elige repositorio SON pushes aunque no empiecen por `git push` (el hook no las veía).
  assert.equal(necesitaVeredicto([acto(`GIT_DIR=${propio}/.git git push`, otro)]), true);
  assert.equal(necesitaVeredicto([acto(`git --git-dir=${propio}/.git push`, otro)]), true);
  assert.equal(necesitaVeredicto([acto(`GIT_DIR=${otro}/.git git push`, propio)]), false);
  assert.equal(necesitaVeredicto([acto(`git -C ${propio} push --dry-run`, otro)]), false, 'un dry-run no sube nada');
  // Lo que no se sabe cuenta como de este repo: sin cwd, con una ruta opaca o con un push dentro de comillas de `bash -c`.
  assert.equal(necesitaVeredicto([{ cmd: `cd ${otro} && git push`, fallo: false }]), true, 'sin cwd en el evento');
  assert.equal(necesitaVeredicto([acto('cd $CUADERNO && git push', propio)]), true, 'cd opaco');
  assert.equal(necesitaVeredicto([acto(`bash -c "cd ${otro} && git push"`, propio)]), true, 'el parser no ve un push dentro de comillas');
  // Y leer el CI después sigue cerrando la deuda de este repo.
  assert.equal(necesitaVeredicto([acto(`cd ${propio} && git push`, otro), acto('mcp__github__actions_list', otro)]), false);
});

test('Stop: de punta a punta, un push que no corrió no bloquea y uno que corrió sin CI leído, sí', (t) => {
  const { raiz, propio } = reposDelCierre(t);
  const transcript = join(raiz, 'sesion.jsonl');
  const entrada = { transcript_path: transcript, session_id: 'S-acto', cwd: propio };
  writeFileSync(transcript, [evUso('a', `cd ${propio} && false && git push`, propio), evResultado('a', 'Exit code 1', true)].join('\n'));
  assert.equal(correrHook(entrada, raiz), null, 'la sonda que nunca llegó a pushear no obliga a leer el CI');
  writeFileSync(transcript, [evUso('a', 'git push origin main', propio), evResultado('a', 'To https://github.com/x/y\n   abc..def  main -> main')].join('\n'));
  assert.match(correrHook(entrada, raiz).reason, /LEARNINGS #7/, 'ROJO si se pierde: el push de verdad sigue pidiendo el veredicto');
});
