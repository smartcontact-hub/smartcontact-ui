// Tests de los presets de duración (Bloque 10). node:test, dentro del gate.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DURATION_PRESETS,
  durationPresetBySecs,
  durationToSecs,
  matchDurationPreset,
} from '../../projects/supervisor/src/app/features/memory/data/duration-presets.core.mjs';

test('durationToSecs convierte unidades', () => {
  assert.equal(durationToSecs(30, 'seconds'), 30);
  assert.equal(durationToSecs(5, 'minutes'), 300);
  assert.equal(durationToSecs(90, 'minutes'), 5400);
});

test('matchDurationPreset casa exacto (por segundos) o null si personalizado', () => {
  assert.equal(matchDurationPreset(5, 'minutes')?.label, '5 min');
  assert.equal(matchDurationPreset(300, 'seconds')?.label, '5 min'); // mismo secs, otra unidad
  assert.equal(matchDurationPreset(90, 'minutes')?.label, '1,5 h');
  assert.equal(matchDurationPreset(73, 'seconds'), null);
  assert.equal(matchDurationPreset(7, 'minutes'), null);
});

test('durationPresetBySecs encuentra por clave', () => {
  assert.equal(durationPresetBySecs(3600)?.label, '1 h');
  assert.equal(durationPresetBySecs(15)?.label, '15 s');
  assert.equal(durationPresetBySecs(999), undefined);
});

test('invariante: cada preset cumple secs === durationToSecs(amount, unit)', () => {
  for (const p of DURATION_PRESETS) {
    assert.equal(durationToSecs(p.amount, p.unit), p.secs, `${p.label} mal mapeado`);
  }
});

test('los segundos de los presets son únicos y crecientes', () => {
  const secs = DURATION_PRESETS.map((p) => p.secs);
  assert.equal(new Set(secs).size, secs.length, 'hay secs duplicados');
  for (let i = 1; i < secs.length; i++) assert.ok(secs[i] > secs[i - 1], 'no crecientes');
});
