/**
 * PRUEBAS CON USUARIOS (DD-256): las reglas puras del modo prueba común.
 *
 * - El orden de las versiones se alterna por persona (P1 empieza por A, P2 por B) y cada vuelta usa su misión gemela,
 *   para que nadie repita la misma tarea en la segunda versión.
 * - El enlace lleva la sesión entera: lo escribe sc-docs y lo lee el Supervisor, y el resultado hace el viaje de vuelta.
 *   Los dos lados tienen su copia del codificador (cada app tiene su `rootDir`), así que aquí se cruzan.
 * - El modo prueba solo se enciende en previews de rama y en local, nunca en producción.
 * - El veredicto solo declara ganadora si la diferencia aguanta con pocas personas (prueba de signos, p < 0,10).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  codificar as codificarDocs,
  decodificar as decodificarDocs,
  CODIGO_RESULTADO,
  leerResultados,
  ordenDeVersiones,
  pasosDe,
  pSignos,
  veredicto,
} from '../../projects/sc-docs/src/app/pages/lab/pruebas/prueba.core.mjs';
import {
  codificar as codificarApp,
  decodificar as decodificarApp,
  pruebaPermitida,
} from '../../projects/supervisor/src/app/core/prueba/prueba-enlace.core.mjs';

const PLAN = {
  id: 'demo',
  versiones: [
    { id: 'A', nombre: 'Separado', url: 'https://claude-a.sc-supervisor.pages.dev/admin/x?v=A' },
    { id: 'B', nombre: 'Junto', url: 'https://claude-a.sc-supervisor.pages.dev/admin/x?v=B' },
  ],
  tareas: [{ id: 'festivo', titulo: 'Dar de alta un festivo', gemelas: ['Primera: 28 de enero', 'Segunda: 15 de mayo'] }],
};

test('el orden de las versiones se alterna por persona', () => {
  assert.deepEqual(ordenDeVersiones(PLAN, 'P1'), ['A', 'B']);
  assert.deepEqual(ordenDeVersiones(PLAN, 'P2'), ['B', 'A']);
  assert.deepEqual(ordenDeVersiones(PLAN, 'P3'), ['A', 'B']);
  const tres = { ...PLAN, versiones: [...PLAN.versiones, { id: 'C', nombre: 'Otra', url: 'https://x' }] };
  assert.deepEqual(ordenDeVersiones(tres, 'P2'), ['B', 'C', 'A']);
  assert.deepEqual(ordenDeVersiones(tres, 'P3'), ['C', 'A', 'B']);
});

test('la segunda versión se hace con la misión gemela, nunca con la misma', () => {
  const pasos = pasosDe(PLAN, 'P2');
  assert.deepEqual(
    pasos.map((p) => [p.version, p.mision, p.enunciado]),
    [
      ['B', 'festivo-1', 'Primera: 28 de enero'],
      ['A', 'festivo-2', 'Segunda: 15 de mayo'],
    ],
  );
  assert.equal(pasos[0].url, PLAN.versiones[1].url);
});

test('sin una gemela por versión, el plan no vale', () => {
  const corto = { ...PLAN, tareas: [{ id: 't', titulo: 'T', gemelas: ['solo una'] }] };
  assert.throws(() => pasosDe(corto, 'P1'), /gemela/);
});

test('el enlace va y vuelve entre sc-docs y el Supervisor, con tildes y eñes', () => {
  const sesion = { v: 1, prueba: 'demo', participante: 'P1', texto: 'Año, festivo, Ñandú «y» 28/01' };
  assert.deepEqual(decodificarApp(codificarDocs(sesion)), sesion);
  assert.deepEqual(decodificarDocs(codificarApp(sesion)), sesion);
  assert.match(codificarDocs(sesion), /^[A-Za-z0-9_-]+$/);
});

test('el modo prueba solo se enciende en previews de rama y en local', () => {
  assert.equal(pruebaPermitida('localhost'), true);
  assert.equal(pruebaPermitida('127.0.0.1'), true);
  assert.equal(pruebaPermitida('claude-discovery-horarios.sc-supervisor.pages.dev'), true);
  assert.equal(pruebaPermitida('sc-supervisor.pages.dev'), false);
  assert.equal(pruebaPermitida('sc-supervisor.pages.dev.ejemplo.com'), false);
  assert.equal(pruebaPermitida('ejemplo.com'), false);
});

/** Un resultado de una persona: `a` y `b` dicen cómo le fue en cada versión. */
function persona(p, a, b, preferida = null) {
  const paso = (version, r) => ({
    version,
    mision: `festivo-${version === 'A' ? 1 : 2}`,
    ms: r.ms ?? 60000,
    clics: 10,
    primerClic: null,
    enVacio: [],
    pantallas: [],
    ayudas: r.ayuda ? [{ ms: 1000, pantalla: '/' }] : [],
    comprobacion: { bien: r.bien ?? 4, total: 4 },
    moderador: null,
    facilidad: r.facil ?? 5,
  });
  return {
    v: 1,
    prueba: 'demo',
    participante: p,
    orden: ['A', 'B'],
    pasos: [paso('A', a), paso('B', b)],
    preferencia: { version: preferida, porque: '' },
  };
}

