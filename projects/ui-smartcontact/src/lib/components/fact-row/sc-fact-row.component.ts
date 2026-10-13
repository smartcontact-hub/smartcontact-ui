import { ChangeDetectionStrategy, Component, input, output, ViewEncapsulation } from '@angular/core';

import { ScIconTileComponent } from '../icon-tile/sc-icon-tile.component';

/**
 * Una fila de datos: la clave, con su icono en una baldosa (`sc-icon-tile`), a la izquierda, y el valor a la derecha;
 * si no cabe en la línea, el valor baja y sigue a la derecha. Sale del widget de resumen de la ficha de grupo (DD-185,
 * DD-186) y sirve a cualquier ficha de datos.
 *
 * **Va sobre un `div`** (`<div scFactRow>`), no en una etiqueta propia: dentro hay un `dt` y un `dd`, y una lista de
 * definiciones solo admite `div` entre ella y sus pares. Así la lista sigue siendo válida y quien la pinta puede poner
 * el `div` en `display: contents` para alinear los valores de varias listas en una rejilla.
 *
 * **Cuándo sí y cuándo no**: pares clave y valor que se leen de un vistazo (un resumen). Para un campo que se edita,
 * `sc-field`; para una tabla de muchos, `sc-datatable`.
 *
 * Con `href`, la clave es un enlace de verdad (Cmd+clic abre en otra pestaña) y `open` avisa del clic, para que una app
 * navegue por su cuenta (`event.preventDefault()`). Se pulsa en al menos 24,5 × 24,5 aunque pinte menos.
 *
 * En un contenedor ancho (≥ 37,5 rem, `@container`), el valor empieza en su columna en vez de pegarse a la derecha.
 *
 * Uso:
 * ```html
 * <dl>
 *   <div scFactRow label="Teléfono" icon="call" href="/grupos/1?seccion=distribucion">918 371 548</div>
 *   <div scFactRow label="WhatsApp"><app-channel-icon scFactIcon channel="whatsapp" />Sin número</div>
 * </dl>
 * ```
 */
@Component({
  // Selector de atributo a propósito: el host es el `div` del `dl`, el único elemento que admite entre él y su par dt/dd.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'div[scFactRow]',
  standalone: true,
  imports: [ScIconTileComponent],
  template: `
    <dt class="sc-fact-row__key">
      @if (href(); as link) {
        <a class="sc-fact-row__link" [href]="link" (click)="open.emit($event)">
          <sc-icon-tile [icon]="icon()"><ng-content select="[scFactIcon]" /></sc-icon-tile>
          <span>{{ label() }}</span>
        </a>
      } @else {
        <span class="sc-fact-row__link">
          <sc-icon-tile [icon]="icon()"><ng-content select="[scFactIcon]" /></sc-icon-tile>
          <span>{{ label() }}</span>
        </span>
      }
    </dt>
    <dd class="sc-fact-row__value"><ng-content /></dd>
  `,
  styleUrl: './sc-fact-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'sc-fact-row' },
})
export class ScFactRowComponent {
  /** La clave, ya traducida. */
  readonly label = input.required<string>();
  /** El icono de la clave (Material Symbols). Sin él, va el que se proyecte con `scFactIcon`. */
  readonly icon = input<string | null>(null);
  /** Adónde lleva la clave. Sin `href`, la clave es texto. */
  readonly href = input<string | null>(null);

  /** El clic en la clave, con su evento: la app decide si navega por su cuenta. */
  readonly open = output<MouseEvent>();
}
