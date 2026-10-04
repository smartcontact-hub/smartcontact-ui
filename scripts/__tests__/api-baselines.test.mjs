import { test } from 'node:test';
import assert from 'node:assert/strict';

import { aviso, capturasDeSpec, capturasPendientes, slugDe, tablaPintada } from '../api-baselines.mjs';

// El caso que lo motivó es #325 (2026-10-04): `sc-group-popover` ganó la salida `activated`, su página de sc-docs creció
// 142 px y `e2e-smoke` cayó en el CI por `grouppopover-linux.png`. Cada prueba fija una de las dos mitades: que avise
// de lo que de verdad se mueve, y que NO avise de lo que no se pinta (un aviso falso enseña a ignorarlo).

const GRUPOS = {
  name: 'group-popover',
  cuando: 'Para asomar los grupos de algo sin salir de la fila.',
  contrato: [
    { nombre: 'groups', clase: 'input', tipo: 'readonly GroupRef[]', porDefecto: null, requerido: true, descripcion: 'Los grupos.', origen: 'nuestro', nativo: null },
  ],
};
const ACTIVATED = { nombre: 'activated', clase: 'output', tipo: 'void', porDefecto: null, requerido: false, descripcion: 'Se pulsó la cifra.', origen: 'nuestro', nativo: null };
const api = (...components) => ({ components });
const CAPTURAS = new Set(['grouppopover', 'select']);

test('capturasDeSpec: el nombre de cada screenshotBaseline', () => {
  const spec = "await screenshotBaseline(page, 'grouppopover');\n  await screenshotBaseline( page , 'select' );\n  screenshotBaseline(page, name);";
  assert.deepEqual([...capturasDeSpec(spec)], ['grouppopover', 'select']);
});

test('slugDe: el nombre sin guiones, como la ruta de su página', () => {
  assert.equal(slugDe('group-popover'), 'grouppopover');
  assert.equal(slugDe('select'), 'select');
});

test('rojo, el caso de #325: una salida nueva sin la captura regenerada avisa', () => {
  const pendientes = capturasPendientes({
    apiAntes: api(GRUPOS),
    apiAhora: api({ ...GRUPOS, contrato: [...GRUPOS.contrato, ACTIVATED] }),
    cambiados: ['projects/ui-smartcontact/src/lib/components/group-popover/sc-group-popover.component.ts', 'projects/sc-docs/public/components/_component-api.json'],
    capturas: CAPTURAS,
  });
  assert.deepEqual(pendientes, [{ slug: 'grouppopover', porque: ['su tabla de API', 'el componente'] }]);
});

test('verde: con la captura ya regenerada, no avisa', () => {
  const pendientes = capturasPendientes({
    apiAntes: api(GRUPOS),
    apiAhora: api({ ...GRUPOS, contrato: [...GRUPOS.contrato, ACTIVATED] }),
    cambiados: ['projects/sc-docs/public/components/_component-api.json', 'e2e/components.spec.ts-snapshots/grouppopover-linux.png'],
    capturas: CAPTURAS,
  });
  assert.deepEqual(pendientes, []);
});

test('verde: lo que la tabla no pinta no avisa', () => {
  // La descripción nativa queda tapada por la propia; `ocultas` y el nombre de la base de PrimeNG no se enseñan.
  const conNativa = { ...GRUPOS, contrato: [{ ...GRUPOS.contrato[0], nativo: { descripcion: 'Texto de PrimeNG', porDefecto: null, obsoleta: null } }] };
  const otraNativa = { ...GRUPOS, ocultas: ['appendTo'], primengBase: 'Popover', contrato: [{ ...GRUPOS.contrato[0], nativo: { descripcion: 'Otro texto de PrimeNG', porDefecto: 'x', obsoleta: null } }] };
  assert.equal(tablaPintada(conNativa), tablaPintada(otraNativa));
  assert.deepEqual(capturasPendientes({ apiAntes: api(conNativa), apiAhora: api(otraNativa), cambiados: [], capturas: CAPTURAS }), []);
});

test('rojo: lo que sí pinta, campo a campo, avisa (tipo, defecto, obligatorio, marca de PrimeNG, obsoleta, cuándo)', () => {
  const base = GRUPOS.contrato[0];
  const variantes = [
    { ...base, tipo: 'GroupRef[]' },
    { ...base, porDefecto: '[]' },
    { ...base, requerido: false },
    { ...base, origen: 'nativo' },
    { ...base, nativo: { descripcion: null, porDefecto: null, obsoleta: 'Usa otra' } },
    { ...base, descripcion: 'Otra descripción.' },
  ];
  for (const v of variantes) {
    const p = capturasPendientes({ apiAntes: api(GRUPOS), apiAhora: api({ ...GRUPOS, contrato: [v] }), cambiados: [], capturas: CAPTURAS });
    assert.equal(p.length, 1, JSON.stringify(v));
  }
  const cuando = capturasPendientes({ apiAntes: api(GRUPOS), apiAhora: api({ ...GRUPOS, cuando: 'Otro uso.' }), cambiados: [], capturas: CAPTURAS });
  assert.equal(cuando.length, 1);
});

test('verde: un componente sin captura no avisa, aunque cambie', () => {
  const subsection = { name: 'subsection', cuando: null, contrato: [] };
  const conTitleId = { ...subsection, contrato: [{ nombre: 'titleId', clase: 'input', tipo: 'string | null', porDefecto: 'null', requerido: false, descripcion: 'Id.', origen: 'nuestro', nativo: null }] };
  const p = capturasPendientes({
    apiAntes: api(subsection),
    apiAhora: api(conTitleId),
    cambiados: ['projects/ui-smartcontact/src/lib/components/subsection/sc-subsection.component.ts'],
    capturas: CAPTURAS,
  });
  assert.deepEqual(p, []);
});

test('rojo: la página de sc-docs de un componente con captura avisa sola', () => {
  const p = capturasPendientes({
    apiAntes: api(),
    apiAhora: api(),
    cambiados: ['projects/sc-docs/src/app/pages/components/select/select-demo.component.html'],
    capturas: CAPTURAS,
  });
  assert.deepEqual(p, [{ slug: 'select', porque: ['su página'] }]);
});

test('aviso: dice qué captura, por qué y qué hacer con la rama; vacío si no hay nada', () => {
  const texto = aviso([{ slug: 'grouppopover', porque: ['su tabla de API', 'el componente'] }], 'mi-rama');
  assert.match(texto, /grouppopover-linux\.png/);
  assert.match(texto, /cambia su tabla de API y el componente/);
  assert.match(texto, /visual-baselines con rama=mi-rama/);
  assert.match(texto, /ANTES de abrir el PR/);
  assert.equal(aviso([], 'mi-rama'), '');
});
