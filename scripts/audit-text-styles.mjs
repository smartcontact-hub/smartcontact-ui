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
 * Qué afirma: (1) cada clase resuelve al font-size, line-height, peso y familia
 * del text style del que dice ser; (2) ninguna `.sc-text-*` va encima de un
 * `<sc-*>`; y desde el 2026-09-11 también (3) que **el CSS de las pantallas no
 * declare tipografía fuera de los 12 roles**. No opina sobre QUÉ debería medir un
 * rol: eso lo decide Figma.
 *
 * La tercera nació de medir: 76 reglas del Supervisor usaban `font-weight: medium`
 * (500), que NO es el peso de ninguno de los 12 estilos —solo existen 400 y 600—, y
 * otras tantas ponían tamaños (16, 32) que tampoco son peldaño de ningún rol. Nada
 * lo cruzaba: este gate comprobaba que las clases VALEN lo que Figma, y el de
 * vocabulario que un nombre no viva en dos hojas, pero un valor suelto en la hoja de
 * UNA pantalla no le tocaba a ninguno.
 *
 * ⚠️ LO QUE ESTA PARTE NO PUEDE VER, y por eso no sustituye al e2e: mira lo que se
 * DECLARA, no lo que GANA. `.impact__hero` declara 32 y su variante `--rail` lo baja
 * a 20, así que el número que se renderiza no sale de aquí. Lo rendido lo mide
 * `e2e/supervisor/text-styles-applied.spec.ts`, en el navegador.
 *
 * La tabla de abajo es la ÚNICA parte que se escribe a mano, porque los text
 * styles no viajan en el export DTCG (que solo lleva primitivas). Se leyó en
 * vivo del archivo "Smart-Contact Design System" el 2026-09-09, con sus
 * `boundVariables`, que es lo que la hace comprobable: cada estilo declara de
 * qué variable cuelga, y esa variable es la misma que nombra el token de rol.
 *
 * Lee el FUENTE, no un `dist/`.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { aplanar } from './audit-screen-vocabulary.mjs';

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

/*
 * §3 · Y NO SE LE PONEN A UN COMPONENTE DEL DS.
 *
 * La regla, de Rafa el 2026-09-09: los estilos de texto se aplican a lo que NO es un
 * componente. Un `<sc-*>` publica su tipografía por el preset de PrimeNG, en su capa; una
 * clase `.sc-text-*` encima del propio elemento la pisa desde fuera de esa capa y lo
 * desconecta del tema — que es justo lo que hace que mover un token llegue solo a todos los
 * componentes. Es la misma doctrina que la Sección E de `audit:primeng-coupling`, por la otra
 * puerta: aquélla vigila que no te metas DENTRO, ésta que no le pintes ENCIMA.
 *
 * Se ve tal cual en la maqueta que originó todo esto (Supervisor 393:12562): de sus 43 textos,
 * los 25 de página llevan text style anclado y los 18 que viven dentro de un componente
 * (breadcrumb, botones, checkbox, badge) no llevan ninguno.
 *
 * Qué afirma, y nada más: ningún elemento `<sc-*>` lleva una clase `.sc-text-*` en SU propia
 * etiqueta. El contenido PROYECTADO dentro de uno sí puede —`<sc-dialog><p class="sc-text-…">`
 * es texto de la app, no del componente— y por eso la comprobación mira la etiqueta de apertura,
 * no el subárbol.
 */
const PLANTILLAS = ['projects/supervisor/src', 'projects/sc-docs/src'];

/** `[{ linea, tag, clase }]` de cada `<sc-*>` que se pinta una clase de texto encima. */
export function encimaDeComponente(html) {
  const out = [];
  // Una etiqueta de apertura puede ocupar varias líneas, así que se busca sobre el texto
  // entero (hasta el `>`) y el número de línea sale contando saltos hasta la coincidencia.
  const texto = html;
  for (const m of texto.matchAll(/<(sc-[a-z0-9-]+)\b([^>]*)>/gi)) {
    const clases = m[2].match(/\bclass\s*=\s*["']([^"']*)["']/i);
    if (!clases) continue;
    const culpables = clases[1].split(/\s+/).filter((c) => /^sc-text-/.test(c));
    if (!culpables.length) continue;
    const linea = texto.slice(0, m.index).split('\n').length;
    out.push({ linea, tag: m[1], clase: culpables.join(' ') });
  }
  return out;
}

/* ── 3 · el CSS de pantalla no declara tipografía fuera de los 12 roles ─────── */

/**
 * Los seis peldaños de tamaño con su interlineado, y los DOS únicos pesos. Sale de
 * `FIGMA_TEXT_STYLES` de arriba, no de una copia: si un estilo cambia en Figma, esto
 * cambia con él.
 */
