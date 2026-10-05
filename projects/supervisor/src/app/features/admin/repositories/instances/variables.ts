import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig } from '../components/repo-types';
import { type RepoVariable, VariablesStore } from '../state/variables.store';

const COLUMNS: readonly RepoColumnDef<RepoVariable>[] = [
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
    key: 'key',
    labelKey: 'repositories.variables.key',
    kind: 'text',
    accessor: (i) => i.key,
    width: '128px',
  },
  {
    key: 'defaultValue',
    labelKey: 'repositories.variables.default',
    kind: 'text',
    accessor: (i) => i.defaultValue,
    width: '160px',
  },
  {
    key: 'type',
    labelKey: 'repositories.variables.type',
    kind: 'text',
    accessor: (i) => i.type,
    width: '96px',
  },
];

const FIELDS: readonly RepoFieldDef[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.variables.name_placeholder',
  },
  {
    key: 'key',
    labelKey: 'repositories.variables.key',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.variables.key_placeholder',
  },
  {
    key: 'defaultValue',
    labelKey: 'repositories.variables.default',
    type: 'text',
    placeholderKey: 'repositories.variables.default_placeholder',
  },
  {
    key: 'type',
    labelKey: 'repositories.variables.type',
    type: 'select',
    options: [
      { value: 'text', labelKey: 'repositories.variables.types.text' },
      { value: 'number', labelKey: 'repositories.variables.types.number' },
      { value: 'date', labelKey: 'repositories.variables.types.date' },
    ],
  },
  {
    key: 'description',
    labelKey: 'repositories.columns.description',
    type: 'textarea',
    placeholderKey: 'repositories.placeholders.description',
  },
];

@Component({
  selector: 'sc-variables-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariablesPageComponent {
  protected readonly store = inject(VariablesStore);
  protected readonly config: RepoPageConfig<RepoVariable> = {
    titleKey: 'repositories.variables.title',
    entitySingularKey: 'repositories.variables.singular',
    createTitleKey: 'repositories.variables.create_title',
    entityPluralKey: 'repositories.variables.plural',
    icon: 'data_object',
    breadcrumbExtraKey: 'repositories.variables.title',
    columns: COLUMNS,
    fields: FIELDS,
    searchKeys: ['name', 'key', 'defaultValue', 'description'],
    filePrefix: 'variables',
    sheetNameKey: 'repositories.variables.title',
  };
}
