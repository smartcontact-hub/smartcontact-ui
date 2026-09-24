import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LAS FICHAS DE USUARIO Y AGENTE — la forma de la de grupo, «una página + pestañas».
 *
 * Nace el 2026-09-23, el día que las dos dejaron el índice lateral y la caja de sección (la caja no
 * aportaba jerarquía). Al cambiar de forma salieron de `page-anatomy` y de
 * `form-section-nav-legibility`, que medían el índice; sin esto se quedaban sin red propia.
 *
 * Fija lo que define la forma, no el adorno:
 *   1. El nombre es el único `h1` de la página, y es el mismo que el del campo de Identidad.
 *   2. UNA tira de pestañas gobierna el contenido: una sección pintada a la vez, sin índice ni caja.
 *   3. Se abre por donde se trabaja al editar (Acceso · Grupos asignados) y por Identidad al crear.
 *   4. Las tres fichas (grupo, usuario, agente) comparten la cabecera: el título en la misma
 *      vertical y la misma distancia hasta la tira, porque sus estilos viven en UN sitio
 *      (`.ficha-tabs` en `_page.scss`). Si una se desvía, es que alguien los ha re-declarado.
 *   5. Ninguna pestaña recorta su rótulo, en ningún idioma: es lo que antes medía
 *      `form-section-nav-legibility` sobre el índice.
 * Y «Valores por defecto» va sin caja: su título es el `h1` visible de la página (DD-33).
 */

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const FICHAS = [
  {
    nombre: 'usuario',
    editar: 'admin/usuarios/editar/1',
    crear: 'admin/usuarios/crear',
    prefijo: 'user-section-',
    pestañas: 3,
    abreAlEditar: 'Acceso',
    identidad: 'Identidad',
    campoNombre: '#user-name',
  },
  {
    nombre: 'agente',
    editar: 'admin/agentes/editar/1',
    crear: 'admin/agentes/crear',
    prefijo: 'agent-section-',
    pestañas: 5,
    abreAlEditar: 'Grupos asignados',
    identidad: 'Identidad',
    campoNombre: '#agent-name',
  },
] as const;

for (const f of FICHAS) {
  test(`${f.nombre} · el nombre es el único h1 y la tira gobierna la ficha`, async ({ page }) => {
    await goto(page, f.editar);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveClass(/headline__name/);
    const nombre = (await h1.textContent())?.trim() ?? '';
    expect(nombre.length).toBeGreaterThan(0);

    await expect(page.locator('[role="tab"]')).toHaveCount(f.pestañas);
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText(f.abreAlEditar);
    await expect(page.locator(`[id^="${f.prefijo}"]`)).toHaveCount(1);

    // Ni índice ni caja: si vuelve uno de los dos, la forma se ha revertido a medias.
    await expect(page.locator('.page__rail')).toHaveCount(0);
    await expect(page.locator('sc-form-section-nav')).toHaveCount(0);
    await expect(page.locator('sc-section-card')).toHaveCount(0);

    // El título es el nombre de verdad: el mismo que se edita en Identidad.
    await page.locator('[role="tab"]', { hasText: f.identidad }).click();
    await expect(page.locator(`[id^="${f.prefijo}"]`)).toHaveCount(1);
    await expect(page.locator(`${f.campoNombre} input, input${f.campoNombre}`).first()).toHaveValue(nombre);
  });

  test(`${f.nombre} · al crear abre por ${f.identidad}`, async ({ page }) => {
    await goto(page, f.crear);
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText(f.identidad);
    await expect(page.locator('.headline')).toHaveCount(0);
  });
}

// Las tres fichas dicen lo mismo en el mismo sitio: al editar, la pestaña de trabajo, luego
// «Identidad» (no «Identificación» en una y «Identidad» en otra), y «Avanzado», si lo hay, al final.
test('las tres fichas ordenan igual sus pestañas al editar', async ({ page }) => {
  for (const ruta of ['admin/grupos/editar/1', 'admin/usuarios/editar/1', 'admin/agentes/editar/1']) {
    await goto(page, ruta);
    const nombres = (await page.locator('[role="tab"]').allTextContents()).map((t) => t.trim());
    expect(nombres[1], ruta).toBe('Identidad');
    if (nombres.includes('Avanzado')) expect(nombres.at(-1), ruta).toBe('Avanzado');
  }
});

