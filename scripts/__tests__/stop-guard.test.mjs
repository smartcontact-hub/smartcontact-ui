import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  comandosBash,
  fallosDelParte,
  invocoReflect,
  motivoParteDeCierre,
  motivoSinEnrutar,
  necesitaVeredicto,
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
// El caso ROJO es el cierre de trámite: «pusheado, CI verde», que no le dice a Rafa ni qué cambia
// en su día ni por qué le conviene.

const evTexto = (texto) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: texto }] } });

const PARTE_OK = [
  '**Cierre**',
  '- Qué cambia: al cerrar una sesión te cuento en tres líneas qué ha cambiado y por qué te conviene.',
  '- En qué te ayuda: dejas de tener que preguntar «¿y esto para qué sirve?» cada vez que cierro algo.',
  '- Rastro: PR #95 · CI verde · docs/handoff/ling.md',
].join('\n');

test('ultimoMensaje: coge el texto del último mensaje del asistente y salta lo que no lo es', () => {
  assert.equal(ultimoMensaje([evTexto('primero'), ev('git status'), evTexto('el cierre')].join('\n')), 'el cierre');
  assert.equal(ultimoMensaje([evTexto('el cierre'), evUsuario('gracias')].join('\n')), 'el cierre', 'lo que escribe Rafa después no es mi cierre');
  assert.equal(ultimoMensaje('basura no json\n'), '');
});

test('fallosDelParte: el parte entero pasa; el cierre de trámite no', () => {
  assert.deepEqual(fallosDelParte(PARTE_OK), []);
  assert.equal(fallosDelParte('Pusheado a main y el CI está verde.').length, 3, 'ROJO: el cierre de trámite no lleva ninguna de las tres');
  assert.match(fallosDelParte('- Qué cambia: ahora el cierre lleva parte\n- Rastro: PR #95')[0], /En qué te ayuda/);
});

test('fallosDelParte: la línea del porqué no puede esconderse detrás de la jerga ni estirarse', () => {
  const conJerga = PARTE_OK.replace('dejas de tener que preguntar «¿y esto para qué sirve?» cada vez que cierro algo', 'el hook bloquea el Stop hasta que lleve el parte');
  assert.match(fallosDelParte(conJerga).join(' '), /dice «hook»/);
  const larga = PARTE_OK.replace('al cerrar una sesión', 'al cerrar una sesión ' + 'x'.repeat(200));
  assert.match(fallosDelParte(larga).join(' '), /el tope es 200: resúmela/);
  assert.match(fallosDelParte('- Qué cambia:\n- En qué te ayuda:\n- Rastro:').join(' '), /está vacía o es un titular/);
});

test('fallosDelParte: el negrita de markdown no despista al patrón', () => {
  const negrita = PARTE_OK.replace(/- (Qué cambia|En qué te ayuda|Rastro):/g, '- **$1:**');
  assert.deepEqual(fallosDelParte(negrita), []);
});

test('motivoParteDeCierre: el motivo lleva la plantilla lista para rellenar', () => {
  const m = motivoParteDeCierre(['falta la línea «Rastro:».']);
  assert.match(m, /falta la línea «Rastro:»/);
  assert.match(m, /- En qué te ayuda: <el problema concreto/);
});

// De punta a punta por el proceso: es lo que Claude Code ejecuta de verdad.
function correrHook(entrada, projectDir) {
  const r = spawnSync(process.execPath, ['scripts/hooks/stop-guard.mjs'], {
    input: JSON.stringify(entrada),
    encoding: 'utf8',
    env: { ...process.env, SC_CLAUDE_PROJECT_DIR: projectDir },
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
    assert.equal(sinParte?.decision, 'block', 'ROJO: cerró con el trámite y sin contarle a Rafa qué cambia');
    assert.match(sinParte.reason, /- En qué te ayuda:/);
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
