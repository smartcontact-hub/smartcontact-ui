import { Injectable, computed, signal } from '@angular/core';

/** Un miembro público del contrato, tal como lo genera `audit:components`. */
export interface ContratoMiembro {
  readonly nombre: string;
  readonly clase: 'input' | 'model' | 'output';
  readonly tipo: string;
  readonly porDefecto: string | null;
  readonly requerido: boolean;
  readonly descripcion: string | null;
  readonly origen: 'nativo' | 'nuestro' | 'sin-verificar';
  readonly nativo: {
    readonly descripcion: string | null;
    readonly porDefecto: string | null;
    readonly obsoleta: string | null;
    readonly heredadaDe: string | null;
  } | null;
}

interface ComponenteContrato {
  readonly selector: string;
  readonly cuando: string | null;
  readonly contrato: readonly ContratoMiembro[];
}

/**
 * El CONTRATO de los componentes, servido a la documentación.
 *
 * Por qué existe: hasta el 2026-09-19 la tabla de props de cada página estaba ESCRITA A MANO en
 * su demo (`StoryMeta.props`), y las 51 estaban escritas a mano. Medido entonces: 18 no cuadraban
 * con el código y 73 props de 400 no tenían fila — `sc-button` declaraba 16 miembros y su tabla
 * listaba 10, sin `ariaLabel` ni `iconAriaLabel` en ninguna parte de la página. Quien consultaba
 * se quedaba igual, y además creía haber consultado.
 *
 * Ahora la tabla se DERIVA de `_component-api.json`, que genera `audit:components` del código y
 * cruza contra la API de la versión de PrimeNG instalada. Eso hace la deriva **imposible por
 * construcción**, que es distinto de vigilada: no hay dos sitios que puedan desviarse.
 *
 * Se sirve por `fetch` desde `public/` y no por import, por la misma razón que el mapa de tokens
 * semánticos y la galería de uso: la app compila solo desde `src/` y no puede importar de
 * `scripts/` ni de `docs/` (ver `foundations.component.ts`).
 *
 * Una sola petición para toda la sesión: el servicio es `providedIn: 'root'` y la lanza la
 * primera página que la pida.
 */
@Injectable({ providedIn: 'root' })
export class ComponentApiService {
  private readonly componentes = signal<readonly ComponenteContrato[] | null>(null);
  /** `true` si el contrato no se pudo cargar. La página lo dice en vez de fingir que no hay API. */
  readonly error = signal(false);
  private pedido = false;

  private readonly porSelector = computed(() => {
    const lista = this.componentes();
    return lista ? new Map(lista.map((c) => [c.selector, c])) : null;
  });

  /** El contrato de un componente, o `null` mientras carga o si no está. */
  contrato(selector: string): readonly ContratoMiembro[] | null {
    this.cargar();
    return this.porSelector()?.get(selector)?.contrato ?? null;
  }

  /** Su línea de «cuándo se usa», o `null`. */
  cuando(selector: string): string | null {
    this.cargar();
    return this.porSelector()?.get(selector)?.cuando ?? null;
  }

  private cargar(): void {
    if (this.pedido) return;
    this.pedido = true;
    fetch('/components/_component-api.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { components: ComponenteContrato[] }) => this.componentes.set(d.components))
      .catch(() => this.error.set(true));
  }
}
