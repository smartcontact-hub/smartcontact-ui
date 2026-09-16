import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import {
  BulkEditCommit,
  BulkEditFieldOption,
  type BulkEditMatch,
  ScBulkEditMenuComponent,
} from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const INLINE_SNIPPET = `<sc-bulk-edit-menu [fields]="fields" (commit)="onCommit($event)" />`;
const MATCH_SNIPPET = `<sc-bulk-edit-menu matchable [fields]="fields" (match)="onMatch($event)" (commit)="onCommit($event)" />`;

/** Demo de `sc-bulk-edit-menu` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-bulkeditmenu-demo',
  imports: [ScBulkEditMenuComponent, StoryHostComponent],
  templateUrl: './bulkeditmenu-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkEditMenuDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly inlineTpl = viewChild<TemplateRef<StoryContext>>('inline');
  protected readonly matchTpl = viewChild<TemplateRef<StoryContext>>('match');

  readonly fields: BulkEditFieldOption[] = [
    {
      key: 'estado',
      label: 'Estado',
      values: [
        { value: 'activo', label: 'Activo' },
        { value: 'pausado', label: 'Pausado' },
      ],
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      values: [
        { value: 'alta', label: 'Alta' },
        { value: 'media', label: 'Media' },
        { value: 'baja', label: 'Baja' },
      ],
    },
  ];
  readonly lastCommit = signal<BulkEditCommit | null>(null);
  readonly lastMatch = signal<BulkEditMatch | null>(null);

  protected readonly meta: StoryMeta = {
    tag: 'sc-bulk-edit-menu',
    title: 'Bulk Edit Menu',
    description:
      'Editor inline «Cambiar [campo] a [valor] [Aplicar]» que vive en la bulk action bar. El consumidor suministra campos y valores; el componente orquesta los selects (compone sc-select) y emite un único commit al pulsar Aplicar.',
    // `fields` es un objeto requerido (no un knob escalar) y `buttonLabel` ya no se
    // renderiza → sin controles editables en el Playground.
    argTypes: [      { name: 'buttonLabel', control: { kind: 'text' }, description: 'Rótulo del botón que abre el menú.' },
      { name: 'matchable', control: { kind: 'boolean' }, description: 'Añade «de [valor]»: elegir un valor pide seleccionar todas las filas que lo tienen.' },
    ],
    defaultArgs: {      buttonLabel: 'Editar',
      matchable: false,
    },
    props: [
      {
        name: 'fields',
        type: 'readonly BulkEditFieldOption[]',
        description: 'Campos y sus valores posibles (requerido). El primero es el default.',
      },
      {
        name: 'buttonLabel',
        type: 'string',
        default: "'Editar'",
        description: 'Retenido por compatibilidad; ya no se renderiza.',
      },
      {
        name: 'matchable',
        type: 'boolean',
        default: 'false',
        description: 'Añade «de [valor]» a la frase. Elegir un valor emite `match` para que la lista seleccione todas las filas con ese valor; «la selección» deja la selección como está.',
      },
      { name: 'commit', type: 'EventEmitter<BulkEditCommit>', description: 'Output al aplicar.' },
      { name: 'match', type: 'EventEmitter<BulkEditMatch>', description: 'Output al elegir un valor en «de» (solo con `matchable`).' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const inl = this.inlineTpl();
    const match = this.matchTpl();
    if (!pg || !inl || !match) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Editor inline', template: inl, snippet: INLINE_SNIPPET },
      { name: 'De un valor a otro', template: match, snippet: MATCH_SNIPPET },
    ];
  });

  onCommit(c: BulkEditCommit): void {
    this.lastCommit.set(c);
  }

  onMatch(m: BulkEditMatch): void {
    this.lastMatch.set(m);
  }
}
