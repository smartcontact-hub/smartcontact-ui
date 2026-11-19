/**
 * PRUEBAS CON USUARIOS · EL INFORME (DD-256 §8): las métricas de usabilidad con su sigla de siempre y los accionables
 * que salen solos de los datos, más la exportación para seguir trabajando con ellos.
 *
 * - TSR cuenta como fallo lo resuelto con ayuda (MeasuringU) y lleva su intervalo de Wald ajustado: con 6 personas,
 *   un 5 de 6 puede ser cualquier cosa entre el 42 % y el 99 %, y el informe lo dice.
 * - ToT es la media geométrica de los intentos que salieron bien (la que recomienda MeasuringU con muestras pequeñas).
 * - SEQ es la media de la pregunta única, contra la referencia de 5,5.
 * - FCS y Lostness necesitan saber cuál era el camino corto: salen del ENSAYO, que no cuenta como persona.
 * - Cada hallazgo dice qué se vio (con la cifra) y qué hacer, por gravedad.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  csvDeResultados,
  informe,
  informeEnTexto,
  veredicto,
} from '../../projects/sc-docs/src/app/pages/lab/pruebas/prueba.core.mjs';

const PLAN = {
  id: 'demo',
  versiones: [
    { id: 'A', nombre: 'Separado', url: 'https://x/a' },
    { id: 'B', nombre: 'Junto', url: 'https://x/b' },
  ],
  tareas: [{ id: 'festivo', titulo: 'Dar de alta un festivo', gemelas: ['Uno', 'Dos'] }],
};

/** Un intento. Por defecto: bien, sin ayuda, 60 s, facilidad 5. */
function intento(version, o = {}) {
  return {
    version,
    mision: `festivo-${version === 'A' ? 1 : 2}`,
    ms: o.ms ?? 60000,
    clics: o.clics ?? 8,
    primerClic: o.primerClic ?? null,
    enVacio: o.enVacio ?? [],
    pantallas: o.pantallas ?? [],
    ayudas: (o.ayudas ?? []).map((pantalla) => ({ ms: 30000, pantalla })),
    comprobacion: {
      bien: o.bien ?? 4,
      total: 4,
      ...(o.titular ? { titular: o.titular } : {}),
      ...(o.usos ? { usos: o.usos } : {}),
    },
    moderador: null,
    facilidad: o.facil ?? 5,
  };
}

function persona(p, a = {}, b = {}, preferida = null, porque = '') {
  return {
    v: 1,
    prueba: 'demo',
    participante: p,
    orden: ['A', 'B'],
    pasos: [intento('A', a), intento('B', b)],
    preferencia: { version: preferida, porque },
  };
}

const metricas = (inf, version) => inf.tareas[0].versiones.find((v) => v.id === version);

test('TSR cuenta la ayuda como fallo y dice su intervalo', () => {
  const rs = [
    persona('P1'),
    persona('P2'),
    persona('P3'),
    persona('P4'),
    persona('P5'),
    persona('P6', { ayudas: ['/admin'] }),
  ];
  const a = metricas(informe(PLAN, rs), 'A');
  assert.equal(a.n, 6);
  assert.equal(a.tsr.exitos, 5);
  assert.ok(Math.abs(a.tsr.pct - 5 / 6) < 1e-9);
  assert.ok(Math.abs(a.tsr.ic[0] - 0.42) < 0.01, `ic bajo ${a.tsr.ic[0]}`);
  assert.ok(Math.abs(a.tsr.ic[1] - 0.99) < 0.01, `ic alto ${a.tsr.ic[1]}`);
  assert.ok(Math.abs(a.ayuda - 1 / 6) < 1e-9);
});

test('ToT es la media geométrica de los que salieron bien, y SEQ la media de la facilidad', () => {
  const rs = [
    persona('P1', { ms: 40000, facil: 5 }),
    persona('P2', { ms: 90000, facil: 6 }),
    persona('P3', { ms: 300000, bien: 1, facil: 7 }),
  ];
  const a = metricas(informe(PLAN, rs), 'A');
  assert.equal(Math.round(a.tot), 60);
  assert.equal(a.seq, 6);
});

test('FCS y Lostness salen del ensayo, que no cuenta como persona', () => {
  const corto = ['/admin', '/admin/horarios'];
  const ensayo = persona('ensayo', { primerClic: 'Horarios, en /admin', pantallas: corto });
  const rs = [
    ensayo,
    persona('P1', { primerClic: 'Horarios, en /admin', pantallas: corto }),
    persona('P2', { primerClic: 'Horarios, en /admin', pantallas: corto }),
    persona('P3', { primerClic: 'Agendas, en /admin', pantallas: ['/admin', '/admin/x', '/admin', '/admin/horarios'] }),
    persona('P4', { primerClic: 'Agendas, en /admin', pantallas: corto }),
  ];
  const inf = informe(PLAN, rs);
  const a = metricas(inf, 'A');
  assert.equal(inf.personas, 4);
  assert.equal(a.n, 4);
  assert.equal(a.fcs.bueno, 'Horarios, en /admin');
  assert.equal(a.fcs.pct, 0.5);
  // P3: 4 pantallas, 3 distintas, camino de 2 → √((3/4−1)² + (2/3−1)²) ≈ 0,417; los demás, 0.
  assert.ok(Math.abs(a.lostness - 0.4167 / 4) < 0.001, `lostness ${a.lostness}`);

  const sinEnsayo = metricas(informe(PLAN, rs.slice(1)), 'A');
  assert.equal(sinEnsayo.fcs, null);
  assert.equal(sinEnsayo.lostness, null);
});

