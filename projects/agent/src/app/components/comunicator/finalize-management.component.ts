import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AgentStateService } from '../../agent-state.service';
import { PENDING, type PendingRow } from '../../data/seed';

/**
 * Sección «Finalizar gestión» — el último paso del flujo (lost-conversations-management).
 *
 * Las medidas salen del CSS del BUNDLE de la app real (chunk-RBZTQGX6), que es lo que
 * de verdad se renderiza: el chip .pending-summary es full-container (width 100%) con el
 * texto centrado, la fila "Seleccionar todas" y su separador solo aparecen con mas de una
 * conversacion, y las casillas nacen sin marcar. Ver projects/agent/docs/comunicador.md.
 */
@Component({
  selector: 'app-finalize-management',
  standalone: true,
  template: `
    <div class="fin">
      <div class="fin__head">
        <span class="fin__title">Finalizar gestión</span>
      </div>

      <div class="fin__body">
        <div class="fin__chip">
          <span class="fin__warn"></span>
          <span>
            <strong>{{ rows().length }}</strong>
            {{
              rows().length === 1
                ? 'conversación pendiente'
                : 'conversaciones pendientes'
            }}
          </span>
        </div>

        @if (rows().length > 1) {
        <label class="fin__row">
          <input
            type="checkbox"
            [checked]="allChecked()"
            (change)="toggleAll()"
          />
          <span>Seleccionar todas</span>
        </label>
        <div class="fin__sep"></div>
        }

        <div class="fin__list">
          @for (r of rows(); track r.id) {
          <label class="fin__row">
            <input
              type="checkbox"
              [checked]="picked().includes(r.id)"
              (change)="toggle(r.id)"
            />
            <span>{{ label(r) }}</span>
          </label>
          } @empty {
          <p class="fin__empty">No hay conversaciones pendientes</p>
          }
        </div>
      </div>

      <div class="fin__foot">
        <button
          class="fin__btn"
          type="button"
          [disabled]="!picked().length"
          (click)="state.finish(picked())"
        >
          Finalizar
        </button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .fin {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: #fff;
    }
    /* Cabecera canónica: 3.075vw de alto, título 0.938vw Semibold. */
    .fin__head {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 3.076924vw;
      border-bottom: 0.052198vw solid rgba(0, 0, 0, 0.397);
    }
    .fin__title {
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 0.938187vw;
    }
    /* .container-body — padding 1.231 0.868 0 1.32vw. */
    .fin__body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 1.229396vw 0.865385vw 0 1.318682vw;
    }
    /*
     * .pending-summary del FIGMA (node 47:27651, medidas /14.4): FULL CONTAINER (width
     * 100%), alto 1.806vw (26px), radio 0.903vw (pill), padding 0.278/0.556vw, fondo
     * #24292f. El contenido va centrado.
     */
    .fin__chip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.277778vw;
      width: 100%;
      height: 1.805556vw;
      margin-bottom: 1.25vw;
      padding: 0.277778vw 0.555556vw;
      border-radius: 0.902778vw;
      background: #24292f;
      font-size: 0.803572vw;
      white-space: nowrap;
      box-sizing: border-box;
    }
    .fin__warn {
      width: 1.25vw;
      height: 1.25vw;
      flex: none;
      background-color: #ffc107;
      -webkit-mask: url('/icons/dialpad/warning.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/warning.svg') no-repeat center / contain;
    }
    /* .management-option del bundle: gap 0.365vw, texto 0.6vw, margen inferior 1vw. */
    .fin__row {
      display: flex;
      align-items: center;
      gap: 0.365vw;
      margin-bottom: 1vw;
      font-size: 0.6vw;
      line-height: 0.729vw;
      cursor: pointer;
    }
    .fin__row span {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    /* Casillas blancas con la marca oscura, como el original (sc-checkbox size sm). */
    .fin__row input {
      flex: none;
      width: 0.833vw;
      height: 0.833vw;
      margin: 0;
      accent-color: #fff;
      cursor: pointer;
    }
    /* .management-separator del bundle: 0.026vw en #c6ccd6, margen 0.417 arriba 0.625 abajo. */
    .fin__sep {
      width: 100%;
      height: 0.026vw;
      margin: 0.417vw 0 0.625vw;
      background: #c6ccd6;
    }
    .fin__list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    .fin__empty {
      margin: 0;
      color: var(--ag-text-2);
      font-size: 0.803572vw;
    }
    .fin__foot {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 5.645605vw;
    }
    /* Botón del Figma: 8.49 x 1.875vw, borde blanco, radio 0.625vw, texto 0.8vw. */
    .fin__btn {
      width: 8.489011vw;
      height: 1.875vw;
      border: 0.052198vw solid #fff;
      border-radius: 0.625vw;
      background-color: transparent;
      color: #fff;
      font-family: var(--ag-font);
      font-size: 0.803572vw;
      cursor: pointer;
    }
    .fin__btn:disabled {
      border-color: #5f5f5f;
      color: #5f5f5f;
      cursor: default;
    }
    .fin__btn:hover:not(:disabled) {
      background-color: #9fa2a6;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalizeManagementComponent {
  protected readonly state = inject(AgentStateService);

  /** Solo las que este agente tiene en gestión. */
  protected readonly rows = computed<readonly PendingRow[]>(() => {
    const ids = this.state.inManagement();
    return PENDING.filter((r) => ids.includes(r.id));
  });

  protected readonly picked = signal<readonly number[]>([]);

  protected readonly allChecked = computed(
    () => this.rows().length > 0 && this.picked().length === this.rows().length
  );

  /*
   * Al abrirse, las casillas van SIN marcar, como el original: el agente elige cuales
   * finaliza (con "Seleccionar todas" para marcarlas de golpe). Antes se premarcaban, y
   * por eso no cuadraba 1:1 con la captura del real.
   */

  protected toggle(id: number): void {
    this.picked.update((p) =>
      p.includes(id) ? p.filter((i) => i !== id) : [...p, id]
    );
  }

  protected toggleAll(): void {
    this.picked.set(this.allChecked() ? [] : this.rows().map((r) => r.id));
  }

  /** «26 de agosto - 13:21:31 - Nodo AED…», como en el real. */
  protected label(r: PendingRow): string {
    return `26 de agosto - ${r.date} - ${r.group}`;
  }
}
