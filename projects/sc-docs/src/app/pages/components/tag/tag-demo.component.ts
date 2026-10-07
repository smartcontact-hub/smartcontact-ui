import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScTagComponent } from '@smartcontact-hub/components';
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
<sc-tag variant="label" labelColor="brown" value="Marrón" />
<sc-tag variant="label" labelColor="green" value="Verde" />
<sc-tag variant="label" labelColor="teal" value="Teal" />
<sc-tag variant="label" labelColor="blue" value="Azul" />
<sc-tag variant="label" labelColor="purple" value="Morado" />`;

const BORDERLESS_SNIPPET = `<sc-tag variant="label" labelColor="blue" [bordered]="false" value="9" />
<sc-tag variant="label" labelColor="purple" [bordered]="false" value="10" />
<sc-tag variant="label" labelColor="teal" [bordered]="false" value="8" />
<sc-tag variant="label" labelColor="orange" [bordered]="false" value="15" />`;

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
  protected readonly borderlessTpl = viewChild<TemplateRef<StoryContext>>('borderless');

  protected readonly meta: StoryMeta = {
    tag: 'sc-tag',
    title: 'Tag',
    description:
      'Etiqueta de estado (read-only). Wrapper de PrimeNG con severidades de marca, redondeo e icono. Variante categórica `label`: pastilla tintada con los 9 colores del DS (§4.1). Siempre en una línea: si no cabe en su caja, recorta con puntos suspensivos y enseña el valor entero al pasar el ratón.',
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
      { name: 'size', control: { kind: 'select', options: ['sm', 'md'] }, description: 'sm, la del Kit (12 en negrita); md, 14 en semibold, para una píldora entre valores de 14.' },
      { name: 'variant', control: { kind: 'select', options: ['default', 'label'] } },
      {
        name: 'labelColor',
        control: {
          kind: 'select',
          options: ['gray', 'red', 'orange', 'amber', 'brown', 'green', 'teal', 'blue', 'purple'],
        },
        description: 'Sólo con variant="label".',
      },
      {
        name: 'bordered',
        control: { kind: 'boolean' },
        description: 'Sólo con variant="label": sin borde, solo el fondo tintado (una cifra dentro de una tarjeta).',
      },
    ],
    defaultArgs: {
      value: 'Estado',
      severity: 'primary',
      icon: '',
      rounded: false,
      size: 'sm',
      variant: 'default',
      labelColor: 'gray',
      bordered: true,
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const se = this.severitiesTpl();
    const va = this.variantsTpl();
    const la = this.labelTpl();
    const bl = this.borderlessTpl();
    if (!pg || !se || !va || !la || !bl) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Severities', template: se, snippet: SEVERITIES_SNIPPET },
      { name: 'Variantes', template: va, snippet: VARIANTS_SNIPPET },
      { name: 'Variante label', template: la, snippet: LABEL_SNIPPET },
      { name: 'Label sin borde', template: bl, snippet: BORDERLESS_SNIPPET },
    ];
  });
}
