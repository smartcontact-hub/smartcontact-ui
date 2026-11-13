import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { GroupRef } from '@smartcontact-hub/components';

import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { RepoListPageComponent } from '@features/admin/repositories/components/repo-list-page.component';
import type { RepoColumnDef, RepoPageConfig } from '@features/admin/repositories/components/repo-types';
import { FestivosStore } from '@features/admin/repositories/state/festivos.store';
import { HorarioUsoService, subcanalesConHorario } from '@features/admin/repositories/state/horario-uso.service';
import { resumenDeLaSemana } from '@features/admin/repositories/state/horarios.core.mjs';
import { type Horario, HorariosStore } from '@features/admin/repositories/state/horarios.store';

import { estadoDeHorario } from './lab-horarios-estado';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * LABORATORIO: el listado de horarios con «Ahora» y «Estado» en UNA columna. Inactivo no tiene «ahora»; activo dice
 * abierto o cerrado y cuándo cambia («cierra a las 18:00», «abre el lun a las 09:00»), en la zona del horario.
 * Periodos y fechas especiales salen de la tabla: se ven en el horario, y su cifra no decía nada.
 */
@Component({
  selector: 'sc-lab-horarios-list',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabHorariosListComponent {
  private readonly uso = inject(HorarioUsoService);
  protected readonly store = inject(HorariosStore);
  private readonly festivos = inject(FestivosStore);
  private readonly groupsStore = inject(GroupsStore);

  private readonly gruposPorHorario = computed(() => {
    const grupos = new Map<number, GroupRef[]>();
    for (const g of this.groupsStore.groups()) {
      for (const id of new Set(subcanalesConHorario(g).map((s) => s.id))) grupos.set(id, [...(grupos.get(id) ?? []), { id: g.id, name: g.name, active: true }]);
    }
    return grupos;
  });

  private readonly columnas: readonly RepoColumnDef<Horario>[] = [
    { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (i) => i.name, emphasis: true, sortable: true },
    {
      key: 'status',
      labelKey: 'repositories.columns.status',
      kind: 'status',
      width: '264px',
      accessor: (h) => estadoDeHorario(h, this.festivos.items()).clave,
      statusDetail: (h) => estadoDeHorario(h, this.festivos.items()).detalle,
      statusMap: {
        open: { labelKey: 'repositories.horarios.open', tone: 'success' },
        closed: { labelKey: 'repositories.horarios.closed', tone: 'secondary' },
        inactive: { labelKey: 'repositories.horarios.inactive', tone: 'warning' },
      },
    },
    { key: 'week', labelKey: 'repositories.horarios.col_week', kind: 'truncate', accessor: (h) => resumenDeLaSemana(h.week, DIAS, 'Cerrado', 'Todo el día') },
    {
      key: 'groups',
      labelKey: 'repositories.horarios.col_groups',
      kind: 'groups',
      width: '120px',
      accessor: (i) => String(this.gruposPorHorario().get(i.id)?.length ?? 0),
      groups: (h) => this.gruposPorHorario().get(h.id) ?? [],
      groupsDisplay: 'adaptive',
      sortable: true,
    },
    { key: 'timezone', labelKey: 'repositories.horarios.timezone', kind: 'text', accessor: (i) => i.timezone.replace(/_/g, ' '), width: '192px', sortable: true },
  ];

  protected readonly config: RepoPageConfig<Horario> = {
    titleKey: 'repositories.horarios.title',
    entitySingularKey: 'repositories.horarios.singular',
    createTitleKey: 'repositories.horarios.create_title',
    entityPluralKey: 'repositories.horarios.plural',
    toastsKey: 'repositories.horarios.toasts',
    simpleDelete: { titleKey: 'repositories.horarios.delete_dialog.title', titleBulkKey: 'repositories.horarios.delete_dialog.title_bulk' },
    icon: 'schedule',
    breadcrumbExtraKey: 'repositories.horarios.title',
    columns: this.columnas,
    fields: [{ key: 'name', labelKey: 'repositories.columns.name', type: 'text', required: true }],
    searchKeys: ['name', 'timezone', 'description'],
    filePrefix: 'horarios',
    sheetNameKey: 'repositories.horarios.title',
    uso: { aviso: (ids) => this.uso.aviso(ids), soltar: (ids) => this.uso.soltar(ids) },
    editRoute: '/lab/horarios',
    duplicable: true,
    duplicateAsCreate: true,
  };
}
