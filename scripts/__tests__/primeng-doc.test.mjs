import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiConHerencia, apiDeTipos, movimientoDeEstilo, seccionDeDoc } from '../../tools/primeng-doc.mjs';

// Fixtures con la FORMA real de las tres fuentes: un `*-doc.ts` del showcase, un `.d.ts` de
// `node_modules/primeng/types` y una hoja de `@primeuix/styles`.

test('seccionDeDoc: separa el texto de la sección, el código del ejemplo y la clase', () => {
  const ts = `@Component({
    selector: 'scrollable-doc',
    template: \`
        <app-docsectiontext>
            <p>Adding <i>scrollable</i> property displays navigational buttons.</p>
        </app-docsectiontext>
        <div class="card">
            <p-tabs value="0" scrollable></p-tabs>
        </div>
        <app-code></app-code>
    \`,
    standalone: true
})
export class ScrollableDoc {
    tabs = [1, 2];
}`;
  const s = seccionDeDoc(ts);
  assert.equal(s.texto, 'Adding scrollable property displays navigational buttons.');
  assert.match(s.codigo, /<p-tabs value="0" scrollable><\/p-tabs>/);
  assert.doesNotMatch(s.codigo, /app-docsectiontext|app-code/);
  assert.equal(s.clase, 'tabs = [1, 2];');
});

test('apiDeTipos: props con defecto, modelo y OBSOLETA; salidas; ignora lo que no es Props', () => {
  const dts = `declare class Tabs extends BaseComponent<TabsPassThrough> {
    componentName: string;
    /**
     * Value of the active tab.
     * @defaultValue undefined
     * @group Props
     */
    value: _angular_core.ModelSignal<string | number | undefined>;
    /**
     * Scrolling is enabled by default. This property is no longer needed.
     * @defaultValue false
     * @group Props
     * @deprecated Scrolling is now the default behavior.
     */
    scrollable: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /**
     * Internal.
     */
    id: _angular_core.WritableSignal<string>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<Tabs, "p-tabs", never, { "value": { "alias": "value"; }; }, { "value": "valueChange"; }, never, ["*"], true, []>;
}`;
  const [c] = apiDeTipos(dts);
  assert.equal(c.selector, 'p-tabs');
  assert.deepEqual(c.props.map((p) => p.prop), ['value', 'scrollable']);
  assert.equal(c.props[0].modelo, true);
  assert.equal(c.props[1].porDefecto, 'false');
  assert.equal(c.props[1].obsoleta, 'Scrolling is now the default behavior.');
  assert.equal(c.props[0].obsoleta, null);
  assert.deepEqual(c.salidas, ['valueChange']);
});

/* Los tres casos ROJOS del 2026-09-19. Los tres venían del mismo sitio: el patrón solo casaba
 * `declare class X extends BaseComponent`, y PrimeNG 22 no declara así ni los campos de
 * formulario ni las clases genéricas. Medido entonces sobre `node_modules`: `apiDeTipos`
 * devolvía CERO clases para `multiselect`, `select` e `inputtext`, y de `table` sacaba
 * `ColumnFilter` pero no `Table`. Con el informe vacío no se nota: parece que el componente
 * no tiene API, no que no la sepamos leer. */

test('ROJO: un campo de formulario no extiende BaseComponent y se perdía entero', () => {
  // `MultiSelect extends BaseEditableHolder`, `Select extends BaseInput`,
  // `InputText extends BaseModelHolder`. Censo de los 283 .d.ts: 16 + 7 + 2 clases así.
  const dts = `declare class MultiSelect extends BaseEditableHolder<MultiSelectPassThrough> {
    /**
     * Label to display when there are no selections.
     * @group Props
     */
    placeholder: _angular_core.InputSignal<string | undefined>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<MultiSelect, "p-multiselect", never, {}, {}, never, ["*"], true, []>;
}`;
  const [c] = apiDeTipos(dts);
  assert.ok(c, 'una clase que extiende BaseEditableHolder tiene que salir');
  assert.equal(c.selector, 'p-multiselect');
  assert.equal(c.extiende, 'BaseEditableHolder');
  assert.deepEqual(c.props.map((p) => p.prop), ['placeholder']);
});

test('ROJO: la clase GENÉRICA y el selector con genérico — el caso de `Table`', () => {
  // `declare class Table<RowData = any> extends BaseComponent<TablePassThrough>` y
  // `ɵɵComponentDeclaration<Table<any>, "p-table"`: dos genéricos, dos regex que fallaban.
  const dts = `declare class Table<RowData = any> extends BaseComponent<TablePassThrough> implements BlockableUI {
    /**
     * An array of objects to represent dynamic columns.
     * @group Props
     */
    columns: any[];
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<Table<any>, "p-table", never, {}, {}, never, ["*"], true, []>;
}`;
  const [c] = apiDeTipos(dts);
  assert.ok(c, 'una clase genérica tiene que salir');
  assert.equal(c.selector, 'p-table', 'el selector no se lee si la clase del ɵɵ lleva genérico');
  assert.deepEqual(c.props.map((p) => p.prop), ['columns']);
});

