import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ATRIBUTO_GENERICO,
  ATRIBUTO_RUIDO,
  DIVERGENCIAS,
  INPUTS_SIN_EJEMPLO_MAX,
  PENDIENTES,
  apiDeComponentes,
  argTypesDe,
  historiasDe,
  inputsDeComponentes,
  inputsSinEjemplo,
  plantillasDe,
  revisarCobertura,
  revisarProyeccion,
  revisarSnippet,
  revisarSubconjunto,
  slotsDeComponentes,
  snippetsDe,
  usosDe,
  usosNormalizados,
} from '../audit-doc-snippets.mjs';

/*
 * El riesgo de este gate no es dejar pasar algo: es CHILLAR de más. Se escribió después de medir
 * que exigir snippet == plantilla daría 40 falsos positivos de 71 pares, así que los ejes de
 * exclusión (atributos genéricos, el `xChange` de un `model`) se prueban antes que la detección,
 * y el caso verde se mide sobre el corpus REAL entero, no sobre un fixture amable.
 *
 * 2026-09-11 · el gate gana tres reglas más (subconjunto, cobertura inversa y proyección) y un
 * trinquete de inputs sin ejemplo. Cada una trae aquí su ROJO fabricado con un caso REAL del repo.
 */

const COMPONENTES = execSync(
  "find projects/ui-smartcontact/src/lib/components -name '*.component.ts'",
  { encoding: 'utf8' },
)
  .split('\n')
  .filter(Boolean);
const API = apiDeComponentes(COMPONENTES);
const SLOTS = slotsDeComponentes(COMPONENTES);
const DEMOS = execSync(
  "find projects/sc-docs/src/app/pages/components -name '*-demo.component.ts'",
  { encoding: 'utf8' },
)
  .split('\n')
  .filter(Boolean)
  .sort();

/* ── apiDeComponentes ─────────────────────────────────────────────────────── */

test('lee inputs, models y outputs de un componente', () => {
  const api = apiDeComponentes(['x.ts'], () => `
    @Component({ selector: 'sc-cosa' })
    export class X {
      readonly label = input<string>('');
      readonly clicked = output<void>();
    }`);
  assert.deepEqual([...api['sc-cosa']].sort(), ['clicked', 'label']);
});

test('un model() publica ADEMÁS su xChange (sin esto, 3 falsos positivos reales)', () => {
  const api = apiDeComponentes(['x.ts'], () => `
    @Component({ selector: 'sc-cosa' })
    export class X { readonly selection = model<string>(); }`);
  assert.deepEqual([...api['sc-cosa']].sort(), ['selection', 'selectionChange']);
});

test('la API real trae los componentes del DS y sus props', () => {
  assert.ok(Object.keys(API).length >= 40, `solo leí ${Object.keys(API).length} componentes`);
  assert.ok(API['sc-button']?.has('label'), 'sc-button debería aceptar label');
  assert.ok(API['sc-datatable']?.has('selectionChange'), 'el model de datatable debería dar selectionChange');
});

/* ── usosDe y exclusiones ─────────────────────────────────────────────────── */

test('extrae tag y atributos, en sus tres sintaxis', () => {
  const u = usosDe('<sc-button label="Ok" [loading]="true" (clicked)="x()" />');
  assert.equal(u.length, 1);
  assert.equal(u[0].tag, 'sc-button');
  assert.deepEqual(u[0].atributos.sort(), ['clicked', 'label', 'loading']);
});

test('ROJO: el binding de DOS sentidos `[(x)]` también es un uso', () => {
  // `[(visible)]="open"` es como se abre un diálogo en todos los ejemplos, y no se leía: dos
  // corchetes antes del nombre y la primera versión admitía uno.
  const u = usosDe('<sc-dialog [(visible)]="open" [title]="t" />');
  assert.deepEqual(u[0].atributos.sort(), ['title', 'visible']);
});

test('EXCLUYE atributos que no son API del componente', () => {
  for (const a of ['class', 'aria-label', 'data-testid', 'style', 'id', '*ngIf', '#ref']) {
    assert.ok(ATRIBUTO_GENERICO.test(a), `${a} debería estar excluido`);
  }
});

test('NO excluye un nombre de propiedad cualquiera', () => {
  for (const a of ['label', 'variant', 'selection']) {
    assert.equal(ATRIBUTO_GENERICO.test(a), false, `${a} no debería estar excluido`);
  }
});

test('EXCLUYE lo que no es un tag del DS', () => {
  assert.deepEqual(usosDe('<div foo="1"><p>hola</p></div>'), []);
});

/* ── verde sobre el corpus real (existencia) ──────────────────────────────── */

