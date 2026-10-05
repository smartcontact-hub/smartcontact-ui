import { test } from 'node:test';
import assert from 'node:assert/strict';

import { conFin, desdeISO, duracion, lineasDeTiempos } from '../tiempos.mjs';

// Los datos son los de #325 (2026-10-04), leídos de GitHub: el lote que se midió a mano en 3 h 30 min. La prueba fija
// que el script dé lo mismo, con las dos trampas que encontró al escribirse: una vuelta del CI sin jobs (el commit del
// robot de visual-baselines) y que las duraciones cuadren con las horas que se ven.

const PR_325 = {
  numero: 325,
  titulo: 'La revisión de producto del 2026-10-04, en un lote',
  abierto: '2026-10-04T18:13:02Z',
  fundido: '2026-10-04T18:58:30Z',
};
const EJECUCIONES = [
  { id: 37225887452, inicio: '2026-10-04T18:49:07Z', fin: '2026-10-04T18:57:34Z', conclusion: 'success', sinJobs: false },
  { id: 37224296361, inicio: '2026-10-04T18:24:04Z', fin: null, conclusion: 'failure', sinJobs: true },
  { id: 37223561531, inicio: '2026-10-04T18:13:05Z', fin: '2026-10-04T18:21:22Z', conclusion: 'failure', sinJobs: false },
];
const MAIN = { id: 37226475456, inicio: '2026-10-04T18:58:33Z', fin: '2026-10-04T19:07:10Z', conclusion: 'success', sinJobs: false };

test('#325 de punta a punta: lo que se midió a mano, en el formato de siempre', () => {
  const lineas = lineasDeTiempos({
    pr: PR_325,
    primerCommit: '2026-10-04T15:44:20Z',
    ejecuciones: EJECUCIONES,
    main: MAIN,
    desde: desdeISO('15:28', '2026-10-04'),
  });
  assert.deepEqual(lineas, [
    '#325 · La revisión de producto del 2026-10-04, en un lote',
    'Tiempos (UTC, 2026-10-04):',
    '- feedback: 15:28',
    '- primer commit: 15:44',
    '- PR abierto: 18:13',
    '- CI del PR: 18:13 → 18:21 · 8 min · rojo (37223561531)',
    '- CI del PR: 18:24 · sin jobs, rojo (37224296361)',
    '- CI del PR: 18:49 → 18:57 · 8 min · verde (37225887452)',
    '- fundido: 18:58',
    '- de punta a punta: 3 h 30 min, desde el feedback',
    '- CI de main: 18:58 → 19:07 · 9 min · verde (37226475456)',
  ]);
});

test('sin --desde, de punta a punta cuenta desde el primer commit, y lo dice', () => {
  const lineas = lineasDeTiempos({ pr: PR_325, primerCommit: '2026-10-04T15:44:20Z', ejecuciones: [], main: null });
  assert.ok(lineas.includes('- de punta a punta: 3 h 14 min, desde el primer commit'));
  assert.ok(!lineas.some((l) => l.startsWith('- feedback')));
});

test('un PR sin fundir lo dice, y no inventa la duración', () => {
  const lineas = lineasDeTiempos({ pr: { ...PR_325, fundido: null }, primerCommit: null, ejecuciones: [], main: null });
  assert.ok(lineas.includes('- sin fundir'));
  assert.ok(!lineas.some((l) => l.includes('de punta a punta')));
});

test('una ejecución en curso sale sin fin; una de otro día lleva su fecha', () => {
  const lineas = lineasDeTiempos({
    pr: PR_325,
    primerCommit: null,
    ejecuciones: [{ id: 1, inicio: '2026-10-05T00:10:00Z', fin: null, conclusion: null, sinJobs: false }],
    main: null,
  });
  assert.ok(lineas.includes('- CI del PR: 10-05 00:10 · en curso (1)'));
});

test('conFin: una ejecución que sigue en curso no tiene fin, aunque alguno de sus jobs ya haya acabado', () => {
  // El caso real de #326 (2026-10-04): con la CI de main recién lanzada, `changes` ya había acabado y el informe pintó
  // «22:52 → 22:52 · 0 min · en curso». La prueba de arriba no lo vio porque le daba el `fin: null` ya hecho; esta
  // pasa por donde pasan los datos de verdad, los jobs que devuelve GitHub.
  const github = { jobsDe: () => [{ status: 'completed', completedAt: '2026-10-04T22:52:40Z' }, { status: 'in_progress', completedAt: null }] };
  const enCurso = conFin(github, { id: 37241651293, startedAt: '2026-10-04T22:52:20Z', status: 'in_progress', conclusion: null });
  assert.equal(enCurso.fin, null);
  const acabada = conFin(github, { id: 37241066120, startedAt: '2026-10-04T22:43:00Z', status: 'completed', conclusion: 'success' });
  assert.equal(acabada.fin, '2026-10-04T22:52:40Z');
});

test('desdeISO: una hora va al día de base; una fecha ISO, tal cual; lo demás, nada', () => {
  assert.equal(desdeISO('15:28', '2026-10-04'), '2026-10-04T15:28:00Z');
  assert.equal(desdeISO('9:05', '2026-10-04'), '2026-10-04T09:05:00Z');
  assert.equal(desdeISO('2026-10-03T22:00:00Z', '2026-10-04'), '2026-10-03T22:00:00.000Z');
  assert.equal(desdeISO('ayer', '2026-10-04'), null);
  assert.equal(desdeISO(null, '2026-10-04'), null);
});

test('duracion: horas y minutos, o solo minutos', () => {
  assert.equal(duracion(210), '3 h 30 min');
  assert.equal(duracion(45), '45 min');
  assert.equal(duracion(60), '1 h 0 min');
});
