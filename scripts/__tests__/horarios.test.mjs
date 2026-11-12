// Los horarios de atención sin el navegador: de quién es cada fecha (fecha especial › festivo › periodo › semana), las
// franjas que cruzan la medianoche, lo que le falta a un periodo y la forma de antes («L-V 09:00–18:00»). node:test,
// dentro de `test:unit`. La prueba de aceptación es la hoja de postventa de 2025, día a día.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  abiertoEn,
  ahoraEn,
  coberturaAnual,
  diaDeLaSemana,
  diaRepetido,
  estadoEn,
  fechasEntre,
  horaDe,
  minutosDe,
  normalizarHorario,
  periodosSeSolapan,
  rejillaDelAnio,
  resolverDia,
  resumenDeLaSemana,
  semanaDeTexto,
  validarFranjas,
  validarPeriodo,
  validarSemana,
} from '../../projects/supervisor/src/app/features/admin/repositories/state/horarios.core.mjs';
import { FESTIVOS_SEMILLA, HORARIOS_SEMILLA } from '../../projects/supervisor/src/app/features/admin/repositories/state/horarios.semilla.mjs';

const postventa = HORARIOS_SEMILLA.find((h) => h.name === 'Postventa');
const noche = HORARIOS_SEMILLA.find((h) => h.name === 'Turno Noche');
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/* ── La hoja de postventa de 2025, transcrita de la hoja y no del modelo ────────────────────────────────────────── */

// Laborables en rojo (cerrado por festivo), fuera del verano.
const ROJOS = ['2025-01-01', '2025-01-06', '2025-04-18', '2025-04-21', '2025-05-01', '2025-09-11', '2025-09-24', '2025-12-08', '2025-12-25', '2025-12-26'];
// En verde: vísperas con jornada reducida.
const VERDES = ['2025-04-17', '2025-12-24', '2025-12-31'];
// Laborables en naranja: festivos dentro del verano.
const NARANJAS = ['2025-06-09', '2025-06-24', '2025-08-15'];

function colorDeLaHoja(iso) {
  const dia = diaDeLaSemana(iso);
  const verano = iso >= '2025-06-01' && iso <= '2025-08-31';
  if (VERDES.includes(iso)) return 'verde';
  if (verano) return dia >= 5 || NARANJAS.includes(iso) ? 'naranja' : 'azul';
  if (dia >= 5 || ROJOS.includes(iso)) return 'rojo';
  return dia === 4 ? 'amarillo' : 'blanco';
}

function colorDelModelo(iso) {
  const r = resolverDia(postventa, iso, FESTIVOS_SEMILLA);
  const abierto = r.tramos.length > 0;
  const enVerano = postventa.periods[0].from <= iso.slice(5) && iso.slice(5) <= postventa.periods[0].to;
  if (r.tipo === 'especial') return abierto ? 'verde' : 'rojo';
  if (!abierto) return enVerano ? 'naranja' : 'rojo';
  if (r.tipo === 'periodo') return 'azul';
  return diaDeLaSemana(iso) === 4 ? 'amarillo' : 'blanco';
}

test('Postventa 2025 coincide con su hoja, día a día', () => {
  const distintos = fechasEntre('2025-01-01', '2025-12-31').filter((iso) => colorDeLaHoja(iso) !== colorDelModelo(iso));
  assert.deepEqual(distintos, []);
});

test('la hoja transcrita distingue los cinco tipos de día (la sonda no es ciega)', () => {
  const colores = new Set(fechasEntre('2025-01-01', '2025-12-31').map(colorDeLaHoja));
  assert.deepEqual([...colores].sort(), ['amarillo', 'azul', 'blanco', 'naranja', 'rojo', 'verde']);
  // Sin el calendario de festivos, los rojos y naranjas entre semana dejan de coincidir.
  const sinFestivos = fechasEntre('2025-01-01', '2025-12-31').filter((iso) => {
    const r = resolverDia(postventa, iso, []);
    return (r.tramos.length === 0) !== ['rojo', 'naranja'].includes(colorDeLaHoja(iso));
  });
  assert.equal(sinFestivos.length, ROJOS.length + NARANJAS.length);
});

/* ── De quién es cada fecha ─────────────────────────────────────────────────────────────────────────────────────── */

