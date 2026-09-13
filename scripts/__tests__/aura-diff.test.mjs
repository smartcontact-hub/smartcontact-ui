import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyReason,
  diffComponent,
  indexCssComments,
  indexKit,
  kitFromFigmaConsoleDtcg,
  kitValue,
  makeLookup,
  normalizeValue,
  parseVarBlocks,
  pickLightDark,
  primengComponentApi,
  resolveValue,
  styleTokenUses,
  templateBindings,
  UNSET,
} from '../../tools/aura-diff.mjs';

/*
 * `tools/aura-diff.mjs` compara nuestro tema con Aura puro clave a clave. Sus tres formas de
 * mentir, cada una con su test:
 *
 *   · DIFERENCIA FALSA. El mismo color escrito distinto (`color-mix(... transparent 84%)`,
 *     `#f8717129`, `rgba(...)`) salía como cambio: en la primera pasada del botón eran 13 de
 *     129 filas. Si la normalización se rompe, estos tests enrojecen.
 *   · CASCADA AL REVÉS. Nuestro CSS de componente trae el bloque de Aura (`light-dark()`) Y
 *     el nuestro detrás, en el mismo `:root`. Si gana el primero, todo sale «igual a Aura».
 *   · HERENCIA INVISIBLE. Una variable sin definir no es un valor: tiene que salir marcada.
 *
 * Las tablas de aquí están escritas a mano: el test no puede depender de la misma resolución
 * que prueba, o se mediría a sí mismo (LEARNINGS #2).
 */

test('light-dark elige por esquema, también anidado', () => {
  assert.equal(pickLightDark('light-dark(#fff, #000)', 'light'), '#fff');
  assert.equal(pickLightDark('light-dark(#fff, #000)', 'dark'), '#000');
  assert.equal(pickLightDark('0 0 light-dark(var(--a), light-dark(#1, #2))', 'dark'), '0 0 #2');
});

test('en el mismo bloque gana la declaración de DETRÁS, y .sc-dark va aparte', () => {
  const css = ':root,:host{--p-x:light-dark(#aura, #auradark);--p-x:#nuestro;}.sc-dark{--p-x:#oscuro;}';
  const blocks = parseVarBlocks(css);
  const lookup = makeLookup(blocks);
  assert.equal(lookup('--p-x', 'light'), '#nuestro');
  assert.equal(lookup('--p-x', 'dark'), '#oscuro');
});

test('en oscuro, sin redeclarar, cae al :root', () => {
  const lookup = makeLookup(parseVarBlocks(':root{--a:light-dark(#111111, #222222)}'));
  assert.equal(resolveValue('var(--a)', 'light', lookup), '#111111');
  assert.equal(resolveValue('var(--a)', 'dark', lookup), '#222222');
});

test('una variable ausente sale marcada como herencia, no como valor', () => {
  const lookup = makeLookup(parseVarBlocks(':root{--a:var(--nada)}'));
  assert.equal(resolveValue('var(--a)', 'light', lookup), `${UNSET}(--nada)`);
  assert.equal(resolveValue('var(--nada, 2rem)', 'light', lookup), '32px');
});

test('un ciclo no cuelga el resolvedor', () => {
  const lookup = makeLookup(parseVarBlocks(':root{--a:var(--b);--b:var(--a)}'));
  assert.match(resolveValue('var(--a)', 'light', lookup), /ciclo/);
});

test('normalización: el mismo valor escrito de cuatro formas compara igual', () => {
  const kit = '#f8717129';
  assert.equal(normalizeValue('color-mix(in srgb, #f87171, transparent 84%)'), kit);
  assert.equal(normalizeValue('color-mix(in srgb, #f87171 16%, transparent)'), kit);
  assert.equal(normalizeValue('rgba(248, 113, 113, 0.16)'), kit);
  assert.equal(normalizeValue('#F87171FF'), '#f87171');
  assert.equal(normalizeValue('0.875rem'), '14px');
  assert.equal(normalizeValue('200ms'), normalizeValue('0.2s'));
  assert.equal(normalizeValue('calc(2 * 7px)'), '14px');
  // Y lo que NO es igual sigue sin serlo.
  assert.notEqual(normalizeValue('color-mix(in srgb, #f87171 20%, transparent)'), kit);
  assert.equal(normalizeValue('calc(100% - 7px)'), 'calc(100% - 7px)');
});

