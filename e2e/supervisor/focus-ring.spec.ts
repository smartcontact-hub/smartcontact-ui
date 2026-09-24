import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL ANILLO DE FOCO ES EL MISMO EN TODA LA APP.
 *
 * Por qué existe: al medir el SCSS por página aparecieron **34 anillos de foco
 * en paleta cruda** frente a 33 con el token semántico. O sea, la mitad de la
 * app se pintaba el foco a mano, y no todos igual: `sky-500`, `blue-500`,
 * `red-500`, `amber-500`, y uno que ni siquiera era un `outline` (borde + halo
 * `blue-100`, que en oscuro dejaba un cerco blanco).
 *
 * Veintiocho de esos 34 eran `--sc-color-sky-500`, que es LITERALMENTE el
 * valor de `--sc-border-focus`: idénticos en pantalla, invisibles como
 * problema. Justo por eso duraron — nadie ve un alias. Los otros seis sí se
 * veían: el foco cambiaba de color según a qué control tabulabas, que es un
 * fallo de identificación consistente (WCAG 3.2.4), no una personalidad.
 *
 * Lo que fija esta prueba no es el valor concreto sino la UNANIMIDAD: se
 * recorre la app tabulando y se exige que todos los anillos midan lo mismo.
 * Si mañana el token cambia de color, esto sigue verde; si alguien vuelve a
 * escribir un color a mano, se pone rojo.
 *
 * **Los `.p-button` quedan fuera, y no por comodidad.** El preset de PrimeNG
 * dibuja el anillo en el color del propio botón (azul de marca en el primario,
 * gris en el secundario). Eso es una decisión coherente del sistema —el mismo
 * criterio para todos los botones— y vive en el preset, no en una hoja de
 * página. Meterlos aquí convertiría la prueba en "el preset no me gusta", que
 * es otra conversación, y le toca a diseño del Kit. Lo que esta prueba vigila es que la
 * APP no se invente colores de foco por su cuenta, que es lo que pasaba.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const RUTAS = [
  'conversaciones',
  'conversaciones/reglas',
  'admin/usuarios',
  'admin/labels',
  'admin/repositorios',
  'config/aed/servicio',
  'config/sistema',
] as const;

/** Cuántos Tab damos por página. Suficiente para recorrer la barra superior,
 *  los filtros y las primeras filas sin alargar la suite. */
const SALTOS = 22;

/**
 * UN CAMPO ENFOCADO MARCA EL FOCO COMO AURA Y EL KIT, TAMBIÉN CON ERROR (DD-111).
 *
 * Hasta el 2026-09-15 un campo del Supervisor enfocado pintaba DOS señales: el borde pasaba a
 * marino (el preset, como Aura) y una regla global de la app le sumaba un anillo sky (sc-docs no la
 * tenía). Ahora sigue a Aura y al Kit: el borde pasa al primario y no hay anillo.
 *
 * El caso que muerde es el ERROR: nuestros campos pintaban el borde rojo con una regla SIN CAPA, y
 * sin capa gana siempre al tema (`@layer primeng`), así que al enfocar no cambiaba nada. Desde DD-111
 * el error lo pinta PrimeNG (`p-invalid`) en su capa y el foco gana, como en primeng.dev.
 * Rojo con los tres modelos anteriores: doble señal y anillo (hay contorno) y error sin capa (el
 * borde se queda rojo al enfocar).
 */
