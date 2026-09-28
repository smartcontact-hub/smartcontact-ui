/**
 * CHROMIUM DE OTRA REVISIÓN QUE LA QUE PIDE ESTE `@playwright/test`.
 *
 * El contenedor de una sesión cloud trae Chromium preinstalado en `/opt/pw-browsers`, pero su
 * revisión no tiene por qué casar con la que el `@playwright/test` de este repo espera descargar
 * (medido el 2026-09-28: el contenedor traía `chromium_headless_shell-1194` y el paquete pedía
 * `-1234`). El lanzamiento falla con "Executable doesn't exist", y la salida NO es
 * `npx playwright install` — la nota del entorno pide explícitamente no reinstalar.
 *
 * `scripts/revision-pantalla.mjs` ya resolvía esto leyendo `SC_CHROMIUM` (un `executablePath` a
 * mano), pero ningún `playwright.*.config.ts` lo leía: cada sesión que chocaba con esto editaba
 * el config a mano para probar sus propios cambios, con el riesgo de dejarlo puesto sin querer
 * (pasó el 2026-09-27, revertido antes de commitear). Mismo mecanismo, mismo nombre de variable,
 * ahora en el sitio que de verdad lo necesita.
 *
 * Sin `SC_CHROMIUM`, `launchOptions` es `{}`: cero cambio de comportamiento en local o en CI.
 */
export function chromiumLaunchOptions() {
  const executablePath = process.env['SC_CHROMIUM'];
  return executablePath ? { executablePath } : {};
}
