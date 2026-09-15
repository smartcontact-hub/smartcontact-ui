import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScAvatarComponent,
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


/**
 * Laboratorio local: el Sidebar de primeng.dev (PrimeNG 22) tal cual sale en su ejemplo «Variants»,
 * con el menú real del Supervisor dentro y el tema del DS. Sirve para ver sus variantes y cómo
 * se señala dónde estás cuando la página es un subitem. No es una pantalla del producto.
 *
 * Del ejemplo se copian las piezas, las entradas y el comportamiento (al pulsar un padre, el nativo:
 * abre o cierra su submenú). Lo añadido para señalar en qué submenú estás:
 *   - el item actual lleva `isActive` (el fondo nativo);
 *   - sus padres, texto en negrita y color principal, sin fondo: se lee la rama;
 *   - si el item no se ve (plegado, o su padre cerrado), el padre visible más cercano toma `isActive`;
 *   - plegado, cada icono enseña su nombre en un `pTooltip`;
 *   - plegado, pulsar un padre despliega el sidebar con ese padre abierto: en modo icono PrimeNG
 *     oculta los submenús y, sin esto, sus pantallas no se pueden alcanzar.
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
  protected openOnHover = false;
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

  /** Padres abiertos (`open` de cada `p-sidebar-menu-item`). Empiezan abiertos los del activo. */
  protected readonly openKeys = signal<ReadonlySet<string>>(new Set());

  constructor() {
    /* Entrar en una página abre su rama; lo demás que estuviera abierto sigue abierto. */
    effect(() => {
      const branch = this.branchTo(this.activePath());
      untracked(() => this.openKeys.set(new Set([...this.openKeys(), ...branch])));
    });

    const mql = window.matchMedia('(max-width: 1023px)');
    const apply = (mobile: boolean): void => {
      this.isMobile.set(mobile);
      if (this.responsive) this.open.set(!mobile);
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
    return branch.find((key) => !this.openKeys().has(key)) ?? null;
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
    return this.openKeys().has(item.labelKey);
  }

  protected setOpen(item: NavItem, open: boolean): void {
    const next = new Set(this.openKeys());
    if (open) next.add(item.labelKey);
    else next.delete(item.labelKey);
    this.openKeys.set(next);
  }

  /** Plegado en modo icono: desplegar y dejar abierto el padre pulsado. */
  protected onParentClick(item: NavItem): void {
    if (this.open() || this.effectiveCollapsible() !== 'icon') return;
    this.open.set(true);
    /* El mismo clic ya alterna el submenú en PrimeNG; se fija abierto después. */
    setTimeout(() => this.setOpen(item, true));
  }

  protected select(path: string | undefined): void {
    if (path) void this.router.navigateByUrl(path);
  }

  protected selectTheme(mode: unknown): void {
    if (mode === 'light' || mode === 'dark' || mode === 'system') this.theme.set(mode);
  }

  /** Deja el laboratorio en la misma página, ya en el shell, y la apunta para volver a entrar ahí. */
  protected leaveLab(): void {
    localStorage.setItem(LAB_SIDEBAR_RETURN_KEY, location.pathname + location.search);
    localStorage.removeItem(LAB_SIDEBAR_KEY);
    location.reload();
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
