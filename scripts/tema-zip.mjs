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
 *   sc-preset.mjs                 preset de PrimeNG (Aura + lo nuestro + el extend del plugin), sin dependencias
 *   sc-preset.d.ts                el tipo, para importarlo desde TypeScript
 *   smartcontact-tokens.css       las 6 capas de tokens `--sc-*` (claro y `.sc-dark`) que el preset lee
 *   smartcontact-typography.css   las clases `.sc-text-*` de los 12 estilos de texto
 *   package.json                  la rama publicada es el paquete npm `smartcontact-tema` (DD-93)
 *   LEEME.md                      cómo se instala, en llano
 *   manifiesto.json               versiones, commit y las comprobaciones
 *
 * Las comprobaciones, ya por script (sale con código 1 si un token pasa a 0 o si falla la 4):
 *   1. ningún token que tenía valor pasa a 0 (un 0 le gana al respaldo de `var()`);
 *   2. base de rem: el preset está pensado para raíz 16 (lo normaliza el tema, `rem-scale.ts`);
 *   3. diferencia con el zip anterior: ficheros, variables, reglas CSS y componentes que cambian.
 *      Se publica si cambia un FICHERO (`hayCambios`); el desglose solo explica.
 *   4. contrato del plugin: cada variable del `extend` que exporta el plugin existe en el tema (DD-93).
 *
 * Uso: node scripts/tema-zip.mjs <salida> [--anterior <carpeta del zip anterior>]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

/** Los ficheros del zip que llevan tema. `LEEME.md` y `manifiesto.json` no cuentan: llevan commit y fecha. */
export const FICHEROS = ['sc-preset.mjs', 'smartcontact-tokens.css', 'smartcontact-typography.css'];

/** Ficheros del tema cuyo contenido cambia entre dos carpetas (el build es determinista, medido). */
export function ficherosDistintos(dirAntes, dirAhora) {
  const leer = (d, f) => (existsSync(join(d, f)) ? readFileSync(join(d, f)) : null);
  return FICHEROS.filter((f) => { const a = leer(dirAntes, f); const b = leer(dirAhora, f); return !a || !b || !a.equals(b); });
}

/** Qué parte del preset cambia. `reglas` es el CSS global del preset (`css.ts`: interlineados de controles). */
export function comparaPreset(antes, ahora) {
  return {
    semanticaComun: ahora.comun !== antes.comun,
    reglasCss: ahora.reglas !== antes.reglas,
    componentes: Object.keys(ahora.componentes).filter((n) => ahora.componentes[n] !== antes.componentes?.[n]),
  };
}

/**
 * ¿Hay que publicar? Manda que cambie un fichero, no el desglose: el desglose es para la guía y ya se
 * dejó una parte fuera una vez (2026-09-14, #160 cambió `css.ts`, el zip dijo «no cambia» y no se publicó).
 */
export const hayCambios = (d) => !d.anterior || d.ficheros.length > 0;

/**
 * Divergencias escritas en `coverage-map.mjs` (grupo `aura/custom`): en estas claves manda el DS, no
 * el Kit. Cualquier otra clave de `aura/custom` viaja con el valor del Kit.
 */
const MANDA_EL_DS = {
  'semantic.text.accent': 'var(--sc-text-accent)',
  'component.dialog.icon.color': 'var(--sc-dialog-head-icon-fg)',
};

/** Un valor de `aura/custom` escrito como lo lee el preset: a nuestro token si existe, si no el del Kit. */
function valorDelExtend(ruta, valor, declaradas) {
  if (MANDA_EL_DS[ruta]) return MANDA_EL_DS[ruta];
  const tipo = ruta.match(/^primitive\.typography\.(font\.size|line\.height|font\.weight)\.([\w-]+)$/);
  if (tipo && declaradas.has(`--sc-${tipo[1].replace('.', '-')}-${tipo[2]}`)) return `var(--sc-${tipo[1].replace('.', '-')}-${tipo[2]})`;
  const paso = typeof valor === 'string' && valor.match(/^\{scale\.([\w-]+)\}$/);
  if (paso && declaradas.has(`--sc-scale-${paso[1]}`)) return `var(--sc-scale-${paso[1]})`;
  // El plugin escribe los pesos con «px» («600px»), que el navegador descarta: aquí van sin unidad.
  if (typeof valor === 'number') return valor === 0 ? '0' : /font\.weight/.test(ruta) ? String(valor) : `${valor}px`;
  return valor;
}

