/*
 * GUARDIÁN · las 12 clases `.sc-text-*` valen lo que valen sus text styles en Figma.
 * =================================================================================
 *
 * Por qué existe. `base/typography.css` empaqueta los 12 text styles del Figma
 * del DS en una clase cada uno, y a propósito NO fija ningún número: cada clase
 * bebe de un token de rol (`--sc-font-size-h2`), que a su vez cuelga de un
 * peldaño primitivo (`--sc-font-size-500`), que es lo único que `tokens:type-parity`
 * compara contra el export del Kit.
 *
 * Esa cadena tiene TRES eslabones y hasta hoy solo se vigilaba el último. Nadie
 * comprobaba el TRAMO DE EN MEDIO: si alguien cambia `--sc-line-height-h3` de
 * `300` a `400`, los peldaños siguen casando con el export, el gate de paridad
 * sigue verde, y sin embargo `.sc-text-h3-*` ha dejado de valer lo que vale
 * `Heading/h3-*` en Figma. Este guardián cierra ese hueco: resuelve la cadena
 * ENTERA, de la clase al píxel, y la compara con lo que el Figma publica.
 *
 * De hecho ya había una desviación de ese tipo cuando se escribió: el rol
 * `body-2` colgaba de `--sc-line-height-220`, un peldaño que NO existe en el
 * export, mientras Figma ata `Body/body-*` a `line/height/200`. Coincidían en
 * valor (20px), así que era invisible para todo lo demás.
 *
 * Qué afirma, y nada más: cada clase resuelve al font-size, line-height, peso y
 * familia del text style del que dice ser. No opina sobre QUÉ debería medir un
 * rol (eso lo decide Figma) ni sobre dónde se usan las clases.
 *
 * La tabla de abajo es la ÚNICA parte que se escribe a mano, porque los text
 * styles no viajan en el export DTCG (que solo lleva primitivas). Se leyó en
 * vivo del archivo "Smart-Contact Design System" el 2026-09-09, con sus
 * `boundVariables`, que es lo que la hace comprobable: cada estilo declara de
 * qué variable cuelga, y esa variable es la misma que nombra el token de rol.
 *
 * Lee el FUENTE, no un `dist/`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const STYLES = resolve(root, 'projects/design-tokens/src/lib/styles');
const TYPOGRAPHY = resolve(STYLES, 'base/typography.css');
const LAYERS = resolve(STYLES, 'tokens/layers');
const log = (s = '') => process.stdout.write(s + '\n');

/*
 * Los 12 text styles del Figma del DS. `bind` es la variable de Figma a la que
 * el estilo ata cada eje: sirve de rastro para el humano que audite esto contra
 * el archivo, y es lo que explica por qué h3 lleva line/height/300 y no 400.
 */
export const FIGMA_TEXT_STYLES = [
  { estilo: 'Display/display-regular',  clase: 'sc-text-display-regular',  size: 64, lh: 78, weight: 400, bind: 'size/900 · lh/900' },
  { estilo: 'Display/display-semibold', clase: 'sc-text-display-semibold', size: 64, lh: 78, weight: 600, bind: 'size/900 · lh/900' },
  { estilo: 'Heading/h1-regular',       clase: 'sc-text-h1-regular',       size: 48, lh: 58, weight: 400, bind: 'size/800 · lh/800' },
  { estilo: 'Heading/h1-semibold',      clase: 'sc-text-h1-semibold',      size: 48, lh: 58, weight: 600, bind: 'size/800 · lh/800' },
  { estilo: 'Heading/h2-regular',       clase: 'sc-text-h2-regular',       size: 24, lh: 36, weight: 400, bind: 'size/500 · lh/500' },
  { estilo: 'Heading/h2-semibold',      clase: 'sc-text-h2-semibold',      size: 24, lh: 36, weight: 600, bind: 'size/500 · lh/500' },
  { estilo: 'Heading/h3-regular',       clase: 'sc-text-h3-regular',       size: 18, lh: 24, weight: 400, bind: 'size/400 · lh/300' },
  { estilo: 'Heading/h3-semibold',      clase: 'sc-text-h3-semibold',      size: 18, lh: 24, weight: 600, bind: 'size/400 · lh/300' },
  { estilo: 'Body/body-regular',        clase: 'sc-text-body-regular',     size: 14, lh: 20, weight: 400, bind: 'size/200 · lh/200' },
  { estilo: 'Body/body-semibold',       clase: 'sc-text-body-semibold',    size: 14, lh: 20, weight: 600, bind: 'size/200 · lh/200' },
  { estilo: 'Caption/caption-regular',  clase: 'sc-text-caption-regular',  size: 12, lh: 18, weight: 400, bind: 'size/100 · lh/100' },
  { estilo: 'Caption/caption-semibold', clase: 'sc-text-caption-semibold', size: 12, lh: 18, weight: 600, bind: 'size/100 · lh/100' },
];

