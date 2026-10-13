import { expect, test, type Page } from '@playwright/test';

/**
 * LAS HERRAMIENTAS DEL LIENZO DE SC-DOCS, PROBADAS COMO LAS USA QUIEN ESTRESA UN COMPONENTE.
 *
 * Cada una con el estímulo REAL (un clic, un ratón que pasa, una URL que se abre), no con una llamada al código: si la
 * herramienta deja de recibirlo, esto se pone en rojo. Sobre `sc-button`, la ficha con más controles.
 *
 *   · el enlace de una story: baja hasta ella, la marca y siembra el Playground con sus `args`;
 *   · la story suelta (`solo=1`): sin barra lateral, solo esa story;
 *   · el ancho fijo: un iframe cuyo VIEWPORT es ese ancho, y que sigue a los controles sin recargarse;
 *   · «Todas las combinaciones»: 9 × 3 × 4 = 108 casillas, 6 de ellas huecos (`plain` relleno o enlace);
 *   · accesibilidad: un botón de solo icono sin nombre cuenta un fallo; el de por defecto, ninguno;
 *   · medir y contornos: la regla aparece sobre lo que señala el ratón; el contorno, en cada elemento;
 *   · el panel de controles: a la derecha y a la vista al bajar, dice qué se ha tocado y lo devuelve a la ficha; en una
 *     ventana estrecha, un botón flotante que lo abre por encima y Escape lo cierra.
 */

const abrir = async (page: Page, query = ''): Promise<void> => {
  await page.goto(`/#/components/button${query}`);
  await page.locator('#historia-playground .sb-canvas__stage').waitFor();
  await page.evaluate(() => document.fonts.ready);
};

