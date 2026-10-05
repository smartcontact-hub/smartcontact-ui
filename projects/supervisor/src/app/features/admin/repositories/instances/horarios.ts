import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig } from '../components/repo-types';
import { type Horario, HorariosStore } from '../state/horarios.store';

const COLUMNS: readonly RepoColumnDef<Horario>[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    // Sin ancho: es la columna que crece. Con las cuatro medidas, el sobrante se repartía
    // también en la casilla de selección, que dejaba de medir 40 (igual que en agendas.ts).
    emphasis: true,
  },
  {
    key: 'schedule',
    labelKey: 'repositories.horarios.schedule',
    kind: 'text',
    accessor: (i) => i.schedule,
    width: '160px',
  },
  {
    key: 'timezone',
    labelKey: 'repositories.horarios.timezone',
    kind: 'text',
    accessor: (i) => i.timezone,
    width: '160px',
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

const FIELDS: readonly RepoFieldDef[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.horarios.name_placeholder',
  },
  {
    key: 'schedule',
    labelKey: 'repositories.horarios.schedule',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.horarios.schedule_placeholder',
  },
  {
    key: 'timezone',
    labelKey: 'repositories.horarios.timezone',
    type: 'text',
    placeholderKey: 'repositories.horarios.timezone_placeholder',
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
  selector: 'sc-horarios-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorariosPageComponent {
  protected readonly store = inject(HorariosStore);
  protected readonly config: RepoPageConfig<Horario> = {
    titleKey: 'repositories.horarios.title',
    entitySingularKey: 'repositories.horarios.singular',
    createTitleKey: 'repositories.horarios.create_title',
    entityPluralKey: 'repositories.horarios.plural',
    icon: 'schedule',
    breadcrumbExtraKey: 'repositories.horarios.title',
    columns: COLUMNS,
    fields: FIELDS,
    searchKeys: ['name', 'schedule', 'timezone', 'description'],
    filePrefix: 'horarios',
    sheetNameKey: 'repositories.horarios.title',
  };
}
