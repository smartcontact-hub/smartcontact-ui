import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output, signal, type TemplateRef, viewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent as DatatableComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScSearchComponent as SearchComponent,
  ScSelectButtonComponent as SelectbuttonComponent,
} from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';
import { CeldaVaciaComponent } from '@shared/components';
import type { Agent } from '@features/admin/agents/data/agents-data';

type Filtro = 'all' | 'assigned';

/**
 * LOS AGENTES QUE VEN ESTA AGENDA. En Voice era un muro de casillas con todos los agentes; con cientos (el Supervisor
 * de ejemplo lleva 500) no sirve. Aquí es la tabla de siempre: buscador, un filtro «Todos / Asignados (n)» para ver
 * solo los que ya la tienen, una casilla por agente y paginador. La casilla de la cabecera marca o desmarca lo que se ve
 * (lo filtrado), no todos. Solo pinta y avisa: quien guarda es el editor.
 */
@Component({
  selector: 'sc-agenda-agents-table',
  imports: [CeldaVaciaComponent, DatatableComponent, EmptyStateComponent, SearchComponent, SelectbuttonComponent, TranslateModule],
  templateUrl: './agenda-agents-table.component.html',
  styleUrl: './agenda-agents-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaAgentsTableComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly agents = input.required<readonly Agent[]>();
  /** Los ids de los agentes asignados. */
  readonly selected = input.required<readonly number[]>();
  readonly selectedChange = output<readonly number[]>();

  protected readonly query = signal('');
  protected readonly filter = signal<Filtro>('all');

  private readonly selectedSet = computed(() => new Set(this.selected()));

  protected readonly filterOptions = computed(() => {
    this.lang();
    return [
      { label: this.translate.instant('repositories.agendas.agents_filter_all'), value: 'all' },
      {
        label: this.translate.instant('repositories.agendas.agents_filter_assigned', { count: this.selected().length }),
        value: 'assigned',
      },
    ];
  });

  protected readonly visibles = computed(() => {
    const q = this.query().trim().toLowerCase();
    const set = this.selectedSet();
    return this.agents().filter(
      (a) =>
        (this.filter() === 'all' || set.has(a.id)) &&
        (!q || a.name.toLowerCase().includes(q) || (a.email ?? '').toLowerCase().includes(q)),
    );
  });

  /** Las filas marcadas entre las que se ven: lo que pinta la tabla. */
  protected readonly marcadas = computed(() => this.visibles().filter((a) => this.selectedSet().has(a.id)));

  /** La página abierta: vuelve a la primera al buscar o cambiar el filtro. */
  protected readonly first = linkedSignal<{ readonly q: string; readonly f: Filtro }, number>({
    source: () => ({ q: this.query(), f: this.filter() }),
    computation: () => 0,
  });

  protected readonly rowLabel = (agent: Agent): string =>
    this.translate.instant('repositories.agendas.agents_row_aria', { name: agent.name });

  private readonly emailTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('emailTpl');

  /** Nombre y email, sin el código de agente: es de posventa y aquí sobraba (revisión de producto del 2026-10-15). */
  protected readonly columns = computed<readonly ScColumnDef<Agent>[]>(() => {
    this.lang();
    return [
      { field: 'name', header: this.translate.instant('repositories.columns.name'), rowHeader: true },
      { field: 'email', header: this.translate.instant('repositories.agendas.agents_email'), cellTemplate: this.emailTpl() },
    ];
  });

  protected readonly summary = computed(() => {
    this.lang();
    return this.translate.instant('repositories.agendas.agents_summary', { count: this.selected().length, total: this.agents().length });
  });

  /** Lo marcado entre lo que se ve se suma a lo asignado fuera de la vista (filtro o búsqueda): no se pierde. */
  protected onSelectionChange(selection: unknown): void {
    const rows = Array.isArray(selection) ? (selection as readonly Agent[]) : [];
    const vistos = new Set(this.visibles().map((a) => a.id));
    const fuera = this.selected().filter((id) => !vistos.has(id));
    this.selectedChange.emit([...fuera, ...rows.map((a) => a.id)].sort((a, b) => a - b));
  }
}
