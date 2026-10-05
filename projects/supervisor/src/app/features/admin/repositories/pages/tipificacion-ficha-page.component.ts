import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  Injector,
  input,
  type OnDestroy,
  type OnInit,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, type UrlTree } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import {
  ScButtonComponent as ButtonComponent,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScDividerComponent as DividerComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
  ScInputTextComponent as InputTextComponent,
  ScMessageComponent as MessageComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { CrossTabLockService, SectionLinksService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { AltaPieComponent } from '@shared/components';
import { llegarASeccion, seccionesDeAlta } from '@shared/utils/alta-secciones';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import { GroupsStore } from '@features/admin/groups/state/groups.store';

import { TipificacionGruposComponent, type TipificacionGrupoRef } from '../components/tipificacion-grupos/tipificacion-grupos.component';
import { TipificacionNivelesComponent } from '../components/tipificacion-niveles/tipificacion-niveles.component';
import { TipificacionVistaComponent } from '../components/tipificacion-vista/tipificacion-vista.component';
import { choquesDe, nivelesDe, ramasIncompletas } from '../state/tipificaciones.core.mjs';
import {
  type Tipificacion,
  type TipificacionGrupo,
  type TipificacionNiveles,
  type TipificacionOpcion,
  TipificacionesStore,
} from '../state/tipificaciones.store';

type Borrador = Omit<Tipificacion, 'id'>;
type Direccion = 'inbound' | 'outbound' | 'both';

/** Una tipificación nueva: entrantes, con comentario y con el primer nivel listo para escribir sus opciones. */
const NUEVA: Borrador = {
  name: '',
  description: '',
  inbound: true,
  outbound: false,
  categorization: true,
  comments: true,
  levels: 1,
  options: [],
  groups: [],
};

const GENERAL = 'tip-section-general';
const CATEGORIAS = 'tip-section-categorias';
const GRUPOS = 'tip-section-grupos';

/** De qué sección es cada campo, para marcar en el índice las que tienen cambios sin guardar (DD-122). */
const SECCION_DEL_CAMPO: Readonly<Record<keyof Borrador, string>> = {
  name: GENERAL,
  description: GENERAL,
  inbound: GENERAL,
  outbound: GENERAL,
  comments: GENERAL,
  categorization: CATEGORIAS,
  levels: CATEGORIAS,
  options: CATEGORIAS,
  groups: GRUPOS,
};

/**
 * LA FICHA DE UNA TIPIFICACIÓN (DD-172, DD-173), con el molde de las fichas (DD-122, DD-170): el
 * nombre y el índice a la izquierda, una sección a la vista en el centro y, a la derecha, donde las fichas llevan su
 * resumen, LO QUE VERÁ EL AGENTE: su ventana de tipificar con lo que se va definiendo, para probarla.
 *
 *   - General: nombre y descripción, la dirección (entrantes, salientes o ambas, en un solo control) y si pide comentario;
 *   - Categorías: los niveles son las columnas, y el siguiente se añade pulsando su columna fantasma;
 *   - Grupos: dónde se usa y por qué canales.
 *
 * SIN SALTOS (DD-173): ningún aviso entra ni sale empujando lo de debajo. Cada uno tiene su línea
 * reservada (bajo las columnas, encima de la tabla de grupos) o va en la barra, junto a Guardar; el nombre repetido
 * marca su campo en rojo y lo dice la barra, sin una línea de error que lo desplace todo.
 */
@Component({
  selector: 'sc-tipificacion-ficha-page',
  imports: [
    AltaPieComponent,
    ButtonComponent,
    DeleteEntityDialogComponent,
    DividerComponent,
    FormSectionNavComponent,
    InputTextComponent,
    MessageComponent,
    NgTemplateOutlet,
    SectionCardComponent,
    SelectButtonComponent,
    TipificacionGruposComponent,
    TipificacionNivelesComponent,
    TipificacionVistaComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './tipificacion-ficha-page.component.html',
  styleUrl: './tipificacion-ficha-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipificacionFichaPageComponent implements DirtyAware, OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sectionLinks = inject(SectionLinksService);
  private readonly injector = inject(Injector);
  private readonly store = inject(TipificacionesStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly crossTab = inject(CrossTabLockService);
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly trashIcon = 'delete';
  protected readonly editingId = signal<number | null>(null);
  protected readonly mode = computed<'create' | 'edit'>(() => (this.editingId() === null ? 'create' : 'edit'));
  protected readonly form = signal<Borrador>(NUEVA);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;
  protected readonly conflictWarning = signal(false);
  private releaseLock: (() => void) | null = null;
  protected readonly deleteVisible = signal(false);

  /* ── El índice ────────────────────────────────────────────────────────── */

  private static readonly SLUGS: Readonly<Record<string, string>> = {
    general: GENERAL,
    categorias: CATEGORIAS,
    grupos: GRUPOS,
  };

  /** `?seccion=` de la dirección. */
  readonly seccion = input<string | undefined>();

  protected readonly navSections = computed<readonly FormNavSection[]>(() =>
    [
      { id: GENERAL, labelKey: 'repositories.tipificaciones.section.general', icon: 'tune' },
      { id: CATEGORIAS, labelKey: 'repositories.tipificaciones.section.categorization', icon: 'account_tree' },
      { id: GRUPOS, labelKey: 'repositories.tipificaciones.section.groups', icon: 'group' },
    ].map((s) => ({ ...s, href: this.sectionLinks.href(this.sectionUrl(s.id)) })),
  );

  /** El alta con el índice de la edición (DD-143): General (el nombre) y Categorías (algo que rellenar, y ramas
   *  completas) tienen algo obligatorio y llevan ✓ al dejarlas completas; Grupos, no. */
  protected readonly alta = seccionesDeAlta({
    secciones: this.navSections,
    obligatoria: (id) => id === GENERAL || id === CATEGORIAS,
    completa: (id) => (id === GENERAL ? this.generalCompleta() : id === CATEGORIAS ? this.categoriasCompletas() : true),
  });

  protected readonly activeSection = computed<string>(() =>
    this.mode() === 'edit' ? (TipificacionFichaPageComponent.SLUGS[this.seccion() ?? ''] ?? GENERAL) : this.alta.abierta(),
  );

  private sectionUrl(id: string): UrlTree {
    const slug = Object.entries(TipificacionFichaPageComponent.SLUGS).find(([, v]) => v === id)?.[0] ?? null;
    return this.sectionLinks.section(this.route, id === GENERAL ? null : slug);
  }

  protected goTo(id: string): void {
    if (this.mode() !== 'edit') {
      this.alta.abrir(id);
      return;
    }
    void this.sectionLinks.go(this.sectionUrl(id));
  }

  protected siguiente(): void {
    this.irAlLado(this.alta.siguiente());
  }

  protected anterior(): void {
    this.irAlLado(this.alta.anterior());
  }

  private irAlLado(id: string | null): void {
    if (!id) return;
    this.goTo(id);
    llegarASeccion(id, this.injector);
  }

  /* ── General ──────────────────────────────────────────────────────────── */

  protected readonly direcciones = computed(() => {
    this.lang();
    return (['inbound', 'outbound', 'both'] as const).map((value) => ({
      value,
      label: this.translate.instant(`repositories.tipificaciones.direction.${value}`),
    }));
  });

  protected readonly direccion = computed<Direccion>(() => {
    const f = this.form();
    return f.inbound && f.outbound ? 'both' : f.outbound ? 'outbound' : 'inbound';
  });

  protected onDireccion(value: unknown): void {
    if (value !== 'inbound' && value !== 'outbound' && value !== 'both') return;
    this.form.update((f) => ({ ...f, inbound: value !== 'outbound', outbound: value !== 'inbound' }));
  }

  protected readonly nameTaken = computed(() => {
    const name = this.form().name.trim().toLowerCase();
    return !!name && this.store.items().some((t) => t.id !== this.editingId() && t.name.trim().toLowerCase() === name);
  });

  private readonly generalCompleta = computed(() => !!this.form().name.trim() && !this.nameTaken());

  /* ── Categorías ───────────────────────────────────────────────────────── */

  /** Los niveles en uso: 0 si no pide categoría. */
  protected readonly niveles = computed(() => nivelesDe(this.form()));

  private readonly incompletas = computed(() => {
    const f = this.form();
    return f.categorization ? ramasIncompletas(f.options, f.levels) : [];
  });

  /** Sin categorías ni comentario, no pide nada. */
  private readonly noPideNada = computed(() => this.niveles() === 0 && !this.form().comments);

  private readonly categoriasCompletas = computed(() => this.incompletas().length === 0 && !this.noPideNada());

  protected onLevels(n: number): void {
    this.form.update((f) =>
      n === 0 ? { ...f, categorization: false, levels: 1, options: [] } : { ...f, categorization: true, levels: n as TipificacionNiveles },
    );
  }

  protected onOptions(options: readonly TipificacionOpcion[]): void {
    this.form.update((f) => ({ ...f, options }));
  }

  /* ── Grupos ───────────────────────────────────────────────────────────── */

  protected readonly grupos = computed<readonly TipificacionGrupoRef[]>(() =>
    this.groupsStore
      .groups()
      .map((g) => ({ id: g.id, name: g.name, channels: g.channels }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es')),
  );

  /** Con qué choca en sus grupos, contra lo guardado de las demás. */
  protected readonly choques = computed(() => choquesDe({ ...this.form(), id: this.editingId() ?? -1 }, this.store.items()));

  private readonly gruposConFallo = computed(() => this.choques().length > 0 || this.form().groups.some((g) => g.channels.length === 0));

  protected onGroups(groups: readonly TipificacionGrupo[]): void {
    this.form.update((f) => ({ ...f, groups }));
  }

  /* ── Lo que falta: en la barra y en el índice ─────────────────────────── */

  protected readonly falta = computed<readonly string[]>(() => {
    const f = this.form();
    const falta: string[] = [];
    if (!f.name.trim()) falta.push('common.summary_missing_name');
    if (this.noPideNada()) falta.push('repositories.tipificaciones.missing.what');
    if (this.incompletas().length > 0) falta.push('repositories.tipificaciones.missing.options');
    if (f.groups.some((g) => g.channels.length === 0)) falta.push('repositories.tipificaciones.missing.channel');
    if (this.choques().length > 0) falta.push('repositories.tipificaciones.missing.conflicts');
    return falta;
  });

  protected readonly blockedReason = computed<string | null>(() => {
    this.lang();
    const falta = this.falta();
    if (falta.length > 0) {
      return this.translate.instant('common.summary_missing', { items: falta.map((k) => this.translate.instant(k)).join(' · ') });
    }
    return this.nameTaken() ? this.translate.instant('repositories.tipificaciones.errors.name_taken') : null;
  });

  protected readonly canSave = computed(() => !this.blockedReason() && (this.mode() === 'create' || this.formDirty()));

  /** Lo que falta, en el índice: al editar, siempre; en el alta, desde que se deja la sección (DD-143). */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() => {
    const acusa = (id: string) => this.mode() === 'edit' || this.alta.dejadas().has(id);
    const errores = new Set<string>();
    if (!this.generalCompleta() && acusa(GENERAL)) errores.add(GENERAL);
    if (!this.categoriasCompletas() && acusa(CATEGORIAS)) errores.add(CATEGORIAS);
    if (this.gruposConFallo() && acusa(GRUPOS)) errores.add(GRUPOS);
    return errores;
  });

  protected readonly sectionsWithChanges = computed<ReadonlySet<string>>(() => {
    if (this.mode() !== 'edit') return new Set<string>();
    return new Set([...this.dirtyState.changedKeys()].map((k) => SECCION_DEL_CAMPO[k as keyof Borrador]));
  });

  /* ── La cabecera ──────────────────────────────────────────────────────── */

  protected readonly titulo = computed(() => {
    this.lang();
    return this.form().name.trim() || this.translate.instant('repositories.tipificaciones.create_title');
  });

  /** Debajo del nombre: en qué conversaciones y cuántos niveles. */
  protected readonly headlineMeta = computed(() => {
    this.lang();
    const n = this.niveles();
    const niveles =
      n === 0
        ? this.translate.instant('repositories.tipificaciones.levels_none')
        : this.translate.instant(`repositories.tipificaciones.levels_count${n === 1 ? '_one' : ''}`, { count: n });
    return `${this.translate.instant(`repositories.tipificaciones.direction.${this.direccion()}`)} · ${niveles}`;
  });

  /* ── Ciclo de vida ────────────────────────────────────────────────────── */

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      if (this.route.snapshot.queryParamMap.has('seccion')) {
        void this.sectionLinks.go(this.sectionLinks.section(this.route, null), { replace: true });
      }
      this.dirtyState.markPristine();
      return;
    }
    const t = this.store.items().find((x) => x.id === Number(raw));
    if (!t) {
      void this.router.navigateByUrl('/admin/tipificaciones', { replaceUrl: true });
      return;
    }
    this.editingId.set(t.id);
    const { id: _id, ...borrador } = t;
    // Los grupos borrados no se enseñan ni se guardan de vuelta, antes de dar la ficha por guardada (como DD-164).
    const vivos = new Set(this.groupsStore.groups().map((g) => g.id));
    this.form.set({ ...borrador, groups: borrador.groups.filter((g) => vivos.has(g.groupId)) });
    this.dirtyState.markPristine();
    this.releaseLock = this.crossTab.acquire('tipificacion', t.id, () => this.conflictWarning.set(true));
  }

  ngOnDestroy(): void {
    this.releaseLock?.();
    this.releaseLock = null;
  }

  protected update<K extends keyof Borrador>(key: K, value: Borrador[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected save(): void {
    if (!this.canSave()) return;
    const f = this.form();
    const borrador: Borrador = { ...f, name: f.name.trim(), description: f.description.trim() };
    if (this.mode() === 'create') {
      const created = this.store.addItem(borrador);
      this.dirtyState.markPristine();
      this.toast('repositories.toasts.created', created.name);
      const slug = Object.entries(TipificacionFichaPageComponent.SLUGS).find(([, v]) => v === this.activeSection())?.[0];
      void this.router.navigate(['/admin/tipificaciones/editar', created.id], {
        replaceUrl: true,
        queryParams: slug && slug !== 'general' ? { seccion: slug } : {},
      });
      return;
    }
    this.store.updateItem(this.editingId()!, borrador);
    this.form.set(borrador);
    this.dirtyState.markPristine();
    this.toast('repositories.toasts.updated', borrador.name);
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
  }

  protected readonly deleteItems = computed(() => {
    const id = this.editingId();
    return id === null ? [] : [{ id, name: this.form().name }];
  });

  protected confirmDelete(): void {
    const id = this.editingId();
    if (id === null) return;
    const name = this.form().name;
    this.store.deleteItem(id);
    this.deleteVisible.set(false);
    this.dirtyState.markPristine();
    this.toast('repositories.toasts.deleted_single', name);
    void this.router.navigateByUrl('/admin/tipificaciones');
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

  private toast(key: string, name: string): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(key, { entity: this.translate.instant('repositories.tipificaciones.singular'), name }),
      life: TOAST_LIFE.success,
    });
  }
}
