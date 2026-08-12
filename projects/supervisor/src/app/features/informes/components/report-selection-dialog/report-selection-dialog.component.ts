import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { MENU_INFORMES } from '../../data/reports.data';

/**
 * Diálogo "Informes de Estadísticas" — el que abre el botón `+` de la landing.
 *
 * Es la pieza que rompe la intuición: no es un modal centrado con overlay
 * oscuro, sino un panel **azul marino anclado abajo a la derecha** (642.6×429.5
 * medido) con cuatro menús PrimeNG dentro: tres en fila (Servicios · Grupos ·
 * Agentes) y CDR debajo. Es el único sitio oscuro de toda la aplicación.
 *
 * Elegir una entrada navega al constructor del informe.
 */
@Component({
  selector: 'sc-report-selection-dialog',
  templateUrl: './report-selection-dialog.component.html',
  styleUrl: './report-selection-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportSelectionDialogComponent {
  readonly cerrar = output<void>();
  readonly elegir = output<string>();

  protected readonly grupos = MENU_INFORMES;

  /** Las tres primeras columnas van en fila; CDR cae a la segunda. */
  protected readonly filaSuperior = MENU_INFORMES.slice(0, 3);
  protected readonly filaInferior = MENU_INFORMES.slice(3);
}
