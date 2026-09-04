#!/usr/bin/env node
/**
 * variables:map — deriva el MAPA DE CONEXIÓN DE VARIABLES desde el crudo medido. PURO, sin
 * navegador y sin Figma. Es la mitad "deriva + guard" del par; la otra mitad es la MEDICIÓN,
 * que necesita el puente de Figma y el navegador y por eso no puede correr en CI (mismo
 * reparto que `usage:capture` ↔ `usage:check`).
 *
 * Lee:
 *   - `projects/sc-docs/public/variables/_variables-raw.json` — lo medido el día de la captura:
 *     · `figma[componente][variable] = 1|0`  ¿la usa alguna capa del Figma del DS?
 *     · `web[componente][token]      = 1|0`  ¿la lee el CSS de PrimeNG en el deploy del consumidor?
 *     · `revisiones[comp|variable]           el veredicto humano: bloque, capa, selector, motivo
 *     · `hallazgos[]`                        lo que no es una variable (fugas, duplicidades)
 *
 * Escribe dos derivados, los dos desde la MISMA ejecución para que no puedan divergir:
 *   - `projects/sc-docs/public/variables/_variables-status.json` → lo pinta la página de sc-docs
 *   - `docs/conexion-variables.csv`                              → para abrir en Excel
 *
 * Modos:
 *   node scripts/variables-map.mjs           check  (por defecto): recomputa y FALLA si lo
 *                                            committeado difiere. Es el guard.
 *   node scripts/variables-map.mjs --write   reescribe los dos derivados.
 *
 * El veredicto de cada variable sale del cruce, y una revisión humana puede pisarlo:
 *   conectada · Figma no la usa · espejismo · muerta · solo web · solo Figma
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = resolve(root, 'projects/sc-docs/public/variables/_variables-raw.json');
const STATUS = resolve(root, 'projects/sc-docs/public/variables/_variables-status.json');
const CSV = resolve(root, 'docs/conexion-variables.csv');

const modo = process.argv.includes('--write') ? 'write' : 'check';

if (!existsSync(RAW)) {
  console.error(`✗ falta el crudo: ${RAW}`);
  console.error('  Lo escribe la sesión de medición (puente de Figma + navegador), no este script.');
  process.exit(1);
}
const raw = JSON.parse(readFileSync(RAW, 'utf8'));

/**
 * El nombre en Figma va con barras y el token del tema con guiones. Además Figma parte en dos
 * lo que el CSS mantiene junto: `padding/x` y `padding/y` son un solo `padding`. Por eso se
 * prueba el nombre exacto y, si no casa, el mismo sin el sufijo de lado.
 */
