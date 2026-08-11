import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { PrimeTemplate } from 'primeng/api';

import { ScSelectComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const OBJETOS_SNIPPET = `<sc-select
  label="Prioridad (objetos + pTemplate)"
  [options]="objOptions"
  optionLabel="name"
  optionValue="id"
  placeholder="Elige prioridad"
>
  <ng-template pTemplate="item" let-opt>★ {{ opt.name }}</ng-template>
</sc-select>`;

const ESTADOS_SNIPPET = `<sc-select label="Con clear + filtro" [options]="groups" [showClear]="true" [filter]="true" placeholder="Buscar…" />
<sc-select label="Con error" [options]="groups" error="Selecciona un grupo" />
<sc-select label="Small" [options]="groups" size="sm" placeholder="sm" />
<sc-select label="Deshabilitado" [options]="groups" [disabled]="true" placeholder="off" />`;

/** Demo de `sc-select` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-select-demo',
  imports: [ScSelectComponent, PrimeTemplate, StoryHostComponent],
  templateUrl: './select-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly objetosTpl = viewChild<TemplateRef<StoryContext>>('objetos');
  protected readonly estadosTpl = viewChild<TemplateRef<StoryContext>>('estados');

  readonly groups = ['Soporte', 'Ventas', 'Postventa', 'Calidad'];
  readonly objOptions = [
    { name: 'Alta', id: 'high' },
    { name: 'Media', id: 'mid' },
    { name: 'Baja', id: 'low' },
  ];
  readonly value = signal<string>('');

  protected readonly meta: StoryMeta = {
    tag: 'sc-select',
    title: 'Select',
    description:
      'Select / dropdown sobre `p-select` con la chrome del field-pattern (label + requerido + helper/error). Options como `string[]` u objetos (`optionLabel`/`optionValue`). Acepta `<ng-template pTemplate="item">` para render custom de las opciones.',
    argTypes: [
      { name: 'label', control: { kind: 'text' } },
      { name: 'placeholder', control: { kind: 'text' } },
      { name: 'helperText', control: { kind: 'text' } },
      { name: 'error', control: { kind: 'text' } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'required', control: { kind: 'boolean' } },
      { name: 'showClear', control: { kind: 'boolean' } },
      { name: 'filter', control: { kind: 'boolean' } },
      { name: 'filled', control: { kind: 'boolean' } },
      { name: 'iftaLabel', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'loading', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      label: 'Grupo',
      placeholder: 'Selecciona',
      helperText: '',
      error: '',
      size: 'md',
      required: false,
      showClear: false,
      filter: false,
      filled: false,
      iftaLabel: false,
      disabled: false,
      loading: false,
    },
    props: [
      { name: 'value', type: 'unknown', default: 'undefined', description: 'Two-way `[(value)]`.' },
      { name: 'options', type: 'unknown[]', default: '[]', description: 'string[] u objetos.' },
      { name: 'optionLabel', type: 'string', default: "'label'", description: 'Clave de la etiqueta (objetos).' },
      { name: 'optionValue', type: 'string', default: '—', description: 'Clave del valor (objetos).' },
      { name: 'label', type: 'string', default: '—' },
      { name: 'placeholder', type: 'string', default: "''" },
      { name: 'size', type: 'ScSelectSize', default: "'md'", description: 'sm · md · lg' },
      { name: 'helperText', type: 'string', default: '—' },
      { name: 'error', type: 'string', default: '—', description: 'Texto de error (gana a helper).' },
      { name: 'required', type: 'boolean', default: 'false' },
      { name: 'showClear', type: 'boolean', default: 'false', description: 'Botón «×» para limpiar.' },
      { name: 'filter', type: 'boolean', default: 'false', description: 'Buscador dentro del panel.' },
      { name: 'filled', type: 'boolean', default: 'false', description: 'Fondo slate-50.' },
      { name: 'iftaLabel', type: 'boolean', default: 'false', description: 'Label dentro del campo.' },
      { name: 'disabled', type: 'boolean', default: 'false' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Spinner de carga.' },
      { name: 'focused', type: 'EventEmitter<FocusEvent>' },
      { name: 'blurred', type: 'EventEmitter<FocusEvent>' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ob = this.objetosTpl();
    const es = this.estadosTpl();
    if (!pg || !ob || !es) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Objetos + pTemplate', template: ob, snippet: OBJETOS_SNIPPET },
      { name: 'Estados y tamaños', template: es, snippet: ESTADOS_SNIPPET },
    ];
  });
}
