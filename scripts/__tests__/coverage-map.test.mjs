import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, BUCKETS, PRIMARY_STEPS, APP_TYPOGRAPHY_CONTRACT } from '../coverage-map.mjs';

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

test('custom · CARA VERDE · las cinco familias caen donde se midió que caen', () => {
  const paths = [
    'primitive.typography.font.size.200',
    'primitive.typography.line.height.300',
    'primitive.typography.font.weight.semibold',
    'semantic.text.accent',
    'semantic.presence.talking',
    'component.bulktranscriptionmodal.warn.color',
    'component.dialog.icon.color',
  ];
  const { unmatched, byKind } = classify('aura/custom', paths);
  assert.deepEqual(unmatched, []);
  // la tipografía FLUYE (es la fuente de --sc-font-size/-line-height/-weight)
  assert.equal(byKind['flows'].length, 3);
  // accent (sky por contraste) · presence (otra taxonomía) · icono del diálogo (atenuado)
  assert.equal(byKind['divergence'].length, 3);
  // el modal no tiene familia --sc-cmp-* propia: consume la capa semántica
  assert.equal(byKind['not-consumed'].length, 1);
});

test('custom · las familias del rebase de text styles (2026-09-02) caen donde se midió', () => {
  // Las 9 hojas que el sync trajo en rojo el 2026-09-02 al rebasar los text styles del Figma
  // del DS. Cada una se clasificó midiendo su consumo real, no por el nombre.
  const paths = [
    'primitive.typography.font.style.regular',
    'primitive.typography.font.style.bold',
    'primitive.typography.font.family.inter',
    'app.typography.md.fontSize',
    'app.typography.xl.fontSize',
    'app.typography.xxl.lineHeight',
  ];
  const { unmatched, byKind } = classify('aura/custom', paths);
  assert.deepEqual(unmatched, []);
  // sm/md/lg SIGUEN siendo el contrato value-checkeado del extend; xl/xxl no.
  assert.equal(byKind['value-check'].length, 1);
  // 2 font.style + 2 del tier xl/xxl que nadie consume
  assert.equal(byKind['not-consumed'].length, 4);
  // la familia es pila con fallbacks en CSS, una sola cara en el Kit
  assert.equal(byKind['divergence'].length, 1);
});

test('custom · el tier xl/xxl NO se cuela en el contrato value-check del extend', () => {
  // Si el regex del contrato se escribiera laxo (`app\.typography\.\w+\.`), xl/xxl entrarían
  // como value-check y §8 buscaría en extend.ts un paso que NO declara → rojo falso o, peor,
  // un contrato que dice cubrir algo que no cubre.
  const { byKind } = classify('aura/custom', ['app.typography.xl.fontSize', 'app.typography.sm.fontSize']);
  assert.deepEqual(byKind['value-check'], ['app.typography.sm.fontSize']);
  assert.deepEqual(byKind['not-consumed'], ['app.typography.xl.fontSize']);
});

test('custom · CARA ROJA · un custom NUEVO del Kit → unmatched (era el agujero)', () => {
  // Esto es exactamente lo que se escapaba: `aura/custom` salía en el censo de §7b
  // pero NO entraba en el gate de completitud de §8, así que el Kit podía añadir
  // un custom y no se ponía nada en rojo.
  const { unmatched } = classify('aura/custom', ['semantic.brandnuevo.color']);
  assert.deepEqual(unmatched, ['semantic.brandnuevo.color']);
});

test('custom · la tipografía NO se confunde con otra rama del mismo prefijo', () => {
  // `primitive.typography.*` tiene tres buckets distintos (size · line.height ·
  // weight). Si alguno se escribiera con un regex demasiado laxo, una hoja de otra
  // sub-rama caería en el bucket equivocado y el censo mentiría en silencio.
  const { unmatched } = classify('aura/custom', ['primitive.typography.letter.spacing.100']);
  assert.deepEqual(unmatched, ['primitive.typography.letter.spacing.100']);
});

test('estructura · cada bucket es {RegExp test, string kind, string note}; primary tiene 11 pasos', () => {
  for (const b of BUCKETS) {
    assert.ok(b.test instanceof RegExp, `bucket de ${b.group} sin RegExp`);
    assert.equal(typeof b.kind, 'string');
    assert.equal(typeof b.note, 'string');
  }
  assert.equal(PRIMARY_STEPS.length, 11);
});

// ── contrato de tipografía del extend (app.typography.*) ─────────────────────
// Vivían en la colección App del Kit (que el plugin no exporta) y ahora viajan en `custom`.
// Son las que el preset consume vía sc-preset/extend.ts, así que van a value-check, no a
// not-consumed: el §8 comprueba que Kit y extend.ts apuntan al MISMO paso.

test('custom · las 6 de app.typography → value-check (contrato del extend)', () => {
  const paths = APP_TYPOGRAPHY_CONTRACT.map((c) => `app.typography.${c.size}.${c.prop}`);
  const { unmatched, byKind } = classify('aura/custom', paths);
  assert.deepEqual(unmatched, []);
  assert.equal(byKind['value-check'].length, 6);
});

test('custom · custommodal → not-consumed (sin familia --sc-cmp-*, como bulktranscriptionmodal)', () => {
  const { unmatched, byKind } = classify('aura/custom', [
    'component.custommodal.background',
    'component.custommodal.footer.padding.left',
  ]);
  assert.deepEqual(unmatched, []);
  assert.equal(byKind['not-consumed'].length, 2);
});

test('CARA ROJA · una talla NUEVA de app.typography sigue sin clasificar', () => {
  // La talla de ejemplo era `xl` hasta que el 2026-09-02 Figma la creó de verdad (junto a `xxl`)
  // y hubo que DECIDIR qué era: medida (0 consumidores, fuera de extend.ts) → `not-consumed`.
  // El guard no se afloja por eso: sigue exigiendo una decisión humana para la SIGUIENTE talla,
  // que es lo que este test protege. Si algún día `xxxl` existe, se clasifica y se mueve el
  // ejemplo otra vez; lo que no puede pasar es que una talla entre sin que nadie la mire.
  const { unmatched } = classify('aura/custom', ['app.typography.xxxl.lineHeight']);
  assert.deepEqual(unmatched, ['app.typography.xxxl.lineHeight']);
});

test('el contrato cubre las 3 tallas x 2 propiedades, sin duplicados', () => {
  assert.equal(APP_TYPOGRAPHY_CONTRACT.length, 6);
  const keys = APP_TYPOGRAPHY_CONTRACT.map((c) => `${c.size}.${c.prop}`);
  assert.equal(new Set(keys).size, 6);
  for (const c of APP_TYPOGRAPHY_CONTRACT) {
    assert.match(c.cssVar, /^sc-(font-size|line-height)$/);
    assert.match(c.kitFamily, /^(font|line)\.(size|height)$/);
  }
});
