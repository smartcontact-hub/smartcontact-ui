import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import {
  ColorDotOption,
  LABEL_COLORS,
  ScColorDotPickerComponent,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const BASIC_SNIPPET = `<sc-color-dot-picker [options]="options" [(value)]="value" />`;

/** Demo de `sc-color-dot-picker` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-colordotpicker-demo',
  imports: [ScColorDotPickerComponent, StoryHostComponent],
  templateUrl: './colordotpicker-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorDotPickerDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicTpl = viewChild<TemplateRef<StoryContext>>('basic');

  /** Los 8 colores categóricos del DS (mismos de la variante `label` de tag/chip). */
  readonly options: ColorDotOption[] = LABEL_COLORS.map((c) => ({
    value: c,
    label: c,
    color: `var(--sc-label-${c}-dot)`,
  }));
  readonly value = signal<string>('blue');

  protected readonly meta: StoryMeta = {
    tag: 'sc-color-dot-picker',
    title: 'ColorDotPicker',
    description:
      'Fila de puntos de color seleccionables — el picker categórico de 8 colores del DS (radiogroup). Two-way `[(value)]`; los colores se pasan por `ColorDotOption.color`, así que no acopla la paleta.',
    argTypes: [
      { name: 'value', control: { kind: 'select', options: [...LABEL_COLORS] } },
      { name: 'ariaLabel', control: { kind: 'text' } },
    ],
    defaultArgs: {
      value: 'blue',
      ariaLabel: 'Color',
    },
    props: [
      {
        name: 'options',
        type: 'readonly ColorDotOption[]',
        default: '—',
        description: 'Requerido. `{ value, label, color }` por punto.',
      },
      {
        name: 'value',
        type: 'string',
        default: '—',
        description: 'Requerido. Two-way `[(value)]` — id del color activo.',
      },
      { name: 'ariaLabel', type: 'string', default: "'Color'", description: 'Rótulo del radiogroup.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.basicTpl();
    if (!pg || !ba) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Básico', template: ba, snippet: BASIC_SNIPPET },
    ];
  });
}
