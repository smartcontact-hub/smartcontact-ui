import { ChangeDetectionStrategy, Component, computed, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ScButtonComponent,
  ScCheckboxComponent,
  ScDeleteEntityDialogComponent,
  ScDividerComponent,
  ScInputTextComponent,
  ScOptionCardsComponent,
  ScSectionCardComponent,
  ScTagComponent,
  type DeletableEntity,
  type ScOptionCardItem,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { IllustratedAvatarComponent } from '@shared/components';

import {
  TYPE_PACKAGES,
  USER_CAPABILITIES,
  USER_SECTIONS,
  USER_TYPES,
  countOf,
  driftFromPackage,
  plural,
  toggleChild,
  toggleMother,
  type LabPerson,
  type LabUserType,
  type PermissionMother,
} from '../admin-lab.model';
import { AdminLabStore } from '../admin-lab.store';
import { LabOptionsComponent } from '../lab-options.component';
import { EntityPickerComponent, type PickItem } from '../components/entity-picker.component';
import { PermissionChecksComponent } from '../components/permission-checks.component';

type Section = 'grupos' | 'identidad' | 'acceso';

interface RailSection {
  readonly id: Section;
  readonly labelKey: string;
  readonly icon: string;
  readonly value: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Alta y ficha de usuario — el MISMO molde que la de grupo y que los formularios reales de
 * admin. Cambia la lista de secciones y los campos, que es justamente lo que B4 dice que
 * tiene que cambiar entre dos objetos: el molde, no.
 *
 *  A1 · el tipo ES el paquete. Elegirlo PRESELECCIONA sus casillas, y apartarse se ve
 *       («Supervisor · 2 cambios») en el índice, en la lista y junto al selector. Hoy
 *       `onTypeValueChange` solo escribe el campo: se puede guardar un administrador sin
 *       permisos. Se elige con `sc-option-cards`, que es el componente del DS para
 *       decisiones cuyo NOMBRE no dice qué pasa — exactamente este caso (B13).
 *  B1 · el identificador se pide en el alta y desaparece en la ficha; en su sitio aparece
 *       un campo que el alta no necesitaba (notas internas), como el Notes de Telegram.
 *  B11 · secciones y capacidades son dos listas, no una rejilla de 16 casillas.
 *  B12 · Estadísticas manda sobre sus dos hijas de verdad.
 */
@Component({
  selector: 'app-lab-usuario-form-page',
  imports: [
    EntityPickerComponent,
    IllustratedAvatarComponent,
    LabOptionsComponent,
    PermissionChecksComponent,
    ScButtonComponent,
    ScCheckboxComponent,
    ScDeleteEntityDialogComponent,
    ScDividerComponent,
  ScDividerComponent,
    ScIconComponent,
    ScInputTextComponent,
    ScOptionCardsComponent,
    ScSectionCardComponent,
    ScTagComponent,
    TranslatePipe,
  ],
  templateUrl: './usuario-form-page.component.html',
  styleUrl: './usuario-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  /** Los `computed` que traducen tienen que LEER el idioma o se congelan en el de carga. */
  private readonly lang = injectLangChange();
  protected readonly store = inject(AdminLabStore);

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>(
    this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create',
  );

  private readonly initial: LabPerson | undefined =
    this.mode() === 'edit' ? this.store.person(this.route.snapshot.paramMap.get('id') ?? '') : undefined;

  protected readonly sectionsCatalog = USER_SECTIONS;
  protected readonly capabilities = USER_CAPABILITIES;
  protected readonly trashIcon = 'delete';

  protected readonly activeSection = signal<Section>(this.mode() === 'create' ? 'grupos' : 'identidad');

  protected readonly name = signal(this.initial?.name ?? '');
  protected readonly identifier = signal(this.initial?.identifier ?? '');
  protected readonly email = signal(this.initial?.email ?? '');
  protected readonly notes = signal(this.initial ? 'Cubre el turno de tarde desde marzo.' : '');
  protected readonly type = signal<LabUserType>(this.initial?.type ?? 'agent');
  protected readonly groups = signal<ReadonlySet<string>>(new Set(this.initial?.groups ?? []));
  protected readonly grants = signal<ReadonlySet<string>>(
    new Set(this.initial?.grants ?? TYPE_PACKAGES.agent),
  );
  protected readonly deleting = signal(false);

  protected readonly createdAt = '12/03/2026';

  /** B13 · cada paquete explicado donde se elige, no en otra pantalla. */
  protected readonly typeOptions: readonly ScOptionCardItem[] = USER_TYPES.map((t) => ({
    value: t.id,
    label: t.label,
    description: t.detail,
  }));

  protected readonly drift = computed(() => driftFromPackage(this.type(), this.grants()));
  protected readonly sectionCount = computed(() => countOf(this.sectionsCatalog, this.grants()));
  protected readonly capabilityCount = computed(() => countOf(this.capabilities, this.grants()));

  protected readonly typeLabel = computed(
    () => USER_TYPES.find((t) => t.id === this.type())?.label ?? this.type(),
  );

  protected readonly emailInvalid = computed(
    () => this.email().trim().length > 0 && !EMAIL_RE.test(this.email().trim()),
  );

  protected readonly candidates = computed<readonly PickItem[]>(() =>
    this.store.groups().map((g) => ({
      id: g.id,
      name: g.name,
      sub: g.description + ' · ' + plural(g.members.length, 'agente', 'agentes'),
    })),
  );

  protected readonly sections = computed<readonly RailSection[]>(() => {
    this.lang();
    const grupos: RailSection = {
      id: 'grupos',
      labelKey: 'sidebar.groups',
      icon: 'groups',
      value: this.groups().size === 0
        ? this.translate.instant('lab.admin.value.no_groups')
        : plural(this.groups().size, 'grupo', 'grupos'),
    };
    const identidad: RailSection = {
      id: 'identidad',
      labelKey: 'users.form.section.identity',
      icon: 'badge',
      value: this.name().trim() || this.translate.instant('lab.admin.value.unnamed'),
    };
    /* A1 · el valor de «Acceso» es el PAQUETE y cuánto se aparta de él. */
    const acceso: RailSection = {
      id: 'acceso',
      labelKey: 'users.form.section.access',
      icon: 'key',
      value: this.drift() === 0
        ? this.typeLabel()
        : this.typeLabel() + ' · ' + plural(this.drift(), 'cambio', 'cambios'),
    };
    return this.mode() === 'create' ? [grupos, identidad, acceso] : [identidad, acceso, grupos];
  });

  protected readonly dirty = computed(() => {
    if (this.mode() === 'create') {
      return this.groups().size > 0 || this.name().trim().length > 0 || this.email().trim().length > 0;
    }
    const initial = this.initial;
    if (!initial) return false;
    return (
      this.name() !== initial.name ||
      this.email() !== initial.email ||
      this.type() !== initial.type ||
      this.groups().size !== initial.groups.length ||
      this.grants().size !== initial.grants.length
    );
  });

  protected readonly saveBlockedReason = computed<string | null>(() => {
    this.lang();
    if (!this.name().trim()) return this.translate.instant('lab.admin.blocked.no_name');
    if (this.mode() === 'create' && !this.identifier().trim()) {
      return this.translate.instant('lab.admin.blocked.no_identifier');
    }
    if (!this.email().trim() || this.emailInvalid()) {
      return this.translate.instant('lab.admin.blocked.bad_email');
    }
    if (this.groups().size === 0) return this.translate.instant('lab.admin.blocked.no_groups');
    return null;
  });

  protected readonly canSave = computed(
    () => !this.saveBlockedReason() && (this.mode() === 'create' || this.dirty()),
  );

  protected readonly deleteItems = computed<readonly DeletableEntity[]>(() => [
    { id: 1, name: this.name() },
  ]);

  protected readonly deleteDetail = computed(
    () =>
      'Se pierde su acceso y ' +
      plural(this.groups().size, 'vínculo de grupo', 'vínculos de grupo') +
      '. Sus conversaciones cerradas y sus grabaciones se quedan, a su nombre; las que tenga abiertas vuelven a la cola de su grupo.',
  );

  /**
   * A1 en una línea: elegir tipo REESCRIBE las casillas con su paquete. Con el fallo de hoy
   * puesto solo se escribe el campo, que es lo que hace `onTypeValueChange` en el Supervisor.
   */
  protected onType(value: string): void {
    const type = value as LabUserType;
    this.type.set(type);
    if (!this.store.modoHoy()) this.grants.set(new Set(TYPE_PACKAGES[type]));
  }

  protected resetToPackage(): void {
    this.grants.set(new Set(TYPE_PACKAGES[this.type()]));
  }

  protected onMother(mother: PermissionMother, next: boolean): void {
    this.grants.set(toggleMother(this.grants(), mother, next, this.store.modoHoy()));
  }

  protected onChild(mother: PermissionMother, childId: string, next: boolean): void {
    this.grants.set(toggleChild(this.grants(), mother, childId, next));
  }

  protected onCapability(id: string, next: boolean): void {
    const out = new Set(this.grants());
    if (next) out.add(id);
    else out.delete(id);
    this.grants.set(out);
  }

  protected has(id: string): boolean {
    return this.grants().has(id);
  }

  protected onGroupToggled(id: string): void {
    const next = new Set(this.groups());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.groups.set(next);
  }

  protected save(): void {
    if (!this.canSave()) return;
    if (this.mode() === 'create') {
      this.store.addPerson({
        id: 'p-' + Date.now().toString(36),
        name: this.name().trim(),
        identifier: this.identifier().trim(),
        email: this.email().trim(),
        job: this.typeLabel(),
        status: 'activo',
        groups: [...this.groups()],
        type: this.type(),
        grants: [...this.grants()],
      });
    } else if (this.initial) {
      this.store.updatePerson(this.initial.id, {
        name: this.name().trim(),
        email: this.email().trim(),
        groups: [...this.groups()],
        type: this.type(),
        grants: [...this.grants()],
      });
    }
    void this.router.navigate(['/lab/admin/usuarios']);
  }

  protected discard(): void {
    this.name.set(this.initial?.name ?? '');
    this.email.set(this.initial?.email ?? '');
    this.type.set(this.initial?.type ?? 'agent');
    this.groups.set(new Set(this.initial?.groups ?? []));
    this.grants.set(new Set(this.initial?.grants ?? TYPE_PACKAGES.agent));
  }

  protected confirmDelete(): void {
    this.deleting.set(false);
    if (this.initial) this.store.removePerson(this.initial.id);
    void this.router.navigate(['/lab/admin/usuarios']);
  }
}
