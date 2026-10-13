import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

import { OPCIONES_AXE, contarFallos, resumirViolaciones } from '../projects/sc-docs/src/app/storybook/a11y.core.mjs';
import { SC_DEMO_COMPONENT_PAGES } from '../projects/sc-docs/src/app/pages/components/component-pages';

/**
 * LA ACCESIBILIDAD DE CADA STORY DE SC-DOCS, VIGILADA.
 *
 * Cada lienzo de sc-docs enseña sus fallos de axe en la barra (`story-canvas.component.ts`). Eso ayuda a quien mira la
 * ficha, pero no impide que entre uno nuevo: nadie abre las 56 fichas antes de fundir. Esto sí. Pasa axe, con las
 * MISMAS reglas que el panel (`a11y.core.mjs`, WCAG 2.2 A y AA), por el lienzo de cada story de cada ficha, en claro.
 *
 * Es un TRINQUETE, como `audit:text-styles`: el tope por story y por regla está en `e2e/baselines/a11y.json`, y el
 * número solo puede bajar. Un fallo NUEVO pone esto en rojo con su regla, su story y el elemento. Uno que DESAPARECE
 * también, para que el tope baje en el mismo cambio que lo arregla: un tope holgado deja volver lo que ya salió.
 *
 * Actualizar tras un cambio deliberado (o tras arreglar fallos):
 *   SC_UPDATE_A11Y=1 npx playwright test sc-docs-a11y
 * y revisa el diff del JSON: ahí se ve qué entra y qué sale.
 *
 * Lo que NO mira: «Todas las combinaciones» (está plegada; cada casilla es el Playground con otros valores), los anchos
 * fijos (van en iframe) y el tema oscuro. axe tampoco ve el orden del foco ni lo que anuncia un lector: eso, a mano.
 */

const BASELINE = join(process.cwd(), 'e2e', 'baselines', 'a11y.json');
const AXE = join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js');
const ACTUALIZAR = process.env['SC_UPDATE_A11Y'] === '1';

/** página → story → regla → elementos que la fallan. */
type Tope = Record<string, Record<string, Record<string, number>>>;