test('Kit: resuelve referencias, pone px a las medidas y no a los pesos, y lee sombras', () => {
  const byPath = indexKit({
    source: 'x',
    'aura/primitive': { scale: { 2: { $type: 'number', $value: 28 } }, blue: { 700: { $value: '#1b273d' } } },
    'aura/semantic/light': { primary: { color: { $value: '{blue.700}' } } },
    'aura/semantic/dark': { primary: { color: { $value: '#798eab' } } },
    'aura/component/common': {
      button: {
        rounded: { border: { radius: { $type: 'number', $value: '{scale.2}' } } },
        label: { font: { weight: { $type: 'number', $value: 500 } } },
      },
    },
    'aura/effects': {
      button: {
        shadow: { $value: { x: '0', y: '1', blur: '2', spread: '0', color: '#1212170d' } },
        focus: { ring: { shadow: { $value: { x: '0', y: '0', blur: '0', spread: '0', color: '#00000000' } } } },
      },
    },
  });
  assert.equal(kitValue(byPath, 'button.rounded.border.radius', 'light'), '28px');
  assert.equal(kitValue(byPath, 'button.label.font.weight', 'light'), '500');
  assert.equal(kitValue(byPath, 'primary.color', 'light'), '#1b273d');
  assert.equal(kitValue(byPath, 'primary.color', 'dark'), '#798eab');
  assert.equal(kitValue(byPath, 'button.shadow', 'light'), '0 1px 2px 0 #1212170d');
  assert.equal(kitValue(byPath, 'button.focus.ring.shadow', 'light'), 'none');
});

test('el eslabón: PrimeOne ya lo traía → heredado; solo nuestro Kit → nuestro', () => {
  // El hueco del botón: Aura en código 8, PrimeOne 7, Kit 7, nosotros 7.
  assert.equal(classifyReason({ scValue: '7px', auraValue: '8px', kit: '7px', primeOne: '7px', notes: [] }).reason, 'primeone');
  // El primario: Aura esmeralda, PrimeOne azul, Kit navy, nosotros navy.
  assert.equal(classifyReason({ scValue: '#1b273d', auraValue: '#10b981', kit: '#1b273d', primeOne: '#3b82f6', notes: [] }).reason, 'kit');
});

test('PrimeOne volcado con el bridge se lee con la forma del Kit', () => {
  const tok = (synced, type = 'dimension') => ({ $type: type, $value: 'x', $extensions: { 'figma-console-mcp': { lastSyncedValue: synced } } });
  const kit = kitFromFigmaConsoleDtcg({
    primitive: { scale: { '0-5': tok({ 'Mode 1': { literal: 7 } }) }, blue: { 500: tok({ 'Mode 1': { literal: '#3b82f6' } }, 'color') } },
    'semantic-color-scheme': { primary: { color: tok({ Light: { reference: '{primitive.blue.500}' }, Dark: { literal: '#60a5fa' } }, 'color') } },
    'component-common': { button: { gap: tok({ 'Mode 1': { reference: '{primitive.scale.0-5}' } }) } },
  });
  const byPath = indexKit(kit);
  assert.equal(kitValue(byPath, 'button.gap', 'light'), '7px');
  assert.equal(kitValue(byPath, 'primary.color', 'light'), '#3b82f6');
  assert.equal(kitValue(byPath, 'primary.color', 'dark'), '#60a5fa');
});

test('el porqué: Kit manda si casa; el comentario de contraste gana a «sin motivo»', () => {
  assert.equal(classifyReason({ scValue: '7px', auraValue: '8px', kit: '7px', notes: [] }).reason, 'kit');
  assert.equal(classifyReason({ scValue: '#dc2626', auraValue: '#ef4444', kit: '#ef4444', notes: ['AA · 3.76:1'] }).reason, 'accesibilidad');
  assert.equal(classifyReason({ scValue: '#2f3642', auraValue: '#27272a', kit: '#27272a', notes: [] }).reason, 'sin-motivo');
  assert.equal(classifyReason({ scValue: '14px', auraValue: '16px', kit: undefined, notes: [] }).reason, 'sin-motivo');
});