test('el dueño se busca en orden: fecha especial, festivo, periodo, semana', () => {
  assert.equal(resolverDia(postventa, '2025-12-24', FESTIVOS_SEMILLA).tipo, 'especial');
  assert.equal(resolverDia(postventa, '2025-12-25', FESTIVOS_SEMILLA).tipo, 'festivo');
  assert.equal(resolverDia(postventa, '2025-07-10', FESTIVOS_SEMILLA).tipo, 'periodo');
  assert.equal(resolverDia(postventa, '2025-03-10', FESTIVOS_SEMILLA).tipo, 'semana');
  // Un festivo dentro del verano es del festivo, no del periodo.
  const asuncion = resolverDia(postventa, '2025-08-15', FESTIVOS_SEMILLA);
  assert.equal(asuncion.tipo, 'festivo');
  assert.equal(asuncion.festivo.name, 'La Asunción');
  assert.equal(asuncion.calendario.name, 'Festivos Barcelona');
});

test('una fecha especial propia abre un festivo aplicado', () => {
  const abre = { ...postventa, specials: [...postventa.specials, { id: 99, name: 'Campaña', date: '2025-12-25', yearly: false, slots: [[600, 840]] }] };
  const r = resolverDia(abre, '2025-12-25', FESTIVOS_SEMILLA);
  assert.equal(r.tipo, 'especial');
  assert.deepEqual(r.tramos, [[600, 840]]);
});

test('la fecha de un año gana a la que se repite cada año', () => {
  const h = { ...postventa, specials: [{ id: 1, name: 'Anual', date: '2000-12-24', yearly: true, slots: [] }, { id: 2, name: 'Este año', date: '2026-12-24', yearly: false, slots: [[540, 600]] }] };
  assert.equal(resolverDia(h, '2026-12-24', []).especial.name, 'Este año');
  assert.equal(resolverDia(h, '2027-12-24', []).especial.name, 'Anual');
});

test('un calendario de festivos inactivo o sin aplicar no cierra nada', () => {
  const inactivos = FESTIVOS_SEMILLA.map((c) => ({ ...c, status: 'inactive' }));
  assert.equal(resolverDia(postventa, '2025-12-25', inactivos).tipo, 'semana');
  assert.equal(resolverDia({ ...postventa, holidayCalendarIds: [] }, '2025-12-25', FESTIVOS_SEMILLA).tipo, 'semana');
});

test('un periodo que se repite puede cruzar el fin de año; el 29 de febrero cae dentro', () => {
  const invierno = { id: 1, name: 'Invierno', color: 'teal', from: '10-01', to: '05-31', year: null, week: postventa.week };
  const h = { ...postventa, periods: [invierno], specials: [], holidayCalendarIds: [] };
  assert.equal(resolverDia(h, '2028-02-29', []).tipo, 'periodo');
  assert.equal(resolverDia(h, '2026-12-31', []).tipo, 'periodo');
  assert.equal(resolverDia(h, '2026-07-01', []).tipo, 'semana');
});

test('un periodo de un solo año no vale en los demás', () => {
  const h = { ...postventa, periods: [{ ...postventa.periods[0], year: 2026 }] };
  assert.equal(resolverDia(h, '2026-07-01', []).tipo, 'periodo');
  assert.equal(resolverDia(h, '2027-07-01', []).tipo, 'semana');
});

/* ── La medianoche ──────────────────────────────────────────────────────────────────────────────────────────────── */

test('una franja que cruza la medianoche vale hasta su fin al día siguiente', () => {
  const r = resolverDia(noche, '2026-03-10', []);
  assert.deepEqual(r.tramos, [[0, 420], [1380, 1440]]);
  assert.equal(r.arrastre, true);
  assert.equal(abiertoEn(noche, '2026-03-10', 60, []), true);
  assert.equal(abiertoEn(noche, '2026-03-10', 420, []), false);
  assert.equal(abiertoEn(noche, '2026-03-10', 1380, []), true);
});

test('un festivo o una fecha especial cortan a las 00:00 lo que venía de la víspera', () => {
  const conFestivo = { ...noche, holidayCalendarIds: [1] };
  assert.deepEqual(resolverDia(conFestivo, '2025-12-25', FESTIVOS_SEMILLA).tramos, []);
  // La víspera sigue abriendo a las 23:00, y el día de después del festivo no hereda madrugada de él.
  assert.deepEqual(resolverDia(conFestivo, '2025-12-24', FESTIVOS_SEMILLA).tramos, [[0, 420], [1380, 1440]]);
  assert.deepEqual(resolverDia(conFestivo, '2025-12-27', FESTIVOS_SEMILLA).tramos, [[1380, 1440]]);
});