test('TODOS los snippets del repo usan componentes y props que existen', () => {
  assert.ok(DEMOS.length >= 40, `solo encontré ${DEMOS.length} demos`);
  const problemas = [];
  let nSnippets = 0;
  for (const ruta of DEMOS) {
    for (const { nombre, codigo } of snippetsDe(readFileSync(ruta, 'utf8'))) {
      nSnippets += 1;
      problemas.push(...revisarSnippet(ruta, nombre, codigo, API));
    }
  }
  assert.ok(nSnippets >= 60, `esperaba decenas de snippets, conté ${nSnippets}`);
  assert.deepEqual(problemas.map((p) => p[0]), []);
});

/* ── rojos: los dos defectos que ataja ────────────────────────────────────── */

test('ROJO: el snippet enseña un componente que no existe', () => {
  const p = revisarSnippet('x.ts', 'S', '<sc-inventado label="Ok" />', API);
  assert.equal(p.length, 1);
  assert.match(p[0][0], /no es ningún componente del DS/);
});

test('ROJO: el snippet enseña una prop que el componente ya no tiene', () => {
  const p = revisarSnippet('x.ts', 'S', '<sc-button propiedadMuerta="1" />', API);
  assert.equal(p.length, 1);
  assert.match(p[0][0], /que no lo tiene/);
});

test('VERDE: el mismo snippet con la prop real pasa', () => {
  assert.deepEqual(revisarSnippet('x.ts', 'S', '<sc-button label="Ok" />', API), []);
});

/* ── emparejado story ↔ plantilla ─────────────────────────────────────────── */

const TS_BUTTON = `
const ICONS_SNIPPET = \`<sc-button label="Con icono" icon="check" />\`;
export class ButtonDemoComponent {
  protected readonly iconsTpl = viewChild<TemplateRef<StoryContext>>('icons');
  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const ic = this.iconsTpl();
    if (!ic) return [];
    return [
      { name: 'Iconos y estados', template: ic, snippet: ICONS_SNIPPET },
    ];
  });
}`;

test('historiasDe ata la constante con su `<ng-template #ref>` pasando por viewChild', () => {
  const { historias, sinAtar } = historiasDe(TS_BUTTON);
  assert.deepEqual(sinAtar, []);
  assert.equal(historias.length, 1);
  assert.equal(historias[0].ref, 'icons');
  assert.equal(historias[0].nombre, 'ICONS_SNIPPET');
  assert.match(historias[0].codigo, /sc-button/);
});

test('historiasDe también ata un snippet escrito EN LÍNEA en la story', () => {
  const ts = `
    export class X {
      protected readonly basicoTpl = viewChild<TemplateRef<StoryContext>>('basico');
      protected readonly stories = computed(() => {
        const ba = this.basicoTpl();
        return [
          { name: 'Básico', template: ba, snippet: \`<sc-column-selector [columns]="columns" />\` },
        ];
      });
    }`;
  const { historias } = historiasDe(ts);
  assert.equal(historias.length, 1);
  assert.equal(historias[0].ref, 'basico');
  assert.match(historias[0].codigo, /sc-column-selector/);
});

test('ROJO: una constante `_SNIPPET` que ninguna story ata', () => {
  const { sinAtar } = historiasDe(`${TS_BUTTON}\nconst HUERFANO_SNIPPET = \`<sc-button />\`;`);
  assert.deepEqual(sinAtar, ['HUERFANO_SNIPPET']);
});

test('plantillasDe: un `<ng-template #item>` ANIDADO no corta el bloque de su story', () => {
  const html = [
    '<ng-template #objetos>',
    '  <sc-select [options]="opts">',
    '    <ng-template #item let-opt>★ {{ opt.name }}</ng-template>',
    '  </sc-select>',
    '</ng-template>',
    '<ng-template #otra>',
    '  <sc-select />',
    '</ng-template>',
  ].join('\n');
  const t = plantillasDe(html);
  assert.ok(t.objetos.includes('#item'), 'el bloque debería llegar hasta su cierre en columna 0');
  assert.ok(t.objetos.includes('</sc-select>'));
  assert.ok(!t.objetos.includes('#otra'));
  assert.ok(t.otra.includes('<sc-select />'));
});

/* ── (a) subconjunto normalizado ──────────────────────────────────────────── */

test('usosNormalizados tira el ruido y deja los nombres de API', () => {
  const u = usosNormalizados('<sc-button label="Ok" data-testid="x" class="y" #ref />');
  assert.deepEqual([...u[0].atributos].sort(), ['label']);
  for (const a of ['class', 'style', 'id', 'data-testid', '#ref']) {
    assert.ok(ATRIBUTO_RUIDO.test(a), `${a} es ruido`);
  }
});

