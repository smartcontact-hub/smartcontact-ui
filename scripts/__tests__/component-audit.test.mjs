import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MIEMBROS_SIN_DESCRIPCION_MAX,
  PROPS_SOBRE_API_OBSOLETA_MAX,
  WRAPPERS_SOBRE_COMPONENTE_OBSOLETO_MAX,
  analyzeComponent,
  audit,
  contratoDe,
  huerfanas,
  informeSupervisor,
  miembrosPublicos,
  nativasDe,
  obsoletosDe,
  selectoresObsoletos,
  usaSelector,
  usadosEnNativo,
} from '../component-audit.mjs';
import { CUANDO } from '../component-audit-map.mjs';

// analyzeComponent: deriva la clasificación del texto del componente. PURA → fixtures directos.

const base = { pagesText: "{ path: 'foo' }", supervisorBlob: '' };

test('WRAPPER passthrough → STANDARD (pocos inputs, sin CVA)', () => {
  const r = analyzeComponent({
    name: 'divider',
    tsText: "import { DividerModule } from 'primeng/divider';\nselector: 'sc-divider',\n input() a; input() b;",
    htmlText: '<p-divider></p-divider>',
    ...base,
  });
  assert.equal(r.provenance, 'WRAPPER');
  assert.equal(r.kind, 'STANDARD');
  assert.equal(r.primengBase, 'primeng/divider');
});

test('WRAPPER con CVA → EXTENDED + flag cva', () => {
  const r = analyzeComponent({
    name: 'select',
    tsText: "import { SelectModule } from 'primeng/select';\nimport { PrimeTemplate } from 'primeng/api';\nselector: 'sc-select',\n implements ControlValueAccessor",
    htmlText: '<p-select></p-select>',
    ...base,
  });
  assert.equal(r.kind, 'EXTENDED');
  assert.equal(r.cva, true);
  assert.equal(r.primengBase, 'primeng/select'); // primeng/api se ignora (utilidad)
});

test('WRAPPER con muchos inputs (≥4) → EXTENDED aunque no haya CVA', () => {
  const r = analyzeComponent({ name: 'button', tsText: "from 'primeng/button';\nselector: 'sc-button',\ninput()a;input()b;input()c;input()d;", htmlText: '', ...base });
  assert.equal(r.kind, 'EXTENDED');
});

test('CUSTOM = sin import primeng', () => {
  const r = analyzeComponent({ name: 'empty-state', tsText: "selector: 'sc-empty-state',\n input() a;", htmlText: '<div></div>', ...base });
  assert.equal(r.provenance, 'CUSTOM');
  assert.equal(r.kind, 'CUSTOM');
  assert.equal(r.primengBase, '—');
});

test('anidados excluyen sc-icon y el propio selector; cuenta usos en Supervisor', () => {
  const r = analyzeComponent({
    name: 'section-card',
    tsText: "selector: 'sc-section-card',",
    htmlText: '<sc-icon></sc-icon> <sc-slot></sc-slot> <sc-section-card>',
    pagesText: '',
    supervisorBlob: '<sc-section-card> uno <sc-section-card class="x"> dos',
  });
  assert.deepEqual(r.nested, ['sc-slot']); // sc-icon fuera, self fuera
  assert.equal(r.usedInSupervisor, 2);
  assert.equal(r.hasDemo, false);
});

// Los comentarios no cuentan como código. El caso real (2026-08-14): el docstring de
// `sc-button` pasó a explicar su "API pública `input()/output()`" al migrarlo a señales y su
// cuenta subió de 15 a 16 inputs sin haber cambiado la superficie del componente.
test('un `input()` MENCIONADO en un comentario no suma a la cuenta', () => {
  const conComentario = analyzeComponent({
    name: 'button',
    tsText: "/** API pública `input()/output()`. */\nselector: 'sc-button',\nreadonly a = input('');",
    htmlText: '',
    ...base,
  });
  const sinComentario = analyzeComponent({
    name: 'button',
    tsText: "selector: 'sc-button',\nreadonly a = input('');",
    htmlText: '',
    ...base,
  });
  assert.equal(conComentario.inputs, 1);
  assert.equal(conComentario.inputs, sinComentario.inputs);
  assert.deepEqual(conComentario.api, ['a']);
});

