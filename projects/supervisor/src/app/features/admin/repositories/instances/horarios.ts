import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { GroupRef } from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';
import { GroupsStore } from '@features/admin/groups/state/groups.store';

import { DIAS_DE_LA_SEMANA } from '../components/horario/horario-semana.component';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoPageConfig } from '../components/repo-types';
import { HorarioUsoService, subcanalesConHorario } from '../state/horario-uso.service';
import { FestivosStore } from '../state/festivos.store';
import { ahoraEn, estadoEn, resumenDeLaSemana } from '../state/horarios.core.mjs';
import { type Horario, HorariosStore } from '../state/horarios.store';

interface Datos {
  readonly resumen: (h: Horario) => string;
  readonly ahora: (h: Horario) => string;
  readonly grupos: (h: Horario) => readonly GroupRef[];
}

/**
 * Nombre, descripción, disponibilidad (si ahora mismo se atiende), estado y uso (qué grupos lo usan, sus nombres al pasar,
 * como en Tipificaciones: DD-254). Lo demás, en su editor.
 */
const columnas = (d: Datos): readonly RepoColumnDef<Horario>[] => [
  // Sin ancho: es la columna que crece.
  { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (i) => i.name, emphasis: true, sortable: true },
  { key: 'description', labelKey: 'repositories.columns.description', kind: 'truncate', accessor: (i) => i.description, sortable: true },
  {
    key: 'now',
    // Disponibilidad: si ahora mismo se atiende con este horario (en su zona horaria).
    labelKey: 'repositories.horarios.col_availability',
    kind: 'status',
    width: '144px',
    accessor: d.ahora,
    sortable: true,
    statusMap: {
      open: { labelKey: 'repositories.horarios.open', tone: 'success' },
      closed: { labelKey: 'repositories.horarios.closed', tone: 'secondary' },
    },
  },
  {
    key: 'status',
    labelKey: 'repositories.columns.status',
    kind: 'status',
    width: '112px',
    accessor: (i) => i.status,
    sortable: true,
    statusMap: {
      // En masculino: un horario y un calendario (la clave compartida, «Activa», es de regla y categoría).
      active: { labelKey: 'repositories.horarios.active', tone: 'success' },
      inactive: { labelKey: 'repositories.horarios.inactive', tone: 'secondary' },
    },
  },
  {
    key: 'groups',
    labelKey: 'repositories.horarios.col_use',
    kind: 'groups',
    width: '160px',
    // Uso: los grupos que atienden con él. La cifra ordena y se exporta; la celda enseña el nombre si es uno y la cifra con los nombres al pasar si son más.
    accessor: (i) => String(d.grupos(i).length),
    groups: d.grupos,
    groupsDisplay: 'adaptive',
    sortable: true,
  },
];

@Component({
  selector: 'sc-horarios-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorariosPageComponent {
  private readonly uso = inject(HorarioUsoService);
  protected readonly store = inject(HorariosStore);
  private readonly festivos = inject(FestivosStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  /** Los grupos que atienden con cada horario (DD-152): los que lo tienen en un subcanal que lo usa de verdad (DD-252). */
  private readonly gruposPorHorario = computed(() => {
    const grupos = new Map<number, GroupRef[]>();
    for (const g of this.groupsStore.groups()) {
      for (const id of new Set(subcanalesConHorario(g).map((s) => s.id))) {
        grupos.set(id, [...(grupos.get(id) ?? []), { id: g.id, name: g.name, active: true }]);
      }
    }
    return grupos;
  });

  private readonly textos = computed(() => {
    this.lang();
    return {
      dias: DIAS_DE_LA_SEMANA.map((d) => this.translate.instant(`repositories.horarios.days_short.${d}`) as string),
      cerrado: this.translate.instant('repositories.horarios.closed') as string,
      siempre: this.translate.instant('repositories.horarios.all_day') as string,
    };
  });

  protected readonly config: RepoPageConfig<Horario> = {
    titleKey: 'repositories.horarios.title',
    entitySingularKey: 'repositories.horarios.singular',
    createTitleKey: 'repositories.horarios.create_title',
    entityPluralKey: 'repositories.horarios.plural',
    toastsKey: 'repositories.horarios.toasts',
    simpleDelete: { titleKey: 'repositories.horarios.delete_dialog.title', titleBulkKey: 'repositories.horarios.delete_dialog.title_bulk' },
    icon: 'schedule',
    breadcrumbExtraKey: 'repositories.horarios.title',
    columns: columnas({
      resumen: (h) => resumenDeLaSemana(h.week, this.textos().dias, this.textos().cerrado, this.textos().siempre),
      // Se pregunta en la zona del horario: «ahora» en México no es «ahora» en Madrid.
      ahora: (h) => {
        const { fecha, minutos } = ahoraEn(h.timezone);
        return estadoEn(h, fecha, minutos, this.festivos.items()).abierto ? 'open' : 'closed';
      },
      grupos: (h) => this.gruposPorHorario().get(h.id) ?? [],
    }),
    fields: [{ key: 'name', labelKey: 'repositories.columns.name', type: 'text', required: true, placeholderKey: 'repositories.horarios.name_placeholder' }],
    searchKeys: ['name', 'timezone', 'description'],
    filePrefix: 'horarios',
    sheetNameKey: 'repositories.horarios.title',
    uso: { aviso: (ids) => this.uso.aviso(ids), soltar: (ids) => this.uso.soltar(ids) },
    editRoute: '/admin/horarios',
    duplicable: true,
    duplicateAsCreate: true,
    columnChoices: true,
  };
}
