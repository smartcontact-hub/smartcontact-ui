// El código del Playground de sc-docs (`serialize-args.core.mjs`): escribe lo que la demo tiene puesto, sin los valores
// por defecto, y sin callarse un booleano que nace encendido y se apaga. node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import { serializeArgs } from '../../projects/sc-docs/src/app/storybook/serialize-args.core.mjs';

const meta = (argTypes) => ({
  tag: 'sc-cosa',
  argTypes: argTypes.map((a) => (typeof a === 'string' ? { name: a, control: { kind: 'text' } } : a)),
  defaultArgs: {},
});

test('serializeArgs: lo que vale lo mismo que su valor por defecto no se escribe', () => {
  // Los valores por defecto, tal como los escribe el contrato (`_component-api.json`): el literal del código.
  const porDefecto = { paginator: 'false', rows: null, first: '0', size: "'md'", sortOrder: '1', scrollHeight: 'undefined' };
  const m = meta(['paginator', 'rows', 'first', 'size', 'sortOrder', 'scrollHeight']);
  assert.equal(
    serializeArgs(m, { paginator: true, rows: 5, first: 0, size: 'md', sortOrder: 1, scrollHeight: '240px' }, porDefecto),
    '<sc-cosa [paginator]="true" [rows]="5" scrollHeight="240px" />',
  );
});

test('serializeArgs: un booleano que nace encendido, apagado, sí se escribe', () => {
  const m = meta(['showClear']);
  assert.equal(serializeArgs(m, { showClear: false }, { showClear: 'true' }), '<sc-cosa [showClear]="false" />');
  assert.equal(serializeArgs(m, { showClear: true }, { showClear: 'true' }), '<sc-cosa />');
});

test('serializeArgs: sin contrato, como hasta ahora; y lo vacío nunca se escribe', () => {
  const m = meta(['label', 'loading', 'icon']);
  assert.equal(serializeArgs(m, { label: 'Guardar', loading: false, icon: '' }), '<sc-cosa label="Guardar" />');
  assert.equal(serializeArgs(m, { label: 'Guardar', loading: false, icon: '' }, { icon: 'null' }), '<sc-cosa label="Guardar" />');
});

test('serializeArgs: una línea de más de 80 pasa a varias, aunque lleve pocos atributos', () => {
  const m = meta(['titleKey', 'descriptionKey']);
  const larga = 'Eliminar este agente es permanente. Se borrarán sus conversaciones.';
  assert.equal(
    serializeArgs(m, { titleKey: 'Zona de peligro', descriptionKey: larga }),
    `<sc-cosa\n  titleKey="Zona de peligro"\n  descriptionKey="${larga}"\n/>`,
  );
});

test('serializeArgs: el contenido proyectado va dentro, no como atributo', () => {
  const m = meta([{ name: 'etiqueta', control: { kind: 'text' }, emit: 'slot' }, 'value']);
  assert.equal(serializeArgs(m, { etiqueta: 'Recibir avisos', value: 'a' }), '<sc-cosa value="a">Recibir avisos</sc-cosa>');
});