// «email · tipo» no cabía en los 252 de la columna y se cortaba; el tipo pasó a ser una cifra.
test('usuario · la línea bajo el nombre se lee entera', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/usuarios/editar/1');
  const meta = page.locator('.headline__meta');
  const cortada = await meta.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(cortada).toBe(false);
  await expect(page.locator('.headline__label').first()).toHaveText('Tipo');
});

test('las tres fichas tienen «Eliminar» en su franja', async ({ page }) => {
  for (const ruta of ['admin/grupos/editar/1', 'admin/usuarios/editar/1', 'admin/agentes/editar/1']) {
    await goto(page, ruta);
    await expect(page.locator('.headline__actions').getByRole('button', { name: 'Eliminar' }), ruta).toBeVisible();
  }
});

/** Dónde arranca el título y cuánto aire hay del último texto de la franja al de la pestaña. */
const cabecera = (page: Page) =>
  page.evaluate(() => {
    const caja = (el: Element) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return r.getBoundingClientRect();
    };
    const head = document.querySelector('.headline') as HTMLElement;
    const textos = [...head.querySelectorAll('h1, .headline__meta, dt, dd')].map((e) => caja(e).bottom);
    const tab = document.querySelector('[role="tab"]') as HTMLElement;
    return {
      x: Math.round((document.querySelector('h1') as HTMLElement).getBoundingClientRect().left),
      aire: Math.round(caja(tab).top - Math.max(...textos)),
    };
  });

test('las tres fichas comparten la cabecera: misma vertical y misma distancia a la tira', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const medidas: Record<string, { x: number; aire: number }> = {};
  for (const [nombre, ruta] of [
    ['grupo', 'admin/grupos/editar/1'],
    ['usuario', 'admin/usuarios/editar/1'],
    ['agente', 'admin/agentes/editar/1'],
  ]) {
    await goto(page, ruta);
    await expect(page.locator('.headline')).toBeVisible();
    medidas[nombre] = await cabecera(page);
  }
  const { grupo, usuario, agente } = medidas;
  // 25 medido el 2026-09-23 (de 63,5 que había en la de grupo antes de apretarla, #237).
  expect(grupo.aire, JSON.stringify(medidas)).toBeLessThanOrEqual(30);
  for (const m of [usuario, agente]) {
    expect(Math.abs(m.x - grupo.x), JSON.stringify(medidas)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.aire - grupo.aire), JSON.stringify(medidas)).toBeLessThanOrEqual(1);
  }
});

for (const idioma of ['es', 'en', 'fr', 'pt'] as const) {
  test(`ninguna pestaña de las tres fichas recorta su rótulo (${idioma})`, async ({ page }) => {
    await page.addInitScript((lang) => {
      try {
        localStorage.setItem('sc-language', lang);
      } catch {
        /* contexto sin storage */
      }
    }, idioma);
    const recortadas: string[] = [];
    let medidas = 0;
    for (const ruta of ['admin/grupos/editar/1', 'admin/usuarios/editar/1', 'admin/agentes/editar/1']) {
      await goto(page, ruta);
      await expect(page.locator('[role="tab"]').first()).toBeVisible();
      const tabs = await page.locator('[role="tab"]').evaluateAll((els) =>
        els.map((el) => ({ texto: el.textContent?.trim() ?? '', pide: el.scrollWidth, tiene: el.clientWidth, alto: el.getBoundingClientRect().height })),
      );
      for (const t of tabs) {
        medidas += 1;
        if (t.pide > t.tiene) recortadas.push(`${ruta} · «${t.texto}» — ${t.tiene}px, pide ${t.pide}px`);
      }
      // Todas a la misma altura: una que parte su rótulo en dos líneas crece y se ve.
      const altos = new Set(tabs.map((t) => Math.round(t.alto)));
      if (altos.size > 1) recortadas.push(`${ruta} · pestañas a alturas distintas: ${[...altos].join(', ')}`);
    }
    // 5 + 3 + 5: un verde con 0 medidas sería un selector que dejó de casar.
    expect(medidas).toBe(13);
    expect(recortadas, recortadas.join('\n')).toEqual([]);
  });
}

test('valores por defecto va sin caja, con su título como h1 visible', async ({ page }) => {
  await goto(page, 'admin/grupos/valores-por-defecto');
  await expect(page.locator('sc-section-card')).toHaveCount(0);
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toBeVisible();
  await expect(h1).toHaveText('Valores por defecto');
});