test('los accionables: lo que falla, dónde se atascan, lo que parece pulsable y la paradoja', () => {
  const falta = 'Falta Secretaría Barcelona';
  const rs = [1, 2, 3, 4, 5, 6].map((i) =>
    persona(
      `P${i}`,
      { facil: 6 },
      {
        bien: i === 1 ? 4 : 3,
        titular: i === 1 ? undefined : falta,
        ayudas: i <= 3 ? ['/admin/horarios'] : [],
        enVacio: i <= 2 ? ['Festivos, en /admin/horarios', 'espacio vacío, en /admin/horarios'] : [],
        facil: 4,
      },
      'B',
    ),
  );
  const { hallazgos } = informe(PLAN, rs);
  const de = (regla) => hallazgos.find((h) => h.regla === regla);

  const tsr = de('tsr-bajo');
  assert.ok(tsr, 'falta el hallazgo de TSR');
  assert.equal(tsr.version, 'B');
  assert.equal(tsr.gravedad, 'alta');
  assert.equal(tsr.sigla, 'TSR');
  assert.match(tsr.evidencia, /0 de 6/);
  assert.match(tsr.accion, /Falta Secretaría Barcelona/);

  const atasco = de('atasco');
  assert.ok(atasco, 'falta el atasco');
  assert.match(atasco.evidencia, /3 personas/);
  assert.match(atasco.evidencia, /\/admin\/horarios/);

  const vacio = hallazgos.filter((h) => h.regla === 'vacio');
  assert.equal(vacio.length, 1, 'el espacio vacío no es un accionable');
  assert.match(vacio[0].evidencia, /Festivos/);

  const seq = de('seq-bajo');
  assert.ok(seq && seq.version === 'B', 'falta SEQ bajo en B');

  const paradoja = de('paradoja');
  assert.ok(paradoja, 'la prefieren y se resuelve peor: falta la paradoja');
  assert.equal(paradoja.version, 'B');

  const orden = { alta: 0, media: 1, baja: 2 };
  for (let i = 1; i < hallazgos.length; i++)
    assert.ok(orden[hallazgos[i - 1].gravedad] <= orden[hallazgos[i].gravedad], 'van por gravedad');
  assert.ok(!hallazgos.some((h) => h.version === 'A'), 'A va bien: ningún hallazgo');
});

test('sin personas no hay accionables', () => {
  const inf = informe(PLAN, []);
  assert.equal(inf.personas, 0);
  assert.deepEqual(inf.hallazgos, []);
});

test('el CSV tiene una fila por intento, marca el ensayo y escapa comas y comillas', () => {
  const rs = [
    persona('P1', { primerClic: 'Horarios, en /admin' }, {}, 'A', 'Me gustó, "mucho"'),
    persona('ensayo'),
  ];
  const lineas = csvDeResultados(PLAN, rs).trim().split('\n');
  assert.equal(lineas.length, 1 + 4);
  assert.match(lineas[0], /^participante,nombre,ensayo,version,/);
  assert.match(lineas[1], /^P1,,no,A,Separado,/);
  assert.ok(lineas[1].includes('"Horarios, en /admin"'));
  assert.ok(lineas[1].includes('"Me gustó, ""mucho"""'));
  assert.match(lineas[3], /^ensayo,,si,/);
});

test('los gestos que cuenta la rama dicen cuántos los usaron, sin tocar el veredicto', () => {
  const rs = [
    persona('P1', { usos: { copiar: 2, pegar: 2 } }, {}),
    persona('P2', { usos: { pegar: 1, deshacer: 0 } }, {}),
    persona('P3', {}, {}),
  ];
  const inf = informe(PLAN, rs);
  assert.deepEqual(metricas(inf, 'A').usos, [
    { gesto: 'pegar', personas: 2 },
    { gesto: 'copiar', personas: 1 },
  ]);
  assert.deepEqual(metricas(inf, 'B').usos, []);
  assert.equal(veredicto(PLAN, rs).frase, veredicto(PLAN, [persona('P1'), persona('P2'), persona('P3')]).frase);
  assert.match(informeEnTexto(PLAN, inf, veredicto(PLAN, rs)), /\*\*Gestos usados\*\* .*Separado: pegar 2 de 3, copiar 1 de 3\./);
  const [cab, p1] = csvDeResultados(PLAN, rs).split('\n');
  assert.equal(cab.split(',').at(-1), 'gestos');
  assert.equal(p1.split(',').at(-1), 'copiar 2; pegar 2');
});

test('el informe en texto lleva el veredicto, las siglas y qué hacer', () => {
  const rs = [1, 2, 3, 4, 5, 6].map((i) => persona(`P${i}`, {}, { bien: 2, titular: 'Falta el año' }));
  const texto = informeEnTexto(PLAN, informe(PLAN, rs), veredicto(PLAN, rs));
  assert.match(texto, /^# /);
  assert.match(texto, /Gana Separado/);
  assert.match(texto, /TSR/);
  assert.match(texto, /ToT/);
  assert.match(texto, /SEQ/);
  assert.match(texto, /Qué hacer/);
  assert.match(texto, /Falta el año/);
});