test('cómo está ahora y cuándo cambia', () => {
  // Miércoles 12 de noviembre de 2025, 10:00: abierto hasta las 18:00.
  assert.deepEqual(estadoEn(postventa, '2025-11-12', 600, FESTIVOS_SEMILLA), { abierto: true, cambia: { fecha: '2025-11-12', minutos: 1080 } });
  // Viernes a las 16:00: cerrado hasta el lunes a las 09:00.
  assert.deepEqual(estadoEn(postventa, '2025-11-14', 960, FESTIVOS_SEMILLA), { abierto: false, cambia: { fecha: '2025-11-17', minutos: 540 } });
  // El turno de noche, a la 01:00: abierto hasta las 07:00 del mismo día.
  assert.deepEqual(estadoEn(noche, '2026-03-10', 60, []), { abierto: true, cambia: { fecha: '2026-03-10', minutos: 420 } });
  // Un 24/7 no cambia; una semana sin franjas tampoco.
  const siempre = HORARIOS_SEMILLA.find((h) => h.name === '24/7 Emergencias');
  assert.deepEqual(estadoEn(siempre, '2026-03-10', 60, []), { abierto: true, cambia: null });
  assert.deepEqual(estadoEn({ ...siempre, week: [[], [], [], [], [], [], []] }, '2026-03-10', 60, []), { abierto: false, cambia: null });
});

test('la hora de ahora se pide en la zona del horario', () => {
  const cuando = new Date('2026-01-01T02:30:00Z');
  assert.deepEqual(ahoraEn('Europe/Madrid', cuando), { fecha: '2026-01-01', minutos: 210 });
  assert.deepEqual(ahoraEn('America/Mexico_City', cuando), { fecha: '2025-12-31', minutos: 1230 });
  assert.deepEqual(ahoraEn('No/Existe', cuando), { fecha: '2026-01-01', minutos: 150 });
});

/* ── Resúmenes ──────────────────────────────────────────────────────────────────────────────────────────────────── */

test('la semana en una línea', () => {
  assert.equal(resumenDeLaSemana(postventa.week, DIAS, 'Cerrado', '24 h'), 'L–J 09:00–18:00 · V 09:00–15:00');
  assert.equal(resumenDeLaSemana(noche.week, DIAS, 'Cerrado', '24 h'), 'L–D 23:00–07:00');
  assert.equal(resumenDeLaSemana(HORARIOS_SEMILLA[6].week, DIAS, 'Cerrado', '24 h'), '24 h');
  assert.equal(resumenDeLaSemana([[], [], [], [], [], [], []], DIAS, 'Cerrado', '24 h'), 'Cerrado');
  assert.equal(resumenDeLaSemana([[[540, 840], [960, 1080]], [], [], [], [], [], []], DIAS, 'Cerrado', '24 h'), 'L 09:00–14:00, 16:00–18:00');
});

test('la cobertura de un año suma todos sus días, cada uno con un solo dueño', () => {
  const c = coberturaAnual(postventa, 2025, FESTIVOS_SEMILLA);
  assert.equal(c.total, 365);
  assert.equal(c.semana + c.especiales + c.festivos + c.periodos.reduce((n, p) => n + p.dias, 0), 365);
  assert.equal(c.especiales, 3);
  // De los 92 días de verano, tres son festivos.
  assert.deepEqual(c.periodos, [{ id: 1, dias: 89 }]);
  assert.equal(coberturaAnual(postventa, 2028, FESTIVOS_SEMILLA).total, 366);
});

test('la rejilla del año empieza cada mes en su día de la semana', () => {
  const r = rejillaDelAnio(2025);
  assert.equal(r.length, 12);
  assert.equal(r[0].huecos, 2); // el 1 de enero de 2025 es miércoles
  assert.equal(r[1].fechas.length, 28);
  assert.equal(rejillaDelAnio(2028)[1].fechas.length, 29);
});

/* ── Lo que le falta ────────────────────────────────────────────────────────────────────────────────────────────── */

test('las franjas de un día', () => {
  assert.equal(validarFranjas([[540, 840], [960, 1080]]), null);
  assert.equal(validarFranjas([[0, 1440]]), null);
  assert.equal(validarFranjas([[540, 540]]), 'vacia');
  assert.equal(validarFranjas([[540, 900], [840, 1080]]), 'solape');
  assert.equal(validarFranjas([[540, Number.NaN]]), 'hora');
  assert.equal(validarFranjas([[1500, 100]]), 'hora');
  assert.equal(validarFranjas([[1380, 420]]), null);
  assert.equal(validarFranjas([[1380, 420], [540, 600]]), null);
  assert.equal(validarFranjas([[600, 120], [900, 960]]), 'noche');
});

test('una franja de madrugada no puede pisar la primera del día siguiente', () => {
  const semana = [[[1320, 600]], [[540, 1080]], [], [], [], [], []];
  assert.deepEqual(validarSemana(semana), { dia: 0, codigo: 'pisa_siguiente' });
  assert.equal(validarSemana(noche.week), null);
  assert.deepEqual(validarSemana([[], [], [[540, 540]], [], [], [], []]), { dia: 2, codigo: 'vacia' });
});

