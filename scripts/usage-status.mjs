#!/usr/bin/env node
/**
 * usage:status — deriva la galería de uso (Fase 2.2) del CRUDO de captura. PURO,
 * SIN navegador. Es la mitad "deriva + guard" del par (la otra es la captura
 * Playwright `e2e/usage/usage-capture.spec.ts`).
 *
 * Lee:
 *   - `projects/sc-demo/public/usage/_usage-raw.json` (pantalla → todos los tags sc-*),
 *   - `docs/_component-status.json` (la pokédex: los 48 selectores DS reales).
 * Escribe el derivado `projects/sc-demo/public/usage/_usage-status.json` que lee la
 * página sc-demo:
 *   - `screens[*].ds` = tags ∩ selectores DS (descarta app-locals: sc-top-bar, sc-sidebar…),
 *   - `components`    = índice inverso DS-only (componente → [pantallas]), EXCLUYE globales,
 *   - `global`        = DS presentes en (casi) todas las pantallas (shell: command-palette,
 *                       keyboard-shortcuts) → no se listan como "usado en 18 pantallas".
 *
 * Guard `check` (en verify, sin navegador): recomputa el derivado desde el crudo+pokédex
 * committeados y FALLA si difiere del committeado (caza renombrar un componente sin
 * recapturar, índice inverso incoherente). Cruza con la pokédex: ⚠ informativo (no bloquea)
 * para usado-pero-no-capturado y visto-pero-grep-0.
 *
 * Uso:  node scripts/usage-status.mjs [--emit | --write | check]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const USAGE_DIR = resolve(root, 'projects/sc-demo/public/usage');
const RAW = resolve(USAGE_DIR, '_usage-raw.json');
const STATUS = resolve(USAGE_DIR, '_usage-status.json');
const AUDIT = resolve(root, 'docs/_component-status.json');
const log = (s = '') => process.stdout.write(s + '\n');

/** Deriva el JSON de uso del crudo + la pokédex. PURA → testeable. */
export function buildUsageStatus(raw, auditComponents) {
  const dsSelectors = auditComponents.map((c) => c.selector);
  const dsSet = new Set(dsSelectors);
  const screens = (raw.screens ?? [])
    .map((s) => ({
      id: s.id,
      route: s.route,
      label: s.label,
      shots: s.shots ?? [],
      ds: [...new Set((s.tags ?? []).filter((t) => dsSet.has(t)))].sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  // global = DS en ≥80% de las pantallas con DS (y ≥3 pantallas para declararlo).
  const counts = new Map();
  for (const s of screens) for (const t of s.ds) counts.set(t, (counts.get(t) ?? 0) + 1);
  const screensWithDs = screens.filter((s) => s.ds.length).length;
  const threshold = Math.ceil(screensWithDs * 0.8);
  const global =
    screensWithDs >= 3
      ? [...counts.entries()]
          .filter(([, c]) => c >= threshold)
          .map(([t]) => t)
          .sort()
      : [];
  const globalSet = new Set(global);

  // índice inverso DS-only, EXCLUYE globales.
  const components = {};
  for (const s of screens)
    for (const t of s.ds) {
      if (globalSet.has(t)) continue;
      (components[t] ??= []).push(s.id);
    }
  const sortedComponents = {};
  for (const k of Object.keys(components).sort())
    sortedComponents[k] = [...new Set(components[k])].sort();

  // gated = la pokédex lo marca usado pero NO aparece en ninguna pantalla capturada
  // (solo se ve tras interacción no scriptada o con datos vacíos). Para que la página
  // lo documente honestamente ("se ve en el flujo, no aislado").
  const onAnyScreen = new Set();
  for (const s of screens) for (const t of s.ds) onAnyScreen.add(t);
  const gated = auditComponents
    .filter((c) => (c.usedInSupervisor ?? 0) > 0 && !onAnyScreen.has(c.selector))
    .map((c) => ({ selector: c.selector, usedInSupervisor: c.usedInSupervisor ?? 0 }))
    .sort((a, b) => a.selector.localeCompare(b.selector));

  return {
    generated: 'usage-status.mjs',
    capturedAt: raw.capturedAt ?? null,
    viewport: raw.viewport ?? null,
    theme: raw.theme ?? null,
    dsSelectors: dsSelectors.length,
    screens,
    components: sortedComponents,
    global,
    gated,
  };
}

/** Cruza el uso con la pokédex. Devuelve líneas ⚠ (informativas, NO bloquean). PURA. */
export function crossCheckAgainstAudit(status, auditComponents) {
  const warns = [];
  const onAnyScreen = new Set();
  for (const s of status.screens) for (const t of s.ds) onAnyScreen.add(t);
  const auditUsed = new Map(auditComponents.map((c) => [c.selector, c.usedInSupervisor ?? 0]));

  for (const c of auditComponents) {
    if ((c.usedInSupervisor ?? 0) > 0 && !onAnyScreen.has(c.selector))
      warns.push(
        `⚠ ${c.selector}: la pokédex lo marca usado en Supervisor (${c.usedInSupervisor}) pero no aparece en ninguna pantalla capturada (gated o pantalla no incluida).`,
      );
  }
  for (const t of [...onAnyScreen].sort()) {
    if (auditUsed.has(t) && auditUsed.get(t) === 0)
      warns.push(
        `⚠ ${t}: aparece en una pantalla capturada pero la pokédex cuenta 0 usos (el grep del audit pudo perderlo).`,
      );
  }
  return warns;
}

function summary(status) {
  const seen = Object.keys(status.components).length + status.global.length;
  return `${status.screens.length} pantallas · ${seen}/${status.dsSelectors} componentes DS vistos en pantalla real · ${status.global.length} shell-global.`;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd =
    process.argv[2] ||
    (process.argv.includes('--write') ? '--write' : process.argv.includes('--emit') ? '--emit' : 'check');

  if (!existsSync(RAW)) {
    log('✗ Falta projects/sc-demo/public/usage/_usage-raw.json — corre `npm run usage:capture` primero.');
    process.exit(1);
  }
  if (!existsSync(AUDIT)) {
    log('✗ Falta docs/_component-status.json — corre `npm run audit:components` (--write) primero.');
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(RAW, 'utf8'));
  const audit = JSON.parse(readFileSync(AUDIT, 'utf8'));
  const status = buildUsageStatus(raw, audit.components ?? []);
  const statusTxt = JSON.stringify(status, null, 2) + '\n';
  const warns = crossCheckAgainstAudit(status, audit.components ?? []);
  const missing = [];
  for (const s of status.screens) for (const f of s.shots) if (!existsSync(resolve(USAGE_DIR, f))) missing.push(f);

  if (cmd === '--emit') {
    log(summary(status));
    for (const w of warns) log('  ' + w);
    if (missing.length) log(`  ⚠ ${missing.length} PNG referido(s) no existe(n): ${missing.join(', ')}`);
    process.exit(0);
  }

  if (cmd === '--write') {
    writeFileSync(STATUS, statusTxt);
    log(`✓ usage:status — _usage-status.json regenerado. ${summary(status)}`);
    for (const w of warns) log('  ' + w);
    process.exit(0);
  }

  // CHECK (guard). FALLA por DRIFT (el derivado se desfasó del crudo+pokédex). Lo demás INFORMA.
  let problems = 0;
  if (!existsSync(STATUS) || readFileSync(STATUS, 'utf8') !== statusTxt) {
    problems++;
    log('✗ _usage-status.json no está al día — corre `node scripts/usage-status.mjs --write` (o `npm run usage:capture`).');
  }
  for (const w of warns) log('  ' + w);
  if (missing.length) log(`  ⚠ ${missing.length} PNG referido(s) no existe(n) (informativo): ${missing.join(', ')}`);
  if (problems) {
    log(`✗ usage:check: ${problems} problema(s) de desfase.`);
    process.exit(1);
  }
  log(`✓ usage:check OK — ${summary(status)}`);
  process.exit(0);
}
