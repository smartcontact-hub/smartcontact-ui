import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TrPipe } from '../../core/i18n/i18n';

/**
 * Modal "Search customer" — el SEGUNDO paso de "+ New ticket".
 *
 * Estuvo sin replicar por una razón que resultó ser correcta: pulsar **Save** en
 * el selector de grupo **crea un ticket de verdad**. Se confirmó al pulsarlo
 * en la app real: la app saltó a
 * `#/private/cuscare/tickets/ticket/2051827/pre-ticket` con un ticket nuevo ya
 * existiendo. Por eso no se pulsó antes, y por eso este modal se midió sobre el
 * pre-ticket que abrió él, sin tocar nada.
 *
 * Lo que resultó ser el "paso 2", y no se habría adivinado: **no hay formulario
 * de ticket**. Lo que sale es la propia pantalla de detalle en estado vacío
 * (`#0`, guiones, ceros) con este modal encima para enganchar un cliente. El
 * ticket ya existe antes de rellenar nada.
 *
 * Métrica MEDIDA @1456×831 sobre `app-modal-re-assign-ticket` de la app real.
 */
@Component({
  selector: 'app-search-customer-modal',
  standalone: true,
  imports: [FormsModule, TrPipe],
  template: `
    <div class="scmodal" (click)="onBackdrop($event)">
      <div class="scmodal__dialog" role="dialog" aria-modal="true" [attr.aria-label]="'Search customer' | tr">
        <div class="scmodal__content">
          <header class="scmodal__head">
            <h5 class="scmodal__title">{{ 'Search customer' | tr }}</h5>
          </header>

          <div class="scmodal__body">
            <div class="scmodal__row">
              <!-- Un solo país: el de la entidad del ticket (medido). -->
              <select class="scselect" [attr.aria-label]="'Country' | tr" [(ngModel)]="country">
                @for (c of countries; track c) {
                  <option [value]="c">{{ c | tr }}</option>
                }
              </select>

              <select class="scselect" [attr.aria-label]="'Search criteria' | tr" [(ngModel)]="criterion">
                @for (c of criteria; track c) {
                  <option [value]="c">{{ c | tr }}</option>
                }
              </select>

              <span class="scsearch">
                <span class="scsearch__prefix">+34</span>
                <input
                  class="scsearch__input"
                  type="text"
                  [placeholder]="'action::Search' | tr"
                  [attr.aria-label]="'Search customer' | tr"
                  [ngModel]="term()"
                  (ngModelChange)="term.set($event)"
                />
                <button class="scsearch__go" type="button" [attr.aria-label]="'action::Search' | tr">
                  <img
                    src="icons/general/buscar.svg"
                    width="13"
                    height="13"
                    alt=""
                    aria-hidden="true"
                  />
                </button>
              </span>
            </div>

            <!-- Los dos paneles de resultados salen VACÍOS hasta que se busca; en
                 la real también, y ocupan su alto igualmente. -->
            <div class="scmodal__card scmodal__card--customer"></div>
            <div class="scmodal__card scmodal__card--tickets"></div>
          </div>

          <footer class="scmodal__foot">
            <button class="scbtn scbtn--cancel" type="button" (click)="cancelled.emit()">
              {{ 'Cancel' | tr }}
            </button>
            <button class="scbtn scbtn--assign" type="button" (click)="cancelled.emit()">
              {{ 'Assign' | tr }}
            </button>
          </footer>
        </div>
      </div>
    </div>
  `,
  styleUrl: './search-customer-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchCustomerModalComponent {
  readonly cancelled = output<void>();

  /** Sólo su país; la lista depende de la entidad del ticket. */
  protected readonly countries = ['Spain (+34)'];

  /** Los siete criterios del original, en su orden. */
  protected readonly criteria = [
    'Msisdn',
    'Alias',
    'Email',
    'Accountid',
    'Externalid',
    'Operationid',
    'Cardlast4',
  ];

  protected country = this.countries[0];
  protected criterion = this.criteria[0];
  protected readonly term = signal('');

  protected onBackdrop(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).classList.contains('scmodal')) this.cancelled.emit();
  }
}
