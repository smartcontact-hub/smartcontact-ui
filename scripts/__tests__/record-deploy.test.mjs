import { test } from 'node:test';
import assert from 'node:assert/strict';

import { supersesion, SITIOS } from '../record-deploy.mjs';
import { PROYECTOS } from '../audit-cf-config.mjs';
import { SITIOS as CATALOGO } from '../cf-sites.mjs';

// La regla se prueba EN ROJO (el caso real que la motivó) y EN VERDE. Un guardián que solo se
// ha visto pasar no prueba que sepa fallar (LEARNINGS 2).

const CABEZA = 'fee8c346132eacedbc5b42e354b3b90868787959';
const ADELANTADO = '7812c38cc69ef5defd4d14df287b9861a311e493';

test('el caso real del 2026-09-10: main adelantó al commit que se esperaba → no se registra', () => {
  const motivo = supersesion(ADELANTADO, CABEZA, 'ahead');
  assert.ok(motivo, 'un commit adelantado tiene que dar motivo, no null');
  assert.match(motivo, /7812c38/); // el que se esperaba
  assert.match(motivo, /fee8c34/); // el que lo adelantó
  assert.match(motivo, /skipped/); // por qué no llegará a servirse nunca
});

test('mientras el commit sigue siendo la cabeza de main, se espera', () => {
  assert.equal(supersesion(CABEZA, CABEZA, 'identical'), null);
});

test('si no se puede leer la cabeza de main no se concluye nada: se sigue esperando', () => {
  assert.equal(supersesion(ADELANTADO, null, 'ahead'), null);
  assert.equal(supersesion(ADELANTADO, undefined, 'ahead'), null);
  assert.equal(supersesion(ADELANTADO, '', 'ahead'), null);
});

test('una cabeza DISTINTA pero que NO desciende del commit no es supersesión', () => {
  // El fallo simétrico, y el caro: este job arranca segundos después del empujón. Si la API
  // contestara todavía con el commit anterior («behind»), dar eso por adelantamiento dejaría un
  // despliegue bueno SIN registrar y en silencio. Sin ancestría no se concluye.
  assert.equal(supersesion(CABEZA, ADELANTADO, 'behind'), null);
  assert.equal(supersesion(CABEZA, ADELANTADO, null), null);
  assert.equal(supersesion(CABEZA, ADELANTADO, undefined), null);
});

test('si la rama divergió y el commit ya no está en main, tampoco se va a servir', () => {
  const motivo = supersesion(ADELANTADO, CABEZA, 'diverged');
  assert.ok(motivo);
  assert.match(motivo, /ya no está en main/);
});

test('los sitios que se registran salen del mismo catálogo que los proyectos que se auditan', () => {
  // Antes esto cruzaba DOS listas escritas a mano, y era lo único que evitaba que una sexta app
  // se quedara a medio apuntar. Ahora las dos derivan de `cf-sites.mjs`, así que lo que se
  // comprueba aquí es que la derivación no pierde ni reordena nada: el entorno de GitHub es la
  // app del repo y su url la del catálogo. Que el catálogo cubra las apps que el repo publica
  // de verdad lo prueba `cf-sites.test.mjs`, contra los `build:*` de package.json.
  assert.deepEqual(
    SITIOS,
    CATALOGO.map(({ app, url }) => ({ entorno: app, url })),
  );
  assert.deepEqual(
    SITIOS.map((s) => s.entorno),
    PROYECTOS.map((p) => p.app),
  );
});
