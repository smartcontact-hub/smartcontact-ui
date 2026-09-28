#!/usr/bin/env node
/**
 * figma-pendiente, del papel al fichero: imprime el JavaScript que el bridge de Figma ejecuta (`figma_execute`, con el
 * fichero del DS abierto) para VERIFICAR y APLICAR los cambios de variables de `docs/figma-pendiente.md`.
 *
 * Dos comprobaciones antes de tocar nada:
 *   1. Aquí, contra el export de `main`: cada «hoy» es lo que dice `kit-export-dtcg.json` y cada destino existe. Si no,
 *      para y dice cuál: la ficha está mal, no el fichero.
 *   2. En Figma: una variable solo cambia si vale «hoy». Si ya vale lo nuevo, se salta; si vale otra cosa, no se toca y
 *      sale en `revisar`.
 *
 * Por defecto solo mira. Con `--aplicar`, cambia. Después se vuelve a pasar sin `--aplicar`: todo tiene que salir «ya
 * estaba», que es la prueba de que se escribió lo que se quería.
 *
 * Las medidas salen de `PENDIENTE_FIGMA` (`scripts/sizing-map.mjs`), no de la tabla de la ficha 4: es la lista que el
 * código vigila, así que lo que se cambia aquí es justo lo que `token-parity` dará por alineado. Las tres que hay que
 * separar en dos variables no las hace este script: van en `manuales`.
 *
 * Uso:  node tools/figma-pendiente.mjs <tanda> [--aplicar]
 *   medidas      ficha 4: las variables de PENDIENTE_FIGMA que no hay que separar, y el desenfoque del toast en claro
 *   color        fichas 8, 12, 14 y 19, y la variable nueva del título de sección (ficha 2)
 *   componentes  fichas 9 (los bordes de las pestañas) y 17 (el hueco entre botones del diálogo)
 */
import { readFileSync } from 'node:fs';

import { GROUPS, PENDIENTE_FIGMA, SIZING } from '../scripts/sizing-map.mjs';

const dtcg = JSON.parse(readFileSync(new URL('../projects/design-tokens/scripts/kit-export-dtcg.json', import.meta.url), 'utf8'));

/** Dónde vive cada capa del export en el fichero: las mismas colecciones que `figma-export-parity.mjs`. */
const COLECCION = {
  'aura/primitive': 'Primitive',
  'aura/semantic/light': 'Semantic Color Scheme',
  'aura/semantic/dark': 'Semantic Color Scheme',
  'aura/component/light': 'Component Color Scheme',
  'aura/semantic/common': 'Semantic Common',
  'aura/component/common': 'Component Common',
};
/** El modo de cada capa: el claro es el primero de su colección; las «common» tienen uno solo. */
const MODO = { 'aura/semantic/dark': 1 };

/** Un alias apunta a `surface/*` (semántica, cambia con el tema) o a una primitiva (`slate`, `red`, `scale`). */
const capaDeDestino = (nombre) => (nombre.startsWith('surface/') ? 'aura/semantic/light' : 'aura/primitive');

const valorExport = (capa, variable) => {
  let o = dtcg[capa];
  for (const k of variable.split('/')) o = o && typeof o === 'object' ? o[k] : undefined;
  return o && typeof o === 'object' && '$value' in o ? o.$value : undefined;
};
const comoAlias = (v) => (typeof v === 'string' && /^\{.+\}$/.test(v) ? v.slice(1, -1).replace(/\./g, '/') : null);

const LUZ_SEM = 'aura/semantic/light';
const LUZ_CMP = 'aura/component/light';
const CC = 'aura/component/common';
const cambio = (ficha, capa, variable, hoy, nuevo) => ({ ficha, capa, variable, hoy, nuevo });
const alias = (nombre) => ({ alias: nombre });
const valor = (n) => ({ valor: n });
const TRANSPARENTE = { color: '#00000000' };

/** Ficha 4: de PENDIENTE_FIGMA, con el «hoy» que dice el export. Las que hay que separar se apartan. */
function medidas() {
  const cambios = [];
  const manuales = [];
  for (const { label, paso } of PENDIENTE_FIGMA) {
    const fila = SIZING.find((f) => f.label === label);
    if (!fila) throw new Error(`PENDIENTE_FIGMA cita «${label}», que no está en SIZING`);
    const capa = GROUPS[fila.group];
    const variable = fila.exp.replace(/\./g, '/');
    if (/[XY]$/.test(label) && !/\.(x|y)$/.test(fila.exp)) {
      manuales.push(`${variable} → separar en …/y y …/x (ficha 4, fila de ${label}: scale/${paso})`);
      continue;
    }
    const hoy = comoAlias(valorExport(capa, variable));
    cambios.push(cambio('4', capa, variable, hoy ? alias(hoy) : valor(Number(valorExport(capa, variable))), alias(`scale/${paso}`)));
  }
  cambios.push(cambio('4', LUZ_CMP, 'toast/blur', valor(1.5), valor(10)));
  return { cambios, manuales };
}

