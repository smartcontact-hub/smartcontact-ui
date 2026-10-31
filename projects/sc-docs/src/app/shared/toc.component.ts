import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterRenderEffect, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Una entrada del índice: un `h2` de la página, con el id que lleva (o que se le pone). */
interface EntradaToc {
  readonly id: string;
  readonly texto: string;
}

/** Id estable a partir del texto del título: minúsculas, sin acentos, palabras con guion. */
function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * «En esta página»: el índice de la derecha, leído de los `h2` que la página YA pinta. No hay
 * lista a mano que pueda quedarse atrás: si una página cambia sus secciones, el índice cambia
 * con ella. Las páginas cargan sus datos tarde (Novedades, Uso real), por eso se vuelve a leer
 * cuando cambia el contenido, con un respiro para no leer a medio pintar.
 *
 * Los enlaces no usan `#id`: la doc va por hash (`/#/ruta`) y un `#id` la sacaría de la ruta.
 * Se desplaza al título y se queda en la misma URL.
 */
@Component({
  selector: 'app-toc',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (entradas().length > 1) {
      <nav class="toc" [class.toc--compacto]="compacto()" [attr.aria-label]="'chrome.toc.title' | translate">
        @if (!compacto()) {
          <p class="toc__titulo sc-text-caption-semibold">{{ 'chrome.toc.title' | translate }}</p>
        }
        <!-- Una sola marca de acento que se desliza hasta la sección activa, en vez de saltar de un enlace a otro. -->
        <span
          class="toc__marca"
          aria-hidden="true"
          [style.left.px]="marca().x"
          [style.transform]="'translateY(' + marca().y + 'px)'"
          [style.height.px]="marca().alto"
          [class.is-visible]="marca().alto > 0"
        ></span>
        <ul class="toc__lista">
          @for (e of entradas(); track e.id) {
            <li>
              <a
                class="toc__enlace sc-text-body-regular"
                [class.is-active]="activa() === e.id"
                [attr.aria-current]="activa() === e.id ? 'location' : null"
                [attr.href]="href()"
                (click)="ir($event, e.id)"
                >{{ e.texto }}</a
              >
            </li>
          }
        </ul>
      </nav>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .toc__titulo {
      margin: 0 0 var(--sc-spacing-0-5);
      padding-left: var(--sc-spacing-0-5);
      color: var(--sc-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .toc__lista {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    /* Compacto: anidado bajo el enlace activo del lateral (la ficha de un componente), con su filete a la izquierda. */
    .toc--compacto .toc__lista {
      gap: 0;
      margin: var(--sc-spacing-0-25) 0 var(--sc-spacing-0-5) var(--sc-spacing-1-25);
      padding-left: var(--sc-spacing-0-5);
      border-left: 1px solid var(--sc-border-default);
    }

    .toc--compacto .toc__enlace {
      color: var(--sc-text-secondary);
    }

    .toc {
      position: relative;
    }

    .toc__marca {
      position: absolute;
      top: 0;
      width: 2px;
      margin-left: calc(-1 * var(--sc-spacing-0-5));
      border-radius: var(--sc-radius-full);
      background: var(--sc-border-accent);
      opacity: 0;
      pointer-events: none;
      transition:
        transform var(--sc-transition-slow) var(--demo-ease-salida),
        height var(--sc-transition-slow) var(--demo-ease-salida),
        opacity var(--sc-transition-base) ease-out;

      &.is-visible {
        opacity: 1;
      }
    }

    .toc--compacto .toc__marca {
      margin-left: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .toc__marca {
        transition: none;
      }
    }

    .toc__enlace {
      position: relative;
      display: block;
      padding: var(--sc-spacing-0-25) var(--sc-spacing-0-5);
      border-radius: var(--sc-radius-md);
      color: var(--sc-text-secondary);
      text-decoration: none;
      transition:
        background-color 120ms ease-out,
        color 120ms ease-out;

      &:hover {
        background: var(--sc-bg-secondary-hover);
        color: var(--sc-text-primary);
      }

      &.is-active {
        color: var(--sc-text-primary);
        font-weight: var(--sc-font-weight-semibold);
      }

      &:focus-visible {
        outline: 2px solid var(--sc-border-focus);
        outline-offset: 1px;
      }
    }
  `,
})
export class TocComponent {
  /** Dónde se buscan los títulos: el `<main>` de la doc. */
  readonly raiz = input.required<HTMLElement>();
  /** La ruta activa: al cambiar, el índice se rehace. También es el `href` de cada enlace. */
  readonly ruta = input('');
  /** Qué títulos se indexan. Por defecto los `h2` de la página (y sus `h3` si solo hay uno). */
  readonly selector = input('h2');
  /** Sin rótulo y con sangría: el índice de la ficha de un componente, dentro del lateral. */
  readonly compacto = input(false);

  protected readonly entradas = signal<readonly EntradaToc[]>([]);
  protected readonly activa = signal<string | null>(null);
  protected readonly href = () => '#' + this.ruta();
  /** Dónde va la marca: la caja del enlace activo, medida en el navegador, relativa al `nav`. */
  protected readonly marca = signal({ x: 0, y: 0, alto: 0 });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private mutaciones?: MutationObserver;
  private titulos: readonly HTMLElement[] = [];
  private espera?: ReturnType<typeof setTimeout>;
  private cuadro = 0;
  /** Al bajar, una lectura por fotograma como mucho. */
  private readonly alDesplazar = () => {
    if (this.cuadro) return;
    this.cuadro = requestAnimationFrame(() => {
      this.cuadro = 0;
      this.activarSegunScroll();
    });
  };

  constructor() {
    // Tras pintar el enlace activo, la marca va a su caja, recortada por su relleno vertical. En el compacto, sobre el
    // filete de la lista; en el otro, en el borde del enlace (la hoja la saca hacia fuera).
    afterRenderEffect(() => {
      this.activa();
      this.entradas();
      const nav = this.host.nativeElement.querySelector<HTMLElement>('.toc');
      const activo = nav?.querySelector<HTMLElement>('.toc__enlace.is-active');
      const lista = activo?.closest<HTMLElement>('.toc__lista');
      if (!nav || !activo || !lista) return this.marca.set({ x: 0, y: 0, alto: 0 });
      const n = nav.getBoundingClientRect();
      const a = activo.getBoundingClientRect();
      const relleno = parseFloat(getComputedStyle(activo).paddingTop);
      const x = (this.compacto() ? lista.getBoundingClientRect().left - lista.clientLeft : a.left) - n.left;
      this.marca.set({ x, y: a.top - n.top + relleno, alto: a.height - 2 * relleno });
    });
    effect(() => {
      const raiz = this.raiz();
      this.ruta();
      this.selector();
      this.observar(raiz);
    });
    window.addEventListener('scroll', this.alDesplazar, { passive: true });
    inject(DestroyRef).onDestroy(() => {
      this.mutaciones?.disconnect();
      window.removeEventListener('scroll', this.alDesplazar);
      cancelAnimationFrame(this.cuadro);
      clearTimeout(this.espera);
    });
  }

  protected ir(ev: MouseEvent, id: string): void {
    ev.preventDefault();
    const destino = document.getElementById(id);
    if (!destino) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    destino.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });
    this.activa.set(id);
  }

  private observar(raiz: HTMLElement): void {
    this.mutaciones?.disconnect();
    this.mutaciones = new MutationObserver(() => this.programar(raiz));
    this.mutaciones.observe(raiz, { childList: true, subtree: true });
    this.programar(raiz);
  }

  private programar(raiz: HTMLElement): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.leer(raiz), 200);
  }

  private leer(raiz: HTMLElement): void {
    const usados = new Set<string>();
    const visibles = (sel: string) =>
      [...raiz.querySelectorAll<HTMLElement>(sel)].filter(
        (h) => h.offsetParent !== null && !h.closest('[data-toc-fuera]') && h.textContent?.trim(),
      );
    // Las secciones son los `h2`; una página con uno solo (Novedades: «Historial» y sus versiones) se indexa por `h3`.
    let titulos = visibles(this.selector());
    if (this.selector() === 'h2' && titulos.length < 2) titulos = visibles('h3');
    const entradas = titulos.map((h) => {
      if (!h.id) {
        let id = slug(h.textContent ?? '') || 'seccion';
        for (let n = 2; usados.has(id) || document.getElementById(id); n++) id = `${slug(h.textContent ?? '')}-${n}`;
        h.id = id;
      }
      usados.add(h.id);
      return { id: h.id, texto: (h.textContent ?? '').replace(/\s+/g, ' ').trim() };
    });
    const iguales =
      entradas.length === this.entradas().length && entradas.every((e, i) => e.id === this.entradas()[i]?.id && e.texto === this.entradas()[i]?.texto);
    this.titulos = titulos;
    if (iguales) return;
    this.entradas.set(entradas);
    this.activarSegunScroll();
  }

  /**
   * La sección activa es la del último título que ya pasó por arriba (bajo la cabecera fija y su aire), y la última si
   * la página llegó al final. Se mira la posición cada vez y no los cruces: un salto largo de scroll (el Inicio del
   * teclado, un enlace) no pasa por los títulos de en medio, y un detector de cruces se quedaba en el primero.
   */
  private activarSegunScroll(): void {
    if (!this.titulos.length) return;
    const linea = window.innerHeight * 0.25;
    const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let activo = this.titulos[0];
    for (const h of this.titulos) if (h.getBoundingClientRect().top <= linea) activo = h;
    if (alFinal) activo = this.titulos[this.titulos.length - 1];
    this.activa.set(activo.id);
  }
}