test('dos periodos no comparten fechas', () => {
  const verano = postventa.periods[0];
  const julio = { id: 2, name: 'Julio', color: 'green', from: '07-01', to: '07-31', year: null, week: verano.week };
  assert.equal(periodosSeSolapan(verano, julio), true);
  assert.equal(validarPeriodo(postventa, julio).codigo, 'solape');
  assert.equal(validarPeriodo(postventa, julio).con.name, 'Verano');
  assert.equal(validarPeriodo(postventa, { ...julio, from: '09-01', to: '09-30' }), null);
  // El propio periodo, al editarse, no choca consigo.
  assert.equal(validarPeriodo(postventa, { ...verano, to: '09-15' }), null);
  // De años distintos no chocan; uno de un año contra uno anual, sí.
  assert.equal(periodosSeSolapan({ ...julio, year: 2026 }, { ...julio, id: 3, year: 2027 }), false);
  assert.equal(periodosSeSolapan({ ...julio, year: 2026 }, verano), true);
  // Uno que cruza el año choca con enero.
  assert.equal(periodosSeSolapan({ ...julio, from: '12-15', to: '01-15' }, { ...julio, id: 3, from: '01-10', to: '01-20' }), true);
});

test('lo que le falta a un periodo', () => {
  const p = { id: 5, name: 'Otoño', color: 'amber', from: '10-01', to: '10-31', year: null, week: postventa.week };
  assert.equal(validarPeriodo(postventa, p), null);
  assert.deepEqual(validarPeriodo(postventa, { ...p, name: '  ' }), { codigo: 'nombre' });
  assert.deepEqual(validarPeriodo(postventa, { ...p, from: '' }), { codigo: 'fechas' });
  assert.deepEqual(validarPeriodo(postventa, { ...p, from: '13-01' }), { codigo: 'fechas' });
  assert.deepEqual(validarPeriodo(postventa, { ...p, year: 2026, from: '12-01', to: '01-31' }), { codigo: 'cruza_anio' });
  assert.deepEqual(validarPeriodo(postventa, { ...p, week: [[[540, 540]], [], [], [], [], [], []] }), { codigo: 'semana', dia: 0, detalle: 'vacia' });
});

test('una fecha ya ocupada en la lista', () => {
  const dias = postventa.specials;
  assert.equal(diaRepetido(dias, { id: 50, name: 'x', date: '2030-12-24', yearly: true, slots: [] }).name, 'Nochebuena');
  assert.equal(diaRepetido(dias, { id: 50, name: 'x', date: '2025-04-17', yearly: false, slots: [] }).name, 'Jueves Santo');
  // La de un año y la anual del mismo día conviven: gana la del año.
  assert.equal(diaRepetido(dias, { id: 50, name: 'x', date: '2026-12-24', yearly: false, slots: [] }), null);
  assert.equal(diaRepetido(dias, dias[0]), null);
});

/* ── La forma de antes ──────────────────────────────────────────────────────────────────────────────────────────── */

test('las horas', () => {
  assert.equal(minutosDe('09:30'), 570);
  assert.equal(minutosDe('24:00'), 1440);
  assert.equal(minutosDe('24:01'), null);
  assert.equal(minutosDe('9'), null);
  assert.equal(horaDe(1440), '24:00');
  assert.equal(horaDe(65), '01:05');
});

test('un horario guardado como texto pasa a semana sin perder lo demás', () => {
  assert.deepEqual(semanaDeTexto('L-V 09:00–18:00'), [[[540, 1080]], [[540, 1080]], [[540, 1080]], [[540, 1080]], [[540, 1080]], [], []]);
  assert.deepEqual(semanaDeTexto('S-D 10:00–14:00')[5], [[600, 840]]);
  assert.deepEqual(semanaDeTexto('L-D 23:00–07:00')[6], [[1380, 420]]);
  assert.deepEqual(semanaDeTexto('L-D 00:00–23:59')[0], [[0, 1440]]);
  assert.deepEqual(semanaDeTexto('cuando se pueda'), [[], [], [], [], [], [], []]);

  const viejo = { id: 3, name: 'Turno Tarde', schedule: 'L-V 15:00–23:00', timezone: 'Europe/Madrid', description: 'x', status: 'active' };
  const nuevo = normalizarHorario(viejo);
  assert.equal(nuevo.id, 3);
  assert.equal('schedule' in nuevo, false);
  assert.deepEqual(nuevo.week[0], [[900, 1380]]);
  assert.deepEqual(nuevo.periods, []);
  assert.deepEqual(nuevo.holidayCalendarIds, []);
  // Uno ya con la forma de ahora no cambia.
  assert.deepEqual(normalizarHorario(postventa), postventa);
});
