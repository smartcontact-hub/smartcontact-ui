import { test } from 'node:test';
import assert from 'node:assert/strict';

import { analyzeNativo, estadoDe, motivoRetirado, tieneMaestroEnKit } from '../component-audit.mjs';

// El estado de un componente en sc-docs (DD-190): «ready» con maestro en el Kit y página de demo, «experimental» si le
// falta alguna, «deprecated» si la CLASE lleva `@deprecated`. Cada prueba fija un caso que ya se dio en el repo.

test('listo con maestro en el Kit y demo; experimental dice qué le falta', () => {
  assert.deepEqual(estadoDe({ kit: true, hasDemo: true, retirado: null }), { estado: 'ready', faltas: [] });
  assert.deepEqual(estadoDe({ kit: false, hasDemo: true, retirado: null }), { estado: 'experimental', faltas: ['kit'] });
  assert.deepEqual(estadoDe({ kit: false, hasDemo: false, retirado: null }), { estado: 'experimental', faltas: ['kit', 'demo'] });
});

test('retirado gana a todo lo demás', () => {
  assert.deepEqual(estadoDe({ kit: true, hasDemo: true, retirado: 'Retenido para volver atrás.' }), {
    estado: 'deprecated',
    faltas: [],
  });
});

test('el maestro del Kit casa por nombre y por alias (el Kit escribe «Divide» y «Section»)', () => {
  assert.equal(tieneMaestroEnKit('button'), true);
  assert.equal(tieneMaestroEnKit('divider'), true);
  assert.equal(tieneMaestroEnKit('section-card'), true);
  assert.equal(tieneMaestroEnKit('fact-row'), false);
});

test('solo cuenta el @deprecated de la clase, no el de un alias de tipo del mismo fichero', () => {
  const clase =
    "/** Algo.\n *\n * @deprecated Retenido para volver atrás. Segunda frase.\n *\n * Más texto.\n */\n@Component({ selector: 'sc-x' })\nexport class X {}";
  assert.equal(motivoRetirado(clase), 'Retenido para volver atrás. Segunda frase.');
  const alias =
    "/** @deprecated Usa `ScFieldSize`. */\nexport type Viejo = 'sm';\n\n/** El componente. */\n@Component({ selector: 'sc-y' })\nexport class Y {}";
  assert.equal(motivoRetirado(alias), null);
});

// Un nativo adoptado tal cual (el tooltip del Kit es el `pTooltip` de PrimeNG, DD-212) no tiene fichero nuestro del que
// sacar el contrato: sale del `.d.ts` instalado. El de aquí es un recorte del de PrimeNG 22.1, con su alias.
const DTS_TOOLTIP = `declare class Tooltip extends BaseComponent {
    /**
     * Position of the tooltip.
     * @group Props
     */
    tooltipPosition: _angular_core.InputSignal<TooltipPosition | undefined>;
    /**
     * Shows the tooltip only when the content overflows.
     * @group Props
     */
    showOnEllipsis: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /**
     * Content of the tooltip.
     * @group Props
     */
    content: _angular_core.InputSignal<string | TemplateRef<HTMLElement> | undefined>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<Tooltip, "[pTooltip]", never, { "tooltipPosition": { "alias": "tooltipPosition"; "required": false; "isSignal": true; }; "showOnEllipsis": { "alias": "showOnEllipsis"; "required": false; "isSignal": true; }; "content": { "alias": "pTooltip"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}
`;
const leerTooltip = (mod) => (mod === 'tooltip' ? DTS_TOOLTIP : null);

test('un nativo adoptado: su contrato es la API instalada, con el nombre con que se escribe y el suyo primero', () => {
  const r = analyzeNativo({ name: 'tooltip', selector: 'pTooltip', modulo: 'tooltip', pagesText: "path: 'tooltip'", leerTipos: leerTooltip });
  assert.deepEqual(
    r.contrato.map((m) => [m.nombre, m.tipo, m.origen]),
    [
      ['pTooltip', 'string | TemplateRef<HTMLElement>', 'nativo'],
      ['tooltipPosition', 'TooltipPosition', 'nativo'],
      ['showOnEllipsis', 'boolean', 'nativo'],
    ],
  );
  assert.equal(r.contrato[0].nativo.descripcion, 'Content of the tooltip.');
  assert.deepEqual([r.estado, r.faltas], ['ready', []], 'el Kit tiene su maestro y tiene página');
});

test('un nativo adoptado sin página es experimental, y sin `.d.ts` no se inventa contrato', () => {
  const sinPagina = analyzeNativo({ name: 'tooltip', selector: 'pTooltip', modulo: 'tooltip', pagesText: '', leerTipos: leerTooltip });
  assert.deepEqual([sinPagina.estado, sinPagina.faltas], ['experimental', ['demo']]);
  const sinTipos = analyzeNativo({ name: 'tooltip', selector: 'pTooltip', modulo: 'tooltip', pagesText: '', leerTipos: () => null });
  assert.deepEqual(sinTipos.contrato, []);
});
