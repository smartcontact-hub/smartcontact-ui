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
 *   · `e` — toda la ficha en tarjetas-resumen; «Editar» abre los ajustes de esa tarjeta en un
 *           panel lateral (Rafa, 2026-09-15, tras ver Meridian).
 *
 * Se probaron y se quitaron el mismo día `c` (pestañas con un recuadro de cambios: ruido, y lío de
 * desarrollo) y `d` (resumen y editor en la misma pantalla: a 900px de alto el editor se quedaba
 * con 391px y no dejaba trabajar). Sus letras no se reutilizan, para que un enlace viejo no abra
 * otra cosa: caen a la ficha de hoy.
 *
 * La variante se elige con `?variante=a|b|e` en cualquier URL y se recuerda en el navegador,
 * así que se puede pasar un enlace y navegar por la app sin perderla. Sin ese parámetro (los
 * e2e, o quien abra la app sin enlace) no hay barra y la ficha es la de hoy.
 */
export type FichaVariant = 'a' | 'b' | 'e' | 'u';

/** En el orden de la barra: primero las que lo enseñan todo (una página, resumen), y luego la de
 * hoy (Rafa, 2026-09-15). Las letras solo viven en la URL. */
export const FICHA_VARIANTS: readonly FichaVariant[] = ['b', 'u', 'e', 'a'];
/** Cuántas van antes del separador de la barra (la familia «lo enseña todo»). */
export const SHOW_ALL_COUNT = 2;

const STORAGE_KEY = 'sc-comparar-fichas';
const GUIDE_SEEN_KEY = 'sc-comparar-guia-vista';
/** El dominio de preview dedicado de esta rama: un enlace a él, sin `?variante=`, tiene que enseñar la
 *  barra igual (Rafa lo compartía con compañeros y sin el parámetro exacto no les salía). */
const COMPARE_HOSTNAME = 'comparar-fichas.sc-supervisor.pages.dev';

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
  /** El panel lateral de ajustes de la variante `e`. Vive aquí y no en la ficha para que la barra
   * se quite mientras está abierto, y para que guía y panel no se abran nunca a la vez. */
  readonly editorOpen = signal(false);

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
    /* Sin variante en la URL ni guardada, y en el dominio de preview dedicado: arranca comparando
     * igualmente, con la variante de hoy (`a`), para que un enlace sin `?variante=` no se quede sin
     * barra. En cualquier otro dominio (el compartido con otras ramas, o local) sigue sin ella. */
    if (!this.comparing() && window.location.hostname === COMPARE_HOSTNAME) {
      this.variant.set('a');
      this.comparing.set(true);
    }
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
