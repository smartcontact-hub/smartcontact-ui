import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, Injector, linkedSignal, type OnInit, signal, type TemplateRef, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScButtonComponent as ButtonComponent,
  ScCheckboxComponent as CheckboxComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  type ScColumnHeaderContext,
  type ScDatatableSortEvent,
  ScDatatableComponent as DatatableComponent,
  ScInputTextComponent as InputTextComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSubsectionComponent as SubsectionComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { LlegaAlPieDirective } from '@core/directives';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { AssignBarComponent, type AssignFilter, PresenceAvatarComponent } from '@shared/components';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import type { Agent } from '@features/admin/agents/data/agents-data';

import { EquiposStore } from '../state/equipos.store';
import { BreadcrumbService, ResultadoAccionService } from '@core/services';
import { TooltipModule } from 'primeng/tooltip';
import { ayudaDeObligatorio, dejoElCampo, llegarAAncla, ocasionDeAvisar } from '@shared/utils/alta-secciones';

interface Borrador {
  readonly name: string;
  readonly description: string;
  readonly agentIds: ReadonlySet<number>;
}

const VACIO: Borrador = { name: '', description: '', agentIds: new Set() };

/**
 * EL EDITOR DE UN EQUIPO (revisión de agentes del 2026-10-09), como en Voice: su nombre y sus agentes. En
 * Voice es «Agentes › Grupos › Crear»: nombre y una lista de casillas con buscador. Aquí vive en Repositorios (lo
 * decidió el equipo) y los agentes se marcan con LA MISMA tabla con la que un grupo asigna los suyos (DD-151):
 * Todos · Asignados · Sin asignar, el buscador, y Asignado con su casilla de «todos». También se asigna desde la ficha
 * de cada agente (Recursos): es la misma relación vista desde cada lado.
 */
