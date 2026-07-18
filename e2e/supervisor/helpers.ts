import { expect, type Page } from '@playwright/test';

/**
 * Helpers compartidos de los journeys del Supervisor.
 *
 * Reglas del entorno (aprendidas, no adivinadas):
 *  - Rutas por PATH (no hash).
 *  - Los stores de `memory` (rules/categories/entities) viven **en memoria**: un
 *    `page.reload()` borra lo creado a mitad de journey. Navegar por la SPA.
 *  - Los stores de admin (usuarios/grupos/…) persisten en localStorage y
 *    re-siembran su SEED si está vacío → contexto limpio = datos deterministas.
 *  - La app monta `withViewTransitions()`: durante una navegación puede haber un
 *    frame con el DOM viejo. Por eso todo se asevera con `expect(...)` (auto-retry),
 *    nunca leyendo el DOM una sola vez.
 */

/** Tema claro antes del primer paint (el ThemeService lee el persistido al construirse). */
export const forceLightTheme = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sc-theme', 'light');
    } catch {
      /* contexto sin storage — ignorar */
    }
  });
};

/**
 * Mata animaciones y view-transitions. Sin esto, los overlays de PrimeNG (select,
 * menú, diálogo) entran animados y Playwright los rechaza por "element is not
 * stable" — un falso fallo del arnés, no de la app.
 */
export const disableAnimations = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;}
::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important;}`;
    document.addEventListener('DOMContentLoaded', () => document.head.append(style));
    queueMicrotask(() => document.head?.append(style));
  });
};

/** Navega a una ruta del Supervisor y espera a que la página esté montada. */
export const goto = async (page: Page, route: string): Promise<void> => {
  await page.goto(`/${route.replace(/^\//, '')}`);
  await expect(page.locator('main#main-content')).toBeVisible();
};

/**
 * Abre el kebab de una fila y pulsa una acción del menú.
 * El menú es único y compartido (appendTo="body"), así que hay que esperar a que
 * su modelo se repueble antes de clicar.
 */
export const openKebabAction = async (
  page: Page,
  rowText: string,
  action: string | RegExp,
): Promise<void> => {
  const row = page.locator('tr', { hasText: rowText }).first();
  await row.locator('.rules-kebab-btn').click();
  const item = page.locator('.p-menu-overlay .p-menu-item-link', { hasText: action }).first();
  await expect(item).toBeVisible();
  await item.click();
};

/** Rellena un `sc-inputtext` localizándolo por su label visible. */
export const fillFieldByLabel = async (
  page: Page,
  label: string | RegExp,
  value: string,
): Promise<void> => {
  const field = page.locator('sc-inputtext', { hasText: label }).first();
  await field.locator('input').fill(value);
};

/** Elige una opción de un `sc-select` dado su locator (abre el overlay y clica). */
export const pickSelectOption = async (
  page: Page,
  select: ReturnType<Page['locator']>,
  optionText: string | RegExp,
): Promise<void> => {
  await select.click();
  const option = page.locator('.p-select-overlay .p-select-option', { hasText: optionText }).first();
  await expect(option).toBeVisible();
  await option.click();
};
