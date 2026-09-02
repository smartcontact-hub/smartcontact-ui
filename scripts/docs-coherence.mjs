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
 *   C. Referencias muertas: AGENTS.md no cita skills inexistentes; ningún doc cita uno de los 6
 *      docs de construcción borrados el 2026-08-13 sin nombrar el tag `archive/docs-history`.
 *   D. (LOCAL-only) Cada hand-off de `docs/handoff/` LLEVA sello `HEAD `<sha>`` y ese commit
 *      EXISTE en git → un hand-off no puede mentir sobre su propio estado ni quedarse sin fechar.
 *      NO exige sello==HEAD (eso lagearía a propósito mid-sesión); solo que el SHA sea real.
 *      Se salta en CI (clone shallow → `git cat-file` daría falso positivo).
 *      Ojo al historial: antes miraba SOLO `NEXT-SESSION.md`, y cuando ese fichero pasó a ser el
 *      índice de frentes (sin sello) la comprobación se quedó en no-op silencioso durante un
 *      commit. Si vuelves a mover dónde vive el sello, mueve también este filtro.
 *   E. Una CIFRA de componentes citada en prosa debe cuadrar con `docs/_component-status.json`
 *      (el manifiesto que regenera `audit:components`). Nace de dos derivas reales: el README
 *      raíz decía 49 y el del paquete "~55" mientras el conteo era 51.
 *   F. Un token `--sc-*` citado en la doc DEBE existir en `projects/**`. Un ejemplo muerto no
 *      confunde: se copia. Alcance ampliado a los README de `projects/**`, porque el primer
 *      token muerto que se le escapó vivía justo en el "canónico técnico" de tokens.
 *   G. El índice de disparadores de `LEARNINGS.md` cuadra 1:1 con sus reglas numeradas.
 *   K. `LEARNINGS.md` conserva su FORMA (`scripts/learnings-shape.mjs`): ≤200 líneas, ≤20 reglas,
 *      ≤12 líneas por regla con su `Evidencia:`, y sin sub-entradas `*Corolario*`. El tope fue prosa
 *      50 commits y el fichero se multiplicó por seis; ahora falla aquí.
 *   H. Un doc que declara "caduca el YYYY-MM-DD" y ya venció → hay que decidir, no ignorarlo.
 *   I. `DECISIONS.md` cumple el "newest first" que promete su propia cabecera.
 *   J. "el CI son N pasos" cuadra con los pasos con `name:` de `ci.yml`. Esa cifra vive en 5
 *      sitios y ya caducó una vez (decía 5 cuando eran 8).
 *   A·b. Un script citado sin `npm run`, en backticks — acotado a namespaces que existen para
 *      no generar ruido (medido: sin acotar, 75% falsos positivos).
 *
 * Uso:  node scripts/docs-coherence.mjs   (parte de `npm run verify`)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { revisarLearnings } from './learnings-shape.mjs';

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

// Los README de `projects/**` quedan FUERA del conjunto de arriba (checks A-E siguen con el
// alcance de docs:guard, que no los escanea). Pero el CHECK F —tokens muertos— sí tiene que
// verlos: el propio `projects/design-tokens/README.md`, que el índice declara "canónico
// técnico", enseñaba `--sc-text-on-danger`, que no existe (el DS lo llama `-on-error`), y el
// gate recién estrenado no lo cazó por este agujero. Un guardián con un punto ciego en el doc
// más técnico del repo no sirve de mucho.
function mdDeProyectos() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.angular'].includes(e.name)) continue;
      const p = resolve(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
    }
  };
  walk(resolve(root, 'projects'));
  return out;
}

const files = mdFiles().map((f) => ({ path: f, lines: readFileSync(f, 'utf8').split('\n') }));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const scripts = pkg.scripts || {};

// Scripts PROPUESTOS en backlog: la doc los nombra como trabajo futuro (`→ scripts/X.mjs`,
// "propone crear …"), no como ficheros existentes. El checker no distingue propuesta de
// afirmación, así que se exoneran aquí (mismo patrón que DEMO_EXEMPT/NESTED_IGNORE). Cuando
// el script se cree, `existsSync` lo cubre → quítalo de esta lista.
// Vacía desde el 2026-08-30: `scripts/paths.mjs` era el único inquilino y ya existe.
const PROPOSED_SCRIPTS = new Set([]);

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

