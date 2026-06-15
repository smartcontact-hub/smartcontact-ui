import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig, RepoStore } from '../components/repo-types';

export interface Entidad {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly values: string;
  readonly description: string;
}

const SEED: readonly Entidad[] = [
  {
    id: 1,
    name: 'Producto',
    type: 'list',
    values: 'Internet Fibra, Móvil Prepago, Móvil Contrato, TV Premium, Pack Convergente',
    description: 'Productos y servicios del catálogo comercial',
  },
  {
    id: 2,
    name: 'Motivo de contacto',
    type: 'list',
    values: 'Consulta, Reclamación, Alta, Baja, Modificación, Avería',
    description: 'Razón principal por la que el cliente contacta',
  },
  {
    id: 3,
    name: 'Número de teléfono',
    type: 'regex',
    values: '^(\\+34)?[6-9]\\d{8}$',
    description: 'Número de teléfono español (fijo o móvil)',
  },
  {
    id: 4,
    name: 'Email',
    type: 'regex',
    values: '^[\\w.-]+@[\\w.-]+\\.\\w+$',
    description: 'Dirección de correo electrónico del cliente',
  },
  {
    id: 5,
    name: 'DNI/NIE',
    type: 'regex',
    values: '^[0-9XYZ]\\d{7}[A-Z]$',
    description: 'Documento de identidad español',
  },
  {
    id: 6,
    name: 'Fecha',
    type: 'date',
    values: 'DD/MM/YYYY',
    description: 'Fecha mencionada en la conversación',
  },
  {
    id: 7,
    name: 'Importe',
    type: 'number',
    values: '0.00–9999.99',
    description: 'Cantidad monetaria mencionada por el cliente',
  },
  {
    id: 8,
    name: 'Dirección',
    type: 'text',
    values: '',
    description: 'Dirección postal del cliente',
  },
];

@Injectable({ providedIn: 'root' })
export class EntidadesStore implements RepoStore<Entidad> {
  private readonly store: LocalStore<Entidad> = createLocalStore<Entidad>({
    storageKey: 'sc-entidades-repo',
    versionKey: 'sc-entidades-repo-v',
    currentVersion: 1,
    defaults: SEED,
  });
  readonly items = this.store.items;
  addItem(data: Omit<Entidad, 'id'>): Entidad {
    return this.store.addItem(data);
  }
  updateItem(id: number, updates: Partial<Entidad>): void {
    this.store.updateItem(id, updates);
  }
  deleteItem(id: number): void {
    this.store.deleteItem(id);
  }
  deleteItems(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }
}

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
