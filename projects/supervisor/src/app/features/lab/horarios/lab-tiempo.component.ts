import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { type GroupRef, ScButtonComponent, ScTabsComponent, ScTagComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TooltipModule } from 'primeng/tooltip';
import { map } from 'rxjs';

import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { RepoListPageComponent } from '@features/admin/repositories/components/repo-list-page.component';
import type { RepoColumnDef, RepoPageConfig } from '@features/admin/repositories/components/repo-types';
import { type CalendarioDeFestivos, FestivosStore } from '@features/admin/repositories/state/festivos.store';
import { FestivosUsoService, HorarioUsoService, subcanalesConHorario } from '@features/admin/repositories/state/horario-uso.service';
import { ahoraEn, resumenDeLaSemana } from '@features/admin/repositories/state/horarios.core.mjs';
import { type Horario, HorariosStore } from '@features/admin/repositories/state/horarios.store';

import { CeldaVaciaComponent } from '@shared/components';

import { estadoDeHorario } from './lab-horarios-estado';
import { LabImportarListaComponent } from './lab-importar-lista.component';
import { horas, LabSemanaMiniComponent, minutosDeLaSemana } from './lab-semana-mini.component';
import { activarLabHorarios } from './lab-modo';
import { T } from './lab-textos';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * LABORATORIO: «Tiempo», la clasificación de Repositorios con lo relativo al tiempo en dos listas. Horarios: cuándo se
 * atiende, con «Ahora» y «Estado» en UNA columna (inactivo no tiene «ahora»; activo dice abierto o cerrado y cuándo
 * cambia). Festivos: listas de días cerrados que se mantienen una vez y aplican varios horarios; cada una dice en
 * cuántos horarios se usa y su próximo día, y se crean importando el calendario oficial.
 */
