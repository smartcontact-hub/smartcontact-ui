#!/usr/bin/env node
/**
 * Bump de versión en LOCKSTEP de los 3 paquetes publicables + el root.
 *
 * Las versiones de GitHub Packages son INMUTABLES → cada cambio consumible es una
 * versión nueva (no se republica una existente). Los 3 paquetes se versionan juntos
 * para que sus peerDeps internos siempre cuadren.
 *
 * SEGURO POR DEFECTO: dry-run salvo `--write` (patrón de los demás scripts del repo).
 * Edición quirúrgica (regex del campo `version`) → cero reformateo del package.json.
 *
 * Uso:
 *   node scripts/version-bump.mjs 0.2.0           # dry-run (muestra el cambio)
 *   node scripts/version-bump.mjs minor           # dry-run, calcula desde la actual
 *   node scripts/version-bump.mjs 0.2.0 --write   # aplica
 *
 * Tras `--write`: edita CHANGELOG.md, commitea, y publica con
 *   GITHUB_TOKEN=… npm run publish:packages -- --publish
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const ROOT_PKG = resolve(root, 'package.json');
const PKGS = [
  'projects/design-tokens/package.json',
  'projects/ui-smartcontact-icons/package.json',
  'projects/ui-smartcontact/package.json',
].map((p) => resolve(root, p));
// peerDeps internos que se pinnean a la versión nueva (viven en components).
const INTERNAL = ['@smartcontact-hub/styles', '@smartcontact-hub/icons'];

const args = process.argv.slice(2);
const write = args.includes('--write');
const target = args.find((a) => a !== '--write');
if (!target) {
  console.error('Uso: node scripts/version-bump.mjs <x.y.z|patch|minor|major> [--write]');
  process.exit(1);
}

const current = JSON.parse(readFileSync(ROOT_PKG, 'utf8')).version;

function nextVersion(curr, t) {
  if (/^\d+\.\d+\.\d+$/.test(t)) return t;
  const [maj, min, pat] = curr.split('.').map(Number);
  if (t === 'major') return `${maj + 1}.0.0`;
  if (t === 'minor') return `${maj}.${min + 1}.0`;
  if (t === 'patch') return `${maj}.${min}.${pat + 1}`;
  console.error(`Versión/bump inválido: "${t}" (usa x.y.z | patch | minor | major)`);
  process.exit(1);
}
const next = nextVersion(current, target);

console.log(`Versión: ${current} → ${next}${write ? '' : '  (dry-run)'}`);

function bump(path) {
  let src = readFileSync(path, 'utf8');
  // Primera (y única) clave "version" de nivel paquete — las deps no la tienen.
  src = src.replace(/("version":\s*")[^"]+(")/, `$1${next}$2`);
  // peerDeps internos → misma versión (lockstep).
  for (const dep of INTERNAL) {
    src = src.replace(
      new RegExp(`("${dep.replace(/[/]/g, '\\/')}":\\s*")[^"]+(")`),
      `$1${next}$2`,
    );
  }
  console.log(`  ${path.replace(root + '/', '')}  →  ${next}`);
  if (write) writeFileSync(path, src);
}

bump(ROOT_PKG);
for (const p of PKGS) bump(p);

console.log(
  write
    ? `\n✓ Versiones a ${next}. Siguiente: edita CHANGELOG.md, commitea, y publica:\n    GITHUB_TOKEN=… npm run publish:packages -- --publish`
    : `\nDry-run. Repite con --write para aplicar.`,
);
