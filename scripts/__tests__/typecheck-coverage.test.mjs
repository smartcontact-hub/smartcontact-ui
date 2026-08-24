import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Anti-drift del ALCANCE de `npm run typecheck`.
//
// Por qué existe: los `tsconfig` de apps y libs arrancan todos en `projects/*/src`, así
// que durante meses NADIE type-checkeó el TypeScript de la raíz ni el de `e2e/`. Por ese
// hueco pasó un `reducedMotion` suelto en el `use` de `playwright.cuscare.config.ts`
// —error de tipo real— con el `verify` entero en verde y la suite de CusCare inestable
// bajo carga (2026-08-24, s32).
//
// `tsconfig.harness.json` tapó el hueco de HOY, y su `include` va por patrón, así que un
// `.ts` nuevo en la raíz o en `e2e/` entra solo. Lo que este test cubre es lo que el patrón
// NO puede prever: un DIRECTORIO nuevo de primer nivel con TypeScript dentro (un `tools/`,
// un `bench/`) volvería a quedar fuera en silencio, que es exactamente cómo nació el hueco.
// Un gate que solo protege su propia instancia no protege la clase.

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Directorios de primer nivel que NO se recorren.
const NO_SE_MIRAN = new Set([
  'node_modules', 'dist', '.angular', '.git', '.github', '.claude',
  'out-tsc', 'playwright-report', 'test-results', 'coverage',
]);

// Ya type-checkeados por SU propio tsconfig, encadenado en el script `typecheck`.
const CUBIERTOS_POR_SU_PROYECTO = new Set(['projects']);

// Exentos a propósito, con su motivo. Si sacas uno de aquí, el test exigirá cubrirlo.
const EXENTOS = {
  'code-connect':
    'no son código sino PLANTILLAS del CLI de Code Connect: importan un módulo `figma` ' +
    'virtual y usan globales `_fcc_*` que el parser inyecta y no declara ningún `.d.ts` ' +
    '(17 errores medidos). Su gate es `npm run figma:connect:parse`.',
};

// Un `include` de tsconfig a regex: `**/` = cero o más directorios, `*` = todo menos `/`,
// `?` = un carácter menos `/`. Solo estas tres formas; no hay más en este repo.
export function includeARegex(patron) {
  let re = '';
  for (let i = 0; i < patron.length; i++) {
    if (patron.startsWith('**/', i)) { re += '(?:[^/]*/)*'; i += 2; continue; }
    const c = patron[i];
    if (c === '*') { re += '[^/]*'; continue; }
    if (c === '?') { re += '[^/]'; continue; }
    re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}

// `tsconfig` admite comentarios; `JSON.parse` no. Se quitan fuera de las cadenas.
export function parseJsonc(texto) {
  let out = '', enCadena = false, enLinea = false, enBloque = false, escapado = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i], n = texto[i + 1];
    if (enLinea) { if (c === '\n') { enLinea = false; out += c; } continue; }
    if (enBloque) { if (c === '*' && n === '/') { enBloque = false; i++; } continue; }
    if (enCadena) {
      out += c;
      if (escapado) escapado = false;
      else if (c === '\\') escapado = true;
      else if (c === '"') enCadena = false;
      continue;
    }
    if (c === '"') { enCadena = true; out += c; continue; }
    if (c === '/' && n === '/') { enLinea = true; i++; continue; }
    if (c === '/' && n === '*') { enBloque = true; i++; continue; }
    out += c;
  }
  return JSON.parse(out);
}

// Los `.ts` que deberían estar en ALGÚN programa de TypeScript: todo menos lo que se
// recorre por otro tsconfig o está exento con motivo escrito.
export function tsSinDuenyo(dir, base = dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name);
    const rel = relative(base, abs).split(sep).join('/');
    const primerNivel = rel.split('/')[0];
    if (e.isDirectory()) {
      if (NO_SE_MIRAN.has(primerNivel) || CUBIERTOS_POR_SU_PROYECTO.has(primerNivel)) continue;
      if (EXENTOS[primerNivel]) continue;
      tsSinDuenyo(abs, base, acc);
    } else if (e.name.endsWith('.ts') && !e.name.endsWith('.d.ts')) {
      acc.push(rel);
    }
  }
  return acc;
}

export function noCubiertos(ficheros, includes) {
  const res = includes.map(includeARegex);
  return ficheros.filter((f) => !res.some((re) => re.test(f)));
}

const harness = parseJsonc(readFileSync(join(root, 'tsconfig.harness.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

test('el script `typecheck` corre `tsconfig.harness.json`', () => {
  assert.match(
    pkg.scripts?.typecheck ?? '',
    /tsc [^&]*-p tsconfig\.harness\.json/,
    'el tsconfig del arnés existe pero nadie lo ejecuta: sin esto el gate no corre en `verify` ni en CI',
  );
});

test('el repo REAL: ningún `.ts` fuera de `projects/` se queda sin type-checkear', () => {
  const huerfanos = noCubiertos(tsSinDuenyo(root), harness.include);
  assert.deepEqual(
    huerfanos,
    [],
    'estos `.ts` no los mira NADIE. Añade su patrón al `include` de `tsconfig.harness.json` ' +
      '(o, si no son type-checkeables, exímelos ahí y en EXENTOS de este test, con el motivo):\n  - ' +
      huerfanos.join('\n  - '),
  );
});

test('`eslint.config.js` entra: su `// @ts-check` solo vale dentro de un programa', () => {
  const cabecera = readFileSync(join(root, 'eslint.config.js'), 'utf8').split('\n')[0];
  assert.equal(cabecera.trim(), '// @ts-check');
  assert.deepEqual(noCubiertos(['eslint.config.js'], harness.include), []);
  assert.equal(harness.compilerOptions?.checkJs, true, 'sin `checkJs` el `@ts-check` sigue sin hacer nada');
});

test('DRIFT: un directorio NUEVO de primer nivel con TypeScript → lo caza', () => {
  assert.deepEqual(noCubiertos(['tools/build-algo.ts'], harness.include), ['tools/build-algo.ts']);
});

test('DRIFT: sacar el arnés del script `typecheck` → lo caza', () => {
  const sinArnes = 'tsc --noEmit -p projects/cuscare/tsconfig.app.json';
  assert.doesNotMatch(sinArnes, /tsc [^&]*-p tsconfig\.harness\.json/);
});

test('includeARegex: `**/` casa cero directorios y `*` no cruza `/`', () => {
  const re = includeARegex('e2e/**/*.ts');
  assert.ok(re.test('e2e/smoke.spec.ts'), '`**/` tiene que casar también con CERO directorios');
  assert.ok(re.test('e2e/cuscare/helpers.ts'));
  assert.ok(re.test('e2e/a/b/c.ts'));
  assert.ok(!re.test('otro/e2e/smoke.spec.ts'));
  assert.ok(!includeARegex('*.ts').test('e2e/smoke.spec.ts'), '`*` no cruza barras');
});

test('parseJsonc: quita comentarios de bloque y de línea, y respeta las cadenas', () => {
  const cfg = parseJsonc('/* cabecera */\n{\n "a": "http://x//y", // nota\n "b": ["*.ts"]\n}\n');
  assert.equal(cfg.a, 'http://x//y', 'un `//` DENTRO de una cadena no es un comentario');
  assert.deepEqual(cfg.b, ['*.ts']);
});
