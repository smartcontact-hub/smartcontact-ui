import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LAS AYUDAS DE LAS FICHAS, CORTAS: SIN PALABRAS SUELTAS NI TRES LÍNEAS (DD-173).
 *
 * Medido el 2026-10-05 a 1440, en las tres fichas: 13 ayudas pasaban a dos o tres líneas, y tres dejaban una sola
 * palabra en la última («llama.», «agentes.», «Añadir.»). Una ayuda dice lo que dicen las fuentes (DD-133), con las
 * palabras justas: lo que obliga a otra línea por una palabra se dice más corto. Lo que fija:
 *   1. En Distribución y colas, el tiempo que suena en un agente se llama «Tiempo de ringing», y su ayuda dice que es
 *      el máximo para entregar la conversación a otro agente.
 *   2. Ninguna ayuda de las tres fichas, a 1440, pasa de dos líneas ni deja una sola palabra en la última.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Lo que es una ayuda en las fichas: bajo un campo, un interruptor, una sección o un bloque. */
const AYUDAS =
  '.sc-field__msg, .field__help, .switch-field__hint, .sc-slot__hint, .sc-subsection__hint, .sub-section__hint, .section-card__hint, .channel-note, .setting-row__hint, .field__hint';

/** Cada ayuda a la vista: cuántas líneas ocupa y cuántas palabras empiezan en la última. */
const medirAyudas = (page: Page) =>
  page.evaluate((sel) => {
    return [...document.querySelectorAll<HTMLElement>(`.page__main :is(${sel})`)]
      .filter((e) => e.offsetParent && e.textContent!.trim().length > 0)
      .map((e) => {
        const rango = document.createRange();
        rango.selectNodeContents(e);
        const tops = [...new Set([...rango.getClientRects()].map((b) => Math.round(b.top)))];
        const ultima = tops[tops.length - 1];
        let palabras = 0;
        const paseo = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
        for (let n = paseo.nextNode(); n; n = paseo.nextNode()) {
          for (const m of n.textContent!.matchAll(/\S+/g)) {
            const r = document.createRange();
            r.setStart(n, m.index!);
            r.setEnd(n, m.index! + 1);
            if (Math.round(r.getBoundingClientRect().top) === ultima) palabras++;
          }
        }
        return { lineas: tops.length, ultima: palabras, texto: e.textContent!.trim() };
      });
  }, AYUDAS);

test('Distribución y colas · «Tiempo de ringing», con su ayuda: a otro agente', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const campo = page.locator('label[for="group-phone-transfer"]');
  await expect(campo).toHaveText('Tiempo de ringing');
  await expect(page.locator('#group-phone-transfer').locator('xpath=ancestor::sc-select[1]')).toContainText('a otro agente');
});

for (const base of ['admin/grupos/editar/11', 'admin/grupos/crear', 'admin/agentes/editar/1', 'admin/usuarios/editar/1']) {
  test(`${base} · ninguna ayuda pasa de dos líneas ni deja una palabra sola`, async ({ page }) => {
    await goto(page, base);
    const secciones = await page
      .locator('.page__rail sc-form-section-nav a')
      .evaluateAll((as) => as.map((a) => new URL(a.getAttribute('href') ?? '', 'http://x').searchParams.get('seccion') ?? ''));
    const mal: string[] = [];
    for (const seccion of secciones) {
      await goto(page, `${base}${seccion ? `?seccion=${seccion}` : ''}`);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      for (const a of await medirAyudas(page)) {
        if (a.lineas > 2 || (a.lineas > 1 && a.ultima < 2)) mal.push(`${seccion || 'general'}: ${a.lineas} líneas, ${a.ultima} en la última · «${a.texto}»`);
      }
    }
    expect(mal, 'las ayudas que se alargan de más').toEqual([]);
  });
}
