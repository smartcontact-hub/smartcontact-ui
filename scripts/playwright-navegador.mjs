/**
 * El navegador con que Playwright lanza las pruebas, si el entorno pide uno propio.
 *
 * Medido el 2026-10-06 en una sesión cloud: el Playwright del repo busca `chromium_headless_shell-1234` y el contenedor
 * trae `/opt/pw-browsers/chromium`, así que cada prueba salía con «Executable doesn't exist». El hook de arranque de la
 * nube (`scripts/hooks/cloud-node.sh`) define `SC_CHROMIUM` con ese ejecutable; en el Mac y en el CI nadie la define y
 * Playwright usa el suyo, como siempre.
 */
export function navegadorPropio(env = process.env) {
  const ruta = env['SC_CHROMIUM'];
  return ruta ? { launchOptions: { executablePath: ruta } } : {};
}
