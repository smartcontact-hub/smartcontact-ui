import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ScCheckboxComponent as CheckboxComponent } from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { CrossTabLockService } from '@core/services';
import { EMAIL_RE } from '@core/utils/validators';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { IllustratedAvatarComponent } from '@shared/components';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import {
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScDividerComponent as DividerComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
  ScInputTextComponent as InputTextComponent,
  ScPhotoUploadComponent as PhotoUploadComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { AVAILABLE_GROUPS_REF } from '@shared/data/groups-ref';
import {
  AVAILABLE_SERVICES,
  DEFAULT_PERMISSIONS,
  DEFAULT_SECTIONS,
  PERMISSION_DEFS,
  SECTION_DEFS,
  USER_TYPES,
  USER_TYPE_LABEL_KEYS,
  User,
  UserPermissions,
  UserSections,
  UserType,
} from '../data/users-data';
import { UsersStore } from '../state/users.store';
import { BoardCardComponent } from '@features/admin/comparar/board-card.component';
import { BoardRowComponent } from '@features/admin/comparar/board-row.component';
import { FichaVariantBarComponent } from '@features/admin/comparar/ficha-variant-bar.component';
import { FichaVariantService } from '@features/admin/comparar/ficha-variant.service';
import {
  changed,
  PendingChangesPanelComponent,
  type PendingSection,
} from '@features/admin/comparar/pending-changes-panel.component';
import { createSectionScrollSpy } from '@features/admin/comparar/section-scroll-spy';

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

@Component({
  selector: 'sc-user-form-page',
  imports: [
    BoardCardComponent,
    BoardRowComponent,
    CheckboxComponent,
    ButtonComponent,
    DeleteEntityDialogComponent,
    DividerComponent,
    FichaVariantBarComponent,
    FormSectionNavComponent,
    PendingChangesPanelComponent,
    IllustratedAvatarComponent,
    InputTextComponent,
    PhotoUploadComponent,
    SectionCardComponent,
    SelectComponent,
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
  private readonly usersStore = inject(UsersStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
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
   * Section index for the form shell. In `edit` mode, Identity drops to
   * the end — user identity is set once and rarely touched again.
   * Delete is *not* in the nav — it lives at the bottom of the Identity
   * tab (danger zone pattern, GitHub / Stripe).
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
    // Orden por modo (S60). En CREAR, identidad primero — es lo primero que se
    // rellena. En EDITAR, identidad al fondo: apenas se toca tras crear, y la
    // ficha del panel ya da su contexto siempre visible.
    // COMPARAR: en una sola página (`b`) el índice sigue el orden de la página.
    if (this.mode() === 'edit' && this.variants.variant() !== 'b') {
      return [access, services, identity];
    }
    return [identity, access, services];
  });

  protected readonly activeSection = signal<string>('user-section-identity');

  /* ── COMPARAR (rama `comparar/fichas`) ──────────────────────────────────────────────── */
  protected readonly variants = inject(FichaVariantService);
  private readonly scrollSpy = createSectionScrollSpy({
    enabled: () => this.variants.variant() === 'b',
    ids: () => this.navSections().map((s) => s.id),
    active: this.activeSection,
  });

  protected iconOf(id: string): string | null {
    return this.navSections().find((s) => s.id === id)?.icon ?? null;
  }

  /** En `b` se ven todas; en `a` y `c`, la del índice. */
  protected showSection(id: string): boolean {
    return this.variants.variant() === 'b' || this.activeSection() === id;
  }

  protected goToSection(id: string): void {
    this.scrollSpy.jump(id);
  }

  /* ── Variante `d`: el resumen de cada sección. Solo LEE el estado actual del formulario. ── */
  protected readonly isBoard = computed(() => this.variants.variant() === 'd');

  protected yesNo(value: boolean): string {
    return value ? 'common.yes' : 'common.no';
  }

  protected orNone(value: string | number | null | undefined): string {
    return value === null || value === undefined || value === '' ? this.translate.instant('compare.board.none') : String(value);
  }

  /** Los rótulos de lo que está marcado, o «Ninguno». */
  private labelsOf(keys: readonly string[]): string {
    return keys.length > 0 ? keys.map((k) => this.translate.instant(k)).join(', ') : this.translate.instant('compare.board.none');
  }

  protected sectionsSummary(): string {
    const s = this.form().sections;
    return this.labelsOf(SECTION_DEFS.filter((d) => s[d.key] && (!d.parent || s[d.parent])).map((d) => d.labelKey));
  }

  protected permissionsSummary(): string {
    const p = this.form().permissions;
    return this.labelsOf(PERMISSION_DEFS.filter((d) => p[d.key]).map((d) => d.labelKey));
  }

  protected servicesSummary(): string {
    const names = [...this.form().services];
    return names.length > 0 ? names.join(', ') : this.translate.instant('compare.board.none');
  }

  /** Variante `c`: lo cambiado sin guardar, por sección, y lo que mueve fuera de ella. */
  protected readonly pendingChanges = computed<readonly PendingSection[]>(() => {
    if (!this.dirtyState.dirty()) return [];
    const before = this.dirtyState.pristineValue();
    const now = this.form();
    const t = (key: string, params?: Record<string, unknown>): string => this.translate.instant(key, params);
    const fieldsOf = (pairs: readonly (readonly [unknown, unknown, string])[]): string[] =>
      pairs.filter(([a, b]) => changed(a, b)).map(([, , key]) => t(key));

    const identityEffects: string[] = [];
    // La consecuencia que ya cuenta la ayuda de «Activo».
    if (before.status === 'active' && now.status === 'inactive') {
      identityEffects.push(t('compare.effects.user_inactive'));
    }

    const sectionFields = SECTION_DEFS.filter((d) => before.sections[d.key] !== now.sections[d.key]).map((d) =>
      t(now.sections[d.key] ? 'compare.fields.added' : 'compare.fields.removed', { items: t(d.labelKey) }),
    );
    // Apagar una sección madre deja a sus hijas grises aunque sigan marcadas.
    const accessEffects = SECTION_DEFS.filter((d) => !d.parent && before.sections[d.key] && !now.sections[d.key]).flatMap((d) => {
      const children = SECTION_DEFS.filter((c) => c.parent === d.key && now.sections[c.key]).map((c) => t(c.labelKey));
      return children.length > 0 ? [t('compare.effects.user_section_children', { section: t(d.labelKey), children: children.join(', ') })] : [];
    });
    const permissionFields = PERMISSION_DEFS.filter((d) => before.permissions[d.key] !== now.permissions[d.key]).map((d) =>
      t(now.permissions[d.key] ? 'compare.fields.added' : 'compare.fields.removed', { items: t(d.labelKey) }),
    );
    const added = [...now.services].filter((x) => !before.services.has(x));
    const removed = [...before.services].filter((x) => !now.services.has(x));
    const serviceFields = [
      ...(added.length > 0 ? [t('compare.fields.added', { items: added.join(', ') })] : []),
      ...(removed.length > 0 ? [t('compare.fields.removed', { items: removed.join(', ') })] : []),
    ];

    const sections: PendingSection[] = [
      {
        sectionId: 'user-section-identity',
        icon: 'badge',
        labelKey: 'users.form.section.identity',
        fields: fieldsOf([
          [before.name, now.name, 'users.form.fields.name'],
          [before.photo, now.photo, 'compare.fields.photo'],
          [before.email, now.email, 'users.form.fields.email'],
          [before.identifier, now.identifier, 'users.form.fields.identifier'],
          [before.type, now.type, 'users.form.fields.type'],
          [before.status, now.status, 'users.form.fields.active'],
        ]),
        effects: identityEffects,
      },
      {
        sectionId: 'user-section-access',
        icon: 'verified_user',
        labelKey: 'users.form.section.access',
        fields: [...sectionFields, ...permissionFields],
        effects: accessEffects,
      },
      {
        sectionId: 'user-section-services',
        icon: 'hub',
        labelKey: 'users.form.section.services',
        fields: serviceFields,
        effects: [],
      },
    ];
    return sections.filter((s) => s.fields.length > 0 || s.effects.length > 0);
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

  /**
   * Section ids con required vacíos. El `<sc-form-section-nav>` pinta una
   * bola roja al lado del label de cada section aquí presente.
   * Solo required vacíos — no errores de formato (e.g. email malformado).
   */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() => {
    const f = this.form();
    const errors = new Set<string>();
    if (!f.name.trim() || !f.email.trim()) errors.add('user-section-identity');
    return errors;
  });

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
      // En edición aterriza en Secciones (1ª del orden de edición): identidad
      // va al fondo porque casi no se toca tras crear; la ficha la resume (S60).
      // COMPARAR: en una sola página se empieza por arriba.
      this.activeSection.set(this.variants.variant() === 'b' ? 'user-section-identity' : 'user-section-access');
      this.releaseLock = this.crossTab.acquire('user', user.id, () =>
        this.conflictWarning.set(true),
      );
      return;
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

  protected onTypeValueChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('type', value as UserType);
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

      const editingId = this.editingId();
      if (editingId) {
        this.usersStore.updateUser(editingId, { ...payload });
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant('users.toasts.updated', { name: payload.name }),
          life: TOAST_LIFE.success,
        });
      } else {
        const created = this.usersStore.addUser(payload);
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant('users.toasts.created', { name: created.name }),
          life: TOAST_LIFE.success,
        });
      }

      this.saving.set(false);
      this.dirtyState.markPristine();
      void this.router.navigateByUrl('/admin/usuarios');
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

  private emptyForm(): FormState {
    return {
      name: '',
      email: '',
      identifier: '',
      type: 'agent',
      status: 'active',
      sections: { ...DEFAULT_SECTIONS },
      permissions: { ...DEFAULT_PERMISSIONS },
      groups: new Set(),
      services: new Set(),
      photo: null,
    };
  }

}
