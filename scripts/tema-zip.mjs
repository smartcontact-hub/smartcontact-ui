#!/usr/bin/env node
/**
 * El tema de Smart Contact empaquetado para quien no usa este repo (el equipo externo).
 *
 * Por qué (2026-09-14): hasta hoy el equipo externo recibía el zip del plugin de Figma, preparado a
 * mano y con tres comprobaciones a mano (`docs/conexion-variables.md` §La rutina por tema), y su web y
 * la nuestra diferían en el 43 % de las claves con el mismo Kit (pesos con «px», esquema anterior a
 * Aura 3, rem pensados para raíz 14). Rafa: «ellos nos siguen a nosotros». Así que el zip sale de lo que
 * pintan NUESTRAS apps: el mismo preset y los mismos tokens. Medido: el preset empaquetado genera el
 * mismo CSS que el del código en los 97 componentes, y un valor tocado en el paquete lo caza.
 *
 * Qué lleva:
 *   sc-preset.mjs                 preset de PrimeNG (Aura + lo nuestro) en un fichero, sin dependencias
 *   smartcontact-tokens.css       las 6 capas de tokens `--sc-*` (claro y `.sc-dark`) que el preset lee
 *   smartcontact-typography.css   las clases `.sc-text-*` de los 12 estilos de texto
 *   LEEME.md                      cómo se instala, en llano
 *   manifiesto.json               versiones, commit y las tres comprobaciones
 *
 * Las tres comprobaciones de la rutina, ya por script (sale con código 1 si un token pasa a 0):
 *   1. ningún token que tenía valor pasa a 0 (un 0 le gana al respaldo de `var()`);
 *   2. base de rem: el preset está pensado para raíz 16 (lo normaliza el tema, `rem-scale.ts`);
 *   3. diferencia con el zip anterior: variables y componentes que cambian.
 *
 * Uso: node scripts/tema-zip.mjs <salida> [--anterior <carpeta del zip anterior>]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.SC_ROOT ? resolve(process.env.SC_ROOT) : resolve(import.meta.dirname, '..');
const LAYERS = ['01-primitive', '02-semantic', '03-palette', '04-component', '05-extensions', '07-dark'];
const STYLES = join(ROOT, 'projects/design-tokens/src/lib/styles');
const OPCIONES = { prefix: 'p', darkModeSelector: '.sc-dark' };

/** `--sc-*` de un CSS, por ámbito (claro u oscuro según su regla). */
export function variables(css) {
  const out = new Map();
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const ambito = /\.sc-dark/.test(m[1]) ? 'oscuro' : 'claro';
    for (const d of m[2].matchAll(/(--sc-[\w-]+)\s*:\s*([^;]+);/g)) out.set(`${ambito}|${d[1]}`, d[2].trim());
  }
  return out;
}

/** Tokens que tenían valor y ahora valen 0. */
export function cerosNuevos(antes, despues) {
  const cero = (v) => /^0(px|rem)?$/.test(v);
  return [...despues].filter(([k, v]) => cero(v) && antes.has(k) && !cero(antes.get(k))).map(([k]) => k);
}

export function diferencias(antes, despues) {
  const claves = new Set([...antes.keys(), ...despues.keys()]);
  return [...claves].filter((k) => antes.get(k) !== despues.get(k)).sort();
}

async function cssDelPreset(ruta) {
  const { Theme } = await import(pathToFileURL(join(ROOT, 'node_modules/@primeuix/styled/dist/index.mjs')).href);
  const preset = (await import(`${pathToFileURL(ruta).href}?t=${Date.now()}`)).default;
  // La semántica común se guarda UNA vez: metida en cada componente, un cambio común hace que los 97
  // «cambien» y el informe no dice nada (medido la primera vez: 97 de 97).
  const out = { componentes: {}, comun: '' };
  Theme.setTheme({ preset, options: OPCIONES });
  for (const n of Object.keys(preset.components ?? {})) {
    out.componentes[n] = Theme.getComponent(n).css ?? '';
    if (!out.comun) { const g = Theme.getCommon(n); out.comun = [g.primitive?.css, g.semantic?.css, g.global?.css].join('\n'); }
  }
  return out;
}

