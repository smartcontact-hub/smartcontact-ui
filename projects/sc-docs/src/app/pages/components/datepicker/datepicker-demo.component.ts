import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScDatepickerComponent, type ScDatepickerPreset } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const MENOS_VISTOS_SNIPPET = `<!-- "minDate" y "maxDate" acotan el calendario: los días de fuera
     salen apagados y no se pueden elegir. Son Date, no cadenas. -->
<sc-datepicker label="Solo este mes" [minDate]="primerDia" [maxDate]="ultimoDia" [(value)]="fecha" />

<!-- "invalid" marca el campo SIN texto de error, para cuando el error se cuenta en otro sitio. -->
<sc-datepicker label="Inválida" [invalid]="true" />`;

const RANGO_SNIPPET = `<!-- "selectionMode=range": primer clic abre el periodo, segundo lo cierra. El valor va en
     "range" ([inicio, fin]), no en "value". "presets" pone atajos en el pie del panel; cada
     uno calcula su periodo AL PULSAR, así «Hoy» es hoy aunque la pantalla lleve abierta desde ayer. -->
<sc-datepicker
  label="Periodo"
  selectionMode="range"
  placeholder="Cualquier fecha"
  [presets]="atajos"
  clearLabel="Quitar periodo"
  [(range)]="periodo"
  [showClear]="true"
/>

atajos: ScDatepickerPreset[] = [
  { label: 'Hoy', resolve: () => [hoy(), hoy()] },
  { label: 'Últimos 7 días', resolve: () => [haceDias(6), hoy()] },
];`;

const ESTADOS_SNIPPET = `<sc-datepicker label="Fecha de inicio" />
<sc-datepicker label="Obligatoria" [required]="true" />
<sc-datepicker label="Con error" error="La fecha no es válida" />
<sc-datepicker label="Deshabilitada" [disabled]="true" />`;

