#!/usr/bin/env node
/**
 * docs:coherence — la doc no puede DESFASARSE del repo en silencio.
 *
 * Hermano de `docs:guard` (que vela la FORMA: todo .md en el índice + links que resuelven).
 * Este mira el CONTENIDO contra la realidad del repo — la laguna por la que se colaron 21
 * incongruencias en el audit del 2026-06-18. Mismo patrón "máquina, no fuerza de voluntad"
 * que tokens:guard/docs:guard. NO son sesiones manuales de alineamiento: el drift falla el CI
 * en el commit que lo introduce, cuando arreglarlo cuesta una línea.
 *
 * Checks (deterministas, bajo ruido — a propósito NO se intenta cazar drift conceptual difuso):
 *   A. Toda referencia a un comando `npm run X` o a un `scripts/*.mjs` en la doc DEBE existir.
 *   B. El README nombra CADA guard de la cadena `verify` (tokens:* / audit:* / test:unit /
 *      docs:*): es la fuente única de la composición del gate; si se añade un paso y no se
 *      documenta, falla.
 *   C. Tokens muertos: AGENTS.md no cita skills inexistentes; ningún doc sitúa DECISIONS-LOG.md
 *      en la "raíz" (vive en docs/history/).
 *
 * Uso:  node scripts/docs-coherence.mjs   (parte de `npm run verify`)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const rel = (p) => p.replace(`${root}/`, '');
const log = (s = '') => process.stdout.write(s + '\n');
let problems = 0;
const fail = (s) => {
  problems++;
  log('  ✗ ' + s);
};

// Conjunto de docs: .md de la raíz (incl. .impeccable.md) + docs/ recursivo (mismo alcance que docs:guard).
function mdFiles() {
  const out = [];
  for (const e of readdirSync(root, { withFileTypes: true }))
    if (e.isFile() && e.name.endsWith('.md')) out.push(resolve(root, e.name));
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = resolve(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
    }
  };
  walk(resolve(root, 'docs'));
  return out;
}

const files = mdFiles().map((f) => ({ path: f, lines: readFileSync(f, 'utf8').split('\n') }));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const scripts = pkg.scripts || {};

// ── CHECK A — refs a comandos/scripts que deben existir ────────────────────────
for (const { path, lines } of files) {
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/npm run ([a-z][\w:-]*)/g))
      if (!scripts[m[1]]) fail(`${rel(path)}:${i + 1} — \`npm run ${m[1]}\` no existe en package.json`);
    for (const m of line.matchAll(/(scripts\/[\w./-]+\.mjs)/g))
      if (!existsSync(resolve(root, m[1]))) fail(`${rel(path)}:${i + 1} — referencia a \`${m[1]}\` que no existe`);
  });
}

// ── CHECK B — el README nombra cada guard de la cadena verify ───────────────────
const verifySteps = (scripts.verify || '')
  .split('&&')
  .map((s) => s.trim().replace(/^npm run /, ''))
  .filter((s) => /^(tokens|audit|test|docs):/.test(s)); // los guards específicos (no build/typecheck/lint genéricos)
const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
for (const step of verifySteps)
  if (!readme.includes(step))
    fail(`README.md no nombra el guard \`${step}\` de la cadena verify (el README es la fuente única de su composición)`);

// ── CHECK C — tokens muertos ────────────────────────────────────────────────────
const skillsDir = resolve(root, '.agents/skills');
const SKILLS = existsSync(skillsDir) ? readdirSync(skillsDir) : [];
const agents = files.find((f) => rel(f.path) === 'AGENTS.md');
if (agents) {
  agents.lines.forEach((line, i) => {
    for (const dead of ['workspace-sync', 'docs-generator'])
      if (line.includes(dead))
        fail(`AGENTS.md:${i + 1} — cita la skill inexistente \`${dead}\` (las reales: ${SKILLS.join(', ') || '—'})`);
  });
}
for (const { path, lines } of files)
  lines.forEach((line, i) => {
    if (/DECISIONS-LOG\.md[^\n]{0,40}?ra[íi]z/i.test(line))
      fail(`${rel(path)}:${i + 1} — sitúa DECISIONS-LOG.md en la "raíz"; vive en docs/history/`);
  });

// ── veredicto ───────────────────────────────────────────────────────────────────
log('─'.repeat(60));
if (problems === 0) {
  log('✓ DOCS COHERENCE OK — la doc cuadra con el repo (comandos/scripts existen, verify documentado, sin tokens muertos).');
  process.exit(0);
}
log(`✗ ${problems} incoherencia(s) doc↔repo. La doc se desfasó del código; aliníala (o corrige el código).`);
process.exit(1);
