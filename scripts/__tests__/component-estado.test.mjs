import { test } from 'node:test';
import assert from 'node:assert/strict';

import { estadoDe, motivoRetirado, tieneMaestroEnKit } from '../component-audit.mjs';

// El estado de un componente en sc-docs (DD-190): «ready» con maestro en el Kit y página de demo, «experimental» si le
// falta alguna, «deprecated» si la CLASE lleva `@deprecated`. Cada prueba fija un caso que ya se dio en el repo.

test('listo con maestro en el Kit y demo; experimental dice qué le falta', () => {
  assert.deepEqual(estadoDe({ kit: true, hasDemo: true, retirado: null }), { estado: 'ready', faltas: [] });
  assert.deepEqual(estadoDe({ kit: false, hasDemo: true, retirado: null }), { estado: 'experimental', faltas: ['kit'] });
  assert.deepEqual(estadoDe({ kit: false, hasDemo: false, retirado: null }), { estado: 'experimental', faltas: ['kit', 'demo'] });
});

test('retirado gana a todo lo demás', () => {
  assert.deepEqual(estadoDe({ kit: true, hasDemo: true, retirado: 'Retenido para volver atrás.' }), {
    estado: 'deprecated',
    faltas: [],
  });
});

test('el maestro del Kit casa por nombre y por alias (el Kit escribe «Divide» y «Section»)', () => {
  assert.equal(tieneMaestroEnKit('button'), true);
  assert.equal(tieneMaestroEnKit('divider'), true);
  assert.equal(tieneMaestroEnKit('section-card'), true);
  assert.equal(tieneMaestroEnKit('fact-row'), false);
});

test('solo cuenta el @deprecated de la clase, no el de un alias de tipo del mismo fichero', () => {
  const clase =
    "/** Algo.\n *\n * @deprecated Retenido para volver atrás. Segunda frase.\n *\n * Más texto.\n */\n@Component({ selector: 'sc-x' })\nexport class X {}";
  assert.equal(motivoRetirado(clase), 'Retenido para volver atrás. Segunda frase.');
  const alias =
    "/** @deprecated Usa `ScFieldSize`. */\nexport type Viejo = 'sm';\n\n/** El componente. */\n@Component({ selector: 'sc-y' })\nexport class Y {}";
  assert.equal(motivoRetirado(alias), null);
});
