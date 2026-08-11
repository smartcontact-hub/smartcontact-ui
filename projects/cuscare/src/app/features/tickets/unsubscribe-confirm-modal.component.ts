import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Modal de confirmación de baja — el destino REAL del botón "Unsubscribe" de la
 * tabla de suscripciones.
 *
 * La réplica lo tenía apuntando al "Right to be forgotten" por una suposición
 * mía; el árbol de componentes de la app real tiene
 * `app-modal-confirmation-unsubscribe`, que es esto. Rafa mandó reapuntarlo.
 *
 * Medido leyéndolo del DOM sin abrirlo (vive oculto desde el arranque):
 * diálogo de **855.5** —el mismo ancho que el modal de acciones en bloque— con
 * el título "Unsubscribe", el subtítulo "Unsubscribe the following services" y
 * una tabla de CINCO columnas: Product · Keyword · Status · Price · Expired.
 *
 * Ojo con el flujo: en la real, "Unsubscribe" **no hace nada si no hay una
 * suscripción marcada** — los tres botones de esa barra (Unsubscribe · Refund ·
 * Detail) actúan sobre las filas seleccionadas, no sobre el ticket entero.
 */
@Component({
  selector: 'app-unsubscribe-confirm-modal',
  standalone: true,
  template: `
    <div class="unsub" (click)="onBackdrop($event)">
      <div class="unsub__dialog" role="dialog" aria-modal="true" aria-label="Unsubscribe">
        <div class="unsub__content">
          <header class="unsub__head">
            <p class="unsub__title">Unsubscribe</p>
            <p class="unsub__sub">Unsubscribe the following services</p>
          </header>

          <div class="unsub__body">
            <table class="unsub__table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Keyword</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Expired</th>
                </tr>
              </thead>
              <tbody>
                @for (s of services(); track s.product) {
                  <tr>
                    <td>{{ s.product }}</td>
                    <td>{{ s.keyword }}</td>
                    <td>{{ s.status }}</td>
                    <td>{{ s.price }}</td>
                    <td>{{ s.expired }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <footer class="unsub__foot">
            <button class="unsub__btn unsub__btn--cancel" type="button" (click)="closed.emit()">
              Cancel
            </button>
            <button class="unsub__btn unsub__btn--confirm" type="button" (click)="closed.emit()">
              Unsubscribe
            </button>
          </footer>
        </div>
      </div>
    </div>
  `,
  styleUrl: './unsubscribe-confirm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsubscribeConfirmModalComponent {
  readonly services =
    input.required<
      readonly { product: string; keyword: string; status: string; price: string; expired: string }[]
    >();
  readonly closed = output<void>();

  protected onBackdrop(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).classList.contains('unsub')) this.closed.emit();
  }
}