@Component({
  selector: 'sc-equipo-editor-page',
  imports: [
    TooltipModule,
    AssignBarComponent,
    ButtonComponent,
    CheckboxComponent,
    DatatableComponent,
    InputTextComponent,
    LlegaAlPieDirective,
    PresenceAvatarComponent,
    SectionCardComponent,
    SubsectionComponent,
    TranslateModule,
  ],
  template: `
    <ng-template #topbarActions>
      @if (mode() === 'edit' && formDirty()) {
        <span class="form-save-reason sc-text-caption-regular" role="status">{{ 'common.unsaved_changes' | translate }}</span>
      }
      @if (formDirty()) {
        <sc-button size="sm" variant="secondary" appearance="outlined" [label]="'common.undo' | translate" (clicked)="discard()" />
      }
      <sc-button
        size="sm"
        variant="primary"
        [disabled]="!canSave()"
        [pTooltip]="motivoApagado()" tooltipPosition="bottom"
        [label]="(mode() === 'create' ? 'repositories.equipos.create_submit' : 'common.save') | translate"
        (clicked)="save()"
      />
    </ng-template>

    <div class="page">
      <div class="page__inner">
        <h1 class="page__heading sc-text-title-semibold">{{ form().name.trim() || ('repositories.equipos.create_title' | translate) }}</h1>


        <div class="editor">
          <sc-section-card titleKey="repositories.agendas.section_general" icon="tune">
            <sc-subsection>
              <div class="grid grid--2">
                <!-- La etiqueta de las fichas (12/600, DD-122 §4), no la del componente. -->
                <div class="field">
                  <label class="field__label sc-text-caption-semibold" for="grupo-agentes-name">
                    {{ 'repositories.columns.name' | translate }}
                    <span class="field__required" aria-hidden="true">*</span>
                  </label>
                  <sc-inputtext
                    inputId="grupo-agentes-name"
                    fluid
                    [required]="true"
                    [placeholder]="'repositories.equipos.name_placeholder' | translate"
                    [value]="form().name"
                    [helperText]="nameHint()"
                    [error]="nameError()"
                    (valueChange)="update('name', $event)"
                    (focusout)="dejarElNombre($event)"
                  />
                </div>
                <div class="field">
                  <label class="field__label sc-text-caption-semibold" for="grupo-agentes-description">
                    {{ 'repositories.columns.description' | translate }}
                    <span class="field__hint sc-text-caption-regular">({{ 'common.optional' | translate }})</span>
                  </label>
                  <sc-inputtext
                    inputId="grupo-agentes-description"
                    fluid
                    [placeholder]="'repositories.placeholders.description' | translate"
                    [value]="form().description"
                    (valueChange)="update('description', $event)"
                  />
                </div>
              </div>
            </sc-subsection>
          </sc-section-card>

          <sc-section-card id="equipo-agentes" titleKey="repositories.equipos.agents" icon="headphones">
            <sc-subsection>
              <div class="assign">
                <!-- La barra común de las tablas de asignar (DD-243): filtro, buscador y cifra. -->
                <sc-assign-bar [(filter)]="filter" [(query)]="query" [count]="form().agentIds.size"
                  [placeholder]="'groups.form.assigned.query_placeholder' | translate"
                  [filterLabel]="'groups.form.assigned.filter_label' | translate" />
                <div class="table-card table-card--al-pie" scLlegaAlPie>
                  <!-- «Agente» se ordena por nombre, como en la ficha de grupo (DD-243): el orden lo pone \`filas\`. -->
                  <sc-datatable variant="list" size="sm" scrollable scrollHeight="flex" virtualScroll
                    [value]="filas()" [columns]="columns()" dataKey="id"
                    externalSort [sortField]="orden() ? 'agent' : undefined" [sortOrder]="orden() ?? 1" (sortChange)="onSortChange($event)">
                    <div scTableEmpty class="assign__no-results sc-text-body-regular">{{ 'groups.form.assigned.no_results' | translate }}</div>
                  </sc-datatable>
                </div>
              </div>
            </sc-subsection>
          </sc-section-card>
        </div>
      </div>
    </div>

    <!-- La casilla de «todos» en la cabecera de Asignado: las filas a la vista entran o salen todas. -->
    <ng-template #headerCheckTpl let-col>
      <sc-checkbox [state]="estadoCabecera()" [disabled]="filas().length === 0"
        [ariaLabel]="'groups.form.assigned.column_all' | translate: { column: col.header }"
        (cycle)="toggleTodos()" />
    </ng-template>

    <ng-template #assignedTpl let-row>
      <sc-checkbox
        [state]="form().agentIds.has(row.id) ? 'all' : 'none'"
        [ariaLabel]="('groups.form.assigned.assignment' | translate) + ' — ' + row.name"
        (cycle)="toggle(row.id)"
      />
    </ng-template>

    <ng-template #agentTpl let-row>
      <span class="assign__name">
        <sc-presence-avatar [name]="row.name" [photo]="row.photo" [size]="24" />
        <span class="assign__identity">
          <span class="assign__name-label sc-text-body-semibold" [pTooltip]="row.name" showOnEllipsis tooltipPosition="top">{{ row.name }}</span>
          @if (row.email) { <span class="assign__email sc-text-caption-regular" [pTooltip]="row.email" showOnEllipsis tooltipPosition="top">{{ row.email }}</span> }
        </span>
      </span>
    </ng-template>
  `,
  styles: `
    /* El molde del editor de agendas (DD-163): arquetipo de editor sobre el lienzo; el borde lo pone el molde (DD-192). */
    :host {
      display: block;
      height: 100%;
      background: var(--sc-bg-canvas);
    }
    /* Las dos secciones se apilan con el margen que les da el DS, como en el editor de agendas. */
    .editor {
      display: flex;
      flex-direction: column;
    }
    .assign {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-1);
    }
    .assign__name {
      display: inline-flex;
      align-items: center;
      gap: var(--sc-spacing-1);
      min-width: 0;
      max-width: 100%;
    }
    .assign__identity {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .assign__name-label {
      color: var(--sc-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .assign__email {
      color: var(--sc-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .assign__no-results {
      padding: var(--sc-spacing-1-5) var(--sc-spacing-1);
      text-align: center;
      color: var(--sc-text-subtle);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipoEditorPageComponent implements DirtyAware, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(EquiposStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  private readonly injector = inject(Injector);
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');
  private readonly assignedTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('assignedTpl');
  private readonly agentTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('agentTpl');
  private readonly headerCheckTpl = viewChild<TemplateRef<ScColumnHeaderContext<Agent>>>('headerCheckTpl');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>('create');
  private grupoId: number | null = null;

  protected readonly form = signal<Borrador>(VACIO);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;

  protected readonly columns = computed<readonly ScColumnDef<Agent>[]>(() => {
    this.lang();
    return [
      {
        field: 'assigned',
        header: this.translate.instant('groups.form.assigned.assignment'),
        width: '3.5rem',
        align: 'center' as const,
        headerAriaLabel: this.translate.instant('groups.form.assigned.assignment'),
        headerTemplate: this.headerCheckTpl(),
        cellTemplate: this.assignedTpl(),
        stopRowClick: true,
      },
      {
        field: 'agent',
        header: this.translate.instant('groups.form.assigned.col_agent'),
        sortable: true,
        rowHeader: true,
        cellTemplate: this.agentTpl(),
      },
    ];
  });

  /* ── La lista de agentes, como la del grupo (DD-151) ─────────────────────── */

  protected readonly query = signal('');
  protected readonly filter = linkedSignal<AssignFilter>(() => (this.mode() === 'create' ? 'all' : 'assigned'));

  /** El orden por nombre: \`1\`, A→Z; \`-1\`, Z→A; \`null\`, el de la lista de agentes. */
  protected readonly orden = signal<1 | -1 | null>(null);

  /* Solo si CAMBIA: la tabla vuelve a avisar del orden cada vez que recibe filas nuevas (como en la ficha de grupo). */
  protected onSortChange(event: ScDatatableSortEvent): void {
    const orden = event.field === 'agent' && (event.order === 1 || event.order === -1) ? event.order : null;
    if (orden !== this.orden()) this.orden.set(orden);
  }

  /** Las filas a la vista. Marcar no las mueve hasta que cambia la búsqueda o la vista (`untracked`, como en el grupo). */
  protected readonly filas = computed(() => {
    const filtro = this.filter();
    const q = this.query().trim().toLowerCase();
    const dentro = untracked(this.form).agentIds;
    const orden = this.orden();
    const filas = this.agentsStore
      .agents()
      .filter(
        (a) =>
          (filtro === 'all' || (filtro === 'assigned') === dentro.has(a.id)) &&
          (!q || `${a.name} ${a.email ?? ''}`.toLowerCase().includes(q)),
      );
    return orden ? [...filas].sort((a, b) => a.name.localeCompare(b.name, 'es') * orden) : filas;
  });

  protected readonly estadoCabecera = computed<'all' | 'some' | 'none'>(() => {
    const filas = this.filas();
    const ids = this.form().agentIds;
    const dentro = filas.filter((a) => ids.has(a.id)).length;
    return dentro === 0 ? 'none' : dentro === filas.length ? 'all' : 'some';
  });

  protected toggle(id: number): void {
    this.form.update((f) => {
      const ids = new Set(f.agentIds);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return { ...f, agentIds: ids };
    });
  }

  /** La casilla de «todos»: las filas a la vista entran todas o salen todas. */
  protected toggleTodos(): void {
    const quitar = this.estadoCabecera() === 'all';
    const vistas = this.filas().map((a) => a.id);
    this.form.update((f) => {
      const ids = new Set(f.agentIds);
      for (const id of vistas) {
        if (quitar) ids.delete(id);
        else ids.add(id);
      }
      return { ...f, agentIds: ids };
    });
  }

  /* ── Guardar ─────────────────────────────────────────────────────────────── */

  /*
   * Como Agendas y Plantillas (DD-237) y lo que pide el COA de SISMAC-4453: «Crear equipo» y «Guardar» se apagan mientras
   * falte el nombre, y su tooltip dice por qué («El nombre es obligatorio»). El aviso, en gris bajo el campo desde el
   * principio y en rojo al dejarlo vacío (y en vivo hasta que se rellena).
   */
  private readonly faltas = computed<readonly string[]>(() => (this.form().name.trim() ? [] : ['repositories.errors.name_required']));
  private readonly ocasion = ocasionDeAvisar({
    editando: () => this.mode() === 'edit',
    cambios: () => this.formDirty(),
    faltas: this.faltas,
  });
  protected readonly nameError = computed<string | undefined>(() => {
    this.lang();
    const falta = this.faltas()[0];
    return falta && this.ocasion.acusa(falta) ? this.translate.instant(falta) : undefined;
  });

  protected readonly nameHint = computed<string | undefined>(() => {
    this.lang();
    const falta = this.faltas()[0];
    return falta && !this.ocasion.acusa(falta) ? ayudaDeObligatorio(this.translate.instant(falta)) : undefined;
  });

  /** Se dejó el campo del nombre: si sigue vacío, desde ahora en rojo. No al abrir una lista para elegir. */
  protected dejarElNombre(event: FocusEvent): void {
    if (dejoElCampo(event) && this.faltas().length > 0) this.ocasion.tocar(this.faltas()[0]!);
  }

  /** Se puede pulsar con el nombre bien puesto: en el alta, ya; al editar, además, con cambios (vuelve a apagarse si deshaces). */
  protected readonly canSave = computed(
    () => this.faltas().length === 0 && (this.mode() === 'create' || this.formDirty()),
  );

  /** Por qué está apagado el botón, para su tooltip: lo que falta («El nombre es obligatorio») o «No hay cambios que guardar». */
  protected readonly motivoApagado = computed(() => {
    this.lang();
    if (this.canSave()) return '';
    return this.translate.instant(this.faltas()[0] ?? 'common.no_changes');
  });

  /** La miga de la edición dice el nombre del equipo guardado, como en Grupos y Agentes («Administración › Repositorios › Equipos › Francés»). */
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly nombreGuardado = signal<string | null>(null);
  private readonly migaConNombre = effect(() =>
    this.breadcrumbs.nombrar(this.route, this.mode() === 'edit' ? this.nombreGuardado() : null),
  );
  private readonly sinMiga = inject(DestroyRef).onDestroy(() => this.breadcrumbs.nombrar(this.route, null));

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      // DUPLICAR es un alta rellena, como en Grupos y Agentes: «Francés (1)» con la descripción y los agentes del
      // original. El equipo no existe hasta «Crear equipo»; la copia es el punto de partida («Deshacer» vuelve a ella y
      // salir sin tocar nada no pregunta).
      const seedFromId = this.route.snapshot.queryParamMap.get('seedFromId');
      if (seedFromId) {
        const origen = this.store.items().find((g) => g.id === Number(seedFromId));
        if (!origen) {
          void this.router.navigateByUrl('/admin/equipos', { replaceUrl: true });
          return;
        }
        const ids = new Set(this.agentsStore.agents().filter((a) => a.teams?.includes(origen.id)).map((a) => a.id));
        this.form.set({
          name: nombreDeCopia(origen.name, this.store.items().map((g) => g.name)),
          description: origen.description,
          agentIds: ids,
        });
      }
      this.dirtyState.markPristine();
      return;
    }
    const grupo = this.store.items().find((g) => g.id === Number(raw));
    if (!grupo) {
      void this.router.navigateByUrl('/admin/equipos', { replaceUrl: true });
      return;
    }
    this.grupoId = grupo.id;
    this.mode.set('edit');
    this.nombreGuardado.set(grupo.name);
    const ids = new Set(this.agentsStore.agents().filter((a) => a.teams?.includes(grupo.id)).map((a) => a.id));
    this.form.set({ name: grupo.name, description: grupo.description, agentIds: ids });
    this.dirtyState.markPristine();
    // Desde la cifra de agentes del listado se llega ya a «Agentes» (COA SISMAC-4453).
    if (this.route.snapshot.queryParamMap.get('seccion') === 'agentes') llegarAAncla('equipo-agentes', this.injector);
  }


  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.formDirty()) event.preventDefault();
  }

  protected update(key: 'name' | 'description', value: string | null): void {
    this.form.update((f) => ({ ...f, [key]: value ?? '' }));
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
    this.ocasion.olvidar();
  }

  protected save(): void {
    if (!this.canSave()) return;
    if (this.faltas().length > 0) {
      this.ocasion.intentar();
      llegarAAncla('grupo-agentes-name', this.injector);
      return;
    }
    this.ocasion.olvidar();
    const f = this.form();
    const datos = { name: f.name.trim(), description: f.description.trim() };
    const id = this.grupoId ?? this.store.addItem(datos).id;
    if (this.grupoId !== null) this.store.updateItem(id, datos);
    this.agentsStore.setTeamMembers(id, f.agentIds);
    this.dirtyState.markPristine();
    if (this.grupoId !== null) this.nombreGuardado.set(datos.name);
    const texto = this.translate.instant(this.grupoId === null ? 'repositories.equipos.toasts.created' : 'repositories.equipos.toasts.updated', {
      name: datos.name,
    });
    // El toast, ya en la ficha a la que se llega (DD-211 §5).
    if (this.grupoId === null) void this.router.navigate(['/admin/equipos/editar', id], { replaceUrl: true }).then(() => this.resultado.contar(texto));
    else this.resultado.contar(texto);
  }
}
