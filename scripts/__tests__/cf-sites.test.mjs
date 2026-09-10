import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SITIOS, appsSelladas, desalineadas } from '../cf-sites.mjs';

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
