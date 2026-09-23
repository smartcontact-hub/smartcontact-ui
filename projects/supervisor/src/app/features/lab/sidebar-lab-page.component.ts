import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  HostListener,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScAvatarComponent,
  ScButtonComponent,
  ScSelectButtonComponent,
  ScSelectComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { ScrollAreaModule } from 'primeng/scrollarea';
import { SidebarModule } from 'primeng/sidebar';
import type { SidebarCollapsible, SidebarSide, SidebarVariant } from 'primeng/types/sidebar';
import { TooltipModule } from 'primeng/tooltip';

import { NAV_ICONS } from '../../core/icons/nav-icons';
import { ThemeService, type ThemeMode } from '../../core/services/theme.service';
import { NAV_SECTIONS, type NavItem } from '../../core/layout/sidebar/nav-data';
import { normalizeRoutePath } from '../../core/layout/sidebar/path-utils';
import { LAB_SIDEBAR_KEY, LAB_SIDEBAR_RETURN_KEY } from '../../app.routes';
import { filter, map, startWith } from 'rxjs/operators';

/** Cómo se comporta plegado, los dos modos de Apollo (apollo.primeng.org, «Menu Type»). */
type CollapsedMode = 'drawer' | 'slim';

const COLLAPSED_MODE_KEY = 'sc-lab-sidebar-plegado';
const ANCHORED_KEY = 'sc-lab-sidebar-anclado';
/** Lo mínimo que el panel flotante deja libre hasta el borde de abajo de la ventana. */
const FLYOUT_EDGE = 16;

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Sin almacenamiento, la opción dura lo que la pestaña. */
  }
}

/**
 * Laboratorio local: el Sidebar de primeng.dev (PrimeNG 22) tal cual sale en su ejemplo «Variants»,
 * con el menú real del Supervisor dentro y el tema del DS. Sirve para ver sus variantes y cómo
 * se señala dónde estás cuando la página es un subitem. No es una pantalla del producto.
 *
 * Del ejemplo se copian las piezas y las entradas. Lo añadido para señalar en qué submenú estás:
 *   - el item actual lleva `isActive` (el fondo nativo);
 *   - sus padres, texto en negrita y color principal, sin fondo: se lee la rama;
 *   - si el item no se ve (plegado, o su padre cerrado), el padre visible más cercano toma `isActive`;
 *   - plegado, cada icono enseña su nombre en un `pTooltip`.
 *
 * Las subsecciones se comportan como en Apollo (apollo.primeng.org, leído en su código):
 *   - una sola rama abierta: abrir un padre cierra cualquier otra rama; cerrarlo deja abiertos
 *     sus padres; entrar en una página abre la suya;
 *   - plegado «Drawer»: se despliega al entrar el ratón y se pliega 300ms después de salir
 *     (`openOnHover` y `hoverCloseDelay`, nativos); el botón de anclar lo deja desplegado;
 *   - plegado «Slim»: solo los iconos de primer nivel; pulsar un padre abre un panel flotante con
 *     sus hijos (en acordeón, con la curva de Apollo), pasar el ratón por otro padre lo cambia, y
 *     clic fuera, Escape, una hoja o navegar lo cierran.
 * La animación del submenú nativo no se toca: PrimeNG la fija en su hoja (200ms) y no tiene token.
 * Los controles del ejemplo van en un `p-popover` que abre un botón flotante, para no ocupar la página.
 * Ancho desplegado: el token del sidebar (240). Medido con todo abierto, sin cortar ninguna etiqueta hace
 * falta 209 en español, 176 en inglés, 215 en portugués y 224 en francés («Rapports de données»).
 *
 * Hace de marco de la app en lugar del shell (`LAB_SIDEBAR_KEY` en `app.routes.ts`): dentro de
 * `p-sidebar-main` se cargan las pantallas reales en sus rutas de siempre, y
 * el modo «Responsive» copia el ejemplo del mismo nombre: por debajo de 1024px offcanvas con overlay
 * y fondo; por encima, modo icono empujando el contenido.
 */
