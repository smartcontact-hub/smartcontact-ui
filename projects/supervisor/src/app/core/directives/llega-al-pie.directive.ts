import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, ElementRef, afterEveryRender, inject } from '@angular/core';

/**
 * HASTA EL PIE DE LA PANTALLA (DD-160): lo que hace scroll por dentro dentro de una sección (la tabla de agentes del
 * grupo) aprovecha el alto que queda, no un tope fijo. Pone en el elemento `--llega-al-pie`, el alto en px que le
 * deja la zona que desplaza (`main`) sin que esta tenga que desplazarse: su alto visible, menos lo que hay por encima
 * del elemento y lo que hay por debajo (el relleno de su tarjeta y el de la página). Quien lo usa lo pone de tope
 * (`max-block-size`) con su suelo, para que en una pantalla baja la tabla no quede en tres filas.
 *
 * Lo de encima se mide en el CONTENIDO de la zona, no en la ventana: da lo mismo cuánto se haya bajado. Lo de debajo
 * se suma subiendo por los antepasados: lo que va DEBAJO del elemento en cada uno (el pie del alta, otra tarjeta) y su
 * relleno y borde de abajo. No se lee el final de la zona: la ficha mide al menos toda la pantalla (`min-height`), y
 * ese relleno vacío se contaría como si hiciera falta. Se rehace en cada pintado (una cifra igual no toca el estilo) y
 * al cambiar la ventana. Medido el 2026-10-04: con `100dvh − 420 px`, a 1440×900 la tabla escondía 180 px de filas y
 * dejaba 158 px vacíos bajo su tarjeta.
 *
 * Y `--alto-visto`, el alto MAYOR que han tenido sus filas en esta visita (su `<table>` y el borde de la tarjeta). La
 * tarjeta lo usa de suelo: mide lo que sus filas (DD-95 §1: con tres, una tarjeta hasta el fondo se veía vacía) y, al
 * buscar o filtrar, no encoge por debajo de lo que llegó a medir; el marco no baila (revisión del 2026-10-09).
 */
@Directive({ selector: '[scLlegaAlPie]' })
export class LlegaAlPieDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private ultimo = '';
  private visto = 0;

  constructor() {
    afterEveryRender({ read: () => this.medir() });
    const alCambiar = () => this.medir();
    this.document.defaultView?.addEventListener('resize', alCambiar);
    inject(DestroyRef).onDestroy(() => this.document.defaultView?.removeEventListener('resize', alCambiar));
  }

  private medir(): void {
    const zona = this.el.closest('main') ?? this.document.scrollingElement;
    if (!zona) return;
    const propio = this.el.getBoundingClientRect();
    const encima = propio.top - zona.getBoundingClientRect().top + zona.scrollTop;
    const alto = `${Math.max(0, Math.floor(zona.clientHeight - encima - this.debajo(zona)))}px`;
    if (alto !== this.ultimo) {
      this.ultimo = alto;
      this.el.style.setProperty('--llega-al-pie', alto);
    }
    this.medirFilas();
  }

  /** El alto de sus filas ahora, con el borde de la tarjeta; si es el mayor visto, pasa a ser el suelo. Sin filas (el
   *  mensaje de «Sin resultados», una celda que ocupa todas las columnas) no cuenta: si no, al limpiar la búsqueda las
   *  filas se quedaban en el alto de ese mensaje. */
  private medirFilas(): void {
    const tabla = this.el.querySelector('table');
    if (!tabla || tabla.querySelector('tbody > tr > td[colspan]')) return;
    const estilo = getComputedStyle(this.el);
    const borde = parseFloat(estilo.borderTopWidth) + parseFloat(estilo.borderBottomWidth);
    const filas = Math.ceil(tabla.getBoundingClientRect().height + borde);
    if (filas <= this.visto) return;
    this.visto = filas;
    this.el.style.setProperty('--alto-visto', `${filas}px`);
  }

  /** Lo que hay por debajo del elemento hasta el final del contenido de la zona. */
  private debajo(zona: Element): number {
    let total = 0;
    let nodo: Element = this.el;
    for (let padre = nodo.parentElement; padre && nodo !== zona; nodo = padre, padre = padre.parentElement) {
      const fondo = nodo.getBoundingClientRect().bottom;
      // Solo lo que va debajo, no al lado (el resumen, el índice): lo que empieza donde acaba este.
      let hasta = fondo;
      for (let h = nodo.nextElementSibling; h; h = h.nextElementSibling) {
        const r = h.getBoundingClientRect();
        if (r.height > 0 && r.top >= fondo - 1) hasta = Math.max(hasta, r.bottom + parseFloat(getComputedStyle(h).marginBottom));
      }
      const estilo = getComputedStyle(padre);
      // Su propio margen de abajo, que la caja de `getBoundingClientRect` no incluye; y el relleno y el borde del padre.
      const margen = this.el === nodo ? 0 : parseFloat(getComputedStyle(nodo).marginBottom);
      total += hasta - fondo + margen + parseFloat(estilo.paddingBottom) + parseFloat(estilo.borderBottomWidth);
      if (padre === zona) break;
    }
    return total;
  }
}
