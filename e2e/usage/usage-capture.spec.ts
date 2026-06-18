import { test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { USAGE_SCREENS, type UsageScreen, type UsageState } from './screens.manifest';

/**
 * Captura de la galería de uso real (Fase 2.2). Por cada pantalla del manifiesto:
 *  1. navega el Supervisor (hash route, sin backend — datos de los SEED),
 *  2. por cada estado (base + interacciones): escanea el DOM por tags `sc-*`
 *     (VERDAD DE CAMPO) y guarda un PNG,
 *  3. acumula y escribe el CRUDO `_usage-raw.json`.
 *
 * `scripts/usage-status.mjs` (puro, sin navegador) deriva de ese crudo el JSON que
 * lee la página sc-demo, intersectando con los 48 selectores DS de la pokédex.
 *
 * Determinismo: storage limpio (re-siembra de SEED) · tema claro antes del paint ·
 * animaciones off · fuentes/iconos listos. No es una suite de aserciones: es un
 * GENERADOR de artefactos (como los baselines de screenshot) — corre vía
 * `npm run usage:capture`, nunca en `verify`.
 */

const OUT_DIR = resolve(process.cwd(), 'projects/sc-demo/public/usage');
const VIEWPORT = '1440x900';

interface CapturedScreen {
  id: string;
  route: string;
  label: string;
  shots: string[];
  tags: string[];
  error?: string;
}

const captured: CapturedScreen[] = [];

// Storage vacío en cada test → cada store re-siembra de sus SEED canónicos
// (esquiva el wipe por versionKey y cualquier estado de un run anterior).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ context }) => {
  // Tema claro ANTES del primer paint: el ThemeService lee el persistido en su
  // constructor; sin esto, `system` seguiría el prefers-color-scheme de la máquina.
  await context.addInitScript(() => {
    try {
      localStorage.setItem('sc-theme', 'light');
    } catch {
      /* contexto sin storage — ignorar */
    }
  });
});

/** Todos los tags `<sc-*>` presentes en el DOM (incluye overlays de PrimeNG/CDK). */
const scanScTags = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    [
      ...new Set(
        [...document.querySelectorAll('*')]
          .map((el) => el.tagName.toLowerCase())
          .filter((t) => t.startsWith('sc-')),
      ),
    ].sort(),
  );

/** Deja la pantalla quieta y lista para fotografiar. */
const settle = async (page: Page, screen: UsageScreen): Promise<void> => {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  const ready = screen.readySelector ?? '.page';
  const ok = await page
    .waitForSelector(ready, { state: 'visible', timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) {
    await page
      .waitForSelector('main#main-content', { state: 'visible', timeout: 8000 })
      .catch(() => undefined);
  }
  // Matar animaciones y view-transitions para una foto estable.
  await page
    .addStyleTag({
      content: `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;}
::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important;}`,
    })
    .catch(() => undefined);
  await page.evaluate(() => (document as Document).fonts?.ready).catch(() => undefined);
  await page.waitForTimeout(350);
};

for (const screen of USAGE_SCREENS) {
  test(`captura ${screen.id}`, async ({ page }) => {
    const rec: CapturedScreen = {
      id: screen.id,
      route: screen.route,
      label: screen.label,
      shots: [],
      tags: [],
    };
    const tagSet = new Set<string>();
    try {
      await page.goto(`/${screen.route}`); // Supervisor usa routing por PATH (no hash)
      await settle(page, screen);

      // Estado base (implícito) + estados de interacción del manifiesto.
      const states: readonly UsageState[] = [{}, ...(screen.states ?? [])];
      for (const state of states) {
        if (state.action) {
          try {
            await state.action(page);
            await page.waitForTimeout(250);
          } catch {
            // Best-effort: si el selector se movió, saltamos el estado sin romper.
            process.stdout.write(`  ⚠ ${screen.id}: acción "${state.name}" falló — estado saltado.\n`);
            continue;
          }
        }
        for (const t of await scanScTags(page)) tagSet.add(t);
        const file = state.name ? `${screen.id}-${state.name}.png` : `${screen.id}.png`;
        await page.screenshot({ path: resolve(OUT_DIR, file), fullPage: true });
        rec.shots.push(file);
      }
      rec.tags = [...tagSet].sort();
    } catch (err) {
      rec.error = err instanceof Error ? err.message : String(err);
      process.stdout.write(`  ✗ ${screen.id}: ${rec.error}\n`);
    }
    captured.push(rec);
  });
}

test.afterAll(() => {
  mkdirSync(OUT_DIR, { recursive: true });
  // Orden estable por id → diffs deterministas.
  captured.sort((a, b) => a.id.localeCompare(b.id));
  const raw = {
    generated: 'usage-capture.spec.ts',
    capturedAt: new Date().toISOString().slice(0, 10), // date-only: no ensucia el diff
    viewport: VIEWPORT,
    theme: 'light',
    screens: captured,
  };
  writeFileSync(resolve(OUT_DIR, '_usage-raw.json'), JSON.stringify(raw, null, 2) + '\n');
  process.stdout.write(`\n✓ usage-capture: ${captured.length} pantallas → projects/sc-demo/public/usage/_usage-raw.json\n`);
});
