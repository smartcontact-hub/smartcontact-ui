import { ChangeDetectionStrategy, Component, afterNextRender, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { CountUpDirective } from '@core/directives';

/**
 * UNA CIFRA DEL RESUMEN, COMO WIDGET: el rótulo arriba, la cifra grande y, si se mide contra un total, el
 * anillo que se llena a su lado. Es el ejemplo «Preview» de ProgressSpinner de primeng.dev pasado a
 * nuestros tokens (DD-113): el `p-progress-spinner` nativo en modo determinado, con su `strokeWidth` de
 * 10 y su propio movimiento (el arco llega en 0,3 s), y la cifra que cuenta a la vez que él.
 *
 * Lo que cambia del ejemplo, y por qué:
 *   · El arco va en el acento (`--sc-bg-accent`, el de las barras por canal) por `dt` de ESTA instancia; el
 *     ejemplo lo pinta con CSS a `.p-*`, que aquí sumaría acoplamiento (el tope está lleno).
 *   · El `N%` nativo va oculto por `pt` con clase propia (DD-108), como lo oculta el ejemplo: a 42 px
 *     mediría unos 5 y la cifra grande ya lo dice. Está en `customs-catalog` §8.
 *   · El anillo va `aria-hidden`: su `progressbar` con `aria-busy` diría «cargando» de un dato que no
 *     carga. La cifra final llega al lector por texto oculto.
 *   · Tamaño con clase en el host, como la sección «Custom» de su doc.
 *
 * La tarjeta es `.resumen__kpi` (en `styles/_resumen.scss`), la misma de las cifras sin anillo.
 */
@Component({
  selector: 'sc-summary-kpi',
  imports: [TranslateModule, ProgressSpinnerModule, ScIconComponent, CountUpDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'resumen__kpi resumen__kpi--widget' },
  template: `
    <div class="resumen__cabeza">
      <p class="resumen__label sc-text-caption-regular">
        <!-- Con dirección, el rótulo lleva a su sección (DD-146): enlace de verdad, que la ficha resuelve sin recargar. -->
        @if (href(); as href) {
          <a class="resumen__enlace" [href]="href" (click)="pulsar($event)">
            <sc-icon [name]="icon()" size="inherit" aria-hidden="true" />
            {{ labelKey() | translate }}
          </a>
        } @else {
          <sc-icon [name]="icon()" size="inherit" aria-hidden="true" />
          {{ labelKey() | translate }}
        }
      </p>
      <div class="resumen__widget">
        <p class="resumen__figure">
          <!-- Compacta en el resumen de grupo, el más cargado: con la cifra grande, a 1366×660 la columna necesitaba
               11 px de scroll (medido); la cifra de agente y usuario sí cabe grande. -->
          @if (compact()) {
            <span class="resumen__count sc-text-h2-semibold" [scCountUp]="value()"></span>
          } @else {
            <span class="resumen__count sc-text-h1-semibold" [scCountUp]="value()"></span>
          }
          @if (total(); as t) {
            @if (compact()) {
              <span class="resumen__of sc-text-body-regular" aria-hidden="true">/{{ t }}</span>
            } @else {
              <span class="resumen__of sc-text-h3-regular" aria-hidden="true">/{{ t }}</span>
            }
            <span class="visually-hidden">{{ 'common.summary_of' | translate: { value: value(), total: t } }}</span>
          } @else {
            <span class="visually-hidden">{{ value() }}</span>
          }
        </p>
        @if (total(); as t) {
          <p-progress-spinner
            class="resumen__ring"
            aria-hidden="true"
            [value]="ringValue()"
            [min]="0"
            [max]="t"
            [strokeWidth]="10"
            [dt]="ringDt"
            [pt]="ringPt"
          />
        }
      </div>
      @if (noteKey(); as key) {
        <p class="resumen__note sc-text-caption-regular">{{ key | translate: noteParams() }}</p>
      }
    </div>
    <ng-content />
  `,
})
export class SummaryKpiComponent {
  /** Icono del rótulo (Material Symbols). */
  readonly icon = input.required<string>();
  /** Clave del rótulo. */
  readonly labelKey = input.required<string>();
  /** La cifra. */
  readonly value = input.required<number>();
  /** El total contra el que se mide. Con él, la cifra lleva «/total» y el anillo; sin él (o a 0), solo la cifra. */
  readonly of = input<number | null>(null);
  /** La cifra en `h2` en vez de `h1`, para el resumen más cargado. */
  readonly compact = input(false);
  /**
   * La dirección de la sección a la que lleva el rótulo (DD-146). Sin ella, el rótulo es solo texto, como en el
   * resumen de agente y de usuario.
   */
  readonly href = input<string | null>(null);
  /** Se pulsó el rótulo, sin teclas: la ficha va a la sección en su sitio (la dirección queda para Cmd+clic). */
  readonly abrir = output<void>();
  /** Una línea bajo la cifra (p. ej. «1 en pausa»). */
  readonly noteKey = input<string | null>(null);
  readonly noteParams = input<Record<string, unknown>>({});

  protected readonly total = computed(() => {
    const t = this.of();
    return t !== null && t > 0 ? t : null;
  });

  /**
   * El arco nace VACÍO y, ya pintado, recibe su valor: así lo llena el movimiento nativo (0,3 s) desde 0 al
   * abrir la ficha, como en el ejemplo (DD-126: al abrir y al cambiar). Un fotograma después del primer
   * render, no en él: dentro del mismo render el navegador aún no ha pintado el vacío y la transición no
   * tendría de dónde salir.
   */
  private readonly ready = signal(false);
  protected readonly ringValue = computed(() => (this.ready() ? this.value() : 0));

  protected readonly ringDt = { root: { colorOne: 'var(--sc-bg-accent)' } };
  protected readonly ringPt = { value: { class: 'resumen__ring-value' } };

  constructor() {
    afterNextRender(() => requestAnimationFrame(() => this.ready.set(true)));
  }

  /** Un clic sin teclas va a la sección en su sitio; con Cmd, Ctrl, Mayús o el botón central, el navegador abre la dirección. */
  protected pulsar(evento: MouseEvent): void {
    if (evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    this.abrir.emit();
  }
}
