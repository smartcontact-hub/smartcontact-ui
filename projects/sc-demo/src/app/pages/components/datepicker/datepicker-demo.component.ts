import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScDatepickerComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

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

  readonly value = signal<Date | null>(null);

  protected readonly meta: StoryMeta = {
    tag: 'sc-datepicker',
    title: 'Datepicker',
    description:
      'Selector de fecha sobre `p-datepicker` con la chrome del field-pattern (label + requerido + helper/error). v1: selección de fecha única en popup; formato es-ES por defecto.',
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
      { name: 'value', type: 'Date | null', default: 'null', description: 'Two-way `[(value)]`.' },
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
    if (!pg || !ba || !es) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Con valor', template: ba, snippet: '<sc-datepicker label="Fecha de inicio" [(value)]="value" />' },
      { name: 'Estados', template: es, snippet: ESTADOS_SNIPPET },
    ];
  });
}
