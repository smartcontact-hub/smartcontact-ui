import { Injectable, signal } from '@angular/core';

/** Una decisión que nombra al componente, con su línea en `DECISIONS.md` para enlazarla. */
export interface DecisionFicha {
  readonly id: string;
  readonly fecha: string;
  readonly titulo: string;
  readonly linea: number;
}

/** Una sección de la accesibilidad que documenta PrimeNG: su título, sus párrafos y su tabla de teclas. */
export interface SeccionA11y {
  readonly titulo: string;
  readonly parrafos: readonly string[];
  readonly teclas: readonly { readonly tecla: string; readonly funcion: string }[];
}

interface A11yPrimeng {
  readonly fuente: string;
  readonly licencia: string;
  readonly modulos: Readonly<Record<string, readonly SeccionA11y[]>>;
}

/**
 * Lo que leen las pestañas «Pautas» y «Accesibilidad» de cada ficha, en dos ficheros servidos desde `public/components/`:
 * `_decisiones.json` (las DD que nombran a cada componente; lo escribe `docs:ia` en cada build) y `_a11y-primeng.json`
 * (lo que PrimeNG documenta de lector de pantalla y teclado; lo escribe `scripts/primeng-a11y.mjs`). Una petición por
 * fichero para toda la sesión, y solo cuando alguien abre la pestaña que lo usa.
 */
@Injectable({ providedIn: 'root' })
export class FichaDatosService {
  private readonly decisiones = signal<Readonly<Record<string, readonly DecisionFicha[]>> | null>(null);
  private readonly a11y = signal<A11yPrimeng | null>(null);
  /** `true` si alguno no se pudo cargar: la pestaña lo dice en vez de fingir que no hay nada. */
  readonly error = signal(false);
  private pedidoDecisiones = false;
  private pedidoA11y = false;

  /** Las decisiones de un componente, de la más nueva a la más vieja; `null` mientras cargan. */
  decisionesDe(selector: string): readonly DecisionFicha[] | null {
    if (!this.pedidoDecisiones) {
      this.pedidoDecisiones = true;
      this.pedir<{ porSelector: Record<string, DecisionFicha[]> }>('/components/_decisiones.json', (d) =>
        this.decisiones.set(d.porSelector),
      );
    }
    const todas = this.decisiones();
    return todas ? (todas[selector] ?? []) : null;
  }

  /** Lo que PrimeNG documenta del módulo que envuelve; `[]` si no documenta nada y `null` mientras carga. */
  a11yDe(modulo: string | null): readonly SeccionA11y[] | null {
    if (!this.pedidoA11y) {
      this.pedidoA11y = true;
      this.pedir<A11yPrimeng>('/components/_a11y-primeng.json', (d) => this.a11y.set(d));
    }
    const d = this.a11y();
    return d ? ((modulo && d.modulos[modulo]) || []) : null;
  }

  /** De dónde sale el texto de PrimeNG, para atribuirlo. */
  fuenteA11y(): string | null {
    return this.a11y()?.fuente ?? null;
  }

  private pedir<T>(url: string, ok: (d: T) => void): void {
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: T) => ok(d))
      .catch(() => this.error.set(true));
  }
}
