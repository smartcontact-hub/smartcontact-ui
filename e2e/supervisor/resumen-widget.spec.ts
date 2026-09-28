import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceDarkTheme, forceLightTheme, goto } from './helpers';

/**
 * EL RESUMEN DE LAS FICHAS, COMO WIDGET (DD-126).
 *
 * El resumen de la derecha de las fichas de grupo, agente y usuario enseña cada proporción como el ejemplo
 * «Preview» de ProgressSpinner de primeng.dev: la cifra grande, «/total» y el `p-progress-spinner` nativo en
 * modo determinado a su lado. La cifra cuenta y el anillo se llena al abrir y al cambiar, en 300 ms; con
 * menos movimiento, las dos salen ya en su sitio. La tarjeta lleva el tinte de marca.
 *
 * Lo que fija esta red:
 *   · el anillo lleva la proporción de verdad (`aria-valuenow/max`), mide 42, va oculto al lector (su
 *     `progressbar` con `aria-busy` diría «cargando» de un dato que no carga) y no pinta su «N%» (como el
 *     ejemplo: a 42 px no se lee y la cifra grande ya lo dice);
 *   · el arco va en el acento y la tarjeta en el tinte de marca, en los dos temas;
 *   · al lector le llega la cifra final («8 de 16»), no la cuenta;
 *   · con menos movimiento no hay cifras intermedias;
 *   · sin total no hay anillo (el alta de un agente sin grupos).
 */

const resumen = (page: Page) => page.locator('.ficha-summary');
const widgets = (page: Page) => resumen(page).locator('sc-summary-kpi');
const anillos = (page: Page) => resumen(page).locator('p-progress-spinner');
const cifra = (page: Page, i: number) => widgets(page).nth(i).locator('.resumen__count');

/** El color al que resuelve un token en esta página, en la misma forma que el computado (`rgb(…)`). */
const colorDeToken = (page: Page, token: string) =>
  page.evaluate((t) => {
    const s = document.createElement('span');
    s.style.color = `var(${t})`;
    document.body.append(s);
    const c = getComputedStyle(s).color;
    s.remove();
    return c;
  }, token);

for (const { tema, forzar } of [
  { tema: 'claro', forzar: forceLightTheme },
  { tema: 'oscuro', forzar: forceDarkTheme },
]) {
  test.describe(`en ${tema}`, () => {
    test.beforeEach(async ({ page }) => {
      await forzar(page);
      await disableAnimations(page);
    });

    test(`usuario 3 · secciones y permisos, cada uno con su anillo (${tema})`, async ({ page }) => {
      await goto(page, 'admin/usuarios/editar/3');
      await expect(widgets(page)).toHaveCount(2);
      await expect(anillos(page)).toHaveCount(2);

      const [secciones, permisos] = [anillos(page).nth(0), anillos(page).nth(1)];
      await expect(secciones).toHaveAttribute('aria-valuenow', '8');
      // Sobre las casillas que la ficha enseña: 16 secciones y 9 permisos desde DD-132 (antes, 11 y 5).
      await expect(secciones).toHaveAttribute('aria-valuemax', '16');
      await expect(permisos).toHaveAttribute('aria-valuenow', '2');
      await expect(permisos).toHaveAttribute('aria-valuemax', '9');
      await expect(secciones).toHaveAttribute('aria-hidden', 'true');
      await expect(secciones.locator('.p-progressspinner-value')).toBeHidden();

      const caja = await secciones.evaluate((e) => {
        const r = e.getBoundingClientRect();
        return [Math.round(r.width), Math.round(r.height)];
      });
      expect(caja).toEqual([42, 42]);

      const arco = await secciones.locator('.p-progressspinner-circle-range').evaluate((e) => getComputedStyle(e).stroke);
      expect(arco, 'el arco va en el acento').toBe(await colorDeToken(page, '--sc-bg-accent'));
      const fondo = await widgets(page).first().evaluate((e) => getComputedStyle(e).backgroundColor);
      expect(fondo, 'la tarjeta va en el tinte de marca').toBe(await colorDeToken(page, '--sc-bg-primary-subtle'));

      await expect(cifra(page, 0)).toHaveText('8');
      await expect(widgets(page).first().locator('.visually-hidden')).toHaveText('8 de 16');
    });
  });
}

test.describe('con los datos de siempre', () => {
  test.beforeEach(async ({ page }) => {
    await forceLightTheme(page);
    await disableAnimations(page);
  });

  test('grupo 11 · agentes activos sobre asignados, con quién atiende cada canal debajo', async ({ page }) => {
    await goto(page, 'admin/grupos/editar/11');
    const agentes = widgets(page).first();
    await expect(agentes).toContainText('Agentes activos');
    await expect(anillos(page).first()).toHaveAttribute('aria-valuenow', '13');
    await expect(anillos(page).first()).toHaveAttribute('aria-valuemax', '13');
    // El canal que nadie atiende sigue avisando, con icono y texto, dentro de la misma tarjeta.
    await expect(agentes.locator('.resumen__channel')).toHaveCount(4);
    await expect(agentes).toContainText('Sin agentes');
    // Sobre el tinte, el ámbar como texto no llega a AA: lo lleva el icono, y el aviso no pierde su color.
    const aviso = agentes.locator('.resumen__warn').first();
    const icono = await aviso.locator('sc-icon').evaluate((e) => getComputedStyle(e).color);
    expect(icono, 'el ámbar del aviso lo lleva el icono').toBe(await colorDeToken(page, '--sc-icon-warning'));
  });

  test('alta de agente · sin grupos no hay anillo, y lo dice', async ({ page }) => {
    await goto(page, 'admin/agentes/crear');
    await expect(widgets(page)).toHaveCount(1);
    await expect(cifra(page, 0)).toHaveText('0');
    await expect(anillos(page)).toHaveCount(0);
    await expect(widgets(page).first()).toContainText('Sin grupos');
  });

  test('al quitar un permiso, la cifra baja y el anillo la sigue', async ({ page }) => {
    await goto(page, 'admin/usuarios/editar/3?seccion=acceso');
    await expect(cifra(page, 1)).toHaveText('2');
    await page.locator('#user-section-access sc-checkbox', { hasText: 'Espiar conversaciones' }).click();
    await expect(cifra(page, 1)).toHaveText('1');
    await expect(anillos(page).nth(1)).toHaveAttribute('aria-valuenow', '1');
    await expect(widgets(page).nth(1).locator('.visually-hidden')).toHaveText('1 de 9');
  });
});

test('con menos movimiento, la cifra sale ya final: ninguna intermedia', async ({ page }) => {
  // Sin `disableAnimations`: aquí se mide el camino real, el reset de menos movimiento del Supervisor.
  await forceLightTheme(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const w = window as unknown as { __cifras: string[] };
    w.__cifras = [];
    const inicio = performance.now();
    const mirar = (): void => {
      const t = document.querySelector('.ficha-summary sc-summary-kpi .resumen__count')?.textContent ?? '';
      if (t && w.__cifras.at(-1) !== t) w.__cifras.push(t);
      if (performance.now() - inicio < 5000) requestAnimationFrame(mirar);
    };
    requestAnimationFrame(mirar);
  });
  await goto(page, 'admin/usuarios/editar/3');
  // El estímulo llegó: la página ve la preferencia (LEARNINGS #1).
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await expect(cifra(page, 0)).toHaveText('8');
  await page.waitForTimeout(600);
  const vistas = await page.evaluate(() => (window as unknown as { __cifras: string[] }).__cifras);
  expect(vistas, 'con menos movimiento no cuenta: solo la cifra final').toEqual(['8']);
});
