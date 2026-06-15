import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig, RepoStore } from '../components/repo-types';

export interface Tipificacion {
  readonly id: number;
  readonly name: string;
  readonly code: string;
  readonly category: string;
  readonly description: string;
}

const SEED: readonly Tipificacion[] = [
  {
    id: 1,
    name: 'Consulta resuelta',
    code: 'CON-001',
    category: 'Consulta',
    description: 'La consulta del cliente fue resuelta en primer contacto',
  },
  {
    id: 2,
    name: 'Consulta escalada',
    code: 'CON-002',
    category: 'Consulta',
    description: 'La consulta requirió escalación a nivel superior',
  },
  {
    id: 3,
    name: 'Venta cerrada',
    code: 'VEN-001',
    category: 'Ventas',
    description: 'Se concretó una venta exitosamente',
  },
  {
    id: 4,
    name: 'Venta pendiente',
    code: 'VEN-002',
    category: 'Ventas',
    description: 'El cliente mostró interés pero no cerró la venta',
  },
  {
    id: 5,
    name: 'Venta rechazada',
    code: 'VEN-003',
    category: 'Ventas',
    description: 'El cliente rechazó la oferta comercial',
  },
  {
    id: 6,
    name: 'Reclamación abierta',
    code: 'REC-001',
    category: 'Reclamación',
    description: 'Se abrió un caso de reclamación formal',
  },
  {
    id: 7,
    name: 'Reclamación resuelta',
    code: 'REC-002',
    category: 'Reclamación',
    description: 'El caso de reclamación fue resuelto satisfactoriamente',
  },
  {
    id: 8,
    name: 'Incidencia técnica',
    code: 'INC-001',
    category: 'Soporte',
    description: 'Se reportó un problema técnico con el producto o servicio',
  },
  {
    id: 9,
    name: 'Incidencia resuelta',
    code: 'INC-002',
    category: 'Soporte',
    description: 'La incidencia técnica fue resuelta',
  },
  {
    id: 10,
    name: 'Llamada abandonada',
    code: 'ABN-001',
    category: 'Otros',
    description: 'El cliente colgó antes de ser atendido',
  },
  {
    id: 11,
    name: 'Llamada perdida',
    code: 'ABN-002',
    category: 'Otros',
    description: 'No se pudo contactar al cliente en callback',
  },
  {
    id: 12,
    name: 'Información proporcionada',
    code: 'INF-001',
    category: 'Consulta',
    description: 'Se proporcionó información sin necesidad de gestión adicional',
  },
];

@Injectable({ providedIn: 'root' })
export class TipificacionesStore implements RepoStore<Tipificacion> {
  private readonly store: LocalStore<Tipificacion> = createLocalStore<Tipificacion>({
    storageKey: 'sc-tipificaciones-repo',
    versionKey: 'sc-tipificaciones-repo-v',
    currentVersion: 1,
    defaults: SEED,
  });
  readonly items = this.store.items;
  addItem(data: Omit<Tipificacion, 'id'>): Tipificacion {
    return this.store.addItem(data);
  }
  updateItem(id: number, updates: Partial<Tipificacion>): void {
    this.store.updateItem(id, updates);
  }
  deleteItem(id: number): void {
    this.store.deleteItem(id);
  }
  deleteItems(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }
}

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
    kind: 'mono',
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

const FIELDS: readonly RepoFieldDef[] = [
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
    entityPluralKey: 'repositories.tipificaciones.plural',
    icon: 'label',
    breadcrumbExtraKey: 'repositories.tipificaciones.title',
    columns: COLUMNS,
    fields: FIELDS,
    searchKeys: ['name', 'code', 'category', 'description'],
    filePrefix: 'tipificaciones',
    sheetNameKey: 'repositories.tipificaciones.title',
  };
}