test.describe('sc-docs · herramientas del lienzo', () => {
  test('el enlace a una story baja hasta ella y la marca', async ({ page }) => {
    await abrir(page, '?historia=variantes');
    const story = page.locator('#historia-variantes');
    await expect(story).toHaveClass(/sb-host__story--enlazada/);
    // La página se asienta después de pintar (Playground, fuente de iconos): espera a que deje de moverse.
    await expect.poll(async () => Math.round((await story.boundingBox())?.y ?? 9999), { timeout: 5_000 }).toBeLessThan(40);
  });

  test('el enlace del Playground lleva sus controles: siembra el control y el código', async ({ page }) => {
    await abrir(page, '?historia=playground&args=variant:danger;loading:!true;label:Borrar');
    await expect(page.locator('#historia-playground .sb-canvas__pane button.p-button-danger')).toHaveCount(1);
    await expect(page.locator('#historia-playground .sb-snippet pre')).toContainText('variant="danger"');
    await expect(page.locator('#historia-playground .sb-snippet pre')).toContainText('[loading]="true"');
    await expect(page.locator('#historia-playground .sb-snippet pre')).toContainText('label="Borrar"');
  });

  test('una story suelta se pinta sin el marco de la web', async ({ page }) => {
    await page.goto('/#/components/button?historia=variantes&solo=1');
    await expect(page.locator('[data-testid="sb-solo"] .sb-canvas__pane sc-button')).toHaveCount(10);
    await expect(page.locator('.demo-sidebar')).toHaveCount(0);
    await expect(page.locator('.sb-canvas__bar')).toHaveCount(0);
    await expect(page.locator('#historia-playground')).toHaveCount(0);
  });

  test('un ancho fijo cambia el viewport de verdad, y sigue a los controles sin recargar', async ({ page }) => {
    await abrir(page);
    const playground = page.locator('#historia-playground');
    await playground.locator('[data-testid="sb-ancho"] select').selectOption('375');

    const iframe = playground.locator('[data-testid="sb-iframe"]');
    await expect(iframe).toHaveCount(1);
    const marco = page.frameLocator('#historia-playground [data-testid="sb-iframe"]');
    await marco.locator('button.p-button').waitFor();
    const ventana = await iframe.evaluate((el: HTMLIFrameElement) => el.contentWindow!.innerWidth);
    expect(ventana, 'el viewport de dentro es el ancho elegido, no el de la caja').toBe(375);

    // Una marca en la ventana del iframe: si el cambio de control lo RECARGARA, desaparecería.
    await iframe.evaluate((el: HTMLIFrameElement) => ((el.contentWindow as unknown as { marca: string }).marca = 'viva'));
    await page.locator('[data-testid="sb-panel"] [data-control="label"] input').fill('Texto desde el control');
    await expect(marco.locator('button.p-button')).toContainText('Texto desde el control');
    const marca = await iframe.evaluate((el: HTMLIFrameElement) => (el.contentWindow as unknown as { marca?: string }).marca);
    expect(marca, 'el iframe se actualiza sin recargarse').toBe('viva');
  });

  test('«Todas las combinaciones» saca las 108 del botón, con los huecos que el Kit no tiene', async ({ page }) => {
    await abrir(page);
    const matriz = page.locator('#historia-combinaciones');
    await expect(matriz.locator('[data-testid="sb-matriz-cuenta"]')).toHaveText('108 combinaciones');
    // Plegada hasta que se pide: dos `data-testid` iguales romperían los e2e que buscan uno.
    await expect(matriz.locator('.sb-matriz__tabla')).toHaveCount(0);
    await matriz.getByRole('button', { name: 'Ver las 108' }).click();
    await expect(matriz.locator('.sb-matriz__tabla td')).toHaveCount(108);
    await expect(matriz.locator('.sb-matriz__tabla sc-button')).toHaveCount(102);
    await expect(matriz.locator('.sb-matriz__hueco')).toHaveCount(6);
  });

  test('accesibilidad: cuenta el fallo de un botón sin nombre, y ninguno en el de por defecto', async ({ page }) => {
    await abrir(page);
    const boton = page.locator('#historia-playground [data-testid="sb-a11y"]');
    await expect(boton).toContainText('Sin fallos', { timeout: 15_000 });

    await abrir(page, '?historia=playground&args=label:;iconOnly:!true');
    await expect(boton).toContainText('1 fallo', { timeout: 15_000 });
    await boton.click();
    await expect(page.locator('#historia-playground [data-testid="sb-a11y-panel"]')).toContainText('texto discernible');
  });

  test('medir: la regla sale sobre lo que señala el ratón, con su tamaño', async ({ page }) => {
    await abrir(page, '?historia=variantes');
    const story = page.locator('#historia-variantes');
    await story.locator('[data-testid="sb-medir"]').click();
    const objetivo = story.locator('.sb-canvas__pane button.p-button').first();
    const caja = (await objetivo.boundingBox())!;
    // Al borde del botón (dentro de su relleno), no al centro: en el centro está el texto, que es otro elemento.
    await page.mouse.move(caja.x + 3, caja.y + caja.height / 2);
    const etiqueta = story.locator('.sb-medidor__etiqueta');
    await expect(etiqueta).toContainText('button.p-button');
    await expect(etiqueta).toContainText(`${Math.round(caja.width)}`);
    await expect(etiqueta).toContainText('relleno');
  });

  test('contornos: cada elemento de la story lleva su borde discontinuo', async ({ page }) => {
    await abrir(page, '?historia=variantes');
    const story = page.locator('#historia-variantes');
    await story.locator('[data-testid="sb-contornos"]').click();
    const estilo = await story
      .locator('.sb-canvas__pane button.p-button')
      .first()
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(estilo).toBe('dashed');
  });

  test('panel de controles: a la vista al bajar, cuenta lo tocado y lo devuelve a la ficha', async ({ page }) => {
    await abrir(page, '?historia=playground&args=variant:danger;loading:!true;label:Borrar');
    const panel = page.locator('[data-testid="sb-panel"]');
    await expect(panel.locator('[data-testid="sb-panel-cuenta"]')).toHaveText('3 cambiados');
    await expect(panel.locator('.sb-controls__item--cambiado')).toHaveCount(3);

    // Abajo, en «Todas las combinaciones», el panel sigue en pantalla: es para ver lo que cambia mientras se toca.
    await page.locator('#historia-combinaciones').scrollIntoViewIfNeeded();
    await expect.poll(async () => (await panel.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(0);
    expect((await panel.boundingBox())!.y).toBeLessThan(page.viewportSize()!.height / 2);

    // La referencia va debajo, a todo el ancho: el panel acompaña a las stories, y una tabla de API a su lado se
    // estrechaba hasta alargarse el doble.
    const api = (await page.locator('[data-testid="sb-api"]').boundingBox())!;
    const caja = (await panel.boundingBox())!;
    expect(api.x + api.width, 'la tabla de API pasa por debajo del panel').toBeGreaterThan(caja.x + caja.width / 2);

    // Volver UN control: el botón de la story deja de ser `danger`, los otros dos siguen.
    await panel.locator('[data-control="variant"] .sb-controls__volver').click();
    await expect(panel.locator('[data-testid="sb-panel-cuenta"]')).toHaveText('2 cambiados');
    await expect(page.locator('#historia-playground .sb-canvas__pane button.p-button-danger')).toHaveCount(0);

    // «Restablecer»: todo como en la ficha, y el código lo dice.
    await panel.getByRole('button', { name: 'Restablecer' }).click();
    await expect(panel.locator('[data-testid="sb-panel-cuenta"]')).toHaveCount(0);
    await expect(panel.locator('.sb-controls__item--cambiado')).toHaveCount(0);
    await expect(page.locator('#historia-playground .sb-snippet pre')).not.toContainText('label="Borrar"');
  });

  test('panel de controles: plegado se queda plegado al recargar, con la cuenta a la vista', async ({ page }) => {
    await abrir(page, '?historia=playground&args=variant:danger');
    await page.locator('[data-testid="sb-panel-plegar"]').click();
    await expect(page.locator('[data-testid="sb-panel"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="sb-panel-abrir"]')).toContainText('1');

    await page.reload();
    await page.locator('#historia-playground .sb-canvas__stage').waitFor();
    await expect(page.locator('[data-testid="sb-panel"]')).toHaveCount(0);
    await page.locator('[data-testid="sb-panel-abrir"]').click();
    await expect(page.locator('[data-testid="sb-panel"]')).toBeVisible();
  });

  test('panel de controles en una ventana estrecha: botón flotante, por encima, y Escape lo cierra', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await abrir(page);
    const boton = page.locator('[data-testid="sb-panel-abrir"]');
    await expect(page.locator('[data-testid="sb-panel"]')).toHaveCount(0);
    await boton.click();

    const panel = page.locator('[data-testid="sb-panel"]');
    await expect(panel).toBeVisible();
    // Por encima de la página y pegado a la derecha de la ventana.
    expect(await panel.evaluate((el) => getComputedStyle(el.parentElement!).position)).toBe('fixed');
    const caja = (await panel.boundingBox())!;
    expect(Math.round(caja.x + caja.width)).toBe(1100);
    await expect(page.locator('[data-testid="sb-panel-plegar"]')).toBeFocused();

    // Se toca un control con el panel abierto, y el Playground de debajo cambia.
    await panel.locator('[data-control="label"] input').fill('Desde el panel');
    await expect(page.locator('#historia-playground .sb-canvas__pane button.p-button')).toContainText('Desde el panel');

    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(boton).toBeFocused();
  });
});
