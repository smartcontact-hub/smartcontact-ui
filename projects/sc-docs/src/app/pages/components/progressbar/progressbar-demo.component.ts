import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScProgressBarComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const MODES_SNIPPET = `<sc-progressbar [value]="40" />
<sc-progressbar [value]="80" [showValue]="false" />
<sc-progressbar mode="indeterminate" />`;

/** Demo de `sc-progressbar` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-progressbar-demo',
  imports: [ScProgressBarComponent, StoryHostComponent],
  templateUrl: './progressbar-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly modesTpl = viewChild<TemplateRef<StoryContext>>('modes');

  protected readonly meta: StoryMeta = {
    tag: 'sc-progressbar',
    title: 'Progress Bar',
    description:
      'Barra de progreso horizontal. Wrapper de PrimeNG con modo determinado (valor + %) o indeterminado (animación continua).',
    argTypes: [
      { name: 'value', control: { kind: 'number', min: 0, max: 100, step: 5 } },
      { name: 'showValue', control: { kind: 'boolean' } },
      { name: 'unit', control: { kind: 'text' } },
      {
        name: 'mode',
        control: { kind: 'select', options: ['determinate', 'indeterminate'] },
      },
    ],
    defaultArgs: {
      value: 40,
      showValue: true,
      unit: '%',
      mode: 'determinate',
    },
    props: [
      {
        name: 'value',
        type: 'number | null',
        default: 'null',
        description: 'Progreso 0–100 (modo determinado).',
      },
      {
        name: 'showValue',
        type: 'boolean',
        default: 'true',
        description: 'Muestra la etiqueta del valor.',
      },
      { name: 'unit', type: 'string', default: "'%'", description: 'Sufijo del valor.' },
      {
        name: 'mode',
        type: 'ScProgressBarMode',
        default: "'determinate'",
        description: 'determinate · indeterminate',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const mo = this.modesTpl();
    if (!pg || !mo) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Modos', template: mo, snippet: MODES_SNIPPET },
    ];
  });
}