// ── CHECK A·b — un script citado SIN el prefijo `npm run` ──────────────────────
// El check A solo casa la forma `npm run X`. Escribir `` `build:demo` `` a secas se le cuela,
// y así es como sobrevivían dos nombres fósiles (`build:demo`, renombrado a `build:docs`, y
// `migrate:check`, hoy `audit:datatables`). Yo mismo metí una claim falsa así el 2026-08-13.
//
// Acotado a NAMESPACES QUE EXISTEN (`build:`, `tokens:`, `audit:`…) y no a cualquier `x:y`.
// Medido antes de elegirlo: sin acotar daba 8 avisos, 6 de ellos basura (`display:flex`,
// `localhost:9223`, `file:line`, `probe:true`…) — 75% de ruido, que es como se enseña a
// ignorar un guardián. Con el filtro de namespace: 0 falsos positivos.
{
  const namespaces = new Set(
    Object.keys(scripts).filter((s) => s.includes(':')).map((s) => s.split(':')[0]),
  );
  for (const { path, lines } of files)
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/`([a-z][a-z0-9]*:[a-z0-9:-]+)`/g)) {
        const tok = m[1];
        if (scripts[tok] || PROPOSED_SCRIPTS.has(tok)) continue;
        if (!namespaces.has(tok.split(':')[0])) continue; // no parece un script de este repo
        fail(
          `${rel(path)}:${i + 1} — cita \`${tok}\`, que parece un script (el namespace \`${tok.split(':')[0]}:\` existe) pero no está en package.json. ¿Se renombró?`,
        );
      }
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

// ── CHECK J — "el CI son N pasos" tiene que cuadrar con ci.yml ─────────────────────
// Esa cifra está repetida en CINCO sitios (CLAUDE.md, LEARNINGS ×2, DOCS-INDEX, el hand-off) y
// es la que manda correr la cadena entera antes de pushear. Ya caducó una vez: decía "cinco
// pasos" cuando eran ocho, o sea que la regla escrita para no saltarte un paso del CI te
// mandaba saltarte los dos más nuevos. Quien añada un paso a `ci.yml` verá esto en rojo.
{
  const ci = readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf8');
  const pasos = (ci.match(/^ {6}- name:/gm) || []).length;
  const CIFRAS = { 1: 'un', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez' };
  for (const { path, lines } of files) {
    // Los AUDIT-* citan la cifra EQUIVOCADA como hallazgo ("decía 5 cuando son 8"): es su
    // trabajo. Misma exención que el CHECK E, por el mismo motivo.
    if (/^docs\/AUDIT-/.test(rel(path))) continue;
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/(\d+|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+pasos\b/gi)) {
        const tok = m[1].toLowerCase();
        const n = /^\d+$/.test(tok) ? Number(tok) : Number(Object.keys(CIFRAS).find((k) => CIFRAS[k] === tok));
        if (!n || n === pasos) continue;
        if (!/ci\.yml|del CI|el CI/i.test(line)) continue; // solo cuando habla del CI
        fail(
          `${rel(path)}:${i + 1} — dice "${m[0]}" del CI, pero \`ci.yml\` tiene ${pasos} pasos con nombre. Actualiza la cifra (o el workflow).`,
        );
      }
    });
  }
}

// ── CHECK I — DECISIONS.md promete "newest first" y tiene que cumplirlo ────────────
// Su cabecera dice "Formato DD-N, newest first". Estuvo roto desde el 2026-06-30 —los DD-21..34
// se anexaron ASCENDENTE al final— y estaba anotado como pendiente en DOCS-INDEX todo ese
// tiempo, creciendo. Un doc que declara una regla y la incumple enseña que sus reglas son
// decorativas. Los apéndices (`DD-23·b`) van pegados a su padre, no en su propio escalón.
{
  const dec = readFileSync(resolve(root, 'docs/DECISIONS.md'), 'utf8');
  const nums = [...dec.matchAll(/^## DD-(\d+)/gm)].map((m) => Number(m[1]));
  for (let i = 1; i < nums.length; i++)
    if (nums[i] > nums[i - 1]) {
      fail(
        `docs/DECISIONS.md — rompe su propio "newest first": DD-${nums[i]} va DESPUÉS de DD-${nums[i - 1]}. Mueve el bloque arriba (los apéndices \`DD-N·x\` van pegados a su DD-N).`,
      );
      break; // uno basta: el arreglo es reordenar, no ir uno a uno
    }
}

// ── CHECK H — un doc que declara su propia CADUCIDAD y ya venció ───────────────────
// Los snapshots fechados envejecen sin avisar: el mapa de producto declara "caduca el
// 2026-09-08" en DOCS-INDEX y nadie lo vigilaba. Un doc caducado es peor que ninguno — sigue
// leyéndose como vigente. Formato reconocido: `caduca el YYYY-MM-DD` (case-insensitive).
// Vencer no obliga a borrar: obliga a DECIDIR (renovar la fecha, o retirar el doc).
// Deliberadamente sensible a la fecha: es su razón de ser.
{
  const hoy = new Date().toISOString().slice(0, 10);
  for (const { path, lines } of files)
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/caduca el (\d{4}-\d{2}-\d{2})/gi))
        if (m[1] < hoy)
          fail(
            `${rel(path)}:${i + 1} — declara "caduca el ${m[1]}" y hoy es ${hoy}. Renueva la fecha si sigue vigente, o retira el doc; caducado se sigue leyendo como si valiera.`,
          );
    });
}