export const ROLES = new Map(FIGMA_TEXT_STYLES.map((e) => [e.size, e.lh]));
export const PESOS_VALIDOS = new Set(FIGMA_TEXT_STYLES.map((e) => e.weight));

/**
 * Lo que declara tipografía a propósito fuera de los roles, con su motivo. Igual que
 * el trinquete de `audit:screen-vocabulary`: sin motivo escrito no entra nadie, y una
 * entrada que ya no corresponde a nada también es roja.
 *
 * NO entran aquí los `font-size` que dimensionan un ICONO (`.vpick__caret`,
 * `.vpick__check`, …): ahí el tamaño es una caja de glifo, no un estilo de texto, y
 * marcarlos convertía el gate en ruido — la primera pasada dio 3 de 9 así.
 */
export const TIPOGRAFIA_DELIBERADA = {
  '.impact__hero':
    'Número héroe de la tarjeta de impacto. Su tamaño sale del Figma de Memory y está ' +
    'medido en pantalla: 32 es el tope real de la rampa (el Figma pide 40, que exigiría ' +
    'un token display nuevo) y la variante `--rail` lo baja a 20 porque a 32 la palabra ' +
    '«conversaciones» se parte. Motivo escrito al lado de la regla.',
  '.impact__label':
    'Rótulo de la misma tarjeta, a 16 «como el Figma» (motivo escrito al lado). 16 no es ' +
    'peldaño de ningún rol; el resto de la tarjeta cuelga de él.',
};

/** Un `font-size` que dimensiona un glifo, no texto. Se reconoce por el nombre. */
export const esCajaDeIcono = (selector) =>
  /(caret|chevron|check|icon|arrow|spark|dot|glyph)$/i.test(selector.replace(/^\./, ''));

/**
 * Chips, pastillas, badges y contadores: muebles de interlineado APRETADO. Heredan un
 * `line-height: 1` de su contenedor a propósito —su altura la manda el padding, no el
 * interlineado— y ponerles el del rol los haría crecer 6px. Medido en el navegador el
 * 2026-09-11, no supuesto: en una pantalla de lista había 25 textos a 14/14 y 17 a 12/12,
 * todos de esta familia.
 */
export const esInterlineadoApretado = (selector) =>
  /(pill|chip|badge|tag|dot|num|count|handle|kbd|shortcut|flag)$/i.test(selector.replace(/^\./, ''));

/* Tablas de resolución: token → px. Se leen de los layers, no se copian. */
function tablaTokens(prefijo) {
  const capas = ['01-primitive.css', '02-semantic.css']
    .map((f) => readFileSync(resolve(LAYERS, f), 'utf8'))
    .join('\n');
  const crudo = declaraciones(capas);
  const tabla = {};
  for (const [nombre] of crudo) {
    if (!nombre.startsWith(prefijo)) continue;
    /* `resolver` espera un VALOR (`var(--x)`), no el nombre pelado: pasándole el nombre
     * devolvía el propio nombre, `aPx` daba null, la tabla salía VACÍA y el gate no
     * miraba nada mientras decía «0 fuera de rol». Lo cazó que la sonda independiente
     * contaba 8 (LEARNINGS #2: cierra con una observación que no dependa de tu inventario). */
    const r = resolver(`var(${nombre})`, crudo);
    const px = aPx(r?.valor ?? '');
    if (px !== null) tabla[nombre] = px;
  }
  return tabla;
}

/* `aPx` ya vive arriba (línea ~109) y hace exactamente esto: se reutiliza. */

