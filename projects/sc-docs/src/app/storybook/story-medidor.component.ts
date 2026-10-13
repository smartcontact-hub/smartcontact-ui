import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';

/** Una caja en px, relativa al lienzo. */
interface Caja {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Lo que se pinta encima del elemento señalado. */
interface Medida {
  readonly borde: Caja;
  readonly margen: Caja;
  /** Las cuatro bandas del relleno (arriba, derecha, abajo, izquierda). */
  readonly relleno: readonly Caja[];
  readonly nombre: string;
  readonly lineas: readonly string[];
  /** La etiqueta va debajo del elemento, salvo que no quepa: entonces encima. */
  readonly etiquetaArriba: boolean;
}

const px = (v: number): string => `${Number.isInteger(v) ? v : Math.round(v * 10) / 10}`;
const num = (v: string): number => Number.parseFloat(v) || 0;
/** `6 12` en vez de `6 12 6 12`: como se escribe en CSS. */
const lados = (t: number, r: number, b: number, l: number): string =>
  t === b && r === l ? (t === r ? px(t) : `${px(t)} ${px(r)}`) : `${px(t)} ${px(r)} ${px(b)} ${px(l)}`;

/**
 * La REGLA del lienzo: pasa el ratón por cualquier elemento de una story y enseña su caja con el relleno (verde) y el
 * margen (naranja), y debajo sus números en px: tamaño, relleno, margen, el hueco que reparte entre sus hijos, el que
 * le da su padre, la letra y el radio. Es lo que hace falta para cotejar con el panel de Figma sin abrir las DevTools.
 *
 * Lee `getComputedStyle`, o sea el valor que GANA, no el que alguien escribió: si un token no llega, aquí se ve.
 */
@Component({
  selector: 'app-story-medidor',
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sb-medidor', 'aria-hidden': 'true' },
  template: `
    @if (medida(); as m) {
      <div class="sb-medidor__margen" [style.left.px]="m.margen.x" [style.top.px]="m.margen.y" [style.width.px]="m.margen.w" [style.height.px]="m.margen.h"></div>
      @for (r of m.relleno; track $index) {
        <div class="sb-medidor__relleno" [style.left.px]="r.x" [style.top.px]="r.y" [style.width.px]="r.w" [style.height.px]="r.h"></div>
      }
      <div class="sb-medidor__borde" [style.left.px]="m.borde.x" [style.top.px]="m.borde.y" [style.width.px]="m.borde.w" [style.height.px]="m.borde.h"></div>
      <div
        class="sb-medidor__etiqueta sc-text-caption-regular"
        [class.sb-medidor__etiqueta--arriba]="m.etiquetaArriba"
        [style.left.px]="m.borde.x"
        [style.top.px]="m.etiquetaArriba ? m.borde.y : m.borde.y + m.borde.h"
      >
        <strong class="sc-text-caption-semibold">{{ m.nombre }}</strong>
        @for (l of m.lineas; track $index) {
          <span>{{ l }}</span>
        }
      </div>
    }
  `,
})
export class StoryMedidorComponent {
  /** El lienzo que se mide: la regla escucha el ratón sobre él y pinta en sus coordenadas. */
  readonly raiz = input.required<HTMLElement>();
  readonly activo = input(false);

  protected readonly medida = signal<Medida | null>(null);

  private frame = 0;
  private ultimo: Element | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect((onCleanup) => {
      const raiz = this.raiz();
      if (!this.activo()) {
        this.medida.set(null);
        return;
      }
      const mover = (e: PointerEvent): void => {
        const objetivo = e.target instanceof Element ? e.target : null;
        if (!objetivo || objetivo === this.ultimo) return;
        this.ultimo = objetivo;
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => this.medida.set(this.medir(objetivo, raiz)));
      };
      const salir = (): void => {
        this.ultimo = null;
        this.medida.set(null);
      };
      raiz.addEventListener('pointermove', mover);
      raiz.addEventListener('pointerleave', salir);
      onCleanup(() => {
        raiz.removeEventListener('pointermove', mover);
        raiz.removeEventListener('pointerleave', salir);
      });
    });

    destroyRef.onDestroy(() => cancelAnimationFrame(this.frame));
  }

  private medir(el: Element, raiz: HTMLElement): Medida | null {
    // Lo que no es de la story (la barra del lienzo, la propia regla) no se mide.
    if (!el.closest('.sb-canvas__pane') || el.closest('.sb-medidor')) return null;

    const base = raiz.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);

    const borde: Caja = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    const [mt, mr, mb, ml] = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(num);
    const [pt, pr, pb, pl] = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(num);
    const [bt, br, bb, bl] = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(num);

    const margen: Caja = { x: borde.x - ml, y: borde.y - mt, w: borde.w + ml + mr, h: borde.h + mt + mb };
    const dentro: Caja = { x: borde.x + bl, y: borde.y + bt, w: borde.w - bl - br, h: borde.h - bt - bb };
    const relleno: Caja[] = [
      { x: dentro.x, y: dentro.y, w: dentro.w, h: pt },
      { x: dentro.x + dentro.w - pr, y: dentro.y + pt, w: pr, h: Math.max(0, dentro.h - pt - pb) },
      { x: dentro.x, y: dentro.y + dentro.h - pb, w: dentro.w, h: pb },
      { x: dentro.x, y: dentro.y + pt, w: pl, h: Math.max(0, dentro.h - pt - pb) },
    ].filter((c) => c.w > 0 && c.h > 0);

    const lineas: string[] = [`${px(r.width)} × ${px(r.height)}`];
    if (pt || pr || pb || pl) lineas.push(`relleno ${lados(pt, pr, pb, pl)}`);
    if (mt || mr || mb || ml) lineas.push(`margen ${lados(mt, mr, mb, ml)}`);
    if (bt || br || bb || bl) lineas.push(`borde ${lados(bt, br, bb, bl)}`);
    const hueco = this.hueco(cs);
    if (hueco) lineas.push(`hueco entre hijos ${hueco}`);
    const padre = el.parentElement;
    const huecoPadre = padre && !padre.classList.contains('sb-canvas__pane') ? this.hueco(getComputedStyle(padre)) : null;
    if (huecoPadre) lineas.push(`hueco con sus hermanos ${huecoPadre}`);
    if (el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())) {
      lineas.push(`letra ${px(num(cs.fontSize))}/${cs.lineHeight === 'normal' ? 'normal' : px(num(cs.lineHeight))}, peso ${cs.fontWeight}`);
    }
    const radio = num(cs.borderTopLeftRadius);
    if (radio) lineas.push(`radio ${px(radio)}`);

    const espacioDebajo = raiz.clientHeight - (borde.y + borde.h);
    return {
      borde,
      margen,
      relleno,
      nombre: this.nombre(el),
      lineas,
      etiquetaArriba: espacioDebajo < 96 && borde.y > 96,
    };
  }

  /** El `gap` de una caja flex o grid, o nada si no reparte. */
  private hueco(cs: CSSStyleDeclaration): string | null {
    if (!/flex|grid/.test(cs.display)) return null;
    const fila = num(cs.rowGap);
    const col = num(cs.columnGap);
    if (!fila && !col) return null;
    return fila === col ? px(fila) : `${px(fila)} ${px(col)}`;
  }

  /** `button.p-button.p-button-sm`: la etiqueta y sus clases de PrimeNG o del DS, como en la anatomía. */
  private nombre(el: Element): string {
    const clases = [...el.classList].filter((c) => /^(p-|sc-)/.test(c)).slice(0, 3);
    return el.tagName.toLowerCase() + clases.map((c) => `.${c}`).join('');
  }
}
