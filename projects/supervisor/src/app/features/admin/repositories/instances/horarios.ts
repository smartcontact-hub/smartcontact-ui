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
import { ahoraEn, diaDeLaSemana, estadoEn, horaDe, resumenDeLaSemana, sumarDias } from '../state/horarios.core.mjs';
import { type Horario, HorariosStore } from '../state/horarios.store';

interface Datos {
  readonly resumen: (h: Horario) => string;
  readonly ahora: (h: Horario) => string;
  readonly grupos: (h: Horario) => readonly GroupRef[];
  /** «hasta las 18:00» / «abre el lun 09:00». */
  readonly matiz: (h: Horario) => string;
}

/**
 * Nombre, la semana habitual en una línea, si ahora mismo se atiende, cuántos periodos y fechas especiales lleva,
 * qué grupos lo usan (sus nombres al pasar, como en Tipificaciones: DD-254), su zona y su estado. Lo demás, en su editor.
 */
const columnas = (d: Datos): readonly RepoColumnDef<Horario>[] => [
  // Sin ancho: es la columna que crece.
  { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (i) => i.name, emphasis: true, sortable: true },
  { key: 'week', labelKey: 'repositories.horarios.col_week', kind: 'truncate', accessor: d.resumen },
  {
    key: 'now',
    // «Ahora» no decía a qué se refería: es si el IVR atiende en este momento (en la zona del horario), con lo que viene después.
    labelKey: 'repositories.horarios.col_now',
    kind: 'availability',
    width: '248px',
    accessor: d.ahora,
    detail: d.matiz,
    statusMap: {
      open: { labelKey: 'repositories.horarios.x.in_hours', tone: 'success', icon: 'check_circle' },
      closed: { labelKey: 'repositories.horarios.x.out_of_hours', tone: 'secondary', icon: 'do_not_disturb_on' },
    },
  },
  { key: 'periods', labelKey: 'repositories.horarios.col_periods', kind: 'count', width: '104px', accessor: (i) => String(i.periods.length), emptyDash: true, sortable: true },
  { key: 'specials', labelKey: 'repositories.horarios.col_specials', kind: 'count', width: '144px', accessor: (i) => String(i.specials.length), emptyDash: true, sortable: true },
  {
    key: 'groups',
    labelKey: 'repositories.horarios.col_groups',
    kind: 'groups',
    width: '104px',
    // La cifra ordena y se exporta; la celda enseña el nombre si es uno y la cifra con los nombres al pasar si son más.
    accessor: (i) => String(d.grupos(i).length),
    groups: d.grupos,
    // La cifra siempre, con los nombres al pasar (como Equipos): el nombre suelto cambiaba el ancho y el alineado de la columna.
    groupsDisplay: 'count',
    emptyAsZero: true,
    sortable: true,
  },
  { key: 'timezone', labelKey: 'repositories.horarios.timezone', kind: 'text', accessor: (i) => i.timezone, width: '176px', sortable: true },
  {
    key: 'status',
    labelKey: 'repositories.columns.status',
    kind: 'status',
    // Un glifo, no una segunda pastilla junto a «Ahora»: dos pastillas iguales en la misma fila leían como lo mismo.
    statusDisplay: 'icon',
    width: '96px',
    accessor: (i) => i.status,
    statusMap: {
      // En masculino: un horario y un calendario (la clave compartida, «Activa», es de regla y categoría).
      active: { labelKey: 'repositories.horarios.active', tone: 'success', icon: 'check_circle' },
      inactive: { labelKey: 'repositories.horarios.inactive', tone: 'secondary', icon: 'pause_circle' },
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

  /** Cuándo cambia el estado de ahora: «hasta las 18:00» si atiende, «abre mañana 09:00» si no. */
  private matizDe(h: Horario): string {
    const lang = this.lang();
    void lang;
    const { fecha, minutos } = ahoraEn(h.timezone);
    const estado = estadoEn(h, fecha, minutos, this.festivos.items());
    if (!estado.cambia) return '';
    const hora = horaDe(estado.cambia.minutos);
    const t = (k: string, p?: Record<string, unknown>): string => this.translate.instant(`repositories.horarios.x.now_detail.${k}`, p);
    if (estado.abierto) return estado.cambia.fecha === fecha ? t('until', { time: hora }) : t('until_day', { day: this.diaCorto(estado.cambia.fecha), time: hora });
    if (estado.cambia.fecha === fecha) return t('opens_today', { time: hora });
    if (estado.cambia.fecha === sumarDias(fecha, 1)) return t('opens_tomorrow', { time: hora });
    return t('opens_day', { day: this.diaCorto(estado.cambia.fecha), time: hora });
  }

  private diaCorto(iso: string): string {
    return this.translate.instant(`repositories.horarios.days_short.${DIAS_DE_LA_SEMANA[diaDeLaSemana(iso)]}`);
  }

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
      matiz: (h) => this.matizDe(h),
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
