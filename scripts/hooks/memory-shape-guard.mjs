#!/usr/bin/env node
/**
 * Hook `PostToolUse` (Write|Edit): una escritura en la MEMORIA del agente que rompe su forma avisa EN
 * EL ACTO, a la sesión que la hizo.
 *
 * Por qué (2026-11-04): la memoria vive fuera del repo y la comparten todas las sesiones; su forma la
 * vigila el CHECK N de `docs:coherence` (`scripts/memory-shape.mjs`), que corre dentro de `verify` y del
 * preflight. Una sesión dejó una ficha en 273 palabras y el rojo le salió a OTRA, en su preflight: esa
 * tuvo que esperar 10 minutos a que la ficha dejara de cambiar y recortarla a 247 sin quitar hechos.
 *
 * Qué hace: si `tool_input.file_path` es un `.md` de la carpeta de memoria (`localizarMemoria`), corre
 * `revisarMemoria` y se queda con lo que causa ESTA escritura: el tamaño y la cabecera de esa ficha, el
 * tope de fichas o el del índice. El ≡ índice-fichas lo deja al CHECK N: entre escribir una ficha y su
 * línea en `MEMORY.md` siempre hay un instante descuadrado, y avisar ahí sería ruido. Con problemas,
 * sale con 2 y el motivo en stderr (Claude lo lee; la escritura ya ocurrió). Cualquier otra ruta: sale
 * con 0 sin leer la memoria. Falla ABIERTO.
 */
import { basename, dirname, extname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { leerMemoria, localizarMemoria, revisarMemoria } from '../memory-shape.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));

/** El nombre del fichero si la escritura cae en la carpeta de memoria; null si no. */
export function fichaEscrita(entrada, dirMemoria) {
  const ruta = entrada?.tool_input?.file_path;
  if (typeof ruta !== 'string' || extname(ruta) !== '.md' || !dirMemoria) return null;
  const abs = resolve(entrada.cwd ?? '', ruta);
  return dirname(abs) === resolve(dirMemoria) ? basename(abs) : null;
}

/** De la lista de `revisarMemoria`, lo que causa escribir `nombre`. */
export function problemasDeLaEscritura(problemas, nombre) {
  return problemas.filter((p) => {
    if (/no está enlazada en MEMORY\.md|^MEMORY\.md enlaza /.test(p)) return false;
    if (/^hay \d+ fichas/.test(p)) return nombre !== 'MEMORY.md';
    return p.startsWith(`${nombre} `) || p.startsWith(`${nombre}:`);
  });
}

export function motivo(nombre, problemas) {
  return [
    `sc: ${nombre} deja la memoria del agente fuera de forma (CHECK N de \`docs:coherence\`):`,
    ...problemas.map((p) => `  · ${p}`),
    'Recorta sin quitar hechos o funde con otra ficha, ahora: si no, el rojo le sale a OTRA sesión en su preflight.',
  ].join('\n');
}

/** Los problemas de esta escritura (vacío = calla). `cwd` decide qué repo, y con él qué memoria. */
export function revisarEscritura(entrada, cwd = AQUI) {
  if (extname(String(entrada?.tool_input?.file_path ?? '')) !== '.md') return { nombre: null, problemas: [] };
  const dir = localizarMemoria(cwd);
  const nombre = fichaEscrita(entrada, dir);
  if (!nombre || !existsSync(dir)) return { nombre, problemas: [] };
  return { nombre, problemas: problemasDeLaEscritura(revisarMemoria(leerMemoria(dir)), nombre) };
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const d of process.stdin) raw += d;
  try {
    const { nombre, problemas } = revisarEscritura(JSON.parse(raw || '{}'));
    if (!problemas.length) return;
    process.stderr.write(`${motivo(nombre, problemas)}\n`);
    process.exitCode = 2;
  } catch (e) {
    process.stderr.write(`memory-shape-guard: ${e.message}\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