test('un comentario que nombra ControlValueAccessor no marca el componente como CVA', () => {
  const r = analyzeComponent({
    name: 'button',
    tsText: "// no implementa ControlValueAccessor a propósito\nselector: 'sc-button',",
    htmlText: '',
    ...base,
  });
  assert.equal(r.cva, false);
});

test('hasDemo detecta la página por path', () => {
  const r = analyzeComponent({ name: 'button', tsText: "selector: 'sc-button',", htmlText: '', pagesText: "{ path: 'button' }", supervisorBlob: '' });
  assert.equal(r.hasDemo, true);
});

/* `model()` — la migración a señales de DD-38 destapó dos huecos a la vez. El manifiesto
 * contaba `input()` y `@Input()` pero NO `model()`, así que al pasar `sc-drawer` y `sc-panel`
 * a doble binding nativo bajaron de 8→7 y 4→3 inputs y `sc-panel` se reclasificó de EXTENDED
 * a STANDARD sin haber perdido un solo miembro público. Y no era solo cosa de esa migración:
 * `datatable` y `datepicker` ya usaban `model()` y llevaban tiempo subreportados (24→25, 17→19).
 * Estos dos tests fijan las dos mitades para que no vuelva a colarse. */

test('`model()` cuenta como input — y con 4 llega a EXTENDED', () => {
  const r = analyzeComponent({
    name: 'panel',
    tsText:
      "from 'primeng/panel';\nselector: 'sc-panel',\n" +
      'readonly a = input(1); readonly b = input(2); readonly c = input(3); readonly collapsed = model(false);',
    htmlText: '<p-panel></p-panel>',
    ...base,
  });
  assert.equal(r.inputs, 4, 'un model() es un input: si no se cuenta, la clasificación cambia sola');
  assert.equal(r.kind, 'EXTENDED');
});

test('`model()` publica también su `xChange`, aunque nadie lo escriba', () => {
  const r = analyzeComponent({
    name: 'drawer',
    tsText: "from 'primeng/drawer';\nselector: 'sc-drawer',\nreadonly visible = model(false);",
    htmlText: '<p-drawer></p-drawer>',
    ...base,
  });
  assert.ok(r.api.includes('visible'), 'el model en sí');
  assert.ok(
    r.api.includes('visibleChange'),
    'la mitad implícita del doble binding: un consumidor puede engancharse a ella, así que es API',
  );
});

// ── El CONTRATO: cada miembro, cruzado con la API nativa de la versión instalada ──────────
// Añadido el 2026-09-19. Lo que se prueba aquí es que el instrumento LEE, y que enrojece con
// el caso malo delante: un gate que solo se ha visto pasar no es un gate (LEARNINGS #2).

test('miembrosPublicos: tipo, default, obligatorio y descripción, uno a uno', () => {
  const ts = `export class X {
  /** La etiqueta visible. */
  readonly label = input('');

  readonly variant = input<ScVariant>('primary');

  readonly disabled = input(false, { transform: booleanAttribute });

  readonly total = input(0);

  readonly dato = input.required<string>();

  readonly abierto = model<boolean>(false);

  readonly pulsado = output<MouseEvent>();
}`;
  const m = Object.fromEntries(miembrosPublicos(ts).map((x) => [x.nombre, x]));
  assert.deepEqual(Object.keys(m), ['label', 'variant', 'disabled', 'total', 'dato', 'abierto', 'pulsado']);
  assert.equal(m.label.descripcion, 'La etiqueta visible.');
  assert.equal(m.label.tipo, 'string', 'sin genérico, el tipo se infiere del default, como hace TypeScript');
  assert.equal(m.variant.tipo, 'ScVariant');
  assert.equal(m.variant.porDefecto, "'primary'");
  assert.equal(m.disabled.tipo, 'boolean', 'el `transform: booleanAttribute` dice el tipo');
  assert.equal(m.total.tipo, 'number');
  assert.equal(m.dato.requerido, true);
  assert.equal(m.dato.porDefecto, null);
  assert.equal(m.abierto.clase, 'model');
  assert.equal(m.pulsado.clase, 'output');
  assert.equal(m.pulsado.porDefecto, null, 'un output no tiene valor por defecto');
});

