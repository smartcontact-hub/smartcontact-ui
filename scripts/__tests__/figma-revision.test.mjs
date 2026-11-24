import { test } from 'node:test';
import assert from 'node:assert/strict';

import { costura, revisar, scriptDeRevision, valoresDelKit } from '../../tools/figma-revision.mjs';

// Las notas que se quitaron del Figma del Supervisor el 2026-11-04: si una deja de cazarse, la revisión miente.
const COSTURAS_REALES = [
  'Limitaciones del Kit de Figma',
  'El selectbutton de Figma llega a 4. Se ha compuesto con 5 togglebutton. En código no hay tope.',
  'Repository card (propia; componente local): borde de tono, marcada',
  'Propio de esta pantalla (candidato a subir al DS)',
  'Ya viene del shell; no se ha tocado.',
  'El DS de Figma no tiene variante de tono «label»: el tono va sobrescrito con las paletas.',
  'Por decidir',
  'Único componente local (ni en el DS de Figma ni en ui.smart-contact.com): la vista del agente.',
  'Va con el SCSS de sc-list-page.',
  'Lo decide DD-239.',
];

// Notas para desarrollo que tienen que pasar.
const NOTAS_BUENAS = [
  'Usad estos componentes tal cual. El filtro por categoría tiene cinco opciones.',
  'Botón con icono, cifra, nombre y descripción. No está en nuestro DS ni en PrimeNG.',
  'Naranja: propio de esta pantalla. No está en nuestro DS ni en PrimeNG: hay que construirlo.',
  'Piezas propias',
  'Al pasar, el borde toma el tono fuerte de su categoría (1 px).',
];

test('caza cada costura que se limpió del Figma', () => {
  for (const nota of COSTURAS_REALES) assert.ok(costura(nota), `no caza: ${nota}`);
});

test('deja pasar las notas para desarrollo', () => {
  for (const nota of NOTAS_BUENAS) assert.equal(costura(nota), null, `caza de más: ${nota}`);
});

test('el script lleva la página como dato, los mismos patrones y los valores del Kit', () => {
  const js = scriptDeRevision('↳ Tipificaciones');
  assert.match(js, /"↳ Tipificaciones"/);
  assert.match(js, /componentes\? locale\?s\?/);
  assert.match(js, /"letra":\[[^\]]*\b12\b/);
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  assert.doesNotThrow(() => new AsyncFunction('figma', js), 'el script no compila tal como se manda al fichero');
});

// ─── Los valores del Kit salen del export ────────────────────────────────────────────────────────────────────────

test('el Kit no tiene los valores que el componente input del DS trae en Figma', () => {
  const kit = valoresDelKit();
  for (const v of [12, 14, 16]) assert.ok(kit.letra.includes(v), `falta la letra ${v} del Kit`);
  for (const v of [15, 13.25, 13, 16.75]) assert.ok(!kit.letra.includes(v), `la letra ${v} no es del Kit`);
  for (const v of [18, 20, 24]) assert.ok(kit.interlineado.includes(v), `falta el interlineado ${v} del Kit`);
  assert.ok(!kit.interlineado.includes(21), 'el interlineado 21 no es del Kit');
  for (const v of [7, 8.75, 14, 28]) assert.ok(kit.espacio.includes(v), `falta el espacio ${v} del Kit`);
  assert.ok(kit.radio.includes(6), 'falta el radio 6 del Kit');
});

test('resuelve los alias del export contra todas las colecciones', () => {
  const kit = valoresDelKit({
    'aura/primitive': { scale: { 1: { $value: 14 }, '0-5': { $value: 7 } } },
    'aura/custom': { primitive: { typography: { font: { size: { 100: { $value: 12 } } } } } },
    'aura/component/common': {
      inputtext: { sm: { font: { size: { $value: '{primitive.typography.font.size.100}' } } } },
      card: { gap: { $value: '{scale.0-5}' } },
    },
    'aura/docs-(local)': { raro: { font: { size: { $value: 15 } } } },
  });
  assert.deepEqual(kit.letra, [12]);
  assert.deepEqual(kit.espacio, [0, 7, 14]);
});

// ─── La revisión, contra un árbol de mentira que reproduce la maqueta de Equipos (3452:14415) ──────────────────

const KIT = { letra: [12, 14, 16], interlineado: [18, 20, 24], espacio: [0, 7, 14, 28], radio: [0, 6, 12] };
const MIXTO = Symbol('mixed');

