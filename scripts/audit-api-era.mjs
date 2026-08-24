#!/usr/bin/env node
/**
 * AUDIT · la ERA de la API de los componentes (DD-38).
 *
 * POR QUÉ. En este repo conviven dos formas de declarar la API de un
 * componente: la de decoradores (`@Input()/@Output()`) y la de señales
 * (`input()/model()/output()`). No es una cuestión de gusto: `AGENTS.md`
 * ordena inspeccionar 4 componentes de REFERENCIA antes de generar nada, y
 * hasta el 2026-08-14 esas referencias estaban repartidas entre las dos eras
 * — `sc-button` en decoradores, `sc-toggleswitch`/`sc-inputtext` en señales.
 * O sea que el patrón que copiaba un agente dependía de cuál abriera primero,
 * y así es como una inconsistencia se reproduce sola.
 *
 * CÓMO. Estático, sobre los `.component.ts` de todos los `projects`. Clasifica
 * cada fichero por lo que DECLARA (no por lo que menciona: los comentarios se
 * quitan antes — el único "legacy" que quedaba en el supervisor resultó ser un
 * comentario que EXPLICA por qué NO usa `@Input()`), y lo compara con el
 * trinquete de abajo.
 *
 * ES UN TRINQUETE, NO UN TOPE: la lista solo puede MENGUAR. El guard muerde en
 * las DOS direcciones — si aparece un componente nuevo con decoradores, rojo;
 * y si migras uno de la lista y no lo borras de ella, TAMBIÉN rojo. Sin la
 * segunda mitad la lista se queda con nombres ya migrados y deja de decir la
 * verdad sobre lo que falta, que es justo lo que se le pide.
 *
 * QUÉ HACER SI SE PONE ROJO:
 *   · «declara API de la era vieja» → migra el componente a
 *     `input()/model()/output()` (receta en DD-38); no lo añadas a la lista.
 *   · «ya está migrado» → borra su línea de LEGACY_PENDIENTES. Eso es el
 *     trinquete avanzando: enhorabuena.
 *   · «mezcla las dos eras» → termina la migración de ese fichero. Media
 *     migración es peor que ninguna: la referencia enseña las dos cosas.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const log = (s = '') => process.stdout.write(s + '\n');
const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/**
 * Los ÚNICOS componentes a los que se les tolera `@Input()/@Output()`, por el
 * nombre de su fichero (sin `.component.ts`). Son los que quedaban vivos el
 * 2026-08-14, todos en la librería del DS. Migran por lotes (DD-38) y cada uno
 * que migre sale de aquí. **No se añade nada a esta lista jamás**: si un
 * componente nuevo la necesita, lo que está mal es el componente.
 */
export const LEGACY_PENDIENTES = [
];

/* Los comentarios NO son declaraciones. Mismo gesto que en
 * `audit-primeng-coupling.mjs`: se limpian antes de mirar nada. El caso real
 * que lo obliga es `sidebar-nav-item.component.ts`, cuyo comentario dice
 * «non-signal `@Input()` would break the…» — contarlo lo habría marcado como
 * legacy justo por explicar que no lo es. */
export const sinComentarios = (ts) =>
  ts.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

/**
 * Clasifica un componente por lo que declara. PURA respecto al texto → testeable.
 * @returns {'signals'|'legacy'|'mixta'|'sin-api'}
 */
export function clasificarEra(tsText) {
  const codigo = sinComentarios(tsText);
  const legacy = /@(?:Input|Output)\s*\(/.test(codigo);
  // La convención del repo es única y se verificó fichero a fichero: toda señal
  // se declara `readonly <nombre> = input|model|output(...)`. Anclar en
  // `readonly` evita casar un `.output(` de cualquier otra cosa.
  const signals = /readonly\s+\w+\s*=\s*(?:input|model|output)\s*(?:\.required)?\s*[<(]/.test(codigo);
  if (legacy && signals) return 'mixta';
  if (legacy) return 'legacy';
  if (signals) return 'signals';
  return 'sin-api';
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-api-era.mjs')) {
  const ficheros = sh("find projects -path '*/src/*' -name '*.component.ts' -not -path '*/node_modules/*'")
    .split('\n')
    .filter(Boolean)
    .sort();

  if (!ficheros.length) {
    log('✗ audit:api-era: no encuentro ningún *.component.ts — ¿estás en la raíz del repo?');
    process.exit(1);
  }

  const pendientes = new Set(LEGACY_PENDIENTES);
  const vistos = new Set();
  const problemas = [];
  let signals = 0;
  let legacy = 0;

  for (const f of ficheros) {
    const nombre = f.split('/').pop().replace(/\.component\.ts$/, '');
    const era = clasificarEra(readFileSync(f, 'utf8'));
    vistos.add(nombre);

    if (era === 'signals' || era === 'sin-api') {
      if (era === 'signals') signals++;
      if (pendientes.has(nombre)) {
        problemas.push([
          `${f} ya está migrado a señales, pero sigue en LEGACY_PENDIENTES.`,
          `      → bórralo de la lista en scripts/audit-api-era.mjs (quedarían ${pendientes.size - 1}).`,
        ]);
      }
      continue;
    }

    legacy++;
    if (era === 'mixta') {
      problemas.push([
        `${f} MEZCLA las dos eras (@Input/@Output junto a input()/output()).`,
        '      → termina la migración de este fichero; a medias enseña las dos cosas.',
      ]);
    } else if (!pendientes.has(nombre)) {
      problemas.push([
        `${f} declara API de la era vieja (@Input/@Output) y no está en el trinquete.`,
        '      → migra a input()/model()/output() (DD-38). La lista NO crece.',
      ]);
    }
  }

  for (const n of pendientes) {
    if (!vistos.has(n)) {
      problemas.push([
        `LEGACY_PENDIENTES cita "${n}", que ya no existe como *.component.ts.`,
        '      → bórralo de la lista: un trinquete con nombres muertos deja de contar bien.',
      ]);
    }
  }

  log(
    `audit:api-era — ${ficheros.length} componente(s): ${signals} en señales, ${legacy} en decoradores ` +
      `(trinquete: ${LEGACY_PENDIENTES.length})\n`,
  );

  if (!problemas.length) {
    log('✓ audit:api-era OK — nadie estrena API de decoradores y el trinquete dice la verdad.');
    process.exit(0);
  }

  for (const [titulo, pista] of problemas) {
    log(`  ✗ ${titulo}`);
    log(pista);
  }
  log(`\n✗ audit:api-era: ${problemas.length} problema(s). La era objetivo es señales — DD-38.`);
  process.exit(1);
}
