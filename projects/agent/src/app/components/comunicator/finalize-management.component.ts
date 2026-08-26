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
 * Sección «Finalizar gestión» — el último paso del flujo (Figma '283:3186').
 *
 * ⚠️ Las medidas NO salen del entorno de desarrollo: allí el panel está maquetado al
 * 75 % por una conversión px→vw contra 1920 cuando el Figma está a 1440. Aquí se usan
 * las del DISEÑO ('px de Figma / 14.4' → vw, y luego 'x 14.56' a la escala de sc-agent),
 * que además caen sobre los valores canónicos del resto del Comunicador.
 * Ver 'projects/agent/docs/comunicador.md'.
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
    /* .pending-summary — 1.806vw de alto, radio 1.389vw, fondo #24292f. */
    .fin__chip {
      display: flex;
      align-items: center;
      gap: 0.274726vw;
      align-self: flex-start;
      height: 1.806319vw;
      margin-bottom: 1.25vw;
      padding: 0.274726vw 0.556319vw;
      border-radius: 1.387363vw;
      background: #24292f;
      font-size: 0.803572vw;
      white-space: nowrap;
      box-sizing: border-box;
    }
    .fin__warn {
      width: 0.940935vw;
      height: 0.940935vw;
      flex: none;
      background-color: #ffc107;
      -webkit-mask: url('/icons/dialpad/warning.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/warning.svg') no-repeat center / contain;
    }
    /* .management-option — gap 0.486vw, texto 0.8vw. */
    .fin__row {
      display: flex;
      align-items: center;
      gap: 0.487638vw;
      margin-bottom: 1.332418vw;
      font-size: 0.803572vw;
      line-height: 0.975275vw;
      cursor: pointer;
    }
    .fin__row span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    /*
     * Casillas: el Figma las dibuja BLANCAS con la marca oscura, no en el azul del
     * Design System. Se replica el diseño.
     */
    .fin__row input {
      flex: none;
      width: 1.085165vw;
      height: 1.085165vw;
      margin: 0;
      accent-color: #fff;
      cursor: pointer;
    }
    .fin__sep {
      height: 0.034341vw;
      margin: 0 0 0.831044vw;
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

  constructor() {
    // Igual que el Figma: al abrirse, llegan todas marcadas.
    queueMicrotask(() => this.picked.set(this.rows().map((r) => r.id)));
  }

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
