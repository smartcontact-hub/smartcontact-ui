import { test } from 'node:test';
import assert from 'node:assert/strict';

import { explain, failedTests, lastNpmScript, onlyReferenceFailures, renderMarkdown } from '../tokens-sync-rojo.mjs';

// Formas REALES de los logs (copiadas del run 34783888025 del robot, PR #144, y de `npm run verify`).
const E2E_144 = `
  1) e2e/component-structure.spec.ts:131:7 › estructura de los componentes del DS › el HTML renderizado coincide con el baseline
  2) e2e/component-styles.spec.ts:271:7 › caja y tipo de los componentes del DS › los estilos computados coinciden con el baseline
  3) e2e/components.spec.ts:133:7 › sc-button › métrica del Kit en md/sm/lg e icon-only ────────────
    Expected: "10.5px"
  12) e2e/severities-contrast.spec.ts:187:11 › severidades · tema oscuro › tag · las 6 severidades se leen
  14 failed`;
const E2E_SOLO_REFERENCIAS = `
  1) e2e/component-structure.spec.ts:131:7 › estructura de los componentes del DS › el HTML renderizado coincide con el baseline
  2) e2e/component-styles.spec.ts:271:7 › caja y tipo de los componentes del DS › los estilos computados coinciden con el baseline
  2 failed`;
const VERIFY = `
> smartcontact-ui@0.0.0 tokens:export-clean
> node scripts/check-export-clean.mjs
✓ limpio
> smartcontact-ui@0.0.0 tokens:parity
> node scripts/token-parity.mjs
✗ [light] a11y: --sc-text-secondary sobre --sc-bg-surface = 2.95:1 (< AA 4.5; #8f97a3/#ffffff)`;

test('lee el eslabón de verify que cayó: el ÚLTIMO script que anunció npm', () => {
  assert.equal(lastNpmScript(VERIFY), 'tokens:parity');
  assert.equal(lastNpmScript('sin nada'), null);
});

test('lee los tests caídos de Playwright, sin repetir y con su fichero', () => {
  const t = failedTests(E2E_144);
  assert.equal(t.length, 4);
  assert.deepEqual(t[2], { file: 'e2e/components.spec.ts', title: 'sc-button › métrica del Kit en md/sm/lg e icon-only' });
});

test('solo-referencias: verde con estructura y estilos; ROJO en cuanto cae otra cosa o no cae nada', () => {
  assert.equal(onlyReferenceFailures(E2E_SOLO_REFERENCIAS), true);
  assert.equal(onlyReferenceFailures(E2E_144), false, 'el #144 traía métricas y contraste: no se puede actualizar a ciegas');
  assert.equal(onlyReferenceFailures(''), false, 'un e2e rojo sin tests reconocibles no autoriza a regenerar nada');
});

test('explica cada fallo diciendo quién se mueve, y lo desconocido no se esconde', () => {
  const items = explain({ verifyLog: VERIFY, verifyFailed: true, e2eLog: E2E_144, e2eFailed: true });
  const md = renderMarkdown(items);
  assert.match(md, /Se arregla en Figma\.\*\* Un valor del Kit no cuadra/);
  assert.match(md, /Se arregla en código\.\*\* Un componente no pinta la medida/);
  assert.match(md, /Puede venir de Figma o del código\.\*\* Un color no pasa contraste/);
  const raro = renderMarkdown(explain({ verifyLog: '> smartcontact-ui@0.0.0 audit:inventado', verifyFailed: true }));
  assert.match(raro, /no reconoce: mira el run/);
  assert.match(raro, /audit:inventado/);
});

test('sin fallos, verde; con un paso marcado pero sin log, sigue saliendo rojo', () => {
  assert.match(renderMarkdown(explain({})), /✅ Verde/);
  assert.match(renderMarkdown(explain({ e2eFailed: true, e2eLog: '' })), /❌ Rojo[\s\S]*relanza el run/);
});

test('ceros: lo explica como cosa de Figma y nombra el token', () => {
  const md = renderMarkdown(explain({ cerosFailed: true, cerosLog: '✗ cero nuevo: aura/component/common · button.padding.x (antes 10.5)' }));
  assert.match(md, /Se arregla en Figma\.\*\* Un token que tenía medida ha pasado a 0/);
  assert.match(md, /button\.padding\.x \(antes 10\.5\)/);
});
