import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, NgZone, signal } from '@angular/core';

/**
 * EL NOMBRE DE LA FICHA, FIJO ARRIBA AL BAJAR (DD-145). Una copia muda de la cabecera, con el nombre y su línea de
 * datos en sus mismos estilos de texto, que se queda en lo alto de la columna del contenido mientras la sección pasa
 * por debajo.
 * La cabecera de verdad no se mueve: sigue siendo el único `h1`, va la primera en el tabulador y el nombre se edita en
 * ella. La copia es `aria-hidden` y no se enfoca.
 *
 * Por qué una copia y no la cabecera `sticky`: un `sticky` no sale del área de su rejilla, y la cabecera ocupa la fila
 * de arriba de `.ficha-rail` (DD-144). Para fijarla habría que envolverla con el contenido en una columna, y eso cambia
 * el orden del DOM: el índice delante del título, o detrás del contenido. La copia va en la rejilla, en la columna del
 * contenido y de arriba abajo (`_page.scss`), así que su `sticky` tiene todo el recorrido de la página.
 *
 * Cuándo se ve: cuando la página ha bajado Y la copia ya está fija arriba.
 *   - A partir de 1340 la copia cae justo encima de la cabecera (sube el margen de la página), así que se ve desde el
 *     primer píxel y el nombre no se mueve: la sección pasa por debajo de él.
 *   - Por debajo de 1340 la cabecera va a todo lo ancho, encima de la franja del resumen, y la copia va sobre el
 *     contenido: solo se ve al quedar fija arriba, porque antes taparía la franja.
 *   - En reposo no se ve, y lo que se pulsa es la cabecera.
 *
 * La copia no se deja encontrar como si fuera la cabecera: su texto va pintado (`::before` con
 * `content: attr(data-texto)`), no escrito en el DOM, y sus clases son suyas, no `.headline__*`. Buscar el nombre por
 * su texto o la cabecera por su clase da con la de verdad y nada más; con la copia escrita y con esas clases, las
 * pruebas que lo hacían encontraban dos.
 *
 * Mide al desplazarse, fuera de la zona de Angular: cambia la señal solo al cruzar el umbral, y eso repinta.
 */
@Component({
  selector: 'sc-nombre-fijo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.nombre-fijo--visible]': 'visible()',
  },
  template: `
    <div class="nombre-fijo__quien">
      <span class="nombre-fijo__nombre sc-text-h3-semibold" [attr.data-texto]="nombre()"></span>
      @if (datos(); as datos) {
        <span class="nombre-fijo__datos sc-text-caption-regular" [attr.data-texto]="datos"></span>
      }
    </div>
  `,
  styles: `
    /* Sube lo que mide el margen de arriba de la página para caer, en reposo, justo encima de la cabecera; y lo
     * devuelve como relleno, con el fondo de la página, para tapar lo que pasa por debajo hasta la barra de arriba.
     * Abajo, los 14 que separan la cabecera de la sección. */
    :host {
      position: sticky;
      inset-block-start: 0;
      z-index: 2;
      display: block;
      align-self: start;
      margin-block-start: calc(-1 * var(--sc-spacing-1-625));
      padding-block: var(--sc-spacing-1-625) var(--sc-spacing-1);
      background: var(--sc-bg-canvas);
      visibility: hidden;
    }

    /* Lo mismo que la cabecera (.ficha-rail .headline__* en _page.scss): una línea cada uno, y se recortan si no
     * caben. */
    .nombre-fijo__quien {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .nombre-fijo__nombre,
    .nombre-fijo__datos {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nombre-fijo__nombre {
      color: var(--sc-text-primary);
    }

    .nombre-fijo__datos {
      color: var(--sc-text-secondary);
    }

    .nombre-fijo__nombre::before,
    .nombre-fijo__datos::before {
      content: attr(data-texto);
    }

    /* Fija y a la vista: una línea fina abajo dice dónde se corta lo que pasa por debajo. */
    :host(.nombre-fijo--visible) {
      visibility: visible;
      box-shadow: 0 1px 0 var(--sc-border-subtle);
    }
  `,
})
export class NombreFijoComponent {
  /** El nombre, como lo dice el `h1` de la cabecera en ese momento (también mientras se escribe). */
  readonly nombre = input.required<string>();
  /** La línea de datos de debajo, como la de la cabecera. */
  readonly datos = input<string | null>(null);

  protected readonly visible = signal(false);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const zona = inject(NgZone);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const raiz = host.closest<HTMLElement>('#main-content');
      if (!raiz) return;
      // Fija = pegada arriba de la zona que se desplaza. Medio píxel de margen por el redondeo de las cajas.
      const medir = () => {
        const fija = host.getBoundingClientRect().top - raiz.getBoundingClientRect().top < 0.5;
        this.visible.set(raiz.scrollTop > 0 && fija);
      };
      zona.runOutsideAngular(() => {
        raiz.addEventListener('scroll', medir, { passive: true });
        window.addEventListener('resize', medir, { passive: true });
      });
      medir();
      destroyRef.onDestroy(() => {
        raiz.removeEventListener('scroll', medir);
        window.removeEventListener('resize', medir);
      });
    });
  }
}
