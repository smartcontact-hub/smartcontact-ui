import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, type OnInit, signal, type TemplateRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  ScButtonComponent,
  ScInputTextComponent,
  ScMessageComponent,
  ScSectionCardComponent,
  ScSubsectionComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { BreadcrumbService, ResultadoAccionService } from '@core/services';
import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';
import { ayudaDeObligatorio, dejoElCampo, ocasionDeAvisar } from '@shared/utils/alta-secciones';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { type FechaEspecialNueva, HorarioEspecialModalComponent } from '../components/horario/horario-especial-modal.component';
import { type CalendarioDeFestivos, type Festivo, FestivosStore } from '../state/festivos.store';
import { type FechaEspecial, siguienteId } from '../state/horarios.core.mjs';
import { HorariosStore } from '../state/horarios.store';

type Borrador = Omit<CalendarioDeFestivos, 'id'>;

const VACIO: Borrador = { name: '', description: '', status: 'active', days: [] };
const FALTA_NOMBRE = 'repositories.festivos.errors.name_required';
const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);

/**
 * El editor de un calendario de festivos: una lista de días cerrados que varios horarios aplican, para mantenerlos una
 * vez. Sus días se añaden de varios en varios y pueden repetirse cada año. Va en su ruta, como el del horario.
 */
