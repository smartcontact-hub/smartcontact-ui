import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig, RepoStore } from '../components/repo-types';

export interface RepoVariable {
  readonly id: number;
  readonly name: string;
  readonly key: string;
  readonly defaultValue: string;
  readonly type: string;
  readonly description: string;
}

const SEED: readonly RepoVariable[] = [
  {
    id: 1,
    name: 'Nombre del agente',
    key: '{agente}',
    defaultValue: 'Agente',
    type: 'text',
    description: 'Nombre del agente que atiende la conversación',
  },
  {
    id: 2,
    name: 'Nombre del cliente',
    key: '{cliente}',
    defaultValue: 'Cliente',
    type: 'text',
    description: 'Nombre del cliente obtenido del CRM',
  },
  {
    id: 3,
    name: 'Número de referencia',
    key: '{ref}',
    defaultValue: '',
    type: 'text',
    description: 'Número de referencia del caso o pedido',
  },
  {
    id: 4,
    name: 'Fecha actual',
    key: '{fecha}',
    defaultValue: '',
    type: 'date',
    description: 'Fecha actual formateada según la localización',
  },
  {
    id: 5,
    name: 'Hora actual',
    key: '{hora}',
    defaultValue: '',
    type: 'text',
    description: 'Hora actual del sistema',
  },
  {
    id: 6,
    name: 'Empresa',
    key: '{empresa}',
    defaultValue: 'SmartContact',
    type: 'text',
    description: 'Nombre de la empresa o marca comercial',
  },
  {
    id: 7,
    name: 'Número de cola',
    key: '{cola_pos}',
    defaultValue: '0',
    type: 'number',
    description: 'Posición del cliente en la cola de espera',
  },
  {
    id: 8,
    name: 'Tiempo estimado',
    key: '{eta}',
    defaultValue: '5 min',
    type: 'text',
    description: 'Tiempo estimado de espera en cola',
  },
  {
    id: 9,
    name: 'ID de ticket',
    key: '{ticket_id}',
    defaultValue: '',
    type: 'text',
    description: 'Identificador único del ticket de soporte',
  },
  {
    id: 10,
    name: 'Encuesta URL',
    key: '{survey_url}',
    defaultValue: 'https://survey.example.com',
    type: 'text',
    description: 'Enlace a la encuesta de satisfacción post-atención',
  },
];

@Injectable({ providedIn: 'root' })
export class VariablesStore implements RepoStore<RepoVariable> {
  private readonly store: LocalStore<RepoVariable> = createLocalStore<RepoVariable>({
    storageKey: 'sc-variables-repo',
    versionKey: 'sc-variables-repo-v',
    currentVersion: 1,
    defaults: SEED,
  });
  readonly items = this.store.items;
  addItem(data: Omit<RepoVariable, 'id'>): RepoVariable {
    return this.store.addItem(data);
  }
  updateItem(id: number, updates: Partial<RepoVariable>): void {
    this.store.updateItem(id, updates);
  }
  deleteItem(id: number): void {
    this.store.deleteItem(id);
  }
  deleteItems(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }
}

const COLUMNS: readonly RepoColumnDef<RepoVariable>[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    width: '224px',
    emphasis: true,
  },
  {
    key: 'key',
    labelKey: 'repositories.variables.key',
    kind: 'mono',
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
