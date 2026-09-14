import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Acceso al Supervisor: entrar, equivocarse, recuperar la contraseña, ir a contacto y salir.
 *
 * Lo que blinda cada test es una decisión de la pantalla, no un detalle de maqueta:
 *  - la guía del email dice QUÉ falta, y se va en cuanto el campo queda bien;
 *  - el fallo de credenciales es uno solo y no delata qué campo falla;
 *  - recuperar la contraseña responde lo mismo exista o no la cuenta;
 *  - salir desde el menú del avatar deja la sesión cerrada y lo dice;
 *  - quien entró hace menos de 48 h lee «Hola de nuevo», y pasado ese plazo se olvida;
 *  - el fondo se mueve, se para con menos movimiento y sin WebGL queda la imagen fija.
 * La cuenta de demostración vive en `AuthService` (`DEMO_ACCOUNT`).
 */

/* Con menos movimiento el fondo WebGL pinta un fotograma y para: sin GPU en el CI, un
 * shader a pantalla completa en bucle solo gasta CPU. El test del fondo lo enciende a mano. */
test.use({
  storageState: { cookies: [], origins: [] },
  contextOptions: { reducedMotion: 'reduce' },
});

const DEMO = { email: 'supervisor@example.com', password: 'demo1234' };

const openLogin = async (page: Page): Promise<void> => {
  await page.goto('/login');
  await expect(page.locator('#login-email')).toBeVisible();
};

/** Texto que el campo anuncia por `aria-describedby` (error o ayuda), o `null` si no anuncia nada. */
const messageOf = async (page: Page, inputId: string): Promise<string | null> =>
  page.evaluate((id) => {
    const input = document.getElementById(id);
    const msgId = input?.getAttribute('aria-describedby');
    return msgId ? (document.getElementById(msgId)?.textContent?.trim() ?? null) : null;
  }, inputId);

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('email · la guía dice qué falta y se va al corregirlo', async ({ page }) => {
  await openLogin(page);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect.poll(() => messageOf(page, 'login-email')).toBe('Escribe tu email.');
  await expect.poll(() => messageOf(page, 'login-password')).toBe('Escribe tu contraseña.');

  // Un espacio donde va la @ es una @ que falta, no un espacio de más.
  await page.fill('#login-email', 'ana empresa.com');
  await expect.poll(() => messageOf(page, 'login-email')).toBe(
    'Falta la @ entre tu nombre y el dominio de tu empresa.',
  );
  await page.fill('#login-email', 'ana@empresa');
  await expect.poll(() => messageOf(page, 'login-email')).toContain('le falta la terminación');

  await page.fill('#login-email', 'ana@example.com');
  await expect.poll(() => messageOf(page, 'login-email')).toBeNull();
  await expect(page.locator('#login-email')).not.toHaveAttribute('aria-invalid', 'true');
});

