import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// La hoja que se entrega al equipo que consume el tema. Su único trabajo es aplicar los
// line-height que PrimeNG no modela, así que lo que importa es la COBERTURA: si se cae un
// selector, ese componente vuelve a heredar del documento y nadie se entera hasta verlo.
//
// Desde DD-51 importa además el REPARTO: los controles llevan `normal` y las etiquetas la
// variable del tema. Emitir la variable a un control lo devuelve a 3px por encima del
// diseño, que es exactamente el bug que este reparto vino a arreglar.

const root = resolve(import.meta.dirname, '../..');
const css = execFileSync('node', [resolve(root, 'scripts/emit-consumer-typography.mjs')], { encoding: 'utf8' });
const fuente = readFileSync(resolve(root, 'projects/ui-smartcontact/src/lib/theme/sc-preset/css.ts'), 'utf8');

/** Todos los selectores declarados en las listas de css.ts. */
const listaDe = (nombre) => {
  const m = fuente.match(new RegExp(`const ${nombre}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`));
  assert.ok(m, `css.ts ya no declara ${nombre}`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
};
const controles = ['mdControlSelectors', 'smControlSelectors', 'lgControlSelectors'].flatMap(listaDe);
const etiquetas = ['mdRampSelectors', 'smRampSelectors'].flatMap(listaDe);
const declarados = [...controles, ...etiquetas];

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
  for (const size of ['sm', 'md', 'lg'])
    assert.ok(css.includes(`var(--p-app-typography-${size}-font-size`), `falta la var de letra de ${size}`);
  // Las etiquetas siguen leyendo el interlineado del tema (md y sm; en lg no hay etiquetas).
  for (const size of ['sm', 'md'])
    assert.ok(css.includes(`var(--p-app-typography-${size}-line-height`), `falta la var de ${size}`);
  // 20, no 21: el fallback tiene que estar de acuerdo con DD-39.
  assert.ok(css.includes('1.25rem'), 'el fallback md debería ser 20px (1.25rem)');
  assert.ok(!css.includes('1.3125rem'), 'el fallback md no puede seguir en 21px');
});

test('cada familia recibe SU interlineado (DD-51)', () => {
  for (const s of controles) {
    const cuerpo = bloqueDe(s);
    assert.match(cuerpo, /line-height:\s*normal/, `${s} es un control: debe llevar normal`);
    assert.doesNotMatch(cuerpo, /line-height:\s*var\(/, `${s} es un control: no puede leer la rampa`);
  }
  for (const s of etiquetas) {
    const cuerpo = bloqueDe(s);
    assert.match(cuerpo, /line-height:\s*var\(--p-app-typography-/, `${s} es etiqueta: debe leer la rampa`);
  }
});

test('el botón sale a la altura del Kit y no a la de la rampa', () => {
  // 7 + 7 de padding + el interlineado del texto + 1 + 1 de borde. Con `normal` Inter da
  // 17 y sale 33, que es lo que mide el maestro; con la rampa daba 20 y salían 36.
  assert.match(bloqueDe('.p-component.p-button'), /line-height:\s*normal/);
});
