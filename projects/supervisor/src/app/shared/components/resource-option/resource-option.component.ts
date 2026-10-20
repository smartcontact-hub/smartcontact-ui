import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

/** Un recurso asignado, ya resuelto para pintarlo: lo prepara `ResourceRowsService`. */
export interface ResourceRow {
  readonly id: number | string;
  readonly name: string;
  /** Lo que dice qué es: «1250 contactos · Activa», el principio del texto de una plantilla… */
  readonly detail: string;
  /** Adónde lleva «Editar» en el hub de Repositorios; sin él, la fila no lo enseña. */
  readonly edit: { readonly link: string; readonly queryParams?: Readonly<Record<string, string | number>> } | null;
}

/**
 * UNA OPCIÓN DE UN DESPLEGABLE DE RECURSOS (revisión de producto del 2026-10-20, DD-217 §15): el nombre entero y, al
 * pasar, lo que contiene, en el tooltip de PrimeNG pegado a la opción. Lo mismo en las tres listas, con lo que dice
 * qué es cada recurso: cuántos contactos tiene una agenda (nunca quiénes: puede tener mil), el texto de una plantilla,
 * la descripción de un equipo. Siempre hay tooltip («Sin contactos», «Sin descripción»), para que pasar por una opción
 * haga siempre lo mismo. El nombre no se corta: si no cabe, baja de línea, porque es lo que se elige; lo que se corta
 * con «…» es el chip del campo, que se lee entero al pasar. Va en la plantilla `#item` de `sc-multiselect` (Agendas,
 * Plantillas, Equipos) en las fichas de grupo y de agente; lo prepara `ResourceRowsService.opciones*`.
 *
 * Hasta DD-217 la opción llevaba un lápiz que abría el recurso en una ventana; se crean y se editan en Repositorios
 * («Gestionar en Repositorios», bajo los campos).
 */
@Component({
  selector: 'sc-resource-option',
  imports: [TooltipModule],
  template: `<span class="resource-option__name sc-text-body-regular" [pTooltip]="contenido()" tooltipPosition="right">{{ name() }}</span>`,
  styleUrl: './resource-option.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceOptionComponent {
  /** El nombre del recurso, el texto de la opción. */
  readonly name = input.required<string>();
  /** Lo que contiene, en el tooltip: «3 contactos», el texto de una plantilla, la descripción de un equipo. */
  readonly contenido = input.required<string>();
}
