import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig, RepoStore } from '../components/repo-types';

export interface EntidadIA {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly model: string;
  readonly description: string;
  readonly status: string;
}

const SEED: readonly EntidadIA[] = [
  {
    id: 1,
    name: 'Sentimiento',
    type: 'clasificación',
    model: 'GPT-4o',
    description: 'Detecta el sentimiento general del cliente (positivo, negativo, neutro)',
    status: 'active',
  },
  {
    id: 2,
    name: 'Urgencia',
    type: 'puntuación',
    model: 'GPT-4o',
    description: 'Puntúa de 1 a 5 la urgencia percibida del mensaje',
    status: 'active',
  },
  {
    id: 3,
    name: 'Tema principal',
    type: 'extracción',
    model: 'GPT-4o',
    description: 'Extrae el tema principal de la conversación',
    status: 'active',
  },
  {
    id: 4,
    name: 'Datos personales',
    type: 'extracción',
    model: 'Claude 3.5',
    description: 'Identifica y extrae datos personales mencionados',
    status: 'active',
  },
  {
    id: 5,
    name: 'Idioma',
    type: 'clasificación',
    model: 'GPT-4o-mini',
    description: 'Detecta el idioma de la conversación',
    status: 'active',
  },
  {
    id: 6,
    name: 'Resumen',
    type: 'generación',
    model: 'GPT-4o',
    description: 'Genera un resumen conciso de la conversación',
    status: 'inactive',
  },
  {
    id: 7,
    name: 'Siguiente mejor acción',
    type: 'recomendación',
    model: 'Claude 3.5',
    description: 'Sugiere la siguiente acción óptima para el agente',
    status: 'active',
  },
];

@Injectable({ providedIn: 'root' })
export class EntidadesIAStore implements RepoStore<EntidadIA> {
  private readonly store: LocalStore<EntidadIA> = createLocalStore<EntidadIA>({
    storageKey: 'sc-entidades-ia-repo',
    versionKey: 'sc-entidades-ia-repo-v',
    currentVersion: 1,
    defaults: SEED,
  });
  readonly items = this.store.items;
  addItem(data: Omit<EntidadIA, 'id'>): EntidadIA {
    return this.store.addItem(data);
  }
  updateItem(id: number, updates: Partial<EntidadIA>): void {
    this.store.updateItem(id, updates);
  }
  deleteItem(id: number): void {
    this.store.deleteItem(id);
  }
  deleteItems(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }
}

const COLUMNS: readonly RepoColumnDef<EntidadIA>[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    width: '224px',
    emphasis: true,
  },
  {
    key: 'type',
    labelKey: 'repositories.entidades_ia.type',
    kind: 'text',
    accessor: (i) => i.type,
    width: '128px',
  },
  {
    key: 'model',
    labelKey: 'repositories.entidades_ia.model',
    kind: 'text',
    accessor: (i) => i.model,
    width: '128px',
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
    placeholderKey: 'repositories.entidades_ia.name_placeholder',
  },
  {
    key: 'type',
    labelKey: 'repositories.entidades_ia.type',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.entidades_ia.type_placeholder',
  },
  {
    key: 'model',
    labelKey: 'repositories.entidades_ia.model',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.entidades_ia.model_placeholder',
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
  selector: 'sc-entidades-ia-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntidadesIAPageComponent {
  protected readonly store = inject(EntidadesIAStore);
  protected readonly config: RepoPageConfig<EntidadIA> = {
    titleKey: 'repositories.entidades_ia.title',
    entitySingularKey: 'repositories.entidades_ia.singular',
    entityPluralKey: 'repositories.entidades_ia.plural',
    icon: 'inventory_2',
    breadcrumbExtraKey: 'repositories.entidades_ia.title',
    columns: COLUMNS,
    fields: FIELDS,
    searchKeys: ['name', 'type', 'model', 'description'],
    filePrefix: 'entidades-ia',
    sheetNameKey: 'repositories.entidades_ia.title',
  };
}
