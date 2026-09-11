#!/usr/bin/env node
/**
 * EL ESLABÓN QUE FALTABA: el fichero de Figma contra el export del Kit.
 *
 * `tokens:parity` compara *export ↔ CSS*, así que el tramo *Figma ↔ export* no lo miraba nadie —
 * y por ahí se coló el desfase de julio. No puede ser gate de CI porque necesita el bridge de
 * Figma abierto (mismo caso que el Check D de `docs:coherence`), así que vive aquí como
 * procedimiento: este script IMPRIME el JavaScript que hay que pegarle a `figma_execute` (o a
 * `figma_execute_across_files` con el fileKey del DS), con los valores del export ya embebidos.
 *
 * Se compara DENTRO de Figma a propósito: traer 282 variables por el puente y compararlas fuera
 * es un viaje más donde perder precisión, y el error que más caro salió fue justo de precisión.
 *
 * ⚠️ LAS DOS TRAMPAS, y las dos costaron una pasada entera:
 *   · **RGBA final por los dos lados.** La primera vez dio **15 divergencias falsas** por leer
 *     los colores de Figma sin canal alfa (`#000000` contra `#00000000` del export). Aquí todo
 *     se normaliza a 8 dígitos en minúsculas.
 *   · **Los alias.** Una variable de Figma puede apuntar a otra; comparar el alias contra un
 *     valor ya resuelto no compara nada. El código los sigue hasta el valor final.
 *   · Y en el JSON del export **las claves raíz llevan las barras dentro**:
 *     `d['aura/primitive']`, no `d.aura.primitive`.
 *
 * El resultado trae `coincidencias`: si sale 0 con `distintos` vacío, el comparador no está
 * casando NADA y el verde es falso. Medido el 2026-09-12: 242 colores y 40 numéricos, 282/282
 * coincidencias, 0 divergencias — y el control negativo (dos valores adulterados y un token
 * inventado) los cazó los tres.
 *
 * Uso:  node tools/figma-export-parity.mjs [capa]      (capa: primitive · semantic-light · …)
 *       → pega la salida en `figma_execute_across_files` con fileKey khNq9dJKNi13pNllrqm6dx
 */
import { readFileSync } from 'node:fs';

const CAPAS = {
  primitive: { export: 'aura/primitive', coleccion: 'Primitive', modo: 0 },
  'semantic-light': { export: 'aura/semantic/light', coleccion: 'Semantic Color Scheme', modo: 0 },
  'semantic-dark': { export: 'aura/semantic/dark', coleccion: 'Semantic Color Scheme', modo: 1 },
  'component-light': { export: 'aura/component/light', coleccion: 'Component Color Scheme', modo: 0 },
  'component-dark': { export: 'aura/component/dark', coleccion: 'Component Color Scheme', modo: 1 },
  app: { export: 'aura/app', coleccion: 'App', modo: 0 },
};

const nombre = process.argv[2] ?? 'primitive';
const capa = CAPAS[nombre];
if (!capa) {
  console.error(`Capa desconocida: ${nombre}. Las que hay: ${Object.keys(CAPAS).join(', ')}`);
  process.exit(1);
}

const dtcg = JSON.parse(readFileSync('projects/design-tokens/scripts/kit-export-dtcg.json', 'utf8'));
const raiz = dtcg[capa.export];
if (!raiz) {
  console.error(`El export no trae \`${capa.export}\`. Claves: ${Object.keys(dtcg).join(' · ')}`);
  process.exit(1);
}

/** Aplana el DTCG a `nombre/por/barras` → valor, que es como se llaman las variables en Figma. */
const aplanar = (o, prefijo = '', out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    if (k.startsWith('$')) continue;
    const q = prefijo ? `${prefijo}/${k}` : k;
    if (v && typeof v === 'object' && '$value' in v) out[q] = v.$value;
    else if (v && typeof v === 'object') aplanar(v, q, out);
  }
  return out;
};

