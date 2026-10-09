import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig } from '../components/repo-types';
import { type Equipo, EquiposStore } from '../state/equipos.store';

/** Lo que se escribe de un equipo: nombre y descripción. Lo comparte la ventana de crear y editar de Recursos. */
export const EQUIPO_FIELDS: readonly RepoFieldDef[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.equipos.name_placeholder',
  },
  {
    key: 'description',
    labelKey: 'repositories.columns.description',
    type: 'text',
    placeholderKey: 'repositories.placeholders.description',
  },
];

/** Repositorios › Equipos (`equipos.store.ts`): se crean aquí y se asignan en la ficha de agente. */
@Component({
  selector: 'sc-equipos-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquiposPageComponent {
  protected readonly store = inject(EquiposStore);
  private readonly agents = inject(AgentsStore);

  /** Cuántos agentes lleva cada uno: lo único que dice de él, aparte de su nombre. */
  private readonly columns: readonly RepoColumnDef<Equipo>[] = [
    { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (i) => i.name, emphasis: true },
    {
      key: 'description',
      labelKey: 'repositories.columns.description',
      kind: 'truncate',
      accessor: (i) => i.description,
      width: '320px',
    },
    {
      key: 'agents',
      labelKey: 'repositories.equipos.agents',
      kind: 'count',
      accessor: (i) => String(this.agents.agents().filter((a) => a.teams?.includes(i.id)).length),
      width: '112px',
    },
  ];

  protected readonly config: RepoPageConfig<Equipo> = {
    titleKey: 'repositories.equipos.title',
    entitySingularKey: 'repositories.equipos.singular',
    createTitleKey: 'repositories.equipos.create_title',
    entityPluralKey: 'repositories.equipos.plural',
    icon: 'group_work',
    breadcrumbExtraKey: 'repositories.equipos.title',
    columns: this.columns,
    fields: EQUIPO_FIELDS,
    searchKeys: ['name', 'description'],
    filePrefix: 'equipos',
    sheetNameKey: 'repositories.equipos.title',
    // Su editor, con sus agentes: la fila lo abre, y «Crear» va a su alta (como Voice).
    editRoute: '/admin/equipos',
  };
}