const BIEN = { bien: 4 };
const MAL = { bien: 2 };

test('el resultado se lee pegado como código, varios en un mismo texto', () => {
  const r1 = persona('P1', BIEN, MAL);
  const r2 = persona('P2', MAL, BIEN);
  const texto = `Hola, aquí va:\n${CODIGO_RESULTADO}${codificarDocs(r1)}\ny el otro ${CODIGO_RESULTADO}${codificarDocs(r2)} gracias`;
  assert.deepEqual(
    leerResultados(texto).map((r) => r.participante),
    ['P1', 'P2'],
  );
  assert.deepEqual(leerResultados(JSON.stringify(r1)).length, 1);
  assert.deepEqual(leerResultados('nada que leer'), []);
});

test('la prueba de signos: 5 a 0 separa, 4 a 2 no', () => {
  assert.ok(pSignos(5, 0) < 0.1);
  assert.ok(pSignos(4, 0) >= 0.1);
  assert.ok(pSignos(4, 2) >= 0.1);
  assert.ok(pSignos(5, 1) >= 0.1);
  assert.equal(pSignos(0, 0), 1);
});

test('gana A cuando 5 personas la resuelven en A y no en B, y ninguna al revés', () => {
  const rs = ['P1', 'P2', 'P3', 'P4', 'P5'].map((p) => persona(p, BIEN, MAL)).concat(persona('P6', BIEN, BIEN));
  const v = veredicto(PLAN, rs);
  assert.equal(v.ganadora, 'A');
  assert.equal(v.motivo, 'exito');
  assert.match(v.frase, /^Gana Separado/);
  assert.match(v.frase, /ninguna al revés/);
});

test('pedir ayuda cuenta como no resolverla', () => {
  const rs = ['P1', 'P2', 'P3', 'P4', 'P5'].map((p) => persona(p, BIEN, { bien: 4, ayuda: true }));
  assert.equal(veredicto(PLAN, rs).ganadora, 'A');
});

test('4 contra 2 es empate si nada más separa', () => {
  const rs = [
    ...['P1', 'P2', 'P3', 'P4'].map((p) => persona(p, BIEN, MAL)),
    ...['P5', 'P6'].map((p) => persona(p, MAL, BIEN)),
  ];
  const v = veredicto(PLAN, rs);
  assert.equal(v.ganadora, null);
  assert.match(v.frase, /^Empate/);
});

test('si empatan en resolverla, desempata la facilidad', () => {
  const rs = ['P1', 'P2', 'P3', 'P4', 'P5'].map((p) => persona(p, { bien: 4, facil: 6 }, { bien: 4, facil: 3 }));
  const v = veredicto(PLAN, rs);
  assert.equal(v.ganadora, 'A');
  assert.equal(v.motivo, 'facilidad');
});

test('el tiempo solo desempata si una tarda al menos un 50 % más', () => {
  const casi = ['P1', 'P2', 'P3', 'P4', 'P5'].map((p) => persona(p, { ms: 60000 }, { ms: 80000 }));
  assert.equal(veredicto(PLAN, casi).ganadora, null);
  const lenta = ['P1', 'P2', 'P3', 'P4', 'P5'].map((p) => persona(p, { ms: 60000 }, { ms: 95000 }));
  const v = veredicto(PLAN, lenta);
  assert.equal(v.ganadora, 'A');
  assert.equal(v.motivo, 'tiempo');
});

test('sin resultados no hay veredicto', () => {
  const v = veredicto(PLAN, []);
  assert.equal(v.ganadora, null);
  assert.equal(v.personas, 0);
});

test('si una persona manda su resultado dos veces, cuenta una', () => {
  const rs = [persona('P1', BIEN, MAL), persona('P1', BIEN, MAL)];
  assert.equal(veredicto(PLAN, rs).personas, 1);
});