test('un componente nombrado en un COMENTARIO no se compara con la demo viva', () => {
  // El snippet de datatable apunta en prosa a `<sc-column-selector>`, que tiene su propia página.
  assert.deepEqual(
    revisarSubconjunto('x', 'S', '<sc-datatable [value]="v" />\n<!-- ver `<sc-column-selector>` -->', '<sc-datatable [value]="v" />', ''),
    [],
  );
  // Pero la comprobación de EXISTENCIA sí lo mira: un comentario que nombra algo muerto miente.
  assert.equal(revisarSnippet('x', 'S', '<!-- <sc-inventado /> -->', API).length, 1);
});

test('ROJO (a): el snippet enseña un atributo que la demo viva no pone', () => {
  const p = revisarSubconjunto(
    'x',
    'S',
    '<sc-empty-state ctaKey="Crear" (cta)="onCreate()" />',
    '<sc-empty-state ctaKey="Crear" />',
    '',
  );
  assert.equal(p.length, 1);
  assert.match(p[0][0], /cta/);
});

test('VERDE (a): `[x]="var"` cubre `x="literal"`, y el andamiaje no cuenta', () => {
  assert.deepEqual(
    revisarSubconjunto(
      'x',
      'S',
      '<sc-breadcrumb [home]="{ icon: \'home\' }" [model]="[{ label: \'A\' }]" />',
      '<div class="col"><sc-breadcrumb [home]="home" [model]="rutas" data-testid="bc" /></div>',
      '',
    ),
    [],
  );
});

test('VERDE (a): el host colocado en OTRA story de la misma página vale', () => {
  assert.deepEqual(
    revisarSubconjunto(
      'x',
      'TRIGGERS',
      '<sc-toast [life]="3000" />',
      '<sc-button label="Avisar" />',
      '<sc-toast [life]="vida" />',
    ),
    [],
  );
});

/* ── (d) cobertura inversa: el caso de button ─────────────────────────────── */

test('ROJO (d) — button #icons: la demo pinta `variant` y `fullWidth` y el snippet no los enseña', () => {
  const snippet = [
    '<sc-button label="Con icono" icon="check" />',
    '<sc-button icon="check" iconAriaLabel="Confirmar" />',
    '<sc-button label="Cargando" [loading]="true" />',
    '<sc-button label="Deshabilitado" [disabled]="true" />',
  ].join('\n');
  const plantilla = [
    '<sc-button label="Con icono" icon="check" />',
    '<sc-button icon="check" iconAriaLabel="Confirmar" data-testid="sc-btn-icononly" />',
    '<sc-button label="Legacy pi" icon="pi pi-trash" variant="danger" data-testid="x" />',
    '<sc-button label="Cargando" [loading]="true" />',
    '<sc-button label="Deshabilitado" [disabled]="true" />',
    '<sc-button label="Full width" [fullWidth]="true" />',
  ].join('\n');
  const p = revisarCobertura('x', 'ICONS_SNIPPET', snippet, plantilla);
  assert.equal(p.length, 1);
  const faltan = p[0][0].match(/`([^`]+)`$/)?.[1].split(', ').sort();
  assert.deepEqual(faltan, ['fullWidth', 'variant']);
});

test('VERDE (d): con esos dos en el snippet, la cobertura pasa', () => {
  assert.deepEqual(
    revisarCobertura(
      'x',
      'S',
      '<sc-button label="A" variant="danger" [fullWidth]="true" />',
      '<sc-button label="A" variant="danger" data-testid="x" />\n<sc-button [fullWidth]="true" />',
    ),
    [],
  );
});

/* ── (c) proyección ──────────────────────────────────────────────────────── */

test('slotsDeComponentes lee los `contentChild` con nombre', () => {
  assert.ok(SLOTS['sc-select']?.has('item'), 'sc-select proyecta #item');
  assert.ok(SLOTS['sc-select']?.has('selectedItem'));
  assert.equal(SLOTS['sc-button'], undefined, 'sc-button no declara slots con nombre');
});

test('ROJO (c) — select: el snippet enseña `pTemplate="item"` y el componente proyecta por `#item`', () => {
  const p = revisarProyeccion(
    'x',
    'OBJETOS_SNIPPET',
    '<sc-select [options]="p">\n  <ng-template pTemplate="item" let-opt>★</ng-template>\n</sc-select>',
    '<sc-select [options]="p">\n  <ng-template #item let-opt>★</ng-template>\n</sc-select>',
    SLOTS,
  );
  assert.equal(p.length, 1);
  assert.match(p[0][0], /pTemplate/);
});

