import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLOR, ENFORCE, DIVERGE, GENERATED, isGenerated } from '../color-map.mjs';

test('COLOR no vacío y cada fila bien formada', () => {
  assert.ok(Array.isArray(COLOR) && COLOR.length > 0);
  for (const r of COLOR) {
    assert.ok(['light', 'dark'].includes(r.mode), `mode inválido: ${JSON.stringify(r)}`);
    assert.equal(typeof r.exp, 'string');
    assert.ok(r.exp.length > 0);
    assert.ok(['enforce', 'diverge'].includes(r.kind), `kind inválido: ${JSON.stringify(r)}`);
  }
});

test('enforce → token --sc-* válido; diverge → token null + reason', () => {
  for (const r of ENFORCE) {
    assert.equal(typeof r.token, 'string', `enforce sin token: ${JSON.stringify(r)}`);
    assert.match(r.token, /^sc-[a-z0-9-]+$/, `token mal formado: ${r.token}`);
  }
  for (const r of DIVERGE) {
    assert.equal(r.token, null, `diverge con token: ${JSON.stringify(r)}`);
    assert.equal(typeof r.reason, 'string');
    assert.ok(r.reason.length > 0);
  }
});

test('ENFORCE + DIVERGE particionan COLOR', () => {
  assert.equal(ENFORCE.length + DIVERGE.length, COLOR.length);
});

test('GENERATED ⊆ ENFORCE y nunca escribe una primitiva sc-color-*', () => {
  for (const r of GENERATED) {
    assert.equal(r.kind, 'enforce');
    assert.ok(isGenerated(r));
    assert.ok(!r.token.startsWith('sc-color-'), `el generador no debe escribir primitivas: ${r.token}`);
  }
  // Las filas surface (sc-color-gray-*) son enforce (para parity) pero NO generadas:
  // las posee el generador de primitivos.
  const surface = ENFORCE.filter((r) => r.token.startsWith('sc-color-'));
  assert.ok(surface.length > 0, 'se esperaban filas surface enforce');
  for (const r of surface) assert.ok(!isGenerated(r), `surface no debe ser generable: ${r.token}`);
});

test('ninguna divergencia colisiona con un enforce en [mode, exp]', () => {
  const enf = new Set(ENFORCE.map((r) => `${r.mode}|${r.exp}`));
  for (const r of DIVERGE) {
    assert.ok(!enf.has(`${r.mode}|${r.exp}`), `diverge pisa enforce: ${r.mode}|${r.exp}`);
  }
});
