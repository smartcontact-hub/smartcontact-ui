import { test } from 'node:test';
import assert from 'node:assert/strict';

import { esRunner } from '../playwright-reuse-guard.mjs';

// El guardián de «otra cadena viva» cuenta procesos cuya línea de comandos menciona «playwright
// test». Se prueba EN ROJO con lo que lo engañó el 2026-09-09 (shells de otra sesión con un bucle
// de espera que nombra a Playwright) y EN VERDE con un runner de verdad (LEARNINGS 2).

test('un runner de verdad es un proceso node', () => {
  assert.ok(esRunner('node'));
  assert.ok(esRunner('/Users/x/.nvm/versions/node/v22.23.2/bin/node'));
  assert.ok(esRunner('node22'));
});

test('rojo: un shell que HABLA de Playwright (bucle de espera ajeno) no es una ejecución viva', () => {
  assert.equal(esRunner('/bin/zsh'), false);
  assert.equal(esRunner('sh'), false);
  assert.equal(esRunner('bash'), false);
  assert.equal(esRunner('sleep'), false);
});

test('sin dato de comando no se exonera (mejor un aviso de más que un verde falso)', () => {
  assert.ok(esRunner(''));
  assert.ok(esRunner(undefined));
});
