import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeComponent } from '../component-audit.mjs';

// analyzeComponent: deriva la clasificación del texto del componente. PURA → fixtures directos.

const base = { pagesText: "{ path: 'foo' }", supervisorBlob: '' };

test('WRAPPER passthrough → STANDARD (pocos inputs, sin CVA)', () => {
  const r = analyzeComponent({
    name: 'divider',
    tsText: "import { DividerModule } from 'primeng/divider';\nselector: 'sc-divider',\n input() a; input() b;",
    htmlText: '<p-divider></p-divider>',
    ...base,
  });
  assert.equal(r.provenance, 'WRAPPER');
  assert.equal(r.kind, 'STANDARD');
  assert.equal(r.primengBase, 'primeng/divider');
});

test('WRAPPER con CVA → EXTENDED + flag cva', () => {
  const r = analyzeComponent({
    name: 'select',
    tsText: "import { SelectModule } from 'primeng/select';\nimport { PrimeTemplate } from 'primeng/api';\nselector: 'sc-select',\n implements ControlValueAccessor",
    htmlText: '<p-select></p-select>',
    ...base,
  });
  assert.equal(r.kind, 'EXTENDED');
  assert.equal(r.cva, true);
  assert.equal(r.primengBase, 'primeng/select'); // primeng/api se ignora (utilidad)
});

test('WRAPPER con muchos inputs (≥4) → EXTENDED aunque no haya CVA', () => {
  const r = analyzeComponent({ name: 'button', tsText: "from 'primeng/button';\nselector: 'sc-button',\ninput()a;input()b;input()c;input()d;", htmlText: '', ...base });
  assert.equal(r.kind, 'EXTENDED');
});

test('CUSTOM = sin import primeng', () => {
  const r = analyzeComponent({ name: 'empty-state', tsText: "selector: 'sc-empty-state',\n input() a;", htmlText: '<div></div>', ...base });
  assert.equal(r.provenance, 'CUSTOM');
  assert.equal(r.kind, 'CUSTOM');
  assert.equal(r.primengBase, '—');
});

test('anidados excluyen sc-icon y el propio selector; cuenta usos en Supervisor', () => {
  const r = analyzeComponent({
    name: 'section-card',
    tsText: "selector: 'sc-section-card',",
    htmlText: '<sc-icon></sc-icon> <sc-slot></sc-slot> <sc-section-card>',
    pagesText: '',
    supervisorBlob: '<sc-section-card> uno <sc-section-card class="x"> dos',
  });
  assert.deepEqual(r.nested, ['sc-slot']); // sc-icon fuera, self fuera
  assert.equal(r.usedInSupervisor, 2);
  assert.equal(r.hasDemo, false);
});

// Los comentarios no cuentan como código. El caso real (2026-08-14): el docstring de
// `sc-button` pasó a explicar su "API pública `input()/output()`" al migrarlo a señales y su
// cuenta subió de 15 a 16 inputs sin haber cambiado la superficie del componente.
test('un `input()` MENCIONADO en un comentario no suma a la cuenta', () => {
  const conComentario = analyzeComponent({
    name: 'button',
    tsText: "/** API pública `input()/output()`. */\nselector: 'sc-button',\nreadonly a = input('');",
    htmlText: '',
    ...base,
  });
  const sinComentario = analyzeComponent({
    name: 'button',
    tsText: "selector: 'sc-button',\nreadonly a = input('');",
    htmlText: '',
    ...base,
  });
  assert.equal(conComentario.inputs, 1);
  assert.equal(conComentario.inputs, sinComentario.inputs);
  assert.deepEqual(conComentario.api, ['a']);
});

test('un comentario que nombra ControlValueAccessor no marca el componente como CVA', () => {
  const r = analyzeComponent({
    name: 'button',
    tsText: "// no implementa ControlValueAccessor a propósito\nselector: 'sc-button',",
    htmlText: '',
    ...base,
  });
  assert.equal(r.cva, false);
});

test('hasDemo detecta la página por path', () => {
  const r = analyzeComponent({ name: 'button', tsText: "selector: 'sc-button',", htmlText: '', pagesText: "{ path: 'button' }", supervisorBlob: '' });
  assert.equal(r.hasDemo, true);
});
