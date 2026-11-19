import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, type OnInit, signal, type TemplateRef, viewChild } from '@angular/core';
import { LocationStrategy } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  ScButtonComponent,
  ScDividerComponent,
  ScInputTextComponent,
  ScMultiSelectComponent,
  ScSectionCardComponent,
  ScSelectButtonComponent,
  ScSelectComponent,
  ScSubsectionComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { BreadcrumbService, injectAlertModal, ResultadoAccionService } from '@core/services';
import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { ayudaDeObligatorio, dejoElCampo, ocasionDeAvisar } from '@shared/utils/alta-secciones';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { HorarioSemanaVistaComponent } from '../components/horario/horario-semana-vista.component';
import { type ColumnaDeHorario, type FilaDeHorario, HorarioFilasTableComponent } from '../components/horario/horario-filas-table.component';
import { type FechaEspecialNueva, HorarioEspecialModalComponent } from '../components/horario/horario-especial-modal.component';
import { HorarioPeriodoModalComponent } from '../components/horario/horario-periodo-modal.component';
import { DIAS_DE_LA_SEMANA, HorarioSemanaComponent } from '../components/horario/horario-semana.component';
import { FestivosStore } from '../state/festivos.store';
import { subcanalesConHorario } from '../state/horario-uso.service';
import { CLAVE_DE_USO, usosDelHorario } from '../state/horario-usos';
import {
  ahoraEn,
  duenoDe,
  type FechaEspecial,
  type Horario,
  type Periodo,
  resumenDeLaSemana,
  type Semana,
  siguienteId,
  textoDeFranja,
  validarSemana,
} from '../state/horarios.core.mjs';
import { HorariosStore } from '../state/horarios.store';

type Borrador = Omit<Horario, 'id'>;

const LABORABLE = [[540, 1080]] as const;
const VACIO: Borrador = {
  name: '',
  timezone: 'Europe/Madrid',
  description: '',
  status: 'active',
  week: [LABORABLE, LABORABLE, LABORABLE, LABORABLE, LABORABLE, [], []],
  periods: [],
  specials: [],
  holidayCalendarIds: [],
};

const FALTA_NOMBRE = 'repositories.horarios.errors.name_required';
const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);

/**
 * El editor de un horario: cuándo se atiende. A la izquierda, sus reglas (la semana habitual, los periodos y las
 * fechas especiales y festivos); a la derecha, el año resultante, que se repinta con cada cambio y dice de cada día sus
 * horas y quién las decide. Va en su ruta, como las fichas: Guardar y Deshacer suben a la barra de arriba.
 */
