import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { puertaBarata } from '../preflight-puerta-barata.mjs';
import { MAX_PALABRAS_FICHA } from '../memory-shape.mjs';

/*
 * La puerta se prueba CON EL FALLO PUESTO y sin él, sobre una memoria de mentira montada en un
 * temporal: una ficha que se pasa del tope tiene que salir aquí, en milisegundos, y no en el
 * minuto cuatro de la cadena. El caso que lo motivó: 2026-09-11 y 2026-09-12, dos cadenas de 8
 * min muertas en el CHECK N por una ficha que había engordado OTRA sesión.
 */

/** Memoria de mentira con las fichas que se le pasen, y el `MEMORY.md` que exige la forma. */
function memoriaFalsa(fichas) {
  const raiz = mkdtempSync(join(tmpdir(), 'sc-puerta-'));
  const dir = join(raiz, '.claude', 'projects', '-repo', 'memory');
  mkdirSync(dir, { recursive: true });
  const indice = fichas
    .map(({ nombre }) => `- [${nombre}](${nombre}.md) — pista`)
    .join('\n');
  writeFileSync(join(dir, 'MEMORY.md'), `# Memory index\n\n${indice}\n`);
  for (const { nombre, palabras } of fichas) {
    const cuerpo = Array.from({ length: palabras }, (_, i) => `p${i}`).join(' ');
    writeFileSync(
      join(dir, `${nombre}.md`),
      `---\nname: ${nombre}\ndescription: d\nmetadata:\n  type: project\n---\n\n${cuerpo}\n`,
    );
  }
  return { raiz, dir };
}

/* `SC_MEMORY_DIR` es la costura que ya publica `memory-shape.mjs`. Sin ella el test pasaba el
 * directorio falso como `cwd` y `localizarMemoria` devolvía la memoria REAL (o nada): la sonda
 * medía otra cosa y los tres casos salían verdes. Lo cazó el caso rojo, que es para lo que está. */
function conMemoria(dir, fn) {
  const previo = process.env.SC_MEMORY_DIR;
  process.env.SC_MEMORY_DIR = dir;
  try {
    return fn();
  } finally {
    if (previo === undefined) delete process.env.SC_MEMORY_DIR;
    else process.env.SC_MEMORY_DIR = previo;
  }
}

test('la puerta barata caza una ficha de memoria pasada de tope ANTES de arrancar la cadena', () => {
  const { raiz, dir } = memoriaFalsa([{ nombre: 'gorda', palabras: MAX_PALABRAS_FICHA + 40 }]);
  try {
    const problemas = conMemoria(dir, () => puertaBarata(process.cwd()));
    assert.equal(problemas.length, 1, 'la ficha pasada tenía que salir');
    assert.match(problemas[0], /gorda\.md/);
    assert.match(problemas[0], new RegExp(`el tope es ${MAX_PALABRAS_FICHA}`));
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('con la memoria en su sitio, la puerta se abre y no dice nada', () => {
  const { raiz, dir } = memoriaFalsa([{ nombre: 'normal', palabras: 30 }]);
  try {
    assert.deepEqual(conMemoria(dir, () => puertaBarata(process.cwd())), []);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('sin memoria local (CI u otra máquina) la puerta se abre en vez de fallar', () => {
  const vacio = mkdtempSync(join(tmpdir(), 'sc-sin-memoria-'));
  rmSync(vacio, { recursive: true, force: true }); // la ruta ya no existe: ese es el caso
  assert.deepEqual(conMemoria(vacio, () => puertaBarata(process.cwd())), []);
});
