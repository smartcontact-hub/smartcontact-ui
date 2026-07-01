import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScTextareaComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const STATES_SNIPPET = `<sc-textarea placeholder="Auto-resize" [autoResize]="true" />
<sc-textarea placeholder="Small" size="sm" />
<sc-textarea placeholder="Large" size="lg" />
<sc-textarea placeholder="Inválido" [invalid]="true" />
<sc-textarea placeholder="Deshabilitado" [disabled]="true" />
<sc-textarea placeholder="Fluid" [fluid]="true" />`;

/** Demo de `sc-textarea` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-textarea-demo',
  imports: [ScTextareaComponent, StoryHostComponent],
  templateUrl: './textarea-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly statesTpl = viewChild<TemplateRef<StoryContext>>('states');

  protected readonly meta: StoryMeta = {
    tag: 'sc-textarea',
    title: 'Textarea',
    description:
      'Área de texto multi-línea (wrapper de `pTextarea`). Soporta auto-resize, tamaños, estados inválido/disabled y modo fluid (ancho completo).',
    argTypes: [
      { name: 'placeholder', control: { kind: 'text' } },
      { name: 'value', control: { kind: 'text' } },
      { name: 'rows', control: { kind: 'number', min: 1 } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'variant', control: { kind: 'select', options: ['outlined', 'filled'] } },
      { name: 'autoResize', control: { kind: 'boolean' } },
      { name: 'invalid', control: { kind: 'boolean' } },
      { name: 'fluid', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'readonly', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      placeholder: 'Escribe aquí…',
      value: '',
      rows: 3,
      size: 'md',
      variant: 'outlined',
      autoResize: false,
      invalid: false,
      fluid: false,
      disabled: false,
      readonly: false,
    },
    props: [
      { name: 'value', type: 'string', default: "''", description: 'Valor; emite `valueChange`.' },
      { name: 'placeholder', type: 'string', default: "''" },
      { name: 'rows', type: 'number', default: '3' },
      { name: 'cols', type: 'number | null', default: 'null' },
      { name: 'size', type: 'ScComponentSize', default: "'md'", description: 'sm · md · lg' },
      { name: 'variant', type: 'ScInputVariant', default: "'outlined'", description: 'outlined · filled' },
      { name: 'autoResize', type: 'boolean', default: 'false', description: 'Crece con el contenido.' },
      { name: 'invalid', type: 'boolean', default: 'false' },
      { name: 'fluid', type: 'boolean', default: 'false', description: 'Ancho completo.' },
      { name: 'disabled', type: 'boolean', default: 'false' },
      { name: 'readonly', type: 'boolean', default: 'false' },
      { name: 'valueChange', type: 'EventEmitter<string>' },
      { name: 'resized', type: 'EventEmitter<unknown>' },
    ],
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
