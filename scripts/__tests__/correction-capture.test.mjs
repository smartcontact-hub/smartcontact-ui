import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { esCorreccion, registrar, leer, rutaRegistro, aviso } from '../hooks/correction-capture.mjs';

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