/** Las declaraciones de tipografía de una hoja, ya resueltas a px. */
export function tipografiaDe(scss, { size, lh, peso }) {
  const fuera = [];
  const lee = (valor, tabla) => {
    if (!valor) return null;
    const m = valor.match(/var\((--[a-z0-9-]+)/i);
    if (m) return tabla[m[1]] ?? null;
    return aPx(valor);
  };
  for (const [selector, props] of aplanar(scss)) {
    if (!props['font-size'] && !props['font-weight']) continue;
    const s = lee(props['font-size'], size);
    const l = lee(props['line-height'], lh);
    const w = lee(props['font-weight'], peso);
    const fallos = [];
    if (w !== null && !PESOS_VALIDOS.has(w)) fallos.push(`peso ${w} (los estilos solo usan ${[...PESOS_VALIDOS].join(' y ')})`);
    if (s !== null && !ROLES.has(s) && !esCajaDeIcono(selector)) fallos.push(`tamaño ${s} no es peldaño de ningún rol`);
    /* Un tamaño SIN interlineado deja que lo ponga el contexto, así que el texto no mide lo
     * que dice su rol: 14 heredando 1.5 son 21, y el rol lleva 20. Medido en pantalla antes
     * de tocar nada: 212 reglas así. Se exceptúan los glifos y los muebles apretados. */
    if (s !== null && ROLES.has(s) && !props['line-height'] && !esCajaDeIcono(selector) && !esInterlineadoApretado(selector))
      fallos.push(`declara tamaño ${s} y NO su interlineado (el rol lleva ${ROLES.get(s)})`);
    /* Un `line-height` SIN UNIDAD (1.4, 1.5…) es un multiplicador, no un número de px, y
     * además está APARCADO con razón en `NEXT-SESSION.md` («sin token destino en el Kit»):
     * el Kit no exporta un peldaño sin unidad al que apuntar, así que convertirlos es un
     * trabajo que todavía no tiene destino. Marcarlos aquí sería pedir algo que el sistema
     * no puede dar — y un guardián que pide imposibles enseña a ignorarlo. */
    const lhSinUnidad = /^[\d.]+$/.test((props['line-height'] ?? '').trim());
    if (s !== null && l !== null && !lhSinUnidad && ROLES.has(s) && ROLES.get(s) !== l)
      fallos.push(`${s}/${l} — el rol de ${s} lleva ${ROLES.get(s)}`);
    if (fallos.length) fuera.push({ selector, fallos });
  }
  return fuera;
}

const ficheros = [];
{
  const { readdirSync } = await import('node:fs');
  const anda = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, e.name);
      if (e.isDirectory()) anda(full);
      else if (e.name.endsWith('.html')) ficheros.push(full);
    }
  };
  for (const base of PLANTILLAS) anda(resolve(root, base));
}

log('');
log('CAPA · ninguna clase de texto encima de un componente del DS');
log('='.repeat(62));
const encima = [];
for (const f of ficheros) {
  for (const hit of encimaDeComponente(readFileSync(f, 'utf8'))) {
    encima.push({ fichero: f.replace(root + '/', ''), ...hit });
  }
}
log(`  ${ficheros.length} plantillas revisadas · ${encima.length} caso(s)`);
log('='.repeat(62));

if (encima.length) {
  log('');
  log('✘ Un componente del DS con una clase de texto encima deja de leer el tema.');
  for (const e of encima) log(`    ${e.fichero}:${e.linea} — <${e.tag} class="… ${e.clase}">`);
  log('');
  log('  Si el texto del componente tiene que verse distinto, se mueve su TOKEN;');
  log('  si el que necesita la clase es texto tuyo, sácalo del componente.');
  process.exit(1);
}

log('');
log('✔ Ningún `<sc-*>` lleva `.sc-text-*` en su propia etiqueta.');

log('');
log('ROLES · el CSS de pantalla no declara tipografía fuera de los 12 estilos');
log('='.repeat(62));
{
  const size = tablaTokens('--sc-font-size-');
  const lh = tablaTokens('--sc-line-height-');
  const peso = tablaTokens('--sc-font-weight-');
  const hojas = execSync(
    "find projects/supervisor/src/app projects/supervisor/src/styles -name '*.scss'",
    { encoding: 'utf8', cwd: root },
  ).split('\n').filter(Boolean).sort();

  const fuera = [];
  const vistos = new Set();
  for (const hoja of hojas) {
    for (const caso of tipografiaDe(readFileSync(resolve(root, hoja), 'utf8'), { size, lh, peso })) {
      if (caso.selector in TIPOGRAFIA_DELIBERADA) { vistos.add(caso.selector); continue; }
      fuera.push({ hoja, ...caso });
    }
  }
  const muertas = Object.keys(TIPOGRAFIA_DELIBERADA).filter((s) => !vistos.has(s));

  log(`  ${hojas.length} hoja(s) · ${fuera.length} fuera de rol · ` +
      `${Object.keys(TIPOGRAFIA_DELIBERADA).length} deliberada(s) con su motivo`);
  log('='.repeat(62));

  if (fuera.length || muertas.length) {
    log('');
    for (const f of fuera) {
      log(`  ✘ ${f.hoja}`);
      log(`      ${f.selector} — ${f.fallos.join(' · ')}`);
    }
    for (const m of muertas) {
      log(`  ✘ TIPOGRAFIA_DELIBERADA cita \`${m}\` pero ya no declara nada fuera de rol.`);
      log('      → quita su entrada; una excepción caducada miente sobre lo que falta.');
    }
    log('');
    log('  Los 12 estilos son seis tamaños × dos pesos (400 y 600). Un 500 o un 16 no');
    log('  son «casi»: no existen. Usa el rol que toque, o declara la divergencia en');
    log('  TIPOGRAFIA_DELIBERADA con su motivo (DD-36 aplicado aquí).');
    process.exit(1);
  }
}

log('');
log('✔ Ninguna pantalla declara tipografía fuera de los 12 roles.');