@Component({
  selector: 'sc-lab-tiempo',
  imports: [
    CeldaVaciaComponent,
    LabImportarListaComponent,
    LabSemanaMiniComponent,
    RepoListPageComponent,
    ScButtonComponent,
    ScIconComponent,
    ScTabsComponent,
    ScTagComponent,
    TooltipModule,
  ],
  template: `
    <!-- Las celdas que dibujan (de la versión premium, con las piezas y los tokens del DS): el nombre con su zona
         debajo, la semana en miniatura con su resumen y lo que cambia la semana. Las demás son las de siempre. -->
    <ng-template #nombreTpl let-h>
      <span class="nombre">
        <span class="nombre__titulo sc-text-body-semibold" [pTooltip]="h.name" showOnEllipsis tooltipPosition="top">{{ h.name }}</span>
        <span class="nombre__zona sc-text-caption-regular"><sc-icon name="public" size="inherit" />{{ fila(h).zona }}</span>
      </span>
    </ng-template>
    <ng-template #semanaTpl let-h>
      @let f = fila(h);
      <span class="semana">
        <sc-lab-semana-mini [semana]="h.week" [hoy]="f.hoy" [ahora]="f.ahora" [inactivo]="h.status === 'inactive'" [resumen]="f.resumen" />
        <span class="semana__txt">
          <span class="semana__resumen sc-text-body-regular" [pTooltip]="f.resumen" showOnEllipsis tooltipPosition="top">{{ f.resumen }}</span>
          <span class="semana__horas sc-text-caption-regular">{{ f.horas }} a la semana</span>
        </span>
      </span>
    </ng-template>
    <ng-template #cambiosTpl let-h>
      @let f = fila(h);
      @if (f.listas + f.periodos + f.especiales === 0) {
        <sc-celda-vacia />
      } @else {
        <span class="cambios">
          @if (f.listas) {
            <sc-tag severity="danger" icon="event_busy" [value]="f.listas + ''" [pTooltip]="t.listasDeFestivos(f.listas)" tooltipPosition="top" tooltipEvent="both" />
          }
          @if (f.periodos) {
            <sc-tag severity="info" icon="wb_sunny" [value]="f.periodos + ''" [pTooltip]="t.periodos(f.periodos)" tooltipPosition="top" tooltipEvent="both" />
          }
          @if (f.especiales) {
            <sc-tag severity="warning" icon="star" [value]="f.especiales + ''" [pTooltip]="t.diasEspeciales(f.especiales)" tooltipPosition="top" tooltipEvent="both" />
          }
        </span>
      }
    </ng-template>

    @if (lista() === 'horarios') {
      <sc-repo-list-page [config]="config" [store]="store" [cellTemplates]="{ name: nombreTpl, week: semanaTpl, changes: cambiosTpl }">
        <div repoBeforeToolbar class="pestanas">
          <sc-tabs [tabs]="pestanas()" [ariaLabel]="t.listas" [value]="lista()" (valueChange)="ir($event)" />
          <sc-button variant="secondary" appearance="text" size="sm" label="Volver a la versión original" (clicked)="salirDelLab()" />
        </div>
      </sc-repo-list-page>
    } @else {
      <sc-repo-list-page [config]="configFestivos" [store]="festivos">
        <div repoBeforeToolbar>
          <div class="pestanas">
            <sc-tabs [tabs]="pestanas()" [ariaLabel]="t.listas" [value]="lista()" (valueChange)="ir($event)" />
            <sc-button variant="secondary" appearance="text" size="sm" label="Volver a la versión original" (clicked)="salirDelLab()" />
            <sc-button variant="secondary" appearance="outlined" icon="upload" label="Importar festivos oficiales" (clicked)="importando.set(true)" />
          </div>
          <!-- Cómo va, en tres pasos y a la vista: crear, marcar, aplicar. Y dónde se quita cada cosa. -->
          <ol class="pasos sc-text-caption-regular">
            <li><span class="pasos__n sc-text-caption-semibold">1</span>Crea una lista o impórtala de tu país o región</li>
            <li><span class="pasos__n sc-text-caption-semibold">2</span>Ábrela y marca o quita días en su calendario</li>
            <li><span class="pasos__n sc-text-caption-semibold">3</span>Enciéndela en los horarios que deben cerrar esos días</li>
          </ol>
          <p class="quitar sc-text-caption-regular">Para que un horario deje de usarla, apágala en la lista o pulsa ✕ en el horario. Para borrarla del todo, ⋮ y Eliminar.</p>
        </div>
      </sc-repo-list-page>
    }
    @if (importando()) {
      <sc-lab-importar-lista (creada)="creada($event)" (cerrado)="importando.set(false)" />
    }
  `,
  styles: `
    :host { display: block; height: 100%; }
    .nombre, .semana__txt { display: flex; flex-direction: column; min-inline-size: 0; }
    .nombre__titulo, .semana__resumen { overflow: hidden; color: var(--sc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
    .nombre__zona { display: flex; align-items: center; gap: var(--sc-spacing-0-25); color: var(--sc-text-secondary); white-space: nowrap; }
    .semana { display: flex; align-items: center; gap: var(--sc-spacing-1); min-inline-size: 0; }
    .semana__horas { color: var(--sc-text-secondary); white-space: nowrap; }
    .cambios { display: flex; gap: var(--sc-spacing-0-5); }
    .pestanas { display: flex; align-items: center; gap: var(--sc-spacing-1); margin-block-end: var(--sc-spacing-1); }
    .pestanas sc-tabs { flex: 1; }
    .pasos { display: flex; flex-wrap: wrap; gap: var(--sc-spacing-0-5) var(--sc-spacing-2); margin: 0 0 var(--sc-spacing-0-5); padding: 0; list-style: none; color: var(--sc-text-primary); }
    .pasos li { display: flex; align-items: center; gap: var(--sc-spacing-0-5); }
    .pasos__n { display: inline-grid; place-items: center; inline-size: 1.25rem; block-size: 1.25rem; border-radius: var(--sc-radius-full); background: var(--sc-bg-primary); color: var(--sc-text-on-primary); }
    .quitar { margin: 0 0 var(--sc-spacing-1); color: var(--sc-text-secondary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabTiempoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly uso = inject(HorarioUsoService);
  private readonly usoFestivos = inject(FestivosUsoService);
  protected readonly store = inject(HorariosStore);
  protected readonly festivos = inject(FestivosStore);
  private readonly groupsStore = inject(GroupsStore);

  protected readonly t = T;
  protected readonly importando = signal(false);

  /** El reloj de la tabla: la marca de «ahora» de cada semana se mueve cada 30 s. */
  private readonly ahora = signal(new Date());
  constructor() {
    const id = setInterval(() => this.ahora.set(new Date()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
  protected readonly lista = toSignal(this.route.queryParamMap.pipe(map((q) => (q.get('lista') === 'festivos' ? 'festivos' : 'horarios'))), {
    initialValue: 'horarios',
  });

  protected readonly pestanas = computed(() => [
    { value: 'horarios', label: `Horarios (${this.store.items().length})`, icon: 'schedule' },
    { value: 'festivos', label: `Festivos (${this.festivos.items().length})`, icon: 'event_busy' },
  ]);

  protected ir(valor: string | number | undefined): void {
    void this.router.navigate([], { queryParams: { lista: valor === 'festivos' ? 'festivos' : null }, replaceUrl: true });
  }

  /** Apaga el modo rediseño: Repositorios vuelve a llevar a las pantallas de siempre. */
  protected salirDelLab(): void {
    activarLabHorarios(false);
    void this.router.navigateByUrl(this.lista() === 'festivos' ? '/admin/festivos' : '/admin/horarios');
  }

  protected creada(c: CalendarioDeFestivos): void {
    this.importando.set(false);
    void this.router.navigateByUrl(`/lab/horarios/festivos/editar/${c.id}`);
  }

  /* ── Horarios ─────────────────────────────────────────────────────────────────────────────────────────────────── */

  private readonly gruposPorHorario = computed(() => {
    const grupos = new Map<number, GroupRef[]>();
    for (const g of this.groupsStore.groups()) {
      for (const id of new Set(subcanalesConHorario(g).map((s) => s.id))) grupos.set(id, [...(grupos.get(id) ?? []), { id: g.id, name: g.name, active: true }]);
    }
    return grupos;
  });

  /** Lo que dibujan las celdas propias de cada horario: su zona, su semana y lo que la cambia. */
  private readonly filas = computed(() => {
    const cuando = this.ahora();
    const listas = new Set(this.festivos.items().map((c) => c.id));
    return new Map(
      this.store.items().map((h) => {
        const { fecha, minutos } = ahoraEn(h.timezone, cuando);
        return [
          h.id,
          {
            zona: h.timezone.replace(/_/g, ' '),
            hoy: (new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7,
            ahora: minutos,
            resumen: resumenDeLaSemana(h.week, DIAS, 'Cerrado toda la semana', 'Abierto 24/7'),
            horas: horas(minutosDeLaSemana(h.week)),
            listas: h.holidayCalendarIds.filter((id) => listas.has(id)).length,
            periodos: h.periods.length,
            especiales: h.specials.length,
          },
        ] as const;
      }),
    );
  });

  protected fila(h: Horario) {
    return this.filas().get(h.id) ?? { zona: '', hoy: null, ahora: null, resumen: '', horas: '', listas: 0, periodos: 0, especiales: 0 };
  }

  /** Las columnas de la versión premium: Horario (con su zona), Ahora, Semana, Cambia la semana y Lo usan. */
  private readonly columnas: readonly RepoColumnDef<Horario>[] = [
    { key: 'name', labelKey: 'Horario', kind: 'text', width: '20%', accessor: (i) => i.name, emphasis: true, sortable: true },
    {
      key: 'status',
      labelKey: 'Ahora',
      kind: 'status',
      width: '216px',
      accessor: (h) => estadoDeHorario(h, this.festivos.items()).clave,
      statusDetail: (h) => estadoDeHorario(h, this.festivos.items()).detalle,
      statusMap: {
        open: { labelKey: 'repositories.horarios.open', tone: 'success' },
        closed: { labelKey: 'repositories.horarios.closed', tone: 'secondary' },
        inactive: { labelKey: 'repositories.horarios.inactive', tone: 'warning' },
      },
    },
    { key: 'week', labelKey: 'Semana', kind: 'truncate', accessor: (h) => resumenDeLaSemana(h.week, DIAS, 'Cerrado toda la semana', 'Abierto 24/7') },
    {
      key: 'changes',
      labelKey: 'Cambia la semana',
      kind: 'count',
      width: '184px',
      accessor: (h) => String(this.fila(h).listas + h.periods.length + h.specials.length),
      sortable: true,
    },
    {
      key: 'groups',
      labelKey: 'Lo usan',
      kind: 'groups',
      width: '136px',
      accessor: (i) => String(this.gruposPorHorario().get(i.id)?.length ?? 0),
      groups: (h) => this.gruposPorHorario().get(h.id) ?? [],
      groupsDisplay: 'adaptive',
      sortable: true,
    },
  ];

  protected readonly config: RepoPageConfig<Horario> = {
    titleKey: 'Tiempo',
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

  /* ── Festivos ─────────────────────────────────────────────────────────────────────────────────────────────────── */

  /** Cuántos horarios aplican cada lista. */
  private readonly usosDeLista = computed(() => {
    const n = new Map<number, number>();
    for (const h of this.store.items()) for (const id of h.holidayCalendarIds) n.set(id, (n.get(id) ?? 0) + 1);
    return n;
  });

  /** El próximo día cerrado de una lista: «8 dic, Inmaculada Concepción». */
  private proximo(c: CalendarioDeFestivos): string {
    const hoy = ahoraEn('Europe/Madrid').fecha;
    const anio = Number(hoy.slice(0, 4));
    const d = c.days
      .flatMap((x) => (x.yearly ? [{ ...x, date: `${anio}${x.date.slice(4)}` }, { ...x, date: `${anio + 1}${x.date.slice(4)}` }] : [x]))
      .filter((x) => x.date >= hoy)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!d) return '';
    return `${new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(new Date(`${d.date}T12:00:00`))}, ${d.name}`;
  }

  protected readonly configFestivos: RepoPageConfig<CalendarioDeFestivos> = {
    titleKey: 'Tiempo',
    entitySingularKey: 'repositories.festivos.singular',
    createTitleKey: 'repositories.festivos.create_title',
    entityPluralKey: 'repositories.festivos.plural',
    toastsKey: 'repositories.festivos.toasts',
    simpleDelete: { titleKey: 'repositories.festivos.delete_dialog.title', titleBulkKey: 'repositories.festivos.delete_dialog.title_bulk' },
    icon: 'event_busy',
    breadcrumbExtraKey: 'repositories.festivos.title',
    columns: [
      { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (i) => i.name, emphasis: true, sortable: true },
      { key: 'days', labelKey: 'repositories.festivos.col_days', kind: 'count', width: '96px', accessor: (i) => String(i.days.length), sortable: true },
      { key: 'next', labelKey: 'Próximo', kind: 'truncate', accessor: (c) => this.proximo(c), emptyDash: true },
      { key: 'schedules', labelKey: 'repositories.festivos.col_schedules', kind: 'count', width: '128px', accessor: (c) => String(this.usosDeLista().get(c.id) ?? 0), sortable: true },
      {
        key: 'status',
        labelKey: 'repositories.columns.status',
        kind: 'status',
        width: '112px',
        accessor: (i) => i.status,
        statusMap: {
          active: { labelKey: 'repositories.festivos.active', tone: 'success' },
          inactive: { labelKey: 'repositories.festivos.inactive', tone: 'warning' },
        },
      },
    ],
    fields: [{ key: 'name', labelKey: 'repositories.columns.name', type: 'text', required: true }],
    searchKeys: ['name', 'description'],
    filePrefix: 'festivos',
    sheetNameKey: 'repositories.festivos.title',
    uso: { aviso: (ids) => this.usoFestivos.aviso(ids), soltar: (ids) => this.usoFestivos.soltar(ids) },
    editRoute: '/lab/horarios/festivos',
    duplicable: true,
    duplicateAsCreate: true,
  };
}
