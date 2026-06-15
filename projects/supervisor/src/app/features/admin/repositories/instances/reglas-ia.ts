import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig, RepoStore } from '../components/repo-types';

export interface ReglaIA {
  readonly id: number;
  readonly name: string;
  readonly condition: string;
  readonly action: string;
  readonly priority: string;
  readonly status: string;
}

const SEED: readonly ReglaIA[] = [
  {
    id: 1,
    name: 'Escalación por sentimiento negativo',
    condition: 'sentiment_score < -0.7',
    action: 'Transferir a agente humano',
    priority: 'high',
    status: 'active',
  },
  {
    id: 2,
    name: 'Detección de intención de baja',
    condition: "intent = 'cancelar' AND tenure < 6m",
    action: 'Transferir a retención',
    priority: 'high',
    status: 'active',
  },
  {
    id: 3,
    name: 'Respuesta automática FAQ',
    condition: 'confidence > 0.95 AND topic IN faq_topics',
    action: 'Responder con artículo KB',
    priority: 'medium',
    status: 'active',
  },
  {
    id: 4,
    name: 'Sugerencia de upsell',
    condition: "intent = 'contratar' AND plan = 'basic'",
    action: 'Ofrecer plan premium',
    priority: 'low',
    status: 'active',
  },
  {
    id: 5,
    name: 'Idioma no soportado',
    condition: 'detected_lang NOT IN supported_langs',
    action: 'Transferir a cola multiidioma',
    priority: 'medium',
    status: 'active',
  },
  {
    id: 6,
    name: 'Cliente VIP detectado',
    condition: "customer_tier = 'vip'",
    action: 'Priorizar en cola + notificar supervisor',
    priority: 'high',
    status: 'active',
  },
  {
    id: 7,
    name: 'Timeout de conversación',
    condition: 'silence_duration > 5min',
    action: 'Enviar mensaje de seguimiento',
    priority: 'low',
    status: 'inactive',
  },
  {
    id: 8,
    name: 'Doble verificación de identidad',
    condition: "action = 'cambio_datos' AND verified = false",
    action: 'Solicitar verificación adicional',
    priority: 'high',
    status: 'active',
  },
];

@Injectable({ providedIn: 'root' })
export class ReglasIAStore implements RepoStore<ReglaIA> {
  private readonly store: LocalStore<ReglaIA> = createLocalStore<ReglaIA>({
    storageKey: 'sc-reglas-ia-repo',
    versionKey: 'sc-reglas-ia-repo-v',
    currentVersion: 1,
    defaults: SEED,
  });
  readonly items = this.store.items;
  addItem(data: Omit<ReglaIA, 'id'>): ReglaIA {
    return this.store.addItem(data);
  }
  updateItem(id: number, updates: Partial<ReglaIA>): void {
    this.store.updateItem(id, updates);
  }
  deleteItem(id: number): void {
    this.store.deleteItem(id);
  }
  deleteItems(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }
}

const COLUMNS: readonly RepoColumnDef<ReglaIA>[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    width: '224px',
    emphasis: true,
  },
  {
    key: 'condition',
    labelKey: 'repositories.reglas_ia.condition',
    kind: 'truncate',
    accessor: (i) => i.condition,
  },
  {
    key: 'action',
    labelKey: 'repositories.reglas_ia.action',
    kind: 'truncate',
    accessor: (i) => i.action,
  },
  {
    key: 'priority',
    labelKey: 'repositories.reglas_ia.priority',
    kind: 'status',
    width: '96px',
    accessor: (i) => i.priority,
    statusMap: {
      high: { labelKey: 'repositories.reglas_ia.priority_levels.high', tone: 'danger' },
      medium: { labelKey: 'repositories.reglas_ia.priority_levels.medium', tone: 'warning' },
      low: { labelKey: 'repositories.reglas_ia.priority_levels.low', tone: 'muted' },
    },
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
    placeholderKey: 'repositories.reglas_ia.name_placeholder',
  },
  {
    key: 'condition',
    labelKey: 'repositories.reglas_ia.condition',
    type: 'textarea',
    required: true,
    placeholderKey: 'repositories.reglas_ia.condition_placeholder',
  },
  {
    key: 'action',
    labelKey: 'repositories.reglas_ia.action',
    type: 'textarea',
    required: true,
    placeholderKey: 'repositories.reglas_ia.action_placeholder',
  },
  {
    key: 'priority',
    labelKey: 'repositories.reglas_ia.priority',
    type: 'select',
    options: [
      { value: 'high', labelKey: 'repositories.reglas_ia.priority_levels.high' },
      { value: 'medium', labelKey: 'repositories.reglas_ia.priority_levels.medium' },
      { value: 'low', labelKey: 'repositories.reglas_ia.priority_levels.low' },
    ],
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
  selector: 'sc-reglas-ia-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReglasIAPageComponent {
  protected readonly store = inject(ReglasIAStore);
  protected readonly config: RepoPageConfig<ReglaIA> = {
    titleKey: 'repositories.reglas_ia.title',
    entitySingularKey: 'repositories.reglas_ia.singular',
    entityPluralKey: 'repositories.reglas_ia.plural',
    icon: 'auto_awesome',
    breadcrumbExtraKey: 'repositories.reglas_ia.title',
    columns: COLUMNS,
    fields: FIELDS,
    searchKeys: ['name', 'condition', 'action'],
    filePrefix: 'reglas-ia',
    sheetNameKey: 'repositories.reglas_ia.title',
  };
}
