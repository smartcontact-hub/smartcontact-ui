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

/**
 * El estado de un componente (DD-190), calculado por `scripts/component-audit.mjs`: «ready» si tiene
 * maestro en el Kit y página de demo; «experimental» si le falta alguna (`faltas`); «deprecated» si
 * su clase lleva `@deprecated` (`retirado` es su motivo).
 */
export interface EstadoComponente {
  readonly estado: 'ready' | 'experimental' | 'deprecated';
  readonly faltas: readonly ('kit' | 'demo')[];
  readonly retirado: string | null;
}

/** Un trozo de la línea de «cuándo»: texto, o código si iba entre comillas invertidas (`sc-tag`). */
export interface TrozoCuando {
  readonly texto: string;
  readonly codigo: boolean;
}

/**
 * La línea de «cuándo» en trozos, para pintar como código lo que el contrato escribe entre comillas invertidas
 * («Si va suelto en la fila, es `sc-tag`»). Sin esto la página enseñaba las comillas tal cual.
 */
export function trozosDeCuando(cuando: string): readonly TrozoCuando[] {
  return cuando
    .split('`')
    .map((texto, i) => ({ texto, codigo: i % 2 === 1 }))
    .filter((t) => t.texto.length > 0);
}

/**
 * Con quién se relaciona, derivado por `audit:components`: las alternativas que nombra su «cuándo», los componentes que
 * usa en su plantilla y aquellos en los que aparece. Selectores (`sc-tag`).
 */
export interface RelacionesComponente {
  readonly alternativas: readonly string[];
  readonly usa: readonly string[];
  readonly usadoEn: readonly string[];
}

/** Lo que la ficha y la página de estado enseñan de un componente, además de su API. */
export interface ComponenteContrato extends EstadoComponente {
  readonly selector: string;
  readonly name: string;
  readonly cuando: string | null;
  /** `primeng/button`, o `—` si es nuestro de cabo a rabo. */
  readonly primengBase: string;
  /** Su fichero en el repo, o `null` (un nativo adoptado no tiene fichero nuestro). */
  readonly fuente: string | null;
  /** Su master en Figma, de su plantilla de Code Connect; `null` si no la tiene. */
  readonly figma: string | null;
  readonly usosSupervisor: number | null;
  readonly relaciones: RelacionesComponente;
  readonly contrato: readonly ContratoMiembro[];
}

/** Donde vive el código: los enlaces «Código» apuntan a la rama principal del repositorio. */
export const REPO_BLOB = 'https://github.com/smartcontact-hub/smartcontact-ui/blob/main/';

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

  /** Por la ruta de su página (`sectioncard`): el nombre sin guiones. */
  private readonly porRuta = computed(() => {
    const lista = this.componentes();
    return lista ? new Map(lista.map((c) => [c.name.replace(/-/g, ''), c])) : null;
  });

  /** Todos, en el orden del contrato; `null` mientras carga. La página de estado los lista. */
  todos(): readonly ComponenteContrato[] | null {
    this.cargar();
    return this.componentes();
  }

  /** Un componente entero por selector, o `null` mientras carga o si no está. */
  componente(selector: string): ComponenteContrato | null {
    this.cargar();
    return this.porSelector()?.get(selector) ?? null;
  }

  /** Su estado por selector, o `null` mientras carga o si no está. */
  estado(selector: string): EstadoComponente | null {
    this.cargar();
    return this.porSelector()?.get(selector) ?? null;
  }

  /** Su estado por la ruta de su página, para el índice. */
  estadoDeRuta(ruta: string): EstadoComponente | null {
    this.cargar();
    return this.porRuta()?.get(ruta) ?? null;
  }

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

  /** Su selector (`sc-section-card`) por la ruta de su página, o `null`. */
  selectorDeRuta(ruta: string): string | null {
    this.cargar();
    return this.porRuta()?.get(ruta)?.selector ?? null;
  }

  /** Su línea de «cuándo se usa» por la ruta de su página, para la tarjeta del índice. */
  cuandoDeRuta(ruta: string): string | null {
    this.cargar();
    return this.porRuta()?.get(ruta)?.cuando ?? null;
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
