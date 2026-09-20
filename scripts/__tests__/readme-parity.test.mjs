import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { revisarParidad, ES, EN } from '../readme-parity.mjs';

// El gate se prueba EN VERDE con los dos README reales y EN ROJO con las formas de deriva que
// un segundo README tiene de verdad: la cifra que envejece en un solo lado (el caso medido del
// repo: 49 vs "~55" con el manifiesto en 51), el gate que entra en la cadena y solo se apunta
// en español, la sección que se añade a un idioma, y el `##` sin ancla, que deja al gate ciego
// justo donde hace falta. Un gate que solo se ha visto pasar no prueba que sepa fallar
// (LEARNINGS #2).

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (f) => readFileSync(join(root, f), 'utf8');

const PAR = {
  es: [
    '# T',
    '',
    '[English](README.en.md)',
    '',
    'Son **56 componentes `sc-*`**.',
    '',
    '## Verificar',
    '<!--sc:sec=verify-->',
    '',
    'Corre `tokens:guard` y `docs:guard`. Ver [la guía](docs/guardarrailes.md).',
    '',
    '```bash',
    'npm run verify',
    '```',
    '',
  ].join('\n'),
  en: [
    '# T',
    '',
    '[Español](README.md)',
    '',
    'There are **56 components `sc-*`**.',
    '',
    '## Verify',
    '<!--sc:sec=verify-->',
    '',
    'Run `tokens:guard` and `docs:guard`. See [the guide](docs/guardarrailes.md).',
    '',
    '```bash',
    'npm run verify',
    '```',
    '',
  ].join('\n'),
};

test('verde: los dos README reales del repo coinciden', () => {
  assert.deepEqual(revisarParidad(leer(ES), leer(EN)), []);
});

test('verde: la prosa traducida NO tiene que ser literal', () => {
  // Mismos identificadores, mismas cifras, misma estructura; redacción distinta a propósito.
  assert.deepEqual(revisarParidad(PAR.es, PAR.en), []);
});

test('verde: el par de enlaces cruzado entre idiomas no cuenta como divergencia', () => {
  assert.ok(!revisarParidad(PAR.es, PAR.en).some((p) => /README\.(en\.)?md`/.test(p)));
});

test('rojo: una cifra envejece en un solo idioma (49 vs 51, el caso medido)', () => {
  const en = PAR.en.replace('56 components', '51 components');
  const p = revisarParidad(PAR.es, en);
  assert.ok(p.some((x) => /cifra `56`/.test(x)), p.join('\n'));
  assert.ok(p.some((x) => /cifra `51`/.test(x)), p.join('\n'));
});

test('rojo: un gate entra en la cadena y solo se apunta en español', () => {
  const es = PAR.es.replace('`docs:guard`', '`docs:guard` y `audit:seed-pii`');
  const p = revisarParidad(es, PAR.en);
  assert.ok(p.some((x) => /tramo de código `audit:seed-pii`/.test(x)), p.join('\n'));
});

test('rojo: una sección existe en un idioma y no en el otro', () => {
  const es = PAR.es + '\n## Licencia\n<!--sc:sec=license-->\n\nTexto.\n';
  const p = revisarParidad(es, PAR.en);
  assert.ok(p.some((x) => /las secciones no coinciden/.test(x)), p.join('\n'));
});

test('rojo: las mismas secciones en distinto ORDEN', () => {
  const dos = (a, b) => `# T\n\n## A\n<!--sc:sec=${a}-->\n\n## B\n<!--sc:sec=${b}-->\n`;
  const p = revisarParidad(dos('uno', 'dos'), dos('dos', 'uno'));
  assert.ok(p.some((x) => /las secciones no coinciden/.test(x)), p.join('\n'));
});

test('rojo: un `##` sin ancla deja la sección fuera de la comparación', () => {
  const en = PAR.en + '\n## Extra\n\nTexto.\n';
  const p = revisarParidad(PAR.es, en);
  assert.ok(p.some((x) => /2 secciones `##` y 1 anclas/.test(x)), p.join('\n'));
});

test('rojo: un enlace apunta a sitios distintos en cada idioma', () => {
  const en = PAR.en.replace('docs/guardarrailes.md', 'docs/DECISIONS.md');
  const p = revisarParidad(PAR.es, en);
  assert.ok(p.some((x) => /enlace `docs\/guardarrailes\.md`/.test(x)), p.join('\n'));
});

test('rojo: un comando existe en un solo idioma', () => {
  const es = PAR.es.replace('npm run verify', 'npm run verify\nnpm run e2e');
  const p = revisarParidad(es, PAR.en);
  assert.ok(p.some((x) => /comando `npm run e2e`/.test(x)), p.join('\n'));
});
