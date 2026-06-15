import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';

import { createLocalStore, LocalStore } from '@core/services/local-store.factory';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoFieldDef, RepoPageConfig, RepoStore } from '../components/repo-types';

export interface Horario {
  readonly id: number;
  readonly name: string;
  readonly schedule: string;
  readonly timezone: string;
  readonly description: string;
  readonly status: string;
}

const SEED: readonly Horario[] = [
  {
    id: 1,
    name: 'Horario General',
    schedule: 'L-V 09:00–18:00',
    timezone: 'Europe/Madrid',
    description: 'Horario estándar de oficina',
    status: 'active',
  },
  {
    id: 2,
    name: 'Turno Mañana',
    schedule: 'L-V 07:00–15:00',
    timezone: 'Europe/Madrid',
    description: 'Turno de mañana para soporte',
    status: 'active',
  },
  {
    id: 3,
    name: 'Turno Tarde',
    schedule: 'L-V 15:00–23:00',
    timezone: 'Europe/Madrid',
    description: 'Turno de tarde para soporte',
    status: 'active',
  },
  {
    id: 4,
    name: 'Turno Noche',
    schedule: 'L-D 23:00–07:00',
    timezone: 'Europe/Madrid',
    description: 'Cobertura nocturna para emergencias',
    status: 'active',
  },
  {
    id: 5,
    name: 'Fines de Semana',
    schedule: 'S-D 10:00–14:00',
    timezone: 'Europe/Madrid',
    description: 'Cobertura reducida fines de semana',
    status: 'active',
  },
  {
    id: 6,
    name: 'Horario LATAM',
    schedule: 'L-V 14:00–22:00',
    timezone: 'America/Mexico_City',
    description: 'Adaptado al horario de Latinoamérica',
    status: 'active',
  },
  {
    id: 7,
    name: '24/7 Emergencias',
    schedule: 'L-D 00:00–23:59',
    timezone: 'Europe/Madrid',
    description: 'Cobertura continua sin interrupciones',
    status: 'active',
  },
  {
    id: 8,
    name: 'Horario Verano',
    schedule: 'L-V 08:00–15:00',
    timezone: 'Europe/Madrid',
    description: 'Jornada intensiva de verano (julio–agosto)',
    status: 'inactive',
  },
];

@Injectable({ providedIn: 'root' })
export class HorariosStore implements RepoStore<Horario> {
  private readonly store: LocalStore<Horario> = createLocalStore<Horario>({
    storageKey: 'sc-horarios-repo',
    versionKey: 'sc-horarios-repo-v',
    currentVersion: 1,
    defaults: SEED,
  });
  readonly items = this.store.items;
  addItem(data: Omit<Horario, 'id'>): Horario {
    return this.store.addItem(data);
  }
  updateItem(id: number, updates: Partial<Horario>): void {
    this.store.updateItem(id, updates);
  }
  deleteItem(id: number): void {
    this.store.deleteItem(id);
  }
  deleteItems(ids: readonly number[]): void {
    this.store.deleteItems(ids);
  }
}

const COLUMNS: readonly RepoColumnDef<Horario>[] = [
  {
    key: 'name',
    labelKey: 'repositories.columns.name',
    kind: 'text',
    accessor: (i) => i.name,
    width: '192px',
    emphasis: true,
  },
  {
    key: 'schedule',
    labelKey: 'repositories.horarios.schedule',
    kind: 'text',
    accessor: (i) => i.schedule,
    width: '160px',
  },
  {
    key: 'timezone',
    labelKey: 'repositories.horarios.timezone',
    kind: 'text',
    accessor: (i) => i.timezone,
    width: '160px',
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
    placeholderKey: 'repositories.horarios.name_placeholder',
  },
  {
    key: 'schedule',
    labelKey: 'repositories.horarios.schedule',
    type: 'text',
    required: true,
    placeholderKey: 'repositories.horarios.schedule_placeholder',
  },
  {
    key: 'timezone',
    labelKey: 'repositories.horarios.timezone',
    type: 'text',
    placeholderKey: 'repositories.horarios.timezone_placeholder',
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
  selector: 'sc-horarios-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorariosPageComponent {
  protected readonly store = inject(HorariosStore);
  protected readonly config: RepoPageConfig<Horario> = {
    titleKey: 'repositories.horarios.title',
    entitySingularKey: 'repositories.horarios.singular',
    entityPluralKey: 'repositories.horarios.plural',
    icon: 'schedule',
    breadcrumbExtraKey: 'repositories.horarios.title',
    columns: COLUMNS,
    fields: FIELDS,
    searchKeys: ['name', 'schedule', 'timezone', 'description'],
    filePrefix: 'horarios',
    sheetNameKey: 'repositories.horarios.title',
  };
}
