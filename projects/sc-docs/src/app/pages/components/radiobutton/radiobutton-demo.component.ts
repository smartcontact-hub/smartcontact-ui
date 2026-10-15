import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScOptionCardsComponent, ScRadioButtonComponent, type ScOptionCardItem } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const GROUP_SNIPPET = `<sc-radiobutton value="a" [modelValue]="selected()" (modelValueChange)="selected.set($any($event))" inputId="opt-a" name="demo" />
<label for="opt-a">Opción A</label>
<sc-radiobutton value="b" [modelValue]="selected()" (modelValueChange)="selected.set($any($event))" inputId="opt-b" name="demo" />
<label for="opt-b">Opción B</label>`;

const SIZES_SNIPPET = `<sc-radiobutton value="s" size="sm" name="sizes" />
<sc-radiobutton value="m" name="sizes" />
<sc-radiobutton value="l" size="lg" name="sizes" />`;

const CARD_SNIPPET = `<!-- El ejemplo «Card» de primeng.dev/radiobutton: la tarjeta es el <label>, el radio va al final. -->
<span id="plan-label">Elige un plan:</span>
<sc-option-cards
  orientation="vertical"
  name="plan"
  ariaLabelledBy="plan-label"
  [options]="plans"
  [value]="plan()"
  (valueChange)="plan.set($event)"
/>

plans: ScOptionCardItem[] = [
  { value: 'starter', label: 'Starter', description: 'Para quien explora la plataforma.' },
  { value: 'pro', label: 'Pro', description: 'Para equipos que ya trabajan con ella.' },
  { value: 'enterprise', label: 'Enterprise', description: 'Para organizaciones con necesidades propias.' },
];`;

/** Demo de `sc-radiobutton` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-radiobutton-demo',
  imports: [ScOptionCardsComponent, ScRadioButtonComponent, StoryHostComponent],
  styles: [
    '.card-demo { display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); max-inline-size: 20rem; }',
    '.card-demo__label { font-weight: var(--sc-font-weight-medium); }',
  ],
  templateUrl: './radiobutton-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioButtonDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly groupTpl = viewChild<TemplateRef<StoryContext>>('group');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');
  protected readonly cardTpl = viewChild<TemplateRef<StoryContext>>('card');

  readonly selected = signal<string>('a');

  /** Los tres planes del ejemplo «Card» de primeng.dev/radiobutton, en castellano. */
  protected readonly plans: ScOptionCardItem[] = [
    { value: 'starter', label: 'Starter', description: 'Para quien explora la plataforma.' },
    { value: 'pro', label: 'Pro', description: 'Para equipos que ya trabajan con ella.' },
    { value: 'enterprise', label: 'Enterprise', description: 'Para organizaciones con necesidades propias.' },
  ];
  readonly plan = signal<string>('pro');

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
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const gr = this.groupTpl();
    const sz = this.sizesTpl();
    const cd = this.cardTpl();
    if (!pg || !gr || !sz || !cd) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Grupo', template: gr, snippet: GROUP_SNIPPET },
      { name: 'Tamaños', template: sz, snippet: SIZES_SNIPPET },
      {
        name: 'Tarjeta',
        template: cd,
        snippet: CARD_SNIPPET,
        description:
          'El ejemplo «Card» de primeng.dev/radiobutton, tal cual, en `sc-option-cards`: la tarjeta es el `<label>`, con el rótulo y su línea a la izquierda y el radio nativo al final; borde primario en la elegida y fondo al pasar. Para 2 a 4 opciones cuya diferencia es lo que HACEN (en el Supervisor, «Tamaño de cola» y «Descuelgue»).',
      },
    ];
  });
}
