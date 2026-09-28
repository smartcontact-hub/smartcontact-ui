import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chromiumLaunchOptions } from '../playwright-chromium-override.mjs';

test('sin SC_CHROMIUM, no toca launchOptions', () => {
  delete process.env['SC_CHROMIUM'];
  assert.deepEqual(chromiumLaunchOptions(), {});
});

test('con SC_CHROMIUM, fija executablePath a esa ruta', () => {
  process.env['SC_CHROMIUM'] = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
  assert.deepEqual(chromiumLaunchOptions(), {
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  });
  delete process.env['SC_CHROMIUM'];
});
