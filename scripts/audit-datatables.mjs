#!/usr/bin/env node
/**
 * AUDIT · las tablas del DS están bien cableadas.
 *
 * POR QUÉ ESTÁ EN `verify` Y NO ES UN COMANDO SUELTO. Nació como
 * `migrate:check`, un gate que medía el DIFF y había que acordarse de correr.
 * Rafa lo señaló el mismo día: una herramienta que no está en una cadena
 * automática no es una herramienta, es documentación — y la documentación que
 * hay que recordar se pierde. Al reescribirlo se vio que casi todo lo que
 * comprobaba **no necesitaba el diff**: son INVARIANTES del árbol («toda
 * `<sc-datatable>` lleva la piel», «toda columna sin cabecera tiene nombre
 * accesible»). Un invariante se comprueba siempre, no solo cuando migras.
 *
 * Lo que sí era del diff se cayó a propósito, porque ya lo cubre otra cosa:
 * los dos manifiestos los vigilan `audit:components` y `usage:check`, la
 * paridad de locales la vigila `i18n:check`, y las clases que un e2e usa y
 * desaparecen las caza el propio e2e al ponerse rojo.
 *
 * QUÉ NO HACE, y conviene tenerlo escrito: no juzga si la pantalla se ve bien.
 * Eso es mirarla. La captura es lo que cazó la franja de `caption` y las
 * columnas movidas, y ningún grep habría visto ninguna de las dos.
 *
 * Cada comprobación viene de algo que pasó de verdad al menos una vez.
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

const problemas = [];
const fallo = (donde, que, porque) => problemas.push({ donde, que, porque });

const leer = (f) => {
  try {
    return readFileSync(f, 'utf8');
  } catch {
    return '';
  }
};
/** Sin comentarios HTML: un ejemplo comentado no es una tabla. */
const limpio = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

const APP = 'projects/supervisor/src';
const htmls = sh(`grep -rl '<sc-datatable' ${APP} --include=*.html`).split('\n').filter(Boolean);
const spec = leer('e2e/supervisor/list-table-grammar.spec.ts');

/** Ruta de una página desde su `*.routes.ts`: los directorios están en inglés
 *  (`rules`) y las rutas en español (`reglas`), así que el nombre del
 *  directorio NO sirve — buscarlo por ahí daba 3 falsos positivos de 3. */
const ficherosRutas = sh(`find ${APP} -name '*.routes.ts'`).split('\n').filter(Boolean);

/**
 * Ruta de una página desde los `*.routes.ts`.
 *
 * El nombre del directorio NO sirve: están en inglés (`rules`) y las rutas en
 * español (`reglas`) — buscar por ahí daba 3 falsos positivos de 3.
 *
 * Y hay un segundo escalón: las páginas de listado se montan con `path: ''`
 * (la hija por defecto), así que su segmento útil está en el fichero PADRE que
 * las carga con `loadChildren`. Sin subir un nivel, 4 de 9 páginas salían como
 * «no consigo deducir su ruta» — un gate que no sabe medir 4 de 9 se ignora.
 */
const rutaDe = (html) => {
  const base = html.split('/').pop().replace('.html', '');
  for (const rf of ficherosRutas) {
    const txt = leer(rf);
    for (const bloque of txt.split(/(?=\bpath:)/)) {
      if (!bloque.includes(base)) continue;
      const hoja = bloque.match(/path:\s*'([^']*)'/)?.[1];
      if (hoja) return hoja.split('/').pop();
      // `path: ''` → el segmento vive en quien monta ESTE fichero de rutas.
      const nombre = rf.split('/').pop().replace('.routes.ts', '');
      for (const padre of ficherosRutas) {
        if (padre === rf) continue;
        for (const b2 of leer(padre).split(/(?=\bpath:)/)) {
          if (!b2.includes(`${nombre}.routes`)) continue;
          const seg = b2.match(/path:\s*'([^']*)'/)?.[1];
          if (seg) return seg.split('/').pop();
        }
      }
    }
  }
  /* Componente COMPARTIDO por páginas envoltorio: `repo-list` lo montan nueve
   * rutas de repositorios a través de `instances/*`, así que no aparece en
   * ningún `loadComponent` directo. No es un fallo suyo — basta con que UNA de
   * las rutas de su feature esté vigilada. */
  const feature = html.split('/').slice(0, -2).join('/');
  const rutasFeature = ficherosRutas.filter((rf) => rf.startsWith(feature.split('/').slice(0, -1).join('/')));
  const candidatas = rutasFeature.flatMap((rf) => [...leer(rf).matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]));
  const vigilada = candidatas.find((c) => spec.includes(c));
  return vigilada ?? null;
};

log(`audit:datatables — ${htmls.length} página(s) con <sc-datatable>\n`);

