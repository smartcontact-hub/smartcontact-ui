import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { GroupRef } from '@smartcontact-hub/components';

import { ResultadoAccionService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';

import { DIAS_DE_LA_SEMANA } from '../components/horario/horario-semana.component';
import { type HorarioNuevo, HorarioTipoNuevoModalComponent } from '../components/horario/horario-tipo-nuevo-modal.component';
import { RepoListPageComponent } from '../components/repo-list-page.component';
import { RepoColumnDef, RepoPageConfig } from '../components/repo-types';
import { resumenDeLaSemana } from '../state/horarios.core.mjs';
import { HorariosTipoService } from '../state/horarios-tipo.service';
import { type HorarioTipo, HorariosTipoStore } from '../state/horarios-tipo.store';

/**
 * Los horarios: semanas tipo que se crean una vez y se usan en los calendarios que se quiera (como general o en un
 * periodo). La lista dice cuál es la semana y en cuántos calendarios se usa.
 */
@Component({
  selector: 'sc-horarios-tipo-page',
  imports: [HorarioTipoNuevoModalComponent, RepoListPageComponent],
  template: `
    <sc-repo-list-page [config]="config" [store]="store" />
    @if (altaDialog()) {
      <sc-horario-tipo-nuevo-modal (guardar)="crear($event)" (cerrado)="altaDialog.set(false)" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorariosTipoPageComponent {
  protected readonly store = inject(HorariosTipoStore);
  private readonly servicio = inject(HorariosTipoService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly resultado = inject(ResultadoAccionService);
  protected readonly altaDialog = signal(false);

  protected crear(h: HorarioNuevo): void {
    const creado = this.store.addItem(h);
    this.altaDialog.set(false);
    this.resultado.contar(this.translate.instant('repositories.horariosTipo.toasts.created', { name: creado.name }));
  }

  private readonly textos = computed(() => {
    this.lang();
    return {
      dias: DIAS_DE_LA_SEMANA.map((d) => this.translate.instant(`repositories.horarios.days_short.${d}`) as string),
      cerrado: this.translate.instant('repositories.horarios.closed') as string,
      siempre: this.translate.instant('repositories.horarios.all_day') as string,
    };
  });

  private readonly columnas: readonly RepoColumnDef<HorarioTipo>[] = [
    { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (i) => i.name, emphasis: true, sortable: true },
    {
      key: 'week',
      labelKey: 'repositories.horarios.col_week',
      kind: 'truncate',
      accessor: (h) => resumenDeLaSemana(h.week, this.textos().dias, this.textos().cerrado, this.textos().siempre),
    },
    {
      key: 'uses',
      labelKey: 'repositories.horariosTipo.col_uses',
      kind: 'groups',
      width: '280px',
      // Los calendarios que lo usan: «—» si ninguno, su nombre si es uno y, con varios, la cifra con sus nombres al pasar.
      accessor: (h) => String(this.servicio.cuantos(h.id)),
      groups: (h) => this.servicio.usos(h.id).map((u): GroupRef => ({ id: u.calendario.id, name: u.calendario.name, active: u.calendario.status === 'active' })),
      groupsDisplay: 'adaptive',
      groupsAriaKey: 'repositories.horariosTipo.uses_aria',
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
    crearAlPulsar: () => this.altaDialog.set(true),
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
