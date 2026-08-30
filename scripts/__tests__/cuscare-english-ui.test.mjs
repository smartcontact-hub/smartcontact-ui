import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * `cuscare` replica una herramienta cuya interfaz está EN INGLÉS. Los rótulos visibles ya lo
 * estaban, pero los nombres accesibles —lo que oye quien navega por voz o con lector de
 * pantalla— se habían escrito en castellano: 66 de ellos (56 fijos + 10 construidos), medidos
 * el 2026-08-30 contra el diccionario real de la app
 * (`assets/i18n/cuscare/en.json`, 1454 claves).
 *
 * No se ven en una captura y por eso ningún gate visual los cazaba. Este test es estático a
 * propósito: mira el CÓDIGO, así que salta en `npm run test:unit` sin levantar navegador.
 *
 * Casa por PALABRAS castellanas inequívocas, no por acentos: «Página» lleva tilde pero
 * «Cerrar» no, y hay nombres correctos en inglés que sí llevan acentos en datos de ejemplo.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = resolve(root, 'projects/cuscare/src');

/** Palabras que solo aparecen si el nombre accesible se escribió en castellano. */
const ES = /\b(Cerrar|Buscar|Buscando|Exportar|Filtrar|Seleccionar|Mostrar|Borrar|Editar|Duplicar|Cargando|Columnas|Ajustes|Anterior|Siguiente|Principal|Página|País|Navegación|Reembolsos|Criterio|Término|Filas por página|Bloqueado)\b/;

/** `aria-label="…"`, `[attr.aria-label]="…"`, `alt`, `title`, `placeholder` — con o sin binding. */
const ATTR = /(?:\[attr\.)?(?:aria-label|alt|title|placeholder)\]?="([^"]*)"/g;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (['.html', '.ts'].includes(extname(p))) yield p;
  }
}

test('cuscare · los nombres accesibles están en inglés, como el resto de su interfaz', () => {
  const hits = [];
  for (const f of files(SRC)) {
    const src = readFileSync(f, 'utf8');
    src.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(ATTR)) {
        if (ES.test(m[1])) hits.push(`${f.replace(root + '/', '')}:${i + 1} → ${m[0]}`);
      }
    });
  }
  assert.deepEqual(
    hits,
    [],
    `Nombres accesibles en castellano en una interfaz inglesa:\n  ${hits.join('\n  ')}\n` +
      'Usa la palabra del diccionario real (Close, Search, Export, Filter, Select all…).',
  );
});