for (const f of htmls) {
  const html = limpio(leer(f));
  const ts = leer(f.replace(/\.html$/, '.ts'));
  const donde = f.replace(`${APP}/app/`, '');

  /* 1 · La piel. Sin ella la tabla no se parece a las otras: filas de 42px
   *     contra 54, cabecera 14px/600 contra 12px/500. */
  for (const etiqueta of html.match(/<sc-datatable[\s\S]*?>/g) ?? []) {
    if (!/class="[^"]*\blist-table\b/.test(etiqueta)) {
      fallo(donde, '<sc-datatable> sin class="list-table"', 'sin la piel la tabla no se parece a las demás (fila de 42px en vez de 54)');
    }
  }

  /* 2 · Las columnas en un `computed()`. En un campo, los TemplateRef de
   *     `viewChild` —que resuelven TARDE— se quedan en `undefined` para
   *     siempre y la tabla pinta `row[field]` en crudo. */
  if (ts && /\bcolumns\s*(:[^=]*)?=\s*\[/.test(ts) && !/\bcolumns\s*=\s*computed/.test(ts)) {
    fallo(donde, 'las columnas son un campo, no un computed()', 'los cellTemplate se quedarían en undefined para siempre');
  }

  /* 3 · Las <ng-template> de celda van FUERA del componente. */
  const dentro = html.match(/<sc-datatable[\s\S]*?<\/sc-datatable>/);
  if (dentro && /<ng-template\s+#/.test(dentro[0])) {
    fallo(donde, 'hay <ng-template #…> DENTRO del <sc-datatable>', 'los viewChild no la resuelven de forma estable: va hermana, no dentro');
  }

  /* 4 · `<th scope="row">` y `<sc-datatable>` en el mismo fichero = la tabla
   *     perdió (o va a perder) sus cabeceras de FILA: el DS solo emite <td>.
   *     Una tabla cuya primera columna etiqueta la fila pasa de navegable a
   *     rejilla anónima para un lector de pantalla. */
  if (/scope="row"/.test(html)) {
    fallo(donde, 'convive <th scope="row"> con <sc-datatable>', 'el DS solo emite <td>: esa tabla no debería estar migrada hasta que soporte cabeceras de fila');
  }

  /* 5 · Columna de acciones anónima. `header: ''` es correcto visualmente,
   *     pero deja un <th> sin nombre para un lector de pantalla — y las tablas
   *     a mano SÍ llevaban su aria-label. Lo destaparon tres revisiones
   *     independientes el mismo día. */
  if (/header:\s*''/.test(ts) && !/headerAriaLabel/.test(ts)) {
    fallo(donde, "hay una columna con header:'' sin headerAriaLabel", 'la columna de acciones queda anónima para un lector de pantalla');
  }

  /* 6 · Cabeceras congeladas al cambiar de idioma. `translate.instant()` dentro
   *     de un `computed()` cuyas dependencias son solo `viewChild` NO se
   *     re-evalúa: el pipe `| translate` que había antes SÍ reaccionaba.
   *     Ningún otro gate lo ve — `i18n:check` solo compara claves y todo el
   *     e2e corre en español. */
  if (/\bcolumns\s*=\s*computed/.test(ts) && /translate\.instant\(/.test(ts) && !/currentLang|onLangChange/.test(ts)) {
    fallo(donde, 'cabeceras con translate.instant() en un computed sin dependencia de idioma', 'se quedan congeladas al cambiar de idioma');
  }

  /* 7 · La red tiene que VISITAR la página. Si su ruta no está en el guardián
   *     de la gramática, ese spec pasa en verde sin mirarla y el "todo verde"
   *     no prueba nada de esta tabla. */
  const ruta = rutaDe(f);
  if (!ruta) {
    fallo(donde, 'no consigo deducir su ruta desde los *.routes.ts', 'compruébalo a mano contra e2e/supervisor/list-table-grammar.spec.ts');
  } else if (!spec.includes(ruta)) {
    fallo(donde, `su ruta ("${ruta}") no está en list-table-grammar.spec.ts`, 'el guardián de la piel pasa en verde SIN VISITAR la página');
  } else if (/\(rowClick\)/.test(html) && !new RegExp(`ABREN_FILA[\\s\\S]*?${ruta}`).test(spec)) {
    fallo(donde, `la fila abre pero "${ruta}" no está en ABREN_FILA`, 'quedan sin comprobar el cursor, el tabindex y la apertura por teclado');
  }
}

log('');
for (const p of problemas) log(`  ✗ [${p.donde}] ${p.que}\n    → ${p.porque}`);

if (problemas.length === 0) {
  log(`✓ audit:datatables OK — ${htmls.length} página(s), todas bien cableadas.`);
  process.exit(0);
}
log(`\n✗ audit:datatables: ${problemas.length} problema(s).`);
process.exit(1);