/** Un árbol de Figma mínimo: lo justo que lee `revisar`. */
function arbol(spec, padre = null, indice = new Map()) {
  const { children = [], ...props } = spec;
  const nodo = { visible: true, boundVariables: {}, ...props, parent: padre };
  indice.set(nodo.id, nodo);
  nodo.children = children.map((c) => arbol(c, nodo, indice));
  nodo.findAll = (f) => nodo.children.flatMap((c) => [...(f(c) ? [c] : []), ...c.findAll(f)]);
  nodo.findOne = (f) => nodo.findAll(f)[0] ?? null;
  nodo.getStyledTextSegments = () => [{ fontSize: nodo.fontSize, lineHeight: nodo.lineHeight }];
  if (nodo.type === 'INSTANCE') nodo.getMainComponentAsync = async () => nodo.maestro ?? null;
  nodo.indice = indice;
  return nodo;
}

const texto = (id, characters, extra = {}) => ({
  id, type: 'TEXT', name: id, characters, fontSize: 12, lineHeight: { unit: 'PIXELS', value: 18 }, textStyleId: 'S:caption', ...extra,
});

/** El input del DS tal como está hoy en Figma: placeholder a 15 y la etiqueta y la ayuda apagadas. */
function input(id, { mostrarEtiqueta = false, letra = 15, overrides = [] } = {}) {
  return {
    id, type: 'INSTANCE', name: 'inputtext ' + id, x: 0, width: 500,
    maestro: { name: 'Size=Normal, Invalid=True', parent: { type: 'COMPONENT_SET', name: 'inputtext' }, findOne: () => null },
    componentProperties: {
      '🏷️ Show Label#5662:50': { type: 'BOOLEAN', value: mostrarEtiqueta },
      'ℹ️ Show Helper#1729:1731': { type: 'BOOLEAN', value: false },
      '↳ Label#5662:83': { type: 'TEXT', value: 'Nombre *' },
    },
    overrides,
    children: [texto(id + ';ph', 'Ej: Inglés', { name: 'Placeholder', fontSize: letra, lineHeight: { unit: 'PIXELS', value: 20 }, textStyleId: '' })],
  };
}

const sidebar = { id: '1:0', type: 'INSTANCE', name: 'sidebar', x: 0, width: 80, overrides: [], componentProperties: {}, maestro: { name: 'sidebar', parent: null, findOne: () => null } };

/** La pantalla (lleva la barra lateral): los campos van en el slot de una Section, como en Equipos. */
function pantalla(campo, { tablero = null } = {}) {
  const page = arbol({
    id: '0:1', type: 'PAGE', name: '↳ Equipos',
    children: [...(tablero ? [tablero] : []), {
      id: '1:1', type: 'FRAME', name: 'E1 Alta de equipo', layoutMode: 'NONE',
      children: [sidebar, {
        id: '1:2', type: 'INSTANCE', name: 'Section: General', overrides: [],
        maestro: { name: 'Section', parent: null, findOne: () => null }, componentProperties: {},
        children: [{ id: '1:3', type: 'SLOT', name: 'Slot 1', children: [campo] }],
      }],
    }],
  });
  const figma = {
    mixed: MIXTO,
    root: { children: [page] },
    setCurrentPageAsync: async () => {},
    getNodeByIdAsync: async (id) => page.indice.get(id) ?? null,
  };
  return { figma, page };
}

const revisa = ({ figma }, objetivo = '↳ Equipos') => revisar(figma, objetivo, KIT, [/^por decidir$/i]);

test('Equipos tal como estaba: etiqueta y error sueltos al lado del input, y el placeholder del componente a 15', async () => {
  const r = await revisa(pantalla({
    id: '2:1', type: 'FRAME', name: 'campo Nombre', layoutMode: 'VERTICAL', itemSpacing: 7, boundVariables: { itemSpacing: {} },
    children: [
      texto('2:2', 'Nombre *', { fontName: { style: 'Semi Bold' } }),
      input('2:3'),
      texto('2:4', 'El nombre es obligatorio', { textStyleId: '', fills: [{ type: 'SOLID', color: { r: 0.86, g: 0.15, b: 0.15 } }] }),
    ],
  }));
  assert.equal(r.camposAMano.length, 1, 'el campo montado a mano no sale');
  assert.match(r.camposAMano[0], /Show Label, ℹ️ Show Helper: apagada \| al lado: «Nombre \*» «El nombre es obligatorio»/);
  assert.deepEqual(Object.keys(r.sinEstilo), ['12/18 ×1'], 'el texto suelto dentro del slot es de la maqueta y no lleva estilo');
  assert.deepEqual(Object.keys(r.sinVariable), ['relleno #DB2626 ×1']);
  assert.deepEqual(Object.keys(r.componentesFueraDelKit), ['inputtext › Placeholder: letra 15 ×1']);
  assert.deepEqual(r.fueraDelKit, {}, 'el 15 lo trae el componente: no es de la maqueta');
});

