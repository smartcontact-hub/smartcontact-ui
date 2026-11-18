import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { injectLangChange } from '@core/utils/lang-change';

import { DIAS_DE_LA_SEMANA } from '../components/horario/horario-semana.component';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoPageConfig } from '../components/repo-types';
import { resumenDeLaSemana } from '../state/horarios.core.mjs';
import { HORARIOS_EN_EL_VUI } from '../state/horarios.semilla.mjs';
import { HorarioUsoService } from '../state/horario-uso.service';
import { HorariosTipoService } from '../state/horarios-tipo.service';
import { type HorarioTipo, HorariosTipoStore } from '../state/horarios-tipo.store';

/**
 * Los horarios: semanas tipo que se crean una vez y se usan en los calendarios que se quiera (como general o en un
 * periodo). La lista dice cuál es la semana y en cuántos calendarios se usa.
 */
@Component({
  selector: 'sc-horarios-tipo-page',
  imports: [RepoListPageComponent],
  template: `<sc-repo-list-page [config]="config" [store]="store" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorariosTipoPageComponent {
  protected readonly store = inject(HorariosTipoStore);
  private readonly servicio = inject(HorariosTipoService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  private readonly textos = computed(() => {
    this.lang();
    return {
      dias: DIAS_DE_LA_SEMANA.map((d) => this.translate.instant(`repositories.horarios.days_short.${d}`) as string),
      cerrado: this.translate.instant('repositories.horarios.closed') as string,
      siempre: this.translate.instant('repositories.horarios.all_day') as string,
    };
  });

  private readonly uso = inject(HorarioUsoService);

  /** «Calendarios, Grupos, VUI»: los sitios donde se usa el horario. Los calendarios, por su `weekId`; los grupos, por los calendarios
   *  con los que atienden; el VUI, por ahora un dato de ejemplo. «—» si no lo usa nadie. */
  protected usadoEn(id: number): string {
    this.lang();
    const calendarios = this.servicio.usos(id);
    const sitios: string[] = [];
    if (calendarios.length > 0) sitios.push(this.translate.instant('repositories.horariosTipo.use_calendars') as string);
    if (this.uso.grupos(new Set(calendarios.map((u) => u.calendario.id))).length > 0) sitios.push(this.translate.instant('repositories.horariosTipo.use_groups') as string);
    if (HORARIOS_EN_EL_VUI.has(id)) sitios.push(this.translate.instant('repositories.horariosTipo.use_vui') as string);
    return sitios.length > 0 ? sitios.join(', ') : '—';
  }

  private readonly columnas: readonly RepoColumnDef<HorarioTipo>[] = [
    { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (i) => i.name, emphasis: true, sortable: true },
    { key: 'description', labelKey: 'repositories.columns.description', kind: 'truncate', accessor: (i) => i.description, sortable: true },
    {
      key: 'week',
      labelKey: 'repositories.horarios.col_week',
      kind: 'truncate',
      colorOf: (h) => h.color,
      accessor: (h) => resumenDeLaSemana(h.week, this.textos().dias, this.textos().cerrado, this.textos().siempre),
    },
    {
      key: 'uses',
      labelKey: 'repositories.horariosTipo.col_uses',
      kind: 'truncate',
      width: '240px',
      // Dónde se usa, en una línea y separado por comas: Calendarios, Grupos, VUI (cada uno solo si de verdad lo usa).
      accessor: (h) => this.usadoEn(h.id),
      sortable: true,
    },
  ];

  protected readonly config: RepoPageConfig<HorarioTipo> = {
    titleKey: 'repositories.horariosTipo.title',
    entitySingularKey: 'repositories.horariosTipo.singular',
    createTitleKey: 'repositories.horariosTipo.create_title',
    entityPluralKey: 'repositories.horariosTipo.plural',
    toastsKey: 'repositories.horariosTipo.toasts',
    simpleDelete: { titleKey: 'repositories.horariosTipo.delete_dialog.title', titleBulkKey: 'repositories.horariosTipo.delete_dialog.title_bulk' },
    icon: 'view_week',
    breadcrumbExtraKey: 'repositories.horariosTipo.title',
    columns: this.columnas,
    fields: [{ key: 'name', labelKey: 'repositories.columns.name', type: 'text', required: true, placeholderKey: 'repositories.horariosTipo.name_placeholder' }],
    searchKeys: ['name', 'description'],
    filePrefix: 'horarios-tipo',
    sheetNameKey: 'repositories.horariosTipo.title',
    uso: { aviso: (ids) => this.servicio.aviso(ids), soltar: (ids) => this.servicio.soltar(ids) },
    editRoute: '/admin/horarios-tipo',
    duplicable: true,
    duplicateAsCreate: true,
  };
}
