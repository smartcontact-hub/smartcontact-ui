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
} from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const SELECTION_SNIPPET = `<button type="button" (click)="count.set(3)">Seleccionar 3</button>
<button type="button" (click)="count.set(1)">Seleccionar 1</button>
<button type="button" (click)="count.set(0)">Deseleccionar</button>

<sc-bulk-action-bar [count]="count()" [entity]="entity" (clear)="count.set(0)">
  <button type="button">Editar</button>
  <button type="button">Eliminar</button>
</sc-bulk-action-bar>`;

const RESULT_SNIPPET = `<!-- Tras aplicar un cambio en lote, sin selección, la barra lo cuenta con «Deshacer» pegado al texto (DD-196). -->
<sc-bulk-action-bar
  [count]="0"
  [entity]="entity"
  [result]="resultado()"
  [resultUndoable]="sePuedeDeshacer()"
  (undo)="deshacer()"
  (clear)="resultado.set(null)"
/>`;

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
  protected readonly resultTpl = viewChild<TemplateRef<StoryContext>>('result');

  /** El resultado del último cambio en lote, y si aún se puede deshacer. Sin él, esa barra no se ve. */
  readonly resultado = signal<string | null>(null);
  readonly sePuedeDeshacer = signal(false);

  protected aplicar(): void {
    this.resultado.set('Cambio aplicado a 3 agentes');
    this.sePuedeDeshacer.set(true);
  }

  protected deshacer(): void {
    this.resultado.set('Cambio revertido');
    this.sePuedeDeshacer.set(false);
  }

  /** Estado de selección compartido por las stories (barra visible con count > 0). */
  readonly count = signal(3);
  /** Sufijo omitido a propósito → cae al colocado `sc.bulkActionBar.selectedOther`. */
  readonly entity: BulkActionEntityLabels = { singular: 'agente', plural: 'agentes' };

  protected readonly meta: StoryMeta = {
    tag: 'sc-bulk-action-bar',
    title: 'Bulk Action Bar',
    description:
      'Barra fija inferior que aparece al seleccionar filas en list pages. Resumen «N entidad seleccionados» + botón de limpiar a la izquierda; acciones proyectadas a la derecha. Aparece fija al fondo de la página cuando count > 0. Tras aplicar un cambio en lote, sin selección, se queda y cuenta el resultado (`result`) con «Deshacer» al lado (`resultUndoable`, `undo`), en lugar de un toast.',
    argTypes: [
      {
        name: 'count',
        control: { kind: 'number', min: 0, max: 20, step: 1 },
        description: 'Nº de filas seleccionadas. La barra se oculta con 0.',
      },
      {
        name: 'total',
        control: { kind: 'number', min: 0, max: 200, step: 1 },
        description: 'Cuántas hay en la lista: con él, «3/16 agentes seleccionados» (y «3 de 16» para el lector). 0, sin total.',
      },
    ],
    defaultArgs: {
      count: 3,
      total: 0,
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const se = this.selectionTpl();
    const re = this.resultTpl();
    if (!pg || !se || !re) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Con selección', template: se, snippet: SELECTION_SNIPPET },
      { name: 'Tras aplicar un cambio', template: re, snippet: RESULT_SNIPPET },
    ];
  });
}