/** Fichas 8, 12, 14 y 19, con las decisiones del 2026-09-28: el hover y el título, a 900; el rojo contorneado, también. */
function color() {
  const cambios = [
    cambio('8', LUZ_SEM, 'text/color', alias('surface/700'), alias('surface/800')),
    cambio('8', LUZ_SEM, 'form/field/color', alias('surface/700'), alias('surface/800')),
    cambio('8', LUZ_SEM, 'text/muted/color', alias('slate/600'), alias('slate/700')),
    cambio('8', LUZ_SEM, 'text/hover/color', alias('surface/800'), alias('surface/900')),
    cambio('8', LUZ_CMP, 'togglebutton/color', alias('surface/500'), alias('surface/700')),
    cambio('8', LUZ_CMP, 'togglebutton/hover/color', alias('surface/700'), alias('surface/900')),
    cambio('8', LUZ_CMP, 'togglebutton/icon/color', alias('surface/500'), alias('surface/700')),
    cambio('8', LUZ_CMP, 'togglebutton/icon/hover/color', alias('surface/700'), alias('surface/900')),
    cambio('12', LUZ_CMP, 'button/danger/background', alias('red/500'), alias('red/600')),
    cambio('12', LUZ_CMP, 'button/danger/border/color', alias('red/500'), alias('red/600')),
    cambio('12', LUZ_CMP, 'button/danger/hover/background', alias('red/600'), alias('red/700')),
    cambio('12', LUZ_CMP, 'button/danger/hover/border/color', alias('red/600'), alias('red/700')),
    cambio('12', LUZ_CMP, 'button/danger/active/background', alias('red/700'), alias('red/800')),
    cambio('12', LUZ_CMP, 'button/danger/active/border/color', alias('red/700'), alias('red/800')),
    cambio('12', LUZ_CMP, 'button/text/danger/color', alias('red/500'), alias('red/600')),
    cambio('12', LUZ_CMP, 'button/outlined/danger/color', alias('red/500'), alias('red/600')),
    cambio('14', LUZ_CMP, 'tag/secondary/color', alias('surface/600'), alias('surface/700')),
    cambio('19', LUZ_CMP, 'button/outlined/secondary/color', alias('surface/500'), alias('surface/600')),
    cambio('19', LUZ_SEM, 'form/field/icon/color', alias('surface/400'), alias('surface/600')),
    cambio('19', LUZ_SEM, 'navigation/item/icon/color', alias('surface/400'), alias('surface/600')),
    cambio('19', LUZ_SEM, 'form/field/placeholder/color', alias('surface/500'), alias('surface/600')),
  ];
  // Ficha 2: el título de sección tiene su variable en código (`--sc-text-heading`) y no en el Kit. Se crea con los dos
  // modos: claro a surface/900 (decisión del 2026-09-28) y oscuro a surface/0, el blanco que ya pinta el código.
  const crear = [
    {
      ficha: '2',
      variable: 'text/heading/color',
      coleccion: COLECCION[LUZ_SEM],
      modos: [
        { capa: LUZ_SEM, alias: 'surface/900' },
        { capa: 'aura/semantic/dark', alias: 'surface/0' },
      ],
    },
  ];
  return { cambios, crear, manuales: ['Atar el título de `Section` a la variable nueva text/heading/color (ficha 2).'] };
}

/** Fichas 9 y 17. */
function componentes() {
  return {
    cambios: [
      cambio('9', CC, 'tabs/tab/border/width', valor(1), valor(0)),
      cambio('9', CC, 'tabs/tab/border/color', alias('content/border/color'), TRANSPARENTE),
      cambio('9', CC, 'tabs/tab/hover/border/color', alias('content/border/color'), TRANSPARENTE),
      cambio('9', CC, 'tabs/tab/active/border/color', alias('primary/color'), TRANSPARENTE),
      cambio('9', CC, 'tabs/active/bar/bottom', valor(-1), valor(0)),
      cambio('17', CC, 'dialog/footer/gap', alias('scale/0-375'), alias('scale/0-75')),
    ],
    manuales: [
      'Ficha 17: en la variante del diálogo CON cuerpo, el relleno superior del pie atado a scale/0-875 en la capa (no cambiar dialog/footer/padding/top, que sigue en 0 para las confirmaciones).',
      'Ficha 17: entre campos del cuerpo del diálogo, 14 (scale/1).',
    ],
  };
}