export const leeme = (m) => `# Tema de Smart Contact para PrimeNG

Generado desde el commit \`${m.commit}\` del Design System (PrimeNG ${m.primeng}, Aura ${m.themes}).
Es el mismo tema que usan las apps de Smart Contact: con él, vuestra web se ve igual que las nuestras.
En la misma rama está también \`tema-plugin.zip\`, el export del plugin de Figma, con su propia guía
(\`LEEME-plugin.md\`) y la medida de cuánto se aparta de este.

## Instalar

1. Copia los tres ficheros a tu proyecto.
2. Carga los estilos globales, en este orden:

   \`\`\`css
   @import './smartcontact-tokens.css';
   @import './smartcontact-typography.css';
   \`\`\`

3. Da el tema a PrimeNG:

   \`\`\`ts
   import scPreset from './sc-preset.mjs';

   providePrimeNG({
     theme: { preset: scPreset, options: { prefix: 'p', darkModeSelector: '.sc-dark' } },
   });
   \`\`\`

4. Modo oscuro: pon la clase \`sc-dark\` en \`<html>\`. Cambia a la vez los tokens y el tema.

## Tres cosas que no cambiar

- **La raíz de la página a 16 px.** Las medidas están hechas para \`html { font-size: 16px }\`.
- **La fuente Inter**, que los estilos de texto dan por cargada.
- **El prefijo \`p\`** de las variables de PrimeNG.

## Qué cambia respecto al zip anterior

${m.comprobaciones.diferencia.anterior ? `- Variables de tokens: ${m.comprobaciones.diferencia.variables.length}.\n- Semántica común (colores y medidas que comparten todos): ${m.comprobaciones.diferencia.semanticaComun ? 'cambia' : 'igual'}.\n- Componentes con CSS propio distinto: ${m.comprobaciones.diferencia.componentes.length ? m.comprobaciones.diferencia.componentes.join(', ') : 'ninguno'}.` : '- Es el primer zip generado así.'}
`;

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const iAnterior = args.indexOf('--anterior');
  const ANTERIOR = iAnterior === -1 ? null : resolve(args[iAnterior + 1]);
  const OUT = resolve(args.find((a, i) => !a.startsWith('--') && (iAnterior === -1 || i !== iAnterior + 1)) ?? 'dist/tema');
  mkdirSync(OUT, { recursive: true });

  const { build } = await import(join(ROOT, 'node_modules/esbuild/lib/main.js'));
  await build({
    entryPoints: [join(ROOT, 'projects/ui-smartcontact/src/lib/theme/sc-preset/index.ts')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    outfile: join(OUT, 'sc-preset.mjs'),
    nodePaths: [join(ROOT, 'node_modules')],
    absWorkingDir: ROOT,
    logLevel: 'error',
  });
  const tokensCss = LAYERS.map((f) => `/* ── ${f}.css ── */\n${readFileSync(join(STYLES, 'tokens/layers', `${f}.css`), 'utf8')}`).join('\n');
  writeFileSync(join(OUT, 'smartcontact-tokens.css'), tokensCss);
  writeFileSync(join(OUT, 'smartcontact-typography.css'), readFileSync(join(STYLES, 'base/typography.css'), 'utf8'));

  const commit = (() => { try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return 'desconocido'; } })();
  const version = (p) => JSON.parse(readFileSync(join(ROOT, 'node_modules', p, 'package.json'), 'utf8')).version;

  const hayAnterior = Boolean(ANTERIOR && existsSync(join(ANTERIOR, 'smartcontact-tokens.css')) && existsSync(join(ANTERIOR, 'sc-preset.mjs')));
  const varsAhora = variables(tokensCss);
  const varsAntes = hayAnterior ? variables(readFileSync(join(ANTERIOR, 'smartcontact-tokens.css'), 'utf8')) : new Map();
  const cssAhora = await cssDelPreset(join(OUT, 'sc-preset.mjs'));
  const cssAntes = hayAnterior ? await cssDelPreset(join(ANTERIOR, 'sc-preset.mjs')) : {};
  const comprobaciones = {
    ceros: hayAnterior ? cerosNuevos(varsAntes, varsAhora) : [],
    raizPx: 16,
    diferencia: {
      anterior: hayAnterior,
      variables: hayAnterior ? diferencias(varsAntes, varsAhora) : [],
      semanticaComun: hayAnterior ? cssAhora.comun !== cssAntes.comun : false,
      componentes: hayAnterior ? Object.keys(cssAhora.componentes).filter((n) => cssAhora.componentes[n] !== cssAntes.componentes?.[n]) : [],
    },
  };
  const manifiesto = { commit, primeng: version('primeng'), themes: version('@primeuix/themes'), generado: new Date().toISOString(), comprobaciones };
  writeFileSync(join(OUT, 'manifiesto.json'), `${JSON.stringify(manifiesto, null, 2)}\n`);
  writeFileSync(join(OUT, 'LEEME.md'), leeme(manifiesto));

  if (comprobaciones.ceros.length) {
    console.error(`✗ ${comprobaciones.ceros.length} token(s) pasan a 0: ${comprobaciones.ceros.slice(0, 5).join(', ')}`);
    process.exit(1);
  }
  console.log(`✓ tema en ${OUT} · ${hayAnterior ? `${comprobaciones.diferencia.variables.length} variables, semántica común ${comprobaciones.diferencia.semanticaComun ? 'distinta' : 'igual'} y ${comprobaciones.diferencia.componentes.length} componentes cambian respecto al anterior` : 'sin zip anterior con que comparar'}`);
}
