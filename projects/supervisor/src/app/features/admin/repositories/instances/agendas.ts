import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { type GroupRef } from '@smartcontact-hub/components';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';

import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig } from '../components/repo-types';
import { type Agenda, AgendasStore } from '../state/agendas.store';

/** Las columnas: nombre, cuántos contactos, a quién se asigna y cuándo se tocó por última vez. Sin Estado (activa o
 *  inactiva no aportaba: para una nueva se duplica una) ni fecha de creación (una agenda cambia con el tiempo, y lo que
 *  ayuda es saber cuándo se modificó). */
const columnas = (asignadosDe: (agenda: Agenda) => readonly GroupRef[]): readonly RepoColumnDef<Agenda>[] => [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    // Sin ancho: es la columna que crece. Lo era `numbers`, un texto largo; una cifra no lo necesita, y sin ninguna
    // columna libre el sobrante se reparte también en la de selección, que deja de medir 40.
    emphasis: true,
  },
  {
    // Cuántos contactos tiene (DD-163); los contactos, en su editor.
    key: 'contacts',
    labelKey: 'repositories.agendas.contacts',
    kind: 'count',
    width: '112px',
    accessor: (i) => String(i.contacts.length),
  },
  {
    // A quién se asigna (DD-211 §1): los grupos enteros y, detrás, los agentes que la tienen sueltos, con el mismo
    // desplegable que Tipificaciones: «—» sin ninguno, el nombre si es uno, y con varios la cifra y, al pasar, cuáles.
    key: 'groups',
    labelKey: 'repositories.agendas.col_groups_agents',
    kind: 'groups',
    width: '9rem',
    accessor: (i) => String(asignadosDe(i).length),
    groups: asignadosDe,
    groupsAriaKey: 'repositories.agendas.assigned_aria',
  },
  {
    key: 'updatedAt',
    labelKey: 'repositories.columns.modified',
    kind: 'date',
    width: '9.5rem',
    accessor: (i) => i.updatedAt,
  },
];

/** Lo que se pide al crear una agenda desde el «+» de la ficha de grupo; los contactos se añaden en su editor. */
export const AGENDA_FIELDS: readonly RepoFieldDef[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.agendas.name_placeholder',
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
  private readonly groupsStore = inject(GroupsStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly linksStore = inject(GroupAgentLinksStore);

  /** Los grupos que la tienen enteros (lo dice cada grupo) y los agentes que la tienen sueltos, sin los que ya la
   *  tienen por uno de esos grupos: como lo enseña el árbol del editor. */
  private readonly asignadosDe = (agenda: Agenda): readonly GroupRef[] => {
    const grupos = this.groupsStore.groups().filter((g) => g.schedules?.includes(agenda.id));
    const enteros = new Set(grupos.map((g) => g.id));
    const cubiertos = new Set(this.linksStore.links().filter((l) => enteros.has(l.groupId)).map((l) => l.agentId));
    const agentes = this.agentsStore.agents().filter((a) => a.schedules?.includes(agenda.id) && !cubiertos.has(a.id));
    return [
      ...grupos.map((g) => ({ id: g.id, name: g.name, active: true })),
      ...agentes.map((a) => ({ id: a.id, name: a.name, active: true })),
    ];
  };

  protected readonly config: RepoPageConfig<Agenda> = {
    titleKey: 'repositories.agendas.title',
    entitySingularKey: 'repositories.agendas.singular',
    createTitleKey: 'repositories.agendas.create_title',
    entityPluralKey: 'repositories.agendas.plural',
    icon: 'call',
    breadcrumbExtraKey: 'repositories.agendas.title',
    columns: columnas(this.asignadosDe),
    fields: AGENDA_FIELDS,
    searchKeys: ['name', 'description'],
    filePrefix: 'agendas',
    sheetNameKey: 'repositories.agendas.title',
    editRoute: '/admin/agendas',
    duplicable: true,
    columnChoices: true,
    modifiedField: 'updatedAt',
  };
}
