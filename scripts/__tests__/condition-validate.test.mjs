// Tests del validador puro del constructor de condiciones (Bloque 8).
// Corre en el gate vía `npm run test:unit` (node --test scripts/__tests__/*.test.mjs).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isIncomplete,
  validateConditionTree,
} from '../../projects/supervisor/src/app/features/memory/data/condition-validate.core.mjs';

/* ── Helpers de construcción ── */
let seq = 0;
const cond = (field, operator, value) => ({ id: `c${++seq}`, field, operator, value });
const refs = (...rs) => ({ mode: 'refs', refs: rs });
const enumV = (value) => ({ mode: 'enum', value });
const numV = (amount, amount2, unit = 'seconds') => ({ mode: 'number', amount, amount2, unit });
const svc = (name) => ({ kind: 'service', name });
const agent = (id) => ({ kind: 'agent', id });
const agentGroup = (id) => ({ kind: 'agentGroup', id });
const group = (match, ...conditions) => ({ id: `g${++seq}`, match, conditions });
const tree = (match, ...groups) => ({ match, groups });
const codes = (t) => validateConditionTree(t).map((i) => i.code).sort();

/* ── incomplete (error) ── */
test('refs vacías = incompleta', () => {
  assert.equal(isIncomplete(cond('servicio', 'is', refs())), true);
  assert.equal(isIncomplete(cond('servicio', 'is', refs(svc('Ventas')))), false);
});

test('enum sin valor = incompleta; number/any = completos', () => {
  assert.equal(isIncomplete(cond('direccion', 'is', enumV(''))), true);
  assert.equal(isIncomplete(cond('direccion', 'is', enumV('inbound'))), false);
  assert.equal(isIncomplete(cond('duracion', 'gt', numV(30))), false);
  assert.equal(isIncomplete(cond('servicio', 'is', { mode: 'any' })), false);
});

test('condición incompleta produce un error "incomplete"', () => {
  const t = tree('all', group('all', cond('servicio', 'is', refs())));
  const issues = validateConditionTree(t);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].severity, 'error');
  assert.equal(issues[0].code, 'incomplete');
});

/* ── invalid_range (error) ── */
test('duración "entre" con mín ≥ máx = error invalid_range', () => {
  const bad = tree('all', group('all', cond('duracion', 'between', numV(60, 30))));
  assert.deepEqual(codes(bad), ['invalid_range']);
  const ok = tree('all', group('all', cond('duracion', 'between', numV(30, 60))));
  assert.deepEqual(codes(ok), []);
});

/* ── duplicate (warning) ── */
test('condición idéntica repetida en el grupo = warning duplicate (una vez)', () => {
  const t = tree(
    'all',
    group('all', cond('servicio', 'is', refs(svc('Ventas'))), cond('servicio', 'is', refs(svc('Ventas')))),
  );
  assert.deepEqual(codes(t), ['duplicate']);
});

test('mismo valor en grupos distintos NO es duplicado', () => {
  const t = tree(
    'any',
    group('all', cond('servicio', 'is', refs(svc('Ventas')))),
    group('all', cond('servicio', 'is', refs(svc('Ventas')))),
  );
  assert.deepEqual(codes(t), []);
});

/* ── contradiction (warning, solo en "todas"/Y) ── */
test('servicio es A Y servicio es B (disjuntos) = contradiction', () => {
  const t = tree(
    'all',
    group('all', cond('servicio', 'is', refs(svc('Ventas'))), cond('servicio', 'is', refs(svc('Postventa')))),
  );
  assert.deepEqual(codes(t), ['contradiction']);
});

test('conjuntos "es" con solape NO es contradicción', () => {
  const t = tree(
    'all',
    group('all', cond('servicio', 'is', refs(svc('Ventas'), svc('X'))), cond('servicio', 'is', refs(svc('Ventas')))),
  );
  assert.deepEqual(codes(t), []);
});

test('servicio es A Y servicio no es A = contradiction', () => {
  const t = tree(
    'all',
    group('all', cond('servicio', 'is', refs(svc('Ventas'))), cond('servicio', 'is_not', refs(svc('Ventas')))),
  );
  assert.deepEqual(codes(t), ['contradiction']);
});

test('tipificación (multi-valor) es A Y es B NO es contradicción', () => {
  const t = tree(
    'all',
    group('all', cond('tipificacion', 'is', refs({ kind: 'tipificacion', id: 1 })), cond('tipificacion', 'is', refs({ kind: 'tipificacion', id: 2 }))),
  );
  assert.deepEqual(codes(t), []);
});

test('agentGroup es opaco: no se infiere contradicción de membresía', () => {
  const t = tree(
    'all',
    group('all', cond('agente', 'is', refs(agent(8))), cond('agente', 'is', refs(agentGroup(5)))),
  );
  assert.deepEqual(codes(t), []);
});

test('contradicción NO aplica en grupo "cualquiera"/O', () => {
  const t = tree(
    'any',
    group('any', cond('servicio', 'is', refs(svc('Ventas'))), cond('servicio', 'is', refs(svc('Postventa')))),
  );
  assert.deepEqual(codes(t), []);
});

/* ── tautology (warning, solo en "cualquiera"/O) ── */
test('servicio es A O servicio no es A = tautology', () => {
  const t = tree(
    'any',
    group('any', cond('servicio', 'is', refs(svc('Ventas'))), cond('servicio', 'is_not', refs(svc('Ventas')))),
  );
  assert.deepEqual(codes(t), ['tautology']);
});

test('es A O no es B (valores distintos) NO es tautología', () => {
  const t = tree(
    'any',
    group('any', cond('servicio', 'is', refs(svc('Ventas'))), cond('servicio', 'is_not', refs(svc('Postventa')))),
  );
  assert.deepEqual(codes(t), []);
});

/* ── árbol limpio ── */
test('árbol válido sin choques = sin incidencias', () => {
  const t = tree(
    'all',
    group('all', cond('servicio', 'is', refs(svc('Ventas'))), cond('duracion', 'gt', numV(60))),
  );
  assert.deepEqual(codes(t), []);
});
