import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ScButtonComponent, ScCustomModalComponent } from '@smartcontact-hub/components';

/**
 * La vista previa de una importación, ya en frases: qué entra, cada línea con error, las que ya existían y lo que no
 * cabe. La pantalla la escribe con sus claves; el diálogo solo la pinta. Lo que falta, no sale.
 */
export interface ImportSummary {
  /** Lo que entra («Se crearán 3 tipificaciones»), o que no hay nada nuevo. */
  readonly entran: string;
  /** Los nombres de lo que entra, en una frase. */
  readonly nombres?: string | null;
  /** Cuántas líneas tienen error, como título de su lista. */
  readonly errores?: string | null;
  /** Cada línea con error y su porqué, las primeras. */
  readonly lineas: readonly string[];
  /** Cuántos errores más hay, debajo de la lista. */
  readonly mas?: string | null;
  /** Las que ya existían o se repiten en el archivo. */
  readonly repetidas?: string | null;
  /** Las que no caben por el tope. */
  readonly sobran?: string | null;
  /** El botón que lo hace («Crear 3 tipificaciones»). Sin él, no hay nada que confirmar. */
  readonly confirmar?: string | null;
}

/**
 * IMPORTAR DE UN CSV (DD-166, revisión de producto del 2026-10-15). El mismo diálogo en Tipificaciones, Plantillas y
 * Agendas: «Descargar plantilla», «Elegir archivo» y, antes de crear nada, qué entra y qué no. La ayuda del formato,
 * solo donde hace falta (Tipificaciones: una línea por camino del árbol); en Agendas se quitó a propósito (revisión de
 * producto de Agendas, 2026-10-15). Lo que se lee y cómo se crea lo decide la pantalla: aquí solo se pinta y se avisa.
 *
 *   <sc-import-dialog [title]="…" [summary]="importResumen()" (templateRequest)="descargarPlantilla()"
 *     (fileSelected)="onImportFile($event)" (confirmed)="confirmarImportar()" (cancelled)="cerrarImportar()" />
 */
@Component({
  selector: 'sc-import-dialog',
  imports: [ScButtonComponent, ScCustomModalComponent, TranslateModule],
  templateUrl: './import-dialog.component.html',
  styleUrl: './import-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDialogComponent {
  readonly title = input.required<string>();
  /** La ayuda del formato: qué va en cada línea y el tope, también antes de elegir archivo. Sin ella, no hay párrafo. */
  readonly help = input<string | null>(null);
  /** La vista previa del archivo elegido; `null` hasta elegir uno. */
  readonly summary = input<ImportSummary | null>(null);

  readonly cancelled = output<void>();
  readonly templateRequest = output<void>();
  /** Se eligió un archivo: el `change` del input nativo, para que la pantalla lo lea y lo vacíe. */
  readonly fileSelected = output<Event>();
  readonly confirmed = output<void>();
}