test('accesibilidad: ninguna story de sc-docs suma un fallo de axe que no estuviera ya', async ({ page }) => {
  test.setTimeout(15 * 60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const tope: Tope = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {};
  const medido: Tope = {};
  const detalle: Record<string, string> = {};
  let revisadas = 0;

  for (const { path: pagina } of SC_DEMO_COMPONENT_PAGES) {
    await page.goto(`/#/components/${pagina}`);
    // Una story con su lienzo: las stories llegan juntas (`stories()` es un computed de todas las plantillas). No se
    // espera a la tabla de API: una ficha sin propiedades (confirmdialog) no la pinta.
    await page.locator('section.sb-host__story[id^="historia-"] .sb-canvas__stage').first().waitFor({ timeout: 30_000 });
    // Acotada y sin `throw`: es de conveniencia (AGENTS, «networkidle sin acotar puede tumbar el CI»).
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({ path: AXE });

    const pasar = (): Promise<Record<string, unknown[]>> => page.evaluate(async (opciones) => {
      const axe = (window as unknown as { axe: { run: (c: Element, o: unknown) => Promise<{ violations: unknown[] }> } }).axe;
      const fuera: Record<string, unknown[]> = {};
      const secciones = [...document.querySelectorAll<HTMLElement>('section.sb-host__story[id^="historia-"]')].filter(
        (s) => s.id !== 'historia-combinaciones',
      );
      // Se busca el lienzo JUSTO antes de pasarle axe, por su id y no por la referencia de antes: con la máquina cargada
      // (el CI, varias pruebas a la vez) un lienzo puede repintarse entre medias, y axe lanza «No elements found» sobre
      // el nodo viejo. Medido el 2026-10-13 con cuatro pruebas en paralelo. Un reintento, no un bucle.
      const lienzo = (id: string): Element | null => document.getElementById(id)?.querySelector('.sb-canvas__stage') ?? null;
      for (const { id } of secciones) {
        if (!lienzo(id)) continue;
        let res: { violations: unknown[] };
        try {
          res = await axe.run(lienzo(id)!, opciones);
        } catch {
          await new Promise((r) => setTimeout(r, 500));
          const otra = lienzo(id);
          if (!otra) continue;
          res = await axe.run(otra, opciones);
        }
        fuera[id.replace(/^historia-/, '')] = res.violations;
      }
      return fuera;
    }, OPCIONES_AXE);

    let porStory = await pasar();
    // Por DEBAJO del tope, una segunda pasada antes de creérselo, y de cada story se queda la que más cuenta. Medido el
    // 2026-10-13 contra `ng serve`: una pasada leyó 0 en las cuatro stories de `gauge` (tope 7) y la siguiente, 7. Un
    // arreglo de verdad sale igual en las dos; un lienzo a medio pintar, no.
    const fallos = (r: Record<string, unknown[]>): number =>
      Object.values(r).reduce((n, v) => n + contarFallos(resumirViolaciones(v)), 0);
    const delTope = Object.values(tope[pagina] ?? {}).reduce(
      (n, reglas) => n + Object.values(reglas).reduce((a, b) => a + b, 0),
      0,
    );
    if (!ACTUALIZAR && fallos(porStory) < delTope) {
      await page.waitForTimeout(1_500);
      const otra = await pasar();
      for (const [story, v] of Object.entries(otra)) {
        if (fallos({ [story]: v }) > fallos({ [story]: porStory[story] ?? [] })) porStory = { ...porStory, [story]: v };
      }
    }

    expect(Object.keys(porStory).length, `${pagina}: ninguna story con lienzo, ¿cambió la ficha?`).toBeGreaterThan(0);
    revisadas += Object.keys(porStory).length;

    for (const [story, violations] of Object.entries(porStory)) {
      const resumen = resumirViolaciones(violations);
      if (!contarFallos(resumen)) continue;
      for (const v of resumen) {
        ((medido[pagina] ??= {})[story] ??= {})[v.regla] = v.nodos.length;
        detalle[`${pagina}/${story}/${v.regla}`] =
          `${v.ayuda} (${v.impacto}) en ${v.nodos.map((n) => n.selector).join(', ')}`;
      }
    }
  }

  // Lo que se ha revisado, a la vista en el informe: un recuento que baja de golpe es una ficha que dejó de pintarse.
  test.info().annotations.push({
    type: 'revisado',
    description: `${revisadas} stories en ${SC_DEMO_COMPONENT_PAGES.length} fichas`,
  });
  console.log(`sc-docs-a11y: ${revisadas} stories en ${SC_DEMO_COMPONENT_PAGES.length} fichas`);

  if (ACTUALIZAR) {
    writeFileSync(BASELINE, JSON.stringify(ordenar(medido), null, 2) + '\n');
    return;
  }

  const nuevos: string[] = [];
  const arreglados: string[] = [];
  const claves = new Set([...aplanar(medido).keys(), ...aplanar(tope).keys()]);
  const m = aplanar(medido);
  const t = aplanar(tope);
  for (const k of [...claves].sort()) {
    const ahora = m.get(k) ?? 0;
    const antes = t.get(k) ?? 0;
    if (ahora > antes) nuevos.push(`  ✘ ${k}: ${antes} → ${ahora}. ${detalle[k] ?? ''}`);
    else if (ahora < antes) arreglados.push(`  ✔ ${k}: ${antes} → ${ahora}`);
  }

  expect(
    nuevos,
    `Fallos de accesibilidad NUEVOS en sc-docs (regla de axe, story y elemento). Arréglalos; si de verdad no lo son, ` +
      `actualiza el tope con SC_UPDATE_A11Y=1 y explícalo en el PR:\n${nuevos.join('\n')}`,
  ).toEqual([]);
  expect(
    arreglados,
    `Hay fallos que ya NO están: baja el tope en el mismo cambio (SC_UPDATE_A11Y=1 npx playwright test sc-docs-a11y):\n` +
      arreglados.join('\n'),
  ).toEqual([]);
});

function aplanar(t: Tope): Map<string, number> {
  const fuera = new Map<string, number>();
  for (const [p, stories] of Object.entries(t))
    for (const [s, reglas] of Object.entries(stories)) for (const [r, n] of Object.entries(reglas)) fuera.set(`${p}/${s}/${r}`, n);
  return fuera;
}

/** Claves en orden, para que dos pasadas escriban el mismo fichero y el diff enseñe solo lo que cambia. */
function ordenar(t: Tope): Tope {
  const fuera: Tope = {};
  for (const p of Object.keys(t).sort()) {
    fuera[p] = {};
    for (const s of Object.keys(t[p]!).sort()) {
      fuera[p]![s] = {};
      for (const r of Object.keys(t[p]![s]!).sort()) fuera[p]![s]![r] = t[p]![s]![r]!;
    }
  }
  return fuera;
}
