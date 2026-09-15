import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiDeTipos, movimientoDeEstilo, seccionDeDoc } from '../../tools/primeng-doc.mjs';

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
