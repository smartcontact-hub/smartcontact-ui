#!/usr/bin/env node
/**
 * docs:guard — el `DOCS-INDEX.md` no puede pudrirse en silencio.
 *
 * Lo que la disciplina dejaba al olvido, lo hace cumplir la máquina (mismo patrón que
 * `tokens:guard`). Falla el CI si:
 *   (1) un doc del repo no está mapeado en el índice (huérfano → deuda invisible), o
 *   (2) un link relativo NO resuelve, en el índice o en cualquier otro .md (link roto).
 *
 * Uso:  node scripts/docs-guard.mjs   (parte de `npm run verify`)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const idx = readFileSync(resolve(root, 'docs/DOCS-INDEX.md'), 'utf8');
const log = (s = '') => process.stdout.write(s + '\n');
let problems = 0;
const fail = (s) => {
  problems++;
  log('  ✗ ' + s);
};

// Front door / el propio índice → no son "docs de tema", no requieren entrada.
const EXEMPT = new Set(['README.md', 'DOCS-INDEX.md']);

// (1) Todo .md del repo (docs/ recursivo + raíz, incluido .impeccable.md) está mapeado por basename.
function mdBasenames(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...mdBasenames(resolve(dir, e.name)));
    else if (e.name.endsWith('.md')) out.push(e.name);
  }
  return out;
}
const all = [
  ...mdBasenames(resolve(root, 'docs')), // incluye docs/history/
  ...readdirSync(root).filter((f) => f.endsWith('.md')),
];
// Match con FRONTERA (no substring): 'INDEX.md' NO debe colar por estar dentro de 'DOCS-INDEX.md'.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const base of new Set(all)) {
  if (EXEMPT.has(base)) continue;
  if (!new RegExp(`(?<![\\w-])${esc(base)}(?![\\w-])`).test(idx))
    fail(`'${base}' existe pero el DOCS-INDEX no lo mapea (mapéalo o bórralo).`);
}

// (2) Todo link relativo del índice resuelve.
for (const link of new Set([...idx.matchAll(/\]\((\.\.?\/[^)\s#]+)/g)].map((m) => m[1]))) {
  if (!existsSync(resolve(root, 'docs', link))) fail(`link roto en DOCS-INDEX: ${link}`);
}

// (3) Todo link relativo de CUALQUIER doc resuelve — no solo los del índice.
// El censo de 2026-08 encontró 9 enlaces rotos y NINGUNO estaba en DOCS-INDEX: vivían en
// docs/history, inventory, migration-safety y un playbook. La comprobación existía y miraba
// un solo fichero, así que el resto se pudrió sin que nada chistara. Ahora barre todos los
// `.md` de `docs/` (recursivo) y de la raíz, cada uno resolviendo desde SU carpeta.
function mdPaths(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) mdPaths(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}
const todos = [
  ...mdPaths(resolve(root, 'docs')),
  ...readdirSync(root)
    .filter((f) => f.endsWith('.md'))
    .map((f) => resolve(root, f)),
];
for (const file of todos) {
  const dir = resolve(file, '..');
  const txt = readFileSync(file, 'utf8');
  txt.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\]\(([^)\s]+)\)/g)) {
      const href = m[1].split('#')[0];
      if (!href || /^(https?:|mailto:|#)/.test(href)) continue;
      const target = href.startsWith('/') ? resolve(root, href.slice(1)) : resolve(dir, href);
      if (!existsSync(target))
        fail(`${file.replace(`${root}/`, '')}:${i + 1} — link roto: ${href}`);
    }
  });
}

log('─'.repeat(60));
if (problems === 0) {
  log('✓ DOCS OK — todo doc mapeado + TODOS los links relativos resuelven (una fuente por tema).');
  process.exit(0);
}
log(`✗ ${problems} problema(s) de documentación. El DOCS-INDEX es el juez anti-duplicación.`);
process.exit(1);
