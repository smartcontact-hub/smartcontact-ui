import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ENTITIES } from '../../data/seed';

/**
 * Modal de "+ New ticket".
 *
 * Sorpresa al abrirlo en la real: **no es un formulario de ticket**, es un
 * selector de GRUPO — "Select a group for this ticket", buscador, una lista con
 * radios (un grupo por fila) y Cancel/Save. El formulario vendrá después, en un
 * segundo paso que no se ha capturado (habría que pulsar Save y eso crea un
 * ticket de verdad en su sistema).
 *
 * Métrica MEDIDA @1460×792:
 *   backdrop  rgba(22,22,22,.494)
 *   diálogo   1095×617.4 en x=182.5 y=20.4 · fondo #f4f6fc (¡el del lienzo, no
 *             blanco!) · radio 12.16 · padding 29.65 · sin sombra
 *   título    Open Sans 14.6/500 #212529
 *   buscador  135.4×22.8 · borde #cfd3de · radio 9 · placeholder "Search..."
 *   radios    nativos de 13px, sin estilar (appearance: auto)
 *   Save      #233155, borde #11131a, radio 9.125, 60.4×28.6
 *   Cancel    transparente, borde y texto #8d939d
 */
@Component({
  selector: 'app-new-ticket-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="modal" (click)="onBackdrop($event)">
      <div class="dialog" role="dialog" aria-modal="true" aria-label="Select a group for this ticket">
        <div class="panel">
          <header class="panel__head">
            <h2 class="panel__title">Select a group for this ticket</h2>
            <input
              class="panel__search"
              type="text"
              placeholder="Search..."
              aria-label="Search group"
              [ngModel]="query()"
              (ngModelChange)="query.set($event)"
            />
          </header>

          <ul class="grouplist" role="radiogroup" aria-label="Groups">
            @for (g of visible(); track g.groupName) {
              <li class="grouprow">
                <label class="grouprow__label">
                  <input
                    class="grouprow__radio"
                    type="radio"
                    name="cc-group"
                    [value]="g.groupName"
                    [checked]="selected() === g.groupName"
                    (change)="selected.set(g.groupName)"
                  />
                  <span class="grouprow__name">{{ g.groupName }}</span>
                </label>
              </li>
            } @empty {
              <li class="grouplist__empty">Sin grupos para «{{ query() }}»</li>
            }
          </ul>
        </div>

        <footer class="dialog__foot">
          <button class="btn btn--cancel" type="button" (click)="cancelled.emit()">Cancel</button>
          <button class="btn btn--save" type="button" [disabled]="!selected()" (click)="save()">
            Save
          </button>
        </footer>
      </div>
    </div>
  `,
  styleUrl: './new-ticket-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewTicketModalComponent {
  readonly cancelled = output<void>();
  readonly confirmed = output<string>();

  protected readonly query = signal('');
  protected readonly selected = signal<string | null>(null);

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? ENTITIES.filter((e) => e.groupName.toLowerCase().includes(q)) : ENTITIES;
  });

  protected save(): void {
    const g = this.selected();
    if (g) this.confirmed.emit(g);
  }

  /** Clic en el fondo = cerrar (no en el diálogo). */
  protected onBackdrop(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).classList.contains('modal')) this.cancelled.emit();
  }
}