test('ROJO: un genérico ANIDADO no se puede leer con `<[^>]*>` — se corta por la mitad', () => {
  // 9 de las 514 declaraciones del DS son así: `input<readonly ScColumnDef<T>[]>([])`. Un regex
  // que pare en el primer `>` devuelve `readonly ScColumnDef<T` y el tipo queda partido.
  const [m] = miembrosPublicos('  readonly columns = input<readonly ScColumnDef<T>[]>([]);');
  assert.equal(m.tipo, 'readonly ScColumnDef<T>[]');
});

test('ROJO: un comentario de línea ENTRE el JSDoc y el miembro no borra la descripción', () => {
  // El caso real es `sc-search`: JSDoc, luego `// eslint-disable-next-line
  // @angular-eslint/no-output-native`, luego la declaración.
  const ts = `  /** Re-emite keydown del input. */
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly keydown = output<KeyboardEvent>();`;
  assert.equal(miembrosPublicos(ts)[0].descripcion, 'Re-emite keydown del input.');
});

test('miembrosPublicos: las etiquetas @ del JSDoc no entran en la descripción', () => {
  const ts = `  /**
   * Lo que hace.
   * @deprecated usa otra
   */
  readonly x = input('');`;
  assert.equal(miembrosPublicos(ts)[0].descripcion, 'Lo que hace.');
});

test('contratoDe: nativo, nuestro y —el que importa— SIN-VERIFICAR', () => {
  const ts = "  readonly label = input('');\n\n  readonly appearance = input('filled');";
  const nativas = new Map([['label', { descripcion: 'Text of the button.', porDefecto: null, obsoleta: null }]]);

  const con = contratoDe(ts, nativas);
  assert.equal(con.find((m) => m.nombre === 'label').origen, 'nativo');
  assert.equal(con.find((m) => m.nombre === 'label').nativo.descripcion, 'Text of the button.');
  assert.equal(con.find((m) => m.nombre === 'appearance').origen, 'nuestro');
  assert.equal(con.find((m) => m.nombre === 'appearance').nativo, null);

  // Sin API que leer NO se dice «nuestro»: sería afirmar algo que no se ha medido.
  for (const m of contratoDe(ts, null)) {
    assert.equal(m.origen, 'sin-verificar');
    assert.equal(m.nativo, null);
  }
});

test('nativasDe: sin ningún `.d.ts` legible devuelve null, no un Map vacío', () => {
  // Un Map vacío significaría «PrimeNG no tiene ninguna de estas props» y marcaría los 514
  // miembros como nuestros. `null` significa «no se ha podido mirar», que es otra cosa.
  assert.equal(nativasDe(['button'], () => null), null);
  assert.deepEqual(nativasDe([], () => null), new Map(), 'un componente CUSTOM no envuelve nada: eso sí es vacío');
});

test('ROJO: huerfanas caza la prop que PrimeNG renombró bajo nuestros pies', () => {
  const previo = { components: [{ selector: 'sc-drawer', contrato: [{ nombre: 'showCloseIcon', origen: 'nativo' }] }] };
  const igual = [{ selector: 'sc-drawer', contrato: [{ nombre: 'showCloseIcon', origen: 'nativo' }] }];
  const tras = [{ selector: 'sc-drawer', contrato: [{ nombre: 'showCloseIcon', origen: 'nuestro' }] }];

  assert.deepEqual(huerfanas(previo, igual), [], 'sin cambios en PrimeNG, no hay alarma');
  assert.deepEqual(huerfanas(previo, tras), ['sc-drawer.showCloseIcon'], 'la subida se la llevó y hay que enterarse');
  assert.deepEqual(huerfanas(null, tras), [], 'sin contrato previo no se puede afirmar nada');
});

