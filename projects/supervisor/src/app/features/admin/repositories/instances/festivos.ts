import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoPageConfig } from '../components/repo-types';
import { FestivosUsoService } from '../state/horario-uso.service';
import { type CalendarioDeFestivos, FestivosStore } from '../state/festivos.store';
import { HorariosStore } from '../state/horarios.store';

/** Nombre, descripción, cuántos días tiene, cuántos horarios lo aplican y su estado. Los días, en su editor. */
const columnas = (horariosDe: (c: CalendarioDeFestivos) => number): readonly RepoColumnDef<CalendarioDeFestivos>[] => [
  { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (i) => i.name, emphasis: true, sortable: true },
  { key: 'description', labelKey: 'repositories.columns.description', kind: 'truncate', accessor: (i) => i.description.trim(), emptyDash: true, sortable: true },
  { key: 'days', labelKey: 'repositories.festivos.col_days', kind: 'count', width: '112px', accessor: (i) => String(i.days.length), emptyDash: true, sortable: true },
  { key: 'schedules', labelKey: 'repositories.festivos.col_schedules', kind: 'count', width: '112px', accessor: (i) => String(horariosDe(i)), emptyDash: true, sortable: true },
  {
    key: 'status',
    labelKey: 'repositories.columns.status',
    kind: 'status',
    width: '96px',
    accessor: (i) => i.status,
    statusMap: {
      // En masculino: un horario y un calendario (la clave compartida, «Activa», es de regla y categoría).
      active: { labelKey: 'repositories.festivos.active', tone: 'success' },
      inactive: { labelKey: 'repositories.festivos.inactive', tone: 'secondary' },
    },
  },
];

@Component({
  selector: 'sc-festivos-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FestivosPageComponent {
  private readonly uso = inject(FestivosUsoService);
  protected readonly store = inject(FestivosStore);
  private readonly horariosStore = inject(HorariosStore);

  private readonly horariosPorCalendario = computed(() => {
    const cuenta = new Map<number, number>();
    for (const h of this.horariosStore.items()) for (const id of h.holidayCalendarIds) cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
    return cuenta;
  });

  protected readonly config: RepoPageConfig<CalendarioDeFestivos> = {
    titleKey: 'repositories.festivos.title',
    entitySingularKey: 'repositories.festivos.singular',
    createTitleKey: 'repositories.festivos.create_title',
    entityPluralKey: 'repositories.festivos.plural',
    toastsKey: 'repositories.festivos.toasts',
    simpleDelete: { titleKey: 'repositories.festivos.delete_dialog.title', titleBulkKey: 'repositories.festivos.delete_dialog.title_bulk' },
    icon: 'event_busy',
    breadcrumbExtraKey: 'repositories.festivos.title',
    columns: columnas((c) => this.horariosPorCalendario().get(c.id) ?? 0),
    fields: [{ key: 'name', labelKey: 'repositories.columns.name', type: 'text', required: true }],
    searchKeys: ['name', 'description'],
    filePrefix: 'festivos',
    sheetNameKey: 'repositories.festivos.title',
    uso: { aviso: (ids) => this.uso.aviso(ids), soltar: (ids) => this.uso.soltar(ids) },
    editRoute: '/admin/festivos',
    duplicable: true,
    duplicateAsCreate: true,
  };
}
