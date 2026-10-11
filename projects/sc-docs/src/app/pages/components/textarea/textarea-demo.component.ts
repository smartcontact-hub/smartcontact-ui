import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScTextareaComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const STATES_SNIPPET = `<sc-textarea placeholder="Auto-resize" [autoResize]="true" />
<sc-textarea placeholder="Small" size="sm" />
<sc-textarea placeholder="Large" size="lg" />
<sc-textarea placeholder="Inválido" [invalid]="true" />
<sc-textarea placeholder="Deshabilitado" [disabled]="true" />
<sc-textarea placeholder="Fluid" [fluid]="true" />`;

const COPY_SNIPPET = `<!-- Para lo que se lee y se copia: el botón va dentro, solo con su icono (DD-198). -->
<sc-textarea
  [rows]="2"
  fluid
  readonly
  [copyable]="true"
  copyLabel="Copiar código"
  copiedLabel="Código copiado"
  helperText="Pega este código en la cabecera de la web."
  [value]="script"
/>`;

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
  protected readonly copyTpl = viewChild<TemplateRef<StoryContext>>('copy');
  protected readonly script = '<script src="https://chat.smartcontact.es/widget.js" data-group="online-support" data-lang="es" async></script>';

  protected readonly meta: StoryMeta = {
    tag: 'sc-textarea',
    title: 'Textarea',
    description:
      'Área de texto multi-línea (wrapper de `pTextarea`). Soporta auto-resize, tamaños, estados inválido/disabled y modo fluid (ancho completo). Su ayuda va debajo (`helperText`), y lo que se lee y se copia lleva el botón de copiar dentro (`copyable`).',
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
      { name: 'helperText', control: { kind: 'text' } },
      { name: 'copyable', control: { kind: 'boolean' } },
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
      helperText: '',
      copyable: false,
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const st = this.statesTpl();
    const cp = this.copyTpl();
    if (!pg || !st || !cp) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Estados', template: st, snippet: STATES_SNIPPET },
      { name: 'Para copiar', template: cp, snippet: COPY_SNIPPET },
    ];
  });
}
