import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  viewChild,
} from '@angular/core';

import { TRAZOS } from './mascota.trazos';

/** Cada instancia necesita su propio recorte: dos mascotas en la misma página no pueden compartir el `id`. */
let siguienteId = 0;

/** El saludo: el brazo del pulgar sube desde el hombro y rebota, y el casco se levanta un poco a la vez. */
const SALUDO_BRAZO: Keyframe[] = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(-16deg)', offset: 0.3 },
  { transform: 'rotate(5deg)', offset: 0.55 },
  { transform: 'rotate(-6deg)', offset: 0.75 },
  { transform: 'rotate(0deg)' },
];
const SALUDO_CASCO: Keyframe[] = [
  { transform: 'none' },
  { transform: 'translateY(-14px) rotate(-5deg)', offset: 0.35 },
  { transform: 'translateY(2px) rotate(1deg)', offset: 0.7 },
  { transform: 'none' },
];
const SALUDO_OJOS: Keyframe[] = [
  { transform: 'none' },
  { transform: 'translateY(3px) scale(1.06, 0.6)', offset: 0.3 },
  { transform: 'none', offset: 0.6 },
  { transform: 'none' },
];
/** La curva es la de `--sc-easing-default`, escrita aquí porque `animate()` no lee variables de CSS. */
const SALUDO: KeyframeAnimationOptions = { duration: 900, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };

/**
 * La mascota de obras: una alubia con casco que levanta el pulgar. Sale donde la doc está «en obras» (el Lab y la
 * página de una dirección que no existe), nunca en las apps, que usan personas trabajando.
 *
 * Es SVG por partes para moverlas por separado (`mascota.trazos.ts`), con los colores de la paleta del DS, así que el
 * oscuro sale solo. Decorado: oculta al lector y sin foco.
 *
 * Movimiento, en tres momentos:
 *   · al aparecer cae con un rebote, saluda con el pulgar, respira dos veces y entrecierra los ojos; a los 5 s se queda
 *     quieta. Lo que se mueve solo más de 5 s junto a un texto distrae al leer, y WCAG 2.2.2 pide poder pararlo;
 *   · al pasar el ratón (o al tocarla) vuelve a saludar: el pulgar, el casco y los ojos;
 *   · con «reducir movimiento» no se mueve nada: la hoja quita las animaciones y `saluda()` no arranca ninguna.
 */
@Component({
  selector: 'app-mascota',
  template: `
    <svg
      class="m"
      [class.m--entra]="entrada()"
      viewBox="-6 -30 552 696"
      aria-hidden="true"
      focusable="false"
      (pointerenter)="saluda()"
      (click)="saluda()"
    >
      <defs>
        <clipPath [attr.id]="recorte"><path [attr.d]="t.cuerpo" /></clipPath>
      </defs>
      <g class="m__todo">
        <g class="m__tinta">
          <path [attr.d]="t.piernaIzq" />
          <path [attr.d]="t.piernaDer" />
        </g>
        <g class="m__tronco">
          <path #brazo class="m__tinta m__brazo" [attr.d]="t.brazoDer" />
          <path class="m__sombra" [attr.d]="t.cuerpo" />
          <g [attr.clip-path]="'url(#' + recorte + ')'">
            <path class="m__luz" [attr.d]="t.cuerpo" transform="translate(20 -45)" />
            <path class="m__perfil" [attr.d]="t.cuerpo" />
            <path class="m__sombra" [attr.d]="t.casco" transform="translate(4 20)" />
          </g>
          <g #ojos class="m__ojos">
            <g class="m__parpados">
              <path class="m__tinta" [attr.d]="t.ojoIzq" />
              <path class="m__tinta" [attr.d]="t.ojoDer" />
            </g>
          </g>
          <path class="m__tinta" [attr.d]="t.brazoIzq" />
          <g #casco class="m__casco">
            <path class="m__casco-base" [attr.d]="t.casco" />
            <path class="m__casco-claro" [attr.d]="t.cascoClaro" />
            <path class="m__casco-panel" [attr.d]="t.cascoPanel" />
            <path class="m__casco-oscuro" [attr.d]="t.cascoOscuro" />
          </g>
        </g>
      </g>
    </svg>
  `,
  styleUrl: './mascota.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MascotaComponent {
  /** Cae con un rebote y saluda al aparecer. Apágalo donde ya estaba y solo se repinta. */
  readonly entrada = input(true);

  protected readonly t = TRAZOS;
  protected readonly recorte = `mascota-cuerpo-${++siguienteId}`;

  private readonly brazo = viewChild.required<ElementRef<SVGPathElement>>('brazo');
  private readonly casco = viewChild.required<ElementRef<SVGGElement>>('casco');
  private readonly ojos = viewChild.required<ElementRef<SVGGElement>>('ojos');

  constructor() {
    // El primer saludo, justo cuando acaba de caer (la caída dura 760 ms en la hoja).
    afterNextRender(() => {
      if (this.entrada()) this.saluda(560);
    });
  }

  /** Saluda una vez. Si ya está saludando, no empieza otro encima: pasar el ratón de un lado a otro no la marea. */
  protected saluda(retraso = 0): void {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const brazo = this.brazo().nativeElement;
    if (typeof brazo.animate !== 'function' || brazo.getAnimations().length) return;
    const opciones = { ...SALUDO, delay: retraso };
    brazo.animate(SALUDO_BRAZO, opciones);
    this.casco().nativeElement.animate(SALUDO_CASCO, opciones);
    this.ojos().nativeElement.animate(SALUDO_OJOS, opciones);
  }
}
