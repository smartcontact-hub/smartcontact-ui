import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { injectLangChange } from '@core/utils/lang-change';
import { GroupsStore } from '@features/admin/groups/state/groups.store';

import { DIAS_DE_LA_SEMANA } from '../components/horario/horario-semana.component';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoPageConfig, ScheduleCell, UseEntry } from '../components/repo-types';
import { HorarioUsoService } from '../state/horario-uso.service';
import { CLAVE_DE_USO, ICONO_DE_USO, usosDelHorario } from '../state/horario-usos';
import { FestivosStore } from '../state/festivos.store';
import { ahoraEn, estadoEn, gruposDeLaSemana, MINUTOS_DEL_DIA, resumenDeLaSemana, textoDeFranja } from '../state/horarios.core.mjs';
import { type Horario, HorariosStore } from '../state/horarios.store';

interface Datos {
  readonly resumen: (h: Horario) => string;
  readonly celda: (h: Horario) => ScheduleCell;
  readonly ahora: (h: Horario) => string;
  readonly uso: (h: Horario) => string;
  readonly usos: (h: Horario) => readonly UseEntry[];
}

/**
 * Nombre, descripción, horario (la semana en texto), estado y uso (qué grupos lo usan, sus nombres al pasar,
 * como en Tipificaciones: DD-254). Lo demás, en su editor.
 */
const columnas = (d: Datos): readonly RepoColumnDef<Horario>[] => [
  // Sin ancho: es la columna que crece.
  { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (i) => i.name, emphasis: true, sortable: true },
  { key: 'description', labelKey: 'repositories.columns.description', kind: 'truncate', accessor: (i) => i.description, sortable: true },
  {
    key: 'week',
    // El horario dibujado: grupos de días con su franja y su barra de 24 h; el detalle por día, en el tooltip.
    labelKey: 'repositories.horarios.col_schedule',
    kind: 'schedule',
    width: '360px',
    accessor: d.resumen,
    schedule: d.celda,
    scheduleMax: 2,
  },
  {
    key: 'groups',
    labelKey: 'repositories.horarios.col_use',
    kind: 'uses',
    width: '260px',
    // Uso: los sitios donde se usa (Grupos, Calendarios), cada uno con su cifra y, al pasar el ratón, sus nombres.
    accessor: d.uso,
    uses: d.usos,
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

  /** Los sitios donde se usa un horario, en una línea: «Grupos, VUI, Buzones de email». */
  private usoTexto(id: number): string {
    this.lang();
    return usosDelHorario(id, this.groupsStore.groups())
      .map((u) => this.translate.instant(`repositories.horarios.uses.${CLAVE_DE_USO[u.tipo]}`) as string)
      .join(', ');
  }

  private readonly textos = computed(() => {
    this.lang();
    return {
      dias: DIAS_DE_LA_SEMANA.map((d) => this.translate.instant(`repositories.horarios.days_short.${d}`) as string),
      diasLargos: DIAS_DE_LA_SEMANA.map((d) => this.translate.instant(`repositories.horarios.days.${d}`) as string),
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
      celda: (h) => {
        const { dias, diasLargos, cerrado, siempre } = this.textos();
        const cerrados = new Set(h.closedDays ?? []);
        const grupos = gruposDeLaSemana(h.week).map((g) => {
          const todoElDia = g.desde === 0 && g.hasta === 6 && g.franjas.length === 1 && g.franjas[0][0] === 0 && g.franjas[0][1] === MINUTOS_DEL_DIA;
          return {
            label: todoElDia ? siempre : g.desde === g.hasta ? dias[g.desde] : `${dias[g.desde]}–${dias[g.hasta]}`,
            text: todoElDia ? '' : g.franjas.map(textoDeFranja).join(', '),
            segments: g.franjas.flatMap((f): { left: number; width: number }[] =>
              f[1] > f[0]
                ? [{ left: (f[0] / MINUTOS_DEL_DIA) * 100, width: ((f[1] - f[0]) / MINUTOS_DEL_DIA) * 100 }]
                : [
                    { left: (f[0] / MINUTOS_DEL_DIA) * 100, width: ((MINUTOS_DEL_DIA - f[0]) / MINUTOS_DEL_DIA) * 100 },
                    ...(f[1] > 0 ? [{ left: 0, width: (f[1] / MINUTOS_DEL_DIA) * 100 }] : []),
                  ],
            ),
          };
        });
        return {
          groups: grupos,
          days: diasLargos.map((name, i) => {
            const fr = h.week[i] ?? [];
            return fr.length > 0
              ? { name, lines: fr.map(textoDeFranja), closed: false }
              : { name, lines: [cerrados.has(i) ? cerrado : '—'], closed: cerrados.has(i) };
          }),
        };
      },
      resumen: (h) => resumenDeLaSemana(h.week, this.textos().dias, this.textos().cerrado, this.textos().siempre),
      // Se pregunta en la zona del horario: «ahora» en México no es «ahora» en Madrid.
      ahora: (h) => {
        const { fecha, minutos } = ahoraEn(h.timezone);
        return estadoEn(h, fecha, minutos, this.festivos.items()).abierto ? 'open' : 'closed';
      },
      uso: (h) => this.usoTexto(h.id),
      usos: (h) => {
        this.lang();
        return usosDelHorario(h.id, this.groupsStore.groups()).map((u) => ({
          label: this.translate.instant(`repositories.horarios.uses.${CLAVE_DE_USO[u.tipo]}`) as string,
          icon: ICONO_DE_USO[u.tipo],
          tone: u.tipo === 'grupos' ? ('info' as const) : ('warning' as const),
          names: u.items.map((i) => i.nombre),
        }));
      },
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