@Component({
  selector: 'sc-sidebar-lab-page',
  imports: [
    ButtonModule,
    NgTemplateOutlet,
    PopoverModule,
    RouterOutlet,
    ScrollAreaModule,
    ScAvatarComponent,
    ScButtonComponent,
    ScIconComponent,
    ScSelectButtonComponent,
    ScSelectComponent,
    ScToggleSwitchComponent,
    SidebarModule,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './sidebar-lab-page.component.html',
  styleUrl: './sidebar-lab-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarLabPageComponent {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  /** Las tres opciones de Ajustes › Sistema, con sus textos. */
  protected readonly themeOptions = [
    { value: 'light' as ThemeMode, labelKey: 'config.sistema.appearance.theme_light', icon: 'light_mode' },
    { value: 'dark' as ThemeMode, labelKey: 'config.sistema.appearance.theme_dark', icon: 'dark_mode' },
    { value: 'system' as ThemeMode, labelKey: 'config.sistema.appearance.theme_system', icon: 'desktop_windows' },
  ];

  protected readonly sections = NAV_SECTIONS;
  private readonly allItems = NAV_SECTIONS.flatMap((section) => section.items);
  private readonly allPaths = this.pathsOf(this.allItems);

  protected variant: SidebarVariant = 'sidebar';
  protected collapsible: SidebarCollapsible = 'icon';
  protected side: SidebarSide = 'left';
  protected overlay = false;
  protected backdrop = false;
  /** Como el ejemplo «Responsive»: el ancho decide el plegado, el overlay y el fondo. */
  protected responsive = true;

  /** `(max-width: 1023px)`, igual que el ejemplo. */
  protected readonly isMobile = signal(false);

  protected effectiveCollapsible(): SidebarCollapsible {
    return this.responsive ? (this.isMobile() ? 'offcanvas' : 'icon') : this.collapsible;
  }

  protected effectiveOverlay(): boolean {
    return this.responsive ? this.isMobile() : this.overlay;
  }

  protected showBackdrop(): boolean {
    return this.responsive ? this.isMobile() : this.backdrop;
  }

  /** Plegado como Drawer o como Slim (Apollo). Se recuerda en el navegador. */
  protected readonly collapsedMode = signal<CollapsedMode>(readStored(COLLAPSED_MODE_KEY) === 'slim' ? 'slim' : 'drawer');
  /** Drawer anclado: desplegado aunque el ratón salga. */
  protected readonly anchored = signal(readStored(ANCHORED_KEY) === '1');

  protected readonly collapsedOptions: readonly { value: CollapsedMode; labelKey: string }[] = [
    { value: 'drawer', labelKey: 'lab.sidebar.mode_drawer' },
    { value: 'slim', labelKey: 'lab.sidebar.mode_slim' },
  ];

  /** Solo en modo icono tiene sentido plegar como Apollo; por debajo de 1024 manda el offcanvas. */
  protected iconMode(): boolean {
    return this.effectiveCollapsible() === 'icon';
  }

  /** Drawer sin anclar: el ratón despliega y pliega. */
  protected effectiveOpenOnHover(): boolean {
    return this.iconMode() && this.collapsedMode() === 'drawer' && !this.anchored();
  }

  /** Slim y plegado: los padres de primer nivel abren el panel flotante. */
  protected slimCollapsed(): boolean {
    return this.iconMode() && this.collapsedMode() === 'slim' && !this.open();
  }

  protected readonly variantOptions = [
    { label: 'Sidebar', value: 'sidebar' },
    { label: 'Floating', value: 'floating' },
    { label: 'Inset', value: 'inset' },
  ];
  protected readonly collapsibleOptions = [
    { label: 'Icon', value: 'icon' },
    { label: 'Offcanvas', value: 'offcanvas' },
    { label: 'None', value: 'none' },
  ];
  protected readonly sideOptions = [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ];

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /**
   * El item del menú de la página abierta: el de ruta más larga que sea prefijo de la URL.
   * Contact Center apunta a `/config/aed` y abre `/config/aed/servicio`.
   */
  protected readonly activePath = computed(() => {
    const url = normalizeRoutePath(this.url().split(/[?#]/)[0] || '/');
    return (
      this.allPaths
        .filter((path) => url === path || url.startsWith(path + '/'))
        .sort((a, b) => b.length - a.length)[0] ?? url
    );
  });

  /** Si el sidebar está desplegado (`open` de `p-sidebar`). */
  protected readonly open = signal(true);

  /**
   * La única rama abierta, del padre de primer nivel al más interior (`open` de cada
   * `p-sidebar-menu-item`). Como el `activePath` de Apollo: abrir un padre la sustituye entera.
   */
  protected readonly openPath = signal<readonly string[]>([]);

  /** Panel flotante del modo Slim: el padre de primer nivel que lo abre y su rama abierta dentro. */
  protected readonly flyoutKey = signal<string | null>(null);
  protected readonly flyoutPath = signal<readonly string[]>([]);
  protected readonly flyoutTop = signal(0);
  /** Borde del sidebar donde se pega: `left` con el sidebar a la izquierda, `right` a la derecha. */
  protected readonly flyoutLeft = signal<number | null>(null);
  protected readonly flyoutRight = signal<number | null>(null);
  private readonly flyout = viewChild<ElementRef<HTMLElement>>('flyout');

  protected readonly flyoutItem = computed(() => {
    const key = this.flyoutKey();
    return key ? (this.allItems.find((item) => item.labelKey === key) ?? null) : null;
  });

  constructor() {
    /* Entrar en una página abre su rama (y solo la suya), y cierra el panel flotante. */
    effect(() => {
      const branch = this.branchTo(this.activePath());
      untracked(() => {
        this.openPath.set(branch);
        this.closeFlyout();
      });
    });

    /* El panel flotante solo vive con el sidebar plegado en modo Slim. */
    effect(() => {
      if (!this.slimCollapsed()) untracked(() => this.closeFlyout());
    });

    /* Plegar con el trigger suelta el ancla; anclar despliega. */
    effect(() => {
      if (!this.open() && untracked(() => this.anchored())) untracked(() => this.anchored.set(false));
    });
    effect(() => writeStored(COLLAPSED_MODE_KEY, this.collapsedMode()));
    effect(() => writeStored(ANCHORED_KEY, this.anchored() ? '1' : '0'));

    const mql = window.matchMedia('(max-width: 1023px)');
    const apply = (mobile: boolean): void => {
      this.isMobile.set(mobile);
      /* Como Apollo, arranca plegado: el Drawer se abre con el ratón y el Slim con sus paneles. Anclado, desplegado. */
      if (this.responsive) this.open.set(!mobile && this.anchored());
    };
    apply(mql.matches);
    const listener = (event: MediaQueryListEvent): void => apply(event.matches);
    mql.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => mql.removeEventListener('change', listener));
  }

  /** Ancestros del activo, del más exterior al más cercano. */
  private readonly branch = computed(() => this.branchTo(this.activePath()));

  /**
   * El único padre marcado: plegado solo se ven los de primer nivel, así que es el más exterior;
   * desplegado, el primero cerrado de la rama. Si toda la rama está abierta, el activo ya se ve
   * y no se marca ningún padre.
   */
  protected readonly accentKey = computed(() => {
    const branch = this.branch();
    if (!this.open()) return branch[0] ?? null;
    return branch.find((key) => !this.openPath().includes(key)) ?? null;
  });

  /** Etiquetas de los padres del activo más la suya, para la ruta de la cabecera. */
  protected readonly trail = computed(() => this.trailTo(this.allItems, this.activePath()) ?? []);

  protected icon(item: NavItem): string {
    return NAV_ICONS[item.icon];
  }

  /** Si el item es padre de la página abierta (a cualquier profundidad). */
  protected inPath(item: NavItem): boolean {
    return this.branch().includes(item.labelKey);
  }

  protected isOpen(item: NavItem): boolean {
    return this.openPath().includes(item.labelKey);
  }

  /** Abrir deja abierta solo la rama hasta este padre; cerrar, la rama hasta su padre. */
  protected setOpen(item: NavItem, open: boolean): void {
    this.openPath.set(this.toggledPath(item, open));
  }

  /**
   * Plegado, el clic en un padre. En Slim abre o cierra su panel flotante. En Drawer el ratón ya lo
   * ha desplegado; si no (en táctil no hay ratón), se despliega con ese padre abierto.
   */
  protected onParentClick(item: NavItem, event: MouseEvent, depth: number): void {
    if (this.open() || !this.iconMode()) return;
    if (this.collapsedMode() === 'slim') {
      if (depth !== 0) return;
      if (this.flyoutKey() === item.labelKey) this.closeFlyout();
      else this.openFlyout(item, event.currentTarget as HTMLElement);
      return;
    }
    this.open.set(true);
    /* El mismo clic ya alterna el submenú en PrimeNG; se fija abierto después. */
    setTimeout(() => this.setOpen(item, true));
  }

  /** Slim con un panel abierto: pasar el ratón por otro padre de primer nivel lo cambia (Apollo). */
  protected onParentEnter(item: NavItem, event: MouseEvent, depth: number): void {
    if (depth !== 0 || !this.slimCollapsed() || this.flyoutKey() === null || this.flyoutKey() === item.labelKey) return;
    this.openFlyout(item, event.currentTarget as HTMLElement);
  }

  protected isFlyOpen(item: NavItem): boolean {
    return this.flyoutPath().includes(item.labelKey);
  }

  protected toggleFly(item: NavItem): void {
    this.flyoutPath.set(this.toggledPath(item, !this.isFlyOpen(item)));
  }

  protected selectFromFlyout(path: string | undefined): void {
    this.closeFlyout();
    this.select(path);
  }

  protected closeFlyout(): void {
    this.flyoutKey.set(null);
    this.flyoutPath.set([]);
  }

  protected toggleAnchor(): void {
    const anchored = !this.anchored();
    this.anchored.set(anchored);
    if (anchored) this.open.set(true);
  }

  protected selectCollapsedMode(value: unknown): void {
    if (value === 'drawer' || value === 'slim') this.collapsedMode.set(value);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeFlyout();
  }

  /** Clic fuera del panel y de los padres de primer nivel: se cierra. */
  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.flyoutKey() === null) return;
    const target = event.target as Element | null;
    if (target?.closest('.lab__flyout, [data-lab-root]')) return;
    this.closeFlyout();
  }

  protected select(path: string | undefined): void {
    if (path) void this.router.navigateByUrl(path);
  }

  protected selectTheme(mode: unknown): void {
    if (mode === 'light' || mode === 'dark' || mode === 'system') this.theme.set(mode);
  }

  /** Deja el laboratorio en la misma página, ya en el shell, y la apunta para volver a entrar ahí.
   *  El apagado va en la PESTAÑA (`sessionStorage`), donde vive el modo; el sitio al que volver
   *  sigue en `localStorage`, que es una comodidad y no enmarca nada por su cuenta. */
  protected leaveLab(): void {
    localStorage.setItem(LAB_SIDEBAR_RETURN_KEY, location.pathname + location.search);
    sessionStorage.setItem(LAB_SIDEBAR_KEY, '0');
    location.reload();
  }

  private openFlyout(item: NavItem, button: HTMLElement): void {
    const panel = button.closest('p-sidebar-panel') ?? button;
    const edge = panel.getBoundingClientRect();
    const top = button.getBoundingClientRect().top;
    this.flyoutKey.set(item.labelKey);
    this.flyoutPath.set([]);
    this.flyoutLeft.set(this.side === 'left' ? Math.round(edge.right) : null);
    this.flyoutRight.set(this.side === 'right' ? Math.round(window.innerWidth - edge.left) : null);
    this.flyoutTop.set(Math.round(top));
    /* Alineado arriba con el icono pulsado, sin salirse por abajo de la ventana. */
    requestAnimationFrame(() => {
      const el = this.flyout()?.nativeElement;
      if (!el) return;
      const height = el.getBoundingClientRect().height;
      this.flyoutTop.set(Math.round(Math.max(FLYOUT_EDGE, Math.min(top, window.innerHeight - height - FLYOUT_EDGE))));
    });
  }

  /** La rama abierta tras abrir o cerrar `item`: sus padres, y él si se abre. */
  private toggledPath(item: NavItem, open: boolean): readonly string[] {
    const ancestors = this.ancestorsOf(item.labelKey) ?? [];
    return open ? [...ancestors, item.labelKey] : ancestors;
  }

  private ancestorsOf(key: string, items: readonly NavItem[] = this.allItems): string[] | null {
    for (const item of items) {
      if (item.labelKey === key) return [];
      if (item.children) {
        const below = this.ancestorsOf(key, item.children);
        if (below) return [item.labelKey, ...below];
      }
    }
    return null;
  }

  private pathsOf(items: readonly NavItem[]): string[] {
    return items.flatMap((item) => [...(item.path ? [item.path] : []), ...this.pathsOf(item.children ?? [])]);
  }

  private branchTo(path: string, items: readonly NavItem[] = this.allItems): string[] {
    for (const item of items) {
      if (item.path === path) return [];
      if (item.children) {
        const below = this.branchTo(path, item.children);
        if (below.length > 0 || item.children.some((child) => child.path === path)) {
          return [item.labelKey, ...below];
        }
      }
    }
    return [];
  }

  private trailTo(items: readonly NavItem[], path: string): string[] | null {
    for (const item of items) {
      if (item.path === path) return [item.labelKey];
      if (item.children) {
        const below = this.trailTo(item.children, path);
        if (below) return [item.labelKey, ...below];
      }
    }
    return null;
  }
}
