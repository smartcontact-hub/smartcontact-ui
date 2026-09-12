import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ranurasDePrimeng,
  ranurasDelWrapper,
  ranurasEmitidas,
  revisar,
} from '../audit-datatable-slots.mjs';

/*
 * Un gate que no enrojece no es un gate (LEARNINGS #2). Aquí cada una de las tres
 * comprobaciones tiene su caso rojo Y su verde, y los extractores se validan contra
 * un texto cuya respuesta ya se sabe antes de creerse nada de lo que digan.
 *
 * Los tres modos de fallo que esto vigila son SILENCIOSOS —ninguno rompe el build ni
 * ningún test de comportamiento— y por eso el instrumento importa más de lo normal: si
 * un regex deja de casar, el gate saldría verde con el defecto puesto, que es la peor
 * forma de fallar que puede tener un guardián.
 */

const PRIMENG_FALSO = `
    headerTemplate = contentChild('header', { ...(ngDevMode ? {} : {}) });
    bodyTemplate = contentChild('body', { ...(ngDevMode ? {} : {}) });
    footerTemplate = contentChild('footer', { ...(ngDevMode ? {} : {}) });
`;
const TS_FALSO = `
  protected readonly userHeader = contentChild<TemplateRef<unknown>>('header');
  protected readonly userBody = contentChild<TemplateRef<unknown>>('body');
  protected readonly userFooter = contentChild<TemplateRef<unknown>>('footer');
`;
const HTML_FALSO = `
  @if (userFooter()) { <ng-template #footer></ng-template> }
  <ng-template #header>@if (userHeader()) { x }</ng-template>
  <ng-template #body>@if (userBody()) { y }</ng-template>
`;

test('el instrumento LEE: saca las ranuras de PrimeNG y las del wrapper', () => {
  assert.deepEqual([...ranurasDePrimeng(PRIMENG_FALSO)].sort(), ['body', 'footer', 'header']);
  assert.deepEqual([...ranurasDelWrapper(TS_FALSO)].sort(), ['body', 'footer', 'header']);
});

test('`ranurasEmitidas` mira la LLAMADA, no el nombre de la ranura', () => {
  // Es la pieza que distingue «declarada» de «emitida», y la que hace que el ROJO 3
  // signifique algo. Con la llamada, viva; sin ella, muerta aunque el `#nombre` esté.
  const declaradas = new Set(['header', 'footer']);
  assert.deepEqual([...ranurasEmitidas('@if (userHeader()) { x }', declaradas)], ['header']);
  assert.deepEqual([...ranurasEmitidas('<ng-template #header></ng-template>', declaradas)], []);
});

test('el instrumento NO se inventa: sobre un texto sin ranuras saca cero', () => {
  assert.equal(ranurasDePrimeng('const x = 1;').size, 0);
  assert.equal(ranurasDelWrapper('const x = 1;').size, 0);
});

test('VERDE: las tres piezas cuadran y no hay nada que decir', () => {
  const r = revisar({ ts: TS_FALSO, html: HTML_FALSO, primeng: PRIMENG_FALSO });
  assert.deepEqual(r, { total: 3, huerfanas: [], sinReenviar: [], muertas: [] });
});

test('ROJO 1 · HUÉRFANA: declaramos una que PrimeNG ya no tiene', () => {
  // El caso real: una subida de PrimeNG renombra `sorticon`.
  const ts = TS_FALSO + `\n  readonly userSorticon = contentChild<TemplateRef<unknown>>('sorticon');`;
  const html = HTML_FALSO + `\n  @if (userSorticon()) { <ng-template #sorticon></ng-template> }`;
  const r = revisar({ ts, html, primeng: PRIMENG_FALSO });
  assert.deepEqual(r.huerfanas, ['sorticon']);
  assert.deepEqual(r.muertas, [], 'la emite: el fallo es que PrimeNG no la tiene, no que esté muerta');
});

test('ROJO 2 · SIN REENVIAR: PrimeNG trae una nueva y no la recogemos', () => {
  const primeng = PRIMENG_FALSO + `\n    summaryTemplate = contentChild('summary', {});`;
  const r = revisar({ ts: TS_FALSO, html: HTML_FALSO, primeng });
  assert.deepEqual(r.sinReenviar, ['summary']);
  assert.equal(r.total, 4, 'el total sigue a PrimeNG, que es quien manda en cuántas hay');
});

test('ROJO 3 · MUERTA: se declara en el .ts y la plantilla no la emite', () => {
  // El descuido típico al añadir una a mano: el `contentChild` sí, la ranura no.
  const html = HTML_FALSO.replace('@if (userFooter()) { <ng-template #footer></ng-template> }', '');
  const r = revisar({ ts: TS_FALSO, html, primeng: PRIMENG_FALSO });
  assert.deepEqual(r.muertas, ['footer']);
  assert.deepEqual(r.huerfanas, [], 'existe en PrimeNG: el fallo es nuestro, no suyo');
});

test('una ranura declarada NO cuenta como emitida por aparecer solo su nombre', () => {
  // `#footer` en la plantilla sin la llamada `userFooter()` es una ranura vacía: el
  // componente la declara, PrimeNG pinta el elemento, y la del consumidor no sale.
  const html = HTML_FALSO.replace('@if (userFooter()) { <ng-template #footer></ng-template> }',
                                  '<ng-template #footer></ng-template>');
  assert.deepEqual(revisar({ ts: TS_FALSO, html, primeng: PRIMENG_FALSO }).muertas, ['footer']);
});

test('CONTROL vivo: el repo de verdad está en verde ahora mismo', () => {
  const leer = (f) => readFileSync(f, 'utf8');
  const r = revisar({
    ts: leer('projects/ui-smartcontact/src/lib/components/datatable/sc-datatable.component.ts'),
    html: leer('projects/ui-smartcontact/src/lib/components/datatable/sc-datatable.component.html'),
    primeng: leer('node_modules/primeng/fesm2022/primeng-table.mjs'),
  });
  assert.deepEqual({ h: r.huerfanas, s: r.sinReenviar, m: r.muertas }, { h: [], s: [], m: [] });
  assert.ok(r.total >= 30, `PrimeNG declara ${r.total} ranuras; si cae así de golpe, mira el changelog`);
});
