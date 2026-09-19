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
} from '@smartcontact-hub/components';
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
