import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  aviso,
  avisoCierre,
  correcciones,
  enrutar,
  esCierre,
  esCorreccion,
  leer,
  pendientes,
  registrar,
  rutaRegistro,
  rutas,
  validarRuta,
} from '../hooks/correction-capture.mjs';

// Cada patrón se prueba EN ROJO (frases reales con las que Rafa ha corregido) y EN VERDE (mensajes
// normales que no deben disparar). Un detector con falsos positivos enseña a ignorarlo (LEARNINGS 2).

test('rojo: frases reales de corrección disparan', () => {
  for (const f of [
    'no, si no queda nada, resumen lenguaje sencillo',
    'para lerdos no devs, para que sirve que abra el shell',
    'ya te lo he dicho: sin em dashes',
    'te dije que no tocaras el prototipo',
    'otra vez con los commits sin preflight',
    'no me refería a eso',
    'eso no es lo que pedí',
    'te has saltado el gate',
    'no hagas la limpieza sin preguntar',
    'está mal: el min-width sigue ahí',
    'por qué no has mirado el CI',
    'replanteate esto contra tus bias y los mios',
  ])
    assert.ok(esCorreccion(f), `debía detectar: ${f}`);
});

test('verde: mensajes normales no disparan', () => {
  for (const f of [
    'sí, lanza el preflight y abre el PR',
    'continua',
    'que pasa si no borro los worktrees',
    'nos vemos mañana, buen trabajo',
    'monta el tope de memoria',
    'el botón no cierra el modal',
    '',
    undefined,
  ])
    assert.equal(esCorreccion(f), false, `no debía detectar: ${f}`);
});

test('registrar apunta en la carpeta del proyecto y cuenta por sesión; leer filtra por horas', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-corr-'));
  process.env.SC_CLAUDE_PROJECT_DIR = dir;
  try {
    assert.equal(rutaRegistro(dir), join(dir, 'correcciones.jsonl'));
    assert.equal(registrar({ prompt: 'no, así no', session_id: 'A', cwd: dir }), 1);
    assert.equal(registrar({ prompt: 'otra vez', session_id: 'A', cwd: dir }), 2);
    assert.equal(registrar({ prompt: 'te dije', session_id: 'B', cwd: dir }), 1);
    assert.equal(leer(rutaRegistro(dir)).length, 3);
    const vieja = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
    appendFileSync(rutaRegistro(dir), JSON.stringify({ ts: vieja, session_id: 'Z', cwd: dir, prompt: 'no, antigua' }) + '\n');
    assert.equal(leer(rutaRegistro(dir)).length, 4);
    assert.equal(leer(rutaRegistro(dir), 24).length, 3, 'la ventana de 24 h deja fuera la de hace 3 días');
    assert.match(aviso(2), /nº 2 de la sesión/);
  } finally {
    delete process.env.SC_CLAUDE_PROJECT_DIR;
  }
});

// ── Cierre: «cerramos» dispara /reflect solo ─────────────────────────────────────────────
// Rojo = las frases con las que Rafa cierra de verdad. Verde = mensajes que solo MENCIONAN la
// palabra: un falso positivo aquí arranca un /reflect a mitad de tarea (LEARNINGS #2).

test('rojo: los mensajes de cierre disparan', () => {
  for (const f of [
    'cerramos',
    'cerramos.',
    '¿cerramos?',
    'venga, cerramos',
    'vale, cerramos ya',
    'cerramos por hoy',
    'cerramos la sesión',
    'ok cerramos esto',
    'cierra la sesión',
    'cierra sesión',
    'cerrar sesión',
    'vamos a cerrar la sesión',
    '/reflect',
    '/reflect el enrutador de correcciones',
  ])
    assert.ok(esCierre(f), `debía detectar cierre: ${f}`);
});

test('verde: mencionar la palabra no es cerrar', () => {
  for (const f of [
    'el botón de cerrar sesión del supervisor no hace nada',
    'cierra el drawer al pulsar fuera',
    'el modal no cierra con Escape',
    'cerramos el ticket de Jira cuando entra el PR',
    'cerramos la fila con un separador, no con un borde',
    'no cerramos hasta que el CI esté verde',
    'documenta cómo funciona /reflect en el README',
    'el hook de /reflect lee correcciones.jsonl',
    'esto cierra el hueco entre Figma y el build',
    '',
    undefined,
  ])
    assert.equal(esCierre(f), false, `no debía detectar cierre: ${f}`);
});

// ── Enrutado: una corrección no cierra sin destino ───────────────────────────────────────

const raizFalsa = () => {
  const root = mkdtempSync(join(tmpdir(), 'sc-raiz-'));
  mkdirSync(join(root, 'scripts', 'hooks'), { recursive: true });
  writeFileSync(join(root, 'scripts', 'hooks', 'bash-guard.mjs'), '// falso');
  writeFileSync(join(root, 'scripts', 'audit-cosa.mjs'), '// falso');
  return root;
};

