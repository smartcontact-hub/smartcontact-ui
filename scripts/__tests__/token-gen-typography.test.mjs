import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FONT_SIZE_SNAPS, LINE_HEIGHT_SNAPS } from '../token-gen.mjs';
import { EXPORT_PATH } from '../paths.mjs';

// La tipografía era la única familia a mano de las diez y ahí se escondió el drift del
// line-height md (21 vs 20). Ahora la genera token-gen.mjs. Estos tests cuidan la parte
// que NO viene del Kit: los snaps del DS (pasos que el Kit no trae y el DS sí, DD-13).

const kit = JSON.parse(readFileSync(EXPORT_PATH, 'utf8'))['aura/custom'];
const stepsOf = (fam, sub) => Object.keys(kit?.primitive?.typography?.[fam]?.[sub] ?? {});

test('todo snap apunta a un paso que el Kit SÍ trae (si no, quedaría huérfano)', () => {
  const fs = stepsOf('font', 'size');
  const lh = stepsOf('line', 'height');
  assert.ok(fs.length > 0 && lh.length > 0, 'el export debe traer tipografía');
  for (const [step, { from }] of Object.entries(FONT_SIZE_SNAPS))
    assert.ok(fs.includes(String(from)), `font-size ${step} → ${from}, que el Kit no trae`);
  for (const [step, { from }] of Object.entries(LINE_HEIGHT_SNAPS))
    assert.ok(lh.includes(String(from)), `line-height ${step} → ${from}, que el Kit no trae`);
});

test('ningún snap pisa un paso que el Kit ya define', () => {
  const fs = stepsOf('font', 'size');
  const lh = stepsOf('line', 'height');
  for (const step of Object.keys(FONT_SIZE_SNAPS))
    assert.ok(!fs.includes(step), `font-size ${step} es del Kit: no debe estar snapeado`);
  for (const step of Object.keys(LINE_HEIGHT_SNAPS))
    assert.ok(!lh.includes(step), `line-height ${step} es del Kit: no debe estar snapeado`);
});

test('los snaps no se apuntan entre sí (siempre a una hoja real del Kit)', () => {
  for (const [step, { from }] of Object.entries(LINE_HEIGHT_SNAPS))
    assert.ok(!(from in LINE_HEIGHT_SNAPS), `line-height ${step} → ${from}, que es otro snap`);
  for (const [step, { from }] of Object.entries(FONT_SIZE_SNAPS))
    assert.ok(!(from in FONT_SIZE_SNAPS), `font-size ${step} → ${from}, que es otro snap`);
});
