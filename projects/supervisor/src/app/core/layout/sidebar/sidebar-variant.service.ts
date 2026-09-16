import { effect, Injectable, signal } from '@angular/core';

/**
 * RAMA DE COMPARACIÓN (`comparar/sidebar`), no se funde.
 *
 * Dos propuestas del sidebar de SISMAC-4340 sobre la app real, para tocarlas y elegir:
 *   · `figma` — el tablero de la card: seleccionado blanco al 15% y, plegado, un solo fondo del 5%
 *     del padre al último hijo.
 *   · `cyan`  — seleccionado en cyan al plegar o al pasar el ratón, y fondo de grupo con los hijos
 *     en un segundo bloque.
 * Y `fixed` deja el sidebar desplegado a 240 reservando su hueco (anclado), y `collapsedMode` elige
 * cómo se comporta plegado, los dos modos de Apollo: `drawer` (se despliega con el ratón) o `slim`
 * (raíl de primer nivel con panel flotante).
 *
 * Se cambia desde el botón de la esquina (`sc-sidebar-compare`) o con `?sidebar=figma|cyan`,
 * `?plegado=drawer|slim` y `?fijo=1|0` en cualquier URL, y se recuerda en el navegador.
 */
export type SidebarVariant = 'figma' | 'cyan';
export type SidebarCollapsedMode = 'drawer' | 'slim';

const VARIANT_KEY = 'sc-comparar-sidebar';
const FIXED_KEY = 'sc-comparar-sidebar-fijo';
const MODE_KEY = 'sc-comparar-sidebar-plegado';

function initial(param: string, key: string, allowed: readonly string[], fallback: string): string {
  const fromUrl = new URLSearchParams(location.search).get(param);
  if (fromUrl !== null && allowed.includes(fromUrl)) return fromUrl;
  try {
    const stored = localStorage.getItem(key);
    return stored !== null && allowed.includes(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Sin almacenamiento (ventana privada): la elección dura lo que la pestaña. */
  }
}

@Injectable({ providedIn: 'root' })
export class SidebarVariantService {
  readonly variant = signal<SidebarVariant>(initial('sidebar', VARIANT_KEY, ['figma', 'cyan'], 'figma') as SidebarVariant);
  readonly fixed = signal(initial('fijo', FIXED_KEY, ['1', '0'], '0') === '1');
  /** Escaparate (`/solo-sidebar`): solo el sidebar sobre fondo negro, y navegar no sale de la página. */
  readonly showcase = signal(false);
  readonly showcasePath = signal('/informes');
  readonly collapsedMode = signal<SidebarCollapsedMode>(
    initial('plegado', MODE_KEY, ['drawer', 'slim'], 'drawer') as SidebarCollapsedMode,
  );

  constructor() {
    effect(() => store(VARIANT_KEY, this.variant()));
    effect(() => store(MODE_KEY, this.collapsedMode()));
    effect(() => {
      const fixed = this.fixed();
      store(FIXED_KEY, fixed ? '1' : '0');
      /* Fijo, el hueco de la página es el ancho desplegado: el sidebar deja de tapar el contenido. */
      const root = document.documentElement.style;
      if (fixed) root.setProperty('--sc-sidebar-width', 'var(--sc-sidebar-width-expanded)');
      else root.removeProperty('--sc-sidebar-width');
    });
  }
}