test('credenciales · un solo aviso, contraseña vacía y el foco vuelve a ella', async ({ page }) => {
  await openLogin(page);
  await page.fill('#login-email', 'otra.persona@example.com');
  await page.fill('#login-password', 'no-es-esta');
  await page.keyboard.press('Enter');

  await expect(page.getByText('El email o la contraseña no son correctos.', { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('#login-password')).toHaveValue('');
  await expect(page.locator('#login-password')).toBeFocused();
  // El campo vacío NO grita «escribe tu contraseña» encima del aviso de credenciales.
  expect(await messageOf(page, 'login-password')).toBeNull();

  // En cuanto se vuelve a escribir, el aviso se retira.
  await page.fill('#login-password', 'x');
  await expect(page.getByText('El email o la contraseña no son correctos.', { exact: false })).toBeHidden();
});

test('contraseña · el ojo la enseña y la oculta con teclado', async ({ page }) => {
  await openLogin(page);
  const input = page.locator('#login-password');
  await input.fill('demo1234');
  await expect(input).toHaveAttribute('type', 'password');

  await input.focus();
  await page.keyboard.press('Tab');
  const show = page.getByRole('button', { name: 'Mostrar contraseña' });
  await expect(show).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(input).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Ocultar contraseña' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(input).toHaveAttribute('type', 'password');
});

test('entrar y salir · la cuenta demo entra y el avatar cierra la sesión', async ({ page }) => {
  await openLogin(page);
  await page.fill('#login-email', DEMO.email);
  await page.fill('#login-password', DEMO.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate(() => sessionStorage.getItem('sc-session'))).toBe('1');

  await goto(page, 'dashboard');
  await page.locator('.top-bar__avatar').click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Has cerrado sesión.')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('sc-session'))).toBeNull();
});

test('contraseña olvidada · no confirma si la cuenta existe', async ({ page }) => {
  await openLogin(page);
  await page.fill('#login-email', 'nadie@example.com');
  await page.getByRole('button', { name: '¿Has olvidado tu contraseña?' }).click();

  const title = page.getByRole('heading', { name: 'Recupera tu contraseña' });
  await expect(title).toBeFocused();
  await expect(page.locator('#reset-email')).toHaveValue('nadie@example.com');

  await page.fill('#reset-email', 'nadie@');
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect.poll(() => messageOf(page, 'reset-email')).toBe(
    'Falta el dominio de tu empresa después de la @.',
  );

  await page.fill('#reset-email', 'nadie@example.com');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Revisa tu correo' })).toBeFocused();
  await expect(page.getByText('Si hay una cuenta con nadie@example.com', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Volver a iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Hola', exact: true })).toBeFocused();
});

test('contacto · lleva a la web de contacto de SmartContact en pestaña nueva', async ({ page }) => {
  await openLogin(page);
  const link = page.getByRole('link', { name: /Contáctanos/ });
  await expect(link).toHaveAttribute('href', 'https://www.smart-contact.com/contacto/');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
});

test('estabilidad · un aviso nuevo no mueve el título', async ({ page }) => {
  await openLogin(page);
  // El canal de este fichero: aquí se pide menos movimiento, y el navegador lo recibe.
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const before = await page.locator('#login-title').boundingBox();
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect.poll(() => messageOf(page, 'login-email')).not.toBeNull();
  const after = await page.locator('#login-title').boundingBox();
  expect(after?.y).toBe(before?.y);
});

/** Deja la marca de «última entrada» como si hubiera sido hace `hours` horas. */
const lastSignInHoursAgo = async (page: Page, hours: number): Promise<void> => {
  await page.addInitScript(
    (ms) => localStorage.setItem('sc-last-sign-in', String(ms)),
    Date.now() - hours * 3_600_000,
  );
};

test('de vuelta · entró hace menos de 48 h: «Hola de nuevo»', async ({ page }) => {
  await lastSignInHoursAgo(page, 1);
  await openLogin(page);
  await expect(page.getByRole('heading', { name: 'Hola de nuevo', exact: true })).toBeVisible();
});

test('de vuelta · pasadas 48 h el saludo vuelve a «Hola» y la marca se borra', async ({ page }) => {
  await lastSignInHoursAgo(page, 49);
  await openLogin(page);
  await expect(page.getByRole('heading', { name: 'Hola', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sc-last-sign-in'))).toBeNull();
});

test('de vuelta · entrar deja la marca y al salir ya saluda «Hola de nuevo»', async ({ page }) => {
  await openLogin(page);
  await expect(page.getByRole('heading', { name: 'Hola', exact: true })).toBeVisible();
  await page.fill('#login-email', DEMO.email);
  await page.fill('#login-password', DEMO.password);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/dashboard$/);

  await goto(page, 'dashboard');
  await page.locator('.top-bar__avatar').click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Hola de nuevo', exact: true })).toBeVisible();
});

test.describe('fondo', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  const frameOfArt = (page: Page): Promise<Buffer> =>
    page.locator('sc-login-art').screenshot({ animations: 'allow' });

  test('se mueve, y con menos movimiento se queda quieto', async ({ page }) => {
    await openLogin(page);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
    await expect(page.locator('sc-login-art canvas')).toBeVisible();
    await expect(page.locator('sc-login-art img')).toHaveAttribute(
      'src',
      '/illustrations/login-bg-light.webp',
    );

    const first = await frameOfArt(page);
    await page.waitForTimeout(1200);
    expect((await frameOfArt(page)).equals(first)).toBe(false);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(300);
    const still = await frameOfArt(page);
    await page.waitForTimeout(1200);
    expect((await frameOfArt(page)).equals(still)).toBe(true);
  });

  test('sin WebGL se ve la imagen fija y el canvas no tapa nada', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      const noWebgl = function (this: HTMLCanvasElement, id: string, options?: unknown) {
        return id === 'webgl' ? null : original.call(this, id as '2d', options);
      };
      HTMLCanvasElement.prototype.getContext = noWebgl as typeof original;
    });
    await openLogin(page);
    await expect(page.locator('sc-login-art canvas')).toBeHidden();
    await expect(page.locator('sc-login-art img')).toBeVisible();
  });
});
