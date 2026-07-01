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
  ScBulkEditMenuComponent,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const INLINE_SNIPPET = `<sc-bulk-edit-menu [fields]="fields" (commit)="onCommit($event)" />`;

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

  protected readonly meta: StoryMeta = {
    tag: 'sc-bulk-edit-menu',
    title: 'Bulk Edit Menu',
    description:
      'Editor inline «Cambiar [campo] a [valor] [Aplicar]» que vive en la bulk action bar. El consumidor suministra campos y valores; el componente orquesta los selects (compone sc-select) y emite un único commit al pulsar Aplicar.',
    // `fields` es un objeto requerido (no un knob escalar) y `buttonLabel` ya no se
    // renderiza → sin controles editables en el Playground.
    argTypes: [],
    defaultArgs: {},
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
      { name: 'commit', type: 'EventEmitter<BulkEditCommit>', description: 'Output al aplicar.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const inl = this.inlineTpl();
    if (!pg || !inl) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Editor inline', template: inl, snippet: INLINE_SNIPPET },
    ];
  });

  onCommit(c: BulkEditCommit): void {
    this.lastCommit.set(c);
  }
}