test('VERDE (c): con `#item` pasa; ROJO si el slot no existe', () => {
  const bien = '<sc-select [options]="p">\n  <ng-template #item let-o>★</ng-template>\n</sc-select>';
  assert.deepEqual(revisarProyeccion('x', 'S', bien, bien, SLOTS), []);
  const inventado = '<sc-select [options]="p">\n  <ng-template #inventado let-o>★</ng-template>\n</sc-select>';
  const p = revisarProyeccion('x', 'S', inventado, inventado, SLOTS);
  assert.equal(p.length, 1);
  assert.match(p[0][0], /inventado/);
});

/* ── (b) inputs sin ejemplo: trinquete ────────────────────────────────────── */

test('inputsDeComponentes deja fuera los outputs (solo input/model)', () => {
  const api = inputsDeComponentes(['x.ts'], () => `
    @Component({ selector: 'sc-cosa' })
    export class X {
      readonly label = input<string>('');
      readonly clicked = output<void>();
    }`);
  assert.deepEqual([...api['sc-cosa']], ['label']);
});

test('ROJO: un knob con `options` multilínea NO puede cortar la lista', () => {
  // El caso real: `sc-dialog` tiene `position` con sus opciones en varias líneas, y detrás
  // `draggable`, `resizable` y `dismissableMask`. Con el regex perezoso se leían 9 de 20 y el
  // gate reclamaba ejemplo de tres inputs que llevaban su control desde siempre.
  const nombres = argTypesDe(`argTypes: [
      { name: 'title', control: { kind: 'text' } },
      {
        name: 'position',
        control: {
          kind: 'select',
          options: ['center', 'top', 'bottom'],
        },
      },
      { name: 'draggable', control: { kind: 'boolean' } },
    ],
    defaultArgs: { title: 'x' },`);
  assert.deepEqual([...nombres].sort(), ['draggable', 'position', 'title']);
});

test('argTypesDe lee los knobs del Playground', () => {
  const nombres = argTypesDe(`argTypes: [
    { name: 'label', control: { kind: 'text' } },
    { name: 'variant', control: { kind: 'select', options: ['a'] } },
  ],`);
  assert.deepEqual([...nombres].sort(), ['label', 'variant']);
});

test('(b) un input contado por el knob NO cuenta como sin ejemplo; uno ausente SÍ', () => {
  const inputs = { 'sc-cosa': new Set(['label', 'variant', 'sinRastro', 'inputId']) };
  const faltan = inputsSinEjemplo('sc-cosa', ['<sc-cosa label="A" />'], new Set(['variant']), inputs);
  assert.deepEqual(faltan, ['sinRastro'], '`inputId` es fontanería y `variant` está en los knobs');
});

test('(b) el trinquete solo baja: el corpus real no puede empeorar', () => {
  let n = 0;
  for (const ruta of DEMOS) {
    const ts = readFileSync(ruta, 'utf8');
    const tag = ts.match(/tag:\s*'([\w-]+)'/)?.[1];
    if (!tag) continue;
    // MISMA fuente que el gate: las historias, no solo las constantes. Un snippet escrito EN
    // LÍNEA en la story también documenta, y contar distinto que el gate es medir otra cosa.
    const codigos = historiasDe(ts).historias.map((h) => h.codigo).filter((c) => typeof c === 'string');
    n += inputsSinEjemplo(tag, codigos, argTypesDe(ts), inputsDeComponentes(COMPONENTES)).length;

  }
  assert.ok(
    n <= INPUTS_SIN_EJEMPLO_MAX,
    `${n} inputs públicos sin ejemplo ni knob y el tope es ${INPUTS_SIN_EJEMPLO_MAX}`,
  );
  assert.equal(n, INPUTS_SIN_EJEMPLO_MAX, `baja INPUTS_SIN_EJEMPLO_MAX a ${n}: un tope holgado deja volver lo que ya salió`);
});

/* ── higiene de las listas ───────────────────────────────────────────────── */

test('PENDIENTES y DIVERGENCIAS: cada excepción trae su motivo escrito', () => {
  for (const [clave, motivo] of [...Object.entries(PENDIENTES), ...Object.entries(DIVERGENCIAS)]) {
    assert.ok(motivo && motivo.length > 20, `${clave} necesita un motivo, no una etiqueta`);
  }
});

test('DIVERGENCIAS: ninguna entrada cita una story que ya no existe', () => {
  const claves = new Set();
  for (const ruta of DEMOS) {
    for (const h of historiasDe(readFileSync(ruta, 'utf8')).historias) {
      claves.add(`${ruta.replace(/^.*\/components\//, '')}#${h.nombre ?? h.ref}`);
    }
  }
  for (const c of Object.keys(DIVERGENCIAS)) {
    assert.ok(claves.has(c), `${c}: DIVERGENCIAS lo cita y ya no existe`);
  }
});
