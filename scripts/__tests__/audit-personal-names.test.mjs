import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buscar, chequear, DATO_PERMITIDO, esCodigo, NOMBRE_RE } from '../audit-personal-names.mjs';

// Funciones PURAS sobre el texto → fixtures directos, sin tocar el disco. Los ejes que importan
// son los dos lados del patrón: las tres formas reales en que el nombre entraba en un comentario
// (rojo) y lo que se le parece sin ser el nombre (verde), que en un gate de todo el repo es lo que
// daría falsos positivos.

test('rojo: las formas en que el nombre entraba en los comentarios', () => {
  for (const linea of [
    "/* Alineación ÓPTICA, no geométrica (Rafa, 2026-09-24: «veo desalineaciones»). */",
    '<!-- Sin avatar (Rafa, 2026-09-23). -->',
    ' * Lo que Rafa cazó de un vistazo: «nada es clicable en lo nuestro».',
    '  // Decisión de rafa: que no cambie de anchura.',
    '## ⏸️ ESPERANDO A RAFA',
    ' * NO SE APLICA a Rafael Areses, autor del repo.',
  ])
    assert.ok(NOMBRE_RE.test(linea), linea);
});

test('verde: lo que se le parece sin ser el nombre como palabra', () => {
  for (const linea of [
    "name: 'Rafael_3AED',", // identificador de la réplica: `_` es parte de la palabra
    'cd /Users/rafareses/dev/smartcontact-ui', // ruta
    'const ráfaga = rafagas.length;', // palabra que lo contiene
    '/* Alineación óptica (QA visual, 2026-09-24). */', // el comentario ya reescrito
  ])
    assert.ok(!NOMBRE_RE.test(linea), linea);
});

test('NOMBRE_RE no es global: `bash-guard` la reusa con .test() y no puede arrastrar lastIndex', () => {
  assert.equal(NOMBRE_RE.global, false);
  assert.ok(NOMBRE_RE.test('Rafa') && NOMBRE_RE.test('Rafa'));
});

test('qué es código: fuentes, estilos, plantillas, config y hooks; ni docs ni volcados', () => {
  for (const f of [
    'projects/supervisor/src/app/x.component.ts',
    'projects/supervisor/src/app/x.component.html',
    'projects/supervisor/src/styles/_page.scss',
    'projects/design-tokens/src/lib/styles/tokens/layers/02-semantic.css',
    'scripts/hooks/stop-guard.mjs',
    '.github/workflows/ci.yml',
    '.githooks/pre-push',
    'projects/supervisor/src/assets/i18n/es.json',
  ])
    assert.ok(esCodigo(f), f);
  for (const f of ['AGENTS.md', 'docs/DECISIONS.md', 'findings/phase-2.json', 'package-lock.json', 'e2e/x.png'])
    assert.ok(!esCodigo(f), f);
});

test('buscar: devuelve la línea y su número desde 1', () => {
  const texto = "const a = 1;\n/* (Rafa, 2026-09-18) */\nconst b = 2;\n// lo cazó Rafa\n";
  assert.deepEqual(
    buscar(texto).map((h) => h.n),
    [2, 4],
  );
});

test('rojo: una mención sin permiso en un fichero de código', () => {
  const encontrados = new Map([['projects/supervisor/src/app/x.component.ts', buscar('/* (Rafa, 2026-09-18) */')]]);
  const { menciones } = chequear(encontrados, []);
  assert.equal(menciones.length, 1);
  assert.equal(menciones[0].fichero, 'projects/supervisor/src/app/x.component.ts');
});

test('verde: el nombre como DATO declarado; rojo: otra mención en ese MISMO fichero', () => {
  const permitidos = [{ fichero: 'data.ts', texto: "name: 'Rafa Areses'", motivo: 'dato de demo' }];
  const soloDato = new Map([['data.ts', buscar("  name: 'Rafa Areses',")]]);
  assert.deepEqual(chequear(soloDato, permitidos), { menciones: [], podridas: [] });
  // El permiso es de la LÍNEA del dato, no del fichero entero.
  const conComentario = new Map([['data.ts', buscar("  name: 'Rafa Areses',\n/* DEMO (2026-09-14, Rafa) */")]]);
  assert.equal(chequear(conComentario, permitidos).menciones.length, 1);
  // Y no viaja a otro fichero con la misma línea.
  const otroFichero = new Map([['otro.ts', buscar("  name: 'Rafa Areses',")]]);
  assert.equal(chequear(otroFichero, permitidos).menciones.length, 1);
});

test('rojo: una entrada de DATO_PERMITIDO que ya no casa con nada se pudre', () => {
  const permitidos = [{ fichero: 'data.ts', texto: "name: 'Rafa Areses'", motivo: 'dato de demo' }];
  const { podridas } = chequear(new Map(), permitidos);
  assert.equal(podridas.length, 1);
});

test('cada dato permitido lleva fichero, texto y motivo', () => {
  for (const p of DATO_PERMITIDO) {
    assert.ok(p.fichero && p.texto && p.motivo, JSON.stringify(p));
    assert.ok(NOMBRE_RE.test(p.texto), `la entrada no contiene el nombre, así que no permite nada: ${p.texto}`);
  }
});