test('el mismo campo con la etiqueta del componente: todo vacío salvo lo que es del componente', async () => {
  const r = await revisa(pantalla(input('2:3', { mostrarEtiqueta: true, letra: 14 })));
  for (const lista of ['costuras', 'sinEstilo', 'menusApretados', 'camposAMano', 'retoques', 'sinVariable', 'fueraDelKit', 'componentesFueraDelKit']) {
    assert.deepEqual(r[lista], Array.isArray(r[lista]) ? [] : {}, `${lista} no sale vacía`);
  }
});

test('un contador al lado de un buscador no es una etiqueta', async () => {
  const r = await revisa(pantalla({
    id: '2:1', type: 'FRAME', name: 'barra', layoutMode: 'HORIZONTAL', itemSpacing: 7, boundVariables: { itemSpacing: {} },
    children: [input('2:3', { letra: 14 }), texto('2:5', '0 asignados')],
  }));
  assert.deepEqual(r.camposAMano, []);
});

test('una letra retocada sobre la instancia es retoque y fuera del Kit de la maqueta, no del componente', async () => {
  const r = await revisa(pantalla(input('2:3', { mostrarEtiqueta: true, overrides: [{ id: '2:3;ph', overriddenFields: ['fontSize', 'characters'] }] })));
  assert.deepEqual(Object.keys(r.retoques), ['inputtext › Placeholder: fontSize ×1']);
  assert.deepEqual(Object.keys(r.fueraDelKit), ['letra 15 (retoque en inputtext) ×1']);
  assert.deepEqual(r.componentesFueraDelKit, {});
});

test('un ancho desatado al redimensionar no es un retoque', async () => {
  const r = await revisa(pantalla(input('2:3', { mostrarEtiqueta: true, letra: 14, overrides: [{ id: '2:3', overriddenFields: ['width', 'height', 'boundVariables'] }] })));
  assert.deepEqual(r.retoques, {});
});

test('medidas de la maqueta sin variable y fuera del Kit', async () => {
  const r = await revisa(pantalla({
    id: '2:1', type: 'FRAME', name: 'tarjeta', layoutMode: 'VERTICAL', paddingTop: 10, paddingBottom: 14, itemSpacing: 7,
    boundVariables: { paddingBottom: {}, itemSpacing: {} }, topLeftRadius: 5, topRightRadius: 5, bottomLeftRadius: 5, bottomRightRadius: 5,
    children: [input('2:3', { mostrarEtiqueta: true, letra: 14 })],
  }));
  assert.deepEqual(Object.keys(r.sinVariable).sort(), ['paddingTop 10 ×1', 'radio 5 ×1']);
  assert.deepEqual(Object.keys(r.fueraDelKit).sort(), ['espacio 10 (paddingTop) ×1', 'radio 5 ×1']);
});

test('el placeholder pintado de rojo a mano es retoque; un icono recoloreado con una variable, no', async () => {
  const rojo = { type: 'SOLID', color: { r: 0.86, g: 0.15, b: 0.15 }, boundVariables: { color: { id: 'VariableID:rojo' } } };
  const campo = input('2:3', { mostrarEtiqueta: true, letra: 14, overrides: [{ id: '2:3;ph', overriddenFields: ['fills'] }, { id: '2:3;ico', overriddenFields: ['fills'] }] });
  campo.children[0].fills = [rojo];
  campo.children.push({ id: '2:3;ico', type: 'VECTOR', name: 'search', width: 14, height: 14, fills: [rojo] });
  const r = await revisa(pantalla(campo));
  assert.deepEqual(Object.keys(r.retoques), ['inputtext › Placeholder: fills ×1']);
});

test('en una página solo mira las pantallas: un tablero sin barra lateral no cuenta, salvo para costuras y estilos', async () => {
  const tablero = {
    id: '9:0', type: 'SECTION', name: '4. Mapa de componentes',
    children: [{
      id: '9:1', type: 'FRAME', name: 'Portada: mapa de componentes', layoutMode: 'VERTICAL', paddingTop: 112, itemSpacing: 240,
      children: [texto('9:2', 'Por decidir', { textStyleId: '' })],
    }],
  };
  const r = await revisa(pantalla(input('2:3', { mostrarEtiqueta: true, letra: 14 }), { tablero }));
  assert.deepEqual(r.sinVariable, {});
  assert.deepEqual(r.fueraDelKit, {});
  assert.equal(r.costuras.length, 1, 'las costuras se miran en toda la página');
  assert.deepEqual(Object.keys(r.sinEstilo), ['12/18 ×1'], 'los textos sin estilo, también');
});

test('con un nodo revisa solo esa pantalla y no cambia de página', async () => {
  const p = pantalla(input('2:3'));
  p.figma.setCurrentPageAsync = async () => assert.fail('no debe cambiar de página');
  const r = await revisa(p, '1:1');
  assert.equal(r.pagina, '↳ Equipos');
  assert.deepEqual(Object.keys(r.componentesFueraDelKit), ['inputtext › Placeholder: letra 15 ×1']);
});
