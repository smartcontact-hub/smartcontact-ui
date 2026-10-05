import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig } from '../components/repo-types';
import { type Tipificacion, TipificacionesStore } from '../state/tipificaciones.store';

const COLUMNS: readonly RepoColumnDef<Tipificacion>[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    width: '224px',
    emphasis: true,
  },
  {
    key: 'code',
    labelKey: 'repositories.tipificaciones.code',
    kind: 'text',
    accessor: (i) => i.code,
    width: '96px',
  },
  {
    key: 'category',
    labelKey: 'repositories.tipificaciones.category',
    kind: 'text',
    accessor: (i) => i.category,
    width: '128px',
  },
  {
    key: 'description',
    labelKey: 'repositories.columns.description',
    kind: 'truncate',
    accessor: (i) => i.description,
  },
];

/** Exportado: la ficha de grupo lo reutiliza para crear una tipificación sin salir a Repositorios. */
export const TIPIFICACION_FIELDS: readonly RepoFieldDef[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.tipificaciones.name_placeholder',
  },
  {
    key: 'code',
    labelKey: 'repositories.tipificaciones.code',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.tipificaciones.code_placeholder',
  },
  {
    key: 'category',
    labelKey: 'repositories.tipificaciones.category',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.tipificaciones.category_placeholder',
  },
  {
    key: 'description',
    labelKey: 'repositories.columns.description',
    type: 'textarea',
    placeholderKey: 'repositories.placeholders.description',
  },
];

@Component({
  selector: 'sc-tipificaciones-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipificacionesPageComponent {
  protected readonly store = inject(TipificacionesStore);
  protected readonly config: RepoPageConfig<Tipificacion> = {
    titleKey: 'repositories.tipificaciones.title',
    entitySingularKey: 'repositories.tipificaciones.singular',
    createTitleKey: 'repositories.tipificaciones.create_title',
    entityPluralKey: 'repositories.tipificaciones.plural',
    icon: 'label',
    breadcrumbExtraKey: 'repositories.tipificaciones.title',
    columns: COLUMNS,
    fields: TIPIFICACION_FIELDS,
    searchKeys: ['name', 'code', 'category', 'description'],
    filePrefix: 'tipificaciones',
    sheetNameKey: 'repositories.tipificaciones.title',
  };
}
