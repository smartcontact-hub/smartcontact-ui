import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScRadioButtonComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const GROUP_SNIPPET = `<sc-radiobutton value="a" [modelValue]="selected()" (modelValueChange)="selected.set($any($event))" inputId="opt-a" name="demo" />
<label for="opt-a">Opción A</label>
<sc-radiobutton value="b" [modelValue]="selected()" (modelValueChange)="selected.set($any($event))" inputId="opt-b" name="demo" />
<label for="opt-b">Opción B</label>`;

const SIZES_SNIPPET = `<sc-radiobutton value="s" size="sm" name="sizes" />
<sc-radiobutton value="m" name="sizes" />
<sc-radiobutton value="l" size="lg" name="sizes" />`;

/** Demo de `sc-radiobutton` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-radiobutton-demo',
  imports: [ScRadioButtonComponent, StoryHostComponent],
  templateUrl: './radiobutton-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioButtonDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly groupTpl = viewChild<TemplateRef<StoryContext>>('group');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');

  readonly selected = signal<string>('a');

  protected readonly meta: StoryMeta = {
    tag: 'sc-radiobutton',
    title: 'RadioButton',
    description:
      'Botón de opción único (wrapper de `p-radiobutton`). Se agrupa por `name`; el estado se lleva con `[modelValue]` + `(modelValueChange)`. Cada radio compara su `value` contra el `modelValue` del grupo.',
    argTypes: [
      { name: 'value', control: { kind: 'text' } },
      { name: 'modelValue', control: { kind: 'text' }, description: 'Valor activo del grupo.' },
      { name: 'name', control: { kind: 'text' } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'variant', control: { kind: 'select', options: ['outlined', 'filled'] } },
      { name: 'ariaLabel', control: { kind: 'text' } },
    ],
    defaultArgs: {
      value: 'a',
      modelValue: 'a',
      name: 'playground',
      size: 'md',
      variant: 'outlined',
      ariaLabel: 'Opción',
    },
    props: [
      { name: 'value', type: 'unknown', default: 'null', description: 'Valor de este radio.' },
      { name: 'modelValue', type: 'unknown', default: 'null', description: 'Valor activo del grupo.' },
      { name: 'name', type: 'string | null', default: 'null', description: 'Agrupa radios.' },
      { name: 'inputId', type: 'string | null', default: 'null', description: 'Enlaza `<label for>`.' },
      { name: 'size', type: 'ScComponentSize', default: "'md'", description: 'sm · md · lg' },
      { name: 'variant', type: 'ScInputVariant', default: "'outlined'", description: 'outlined · filled' },
      { name: 'ariaLabel', type: 'string | null', default: 'null' },
      { name: 'modelValueChange', type: 'EventEmitter<unknown>', description: 'Nuevo valor del grupo.' },
      { name: 'clicked', type: 'EventEmitter<unknown>' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const gr = this.groupTpl();
    const sz = this.sizesTpl();
    if (!pg || !gr || !sz) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Grupo', template: gr, snippet: GROUP_SNIPPET },
      { name: 'Tamaños', template: sz, snippet: SIZES_SNIPPET },
    ];
  });
}
