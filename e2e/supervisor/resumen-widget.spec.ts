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

      // La primera, secciones, es la cifra destacada (DD-161): arco en el color de su texto, sobre el degradado. La
      // segunda sigue como todas: arco en el acento y tarjeta en el tinte de marca.
      const arco = await secciones.locator('.p-progressspinner-circle-range').evaluate((e) => getComputedStyle(e).stroke);
      expect(arco, 'en la destacada, el arco va en el color de su texto').toBe(await colorDeToken(page, '--sc-text-inverse'));
      const arcoPermisos = await permisos.locator('.p-progressspinner-circle-range').evaluate((e) => getComputedStyle(e).stroke);
      expect(arcoPermisos, 'en las demás, el arco va en el acento').toBe(await colorDeToken(page, '--sc-bg-accent'));
      const fondo = await widgets(page).nth(1).evaluate((e) => getComputedStyle(e).backgroundColor);
      expect(fondo, 'las demás tarjetas, en el tinte de marca').toBe(await colorDeToken(page, '--sc-bg-primary-subtle'));

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
    await expect(agentes).toContainText('Agentes habilitados');
    await expect(anillos(page).first()).toHaveAttribute('aria-valuenow', '13');
    await expect(anillos(page).first()).toHaveAttribute('aria-valuemax', '13');
    // El canal que nadie atiende sigue avisando, con icono y texto, dentro de la misma tarjeta.
    await expect(agentes.locator('.resumen__channel')).toHaveCount(3);
    await expect(agentes).not.toContainText('Sin agentes');
  });

  test('una familia sin agentes conserva el aviso con su icono', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sc-group-agent-links-v', '1');
      localStorage.setItem('sc-group-agent-links', JSON.stringify([
        { agentId: 1, groupId: 11, channels: ['phone'], active: true },
      ]));
    });
    await goto(page, 'admin/grupos/editar/11');
    const agentes = widgets(page).first();
    await expect(agentes).toContainText('Sin agentes');
    // La tarjeta de agentes es la cifra destacada (DD-161): sobre su degradado el ámbar no llega a 3:1, así que el
    // aviso, icono y palabra, va en el color de la tarjeta. Sigue siendo un aviso por su icono y su texto.
    const aviso = agentes.locator('.resumen__warn').first();
    await expect(aviso.locator('sc-icon'), 'el aviso conserva su icono').toHaveCount(1);
    const [icono, texto] = await aviso.evaluate((e) => [
      getComputedStyle(e.querySelector('sc-icon')!).color,
      getComputedStyle(e).color,
    ]);
    expect(icono, 'sobre el degradado, el icono va en el color de la tarjeta').toBe(texto);
  });

  test('sobre el tinte, el ámbar del aviso lo lleva el icono', async ({ page }) => {
    // En el alta, «Salida» dice que al teléfono le falta su número, en una tarjeta que no es la destacada. Ahí el ámbar
    // como texto no llega a AA (DD-126): lo lleva el icono, y el aviso no pierde su color.
    await goto(page, 'admin/grupos/crear');
    const aviso = resumen(page).locator('.resumen__warn', { hasText: 'Sin número' }).first();
    await expect(aviso).toBeVisible();
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
