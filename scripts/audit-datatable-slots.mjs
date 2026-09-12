#!/usr/bin/env node
/*
 * GUARDIÁN · las 38 ranuras de plantilla que `sc-datatable` reenvía a `p-table`.
 * ============================================================================
 *
 * POR QUÉ EXISTE. DD-72 hizo que un ejemplo de primeng.dev se pueda pegar dentro de un
 * `<sc-datatable>` y funcione: el componente captura la plantilla del consumidor con
 * `contentChild('<nombre>')` y la vuelve a emitir dentro de una ranura propia. Ese
 * `<nombre>` es un STRING acordado con PrimeNG, y ahí está el peligro: si una subida
 * renombra o quita una ranura, nuestro `contentChild` apunta al vacío **en silencio**.
 * No falla el build, no falla ningún test de comportamiento, y el modelo de column-defs
 * —que es el que usan las 16 tablas de hoy— sigue pintando igual. La ranura simplemente
 * deja de existir para quien la use.
 *
 * Es el mismo modo de fallo que persigue `audit:primeng-coupling` con las clases `.p-*`,
 * y se mide igual: leyendo el CÓDIGO de PrimeNG en `node_modules`, no el DOM. Estático,
 * completo y sin navegador.
 *
 * QUÉ AFIRMA, y cada una tiene su caso rojo en `__tests__`:
 *
 *   1. HUÉRFANAS — toda ranura que declaramos existe en el `Table` de PrimeNG. Es el
 *      aviso de «la subida te la ha renombrado».
 *   2. SIN REENVIAR — toda ranura que PrimeNG tiene la declaramos nosotros. Es el aviso
 *      de «la subida ha traído una nueva»: sin esto, «las 38» envejece sin que nadie lo
 *      note y el número de la documentación pasa a ser mentira.
 *   3. DECLARADA Y MUERTA — toda ranura que declaramos se usa de verdad en la plantilla.
 *      Un `contentChild` que nadie emite es una promesa que no se cumple, y es el error
 *      más fácil de cometer al añadir una a mano.
 *
 * QUÉ HACER SI SE PONE ROJO: mirar el changelog de PrimeNG y ajustar las tres piezas a la
 * vez (el `contentChild` del `.ts`, la ranura del `.html` y el número que cite la doc).
 * NO bajes el listón quitando la ranura de la lista: eso es tapar el aviso.
 */
import { readFileSync } from 'node:fs';

const TS = 'projects/ui-smartcontact/src/lib/components/datatable/sc-datatable.component.ts';
const HTML = 'projects/ui-smartcontact/src/lib/components/datatable/sc-datatable.component.html';
const PRIMENG = 'node_modules/primeng/fesm2022/primeng-table.mjs';

const leer = (f) => {
  try {
    return readFileSync(f, 'utf8');
  } catch {
    return '';
  }
};

/** Las ranuras que declara PrimeNG: `xxxTemplate = contentChild('nombre'`. */
export const ranurasDePrimeng = (fuente) =>
  new Set([...fuente.matchAll(/[a-zA-Z]+Template = contentChild\('([a-z]+)'/g)].map((m) => m[1]));

/** Las que declaramos nosotros: `readonly userX = contentChild<...>('nombre')`. */
export const ranurasDelWrapper = (fuente) =>
  new Set([...fuente.matchAll(/contentChild<TemplateRef<unknown>>\('([a-z]+)'\)/g)].map((m) => m[1]));

/**
 * Las que la plantilla EMITE de verdad. Dos formas, las dos legítimas:
 *   · `@if (userX())` + `<ng-template #x>` — las 34 que el componente no implementa;
 *   · `userX()` dentro de una ranura que el componente ya declaraba (caption, header,
 *     body, emptymessage), donde la del consumidor gana.
 * Se busca la LLAMADA `userX()`, que es lo que de verdad conecta las dos piezas.
 */
export const ranurasEmitidas = (html, declaradas) => {
  const vivas = new Set();
  for (const slot of declaradas) {
    const user = 'user' + slot[0].toUpperCase() + slot.slice(1);
    if (new RegExp(`\\b${user}\\(\\)`).test(html)) vivas.add(slot);
  }
  return vivas;
};

export const revisar = ({ ts, html, primeng }) => {
  const suyas = ranurasDePrimeng(primeng);
  const nuestras = ranurasDelWrapper(ts);
  const emitidas = ranurasEmitidas(html, nuestras);
  return {
    total: suyas.size,
    huerfanas: [...nuestras].filter((s) => !suyas.has(s)).sort(),
    sinReenviar: [...suyas].filter((s) => !nuestras.has(s)).sort(),
    muertas: [...nuestras].filter((s) => !emitidas.has(s)).sort(),
  };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const log = (s = '') => process.stdout.write(s + '\n');
  const primeng = leer(PRIMENG);
  if (!primeng) {
    log('✗ audit:datatable-slots — no encuentro `primeng/fesm2022/primeng-table.mjs`.');
    log('  → sin el código de PrimeNG delante, esto no puede afirmar nada. ¿`npm ci` hecho?');
    process.exit(1);
  }
  const r = revisar({ ts: leer(TS), html: leer(HTML), primeng });
  log('');
  for (const s of r.huerfanas)
    log(`  ✗ \`#${s}\` la declaramos y PrimeNG ya NO la tiene\n    → una subida la renombró o la quitó: el reenvío apunta al vacío, en silencio.`);
  for (const s of r.sinReenviar)
    log(`  ✗ \`#${s}\` existe en PrimeNG y no la reenviamos\n    → un ejemplo de primeng.dev que la use no funcionará dentro de \`<sc-datatable>\`.`);
  for (const s of r.muertas)
    log(`  ✗ \`#${s}\` se declara en el .ts y la plantilla no la emite\n    → un \`contentChild\` que nadie saca es una promesa que no se cumple.`);

  const fallos = r.huerfanas.length + r.sinReenviar.length + r.muertas.length;
  if (fallos === 0) {
    log(`✓ audit:datatable-slots OK — las ${r.total} ranuras de p-table, declaradas y emitidas.`);
    process.exit(0);
  }
  log(`\n✗ audit:datatable-slots: ${fallos} problema(s).`);
  process.exit(1);
}
