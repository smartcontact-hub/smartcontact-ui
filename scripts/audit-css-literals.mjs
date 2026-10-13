/*
 * GUARDIÁN · la tipografía y los espaciados se escriben con su variable, no con un número.
 * ===========================================================================================
 *
 * Por qué existe. `audit:text-styles` vigila el CSS de las PANTALLAS (Supervisor y sc-docs) y a
 * propósito perdona los interlineados sin unidad (no tenían token destino). Nadie miraba el SCSS
 * de los COMPONENTES del DS, ni los espaciados de nadie. Por ese hueco entraron, medido el
 * 2026-10-09 en el barrido tipográfico de agentes y grupos, un `line-height: 1.45` en la ayuda de
 * seis campos (18,2 px en vez de los 18 de Caption), un `1.4` en el título de `sc-dialog` y un
 * `letter-spacing: -0.01em` en el de `sc-section-card`: ningún gate los veía.
 *
 * Qué afirma. Cuenta, en cada zona, las declaraciones que ponen un NÚMERO donde va una variable:
 *   · tipografía: `font-size`, `line-height`, `letter-spacing` o `font-weight` con un valor que no
 *     es `var(...)` (ni `inherit`, `normal`, `1lh`, `0`…);
 *   · espaciado: `padding`, `margin` o `gap` (y sus lados) con un px, rem o em fuera de `var(...)`,
 *     también dentro de un `calc()`.
 * Es un TRINQUETE, como el de `audit:text-styles`: el número solo puede bajar. No juzga los que
 * ya estaban (un `line-height: 1` que centra un icono en su caja tiene su motivo); impide que
 * entren nuevos, y cuando uno sale obliga a bajar el tope.
 *
 * Por qué con variable y no con la clase `.sc-text-*`. Dentro de un componente de PrimeNG el
 * texto lo pone su token de componente (`--p-<componente>-*`, en `sc-preset/`), que es lo que lee
 * el Theme Designer y lo que el Kit de Figma exporta. La clase es para el texto de pantalla. Lo
 * que vale para los dos lados es que el valor salga de una variable: así un cambio en Figma llega
 * al componente sin tocar su hoja.
 *
 * ⚠️ Mira lo que se DECLARA, no lo que gana: el valor que se pinta lo miden los e2e
 * (`e2e/baselines/component-styles.json`).
 *
 * Lee el FUENTE, no un `dist/`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const log = (s = '') => process.stdout.write(s + '\n');

/**
 * Las zonas y su tope. Medido el 2026-10-09 al nacer el gate (DS 15 y 42). Si una cifra baja, se baja su tope
 * en el mismo cambio: un tope holgado deja volver lo que ya salió.
 *
 * DS 15 → 13 y 42 → 38 el mismo día, con el barrido tipográfico del flujo de grupos: `sc-inputnumber` deja su letra y
 * su relleno al tema por `pSize` (DD-91) y su sufijo y el globo de agentes pasan a los tokens de caption.
 */
export const ZONAS = [
  { nombre: 'DS · tipografía', dirs: ['projects/ui-smartcontact/src/lib/components'], tipo: 'tipografia', max: 13 },
  { nombre: 'DS · espaciado', dirs: ['projects/ui-smartcontact/src/lib/components'], tipo: 'espaciado', max: 38 },
  {
    nombre: 'Supervisor · tipografía',
    dirs: ['projects/supervisor/src/app', 'projects/supervisor/src/styles'],
    tipo: 'tipografia',
    max: 50,
  },
  {
    nombre: 'Supervisor · espaciado',
    dirs: ['projects/supervisor/src/app', 'projects/supervisor/src/styles'],
    tipo: 'espaciado',
    max: 44,
  },
];

const sinComentarios = (scss) => scss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const TIPOGRAFIA = /(?:^|[;{\s])(font-size|line-height|letter-spacing|font-weight)\s*:\s*([^;{}]+)/g;
const ESPACIADO =
  /(?:^|[;{\s])((?:padding|margin|gap|row-gap|column-gap)(?:-(?:block|inline|top|bottom|left|right)(?:-(?:start|end))?)?)\s*:\s*([^;{}]+)/g;

/** Un valor tipográfico que ya sale de una variable o no fija nada. */
const tipografiaAtada = (valor) => /^(var\(|calc\(var\(|inherit|normal|initial|unset|revert|1lh$|0$|#\{)/.test(valor.trim());

/** Un espaciado con algún px, rem o em escrito a mano, fuera de las `var(...)`. */
const espaciadoSuelto = (valor) => /(^|[\s(,*+/-])\d*\.?\d+(px|rem|em)\b/.test(valor.replace(/var\([^)]*\)/g, ''));

/** Las declaraciones de una hoja que ponen un número donde va una variable. */
export function literalesDe(scss, tipo) {
  const css = sinComentarios(scss);
  const patron = tipo === 'tipografia' ? TIPOGRAFIA : ESPACIADO;
  const suelto = tipo === 'tipografia' ? (v) => !tipografiaAtada(v) : espaciadoSuelto;
  const fuera = [];
  for (const m of css.matchAll(patron)) {
    if (suelto(m[2])) fuera.push(`${m[1]}: ${m[2].trim()}`);
  }
  return fuera;
}

/** El veredicto del trinquete como texto, o null si la zona está exactamente en su tope. */
export function exceso(zona, n) {
  if (n > zona.max) {
    return `${zona.nombre}: ${n} declaraciones con un número a mano y el tope es ${zona.max}. ` +
      'Usa la variable (`var(--sc-*)`; dentro de un componente de PrimeNG, su token del preset).';
  }
  if (n < zona.max) {
    return `${zona.nombre}: ${n} declaraciones y el tope sigue en ${zona.max}. Baja su \`max\` a ${n} ` +
      'en scripts/audit-css-literals.mjs (un tope holgado deja volver lo que ya salió).';
  }
  return null;
}

const hojasDe = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return hojasDe(full);
    return /\.s?css$/.test(e.name) ? [full] : [];
  });

if (import.meta.url === `file://${process.argv[1]}`) {
  log('');
  log('LITERALES · tipografía y espaciado con su variable, no con un número');
  log('='.repeat(62));
  const fallos = [];
  const nuevos = [];
  for (const zona of ZONAS) {
    const hojas = zona.dirs.flatMap((d) => hojasDe(resolve(root, d))).sort();
    let n = 0;
    for (const hoja of hojas) {
      const casos = literalesDe(readFileSync(hoja, 'utf8'), zona.tipo);
      n += casos.length;
      for (const c of casos) nuevos.push(`${zona.nombre}  ${relative(root, hoja)}  ${c}`);
    }
    log(`  ${zona.nombre}: ${n} · tope ${zona.max}  (${hojas.length} hojas)`);
    const veredicto = exceso(zona, n);
    if (veredicto) fallos.push({ zona, veredicto });
  }
  log('='.repeat(62));
  if (fallos.length) {
    log('');
    for (const f of fallos) log(`  ✘ ${f.veredicto}`);
    if (fallos.some((f) => f.veredicto.includes('el tope es'))) {
      log('');
      log('  Todas las de las zonas que pasan su tope (la nueva está entre ellas):');
      for (const l of nuevos.filter((l) => fallos.some((f) => l.startsWith(f.zona.nombre)))) log(`    ${l}`);
    }
    process.exit(1);
  }
  log('');
  log('✔ Ninguna zona gana tipografía ni espaciados escritos a mano.');
}
