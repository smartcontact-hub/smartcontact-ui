import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TOKEN_DOCS,
  aJson,
  batchFigma,
  faltantes,
  huerfanas,
  tokensDefinidos,
} from '../token-docs-map.mjs';

const CSS = readFileSync(
  'projects/design-tokens/src/lib/styles/tokens/layers/02-semantic.css',
  'utf8',
);
const JSON_EN_DISCO = JSON.parse(
  readFileSync('projects/sc-docs/public/tokens/_semantic-docs.json', 'utf8'),
);

/*
 * Este fichero ES el gate: `token-docs-map` no entra en la cadena `verify` porque lo que hay
 * que impedir no es un uso incorrecto, es que el artefacto generado y las filas se desfasen.
 * Eso se comprueba aquí, y `test:unit` ya corre en la cadena.
 */

test('el JSON servido a sc-docs cuadra con las filas (regenera con tokens:docs)', () => {
  assert.deepEqual(JSON_EN_DISCO, aJson());
});

test('ningún --sc-bg-* de la capa semántica se queda sin su "para qué sirve"', () => {
  assert.deepEqual(faltantes(CSS), []);
});

test('ninguna fila describe un token que ya no existe', () => {
  assert.deepEqual(huerfanas(CSS), []);
});

test('hay tantas filas como tokens, y sin repetir', () => {
  const tokens = TOKEN_DOCS.map((r) => r.token);
  assert.equal(new Set(tokens).size, tokens.length, 'hay un token repetido');
  assert.equal(tokens.length, tokensDefinidos(CSS).length);
});

test('cada fila dice de verdad cuándo se usa', () => {
  for (const r of TOKEN_DOCS) {
    assert.ok(r.uso && r.uso.length > 15, `--${r.token}: el uso no puede ser una etiqueta`);
    assert.ok(r.uso.endsWith('.'), `--${r.token}: el uso es una frase, con su punto`);
    assert.ok(r.familia && r.familia.length > 2, `--${r.token}: sin familia`);
    assert.ok(r.no === null || r.no.length > 15, `--${r.token}: el "no" o es útil o es null`);
  }
});

test('los DD citados existen en el log de decisiones', () => {
  const dec = readFileSync('docs/DECISIONS.md', 'utf8');
  for (const r of TOKEN_DOCS) {
    if (!r.dd) continue;
    assert.match(dec, new RegExp(`^## ${r.dd} `, 'm'), `--${r.token} cita ${r.dd}, que no existe`);
  }
});

test('el lote de Figma separa lo que tiene contrapartida de lo que no', () => {
  const { con, sin } = batchFigma();
  assert.ok(con.length >= 1, 'ninguna fila casó con el export: el mapeo se rompió');
  assert.equal(con.length + sin.length, TOKEN_DOCS.length);
  for (const x of con) {
    assert.ok(x.variable.includes('.'), `${x.token}: la variable del Kit va por ruta con puntos`);
    assert.ok(x.description.length > 15);
  }
});

test('el lote de Figma NO inventa variables para los tokens de marca', () => {
  const { sin } = batchFigma();
  assert.ok(sin.includes('sc-bg-violet'), 'violet no está en el Kit: tiene que salir en "sin"');
  assert.ok(sin.includes('sc-bg-canvas'), 'canvas se nombró aquí, no se adoptó del Kit');
});
