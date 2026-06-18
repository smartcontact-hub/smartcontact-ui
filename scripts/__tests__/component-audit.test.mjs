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

test('hasDemo detecta la página por path', () => {
  const r = analyzeComponent({ name: 'button', tsText: "selector: 'sc-button',", htmlText: '', pagesText: "{ path: 'button' }", supervisorBlob: '' });
  assert.equal(r.hasDemo, true);
});
