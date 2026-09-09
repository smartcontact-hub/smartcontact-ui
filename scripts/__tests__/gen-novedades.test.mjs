import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { construir } from '../gen-novedades.mjs';

// El gate `novedades:check` compara el artefacto de la página con lo que sale del CHANGELOG.
// Se prueba EN VERDE con los ficheros reales y EN ROJO con el cambio que existe para cazar
// (LEARNINGS #2: un gate que solo se ha visto pasar no prueba que sepa fallar).
//
// El tercer caso NO es relleno: al validarlo a mano se probó primero tocando `[Unreleased]`, el
// gate dijo OK, y por un momento pareció un fallo suyo. No lo era — esa sección se ignora a
// propósito, porque una versión sin publicar no existe para nadie. Queda fijado aquí para que el
// siguiente no repita el susto ni "arregle" el comportamiento correcto.

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
const artefacto = readFileSync(
  join(root, 'projects/sc-docs/public/novedades/_novedades.json'),
  'utf8',
);

const generar = (md) => JSON.stringify(construir(md), null, 2) + '\n';

test('verde: el artefacto en disco cuadra con el CHANGELOG real', () => {
  assert.equal(generar(changelog), artefacto);
});

test('rojo: tocar una versión PUBLICADA desincroniza el artefacto', () => {
  const tocado = changelog.replace('Primera versión', 'Primera versión (retocada)');
  assert.notEqual(tocado, changelog, 'el reemplazo tiene que haber entrado');
  assert.notEqual(generar(tocado), artefacto);
});

test('tocar [Unreleased] NO desincroniza: una versión sin publicar no existe para nadie', () => {
  const tocado = changelog.replace(
    '## [Unreleased]',
    '## [Unreleased]\n\n### Added\n- Algo que aún no ha salido.',
  );
  assert.notEqual(tocado, changelog, 'el reemplazo tiene que haber entrado');
  assert.equal(generar(tocado), artefacto);
});

test('las versiones salen de nueva a vieja, con su fecha', () => {
  const { versiones } = construir(changelog);
  assert.ok(versiones.length >= 3);
  assert.equal(versiones[0].version, '1.0.0');
  assert.match(versiones[0].fecha, /^\d{4}-\d{2}-\d{2}$/);
});

test('el markdown en línea llega convertido, no crudo', () => {
  const { versiones } = construir(changelog);
  const items = versiones[0].secciones.flatMap((s) => s.items).join('\n');
  assert.match(items, /<strong>/);
  assert.match(items, /<code>/);
  assert.doesNotMatch(items, /\*\*/, 'no debe quedar negrita en markdown sin convertir');
});