test('comentarios de tokens: explican su grupo hasta la línea en blanco; @sc-gen no es motivo', () => {
  const css = `:root {
  /* contraste AA en oscuro */
  --sc-bg-primary: #1;
  --sc-bg-primary-hover: #2;

  --sc-suelto: #3;
  /* @sc-gen:palette — bloque GENERADO */
  --sc-generado: #4;

  /* ---------- Color · Blue ---------- */
  --sc-rotulo: #5;

  /* ---------- Botón outlined: bajo AA ----------
   * slate-600 da 4.52 */
  --sc-con-rotulo: #6;
}`;
  const index = indexCssComments(css, 'dark');
  assert.deepEqual(index.get('dark|--sc-bg-primary'), ['contraste AA en oscuro']);
  assert.deepEqual(index.get('dark|--sc-bg-primary-hover'), ['contraste AA en oscuro']);
  assert.equal(index.get('dark|--sc-suelto'), undefined);
  assert.equal(index.get('dark|--sc-generado'), undefined);
  // Un rótulo de sección solo nombra; con texto debajo, el rótulo es parte del motivo.
  assert.equal(index.get('dark|--sc-rotulo'), undefined);
  assert.match(index.get('dark|--sc-con-rotulo')[0], /bajo AA\. slate-600 da 4\.52/);
});

test('hoja del componente: qué variable pinta qué propiedad', () => {
  const uses = styleTokenUses(".p-button { color: dt('button.primary.color'); padding: dt('button.padding.y') dt('button.padding.x'); }");
  assert.deepEqual(uses.get('--p-button-primary-color'), ['.p-button { color }']);
  assert.deepEqual(uses.get('--p-button-padding-x'), ['.p-button { padding }']);
});

test('envoltorio: lee lo que la plantilla pasa y lo que PrimeNG declara', () => {
  const html = '<p-button\n  [label]="label()"\n  [severity]="sev()"\n  (onClick)="go($event)">\n</p-button>';
  const bound = templateBindings(html, 'p-button');
  assert.deepEqual(bound.inputs.map((b) => b.name), ['label', 'severity']);
  assert.deepEqual(bound.outputs.map((b) => b.name), ['onClick']);
  const dts = 'static ɵcmp: X<Button, "p-button", never, { "label": { "alias": "label"; "required": false; }; "raised": { "alias": "raised"; "required": false; }; }, { "onClick": "onClick"; "onBlur": "onBlur"; }, [], ["*"], true, never>;\n';
  const api = primengComponentApi(dts, 'p-button');
  assert.deepEqual(api.inputs, ['label', 'raised']);
  assert.deepEqual(api.outputs, ['onClick', 'onBlur']);
});

/*
 * CONTROL CON EL SISTEMA REAL. Hechos del botón medidos a mano el 2026-09-13 contra el
 * preset y el export del Kit; si el empaquetado o la cascada se rompen, esto cambia.
 */
test('botón real: el rojo sólido se aparta de Aura y del Kit por contraste; el relleno viene del Kit', async () => {
  const { rows } = await diffComponent('button');
  const row = (key) => rows.find((r) => r.key === key);

  const danger = row('--p-button-danger-background').schemes.light;
  assert.equal(danger.aura, '#ef4444');
  assert.equal(danger.sc, '#dc2626');
  assert.equal(danger.reason, 'accesibilidad');

  const padding = row('--p-button-padding-y').schemes.light;
  assert.equal(padding.aura, '6px');
  assert.equal(padding.sc, '7px');
  // Medido en PrimeOne 4.0.0: ya dibuja 7, así que no es cosa nuestra sino de PrimeTek.
  assert.equal(padding.primeOne, '7px');
  assert.equal(padding.reason, 'primeone');

  // La fuente del md NO la toca el tema: sale igual que en Aura.
  assert.equal(row('--p-button-font-size').status, 'igual');
});
