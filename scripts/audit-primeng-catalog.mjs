#!/usr/bin/env node
/**
 * AUDIT · el catálogo de PrimeNG contra su tabla (`docs/AUDIT-PRIMENG-CATALOGO.md`, DD-195).
 *
 * POR QUÉ. `sc-fileupload` (DD-184) existía en PrimeNG desde siempre y se nos pasó: nada avisaba de «PrimeNG ya trae
 * esto». La tabla del catálogo se hizo a mano el 2026-10-07 y en cuatro días ya decía una versión que no era la
 * instalada. Este gate la mantiene viva: se pone rojo cuando PrimeNG cambia o cuando el repo empieza a usar algo que la
 * tabla no cuenta.
 *
 * QUÉ MIRA.
 *   1. La versión: la de la cabecera del documento («PrimeNG **x.y.z**») frente a la de `package-lock.json`.
 *   2. Cada módulo de `node_modules/primeng/fesm2022` sale en el documento por su nombre, o lo envuelve el DS
 *      (`primengBase` de `docs/_component-status.json`), o es una utilidad sin interfaz (la lista de abajo).
 *   3. Cada `from 'primeng/<x>'` de una app (todo `projects/*` menos el DS y los tokens) que el DS no envuelve tiene su
 *      fila en la sección 3; y cada fila de la sección 3 sigue teniendo quien la importe.
 *   4. Nada de la sección 4 («sin caso») se usa: si algo de ahí lo envuelve el DS o lo importa una app, ya tiene caso.
 *
 * QUÉ HACER SI SE PONE ROJO. Escribir la fila que falta con su juicio (o rehacer la tabla si subió PrimeNG, con la
 * versión y la fecha nuevas en la cabecera). No se apaga quitando un módulo de la cuenta.
 *
 * La comparación es pura (`auditarCatalogo`) y la prueba `scripts/__tests__/audit-primeng-catalog.test.mjs`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Sin interfaz: piezas de la base, utilidades e iconos. No se deciden; se usan por dentro de lo demás. */
export const UTILIDADES = new Set([
  'api', 'base', 'basecomponent', 'baseeditableholder', 'baseinput', 'basemodelholder', 'bind', 'classnames', 'compare',
  'config', 'dom', 'icons', 'license', 'motion', 'passthrough', 'primeng', 'ts-helpers', 'usestyle', 'utils',
]);

