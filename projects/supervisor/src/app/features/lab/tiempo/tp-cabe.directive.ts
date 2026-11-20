import { DestroyRef, Directive, ElementRef, inject, input, output } from '@angular/core';

/**
 * LO QUE NO CABE SE CUENTA. En una lista que se parte en líneas, deja a la vista los hijos que caben en `scCabe` líneas
 * y emite cuántos quedan fuera, para que la lista enseñe «+N» con el resto al pasar. Ese «+N» es un hijo más, marcado con
 * `data-mas`: va al final, siempre en el DOM, y solo se ve si algo no cabe (la directiva le hace sitio en la última línea).
 * Vale para una lista flexible (cada hijo, una caja) o que fluye como texto (hijos en línea, que se parten como una
 * frase). Se mide al cambiar el ancho o lo que hay dentro; lo escondido sigue en el DOM con `display: none`.
 */
@Directive({ selector: '[scCabe]' })
export class TpCabeDirective {
  /** Las líneas que se dejan a la lista. */
  readonly lineas = input(1, { alias: 'scCabe' });
  /** Cuántos hijos quedan fuera (0 si caben todos). */
  readonly fuera = output<number>({ alias: 'scCabeFuera' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private ultimo = -1;

  constructor() {
    const medir = (): void => this.medir();
    const tam = new ResizeObserver(medir);
    const cambios = new MutationObserver(medir);
    tam.observe(this.host);
    cambios.observe(this.host, { childList: true, subtree: true, characterData: true });
    inject(DestroyRef).onDestroy(() => {
      tam.disconnect();
      cambios.disconnect();
    });
  }

  private medir(): void {
    const hijos = [...this.host.children] as HTMLElement[];
    const mas = hijos.find((h) => h.hasAttribute('data-mas')) ?? null;
    const items = hijos.filter((h) => h !== mas);
    for (const h of items) h.style.removeProperty('display');
    if (mas) mas.style.display = 'none';
    const tope = this.tope(items);
    const fuera = (h: HTMLElement): boolean => h.getBoundingClientRect().bottom > tope;
    let visibles = items.findIndex(fuera);
    if (visibles === -1) visibles = items.length;
    else if (mas) {
      // Con «+N» a la vista, se quita uno más hasta que quepa en la última línea (siempre queda uno).
      mas.style.removeProperty('display');
      for (visibles = Math.max(1, visibles); visibles > 1; visibles--) {
        items.forEach((h, k) => (k >= visibles ? (h.style.display = 'none') : h.style.removeProperty('display')));
        if (!fuera(mas)) break;
      }
    }
    visibles = Math.max(Math.min(1, items.length), visibles);
    items.forEach((h, k) => (k >= visibles ? (h.style.display = 'none') : h.style.removeProperty('display')));
    if (mas) mas.style.display = visibles < items.length ? '' : 'none';
    const n = items.length - visibles;
    if (n !== this.ultimo) {
      this.ultimo = n;
      this.fuera.emit(n);
    }
  }

  /**
   * Hasta dónde llega la última línea permitida: lo mide en píxeles, no en elementos, porque un elemento largo (un
   * grupo de días con muchas horas) también se parte y ocupa dos líneas.
   */
  private tope(items: readonly HTMLElement[]): number {
    const lineas = this.lineas();
    const estilo = getComputedStyle(this.host);
    const arriba = this.host.getBoundingClientRect().top;
    // Una lista que fluye como texto (sus hijos en línea) mide por su alto de línea.
    const linea = parseFloat(estilo.lineHeight);
    if (!estilo.display.includes('flex') && linea > 0) return arriba + lineas * linea + 1;
    const alto = Math.min(...items.map((h) => h.getBoundingClientRect().height).filter((a) => a > 0), Infinity);
    if (!Number.isFinite(alto)) return Infinity;
    const hueco = parseFloat(estilo.rowGap) || 0;
    return arriba + lineas * alto + (lineas - 1) * hueco + 1;
  }
}
