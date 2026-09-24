import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceDarkTheme, forceLightTheme } from '../supervisor/helpers';

/**
 * CAPTURAS DE ANTES Y DESPUÉS DEL EXPORT, PARA EL PR DEL ROBOT DE TOKENS.
 *
 * Por qué (requisito de producto, 2026-09-14): el PR del robot se revisa y se funde con un clic, y para revisar hace falta ver. Los
 * píxeles no cruzan de máquina, así que las dos tandas se hacen en el MISMO runner: el Supervisor de
 * `main` (antes) y el Supervisor con el export aplicado (después), en claro y en oscuro, a 1440.
 * Este spec solo fotografía; comparar y escribir el PR lo hace `scripts/tokens-sync-capturas.mjs`.
 *
 * No corre en la suite normal (su config es `playwright.capturas.config.ts`).
 *
 * Entrada: SC_ANTES_URL, SC_DESPUES_URL (dos servidores del Supervisor) y SC_CAPTURAS_OUT.
 */
export const RUTAS = [
  'conversaciones',
  'admin/usuarios',
  'admin/grupos',
  'admin/agentes',
  'admin/repositorios',
  'admin/horarios',
  'config/aed/servicio',
  'config/aed/agentes',
] as const;

const ANTES = process.env['SC_ANTES_URL'];
const DESPUES = process.env['SC_DESPUES_URL'];
const OUT = process.env['SC_CAPTURAS_OUT'];

const nombre = (ruta: string, tema: string, lado: string) => `${ruta.replace(/\//g, '_')}--${tema}--${lado}.png`;

async function fotografiar(page: Page, base: string, ruta: string): Promise<Buffer> {
  await page.goto(`${base}/${ruta}`, { waitUntil: 'networkidle' });
  await expect(page.locator('main#main-content')).toBeVisible();
  await disableAnimations(page);
  // Puntero fuera de la barra lateral: al pasar por encima se expande y tapa contenido.
  await page.mouse.move(1400, 20);
  await page.waitForTimeout(400);
  return page.screenshot({ animations: 'disabled', caret: 'hide' });
}

test.describe.configure({ mode: 'serial' });

for (const tema of ['claro', 'oscuro'] as const) {
  test(`capturas de antes y después · ${tema}`, async ({ browser }) => {
    test.skip(!ANTES || !DESPUES || !OUT, 'faltan SC_ANTES_URL, SC_DESPUES_URL o SC_CAPTURAS_OUT');
    test.setTimeout(240_000);
    mkdirSync(OUT!, { recursive: true });
    for (const [lado, base] of [['antes', ANTES!], ['despues', DESPUES!]] as const) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      // Hora congelada: Conversaciones pinta «Última búsqueda: hh:mm» y el control antes-contra-antes
      // salió con 31 píxeles distintos solo porque el reloj avanzó un minuto entre las dos tandas.
      await page.clock.setFixedTime(new Date('2026-09-14T10:00:00'));
      await (tema === 'oscuro' ? forceDarkTheme(page) : forceLightTheme(page));
      for (const ruta of RUTAS) {
        writeFileSync(join(OUT!, nombre(ruta, tema, lado)), await fotografiar(page, base, ruta));
      }
      await ctx.close();
    }
  });
}