/** Los nombres que el documento escribe con mayúscula (`TreeSelect` → `treeselect`); así «aria-label» no cuenta. */
const nombres = (texto) => new Set([...texto.matchAll(/\b[A-Z][A-Za-z]+\b/g)].map((m) => m[0].toLowerCase()));
const seccion = (doc, n) => doc.split(/^## /m).find((s) => s.startsWith(`${n}.`)) ?? '';

/** Los módulos de la primera columna de la tabla de la sección 3 («Tooltip · AutoFocus» son dos). */
export function filasSeccion3(doc) {
  return new Set(
    [...seccion(doc, 3).matchAll(/^\| ([^|]+) \|/gm)]
      .map((r) => r[1].trim())
      .filter((c) => c !== 'Módulo' && !/^-+$/.test(c))
      .flatMap((c) => c.split('·').map((n) => n.trim().toLowerCase())),
  );
}

/**
 * @param {{ doc: string, instalada: string, modulos: string[], envueltos: Set<string>, directos: Map<string, Set<string>> }} e
 *   `modulos`, los de PrimeNG ya sin utilidades; `directos`, módulo → apps que lo importan sin pasar por el DS.
 * @returns {string[]} lo que la tabla no cuenta; vacío si está al día.
 */
export function auditarCatalogo({ doc, instalada, modulos, envueltos, directos }) {
  const errores = [];

  const enDoc = doc.match(/PrimeNG \*\*(\d+\.\d+\.\d+)\*\*/)?.[1];
  if (!enDoc) errores.push('la cabecera no dice la versión («PrimeNG **x.y.z**»).');
  else if (enDoc !== instalada)
    errores.push(`PrimeNG pasó de ${enDoc} (la tabla) a ${instalada} (package-lock.json): rehaz la tabla con la versión nueva.`);

  const enTodo = nombres(doc);
  for (const m of modulos)
    if (!enTodo.has(m) && !envueltos.has(m))
      errores.push(`«${m}»: PrimeNG lo trae y la tabla no lo nombra. Dale fila (sección 1 si tiene caso, 4 si no).`);

  const filas = filasSeccion3(doc);
  for (const [m, apps] of directos)
    if (!envueltos.has(m) && !filas.has(m))
      errores.push(`«${m}»: ${[...apps].join(', ')} lo importa sin wrapper del DS y la sección 3 no tiene su fila.`);
  for (const m of filas)
    if (!directos.has(m)) errores.push(`«${m}»: tiene fila en la sección 3 y ya no lo importa ninguna app. Quita la fila.`);

  for (const m of nombres(seccion(doc, 4)))
    if (modulos.includes(m) && (envueltos.has(m) || directos.has(m)))
      errores.push(`«${m}»: la sección 4 dice que no tiene caso y ya se usa. Pásalo a su sitio.`);

  return errores;
}

/** Las tres listas, leídas del repo. */
export function leerRepo(root) {
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  const instalada = lock.packages?.['node_modules/primeng']?.version;

  const modulos = readdirSync(join(root, 'node_modules/primeng/fesm2022'))
    .filter((f) => f.endsWith('.mjs') && !f.startsWith('primeng-types-') && !f.startsWith('primeng-icons-'))
    .map((f) => f.replace(/^primeng-/, '').replace(/\.mjs$/, ''))
    .filter((m) => !UTILIDADES.has(m));

  const estado = JSON.parse(readFileSync(join(root, 'docs/_component-status.json'), 'utf8'));
  const envueltos = new Set();
  for (const c of estado.components)
    for (const m of (c.primengBase ?? '').matchAll(/primeng\/([a-z]+)/g)) if (!UTILIDADES.has(m[1])) envueltos.add(m[1]);

  const FUERA = new Set(['ui-smartcontact', 'ui-smartcontact-icons', 'design-tokens']);
  const directos = new Map();
  const recorre = (dir, app) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) recorre(p, app);
      else if (e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts'))
        for (const m of readFileSync(p, 'utf8').matchAll(/from 'primeng\/([a-z]+)'/g)) {
          if (UTILIDADES.has(m[1])) continue;
          if (!directos.has(m[1])) directos.set(m[1], new Set());
          directos.get(m[1]).add(app);
        }
    }
  };
  for (const app of readdirSync(join(root, 'projects'))) if (!FUERA.has(app)) recorre(join(root, 'projects', app, 'src'), app);

  return { instalada, modulos, envueltos, directos };
}

if (process.argv[1] && process.argv[1].endsWith('audit-primeng-catalog.mjs')) {
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const DOC = 'docs/AUDIT-PRIMENG-CATALOGO.md';
  const repo = leerRepo(ROOT);
  const errores = auditarCatalogo({ doc: readFileSync(join(ROOT, DOC), 'utf8'), ...repo });
  const sinWrapper = [...repo.directos.keys()].filter((m) => !repo.envueltos.has(m)).length;
  const sinUso = repo.modulos.filter((m) => !repo.envueltos.has(m) && !repo.directos.has(m)).length;
  process.stdout.write(
    `audit:primeng-catalog · PrimeNG ${repo.instalada} · ${repo.modulos.length} módulos con interfaz · ` +
      `${repo.envueltos.size} envueltos por el DS · ${sinWrapper} usados sin wrapper · ${sinUso} sin usar\n`,
  );
  if (errores.length) {
    process.stdout.write(`\n✖ ${DOC} se ha quedado atrás (${errores.length}):\n`);
    for (const e of errores) process.stdout.write(`  · ${e}\n`);
    process.exit(1);
  }
  process.stdout.write('✓ la tabla cuenta todo el catálogo instalado\n');
}
