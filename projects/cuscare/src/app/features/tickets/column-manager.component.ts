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
 * Cada fila lleva su asa de arrastre porque en el original las columnas se
 * REORDENAN (18 asas medidas). El reordenado en sí queda pendiente: aquí el asa
 * está presente y anotada, no simulada como si funcionara.
 */
@Component({
  selector: 'app-column-manager',
  standalone: true,
  template: `
    <div class="panel" role="dialog" aria-label="Manage columns">
      <h3 class="panel__title">Manage columns</h3>

      <ul class="collist" role="list">
        @for (c of columns(); track c.header) {
          <li class="colitem">
            <img
              class="colitem__drag"
              src="icons/general/drag_indicator.svg"
              width="12"
              height="12"
              alt=""
              aria-hidden="true"
            />
            <input
              class="colcheck"
              type="checkbox"
              [checked]="c.visible"
              [attr.aria-label]="'Mostrar columna ' + c.header"
              (change)="toggled.emit(c.header)"
            />
            <span class="colitem__label">{{ c.header }}</span>
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
}
