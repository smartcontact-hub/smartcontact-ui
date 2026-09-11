import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { revisarHandoff, MAX_LINEAS, MAX_TRAMOS } from '../handoff-shape.mjs';

// El gate se prueba EN VERDE con cada hand-off real y EN ROJO con los dos modos de inflado que el
// del DS tuvo de verdad (2.924 líneas y 49 tramos el 2026-09-11): un gate que solo se ha visto
// pasar no prueba que sepa fallar (LEARNINGS #2).

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = join(root, 'docs', 'handoff');

test('cada hand-off real cumple la forma', () => {
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
    assert.deepEqual(revisarHandoff(readFileSync(join(dir, f), 'utf8'), f), [], f);
  }
});

test('rojo: más líneas que el tope', () => {
  const largo = '# X\n\n## ✅ 2026-09-11 · uno\n' + 'línea\n'.repeat(MAX_LINEAS);
  const p = revisarHandoff(largo, 'x.md');
  assert.ok(p.some((x) => /líneas; el tope es/.test(x)), p.join('\n'));
});

test('rojo: más tramos que el tope (el diario que se acumulaba)', () => {
  const tramos = Array.from({ length: MAX_TRAMOS + 1 }, (_, i) => `## ✅ 2026-09-${String(i + 1).padStart(2, '0')} · t\n\ncuerpo\n`).join('\n');
  const p = revisarHandoff(`# X\n\n${tramos}`, 'x.md');
  assert.ok(p.some((x) => /tramos `## ✅`; el tope es/.test(x)), p.join('\n'));
});

test('en el tope exacto pasa; las secciones fijas (otros emojis) no cuentan como tramo', () => {
  const tramos = Array.from({ length: MAX_TRAMOS }, (_, i) => `## ✅ 2026-09-${String(i + 1).padStart(2, '0')} · t\n`).join('\n');
  const doc = `# X\n\n${tramos}\n## ▶︎ SIGUIENTE\n\n## ⚠️ Trampas\n\n## ⏸️ ESPERANDO A RAFA\n`;
  assert.deepEqual(revisarHandoff(doc, 'x.md'), []);
});
