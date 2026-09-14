#!/usr/bin/env node
/**
 * El export del plugin de Figma (Theme Designer) para el equipo externo, comprobado por una máquina.
 *
 * Por qué (2026-09-14, DD-88): la licencia comercial es del plugin, así que el equipo externo sigue
 * recibiendo SU export (Rafa: «para ahorrarme problemas políticos»), además del tema de nuestras apps
 * (`tema-zip.mjs`). Hasta hoy ese zip se descargaba, se comprobaba y se enviaba a mano. Ahora el robot
 * de tokens lo coge del push del plugin (`.theme-designer/`), le pasa las comprobaciones de la rutina y
 * lo publica junto al nuestro, diciendo en llano cuánto se aparta de lo que pintan nuestras apps.
 *
 * Qué comprueba (el manifiesto lo cuenta; solo el punto 1 pone rojo):
 *   1. ningún token que tenía valor pasa a 0 (respecto al zip anterior y respecto a nuestro tema);
 *   2. la raíz para la que está pensado: el plugin escribe los rem por el nombre del paso de escala
 *      (`{scale.1-125}` → `1.125rem`), que a raíz 16 pinta un 14 % más grande que el Kit;
 *   3. pesos de letra escritos con «px», que el navegador descarta;
 *   4. qué cambia respecto al zip anterior, y cuántas variables se apartan de nuestro tema.
 *
 * Uso: node scripts/tema-plugin-zip.mjs <carpeta .theme-designer> <salida> [--anterior <carpeta>]
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.SC_ROOT ? resolve(process.env.SC_ROOT) : resolve(import.meta.dirname, '..');
const LAYERS = ['01-primitive', '02-semantic', '03-palette', '04-component', '05-extensions', '07-dark'];
const OPCIONES = { prefix: 'p', darkModeSelector: '.sc-dark' };

/** Declaraciones `--x` de un CSS por ámbito (claro / oscuro por la regla que las contiene). */
export function declaraciones(css) {
  const out = new Map();
  const text = String(css ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const ambito = /\.sc-dark/.test(m[1]) ? 'oscuro' : 'claro';
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.set(`${ambito}|${d[1]}`, d[2].trim());
  }
  return out;
}

