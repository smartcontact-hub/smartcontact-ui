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
<sc-datepicker label="Inválida" [invalid]="true" />

<!-- "defaultDate": el mes con el que abre mientras no hay nada elegido, sin marcar ningún día. Un diálogo
     que añade fechas abre así en el mes que ya se estaba mirando. -->
<sc-datepicker label="Abre en junio" [defaultDate]="junio" [(value)]="otra" />`;

const VARIOS_SNIPPET = `<!-- "selectionMode=multiple": cada clic pone o quita un día. El valor va en "dates" (los días,
     en el orden en que se marcaron). En línea ("inline") el calendario queda a la vista: sirve para
     marcar de una vez todos los días que llevan lo mismo. Sin etiqueta visible, su nombre va en "ariaLabel". -->
<sc-datepicker inline selectionMode="multiple" ariaLabel="Días festivos" [(dates)]="festivos" />`;

const HORA_SNIPPET = `<!-- "timeOnly": solo la hora, escrita como hh:mm. El valor sigue en "value" y es un Date del que
     solo cuentan la hora y los minutos. "stepMinute" es el salto de las flechas del panel. -->
<sc-datepicker label="Apertura" [timeOnly]="true" placeholder="hh:mm" [stepMinute]="15" [(value)]="apertura" />`;

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
  protected readonly variosTpl = viewChild<TemplateRef<StoryContext>>('varios');
  protected readonly horaTpl = viewChild<TemplateRef<StoryContext>>('hora');

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
  /** Un mes fijo y pasado: abierto, el panel no pinta «hoy» y la demo no cambia de un día para otro (DD-253). */
  protected readonly junio = new Date(2025, 5, 1);
  protected readonly otra = signal<Date | null>(null);
  /* Días ya marcados en un mes que ya pasó (DD-253): el calendario en línea abre en el mes del primero, así que no pinta
   * «hoy» y su HTML y su captura no cambian de un día para otro (con `null` abría en el mes en curso y la línea base de
   * estructura caía al día siguiente). */
  protected readonly festivos = signal<readonly Date[] | null>([new Date(2025, 11, 24), new Date(2025, 11, 25), new Date(2025, 11, 31)]);
  protected readonly apertura = signal<Date | null>(new Date(2026, 0, 1, 9, 0));

  readonly value = signal<Date | null>(null);

  protected readonly meta: StoryMeta = {
    tag: 'sc-datepicker',
    title: 'Datepicker',
    description:
      'Selector de fecha sobre `p-datepicker` con la chrome del field-pattern (label + requerido + helper/error). Día único, rango o días sueltos (`selectionMode`), o solo la hora (`timeOnly`), con atajos opcionales en el pie del panel (`presets`); formato es-ES por defecto.',
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
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.basicoTpl();
    const es = this.estadosTpl();
    const mv = this.menosVistosTpl();
    const ra = this.rangoTpl();
    const va = this.variosTpl();
    const ho = this.horaTpl();
    if (!pg || !ba || !es || !mv || !ra || !va || !ho) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Con valor', template: ba, snippet: '<sc-datepicker label="Fecha de inicio" [(value)]="value" />' },
      { name: 'Rango con atajos', template: ra, snippet: RANGO_SNIPPET },
      { name: 'Varios días sueltos', template: va, snippet: VARIOS_SNIPPET },
      { name: 'Solo la hora', template: ho, snippet: HORA_SNIPPET },
      { name: 'Estados', template: es, snippet: ESTADOS_SNIPPET },
      { name: 'Lo que no se ve en los otros ejemplos', template: mv, snippet: MENOS_VISTOS_SNIPPET },
    ];
  });
}
