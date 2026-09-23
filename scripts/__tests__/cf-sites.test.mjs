import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { DS, SITIOS, appsSelladas, casaCf, desalineadas, seReconstruye } from '../cf-sites.mjs';

// El catálogo es ahora la ÚNICA lista de sitios de Cloudflare: de él salen los `SITIOS` que
// registra `record-deploy.mjs` y los `PROYECTOS` que audita `audit-cf-config.mjs`. Lo que la
// estructura ya no puede vigilar —que la lista cubra las apps que el repo publica de verdad— lo
// vigila esto, contra los `build:*` de package.json que terminan sellando. Cada regla se prueba
// EN ROJO con el caso malo fabricado y EN VERDE (LEARNINGS #2).

const { scripts } = JSON.parse(readFileSync(fileURLToPath(import.meta.resolve('../../package.json')), 'utf8'));

test('el repo de hoy está alineado: las apps que sella son exactamente las del catálogo', () => {
  assert.deepEqual(desalineadas(scripts), []);
});

test('las apps selladas se leen de los `build:*` que terminan en stamp-build.mjs', () => {
  assert.deepEqual(
    [...appsSelladas(scripts).keys()].sort(),
    ['agent', 'agent-mini', 'cuscare', 'sc-docs', 'supervisor'],
  );
  // `build` y `build:components` construyen pero no sellan: no son sitios y no cuentan.
  assert.equal(appsSelladas(scripts).has('components'), false);
  assert.equal(
    appsSelladas({ 'build:libreta': 'ng build libreta --configuration production' }).size,
    0,
  );
});

test('ROJO · una sexta app sellada que nadie apuntó en el catálogo', () => {
  // El fallo que motiva el fichero: se añade `build:portal`, se despliega en Cloudflare, y ni
  // `deploy:record` ni `audit:cf-config` saben que existe. Antes había que acordarse de dos
  // listas; ahora basta con no acordarse de ninguna para que esto salte.
  const conPortal = {
    ...scripts,
    'build:portal': 'npm run build && ng build portal && node scripts/stamp-build.mjs portal',
  };
  const fallos = desalineadas(conPortal);
  assert.equal(fallos.length, 1);
  assert.match(fallos[0], /portal/);
  assert.match(fallos[0], /build:portal/);
  assert.match(fallos[0], /cf-sites\.mjs/);
});

test('ROJO · una app del catálogo cuyo script dejó de sellar (DD-59, visto desde el repo)', () => {
  const sinSello = {
    ...scripts,
    'build:supervisor': 'npm run build && ng build supervisor --configuration production',
  };
  const fallos = desalineadas(sinSello);
  assert.equal(fallos.length, 1);
  assert.match(fallos[0], /supervisor/);
  assert.match(fallos[0], /stamp-build\.mjs supervisor/);
});

test('ROJO · el sello lo pone un script distinto del que dice el catálogo', () => {
  // `audit:cf-config` exigiría en el panel de Cloudflare un build command que no es el que
  // sella, así que el sitio se publicaría sin build.json y saldría rojo para siempre.
  const renombrado = { ...scripts };
  delete renombrado['build:docs'];
  renombrado['build:sc-docs'] = scripts['build:docs'];
  const fallos = desalineadas(renombrado);
  assert.equal(fallos.length, 1);
  assert.match(fallos[0], /build:docs/);
  assert.match(fallos[0], /build:sc-docs/);
});

test('ROJO · un catálogo vacío deja las cinco apps del repo sin registrar ni auditar', () => {
  assert.equal(desalineadas(scripts, []).length, 5);
});

