import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/*
 * Un borde de UN lado escrito como valor de UNO: `borderWidth: "0.071429rem"` donde Aura dice
 * `"0 0 1px 0"`. PrimeNG lo pone en `border-width`, que con un valor pinta los cuatro lados: la pestaña
 * de `p-tabs` salía como una caja (medido en el Dashboard, 2026-09-14). El `1` del Kit perdía la forma al
 * pasar a rem, y lo mismo les pasaba a accordion, dataview y treetable.
 *
 * Dos preguntas contra Aura puro, para cada `borderWidth` de cada tema:
 *   · Aura escribe varios valores y nosotros uno (distinto de 0) → caja donde Aura pinta un lado.
 *   · Aura escribe `0` y nosotros un grosor → borde donde Aura no pinta ninguno.
 * Probado en rojo con el `tabs.ts` de antes: salen `tabs.tablist` y `tabs.tab`.
 */

const root = resolve(import.meta.dirname, '../..');
const require_ = createRequire(resolve(root, 'package.json'));
const ts = require_('typescript');
const PRESET_DIR = resolve(root, 'projects/ui-smartcontact/src/lib/theme/sc-preset');
const NO_COMPONENTE = new Set(['index.ts', 'base.ts', 'css.ts', 'extend.ts', 'rem-scale.ts']);

function loadTs(file) {
  const js = ts.transpileModule(readFileSync(resolve(PRESET_DIR, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', js)(() => ({}), mod, mod.exports);
  return mod.exports.default;
}

/** Cuántos valores tiene un shorthand, sin partir lo que va entre paréntesis. */
export const partes = (v) => v.trim().split(/\s+(?![^(]*\))/).length;

function fallos(ours, aura, path, out) {
  for (const [k, v] of Object.entries(ours ?? {})) {
    const a = aura?.[k];
    if (v && typeof v === 'object') {
      fallos(v, a, `${path}.${k}`, out);
      continue;
    }
    if (k !== 'borderWidth' || typeof v !== 'string' || typeof a !== 'string') continue;
    if (/^var\(|^\{/.test(v)) continue;
    if (partes(a) > 1 && partes(v) === 1 && v !== '0') out.push(`${path}.${k}: "${v}", Aura "${a}" (caja donde Aura pinta un lado)`);
    if (a === '0' && v !== '0') out.push(`${path}.${k}: "${v}", Aura "0" (borde donde Aura no pinta)`);
  }
}

test('el detector cuenta partes sin romper funciones', () => {
  assert.equal(partes('0.071429rem'), 1);
  assert.equal(partes('0 0 1px 0'), 4);
  assert.equal(partes('0 0 calc(1px + 0rem) 0'), 4);
});

test('ningún borderWidth del tema pinta una caja donde Aura pinta un lado, o ninguno', async () => {
  const out = [];
  let comparados = 0;
  for (const file of readdirSync(PRESET_DIR).filter((f) => f.endsWith('.ts') && !NO_COMPONENTE.has(f))) {
    const name = file.replace(/\.ts$/, '');
    let aura;
    try {
      aura = (await import(pathToFileURL(require_.resolve(`@primeuix/themes/aura/${name}`)).href)).default;
    } catch {
      continue; // componente sin tema en Aura
    }
    comparados++;
    fallos(loadTs(file), aura, name, out);
  }
  // Sin esto, un fallo al cargar Aura dejaría el test en verde sin comparar nada.
  assert.ok(comparados > 50, `solo se compararon ${comparados} temas con Aura`);
  assert.deepEqual(out, []);
});