/**
 * El export también trae ALIASES, y son la segunda trampa: las capas curadas (semantic,
 * component) no guardan hexes sino `{surface.0}`, `{primary.color}`. Comparar un alias contra el
 * valor ya resuelto de Figma no compara nada — sale «todo distinto» y no es verdad. Se resuelven
 * aquí contra la PROPIA capa primero y las de fondo después, en ese orden.
 *
 * ⚠️ Resolver «contra el export entero» es lo primero que probé y está MAL, cazado midiendo:
 * `text/color` existe en `semantic/light` Y en `semantic/dark`, así que la última capa leída
 * ganaba y `content/color` de la capa CLARA salía `#ffffff` (el valor de la oscura) en vez de
 * `#3f3f46`. Un alias se resuelve en su capa; solo si no está, se baja a primitive.
 */
const FONDO = ['aura/primitive', 'aura/semantic/common', 'aura/component/common'];
const TODO = {};
for (const capaNombre of [...FONDO, capa.export]) {
  const contenido = dtcg[capaNombre];
  if (!contenido || typeof contenido !== 'object') continue;
  for (const [k, v] of Object.entries(aplanar(contenido))) TODO[k] = v;
}
const resolverAlias = (valor, saltos = 0) => {
  if (typeof valor !== 'string' || !/^\{.+\}$/.test(valor) || saltos > 10) return valor;
  const ruta = valor.slice(1, -1).replace(/\./g, '/');
  if (!(ruta in TODO)) return `(alias sin destino: ${valor})`;
  return resolverAlias(TODO[ruta], saltos + 1);
};

const esperado = aplanar(raiz);
let conAlias = 0;
for (const [k, v] of Object.entries(esperado)) {
  const r = resolverAlias(v);
  if (r !== v) conAlias += 1;
  esperado[k] = r;
}
const sinDestino = Object.entries(esperado).filter(([, v]) => String(v).startsWith('(alias sin destino'));
console.error(`# ${nombre}: ${Object.keys(esperado).length} tokens del export (${conAlias} eran alias), colección «${capa.coleccion}» modo ${capa.modo}`);
if (sinDestino.length) console.error(`# ⚠️ ${sinDestino.length} alias sin destino en el export: ${sinDestino.slice(0, 3).map(([k]) => k).join(', ')}…`);

console.log(`// Paridad Figma ↔ export · capa ${nombre} · generado por tools/figma-export-parity.mjs
const EXPORT = ${JSON.stringify(esperado)};
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const col = cols.find((c) => c.name === ${JSON.stringify(capa.coleccion)});
if (!col) return { error: 'no existe la colección ${capa.coleccion}', hay: cols.map((c) => c.name) };
const modo = col.modes[${capa.modo}].modeId;
const hex8 = (c) => { const n = (x) => Math.round(x * 255).toString(16).padStart(2, '0'); return '#' + n(c.r) + n(c.g) + n(c.b) + n(c.a === undefined ? 1 : c.a); };
const vals = {};
for (const id of col.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (!v) continue;
  let x = v.valuesByMode[modo];
  let saltos = 0;
  while (x && typeof x === 'object' && x.type === 'VARIABLE_ALIAS' && saltos < 10) {
    const o = await figma.variables.getVariableByIdAsync(x.id);
    if (!o) { x = '(alias roto)'; break; }
    x = o.valuesByMode[modo] ?? o.valuesByMode[Object.keys(o.valuesByMode)[0]];
    saltos += 1;
  }
  vals[v.name] = x && typeof x === 'object' && 'r' in x ? hex8(x) : x;
}
const norm = (x) => (typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x) ? (x + 'ff').toLowerCase() : typeof x === 'string' ? x.toLowerCase() : x);
const distintos = [];
let coincidencias = 0;
for (const [k, esp] of Object.entries(EXPORT)) {
  if (!(k in vals)) { distintos.push({ token: k, figma: '(no está en Figma)', kit: esp }); continue; }
  if (String(norm(vals[k])) === String(norm(esp))) coincidencias += 1;
  else distintos.push({ token: k, figma: vals[k], kit: esp });
}
// \`coincidencias\` es el CONTROL: 0 con \`distintos\` vacío significa que no casa nada.
return { enFigma: Object.keys(vals).length, enKit: Object.keys(EXPORT).length, coincidencias, distintos, soloFigma: Object.keys(vals).filter((k) => !(k in EXPORT)) };`);