test('validarRuta: hook y gate exigen un fichero de scripts/ que EXISTA', () => {
  const root = raizFalsa();
  const v = (destino, motivo) => validarRuta({ destino, motivo, root });

  // Rojo: el caso que motiva la pieza — decir «lo pongo en un hook» sin decir en cuál.
  assert.equal(v('hook', 'lo meto en un hook nuevo').ok, false);
  assert.match(v('hook', 'lo meto en un hook nuevo').error, /scripts\/hooks\//);
  assert.equal(v('hook', 'patrón en scripts/hooks/inventado.mjs').ok, false, 'un fichero que no existe no vale');
  assert.equal(v('hook', 'patrón en scripts/audit-cosa.mjs').ok, false, 'un hook no vive fuera de scripts/hooks/');
  assert.match(v('hook', 'patrón en scripts/audit-cosa.mjs').error, /no está en scripts\/hooks\//);
  assert.equal(v('gate', 'un check nuevo en verify').ok, false);
  assert.equal(v('gate', 'CHECK P en scripts/inventado.mjs').ok, false);

  // Verde: la ruta apunta al fichero.
  assert.equal(v('hook', 'patrón estrecho en scripts/hooks/bash-guard.mjs con su rojo y su verde').ok, true);
  assert.equal(v('gate', 'CHECK nuevo en scripts/audit-cosa.mjs').ok, true);
  assert.equal(v('gate', 'lo ve scripts/hooks/bash-guard.mjs').ok, true, 'un hook también es un script bajo scripts/');
  assert.deepEqual(v('gate', 'toca scripts/audit-cosa.mjs y scripts/hooks/bash-guard.mjs').ficheros, [
    'scripts/audit-cosa.mjs',
    'scripts/hooks/bash-guard.mjs',
  ]);
});

test('validarRuta: regla, memoria y no-mecanizable exigen «porque» y ≥40 caracteres', () => {
  const root = raizFalsa();
  const v = (destino, motivo) => validarRuta({ destino, motivo, root });
  const largo = 'porque exige juzgar el tono de un texto y eso no lo ve ningún script';
  assert.ok(largo.length >= 40);

  // Rojo: «lo apunto en LEARNINGS» — el cierre que esto viene a prohibir.
  for (const d of ['regla#7', 'memoria', 'no-mecanizable']) {
    assert.equal(v(d, 'lo apunto en LEARNINGS').ok, false, `${d} sin porque`);
    assert.match(v(d, 'lo apunto en LEARNINGS').error, /porque/);
    assert.equal(v(d, 'porque sí').ok, false, `${d} con justificación corta`);
    assert.match(v(d, 'porque sí').error, /≥40/);
    assert.equal(v(d, largo).ok, true, `${d} con justificación completa`);
  }
  assert.equal(v('regla#12', largo).ok, true);
  assert.equal(v('tarjeta', 'desplaza al punto 4 de la tarjeta').ok, true, 'la tarjeta no pide fichero ni «porque»');
});

test('validarRuta: destino inventado o motivo vacío → error que nombra los válidos', () => {
  const root = raizFalsa();
  assert.match(validarRuta({ destino: 'LEARNINGS', motivo: 'porque ' + 'x'.repeat(50), root }).error, /no válido/);
  assert.match(validarRuta({ destino: 'regla#', motivo: 'porque ' + 'x'.repeat(50), root }).error, /no válido/);
  assert.match(validarRuta({ destino: 'hook', motivo: '   ', root }).error, /falta el motivo/);
});

test('enrutar ata la corrección por id, y pendientes deja de contarla', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-corr-'));
  const root = raizFalsa();
  process.env.SC_CLAUDE_PROJECT_DIR = dir;
  try {
    registrar({ prompt: 'no, así no', session_id: 'A', cwd: dir });
    registrar({ prompt: 'te dije que midieras', session_id: 'A', cwd: dir });
    registrar({ prompt: 'otra vez', session_id: 'B', cwd: dir });

    const ruta = rutaRegistro(dir);
    const pendA = pendientes(ruta, 'A');
    assert.equal(pendA.length, 2, 'ROJO: recién capturadas, ninguna tiene destino');
    assert.match(pendA[0].id, /^[0-9a-f]{6}$/);
    // Dos correcciones seguidas caen en el MISMO milisegundo: si el id saliera del sello de tiempo,
    // enrutar una enrutaría las dos. Lo cazó la sonda en rojo, no el verde (LEARNINGS #6).
    assert.notEqual(pendA[0].id, pendA[1].id, 'dos correcciones del mismo milisegundo no comparten id');
    assert.equal(pendientes(ruta, 'B').length, 1, 'las de otra sesión no se mezclan');

    assert.equal(enrutar({ id: 'nohay', destino: 'tarjeta', motivo: 'x', cwd: dir, root }).ok, false, 'un id que no existe no se enruta');
    assert.equal(enrutar({ id: pendA[0].id, destino: 'hook', motivo: 'lo veo en un hook', cwd: dir, root }).ok, false, 'motivo inválido no escribe');
    assert.equal(pendientes(ruta, 'A').length, 2, 'una ruta rechazada NO cuenta como enrutada');

    assert.equal(enrutar({ id: pendA[0].id, destino: 'hook', motivo: 'patrón en scripts/hooks/bash-guard.mjs', cwd: dir, root }).ok, true);
    assert.deepEqual(
      pendientes(ruta, 'A').map((p) => p.id),
      [pendA[1].id],
      'VERDE: la enrutada sale de pendientes; la otra sigue',
    );

    assert.equal(
      enrutar({ id: pendA[1].id, destino: 'no-mecanizable', motivo: 'porque exige juzgar el tono y eso no lo ve ningún script', cwd: dir, root }).ok,
      true,
    );
    assert.equal(pendientes(ruta, 'A').length, 0);
    assert.equal(pendientes(ruta, 'B').length, 1, 'enrutar la sesión A no toca la B');
    assert.equal(correcciones(leer(ruta)).length, 3, 'las rutas no se cuentan como correcciones');
    assert.equal(rutas(leer(ruta)).length, 2);
  } finally {
    delete process.env.SC_CLAUDE_PROJECT_DIR;
  }
});

test('avisoCierre lleva la orden literal y el comando exacto', () => {
  assert.match(avisoCierre([]), /Invoca la skill reflect ahora, y enruta cada corrección pendiente con --enrutar antes de cerrar/);
  const con = avisoCierre([{ id: 'abc123', prompt: 'no, así no' }]);
  assert.match(con, /\[abc123\]/);
  assert.match(con, /--enrutar <id>/);
});
