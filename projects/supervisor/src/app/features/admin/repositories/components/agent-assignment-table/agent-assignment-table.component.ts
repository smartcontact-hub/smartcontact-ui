import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, type TemplateRef, viewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent as DatatableComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScSearchComponent as SearchComponent,
  ScSelectButtonComponent as SelectbuttonComponent,
} from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';
import { CeldaVaciaComponent, PresenceAvatarComponent } from '@shared/components';
import type { Agent } from '@features/admin/agents/data/agents-data';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';

type Filtro = 'all' | 'assigned';

/** Una fila: el agente y los nombres de los grupos a los que pertenece (solo información). */
interface Fila {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly photo?: string;
  readonly grupos: readonly string[];
}

/**
 * A QUÉ AGENTES SE ASIGNA una agenda o una plantilla (COA SISMAC-4440 y SISMAC-4438): una tabla plana de agentes con su
 * casilla, su email y los grupos a los que pertenecen. Se asigna SOLO a agentes: marcar uno no marca a su grupo ni al
 * resto de agentes de él. La columna «Grupos» existe para buscar por grupo y marcar de golpe a los que salen (la casilla
 * de la cabecera marca los agentes que se ven).
 *
 * Es la tabla de una sección con campos encima, así que va como la de contactos: sin paginador, con un alto y su scroll.
 * Solo pinta y avisa; quien guarda es el editor, que recibe los ids asignados.
 */
@Component({
  selector: 'sc-agent-assignment-table',
  imports: [
    CeldaVaciaComponent,
    DatatableComponent,
    EmptyStateComponent,
    PresenceAvatarComponent,
    SearchComponent,
    SelectbuttonComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './agent-assignment-table.component.html',
  styleUrl: './agent-assignment-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentAssignmentTableComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly groupsStore = inject(GroupsStore);
  private readonly linksStore = inject(GroupAgentLinksStore);

  readonly agents = input.required<readonly Agent[]>();
  /** Los ids de los agentes que la tienen asignada. */
  readonly assigned = input.required<readonly number[]>();
  /** Qué se asigna («la agenda», «la plantilla»), para el lector de pantalla de cada casilla. */
  readonly rowAriaKey = input.required<string>();
  readonly assignedChange = output<readonly number[]>();

  protected readonly query = signal('');
  protected readonly filter = signal<Filtro>('all');

  private readonly asignados = computed(() => new Set(this.assigned()));

  private readonly filas = computed<readonly Fila[]>(() => {
    const grupos = new Map(this.groupsStore.groups().map((g) => [g.id, g.name]));
    const porAgente = new Map<number, string[]>();
    for (const v of this.linksStore.links()) {
      const nombre = grupos.get(v.groupId);
      if (nombre) porAgente.set(v.agentId, [...(porAgente.get(v.agentId) ?? []), nombre]);
    }
    return this.agents().map((a) => ({ id: a.id, name: a.name, email: a.email ?? '', photo: a.photo, grupos: porAgente.get(a.id) ?? [] }));
  });

  /** Lo que se ve: con texto, los agentes que casan en cualquier columna; con «Asignados», solo los marcados. */
  protected readonly visibles = computed<readonly Fila[]>(() => {
    const q = this.query().trim().toLowerCase();
    const soloAsignados = this.filter() === 'assigned';
    const asignados = this.asignados();
    return this.filas().filter(
      (f) =>
        (!soloAsignados || asignados.has(f.id)) &&
        (!q || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.grupos.some((g) => g.toLowerCase().includes(q))),
    );
  });

  /** Los marcados entre los que se ven: la casilla de la cabecera y las de las filas leen de aquí. */
  protected readonly seleccion = computed(() => this.visibles().filter((f) => this.asignados().has(f.id)));

  /**
   * La tabla avisa con los marcados ENTRE LOS QUE SE VEN (la casilla de la cabecera sustituye la selección por las
   * filas visibles): los asignados que el filtro esconde se conservan tal cual.
   */
  protected onSelection(seleccion: unknown): void {
    const marcados = new Set((Array.isArray(seleccion) ? (seleccion as readonly Fila[]) : []).map((f) => f.id));
    const vistos = new Set(this.visibles().map((f) => f.id));
    const ocultos = this.assigned().filter((id) => !vistos.has(id));
    this.assignedChange.emit([...ocultos, ...marcados].sort((a, b) => a - b));
  }

  protected readonly filterOptions = computed(() => {
    this.lang();
    return [
      { label: this.translate.instant('repositories.agent_assignment.filter_all'), value: 'all' },
      {
        label: this.translate.instant('repositories.agent_assignment.filter_assigned', { count: this.assigned().length }),
        value: 'assigned',
      },
    ];
  });

  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('nameTpl');
  private readonly groupsTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('groupsTpl');
  private readonly emailTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('emailTpl');

  protected readonly columns = computed<readonly ScColumnDef<Fila>[]>(() => {
    this.lang();
    const t = (k: string) => this.translate.instant(k);
    return [
      { field: 'name', header: t('repositories.columns.name'), rowHeader: true, cellTemplate: this.nameTpl() },
      { field: 'email', header: t('repositories.agent_assignment.email'), cellTemplate: this.emailTpl() },
      { field: 'grupos', header: t('repositories.columns.groups'), cellTemplate: this.groupsTpl() },
    ];
  });

  protected readonly rowAria = (fila: Fila): string => {
    this.lang();
    return this.translate.instant(this.rowAriaKey(), { name: fila.name });
  };

  protected readonly selectAllAria = computed(() => {
    this.lang();
    return this.translate.instant('repositories.agent_assignment.select_all_aria');
  });

  protected gruposTexto(fila: Fila): string {
    return fila.grupos.join(', ');
  }
}
