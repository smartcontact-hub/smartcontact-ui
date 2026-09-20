import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScPasswordComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const BASIC_SNIPPET = `<sc-password
  label="Contraseña"
  autocomplete="current-password"
  name="password"
  [(value)]="password"
/>`;

const STATES_SNIPPET = `<sc-password label="Obligatoria" [required]="true" helperText="Mínimo 8 caracteres" />
<sc-password label="Con error" error="La contraseña no es correcta" />
<sc-password label="Deshabilitada" [disabled]="true" value="secreto" />
<sc-password label="Sin botón de mostrar" [toggleMask]="false" />
<sc-password ariaLabel="Contraseña" placeholder="Sin etiqueta visible" />`;

const SIZES_SNIPPET = `<sc-password label="Small" size="sm" />
<sc-password label="Medium" />
<sc-password label="Large" size="lg" />
<sc-password label="Fluid" [fluid]="true" />`;

const I18N_SNIPPET = `<sc-password
  label="Password"
  inputId="login-password"
  autocomplete="current-password"
  [maxlength]="64"
  showAriaLabel="Show password"
  hideAriaLabel="Hide password"
  (focused)="lastEvent.set('focused')"
  (blurred)="lastEvent.set('blurred')"
/>`;

/** Demo de `sc-password` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-password-demo',
  imports: [ScPasswordComponent, StoryHostComponent],
  templateUrl: './password-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicTpl = viewChild<TemplateRef<StoryContext>>('basic');
  protected readonly statesTpl = viewChild<TemplateRef<StoryContext>>('states');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');
  protected readonly i18nTpl = viewChild<TemplateRef<StoryContext>>('i18n');

  readonly password = signal('');
  readonly lastEvent = signal('—');

  protected readonly meta: StoryMeta = {
    tag: 'sc-password',
    title: 'Password',
    description:
      'Campo de contraseña sobre `p-password` con la chrome del field-pattern (label + requerido + helper/error), igual que `sc-inputtext`. El botón de mostrar/ocultar es un `<button>` real: se alcanza con Tab, se activa con Enter o Espacio y su nombre accesible cambia con el estado. Sin medidor de fuerza por defecto (`feedback`). Se consume con `[(value)]` (signals).',
    argTypes: [
      { name: 'label', control: { kind: 'text' } },
      { name: 'value', control: { kind: 'text' } },
      { name: 'placeholder', control: { kind: 'text' } },
      { name: 'helperText', control: { kind: 'text' } },
      { name: 'error', control: { kind: 'text' } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'required', control: { kind: 'boolean' } },
      { name: 'invalid', control: { kind: 'boolean' } },
      { name: 'fluid', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'toggleMask', control: { kind: 'boolean' } },
      { name: 'feedback', control: { kind: 'boolean' } },
      { name: 'showAriaLabel', control: { kind: 'text' } },
      { name: 'hideAriaLabel', control: { kind: 'text' } },
    ],
    defaultArgs: {
      label: 'Contraseña',
      value: '',
      placeholder: '',
      helperText: '',
      error: '',
      size: 'md',
      required: false,
      invalid: false,
      fluid: false,
      disabled: false,
      toggleMask: true,
      feedback: false,
      showAriaLabel: 'Mostrar contraseña',
      hideAriaLabel: 'Ocultar contraseña',
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.basicTpl();
    const st = this.statesTpl();
    const sz = this.sizesTpl();
    const i18n = this.i18nTpl();
    if (!pg || !ba || !st || !sz || !i18n) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Acceso', template: ba, snippet: BASIC_SNIPPET },
      { name: 'Estados', template: st, snippet: STATES_SNIPPET },
      { name: 'Tamaños', template: sz, snippet: SIZES_SNIPPET },
      { name: 'Textos y eventos', template: i18n, snippet: I18N_SNIPPET },
    ];
  });
}