test('cada fila lleva sus cuatro datos, y app, proyecto y url son únicos', () => {
  for (const s of SITIOS) {
    assert.match(s.app, /^[\w.-]+$/);
    assert.match(s.proyecto, /^[\w.-]+$/);
    assert.match(s.script, /^build:/);
    assert.match(s.url, /^https:\/\/[\w.-]+$/); // sin barra final: se le concatena `/build.json`
  }
  for (const clave of ['app', 'proyecto', 'url']) {
    const valores = SITIOS.map((s) => s[clave]);
    assert.equal(new Set(valores).size, valores.length, `hay ${clave} repetido en el catálogo`);
  }
});

/* ── Rutas que cada proyecto de Cloudflare ignora (DD-117) ─────────────────────────────── */

const angular = JSON.parse(readFileSync(fileURLToPath(import.meta.resolve('../../angular.json')), 'utf8'));
const APPS = SITIOS.map((s) => s.app);
const sitio = (app) => SITIOS.find((s) => s.app === app);
// `git grep` sale con 1 cuando no encuentra nada: eso es la respuesta buena, no un error.
function mencionesDelDs(app) {
  try {
    return execFileSync('git', ['grep', '-l', '-E', '@smartcontact-hub|design-tokens|ui-smartcontact', '--', `projects/${app}`], {
      encoding: 'utf8',
      cwd: fileURLToPath(import.meta.resolve('../..')),
      env: Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_'))),
    }).split('\n').filter(Boolean);
  } catch (e) {
    if (e.status === 1) return [];
    throw e;
  }
}
const reconstruye = (ficheros) => SITIOS.filter((s) => seReconstruye(s, ficheros)).map((s) => s.app);

test('el comodín es el de Cloudflare: `*` cruza carpetas y el patrón casa entero', () => {
  assert.ok(casaCf('docs/*', 'docs/handoff/x.md'));
  assert.ok(casaCf('README.md', 'README.md'));
  assert.ok(!casaCf('README.md', 'projects/x/README.md'));
  assert.ok(!casaCf('projects/agent/*', 'projects/agent-mini/src/a.ts'), 'agent no se come a agent-mini');
});

test('cada cambio despliega lo suyo', () => {
  assert.deepEqual(reconstruye(['projects/supervisor/src/app/a.ts']), ['supervisor']);
  assert.deepEqual(reconstruye(['docs/DECISIONS.md', 'LEARNINGS.md', 'e2e/supervisor/a.spec.ts']), []);
  assert.deepEqual(reconstruye(['projects/agent/public/fonts/a.woff2']), ['agent', 'agent-mini']);
  assert.deepEqual(reconstruye(['projects/ui-smartcontact/src/a.ts']), APPS.filter((a) => a !== 'agent-mini'));
});

test('ROJO si se esconde: lo que nadie previó despliega los cinco', () => {
  for (const f of ['package.json', 'angular.json', 'scripts/stamp-build.mjs', 'una/ruta/nueva.ts']) {
    assert.deepEqual(reconstruye([f]), APPS, f);
  }
});

test('ninguna app ignora una carpeta de la que tira su build (angular.json)', () => {
  for (const { app, excluye } of SITIOS) {
    const opciones = JSON.stringify(angular.projects[app].architect.build.options);
    for (const patron of excluye) {
      const m = patron.match(/^projects\/([\w-]+)\/\*$/);
      if (!m) continue;
      assert.ok(!opciones.includes(`projects/${m[1]}/`), `${app} excluye ${patron} y su build lo usa`);
    }
  }
  // La sonda: el acoplamiento real que motivó la regla.
  assert.ok(JSON.stringify(angular.projects['agent-mini'].architect.build.options).includes('projects/agent/'));
  assert.ok(!sitio('agent-mini').excluye.includes('projects/agent/*'));
});

test('solo ignora el DS una app cuyo build no lo construye ni lo importa', () => {
  for (const { app, script, excluye } of SITIOS) {
    if (!DS.some((d) => excluye.includes(d))) continue;
    assert.ok(!scripts[script].includes('npm run build'), `${script} construye el DS`);
    assert.deepEqual(mencionesDelDs(app), [], `projects/${app} menciona el DS`);
  }
});
