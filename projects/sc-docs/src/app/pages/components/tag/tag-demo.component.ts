import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScTagComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const SEVERITIES_SNIPPET = `<sc-tag value="Primary" />
<sc-tag value="Secondary" severity="secondary" />
<sc-tag value="Success" severity="success" />
<sc-tag value="Info" severity="info" />
<sc-tag value="Warn" severity="warn" />
<sc-tag value="Danger" severity="danger" />
<sc-tag value="Contrast" severity="contrast" />`;

const VARIANTS_SNIPPET = `<sc-tag value="Rounded" [rounded]="true" />
<sc-tag value="Con icono" icon="check" />`;

const LABEL_SNIPPET = `<sc-tag variant="label" labelColor="gray" value="Gris" />
<sc-tag variant="label" labelColor="red" value="Rojo" />
<sc-tag variant="label" labelColor="orange" value="Naranja" />
<sc-tag variant="label" labelColor="amber" value="Ámbar" />
<sc-tag variant="label" labelColor="green" value="Verde" />
<sc-tag variant="label" labelColor="teal" value="Teal" />
<sc-tag variant="label" labelColor="blue" value="Azul" />
<sc-tag variant="label" labelColor="purple" value="Morado" />`;

/** Demo de `sc-tag` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-tag-demo',
  imports: [ScTagComponent, StoryHostComponent],
  templateUrl: './tag-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly severitiesTpl = viewChild<TemplateRef<StoryContext>>('severities');
  protected readonly variantsTpl = viewChild<TemplateRef<StoryContext>>('variants');
  protected readonly labelTpl = viewChild<TemplateRef<StoryContext>>('label');

  protected readonly meta: StoryMeta = {
    tag: 'sc-tag',
    title: 'Tag',
    description:
      'Etiqueta de estado (read-only). Wrapper de PrimeNG con severidades de marca, redondeo e icono. Variante categórica `label` con punto de color (§4.1).',
    argTypes: [
      { name: 'value', control: { kind: 'text' } },
      {
        name: 'severity',
        control: {
          kind: 'select',
          options: ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'],
        },
      },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (p.ej. check).' },
      { name: 'rounded', control: { kind: 'boolean' } },
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
      value: 'Estado',
      severity: 'primary',
      icon: '',
      rounded: false,
      variant: 'default',
      labelColor: 'gray',
    },
    props: [
      { name: 'value', type: 'string | null', default: 'null', description: 'Texto de la etiqueta.' },
      {
        name: 'severity',
        type: 'ScSeverity',
        default: "'primary'",
        description: 'primary · secondary · success · info · warn · danger · contrast',
      },
      { name: 'icon', type: 'string | null', default: 'null', description: 'Icono Material.' },
      { name: 'rounded', type: 'boolean', default: 'false' },
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
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const se = this.severitiesTpl();
    const va = this.variantsTpl();
    const la = this.labelTpl();
    if (!pg || !se || !va || !la) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Severities', template: se, snippet: SEVERITIES_SNIPPET },
      { name: 'Variantes', template: va, snippet: VARIANTS_SNIPPET },
      { name: 'Variante label', template: la, snippet: LABEL_SNIPPET },
    ];
  });
}
