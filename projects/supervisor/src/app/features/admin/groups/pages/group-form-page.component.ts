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
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { DirtyAware } from '@core/guards';
import { CrossTabLockService } from '@core/services';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { IconComponent, IllustratedAvatarComponent } from '@shared/components';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import {
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
  ScInputTextComponent as InputTextComponent,
  ScInputNumberComponent as InputNumberComponent,
  ScDialogComponent as DialogComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { PrimeTemplate } from 'primeng/api';
import {
  CHANNEL_LABEL_KEYS,
  CHAT_STRATEGIES,
  GROUP_CHANNELS,
  GROUP_PRIORITIES,
  Group,
  GroupChannel,
  GroupPriority,
  PHONE_STRATEGIES,
  PRIORITY_LABEL_KEYS,
} from '../data/groups-data';
import { GroupsStore } from '../state/groups.store';

import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import { GroupAgentLink } from '@features/admin/services/group-agent-links.types';

import {
  AgentChannelTableAgent,
  AgentChannelTableComponent,
} from '../components/agent-channel-table/agent-channel-table.component';

interface FormState {
  name: string;
  phone: string;
  priority: GroupPriority;
  typification: boolean;
  channels: ReadonlySet<GroupChannel>;
  strategy: string;
  chatStrategy: string;
  capacityValue: number | null;
  links: readonly GroupAgentLink[];
}

@Component({
  selector: 'sc-group-form-page',
  imports: [
    AgentChannelTableComponent,
    ButtonComponent,
    DeleteEntityDialogComponent,
    FormSectionNavComponent,
    IconComponent,
    IllustratedAvatarComponent,
    InputTextComponent,
    InputNumberComponent,
    DialogComponent,
    PrimeTemplate,
    SectionCardComponent,
    SelectComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './group-form-page.component.html',
  styleUrl: './group-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupFormPageComponent implements DirtyAware, OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly groupsStore = inject(GroupsStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly crossTab = inject(CrossTabLockService);
  private readonly topBarSlot = inject(TopBarSlotService);

  /** Guardar/Cancelar proyectados a la TopBar (modelo "todo arriba" S59):
   * fuera la banda sticky-form-header; identidad → breadcrumb + campos del
   * cuerpo (avatar/nombre re-alojados en Identidad). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    afterNextRender(() => {
      const tpl = this.topbarActions();
      if (tpl) this.topBarSlot.setActions(tpl);
    });
  }

  protected readonly priorities = GROUP_PRIORITIES;
  /* Widening intencional a `Record<string, string>` para que el `let-p`
   * que llega desde `pTemplate` (tipo `any` por design de PrimeNG) pueda
   * indexar sin TS7053. Seguro: las keys vienen siempre de `priorities`
   * (GroupPriority union). Mismo patrón que agent-form-page. */
  protected readonly priorityKeys: Readonly<Record<string, string>> = PRIORITY_LABEL_KEYS;
  protected readonly channels = GROUP_CHANNELS;
  protected readonly channelKeys = CHANNEL_LABEL_KEYS;
  protected readonly phoneStrategies = PHONE_STRATEGIES;
  protected readonly chatStrategies = CHAT_STRATEGIES;

  /**
   * Section index for the form shell. In `edit` mode, Identity drops to
   * the end of the list — it's rarely touched once a group exists, so
   * the index leads with the sections the user actually iterates on.
   * Delete is *not* in the nav — it lives at the bottom of the Identity
   * tab (danger zone pattern, GitHub / Stripe).
   */
  protected readonly navSections = computed<readonly FormNavSection[]>(() => {
    const identity: FormNavSection = {
      id: 'group-section-identity',
      labelKey: 'groups.form.section.identity',
      icon: 'badge',
    };
    const channels: FormNavSection = {
      id: 'group-section-channels',
      labelKey: 'groups.form.section.channels',
      icon: 'chat_bubble',
    };
    const strategy: FormNavSection = {
      id: 'group-section-strategy',
      labelKey: 'groups.form.section.strategy',
      icon: 'account_tree',
    };
    const agents: FormNavSection = {
      id: 'group-section-agents',
      labelKey: 'groups.form.section.agents',
      icon: 'group',
    };
    // Orden por modo (S60). En CREAR, identidad primero — es lo primero que se
    // rellena. En EDITAR, identidad al fondo: apenas se toca tras crear, y la
    // ficha del panel ya da su contexto siempre visible.
    if (this.mode() === 'edit') {
      return [channels, strategy, agents, identity];
    }
    return [identity, channels, strategy, agents];
  });

  protected readonly activeSection = signal<string>('group-section-identity');

  protected readonly activeIcon = computed(() => {
    const id = this.activeSection();
    return this.navSections().find((s) => s.id === id)?.icon ?? null;
  });

  protected readonly phoneIcon = 'call';
  protected readonly trashIcon = 'delete';

  protected readonly editingId = signal<number | null>(null);
  /** Source name si llegó vía Duplicar (?seedFromId). NULL en create vacío. */
  protected readonly duplicatingFromName = signal<string | null>(null);
  protected readonly initial = signal<Group | null>(null);
  protected readonly form = signal<FormState>(this.emptyForm());
  protected readonly errors = signal<Readonly<Record<string, string>>>({});
  protected readonly saving = signal(false);
  protected readonly deleteVisible = signal(false);

  /** Channels the group owned when the form was loaded — used to detect
   *  cascade impact when the user removes a channel before saving. */
  private readonly initialChannels = signal<ReadonlySet<GroupChannel>>(new Set());
  /** Links as they stood when the form was loaded — used to count how
   *  many agents had a removed channel enabled. */
  private readonly initialLinks = signal<readonly GroupAgentLink[]>([]);
  protected readonly cascadeConfirm = signal<{
    readonly removed: readonly GroupChannel[];
    readonly affected: number;
  } | null>(null);

  /** Dirty-state por CAMBIO NETO (snapshot vs pristine): Guardar refleja si hay
   *  algo distinto que guardar (vuelve a off si deshaces). Patrón compartido
   *  (admin/AED/builder); `formDirty` queda de alias para el guard de salida. */
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;
  protected readonly conflictWarning = signal(false);
  private releaseLock: (() => void) | null = null;

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
   * Section ids con required vacíos. La bola roja en el nav señala las
   * sections con required vacíos. Solo required — no errores de formato.
   */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() => {
    const f = this.form();
    const errors = new Set<string>();
    // Identity: name required.
    if (!f.name.trim()) errors.add('group-section-identity');
    // Channels: al menos uno required.
    if (f.channels.size === 0) errors.add('group-section-channels');
    return errors;
  });

  protected readonly canSave = computed(() => {
    const f = this.form();
    if (f.name.trim().length === 0 || f.channels.size === 0) return false;
    // En EDITAR exige cambio neto; en crear/duplicar basta con que sea válido.
    if (this.mode() === 'edit' && !this.dirtyState.dirty()) return false;
    return true;
  });

  protected readonly hasChat = computed(() => this.form().channels.has('chat'));
  protected readonly hasFixedCapacity = computed(() => this.form().channels.has('phone'));

  /** Roster passed to the channel table — every agent in the system. */
  protected readonly availableAgents = computed<readonly AgentChannelTableAgent[]>(() =>
    this.agentsStore.agents().map((a) => ({
      id: a.id,
      name: a.name,
      photo: a.photo,
    })),
  );

  /** The form's group channels expressed as an array (for the table input). */
  protected readonly formGroupChannels = computed<readonly GroupChannel[]>(() =>
    GROUP_CHANNELS.filter((c) => this.form().channels.has(c)),
  );

  protected readonly deleteItems = computed(() => {
    const g = this.initial();
    return g ? [{ id: g.id, name: g.name }] : [];
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const group = this.groupsStore.getGroup(Number(idParam));
      if (!group) {
        void this.router.navigateByUrl('/admin/grupos', { replaceUrl: true });
        return;
      }
      this.editingId.set(group.id);
      this.initial.set(group);
      const seedLinks = this.linksStore.linksForGroup(group.id);
      this.form.set({
        name: group.name,
        phone: group.phone,
        priority: group.priority,
        typification: group.typification,
        channels: new Set(group.channels),
        strategy: group.strategy,
        chatStrategy: group.chatStrategy ?? CHAT_STRATEGIES[0]!,
        capacityValue: group.capacityValue ?? null,
        links: seedLinks,
      });
      this.initialChannels.set(new Set(group.channels));
      this.initialLinks.set(seedLinks);
      this.dirtyState.markPristine();
      // En edición aterriza en Canales (1ª del orden de edición): identidad va
      // al fondo porque casi no se toca tras crear; la ficha la resume (S60).
      this.activeSection.set('group-section-channels');
      this.releaseLock = this.crossTab.acquire('group', group.id, () =>
        this.conflictWarning.set(true),
      );
      return;
    }

    // Modo "Duplicar": detecta ?seedFromId y precarga el form desde el
    // source EXCEPTO los identificadores únicos (name + phone). El usuario
    // debe rellenar esos antes de guardar.
    const seedFromId = this.route.snapshot.queryParamMap.get('seedFromId');
    if (seedFromId) {
      const source = this.groupsStore.getGroup(Number(seedFromId));
      if (!source) {
        void this.router.navigateByUrl('/admin/grupos', { replaceUrl: true });
        return;
      }
      this.duplicatingFromName.set(source.name);
      const seedLinks = this.linksStore.linksForGroup(source.id);
      this.form.set({
        // Unique identifiers — vaciados.
        name: '',
        phone: '',
        // Resto del payload copiado.
        priority: source.priority,
        typification: source.typification,
        channels: new Set(source.channels),
        strategy: source.strategy,
        chatStrategy: source.chatStrategy ?? CHAT_STRATEGIES[0]!,
        capacityValue: source.capacityValue ?? null,
        links: seedLinks,
      });
      this.initialChannels.set(new Set(source.channels));
      this.initialLinks.set(seedLinks);
      // El duplicado nace "sucio" por construcción (datos sin guardar): el
      // snapshot ya difiere del pristine vacío → el guard de salida avisa solo.
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
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected onPhoneValueChange(value: string): void {
    this.updateField('phone', value);
  }

  /**
   * Adapter para `<sc-inputnumber>` (capacityValue). Emite `number | null`;
   * un null → campo vacío, mantenemos el null en el form para que serialize
   * lo traduzca a `undefined`. Filtra valores negativos (defensa por si el
   * usuario teclea un signo: el min="0" del input ya lo bloquea normalmente).
   */
  protected onCapacityValueChange(value: number | null): void {
    if (value === null) {
      this.updateField('capacityValue', null);
      return;
    }
    if (Number.isFinite(value) && value >= 0) this.updateField('capacityValue', value);
  }

  protected onPriorityValueChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('priority', value as GroupPriority);
  }

  protected onStrategyValueChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('strategy', value);
  }

  protected onChatStrategyValueChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('chatStrategy', value);
  }

  protected onTypificationChange(checked: boolean): void {
    this.updateField('typification', checked);
  }

  protected toggleChannel(channel: GroupChannel): void {
    this.form.update((f) => {
      const next = new Set(f.channels);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      // Clamp every link's channels to the new group offering.
      const allowed = next;
      const clampedLinks = f.links.map((l) => {
        const filtered = l.channels.filter((c) => allowed.has(c));
        return filtered.length === l.channels.length ? l : { ...l, channels: filtered };
      });
      return { ...f, channels: next, links: clampedLinks };
    });
  }

  protected hasChannel(channel: GroupChannel): boolean {
    return this.form().channels.has(channel);
  }

  protected onLinksChange(links: readonly GroupAgentLink[]): void {
    this.form.update((f) => ({ ...f, links }));
  }

  protected onNameRename(name: string): void {
    this.updateField('name', name);
  }

  protected save(): void {
    if (!this.canSave() || this.saving()) return;
    if (!this.validate()) return;

    // If the user removed any channel the group used to own, surface the
    // cascade impact before persisting. The dialog's "Continuar" handler
    // re-enters `save()` with `cascadeConfirm` already shown so this guard
    // only fires once per save.
    if (this.editingId() && !this.cascadeConfirm()) {
      const removed = [...this.initialChannels()].filter((c) => !this.form().channels.has(c));
      if (removed.length > 0) {
        const removedSet = new Set(removed);
        const affected = this.initialLinks().filter((l) =>
          l.channels.some((c) => removedSet.has(c)),
        ).length;
        if (affected > 0) {
          this.cascadeConfirm.set({ removed, affected });
          return;
        }
      }
    }

    this.saving.set(true);
    setTimeout(() => {
      const f = this.form();
      const payload = {
        name: f.name.trim(),
        phone: f.phone.trim(),
        priority: f.priority,
        typification: f.typification,
        channels: Array.from(f.channels),
        strategy: f.strategy,
        chatStrategy: f.channels.has('chat') ? f.chatStrategy : undefined,
        capacityValue:
          f.channels.has('phone') && f.capacityValue !== null ? f.capacityValue : undefined,
        capacityType:
          f.channels.has('phone') && f.capacityValue !== null ? ('fixed' as const) : undefined,
      };

      const editingId = this.editingId();
      if (editingId) {
        this.groupsStore.updateGroup(editingId, { ...payload });
        this.linksStore.replaceLinksForGroup(editingId, this.normalizeLinks(f.links, editingId));
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant('groups.toasts.updated', { name: payload.name }),
          life: TOAST_LIFE.success,
        });
      } else {
        const created = this.groupsStore.addGroup(payload);
        this.linksStore.replaceLinksForGroup(created.id, this.normalizeLinks(f.links, created.id));
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant('groups.toasts.created', { name: created.name }),
          life: TOAST_LIFE.success,
        });
      }
      this.saving.set(false);
      this.dirtyState.markPristine();
      void this.router.navigateByUrl('/admin/grupos');
    }, 400);
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/admin/grupos');
  }

  protected cancelCascade(): void {
    this.cascadeConfirm.set(null);
  }

  protected confirmCascade(): void {
    // Re-enter save() — the guard sees `cascadeConfirm` is set and skips the check.
    this.save();
    this.cascadeConfirm.set(null);
  }

  protected channelLabel(c: GroupChannel): string {
    return this.translate.instant(this.channelKeys[c]);
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
    const group = this.initial();
    this.groupsStore.deleteGroup(id);
    this.linksStore.removeGroup(id);
    this.deleteVisible.set(false);
    this.dirtyState.markPristine();
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('groups.toasts.deleted_single', {
        name: group?.name ?? '',
      }),
      life: TOAST_LIFE.success,
    });
    void this.router.navigateByUrl('/admin/grupos');
  }

  private emptyForm(): FormState {
    return {
      name: '',
      phone: '',
      priority: 'Baja',
      typification: false,
      channels: new Set<GroupChannel>(['phone']),
      strategy: PHONE_STRATEGIES[0]!,
      chatStrategy: CHAT_STRATEGIES[0]!,
      capacityValue: null,
      links: [],
    };
  }

  /** Ensure every link points to the right groupId before persistence. */
  private normalizeLinks(
    links: readonly GroupAgentLink[],
    groupId: number,
  ): readonly GroupAgentLink[] {
    return links.map((l) => (l.groupId === groupId ? l : { ...l, groupId }));
  }

  private validate(): boolean {
    const f = this.form();
    const next: Record<string, string> = {};
    if (!f.name.trim()) next['name'] = 'groups.errors.name_required';
    if (f.channels.size === 0) next['channels'] = 'groups.errors.channels_required';
    this.errors.set(next);
    return Object.keys(next).length === 0;
  }
}
