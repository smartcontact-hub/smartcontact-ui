import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScMultiSelectComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const ESTADOS_SNIPPET = `<!-- El valor va en dos sentidos y es un ARRAY: "[(value)]". -->
<sc-multiselect label="Grupos" [options]="groups" placeholder="Selecciona grupos" [(value)]="value" />
<sc-multiselect label="Con chips" [options]="groups" display="chip" />
<sc-multiselect label="Con filtro" [options]="groups" [filter]="true" filterPlaceholder="Buscar grupo" />
<sc-multiselect label="Con error" [options]="groups" error="Selecciona al menos uno" />`;

const MENOS_VISTOS_SNIPPET = `<!-- Con OBJETOS hay que decir qué campo se lee y cuál se guarda:
     "optionLabel" es lo que se ve, "optionValue" lo que devuelve [(value)]. Sin el segundo,
     devuelve el objeto entero. "filterBy" dice por qué campo busca el filtro. -->
<sc-multiselect
  [options]="prioridades"
  optionLabel="name"
  optionValue="id"
  [filter]="true"
  filterBy="name"
  emptyFilterMessage="Ninguna prioridad se llama así"
  placeholder="Elige prioridades"
/>

<!-- "selectionLimit" corta cuántos se pueden elegir; "maxSelectedLabels" es OTRA cosa: cuántos
     se listan antes de plegar a "N seleccionados", y ese texto lo pone "selectedItemsLabel"
     con {0} de hueco. -->
<sc-multiselect
  [options]="groups"
  [selectionLimit]="2"
  [maxSelectedLabels]="1"
  selectedItemsLabel="{0} grupos elegidos"
  placeholder="Máximo dos"
/>

<!-- "invalid" marca el campo SIN texto de error, para cuando el error se cuenta en otro sitio. -->
<sc-multiselect label="Inválido" [options]="groups" [invalid]="true" placeholder="Marca el campo sin decir por qué" />

<!-- "emptyMessage" es la lista vacía; "emptyFilterMessage" es "filtraste y no hay". -->
<sc-multiselect label="Sin opciones" [options]="[]" emptyMessage="Todavía no hay grupos" />

<!-- "optionDisabled" deja una opción FIJA: se ve marcada y no se quita. Sin rótulo visible,
     "ariaLabel" le da nombre. Es el selector de columnas de las listas del Supervisor. -->
<sc-multiselect
  [options]="columnas"
  optionLabel="label"
  optionValue="key"
  optionDisabled="locked"
  [value]="columnasVisibles"
  [maxSelectedLabels]="0"
  selectedItemsLabel="{0} columnas"
  placeholder="Columnas"
  ariaLabel="Columnas"
/>`;

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
  protected readonly menosVistosTpl = viewChild<TemplateRef<StoryContext>>('menosVistos');

  /** Lista de OBJETOS, para que `optionLabel`/`optionValue`/`filterBy` tengan algo que señalar. */
  readonly columnas = [
    { key: 'name', label: 'Nombre', locked: true },
    { key: 'extension', label: 'Extensión', locked: false },
    { key: 'email', label: 'Email', locked: false },
    { key: 'phone', label: 'Teléfono', locked: false },
  ];
  readonly columnasVisibles = ['name', 'extension', 'email'];
  readonly prioridades = [
    { id: 'alta', name: 'Alta' },
    { id: 'media', name: 'Media' },
    { id: 'baja', name: 'Baja' },
  ];

  /** Lo que devuelve el de objetos: son los `id`, no los objetos — que es lo que hace `optionValue`. */
  protected readonly elegidos = signal<unknown[]>([]);

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
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.basicoTpl();
    const es = this.estadosTpl();
    const mv = this.menosVistosTpl();
    if (!pg || !ba || !es || !mv) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Básico', template: ba },
      { name: 'Estados', template: es, snippet: ESTADOS_SNIPPET },
      { name: 'Lo que no se ve en los otros ejemplos', template: mv, snippet: MENOS_VISTOS_SNIPPET },
    ];
  });
}
