import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, Injector, linkedSignal, type OnInit, signal, type TemplateRef, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScButtonComponent as ButtonComponent,
  ScCheckboxComponent as CheckboxComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent as DatatableComponent,
  ScInputTextComponent as InputTextComponent,
  ScSearchComponent as SearchComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScSubsectionComponent as SubsectionComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { LlegaAlPieDirective } from '@core/directives';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { PresenceAvatarComponent } from '@shared/components';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import type { Agent } from '@features/admin/agents/data/agents-data';

import { EquiposStore } from '../state/equipos.store';
import { BreadcrumbService, ResultadoAccionService } from '@core/services';
import { TooltipModule } from 'primeng/tooltip';
import { dejoElCampo, llegarAAncla, ocasionDeAvisar } from '@shared/utils/alta-secciones';

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
    ButtonComponent,
    CheckboxComponent,
    DatatableComponent,
    InputTextComponent,
    LlegaAlPieDirective,
    PresenceAvatarComponent,
    SearchComponent,
    SectionCardComponent,
    SubsectionComponent,
    SelectButtonComponent,
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

          <sc-section-card titleKey="repositories.equipos.agents" icon="headphones">
            <sc-subsection>
              <div class="assign">
                <div class="assign__bar">
                  <span id="grupo-agentes-filter" class="visually-hidden">{{ 'groups.form.assigned.filter_label' | translate }}</span>
                  <sc-selectbutton size="sm" [options]="filterOptions()" optionValue="value" [value]="filter()"
                    (valueChange)="filter.set($any($event))" [allowEmpty]="false" ariaLabelledBy="grupo-agentes-filter" />
                  <sc-search class="assign__search" [placeholder]="'groups.form.assigned.query_placeholder' | translate"
                    [clearAriaLabel]="'labels.clear_search' | translate" [value]="query()" (valueChange)="query.set($event)" />
                  <span class="assign__count sc-text-caption-regular" role="status">
                    {{ 'repositories.equipos.assigned_count' | translate: { count: form().agentIds.size } }}
                  </span>
                </div>
                <div class="table-card table-card--al-pie" scLlegaAlPie>
                  <sc-datatable variant="list" size="sm" scrollable scrollHeight="flex" virtualScroll
                    [value]="filas()" [columns]="columns()" dataKey="id">
                    <ng-template #header>
                      <tr>
                        @for (col of columns(); track col.field) {
                          <th scope="col" [style.text-align]="col.align" [style.width]="col.width" [attr.aria-label]="col.header">
                            @if (col.field === 'assigned') {
                              <sc-checkbox [state]="estadoCabecera()" [disabled]="filas().length === 0"
                                [ariaLabel]="'groups.form.assigned.column_all' | translate: { column: col.header }"
                                (cycle)="toggleTodos()" />
                            } @else { {{ col.header }} }
                          </th>
                        }
                      </tr>
                    </ng-template>
                    <div scTableEmpty class="assign__no-results sc-text-body-regular">{{ 'groups.form.assigned.no_results' | translate }}</div>
                  </sc-datatable>
                </div>
              </div>
            </sc-subsection>
          </sc-section-card>
        </div>
      </div>
    </div>

    <ng-template #assignedTpl let-row>
      <sc-checkbox
        [state]="form().agentIds.has(row.id) ? 'all' : 'none'"
        [ariaLabel]="('groups.form.assigned.assignment' | translate) + ' — ' + row.name"
        (cycle)="toggle(row.id)"
      />
    </ng-template>

    <ng-template #agentTpl let-row>
      <span class="assign__name">
        <sc-presence-avatar [name]="row.name" [size]="24" />
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
    .assign__bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--sc-spacing-0-5);
    }
    .assign__search {
      flex: 1 1 240px;
      min-width: 0;
    }
    .assign__count {
      color: var(--sc-text-secondary);
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
        cellTemplate: this.assignedTpl(),
        stopRowClick: true,
      },
      { field: 'agent', header: this.translate.instant('groups.form.assigned.col_agent'), rowHeader: true, cellTemplate: this.agentTpl() },
    ];
  });

  /* ── La lista de agentes, como la del grupo (DD-151) ─────────────────────── */

  protected readonly query = signal('');
  protected readonly filter = linkedSignal(() => (this.mode() === 'create' ? 'all' : 'assigned'));
  protected readonly filterOptions = computed(() => {
    this.lang();
    return ['all', 'assigned', 'unassigned'].map((value) => ({
      value,
      label: this.translate.instant(`groups.form.assigned.filter_${value}`),
    }));
  });

  /** Las filas a la vista. Marcar no las mueve hasta que cambia la búsqueda o la vista (`untracked`, como en el grupo). */
  protected readonly filas = computed(() => {
    const filtro = this.filter();
    const q = this.query().trim().toLowerCase();
    const dentro = untracked(this.form).agentIds;
    return this.agentsStore
      .agents()
      .filter(
        (a) =>
          (filtro === 'all' || (filtro === 'assigned') === dentro.has(a.id)) &&
          (!q || `${a.name} ${a.email ?? ''}`.toLowerCase().includes(q)),
      );
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
   * Como la ficha de grupo (DD-219) y lo que pide el COA de SISMAC-4453: «Crear equipo» y «Guardar» se apagan mientras
   * falte el nombre, y su tooltip dice por qué. El obligatorio, en
   * rojo al dejar el campo vacío (y se queda en vivo hasta que se rellena). Sin aviso gris previo: el COA no lo pide.
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

  /** Se dejó el campo del nombre: si sigue vacío, desde ahora en rojo. No al abrir una lista para elegir. */
  protected dejarElNombre(event: FocusEvent): void {
    if (dejoElCampo(event) && this.faltas().length > 0) this.ocasion.tocar(this.faltas()[0]!);
  }

  /** Se puede pulsar con el nombre bien puesto: en el alta, ya; al editar, además, con cambios (vuelve a apagarse si deshaces). */
  protected readonly canSave = computed(
    () => this.faltas().length === 0 && (this.mode() === 'create' || this.formDirty()),
  );

  /** Por qué está apagado el botón, para su tooltip: «Falta: nombre» o «No hay cambios que guardar». */
  protected readonly motivoApagado = computed(() => {
    this.lang();
    if (this.canSave()) return '';
    if (this.faltas().length > 0) {
      return this.translate.instant('common.summary_missing', { items: this.translate.instant('common.summary_missing_name') });
    }
    return this.translate.instant('common.no_changes');
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
