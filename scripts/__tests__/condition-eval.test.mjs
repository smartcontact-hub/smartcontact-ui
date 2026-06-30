/**
 * Tests del núcleo del motor de evaluación de impacto de reglas
 * (`projects/supervisor/.../data/condition-eval.core.mjs`). Pure logic, node:test,
 * dentro del gate (`test:unit`). El puente de nombres se stubea por ctx.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  conversationMatchesTree,
  hasUnevaluableConditions,
  parseDurationSecs,
  projectImpact,
} from '../../projects/supervisor/src/app/features/memory/data/condition-eval.core.mjs';

/** Stub: grupo 5 → agente 7; agente 7 → "María García"; grupo 1 → "ACD Demo C2CB". */
const ctx = {
  memberAgentIds: (id) => (id === 5 ? [7] : []),
  agentConvName: (id) => ({ 7: 'María García' })[id],
  groupConvName: (id) => ({ 1: 'ACD Demo C2CB' })[id],
};

const conv = (p = {}) => ({
  service: '',
  origin: '',
  group: '',
  direction: 'entrante',
  duration: '01:00',
  ...p,
});
const c = (field, operator, value) => ({ id: 'c', field, operator, value });
const tree = (conditions, match = 'all') => ({ match: 'all', groups: [{ id: 'g', match, conditions }] });

test('parseDurationSecs: mm:ss → segundos', () => {
  assert.equal(parseDurationSecs('01:30'), 90);
  assert.equal(parseDurationSecs('00:00'), 0);
  assert.equal(parseDurationSecs('10:05'), 605);
});

test('servicio: casa por nombre exacto, no_es invierte', () => {
  const t = tree([c('servicio', 'is', { mode: 'refs', refs: [{ kind: 'service', name: 'Ventas' }] })]);
  assert.equal(conversationMatchesTree(conv({ service: 'Ventas' }), t, ctx), true);
  assert.equal(conversationMatchesTree(conv({ service: 'Soporte' }), t, ctx), false);
  const tn = tree([c('servicio', 'is_not', { mode: 'refs', refs: [{ kind: 'service', name: 'Ventas' }] })]);
  assert.equal(conversationMatchesTree(conv({ service: 'Ventas' }), tn, ctx), false);
  assert.equal(conversationMatchesTree(conv({ service: 'Soporte' }), tn, ctx), true);
});

test('dirección: inbound→entrante', () => {
  const t = tree([c('direccion', 'is', { mode: 'enum', value: 'inbound' })]);
  assert.equal(conversationMatchesTree(conv({ direction: 'entrante' }), t, ctx), true);
  assert.equal(conversationMatchesTree(conv({ direction: 'saliente' }), t, ctx), false);
});

test('duración: gt/lt/between con unidades', () => {
  const gt = tree([c('duracion', 'gt', { mode: 'number', amount: 60, unit: 'seconds' })]);
  assert.equal(conversationMatchesTree(conv({ duration: '01:30' }), gt, ctx), true);
  assert.equal(conversationMatchesTree(conv({ duration: '00:45' }), gt, ctx), false);
  const bt = tree([c('duracion', 'between', { mode: 'number', amount: 1, amount2: 2, unit: 'minutes' })]);
  assert.equal(conversationMatchesTree(conv({ duration: '01:30' }), bt, ctx), true);
  assert.equal(conversationMatchesTree(conv({ duration: '02:30' }), bt, ctx), false);
});

test('agente individual vía puente', () => {
  const t = tree([c('agente', 'is', { mode: 'refs', refs: [{ kind: 'agent', id: 7 }] })]);
  assert.equal(conversationMatchesTree(conv({ origin: 'María García' }), t, ctx), true);
  assert.equal(conversationMatchesTree(conv({ origin: 'Ana Martínez' }), t, ctx), false);
});

test('agentGroup: resuelve miembros vivos (ctx) + puente', () => {
  const t = tree([c('agente', 'is', { mode: 'refs', refs: [{ kind: 'agentGroup', id: 5 }] })]);
  assert.equal(conversationMatchesTree(conv({ origin: 'María García' }), t, ctx), true);
  assert.equal(conversationMatchesTree(conv({ origin: 'Sergio Ruiz' }), t, ctx), false);
});

test('comodín "any" casa cualquiera; refs vacías no constriñen', () => {
  const any = tree([c('servicio', 'is', { mode: 'any' })]);
  assert.equal(conversationMatchesTree(conv({ service: 'X' }), any, ctx), true);
  const empty = tree([c('servicio', 'is', { mode: 'refs', refs: [] })]);
  assert.equal(conversationMatchesTree(conv({ service: 'X' }), empty, ctx), true);
});

test('tipificación/categoría no evaluables → no filtran + flag', () => {
  const t = tree([c('tipificacion', 'is', { mode: 'refs', refs: [{ kind: 'tipificacion', id: 1 }] })]);
  assert.equal(conversationMatchesTree(conv({}), t, ctx), true);
  assert.equal(hasUnevaluableConditions(t), true);
  assert.equal(hasUnevaluableConditions(tree([c('servicio', 'is', { mode: 'any' })])), false);
});

test('árbol sin condiciones evaluables → aplica a todas', () => {
  assert.equal(conversationMatchesTree(conv({}), { match: 'all', groups: [] }, ctx), true);
});

test('grupo match all exige todas; match any basta una', () => {
  const conds = [
    c('servicio', 'is', { mode: 'refs', refs: [{ kind: 'service', name: 'Ventas' }] }),
    c('direccion', 'is', { mode: 'enum', value: 'inbound' }),
  ];
  const all = tree(conds, 'all');
  assert.equal(conversationMatchesTree(conv({ service: 'Ventas', direction: 'entrante' }), all, ctx), true);
  assert.equal(conversationMatchesTree(conv({ service: 'Ventas', direction: 'saliente' }), all, ctx), false);
  const any = tree(conds, 'any');
  assert.equal(conversationMatchesTree(conv({ service: 'Soporte', direction: 'entrante' }), any, ctx), true);
  assert.equal(conversationMatchesTree(conv({ service: 'Soporte', direction: 'saliente' }), any, ctx), false);
});

test('projectImpact: proyecta el ratio real a día/mes; total 0 → ceros', () => {
  assert.deepEqual(projectImpact(8, 34, 420), { perDay: 99, perMonth: 2970 }); // 8/34·420≈99
  assert.deepEqual(projectImpact(34, 34, 420), { perDay: 420, perMonth: 12600 }); // ratio 1
  assert.deepEqual(projectImpact(0, 34, 420), { perDay: 0, perMonth: 0 });
  assert.deepEqual(projectImpact(5, 0, 420), { perDay: 0, perMonth: 0 }); // sin evaluables
});

test('grupos raíz: all vs any', () => {
  const g1 = { id: 'g1', match: 'all', conditions: [c('servicio', 'is', { mode: 'refs', refs: [{ kind: 'service', name: 'Ventas' }] })] };
  const g2 = { id: 'g2', match: 'all', conditions: [c('direccion', 'is', { mode: 'enum', value: 'inbound' })] };
  const anyRoot = { match: 'any', groups: [g1, g2] };
  assert.equal(conversationMatchesTree(conv({ service: 'Ventas', direction: 'saliente' }), anyRoot, ctx), true);
  const allRoot = { match: 'all', groups: [g1, g2] };
  assert.equal(conversationMatchesTree(conv({ service: 'Ventas', direction: 'saliente' }), allRoot, ctx), false);
});