test('ROJO: `InputText` es DIRECTIVA, y se declara con ɵɵDirectiveDeclaration', () => {
  const dts = `declare class InputText extends BaseModelHolder<InputTextPassThrough> {
    /**
     * Spans 100% width of the container when enabled.
     * @group Props
     */
    fluid: _angular_core.InputSignalWithTransform<boolean, unknown>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<InputText, "[pInputText]", never, {}, {}, never, never, true, []>;
}`;
  const [c] = apiDeTipos(dts);
  assert.equal(c.selector, '[pInputText]');
});

test('apiConHerencia: une las props de la cadena, las marca, y las propias GANAN', () => {
  /* Las bases no son andamiaje: `BaseEditableHolder` documenta `required/invalid/disabled/name`
   * y `BaseInput` diez más. Sin la cadena, `<p-select>` perdía 14 props que sí acepta, y un
   * contrato generado las habría llamado «nuestras». */
  const ficheros = {
    select: `declare class Select extends BaseInput<SelectPassThrough, any> {
    /**
     * Placeholder propio.
     * @group Props
     */
    placeholder: _angular_core.InputSignal<string>;
    /**
     * El de Select manda sobre el de la base.
     * @group Props
     */
    size: _angular_core.InputSignal<string>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<Select, "p-select", never, {}, {}, never, ["*"], true, []>;
}`,
    baseinput: `declare class BaseInput<PT = any, TMinMax = number> extends BaseEditableHolder<PT> {
    /**
     * Tamaño heredado, el que NO debe ganar.
     * @group Props
     */
    size: _angular_core.InputSignal<string>;
    /**
     * Longitud máxima.
     * @group Props
     */
    maxlength: _angular_core.InputSignal<number>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<BaseInput, "", never, {}, {}, never, [], true, []>;
}`,
    baseeditableholder: `declare class BaseEditableHolder<PT = any> extends BaseModelHolder<PT> {
    /**
     * Inválido.
     * @group Props
     */
    invalid: _angular_core.InputSignal<boolean>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<BaseEditableHolder, "", never, {}, {}, never, [], true, []>;
}`,
  };
  const [c] = apiConHerencia('select', (m) => ficheros[m] ?? null);
  const por = Object.fromEntries(c.props.map((p) => [p.prop, p]));

  assert.deepEqual(Object.keys(por).sort(), ['invalid', 'maxlength', 'placeholder', 'size']);
  assert.equal(por.maxlength.heredadaDe, 'BaseInput', 'la heredada dice de dónde viene');
  assert.equal(por.invalid.heredadaDe, 'BaseEditableHolder', 'la cadena no se para en el primer salto');
  assert.equal(por.placeholder.heredadaDe, undefined, 'la propia no se marca como heredada');
  assert.equal(por.size.descripcion, 'El de Select manda sobre el de la base.');
  assert.equal(por.size.heredadaDe, undefined, 'la propia GANA sobre la homónima de la base');
});

test('apiConHerencia: un módulo que no existe no revienta, y una cadena circular termina', () => {
  assert.deepEqual(apiConHerencia('noexiste', () => null), []);
  const circular = {
    a: `declare class A extends BaseInput<X> {
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<A, "p-a", never, {}, {}, never, [], true, []>;
}`,
    baseinput: `declare class BaseInput extends BaseComponent<X> {
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<BaseInput, "", never, {}, {}, never, [], true, []>;
}`,
    basecomponent: `declare class BaseComponent extends BaseInput<X> {
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<BaseComponent, "", never, {}, {}, never, [], true, []>;
}`,
  };
  assert.deepEqual(apiConHerencia('a', (m) => circular[m] ?? null)[0].props, []);
});

test('movimientoDeEstilo: transición, transformación y lo que se oculta; el color no', () => {
  const css = `.p-tab { color: dt('tabs.tab.color'); transition: color dt('tabs.transition.duration'); }
    .p-tablist-active-bar { display: block; transition: width 250ms cubic-bezier(0.35, 0, 0.25, 1); }
    .p-tablist-content::-webkit-scrollbar { display: none; }
    .p-tablist-prev-button:dir(rtl) { transform: rotate(180deg); }`;
  assert.deepEqual(movimientoDeEstilo(css), [
    { selector: '.p-tab', decl: "transition: color dt('tabs.transition.duration')" },
    { selector: '.p-tablist-active-bar', decl: 'transition: width 250ms cubic-bezier(0.35, 0, 0.25, 1)' },
    { selector: '.p-tablist-content::-webkit-scrollbar', decl: 'display: none' },
    { selector: '.p-tablist-prev-button:dir(rtl)', decl: 'transform: rotate(180deg)' },
  ]);
});
