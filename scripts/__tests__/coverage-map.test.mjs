import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, BUCKETS, PRIMARY_STEPS } from '../coverage-map.mjs';

// Test de DOBLE CARA del censo de cobertura (§8). La garantía: toda hoja del grupo cae en un
// bucket; una hoja NUEVA del Kit sin bucket → unmatched (ROJO en parity).

test('CARA VERDE · hojas conocidas de semantic/common → todas clasificadas, 0 unmatched', () => {
  const paths = ['primary.500', 'form.field.padding.x', 'icon.size', 'overlay.modal.padding', 'list.gap', 'navigation.item.gap', 'disabled.opacity', 'focus.ring.color', 'focus.ring.width', 'form.field.focus.ring.width', 'content.border.radius', 'anchor.gutter', 'overlay.title.font.size'];
  const { unmatched, byKind } = classify('aura/semantic/common', paths);
  assert.deepEqual(unmatched, []);
  assert.equal(byKind['value-check'].length, 1); // primary.500
  assert.equal(byKind['divergence'].length, 1); // focus.ring.color
});

test('CARA ROJA · hoja NUEVA del Kit sin bucket → unmatched (lo que antes se escapaba)', () => {
  const { unmatched } = classify('aura/semantic/common', ['tooltip.brandNewToken']);
  assert.deepEqual(unmatched, ['tooltip.brandNewToken']);
});

test('effects · focus.ring.shadow → divergence (outline); resto → shadow', () => {
  const { byKind, unmatched } = classify('aura/effects', ['button.primary.focus.ring.shadow', 'card.shadow', 'toast.info.shadow']);
  assert.deepEqual(unmatched, []);
  assert.equal(byKind['divergence'].length, 1);
  assert.equal(byKind['shadow'].length, 2);
});

test('app · todo app.* → not-consumed', () => {
  const { byKind, unmatched } = classify('aura/app', ['app.card.background', 'app.font.size']);
  assert.deepEqual(unmatched, []);
  assert.equal(byKind['not-consumed'].length, 2);
});

test('estructura · cada bucket es {RegExp test, string kind, string note}; primary tiene 11 pasos', () => {
  for (const b of BUCKETS) {
    assert.ok(b.test instanceof RegExp, `bucket de ${b.group} sin RegExp`);
    assert.equal(typeof b.kind, 'string');
    assert.equal(typeof b.note, 'string');
  }
  assert.equal(PRIMARY_STEPS.length, 11);
});
