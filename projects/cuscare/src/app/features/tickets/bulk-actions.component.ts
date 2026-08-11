import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ASSIGNABLE_AGENTS, TicketRow } from '../../data/seed';

/** Las cuatro acciones en bloque, en el orden del original. */
export type BulkAction = 'assign' | 'status' | 'unsubscribe' | 'archive';

/**
 * Acciones en bloque de la tabla de Tickets.
 *
 * Extraído de la app real **leyendo el DOM, sin ejecutar ninguna acción**: los
 * cuatro paneles y sus modales viven en el árbol desde el arranque (ocultos),
 * así que se pudieron medir sin pulsar nada que tocase un ticket. Para lo que sí
 * exigía tener algo marcado se seleccionó un ticket de 2023 ya cerrado.
 *
 * Lo que descubrió esa lectura, y que NO se habría adivinado:
 *
 * 1. **No son cuatro menús iguales.** Cada botón abre una cosa distinta:
 *    · `Assign`      → panel con buscador + lista de 34 agentes + botón Assign
 *    · `Change status` → panel con un desplegable de DOS opciones (Pending /
 *                        Resolved), un enlace "Spam" en rojo y "Accept"
 *    · `Unsubscribe` → panel con UN radio ("Unsubscribe all products")
 *    · `Archive`     → NO abre panel: va directo al modal de confirmación
 *    (en la real son cuatro componentes distintos: `app-bulk-assign`,
 *    `app-bulk-change-status`, `app-bulk-unsubscribe`, `app-bulk-archived`).
 *
 * 2. **Los paneles son OSCUROS** (#5f6776) dentro de una app clara. Es el único
 *    sitio de CusCare donde pasa.
 *
 * 3. Después de cada panel viene un **modal de confirmación común** que lista
 *    los tickets afectados en una tabla Material de 8 columnas.
 *
 * Métrica medida @1460×792 — ver los comentarios del SCSS hermano.
 *
 * ⚠️ Lo único NO medido: que el botón del pie de cada panel abra el modal en vez
 * de ejecutar directamente. Se DEDUCE de que el modal de confirmación existe
 * dentro de cada componente y su texto termina en "to" (queda esperando destino).
 * Comprobarlo exigía pulsar y eso sí actúa sobre tickets reales.
 */
@Component({
  selector: 'app-bulk-actions',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './bulk-actions.component.html',
  styleUrl: './bulk-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkActionsComponent {
  /** Filas marcadas: alimentan el contador y la tabla del modal. */
  readonly selected = input.required<readonly TicketRow[]>();

  /** Se emite al confirmar en el modal — la página limpia la selección. */
  readonly applied = output<BulkAction>();

  protected readonly count = computed(() => this.selected().length);
  protected readonly enabled = computed(() => this.count() > 0);

  /** Los cuatro disparadores, en el orden del original. */
  protected readonly triggers: readonly { id: BulkAction; label: string }[] = [
    { id: 'assign', label: 'Assign' },
    { id: 'status', label: 'Change status' },
    { id: 'unsubscribe', label: 'Unsubscribe' },
    { id: 'archive', label: 'Archive' },
  ];

  /* ── Panel abierto ──────────────────────────────────────────────────────
   * Sólo uno a la vez; abrir otro cierra el anterior (como en la real). */
  protected readonly open = signal<BulkAction | null>(null);

  protected toggle(action: BulkAction): void {
    if (!this.enabled()) return;
    // Archive no tiene panel: pulsa y sale el modal de confirmación.
    if (action === 'archive') {
      this.open.set(null);
      this.modal.set('archive');
      return;
    }
    this.open.update((prev) => (prev === action ? null : action));
    this.statusListOpen.set(false);
  }

  protected close(): void {
    this.open.set(null);
    this.statusListOpen.set(false);
  }

  /* ── Panel "Assign" ─────────────────────────────────────────────────────
   * 34 agentes con buscador. El buscador filtra de verdad. */
  protected readonly agentQuery = signal('');
  protected readonly agent = signal<string | null>(null);

  protected readonly agents = computed(() => {
    const q = this.agentQuery().trim().toLowerCase();
    return q ? ASSIGNABLE_AGENTS.filter((a) => a.toLowerCase().includes(q)) : ASSIGNABLE_AGENTS;
  });

  /* ── Panel "Change status" ──────────────────────────────────────────────
   * Sólo DOS opciones, no las cuatro de la columna Status: la real ofrece
   * Pending y Resolved (y "Spam" aparte, como enlace). */
  protected readonly statusOptions = ['Pending', 'Resolved'] as const;
  protected readonly statusListOpen = signal(false);
  protected readonly status = signal<string | null>(null);

  protected pickStatus(s: string): void {
    this.status.set(s);
    this.statusListOpen.set(false);
  }

  /* ── Panel "Unsubscribe" ────────────────────────────────────────────────
   * Un único radio, ya marcado al abrir. */
  protected readonly unsubAll = signal(true);

  /* ── Modal de confirmación ──────────────────────────────────────────────*/
  protected readonly modal = signal<BulkAction | null>(null);

  protected confirmFromPanel(action: BulkAction): void {
    this.open.set(null);
    this.statusListOpen.set(false);
    this.modal.set(action);
  }

  protected closeModal(): void {
    this.modal.set(null);
  }

  protected apply(): void {
    const a = this.modal();
    this.modal.set(null);
    this.agent.set(null);
    this.status.set(null);
    if (a) this.applied.emit(a);
  }

  /** Rótulos del modal, con el texto EXACTO del original. */
  protected readonly modalTitle = computed(() => {
    switch (this.modal()) {
      case 'assign':
        return 'Assign';
      case 'status':
        return 'Change status';
      case 'unsubscribe':
        return 'Unsubscribe';
      case 'archive':
        return 'Archive';
      default:
        return '';
    }
  });

  protected readonly modalSubtitle = computed(() => {
    const n = this.count();
    switch (this.modal()) {
      case 'assign':
        return `You will assign the following ${n} tickets to`;
      case 'status':
        return `You will change the status of the next ${n} tickets to`;
      case 'unsubscribe':
        return `You will unsubscribe the following ${n} tickets`;
      case 'archive':
        return `You will archive the following ${n} tickets`;
      default:
        return '';
    }
  });

  /** El botón azul repite el nombre de la acción (medido en los cuatro). */
  protected readonly modalCta = computed(() => this.modalTitle());

  /** Backdrop: cerrar sólo si el clic cae fuera del diálogo. */
  protected onBackdrop(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).classList.contains('cmodal')) this.closeModal();
  }
}
