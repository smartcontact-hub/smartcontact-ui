import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig } from '../components/repo-types';
import { type Entidad, EntidadesStore } from '../state/entidades.store';

const COLUMNS: readonly RepoColumnDef<Entidad>[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    width: '192px',
    emphasis: true,
  },
  {
    key: 'type',
    labelKey: 'repositories.entidades.type',
    kind: 'text',
    accessor: (i) => i.type,
    width: '112px',
  },
  {
    key: 'values',
    labelKey: 'repositories.entidades.values',
    kind: 'truncate',
    accessor: (i) => i.values,
  },
];

const FIELDS: readonly RepoFieldDef[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.entidades.name_placeholder',
  },
  {
    key: 'type',
    labelKey: 'repositories.entidades.type',
    type: 'select',
    options: [
      { value: 'text', labelKey: 'repositories.entidades.types.text' },
      { value: 'list', labelKey: 'repositories.entidades.types.list' },
      { value: 'regex', labelKey: 'repositories.entidades.types.regex' },
      { value: 'number', labelKey: 'repositories.entidades.types.number' },
      { value: 'date', labelKey: 'repositories.entidades.types.date' },
    ],
  },
  {
    key: 'values',
    labelKey: 'repositories.entidades.values',
    type: 'textarea',
    placeholderKey: 'repositories.entidades.values_placeholder',
  },
  {
    key: 'description',
    labelKey: 'repositories.columns.description',
    type: 'textarea',
    placeholderKey: 'repositories.placeholders.description',
  },
];

@Component({
  selector: 'sc-entidades-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntidadesPageComponent {
  protected readonly store = inject(EntidadesStore);
  protected readonly config: RepoPageConfig<Entidad> = {
    titleKey: 'repositories.entidades.title',
    entitySingularKey: 'repositories.entidades.singular',
    createTitleKey: 'repositories.entidades.create_title',
    entityPluralKey: 'repositories.entidades.plural',
    icon: 'inventory_2',
    breadcrumbExtraKey: 'repositories.entidades.title',
    columns: COLUMNS,
    fields: FIELDS,
    searchKeys: ['name', 'type', 'values', 'description'],
    filePrefix: 'entidades',
    sheetNameKey: 'repositories.entidades.title',
  };
}
