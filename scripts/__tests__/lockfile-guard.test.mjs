import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

import { desajusteDeVersion } from '../lockfile-guard.mjs';

// El lock repite la versión del paquete raíz en dos sitios y `npm ci` no mira ninguno, así que
// el desajuste pasaba el CI en verde. Cada caso planta el fallo real que se midió el 2026-09-09
// o el falso positivo que apareció al escribir la regla.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const lock = (raiz, dentro) => ({ name: 'x', version: raiz, packages: { '': { name: 'x', version: dentro } } });

test('las tres versiones coinciden → sin desajuste', () => {
  assert.deepEqual(desajusteDeVersion({ version: '1.0.0' }, lock('1.0.0', '1.0.0')), []);
});

test('el fallo REAL de main en bbf9ba9: package.json 1.0.0 y lock 0.2.0 → los dos sitios', () => {
  const d = desajusteDeVersion({ version: '1.0.0' }, lock('0.2.0', '0.2.0'));
  assert.equal(d.length, 2);
  assert.ok(d.every((x) => x.valor === '0.2.0' && x.esperada === '1.0.0'));
  // El mensaje tiene que decir DÓNDE, porque los dos campos se arreglan por separado.
  assert.ok(d.some((x) => x.donde.includes('packages[""]')));
});

test('solo la raíz del lock desfasada → un desajuste, y señala esa', () => {
  const d = desajusteDeVersion({ version: '1.0.0' }, lock('0.2.0', '1.0.0'));
  assert.equal(d.length, 1);
  assert.ok(!d[0].donde.includes('packages[""]'));
});

test('solo packages[""] desfasado → un desajuste, y señala ese', () => {
  const d = desajusteDeVersion({ version: '1.0.0' }, lock('1.0.0', '0.2.0'));
  assert.equal(d.length, 1);
  assert.ok(d[0].donde.includes('packages[""]'));
});

test('un lock sin packages[""] no revienta: cuenta como desajuste', () => {
  const d = desajusteDeVersion({ version: '1.0.0' }, { version: '1.0.0', packages: {} });
  assert.equal(d.length, 1);
  assert.equal(d[0].valor, undefined);
});

// Falso positivo que apareció al escribirlo: las dependencias del lock también tienen "version",
// y una regla que mirase todas las marcaría todas.
test('las versiones de las DEPENDENCIAS no cuentan', () => {
  const l = lock('1.0.0', '1.0.0');
  l.packages['node_modules/@angular/core'] = { version: '22.1.3' };
  assert.deepEqual(desajusteDeVersion({ version: '1.0.0' }, l), []);
});

test('el lock que hay HOY en el repo repite la versión de package.json', () => {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const lk = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));
  assert.deepEqual(desajusteDeVersion(pkg, lk), []);
});