test('trinquetes: los topes dicen la verdad sobre el árbol de HOY', () => {
  const rows = audit();
  const sinDescripcion = rows.flatMap((r) => r.contrato.filter((m) => !m.descripcion && !m.nativo?.descripcion));
  const sobreObsoleta = rows.flatMap((r) => r.contrato.filter((m) => m.nativo?.obsoleta));

  // Sin `node_modules` no hay cruce nativo que medir; el gate ya lo dice y se salta.
  if (rows.every((r) => r.contrato.every((m) => m.origen === 'sin-verificar'))) return;

  assert.ok(sinDescripcion.length <= MIEMBROS_SIN_DESCRIPCION_MAX, `${sinDescripcion.length} miembros sin descripción y el tope es ${MIEMBROS_SIN_DESCRIPCION_MAX}`);
  assert.equal(sinDescripcion.length, MIEMBROS_SIN_DESCRIPCION_MAX, `baja MIEMBROS_SIN_DESCRIPCION_MAX a ${sinDescripcion.length}: un tope holgado deja volver lo que ya salió`);
  assert.ok(sobreObsoleta.length <= PROPS_SOBRE_API_OBSOLETA_MAX, `${sobreObsoleta.length} props sobre API obsoleta y el tope es ${PROPS_SOBRE_API_OBSOLETA_MAX}`);
  assert.equal(sobreObsoleta.length, PROPS_SOBRE_API_OBSOLETA_MAX, `baja PROPS_SOBRE_API_OBSOLETA_MAX a ${sobreObsoleta.length}`);
});

test('ROJO: el recorrido va por FICHERO, que si no dos componentes no existen', () => {
  // `avatar/` tiene `sc-avatar` y `sc-avatargroup`; `field/` tiene `sc-field-label` y
  // `sc-field-msg`. Coger el primer `.component.ts` de cada carpeta daba 54 filas para 56
  // componentes, y el CHECK E de `docs:coherence` cuenta esas filas.
  const selectores = new Set(audit().map((r) => r.selector));
  for (const s of ['sc-avatar', 'sc-avatargroup', 'sc-field-label', 'sc-field-msg'])
    assert.ok(selectores.has(s), `${s} tiene que estar en el registro`);
});

// ── El informe de desvíos del Supervisor ──────────────────────────────────────────────────
// Es el artefacto que contesta «¿qué de PrimeNG no le llega a esta pantalla?». Se prueba que
// FILTRA por uso real y que ORDENA por hueco, porque si listara los 56 componentes o los pusiera
// por orden alfabético dejaría de ser una lista con la que decidir y sería un volcado.

const filaInforme = (over = {}) => ({
  selector: 'sc-x',
  name: 'x',
  primengBase: 'primeng/x',
  usedInSupervisor: 1,
  ocultas: [],
  contrato: [],
  ...over,
});

test('informeSupervisor: solo entra lo que el Supervisor USA, y ordenado por hueco', () => {
  const md = informeSupervisor(
    [
      filaInforme({ selector: 'sc-poco', usedInSupervisor: 9, ocultas: ['a'] }),
      filaInforme({ selector: 'sc-mucho', usedInSupervisor: 1, ocultas: ['a', 'b', 'c'] }),
      filaInforme({ selector: 'sc-sinusar', usedInSupervisor: 0, ocultas: ['a', 'b', 'c', 'd'] }),
    ],
    '22.1.0',
  );
  assert.doesNotMatch(md, /sc-sinusar/, 'un componente que el Supervisor no usa no es un desvío suyo');
  assert.match(md, /\*\*2 componentes\*\*/);
  assert.ok(
    md.indexOf('`sc-mucho`') < md.indexOf('`sc-poco`'),
    'ordena por props escondidas, no por usos: arriba va el hueco más grande, que es lo accionable',
  );
  assert.match(md, /\*\*4 props\*\*/, 'el total suma solo los usados');
});

test('informeSupervisor: la obsoleta se canta arriba aunque el componente no se use', () => {
  /* A propósito: una prop nuestra sobre API `@deprecated` es deuda del DS, no del Supervisor, y
   * desaparecería del informe justo el día que la pantalla deje de usar ese componente. */
  const md = informeSupervisor(
    [
      filaInforme({ selector: 'sc-usado', usedInSupervisor: 3 }),
      filaInforme({
        selector: 'sc-drawer',
        usedInSupervisor: 0,
        contrato: [{ nombre: 'showCloseIcon', nativo: { obsoleta: "use 'closable' instead." } }],
      }),
    ],
    '22.1.0',
  );
  assert.match(md, /`sc-drawer\.showCloseIcon`/);
  assert.match(md, /use 'closable' instead\./);
});

