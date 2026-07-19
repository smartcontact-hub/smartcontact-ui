#!/usr/bin/env node
/**
 * GATE de migración de tablas a `<sc-datatable>`.
 *
 * POR QUÉ EXISTE. Migrar una tabla tiene consecuencias mecánicas que hoy se
 * descubren tarde y caras: con revisión humana (tres revisores encontraron
 * cuatro cosas en la migración del trío de memory) o con el CI en rojo. Todas
 * las que este script comprueba **ya pasaron de verdad al menos una vez**, y
 * cada una lleva escrito dónde consta. Un gate que tarda segundos sustituye a
 * una revisión que tarda cinco minutos por tabla y se olvida cosas.
 *
 * QUÉ NO HACE. No juzga si la pantalla se ve bien. Eso sigue siendo mirarla:
 * la captura es lo que cazó la franja de `caption` y las columnas movidas, y
 * ningún grep lo habría visto. Este script cubre lo MECÁNICO, que es lo que se
 * olvida por repetitivo, no lo que necesita criterio.
 *
 * CÓMO MIDE. Sobre el DIFF contra un ref (por defecto `HEAD`), no sobre el
 * árbol. Es deliberado: sobre el árbol entero salen huérfanos preexistentes
 * (`rules-divider`, `entities-empty`…) que no ha causado esta migración, el
 * gate cría fama de mentiroso y se acaba silenciando.
 *
 * Uso:  node scripts/migrate-check.mjs [ref]      # por defecto HEAD
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const REF = process.argv[2] ?? 'HEAD';
const log = (s = '') => process.stdout.write(s + '\n');

const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

const problemas = [];
const avisos = [];
const fallo = (que, porque) => problemas.push({ que, porque });
const aviso = (que, porque) => avisos.push({ que, porque });

/** Ficheros tocados respecto al ref (staged + working tree + untracked). */
const tocados = [
  ...new Set(
    [
      ...sh(`git diff --name-only ${REF}`).split('\n'),
      ...sh('git ls-files --others --exclude-standard').split('\n'),
    ].filter(Boolean),
  ),
];

/** Contenido de un fichero en el ref (vacío si no existía). */
const enRef = (f) => sh(`git show ${REF}:${f}`);
const enDisco = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');

/** Quita comentarios HTML para no contar ejemplos comentados. */
const sinComentarios = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/* ── ¿Hay alguna migración en este diff? ──────────────────────────────────── */

const migradas = tocados.filter(
  (f) =>
    f.startsWith('projects/supervisor/src/') &&
    f.endsWith('.html') &&
    !sinComentarios(enRef(f)).includes('<sc-datatable') &&
    sinComentarios(enDisco(f)).includes('<sc-datatable'),
);

if (migradas.length === 0) {
  log('✓ migrate:check — sin migraciones de tabla en este diff, nada que comprobar.');
  process.exit(0);
}

log(`migrate:check — ${migradas.length} tabla(s) migrada(s) en este diff:\n`);
for (const f of migradas) log(`  · ${f.replace('projects/supervisor/src/app/', '')}`);
log('');

/**
 * Ruta de una página a partir de su fichero de componente.
 *
 * Se lee del `*.routes.ts` que la carga con `loadComponent`, porque el nombre
 * del directorio NO sirve: son inglés (`rules`) contra rutas en español
 * (`reglas`). Devuelve el segmento hoja (`reglas`), que es suficiente para
 * buscarlo en el spec.
 */
const rutaDe = (htmlFile) => {
  const base = htmlFile.split('/').pop().replace('.html', '');
  for (const rf of sh("find projects/supervisor/src -name '*.routes.ts'").split('\n').filter(Boolean)) {
    const txt = enDisco(rf);
    // Corta el fichero en bloques por `path:` y quédate con el que menciona el componente.
    const bloques = txt.split(/(?=\bpath:)/);
    for (const b of bloques) {
      if (!b.includes(base)) continue;
      const m = b.match(/path:\s*'([^']*)'/);
      if (m && m[1]) return m[1].split('/').pop();
    }
  }
  return null;
};

const specGramatica = enDisco('e2e/supervisor/list-table-grammar.spec.ts');

