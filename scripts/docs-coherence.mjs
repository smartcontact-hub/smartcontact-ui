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
 *   D. (LOCAL-only) Cada hand-off de `docs/handoff/` LLEVA sello `HEAD `<sha>`` y ese commit
 *      EXISTE en git → un hand-off no puede mentir sobre su propio estado ni quedarse sin fechar.
 *      NO exige sello==HEAD (eso lagearía a propósito mid-sesión); solo que el SHA sea real.
 *      Se salta en CI (clone shallow → `git cat-file` daría falso positivo).
 *      Ojo al historial: antes miraba SOLO `NEXT-SESSION.md`, y cuando ese fichero pasó a ser el
 *      índice de frentes (sin sello) la comprobación se quedó en no-op silencioso durante un
 *      commit. Si vuelves a mover dónde vive el sello, mueve también este filtro.
 *
 * Uso:  node scripts/docs-coherence.mjs   (parte de `npm run verify`)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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

// Scripts PROPUESTOS en backlog: la doc los nombra como trabajo futuro (`→ scripts/X.mjs`,
// "propone crear …"), no como ficheros existentes. El checker no distingue propuesta de
// afirmación, así que se exoneran aquí (mismo patrón que DEMO_EXEMPT/NESTED_IGNORE). Cuando
// el script se cree, `existsSync` lo cubre → quítalo de esta lista.
const PROPOSED_SCRIPTS = new Set(['scripts/paths.mjs']);

// ── CHECK A — refs a comandos/scripts que deben existir ────────────────────────
for (const { path, lines } of files) {
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/npm run ([a-z][\w:-]*)/g))
      if (!scripts[m[1]]) fail(`${rel(path)}:${i + 1} — \`npm run ${m[1]}\` no existe en package.json`);
    for (const m of line.matchAll(/(scripts\/[\w./-]+\.mjs)/g))
      if (!existsSync(resolve(root, m[1])) && !PROPOSED_SCRIPTS.has(m[1]))
        fail(`${rel(path)}:${i + 1} — referencia a \`${m[1]}\` que no existe`);
  });
}

// ── CHECK B — el README nombra cada guard de la cadena verify ───────────────────
const verifySteps = (scripts.verify || '')
  .split('&&')
  .map((s) => s.trim().replace(/^npm run /, ''))
  .filter((s) => /^(tokens|audit|test|docs|i18n):/.test(s)); // los guards específicos (no build/typecheck/lint genéricos)
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
// Docs BORRADOS que la prosa no puede volver a citar como si existieran (2026-08-13, auditoría
// de documentación): `docs/history/` entero se archivó en el tag `archive/docs-history`. Antes
// esta regla vigilaba que nadie situara DECISIONS-LOG.md "en la raíz"; ya no vive en ningún
// sitio, así que ahora vigila la clase entera. Se permite nombrarlos SI la línea cita el tag
// (es la forma correcta de referirse a ellos).
const DOCS_BORRADOS = [
  'DECISIONS-LOG.md', 'DECISIONS-LOG-B.md', 'convergence-manifesto.md',
  'foundations-rationale.md', 'component-port-plan.md', 'plan-convergencia-flujos.md',
];
for (const { path, lines } of files) {
  // Un doc que EXPLICA el archivo (la auditoría, el índice) nombra el tag en alguna parte:
  // con eso el lector sabe dónde buscarlos y la cita es correcta. Se exime el fichero entero,
  // no línea a línea, porque si no una tabla de "qué se borró" sería imposible de escribir.
  if (lines.some((l) => l.includes('archive/docs-history'))) continue;
  lines.forEach((line, i) => {
    for (const doc of DOCS_BORRADOS)
      if (line.includes(doc))
        fail(
          `${rel(path)}:${i + 1} — cita \`${doc}\`, que se BORRÓ el 2026-08-13. Vive en el tag \`archive/docs-history\`; nómbralo en el doc para que el lector pueda encontrarlo.`,
        );
  });
}

// ── CHECK D — el sello del hand-off no apunta a un commit fantasma (LOCAL-only) ──
// El doc anti-pérdida-de-contexto se desfasó EN SILENCIO una vez (sello a un commit ya superado).
// Esta red NO exige sello==HEAD (mid-sesión el sello lagea a propósito hasta el cierre); solo que
// el SHA EXISTA. Se salta en CI: el clone suele ser shallow → `git cat-file` daría falso positivo
// con un sello viejo. Es la red para el HUMANO que retoma la sesión en local, su contexto natural.
if (!process.env.CI) {
  // El sello vive en el hand-off de CADA FRENTE (`docs/handoff/*.md`); `NEXT-SESSION.md` pasó a ser
  // solo el índice y ya no lleva sello. Si esta red siguiera mirando únicamente ahí, habría vuelto
  // a ser un no-op silencioso — que es exactamente el fallo que vino a tapar.
  const handoffs = files.filter((f) => rel(f.path).startsWith('docs/handoff/'));
  if (handoffs.length === 0)
    fail('docs/handoff/ no contiene ningún hand-off; cada frente abierto necesita el suyo (ver NEXT-SESSION.md).');

  const conIndice = [...handoffs, ...files.filter((f) => rel(f.path) === 'NEXT-SESSION.md')];
  for (const h of conIndice) {
    const esHandoff = rel(h.path).startsWith('docs/handoff/');
    const seen = new Set();
    let sellado = false;
    h.lines.forEach((line, i) => {
      for (const m of line.matchAll(/HEAD `([0-9a-f]{7,40})`/g)) {
        sellado = true;
        const sha = m[1];
        if (seen.has(sha)) continue;
        seen.add(sha);
        try {
          execFileSync('git', ['cat-file', '-e', sha], { cwd: root, stdio: 'ignore' });
        } catch {
          fail(`${rel(h.path)}:${i + 1} — el sello \`HEAD ${sha}\` no existe en git (¿fabricado/tecleado mal?). Un hand-off no puede apuntar a un commit fantasma.`);
        }
      }
    });
    if (esHandoff && !sellado)
      fail(`${rel(h.path)} — hand-off SIN sello. Añade \`HEAD \`<sha>\`\` en su cabecera: sin él nadie sabe a qué estado del repo describe.`);
  }
}

// ── veredicto ───────────────────────────────────────────────────────────────────
log('─'.repeat(60));
if (problems === 0) {
  log('✓ DOCS COHERENCE OK — la doc cuadra con el repo (comandos/scripts existen, verify documentado, sin tokens muertos).');
  process.exit(0);
}
log(`✗ ${problems} incoherencia(s) doc↔repo. La doc se desfasó del código; aliníala (o corrige el código).`);
process.exit(1);
