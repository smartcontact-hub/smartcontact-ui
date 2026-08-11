import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { GROUPS, GROUPS_TOTALS, GroupRow } from '../../data/seed';

/**
 * Vista Dashboard: 4 tarjetas KPI (Workload · Contacts · Session · Tickets
 * completed) + tabla Groups + panel Tickets.
 *
 * Medido del real: las KPI cards viven sobre el lienzo `#f4f6fc` en tarjetas
 * blancas de radio 12; la tabla Groups repite el chrome de la de Tickets.
 *
 * La tabla Groups **no era una maqueta en la real**, y aquí sí lo era: Rafa lo
 * cazó («nada es clicable en lo nuestro»). Comprobado en la app viva:
 *
 *   · las NUEVE cabeceras ordenan — el clic cicla asc → desc → sin orden
 *   · "Search groups" es un `input` que filtra (aquí era un `<span>` pintado)
 *   · el icono de la derecha abre un panel con UNA CASILLA POR COLUMNA
 *   · el pie va en INGLÉS ("results", "Rows per page"), no en castellano
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  protected readonly totals = GROUPS_TOTALS;

  protected readonly groupCols = [
    'Group name',
    'My assigned',
    'Total workload',
    'New',
    'Updated',
    'Pending',
    'Emails sent',
    'SMS sent',
    'Total actions',
  ];

  /** Rótulo de columna → campo de la fila. */
  private readonly field: Record<string, keyof GroupRow> = {
    'Group name': 'name',
    'My assigned': 'myAssigned',
    'Total workload': 'totalWorkload',
    New: 'created',
    Updated: 'updated',
    Pending: 'pending',
    'Emails sent': 'emailsSent',
    'SMS sent': 'smsSent',
    'Total actions': 'totalActions',
  };

  protected cell(row: GroupRow, col: string): string | number {
    return row[this.field[col]];
  }

  /* ── Buscador ───────────────────────────────────────────────────────────*/
  protected readonly query = signal('');

  /* ── Orden ──────────────────────────────────────────────────────────────
   * Tres estados por columna, como en la real: ascendente → descendente →
   * ninguno (vuelve al orden de origen). */
  protected readonly sortBy = signal<string | null>(null);
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected sort(col: string): void {
    if (this.sortBy() !== col) {
      this.sortBy.set(col);
      this.sortDir.set('asc');
      return;
    }
    if (this.sortDir() === 'asc') {
      this.sortDir.set('desc');
      return;
    }
    this.sortBy.set(null);
  }

  /* ── Columnas ocultables ────────────────────────────────────────────────*/
  protected readonly colsOpen = signal(false);
  protected readonly hidden = signal<ReadonlySet<string>>(new Set());

  protected toggleColumn(col: string): void {
    this.hidden.update((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }

  protected readonly visibleCols = computed(() =>
    this.groupCols.filter((c) => !this.hidden().has(c)),
  );

  /** Las filas ya filtradas y ordenadas. */
  protected readonly rows = computed<GroupRow[]>(() => {
    const q = this.query().trim().toLowerCase();
    const out = q ? GROUPS.filter((g) => g.name.toLowerCase().includes(q)) : [...GROUPS];

    const by = this.sortBy();
    if (!by) return out;

    const key = this.field[by];
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return out.sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  });
}
