import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Glifos del sidebar: los SVG REALES de cuscare, descargados de su `assets/`. */
const SRC: Record<string, string> = {
  // Ojo al mapeo: los nombres de fichero NO casan con las etiquetas. Se resolvió
  // cruzando la Y del icono con la de su etiqueta en el sitio real, no por nombre.
  dashboard: 'icons/menu/dashboard.svg', //            → "Dashboard"
  tickets: 'icons/menu/tickets.svg', //                → "Tickets"
  search: 'icons/general/search.svg', //               → "Search"
  mo: 'icons/menu/customer.svg', //                    → "Manage MO in error" (sí, customer)
  gear: 'icons/menu/rueda.svg', //                     → engranaje de ajustes
};

/**
 * Los SVG traen `fill="#8d939d"` a fuego y el sitio real **no los recolorea**:
 * medido, el icono del item ACTIVO sigue gris y solo cambia el color del TEXTO.
 * Por eso se sirven como `<img>` en vez de inline con `currentColor` — que es lo
 * que haría un icono "bien hecho", pero no es lo que hace el original.
 */
@Component({
  selector: 'app-nav-icon',
  standalone: true,
  template: `<img [src]="src()" [width]="size().w" [height]="size().h" alt="" aria-hidden="true" />`,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
    img {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavIconComponent {
  readonly name = input.required<'dashboard' | 'tickets' | 'search' | 'mo' | 'gear'>();

  protected readonly src = computed(() => SRC[this.name()]);

  /** Dimensiones NATIVAS de cada SVG (leídas de su propio atributo, no supuestas:
   *  el engranaje mide 22 de alto, no 24 como los del nav). */
  protected readonly size = computed(
    () =>
      ({
        dashboard: { w: 20.157, h: 24 },
        tickets: { w: 19.16, h: 24 },
        search: { w: 24, h: 24 },
        mo: { w: 15.469, h: 24 },
        gear: { w: 21.471, h: 22 },
      })[this.name()] ?? { w: 20, h: 24 },
  );
}