/*
 * §4 · Y LA TIPOGRAFÍA SE PONE POR SU NOMBRE, NO POR SUS NÚMEROS.
 *
 * Una regla de pantalla con `font-size: var(--sc-font-size-200)` puede valer exactamente lo que
 * `Body/body-regular` y aun así no DECIR que lo es: en Inspect se leen tres números y alguien
 * tiene que traducirlos. La clase `.sc-text-body-regular` es el enlace con el text style de
 * Figma —el nombre viaja hasta el DOM— y por eso es la forma canónica; los tokens sueltos en la
 * hoja son el paso previo, no el destino.
 *
 * Medido el 2026-09-11 antes de migrar: 301 reglas del Supervisor declaraban tipografía por
 * token y 49 textos llevaban la clase. Tras la migración (165 reglas → 226 elementos con clase,
 * medida en el navegador antes y después: 3.664 textos en 38 rutas + 813 en modales, CERO
 * cambios de tamaño, interlineado, peso, familia, márgenes ni posición) quedaron 116.
 *
 * SEGUNDA PASADA, el 2026-09-11 por la tarde: 15 reglas menos (116 → 101) — 14 migradas y una
 * MUERTA (`.hub__title`, que ninguna plantilla usaba: el título del hub es `page__heading`) —,
 * las que la primera
 * dejó fuera por no estar en su inventario y no por tener motivo. Son las CELDAS de las nueve
 * listas de repositorio, grupos y usuarios (306 textos), el TÍTULO DE PÁGINA de las 13 pantallas
 * —que DD-55 dejó nombrado como pendiente—, la barra lateral de Configuración, la cabecera de
 * grupos asignados, el chip de tipo de entidad, la pista de Sistema, el modal de descarga y el
 * selector de conjunto de datos. Medida igual: 4.517 mediciones sobre 56 estados de pantalla (las
 * 38 rutas, 2.503 textos sin repetir, más 18 estados abiertos: modales, paneles, popovers,
 * fichas), CERO diferencias; 341 textos que llevan ahora la clase en su propio elemento y miden
 * ese estilo.
 *
 * Lo que queda NO es un resto por barrer: son las que la clase NO puede sustituir, de cuatro
 * familias con su motivo:
 *   · muebles de interlineado APRETADO (chips, pastillas, contadores): 12/12 y 14/14 no son
 *     ningún text style;
 *   · texto con FAMILIA propia (celdas mono): la clase impone Inter;
 *   · reglas con `font:` shorthand o modificadores que solo cambian el peso (`--active`), que
 *     pisan o complementan a la clase desde la hoja;
 *   · interlineados SIN UNIDAD (aparcados, sin token destino en el Kit).
 *
 * TRINQUETE por conteo: el número de reglas que aún declaran `font-size` solo puede bajar. Si
 * baja, el tope se baja con él (un tope holgado deja entrar de nuevo lo que ya salió).
 */
export const TIPOGRAFIA_SUELTA_MAX = 100;

/** Cuántas reglas de una hoja declaran `font-size` (tipografía por token, no por clase). */
export function tipografiaSuelta(scss) {
  let n = 0;
  for (const [, props] of aplanar(scss)) if (props['font-size']) n += 1;
  return n;
}

/** El veredicto del trinquete como texto, o null si el conteo está exactamente en su tope. */
export function excesoSuelto(n, max) {
  if (n > max) {
    return `${n} reglas declaran \`font-size\` en la hoja y el tope es ${max}: la tipografía de ` +
      'pantalla se pone con la clase `.sc-text-*` en la plantilla, no con tokens sueltos.';
  }
  if (n < max) {
    return `${n} reglas declaran \`font-size\` y el tope sigue en ${max}: baja TIPOGRAFIA_SUELTA_MAX ` +
      `a ${n} en scripts/audit-text-styles.mjs (un tope holgado deja volver lo que ya salió).`;
  }
  return null;
}

log('');
log('CLASE · la tipografía de pantalla se pone por su nombre (`.sc-text-*`), no por tokens sueltos');
log('='.repeat(62));
{
  const hojas = execSync(
    "find projects/supervisor/src/app projects/supervisor/src/styles -name '*.scss'",
    { encoding: 'utf8', cwd: root },
  ).split('\n').filter(Boolean).sort();
  let sueltas = 0;
  for (const hoja of hojas) sueltas += tipografiaSuelta(readFileSync(resolve(root, hoja), 'utf8'));
  log(`  ${hojas.length} hoja(s) · ${sueltas} regla(s) con \`font-size\` · tope ${TIPOGRAFIA_SUELTA_MAX}`);
  log('='.repeat(62));
  const veredicto = excesoSuelto(sueltas, TIPOGRAFIA_SUELTA_MAX);
  if (veredicto) {
    log('');
    log(`  ✘ ${veredicto}`);
    process.exit(1);
  }
}

log('');
log('✔ La tipografía suelta no crece: el trinquete está en su tope.');