@Component({
  selector: 'sc-festivos-editor-page',
  imports: [
    HorarioEspecialModalComponent,
    ScButtonComponent,
    ScInputTextComponent,
    ScMessageComponent,
    ScSectionCardComponent,
    ScSubsectionComponent,
    ScToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './festivos-editor-page.component.html',
  styleUrl: './horario-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FestivosEditorPageComponent implements DirtyAware, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(FestivosStore);
  private readonly horariosStore = inject(HorariosStore);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>('create');
  private calendarioId: number | null = null;

  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly nombreGuardado = signal<string | null>(null);
  private readonly migaConNombre = effect(() =>
    this.breadcrumbs.nombrar(this.route, this.mode() === 'edit' ? this.nombreGuardado() : null),
  );
  private readonly sinMiga = inject(DestroyRef).onDestroy(() => this.breadcrumbs.nombrar(this.route, null));

  protected readonly form = signal<Borrador>(VACIO);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;

  private readonly faltas = computed<readonly string[]>(() => (this.form().name.trim() ? [] : [FALTA_NOMBRE]));
  private readonly ocasion = ocasionDeAvisar({
    editando: () => this.mode() === 'edit',
    cambios: () => this.formDirty(),
    faltas: this.faltas,
  });
  protected readonly nameError = computed<string | undefined>(() => {
    this.lang();
    return this.faltas().length > 0 && this.ocasion.acusa(FALTA_NOMBRE) ? this.translate.instant(FALTA_NOMBRE) : undefined;
  });
  protected readonly nameHint = computed<string | undefined>(() => {
    this.lang();
    return this.faltas().length > 0 && !this.ocasion.acusa(FALTA_NOMBRE) ? ayudaDeObligatorio(this.translate.instant(FALTA_NOMBRE)) : undefined;
  });

  protected dejarNombre(event: FocusEvent): void {
    if (this.faltas().length > 0 && dejoElCampo(event)) this.ocasion.tocar(FALTA_NOMBRE);
  }

  protected readonly canSave = computed(() => this.faltas().length === 0 && (this.mode() === 'create' || this.formDirty()));
  protected readonly motivoApagado = computed(() => {
    this.lang();
    if (this.canSave()) return '';
    return this.translate.instant(this.faltas()[0] ?? 'common.no_changes');
  });

  /** Los días por orden en el año: primero los que se repiten y luego los de un año. */
  protected readonly dias = computed(() => {
    this.lang();
    const conAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short', year: 'numeric' });
    const sinAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short' });
    return [...this.form().days]
      .sort((a, b) => Number(b.yearly) - Number(a.yearly) || (a.yearly ? a.date.slice(5).localeCompare(b.date.slice(5)) : a.date.localeCompare(b.date)))
      .map((d) => ({ dia: d, fecha: (d.yearly ? sinAnio : conAnio).format(aFecha(d.yearly ? `2024${d.date.slice(4)}` : d.date)) }));
  });

  /** Los días con la forma que pide el diálogo, que es el de las fechas especiales: sin franjas, cerrados. */
  protected readonly comoEspeciales = computed<readonly FechaEspecial[]>(() => this.form().days.map((d) => ({ ...d, slots: [] })));

  /** Los horarios que lo aplican: cambiarlo les cambia a ellos. */
  protected readonly aviso = computed(() => {
    this.lang();
    const id = this.calendarioId;
    if (id === null || this.mode() !== 'edit') return null;
    const horarios = this.horariosStore.items().filter((h) => h.holidayCalendarIds.includes(id));
    if (horarios.length === 0) return null;
    return this.translate.instant(`repositories.festivos.used_by${horarios.length === 1 ? '_one' : ''}`, { count: horarios.length, name: horarios[0]?.name });
  });

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      const seed = this.route.snapshot.queryParamMap.get('seedFromId');
      const origen = seed ? this.store.items().find((c) => c.id === Number(seed)) : null;
      if (origen) {
        const { id: _id, ...datos } = origen;
        this.form.set({ ...datos, name: nombreDeCopia(origen.name, this.store.items().map((c) => c.name)) });
      }
      this.dirtyState.markPristine();
      return;
    }
    const calendario = this.store.items().find((c) => c.id === Number(raw));
    if (!calendario) {
      void this.router.navigateByUrl('/admin/festivos', { replaceUrl: true });
      return;
    }
    this.mode.set('edit');
    this.calendarioId = calendario.id;
    this.nombreGuardado.set(calendario.name);
    const { id: _id, ...datos } = calendario;
    this.form.set(datos);
    this.dirtyState.markPristine();
  }

  protected update<K extends keyof Borrador>(key: K, value: Borrador[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  /** El diálogo de un día: `null` cerrado; con `dia: null`, para añadir. */
  protected readonly diaDialog = signal<{ readonly dia: FechaEspecial | null } | null>(null);

  protected editarDia(dia: Festivo): void {
    this.diaDialog.set({ dia: { ...dia, slots: [] } });
  }

  protected guardarDias(nuevos: readonly FechaEspecialNueva[]): void {
    this.form.update((f) => {
      let days = [...f.days];
      for (const { slots: _slots, ...nuevo } of nuevos) {
        if (nuevo.id !== null) days = days.map((d) => (d.id === nuevo.id ? { ...nuevo, id: nuevo.id! } : d));
        else days.push({ ...nuevo, id: siguienteId(days) });
      }
      return { ...f, days };
    });
    this.diaDialog.set(null);
  }

  protected quitarDia(id: number): void {
    this.form.update((f) => ({ ...f, days: f.days.filter((d) => d.id !== id) }));
    this.diaDialog.set(null);
  }

  protected save(): void {
    if (this.faltas().length > 0) {
      this.ocasion.intentar();
      document.getElementById('festivos-name')?.focus();
      return;
    }
    if (!this.canSave()) return;
    this.ocasion.olvidar();
    const f = this.form();
    const draft: Borrador = { ...f, name: f.name.trim(), description: f.description.trim() };
    if (this.mode() === 'create') {
      const created = this.store.addItem(draft);
      this.dirtyState.markPristine();
      const creado = this.translate.instant('repositories.festivos.toasts.created', { name: created.name });
      void this.router.navigateByUrl(`/admin/festivos/editar/${created.id}`, { replaceUrl: true }).then(() => this.resultado.contar(creado));
      return;
    }
    this.store.updateItem(this.calendarioId!, draft);
    this.nombreGuardado.set(draft.name);
    this.form.set(draft);
    this.dirtyState.markPristine();
    this.resultado.contar(this.translate.instant('repositories.festivos.toasts.updated', { name: draft.name }));
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
