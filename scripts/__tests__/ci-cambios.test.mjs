import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { APPS, SUITES, appsDeAngular, scriptsAlcanzadosPorE2e, suitesPara as decidir } from '../ci-cambios.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TODO = Object.fromEntries(SUITES.map((s) => [s, true]));
const NADA = Object.fromEntries(SUITES.map((s) => [s, false]));
const ALCANZADOS = scriptsAlcanzadosPorE2e(root);
const suitesPara = (ficheros) => decidir(ficheros, ALCANZADOS);

test('un cambio solo del Supervisor corre solo su suite', () => {
  assert.deepEqual(
    suitesPara(['projects/supervisor/src/app/x.ts', 'e2e/supervisor/y.spec.ts', 'playwright.supervisor.config.ts']),
    { ...NADA, supervisor: true },
  );
});

test('CusCare y sc-docs, cada uno la suya; agent y agent-mini ninguna (solo build)', () => {
  assert.deepEqual(suitesPara(['projects/cuscare/src/a.ts']), { ...NADA, cuscare: true });
  assert.deepEqual(suitesPara(['projects/sc-docs/src/a.ts', 'e2e/components.spec.ts']), { ...NADA, smoke: true });
  assert.deepEqual(suitesPara(['projects/agent/src/a.ts', 'projects/agent-mini/src/b.ts']), NADA);
});

test('solo documentación: ninguna suite', () => {
  assert.deepEqual(suitesPara(['docs/DECISIONS.md', 'LEARNINGS.md', 'findings/x.json', '.claude/settings.json']), NADA);
});

test('ROJO si se esconde: el DS, la raíz, scripts y lo compartido de e2e corren TODO', () => {
  for (const f of [
    'projects/ui-smartcontact/src/lib/components/button/sc-button.component.ts',
    'projects/design-tokens/src/x.css',
    'projects/ui-smartcontact-icons/src/x.ts',
    'package.json',
    'package-lock.json',
    'angular.json',
    'tsconfig.json',
    'scripts/playwright-reuse-guard.mjs',
    'scripts/paths.mjs',
    'e2e/shared/deterministic.ts',
    'e2e/usage/x.spec.ts',
    '.github/workflows/ci.yml',
    'una/ruta/que/nadie/previo.ts',
  ]) {
    assert.deepEqual(suitesPara(['projects/supervisor/src/a.ts', f]), TODO, f);
  }
});

test('ROJO: cada app de angular.json está clasificada (una app nueva no se cuela sin suites)', () => {
  const apps = appsDeAngular(readFileSync(join(root, 'angular.json'), 'utf8'));
  assert.ok(apps.length >= 5, 'angular.json tiene que listar las apps');
  const sinClasificar = apps.filter((a) => !(a in APPS));
  assert.deepEqual(sinClasificar, [], 'añádela a APPS en scripts/ci-cambios.mjs, con su suite o null');
  const fantasma = Object.keys(APPS).filter((a) => !apps.includes(a));
  assert.deepEqual(fantasma, [], 'APPS cita una app que ya no está en angular.json');
});

test('cada suite de APPS es una de las que el CI conoce', () => {
  for (const [app, suite] of Object.entries(APPS)) {
    assert.ok(suite === null || SUITES.includes(suite), `${app} → ${suite}`);
  }
});

test('un script que ninguna e2e alcanza (un gate de verify) no corre suites', () => {
  assert.ok(!ALCANZADOS.has('scripts/audit-titulo-contenido.mjs'));
  assert.deepEqual(suitesPara(['scripts/audit-titulo-contenido.mjs', 'projects/supervisor/src/a.ts']), {
    ...NADA,
    supervisor: true,
  });
});

test('ROJO: lo que importa una config de Playwright, y lo que eso importa, cuenta como alcanzado', () => {
  assert.ok(ALCANZADOS.has('scripts/playwright-reuse-guard.mjs'), 'lo importan las configs');
  assert.ok(ALCANZADOS.has('scripts/paths.mjs'), 'lo importa dtcg-export, que importa una e2e');
});

test('la plantilla de PR, una herramienta que ninguna e2e alcanza y los ficheros sueltos de git no corren suites (DD-155)', () => {
  // Medido en los últimos 80 PR: cinco corrieron las tres suites por uno de estos, y el #319, de solo
  // texto, tardó 15 minutos en vez de 2. Ninguno lo lee una app ni una prueba.
  for (const f of [
    '.github/pull_request_template.md',
    '.github/ISSUE_TEMPLATE/fallo.md',
    'tools/check-backticks.ts',
    '.git-blame-ignore-revs',
    'prueba-squash.txt',
  ]) {
    assert.deepEqual(suitesPara([f]), NADA, f);
    assert.deepEqual(suitesPara(['projects/supervisor/src/a.ts', f]), { ...NADA, supervisor: true }, f);
  }
});

test('ROJO: una herramienta de tools/ que alcanza una e2e corre TODO, como un script', () => {
  assert.deepEqual(decidir(['tools/x.mjs'], new Set(['tools/x.mjs'])), TODO);
  const raiz = mkdtempSync(join(tmpdir(), 'ci-cambios-'));
  mkdirSync(join(raiz, 'e2e'));
  mkdirSync(join(raiz, 'tools'));
  writeFileSync(join(raiz, 'e2e', 'a.spec.ts'), "import { x } from '../tools/medir.mjs';\n");
  writeFileSync(join(raiz, 'tools', 'medir.mjs'), "import { y } from './apoyo.mjs';\n");
  writeFileSync(join(raiz, 'tools', 'apoyo.mjs'), 'export const y = 1;\n');
  writeFileSync(join(raiz, 'tools', 'suelta.mjs'), 'export const z = 1;\n');
  const alcanzados = scriptsAlcanzadosPorE2e(raiz);
  assert.ok(alcanzados.has('tools/medir.mjs') && alcanzados.has('tools/apoyo.mjs'), [...alcanzados].join(', '));
  assert.ok(!alcanzados.has('tools/suelta.mjs'));
});

test('ROJO: el workflow del CI no es documentación aunque viva en .github', () => {
  assert.deepEqual(suitesPara(['.github/workflows/ci.yml']), TODO);
});
