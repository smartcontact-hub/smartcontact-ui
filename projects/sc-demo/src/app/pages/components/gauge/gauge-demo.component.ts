import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import {
  ScGaugeComponent,
  type ScGaugeSegment,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const KPIS_SNIPPET = `<sc-gauge
  [segments]="bicolor"
  size="lg"
  label="234"
  sublabel="Conv. Totales"
  ariaLabel="234 conversaciones totales, 54 no atendidas"
/>
<sc-gauge [segments]="tri" size="md" label="8" sublabel="Tickets" />
<sc-gauge [segments]="single" size="md" label="100%" sublabel="Atendidas" />`;

const VARIANTS_SNIPPET = `<sc-gauge [segments]="bicolor" size="sm" />
<sc-gauge [segments]="bicolor" size="md" [thickness]="18" label="234" sublabel="grueso" />
<sc-gauge [segments]="bicolor" size="md" [trackVisible]="false" label="234" sublabel="sin track" />`;

/** Demo de `sc-gauge` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-gauge-demo',
  imports: [ScGaugeComponent, StoryHostComponent],
  templateUrl: './gauge-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaugeDemoComponent {
  /** Mayoría verde + minoría roja (KPI "234 / 54 no atendidas"). */
  protected readonly bicolor: ScGaugeSegment[] = [
    { value: 180, severity: 'success' },
    { value: 54, severity: 'danger' },
  ];
  protected readonly single: ScGaugeSegment[] = [{ value: 1, severity: 'success' }];
  protected readonly tri: ScGaugeSegment[] = [
    { value: 5, severity: 'success' },
    { value: 2, severity: 'warning' },
    { value: 1, severity: 'danger' },
  ];

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly kpisTpl = viewChild<TemplateRef<StoryContext>>('kpis');
  protected readonly variantsTpl = viewChild<TemplateRef<StoryContext>>('variants');

  protected readonly meta: StoryMeta = {
    tag: 'sc-gauge',
    title: 'Gauge',
    description:
      'Anillo radial (gauge/donut) determinista para KPIs. Pinta uno o más arcos a partir de `segments` (pesos relativos) y deja el centro libre con `label`/`sublabel`. Custom (sin PrimeNG). El Playground usa un segmento bicolor fijo; edita el resto de parámetros.',
    argTypes: [
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      {
        name: 'thickness',
        control: { kind: 'number', min: 4, max: 40, step: 1 },
        description: 'Grosor del trazo (unidades del viewBox 0–100).',
      },
      { name: 'trackVisible', control: { kind: 'boolean' }, description: 'Track de fondo.' },
      {
        name: 'startAngle',
        control: { kind: 'number', min: -180, max: 180, step: 15 },
        description: 'Ángulo de inicio (-90 = 12 en punto).',
      },
      { name: 'label', control: { kind: 'text' }, description: 'Número grande del centro.' },
      { name: 'sublabel', control: { kind: 'text' }, description: 'Texto pequeño bajo el número.' },
    ],
    defaultArgs: {
      size: 'lg',
      thickness: 12,
      trackVisible: true,
      startAngle: -90,
      label: '234',
      sublabel: 'Conv. Totales',
    },
    props: [
      {
        name: 'segments',
        type: 'readonly ScGaugeSegment[]',
        default: '[]',
        description: 'Arcos del anillo (pesos relativos). Vacío → solo track.',
      },
      { name: 'size', type: 'ScGaugeSize', default: "'md'", description: 'sm 96 · md 140 · lg 180 px' },
      {
        name: 'thickness',
        type: 'number',
        default: '12',
        description: 'Grosor del trazo (unidades del viewBox 0–100).',
      },
      { name: 'trackVisible', type: 'boolean', default: 'true', description: 'Pinta el track de fondo.' },
      {
        name: 'startAngle',
        type: 'number',
        default: '-90',
        description: 'Ángulo de inicio en grados (-90 = 12 en punto).',
      },
      {
        name: 'ariaLabel',
        type: 'string | null',
        default: 'null',
        description: 'Etiqueta accesible (decorativo si null).',
      },
      { name: 'label', type: 'string | null', default: 'null', description: 'Número grande del centro.' },
      {
        name: 'sublabel',
        type: 'string | null',
        default: 'null',
        description: 'Texto pequeño bajo el número.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const kp = this.kpisTpl();
    const va = this.variantsTpl();
    if (!pg || !kp || !va) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'KPIs', template: kp, snippet: KPIS_SNIPPET },
      { name: 'Grosor y track', template: va, snippet: VARIANTS_SNIPPET },
    ];
  });
}
