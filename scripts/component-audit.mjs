#!/usr/bin/env node
/**
 * audit:components — clasificación AUTO-generada del DS (Fase 2). La "pokédex" dev-facing.
 *
 * Recorre `projects/ui-smartcontact/src/lib/components/*` y DERIVA del CÓDIGO (no a mano):
 *   - provenance:  CUSTOM (sin import de `primeng/<x>`) vs WRAPPER. Los wrapper se sub-clasifican
 *                  STANDARD (passthrough) vs EXTENDED (CVA o API propia) por heurística +
 *                  override curado (component-audit-map.mjs, lo confirma Rafa).
 *   - primengBase: el/los módulo(s) `primeng/*` que envuelve (XxxModule).
 *   - cva / inputs: señales de "extended" (implementa ControlValueAccessor · nº de input() propios).
 *   - anidados:    otros `sc-*` en su plantilla (excluye sc-icon = primitivo).
 *   - demo:        ¿tiene página en component-pages.ts? (si no, y no está exento → ROJO).
 *   - dónde-se-usa: nº de usos del selector en `projects/supervisor` (adopción en la app real).
 *
 * Salida: manifiesto `docs/_component-status.json` + tabla regenerada en la zona @audit:components
 * de `docs/inventory.md`. Guard `check` (en verify): el manifiesto está al día + ningún componente
 * se queda sin clasificar o sin demo (salvo exentos) → la pokédex no se desfasa.
 *
 * Uso:  node scripts/component-audit.mjs [--emit | --write | check]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { rewriteRegion } from './marker-rewrite.mjs';
import { PROVENANCE_OVERRIDE, DEMO_EXEMPT, PRIMENG_UTIL, NESTED_IGNORE } from './component-audit-map.mjs';

const root = resolve(import.meta.dirname, '..');
const COMPONENTS = resolve(root, 'projects/ui-smartcontact/src/lib/components');
const SUPERVISOR = resolve(root, 'projects/supervisor/src');
const PAGES = resolve(root, 'projects/sc-demo/src/app/pages/components/component-pages.ts');
const INVENTORY = resolve(root, 'docs/inventory.md');
const MANIFEST = resolve(root, 'docs/_component-status.json');
const log = (s = '') => process.stdout.write(s + '\n');

/** Lee todo el texto de un árbol (.ts/.html) en un solo string — para contar usos del selector. */
function blob(dir) {
  let out = '';
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) out += blob(p);
    else if (/\.(ts|html)$/.test(e.name)) out += readFileSync(p, 'utf8') + '\n';
  }
  return out;
}

