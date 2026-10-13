// La ficha para agentes de cada componente (`scripts/docs-ia.mjs`): lee todas las fichas de sc-docs, y lee lo que la
// web enseña, no otra cosa. node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import { generar, leerFicha } from '../docs-ia.mjs';

test('leerFicha: una descripción partida en trozos, un snippet en constante y una story sin plantilla', () => {
  const ts = `
    import { LABEL_COLORS } from '@smartcontact-hub/components';
    const X_SNIPPET = \`<sc-cosa label="a" />\`;
    const DESC = 'Primera parte, ' +
      'segunda parte.';
    export class CosaDemoComponent {
      protected readonly pg = viewChild<TemplateRef<StoryContext>>('playground');
      readonly opciones = ['uno', 'dos'] as const;
      protected readonly meta: StoryMeta = {
        tag: 'sc-cosa',
        title: 'Cosa',
        description: 'Una ' + 'cosa.',
        argTypes: [{ name: 'color', control: { kind: 'select', options: [...LABEL_COLORS] } }],
        defaultArgs: { color: 'blue' },
      };
      protected readonly stories = computed<readonly StoryDef[]>(() => {
        const pg = this.pg();
        if (!pg) return [];
        return [
          { name: 'Playground', playground: true, template: pg },
          { name: 'Con constante', template: pg, snippet: X_SNIPPET, description: DESC },
          { name: 'Con this', template: pg, args: { opciones: this.opciones } },
        ];
      });
    }`;
  const { meta, historias } = leerFicha(ts);
  assert.equal(meta.tag, 'sc-cosa');
  assert.equal(meta.description, 'Una cosa.');
  // `LABEL_COLORS` se importa del paquete: se lee del fuente del DS.
  assert.ok(meta.argTypes[0].control.options.length >= 9, 'las opciones de una constante del DS se resuelven');
  assert.deepEqual(historias.map((h) => h.name), ['Playground', 'Con constante', 'Con this']);
  assert.equal(historias[1].snippet, '<sc-cosa label="a" />');
  assert.equal(historias[1].description, 'Primera parte, segunda parte.');
  assert.deepEqual(historias[2].args.opciones, ['uno', 'dos']);
});

test('leerFicha: una ficha que no se deja leer es un error, no una ficha vacía', () => {
  assert.throws(() => leerFicha('export class Nada {}'), /meta/);
  assert.throws(
    () => leerFicha(`export class D { meta = { tag: 'sc-x' }; stories = computed(() => { return []; }); }`),
    /stories/,
  );
});

test('generar: las 56 fichas de sc-docs, cada una con sus stories, y el botón como lo enseña la web', () => {
  const { fichas, problemas, entradas } = generar();
  assert.deepEqual(problemas, []);
  assert.equal(fichas.length, entradas);
  assert.ok(entradas >= 56, `component-pages.ts registra ${entradas} fichas`);
  for (const f of fichas) assert.ok(f.historias > 0, `${f.pagina}: sin stories`);

  const boton = fichas.find((f) => f.pagina === 'button');
  // El código del Playground por defecto es el que serializa la web (`serializeArgs` con el contrato): sin lo que vale
  // su valor por defecto.
  assert.match(boton.md, /```html\n<sc-button label="Guardar cambios" icon="check" iconSize="md" \/>\n```/);
  assert.match(boton.md, /import \{ ScButtonComponent \} from '@smartcontact-hub\/components';/);
  assert.match(boton.md, /## Cuándo se usa\n\nPara una ACCIÓN/);
  assert.match(boton.md, /\?historia=variantes&solo=1/);
  assert.match(boton.md, /\| `ariaLabel` \| entrada \|/);
});
