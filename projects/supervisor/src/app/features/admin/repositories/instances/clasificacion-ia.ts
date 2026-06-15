import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig, RepoStore } from '../components/repo-types';

export interface ClasificacionIA {
  readonly id: number;
  readonly name: string;
  readonly model: string;
  readonly categories: string;
  readonly accuracy: string;
  readonly description: string;
  readonly status: string;
}

const SEED: readonly ClasificacionIA[] = [
  {
    id: 1,
    name: 'Clasificador de intenciones',
    model: 'GPT-4o',
    categories: 'Consulta, Venta, Reclamación, Soporte, Baja',
    accuracy: '94.2%',
    description: 'Clasificación automática de la intención principal del cliente',
    status: 'active',
  },
  {
    id: 2,
    name: 'Detector de urgencia',
    model: 'GPT-4o-mini',
    categories: 'Baja, Media, Alta, Crítica',
    accuracy: '91.7%',
    description: 'Clasifica la urgencia del mensaje para priorizar en cola',
    status: 'active',
  },
  {
    id: 3,
    name: 'Clasificador de productos',
    model: 'Claude 3.5',
    categories: 'Internet, Móvil, TV, Pack, Otros',
    accuracy: '96.1%',
    description: 'Identifica el producto sobre el que trata la conversación',
    status: 'active',
  },
  {
    id: 4,
    name: 'Análisis de satisfacción',
    model: 'GPT-4o',
    categories: 'Muy insatisfecho, Insatisfecho, Neutro, Satisfecho, Muy satisfecho',
    accuracy: '88.5%',
    description: 'Predice el nivel de satisfacción del cliente durante la conversación',
    status: 'active',
  },
  {
    id: 5,
    name: 'Detección de fraude',
    model: 'Claude 3.5',
    categories: 'Legítimo, Sospechoso, Fraude potencial',
    accuracy: '97.3%',
    description: 'Identifica patrones de conversación asociados a fraude',
    status: 'inactive',
  },
  {
    id: 6,
    name: 'Segmentación de cliente',
    model: 'GPT-4o-mini',
    categories: 'Nuevo, Recurrente, VIP, En riesgo, Inactivo',
    accuracy: '89.8%',
    description: 'Clasifica al cliente según su perfil y comportamiento',
    status: 'active',
  },
];

@Injectable({ providedIn: 'root' })
export class ClasificacionIAStore implements RepoStore<ClasificacionIA> {
  private readonly store: LocalStore<ClasificacionIA> = createLocalStore<ClasificacionIA>({
    storageKey: 'sc-clasificacion-ia-repo',
    versionKey: 'sc-clasificacion-ia-repo-v',
    currentVersion: 1,
    defaults: SEED,
  });
  readonly items = this.store.items;
  addItem(data: Omit<ClasificacionIA, 'id'>): ClasificacionIA {
    return this.store.addItem(data);
  }
  updateItem(id: number, updates: Partial<ClasificacionIA>): void {
    this.store.updateItem(id, updates);
  }
  deleteItem(id: number): void {
    this.store.deleteItem(id);
  }
  deleteItems(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }
}

const COLUMNS: readonly RepoColumnDef<ClasificacionIA>[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    width: '224px',
    emphasis: true,
  },
  {
    key: 'model',
    labelKey: 'repositories.clasificacion_ia.model',
    kind: 'text',
    accessor: (i) => i.model,
    width: '128px',
  },
  {
    key: 'categories',
    labelKey: 'repositories.clasificacion_ia.categories',
    kind: 'truncate',
    accessor: (i) => i.categories,
  },
  {
    key: 'accuracy',
    labelKey: 'repositories.clasificacion_ia.accuracy',
    kind: 'mono',
    accessor: (i) => i.accuracy,
    width: '96px',
  },
  {
    key: 'status',
    labelKey: 'repositories.columns.status',
    kind: 'status',
    width: '96px',
    accessor: (i) => i.status,
    statusMap: {
      active: { labelKey: 'repositories.status.active', tone: 'success' },
      inactive: { labelKey: 'repositories.status.inactive', tone: 'muted' },
    },
  },
];

const FIELDS: readonly RepoFieldDef[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.clasificacion_ia.name_placeholder',
  },
  {
    key: 'model',
    labelKey: 'repositories.clasificacion_ia.model',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.clasificacion_ia.model_placeholder',
  },
  {
    key: 'categories',
    labelKey: 'repositories.clasificacion_ia.categories',
    type: 'textarea',
    required: true,
    placeholderKey: 'repositories.clasificacion_ia.categories_placeholder',
  },
  {
    key: 'accuracy',
    labelKey: 'repositories.clasificacion_ia.accuracy',
    type: 'text',
    placeholderKey: 'repositories.clasificacion_ia.accuracy_placeholder',
  },
  {
    key: 'description',
    labelKey: 'repositories.columns.description',
    type: 'textarea',
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
  selector: 'sc-clasificacion-ia-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClasificacionIAPageComponent {
  protected readonly store = inject(ClasificacionIAStore);
  protected readonly config: RepoPageConfig<ClasificacionIA> = {
    titleKey: 'repositories.clasificacion_ia.title',
    entitySingularKey: 'repositories.clasificacion_ia.singular',
    entityPluralKey: 'repositories.clasificacion_ia.plural',
    icon: 'label',
    breadcrumbExtraKey: 'repositories.clasificacion_ia.title',
    columns: COLUMNS,
    fields: FIELDS,
    searchKeys: ['name', 'model', 'categories', 'description'],
    filePrefix: 'clasificacion-ia',
    sheetNameKey: 'repositories.clasificacion_ia.title',
  };
}
