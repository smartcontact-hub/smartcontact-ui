import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

/**
 * Modal "Ticket Status" — el que abre el pill de estado del detalle.
 *
 * Medido abriéndolo en la app real (abrir no guarda nada; se cerró con "Close").
 * Dos columnas que no se adivinan desde fuera:
 *
 *   · **Nature of demand** — DIEZ casillas, no un desplegable, y son casillas
 *     (múltiple), no radios: un ticket puede ser varias cosas a la vez.
 *   · **Status** — sólo DOS radios, Pending y Resolved. Las mismas dos que ofrece
 *     la acción en bloque, y ninguna de las otras que sí aparecen en la columna
 *     Status de la tabla (`new`, `open`, `closed`): esas las pone el sistema, no
 *     el agente.
 *
 * Y en el pie, aparte de Close/Save, una casilla suelta: **GDPR pending**.
 */
@Component({
  selector: 'app-ticket-status-modal',
  standalone: true,
  template: `
    <div class="tsmodal" (click)="onBackdrop($event)">
      <div class="tsmodal__dialog" role="dialog" aria-modal="true" aria-label="Ticket Status">
        <div class="tsmodal__content">
          <header class="tsmodal__head">
            <h4 class="tsmodal__title">Ticket Status</h4>
            <!-- «Close dialog», no «Close»: este modal tiene ADEMÁS un botón de
                 producto llamado Close (cerrar el ticket). Con el mismo nombre,
                 quien navega por voz o lector de pantalla oye dos «Close» y no
                 sabe cuál cierra qué. -->
            <button class="tsmodal__x" type="button" aria-label="Close dialog" (click)="closed.emit()">
              ×
            </button>
          </header>

          <div class="tsmodal__body">
            <section class="tscol">
              <span class="tscol__label">Nature of demand</span>
              <div class="tsbox tsbox--nature">
                @for (n of natures; track n) {
                  <label class="tscheck">
                    <input
                      type="checkbox"
                      [checked]="picked().has(n)"
                      (change)="toggleNature(n)"
                    />
                    <span>{{ n }}</span>
                  </label>
                }
              </div>
            </section>

            <section class="tscol">
              <span class="tscol__label">Status</span>
              <div class="tsbox tsbox--status">
                @for (s of statuses; track s) {
                  <label class="tsradio">
                    <input
                      type="radio"
                      name="cc-ticket-status"
                      [checked]="status() === s"
                      (change)="status.set(s)"
                    />
                    <span>{{ s }}</span>
                  </label>
                }
              </div>
            </section>
          </div>

          <footer class="tsmodal__foot">
            <label class="tscheck tscheck--gdpr">
              <input type="checkbox" [checked]="gdpr()" (change)="gdpr.set(!gdpr())" />
              <span>GDPR pending</span>
            </label>
            <span class="tsmodal__actions">
              <button class="tsbtn tsbtn--close" type="button" (click)="closed.emit()">Close</button>
              <button class="tsbtn tsbtn--save" type="button" (click)="closed.emit()">Save</button>
            </span>
          </footer>
        </div>
      </div>
    </div>
  `,
  styleUrl: './ticket-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketStatusModalComponent {
  readonly closed = output<void>();

  /** Las diez del original, en su orden. */
  protected readonly natures = [
    'Unsubscription',
    'Refund',
    'GDPR access',
    'GDPR Forgotten',
    'Withdrawal Right',
    'Information',
    'Product problem',
    'Log problem',
    'Pending to define',
    'Others',
  ];

  /** Sólo dos: el resto de estados los pone el sistema. */
  protected readonly statuses = ['Pending', 'Resolved'];

  protected readonly picked = signal<ReadonlySet<string>>(new Set());
  protected readonly status = signal<string | null>(null);
  protected readonly gdpr = signal(false);

  protected toggleNature(n: string): void {
    this.picked.update((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  protected onBackdrop(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).classList.contains('tsmodal')) this.closed.emit();
  }
}
