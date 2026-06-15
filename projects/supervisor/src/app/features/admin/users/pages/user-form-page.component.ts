import {
  afterNextRender,
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
import { ButtonModule } from 'primeng/button';

import { DirtyAware } from '@core/guards';
import { CrossTabLockService } from '@core/services';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { EMAIL_RE } from '@core/utils/validators';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { IconComponent, IllustratedAvatarComponent } from '@shared/components';
import {
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
  ScInputTextComponent as InputTextComponent,
  ScPhotoUploadComponent as PhotoUploadComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { PrimeTemplate } from 'primeng/api';
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
    ButtonModule,
    DeleteEntityDialogComponent,
    FormSectionNavComponent,
    IconComponent,
    IllustratedAvatarComponent,
    InputTextComponent,
    PhotoUploadComponent,
    PrimeTemplate,
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
  private readonly topBarSlot = inject(TopBarSlotService);

  /** Guardar/Cancelar proyectados a la TopBar (modelo "todo arriba" S59):
   * fuera la banda sticky-form-header; identidad → breadcrumb + campos del
   * cuerpo (foto/nombre re-alojados en Identidad). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    afterNextRender(() => {
      const tpl = this.topbarActions();
      if (tpl) this.topBarSlot.setActions(tpl);
    });
  }

  protected readonly userTypes = USER_TYPES;
  /* Widening intencional a `Record<string, string>` para que el `let-t`
   * que llega desde `pTemplate` (tipo `any` por design de PrimeNG) pueda
   * indexar sin TS7053. Seguro: las keys vienen siempre de `userTypes`
   * (UserType union). Mismo patrón que agent-form-page. */
  protected readonly typeLabelKeys: Readonly<Record<string, string>> = USER_TYPE_LABEL_KEYS;
  protected readonly mailIcon = 'mail';
  protected readonly trashIcon = 'delete';
  protected readonly sectionDefs = SECTION_DEFS;
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
  protected readonly errors = signal<Readonly<Record<string, string>>>({});
  protected readonly saving = signal(false);
  protected readonly deleteVisible = signal(false);

  readonly formDirty = signal(false);
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
    const sections: FormNavSection = {
      id: 'user-section-sections',
      labelKey: 'users.form.section.sections',
      icon: 'layers',
    };
    const permissions: FormNavSection = {
      id: 'user-section-permissions',
      labelKey: 'users.form.section.permissions',
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
    if (this.mode() === 'edit') {
      return [sections, permissions, services, identity];
    }
    return [identity, sections, permissions, services];
  });

  protected readonly activeSection = signal<string>('user-section-identity');

  protected readonly activeIcon = computed(() => {
    const id = this.activeSection();
    return this.navSections().find((s) => s.id === id)?.icon ?? null;
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
    return f.name.trim().length > 0 && EMAIL_RE.test(f.email.trim());
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
      // En edición aterriza en Secciones (1ª del orden de edición): identidad
      // va al fondo porque casi no se toca tras crear; la ficha la resume (S60).
      this.activeSection.set('user-section-sections');
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
      this.formDirty.set(true);
    }
  }

  ngOnDestroy(): void {
    this.releaseLock?.();
    this.releaseLock = null;
    this.topBarSlot.clearActions();
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
    this.formDirty.set(true);
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
    this.formDirty.set(true);
    this.form.update((f) => ({
      ...f,
      sections: { ...f.sections, [key]: !f.sections[key] },
    }));
  }

  protected togglePermission(key: keyof UserPermissions): void {
    this.formDirty.set(true);
    this.form.update((f) => ({
      ...f,
      permissions: { ...f.permissions, [key]: !f.permissions[key] },
    }));
  }

  protected toggleGroup(id: number): void {
    this.formDirty.set(true);
    this.form.update((f) => {
      const next = new Set(f.groups);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...f, groups: next };
    });
  }

  protected toggleService(name: string): void {
    this.formDirty.set(true);
    this.form.update((f) => {
      const next = new Set(f.services);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { ...f, services: next };
    });
  }

  protected onPhotoChange(photo: string | null): void {
    this.formDirty.set(true);
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
    if (!this.validate()) return;

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
      this.formDirty.set(false);
      void this.router.navigateByUrl('/admin/usuarios');
    }, 400);
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/admin/usuarios');
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
    this.formDirty.set(false);
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

  private validate(): boolean {
    const f = this.form();
    const next: Record<string, string> = {};
    if (!f.name.trim()) next['name'] = 'users.errors.name_required';
    if (!EMAIL_RE.test(f.email.trim())) next['email'] = 'users.errors.email_invalid';
    this.errors.set(next);
    return Object.keys(next).length === 0;
  }
}