/**
 * El `extend` que el plugin de Figma exporta, pero con nuestros valores. Sale de la colección
 * `aura/custom` del Kit, que es de donde lo saca el plugin (medido 2026-09-14: sus 42 claves son el
 * `extend.ts` del export). Por qué: la web del equipo externo lee variables de ese `extend`
 * (`--p-typography-font-size-100`, `--p-app-typography-xl-line-height`…); sin ellas, cambiar al
 * tema de nuestras apps les dejaba estilos sin valor. Lo que nuestro preset ya declara, gana.
 */
export function extendDesdeKit(custom, declaradas, yaDeclarado = {}) {
  const out = {};
  const yaEsta = (ruta) => ruta.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), yaDeclarado) !== undefined;
  const recorrer = (nodo, ruta) => {
    for (const [k, v] of Object.entries(nodo)) {
      const r = ruta ? `${ruta}.${k}` : k;
      if (v && typeof v === 'object' && !('$value' in v)) { recorrer(v, r); continue; }
      if (yaEsta(r)) continue;
      const partes = r.split('.');
      let destino = out;
      for (const p of partes.slice(0, -1)) destino = destino[p] ??= {};
      destino[partes.at(-1)] = valorDelExtend(r, v.$value, declaradas);
    }
  };
  recorrer(custom, '');
  return out;
}

/**
 * Variables `--p-*` que el contrato del plugin promete (una por hoja de `aura/custom`). El runtime
 * quita el primer nivel `primitive.` y `semantic.` del extend y deja `component.` y `app.` (medido en
 * el export del plugin: `--p-typography-font-size-100`, `--p-presence-available`,
 * `--p-component-custommodal-background`, `--p-app-typography-md-font-size`).
 */
export function contratoDelPlugin(custom) {
  const out = [];
  const recorrer = (nodo, ruta) => {
    for (const [k, v] of Object.entries(nodo)) {
      const r = ruta ? `${ruta}.${k}` : k;
      if (v && typeof v === 'object' && !('$value' in v)) recorrer(v, r);
      else out.push(`--p-${r.replace(/^(primitive|semantic)\./, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/\./g, '-').toLowerCase()}`);
    }
  };
  recorrer(custom, '');
  return out;
}

/** `package.json` del paquete: se instala desde la rama publicada y se actualiza con npm. */
export const paqueteNpm = ({ commit, generado }) => {
  const f = new Date(generado);
  const dia = `${f.getUTCFullYear()}${String(f.getUTCMonth() + 1).padStart(2, '0')}${String(f.getUTCDate()).padStart(2, '0')}`;
  return {
    name: 'smartcontact-tema',
    // Solo informa: npm sigue a la rama. Día y minuto UTC, sin ceros delante (semver no los admite).
    version: `0.${dia}.${f.getUTCHours() * 100 + f.getUTCMinutes()}`,
    description: 'Tema de Smart Contact para PrimeNG: el mismo que usan sus apps.',
    type: 'module',
    main: './sc-preset.mjs',
    types: './sc-preset.d.ts',
    exports: {
      '.': { types: './sc-preset.d.ts', default: './sc-preset.mjs' },
      './smartcontact-tokens.css': './smartcontact-tokens.css',
      './smartcontact-typography.css': './smartcontact-typography.css',
      './package.json': './package.json',
    },
    files: ['sc-preset.mjs', 'sc-preset.d.ts', ...FICHEROS.filter((x) => x.endsWith('.css')), 'LEEME.md', 'manifiesto.json'],
    sideEffects: ['*.css'],
    license: 'UNLICENSED',
    repository: { type: 'git', url: 'https://github.com/smartcontact-hub/smartcontact-ui.git' },
    smartcontact: { commit },
  };
};

async function cssDelPreset(ruta) {
  const { Theme } = await import(pathToFileURL(join(ROOT, 'node_modules/@primeuix/styled/dist/index.mjs')).href);
  const preset = (await import(`${pathToFileURL(ruta).href}?t=${Date.now()}`)).default;
  // La semántica común se guarda UNA vez: metida en cada componente, un cambio común hace que los 97
  // «cambien» y el informe no dice nada (medido la primera vez: 97 de 97).
  // `style` es el CSS de reglas, no de variables: el global sale en `getCommon`, el de cada componente
  // en `getComponent`. Sin él, un cambio en `css.ts` pasaba como «no cambia».
  const out = { componentes: {}, comun: '', reglas: '' };
  Theme.setTheme({ preset, options: OPCIONES });
  for (const n of Object.keys(preset.components ?? {})) {
    const c = Theme.getComponent(n);
    out.componentes[n] = [c.css, c.style].map((s) => s ?? '').join('\n');
    if (!out.comun) {
      const g = Theme.getCommon(n);
      out.comun = [g.primitive?.css, g.semantic?.css, g.global?.css].join('\n');
      out.reglas = String(g.style ?? '');
    }
  }
  return out;
}

