import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { MenuItem, MenuItemCommandEvent } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';

/**
 * Clase del DS para los tramos que llevan a algún sitio. La pinta el tema
 * (`sc-preset/css.ts`, «TRAMO PULSABLE DE LA MIGA»): manita y subrayado al pasar
 * el ratón.
 *
 * Por qué hace falta (medido el 2026-09-14 en sc-docs): el navegador solo pone la
 * manita en un `<a>` CON dirección, y el CSS de la miga de PrimeNG no la pide en
 * ningún sitio (su menú sí). Un tramo con `routerLink` o `url` la tenía; uno con
 * solo `command` salía con cursor de texto. Y al pasar el ratón el padre se
 * oscurecía justo al color del tramo actual, que es lo único que NO se pulsa.
 *
 * Para navegar, lo correcto sigue siendo `routerLink`: da la manita, Cmd+clic y
 * «copiar enlace» nativos. La clase es la red para el tramo que solo ejecuta una
 * acción.
 */
const LINK_CLASS = 'sc-breadcrumb-item--link';

const esPulsable = (item: MenuItem): boolean =>
  !item.disabled && (item.routerLink != null || item.url != null || item.command != null);

const comoEnlace = (item: MenuItem): MenuItem =>
  esPulsable(item)
    ? { ...item, styleClass: item.styleClass ? `${item.styleClass} ${LINK_CLASS}` : LINK_CLASS }
    : item;

/**
 * Migas de pan: dónde estás dentro de la jerarquía de la app. Wrapper fino
 * sobre `<p-breadcrumb>` — heredamos su modelo (`MenuItem[]` + `home`) sin
 * reinventar HTML, y el aspecto sale 100% de tokens vía `sc-preset` (`breadcrumb.*`):
 * item en `text.muted` que sube a `text.color` en hover, separador en color de
 * icono, radio 6, gap 7, padding 14, anillo de foco sky. Light + dark
 * salen solos por los tokens semánticos.
 *
 * Uso:
 *   <sc-breadcrumb [home]="{ icon: 'sc-icon-font sc-icon-font--home', routerLink: '/' }"
 *                  [model]="[{ label: 'Electronics', routerLink: '/e' }, { label: 'Wireless' }]" />
 *
 * El ÚLTIMO item es la página actual (sin `routerLink`/`command` → no clicable).
 * `aria-current="page"` en ese último tramo lo pone este wrapper (`pt` más abajo): la guía de
 * accesibilidad de primeng.dev lo pide y PrimeNG Angular no lo hace (medido el 2026-09-14, `null`). El `home` es opcional; su `icon` es una clase
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
  /**
   * Sin relleno propio. La miga de Aura (y la del Kit) trae relleno a los cuatro
   * lados porque se dibuja como una barra suelta. Metida dentro de una barra que ya
   * pone su aire, como la TopBar del Supervisor, el relleno se suma dos veces:
   * medido el 2026-09-14, 48 de los 91 px de esa barra eran la miga (14 + 20 + 14).
   * Aura resuelve lo mismo así: la `Toolbar` lleva el relleno y lo de dentro, ninguno.
   *
   * Va en línea sobre la raíz (`style` de `<p-breadcrumb>`), como `labelStyle` más
   * abajo: sin `::ng-deep` ni selectores `.p-*`.
   */
  readonly flush = input(false, { transform: booleanAttribute });
  protected readonly rootStyle = computed(() => (this.flush() ? { padding: 'var(--sc-spacing-0)' } : undefined));

  /** Click en un tramo (o en el inicio). Reemite el evento de PrimeNG. */
  readonly itemClick = output<MenuItemCommandEvent>();

  /**
   * El modelo que se pinta de verdad: `model()` pero con el ÚLTIMO tramo marcado
   * como la página ACTUAL, en color pleno Y peso medio — el "aquí estás" que
   * PrimeNG no hace (pinta todos los tramos iguales) y que la guía UX pide.
   * El COLOR solo (slate-700 actual vs slate-600 padres) es un único paso de la
   * rampa: demasiado sutil de un vistazo (medido 2026-08-31). El PESO no se
   * escapa, así que el actual lleva los dos: `--sc-text-primary` + peso medio;
   * los padres, gris muted en peso normal.
   *
   * Se hace con `labelStyle` (estilo en LÍNEA sobre la etiqueta): gana al color
   * del preset sin una regla CSS, sin `::ng-deep` y sin tocar internos `.p-*` —
   * cero acoplamiento nuevo. PrimeNG bindea `[style]="menuitem.labelStyle"` sobre
   * el `<span>` del label (verificado en `primeng-breadcrumb.mjs`), así que el
   * estilo entra de verdad; el gate `e2e/component-structure` lo congela.
   *
   * Al MAESTRO de Figma (2026-08-31, decisión de Rafa: "no puede fallar en algo
   * tan básico, y Figma le seguirá"): el tratamiento del tramo actual se lleva al
   * componente maestro para que deje de ser divergencia y quede 1:1.
   */
  protected readonly renderModel = computed<MenuItem[]>(() => {
    const items = this.model();
    if (items.length === 0) return items;
    const ultimo = items.length - 1;
    return items.map((item, i) => {
      if (i === ultimo) {
        return {
          ...item,
          labelStyle: {
            color: 'var(--sc-text-primary)',
            fontWeight: 'var(--sc-font-weight-medium)',
          },
        };
      }
      return comoEnlace(item);
    });
  });

  /**
   * El último tramo se anuncia como la página actual (`aria-current="page"`, APG Breadcrumb), por el
   * passthrough de PrimeNG: `itemLink` recibe el tramo en `context` y se compara por identidad.
   */
  protected readonly pt = computed(() => {
    const actual = this.renderModel().at(-1);
    return {
      // El inicio pide `itemLink` sin contexto: por eso el `?.`.
      itemLink: (options?: { context?: { item?: MenuItem } }) =>
        actual && options?.context?.item === actual ? { 'aria-current': 'page' } : {},
    };
  });

  /** El inicio lleva el mismo trato que un tramo padre: si lleva a algún sitio, se nota. */
  protected readonly renderHome = computed(() => {
    const home = this.home();
    return home ? comoEnlace(home) : home;
  });
}