const TANDAS = { medidas, color, componentes };
const tanda = process.argv[2];
const aplicar = process.argv.includes('--aplicar');
if (!TANDAS[tanda]) {
  console.error(`Uso: node tools/figma-pendiente.mjs <${Object.keys(TANDAS).join('|')}> [--aplicar]`);
  process.exit(1);
}
const { cambios, crear = [], manuales = [] } = TANDAS[tanda]();

/* Comprobación 1: contra el export. Una ficha que cite un «hoy» que el Kit no dice, o un destino que no existe, para
 * aquí: aplicarla en Figma sería corregir un fichero sano con un dato malo. */
const errores = [];
const exprHoy = (e) => (e.alias ? `{${e.alias.replace(/\//g, '.')}}` : e.valor);
for (const c of cambios) {
  const actual = valorExport(c.capa, c.variable);
  if (actual === undefined) errores.push(`${c.variable} (${c.capa}): no está en el export`);
  else if (c.hoy.alias ? comoAlias(actual) !== c.hoy.alias : Number(actual) !== c.hoy.valor)
    errores.push(`${c.variable} (${c.capa}): el export dice ${actual}, la ficha ${c.ficha} dice ${exprHoy(c.hoy)}`);
  if (c.nuevo.alias && valorExport(capaDeDestino(c.nuevo.alias), c.nuevo.alias) === undefined)
    errores.push(`${c.variable}: el destino ${c.nuevo.alias} no existe en el export`);
  if (JSON.stringify(c.hoy) === JSON.stringify(c.nuevo)) errores.push(`${c.variable}: ya vale lo nuevo en el export; la fila sobra`);
}
for (const n of crear) {
  if (valorExport(LUZ_SEM, n.variable) !== undefined) errores.push(`${n.variable}: ya existe en el export`);
  for (const m of n.modos)
    if (valorExport(m.capa, m.alias) === undefined) errores.push(`${n.variable}: el destino ${m.alias} no existe en ${m.capa}`);
}
if (errores.length) {
  console.error(`✗ ${errores.length} cambio(s) no cuadran con el export de main; no se genera nada:\n  ${errores.join('\n  ')}`);
  process.exit(1);
}
console.error(
  `# ${tanda}: ${cambios.length} cambio(s)${crear.length ? ` y ${crear.length} variable(s) nueva(s)` : ''}, todos contra el export de main. ` +
    `${aplicar ? 'APLICA' : 'Solo mira (añade --aplicar para cambiar)'}.`,
);
for (const m of manuales) console.error(`# a mano: ${m}`);

const paraFigma = (e, capa) =>
  e.alias ? { alias: e.alias, coleccion: COLECCION[capaDeDestino(e.alias)] } : e.color ? { color: e.color } : { valor: e.valor };
const CAMBIOS = cambios.map((c) => ({
  ficha: c.ficha,
  variable: c.variable,
  coleccion: COLECCION[c.capa],
  modo: MODO[c.capa] ?? 0,
  hoy: paraFigma(c.hoy, c.capa),
  nuevo: paraFigma(c.nuevo, c.capa),
}));
const CREAR = crear.map((n) => ({
  ficha: n.ficha,
  variable: n.variable,
  coleccion: n.coleccion,
  modos: n.modos.map((m) => ({ modo: MODO[m.capa] ?? 0, valor: { alias: m.alias, coleccion: COLECCION[capaDeDestino(m.alias)] } })),
}));

