import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Modal de reembolsos — el destino REAL del botón "Refund" y del badge de la
 * columna Refund.
 *
 * La réplica lo tenía apuntando al diálogo de "motivo de no reembolso" por una
 * suposición mía; mirando el árbol de componentes de la app real apareció
 * `app-new-modal-refund`, que es otra cosa. Rafa mandó reapuntarlo.
 *
 * Cómo se capturó sin tocar dinero: el botón "Refund" **no abre nada si no hay
 * una suscripción marcada**, así que se entró por el **badge** de la columna
 * Refund, que es solo lectura. Dentro no se pulsó nada; se cerró con el aspa.
 *
 * Métrica medida @1460×792:
 *   diálogo 726.5 ancho · fondo #f4f6fc · radio 12.1618 · borde 1px rgba(0,0,0,.176)
 *   padding 10.6434 21.2868 15.2132 22.8198
 *   cabecera: producto y operador en #1b2f53 (el operador en negrita), y a la
 *   derecha el total reembolsado a 24/700 en VERDE #3eb584 + "N Charge(s)"
 *   tabla blanca, fila 32.7 — y por cada cargo DOS botones, API y BNK, que son
 *   las dos vías de devolución (43.9 y 49.8 × 27.8, fondo #fbfbfb, radio 7.6)
 */
@Component({
  selector: 'app-refund-modal',
  standalone: true,
  template: `
    <div class="rfd" (click)="onBackdrop($event)">
      <div class="rfd__dialog" role="dialog" aria-modal="true" aria-label="Refunds">
        <div class="rfd__content">
          <header class="rfd__head">
            <button class="rfd__x" type="button" aria-label="Cerrar" (click)="closed.emit()">
              ✕
            </button>
            <span class="rfd__who">
              <span class="rfd__product">{{ product().toUpperCase() }},</span>
              <strong class="rfd__operator">{{ operator().toUpperCase() }}</strong>
            </span>
            <span class="rfd__totals">
              <span class="rfd__refunded">
                Refunded <strong class="rfd__amount">{{ refunded() }}</strong>
              </span>
              <span class="rfd__charges">{{ charges().length }} Charge(s)</span>
            </span>
          </header>

          <div class="rfd__body">
            <table class="rfd__table">
              <thead>
                <tr>
                  <th class="rfd__count"><span class="rfd__badge">{{ charges().length }}</span></th>
                  <th>Product</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>API</th>
                  <th>BNK</th>
                </tr>
              </thead>
              <tbody>
                @for (c of charges(); track c.date) {
                  <tr>
                    <td></td>
                    <td>{{ product() }}</td>
                    <td>{{ c.date }}</td>
                    <td>{{ c.amount }}</td>
                    <!-- Las DOS vías de devolución del original. -->
                    <td><button class="rfd__way" type="button">API</button></td>
                    <td><button class="rfd__way" type="button">BNK</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './refund-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefundModalComponent {
  readonly product = input.required<string>();
  readonly operator = input<string>('Orange');
  readonly refunded = input<string>('0.00 €');
  readonly charges = input.required<readonly { date: string; amount: string }[]>();
  readonly closed = output<void>();

  protected onBackdrop(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).classList.contains('rfd')) this.closed.emit();
  }
}
