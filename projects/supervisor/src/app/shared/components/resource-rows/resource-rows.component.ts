import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/** Una fila del resumen de Recursos (DD-164). */
export interface ResourceRow {
  readonly id: number | string;
  readonly name: string;
  /** Lo que dice qué es: «1250 contactos · Activa», el principio del texto de una plantilla… */
  readonly detail: string;
  /** Adónde lleva «Editar» en el hub de Repositorios. En las fichas, «Editar» abre la ventana sin salir (`editar`); sin
   *  él, la fila no lo enseña. */
  readonly edit: { readonly link: string; readonly queryParams?: Readonly<Record<string, string | number>> } | null;
}

/**
 * LO ASIGNADO EN UN CAMPO DE RECURSOS, CON «EDITAR» (DD-164): una fila por recurso con su nombre, un dato que dice qué
 * es y «Editar». Va bajo el desplegable que elige, en las fichas de grupo y de agente, y sustituye a los chips, que solo
 * decían el nombre: una agenda de 3 contactos y otra de 1.250 se veían iguales. «Editar» abre la misma ventana que el
 * «+» del campo, sin salir de la ficha (DD-187): la ficha escucha `editar`. Solo pinta; las filas las prepara
 * `ResourceRowsService`.
 */
@Component({
  selector: 'sc-resource-rows',
  imports: [TranslateModule],
  templateUrl: './resource-rows.component.html',
  styleUrl: './resource-rows.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceRowsComponent {
  readonly rows = input.required<readonly ResourceRow[]>();
  /** El nombre de la lista, el de su campo («Agendas»): el lector anuncia de qué son las filas. */
  readonly label = input.required<string>();
  /** «Editar» de una fila: su id. */
  readonly editar = output<ResourceRow['id']>();
}