console.log(`// figma-pendiente · tanda ${tanda} · generado por tools/figma-pendiente.mjs
const APLICAR = ${aplicar};
const CAMBIOS = ${JSON.stringify(CAMBIOS)};
const CREAR = ${JSON.stringify(CREAR)};
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const colPorId = new Map(cols.map((c) => [c.id, c]));
const nombreCol = (v) => (colPorId.get(v.variableCollectionId) || {}).name || '?';
const porNombre = new Map();
for (const v of await figma.variables.getLocalVariablesAsync()) {
  const l = porNombre.get(v.name) || [];
  l.push(v);
  porNombre.set(v.name, l);
}
/* Por nombre y colección. Si la colección no se llama como se espera pero la variable es única, se usa y se avisa:
 * los nombres de las colecciones «common» no están comprobados en el fichero. */
const buscar = (nombre, coleccion) => {
  const vs = porNombre.get(nombre) || [];
  const en = vs.filter((v) => nombreCol(v) === coleccion);
  if (en.length === 1) return { v: en[0] };
  if (vs.length === 1) return { v: vs[0], aviso: 'está en «' + nombreCol(vs[0]) + '», no en «' + coleccion + '»' };
  return { error: vs.length ? 'hay ' + vs.length + ': ' + vs.map(nombreCol).join(', ') : 'no existe' };
};
const hex8 = (c) => {
  const n = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return '#' + n(c.r) + n(c.g) + n(c.b) + n(c.a === undefined ? 1 : c.a);
};
const describir = async (x) => {
  if (x && typeof x === 'object' && x.type === 'VARIABLE_ALIAS') {
    const o = await figma.variables.getVariableByIdAsync(x.id);
    return o ? 'alias ' + o.name : 'alias roto';
  }
  if (x && typeof x === 'object' && 'r' in x) return 'color ' + hex8(x);
  return 'valor ' + x;
};
const texto = (e) => (e.alias ? 'alias ' + e.alias : e.color ? 'color ' + e.color : 'valor ' + e.valor);
const construir = (e) => {
  if (e.alias) {
    const r = buscar(e.alias, e.coleccion);
    if (!r.v) throw new Error('destino ' + e.alias + ': ' + r.error);
    return figma.variables.createVariableAlias(r.v);
  }
  if (e.color) {
    const h = e.color.slice(1);
    const p = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
    return { r: p(0), g: p(2), b: p(4), a: p(6) };
  }
  return e.valor;
};
const informe = [];
for (const c of CAMBIOS) {
  const r = buscar(c.variable, c.coleccion);
  let estado;
  let enFigma = null;
  if (!r.v) estado = 'no encontrada: ' + r.error;
  else {
    const col = colPorId.get(r.v.variableCollectionId);
    const modo = col.modes[c.modo] || col.modes[0];
    enFigma = await describir(r.v.valuesByMode[modo.modeId]);
    if (enFigma === texto(c.nuevo)) estado = 'ya estaba';
    else if (enFigma !== texto(c.hoy)) estado = 'distinta: no se toca';
    else if (!APLICAR) estado = 'lista';
    else {
      try {
        r.v.setValueForMode(modo.modeId, construir(c.nuevo));
        estado = 'cambiada';
      } catch (e) {
        estado = 'error: ' + e.message;
      }
    }
    if (r.aviso) estado += ' (' + r.aviso + ')';
  }
  informe.push({ ficha: c.ficha, variable: c.variable, modo: c.modo, figma: enFigma, hoy: texto(c.hoy), nuevo: texto(c.nuevo), estado });
}
for (const n of CREAR) {
  const r = buscar(n.variable, n.coleccion);
  let estado;
  if (r.v) {
    const col = colPorId.get(r.v.variableCollectionId);
    const vals = [];
    for (const m of n.modos) vals.push(await describir(r.v.valuesByMode[(col.modes[m.modo] || col.modes[0]).modeId]));
    estado = vals.every((x, i) => x === texto(n.modos[i].valor)) ? 'ya estaba' : 'existe con otros valores: no se toca (' + vals.join(' · ') + ')';
  } else if (!APLICAR) estado = 'lista para crear';
  else {
    try {
      const col = cols.find((c) => c.name === n.coleccion);
      if (!col) throw new Error('no existe la colección ' + n.coleccion);
      const v = figma.variables.createVariable(n.variable, col, 'COLOR');
      for (const m of n.modos) v.setValueForMode((col.modes[m.modo] || col.modes[0]).modeId, construir(m.valor));
      estado = 'creada';
    } catch (e) {
      estado = 'error: ' + e.message;
    }
  }
  informe.push({ ficha: n.ficha, variable: n.variable, nuevo: n.modos.map((m) => texto(m.valor)).join(' · '), estado });
}
const cuenta = {};
for (const i of informe) {
  const k = i.estado.split(':')[0].split(' (')[0];
  cuenta[k] = (cuenta[k] || 0) + 1;
}
const bien = ['lista', 'lista para crear', 'cambiada', 'creada', 'ya estaba'];
return { aplicar: APLICAR, cuenta, revisar: informe.filter((i) => !bien.includes(i.estado)), informe };`);
