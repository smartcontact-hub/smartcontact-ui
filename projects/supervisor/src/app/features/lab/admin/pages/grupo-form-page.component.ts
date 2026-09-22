import { ChangeDetectionStrategy, Component, computed, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ScButtonComponent,
  ScCheckboxComponent,
  ScDeleteEntityDialogComponent,
  ScDividerComponent,
  ScInputTextComponent,
  ScSectionCardComponent,
  ScTagComponent,
  ScTextareaComponent,
  type DeletableEntity,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { IllustratedAvatarComponent } from '@shared/components';

import {
  GROUP_PERMISSIONS,
  MEMBER_DEFAULTS,
  MEMBER_PERMISSIONS,
  countOf,
  plural,
  toggleChild,
  toggleMother,
  type LabGroup,
  type PermissionMother,
} from '../admin-lab.model';
import { AdminLabStore } from '../admin-lab.store';
import { LabOptionsComponent } from '../lab-options.component';
import { EntityPickerComponent, type PickItem } from '../components/entity-picker.component';
import { PermissionChecksComponent } from '../components/permission-checks.component';

type Section = 'miembros' | 'identidad' | 'permisos' | 'personas' | 'clonar';

interface RailSection {
  readonly id: Section;
  readonly labelKey: string;
  readonly icon: string;
  /** B17 · el valor de la sección, bajo su rótulo. */
  readonly value: string;
}

/**
 * Alta y ficha de grupo — el MISMO molde que `/admin/grupos/{crear,editar}`: rail con la
 * ficha y el índice, `sc-section-card` por sección, acciones arriba por `TopBarSlotService`
 * y guardián de cambios. Nada de esto se reinventa; lo que cambia son cuatro decisiones.
 *
 *  B4 · el ORDEN. En el alta la primera sección son los MIEMBROS, no los datos: un grupo se
 *       crea para que alguien conteste. Lo que Telegram y WhatsApp hacen con dos pasos aquí
 *       son dos secciones en orden, que es la forma que ya tiene esta pantalla. (Forzar el
 *       orden de verdad pediría un estado `disabled` en `sc-form-section-nav`; no está, y
 *       eso es un hallazgo para el DS, no algo que deba parchear una pantalla.)
 *  B14 · los permisos se configuran EN EL ALTA, así que el grupo nace bien configurado en
 *       vez de nacer y repasarse.
 *  B17 · cada fila del índice lleva SU VALOR debajo del rótulo. Es lo único que se dibuja
 *       distinto, y con las medidas del `sc-form-section-nav` para que se lea como él.
 *  B1 · el código se fija al crear y en la ficha ya no se edita.
 *
 * Y el botón dice la verdad: o está deshabilitado con su motivo escrito al lado —como ya
 * hace hoy `saveBlockedReason`— o funciona. Nunca el no-op de Telegram.
 */
@Component({
  selector: 'app-lab-grupo-form-page',
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
    ScSectionCardComponent,
    ScTagComponent,
    ScTextareaComponent,
    TranslatePipe,
  ],
  templateUrl: './grupo-form-page.component.html',
  styleUrl: './grupo-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrupoFormPageComponent {
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

  private readonly initial: LabGroup | undefined =
    this.mode() === 'edit' ? this.store.group(this.route.snapshot.paramMap.get('id') ?? '') : undefined;

  protected readonly blocks = GROUP_PERMISSIONS;
  protected readonly memberPermissions = MEMBER_PERMISSIONS;
  protected readonly defaults = MEMBER_DEFAULTS;
  protected readonly trashIcon = 'delete';

  /* B4 · en el alta los miembros van PRIMERO; en la ficha manda la identidad. */
  protected readonly activeSection = signal<Section>(this.mode() === 'create' ? 'miembros' : 'identidad');

  protected readonly name = signal(this.initial?.name ?? '');
  protected readonly description = signal(this.initial?.description ?? '');
  protected readonly members = signal<ReadonlySet<string>>(new Set(this.initial?.members ?? []));
  protected readonly grants = signal<ReadonlySet<string>>(new Set(this.initial?.grants ?? allGrants()));
  protected readonly overrides = signal<ReadonlyMap<string, boolean>>(
    new Map(Object.entries(this.initial?.overrides ?? {})),
  );
  protected readonly person = signal<string>(this.initial?.members[0] ?? '');
  protected readonly cloneFrom = signal<string | null>(null);
  protected readonly deleting = signal(false);

  protected readonly code = this.initial?.code ?? '';

  protected readonly allNodes = computed(() => this.blocks.flatMap((b) => b.nodes));
  protected readonly permCount = computed(() => countOf(this.allNodes(), this.grants()));
  protected readonly liveChannels = computed(() => {
    const grants = this.grants();
    return this.blocks[0]!.nodes.filter((n) => grants.has(n.id)).length;
  });

  protected readonly memberList = computed(() =>
    [...this.members()].map((id) => this.store.person(id)).filter((p) => !!p),
  );

  protected readonly candidates = computed<readonly PickItem[]>(() =>
    this.store.people().map((p) => ({ id: p.id, name: p.name, sub: p.job + ' · ' + p.email })),
  );

  protected readonly otherGroups = computed(() =>
    this.store.groups().filter((g) => g.id !== this.initial?.id),
  );

  protected readonly exceptionCount = computed(() => {
    let n = 0;
    for (const [key, value] of this.overrides()) {
      const permId = key.slice(key.indexOf(':') + 1);
      if (MEMBER_DEFAULTS[permId] !== value) n += 1;
    }
    return n;
  });

  /** B17 · el índice con su valor. En el alta solo lo que hace falta para crear. */
  protected readonly sections = computed<readonly RailSection[]>(() => {
    this.lang();
    const base: RailSection[] = [
      {
        id: 'miembros',
        labelKey: 'lab.admin.section.members',
        icon: 'group',
        value: this.members().size === 0
          ? this.translate.instant('lab.admin.value.no_members')
          : plural(this.members().size, 'agente', 'agentes'),
      },
      {
        id: 'identidad',
        labelKey: 'users.form.section.identity',
        icon: 'badge',
        value: this.name().trim() || this.translate.instant('lab.admin.value.unnamed'),
      },
      {
        id: 'permisos',
        labelKey: 'lab.admin.section.group_permissions',
        icon: 'tune',
        value: this.permCount().on + '/' + this.permCount().total + ' · ' + plural(this.liveChannels(), 'canal', 'canales'),
      },
    ];
    if (this.mode() === 'create') {
      return [base[0]!, base[1]!, base[2]!];
    }
    return [
      base[1]!,
      base[2]!,
      base[0]!,
      {
        id: 'personas',
        labelKey: 'lab.admin.section.person_permissions',
        icon: 'person_check',
        value: this.exceptionCount() === 0
          ? this.translate.instant('lab.admin.value.no_exceptions')
          : plural(this.exceptionCount(), 'excepción', 'excepciones'),
      },
      {
        id: 'clonar',
        labelKey: 'lab.admin.section.clone',
        icon: 'content_copy',
        value: this.translate.instant('lab.admin.value.from_other_group'),
      },
    ];
  });

  protected readonly dirty = computed(() => {
    if (this.mode() === 'create') {
      return this.members().size > 0 || this.name().trim().length > 0 || this.description().trim().length > 0;
    }
    const initial = this.initial;
    if (!initial) return false;
    return (
      this.name() !== initial.name ||
      this.description() !== initial.description ||
      this.members().size !== initial.members.length ||
      this.grants().size !== initial.grants.length
    );
  });

  /**
   * El único sitio donde se decide si el botón funciona, y devuelve el MOTIVO, no un
   * booleano: un botón apagado sin motivo es la mitad del fallo que estamos arreglando.
   */
  protected readonly saveBlockedReason = computed<string | null>(() => {
    this.lang();
    if (!this.name().trim()) return this.translate.instant('lab.admin.blocked.no_name');
    if (this.members().size === 0) return this.translate.instant('lab.admin.blocked.no_members');
    if (this.liveChannels() === 0) return this.translate.instant('lab.admin.blocked.no_channel');
    if (this.mode() === 'edit' && !this.dirty()) return null;
    return null;
  });

  protected readonly canSave = computed(
    () => !this.saveBlockedReason() && (this.mode() === 'create' || this.dirty()),
  );

  protected readonly deleteItems = computed<readonly DeletableEntity[]>(() => [
    { id: 1, name: this.name() },
  ]);

  /** B6 · lo que se pierde, nombrado. Nada de «no se puede deshacer» a secas. */
  protected readonly deleteDetail = computed(
    () =>
      'Se pierden ' +
      plural(this.members().size, 'vínculo de agente', 'vínculos de agente') +
      ' y la configuración de ' +
      plural(this.liveChannels(), 'canal', 'canales') +
      '. Las conversaciones ya cerradas se quedan; las que estén en curso pasan a la cola general.',
  );

  protected onMemberToggled(id: string): void {
    const next = new Set(this.members());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.members.set(next);
    if (!next.has(this.person())) this.person.set([...next][0] ?? '');
  }

  protected onMother(mother: PermissionMother, next: boolean): void {
    this.grants.set(toggleMother(this.grants(), mother, next, this.store.modoHoy()));
  }

  protected onChild(mother: PermissionMother, childId: string, next: boolean): void {
    this.grants.set(toggleChild(this.grants(), mother, childId, next));
  }

  protected effective(permId: string): boolean {
    return this.overrides().get(this.person() + ':' + permId) ?? MEMBER_DEFAULTS[permId] ?? false;
  }

  protected isException(permId: string): boolean {
    const override = this.overrides().get(this.person() + ':' + permId);
    return override !== undefined && override !== MEMBER_DEFAULTS[permId];
  }

  protected setOverride(permId: string, value: boolean): void {
    const next = new Map(this.overrides());
    if (value === (MEMBER_DEFAULTS[permId] ?? false)) next.delete(this.person() + ':' + permId);
    else next.set(this.person() + ':' + permId, value);
    this.overrides.set(next);
  }

  protected clearOverride(permId: string): void {
    const next = new Map(this.overrides());
    next.delete(this.person() + ':' + permId);
    this.overrides.set(next);
  }

  /** B19 · qué cambiaría al clonar, dicho ANTES de aplicarlo. */
  protected readonly cloneDiff = computed(() => {
    const source = this.cloneFrom();
    if (!source) return null;
    const target = new Set(this.store.group(source)?.grants ?? []);
    const current = this.grants();
    let added = 0;
    let removed = 0;
    for (const node of this.allNodes()) {
      for (const id of [node.id, ...(node.children ?? []).map((c) => c.id)]) {
        if (target.has(id) && !current.has(id)) added += 1;
        if (!target.has(id) && current.has(id)) removed += 1;
      }
    }
    return { added, removed, target };
  });

  protected applyClone(): void {
    const diff = this.cloneDiff();
    if (!diff) return;
    this.grants.set(diff.target);
    this.cloneFrom.set(null);
    this.activeSection.set('permisos');
  }

  protected save(): void {
    if (!this.canSave()) return;
    const overrides = Object.fromEntries(this.overrides());
    if (this.mode() === 'create') {
      const id = 'g-' + Date.now().toString(36);
      this.store.addGroup({
        id,
        code: 'GRP-' + String(this.store.groups().length + 1).padStart(3, '0'),
        name: this.name().trim(),
        description: this.description().trim(),
        members: [...this.members()],
        grants: [...this.grants()],
        overrides,
      });
    } else if (this.initial) {
      this.store.updateGroup(this.initial.id, {
        name: this.name().trim(),
        description: this.description().trim(),
        members: [...this.members()],
        grants: [...this.grants()],
        overrides,
      });
    }
    void this.router.navigate(['/lab/admin/grupos']);
  }

  protected discard(): void {
    this.name.set(this.initial?.name ?? '');
    this.description.set(this.initial?.description ?? '');
    this.members.set(new Set(this.initial?.members ?? []));
    this.grants.set(new Set(this.initial?.grants ?? allGrants()));
  }

  protected confirmDelete(): void {
    this.deleting.set(false);
    if (this.initial) this.store.removeGroup(this.initial.id);
    void this.router.navigate(['/lab/admin/grupos']);
  }
}

/** Lo que trae encendido un grupo nuevo: todos los canales, menos lo bloqueado. */
function allGrants(): Set<string> {
  const out = new Set<string>();
  for (const block of GROUP_PERMISSIONS) {
    for (const node of block.nodes) {
      if (node.lockedReason) continue;
      out.add(node.id);
      for (const child of node.children ?? []) out.add(child.id);
    }
  }
  return out;
}
