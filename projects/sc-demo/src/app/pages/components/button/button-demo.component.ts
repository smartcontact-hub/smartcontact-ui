import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScButtonComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const VARIANTS_SNIPPET = `<sc-button label="Primario" />
<sc-button label="Secundario" variant="secondary" />
<sc-button label="Success" variant="success" />
<sc-button label="Info" variant="info" />
<sc-button label="Warn" variant="warn" />
<sc-button label="Danger" variant="danger" />
<sc-button label="Contrast" variant="contrast" />`;

const APPEARANCES_SNIPPET = `<sc-button label="Filled" />
<sc-button label="Outlined" appearance="outlined" />
<sc-button label="Text" appearance="text" />
<sc-button label="Link" appearance="link" />`;

const SIZES_SNIPPET = `<sc-button label="Small" size="sm" />
<sc-button label="Medium" />
<sc-button label="Large" size="lg" />`;

const ICONS_SNIPPET = `<sc-button label="Con icono" icon="check" />
<sc-button icon="check" iconAriaLabel="Confirmar" />
<sc-button label="Cargando" [loading]="true" />
<sc-button label="Deshabilitado" [disabled]="true" />`;

/** Demo de `sc-button` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-button-demo',
  imports: [ScButtonComponent, StoryHostComponent],
  templateUrl: './button-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly variantsTpl = viewChild<TemplateRef<StoryContext>>('variants');
  protected readonly appearancesTpl = viewChild<TemplateRef<StoryContext>>('appearances');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');
  protected readonly iconsTpl = viewChild<TemplateRef<StoryContext>>('icons');

  protected readonly meta: StoryMeta = {
    tag: 'sc-button',
    title: 'Button',
    description:
      'Botón de acción. Wrapper de PrimeNG con variantes de marca, apariencias, tamaños e iconos Material.',
    argTypes: [
      { name: 'label', control: { kind: 'text' } },
      {
        name: 'variant',
        control: {
          kind: 'select',
          options: ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'],
        },
      },
      {
        name: 'appearance',
        control: { kind: 'select', options: ['filled', 'outlined', 'text', 'link'] },
      },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (p.ej. check)' },
      { name: 'loading', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'rounded', control: { kind: 'boolean' } },
      { name: 'fullWidth', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      label: 'Guardar cambios',
      variant: 'primary',
      appearance: 'filled',
      size: 'md',
      icon: '',
      loading: false,
      disabled: false,
      rounded: false,
      fullWidth: false,
    },
    props: [
      { name: 'label', type: 'string', default: "''", description: 'Texto del botón.' },
      {
        name: 'variant',
        type: 'ScButtonVariant',
        default: "'primary'",
        description: 'primary · secondary · success · info · warn · danger · contrast',
      },
      {
        name: 'appearance',
        type: 'ScButtonAppearance',
        default: "'filled'",
        description: 'filled · outlined · text · link',
      },
      { name: 'size', type: 'ScButtonSize', default: "'md'", description: 'sm · md · lg' },
      {
        name: 'icon',
        type: 'string | null',
        default: 'null',
        description: 'Icono Material (ligadura) o legacy `pi pi-*`.',
      },
      { name: 'loading', type: 'boolean', default: 'false' },
      { name: 'disabled', type: 'boolean', default: 'false' },
      { name: 'rounded', type: 'boolean', default: 'false' },
      { name: 'fullWidth', type: 'boolean', default: 'false' },
      { name: 'clicked', type: 'EventEmitter<MouseEvent>', description: 'Output al pulsar.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const va = this.variantsTpl();
    const ap = this.appearancesTpl();
    const sz = this.sizesTpl();
    const ic = this.iconsTpl();
    if (!pg || !va || !ap || !sz || !ic) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Variantes', template: va, snippet: VARIANTS_SNIPPET },
      { name: 'Apariencias', template: ap, snippet: APPEARANCES_SNIPPET },
      { name: 'Tamaños', template: sz, snippet: SIZES_SNIPPET },
      { name: 'Iconos y estados', template: ic, snippet: ICONS_SNIPPET },
    ];
  });
}