for (const id of ['login-email', 'login-password']) {
  test(`${id} · al enfocar, borde primario y sin anillo, también en error`, async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator(`#${id}`)).toBeVisible();

    const leer = () =>
      page.evaluate((id) => {
        const el = document.getElementById(id)!;
        const s = document.createElement('span');
        s.style.color = getComputedStyle(document.documentElement).getPropertyValue('--sc-bg-primary').trim();
        document.body.append(s);
        const primario = getComputedStyle(s).color;
        s.remove();
        const cs = getComputedStyle(el);
        return {
          enfocado: document.activeElement === el,
          borde: cs.borderTopColor,
          anillo: cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0 ? null : `${cs.outlineWidth} ${cs.outlineColor}`,
          primario,
        };
      }, id);

    /* Llega por teclado, que es el estímulo que produce el foco visible de verdad. */
    const tabular = async () => {
      for (let i = 0; i < 14 && !(await leer()).enfocado; i++) await page.keyboard.press('Tab');
      expect((await leer()).enfocado, 'el tabulador no llegó al campo: la prueba no mediría nada').toBe(true);
    };

    const reposo = await leer();
    expect(reposo.primario, 'el token primario no resuelve').toMatch(/^rgb/);
    expect(reposo.borde, 'en reposo el borde ya es el primario: no mediría el cambio').not.toBe(reposo.primario);
    await tabular();
    const foco = await leer();
    expect(foco.anillo, 'el campo enfocado pinta un anillo: sería una segunda señal').toBeNull();
    expect(foco.borde, 'el borde no pasó al primario al enfocar').toBe(foco.primario);

    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.locator(`#${id}`)).toHaveAttribute('aria-invalid', 'true');
    await page.locator('#login-title').click();
    const error = await leer();
    expect(error.enfocado).toBe(false);
    expect(error.borde, 'el campo en error no cambió su borde: no mide el caso').not.toBe(reposo.borde);
    await tabular();
    const errorFoco = await leer();
    expect(errorFoco.anillo, 'el campo en error enfocado pinta un anillo').toBeNull();
    expect(errorFoco.borde, 'el campo en error enfocado no enseña el foco: el borde rojo tapa al primario').toBe(errorFoco.primario);
  });
}

for (const ruta of RUTAS) {
  test(`${ruta} · todos los focos usan el mismo anillo`, async ({ page }) => {
    await goto(page, ruta);

    /* El color del token, resuelto en vivo. No se escribe el hex aquí a
     * propósito: la prueba es sobre la unanimidad, no sobre el valor. */
    const esperado = await page.evaluate(() => {
      const s = document.createElement('span');
      s.style.color = getComputedStyle(document.documentElement).getPropertyValue('--sc-border-focus').trim();
      document.body.append(s);
      const v = getComputedStyle(s).color;
      s.remove();
      return v;
    });
    expect(esperado, 'el token de foco no resuelve — la prueba no mediría nada').toMatch(/^rgb/);

    const rarezas: string[] = [];
    let vistos = 0;
    for (let i = 0; i < SALTOS; i++) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        // Solo interesan los que DIBUJAN un anillo: si el ancho es 0 o el
        // estilo es `none`, ese control resuelve su foco de otra forma
        // (PrimeNG usa box-shadow en algunos) y no es asunto de esta prueba.
        if (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0) return null;
        // Los botones del preset tiñen el anillo con su propio color, a
        // propósito y de forma uniforme. Ver la nota de cabecera.
        if (el.closest('.p-button')) return null;
        // El campo oculto con el que los selectores nativos (MultiSelect, Select) reciben el teclado vive en
        // `.p-hidden-accessible`, recortado a 1px: su anillo no se ve. Lo que se ve es el borde del control, que
        // pasa al color de foco (medido con Tab en el selector de columnas, 2026-09-24).
        if (el.closest('.p-hidden-accessible')) return null;
        return {
          color: cs.outlineColor,
          quien: `${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 40)}`,
        };
      });
      if (!r) continue;
      vistos++;
      if (r.color !== esperado) rarezas.push(`${r.quien} → ${r.color}`);
    }

    /* VALIDAR EL VALIDADOR. Sin esto, una página cuyo tabulado no llegue a
     * ningún control de la app pasaría en VERDE sin haber mirado un solo
     * anillo — el peor resultado posible: cobertura aparente y cero real. */
    expect(vistos, 'la prueba no llegó a ningún anillo: no está midiendo nada').toBeGreaterThan(2);

    expect(
      [...new Set(rarezas)],
      `anillos de foco que no son --sc-border-focus (${esperado}):\n${rarezas.join('\n')}`,
    ).toEqual([]);
  });
}
