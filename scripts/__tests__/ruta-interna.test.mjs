import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rutaInterna } from '../../projects/supervisor/src/app/shared/utils/ruta-interna.core.mjs';

const ORIGEN = 'https://sc-supervisor.pages.dev';

test('VERDE: una ruta de la app se respeta, con su consulta y su ancla', () => {
  assert.equal(rutaInterna('/config/aed', ORIGEN), '/config/aed');
  assert.equal(rutaInterna('/admin/agentes?x=1#a', ORIGEN), '/admin/agentes?x=1#a');
});

test('ROJO: //dominio y /\\dominio salen de la app aunque empiecen por /', () => {
  assert.equal(rutaInterna('//evil.example', ORIGEN), null);
  assert.equal(rutaInterna('//evil.example/x', ORIGEN), null);
  assert.equal(rutaInterna('/\\evil.example', ORIGEN), null);
  assert.equal(rutaInterna('/\\/evil.example', ORIGEN), null);
});

test('ROJO: lo que no es una ruta absoluta de la app', () => {
  for (const malo of ['', 'config/aed', 'https://evil.example', 'javascript:alert(1)', null, undefined])
    assert.equal(rutaInterna(malo, ORIGEN), null, String(malo));
});
