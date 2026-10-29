import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AgentsStore } from '@features/admin/agents/state/agents.store';

import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig } from '../components/repo-types';
import { type Agenda, AgendasStore } from '../state/agendas.store';

/** Las columnas del COA SISMAC-4440: nombre, descripción, cuántos contactos, a cuántos agentes se asigna y cuándo se tocó
 *  por última vez. Todas ordenan. Una cifra en 0 y una descripción vacía dicen «—». Sin Estado (activa o inactiva no
 *  aportaba: para una nueva se duplica una) ni fecha de creación (una agenda cambia con el tiempo, y lo que ayuda es
 *  saber cuándo se modificó). */
const columnas = (agentesDe: (agenda: Agenda) => number): readonly RepoColumnDef<Agenda>[] => [
  {
    key: 'name',
    labelKey: 'repositories.agendas.col_title',
    kind: 'text',
    accessor: (i) => i.name,
    // Sin ancho: es la columna que crece.
    emphasis: true,
    sortable: true,
  },
  {
    key: 'description',
    labelKey: 'repositories.columns.description',
    kind: 'truncate',
    accessor: (i) => i.description.trim(),
    emptyDash: true,
    sortable: true,
  },
  {
    // Cuántos contactos tiene (DD-163); los contactos, en su editor.
    key: 'contacts',
    labelKey: 'repositories.agendas.contacts',
    kind: 'count',
    width: '112px',
    accessor: (i) => String(i.contacts.length),
    emptyDash: true,
    sortable: true,
  },
  {
    // A cuántos agentes se asigna (COA SISMAC-4440): solo a agentes, sin globo con sus nombres.
    key: 'agents',
    labelKey: 'repositories.agendas.col_agents',
    kind: 'count',
    width: '112px',
    accessor: (i) => String(agentesDe(i)),
    emptyDash: true,
    sortable: true,
  },
  {
    key: 'updatedAt',
    labelKey: 'repositories.columns.modified',
    kind: 'date',
    width: '9.5rem',
    accessor: (i) => i.updatedAt,
    sortable: true,
  },
];

/** Lo que se pide al crear una agenda desde el «+» de la ficha de grupo; los contactos se añaden en su editor. */
export const AGENDA_FIELDS: readonly RepoFieldDef[] = [
  {
    key: 'name',
    labelKey: 'repositories.agendas.col_title',
    type: 'text',
    required: true,
  },
  {
    key: 'description',
    labelKey: 'repositories.columns.description',
    type: 'text',
    placeholderKey: 'repositories.placeholders.description',
  },
];

@Component({
  selector: 'sc-agendas-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendasPageComponent {
  protected readonly store = inject(AgendasStore);
  private readonly agentsStore = inject(AgentsStore);

  /** Cuántos agentes la tienen asignada: solo cuentan los agentes (los grupos no se cuentan, COA SISMAC-4440). */
  private readonly agentesPorAgenda = computed(() => {
    const cuenta = new Map<number, number>();
    for (const a of this.agentsStore.agents()) for (const id of a.schedules ?? []) cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
    return cuenta;
  });

  protected readonly config: RepoPageConfig<Agenda> = {
    titleKey: 'repositories.agendas.title',
    entitySingularKey: 'repositories.agendas.singular',
    createTitleKey: 'repositories.agendas.create_title',
    entityPluralKey: 'repositories.agendas.plural',
    toastsKey: 'repositories.agendas.toasts',
    simpleDelete: { titleKey: 'repositories.agendas.delete_dialog.title', titleBulkKey: 'repositories.agendas.delete_dialog.title_bulk' },
    icon: 'call',
    breadcrumbExtraKey: 'repositories.agendas.title',
    columns: columnas((agenda) => this.agentesPorAgenda().get(agenda.id) ?? 0),
    fields: AGENDA_FIELDS,
    searchKeys: ['name', 'description'],
    filePrefix: 'agendas',
    sheetNameKey: 'repositories.agendas.title',
    editRoute: '/admin/agendas',
    duplicable: true,
    // Duplicar abre «Nueva agenda» rellena, como Grupos y Agentes: la agenda no existe hasta «Crear».
    duplicateAsCreate: true,
    columnChoices: true,
    modifiedField: 'updatedAt',
  };
}
