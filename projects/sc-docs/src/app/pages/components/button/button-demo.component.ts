import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScButtonComponent } from '@smartcontact-hub/components';
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
<sc-button label="Legacy pi" icon="pi pi-trash" variant="danger" />
<sc-button label="Cargando" [loading]="true" />
<sc-button label="Deshabilitado" [disabled]="true" />
<sc-button label="Full width" [fullWidth]="true" />`;

const PRESS_SNIPPET = `<!-- La pulsación la pone el tema: no hay nada que activar. -->
<sc-button label="Guardar" />
<sc-button label="Cancelar" variant="secondary" appearance="outlined" />
<sc-button label="Ver todo" variant="secondary" appearance="text" />
<sc-button icon="more_vert" variant="secondary" appearance="text" iconAriaLabel="Más acciones" />`;

const PRESS_DESCRIPTION =
  'Mantén pulsado un botón: se encoge al 96 % y, al soltarlo, vuelve suave en 150 ms (ease-out), con el cambio de ' +
  'color a la misma velocidad. Si el sistema pide movimiento reducido, no se mueve. Es un desvío a propósito del ' +
  'botón de primeng.dev, que no se mueve y tarda 200 ms: se eligió entre seis formas de pulsar probadas sobre este ' +
  'mismo botón (DD-113, customs-catalog §8.1). En Figma está pendiente (figma-pendiente §13).';

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
  protected readonly pressTpl = viewChild<TemplateRef<StoryContext>>('press');

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
      { name: 'iconPosition', control: { kind: 'select', options: ['left', 'right', 'top', 'bottom'] } },
      { name: 'iconSize', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'iconFilled', control: { kind: 'boolean' } },
      { name: 'type', control: { kind: 'select', options: ['button', 'submit', 'reset'] } },
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
      iconPosition: 'left',
      iconSize: 'md',
      iconFilled: false,
      type: 'button',
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const va = this.variantsTpl();
    const ap = this.appearancesTpl();
    const sz = this.sizesTpl();
    const ic = this.iconsTpl();
    const pr = this.pressTpl();
    if (!pg || !va || !ap || !sz || !ic || !pr) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Variantes', template: va, snippet: VARIANTS_SNIPPET },
      { name: 'Apariencias', template: ap, snippet: APPEARANCES_SNIPPET },
      { name: 'Tamaños', template: sz, snippet: SIZES_SNIPPET },
      { name: 'Iconos y estados', template: ic, snippet: ICONS_SNIPPET },
      { name: 'Al pulsar', template: pr, snippet: PRESS_SNIPPET, description: PRESS_DESCRIPTION },
    ];
  });
}
