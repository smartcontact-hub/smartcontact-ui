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
const MATCH_SNIPPET = `<sc-bulk-edit-menu [matchable]="true" [fields]="fields" (match)="onMatch($event)" (commit)="onCommit($event)" />`;

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
    ],
    defaultArgs: {      buttonLabel: 'Editar',
    },
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
