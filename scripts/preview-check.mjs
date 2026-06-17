#!/usr/bin/env node
/**
 * preview:check — VERIFICADOR headless del lote `preview:live` (no abre navegador).
 *
 * El puente debe ser impecable: este check demuestra, sin servidor ni red, que el pipeline
 * del que depende `preview:live` produce CSS válido y SERVIBLE. Si esto está verde, el preview
 * local renderizará lo que el export manda. Cuelga del gate vía un test node:test (test:unit).
 *
 * Comprueba, contra el export FIJO committeado (`kit-export-dtcg.json`):
 *   1. el export carga como JSON no vacío,
 *   2. cada generador EMITE (`--emit`) CSS no vacío, con variables `--sc-*` y llaves balanceadas
 *      → la regeneración funciona de verdad,
 *   3. los generadores en modo CHECK (sin --write) pasan → el CSS de fuente que el app sirve
 *      coincide con el export (sin drift "verde-mudo"),
 *   4. las 6 capas existen, no están vacías y son CSS estructuralmente sano,
 *   5. los entrypoints de estilo de los apps siguen importando las capas DESDE FUENTE
 *      → el HMR reflejará un regen (si no, el preview no mostraría el cambio).
 *
 * Uso:  npm run preview:check     (sale ≠0 si algo falla)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const rel = (p) => p.replace(`${root}/`, '');

const EXPORT = resolve(root, 'projects/design-tokens/scripts/kit-export-dtcg.json');
const LAYERS = 'projects/design-tokens/src/lib/styles/tokens/layers';
const LAYER_FILES = ['01-primitive', '02-semantic', '03-palette', '04-component', '05-extensions', '07-dark'].map(
  (n) => resolve(root, `${LAYERS}/${n}.css`),
);
const GENERATORS = ['token-gen.mjs', 'token-gen-component.mjs', 'token-gen-color.mjs'];
// El app sirve las capas DESDE FUENTE por estos entrypoints (directa o vía index.css) → HMR.
const ENTRYPOINTS = [
  { file: 'projects/sc-demo/src/styles.scss', needle: 'design-tokens/src/lib/styles/index.css' },
  { file: 'projects/supervisor/src/styles/main.scss', needle: 'tokens/layers/01-primitive.css' },
];

const bracesBalanced = (s) => {
  let depth = 0;
  for (const c of s) {
    if (c === '{') depth++;
    else if (c === '}' && --depth < 0) return false;
  }
  return depth === 0;
};

export function previewCheck() {
  const problems = [];
  const node = process.execPath;

  // 1) export fijo carga + tiene contenido
  if (!existsSync(EXPORT)) {
    problems.push('falta el export kit-export-dtcg.json');
  } else {
    try {
      const j = JSON.parse(readFileSync(EXPORT, 'utf8'));
      if (!j || typeof j !== 'object' || Object.keys(j).length === 0)
        problems.push('el export está vacío o no es un objeto');
    } catch {
      problems.push('el export no es JSON válido');
    }
  }

  // 2) cada generador EMITE CSS válido desde el export (--emit)
  for (const g of GENERATORS) {
    try {
      const out = execFileSync(node, [resolve(root, `scripts/${g}`), '--emit'], { cwd: root, encoding: 'utf8' });
      if (!out.includes('--sc-')) problems.push(`${g} --emit no produjo variables --sc-* (¿export ilegible?)`);
      if (!bracesBalanced(out)) problems.push(`${g} --emit produjo CSS con llaves desbalanceadas`);
    } catch (e) {
      problems.push(`${g} --emit falló: ${String(e.stderr || e.message || '').split('\n')[0]}`);
    }
  }

  // 3) sin DRIFT: generadores en modo CHECK pasan → el CSS servido == el export
  for (const g of GENERATORS) {
    try {
      execFileSync(node, [resolve(root, `scripts/${g}`)], { cwd: root, stdio: 'pipe' });
    } catch {
      problems.push(`${g}: el CSS servido NO cuadra con el export (drift) — corre "npm run tokens:import"`);
    }
  }

  // 4) capas existen, no vacías, CSS estructuralmente sano
  for (const f of LAYER_FILES) {
    if (!existsSync(f)) {
      problems.push(`falta la capa ${rel(f)}`);
      continue;
    }
    const css = readFileSync(f, 'utf8');
    if (css.trim().length === 0) problems.push(`capa vacía: ${rel(f)}`);
    else if (!bracesBalanced(css)) problems.push(`capa con llaves desbalanceadas: ${rel(f)}`);
  }

  // 5) los apps cablean las capas desde FUENTE → el HMR reflejará un regen
  for (const { file, needle } of ENTRYPOINTS) {
    const p = resolve(root, file);
    if (!existsSync(p)) problems.push(`falta el entrypoint de estilo ${file}`);
    else if (!readFileSync(p, 'utf8').includes(needle))
      problems.push(`${file} ya no importa las capas de tokens → el preview no reflejaría el regen`);
  }

  return { ok: problems.length === 0, problems };
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const { ok, problems } = previewCheck();
  if (ok) {
    process.stdout.write('✓ preview:check — el pipeline de regen produce CSS válido y servible (sin navegador).\n');
    process.exit(0);
  }
  process.stdout.write('✗ preview:check — problemas:\n' + problems.map((p) => `  · ${p}`).join('\n') + '\n');
  process.exit(1);
}