test('informeSupervisor: un wrapper que no esconde nada lo dice, no se calla', () => {
  const md = informeSupervisor([filaInforme({ selector: 'sc-limpio', usedInSupervisor: 2, ocultas: [] })], '22.1.0');
  assert.match(md, /Expone todo lo que PrimeNG documenta/);
});

test('usadosEnNativo: distingue el usado sin wrapper del que nadie ha traído', () => {
  /* El tercer estado. Sin él, el catálogo listaba `menu` (18 usos en el Supervisor), `tabs` y
   * `toolbar` como «nadie los ha envuelto todavía», invitando a envolver lo que DD-113 metió a
   * propósito en nativo. Cuenta tanto la etiqueta como el import, porque una directiva
   * (`pTooltip`) se importa pero no se escribe como `<p-…>`. */
  const catalogo = ['menu', 'tooltip', 'knob', 'picklist'];
  const apps = `
    import { Menu } from 'primeng/menu';
    import { Tooltip } from 'primeng/tooltip';
    <p-menu [model]="items" />
  `;
  const n = usadosEnNativo(catalogo, apps);
  assert.ok(n.has('menu'), 'la etiqueta cuenta');
  assert.ok(n.has('tooltip'), 'el import solo también cuenta: una directiva no se escribe como etiqueta');
  assert.ok(!n.has('knob'), 'lo que no aparece no se inventa');
  assert.ok(!n.has('picklist'), 'ni se cuela por parecido');
});

test('CUANDO cubre los 56 componentes, uno a uno, y no sobra ninguna línea', () => {
  /* El gate del generador lo exige; esto lo fija aquí además para que se vea al leer el test.
   * Una línea huérfana miente igual que una que falta: nombra un componente que ya no existe. */
  const sels = new Set(audit().map((r) => r.selector));
  const claves = new Set(Object.keys(CUANDO));
  assert.deepEqual([...sels].filter((s) => !claves.has(s)), [], 'componentes sin su línea de CUANDO');
  assert.deepEqual([...claves].filter((s) => !sels.has(s)), [], 'líneas de CUANDO sin componente');
});

test('CUANDO empieza por el CASO, no por la descripción', () => {
  /* El formato es el que hace útil la línea: «Para elegir UNO de pocos…» ayuda a decidir;
   * «Componente de selección» no. Se gatea la forma mínima que se puede comprobar: que no
   * arranque describiendo lo que la cosa ES. */
  const malos = Object.entries(CUANDO).filter(([, t]) => /^(Componente|Wrapper|Elemento|Pieza) /.test(t));
  assert.deepEqual(malos.map(([k]) => k), [], 'estas líneas describen en vez de decir cuándo usarlo');
  for (const [sel, texto] of Object.entries(CUANDO)) {
    assert.ok(texto.length > 30, `${sel}: la línea se queda corta para decidir nada`);
    assert.ok(texto.endsWith('.'), `${sel}: la línea no termina en punto`);
  }
});


/* ── COMPONENTES de PrimeNG jubilados enteros ──────────────────────────────────────────────
 *
 * El trinquete de props no podía ver esto: un componente jubilado no aparece en ninguna prop.
 * Los dos tests de abajo son los DOS FALLOS que se cometieron al escribirlo, puestos como caso
 * rojo para que no vuelvan (LEARNINGS 2).
 */

// Un `.d.ts` con DOS clases: una jubilada y otra no. Es la forma real de `primeng-button.d.ts`.
const DTS_DOS_CLASES = `
/**
 * @deprecated Use the \`[pButton]\` directive instead.
 * @group Components
 */
declare class Button extends BaseComponent {
    label: InputSignal<string>;
    static \u0275cmp: _angular_core.\u0275\u0275ComponentDeclaration<Button, "p-button", never, {}, {}, never, never, true, never>;
}
/**
 * ButtonDirective aplica estilo de bot\u00f3n a un elemento.
 * @group Directives
 */
declare class ButtonDirective extends BaseComponent {
    iconOnly: InputSignal<boolean>;
    static \u0275dir: _angular_core.\u0275\u0275DirectiveDeclaration<ButtonDirective, "[pButton]", never, {}, {}, never, never, true, never>;
}
`;

