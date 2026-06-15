/**
 * Invariantes del mapa de sizing (`sizing-map.mjs`). Si el mapa se corrompe
 * (label duplicado, token colisionando, grupo inválido) lo cazamos aquí antes
 * de que el generador escriba basura o parity compare mal.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { SIZING, GROUPS, DIVERGE_SIZING, cmpName } from '../sizing-map.mjs';

test('SIZING no está vacío y cada fila tiene la forma esperada', () => {
  assert.ok(SIZING.length > 0, 'SIZING vacío');
  for (const r of SIZING) {
    assert.equal(typeof r.label, 'string', `label inválido: ${JSON.stringify(r)}`);
    assert.ok(r.group in GROUPS, `group desconocido en ${r.label}: ${r.group}`);
    assert.equal(typeof r.exp, 'string', `exp inválido en ${r.label}`);
    assert.ok(r.read && typeof r.read.path === 'string', `read.path inválido en ${r.label}`);
  }
});

test('labels únicos', () => {
  const seen = new Set();
  for (const r of SIZING) {
    assert.ok(!seen.has(r.label), `label duplicado: ${r.label}`);
    seen.add(r.label);
  }
});

test('cmpName produce nombres únicos y válidos (kebab, sin colisiones)', () => {
  const seen = new Set();
  for (const r of SIZING) {
    const cmp = cmpName(r.label);
    assert.match(cmp, /^[a-z0-9]+(-[a-z0-9]+)*$/, `cmpName(${r.label}) = "${cmp}" no es kebab válido`);
    assert.ok(!seen.has(cmp), `colisión de token: --sc-cmp-${cmp} (label ${r.label})`);
    seen.add(cmp);
  }
});

test('read shorthand: fallback solo acompaña a index', () => {
  for (const r of SIZING) {
    if (r.read.fallback !== undefined) {
      assert.notEqual(r.read.index, undefined, `${r.label}: fallback sin index`);
      assert.equal(typeof r.read.fallback, 'number', `${r.label}: fallback no numérico`);
    }
    if (r.read.index !== undefined) assert.equal(typeof r.read.index, 'number', `${r.label}: index no numérico`);
  }
});

test('DIVERGE_SIZING: cada divergencia apunta a un label real con razón', () => {
  const labels = new Set(SIZING.map((r) => r.label));
  for (const d of DIVERGE_SIZING) {
    assert.ok(labels.has(d.label), `DIVERGE_SIZING apunta a un label inexistente: ${d.label}`);
    assert.equal(typeof d.reason, 'string', `DIVERGE_SIZING sin razón: ${d.label}`);
  }
});
