import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// La hoja que se entrega al equipo que consume el tema. Su único trabajo es aplicar los
// line-height que PrimeNG no modela, así que lo que importa es la COBERTURA: si se cae un
// selector, ese componente vuelve a heredar del documento y nadie se entera hasta verlo.

const root = resolve(import.meta.dirname, '../..');
const css = execFileSync('node', [resolve(root, 'scripts/emit-consumer-typography.mjs')], { encoding: 'utf8' });
const fuente = readFileSync(resolve(root, 'projects/ui-smartcontact/src/lib/theme/sc-preset/css.ts'), 'utf8');

/** Todos los selectores declarados en las listas de css.ts. */
const declarados = [...fuente.matchAll(/const \w+TypographySelectors\s*=\s*\[([\s\S]*?)\]\s*as const/g)]
  .flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));

test('emite TODOS los selectores de css.ts, sin perder ninguno por el camino', () => {
  assert.ok(declarados.length > 20, `esperaba muchos selectores, encontré ${declarados.length}`);
  const faltan = declarados.filter((s) => !css.includes(s));
  assert.deepEqual(faltan, [], `no se emitieron: ${faltan.join(', ')}`);
});

test('un selector con corchetes no corta la lista (el bug que tuvo el extractor)', () => {
  // `.p-editor …[data-value='4']::before` hacía que el regex parase en su `]` y se
  // perdiera media lista, incluidos .p-select-option y .p-multiselect-option.
  const conCorchete = declarados.find((s) => s.includes('['));
  assert.ok(conCorchete, 'debería seguir habiendo un selector con corchete que cubra este caso');
  assert.ok(css.includes(conCorchete));
  for (const s of ['.p-select-option', '.p-multiselect-option']) assert.ok(css.includes(s), `falta ${s}`);
});

test('cubre los cuatro que estaban rotos en producción', () => {
  for (const s of ['.p-tag', '.p-toast-detail', '.p-select-option', '.p-multiselect-option'])
    assert.ok(css.includes(s), `falta ${s}`);
});

test('lee los valores del tema, no los cablea', () => {
  for (const size of ['sm', 'md', 'lg'])
    assert.ok(css.includes(`var(--p-app-typography-${size}-line-height`), `falta la var de ${size}`);
  // 20, no 21: el fallback tiene que estar de acuerdo con DD-39.
  assert.ok(css.includes('1.25rem'), 'el fallback md debería ser 20px (1.25rem)');
  assert.ok(!css.includes('1.3125rem'), 'el fallback md no puede seguir en 21px');
});
