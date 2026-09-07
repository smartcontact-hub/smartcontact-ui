#!/usr/bin/env node
/**
 * AUDIT · el código que enseña la doc usa API que EXISTE.
 *
 * En `sc-docs`, cada ejemplo de componente es un `<ng-template>` con componentes reales del DS,
 * pero el CÓDIGO que se muestra debajo no siempre sale de ahí: el Playground se serializa de los
 * args vivos (`storybook/serialize-args.ts`), y las demás stories llevan el snippet ESCRITO A
 * MANO en una constante. Medido el 2026-09-07: de 49 páginas de componente, 44 usan snippets a
 * mano, 71 constantes en total. Nada comprobaba que lo que enseñan siga existiendo.
 *
 * QUÉ COMPARA, Y POR QUÉ NO LO OBVIO. Lo primero que uno intenta es exigir que el snippet sea
 * igual a su `<ng-template>`. Medido antes de escribir esto: de los 71 pares, **31 coinciden y
 * 40 no**, y casi todas las diferencias son DELIBERADAS y buenas — el snippet de `sc-breadcrumb`
 * inlinea los datos para que se vean (`[home]="{ icon: …, command: … }"`) mientras la plantilla
 * los ata a una variable de demo, y el de `sc-bulk-edit-menu` omite el andamiaje que la demo usa
 * para enseñar el resultado. Un gate de igualdad daría 40 falsos positivos de 71, y un guardián
 * con falsos positivos es peor que ninguno: enseña a ignorarlo (LEARNINGS #2).
 *
 * Así que gatea lo que SÍ es un defecto sin discusión: que el snippet enseñe **un componente o
 * una propiedad que no existen**. Ese es el fallo que duele, porque el código de la doc se copia.
 *
 * Dos cosas por snippet:
 *   1. Todo tag `sc-*` que aparezca tiene que ser el selector de un componente del DS.
 *   2. Todo atributo o binding sobre ese tag tiene que ser un `input`/`model`/`output` suyo (o un
 *      atributo genérico de HTML/Angular). Un `model()` llamado `x` acepta además `xChange`, que
 *      es el output implícito del binding de dos vías — sin esa regla el gate marca tres falsos
 *      positivos, comprobado.
 *
 * Estado de arranque, medido: 478 atributos revisados, 0 tags inventados, 0 propiedades muertas.
 *
 * QUÉ HACER SI SE PONE ROJO:
 *   · «no existe el componente» → el snippet enseña un tag que se renombró o murió. Actualízalo.
 *   · «no tiene la propiedad» → la API cambió y la doc se quedó atrás. Actualiza el snippet, o el
 *     componente si el que está mal es él.
 *   · Si de verdad es un caso legítimo que el gate no sabe leer, entra en `PENDIENTES` con su
 *     motivo escrito. La lista solo mengua.
 *
 * ES ESTÁTICO y PURO respecto al texto (funciones exportadas → testeable).
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
 * Atributos que no son API del componente y por tanto no se comprueban: HTML de toda la vida,
 * ARIA, data-*, y la sintaxis estructural de Angular. Acotado a propósito: cuanto más ancho, menos
 * dice el gate.
 */
export const ATRIBUTO_GENERICO =
  /^(class|style|id|type|title|role|href|src|alt|width|height|name|value|placeholder|for|colspan|rowspan|hidden|tabindex|aria-[\w-]+|data-[\w-]+|ng[A-Z]\w*|\*\w+|#\w+)$/;

/** Lee la API pública de los componentes del DS: selector → props que acepta. */
export function apiDeComponentes(ficheros, leer = (f) => readFileSync(f, 'utf8')) {
  const api = {};
  for (const f of ficheros) {
    const t = leer(f);
    const sel = t.match(/selector:\s*'([^']+)'/);
    if (!sel) continue;
    const props = new Set();
    for (const [, nombre, tipo] of t.matchAll(/readonly (\w+)\s*=\s*(input|model|output)\b/g)) {
      props.add(nombre);
      // Un `model()` publica además el output implícito `<nombre>Change` del binding de dos vías.
      if (tipo === 'model') props.add(`${nombre}Change`);
    }
    api[sel[1]] = new Set([...(api[sel[1]] ?? []), ...props]);
  }
  return api;
}

