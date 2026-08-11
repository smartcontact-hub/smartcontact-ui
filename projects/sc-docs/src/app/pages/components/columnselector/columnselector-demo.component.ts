import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import {
  ColumnDef,
  ScColumnSelectorComponent,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

/** Demo de `sc-column-selector` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-columnselector-demo',
  imports: [ScColumnSelectorComponent, StoryHostComponent],
  templateUrl: './columnselector-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnSelectorDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicoTpl = viewChild<TemplateRef<StoryContext>>('basico');

  readonly columns: readonly ColumnDef[] = [
    { key: 'name', label: 'Nombre', locked: true },
    { key: 'group', label: 'Grupo' },
    { key: 'status', label: 'Estado' },
    { key: 'lastCall', label: 'Última llamada', defaultVisible: false },
  ];

  protected readonly meta: StoryMeta = {
    tag: 'sc-column-selector',
    title: 'Column Selector',
    description:
      'Gestor de columnas sobre popover: visibilidad (checkbox por columna) + reordenado por arrastre (CDK Drag-Drop), persistido en localStorage bajo `storageKey`. Las columnas `locked` quedan visibles y fijas. Emite `(orderedVisibleChange)` en cada cambio.',
    argTypes: [{ name: 'buttonLabel', control: { kind: 'text' } }],
    defaultArgs: { buttonLabel: 'Columnas' },
    props: [
      {
        name: 'columns',
        type: 'ColumnDef[]',
        default: '(required)',
        description: 'key · label · locked? · defaultVisible?',
      },
      {
        name: 'storageKey',
        type: 'string',
        default: '(required)',
        description: 'Clave localStorage; incluye sufijo `_v<N>`.',
      },
      { name: 'buttonLabel', type: 'string', default: "'Columnas'", description: 'aria-label del trigger.' },
      {
        name: 'orderedVisibleChange',
        type: 'EventEmitter<readonly string[]>',
        description: 'Keys visibles en orden.',
      },
      {
        name: 'visibilityChange',
        type: 'EventEmitter<ReadonlySet<string>>',
        description: 'Legacy (solo visibilidad).',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.basicoTpl();
    if (!pg || !ba) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      {
        name: 'Básico',
        template: ba,
        snippet: `<sc-column-selector [columns]="columns" storageKey="demo_columns_v1" />`,
      },
    ];
  });
}
