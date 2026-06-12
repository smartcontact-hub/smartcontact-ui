#!/usr/bin/env node
/**
 * Empaqueta una o varias libs ya compiladas (`dist/<proj>`) como tarball npm en
 * `dist/archives/`. Sustituye los `export:*` originales basados en PowerShell
 * (`New-Item … | npm pack`) por Node puro — portable a CI Linux/macOS/Windows.
 *
 * Uso: node scripts/export-package.mjs <proyecto> [<proyecto> …]
 *      (proyecto = nombre de carpeta bajo dist/, p. ej. design-tokens)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const archives = resolve(root, 'dist/archives');
const projects = process.argv.slice(2);

if (projects.length === 0) {
  console.error('Uso: node scripts/export-package.mjs <proyecto> [<proyecto> …]');
  process.exit(2);
}

mkdirSync(archives, { recursive: true });

for (const project of projects) {
  const dist = resolve(root, 'dist', project);
  if (!existsSync(dist)) {
    console.error(`✗ No existe ${dist} — compila primero (npm run build:*).`);
    process.exit(1);
  }
  execFileSync('npm', ['pack', dist, '--pack-destination', archives], {
    cwd: root,
    stdio: 'inherit',
  });
}
console.log(`✓ Tarball(s) en dist/archives/: ${projects.join(', ')}`);