test('selectoresObsoletos NO contagia la obsolescencia de una clase a sus vecinas del fichero', () => {
  const m = selectoresObsoletos('button', () => DTS_DOS_CLASES);
  assert.equal(m.get('p-button'), 'Use the `[pButton]` directive instead.');
  assert.equal(
    m.has('[pButton]'),
    false,
    '`[pButton]` es el RELEVO, no est\u00e1 jubilado: atribuirle la marca de `Button` fue el primer falso positivo',
  );
});

test('selectoresObsoletos PARTE la lista de selectores por comas', () => {
  const dts = `
/**
 * @deprecated Use Select component with \`multiple\` property instead.
 */
declare class MultiSelect extends BaseComponent {
    static \u0275cmp: _angular_core.\u0275\u0275ComponentDeclaration<MultiSelect, "p-multiselect, p-multi-select", never, {}, {}, never, never, true, never>;
}
`;
  const m = selectoresObsoletos('multiselect', () => dts);
  assert.ok(m.has('p-multiselect'), 'buscar la cadena entera no casaba nunca: ese fue el segundo fallo');
  assert.ok(m.has('p-multi-select'));
});

test('selectoresObsoletos devuelve null si el m\u00f3dulo no se puede leer, no un Map vac\u00edo', () => {
  assert.equal(selectoresObsoletos('loquesea', () => null), null, '«no lo tiene» no es «no lo hemos mirado»');
  assert.deepEqual([...obsoletosDe(['a', 'b'], () => null)], [], 'y unidos, no inventan nada');
});

test('usaSelector distingue ELEMENTO de ATRIBUTO, y escapa el selector', () => {
  assert.equal(usaSelector('<p-button [label]="x"></p-button>', 'p-button'), true);
  assert.equal(usaSelector('<p-buttonset></p-buttonset>', 'p-button'), false, 'un prefijo m\u00e1s largo no es el mismo');
  // EL CASO ROJO: metido crudo en una regexp, `[pButtonLabel]` es una clase de caracteres.
  assert.equal(usaSelector('<p>hola</p>', '[pButtonLabel]'), false, '`<p>` casaba con la clase de caracteres');
  assert.equal(usaSelector('<a href="x">y</a>', '[pButtonLabel]'), false);
  assert.equal(usaSelector('<span pButtonLabel>Guardar</span>', '[pButtonLabel]'), true, 'el atributo de verdad s\u00ed');
});

test('analyzeComponent marca el componente montado sobre uno jubilado, y solo ese', () => {
  const obsoletos = new Map([['p-button', 'Use the `[pButton]` directive instead.']]);
  const sobre = analyzeComponent({
    ...base,
    name: 'button',
    tsText: "import { ButtonModule } from 'primeng/button';\nselector: 'sc-button',",
    htmlText: '<p-button [label]="label()"></p-button>',
    obsoletosPrimeng: obsoletos,
  });
  assert.deepEqual(sobre.sobreObsoleto, [{ sel: 'p-button', motivo: 'Use the `[pButton]` directive instead.' }]);

  const limpio = analyzeComponent({
    ...base,
    name: 'boton2',
    tsText: "import { ButtonModule } from 'primeng/button';\nselector: 'sc-boton2',",
    htmlText: '<button pButton>Guardar</button>',
    obsoletosPrimeng: obsoletos,
  });
  assert.deepEqual(limpio.sobreObsoleto, [], 'quien ya usa el relevo no debe salir');
});

test('el trinquete de componentes jubilados est\u00e1 en su n\u00famero MEDIDO', () => {
  const n = audit().flatMap((r) => r.sobreObsoleto).length;
  assert.equal(
    n,
    WRAPPERS_SOBRE_COMPONENTE_OBSOLETO_MAX,
    `hay ${n} componente(s) sobre uno jubilado y el tope dice ${WRAPPERS_SOBRE_COMPONENTE_OBSOLETO_MAX}`,
  );
});
