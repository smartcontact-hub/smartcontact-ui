import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig } from '../components/repo-types';
import { type Intencion, IntencionesStore } from '../state/intenciones.store';

const COLUMNS: readonly RepoColumnDef<Intencion>[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    width: '192px',
    emphasis: true,
  },
  {
    key: 'category',
    labelKey: 'repositories.intenciones.category',
    kind: 'text',
    accessor: (i) => i.category,
    width: '128px',
  },
  {
    key: 'examples',
    labelKey: 'repositories.intenciones.examples',
    kind: 'truncate',
    accessor: (i) => i.examples,
  },
];

const FIELDS: readonly RepoFieldDef[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.intenciones.name_placeholder',
  },
  {
    key: 'category',
    labelKey: 'repositories.intenciones.category',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.intenciones.category_placeholder',
  },
  {
    key: 'examples',
    labelKey: 'repositories.intenciones.examples',
    type: 'textarea',
    required: true,
    placeholderKey: 'repositories.intenciones.examples_placeholder',
  },
  {
    key: 'description',
    labelKey: 'repositories.columns.description',
    type: 'textarea',
    placeholderKey: 'repositories.placeholders.description',
  },
];

@Component({
  selector: 'sc-intenciones-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntencionesPageComponent {
  protected readonly store = inject(IntencionesStore);
  protected readonly config: RepoPageConfig<Intencion> = {
    titleKey: 'repositories.intenciones.title',
    entitySingularKey: 'repositories.intenciones.singular',
    createTitleKey: 'repositories.intenciones.create_title',
    entityPluralKey: 'repositories.intenciones.plural',
    icon: 'chat_bubble',
    breadcrumbExtraKey: 'repositories.intenciones.title',
    columns: COLUMNS,
    fields: FIELDS,
    searchKeys: ['name', 'category', 'examples', 'description'],
    filePrefix: 'intenciones',
    sheetNameKey: 'repositories.intenciones.title',
  };
}