/** Todas las custom properties declaradas en un CSS, sin resolver. Última gana. */
function declaraciones(css) {
  const mapa = new Map();
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;{}]+);/gi)) mapa.set(m[1], m[2].trim());
  return mapa;
}

/**
 * `var(--x)` → sigue la cadena hasta un valor literal. Devuelve `{ valor, cadena }`
 * para poder ENSEÑAR por dónde pasó (un guardián que solo dice "no cuadra" obliga
 * a repetir su trabajo a mano).
 */
export function resolver(valor, vars, vistos = new Set()) {
  const cadena = [];
  let v = valor;
  while (true) {
    const m = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(v.trim());
    if (!m) return { valor: v.trim(), cadena };
    const nombre = m[1];
    if (vistos.has(nombre)) return { valor: null, cadena, ciclo: nombre };
    vistos.add(nombre);
    cadena.push(nombre);
    if (!vars.has(nombre)) return { valor: null, cadena, falta: nombre };
    v = vars.get(nombre);
  }
}

/** `calc(N / 16 * 1rem)` · `Nrem` · `Npx` · número crudo → px. Si no, null. */
export function aPx(valor) {
  if (valor == null) return null;
  const v = valor.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  let m = /^calc\(\s*([\d.]+)\s*\/\s*16\s*\*\s*1rem\s*\)$/i.exec(v);
  if (m) return Number(m[1]);
  m = /^([\d.]+)rem$/i.exec(v);
  if (m) return Number(m[1]) * 16;
  m = /^([\d.]+)px$/i.exec(v);
  if (m) return Number(m[1]);
  m = /^([\d.]+)$/.exec(v);
  if (m) return Number(m[1]);
  return null;
}

/**
 * Las declaraciones que le aplican a UNA clase en typography.css, en orden de
 * aparición (los bloques agrupan varias clases, así que hay que recorrerlos
 * todos y quedarse con los que la nombran; la última gana, como en la cascada).
 */
export function declaracionesDeClase(css, clase) {
  const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const props = new Map();
  for (const bloque of sinComentarios.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectores = bloque[1].split(',').map((s) => s.trim());
    if (!selectores.includes('.' + clase)) continue;
    for (const d of bloque[2].matchAll(/([a-z-]+)\s*:\s*([^;]+);/gi)) props.set(d[1].trim(), d[2].trim());
  }
  return props;
}

const typography = readFileSync(TYPOGRAPHY, 'utf8');
const vars = new Map([
  ...declaraciones(readFileSync(resolve(LAYERS, '01-primitive.css'), 'utf8')),
  ...declaraciones(readFileSync(resolve(LAYERS, '02-semantic.css'), 'utf8')),
]);

const fallos = [];
log('TEXT STYLES · las 12 clases `.sc-text-*` ↔ los 12 text styles del Figma del DS');
log('='.repeat(78));
log('  clase                       esperado(Figma)   resuelto(código)   cadena');
log('-'.repeat(78));

