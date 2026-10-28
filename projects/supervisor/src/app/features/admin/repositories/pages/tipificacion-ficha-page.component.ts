import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, Injector, input, signal, type OnInit, type TemplateRef, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, type UrlTree } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScButtonComponent as ButtonComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
  ScInputTextComponent as InputTextComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSubsectionComponent as SubsectionComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { BreadcrumbService, ResultadoAccionService, SectionLinksService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';
import { AltaPieComponent } from '@shared/components';
import {
  avisosDelIndice,
  ayudaDeObligatorio,
  dejoElCampo,
  llegarAAncla,
  llegarASeccion,
  ocasionDeAvisar,
  seccionesDeAlta,
  type AvisoDeFicha,
} from '@shared/utils/alta-secciones';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { resolveGroup } from '@features/admin/groups/data/groups-data';

import { TipificacionNivelesComponent } from '../components/tipificacion-niveles/tipificacion-niveles.component';
import { TipificacionVistaComponent } from '../components/tipificacion-vista/tipificacion-vista.component';
import { hermanasRepetidas, nivelesDe, profundidad } from '../state/tipificaciones.core.mjs';
import {
  type Tipificacion,
  type TipificacionOpcion,
  TipificacionesStore,
} from '../state/tipificaciones.store';
import { TipificacionUsoService } from '../state/tipificacion-uso.service';
import { TooltipModule } from 'primeng/tooltip';
import { injectBorradoSimple } from '@features/admin/services/confirmar-borrado';

type Borrador = Omit<Tipificacion, 'id'>;
/** Una tipificación nueva: con el primer nivel listo para escribir sus opciones. */
const NUEVA: Borrador = {
  name: '',
  description: '',
  levels: 1,
  options: [],
};

const GENERAL = 'tip-section-general';
const CATEGORIAS = 'tip-section-categorias';

/** De qué sección es cada campo, para marcar en el índice las que tienen cambios sin guardar (DD-122). */
const SECCION_DEL_CAMPO: Readonly<Record<keyof Borrador, string>> = {
  name: GENERAL,
  description: GENERAL,
  levels: CATEGORIAS,
  options: CATEGORIAS,
};

/**
 * LA FICHA DE UNA TIPIFICACIÓN (DD-173, DD-174), con el molde de las fichas (DD-122, DD-170): el
 * nombre y el índice a la izquierda, una sección a la vista en el centro y, a la derecha, donde las fichas llevan su
 * resumen, LO QUE VERÁ EL AGENTE: su ventana de tipificar con lo que se va definiendo, para probarla.
 *
 *   - General: nombre y descripción (opcional);
 *   - Categorías: el árbol entero a la vista, una columna por nivel.
 *
 * Solo eso desde la revisión de tipificaciones del 2026-10-09: si un grupo clasifica, con cuál, en qué conversaciones y
 * si pide comentario se decide en el GRUPO (su General). Hasta ese día aquí iban la dirección, el comentario y una
 * sección Grupos con los canales de cada uno.
 *
 * SIN SALTOS (DD-174): ningún aviso entra ni sale empujando lo de debajo. Cada uno tiene su línea reservada (bajo el
 * árbol) o va en la barra, junto a Guardar.
 */
@Component({
  selector: 'sc-tipificacion-ficha-page',
  imports: [
    TooltipModule,
    AltaPieComponent,
    ButtonComponent,
    FormSectionNavComponent,
    InputTextComponent,
    NgTemplateOutlet,
    SectionCardComponent,
    SubsectionComponent,
    TipificacionNivelesComponent,
    TipificacionVistaComponent,
    TranslateModule,
  ],
  templateUrl: './tipificacion-ficha-page.component.html',
  styleUrl: './tipificacion-ficha-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipificacionFichaPageComponent implements DirtyAware, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sectionLinks = inject(SectionLinksService);
  private readonly injector = inject(Injector);
  private readonly store = inject(TipificacionesStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly uso = inject(TipificacionUsoService);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  /** La miga de la edición dice el nombre de la tipificación guardada, como en Grupos y Agentes («Administración › Repositorios
   *  › Tipificaciones › Atención al cliente»): el que se teclea aún no es el suyo. Al crear, «Nueva tipificación», de la ruta. */
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly nombreGuardado = signal<string | null>(null);
  private readonly migaConNombre = effect(() =>
    this.breadcrumbs.nombrar(this.route, this.mode() === 'edit' ? this.nombreGuardado() : null),
  );
  private readonly sinMiga = inject(DestroyRef).onDestroy(() => this.breadcrumbs.nombrar(this.route, null));

  protected readonly trashIcon = 'delete';
  protected readonly editingId = signal<number | null>(null);
  protected readonly mode = computed<'create' | 'edit'>(() => (this.editingId() === null ? 'create' : 'edit'));
  protected readonly form = signal<Borrador>(NUEVA);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;
  protected readonly deleteVisible = signal(false);

  /* ── El índice ────────────────────────────────────────────────────────── */

  private static readonly SLUGS: Readonly<Record<string, string>> = {
    general: GENERAL,
    categorias: CATEGORIAS,
  };

  /** `?seccion=` de la dirección. */
  readonly seccion = input<string | undefined>();

  protected readonly navSections = computed<readonly FormNavSection[]>(() =>
    [
      { id: GENERAL, labelKey: 'repositories.tipificaciones.section.general', icon: 'tune' },
      { id: CATEGORIAS, labelKey: 'repositories.tipificaciones.section.categorization', icon: 'account_tree' },
    ].map((s) => ({ ...s, href: this.sectionLinks.href(this.sectionUrl(s.id)) })),
  );

  /** El alta con el índice de la edición (DD-143): General (el nombre) y Categorías (ramas completas, con nombre y sin
   *  repetir) tienen algo obligatorio y llevan ✓ al dejarlas completas. */
  protected readonly alta = seccionesDeAlta({
    secciones: this.navSections,
    completa: (id) => (id === GENERAL ? this.generalCompleta() : this.categoriasCompletas()),
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

  private readonly generalCompleta = computed(() => !!this.form().name.trim());

  /* ── Categorías ───────────────────────────────────────────────────────── */

  /** Los niveles del árbol. */
  protected readonly niveles = computed(() => nivelesDe(this.form()));

  /** Opciones sin nombre, o con el de una hermana: el agente no sabría cuál es cuál. */
  private readonly opcionesSinNombre = computed(() => {
    const sinNombre = (lista: readonly TipificacionOpcion[]): boolean => lista.some((o) => !o.label.trim() || sinNombre(o.children));
    return sinNombre(this.form().options);
  });

  private readonly nombresMal = computed(() => this.opcionesSinNombre() || hermanasRepetidas(this.form().options).length > 0);

  /** Con alguna opción, y todas con nombre y sin repetir. Cada rama llega hasta donde haga falta. */
  private readonly categoriasCompletas = computed(() => this.form().options.length > 0 && !this.nombresMal());

  /** Los niveles son los de la rama más larga: no se eligen, salen del árbol. */
  protected onOptions(options: readonly TipificacionOpcion[]): void {
    this.form.update((f) => ({ ...f, options, levels: profundidad(options) }));
  }

  /** En cuántos grupos se usa: lo dice la cabecera, para saber a quién llega un cambio. */
  private readonly enGrupos = computed(
    () => this.groupsStore.groups().filter((g) => resolveGroup(g).wrapUp.typificationId === this.editingId()).length,
  );

  /* ── Lo que falta: en gris en su sitio, en rojo al dejarlo, y el botón apagado (DD-219) ──────── */

  /** Lo que falta, por su aviso, en el orden de la ficha. */
  private readonly faltas = computed<readonly string[]>(() => {
    const f = this.form();
    return [
      ...(f.name.trim() ? [] : ['repositories.tipificaciones.errors.name_required']),
      ...(f.options.length > 0 ? [] : ['repositories.tipificaciones.errors.options_required']),
      ...(this.nombresMal() ? ['repositories.tipificaciones.errors.names_required'] : []),
    ];
  });

  /** Hay algo que no deja crear ni guardar: lo que falta. */
  private readonly pendiente = computed(() => this.faltas().length > 0);

  /**
   * El botón se puede pulsar sin nada pendiente: al crear, en cuanto están el nombre y una opción; al editar, además, con
   * cambios. Como las demás fichas (DD-219).
   */
  protected readonly canSave = computed(() => !this.pendiente() && (this.mode() === 'create' || this.formDirty()));

  /** Por qué está apagado el botón, para su tooltip: lo primero que falta o está mal, o, sin cambios, «No hay cambios». */
  protected readonly motivoApagado = computed(() => {
    this.lang();
    if (this.canSave()) return '';
    const primera = this.faltas()[0];
    return this.translate.instant(primera ?? 'common.no_changes');
  });

  /**
   * Cuándo se dice en rojo lo que falta (DD-219): al dejar el nombre vacío, o desde que se abre si lo guardado ya venía
   * sin ello. Antes, en gris en su sitio.
   */
  private readonly ocasion = ocasionDeAvisar({
    editando: () => this.mode() === 'edit',
    cambios: () => this.dirtyState.dirty(),
    faltas: () => this.faltas(),
  });

  /** El aviso rojo bajo el nombre: vacío, al dejarlo así. */
  protected readonly nameError = computed<string | undefined>(() => {
    this.lang();
    const falta = 'repositories.tipificaciones.errors.name_required';
    return this.faltas().includes(falta) && this.ocasion.acusa(falta) ? this.translate.instant(falta) : undefined;
  });

  /** El aviso gris bajo el nombre vacío, mientras aún no se dice en rojo (DD-219). */
  protected readonly nameHint = computed<string | undefined>(() => {
    this.lang();
    const falta = 'repositories.tipificaciones.errors.name_required';
    return this.faltas().includes(falta) && !this.ocasion.acusa(falta) ? ayudaDeObligatorio(this.translate.instant(falta)) : undefined;
  });

  /** Se dejó el nombre: si sigue vacío, desde ahora en rojo. */
  protected dejarNombre(event: FocusEvent): void {
    const falta = 'repositories.tipificaciones.errors.name_required';
    if (dejoElCampo(event) && this.faltas().includes(falta)) this.ocasion.tocar(falta);
  }

  /**
   * Los avisos del índice, en el orden de la ficha (DD-219): lo que falta si lo guardado
   * ya venía sin ello o se pulsó con ello pendiente. De aquí salen el punto del índice, lo que dice y adónde lleva.
   */
  private readonly avisos = computed<readonly AvisoDeFicha[]>(() => {
    this.lang();
    const out: AvisoDeFicha[] = [];
    for (const falta of this.faltas()) {
      if (!this.ocasion.acusaEnIndice(falta)) continue;
      if (falta.endsWith('name_required')) out.push({ seccion: GENERAL, texto: this.translate.instant(falta), ancla: 'tip-name' });
      else out.push({ seccion: CATEGORIAS, texto: this.translate.instant(falta), ancla: null });
    }
    return out;
  });

  /**
   * El punto rojo del índice: la sección tiene un aviso a la vista. En el alta, la que se dejó con algo por hacer, como
   * en el agente y el grupo (DD-222).
   */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() =>
    this.mode() === 'create'
      ? new Set([...this.alta.estados()].filter(([, estado]) => estado === 'error').map(([id]) => id))
      : new Set(this.avisos().map((a) => a.seccion)),
  );

  /**
   * Todo lo que le falta a cada sección, en una línea corta para el índice («Nombre», «Una opción»), sin «Falta:»: el gris
   * y el rojo ya lo dicen. Lo mal escrito entra detrás (DD-222).
   */
  private readonly faltasPorSeccion = computed<Readonly<Record<string, string>>>(() => {
    this.lang();
    const t = (key: string) => this.translate.instant(key);
    const f = this.form();
    const por: Record<string, string[]> = {};
    if (!f.name.trim()) (por[GENERAL] ??= []).push(t('common.summary_missing_name'));
    if (f.options.length === 0) (por[CATEGORIAS] ??= []).push(t('repositories.tipificaciones.missing.options'));
    else if (this.opcionesSinNombre()) (por[CATEGORIAS] ??= []).push(t('repositories.tipificaciones.missing.unnamed'));
    else if (this.nombresMal()) (por[CATEGORIAS] ??= []).push(t('repositories.tipificaciones.missing.names'));
    const out: Record<string, string> = {};
    for (const [id, items] of Object.entries(por)) out[id] = items.join(', ').replace(/^./, (c) => c.toUpperCase());
    return out;
  });

  /** Lo que dice cada sección en el índice: en el alta, todo lo que falta (en gris hasta dejar la sección); al editar, el aviso a la vista (DD-217). */
  protected readonly sectionErrorHints = computed<Readonly<Record<string, string>>>(() =>
    this.mode() === 'create' ? this.faltasPorSeccion() : avisosDelIndice(this.avisos()),
  );

  /** Los marcadores del índice en el alta y al duplicar: sin revisar, en curso, completa y en rojo. Al editar, ninguno. */
  protected readonly sectionStates = computed(() => (this.mode() === 'create' ? this.alta.estados() : null));

  /** Lleva a un campo de la ficha (o al título de su sección): a su sección, y en ella al sitio, con el foco. */
  private irACampo(seccion: string, ancla: string | null): void {
    if (this.activeSection() !== seccion) this.goTo(seccion);
    if (ancla) llegarAAncla(ancla, this.injector);
    else llegarASeccion(seccion, this.injector);
  }

  protected readonly sectionsWithChanges = computed<ReadonlySet<string>>(() => {
    if (this.mode() !== 'edit') return new Set<string>();
    return new Set([...this.dirtyState.changedKeys()].map((k) => SECCION_DEL_CAMPO[k as keyof Borrador]));
  });

  /* ── La cabecera ──────────────────────────────────────────────────────── */

  protected readonly titulo = computed(() => {
    this.lang();
    return this.form().name.trim() || this.translate.instant('repositories.tipificaciones.create_title');
  });

  /** Debajo del nombre: cuántos niveles y, al editar, en cuántos grupos se usa. */
  protected readonly headlineMeta = computed(() => {
    this.lang();
    // En el alta no hay subtítulo: los niveles salen de las categorías, y lo que falta lo dice el índice. Que apareciera al
    // escribir el nombre movía el título.
    if (this.mode() === 'create') return '';
    const n = this.niveles();
    const niveles = this.translate.instant(`repositories.tipificaciones.levels_count${n === 1 ? '_one' : ''}`, { count: n });
    if (this.mode() !== 'edit') return niveles;
    const g = this.enGrupos();
    return `${niveles}, ${this.translate.instant(`repositories.tipificaciones.used_in${g === 1 ? '_one' : ''}`, { count: g })}`;
  });

  /* ── Ciclo de vida ────────────────────────────────────────────────────── */

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      if (this.route.snapshot.queryParamMap.has('seccion')) {
        void this.sectionLinks.go(this.sectionLinks.section(this.route, null), { replace: true });
      }
      // DUPLICAR es un alta rellena, como en Grupos y Agentes: «Atención al cliente (1)» con la descripción y el árbol
      // del original. La tipificación no existe hasta «Crear tipificación»; la copia es el punto de partida
      // («Deshacer» vuelve a ella y salir sin tocar nada no pregunta).
      const seedFromId = this.route.snapshot.queryParamMap.get('seedFromId');
      if (seedFromId) {
        const source = this.store.items().find((x) => x.id === Number(seedFromId));
        if (!source) {
          void this.router.navigateByUrl('/admin/tipificaciones', { replaceUrl: true });
          return;
        }
        const { id: _id, ...borrador } = structuredClone(source);
        this.form.set({ ...borrador, name: nombreDeCopia(source.name, this.store.items().map((i) => i.name)) });
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
    this.nombreGuardado.set(t.name);
    const { id: _id, ...borrador } = t;
    this.form.set(borrador);
    this.dirtyState.markPristine();
  }


  protected update<K extends keyof Borrador>(key: K, value: Borrador[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected save(): void {
    if (this.mode() === 'edit' && !this.formDirty()) return;
    // El botón está apagado con algo pendiente (DD-219), pero se llega aquí también con Ctrl+S: no crea ni guarda, dice
    // lo que falta en rojo y lleva al primer sitio.
    if (this.pendiente()) {
      this.ocasion.intentar();
      const primero = this.avisos()[0];
      if (primero) this.irACampo(primero.seccion, primero.ancla);
      return;
    }
    const f = this.form();
    const borrador: Borrador = { ...f, name: f.name.trim(), description: f.description.trim() };
    if (this.mode() === 'create') {
      const created = this.store.addItem(borrador);
      this.dirtyState.markPristine();
      const creado = this.texto('repositories.tipificaciones.toasts.created', created.name);
      const slug = Object.entries(TipificacionFichaPageComponent.SLUGS).find(([, v]) => v === this.activeSection())?.[0];
      // Tras llegar a la edición: antes, el cambio de página se lo llevaría (DD-191).
      void this.router
        .navigate(['/admin/tipificaciones/editar', created.id], {
          replaceUrl: true,
          queryParams: slug && slug !== 'general' ? { seccion: slug } : {},
        })
        .then(() => this.resultado.contar(creado));
      return;
    }
    this.store.updateItem(this.editingId()!, borrador);
    this.nombreGuardado.set(borrador.name);
    this.form.set(borrador);
    this.ocasion.olvidar();
    this.dirtyState.markPristine();
    this.resultado.contar(this.texto('repositories.tipificaciones.toasts.updated', borrador.name));
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
    this.ocasion.olvidar();
  }

  protected readonly deleteItems = computed(() => {
    const id = this.editingId();
    return id === null ? [] : [{ id, name: this.form().name }];
  });

  /** Qué grupos la usan, en el diálogo de eliminar: dejarán de tipificar. */
  protected readonly avisoDeUso = computed(() => {
    this.lang();
    const id = this.editingId();
    return id === null ? null : this.uso.aviso(id);
  });

  private readonly borradoSimple = injectBorradoSimple<{ readonly id: number; readonly name: string }>({
    target: computed(() => (this.deleteVisible() ? this.deleteItems() : null)),
    titleKey: 'repositories.tipificaciones.delete_dialog.title',
    titleBulkKey: 'repositories.tipificaciones.delete_dialog.title_bulk',
    params: (t) => ({ name: t[0]!.name, count: t.length }),
    detail: () => this.avisoDeUso(),
    accept: () => this.confirmDelete(),
    cancel: () => this.deleteVisible.set(false),
  });

  protected confirmDelete(): void {
    const id = this.editingId();
    if (id === null) return;
    const name = this.form().name;
    this.uso.soltar(new Set([id]));
    this.store.deleteItem(id);
    this.deleteVisible.set(false);
    this.dirtyState.markPristine();
    this.resultado.contar(this.texto('repositories.tipificaciones.toasts.deleted', name));
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

  /** El texto de «creado», «actualizado» o «eliminado» de esta entidad. */
  private texto(key: string, name: string): string {
    return this.translate.instant(key, { name });
  }

}
