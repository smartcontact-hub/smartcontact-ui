import { test } from 'node:test';
import assert from 'node:assert/strict';

import { informe, resumir, tiposDe } from '../correcciones-resumen.mjs';

// Frases con la forma de las del registro real (las de los tests de correction-capture).
const e = (prompt, ts = '2026-09-23T10:00:00.000Z') => ({ ts, id: 'x', session_id: 'S', prompt });

test('tiposDe: el espaciado se reconoce, y el proceso no se confunde con color', () => {
  assert.deepEqual(tiposDe('el espacio entre la cabecera es más corto, que se había hecho ya'), ['espaciado']);
  assert.deepEqual(tiposDe('esto se ve torcido'), ['espaciado']);
  assert.deepEqual(tiposDe('otra vez con los commits sin preflight'), ['proceso']);
  assert.deepEqual(tiposDe('el CI está en rojo y no lo has mirado'), ['proceso'], '«rojo» del CI no es un color');
  assert.deepEqual(tiposDe('revísalo a fondo'), [], '«a fondo» no es un fondo');
  assert.deepEqual(tiposDe('no me refería a eso'), []);
});

test('resumir: cuenta por tipo, deja las rutas fuera y guarda las que no casan', () => {
  const r = resumir([
    e('el espacio entre la cabecera es más corto'),
    e('te dije que alinearas el botón con el título'),
    e('otra vez con los commits sin preflight'),
    e('no me refería a eso'),
    { ts: '2026-09-23T11:00:00.000Z', tipo: 'ruta', ref: 'x', destino: 'gate', motivo: 'scripts/x.mjs' },
  ]);
  assert.equal(r.total, 4, 'la entrada de ruta no es una corrección');
  assert.equal(r.cuenta.espaciado.length, 2);
  assert.equal(r.cuenta.proceso.length, 1);
  assert.equal(r.cuenta.sin_tipo.length, 1);
});

test('informe: dice el total, el porcentaje de espaciado y el aviso de lo que no ve', () => {
  const texto = informe(resumir([e('el espacio es corto'), e('no me refería a eso')]), '/ruta/correcciones.jsonl');
  assert.match(texto, /2 correcciones desde 2026-09-23/);
  assert.match(texto, /espaciado y alineación\s+1\s+50 %/);
  assert.match(texto, /solo guarda lo que SUENA a corrección/);
  assert.match(informe(resumir([]), '/ruta'), /Sin correcciones/);
});