/** Valor final de una variable: sigue `var()` en su ámbito (el oscuro cae al claro), rem a px a raíz 16. */
export function resolver(mapa, clave) {
  const [ambito, nombre] = clave.split('|');
  const buscar = (n) => mapa.get(`${ambito}|${n}`) ?? mapa.get(`claro|${n}`);
  const vistos = new Set();
  const expandir = (v) => String(v).replace(/var\((--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_, n, fallback) => {
    if (vistos.has(n)) return 'ciclo';
    vistos.add(n);
    const d = buscar(n);
    return d === undefined ? (fallback ?? 'sin-definir') : expandir(d);
  });
  return normalizar(elegirTema(expandir(buscar(nombre) ?? ''), ambito));
}

/**
 * `light-dark(a, b)` → el de su tema, también anidado. Aura y el plugin lo escriben así en la raíz y
 * nuestro tema con bloques por esquema: sin esto, «blanco» contra `light-dark(blanco, …)` salía distinto.
 */
export function elegirTema(valor, ambito) {
  let v = String(valor);
  for (let guard = 0; guard < 20; guard++) {
    const i = v.indexOf('light-dark(');
    if (i === -1) break;
    let depth = 0;
    let coma = -1;
    let fin = -1;
    for (let j = i + 'light-dark'.length; j < v.length; j++) {
      if (v[j] === '(') depth++;
      else if (v[j] === ')') { depth--; if (depth === 0) { fin = j; break; } }
      else if (v[j] === ',' && depth === 1 && coma === -1) coma = j;
    }
    if (fin === -1 || coma === -1) break;
    const claro = v.slice(i + 'light-dark('.length, coma).trim();
    const oscuro = v.slice(coma + 1, fin).trim();
    v = v.slice(0, i) + (ambito === 'oscuro' ? oscuro : claro) + v.slice(fin + 1);
  }
  return v;
}

const hex2 = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');

/** Misma cosa escrita distinto, igual: rem a px (raíz 16), ms a s, rgba a hex, `transparent`, `0px` a `0`. */
export function normalizar(v) {
  return String(v)
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/(-?\d*\.?\d+)rem\b/g, (_, x) => `${Number((Number(x) * 16).toFixed(3))}px`)
    .replace(/(\d*\.?\d+)ms\b/g, (_, x) => `${Number((Number(x) / 1000).toFixed(3))}s`)
    .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?\)/g, (_, r, g, b, a) => `#${hex2(+r)}${hex2(+g)}${hex2(+b)}${a != null && Number(a) < 1 ? hex2(Number(a) * 255) : ''}`)
    .replace(/rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*(\d*\.?\d+)\s*\)/g, (_, r, g, b, a) => `#${hex2(+r)}${hex2(+g)}${hex2(+b)}${Number(a) < 1 ? hex2(Number(a) * 255) : ''}`)
    .replace(/\btransparent\b/g, '#00000000')
    .replace(/#([0-9a-f]{6})ff\b/g, '#$1')
    .replace(/(^|[\s(,])0px\b/g, '$10');
}

/** ¿Solo es densidad? Mismo valor con cada longitud ×16/14 (rem pensados para raíz 14 leídos a 16). */
export function soloDensidad(plugin, nuestro) {
  const np = [...plugin.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => +m[1]);
  const nn = [...nuestro.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => +m[1]);
  const forma = (x) => x.replace(/-?\d*\.?\d+px/g, 'N');
  return np.length > 0 && np.length === nn.length && forma(plugin) === forma(nuestro) && np.some((x, i) => x !== nn[i]) && np.every((x, i) => Math.abs(x - nn[i] * (16 / 14)) < 0.05);
}

/** Pesos de letra con unidad de longitud: CSS inválido, el navegador los ignora. */
export function pesosConPx(mapa) {
  return [...mapa].filter(([k, v]) => /font-weight/.test(k) && /\dpx$/.test(v)).map(([k]) => k);
}

const cero = (v) => /^0(px)?$/.test(v);

async function cssDe(preset) {
  const { Theme } = await import(pathToFileURL(join(ROOT, 'node_modules/@primeuix/styled/dist/index.mjs')).href);
  Theme.setTheme({ preset, options: OPCIONES });
  const partes = [];
  let comun = '';
  for (const n of Object.keys(preset.components ?? {})) {
    partes.push(Theme.getComponent(n).css ?? '');
    if (!comun) { const g = Theme.getCommon(n); comun = [g.primitive?.css, g.semantic?.css, g.global?.css].join('\n'); }
  }
  return { componentes: declaraciones(partes.join('\n')), comun: declaraciones(comun) };
}

async function empaquetar(entrada) {
  const { build } = await import(join(ROOT, 'node_modules/esbuild/lib/main.js'));
  const out = mkdtempSync(join(tmpdir(), 'tema-plugin-'));
  await build({ entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', outfile: join(out, 'preset.mjs'), nodePaths: [join(ROOT, 'node_modules')], logLevel: 'error' });
  return (await import(pathToFileURL(join(out, 'preset.mjs')).href)).default;
}

export const leeme = (m) => `# Export del plugin de Figma (Theme Designer)

Export \`${m.plugin}\` del plugin, tal cual sale de Figma: carpetas \`ts/\` y \`js/\`, un fichero por componente.

## Comprobaciones

- Tokens que pasan a 0: ${m.comprobaciones.ceros.length ? m.comprobaciones.ceros.slice(0, 8).join(', ') : 'ninguno'}.
- Raíz para la que está pensado: **${m.comprobaciones.raizPx ?? 'sin medir'} px**.${m.comprobaciones.raizPx === 14 ? ' Si vuestra página tiene la raíz a 16, las medidas salen un 14 % más grandes que en Figma.' : ''}
- Pesos de letra escritos con «px» (el navegador los ignora): ${m.comprobaciones.pesosPx.length}.
- Respecto al export anterior: ${m.comprobaciones.diferencia.anterior ? `${m.comprobaciones.diferencia.variables} variables cambian.` : 'es el primero publicado así.'}

## Cuánto se parece a lo que pintan nuestras apps

${m.comprobaciones.distancia.total} variables comparables, **${m.comprobaciones.distancia.distintas} con valor distinto** (${m.comprobaciones.distancia.pct} %). De ellas, ${m.comprobaciones.distancia.soloDensidad} son solo la raíz 14: con la página a 14 px coincidirían.
Si queréis que se vea idéntico a nuestras apps, usad \`tema-smartcontact.zip\`, que está en el mismo sitio.
`;

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const iAnterior = args.indexOf('--anterior');
  const posicionales = args.filter((a, i) => !a.startsWith('--') && (iAnterior === -1 || i !== iAnterior + 1));
  const [ORIGEN, SALIDA] = posicionales.map((p) => resolve(p));
  const ANTERIOR = iAnterior === -1 ? null : resolve(args[iAnterior + 1]);
  if (!ORIGEN || !existsSync(join(ORIGEN, 'ts/index.ts'))) {
    console.error('✗ no hay tema del plugin en', ORIGEN, '(falta ts/index.ts)');
    process.exit(2);
  }
  mkdirSync(SALIDA, { recursive: true });
  cpSync(join(ORIGEN, 'ts'), join(SALIDA, 'ts'), { recursive: true });
  if (existsSync(join(ORIGEN, 'js'))) cpSync(join(ORIGEN, 'js'), join(SALIDA, 'js'), { recursive: true });

  const plugin = await cssDe(await empaquetar(join(ORIGEN, 'ts/index.ts')));
  const nuestro = await cssDe(await empaquetar(join(ROOT, 'projects/ui-smartcontact/src/lib/theme/sc-preset/index.ts')));
  const tokens = declaraciones(LAYERS.map((f) => readFileSync(join(ROOT, `projects/design-tokens/src/lib/styles/tokens/layers/${f}.css`), 'utf8')).join('\n'));
  // Los tokens van en los DOS mapas: el preset del plugin no los usa, pero sin ellos el control (nuestro
  // tema pasado como si fuera el del plugin) salía con un 77 % «distinto» por referencias sin resolver.
  const mapaPlugin = new Map([...tokens, ...plugin.comun, ...plugin.componentes]);
  const mapaNuestro = new Map([...tokens, ...nuestro.comun, ...nuestro.componentes]);
  // Solo lo que pinta: fuera las rampas primitivas (`--p-cyan-500`…), que por sí solas no colorean nada y
  // metían 22 familias × 11 pasos de ruido en la distancia (medido: la mayoría de los primeros ejemplos).
  const clavesP = [...mapaPlugin.keys()].filter((k) => k.includes('|--p-') && !/\|--p-[a-z]+-\d+$/.test(k));

  // 4 · distancia a nuestras apps
  const comparables = clavesP.filter((k) => mapaNuestro.has(k));
  const distintas = comparables.filter((k) => resolver(mapaPlugin, k) !== resolver(mapaNuestro, k));
  const deDensidad = distintas.filter((k) => soloDensidad(resolver(mapaPlugin, k), resolver(mapaNuestro, k)));
  // 1 · ceros: respecto a nuestro tema y respecto al export anterior
  const cerosVsNuestro = comparables.filter((k) => cero(resolver(mapaPlugin, k)) && !cero(resolver(mapaNuestro, k)) && /^[\d.]+px/.test(resolver(mapaNuestro, k)));
  let anterior = null;
  if (ANTERIOR && existsSync(join(ANTERIOR, 'ts/index.ts'))) {
    const a = await cssDe(await empaquetar(join(ANTERIOR, 'ts/index.ts')));
    anterior = new Map([...a.comun, ...a.componentes]);
  }
  const cerosVsAnterior = anterior ? clavesP.filter((k) => anterior.has(k) && cero(resolver(mapaPlugin, k)) && !cero(resolver(anterior, k))) : [];
  // 2 · raíz: el plugin escribe cada paso de escala como rem POR SU NOMBRE (`{scale.1}` → `1rem`), así que
  // la raíz para la que está pensado es lo que vale `scale/1` en el Kit. Comparar medidas de dos fechas
  // distintas (primera versión) daba 12 y no decía nada.
  const kit = JSON.parse(readFileSync(join(ROOT, 'projects/design-tokens/scripts/kit-export-dtcg.json'), 'utf8'));
  const raizPx = Number(kit['aura/primitive']?.scale?.['1']?.$value) || null;

  const manifiesto = {
    plugin: process.env.SC_PLUGIN_SHA ?? 'desconocido',
    generado: new Date().toISOString(),
    comprobaciones: {
      ceros: [...new Set([...cerosVsAnterior, ...cerosVsNuestro])],
      raizPx,
      pesosPx: pesosConPx(mapaPlugin),
      diferencia: { anterior: Boolean(anterior), variables: anterior ? clavesP.filter((k) => resolver(mapaPlugin, k) !== resolver(anterior, k)).length : 0 },
      distancia: { total: comparables.length, distintas: distintas.length, soloDensidad: deDensidad.length, pct: comparables.length ? Math.round((distintas.length / comparables.length) * 100) : 0, ejemplos: distintas.slice(0, 20).map((k) => `${k}: plugin ${resolver(mapaPlugin, k)} · nuestro ${resolver(mapaNuestro, k)}`) },
    },
  };
  writeFileSync(join(SALIDA, 'manifiesto.json'), `${JSON.stringify(manifiesto, null, 2)}\n`);
  writeFileSync(join(SALIDA, 'LEEME.md'), leeme(manifiesto));
  const c = manifiesto.comprobaciones;
  if (c.ceros.length) {
    console.error(`✗ ${c.ceros.length} token(s) del plugin pasan a 0: ${c.ceros.slice(0, 5).join(', ')}`);
    process.exit(1);
  }
  console.log(`✓ export del plugin en ${SALIDA} · raíz ${c.raizPx ?? '?'} px · pesos con px ${c.pesosPx.length} · distinto de nuestras apps ${c.distancia.distintas}/${c.distancia.total} (${c.distancia.pct} %), ${c.distancia.soloDensidad} solo por la raíz`);
}
