import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadKitExport } from '../dtcg-export.mjs';
import { diffExports, diffLayers, newZeros, parseLayer, readersOf, renderMarkdown, withDependents } from '../tokens-sync-cambios.mjs';

const kitFrom = (tree) => {
  const dir = mkdtempSync(join(tmpdir(), 'cambios-test-'));
  writeFileSync(join(dir, 'k.json'), JSON.stringify(tree));
  return loadKitExport(join(dir, 'k.json'));
};
const BASE = {
  'aura/primitive': { scale: { '0-5': { $type: 'number', $value: 7 } }, blue: { 500: { $type: 'color', $value: '#344a70' } } },
  'aura/semantic/common': { form: { field: { padding: { y: { $type: 'number', $value: '{scale.0-5}' } } } } },
  'aura/component/common': { autocomplete: { padding: { y: { $type: 'number', $value: '{form.field.padding.y}' } } } },
};

test('export: separa lo EDITADO de lo que cambia por apuntar a algo editado', () => {
  const after = JSON.parse(JSON.stringify(BASE));
  after['aura/semantic/common'].form.field.padding.y.$value = 6;
  const d = diffExports(kitFrom(BASE), kitFrom(after));
  const byPath = Object.fromEntries(d.map((r) => [r.path, r]));
  assert.deepEqual(Object.keys(byPath).sort(), ['autocomplete.padding.y', 'form.field.padding.y']);
  assert.equal(byPath['form.field.padding.y'].directo, true);
  assert.equal(byPath['autocomplete.padding.y'].directo, false, 'la hoja no se tocó: hereda el cambio');
  assert.equal(byPath['autocomplete.padding.y'].antes, '7');
  assert.equal(byPath['autocomplete.padding.y'].despues, '6');
});

test('export idéntico: nada que contar (el caso «Export == main»)', () => {
  assert.deepEqual(diffExports(kitFrom(BASE), kitFrom(JSON.parse(JSON.stringify(BASE)))), []);
  assert.match(renderMarkdown({ kit: [], css: [], readers: { by: {}, dependientes: 0 }, base: 'origin/main' }), /Nada: el export coincide/);
});

test('capas: el mismo nombre en claro y en oscuro son dos variables distintas', () => {
  const antes = { '02-semantic': ':root { --sc-bg-primary: var(--sc-color-blue-700); }', '07-dark': '.sc-dark { --sc-bg-primary: var(--sc-color-blue-300); }' };
  const despues = { '02-semantic': ':root { --sc-bg-primary: var(--sc-color-blue-700); }', '07-dark': '.sc-dark { --sc-bg-primary: var(--sc-color-sky-300); }' };
  const d = diffLayers(antes, despues);
  assert.equal(d.length, 1);
  assert.deepEqual([d[0].name, d[0].scope, d[0].despues], ['--sc-bg-primary', 'oscuro', 'var(--sc-color-sky-300)']);
  assert.equal(parseLayer('/* --sc-x: 1; */ :root { --sc-y: 2; }', 'f').size, 1, 'un comentario no declara nada');
});

test('lectores: sigue los alias entre variables y nombra al componente que lee', () => {
  const capas = { '04-component': ':root { --sc-cmp-a: 1rem; --sc-alias: var(--sc-cmp-a); --sc-otra: 2px; }' };
  const nombres = withDependents(new Set(['--sc-cmp-a']), capas);
  assert.deepEqual([...nombres].sort(), ['--sc-alias', '--sc-cmp-a']);
  const files = [
    { path: '/x/sc-preset/button.ts', kind: 'preset', text: 'paddingX: "var(--sc-alias)"' },
    { path: '/x/sc-preset/tag.ts', kind: 'preset', text: 'gap: "var(--sc-otra)"' },
    { path: '/x/sc-preset/base.ts', kind: 'preset', text: 'x: "var(--sc-cmp-a, 0)"' },
  ];
  assert.deepEqual(readersOf(nombres, files).preset, ['button', 'todos (semántica común)']);
  assert.deepEqual(readersOf(new Set(['--sc-cmp-ab']), files), {}, '--sc-cmp-a no casa dentro de --sc-cmp-ab');
});

test('ceros: rojo si un token con medida pasa a 0; no si ya era 0, si es color o si está apuntado a propósito', () => {
  const after = JSON.parse(JSON.stringify(BASE));
  after['aura/primitive'].scale['0-5'].$value = 0;
  const d = diffExports(kitFrom(BASE), kitFrom(after));
  assert.deepEqual(newZeros(d).map((z) => z.path).sort(), ['autocomplete.padding.y', 'form.field.padding.y', 'scale.0-5']);
  const ya = { 'aura/primitive': { x: { $type: 'number', $value: 0 } } };
  assert.deepEqual(newZeros(diffExports(kitFrom(ya), kitFrom(JSON.parse(JSON.stringify(ya))))), []);
  assert.deepEqual(newZeros([{ group: 'g', path: 'c', antes: '#fff', despues: '0' }]), []);
  assert.deepEqual(newZeros(d, [{ group: 'aura/primitive', path: 'scale.0-5' }, { group: 'aura/semantic/common', path: 'form.field.padding.y' }, { group: 'aura/component/common', path: 'autocomplete.padding.y' }]), []);
});
