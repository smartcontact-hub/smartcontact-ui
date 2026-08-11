import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import {
  BulkActionEntityLabels,
  ScBulkActionBarComponent,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const SELECTION_SNIPPET = `<button type="button" (click)="count.set(3)">Seleccionar 3</button>
<button type="button" (click)="count.set(1)">Seleccionar 1</button>
<button type="button" (click)="count.set(0)">Deseleccionar</button>

<sc-bulk-action-bar [count]="count()" [entity]="entity" (clear)="count.set(0)">
  <button type="button">Editar</button>
  <button type="button">Eliminar</button>
</sc-bulk-action-bar>`;

/** Demo de `sc-bulk-action-bar` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-bulkactionbar-demo',
  imports: [ScBulkActionBarComponent, StoryHostComponent],
  templateUrl: './bulkactionbar-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkActionBarDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly selectionTpl = viewChild<TemplateRef<StoryContext>>('selection');

  /** Estado de selección compartido por las stories (barra visible con count > 0). */
  readonly count = signal(3);
  /** Sufijo omitido a propósito → cae al colocado `sc.bulkActionBar.selectedOther`. */
  readonly entity: BulkActionEntityLabels = { singular: 'agente', plural: 'agentes' };

  protected readonly meta: StoryMeta = {
    tag: 'sc-bulk-action-bar',
    title: 'Bulk Action Bar',
    description:
      'Barra fija inferior que aparece al seleccionar filas en list pages. Resumen «N entidad seleccionados» + botón de limpiar a la izquierda; acciones proyectadas a la derecha. Aparece fija al fondo de la página cuando count > 0.',
    argTypes: [
      {
        name: 'count',
        control: { kind: 'number', min: 0, max: 20, step: 1 },
        description: 'Nº de filas seleccionadas. La barra se oculta con 0.',
      },
    ],
    defaultArgs: {
      count: 3,
    },
    props: [
      {
        name: 'count',
        type: 'number',
        description: 'Nº de elementos seleccionados (requerido). La barra se oculta con 0.',
      },
      {
        name: 'entity',
        type: 'BulkActionEntityLabels',
        description: 'Etiquetas singular/plural (+ sufijos opcionales) de la entidad (requerido).',
      },
      { name: 'clear', type: 'EventEmitter<void>', description: 'Output al pulsar limpiar.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const se = this.selectionTpl();
    if (!pg || !se) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Con selección', template: se, snippet: SELECTION_SNIPPET },
    ];
  });
}
