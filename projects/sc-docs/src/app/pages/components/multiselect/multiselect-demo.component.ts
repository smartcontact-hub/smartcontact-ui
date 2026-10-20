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

const BASICO_SNIPPET = `<!-- El valor va en dos sentidos y es un ARRAY: "[(value)]". -->
<sc-multiselect label="Grupos" [options]="groups" placeholder="Selecciona grupos" [(value)]="value" />`;

const ESTADOS_SNIPPET = `<!-- El valor va en dos sentidos y es un ARRAY: "[(value)]". -->
<sc-multiselect label="Grupos" [options]="groups" placeholder="Selecciona grupos" [(value)]="value" />
<sc-multiselect label="Con chips" [options]="groups" display="chip" />
<!-- chipOverflow="more": pasado el tope, las primeras etiquetas y «+N más», en vez de «N seleccionados». -->
<sc-multiselect label="Con chips y «+N más»" [options]="groups" display="chip" chipOverflow="more" [maxSelectedLabels]="2" [value]="todos" />
<!-- chipOverflow="fit": tantas etiquetas como caben en su ancho, sin cortar ninguna, y «+N más» por el resto. -->
<sc-multiselect label="Chips hasta llenar su ancho" [options]="agendas" display="chip" chipOverflow="fit" [value]="agendas" />
<!-- Un nombre más largo que el campo se acorta con «…» y se lee entero al pasar; su «×» y «+N más», a la vista. -->
<sc-multiselect label="Un nombre más largo que el campo" [options]="agendasLargas" display="chip" chipOverflow="fit" [value]="agendasLargas" />
<sc-multiselect label="Con filtro" [options]="groups" [filter]="true" filterPlaceholder="Buscar grupo" />
<sc-multiselect label="Con error" [options]="groups" error="Selecciona al menos uno" />`;

const MENOS_VISTOS_SNIPPET = `<!-- Con OBJETOS hay que decir qué campo se lee y cuál se guarda:
     "optionLabel" es lo que se ve, "optionValue" lo que devuelve [(value)]. Sin el segundo,
     devuelve el objeto entero. "filterBy" dice por qué campo busca el filtro. -->
<sc-multiselect
  label="Objetos: qué campo es la etiqueta y cuál el valor"
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
  label="Como mucho dos, y a la tercera se pliega"
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

<!-- "group": las opciones van por secciones, cada una con su cabecera, que no se marca.
     "optionGroupLabel" es el campo del rótulo de la sección y "optionGroupChildren" el de sus
     opciones. Es el valor de una condición de Reglas: grupos e individuales. -->
<sc-multiselect
  label="Por secciones"
  [options]="porSecciones"
  [group]="true"
  optionGroupLabel="nombre"
  optionGroupChildren="opciones"
  optionLabel="name"
  optionValue="id"
  [filter]="true"
  placeholder="Grupos o agentes"
/>

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
  protected readonly iconoTpl = viewChild<TemplateRef<StoryContext>>('icono');
  protected readonly iconColumns = signal<unknown[]>(['name', 'extension', 'email']);
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
  /** Opciones por secciones (`group`), con sus campos propios para enseñar `optionGroupLabel` y `optionGroupChildren`. */
  readonly porSecciones = [
    { nombre: 'Grupos', opciones: [{ id: 'g-soporte', name: 'Soporte' }, { id: 'g-ventas', name: 'Ventas' }] },
    { nombre: 'Agentes', opciones: [{ id: 'a-lucia', name: 'Lucía Pardo' }, { id: 'a-marcos', name: 'Marcos Vidal' }] },
  ];

  /** Lo que devuelve el de objetos: son los `id`, no los objetos — que es lo que hace `optionValue`. */
  protected readonly elegidos = signal<unknown[]>([]);

  readonly groups = ['Soporte', 'Ventas', 'Postventa', 'Calidad'];
  readonly todos = [...this.groups];
  readonly agendas = ['Ventas Nacional', 'Soporte Premium', 'Cobros', 'Postventa Norte', 'Postventa Sur', 'Calidad', 'Retención', 'Bajas'];
  readonly agendasLargas = ['Clientes preferentes de la campaña de renovación de seguros del hogar, otoño', 'Cobros', 'Bajas'];
  readonly value = signal<unknown[]>([]);

  protected readonly meta: StoryMeta = {
    tag: 'sc-multiselect',
    title: 'MultiSelect',
    description:
      'Multi-select sobre `p-multiselect` con la chrome del field-pattern (label + requerido + helper/error). Dos modos de display (`chip` · `comma`), filtro, «select all» y límite de selección.',
    argTypes: [
      { name: 'iconOnly', control: { kind: 'boolean' } },
      { name: 'icon', control: { kind: 'text' } },
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
      iconOnly: false,
      icon: 'group',
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
    const ic = this.iconoTpl();
    if (!pg || !ba || !es || !mv || !ic) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Básico', template: ba, snippet: BASICO_SNIPPET },
      { name: 'Estados', template: es, snippet: ESTADOS_SNIPPET },
      { name: 'Solo icono · columnas', template: ic, snippet: `<sc-multiselect iconOnly icon="view_column" size="md" [options]="columnas" optionValue="key"
  optionDisabled="locked" [(value)]="iconColumns"
  [ariaLabel]="'Columnas, ' + iconColumns().length + ' de ' + columnas.length" />` },
      { name: 'Lo que no se ve en los otros ejemplos', template: mv, snippet: MENOS_VISTOS_SNIPPET },
    ];
  });
}
