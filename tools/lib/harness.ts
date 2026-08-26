/**
 * DETERMINISM HARNESS — las 8 reglas del protocolo, en un solo sitio.
 *
 * Ningun script de medicion abre un navegador por su cuenta: todos pasan por aqui, de
 * forma que los dos lados (original y replica) se lanzan con la MISMA configuracion y el
 * manifiesto lo demuestra.
 */
import {
  chromium,
  firefox,
  webkit,
  type Browser,
  type Page,
} from '@playwright/test';
import {
  buildManifest,
  type HarnessSettings,
  type RunManifest,
} from './manifest.ts';

export const DEFAULT_HARNESS: HarnessSettings = {
  // 1. DPR fijo a 1, sin zoom.
  deviceScaleFactor: 1,
  // 4. Matar el movimiento.
  reducedMotion: 'reduce',
  // 6. Esquema de color fijado; el modo oscuro es un ESTADO, no otra ejecucion.
  colorScheme: 'light',
  locale: 'es-ES',
  timezoneId: 'Europe/Madrid',
  // 2. Paridad de barra de scroll: se fuerza a cero en ambos lados.
  hideScrollbars: true,
  // 7. Se bloquea analitica y anuncios; los banners de consentimiento NO.
  blockedHosts: [
    'google-analytics.com',
    'googletagmanager.com',
    'doubleclick.net',
    'facebook.net',
    'hotjar.com',
    'segment.io',
    'sentry.io',
  ],
};

export type EngineName = 'chromium' | 'firefox' | 'webkit';

/** CSS inyectado para anular transiciones y animaciones (regla 4). */
const KILL_MOTION = `
  *, *::before, *::after {
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
  }
`;

export interface HarnessSession {
  readonly browser: Browser;
  readonly page: Page;
  readonly manifest: RunManifest;
  close(): Promise<void>;
}

export async function openSession(
  engine: EngineName = 'chromium',
  width = 1440,
  height = 900,
  harness: HarnessSettings = DEFAULT_HARNESS
): Promise<HarnessSession> {
  const launcher =
    engine === 'chromium' ? chromium : engine === 'firefox' ? firefox : webkit;
  const args =
    engine === 'chromium' && harness.hideScrollbars
      ? ['--hide-scrollbars']
      : [];
  const browser = await launcher.launch({ args });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: harness.deviceScaleFactor,
    reducedMotion: harness.reducedMotion,
    colorScheme: harness.colorScheme,
    locale: harness.locale,
    timezoneId: harness.timezoneId,
  });
  await context.addInitScript({
    content: `document.documentElement.dataset.scHarness = '1';`,
  });
  const page = await context.newPage();
  await page.addStyleTag({ content: KILL_MOTION }).catch(() => undefined);
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    if (harness.blockedHosts.some((b) => host.endsWith(b))) {
      return route.abort();
    }
    return route.continue();
  });

  const manifest = buildManifest(engine, browser.version(), harness);
  return {
    browser,
    page,
    manifest,
    close: () => browser.close(),
  };
}

/**
 * Regla 2 — PARIDAD DE BARRA DE SCROLL. Si los dos lados difieren, el viewport de
 * maquetacion difiere y toda medida en vw queda sesgada: es BLOQUEANTE antes de medir
 * cualquier otra cosa.
 */
export async function scrollbarWidth(page: Page): Promise<number> {
  return page.evaluate(
    () => window.innerWidth - document.documentElement.clientWidth
  );
}

/**
 * Reglas 3 y 5 — esperar a las fuentes y forzar el render completo (perezosos y
 * disparados por scroll) antes de medir nada.
 */
export async function settle(page: Page): Promise<void> {
  await page.addStyleTag({ content: KILL_MOTION }).catch(() => undefined);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}
