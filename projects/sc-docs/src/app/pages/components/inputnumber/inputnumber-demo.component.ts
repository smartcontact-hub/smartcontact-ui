import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScInputNumberComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const STATES_SNIPPET = `<sc-inputnumber label="Cantidad" placeholder="0" />
<sc-inputnumber label="Con límites" [min]="0" [max]="100" />
<sc-inputnumber label="Con sufijo" suffix="agentes" [value]="5" />
<sc-inputnumber label="Con error" error="Fuera de rango" />
<sc-inputnumber label="Deshabilitado" [disabled]="true" />`;

/** Demo de `sc-inputnumber` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-inputnumber-demo',
  imports: [ScInputNumberComponent, StoryHostComponent],
  templateUrl: './inputnumber-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNumberDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly statesTpl = viewChild<TemplateRef<StoryContext>>('states');

  protected readonly meta: StoryMeta = {
    tag: 'sc-inputnumber',
    title: 'InputNumber',
    description:
      'Input numérico sobre `<input type="number">` nativo con la chrome del field-pattern (label + requerido + helper/error + suffix). Emite `number | null`. Se consume con `[(value)]` (signals).',
    argTypes: [
      { name: 'label', control: { kind: 'text' } },
      { name: 'value', control: { kind: 'number' } },
      { name: 'placeholder', control: { kind: 'text' } },
      { name: 'suffix', control: { kind: 'text' }, description: 'Unidad tras el número (s, min, %…)' },
      { name: 'helperText', control: { kind: 'text' } },
      { name: 'error', control: { kind: 'text' } },
      { name: 'min', control: { kind: 'number' } },
      { name: 'max', control: { kind: 'number' } },
      { name: 'step', control: { kind: 'number' } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'required', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'readonly', control: { kind: 'boolean' } },
          { name: 'invalid', control: { kind: 'boolean' }, description: 'Marca el campo sin texto de error.' },
    ],
    defaultArgs: {
      label: 'Cantidad',
      value: null,
      placeholder: '0',
      suffix: '',
      helperText: '',
      error: '',
      min: null,
      max: null,
      step: 1,
      size: 'md',
      required: false,
      disabled: false,
      readonly: false,
          invalid: false,
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const st = this.statesTpl();
    if (!pg || !st) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Estados', template: st, snippet: STATES_SNIPPET },
    ];
  });
}
