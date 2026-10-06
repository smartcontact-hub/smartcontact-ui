import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { navegadorPropio } from '../playwright-navegador.mjs';

/*
 * Medido el 2026-10-06 en una sesión cloud: el Playwright del repo busca `chromium_headless_shell-1234`, y el contenedor
 * trae `/opt/pw-browsers/chromium` (y la build 1194). Toda prueba salía con «Executable doesn't exist» sin abrir una
 * página. Con `executablePath` apuntando al Chromium del contenedor corrió `component-styles` entera. El hook de arranque
 * de la nube define `SC_CHROMIUM`; en el Mac nadie la define y no cambia nada.
 */

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('sin SC_CHROMIUM no toca nada; con ella, lanza ese ejecutable', () => {
  assert.deepEqual(navegadorPropio({}), {});
  assert.deepEqual(navegadorPropio({ SC_CHROMIUM: '' }), {});
  assert.deepEqual(navegadorPropio({ SC_CHROMIUM: '/opt/pw-browsers/chromium' }), {
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  });
});

test('las cinco configs de Playwright lo usan en su `use`', () => {
  const configs = readdirSync(RAIZ).filter((f) => /^playwright(\.[\w-]+)?\.config\.ts$/.test(f));
  assert.ok(configs.length >= 5, configs.join(', '));
  for (const f of configs) {
    assert.match(readFileSync(join(RAIZ, f), 'utf8'), /use: \{\s*\.\.\.navegadorPropio\(\),/, f);
  }
});
