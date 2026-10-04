import { test } from 'node:test';
import assert from 'node:assert/strict';

import { planDe } from '../preflight-alcance.mjs';

test('un bloque del Supervisor con sus pruebas y tests de scripts compila solo el Supervisor (DD-155)', () => {
  // La forma de E1b-D3 (2026-10-02): app, su e2e, tests de scripts y documentación. Antes, `e2e/` y
  // `scripts/` mandaban a la cadena completa y se compilaban las cinco apps.
  const plan = planDe([
    'projects/supervisor/src/app/features/admin/groups/x.component.ts',
    'e2e/supervisor/grupo-tiempos-horarios.spec.ts',
    'scripts/__tests__/group-times.test.mjs',
    'docs/DECISIONS.md',
    'AGENTS.md',
  ]);
  assert.equal(plan.completo, false, plan.compartidos.join(', '));
  assert.deepEqual(plan.appsTocadas, ['supervisor']);
});

test('pruebas, hooks, configs de Playwright y el CI no compilan ninguna app: verify ya los cubre', () => {
  for (const f of [
    'e2e/supervisor/a.spec.ts',
    'e2e/shared/deterministic.ts',
    'playwright.supervisor.config.ts',
    'scripts/__tests__/x.test.mjs',
    'scripts/hooks/bash-guard.mjs',
    '.github/workflows/ci.yml',
    '.github/pull_request_template.md',
    'tools/check-backticks.ts',
  ]) {
    const plan = planDe([f]);
    assert.equal(plan.completo, false, f);
    assert.deepEqual(plan.appsTocadas, [], f);
  }
});

test('ROJO si se esconde: el DS, los tokens, las configs de la raíz y los scripts de la cadena compilan todo', () => {
  for (const f of [
    'projects/ui-smartcontact/src/lib/components/button/sc-button.component.ts',
    'projects/ui-smartcontact-icons/src/x.ts',
    'projects/design-tokens/src/x.css',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'angular.json',
    'eslint.config.js',
    'scripts/generate-icons.mjs',
    'scripts/en-paralelo.mjs',
  ]) {
    assert.equal(planDe(['projects/supervisor/src/a.ts', f]).completo, true, f);
  }
});

test('cada app tocada se compila; las demás se saltan', () => {
  const plan = planDe(['projects/cuscare/src/a.ts', 'projects/agent-mini/src/b.ts']);
  assert.equal(plan.completo, false);
  assert.deepEqual(plan.appsTocadas.sort(), ['agent-mini', 'cuscare']);
});
