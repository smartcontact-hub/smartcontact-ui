import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { MenuItem, MenuItemCommandEvent } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';

/**
 * Migas de pan: dónde estás dentro de la jerarquía de la app. Wrapper fino
 * sobre `<p-breadcrumb>` — heredamos su modelo (`MenuItem[]` + `home`) sin
 * reinventar HTML, y el aspecto sale 100% de tokens vía `sc-preset` (`breadcrumb.*`):
 * item en `text.muted` que sube a `text.color` en hover, separador en color de
 * icono, radio 6, gap 7, padding 14, anillo de foco electric-blue. Light + dark
 * salen solos por los tokens semánticos.
 *
 * Uso:
 *   <sc-breadcrumb [home]="{ icon: 'sc-icon-font sc-icon-font--home', routerLink: '/' }"
 *                  [model]="[{ label: 'Electronics', routerLink: '/e' }, { label: 'Wireless' }]" />
 *
 * El ÚLTIMO item es la página actual (sin `routerLink`/`command` → no clicable,
 * `aria-current` lo pone PrimeNG). El `home` es opcional; su `icon` es una clase
 * (Material vía `sc-icon-font sc-icon-font--<glifo>`, coherente con el resto del
 * DS — NO `pi pi-*`).
 *
 * Figma reference: `❖ Breadcrumb` — componente `breadcrumb` node `185:6637`
 * (canvas `6738:52933`) del Smart Contact Design System (file
 * `khNq9dJKNi13pNllrqm6dx`). Primer componente promovido por el puente Figma→código
 * de la sesión 20: el preset `breadcrumb.ts` ya tokenizaba `<p-breadcrumb>` pero
 * NO había wrapper ni consumidor — capacidad dormida que este componente activa.
 * La app (TopBar) tiene su propia miga a mano; converger a esta es tarea aparte.
 */
@Component({
  selector: 'sc-breadcrumb',
  standalone: true,
  imports: [BreadcrumbModule],
  templateUrl: './sc-breadcrumb.component.html',
  styleUrl: './sc-breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScBreadcrumbComponent {
  /** Los tramos de la ruta, en orden. El último es la página actual. */
  readonly model = input<MenuItem[]>([]);
  /** Item de inicio (icono casa). Opcional; se pinta antes del primer tramo. */
  readonly home = input<MenuItem | undefined>(undefined);
  /** Nombre accesible del icono de inicio (i18n del consumidor). */
  readonly homeAriaLabel = input<string | undefined>(undefined);

  /** Click en un tramo (o en el inicio). Reemite el evento de PrimeNG. */
  readonly itemClick = output<MenuItemCommandEvent>();
}
