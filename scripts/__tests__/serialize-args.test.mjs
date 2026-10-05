// El código del Playground de sc-docs (`serialize-args.core.mjs`): escribe lo que la demo tiene puesto, sin los valores
// por defecto, sin callarse un booleano que nace encendido y se apaga, y con lo requerido aunque no tenga control.
// node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import { serializeArgs } from '../../projects/sc-docs/src/app/storybook/serialize-args.core.mjs';

const meta = (argTypes) => ({
  tag: 'sc-cosa',
  argTypes: argTypes.map((a) => (typeof a === 'string' ? { name: a, control: { kind: 'text' } } : a)),
  defaultArgs: {},
});

/** El contrato, tal como lo genera `audit:components`: inputs opcionales con su valor por defecto (el literal). */
const contrato = (porDefecto) =>
  Object.entries(porDefecto).map(([nombre, literal]) => ({ nombre, clase: 'input', porDefecto: literal, requerido: false }));

test('serializeArgs: lo que vale lo mismo que su valor por defecto no se escribe', () => {
  // Los valores por defecto, tal como los escribe el contrato (`_component-api.json`): el literal del código.
  const porDefecto = { paginator: 'false', rows: null, first: '0', size: "'md'", sortOrder: '1', scrollHeight: 'undefined' };
  const m = meta(['paginator', 'rows', 'first', 'size', 'sortOrder', 'scrollHeight']);
  assert.equal(
    serializeArgs(m, { paginator: true, rows: 5, first: 0, size: 'md', sortOrder: 1, scrollHeight: '240px' }, contrato(porDefecto)),
    '<sc-cosa [paginator]="true" [rows]="5" scrollHeight="240px" />',
  );
});

test('serializeArgs: un booleano que nace encendido, apagado, sí se escribe', () => {
  const m = meta(['showClear']);
  assert.equal(serializeArgs(m, { showClear: false }, contrato({ showClear: 'true' })), '<sc-cosa [showClear]="false" />');
  assert.equal(serializeArgs(m, { showClear: true }, contrato({ showClear: 'true' })), '<sc-cosa />');
});

test('serializeArgs: sin contrato, como hasta ahora; y lo vacío nunca se escribe', () => {
  const m = meta(['label', 'loading', 'icon']);
  assert.equal(serializeArgs(m, { label: 'Guardar', loading: false, icon: '' }), '<sc-cosa label="Guardar" />');
  assert.equal(serializeArgs(m, { label: 'Guardar', loading: false, icon: '' }, contrato({ icon: 'null' })), '<sc-cosa label="Guardar" />');
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

test('serializeArgs: lo requerido que ningún control escribe va delante, atado a una variable de su nombre', () => {
  // El caso real: siete Playgrounds enseñaban su tag sin su input requerido (`<sc-form-section-nav />`, sin
  // `[sections]`), y ese código no compila al copiarlo.
  const c = [
    { nombre: 'sections', clase: 'input', porDefecto: null, requerido: true },
    { nombre: 'value', clase: 'model', porDefecto: null, requerido: true },
    { nombre: 'size', clase: 'input', porDefecto: "'md'", requerido: false },
    { nombre: 'changed', clase: 'output', porDefecto: null, requerido: false },
  ];
  assert.equal(serializeArgs(meta(['size']), { size: 'sm' }, c), '<sc-cosa [sections]="sections" [(value)]="value" size="sm" />');
  // Si un control ya lo escribe, no se repite.
  const titulo = [{ nombre: 'titleKey', clase: 'input', porDefecto: null, requerido: true }];
  assert.equal(serializeArgs(meta(['titleKey']), { titleKey: 'Hola' }, titulo), '<sc-cosa titleKey="Hola" />');
});
