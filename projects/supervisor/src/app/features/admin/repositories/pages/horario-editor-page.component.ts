import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, type OnInit, signal, type TemplateRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  ScButtonComponent,
  ScInputTextComponent,
  ScMessageComponent,
  ScMultiSelectComponent,
  ScSectionCardComponent,
  ScSelectComponent,
  ScSubsectionComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { BreadcrumbService, ResultadoAccionService } from '@core/services';
import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { ayudaDeObligatorio, dejoElCampo, ocasionDeAvisar } from '@shared/utils/alta-secciones';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { HorarioCalendarioComponent } from '../components/horario/horario-calendario.component';
import { type FechaEspecialNueva, HorarioEspecialModalComponent } from '../components/horario/horario-especial-modal.component';
import { HorarioPeriodoModalComponent } from '../components/horario/horario-periodo-modal.component';
import { DIAS_DE_LA_SEMANA, HorarioSemanaComponent } from '../components/horario/horario-semana.component';
import { FestivosStore } from '../state/festivos.store';
import {
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
    HorarioCalendarioComponent,
    HorarioEspecialModalComponent,
    HorarioPeriodoModalComponent,
    HorarioSemanaComponent,
    RouterLink,
    ScButtonComponent,
    ScInputTextComponent,
    ScMessageComponent,
    ScMultiSelectComponent,
    ScSectionCardComponent,
    ScSelectComponent,
    ScSubsectionComponent,
    ScTagComponent,
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

  protected readonly periodos = computed(() => {
    this.lang();
    const dia = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short' });
    return this.form().periods.map((p) => ({
      periodo: p,
      fechas: `${dia.format(aFecha(`2024-${p.from}`))} – ${dia.format(aFecha(`2024-${p.to}`))}`,
      cuando: p.year === null ? this.translate.instant('repositories.horarios.yearly') : String(p.year),
      resumen: this.resumen(p.week),
    }));
  });

  /** Las fechas especiales, por orden en el año: primero las que se repiten, por día, y luego las de un año, por fecha. */
  protected readonly especiales = computed(() => {
    this.lang();
    const conAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short', year: 'numeric' });
    const sinAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short' });
    return [...this.form().specials]
      .sort((a, b) => Number(b.yearly) - Number(a.yearly) || (a.yearly ? a.date.slice(5).localeCompare(b.date.slice(5)) : a.date.localeCompare(b.date)))
      .map((e) => ({
        especial: e,
        fecha: (e.yearly ? sinAnio : conAnio).format(aFecha(e.yearly ? `2024${e.date.slice(4)}` : e.date)),
        horas: e.slots.length > 0 ? e.slots.map(textoDeFranja).join(' · ') : null,
      }));
  });

  protected readonly opcionesDeFestivos = computed(() =>
    this.calendarios()
      .filter((c) => c.status !== 'inactive' || this.form().holidayCalendarIds.includes(c.id))
      .map((c) => ({ value: c.id, label: c.name })),
  );

  /** Los grupos que atienden con este horario (DD-152): cambiarlo les cambia a ellos. */
  protected readonly grupos = computed(() => {
    const id = this.horarioId;
    if (id === null || this.mode() !== 'edit') return [];
    return this.groupsStore.groups().filter((g) => Object.values(g.chat?.attendanceScheduleIds ?? {}).includes(id));
  });
  protected readonly avisoDeGrupos = computed(() => {
    this.lang();
    const n = this.grupos().length;
    if (n === 0) return null;
    return this.translate.instant(`repositories.horarios.used_by${n === 1 ? '_one' : ''}`, { count: n, name: this.grupos()[0]?.name });
  });

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

  protected ponerFestivos(ids: unknown): void {
    this.update('holidayCalendarIds', (ids as number[]) ?? []);
  }

  /* ── Periodos ─────────────────────────────────────────────────────────────────────────────────────────────────── */

  /** El diálogo de un periodo: `null` cerrado; con `periodo: null`, para añadir. */
  protected readonly periodoDialog = signal<{ readonly periodo: Periodo | null } | null>(null);
  protected readonly anioDeTrabajo = new Date().getFullYear();

  protected guardarPeriodo(periodo: Periodo): void {
    this.form.update((f) => {
      const existe = f.periods.some((p) => p.id === periodo.id);
      return { ...f, periods: existe ? f.periods.map((p) => (p.id === periodo.id ? periodo : p)) : [...f.periods, periodo] };
    });
    this.periodoDialog.set(null);
  }

  protected quitarPeriodo(id: number): void {
    this.form.update((f) => ({ ...f, periods: f.periods.filter((p) => p.id !== id) }));
    this.periodoDialog.set(null);
  }

  /* ── Fechas especiales ────────────────────────────────────────────────────────────────────────────────────────── */

  /** El diálogo de una fecha especial: `null` cerrado; con `especial: null`, para añadir (con `fecha`, ya marcada). */
  protected readonly especialDialog = signal<{ readonly especial: FechaEspecial | null; readonly fecha: string | null } | null>(null);

  /** Desde el calendario: si ese día ya es una fecha especial se edita; si no, se añade una con el día marcado. */
  protected cambiarDia(fecha: string): void {
    const dueno = duenoDe(this.form(), fecha, this.calendarios());
    this.especialDialog.set({ especial: dueno.especial, fecha });
  }

  protected guardarEspeciales(nuevas: readonly FechaEspecialNueva[]): void {
    this.form.update((f) => {
      let specials = [...f.specials];
      for (const nueva of nuevas) {
        if (nueva.id !== null) specials = specials.map((e) => (e.id === nueva.id ? { ...nueva, id: nueva.id! } : e));
        else specials.push({ ...nueva, id: siguienteId(specials) });
      }
      return { ...f, specials };
    });
    this.especialDialog.set(null);
  }

  protected quitarEspecial(id: number): void {
    this.form.update((f) => ({ ...f, specials: f.specials.filter((e) => e.id !== id) }));
    this.especialDialog.set(null);
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
      // El toast, ya en la ficha a la que se llega (DD-211 §5).
      void this.router.navigateByUrl(`/admin/horarios/editar/${created.id}`, { replaceUrl: true }).then(() => this.resultado.contar(creado));
      return;
    }
    this.store.updateItem(this.horarioId!, draft);
    this.nombreGuardado.set(draft.name);
    this.form.set(draft);
    this.dirtyState.markPristine();
    this.resultado.contar(this.translate.instant('repositories.horarios.toasts.updated', { name: draft.name }));
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
