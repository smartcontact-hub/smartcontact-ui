import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig } from '../components/repo-types';
import { type Agenda, AgendasStore } from '../state/agendas.store';

const COLUMNS: readonly RepoColumnDef<Agenda>[] = [
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
    key: 'status',
    labelKey: 'repositories.columns.status',
    kind: 'status',
    width: '96px',
    accessor: (i) => i.status,
    statusMap: {
      active: { labelKey: 'repositories.status.active', tone: 'success' },
      inactive: { labelKey: 'repositories.status.inactive', tone: 'secondary' },
    },
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
  {
    key: 'status',
    labelKey: 'repositories.columns.status',
    type: 'select',
    options: [
      { value: 'active', labelKey: 'repositories.status.active' },
      { value: 'inactive', labelKey: 'repositories.status.inactive' },
    ],
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
  protected readonly config: RepoPageConfig<Agenda> = {
    titleKey: 'repositories.agendas.title',
    entitySingularKey: 'repositories.agendas.singular',
    createTitleKey: 'repositories.agendas.create_title',
    entityPluralKey: 'repositories.agendas.plural',
    icon: 'call',
    breadcrumbExtraKey: 'repositories.agendas.title',
    columns: COLUMNS,
    fields: AGENDA_FIELDS,
    searchKeys: ['name', 'description'],
    filePrefix: 'agendas',
    sheetNameKey: 'repositories.agendas.title',
    editRoute: '/admin/agendas',
  };
}
