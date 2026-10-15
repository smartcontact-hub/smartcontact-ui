import { test } from 'node:test';
import assert from 'node:assert/strict';

import { auditarCatalogo, catalogoParaDocs, filasSeccion3 } from '../audit-primeng-catalog.mjs';

// Una tabla mínima que está al día con el repo fabricado de abajo; cada prueba le rompe una cosa (LEARNINGS #2).
const DOC = `# Auditoría
> Contra PrimeNG **22.1.0**.

## 1. Lo que PrimeNG trae
| Prioridad | Componente |
|---|---|
| Alta | **TreeSelect · Tree** |

## 3. PrimeNG usado directamente
| Módulo | Quién | Veredicto |
|---|---|---|
| Menu | supervisor | Documentar. |
| Tooltip · AutoFocus | supervisor | Directivas. |

## 4. Sin caso en el producto hoy

Carousel, Galleria.
`;

const repo = () => ({
  doc: DOC,
  instalada: '22.1.0',
  modulos: ['button', 'treeselect', 'tree', 'menu', 'tooltip', 'autofocus', 'carousel', 'galleria'],
  envueltos: new Set(['button']),
  directos: new Map([
    ['menu', new Set(['supervisor'])],
    ['tooltip', new Set(['supervisor'])],
    ['autofocus', new Set(['supervisor'])],
  ]),
});

test('VERDE: la tabla que cuenta todo', () => {
  assert.deepEqual(auditarCatalogo(repo()), []);
});

test('ROJO: PrimeNG cambió de versión', () => {
  const r = { ...repo(), instalada: '22.2.0' };
  assert.match(auditarCatalogo(r).join('\n'), /pasó de 22\.1\.0 \(la tabla\) a 22\.2\.0/);
});

test('ROJO: la cabecera sin versión', () => {
  const r = { ...repo(), doc: DOC.replace('PrimeNG **22.1.0**', 'PrimeNG') };
  assert.match(auditarCatalogo(r).join('\n'), /no dice la versión/);
});

test('ROJO: un módulo nuevo de PrimeNG que la tabla no nombra', () => {
  const r = repo();
  r.modulos.push('inputtags');
  assert.deepEqual(auditarCatalogo(r), ['«inputtags»: PrimeNG lo trae y la tabla no lo nombra. Dale fila (sección 1 si tiene caso, 4 si no).']);
});

test('VERDE: un módulo envuelto por el DS no necesita fila', () => {
  const r = repo();
  r.modulos.push('inputtags');
  r.envueltos.add('inputtags');
  assert.deepEqual(auditarCatalogo(r), []);
});

test('ROJO: una app importa sin wrapper algo que la sección 3 no anota', () => {
  const r = repo();
  r.directos.set('carousel', new Set(['cuscare']));
  const errores = auditarCatalogo(r);
  assert.ok(errores.some((e) => e.startsWith('«carousel»: cuscare lo importa sin wrapper')));
  // Y además estaba en «sin caso»: las dos cosas se dicen.
  assert.ok(errores.some((e) => e.startsWith('«carousel»: la sección 4 dice que no tiene caso')));
});

test('ROJO: una fila de la sección 3 que ya no importa nadie', () => {
  const r = repo();
  r.directos.delete('menu');
  assert.deepEqual(auditarCatalogo(r), ['«menu»: tiene fila en la sección 3 y ya no lo importa ninguna app. Quita la fila.']);
});

test('ROJO: lo de la sección 4 que el DS empieza a envolver', () => {
  const r = repo();
  r.envueltos.add('galleria');
  assert.deepEqual(auditarCatalogo(r), ['«galleria»: la sección 4 dice que no tiene caso y ya se usa. Pásalo a su sitio.']);
});

test('una celda con «·» son varios módulos; la cabecera de la tabla no cuenta', () => {
  assert.deepEqual([...filasSeccion3(DOC)].sort(), ['autofocus', 'menu', 'tooltip']);
});

test('VERDE: «aria-label» en minúsculas no nombra el módulo Label', () => {
  const r = repo();
  r.modulos.push('label');
  r.doc = `${DOC}\nEl nombre va en \`aria-label\`.\n`;
  assert.equal(auditarCatalogo(r).length, 1);
  r.doc = `${DOC}\n## 5. Directivas\n\nLabel (\`pLabel\`).\n`;
  assert.deepEqual(auditarCatalogo(r), []);
});

// La sección 6 que pinta «Todo PrimeNG» en sc-docs: una familia de cuatro columnas y otra de tres.
const FAMILIAS = `## 6. Por familias

### 6.1 Elegir en una jerarquía

¿Vale elegir cualquier nivel?

| Componente | Para qué sirve | Elígelo cuando… | Aquí |
|---|---|---|---|
| TreeSelect | Un árbol en un desplegable. | Hay niveles y \`filter\` busca dentro. | Sin uso |
| IconField e InputIcon | Un icono en el campo. | Buscadores. | Por dentro de \`sc-search\` |

### 6.2 Directivas y utilidades

| Componente | Para qué sirve | Aquí |
|---|---|---|
| Steps | Indicador de pasos. | Sin caso |

## Siguientes pasos
`;

const medido = () => ({
  envueltoPor: new Map([['iconfield', ['sc-search']], ['inputicon', ['sc-search']]]),
  directos: new Map([['steps', new Set(['supervisor'])]]),
  obsoletos: new Set(['steps']),
});

test('la sección 6 sale con su pregunta, sus columnas y el estado que mide el repo, no el texto', () => {
  const { familias } = catalogoParaDocs(FAMILIAS, medido());
  assert.deepEqual(familias.map((f) => [f.titulo, f.pregunta, f.filas.length]), [
    ['Elegir en una jerarquía', '¿Vale elegir cualquier nivel?', 2],
    ['Directivas y utilidades', null, 1],
  ]);
  const [tree, campo] = familias[0].filas;
  assert.equal(tree.estado, 'sin-uso');
  assert.equal(tree.cuando, 'Hay niveles y <code>filter</code> busca dentro.');
  assert.equal(tree.enlace, 'https://primeng.dev/treeselect');
  // «X e Y» es una fila para dos módulos; InputIcon no tiene página propia y se enlaza la de IconField.
  assert.deepEqual([campo.modulos, campo.estado], [['iconfield', 'inputicon'], 'ds']);
  // Solo lo que la página pinta: la lista de wrappers cambia en PRs ajenos y dejaba `main` en rojo.
  assert.equal('wrappers' in campo, false);
  const [steps] = familias[1].filas;
  // Tres columnas: sin «Elígelo cuando…». Sin página en primeng.dev: sin enlace.
  assert.deepEqual([steps.cuando, steps.enlace, steps.estado, steps.obsoleto], [null, null, 'directo', true]);
});

test('ROJO: un documento sin sección 6 no da una página vacía', () => {
  assert.throws(() => catalogoParaDocs(DOC, medido()), /sección 6/);
});