function candidatos(nombreFigma) {
  const base = nombreFigma.replace(/\//g, '-');
  const out = [base];
  for (const suf of ['-x', '-y', '-top', '-right', '-bottom', '-left']) {
    if (base.endsWith(suf)) out.push(base.slice(0, -suf.length));
  }
  return out;
}

function veredicto(usaFigma, leeWeb, hayToken) {
  if (!hayToken) return 'solo Figma';
  if (usaFigma && leeWeb) return 'conectada';
  if (!usaFigma && leeWeb) return 'Figma no la usa';
  if (usaFigma && !leeWeb) return 'espejismo';
  return 'muerta';
}

const filas = [];
for (const comp of Object.keys(raw.figma).sort()) {
  const fig = raw.figma[comp];
  const web = raw.web[comp] ?? {};
  const tocados = new Set();

  for (const nombre of Object.keys(fig).sort()) {
    const token = candidatos(nombre).find((c) => c in web) ?? null;
    if (token) tocados.add(token);
    const usaFigma = fig[nombre] === 1;
    const leeWeb = token ? web[token] === 1 : false;
    const rev = raw.revisiones[`${comp}|${nombre}`] ?? {};
    filas.push({
      componente: comp,
      variable: nombre,
      token: token ? `--p-${comp}-${token}` : '',
      usaFigma: usaFigma ? 'sí' : 'no',
      leeWeb: token ? (leeWeb ? 'sí' : 'no') : '',
      veredicto: rev.accionable === 'HECHO' ? 'conectada' : veredicto(usaFigma, leeWeb, !!token),
      bloque: rev.bloque ?? '',
      capa: rev['capa de Figma'] ?? '',
      selector: rev['selector CSS'] ?? '',
      accionable: rev.accionable ?? '',
      motivo: rev.motivo ?? '',
      revisado: rev.revisado ?? '',
    });
  }

  // Tokens que el tema publica y Figma no modela.
  for (const token of Object.keys(web).sort()) {
    if (tocados.has(token)) continue;
    filas.push({
      componente: comp,
      variable: '',
      token: `--p-${comp}-${token}`,
      usaFigma: '',
      leeWeb: web[token] === 1 ? 'sí' : 'no',
      veredicto: 'solo web',
      bloque: '',
      capa: '',
      selector: '',
      accionable: '',
      motivo: '',
      revisado: '',
    });
  }
}

// Los hallazgos que no son una variable (fugas entre componentes, duplicidades de canal).
for (const h of raw.hallazgos ?? []) {
  filas.push({
    componente: h.Componente ?? '',
    variable: h['Variable en Figma'] ?? '',
    token: h['Token en el tema'] ?? '',
    usaFigma: h['La usa una capa de Figma'] ?? '',
    leeWeb: h['La lee el CSS de PrimeNG'] ?? '',
    veredicto: h.Veredicto ?? '',
    bloque: h.bloque ?? '',
    capa: h['capa de Figma'] ?? '',
    selector: h['selector CSS'] ?? '',
    accionable: h.accionable ?? '',
    motivo: h.motivo ?? '',
    revisado: h.revisado ?? '',
  });
}

const cuenta = (pred) => filas.filter(pred).length;
const resumen = {
  medidoEl: raw.medidoEl,
  fuente: raw.fuente,
  total: filas.length,
  componentes: Object.keys(raw.figma).length,
  porVeredicto: {},
  revisadas: cuenta((f) => f.revisado),
  atadas: cuenta((f) => f.accionable === 'HECHO'),
  pendientes: cuenta((f) => f.accionable.startsWith('PENDIENTE')),
  faltaDibujarlo: cuenta((f) => f.motivo.includes('FALTA DIBUJARLO')),
};
for (const f of filas) resumen.porVeredicto[f.veredicto] = (resumen.porVeredicto[f.veredicto] ?? 0) + 1;

const status = { ...resumen, filas };

const CAB = [
  'Componente',
  'Variable en Figma',
  'Token en el tema',
  'La usa una capa de Figma',
  'La lee el CSS de PrimeNG',
  'Veredicto',
  'bloque',
  'capa de Figma',
  'selector CSS',
  'accionable',
  'motivo',
  'revisado',
];
const esc = (v) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const csv =
  '﻿' +
  [
    CAB.join(','),
    ...filas.map((f) =>
      [
        f.componente,
        f.variable,
        f.token,
        f.usaFigma,
        f.leeWeb,
        f.veredicto,
        f.bloque,
        f.capa,
        f.selector,
        f.accionable,
        f.motivo,
        f.revisado,
      ]
        .map(esc)
        .join(','),
    ),
  ].join('\n') +
  '\n';

const statusTxt = JSON.stringify(status, null, 2) + '\n';

if (modo === 'write') {
  writeFileSync(STATUS, statusTxt);
  writeFileSync(CSV, csv);
  console.log(`✓ mapa regenerado — ${filas.length} filas, ${resumen.componentes} componentes`);
  for (const [k, v] of Object.entries(resumen.porVeredicto).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(v).padStart(4)}  ${k}`);
  }
  console.log(`    atadas: ${resumen.atadas} · pendientes: ${resumen.pendientes} · falta dibujarlo: ${resumen.faltaDibujarlo}`);
  process.exit(0);
}

let problemas = 0;
for (const [ruta, esperado] of [
  [STATUS, statusTxt],
  [CSV, csv],
]) {
  if (!existsSync(ruta)) {
    console.error(`✗ falta el derivado ${ruta}`);
    problemas++;
    continue;
  }
  if (readFileSync(ruta, 'utf8') !== esperado) {
    console.error(`✗ ${ruta} no cuadra con el crudo. Corre: npm run variables:map`);
    problemas++;
  }
}
if (problemas) process.exit(1);
console.log(`✓ variables:check — ${filas.length} filas cuadran con el crudo`);