for (const ts of FIGMA_TEXT_STYLES) {
  const props = declaracionesDeClase(typography, ts.clase);
  if (props.size === 0) {
    fallos.push({ ...ts, motivo: 'la clase no existe en base/typography.css' });
    log(`  ✘ ${ts.clase.padEnd(26)} ${`${ts.size}/${ts.lh}/${ts.weight}`.padEnd(17)} —  (clase ausente)`);
    continue;
  }
  const ejes = {
    size: resolver(props.get('font-size') ?? '', vars),
    lh: resolver(props.get('line-height') ?? '', vars),
    weight: resolver(props.get('font-weight') ?? '', vars),
  };
  const got = {
    size: aPx(ejes.size.valor),
    lh: aPx(ejes.lh.valor),
    weight: aPx(ejes.weight.valor),
  };
  const familia = resolver(props.get('font-family') ?? '', vars).valor ?? '';
  const okFamilia = /(^|[\s'"])Inter([\s'",]|$)/.test(familia);
  const ok = got.size === ts.size && got.lh === ts.lh && got.weight === ts.weight && okFamilia;
  const cadena = [ejes.size.cadena.at(-1), ejes.lh.cadena.at(-1)].filter(Boolean).join(' · ');
  log(
    `  ${ok ? '✔' : '✘'} ${ts.clase.padEnd(26)} ${`${ts.size}/${ts.lh}/${ts.weight}`.padEnd(17)} ` +
      `${`${got.size ?? '?'}/${got.lh ?? '?'}/${got.weight ?? '?'}`.padEnd(18)} ${cadena}`,
  );
  if (!ok) {
    fallos.push({
      ...ts,
      motivo: !okFamilia
        ? `la familia resuelve a "${familia}" y el text style es Inter`
        : `resuelve a ${got.size}/${got.lh}/${got.weight} (Figma: ${ts.size}/${ts.lh}/${ts.weight})`,
      cadenaSize: ejes.size.cadena.join(' → '),
      cadenaLh: ejes.lh.cadena.join(' → '),
    });
  }
}
log('='.repeat(78));

if (fallos.length) {
  log('');
  log(`✘ ${fallos.length} clase(s) ya no valen lo que su text style de Figma.`);
  for (const f of fallos) {
    log('');
    log(`  ${f.clase}  (${f.estilo}, ata ${f.bind})`);
    log(`    ${f.motivo}`);
    if (f.cadenaSize) log(`    font-size:   ${f.cadenaSize}`);
    if (f.cadenaLh) log(`    line-height: ${f.cadenaLh}`);
  }
  log('');
  log('  El arreglo va en el ROL (02-semantic.css), no en la clase: las clases no');
  log('  fijan números a propósito. Si lo que cambió es Figma, mueve el rol y');
  log('  actualiza la tabla FIGMA_TEXT_STYLES de este guardián, en ese orden.');
  process.exit(1);
}

log('');
log(`✔ Las ${FIGMA_TEXT_STYLES.length} clases resuelven a su text style de Figma.`);

/*
 * §2 · Y LLEGAN A LA APP.
 *
 * Una clase correcta que el navegador nunca ve no existe. Es lo que pasaba: las
 * 12 estaban bien escritas y bien importadas en el `index.css` del paquete, pero
 * el supervisor no consume ese index —coge las 6 capas de tokens una a una, para
 * no heredar el reset del DS—, así que `class="sc-text-body-regular"` no pintaba
 * nada y el `<th>` se quedaba en el 16/24/700 por defecto del navegador. Nada
 * enrojecía: el CSS era correcto, simplemente no estaba.
 *
 * CONSUMIDORAS son las apps construidas SOBRE el DS. `agent`, `cuscare` y
 * `agent-mini` quedan fuera a propósito (DD-35: son réplicas medidas de apps de
 * terceros y no se tokenizan), aunque alguna importe capas de tokens sueltas.
 */
const CONSUMIDORAS = [
  { app: 'supervisor', scss: 'projects/supervisor/src/styles/main.scss' },
  { app: 'sc-docs', scss: 'projects/sc-docs/src/styles.scss' },
];

/**
 * ¿Ese SCSS trae las clases, sea por `base/typography.css` o por el `index.css`
 * del paquete que lo incluye?
 *
 * La ruta tiene que ser la de DESIGN-TOKENS, no cualquier `styles/index.css`:
 * el supervisor también importa `ui-smartcontact-icons/src/lib/styles/index.css`,
 * y una regex que solo mirase el final del camino daba verde con el import de
 * tipografía quitado. Cazado al probar este guardián con el fallo puesto.
 */
export function importaTypography(scss) {
  const sinComentarios = scss.replace(/\/\*[\s\S]*?\*\//g, '');
  const imports = [...sinComentarios.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const deTokens = imports.filter((r) => r.includes('design-tokens/src/lib/styles/'));
  const directo = deTokens.some((r) => r.endsWith('base/typography.css'));
  const porIndex = deTokens.some((r) => r.endsWith('/styles/index.css'));
  return {
    ok: directo || porIndex,
    via: directo ? 'base/typography.css' : porIndex ? 'design-tokens .../styles/index.css' : null,
  };
}

log('');
log('LLEGADA · las apps que consumen el DS cargan las clases');
log('='.repeat(62));
const sinClases = [];
for (const { app, scss } of CONSUMIDORAS) {
  const v = importaTypography(readFileSync(resolve(root, scss), 'utf8'));
  log(`  ${v.ok ? '✔' : '✘'} ${app.padEnd(12)} ${v.via ?? 'no importa las clases'}`);
  if (!v.ok) sinClases.push({ app, scss });
}
log('='.repeat(62));

if (sinClases.length) {
  log('');
  log(`✘ ${sinClases.length} app(s) no cargan \`.sc-text-*\`: las clases no harán nada allí.`);
  for (const { app, scss } of sinClases) {
    log(`    ${app}: añade a ${scss}, DETRÁS de las capas de tokens,`);
    log(`      @import '<ruta>/design-tokens/src/lib/styles/base/typography.css';`);
  }
  process.exit(1);
}

log('');
log(`✔ Las ${CONSUMIDORAS.length} apps consumidoras cargan las clases.`);
