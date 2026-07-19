import { readFileSync } from 'node:fs';

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

/**
 * ¿EL SERVIDOR ESTÁ SIRVIENDO TU CÓDIGO, O UNO ANTERIOR?
 *
 * El fallo más caro de esta sesión no fue lento, fue MENTIROSO. `npm run verify`
 * reescribe `dist/` por debajo de un `ng serve` vivo; el server se queda con un
 * `Cannot find module '@smartcontact-hub/components'`, **no se cae**, y sigue
 * sirviendo el bundle ANTERIOR tan campante. Tres veces medí un arreglo ya
 * escrito y leí el valor viejo, convencido de que mi selector no entraba. Y con
 * `reuseExistingServer` en local, Playwright se engancha a ese server sin
 * enterarse.
 *
 * Un bucle lento cuesta minutos. Un bucle que devuelve la respuesta VIEJA cuesta
 * eso más todo lo que construyas encima del diagnóstico falso — y esa es la vía
 * por la que un defecto llega hasta el usuario.
 *
 * Cómo lo detecta: lee el token en el FUENTE (dos saltos: semántico → primitiva
 * → hex), lo compara con lo que el navegador computa de verdad, y si no cuadran
 * dice explícitamente que estás midiendo un build anterior. No hay ningún hex
 * escrito aquí: si mañana el token cambia de valor, el guardián sigue valiendo.
 */
const TOKEN_CANARIO = '--sc-text-subtle';
const RUTA_SEMANTICO = 'projects/design-tokens/src/lib/styles/tokens/layers/02-semantic.css';
const RUTA_PRIMITIVO = 'projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css';

/** Resuelve el canario en el FUENTE hasta su hex. Lanza si el token desaparece. */
const hexDelFuente = (): string => {
  const semantico = readFileSync(RUTA_SEMANTICO, 'utf8');
  const aPrimitiva = new RegExp(`^\\s*${TOKEN_CANARIO}:\\s*var\\((--sc-color-[a-z0-9-]+)\\)`, 'm');
  const salto = semantico.match(aPrimitiva);
  if (!salto) {
    throw new Error(
      `El guardián de build no encuentra "${TOKEN_CANARIO}: var(--sc-color-…)" en ${RUTA_SEMANTICO}. ` +
        `Si el token se renombró, actualiza TOKEN_CANARIO en helpers.ts — no borres el guardián.`,
    );
  }
  const primitivo = readFileSync(RUTA_PRIMITIVO, 'utf8');
  const aHex = new RegExp(`^\\s*${salto[1]}:\\s*(#[0-9a-fA-F]{6})`, 'm');
  const hex = primitivo.match(aHex);
  if (!hex) throw new Error(`El guardián no resuelve ${salto[1]} a hex en ${RUTA_PRIMITIVO}.`);
  return hex[1]!.toLowerCase();
};

/**
 * Falla si el navegador no está sirviendo el CSS de tokens que hay en disco.
 * Llámalo en el `beforeEach` de cualquier spec que MIDA colores: sin esto, un
 * server rancio no te da un rojo, te da un verde equivocado.
 */
export const asegurarBuildFresco = async (page: Page): Promise<void> => {
  const esperado = hexDelFuente();
  const servido = await page.evaluate((token) => {
    // Resolver la var a un color computado: el canvas normaliza cualquier sintaxis.
    const s = document.createElement('span');
    s.style.color = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    document.body.append(s);
    const v = getComputedStyle(s).color;
    s.remove();
    return v;
  }, TOKEN_CANARIO);

  const aHex = (rgb: string): string => {
    const n = (rgb.match(/\d+/g) ?? []).slice(0, 3).map(Number);
    return n.length === 3 ? `#${n.map((x) => x.toString(16).padStart(2, '0')).join('')}` : rgb;
  };

  expect(
    aHex(servido),
    `ESTÁS MIDIENDO UN BUILD ANTERIOR A TU EDICIÓN.\n` +
      `  ${TOKEN_CANARIO} en el fuente: ${esperado}\n` +
      `  lo que sirve el navegador:   ${aHex(servido)} (${servido})\n` +
      `Reinicia el dev server. Suele pasar tras un "npm run verify": reescribe dist/ ` +
      `por debajo del "ng serve", que se queda muerto pero sigue sirviendo el bundle viejo.`,
  ).toBe(esperado);
};

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

/** Tema OSCURO antes del primer paint. Mismo mecanismo que el claro: el
 *  `ThemeService` lee `sc-theme` de localStorage al construirse y pone
 *  `.sc-dark` en `<html>`. No inventes una clase propia — probé con una
 *  `sc-theme-dark` que no existe y la medición salió incoherente. */
export const forceDarkTheme = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sc-theme', 'dark');
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