@Component({
  selector: 'sc-horario-editor-page',
  imports: [
    RouterLink,
    HorarioSemanaVistaComponent,
    HorarioEspecialModalComponent,
    HorarioFilasTableComponent,
    HorarioPeriodoModalComponent,
    HorarioSemanaComponent,
    ScButtonComponent,
    ScDividerComponent,
    ScInputTextComponent,
    ScMultiSelectComponent,
    ScSectionCardComponent,
    ScSelectButtonComponent,
    ScSelectComponent,
    ScSubsectionComponent,
    ScToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './horario-editor-page.component.html',
  styleUrl: './horario-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioEditorPageComponent implements DirtyAware, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(HorariosStore);
  private readonly festivosStore = inject(FestivosStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly alertModal = injectAlertModal();
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>('create');
  private horarioId: number | null = null;

  /** La miga de la edición dice el nombre guardado (DD-238); al crear, el de la ruta. */
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly nombreGuardado = signal<string | null>(null);
  private readonly migaConNombre = effect(() =>
    this.breadcrumbs.nombrar(this.route, this.mode() === 'edit' ? this.nombreGuardado() : null),
  );
  private readonly sinMiga = inject(DestroyRef).onDestroy(() => this.breadcrumbs.nombrar(this.route, null));

  protected readonly form = signal<Borrador>(VACIO);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;

  protected readonly calendarios = this.festivosStore.items;

  /**
   * Solo las reglas, para el calendario: teclear el nombre no cambia ninguna, y sin esto el año (365 días) se volvía a
   * calcular con cada tecla. Medido con la CPU frenada 6 veces: 80-100 ms por tecla antes (DD-252).
   */
  protected readonly reglas = computed(
    () => {
      const { week, periods, specials, holidayCalendarIds } = this.form();
      return { week, periods, specials, holidayCalendarIds };
    },
    { equal: (a, b) => a.week === b.week && a.periods === b.periods && a.specials === b.specials && a.holidayCalendarIds === b.holidayCalendarIds },
  );


  /* ── Lo que falta (DD-219): el nombre y una semana que valga ──────────────────────────────────────────────────── */

  protected readonly faltaDeSemana = computed(() => validarSemana(this.form().week));
  private readonly faltas = computed<readonly string[]>(() => {
    const semana = this.faltaDeSemana();
    return [...(this.form().name.trim() ? [] : [FALTA_NOMBRE]), ...(semana ? [`repositories.horarios.errors.week_${semana.codigo}`] : [])];
  });
  private readonly ocasion = ocasionDeAvisar({
    editando: () => this.mode() === 'edit',
    cambios: () => this.formDirty(),
    faltas: this.faltas,
  });
  private readonly faltaElNombre = computed(() => this.faltas().includes(FALTA_NOMBRE));
  protected readonly nameError = computed<string | undefined>(() => {
    this.lang();
    return this.faltaElNombre() && this.ocasion.acusa(FALTA_NOMBRE) ? this.translate.instant(FALTA_NOMBRE) : undefined;
  });
  protected readonly nameHint = computed<string | undefined>(() => {
    this.lang();
    return this.faltaElNombre() && !this.ocasion.acusa(FALTA_NOMBRE) ? ayudaDeObligatorio(this.translate.instant(FALTA_NOMBRE)) : undefined;
  });

  protected dejarNombre(event: FocusEvent): void {
    if (this.faltaElNombre() && dejoElCampo(event)) this.ocasion.tocar(FALTA_NOMBRE);
  }

  protected readonly canSave = computed(() => this.faltas().length === 0 && (this.mode() === 'create' || this.formDirty()));
  protected readonly motivoApagado = computed(() => {
    this.lang();
    if (this.canSave()) return '';
    return this.translate.instant(this.faltas()[0] ?? 'common.no_changes');
  });

  /* ── Lo que se enseña ─────────────────────────────────────────────────────────────────────────────────────────── */

  private readonly diasCortos = computed(() => {
    this.lang();
    return DIAS_DE_LA_SEMANA.map((d) => this.translate.instant(`repositories.horarios.days_short.${d}`) as string);
  });

  private resumen(semana: Semana): string {
    return resumenDeLaSemana(semana, this.diasCortos(), this.translate.instant('repositories.horarios.closed'), this.translate.instant('repositories.horarios.all_day'));
  }

  /** Las zonas horarias que conoce el navegador; la del horario siempre está, aunque no la conozca. */
  protected readonly zonas = computed(() => {
    const conocidas = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    return [...new Set([this.form().timezone, 'UTC', ...conocidas])].sort().map((z) => ({ value: z, label: z }));
  });

  /** Las cabeceras de las dos tablas, en el idioma de la app. */
  /** Los grupos que atienden con este horario (DD-152): cambiarlo les cambia a ellos. */
  protected readonly grupos = computed(() => {
    const id = this.horarioId;
    if (id === null || this.mode() !== 'edit') return [];
    return this.groupsStore.groups().filter((g) => subcanalesConHorario(g).some((s) => s.id === id));
  });
  /** Dónde se usa: por sitios (grupos, VUI, buzones, agendas, equipos, campañas), cada uno con sus nombres. */
  protected readonly usos = computed(() => {
    this.lang();
    return usosDelHorario(this.mode() === 'edit' ? this.horarioId : null, this.groupsStore.groups()).map((u) => ({
      ...u,
      titulo: this.translate.instant(`repositories.horarios.uses.${CLAVE_DE_USO[u.tipo]}`) as string,
    }));
  });

  /** La ayuda de «Activo», siempre: quién lo usa y qué pasa al apagarlo (DD-152), o dónde se usa si nadie lo usa. */
  protected readonly ayudaDeActivo = computed(() => {
    this.lang();
    const n = this.grupos().length;
    return this.translate.instant(n === 0 ? 'repositories.horarios.active_hint' : `repositories.horarios.inactive_hint${n === 1 ? '_one' : ''}`, { count: n }) as string;
  });

  /* ── Ir a Festivos: sale del horario, así que con cambios pide guardar antes, como «Gestionar en Repositorios» del
   *    grupo (SISMAC-4058). Con Cmd+clic o el botón central se abre en otra pestaña sin preguntar. ─────────────────── */

  protected readonly festivosHref = inject(LocationStrategy).prepareExternalUrl('/admin/festivos');
  private destinoTrasGuardar: string | null = null;

  protected irAFestivos(event: MouseEvent): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void this.salirAFestivos();
  }

  /** A la lista de calendarios, o al editor de uno (el «Editar festivos» del día elegido en el año, DD-254). */
  private async salirAFestivos(destino = '/admin/festivos'): Promise<void> {
    if (!this.formDirty()) {
      void this.router.navigateByUrl(destino);
      return;
    }
    const guardar = await this.alertModal({
      variant: 'info',
      surface: 'plain',
      title: this.translate.instant('repositories.horarios.festivos_leave.title'),
      message: this.translate.instant('repositories.horarios.festivos_leave.body'),
      actionLabel: this.translate.instant('common.save'),
      secondaryActionLabel: this.translate.instant('common.discard_keep'),
    });
    if (!guardar) return;
    this.destinoTrasGuardar = destino;
    this.save();
  }

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      this.seedFromDuplicate();
      this.dirtyState.markPristine();
      return;
    }
    const horario = this.store.items().find((h) => h.id === Number(raw));
    if (!horario) {
      void this.router.navigateByUrl('/admin/horarios', { replaceUrl: true });
      return;
    }
    this.mode.set('edit');
    this.horarioId = horario.id;
    this.nombreGuardado.set(horario.name);
    const { id: _id, ...datos } = horario;
    this.form.set(datos);
    this.dirtyState.markPristine();
  }

  /** Duplicar es un alta (DD-234): `?seedFromId` abre «Nuevo horario» con los datos del original y su nombre «X (1)». */
  private seedFromDuplicate(): void {
    const seed = this.route.snapshot.queryParamMap.get('seedFromId');
    if (!seed) return;
    const origen = this.store.items().find((h) => h.id === Number(seed));
    if (!origen) {
      void this.router.navigateByUrl('/admin/horarios', { replaceUrl: true });
      return;
    }
    const { id: _id, ...datos } = origen;
    this.form.set({ ...datos, name: nombreDeCopia(origen.name, this.store.items().map((h) => h.name)) });
  }

  protected update<K extends keyof Borrador>(key: K, value: Borrador[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  /* ── Guardar ──────────────────────────────────────────────────────────────────────────────────────────────────── */

  protected save(): void {
    // El botón está apagado si falta algo, pero se llega aquí también con Ctrl/Cmd + S: dice lo que falta y lleva al campo.
    if (this.faltas().length > 0) {
      this.ocasion.intentar();
      if (this.faltaElNombre()) document.getElementById('horario-name')?.focus();
      return;
    }
    if (!this.canSave()) return;
    this.ocasion.olvidar();
    const f = this.form();
    const draft: Borrador = { ...f, name: f.name.trim(), description: f.description.trim() };
    if (this.mode() === 'create') {
      const created = this.store.addItem(draft);
      this.dirtyState.markPristine();
      const creado = this.translate.instant('repositories.horarios.toasts.created', { name: created.name });
      // El toast, ya en la ficha a la que se llega (DD-211 §5); o en Festivos, si se guardó para ir allí.
      const destino = this.destinoTrasGuardar ?? `/admin/horarios/editar/${created.id}`;
      this.destinoTrasGuardar = null;
      void this.router.navigateByUrl(destino, { replaceUrl: destino !== '/admin/festivos' }).then(() => this.resultado.contar(creado));
      return;
    }
    this.store.updateItem(this.horarioId!, draft);
    this.nombreGuardado.set(draft.name);
    this.form.set(draft);
    this.dirtyState.markPristine();
    this.resultado.contar(this.translate.instant('repositories.horarios.toasts.updated', { name: draft.name }));
    if (this.destinoTrasGuardar) {
      void this.router.navigateByUrl(this.destinoTrasGuardar);
      this.destinoTrasGuardar = null;
    }
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
    this.ocasion.olvidar();
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.formDirty()) event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
    }
  }
}
