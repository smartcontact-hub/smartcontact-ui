import { test } from 'node:test';
import assert from 'node:assert/strict';

import { comandosBash, necesitaVeredicto } from '../hooks/stop-guard.mjs';

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
