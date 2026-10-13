// La accesibilidad de una story de sc-docs (`a11y.core.mjs`): cómo se cuenta y se enseña un fallo de axe. Es la MISMA
// cuenta en el panel del lienzo y en `e2e/sc-docs-a11y.spec.ts`. node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  agruparNodos,
  contarFallos,
  localeEs,
  resumirViolaciones,
} from '../../projects/sc-docs/src/app/storybook/a11y.core.mjs';

// Dos violaciones como las devuelve axe (recortadas a lo que se lee).
const AXE = [
  {
    id: 'target-size',
    impact: 'serious',
    help: 'Zona pequeña',
    helpUrl: 'https://x/target-size',
    nodes: [
      { target: ['button:nth-child(1)'], html: '<button>', failureSummary: 'mide 20 × 20' },
      { target: ['button:nth-child(2)'], html: '<button>', failureSummary: 'mide 20 × 20' },
    ],
  },
  {
    id: 'aria-hidden-focus',
    impact: 'critical',
    help: 'Foco dentro de algo oculto',
    helpUrl: 'https://x/aria-hidden-focus',
    nodes: [{ target: ['.p-chip-remove-icon'], html: '<span>', failureSummary: 'enfocable' }],
  },
];

test('resumirViolaciones: lo más grave primero, con su selector y su motivo', () => {
  const r = resumirViolaciones(AXE);
  assert.deepEqual(r.map((v) => v.regla), ['aria-hidden-focus', 'target-size']);
  assert.equal(r[1].nodos[0].selector, 'button:nth-child(1)');
  assert.equal(r[1].nodos[0].resumen, 'mide 20 × 20');
  assert.deepEqual(resumirViolaciones(null), []);
});

test('contarFallos: cada ELEMENTO que falla una regla cuenta uno', () => {
  assert.equal(contarFallos(resumirViolaciones(AXE)), 3);
  assert.equal(contarFallos([]), 0);
});

test('agruparNodos: los que fallan por el mismo motivo van juntos y contados', () => {
  const nodos = [
    { selector: 'a', elemento: 'button', resumen: 'pequeño' },
    { selector: 'b', elemento: 'button', resumen: 'pequeño' },
    { selector: 'c', elemento: 'span', resumen: 'pequeño' },
    { selector: 'd', resumen: 'sin nombre' },
  ];
  const g = agruparNodos(nodos);
  assert.equal(g.length, 2);
  assert.equal(g[0].elementos, 'button ×2, span');
  assert.equal(g[0].nodos.length, 3);
  assert.equal(g[1].elementos, 'd', 'sin nombre legible, el selector');
});

test('localeEs: suma lo que falta sin pisar lo que la traducción de axe ya trae', () => {
  const es = { lang: 'es', rules: { label: { help: 'etiqueta' } }, checks: { 'has-alt': { pass: 'sí' } } };
  const l = localeEs(es);
  assert.equal(l.lang, 'es');
  assert.equal(l.rules.label.help, 'etiqueta');
  assert.match(l.rules['target-size'].help, /24 × 24 px/);
  assert.ok(l.checks['has-alt'] && l.checks['target-offset']);
});
