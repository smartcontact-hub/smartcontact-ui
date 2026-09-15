import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aviso, componentesCitados } from '../hooks/primeng-doc-guard.mjs';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), '../hooks/primeng-doc-guard.mjs');

test('el mensaje real de Rafa: cinco componentes, en orden y sin repetir', () => {
  const prompt = `Tenemos un tema con las tabs: https://primeng.dev/tabs

También con el toolbar: https://primeng.dev/toolbar

También inputgroup: https://primeng.dev/inputgroup en combines an input with addons

También https://primeng.dev/divider

Y aquí https://primeng.dev/selectbutton y otra vez https://primeng.dev/tabs`;
  assert.deepEqual(componentesCitados(prompt), ['tabs', 'toolbar', 'inputgroup', 'divider', 'selectbutton']);
});

test('primeng.org y mayúsculas también cuentan', () => {
  assert.deepEqual(componentesCitados('mira https://www.PrimeNG.org/Table#api'), ['table']);
});

test('páginas que no son componente, texto sin enlace y sobres de agente → nada', () => {
  assert.deepEqual(componentesCitados('https://primeng.dev/theming y https://primeng.dev/installation'), []);
  assert.deepEqual(componentesCitados('usa las tabs de primeng'), []);
  assert.deepEqual(componentesCitados('<task-notification> https://primeng.dev/tabs </task-notification>'), []);
  assert.deepEqual(componentesCitados(undefined), []);
});

test('el aviso manda a la herramienta por cada componente y cita la regla y el gate', () => {
  const t = aviso(['tabs', 'toolbar']);
  assert.match(t, /node tools\/primeng-doc\.mjs tabs/);
  assert.match(t, /node tools\/primeng-doc\.mjs toolbar/);
  assert.match(t, /Componentes de primeng\.dev/);
  assert.match(t, /§F/);
});

test('de punta a punta: por stdin, con enlace habla y sin enlace calla', () => {
  const con = execFileSync('node', [HOOK], { input: JSON.stringify({ prompt: 'mete https://primeng.dev/tabs' }), encoding: 'utf8' });
  assert.match(con, /tools\/primeng-doc\.mjs tabs/);
  const sin = execFileSync('node', [HOOK], { input: JSON.stringify({ prompt: 'hola' }), encoding: 'utf8' });
  assert.equal(sin, '');
});
