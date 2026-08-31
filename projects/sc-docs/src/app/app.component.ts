import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

import {
  ScCommandPaletteComponent,
  ScCommandPaletteService,
  ScPaletteCommand,
} from '@smartcontact-hub/components';

import { COMPONENT_CATALOG, groupCatalog, type ComponentCategory } from './pages/components/component-catalog';
import { ThemeToggleComponent } from './shared/theme-toggle.component';

/**
 * Shell de sc-docs: UNA sidebar (secciones + lista de componentes cuando estás en
 * Componentes) + outlet, con el lenguaje visual de "Constellation" (Digital Virgo)
 * traducido a tokens --sc-* propios. Antes la nav de secciones vivía en una barra
 * superior y la lista de componentes en una sidebar aparte (`storybook-shell`); se
 * fundieron en una sola para no tener dos navegaciones a la vez.
 *
 * El buscador ⌘K reusa `sc-command-palette` del propio DS (dogfooding): se monta una
 * vez aquí, escucha el atajo global, y le publicamos como comandos las secciones + los
 * ~49 componentes. Esto SÍ mete `sc-icon` en el bundle eager (~127 kB, era deuda
 * conocida por un glifo decorativo), pero ahora lo paga una feature de verdad, no un
 * adorno; el ⌘K es material de la propia demo.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ScCommandPaletteComponent, ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);
  protected readonly palette = inject(ScCommandPaletteService);

  /** Todos los grupos de componentes (sin filtrar: el buscado es el ⌘K). */
  protected readonly groups = groupCatalog('');
  protected readonly total = COMPONENT_CATALOG.length;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** ¿La ruta activa está dentro de Componentes? Muestra la lista en la sidebar. */
  protected readonly onComponents = computed(() => this.url().startsWith('/components'));

  /**
   * Acordeón de la sidebar: UNA familia abierta a la vez (single-open). Antes se
   * desplegaban las 7 familias con sus 49 componentes de golpe y «Uso real / Reglas /
   * Lab» quedaban enterrados debajo, ilocalizables. Ahora la lista es corta: cabeceras
   * de familia + los ítems de la que está abierta. Sigue a la ruta activa (abrir un
   * componente abre SU familia y colapsa las demás) y el usuario puede plegar/desplegar
   * cualquiera. En la portada de Componentes (sin componente activo) todas colapsadas.
   */
  protected readonly openGroup = signal<ComponentCategory | null>(this.categoryForUrl(this.router.url));

  /** Familia del componente en esa URL, o null si no es la página de un componente. */
  private categoryForUrl(url: string): ComponentCategory | null {
    const m = /^\/components\/([^/?#]+)/.exec(url);
    if (!m) return null;
    return COMPONENT_CATALOG.find((c) => c.path === m[1])?.category ?? null;
  }

  protected toggleGroup(cat: ComponentCategory): void {
    this.openGroup.update((cur) => (cur === cat ? null : cat));
  }

  constructor() {
    const sections: ScPaletteCommand[] = [
      { id: 's-fund', label: 'Fundamentos', category: 'Secciones', icon: 'category', action: () => this.go('/fundamentos') },
      { id: 's-comp', label: 'Componentes', category: 'Secciones', icon: 'widgets', action: () => this.go('/components') },
      { id: 's-uso', label: 'Uso real', category: 'Secciones', icon: 'dashboard', action: () => this.go('/uso') },
      { id: 's-reglas', label: 'Reglas', category: 'Secciones', icon: 'rule', action: () => this.go('/reglas') },
    ];
    const comps: ScPaletteCommand[] = COMPONENT_CATALOG.map((c) => ({
      id: `c-${c.path}`,
      label: c.label,
      category: c.category,
      icon: 'widgets',
      keywords: [c.path],
      action: () => this.go(`/components/${c.path}`),
    }));
    this.palette.setCommands([...sections, ...comps]);

    // Cierra el ⌘K en CUALQUIER navegación, no solo al navegar desde el propio palette
    // (que ya llama a `close()` en `go()`). Sin esto, abrir el ⌘K y luego cambiar de página
    // por la URL / un enlace dejaba el overlay abierto sobre la pantalla nueva. Sin
    // `takeUntilDestroyed`: `app.component` es la raíz, no se destruye nunca.
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.palette.close();
        // El acordeón sigue a la ruta: abre la familia del componente al que llegas
        // (por ⌘K, enlace o URL) y colapsa el resto; en la portada, todas colapsadas.
        this.openGroup.set(this.categoryForUrl(this.router.url));
      }
    });
  }

  /** Tema global de la doc: refleja el estado para que el toggle pinte sol/luna. */
  protected readonly isDark = signal(false);

  protected toggleDark(): void {
    const apply = (): void => {
      this.isDark.set(document.documentElement.classList.toggle('sc-dark'));
    };
    // Crossfade premium de TODA la página con la View Transitions API (ver styles.scss).
    // Fallback instantáneo si el navegador no la soporta o el usuario pide menos movimiento.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof doc.startViewTransition === 'function' && !reduce) {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  }

  private go(url: string): void {
    void this.router.navigateByUrl(url);
    this.palette.close();
  }
}
