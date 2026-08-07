import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScMultiSelectComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const ESTADOS_SNIPPET = `<sc-multiselect label="Con chips" [options]="groups" display="chip" />
<sc-multiselect label="Con filtro" [options]="groups" [filter]="true" />
<sc-multiselect label="Con error" [options]="groups" error="Selecciona al menos uno" />`;

/** Demo de `sc-multiselect` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-multiselect-demo',
  imports: [ScMultiSelectComponent, StoryHostComponent],
  templateUrl: './multiselect-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicoTpl = viewChild<TemplateRef<StoryContext>>('basico');
  protected readonly estadosTpl = viewChild<TemplateRef<StoryContext>>('estados');

  readonly groups = ['Soporte', 'Ventas', 'Postventa', 'Calidad'];
  readonly value = signal<unknown[]>([]);

  protected readonly meta: StoryMeta = {
    tag: 'sc-multiselect',
    title: 'MultiSelect',
    description:
      'Multi-select sobre `p-multiselect` con la chrome del field-pattern (label + requerido + helper/error). Dos modos de display (`chip` · `comma`), filtro, «select all» y límite de selección.',
    argTypes: [
      { name: 'label', control: { kind: 'text' } },
      { name: 'placeholder', control: { kind: 'text' } },
      { name: 'helperText', control: { kind: 'text' } },
      { name: 'error', control: { kind: 'text' } },
      { name: 'display', control: { kind: 'select', options: ['comma', 'chip'] } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'required', control: { kind: 'boolean' } },
      { name: 'filter', control: { kind: 'boolean' } },
      { name: 'showToggleAll', control: { kind: 'boolean' } },
      { name: 'showClear', control: { kind: 'boolean' } },
      { name: 'filled', control: { kind: 'boolean' } },
      { name: 'iftaLabel', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      label: 'Grupos',
      placeholder: 'Selecciona grupos',
      helperText: '',
      error: '',
      display: 'comma',
      size: 'md',
      required: false,
      filter: false,
      showToggleAll: true,
      showClear: false,
      filled: false,
      iftaLabel: false,
      disabled: false,
    },
    props: [
      { name: 'value', type: 'unknown[]', default: '[]', description: 'Two-way `[(value)]` (array).' },
      { name: 'options', type: 'unknown[]', default: '[]', description: 'string[] u objetos.' },
      { name: 'optionLabel', type: 'string', default: "'label'", description: 'Clave de la etiqueta (objetos).' },
      { name: 'optionValue', type: 'string', default: '—', description: 'Clave del valor (objetos).' },
      { name: 'display', type: 'ScMultiSelectDisplay', default: "'comma'", description: 'chip · comma' },
      { name: 'label', type: 'string', default: '—' },
      { name: 'placeholder', type: 'string', default: "''" },
      { name: 'size', type: 'ScMultiSelectSize', default: "'md'", description: 'sm · md · lg' },
      { name: 'helperText', type: 'string', default: '—' },
      { name: 'error', type: 'string', default: '—', description: 'Texto de error (gana a helper).' },
      { name: 'required', type: 'boolean', default: 'false' },
      { name: 'filter', type: 'boolean', default: 'false', description: 'Buscador dentro del panel.' },
      { name: 'showToggleAll', type: 'boolean', default: 'true', description: 'Toggle «seleccionar todo».' },
      { name: 'selectionLimit', type: 'number', default: '—', description: 'Máximo de ítems seleccionables.' },
      { name: 'maxSelectedLabels', type: 'number', default: '3', description: 'Pliega a «N seleccionados» (comma).' },
      { name: 'showClear', type: 'boolean', default: 'false', description: 'Botón «×» para limpiar.' },
      { name: 'filled', type: 'boolean', default: 'false', description: 'Fondo slate-50.' },
      { name: 'iftaLabel', type: 'boolean', default: 'false', description: 'Label dentro del campo.' },
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
      { name: 'Básico', template: ba },
      { name: 'Estados', template: es, snippet: ESTADOS_SNIPPET },
    ];
  });
}
