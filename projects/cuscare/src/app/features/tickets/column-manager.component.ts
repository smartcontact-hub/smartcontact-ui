import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Una columna gestionable: su rótulo y si se ve. */
export interface ManagedColumn {
  readonly header: string;
  readonly visible: boolean;
}

/**
 * Panel "Manage columns" (el icono de la izquierda de la barra).
 *
 * Métrica MEDIDA @1460×792:
 *   panel   220×600 en x=134.3 y=117 · blanco · radio 12 · borde #dadfe6
 *           sombra rgba(24,29,38,.12) 0 8px 24px · padding 12
 *   título  "Manage columns" Open Sans 12/600 #1b273d
 *   item    32px de alto · padding 6px 8px · gap 8 · rótulo 12px #243452
 *   pie     botón "Reset to default"
 *
 * Ojo: su checkbox NO es el de la tabla. Aquí mide 18px con radio 5 y se marca
 * en #243452; el de las filas es 16px con radio 3. Son dos componentes
 * distintos y conviene no unificarlos "por limpieza".
 *
 * Las columnas se REORDENAN arrastrando, como en el original — que usa Angular
 * CDK (se le vio la clase `cdk-drag` en el DOM), así que aquí se usa la misma
 * librería en vez de improvisar un arrastre a mano. El asa es el punto de
 * agarre (`cdkDragHandle`): así la fila se arrastra sólo desde ahí y la casilla
 * se sigue pudiendo marcar sin disparar un drag.
 */
@Component({
  selector: 'app-column-manager',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder],
  template: `
    <div class="panel" role="dialog" aria-label="Manage columns">
      <h3 class="panel__title">Manage columns</h3>

      <ul class="collist" role="list" cdkDropList (cdkDropListDropped)="onDrop($event)">
        @for (c of columns(); track c.header) {
          <li class="colitem" cdkDrag>
            <!-- El asa va en un span, no en la img: una imagen es arrastrable
                 de forma NATIVA y el navegador se queda el gesto antes de que
                 el CDK lo vea, así que el reordenado no se disparaba. El
                 atributo draggable="false" remata el apaño. -->
            <span class="colitem__drag" cdkDragHandle aria-hidden="true">
              <img
                src="icons/general/drag_indicator.svg"
                width="12"
                height="12"
                alt=""
                draggable="false"
              />
            </span>
            <input
              class="colcheck"
              type="checkbox"
              [checked]="c.visible"
              [attr.aria-label]="'Show column ' + c.header"
              (change)="toggled.emit(c.header)"
            />
            <span class="colitem__label">{{ c.header }}</span>

            <!-- Hueco que deja la fila mientras se arrastra. -->
            <div class="colitem__placeholder" *cdkDragPlaceholder></div>
          </li>
        }
      </ul>

      <footer class="panel__foot">
        <button class="resetbtn" type="button" (click)="resetRequested.emit()">Reset to default</button>
      </footer>
    </div>
  `,
  styleUrl: './column-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnManagerComponent {
  readonly columns = input.required<readonly ManagedColumn[]>();
  readonly toggled = output<string>();
  readonly resetRequested = output<void>();
  /** Nuevo orden completo de rótulos tras soltar. */
  readonly reordered = output<string[]>();

  protected onDrop(event: CdkDragDrop<readonly ManagedColumn[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const headers = this.columns().map((c) => c.header);
    const [moved] = headers.splice(event.previousIndex, 1);
    headers.splice(event.currentIndex, 0, moved);
    this.reordered.emit(headers);
  }
}
