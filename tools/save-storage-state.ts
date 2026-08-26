/**
 * Guarda una sesion de Playwright para poder medir el original.
 *
 * Abre un navegador VISIBLE, esperas a que TU te loguees a mano, y cuando la app llega a
 * su vista privada guarda cookies y localStorage en un fichero. En ningun momento pasa
 * una credencial por el agente ni por el repo: escribes tu la contrasena en esa ventana.
 *
 * Uso:  node tools/save-storage-state.ts
 *       node tools/save-storage-state.ts --out .auth/otro.json --wait 600
 *
 * El fichero va a '.auth/', que esta en .gitignore. NO lo comitees: es una sesion viva.
 *
 * ⚠️ ANTES DE USARLO, lee la advertencia de 'findings/STATUS.md': esto abre una SEGUNDA
 * sesion de agente. La app lleva un 'app_opened_in_another_tab' en localStorage y una
 * sesion de agente es telefonia en vivo — puede echar a la tuya o, peor, quedar como
 * agente disponible y que le enruten una conversacion real.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const get = (k: string, d: string): string => {
  const i = args.indexOf(`--${k}`);
  return i === -1 || !args[i + 1] ? d : (args[i + 1] as string);
};

const OUT = get('out', '.auth/original.json');
const WAIT_SECONDS = Number(get('wait', '300'));
const START =
  process.env['SC_ORIGINAL_URL'] ??
  'https://comunicatoraeddev.smart-contact.com/sismac/';
/** Cuando la URL casa con esto, se da por hecho que ya estas dentro. */
const READY = /#\/private/;

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(START, { waitUntil: 'load' });

console.log('\n  Se ha abierto una ventana. Loguéate ahí a mano.');
console.log(
  `  En cuanto la URL contenga "#/private" guardo la sesión en ${OUT}.`
);
console.log(
  `  Tienes ${WAIT_SECONDS}s. Ctrl+C para abortar sin guardar nada.\n`
);

const deadline = Date.now() + WAIT_SECONDS * 1000;
let ready = false;
while (Date.now() < deadline) {
  if (READY.test(page.url())) {
    ready = true;
    break;
  }
  await page.waitForTimeout(1000);
}

if (!ready) {
  console.error(
    `  No se llegó a "#/private" en ${WAIT_SECONDS}s. No guardo nada.`
  );
  await browser.close();
  process.exit(1);
}

// Un respiro para que la app termine de escribir su localStorage tras el login.
await page.waitForTimeout(3000);
await mkdir(path.dirname(OUT), { recursive: true });
const state = await context.storageState();
await writeFile(OUT, JSON.stringify(state, null, 2), 'utf8');
await browser.close();

console.log(`  Guardado: ${OUT}`);
console.log(
  `  ${state.cookies.length} cookies, ${state.origins.length} orígenes.`
);
console.log('  NO lo comitees. Caduca cuando caduque tu sesión.\n');
