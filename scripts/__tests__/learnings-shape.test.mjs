import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { revisarLearnings, MAX_LINEAS, MAX_LINEAS_REGLA, MAX_REGLAS, MAX_SESIONES_SIN_MECANISMO } from '../learnings-shape.mjs';

// El gate de forma de LEARNINGS se prueba EN VERDE con el fichero real y EN ROJO con cada modo de
// inflado que el fichero tuvo de verdad (LEARNINGS 2: un gate que solo se ha visto pasar no prueba
// que sepa fallar). Los casos rojos son citas del fichero de antes del recorte del 2026-09-02.

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const real = readFileSync(join(root, 'LEARNINGS.md'), 'utf8');

const regla = (n, cuerpo = 'Evidencia: s00 hecho.') => `${n}. **Disparador → acción.**\n   ${cuerpo}\n`;
const indice = (...ns) => ['| # | Si… | → |', '|---|---|---|', ...ns.map((n) => `| **${n}** | a | b |`)].join('\n') + '\n';
const doc = (...partes) => partes.join('\n');

test('el LEARNINGS.md real cumple la forma', () => {
  assert.deepEqual(revisarLearnings(real), []);
});

test('rojo: más líneas que el tope', () => {
  const largo = doc(indice(1), '## S', regla(1)) + '\n'.repeat(MAX_LINEAS);
  assert.ok(revisarLearnings(largo).some((p) => /líneas; el tope es/.test(p)));
});

test('rojo: más reglas en el índice que el tope', () => {
  const ns = Array.from({ length: MAX_REGLAS + 1 }, (_, i) => i + 1);
  const p = revisarLearnings(doc(indice(...ns), '## S', ...ns.map((n) => regla(n))));
  assert.ok(p.some((x) => /el índice tiene/.test(x)));
});

test('rojo: una regla rota en ≥3 sesiones sin ⚙️ escala; con ⚙️ (mecanizada o «no mecanizable») pasa', () => {
  const ses = Array.from({ length: MAX_SESIONES_SIN_MECANISMO }, (_, i) => `s${10 + i} hecho`).join(' · ');
  const prosa = doc(indice(1), '## S', regla(1, `Evidencia: ${ses}.`));
  assert.ok(revisarLearnings(prosa).some((p) => /la regla 1 acumula \d+ sesiones/.test(p)), 'debía escalar');
  const menos = doc(indice(1), '## S', regla(1, 'Evidencia: s10 a · s11 b.'));
  assert.ok(!revisarLearnings(menos).some((p) => /acumula/.test(p)), 'por debajo del umbral no escala');
  const misma = doc(indice(1), '## S', regla(1, 'Evidencia: s10 a · s10 b · s10 c.'));
  assert.ok(!revisarLearnings(misma).some((p) => /acumula/.test(p)), 'la misma sesión repetida cuenta una');
  const mecanizada = doc(indice(1), '## S', regla(1, `⚙️ lo vigila bash-guard.\n   Evidencia: ${ses}.`));
  assert.deepEqual(revisarLearnings(mecanizada), []);
  const decidida = doc(indice(1), '## S', regla(1, `⚙️ no mecanizable: es juicio.\n   Evidencia: ${ses}.`));
  assert.deepEqual(revisarLearnings(decidida), []);
});

test('rojo: una regla más larga que el tope', () => {
  const cuerpo = Array.from({ length: MAX_LINEAS_REGLA + 1 }, () => 'línea de prosa').join('\n   ') + '\n   Evidencia: s1 x.';
  const p = revisarLearnings(doc(indice(1), '## S', regla(1, cuerpo)));
  assert.ok(p.some((x) => /la regla 1 ocupa/.test(x)), p.join('\n'));
});

test('rojo: el modo de inflado real — un *Corolario (sNN)* dentro de la regla', () => {
  const cuerpo = 'Evidencia: s11 x.\n\n   *Corolario (s31)*: **y no basta con que tu estímulo llegue.**';
  const p = revisarLearnings(doc(indice(1), '## S', regla(1, cuerpo)));
  assert.ok(p.some((x) => /sub-entrada dentro de la regla 1/.test(x)), p.join('\n'));
});

test('rojo: *Evidencia (s18)* en cursiva, *Absorbe la antigua regla*, *Reincidencia* también cuentan', () => {
  for (const sub of ['*Evidencia (s18)*: tal', '*Absorbe la antigua regla 13 (s18)*', '*Reincidencia (s35)*: otra vez']) {
    const p = revisarLearnings(doc(indice(1), '## S', regla(1, `Evidencia: s1 x.\n   ${sub}`)));
    assert.ok(p.some((x) => /sub-entrada/.test(x)), `no cazó: ${sub}`);
  }
});

test('rojo: **Disparador**: / **Acción**: dentro de una regla es una regla escondida', () => {
  const p = revisarLearnings(doc(indice(1), '## S', regla(1, 'Evidencia: s1 x.\n   Texto. **Disparador**: tu evidencia sale de algo inyectado. **Acción**: mide.')));
  assert.ok(p.some((x) => /regla escondida/.test(x)), p.join('\n'));
});

test('rojo: una regla sin línea Evidencia:', () => {
  const p = revisarLearnings(doc(indice(1), '## S', regla(1, 'Solo prosa, sin anclaje.')));
  assert.ok(p.some((x) => /no tiene línea `Evidencia:`/.test(x)));
});

test('verde: una regla bien formada con Evidencia: y sin sub-entradas', () => {
  assert.deepEqual(revisarLearnings(doc(indice(1, 2), '## S', regla(1), regla(2, 'Detalle.\n   Evidencia: s2 y · s3 z.'))), []);
});
