import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';

import { ScCheckboxComponent, TriState } from '../checkbox/sc-checkbox.component';

/** Una fila de la matriz. El `label` va YA traducido por el consumidor. */
export interface ScMatrixRow {
  readonly id: string;
  readonly label: string;
}

/** Una columna de la matriz. El `label` va YA traducido por el consumidor. */
export interface ScMatrixColumn {
  readonly id: string;
  readonly label: string;
  /**
   * Ancho CSS de la columna. Opcional A PROPÓSITO: las dos matrices que este
   * componente sustituye clavaban 140px y 142px, y **ninguno de los dos está en
   * la escala** (`--sc-scale-10` no existe; la escala salta de 5 a 12-5). Sin
   * ancho, `table-layout: auto` reparte por contenido y el número desaparece en
   * vez de tener que elegir entre dos valores fuera de contrato.
   */
  readonly width?: string;
}

/** Marcado o desmarcado de UNA casilla. */
export interface ScMatrixToggle {
  readonly rowId: string;
  readonly columnId: string;
  readonly checked: boolean;
}

/** Marcado o desmarcado de una COLUMNA entera (solo con `selectableColumns`). */
export interface ScMatrixColumnToggle {
  readonly columnId: string;
  readonly checked: boolean;
}

/** Lee si la casilla (fila, columna) está marcada. Se llama en cada render:
 *  debe ser barata y pura, igual que `ScRowStyleClassFn` del `sc-datatable`. */
export type ScMatrixCellFn = (rowId: string, columnId: string) => boolean;

/**
 * MATRIZ DE PERMISOS — nombre de fila a la izquierda, una casilla por columna.
 *
 * POR QUÉ NO ES UN `sc-datatable`. La tabla de datos pinta `<td>` en todas las
 * celdas y su cabecera es texto o un botón de orden. Aquí la primera columna es
 * una CABECERA DE FILA (`<th scope="row">`) y la cabecera de columna puede ser
 * un control. Ni `sc-datatable` ni `p-table` saben hacer ninguna de las dos: no
 * es una función de PrimeNG que falte traer, es otra estructura.
 *
 * DE DÓNDE SALE EL ASPECTO. De la gramática de tabla-lista del tema
 * (`sc-preset/css.ts`, `sc-datatable--list`), que es lo que usan **las 10
 * páginas con tabla del Supervisor** — medido. Los dos casos que sustituye
 * (`.perm-matrix` de la ficha de agente y `.comm-table` de configuración AED)
 * habían derivado cada uno por su lado en cabecera, padding y ancho.
 */
@Component({
  selector: 'sc-permission-matrix',
  imports: [ScCheckboxComponent],
  templateUrl: './sc-permission-matrix.component.html',
  styleUrl: './sc-permission-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScPermissionMatrixComponent {
  readonly rows = input<readonly ScMatrixRow[]>([]);
  readonly columns = input<readonly ScMatrixColumn[]>([]);

  /** Lee el estado de cada casilla. */
  readonly checked = input.required<ScMatrixCellFn>();

  /** Texto de la celda esquina (la cabecera de la columna de nombres). */
  readonly rowHeader = input<string>('');

  /**
   * La cabecera de cada columna pasa a ser una casilla que marca la columna
   * ENTERA. Opt-in porque de las dos matrices reales solo una lo tiene, y
   * encenderlo por defecto le cambiaría la cabecera a la otra.
   */
  readonly selectableColumns = input(false, { transform: booleanAttribute });

  /** Nombre accesible de la tabla. Sin él la matriz es anónima al navegarla. */
  readonly ariaLabel = input<string | null>(null);

  /** Marcado o desmarcado de UNA casilla.
   *
   * Se llama `cellToggle` y no `toggle` porque `toggle` es un evento NATIVO del
   * DOM (el de `<details>`): una salida con ese nombre se confunde con él y lo
   * deniega `@angular-eslint/no-output-native`. */
  readonly cellToggle = output<ScMatrixToggle>();
  readonly columnToggle = output<ScMatrixColumnToggle>();

  /** Estado tri-estado de la cabecera de una columna: ninguna, algunas, todas. */
  protected columnState(columnId: string): TriState {
    const rows = this.rows();
    if (rows.length === 0) return 'none';
    const isChecked = this.checked();
    let marked = 0;
    for (const row of rows) if (isChecked(row.id, columnId)) marked++;
    return marked === 0 ? 'none' : marked === rows.length ? 'all' : 'some';
  }

  protected cellState(rowId: string, columnId: string): TriState {
    return this.checked()(rowId, columnId) ? 'all' : 'none';
  }

  protected onCell(rowId: string, columnId: string, checked: boolean): void {
    this.cellToggle.emit({ rowId, columnId, checked });
  }

  protected onColumn(columnId: string, checked: boolean): void {
    this.columnToggle.emit({ columnId, checked });
  }
}
