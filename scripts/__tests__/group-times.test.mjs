import assert from 'node:assert/strict';
import test from 'node:test';
import { URL } from 'node:url';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../../projects/supervisor/src/app/features/admin/groups/data/groups-data.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', js)(mod, mod.exports);
const { groupDurationOptions, validQueueSize, resolveGroup } = mod.exports;

test('los tiempos fijos guardan segundos y las etiquetas respetan el idioma', () => {
  assert.deepEqual(groupDurationOptions(10, false, 'es').map(x => x.value), [5, 10, 15, 20, 25, 30, 60, 90, 120]);
  assert.equal(groupDurationOptions(90, false, 'es').find(x => x.value === 90).label, '1,5 min');
  assert.equal(groupDurationOptions(90, false, 'en').find(x => x.value === 90).label, '1.5 min');
  assert.deepEqual(groupDurationOptions(5, true, 'es').map(x => x.value), [5, 10, 15, 30, 60]);
});

test('los valores anteriores fuera del catálogo se conservan sin duplicarlos ni tocar el modelo', () => {
  for (const current of [0, 11, 33, 99, 240]) {
    const options = groupDurationOptions(current, false, 'es');
    assert.equal(options.filter(x => x.value === current).length, 1);
  }
  const before = { id: 11, channels: ['chat'], advanced: { transferSec: 11 }, chat: { inactivityMinutes: 17, attendanceScheduleIds: { chat: 2, whatsapp: 3 } }, schedules: [4] };
  const resolved = resolveGroup(before);
  assert.equal(resolved.phoneQueue.transferSec, 11);
  assert.equal(resolved.chat.inactivityMinutes, 17);
  assert.deepEqual(resolved.chat.attendanceScheduleIds, { chat: 2, whatsapp: 3 });
  assert.deepEqual(resolved.schedules, [4]);
  assert.equal(before.advanced.transferSec, 11);
});

test('Variable admite enteros 1–10 y Fija no tiene máximo; ninguna admite fracciones', () => {
  for (const queueSize of [1, 2, 10]) assert.equal(validQueueSize({ queueSizeType: 'per_agent', queueSize }), true);
  for (const queueSize of [0, -1, 2.5, 11, NaN]) assert.equal(validQueueSize({ queueSizeType: 'per_agent', queueSize }), false);
  assert.equal(validQueueSize({ queueSizeType: 'fixed', queueSize: 10000 }), true);
  assert.equal(validQueueSize({ queueSizeType: 'fixed', queueSize: 2.5 }), false);
});