// ── CHECK G — el índice de disparadores de LEARNINGS cuadra con su cuerpo ──────────
// El índice existe para poder escanear las reglas sin leer 5.700 palabras. Si se desincroniza
// —una regla nueva sin fila, o una fila que apunta a una regla fundida— deja de ser un índice y
// pasa a ser una mentira corta, que es peor. Los números son identificadores citados desde
// código (`e2e/supervisor/conversations-row-gesture.spec.ts` cita "LEARNINGS #1"): no se
// renumeran, así que comparar los conjuntos es exacto.
{
  const learnings = readFileSync(resolve(root, 'LEARNINGS.md'), 'utf8');
  const cuerpo = new Set([...learnings.matchAll(/^(\d+)\. \*\*/gm)].map((m) => m[1]));
  const indice = new Set([...learnings.matchAll(/^\| \*\*(\d+)\*\* \|/gm)].map((m) => m[1]));
  for (const n of cuerpo)
    if (!indice.has(n))
      fail(`LEARNINGS.md — la regla ${n} existe pero NO está en el índice de disparadores.`);
  for (const n of indice)
    if (!cuerpo.has(n))
      fail(
        `LEARNINGS.md — el índice lista la regla ${n}, que ya no existe en el cuerpo (¿fundida en otra?). Quita su fila.`,
      );
}

// ── CHECK K — LEARNINGS conserva su forma (tope de reglas y de líneas, sin sub-entradas) ──
// El check G garantiza que índice y cuerpo cuadran; este garantiza que el cuerpo no crece por
// dentro. Los límites y los motivos viven en `scripts/learnings-shape.mjs` (con sus tests rojos).
{
  const learnings = readFileSync(resolve(root, 'LEARNINGS.md'), 'utf8');
  for (const p of revisarLearnings(learnings)) fail(`LEARNINGS.md — ${p}`);
}

// ── CHECK E — una CIFRA de componentes citada en prosa ≠ el manifiesto generado ────
// Nace de dos instancias reales cazadas por la auditoría semanal en semanas distintas:
// `README.md` decía 49 y `projects/ui-smartcontact/README.md` decía "~55" mientras
// `component-audit` contaba 51. Una cifra a mano en prosa caduca en cuanto entra un
// componente, y NADA la vigilaba: `docs:guard` valida forma y el check A de aquí solo
// mira comandos. La fuente de verdad es `docs/_component-status.json`, que regenera
// `npm run audit:components` dentro de `verify`.
//
// EXENTOS y por qué (no es pereza, es que su cifra es correcta EN SU CONTEXTO):
//   - CHANGELOG.md — congelado: documenta lo que había DENTRO de una versión publicada.
//   - los AUDIT-* — su trabajo es justamente CITAR la cifra equivocada como hallazgo.
//
// ALCANCE: docs/ + raíz **y los README de `projects/**`**, igual que el CHECK F. Hasta el
// 2026-08-14 este check se quedaba en el alcance de `docs:guard`, que NO entra en `projects/**`
// — o sea que de las dos derivas que lo motivaron (arriba) solo podía ver una, y la otra
// (`projects/ui-smartcontact/README.md`, "~55") siguió ahí ocho semanas más, abierta en la
// auditoría semanal, mientras el comentario de este bloque la citaba como caso resuelto. Un
// guardián que nombra un caso que no cubre miente dos veces: sobre el repo y sobre sí mismo.
const STATUS_PATH = resolve(root, 'docs/_component-status.json');
if (existsSync(STATUS_PATH)) {
  const real = Number(
    (JSON.parse(readFileSync(STATUS_PATH, 'utf8')).summary || '').match(/^(\d+)\s+componentes/)?.[1],
  );
  const EXENTOS = /^(CHANGELOG\.md|docs\/AUDIT-)/;
  const filesE = [
    ...files,
    ...mdDeProyectos().map((f) => ({ path: f, lines: readFileSync(f, 'utf8').split('\n') })),
  ];
  if (real) {
    for (const { path, lines } of filesE) {
      if (EXENTOS.test(rel(path))) continue;
      lines.forEach((line, i) => {
        // "51 componentes `sc-*`" / "49 wrappers/customs `sc-*`" / "~55 componentes `sc-*`"
        for (const m of line.matchAll(
          /(~?)(\d{2,3})\s+(?:componentes|components|wrappers\/customs|wrappers)\s+`?sc-/gi,
        )) {
          const citada = Number(m[2]);
          if (citada !== real)
            fail(
              `${rel(path)}:${i + 1} — cita ${m[1]}${citada} componentes \`sc-*\`, pero el manifiesto generado (docs/_component-status.json) dice ${real}. Actualiza la cifra, o quítala y enlaza a docs/inventory.md.`,
            );
        }
      });
    }
  }
}