/** Demo de `sc-datepicker` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-datepicker-demo',
  imports: [ScDatepickerComponent, StoryHostComponent],
  templateUrl: './datepicker-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicoTpl = viewChild<TemplateRef<StoryContext>>('basico');
  protected readonly estadosTpl = viewChild<TemplateRef<StoryContext>>('estados');
  protected readonly menosVistosTpl = viewChild<TemplateRef<StoryContext>>('menosVistos');
  protected readonly rangoTpl = viewChild<TemplateRef<StoryContext>>('rango');

  protected readonly periodo = signal<readonly (Date | null)[] | null>(null);
  protected readonly periodoTexto = computed(() => {
    const [inicio, fin] = this.periodo() ?? [];
    return inicio ? [inicio, fin].map((d) => d?.toLocaleDateString('es-ES') ?? '…').join(' – ') : '—';
  });
  private readonly haceDias = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };
  protected readonly atajos: readonly ScDatepickerPreset[] = [
    { label: 'Hoy', resolve: () => [this.haceDias(0), this.haceDias(0)] },
    { label: 'Ayer', resolve: () => [this.haceDias(1), this.haceDias(1)] },
    { label: 'Últimos 7 días', resolve: () => [this.haceDias(6), this.haceDias(0)] },
  ];

  /** Un mes de verdad, para que `minDate`/`maxDate` acoten algo que se ve. */
  private readonly hoy = new Date();
  protected readonly primerDia = new Date(this.hoy.getFullYear(), this.hoy.getMonth(), 1);
  protected readonly ultimoDia = new Date(this.hoy.getFullYear(), this.hoy.getMonth() + 1, 0);
  protected readonly acotada = signal<Date | null>(null);

  readonly value = signal<Date | null>(null);

  protected readonly meta: StoryMeta = {
    tag: 'sc-datepicker',
    title: 'Datepicker',
    description:
      'Selector de fecha sobre `p-datepicker` con la chrome del field-pattern (label + requerido + helper/error). Día único o rango (`selectionMode`), con atajos opcionales en el pie del panel (`presets`); formato es-ES por defecto.',
    argTypes: [
      { name: 'label', control: { kind: 'text' } },
      { name: 'placeholder', control: { kind: 'text' } },
      { name: 'helperText', control: { kind: 'text' } },
      { name: 'error', control: { kind: 'text' } },
      { name: 'dateFormat', control: { kind: 'text' } },
      { name: 'view', control: { kind: 'select', options: ['date', 'month', 'year'] } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'required', control: { kind: 'boolean' } },
      { name: 'showIcon', control: { kind: 'boolean' } },
      { name: 'showClear', control: { kind: 'boolean' } },
      { name: 'showButtonBar', control: { kind: 'boolean' } },
      { name: 'inline', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      label: 'Fecha de inicio',
      placeholder: 'dd/mm/aaaa',
      helperText: '',
      error: '',
      dateFormat: 'dd/mm/yy',
      view: 'date',
      size: 'md',
      required: false,
      showIcon: true,
      showClear: false,
      showButtonBar: false,
      inline: false,
      disabled: false,
    },
    props: [
      { name: 'value', type: 'Date | null', default: 'null', description: 'Two-way `[(value)]`, en modo `single`.' },
      { name: 'range', type: 'readonly (Date | null)[] | null', default: 'null', description: 'Two-way `[(range)]`, en modo `range`: `[inicio, fin]`.' },
      { name: 'selectionMode', type: 'ScDatepickerSelectionMode', default: "'single'", description: 'single · range' },
      { name: 'presets', type: 'readonly ScDatepickerPreset[]', default: '[]', description: 'Atajos en el pie del panel; `resolve` se evalúa al pulsar.' },
      { name: 'clearLabel', type: 'string', default: "'Limpiar'", description: 'Rótulo de «Limpiar» en el pie con atajos.' },
      { name: 'label', type: 'string', default: '—' },
      { name: 'placeholder', type: 'string', default: "'dd/mm/aaaa'" },
      { name: 'size', type: 'ScDatepickerSize', default: "'md'", description: 'sm · md · lg' },
      { name: 'dateFormat', type: 'string', default: "'dd/mm/yy'", description: 'Formato de display/parseo.' },
      { name: 'view', type: 'ScDatepickerView', default: "'date'", description: 'date · month · year' },
      { name: 'minDate', type: 'Date', default: '—', description: 'Fecha mínima seleccionable.' },
      { name: 'maxDate', type: 'Date', default: '—', description: 'Fecha máxima seleccionable.' },
      { name: 'helperText', type: 'string', default: '—' },
      { name: 'error', type: 'string', default: '—', description: 'Texto de error (gana a helper).' },
      { name: 'required', type: 'boolean', default: 'false' },
      { name: 'showIcon', type: 'boolean', default: 'true', description: 'Botón de calendario.' },
      { name: 'showClear', type: 'boolean', default: 'false', description: 'Botón «×» para limpiar.' },
      { name: 'showButtonBar', type: 'boolean', default: 'false', description: 'Botones hoy/limpiar en el panel.' },
      { name: 'inline', type: 'boolean', default: 'false', description: 'Panel siempre visible (no popup).' },
      { name: 'disabled', type: 'boolean', default: 'false' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.basicoTpl();
    const es = this.estadosTpl();
    const mv = this.menosVistosTpl();
    const ra = this.rangoTpl();
    if (!pg || !ba || !es || !mv || !ra) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Con valor', template: ba, snippet: '<sc-datepicker label="Fecha de inicio" [(value)]="value" />' },
      { name: 'Rango con atajos', template: ra, snippet: RANGO_SNIPPET },
      { name: 'Estados', template: es, snippet: ESTADOS_SNIPPET },
      { name: 'Lo que no se ve en los otros ejemplos', template: mv, snippet: MENOS_VISTOS_SNIPPET },
    ];
  });
}