/** Analiza un componente. PURA respecto a los textos pasados → testeable. */
export function analyzeComponent({ name, tsText, htmlText, pagesText, supervisorBlob }) {
  const selector = (tsText.match(/selector:\s*['"]([^'"]+)['"]/) || [])[1] || `sc-${name}`;
  // primeng base: imports `from 'primeng/<x>'` con x ∉ utilidades.
  const primeng = [...tsText.matchAll(/from\s+['"]primeng\/([a-z0-9-]+)['"]/g)].map((m) => m[1]).filter((x) => !PRIMENG_UTIL.has(x));
  const provenance = primeng.length ? 'WRAPPER' : 'CUSTOM';
  const cva = /ControlValueAccessor|NG_VALUE_ACCESSOR/.test(tsText);
  const inputs = (tsText.match(/(?:^|[^.\w])input\s*[<(]/g) || []).length + (tsText.match(/@Input\(/g) || []).length;
  // sub-clasificación de wrappers: override > heurística (CVA o API propia rica).
  let kind = provenance;
  if (provenance === 'WRAPPER') {
    kind = PROVENANCE_OVERRIDE[name] ? PROVENANCE_OVERRIDE[name].toUpperCase() : cva || inputs >= 4 ? 'EXTENDED' : 'STANDARD';
  }
  const nested = [...new Set([...htmlText.matchAll(/<(sc-[a-z0-9-]+)/g)].map((m) => m[1]))]
    .filter((s) => s !== selector && !NESTED_IGNORE.has(s));
  const hasDemo = new RegExp(`path:\\s*['"]${name}['"]`).test(pagesText) || pagesText.includes(`'${selector.replace(/^sc-/, '')}'`);
  const usedInSupervisor = (supervisorBlob.match(new RegExp(`<${selector}[\\s>]`, 'g')) || []).length;
  return { name, selector, provenance, kind, primengBase: primeng.map((p) => `primeng/${p}`).join(', ') || '—', cva, inputs, nested, hasDemo, usedInSupervisor };
}

/** Recorre todos los componentes. */
export function audit() {
  const pagesText = existsSync(PAGES) ? readFileSync(PAGES, 'utf8') : '';
  const supervisorBlob = blob(SUPERVISOR);
  const rows = [];
  for (const name of readdirSync(COMPONENTS).filter((d) => statSync(resolve(COMPONENTS, d)).isDirectory()).sort()) {
    const dir = resolve(COMPONENTS, name);
    const tsFile = readdirSync(dir).find((f) => /\.component\.ts$/.test(f));
    if (!tsFile) continue; // p.ej. dynamic-dialog (solo servicio) — se cuenta como exento abajo
    const htmlFile = readdirSync(dir).find((f) => /\.component\.html$/.test(f));
    rows.push(
      analyzeComponent({
        name,
        tsText: readFileSync(resolve(dir, tsFile), 'utf8'),
        htmlText: htmlFile ? readFileSync(resolve(dir, htmlFile), 'utf8') : '',
        pagesText,
        supervisorBlob,
      }),
    );
  }
  return rows;
}

/** Tabla markdown para la zona @audit:components de inventory.md. */
function table(rows) {
  const head = '| Componente | Tipo | PrimeNG base | API propia | Anidados | Demo | Usos en Supervisor |\n|---|---|---|---|---|---|---|';
  const body = rows
    .map((r) => {
      const api = r.provenance === 'WRAPPER' ? `${r.cva ? 'CVA · ' : ''}${r.inputs} inputs` : `${r.inputs} inputs`;
      return `| \`${r.selector}\` | ${r.kind} | ${r.primengBase} | ${api} | ${r.nested.length ? r.nested.join(' ') : '—'} | ${r.hasDemo ? '✓' : '—'} | ${r.usedInSupervisor || '—'} |`;
    })
    .join('\n');
  return `${head}\n${body}`;
}

/** Resumen de conteos. */
function summary(rows) {
  const by = (k) => rows.filter((r) => r.kind === k).length;
  return `**${rows.length} componentes** · ${by('CUSTOM')} custom · ${by('STANDARD')} standard · ${by('EXTENDED')} extended · ${rows.filter((r) => r.usedInSupervisor > 0).length} usados en Supervisor.`;
}

const HEADER = '<!-- @audit:components — TABLA GENERADA por `node scripts/component-audit.mjs --write`. NO editar a mano.';
const END = '<!-- @audit:components:end -->';

// ── CLI ───────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2] || (process.argv.includes('--write') ? '--write' : process.argv.includes('--emit') ? '--emit' : 'check');
  const rows = audit();
  const manifest = JSON.stringify({ generated: 'component-audit.mjs', summary: summary(rows).replace(/\*\*/g, ''), components: rows }, null, 2) + '\n';
  const zoneBody = `${summary(rows)}\n\n${table(rows)}`;

  // problemas: componente sin demo (y no exento). provenance siempre clasifica → sin "sin clasificar".
  const noDemo = rows.filter((r) => !r.hasDemo && !DEMO_EXEMPT.has(r.name));

  if (cmd === '--emit') {
    log(zoneBody);
    log(`\n--- manifiesto: ${rows.length} componentes · sin-demo(no exentos): ${noDemo.length} ${noDemo.map((r) => r.name).join(', ')}`);
    process.exit(0);
  }

  const invTxt = readFileSync(INVENTORY, 'utf8');
  const nextInv = rewriteRegion(invTxt, '<!-- @audit:components', END, HEADER + ' -->', zoneBody);
  if (nextInv == null) {
    log('✗ Faltan los marcadores <!-- @audit:components --> … :end en docs/inventory.md.');
    process.exit(2);
  }

  if (cmd === '--write') {
    if (nextInv !== invTxt) writeFileSync(INVENTORY, nextInv);
    writeFileSync(MANIFEST, manifest);
    log(`✓ audit:components — manifiesto + tabla regenerados (${rows.length} componentes).`);
    process.exit(0);
  }

  // CHECK (guard). FALLA por DRIFT (la pokédex se desfasó del código) — su misión anti-desfase.
  // La cobertura demo se INFORMA (⚠), no bloquea: hoy 20 customs de flujo no tienen demo aislada;
  // forzarlo rojo pararía el gate. Para EXIGIR demo, mueve el componente fuera de exentos y
  // construye su página (o sube esto a fallo cuando estén todas). Decisión de Rafa.
  let problems = 0;
  if (nextInv !== invTxt) {
    problems++;
    log('✗ la tabla @audit:components de inventory.md no está al día — corre `node scripts/component-audit.mjs --write`.');
  }
  if (!existsSync(MANIFEST) || readFileSync(MANIFEST, 'utf8') !== manifest) {
    problems++;
    log('✗ docs/_component-status.json no está al día — corre `node scripts/component-audit.mjs --write`.');
  }
  if (noDemo.length) log(`  ⚠ ${noDemo.length} componente(s) sin página demo (informativo, no bloquea): ${noDemo.map((r) => r.name).join(', ')}`);
  if (problems) {
    log(`✗ audit:components: ${problems} problema(s) de desfase.`);
    process.exit(1);
  }
  log(`✓ audit:components OK — ${rows.length} componentes clasificados, manifiesto + tabla al día (${noDemo.length} sin demo, informado).`);
  process.exit(0);
}
