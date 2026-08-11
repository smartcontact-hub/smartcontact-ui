import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScChipComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const BASE_SNIPPET = `<sc-chip label="Etiqueta" />
<sc-chip label="Con icono" icon="check" />
<sc-chip label="Quitable" [removable]="true" />
<sc-chip label="Deshabilitado" [disabled]="true" />`;

const LABEL_SNIPPET = `<sc-chip variant="label" labelColor="green" label="Verde" />
<sc-chip
  variant="label"
  labelColor="blue"
  label="Azul quitable"
  [removable]="true"
  removeAriaLabel="Quitar"
  (removed)="onLabelRemove()"
/>`;

/** Demo de `sc-chip` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-chip-demo',
  imports: [ScChipComponent, StoryHostComponent],
  templateUrl: './chip-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipDemoComponent {
  readonly labelRemoved = signal(false);

  onLabelRemove(): void {
    this.labelRemoved.set(true);
  }

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly baseTpl = viewChild<TemplateRef<StoryContext>>('base');
  protected readonly labelTpl = viewChild<TemplateRef<StoryContext>>('label');

  protected readonly meta: StoryMeta = {
    tag: 'sc-chip',
    title: 'Chip',
    description:
      'Etiqueta compacta interactiva (quitable, con icono). Variante categórica `label` con punto de color (§4.1). Wrapper de PrimeNG.',
    argTypes: [
      { name: 'label', control: { kind: 'text' } },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (p.ej. check).' },
      { name: 'removable', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'variant', control: { kind: 'select', options: ['default', 'label'] } },
      {
        name: 'labelColor',
        control: {
          kind: 'select',
          options: ['gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple'],
        },
        description: 'Sólo con variant="label".',
      },
    ],
    defaultArgs: {
      label: 'Etiqueta',
      icon: '',
      removable: false,
      disabled: false,
      variant: 'default',
      labelColor: 'gray',
    },
    props: [
      { name: 'label', type: 'string | null', default: 'null' },
      { name: 'icon', type: 'string | null', default: 'null', description: 'Icono Material.' },
      { name: 'image', type: 'string | null', default: 'null', description: 'URL de imagen.' },
      { name: 'alt', type: 'string | null', default: 'null' },
      { name: 'removable', type: 'boolean', default: 'false' },
      { name: 'disabled', type: 'boolean', default: 'false' },
      {
        name: 'variant',
        type: "'default' | 'label'",
        default: "'default'",
        description: 'label = etiqueta categórica con punto (§4.1).',
      },
      {
        name: 'labelColor',
        type: 'LabelColor',
        default: "'gray'",
        description: 'gray · red · orange · amber · green · teal · blue · purple',
      },
      {
        name: 'removeAriaLabel',
        type: 'string',
        default: "'Remove'",
        description: 'Aria-label del botón de quitar (variante label).',
      },
      { name: 'removed', type: 'EventEmitter<unknown>', description: 'Output al quitar.' },
      { name: 'imageError', type: 'EventEmitter<unknown>', description: 'Output al fallar la imagen.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.baseTpl();
    const la = this.labelTpl();
    if (!pg || !ba || !la) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Básico', template: ba, snippet: BASE_SNIPPET },
      { name: 'Variante label', template: la, snippet: LABEL_SNIPPET },
    ];
  });
}