/** Extrae las constantes `X_SNIPPET` de un fichero de demo. */
export function snippetsDe(ts) {
  return [...ts.matchAll(/const (\w+_SNIPPET)\s*=\s*`([\s\S]*?)`;/g)].map((m) => ({
    nombre: m[1],
    codigo: m[2],
  }));
}

/** Tags `sc-*` de un snippet, con los nombres de atributo/binding que llevan encima. */
export function usosDe(codigo) {
  return [...codigo.matchAll(/<(sc-[a-z0-9-]+)([^>]*?)\/?>/g)].map(([, tag, crudo]) => ({
    tag,
    atributos: [...crudo.matchAll(/[\s([]?([a-zA-Z][\w-]*)[\])]?\s*=\s*"/g)].map((m) => m[1]),
  }));
}

/** Revisa UN snippet contra la API real. Devuelve la lista de problemas. */
export function revisarSnippet(ruta, nombre, codigo, api) {
  const problemas = [];
  for (const { tag, atributos } of usosDe(codigo)) {
    if (!api[tag]) {
      problemas.push([
        `${ruta} · ${nombre}: enseña \`<${tag}>\`, que no es ningún componente del DS.`,
        '      → el selector se renombró o murió: actualiza el snippet.',
      ]);
      continue;
    }
    for (const a of atributos) {
      if (ATRIBUTO_GENERICO.test(a)) continue;
      if (api[tag].has(a)) continue;
      problemas.push([
        `${ruta} · ${nombre}: enseña \`${a}\` sobre \`<${tag}>\`, que no lo tiene.`,
        '      → la API cambió y la doc se quedó atrás. El código de la doc se copia.',
      ]);
    }
  }
  return problemas;
}

/** Casos legítimos que el gate no sabe leer. Con su motivo, y solo mengua. */
export const PENDIENTES = {};

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-doc-snippets.mjs')) {
  const componentes = sh(
    "find projects/ui-smartcontact/src/lib/components -name '*.component.ts' -not -path '*/node_modules/*'",
  )
    .split('\n')
    .filter(Boolean);
  const demos = sh(
    "find projects/sc-docs/src/app/pages/components -name '*-demo.component.ts' -not -path '*/node_modules/*'",
  )
    .split('\n')
    .filter(Boolean)
    .sort();

  if (!componentes.length || !demos.length) {
    log('✗ audit:doc-snippets: no encuentro componentes o demos — ¿estás en la raíz del repo?');
    process.exit(1);
  }

  const api = apiDeComponentes(componentes);
  const problemas = [];
  let nSnippets = 0;
  let nAtributos = 0;

  for (const ruta of demos) {
    const ts = readFileSync(ruta, 'utf8');
    for (const { nombre, codigo } of snippetsDe(ts)) {
      nSnippets += 1;
      for (const u of usosDe(codigo)) nAtributos += u.atributos.length;
      if (PENDIENTES[`${ruta}#${nombre}`]) continue;
      problemas.push(...revisarSnippet(ruta.replace(/^.*\/components\//, ''), nombre, codigo, api));
    }
  }

  for (const clave of Object.keys(PENDIENTES)) {
    const [ruta, nombre] = clave.split('#');
    const ts = demos.includes(ruta) ? readFileSync(ruta, 'utf8') : '';
    if (!snippetsDe(ts).some((s) => s.nombre === nombre)) {
      problemas.push([
        `${clave}: PENDIENTES lo cita y ya no existe.`,
        '      → quita su entrada de la lista.',
      ]);
    }
  }

  log(
    `audit:doc-snippets — ${demos.length} demo(s), ${nSnippets} snippet(s) escritos a mano, ` +
      `${nAtributos} atributo(s) revisados contra la API de ${Object.keys(api).length} componentes ` +
      `(pendientes: ${Object.keys(PENDIENTES).length})\n`,
  );

  if (!problemas.length) {
    log('✓ audit:doc-snippets OK — el código que enseña la doc usa componentes y propiedades que existen.');
    process.exit(0);
  }

  log('✗ audit:doc-snippets — la doc enseña API que no existe:');
  for (const [linea, fix] of problemas) {
    log(`  · ${linea}`);
    log(fix);
  }
  process.exit(1);
}