for (const f of migradas) {
  const nuevo = sinComentarios(enDisco(f));
  const viejo = sinComentarios(enRef(f));
  const ts = f.replace(/\.html$/, '.ts');
  const tsTexto = enDisco(ts);
  const corto = f.replace('projects/supervisor/src/app/', '');

  /* 1 · La piel. Sin ella la tabla migrada NO se parece a las otras ocho:
   *     filas de 42px contra 54, cabecera 14px/600 contra 12px/500. */
  for (const etiqueta of nuevo.match(/<sc-datatable[\s\S]*?>/g) ?? []) {
    if (!/class="[^"]*\blist-table\b/.test(etiqueta)) {
      fallo(`${corto}: <sc-datatable> sin class="list-table"`, 'sin la piel, la tabla no se parece a las demás (42px de fila en vez de 54)');
    }
  }

  /* 2 · Las columnas en un `computed()`, nunca en un campo. Los TemplateRef de
   *     viewChild resuelven TARDE: en un campo se quedan en `undefined` para
   *     siempre y la tabla pinta `row[field]` en crudo. */
  if (tsTexto && /columns\s*(:[^=]*)?=\s*\[/.test(tsTexto) && !/columns\s*=\s*computed/.test(tsTexto)) {
    fallo(`${corto}: las columnas parecen un campo, no un computed()`, 'los cellTemplate se quedarían en undefined para siempre');
  }

  /* 3 · Las <ng-template> de celda van FUERA del <sc-datatable>. */
  const dentro = nuevo.match(/<sc-datatable[\s\S]*?<\/sc-datatable>/);
  if (dentro && /<ng-template\s+#/.test(dentro[0])) {
    fallo(`${corto}: hay <ng-template #…> DENTRO del <sc-datatable>`, 'los viewChild no la resuelven de forma estable; va hermana, no dentro');
  }

  /* 4 · VETO: el DS no sabe emitir `<th scope="row">`. Una tabla cuya primera
   *     columna etiqueta la fila pierde sus cabeceras de fila y pasa de tabla
   *     navegable a rejilla anónima. No es un aviso, es un no-migrar. */
  if (/scope="row"/.test(viejo)) {
    fallo(`${corto}: la tabla vieja tenía <th scope="row"> y el DS solo emite <td>`, 'perdería las cabeceras de FILA — esta tabla no debe migrar hasta que el DS lo soporte');
  }

  /* 5 · Teclado. Si el <tr> viejo era alcanzable, el nuevo tiene que pedirlo:
   *     `rowsFocusable` está por defecto en FALSE y el tabindex cuelga de él.
   *     Ya pasó: tres tablas quedaron abriendo solo con ratón (WCAG 2.1.1). */
  const filaVieja = viejo.match(/<tr[\s\S]{0,400}?>/g)?.join('') ?? '';
  if (/tabindex/.test(filaVieja) && !/rowsFocusable/.test(nuevo)) {
    fallo(`${corto}: la fila vieja tenía tabindex y la nueva no pide [rowsFocusable]`, 'la fila dejaría de existir para el teclado (WCAG 2.1.1)');
  }
  if (/\(keydown\)/.test(filaVieja) && !/\(rowKeydown\)/.test(nuevo)) {
    fallo(`${corto}: la fila vieja tenía (keydown) y la nueva no engancha (rowKeydown)`, 'se pierde la activación por teclado');
  }

  /* 6 · Ganchos que usan los e2e. Los <td>/<tr> los pinta ahora el DS, así que
   *     las clases de la plantilla desaparecen del DOM. Un spec que se agarre a
   *     ellas no falla con un mensaje claro: casa cero filas y pasa. */
  const clases = (txt) => new Set([...txt.matchAll(/(?:class|data-testid)="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean));
  const perdidas = [...clases(viejo)].filter((c) => !clases(nuevo).has(c));
  for (const c of perdidas) {
    if (sh(`grep -rlF '${c}' e2e/ 2>/dev/null`).trim()) {
      fallo(`${corto}: la clase "${c}" desaparece del DOM y un e2e la usa`, 'ese spec casaría cero elementos y pasaría en verde sin comprobar nada');
    }
  }

  /* 7 · La red tiene que visitar la página. Sin esto `list-table-grammar` pasa
   *     en verde SIN VISITARLA, y el "todo verde" no prueba nada de lo migrado.
   *
   *     La ruta se saca del `*.routes.ts` que carga este componente, NO del
   *     nombre del directorio: los directorios están en inglés (`rules`) y las
   *     rutas en español (`conversaciones/reglas`), así que buscar por el
   *     directorio daba falso positivo en 3 de 3 — y un gate que grita en falso
   *     se acaba silenciando entero. */
  const ruta = rutaDe(f);
  if (!ruta) {
    aviso(`${corto}: no consigo deducir su ruta`, 'compruébalo a mano en e2e/supervisor/list-table-grammar.spec.ts');
  } else if (specGramatica && !specGramatica.includes(ruta)) {
    fallo(`${corto}: la ruta "${ruta}" no está en list-table-grammar.spec.ts`, 'el guardián de la piel pasaría en verde SIN VISITAR la página');
  } else if (/\(rowClick\)/.test(nuevo) && specGramatica && !new RegExp(`ABREN_FILA[\\s\\S]*?${ruta}`).test(specGramatica)) {
    fallo(`${corto}: la fila abre pero "${ruta}" no está en ABREN_FILA`, 'quedan sin comprobar el cursor, el tabindex y la apertura con teclado');
  }

  /* 8 · Cabeceras congeladas. `translate.instant()` dentro de un `computed()`
   *     cuyas dependencias son solo viewChild NO se re-evalúa al cambiar de
   *     idioma: el pipe `| translate` que había antes SÍ lo hacía. */
  if (/columns\s*=\s*computed/.test(tsTexto) && /translate\.instant\(/.test(tsTexto) && !/currentLang|onLangChange/.test(tsTexto)) {
    fallo(`${corto}: cabeceras con translate.instant() en un computed sin dependencia de idioma`, 'las cabeceras se quedan congeladas al cambiar de idioma (antes el pipe sí reaccionaba)');
  }

  /* 9 · Nombre accesible de la columna de acciones. `header: ''` es correcto
   *     visualmente, pero deja un <th> anónimo para un lector de pantalla — y
   *     las tablas a mano SÍ llevaban su aria-label. */
  if (/header:\s*''/.test(tsTexto) && !/headerAriaLabel/.test(tsTexto)) {
    fallo(`${corto}: hay una columna con header:'' sin headerAriaLabel`, 'la columna de acciones queda anónima para un lector de pantalla');
  }
}

/* ── Consecuencias de repo, no de fichero ─────────────────────────────────── */

/* 10 · Los DOS manifiestos. La receta solo mandaba commitear el primero, así
 *      que el segundo rojo llegaba después de creer que ya estaba arreglado. */
if (!tocados.includes('docs/_component-status.json')) {
  fallo('falta regenerar el inventario de componentes', 'corre `node scripts/component-audit.mjs --write` y commitea docs/inventory.md + docs/_component-status.json');
}
if (!tocados.includes('projects/sc-demo/public/usage/_usage-status.json')) {
  fallo('falta regenerar el estado de uso', 'corre `node scripts/usage-status.mjs --write` (NO `usage:capture`, que pisa los PNG)');
}

/* 11 · i18n en los cuatro locales o en ninguno. */
const locales = ['es', 'en', 'fr', 'pt'].map((l) => `projects/supervisor/src/assets/i18n/${l}.json`);
const tocadosLocales = locales.filter((l) => tocados.includes(l));
if (tocadosLocales.length > 0 && tocadosLocales.length < 4) {
  fallo(`solo ${tocadosLocales.length} de 4 locales tocados`, 'i18n:check exige paridad 1:1; el rojo llegaría en CI tras los builds');
}

/* 12 · El DS es un paquete COMPILADO. Si la migración necesitó tocarlo, medir
 *      sin reconstruir da un verde del código anterior. */
if (tocados.some((f) => f.startsWith('projects/ui-smartcontact/src/'))) {
  aviso('el diff toca el DS', 'el supervisor consume `dist/`, no el fuente: `npm run build:components` + REINICIAR el dev server antes de medir nada');
}

/* ── Veredicto ────────────────────────────────────────────────────────────── */

log('');
for (const a of avisos) log(`  ⚠ ${a.que}\n    → ${a.porque}`);
for (const p of problemas) log(`  ✗ ${p.que}\n    → ${p.porque}`);

if (problemas.length === 0) {
  log(`\n✓ migrate:check OK — ${avisos.length} aviso(s), 0 problemas.`);
  log('  Recuerda: esto NO dice que la pantalla se vea bien. Mírala, en claro y en oscuro.');
  process.exit(0);
}
log(`\n✗ migrate:check: ${problemas.length} problema(s).`);
process.exit(1);