export const leeme = (m) => `# Tema de Smart Contact para PrimeNG

Generado desde el commit \`${m.commit}\` del Design System (PrimeNG ${m.primeng}, Aura ${m.themes}).
Es el mismo tema que usan las apps de Smart Contact: con él, vuestra web se ve igual que las nuestras.
En la misma rama está también \`tema-plugin.zip\`, el export del plugin de Figma, con su propia guía
(\`LEEME-plugin.md\`) y la medida de cuánto se aparta de este.

Trae también todas las variables del \`extend\` que exporta el plugin (\`--p-typography-*\`,
\`--p-app-typography-*\`, \`--p-presence-*\`, \`--p-component-custommodal-*\`…), con nuestros valores: una hoja
que las lea sigue funcionando.

## Instalar (una vez)

1. Instala el paquete desde la rama publicada:

   \`\`\`sh
   npm install github:smartcontact-hub/smartcontact-ui#tema-zip
   \`\`\`

2. Carga los estilos globales, en este orden (en \`angular.json\` → \`styles\`):

   \`\`\`json
   "node_modules/smartcontact-tema/smartcontact-tokens.css",
   "node_modules/smartcontact-tema/smartcontact-typography.css"
   \`\`\`

3. Da el tema a PrimeNG:

   \`\`\`ts
   import scPreset from 'smartcontact-tema';

   providePrimeNG({
     theme: { preset: scPreset, options: { prefix: 'p', darkModeSelector: '.sc-dark' } },
   });
   \`\`\`

4. Modo oscuro: pon la clase \`sc-dark\` en \`<html>\`. Cambia a la vez los tokens y el tema.

## Actualizar

Se publica solo cada vez que cambia el tema. Para traer la última versión:

\`\`\`sh
npm update smartcontact-tema
\`\`\`

El \`package-lock.json\` fija la versión instalada, así que \`npm ci\` no cambia nada hasta que actualicéis.
La versión instalada está en \`node_modules/smartcontact-tema/manifiesto.json\` (commit y fecha).

Sin npm: \`tema-smartcontact.zip\`, en la misma rama, lleva los mismos ficheros.

## Tres cosas que no cambiar

- **La raíz de la página a 16 px.** Las medidas están hechas para \`html { font-size: 16px }\`.
- **La fuente Inter**, que los estilos de texto dan por cargada.
- **El prefijo \`p\`** de las variables de PrimeNG.

## Qué cambia respecto al zip anterior

${m.comprobaciones.diferencia.anterior ? `- Ficheros distintos: ${m.comprobaciones.diferencia.ficheros.length ? m.comprobaciones.diferencia.ficheros.join(', ') : 'ninguno'}.\n- Variables de tokens: ${m.comprobaciones.diferencia.variables.length}.\n- Semántica común (colores y medidas que comparten todos): ${m.comprobaciones.diferencia.semanticaComun ? 'cambia' : 'igual'}.\n- Reglas CSS del tema (interlineados de los controles): ${m.comprobaciones.diferencia.reglasCss ? 'cambian' : 'iguales'}.\n- Componentes con CSS propio distinto: ${m.comprobaciones.diferencia.componentes.length ? m.comprobaciones.diferencia.componentes.join(', ') : 'ninguno'}.` : '- Es el primer zip generado así.'}
`;

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const iAnterior = args.indexOf('--anterior');
  const ANTERIOR = iAnterior === -1 ? null : resolve(args[iAnterior + 1]);
  const OUT = resolve(args.find((a, i) => !a.startsWith('--') && (iAnterior === -1 || i !== iAnterior + 1)) ?? 'dist/tema');
  mkdirSync(OUT, { recursive: true });

  const tokensCss = LAYERS.map((f) => `/* ── ${f}.css ── */\n${readFileSync(join(STYLES, 'tokens/layers', `${f}.css`), 'utf8')}`).join('\n');
  const declaradas = new Set([...variables(tokensCss).keys()].map((k) => k.split('|')[1]));
  const custom = JSON.parse(readFileSync(join(ROOT, 'projects/design-tokens/scripts/kit-export-dtcg.json'), 'utf8'))['aura/custom'] ?? {};
  const { build } = await import(join(ROOT, 'node_modules/esbuild/lib/main.js'));
  const PRESET = join(ROOT, 'projects/ui-smartcontact/src/lib/theme/sc-preset');
  // Nuestro preset tal cual, más el extend del plugin que aún no declara (el nuestro gana).
  const temporal = mkdtempSync(join(tmpdir(), 'tema-zip-'));
  await build({ entryPoints: [join(PRESET, 'extend.ts')], bundle: true, format: 'esm', platform: 'node', outfile: join(temporal, 'extend.mjs'), logLevel: 'error' });
  const extendNuestro = (await import(pathToFileURL(join(temporal, 'extend.mjs')).href)).default;
  rmSync(temporal, { recursive: true, force: true });
  const extendPlugin = extendDesdeKit(custom, declaradas, extendNuestro);
  await build({
    stdin: {
      contents: `import { definePreset } from '@primeuix/themes';\nimport scPreset from ${JSON.stringify(join(PRESET, 'index.ts'))};\nexport default definePreset(scPreset, { extend: ${JSON.stringify(extendPlugin)} });\n`,
      resolveDir: ROOT,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    outfile: join(OUT, 'sc-preset.mjs'),
    nodePaths: [join(ROOT, 'node_modules')],
    absWorkingDir: ROOT,
    logLevel: 'error',
  });
  writeFileSync(join(OUT, 'sc-preset.d.ts'), '/** Preset de PrimeNG de Smart Contact (Aura + marca). */\ndeclare const scPreset: Record<string, unknown>;\nexport default scPreset;\n');
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
      ficheros: hayAnterior ? ficherosDistintos(ANTERIOR, OUT) : [],
      variables: hayAnterior ? diferencias(varsAntes, varsAhora) : [],
      ...(hayAnterior ? comparaPreset(cssAntes, cssAhora) : { semanticaComun: false, reglasCss: false, componentes: [] }),
    },
  };
  comprobaciones.cambia = hayCambios(comprobaciones.diferencia);
  // 4. El contrato del plugin: cada variable que su `extend` promete existe en el tema empaquetado.
  const declaradasPreset = new Set([...`${cssAhora.comun}\n${Object.values(cssAhora.componentes).join('\n')}`.matchAll(/(--p-[\w-]+)\s*:/g)].map((m) => m[1]));
  comprobaciones.contratoPlugin = { promete: contratoDelPlugin(custom).length, faltan: contratoDelPlugin(custom).filter((v) => !declaradasPreset.has(v)) };
  const manifiesto = { commit, primeng: version('primeng'), themes: version('@primeuix/themes'), generado: new Date().toISOString(), comprobaciones };
  writeFileSync(join(OUT, 'manifiesto.json'), `${JSON.stringify(manifiesto, null, 2)}\n`);
  writeFileSync(join(OUT, 'LEEME.md'), leeme(manifiesto));
  writeFileSync(join(OUT, 'package.json'), `${JSON.stringify(paqueteNpm(manifiesto), null, 2)}\n`);

  if (comprobaciones.ceros.length) {
    console.error(`✗ ${comprobaciones.ceros.length} token(s) pasan a 0: ${comprobaciones.ceros.slice(0, 5).join(', ')}`);
    process.exit(1);
  }
  if (comprobaciones.contratoPlugin.faltan.length) {
    console.error(`✗ al tema le faltan ${comprobaciones.contratoPlugin.faltan.length} variable(s) que el plugin promete: ${comprobaciones.contratoPlugin.faltan.slice(0, 5).join(', ')}`);
    process.exit(1);
  }
  const d = comprobaciones.diferencia;
  console.log(`✓ tema en ${OUT} · ${hayAnterior ? `ficheros distintos: ${d.ficheros.join(', ') || 'ninguno'} · ${d.variables.length} variables, semántica común ${d.semanticaComun ? 'distinta' : 'igual'}, reglas CSS ${d.reglasCss ? 'distintas' : 'iguales'} y ${d.componentes.length} componentes cambian respecto al anterior` : 'sin zip anterior con que comparar'}`);
}
