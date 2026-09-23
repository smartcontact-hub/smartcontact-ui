import { test } from 'node:test';
import assert from 'node:assert/strict';

import { evaluar, esperado, PROYECTOS } from '../audit-cf-config.mjs';
import { SITIOS } from '../cf-sites.mjs';

const por = (app) => PROYECTOS.find((p) => p.app === app);

// Cada desviación se prueba EN ROJO (la configuración que motivó la regla) y EN VERDE (la
// correcta). Un guardián que solo se ha visto pasar no prueba que sepa fallar (LEARNINGS 2).

const sano = (app) => ({
  build_config: { build_command: `npm run ${por(app).script}`, destination_dir: `dist/${app}/browser`, root_dir: '' },
  production_branch: 'main',
  deployment_configs: { production: { env_vars: null } },
  source: { config: { path_includes: ['*'], path_excludes: [...por(app).excluye].reverse() } },
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
  assert.equal(evaluar(por('cuscare'), {}).length, 5);
  assert.equal(evaluar(por('cuscare'), undefined).length, 5);
});

test('ROJO: las rutas que vigila el proyecto no son las de cf-sites.mjs (DD-117)', () => {
  const p = sano('supervisor');
  p.source.config.path_excludes = [];
  let fallos = evaluar(por('supervisor'), p);
  assert.equal(fallos.length, 1);
  assert.match(fallos[0], /path_excludes/);
  const q = sano('agent-mini');
  q.source.config.path_excludes = [...q.source.config.path_excludes, 'projects/agent/*'];
  fallos = evaluar(por('agent-mini'), q);
  assert.equal(fallos.length, 1, 'excluir de más también es desviación: agent-mini dejaría de actualizarse');
  const r = sano('agent');
  r.source.config.path_includes = ['projects/agent/*'];
  assert.match(evaluar(por('agent'), r)[0], /path_includes/);
});

test('sc-docs se construye con build:docs, no con build:sc-docs (casi se coló al escribir esto)', () => {
  assert.deepEqual(esperado(por('sc-docs')), {
    build_command: 'npm run build:docs',
    destination_dir: 'dist/sc-docs/browser',
    production_branch: 'main',
    path_includes: ['*'],
    path_excludes: [...SITIOS.find((s) => s.app === 'sc-docs').excluye].sort(),
  });
});

test('el mapa que se audita es el catálogo único, sin una lista propia que se desalinee', () => {
  // Los proyectos ya no se escriben aquí: salen de `cf-sites.mjs`, igual que los sitios que
  // registra `record-deploy.mjs`. Que el catálogo cubra las apps que el repo publica de verdad
  // (y que cada script exista y termine sellando) lo prueba `cf-sites.test.mjs`.
  assert.deepEqual(
    PROYECTOS,
    SITIOS.map(({ app, proyecto, script, excluye }) => ({ app, proyecto, script, excluye })),
  );
});
