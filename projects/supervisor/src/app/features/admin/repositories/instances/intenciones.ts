import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig, RepoStore } from '../components/repo-types';

export interface Intencion {
  readonly id: number;
  readonly name: string;
  readonly examples: string;
  readonly category: string;
  readonly description: string;
}

const SEED: readonly Intencion[] = [
  {
    id: 1,
    name: 'Saludo',
    examples: 'Hola, Buenos días, Buenas tardes',
    category: 'General',
    description: 'El usuario saluda al iniciar la conversación',
  },
  {
    id: 2,
    name: 'Despedida',
    examples: 'Adiós, Hasta luego, Gracias por todo',
    category: 'General',
    description: 'El usuario se despide y quiere finalizar',
  },
  {
    id: 3,
    name: 'Consultar factura',
    examples: 'Quiero ver mi factura, ¿Cuánto debo?, Mi último recibo',
    category: 'Facturación',
    description: 'El usuario desea consultar su factura o saldo',
  },
  {
    id: 4,
    name: 'Reportar avería',
    examples: 'No tengo internet, Se me ha caído la línea, No funciona',
    category: 'Soporte',
    description: 'El usuario reporta un problema técnico',
  },
  {
    id: 5,
    name: 'Dar de baja',
    examples: 'Quiero cancelar, Darme de baja, No quiero seguir',
    category: 'Gestión',
    description: 'El usuario quiere cancelar su servicio',
  },
  {
    id: 6,
    name: 'Contratar servicio',
    examples: 'Quiero contratar, Me interesa, ¿Qué planes tienen?',
    category: 'Ventas',
    description: 'El usuario quiere contratar un nuevo servicio',
  },
  {
    id: 7,
    name: 'Cambiar datos',
    examples: 'Cambiar mi dirección, Actualizar mi email, Nuevo teléfono',
    category: 'Gestión',
    description: 'El usuario quiere modificar sus datos personales',
  },
  {
    id: 8,
    name: 'Hablar con humano',
    examples: 'Quiero hablar con una persona, Agente real, No quiero bot',
    category: 'General',
    description: 'El usuario solicita hablar con un agente humano',
  },
  {
    id: 9,
    name: 'Reclamar',
    examples: 'Quiero poner una queja, Estoy insatisfecho, No es aceptable',
    category: 'Reclamación',
    description: 'El usuario quiere presentar una reclamación formal',
  },
  {
    id: 10,
    name: 'Consultar horario',
    examples: '¿Cuál es su horario?, ¿A qué hora abren?, ¿Están abiertos?',
    category: 'General',
    description: 'El usuario pregunta por horarios de atención',
  },
];

@Injectable({ providedIn: 'root' })
export class IntencionesStore implements RepoStore<Intencion> {
  private readonly store: LocalStore<Intencion> = createLocalStore<Intencion>({
    storageKey: 'sc-intenciones-repo',
    versionKey: 'sc-intenciones-repo-v',
    currentVersion: 1,
    defaults: SEED,
  });
  readonly items = this.store.items;
  addItem(data: Omit<Intencion, 'id'>): Intencion {
    return this.store.addItem(data);
  }
  updateItem(id: number, updates: Partial<Intencion>): void {
    this.store.updateItem(id, updates);
  }
  deleteItem(id: number): void {
    this.store.deleteItem(id);
  }
  deleteItems(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }
}

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