// ── CHECK F — un token `--sc-*` citado en docs que NO existe en el código ─────────
// La auditoría de 2026-08 encontró 3 ejemplos muertos enseñándose como vivos
// (`--sc-btn-primary-bg`, retirado en S34; `--sc-modal-radius`; `--sc-text-on-danger`).
// Un doc que enseña un token inexistente es peor que uno incompleto: se copia.
// Se ignoran los patrones (`--sc-spacing-*`) y las plantillas (`--sc-cmp-<x>-<y>`).
const tokensDefinidos = new Set();
{
  const walkCss = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.git', '.angular'].includes(e.name)) continue;
      const p = resolve(dir, e.name);
      if (e.isDirectory()) walkCss(p);
      else if (/\.(css|scss|ts)$/.test(e.name))
        for (const m of readFileSync(p, 'utf8').matchAll(/(--sc-[a-z0-9-]+)\s*:/gi))
          tokensDefinidos.add(m[1]);
    }
  };
  walkCss(resolve(root, 'projects'));
}
// Tokens que la doc nombra A PROPÓSITO sin que existan: los 8-point retirados, que se citan
// justamente para prohibirlos ("no los reintroduzcas, `tokens:guard` los bloquea").
const RETIRADOS_A_PROPOSITO = new Set([
  '--sc-spacing-50', '--sc-spacing-100', '--sc-spacing-200', '--sc-space-1', '--sc-space-2',
  // GAP documentado a propósito: `customs-catalog.md` §5.11 lo describe como deuda, un token
  // semántico de lienzo que AÚN NO existe. Mismo patrón que PROPOSED_SCRIPTS: cuando se cree,
  // `tokensDefinidos` lo cubre solo → quítalo de aquí.
  '--sc-bg-canvas',
  // Token DEL CONSUMIDOR, no nuestro: `docs/tipografia.md` lo documenta justamente para avisar
  // de que su `body` NO usa nuestro `--sc-font-family-primary` sino uno propio suyo, así que
  // cambiar nuestra familia no garantiza que la suya cambie. El gate no distingue "token ajeno
  // que documento" de "token nuestro que cité mal" — y hace bien en preguntar: lo cazó el
  // 2026-09-02 cuando yo había escrito que la familia les llegaba por nuestro paquete.
  '--sc-font-family-base',
]);
if (tokensDefinidos.size > 100) {
  // guard de cordura: si el barrido no encontró tokens, es que falló — no acuses a la doc
  const familias = [...tokensDefinidos];
  const conProyectos = [
    ...files,
    ...mdDeProyectos().map((f) => ({ path: f, lines: readFileSync(f, 'utf8').split('\n') })),
  ];
  for (const { path, lines } of conProyectos) {
    if (/^docs\/AUDIT-/.test(rel(path))) continue; // reportan tokens muertos como hallazgo
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/`(--sc-[a-z0-9-]+)`/gi)) {
        const tk = m[1];
        // `--sc-color-gray-` (acabado en guion) es un PATRÓN de búsqueda en prosa, no un token.
        if (tk.includes('*') || tk.includes('<') || tk.endsWith('-')) continue;
        if (tokensDefinidos.has(tk) || RETIRADOS_A_PROPOSITO.has(tk)) continue;
        // Una FAMILIA (`--sc-scale`, `--sc-color-cyan`) es prefijo de tokens reales
        // (`--sc-scale-1`, `--sc-color-cyan-600`): es prosa sobre el conjunto, no un ejemplo muerto.
        if (familias.some((d) => d.startsWith(tk))) continue;
        fail(
          `${rel(path)}:${i + 1} — enseña el token \`${tk}\`, que no está definido en ningún \`projects/**\`. O se retiró, o está mal escrito: un ejemplo muerto en la doc se copia.`,
        );
      }
    });
  }
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
