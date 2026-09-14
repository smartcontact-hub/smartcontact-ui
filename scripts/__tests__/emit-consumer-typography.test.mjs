import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// La hoja que se entrega al equipo que consume el tema. Su único trabajo es aplicar los
// line-height que PrimeNG no modela, así que lo que importa es la COBERTURA: si se cae un
// selector, ese componente vuelve a heredar del documento y nadie se entera hasta verlo.
//
// Desde DD-91 importa además que TODO lea la rampa del tema: controles y etiquetas llevan
// el interlineado atado en Figma. Un `normal` que se quede en un control lo deja 3px por
// debajo del diseño (el reparto de DD-51, que DD-91 acota).

const root = resolve(import.meta.dirname, '../..');
const css = execFileSync('node', [resolve(root, 'scripts/emit-consumer-typography.mjs')], { encoding: 'utf8' });
const fuente = readFileSync(resolve(root, 'projects/ui-smartcontact/src/lib/theme/sc-preset/css.ts'), 'utf8');

/** Todos los selectores declarados en las listas de css.ts. */
const listaDe = (nombre) => {
  const m = fuente.match(new RegExp(`const ${nombre}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`));
  assert.ok(m, `css.ts ya no declara ${nombre}`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
};
const porTalla = {
  md: listaDe('mdTypographySelectors'),
  sm: listaDe('smTypographySelectors'),
  lg: listaDe('lgTypographySelectors'),
};
const declarados = Object.values(porTalla).flat();

/** El bloque CSS (cuerpo entre llaves) donde se emite un selector dado.
 *  Los comentarios se quitan ANTES de partir: si no, el de cabecera se pega al primer
 *  selector de la hoja y ese bloque deja de encontrarse (me pasó al escribir esto). */
const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
const bloqueDe = (selector) => {
  const bloques = [...sinComentarios.matchAll(/([^{}]+)\{([^}]*)\}/g)];
  const b = bloques.find((x) => x[1].split(',').some((s) => s.trim() === selector));
  assert.ok(b, `no se emitió ${selector}`);
  return b[2];
};

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
  for (const size of ['sm', 'md', 'lg']) {
    assert.ok(css.includes(`var(--p-app-typography-${size}-font-size`), `falta la var de letra de ${size}`);
    assert.ok(css.includes(`var(--p-app-typography-${size}-line-height`), `falta la var de interlineado de ${size}`);
  }
  // 20, no 21: el fallback tiene que estar de acuerdo con DD-39.
  assert.ok(css.includes('1.25rem'), 'el fallback md debería ser 20px (1.25rem)');
  assert.ok(!css.includes('1.3125rem'), 'el fallback md no puede seguir en 21px');
});

test('cada selector lee el interlineado de SU talla, y ninguno se queda en normal (DD-91)', () => {
  assert.doesNotMatch(sinComentarios, /line-height:\s*normal/, 'queda un line-height: normal');
  for (const [size, selectores] of Object.entries(porTalla))
    for (const s of selectores)
      assert.match(
        bloqueDe(s),
        new RegExp(`line-height:\\s*var\\(--p-app-typography-${size}-line-height`),
        `${s} debe leer la rampa ${size}`
      );
});

test('el botón lee la rampa md, la que ata su maestro en Figma', () => {
  // 5,25 + 5,25 de relleno + 20 de interlineado + 1 + 1 de borde = 32,5, lo que mide el
  // maestro con el interlineado atado. Con `normal` (DD-51) salía 29,5.
  assert.match(bloqueDe('.p-component.p-button'), /line-height:\s*var\(--p-app-typography-md-line-height/);
});
