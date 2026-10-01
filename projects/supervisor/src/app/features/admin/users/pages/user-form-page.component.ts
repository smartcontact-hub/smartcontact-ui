import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, type UrlTree } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScCheckboxComponent as CheckboxComponent } from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { CrossTabLockService, SectionLinksService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';
import { EMAIL_RE } from '@core/utils/validators';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import {
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScDialogComponent as DialogComponent,
  ScDividerComponent as DividerComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
  ScInputTextComponent as InputTextComponent,
  ScMessageComponent as MessageComponent,
  ScPhotoUploadComponent as PhotoUploadComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { AVAILABLE_GROUPS_REF } from '@shared/data/groups-ref';
import { AltaPasosComponent, SummaryKpiComponent, SummaryStatusComponent } from '@shared/components';
import { pasosDeAlta } from '@shared/utils/alta-pasos';
import {
  accessFor,
  AVAILABLE_SERVICES,
  NEW_USER_TYPE,
  PERMISSION_DEFS,
  SECTION_DEFS,
  USER_TYPES,
  USER_TYPE_LABEL_KEYS,
  User,
  UserPermissions,
  UserSections,
  UserType,
} from '../data/users-data';
import { applyPackage, driftFromPackage } from '../data/user-packages.core.mjs';
import { UsersStore } from '../state/users.store';

interface FormState {
  name: string;
  email: string;
  identifier: string;
  type: UserType;
  status: 'active' | 'inactive';
  sections: UserSections;
  permissions: UserPermissions;
  groups: ReadonlySet<number>;
  services: ReadonlySet<string>;
  photo: string | null;
}

/** De qué sección es cada campo, para marcar en el índice las que tienen cambios sin guardar (DD-122).
 *  `groups` no se edita en la ficha: se arrastra al guardar. */
const USER_SECTION_OF_FIELD: Readonly<Record<keyof FormState, string>> = {
  name: 'user-section-identity',
  email: 'user-section-identity',
  identifier: 'user-section-identity',
  type: 'user-section-identity',
  status: 'user-section-identity',
  photo: 'user-section-identity',
  sections: 'user-section-access',
  permissions: 'user-section-access',
  groups: 'user-section-access',
  services: 'user-section-services',
};

@Component({
  selector: 'sc-user-form-page',
  imports: [
    NgTemplateOutlet,
    CheckboxComponent,
    ButtonComponent,
    DeleteEntityDialogComponent,
    DialogComponent,
    DividerComponent,
    FormSectionNavComponent,
    IconComponent,
    InputTextComponent,
    MessageComponent,
    PhotoUploadComponent,
    SectionCardComponent,
    SelectComponent,
    SummaryKpiComponent,
    SummaryStatusComponent,
    AltaPasosComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './user-form-page.component.html',
  styleUrl: './user-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormPageComponent implements DirtyAware, OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sectionLinks = inject(SectionLinksService);
  private readonly usersStore = inject(UsersStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly crossTab = inject(CrossTabLockService);

  /** Guardar/Cancelar proyectados a la TopBar (modelo "todo arriba" S59):
   * fuera la banda sticky-form-header; identidad → breadcrumb + campos del
   * cuerpo (foto/nombre re-alojados en Identidad). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly userTypes = USER_TYPES;
  /* Widening intencional a `Record<string, string>` para que el `let-t`
   * que llega desde el `<ng-template #item>` proyectado (`any` por diseño) pueda
   * indexar sin TS7053. Seguro: las keys vienen siempre de `userTypes`
   * (UserType union). Mismo patrón que agent-form-page. */
  protected readonly typeLabelKeys: Readonly<Record<string, string>> = USER_TYPE_LABEL_KEYS;
  protected readonly mailIcon = 'mail';
  protected readonly trashIcon = 'delete';
  /** Las secciones con sus hijas colgando, para pintarlas en la misma celda. */
  protected readonly sectionTree = SECTION_DEFS.filter((d) => !d.parent).map((def) => ({
    def,
    children: SECTION_DEFS.filter((c) => c.parent === def.key),
  }));
  protected readonly permissionDefs = PERMISSION_DEFS;
  protected readonly availableServices = AVAILABLE_SERVICES;
  protected readonly availableGroupsById = new Map(AVAILABLE_GROUPS_REF.map((g) => [g.id, g.name]));

  protected readonly editingId = signal<number | null>(null);
  /**
   * Si el usuario llegó vía "Duplicar" desde un row-menu, este signal guarda
   * el nombre del usuario origen para mostrar en el title/breadcrumb. NULL
   * cuando es create vacío normal.
   */
  protected readonly duplicatingFromName = signal<string | null>(null);
  protected readonly initial = signal<User | null>(null);
  protected readonly form = signal<FormState>(this.emptyForm());
  /*
   * R6 · una sola política de error.
   *
   * Antes había un `validate()` que rellenaba un mapa `errors` — y era código
   * MUERTO: `save()` ya salía antes si `!canSave()`, y `canSave()` comprobaba
   * el mismo predicado, así que el mapa nunca llegaba a tener nada. Resultado:
   * estas pantallas no enseñaban ni un mensaje de campo, nunca. Solo un botón
   * gris sin explicar por qué (el antipatrón nº1 de Nielsen).
   *
   * Regla: el error se revela por CONTENIDO equivocado, en vivo. Un campo
   * vacío calla — todavía no es un error, es un campo sin rellenar, y acusar a
   * un formulario recién abierto es ruido. Lo que falta por rellenar se
   * comunica por la otra vía: el motivo del botón deshabilitado.
   * Mismo modelo que `category-form-modal`.
   */
  protected readonly emailError = computed<string | null>(() => {
    const email = this.form().email.trim();
    if (email.length === 0) return null;
    return EMAIL_RE.test(email) ? null : 'users.errors.email_invalid';
  });

  /** Por qué NO se puede guardar, en palabras. Alimenta el `title` y el
   *  `aria-describedby` del botón: un control deshabilitado sin motivo obliga
   *  al usuario a adivinar cuál de los campos le falta. */
  protected readonly saveDisabledReason = computed<string | null>(() => {
    if (this.canSave()) return null;
    const f = this.form();
    if (f.name.trim().length === 0) return 'users.errors.name_required';
    if (!EMAIL_RE.test(f.email.trim())) return 'users.errors.email_invalid';
    if (this.mode() === 'edit' && !this.dirtyState.dirty()) return 'common.no_changes';
    return null;
  });
  /** Lo que falta para poder crear, en el orden de Identidad, para el resumen (DD-136). Un email mal escrito no
   *  falta: se dice en su campo. */
  protected readonly summaryMissing = computed<readonly string[]>(() => {
    const f = this.form();
    const missing: string[] = [];
    if (f.name.trim().length === 0) missing.push('common.summary_missing_name');
    if (f.email.trim().length === 0) missing.push('users.form.summary.missing_email');
    return missing;
  });
  /** El motivo que se ENSEÑA junto al botón: solo lo que falta rellenar. «No hay
   *  cambios» se queda en el `title` del botón apagado, que ya lo dice. */
  protected readonly saveBlockedReason = computed(() => {
    const reason = this.saveDisabledReason();
    return reason === 'common.no_changes' ? null : reason;
  });
  protected readonly saving = signal(false);
  protected readonly deleteVisible = signal(false);

  /** Dirty-state por CAMBIO NETO (snapshot vs pristine): Guardar refleja si hay
   *  algo distinto que guardar (vuelve a off si deshaces). Patrón compartido
   *  (admin/AED/builder); `formDirty` queda de alias para el guard de salida. */
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;
  protected readonly conflictWarning = signal(false);
  private releaseLock: (() => void) | null = null;

  /**
   * EL ÍNDICE DE LA FICHA (DD-122): el mismo de la ficha de grupo y de Contact Center, con UN orden en
   * los dos modos, el de sus dependencias: quién es (Identidad), a qué tiene acceso (Acceso) y qué
   * supervisa (Servicios). Hasta el 2026-09-27 fueron pestañas y, al editar, Identidad iba en medio.
   * Abre en la primera; el listado enlaza directo a Acceso (`?seccion=acceso`), que es donde se trabaja.
   */
  protected readonly navSections = computed<readonly FormNavSection[]>(() => {
    const identity: FormNavSection = {
      id: 'user-section-identity',
      labelKey: 'users.form.section.identity',
      icon: 'badge',
    };
    // Secciones + Permisos = Acceso (2026-09-14): la misma pregunta en dos listas.
    const access: FormNavSection = {
      id: 'user-section-access',
      labelKey: 'users.form.section.access',
      icon: 'verified_user',
    };
    const services: FormNavSection = {
      id: 'user-section-services',
      labelKey: 'users.form.section.services',
      icon: 'hub',
    };
    return [identity, access, services].map((sec) => ({
      ...sec,
      href: this.sectionLinks.href(this.sectionUrl(sec.id)),
    }));
  });

  /** Cada sección en la dirección (`?seccion=acceso`). */
  private static readonly SECTION_SLUGS: Readonly<Record<string, string>> = {
    identidad: 'user-section-identity',
    acceso: 'user-section-access',
    servicios: 'user-section-services',
  };

  /** `?seccion=` de la dirección (`withComponentInputBinding`), también cuando solo cambia la query. */
  readonly seccion = input<string | undefined>();

  /**
   * EL ALTA VA EN PASOS (DD-137), también al duplicar: las mismas tres secciones, en el Stepper vertical nativo, y en
   * cualquier orden (DD-130: aquí no hay puerta). Identidad está completa con nombre y un email bien escrito.
   */
  protected readonly alta = pasosDeAlta({
    secciones: this.navSections,
    bloqueado: () => false,
    completo: (id) =>
      id !== 'user-section-identity' || (this.form().name.trim().length > 0 && EMAIL_RE.test(this.form().email.trim())),
  });

  /** La sección a la vista: en el alta y al duplicar, el paso abierto; al editar, la de la dirección (Identidad sin parámetro). */
  protected readonly activeSection = computed<string>(() =>
    this.mode() === 'edit'
      ? (UserFormPageComponent.SECTION_SLUGS[this.seccion() ?? ''] ?? 'user-section-identity')
      : this.alta.abierta(),
  );

  /** El número del paso a la vista, para el Stepper. */
  protected readonly pasoAbierto = computed(() => this.navSections().findIndex((s) => s.id === this.activeSection()) + 1);

  /** La dirección de una sección: la primera, sin parámetro (es la dirección de la ficha). */
  private sectionUrl(id: string): UrlTree {
    const slug = Object.entries(UserFormPageComponent.SECTION_SLUGS).find(([, v]) => v === id)?.[0] ?? null;
    return this.sectionLinks.section(this.route, id === 'user-section-identity' ? null : slug);
  }

  /** Ir a otra sección. En el alta y al duplicar, el paso se abre sin tocar la dirección: Atrás sale (DD-122, DD-137). */
  protected goTo(id: string): void {
    if (this.mode() !== 'edit') {
      this.alta.abrir(id);
      return;
    }
    void this.sectionLinks.go(this.sectionUrl(id));
  }

  /** «Siguiente» y «Atrás» de cada paso: atajos al de al lado, no puertas (DD-137; la puerta es solo del grupo). */
  protected siguiente(): void {
    const id = this.alta.siguiente();
    if (id) this.goTo(id);
  }

  protected anterior(): void {
    const id = this.alta.anterior();
    if (id) this.goTo(id);
  }

  /**
   * Lo que falta para poder guardar, en el índice: el nombre y un email válido, en Identidad. El índice es
   * de la edición; en el alta y al duplicar van los pasos (DD-137), y lo que falta lo dice el resumen (DD-136).
   */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() => {
    const f = this.form();
    const falta = !f.name.trim() || !EMAIL_RE.test(f.email.trim());
    return new Set(this.mode() !== 'create' && falta ? ['user-section-identity'] : []);
  });

  /** Las secciones con cambios sin guardar (DD-122), al editar. */
  protected readonly sectionsWithChanges = computed<ReadonlySet<string>>(() => {
    if (this.mode() !== 'edit') return new Set<string>();
    return new Set([...this.dirtyState.changedKeys()].map((k) => USER_SECTION_OF_FIELD[k as keyof FormState]));
  });

  /**
   * Secciones y permisos sobre su total: las dos cifras con anillo del resumen (DD-126). Cuentan las casillas que la
   * ficha ENSEÑA, no las claves del modelo: la de «Grupos / Agentes / Tipificaciones» sigue guardada y no se ve
   * (DD-132).
   */
  protected readonly summaryAccess = computed(() => {
    const f = this.form();
    return {
      secciones: SECTION_DEFS.filter((d) => f.sections[d.key]).length,
      totalSecciones: SECTION_DEFS.length,
      permisos: PERMISSION_DEFS.filter((d) => f.permissions[d.key]).length,
      totalPermisos: PERMISSION_DEFS.length,
    };
  });

  /** Cuántas casillas de Acceso se apartan de la plantilla del tipo (DD-132). Con 0, sigue la plantilla. */
  protected readonly templateDrift = computed(() => {
    const f = this.form();
    return driftFromPackage(f.type, f.sections, f.permissions);
  });

  /**
   * El tipo que se acaba de elegir cuando cambiarlo pisaría casillas que alguien tocó: la ficha pregunta si aplicar su
   * plantilla. `null`, nada que preguntar.
   */
  protected readonly pendingTemplate = signal<{ readonly type: UserType; readonly changes: number } | null>(null);

  /**
   * Lo que el resumen dice sin anillo: de qué tipo es esta persona. El tipo va aquí y no junto al email porque en
   * la línea de debajo del nombre «email · tipo» no cabía (medido el 2026-09-23).
   */
  protected readonly summaryFacts = computed(() => {
    this.lang(); // el tipo se traduce aquí: al cambiar de idioma, el resumen tiene que enterarse
    return [{ icono: 'badge', valor: this.translate.instant(this.typeLabelKeys[this.form().type]), etiqueta: 'users.form.headline.type' }];
  });

  protected readonly mode = computed<'edit' | 'duplicate' | 'create'>(() => {
    if (this.editingId()) return 'edit';
    if (this.duplicatingFromName()) return 'duplicate';
    return 'create';
  });

  /** Mode pasado al SCDS <sc-sticky-form-header>, que solo conoce edit/create.
   *  `duplicate` se mapea a `create` (la entidad NO existe aún hasta Guardar). */
  protected readonly headerMode = computed<'edit' | 'create'>(() =>
    this.mode() === 'edit' ? 'edit' : 'create',
  );

  protected readonly canSave = computed(() => {
    const f = this.form();
    if (f.name.trim().length === 0 || !EMAIL_RE.test(f.email.trim())) return false;
    // En EDITAR exige cambio neto; en crear/duplicar basta con que sea válido.
    if (this.mode() === 'edit' && !this.dirtyState.dirty()) return false;
    return true;
  });

  protected readonly deleteItems = computed(() => {
    const u = this.initial();
    return u ? [{ id: u.id, name: u.name }] : [];
  });

  protected readonly assignedGroupNames = computed(() =>
    Array.from(this.form().groups)
      .map((id) => this.availableGroupsById.get(id))
      .filter((name): name is string => !!name),
  );

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const user = this.usersStore.getUser(Number(idParam));
      if (!user) {
        void this.router.navigateByUrl('/admin/usuarios', { replaceUrl: true });
        return;
      }
      this.editingId.set(user.id);
      this.initial.set(user);
      this.form.set({
        name: user.name,
        email: user.email,
        identifier: user.identifier,
        type: user.type,
        status: user.status,
        sections: { ...user.sections },
        permissions: { ...user.permissions },
        groups: new Set(user.assignedGroups),
        services: new Set(user.assignedServices),
        photo: user.photo ?? null,
      });
      this.dirtyState.markPristine();
      this.releaseLock = this.crossTab.acquire('user', user.id, () =>
        this.conflictWarning.set(true),
      );
      return;
    }

    // El alta va en pasos (DD-137): la dirección no dice sección, y se quita la que traiga (el duplicado
    // conserva su `seedFromId`).
    if (this.route.snapshot.queryParamMap.has('seccion')) {
      void this.sectionLinks.go(this.sectionLinks.section(this.route, null), { replace: true });
    }

    // Modo "Duplicar": detecta ?seedFromId en query params y precarga el
    // form desde el source EXCEPTO los identificadores únicos (name +
    // email + identifier). El usuario debe rellenar esos 3 antes de
    // guardar. La bola roja en el nav señala la sección Identity.
    const seedFromId = this.route.snapshot.queryParamMap.get('seedFromId');
    if (seedFromId) {
      const source = this.usersStore.getUser(Number(seedFromId));
      if (!source) {
        void this.router.navigateByUrl('/admin/usuarios', { replaceUrl: true });
        return;
      }
      this.duplicatingFromName.set(source.name);
      this.form.set({
        // Unique identifiers — vaciados.
        name: '',
        email: '',
        identifier: '',
        // Resto del payload copiado.
        type: source.type,
        status: source.status,
        sections: { ...source.sections },
        permissions: { ...source.permissions },
        groups: new Set(source.assignedGroups),
        services: new Set(source.assignedServices),
        photo: source.photo ?? null,
      });
      // El duplicado nace "sucio" por construcción (datos sin guardar): el
      // snapshot ya difiere del pristine vacío → el guard de salida avisa solo.
    }
  }

  ngOnDestroy(): void {
    this.releaseLock?.();
    this.releaseLock = null;
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.formDirty() && !this.saving()) event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (this.canSave() && !this.saving()) this.save();
    }
  }

  protected updateField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected onTextValue<K extends 'name' | 'email' | 'identifier'>(key: K, value: string): void {
    this.updateField(key, value);
  }

  /**
   * Elegir el tipo es elegir su plantilla (DD-132). El tipo cambia siempre; las casillas, según lo que haya:
   *   · si ya son las de la nueva plantilla, no hay nada que aplicar;
   *   · en un alta que sigue la plantilla del tipo anterior (nadie las tocó), se aplica sin preguntar;
   *   · al editar, o si alguien las tocó, se pregunta cuántas cambiarían. Mantenerlas deja el desvío a la vista,
   *     con «Volver a la plantilla» para cuando se quiera.
   * El tipo cambia antes de preguntar, así el desplegable nunca enseña un valor que el formulario no tiene.
   */
  protected onTypeValueChange(value: unknown): void {
    if (typeof value !== 'string' || !(USER_TYPES as readonly string[]).includes(value)) return;
    const type = value as UserType;
    const f = this.form();
    if (type === f.type) return;
    const changes = driftFromPackage(type, f.sections, f.permissions);
    const untouched = driftFromPackage(f.type, f.sections, f.permissions) === 0;
    this.updateField('type', type);
    if (changes === 0) return;
    if (this.mode() !== 'edit' && untouched) this.applyTemplate(type);
    else this.pendingTemplate.set({ type, changes });
  }

  /** «Aplicar la plantilla» del aviso. */
  protected confirmTemplate(): void {
    const pending = this.pendingTemplate();
    this.pendingTemplate.set(null);
    if (pending) this.applyTemplate(pending.type);
  }

  /** «Mantener las casillas», o cerrar el aviso: el tipo ya cambió y Acceso se queda como estaba. */
  protected keepAccess(): void {
    this.pendingTemplate.set(null);
  }

  /** «Volver a la plantilla», en Acceso: las casillas del tipo actual, sin los cambios a mano. */
  protected resetToTemplate(): void {
    this.applyTemplate(this.form().type);
  }

  private applyTemplate(type: UserType): void {
    this.form.update((f) => ({ ...f, ...applyPackage(type, f.sections, f.permissions) }));
  }

  /** «1 cambio» o «N cambios»: el número va dentro de la clave. */
  protected templateChangesKey(count: number): string {
    return count === 1 ? 'users.form.template.changes_one' : 'users.form.template.changes_other';
  }

  protected onStatusChange(checked: boolean): void {
    this.updateField('status', checked ? 'active' : 'inactive');
  }

  protected toggleSection(key: keyof UserSections): void {
    this.form.update((f) => ({
      ...f,
      sections: { ...f.sections, [key]: !f.sections[key] },
    }));
  }

  protected togglePermission(key: keyof UserPermissions): void {
    this.form.update((f) => ({
      ...f,
      permissions: { ...f.permissions, [key]: !f.permissions[key] },
    }));
  }

  protected toggleGroup(id: number): void {
    this.form.update((f) => {
      const next = new Set(f.groups);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...f, groups: next };
    });
  }

  protected toggleService(name: string): void {
    this.form.update((f) => {
      const next = new Set(f.services);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { ...f, services: next };
    });
  }

  protected onPhotoChange(photo: string | null): void {
    this.form.update((f) => ({ ...f, photo }));
  }

  protected hasService(name: string): boolean {
    return this.form().services.has(name);
  }

  protected onNameRename(name: string): void {
    this.updateField('name', name);
  }

  protected save(): void {
    if (!this.canSave() || this.saving()) return;

    this.saving.set(true);
    setTimeout(() => {
      const f = this.form();
      const payload = {
        name: f.name.trim(),
        email: f.email.trim(),
        identifier: f.identifier.trim(),
        type: f.type,
        status: f.status,
        sections: f.sections,
        permissions: f.permissions,
        assignedGroups: Array.from(f.groups),
        assignedServices: Array.from(f.services),
        photo: f.photo ?? undefined,
      };

      // Guardar deja en la ficha, como en grupo y agente (DD-130): al editar se queda; al crear, abre la edición
      // del usuario nuevo en la sección en la que se estaba. Hasta el 2026-09-27 volvía siempre al listado.
      const editingId = this.editingId();
      if (editingId) {
        this.usersStore.updateUser(editingId, { ...payload });
        const refreshed = this.usersStore.getUser(editingId);
        if (refreshed) this.initial.set(refreshed);
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant('users.toasts.updated', { name: payload.name }),
          life: TOAST_LIFE.success,
        });
        this.saving.set(false);
        this.dirtyState.markPristine();
        return;
      }

      const created = this.usersStore.addUser(payload);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('users.toasts.created', { name: created.name }),
        life: TOAST_LIFE.success,
      });
      this.dirtyState.markPristine();
      const slug = Object.entries(UserFormPageComponent.SECTION_SLUGS).find(([, v]) => v === this.activeSection())?.[0];
      void this.router
        .navigate(['/admin/usuarios/editar', created.id], {
          replaceUrl: true,
          queryParams: slug && slug !== 'identidad' ? { seccion: slug } : {},
        })
        .finally(() => this.saving.set(false));
    }, 400);
  }

  /** Vuelve al último estado guardado (o al formulario vacío, en un alta). Es el
   *  «Deshacer» de Contact Center: vuelve atrás, no navega. */
  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
  }

  protected requestDelete(): void {
    if (this.editingId()) this.deleteVisible.set(true);
  }

  protected cancelDelete(): void {
    this.deleteVisible.set(false);
  }

  protected confirmDelete(): void {
    const id = this.editingId();
    if (!id) return;
    const user = this.initial();
    this.usersStore.deleteUser(id);
    this.deleteVisible.set(false);
    this.dirtyState.markPristine();
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('users.toasts.deleted_single', {
        name: user?.name ?? '',
      }),
      life: TOAST_LIFE.success,
    });
    void this.router.navigateByUrl('/admin/usuarios');
  }

  /** El alta nace Supervisor Offline con su plantilla: la supervisión, y nada de lo sensible (DD-132). */
  private emptyForm(): FormState {
    return {
      name: '',
      email: '',
      identifier: '',
      type: NEW_USER_TYPE,
      status: 'active',
      ...accessFor(NEW_USER_TYPE),
      groups: new Set(),
      services: new Set(),
      photo: null,
    };
  }

}
