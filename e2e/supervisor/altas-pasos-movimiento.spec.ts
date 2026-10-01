import { expect, test, type Page } from '@playwright/test';

import { forceLightTheme, goto } from './helpers';

/**
 * EL MOVIMIENTO DE LOS PASOS DEL ALTA ES EL DE PRIMENG, Y SE VE ENTERO (DD-138).
 *
 * Sin `disableAnimations`: aquí se mide el movimiento real. Al cambiar de paso, el Stepper vertical pliega el paso que
 * se deja y abre el nuevo a la vez, con el plegado de PrimeNG (`p-collapsible`: 0,2 s, `ease-out`, sobre
 * `grid-template-rows`).
 *
 * Lo que fija:
 *   1. El cambio de paso lleva ese movimiento, el de PrimeNG tal cual: nada lo apaga ni lo sustituye.
 *   2. A mitad del plegado, la línea que une los números llega hasta el paso siguiente. Medido el 2026-10-01: en el
 *      nativo, la fracción del plegado se aplica dos veces en la misma rejilla (la caja mide X·contenido, y su fila,
 *      X·caja). La línea sigue a la fila, así que se despegaba hasta 90 px del número del paso siguiente, al plegar y
 *      al abrir. El contenido no, porque lo recorta la caja.
 *   3. Con menos movimiento, el paso cambia de golpe: ningún fotograma a medias.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
});

type Panel = {
  paso: string;
  animacion: string;
  duracion: string;
  curva: string;
  /** Alto de la caja (lo que empuja al paso siguiente) al empezar el plegado y congelado a mitad. */
  cajaAlEmpezar: number;
  caja: number;
  /** Lo que se ve de la línea del paso, congelado a mitad: la caja la recorta. */
  linea: number;
};

/** Abre el alta de grupo con nombre (General es la puerta) y pulsa «Siguiente». En el primer fotograma del plegado lo
 *  congela a `ms` y mide cada panel que anima, en orden: el que se deja y el que se abre. */
const congelarElCambio = async (page: Page, ms: number): Promise<Panel[]> => {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Movimiento ${Date.now()}`);
  await page.evaluate((ms) => {
    const w = window as unknown as { __pliegue?: Panel[] };
    const mirar = (): void => {
      const anims = document
        .getAnimations()
        .filter((a): a is CSSAnimation => a instanceof CSSAnimation && a.animationName.startsWith('p-animate-collapsible'));
      if (anims.length < 2) {
        requestAnimationFrame(mirar);
        return;
      }
      // Todo en el mismo fotograma: el respaldo de p-motion (201 ms) no puede colarse en medio.
      const cajaDe = (a: CSSAnimation) => (a.effect as KeyframeEffect).target as HTMLElement;
      const alto = (el: Element) => el.getBoundingClientRect().height;
      for (const a of anims) {
        a.pause();
        a.currentTime = 0;
      }
      const alEmpezar = anims.map((a) => alto(cajaDe(a)));
      for (const a of anims) a.currentTime = ms;
      w.__pliegue = anims
        .map((a, i) => {
          const caja = cajaDe(a);
          const item = caja.closest('p-step-item')!;
          const linea = item.querySelector('p-stepper-separator')!.getBoundingClientRect();
          const cs = getComputedStyle(caja);
          return {
            orden: [...document.querySelectorAll('p-step-item')].indexOf(item),
            paso: item.querySelector('.p-step-title')!.childNodes[0].textContent!.trim(),
            animacion: a.animationName,
            duracion: cs.animationDuration,
            curva: cs.animationTimingFunction,
            cajaAlEmpezar: Math.round(alEmpezar[i]),
            caja: Math.round(alto(caja)),
            linea: Math.round(Math.min(linea.bottom, caja.getBoundingClientRect().bottom) - linea.top),
          };
        })
        .sort((x, y) => x.orden - y.orden)
        .map(({ orden: _orden, ...panel }) => panel);
      for (const a of anims) a.play();
    };
    requestAnimationFrame(mirar);
  }, ms);
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __pliegue?: Panel[] }).__pliegue ?? null)).not.toBeNull();
  return page.evaluate(() => (window as unknown as { __pliegue: Panel[] }).__pliegue);
};

test('cambiar de paso pliega el que se deja y abre el nuevo, con el movimiento de PrimeNG tal cual', async ({ page }) => {
  const paneles = await congelarElCambio(page, 100);
  expect(paneles.map(({ paso, animacion, duracion, curva }) => ({ paso, animacion, duracion, curva }))).toEqual([
    { paso: 'General', animacion: 'p-animate-collapsible-collapse', duracion: '0.2s', curva: 'ease-out' },
    { paso: 'Distribución y colas', animacion: 'p-animate-collapsible-expand', duracion: '0.2s', curva: 'ease-out' },
  ]);
});

test('a mitad del plegado, la línea del paso llega hasta el paso siguiente', async ({ page }) => {
  const paneles = await congelarElCambio(page, 100);
  expect(paneles).toHaveLength(2);
  for (const p of paneles) {
    // La medida es de verdad a mitad: la caja ya se ha movido y aún no ha llegado.
    expect(p.caja, `${p.paso}: la caja, a mitad`).toBeGreaterThan(20);
    expect(Math.abs(p.caja - p.cajaAlEmpezar), `${p.paso}: la caja se movió`).toBeGreaterThan(20);
    expect(p.linea, `${p.paso}: la línea llega al final de su caja (${p.caja})`).toBeGreaterThanOrEqual(p.caja - 1);
  }
});

test('con menos movimiento, el paso cambia de golpe: ningún fotograma a medias', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await goto(page, 'admin/grupos/crear');
  // El estímulo llegó: la página ve la preferencia (LEARNINGS #1).
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.locator('#group-name').fill(`E2E Movimiento ${Date.now()}`);
  await page.evaluate(() => {
    const w = window as unknown as { __altos: number[] };
    w.__altos = [];
    const inicio = performance.now();
    const mirar = (): void => {
      const caja = document.querySelectorAll('p-step-item')[1]?.querySelector('p-step-panel .p-motion');
      w.__altos.push(Math.round(caja?.getBoundingClientRect().height ?? 0));
      if (performance.now() - inicio < 1500) requestAnimationFrame(mirar);
    };
    requestAnimationFrame(mirar);
  });
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.locator('p-step[aria-current="step"]')).toContainText('Distribución y colas');
  await page.waitForTimeout(1600);
  const altos = await page.evaluate(() => (window as unknown as { __altos: number[] }).__altos);
  const final = altos.at(-1)!;
  expect(final, 'el paso nuevo, abierto').toBeGreaterThan(100);
  expect(
    altos.filter((h) => h > 1 && Math.abs(h - final) > 1),
    'alturas a medias del paso nuevo',
  ).toEqual([]);
});
