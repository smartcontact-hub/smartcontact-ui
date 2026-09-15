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

  constructor() {
    const stored = readStored();
    if (stored) {
      this.variant.set(stored);
      this.comparing.set(true);
    }
    /* El servicio nace con la primera ficha que se abre, cuando la navegación que la trae ya
     * está en marcha: su NavigationEnd no se oye, así que la URL de entrada se lee a mano. */
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
