import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig, RepoStore } from '../components/repo-types';

export interface Agenda {
  readonly id: number;
  readonly name: string;
  readonly numbers: string;
  readonly description: string;
  readonly status: string;
}

const SEED: readonly Agenda[] = [
  {
    id: 1,
    name: 'Ventas Nacional',
    numbers: '900 100 200, 900 100 201, 900 100 202',
    description: 'Números de ventas para el mercado nacional',
    status: 'active',
  },
  {
    id: 2,
    name: 'Soporte Premium',
    numbers: '900 200 300, 900 200 301',
    description: 'Líneas dedicadas a clientes premium',
    status: 'active',
  },
  {
    id: 3,
    name: 'Cobros',
    numbers: '900 300 400, 900 300 401, 900 300 402, 900 300 403',
    description: 'Números para gestión de cobros e impagos',
    status: 'active',
  },
  {
    id: 4,
    name: 'Emergencias 24h',
    numbers: '900 400 500',
    description: 'Línea de emergencias disponible 24 horas',
    status: 'active',
  },
  {
    id: 5,
    name: 'Internacional LATAM',
    numbers: '+1 800 555 1234, +52 800 123 4567',
    description: 'Números internacionales para Latinoamérica',
    status: 'active',
  },
  {
    id: 6,
    name: 'Soporte Técnico',
    numbers: '900 500 600, 900 500 601',
    description: 'Líneas de soporte técnico general',
    status: 'inactive',
  },
  {
    id: 7,
    name: 'Campañas Outbound',
    numbers: '911 222 333, 911 222 334, 911 222 335',
    description: 'Números para campañas salientes',
    status: 'active',
  },
  {
    id: 8,
    name: 'Retención',
    numbers: '900 600 700',
    description: 'Línea especializada en retención de clientes',
    status: 'active',
  },
];

@Injectable({ providedIn: 'root' })
export class AgendasStore implements RepoStore<Agenda> {
  private readonly store: LocalStore<Agenda> = createLocalStore<Agenda>({
    storageKey: 'sc-agendas-repo',
    versionKey: 'sc-agendas-repo-v',
    currentVersion: 1,
    defaults: SEED,
  });
  readonly items = this.store.items;
  addItem(data: Omit<Agenda, 'id'>): Agenda {
    return this.store.addItem(data);
  }
  updateItem(id: number, updates: Partial<Agenda>): void {
    this.store.updateItem(id, updates);
  }
  deleteItem(id: number): void {
    this.store.deleteItem(id);
  }
  deleteItems(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }
}

const COLUMNS: readonly RepoColumnDef<Agenda>[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    width: '192px',
    emphasis: true,
  },
  {
    key: 'numbers',
    labelKey: 'repositories.agendas.numbers',
    kind: 'truncate',
    accessor: (i) => i.numbers,
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
    placeholderKey: 'repositories.agendas.name_placeholder',
  },
  {
    key: 'numbers',
    labelKey: 'repositories.agendas.numbers',
    type: 'textarea',
    required: true,
    placeholderKey: 'repositories.agendas.numbers_placeholder',
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
    entityPluralKey: 'repositories.agendas.plural',
    icon: 'call',
    breadcrumbExtraKey: 'repositories.agendas.title',
    columns: COLUMNS,
    fields: FIELDS,
    searchKeys: ['name', 'numbers', 'description'],
    filePrefix: 'agendas',
    sheetNameKey: 'repositories.agendas.title',
  };
}
