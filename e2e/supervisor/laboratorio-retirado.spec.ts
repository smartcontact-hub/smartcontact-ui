import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL LABORATORIO DE ADMINISTRACIÓN SE RETIRA (DD-132, actualización del 2026-10-05).
 *
 * `/lab/admin` rehízo el alta y la edición de grupos y usuarios con las decisiones del teardown de mensajería. Lo
 * superaron los tipos de usuario con su plantilla (DD-132) y las fichas de DD-121 y DD-122, y nadie lo usa. Se retira
 * la carpeta y su ruta, y su versión queda archivada en el Lab de sc-docs con su commit y su enlace fijo.
 *
 * Una ruta que ya no existe cae en la de relleno (`**` en `app.routes.ts`), como cualquier otra.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('/lab/admin ya no existe: cae en «Sección en construcción», como cualquier ruta que no existe', async ({ page }) => {
  await goto(page, 'lab/admin/grupos');
  await expect(page.getByRole('heading', { name: 'Sección en construcción' })).toBeVisible();
});
