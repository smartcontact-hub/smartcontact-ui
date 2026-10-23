import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { analizar, cabecera, revisarConjunto, revisarPlantilla, sinComentarios } from '../audit-code-connect.mjs';

const COMPONENTE = 'export class ScBotonComponent {}\n';
const disco = (ficheros) => ({ existe: (r) => r in ficheros, leer: (r) => ficheros[r] });
const plantilla = ({ node = '10-125', source = 'a/sc-boton.ts', component = 'ScBotonComponent', id = 'boton', cuerpo = '' } = {}) =>
  [
    `// url=https://www.figma.com/design/KEY/Nombre?node-id=${node}`,
    `// source=${source}`,
    `// component=${component}`,
    '',
    'import figma from "figma"',
    cuerpo,
    `export default { id: "${id}", example: figma.code\`<sc-boton></sc-boton>\` }`,
  ].join('\n');

test('una plantilla completa y con el componente a la vista no tiene problemas', () => {
  assert.deepEqual(revisarPlantilla(plantilla(), disco({ 'a/sc-boton.ts': COMPONENTE })), []);
});

test('un source que ya no existe se avisa, y no se mira la clase', () => {
  const p = revisarPlantilla(plantilla(), disco({}));
  assert.equal(p.length, 1);
  assert.match(p[0], /no existe/);
});

test('una clase que no está exportada en el source se avisa', () => {
  const p = revisarPlantilla(plantilla({ component: 'ScOtroComponent' }), disco({ 'a/sc-boton.ts': COMPONENTE }));
  assert.equal(p.length, 1);
  assert.match(p[0], /ScOtroComponent.*no es una clase exportada/);
});

test('una clase con el mismo prefijo no cuenta (ScBoton no es ScBotonComponent)', () => {
  const p = revisarPlantilla(plantilla({ component: 'ScBoton' }), disco({ 'a/sc-boton.ts': COMPONENTE }));
  assert.equal(p.length, 1);
});

test('faltan source, component y url: un aviso por cada uno', () => {
  const p = revisarPlantilla('import figma from "figma"\nexport default { id: "x", example: figma.code`` }', disco({}));
  assert.equal(p.length, 3);
});

test('el helper que Figma no define se avisa en el código, pero no en un comentario', () => {
  const ok = revisarPlantilla(plantilla({ cuerpo: '// no uses _fcc_renderHtmlAttribute' }), disco({ 'a/sc-boton.ts': COMPONENTE }));
  assert.deepEqual(ok, []);
  const mal = revisarPlantilla(plantilla({ cuerpo: 'const x = _fcc_renderHtmlAttribute("a", b)' }), disco({ 'a/sc-boton.ts': COMPONENTE }));
  assert.equal(mal.length, 1);
  assert.match(mal[0], /_fcc_renderHtmlAttribute.*no define/);
});

test('dos plantillas al mismo nodo o con el mismo id se avisan', () => {
  const a = { ruta: 'code-connect/a.figma.ts', texto: plantilla() };
  const b = { ruta: 'code-connect/b.figma.ts', texto: plantilla() };
  const c = { ruta: 'code-connect/c.figma.ts', texto: plantilla({ node: '1-2', id: 'otro' }) };
  const p = revisarConjunto([a, b, c]);
  assert.equal(p.length, 2);
  assert.match(p.map((x) => x.frase).join('\n'), /mismo nodo/);
  assert.match(p.map((x) => x.frase).join('\n'), /repiten el `id/);
  assert.deepEqual(revisarConjunto([a, c]), []);
});

test('cabecera y sinComentarios', () => {
  assert.equal(cabecera('// source= a/b.ts \nx', 'source'), 'a/b.ts');
  assert.equal(cabecera('x', 'source'), null);
  assert.equal(sinComentarios('// uno\ncodigo\n  // dos'), 'codigo');
});

test('analizar lee el árbol: verde con un componente a la vista, rojo sin él', () => {
  const raiz = realpathSync(mkdtempSync(join(tmpdir(), 'cc-')));
  try {
    mkdirSync(join(raiz, 'code-connect'));
    mkdirSync(join(raiz, 'a'));
    writeFileSync(join(raiz, 'code-connect', 'sc-boton.figma.ts'), plantilla());
    assert.equal(analizar(raiz).problemas.length, 1, 'sin el componente');
    writeFileSync(join(raiz, 'a', 'sc-boton.ts'), COMPONENTE);
    const r = analizar(raiz);
    assert.deepEqual(r.problemas, []);
    assert.equal(r.plantillas, 1);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('la CLI sale con 1 y dice qué fichero falla', () => {
  const raiz = realpathSync(mkdtempSync(join(tmpdir(), 'cc-')));
  const script = join(dirname(fileURLToPath(import.meta.url)), '..', 'audit-code-connect.mjs');
  try {
    mkdirSync(join(raiz, 'code-connect'));
    writeFileSync(join(raiz, 'code-connect', 'sc-boton.figma.ts'), plantilla());
    let salida = '';
    let codigo = 0;
    try {
      execFileSync('node', [script], { cwd: raiz, encoding: 'utf8', stdio: 'pipe' });
    } catch (e) {
      codigo = e.status;
      salida = e.stdout;
    }
    assert.equal(codigo, 1);
    assert.match(salida, /code-connect\/sc-boton\.figma\.ts → .*no existe/);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});
