import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * RAMA DE COMPARACIÓN (`comparar/fichas`), no se funde.
 *
 * Tres formas de la ficha de agente, grupo y usuario, para que producto las toque y elija:
 *   · `a` — pestañas: el índice filtra y ves una sección (lo que hay en `main`, DD#59).
 *   · `b` — una sola página: todas las secciones a la vista y el índice te lleva con scroll
 *           (lo que había hasta el 2026-05-13).
 *   · `c` — pestañas, y el lateral cuenta lo que has cambiado y a qué más afecta.
 *
 * La variante se elige con `?variante=a|b|c` en cualquier URL y se recuerda en el navegador,
 * así que se puede pasar un enlace y navegar por la app sin perderla. Sin ese parámetro (los
 * e2e, o quien abra la app sin enlace) no hay barra y la ficha es la de hoy.
 */
export type FichaVariant = 'a' | 'b' | 'c';

export const FICHA_VARIANTS: readonly FichaVariant[] = ['a', 'b', 'c'];

const STORAGE_KEY = 'sc-comparar-fichas';
const GUIDE_SEEN_KEY = 'sc-comparar-guia-vista';

function isVariant(value: unknown): value is FichaVariant {
  return typeof value === 'string' && (FICHA_VARIANTS as readonly string[]).includes(value);
}

function readStored(): FichaVariant | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isVariant(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStored(value: FichaVariant): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* Sin almacenamiento (ventana privada): la variante vive lo que dure la pestaña. */
  }
}

@Injectable({ providedIn: 'root' })
export class FichaVariantService {
  private readonly router = inject(Router);

  readonly variant = signal<FichaVariant>('a');
  /** ¿Se está comparando? Solo entonces sale la barra. */
  readonly comparing = signal(false);
  /** La guía lateral («Cómo comparar»). */
  readonly guideOpen = signal(false);

  /** La primera vez que alguien compara en este navegador, la guía se abre sola: quien llega
   * con el enlace no sabe qué tiene delante ni qué probar. Después, solo si la pide. */
  openGuideFirstTime(): void {
    try {
      if (localStorage.getItem(GUIDE_SEEN_KEY)) return;
      localStorage.setItem(GUIDE_SEEN_KEY, '1');
    } catch {
      /* Sin almacenamiento se abre cada vez: mejor de más que perderse. */
    }
    this.guideOpen.set(true);
  }

  constructor() {
    const stored = readStored();
    if (stored) {
      this.variant.set(stored);
      this.comparing.set(true);
    }
    /* Nace al arrancar la app (`provideAppInitializer` en app.config), antes de la primera
     * navegación: la URL de entrada se lee a mano por si su NavigationEnd ya pasó. */
    this.readValue(new URLSearchParams(window.location.search).get('variante'));
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.readValue(this.router.parseUrl(e.urlAfterRedirects).queryParamMap.get('variante')));
  }

  set(value: FichaVariant): void {
    this.variant.set(value);
    this.comparing.set(true);
    writeStored(value);
    void this.router.navigate([], {
      queryParams: { variante: value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private readValue(value: string | null): void {
    if (!isVariant(value)) return;
    this.variant.set(value);
    this.comparing.set(true);
    writeStored(value);
  }
}
