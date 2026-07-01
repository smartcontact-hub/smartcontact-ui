import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ScInputTextComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const BASIC_SNIPPET = `<sc-inputtext label="Nombre" placeholder="Escribe…" [(value)]="name" />`;

const STATES_SNIPPET = `<sc-inputtext label="Obligatorio" [required]="true" helperText="Campo requerido" />
<sc-inputtext label="Con error" error="El nombre no es válido" />
<sc-inputtext label="Filled" [filled]="true" />
<sc-inputtext label="IftaLabel" [iftaLabel]="true" placeholder=" " />
<sc-inputtext label="Deshabilitado" [disabled]="true" />`;

const SIZES_SNIPPET = `<sc-inputtext label="Small" size="sm" />
<sc-inputtext label="Medium" />
<sc-inputtext label="Large" size="lg" />
<sc-inputtext label="Fluid" [fluid]="true" />`;

/** Demo de `sc-inputtext` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-inputtext-demo',
  imports: [ScInputTextComponent, FormsModule, StoryHostComponent],
  templateUrl: './inputtext-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputTextDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicTpl = viewChild<TemplateRef<StoryContext>>('basic');
  protected readonly statesTpl = viewChild<TemplateRef<StoryContext>>('states');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');

  readonly name = signal('');

  protected readonly meta: StoryMeta = {
    tag: 'sc-inputtext',
    title: 'InputText',
    description:
      'Input de texto sobre `pInputText` con la chrome del field-pattern (label + requerido + helper/error). Pareja con `[(ngModel)]`, `[formControl]` y `[(value)]` (signals). Para input + addon ver `sc-inputgroup`.',
    argTypes: [
      { name: 'label', control: { kind: 'text' } },
      { name: 'value', control: { kind: 'text' } },
      { name: 'placeholder', control: { kind: 'text' } },
      { name: 'helperText', control: { kind: 'text' } },
      { name: 'error', control: { kind: 'text' } },
      {
        name: 'type',
        control: { kind: 'select', options: ['text', 'email', 'password', 'tel', 'url', 'search'] },
      },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'required', control: { kind: 'boolean' } },
      { name: 'invalid', control: { kind: 'boolean' } },
      { name: 'filled', control: { kind: 'boolean' } },
      { name: 'iftaLabel', control: { kind: 'boolean' } },
      { name: 'fluid', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'readonly', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      label: 'Nombre',
      value: '',
      placeholder: 'Escribe…',
      helperText: '',
      error: '',
      type: 'text',
      size: 'md',
      required: false,
      invalid: false,
      filled: false,
      iftaLabel: false,
      fluid: false,
      disabled: false,
      readonly: false,
    },
    props: [
      { name: 'value', type: 'string', default: "''", description: 'Two-way `[(value)]`.' },
      { name: 'label', type: 'string', default: '—' },
      { name: 'size', type: 'ScInputSize', default: "'md'", description: 'sm · md · lg' },
      {
        name: 'type',
        type: 'ScInputType',
        default: "'text'",
        description: 'text · email · password · tel · url · search',
      },
      { name: 'placeholder', type: 'string', default: '—' },
      { name: 'helperText', type: 'string', default: '—' },
      { name: 'error', type: 'string', default: '—', description: 'Texto de error (gana a helper).' },
      { name: 'required', type: 'boolean', default: 'false' },
      { name: 'invalid', type: 'boolean', default: 'false', description: 'Estado inválido explícito.' },
      { name: 'filled', type: 'boolean', default: 'false', description: 'Fondo slate-50.' },
      { name: 'iftaLabel', type: 'boolean', default: 'false', description: 'Label dentro del campo.' },
      { name: 'fluid', type: 'boolean', default: 'false', description: 'Ancho completo.' },
      { name: 'disabled', type: 'boolean', default: 'false' },
      { name: 'readonly', type: 'boolean', default: 'false' },
      { name: 'focused', type: 'EventEmitter<FocusEvent>' },
      { name: 'blurred', type: 'EventEmitter<FocusEvent>' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.basicTpl();
    const st = this.statesTpl();
    const sz = this.sizesTpl();
    if (!pg || !ba || !st || !sz) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Con valor', template: ba, snippet: BASIC_SNIPPET },
      { name: 'Estados', template: st, snippet: STATES_SNIPPET },
      { name: 'Tamaños', template: sz, snippet: SIZES_SNIPPET },
    ];
  });
}
