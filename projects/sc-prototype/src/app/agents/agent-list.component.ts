import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

// TODO consumido POR NOMBRE desde el paquete publicado — la frontera real.
import {
  type BulkActionEntityLabels,
  type ScColumnCellContext,
  type ScColumnDef,
  ScBulkActionBarComponent,
  ScDatatableComponent,
  ScEmptyStateComponent,
  ScInlineRenameCellComponent,
  ScPageHeaderComponent,
  ScSearchComponent,
  ScTagComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

interface Agent {
  id: number;
  name: string;
  extension: string;
  status: 'active' | 'inactive';
}

const SEED: readonly Agent[] = [
  { id: 1, name: 'Inés García', extension: '101', status: 'active' },
  { id: 2, name: 'Marc Soler', extension: '102', status: 'active' },
  { id: 3, name: 'Lucía Pérez', extension: '103', status: 'inactive' },
  { id: 4, name: 'Diego Romero', extension: '104', status: 'active' },
  { id: 5, name: 'Sara Vidal', extension: '105', status: 'inactive' },
  { id: 6, name: 'Tomás Ruiz', extension: '106', status: 'active' },
  { id: 7, name: 'Elena Marín', extension: '107', status: 'active' },
  { id: 8, name: 'Pablo Navarro', extension: '108', status: 'inactive' },
];

/**
 * Pantalla real de prototipo: lista de agentes. DOGFOOD — compone, consumiendo
 * @smartcontact-hub/* por NOMBRE: sc-page-header + sc-search + sc-datatable
 * (celda de nombre con sc-inline-rename-cell + celda de estado con sc-tag label) +
 * sc-bulk-action-bar + sc-empty-state. Solo sc-* + tokens; cero CSS de chrome propio
 * más allá del layout mínimo.
 */
@Component({
  selector: 'app-agent-list',
  imports: [
    ScPageHeaderComponent,
    ScDatatableComponent,
    ScInlineRenameCellComponent,
    ScBulkActionBarComponent,
    ScSearchComponent,
    ScTagComponent,
    ScEmptyStateComponent,
    ScIconComponent,
  ],
  templateUrl: './agent-list.component.html',
  styleUrl: './agent-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentListComponent {
  // Non-required (como el demo): se resuelven tras view-init; la columna cae a
  // row[field] el primer pase y se actualiza al resolver el template.
  protected readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('nameTpl');
  protected readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('statusTpl');

  protected readonly agents = signal<readonly Agent[]>(SEED);
  protected readonly query = signal('');
  protected readonly selection = signal<readonly Agent[]>([]);
  protected readonly renamingId = signal<number | null>(null);

  protected readonly filtered = computed<readonly Agent[]>(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.agents();
    return this.agents().filter(
      (a) => a.name.toLowerCase().includes(q) || a.extension.includes(q),
    );
  });

  protected readonly columns = computed<readonly ScColumnDef<Agent>[]>(() => [
    { field: 'name', header: 'Nombre', sortable: true, cellTemplate: this.nameTpl() },
    { field: 'extension', header: 'Extensión', sortable: true, width: '10rem', align: 'center' },
    { field: 'status', header: 'Estado', width: '10rem', align: 'center', cellTemplate: this.statusTpl() },
  ]);

  protected readonly entity: BulkActionEntityLabels = { singular: 'agente', plural: 'agentes' };

  protected onSelectionChange(sel: Agent | readonly Agent[] | null): void {
    this.selection.set(Array.isArray(sel) ? (sel as readonly Agent[]) : []);
  }

  protected startRename(agent: Agent): void {
    this.renamingId.set(agent.id);
  }

  protected cancelRename(): void {
    this.renamingId.set(null);
  }

  protected commitRename(agent: Agent, name: string): void {
    this.agents.update((list) => list.map((a) => (a.id === agent.id ? { ...a, name } : a)));
    this.renamingId.set(null);
  }

  protected clearSelection(): void {
    this.selection.set([]);
  }
}
