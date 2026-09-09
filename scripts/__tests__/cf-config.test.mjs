import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { evaluar, esperado, PROYECTOS } from '../audit-cf-config.mjs';

const por = (app) => PROYECTOS.find((p) => p.app === app);

// Cada desviación se prueba EN ROJO (la configuración que motivó la regla) y EN VERDE (la
// correcta). Un guardián que solo se ha visto pasar no prueba que sepa fallar (LEARNINGS 2).

const sano = (app) => ({
  build_config: { build_command: `npm run ${por(app).script}`, destination_dir: `dist/${app}/browser`, root_dir: '' },
  production_branch: 'main',
  deployment_configs: { production: { env_vars: null } },
});

test('un proyecto configurado como el repo espera no da desviaciones', () => {
  for (const e of PROYECTOS) assert.deepEqual(evaluar(e, sano(e.app)), []);
});

test('el caso real de supervisor (ng build suelto, 2026-09-09) → rojo nombrando build.json', () => {
  const p = sano('supervisor');
  p.build_config.build_command = 'npm run build && npx ng build supervisor --configuration production';
  const fallos = evaluar(por('supervisor'), p);
  assert.equal(fallos.length, 1);
  assert.match(fallos[0], /build command/);
  assert.match(fallos[0], /npm run build:supervisor/);
  assert.match(fallos[0], /build\.json/);
});

test('output dir, production branch y NODE_VERSION se vigilan por separado', () => {
  const p = sano('agent');
  p.build_config.destination_dir = 'dist/agent';
  p.production_branch = 'feat/algo';
  p.deployment_configs.production.env_vars = { NODE_VERSION: { type: 'plain_text', value: '22' } };
  const fallos = evaluar(por('agent'), p);
  assert.equal(fallos.length, 3);
  assert.match(fallos[0], /output dir/);
  assert.match(fallos[1], /production branch/);
  assert.match(fallos[2], /NODE_VERSION/);
});

test('un proyecto vacío o sin build_config no revienta: lo cuenta todo como desviación', () => {
  assert.equal(evaluar(por('cuscare'), {}).length, 3);
  assert.equal(evaluar(por('cuscare'), undefined).length, 3);
});

test('sc-docs se construye con build:docs, no con build:sc-docs (casi se coló al escribir esto)', () => {
  assert.deepEqual(esperado(por('sc-docs')), {
    build_command: 'npm run build:docs',
    destination_dir: 'dist/sc-docs/browser',
    production_branch: 'main',
  });
});

test('el mapa cubre las cinco apps y cada script existe en package.json y termina sellando', () => {
  const { scripts } = JSON.parse(readFileSync(fileURLToPath(import.meta.resolve('../../package.json')), 'utf8'));
  assert.deepEqual(
    PROYECTOS.map((p) => p.app).sort(),
    ['agent', 'agent-mini', 'cuscare', 'sc-docs', 'supervisor'],
  );
  for (const { app, script } of PROYECTOS) {
    assert.ok(scripts[script], `falta el script ${script}`);
    assert.match(scripts[script], new RegExp(`stamp-build\\.mjs ${app}$`), `${script} no sella ${app}`);
  }
});
