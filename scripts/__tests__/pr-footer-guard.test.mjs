import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { debeAvisar, motivo, numeroDelPr } from '../hooks/pr-footer-guard.mjs';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), '../hooks/pr-footer-guard.mjs');
const NUBE = { CLAUDE_CODE_REMOTE: 'true' };
// La respuesta real de la herramienta al crear #265: solo el id y la URL, sin el cuerpo.
const RESPUESTA = [{ type: 'text', text: '{"id":"4657414001","url":"https://github.com/smartcontact-hub/smartcontact-ui/pull/265"}' }];

test('crear un PR por MCP en la nube avisa; en local, u otra herramienta, calla', () => {
  assert.equal(debeAvisar({ tool_name: 'mcp__github__create_pull_request' }, NUBE), true);
  assert.equal(debeAvisar({ tool_name: 'mcp__otro_github__create_pull_request' }, NUBE), true);
  assert.equal(debeAvisar({ tool_name: 'mcp__github__create_pull_request' }, {}), false);
  assert.equal(debeAvisar({ tool_name: 'mcp__github__create_pull_request' }, { CLAUDE_CODE_REMOTE: 'false' }), false);
  assert.equal(debeAvisar({ tool_name: 'mcp__github__update_pull_request' }, NUBE), false);
  assert.equal(debeAvisar({ tool_name: 'Bash' }, NUBE), false);
  assert.equal(debeAvisar(undefined, NUBE), false);
});

test('el número sale de la URL de la respuesta, en la forma que tenga', () => {
  assert.equal(numeroDelPr(RESPUESTA), 265);
  assert.equal(numeroDelPr('{"url":"https://github.com/o/r/pull/7"}'), 7);
  assert.equal(numeroDelPr({ content: 'sin url' }), null);
  assert.equal(numeroDelPr(undefined), null);
});

test('el motivo nombra el PR, la regla y los tres pasos', () => {
  const t = motivo(265);
  assert.match(t, /#265/);
  assert.match(t, /AGENTS\.md §«Pull requests y commits»/);
  assert.match(t, /pull_request_read/);
  assert.match(t, /update_pull_request/);
  assert.match(motivo(null), /el PR que acabas de crear/);
});

test('de punta a punta: por stdin, en la nube bloquea con el motivo y en local no dice nada', () => {
  const entrada = JSON.stringify({ tool_name: 'mcp__github__create_pull_request', tool_response: RESPUESTA });
  const nube = execFileSync('node', [HOOK], { input: entrada, encoding: 'utf8', env: { ...process.env, ...NUBE } });
  const salida = JSON.parse(nube);
  assert.equal(salida.decision, 'block');
  assert.match(salida.reason, /#265/);
  const local = { ...process.env };
  delete local.CLAUDE_CODE_REMOTE;
  assert.equal(execFileSync('node', [HOOK], { input: entrada, encoding: 'utf8', env: local }), '');
  assert.equal(execFileSync('node', [HOOK], { input: 'no es json', encoding: 'utf8', env: { ...process.env, ...NUBE } }), '');
});
