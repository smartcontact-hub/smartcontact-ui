import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScIconComponent } from '@smartcontact-hub/icons';

/** Un recurso asignado, ya resuelto para pintarlo: lo prepara `ResourceRowsService`. */
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
 * UNA OPCIÓN DE UN DESPLEGABLE DE RECURSOS, CON SU «EDITAR» (revisión del 2026-10-14, que retira las filas de DD-164
 * bajo el campo): el nombre, y un lápiz que solo sale al pasar por la opción, con su tooltip. Va en la plantilla
 * `#item` de `sc-multiselect` (Agendas, Plantillas, Equipos) en las fichas de grupo y de agente; el lápiz abre la
 * misma ventana que el «+» del campo, sin salir de la ficha (DD-187): quien la usa escucha `editar` y cierra la lista.
 *
 * El lápiz no entra en el orden del tabulador: dentro de una opción de una lista, el teclado se mueve con las flechas y
 * un botón más no tendría cómo alcanzarse. Editar sigue a mano con teclado en Repositorios («Gestionar en Repositorios»,
 * bajo los campos). El clic se queda en el lápiz: no marca ni desmarca la opción.
 */
@Component({
  selector: 'sc-resource-option',
  imports: [ScIconComponent, TooltipModule, TranslateModule],
  template: `
    <span class="resource-option__name">{{ name() }}</span>
    <button
      type="button"
      class="resource-option__edit"
      tabindex="-1"
      aria-haspopup="dialog"
      [attr.aria-label]="'common.edit_named' | translate: { name: name() }"
      [pTooltip]="'common.edit_named' | translate: { name: name() }"
      tooltipPosition="top"
      tooltipEvent="both"
      (mousedown)="$event.stopPropagation()"
      (click)="$event.stopPropagation(); editar.emit()"
    >
      <sc-icon name="edit" [size]="16" aria-hidden="true" />
    </button>
  `,
  styleUrl: './resource-option.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceOptionComponent {
  /** El nombre del recurso, el texto de la opción. */
  readonly name = input.required<string>();
  /** Se pulsó el lápiz. */
  readonly editar = output<void>();
}
