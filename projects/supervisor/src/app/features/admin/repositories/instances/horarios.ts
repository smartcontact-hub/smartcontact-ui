import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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
  readonly grupos: (h: Horario) => number;
}

/**
 * Nombre, la semana habitual en una línea, si ahora mismo se atiende, cuántos periodos y fechas especiales lleva,
 * cuántos grupos lo usan, su zona y su estado. Lo demás, en su editor.
 */
const columnas = (d: Datos): readonly RepoColumnDef<Horario>[] => [
  // Sin ancho: es la columna que crece.
  { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (i) => i.name, emphasis: true, sortable: true },
  { key: 'week', labelKey: 'repositories.horarios.col_week', kind: 'truncate', accessor: d.resumen },
  {
    key: 'now',
    labelKey: 'repositories.horarios.col_now',
    kind: 'status',
    width: '112px',
    accessor: d.ahora,
    statusMap: {
      open: { labelKey: 'repositories.horarios.open', tone: 'success' },
      closed: { labelKey: 'repositories.horarios.closed', tone: 'secondary' },
    },
  },
  { key: 'periods', labelKey: 'repositories.horarios.col_periods', kind: 'count', width: '104px', accessor: (i) => String(i.periods.length), emptyDash: true, sortable: true },
  { key: 'specials', labelKey: 'repositories.horarios.col_specials', kind: 'count', width: '144px', accessor: (i) => String(i.specials.length), emptyDash: true, sortable: true },
  { key: 'groups', labelKey: 'repositories.horarios.col_groups', kind: 'count', width: '104px', accessor: (i) => String(d.grupos(i)), emptyDash: true, sortable: true },
  { key: 'timezone', labelKey: 'repositories.horarios.timezone', kind: 'text', accessor: (i) => i.timezone, width: '176px', sortable: true },
  {
    key: 'status',
    labelKey: 'repositories.columns.status',
    kind: 'status',
    width: '96px',
    accessor: (i) => i.status,
    statusMap: {
      active: { labelKey: 'repositories.status.active', tone: 'success' },
      inactive: { labelKey: 'repositories.status.inactive', tone: 'secondary' },
    },
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

  /** Cuántos grupos atienden con cada horario (DD-152): los que lo tienen en un subcanal que lo usa de verdad (DD-252). */
  private readonly gruposPorHorario = computed(() => {
    const cuenta = new Map<number, number>();
    for (const g of this.groupsStore.groups()) {
      for (const id of new Set(subcanalesConHorario(g).map((s) => s.id))) cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
    }
    return cuenta;
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
      grupos: (h) => this.gruposPorHorario().get(h.id) ?? 0,
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
