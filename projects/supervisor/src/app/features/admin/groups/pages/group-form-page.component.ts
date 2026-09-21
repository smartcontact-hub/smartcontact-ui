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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ScCheckboxComponent as CheckboxComponent } from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { CrossTabLockService } from '@core/services';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { injectLangChange } from '@core/utils/lang-change';
import { IllustratedAvatarComponent } from '@shared/components';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import {
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScDividerComponent as DividerComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
  ScInputTextComponent as InputTextComponent,
  ScMultiSelectComponent as MultiSelectComponent,
  ScInputNumberComponent as InputNumberComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScTextareaComponent as TextareaComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
  ScDialogComponent as DialogComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectComponent as SelectComponent,
  ScPhotoUploadComponent as PhotoUploadComponent,
  ScChipComponent as ChipComponent,
} from '@smartcontact-hub/components';
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
  RING_ALL_OPTIONS,
  SUB_STRATEGIES,
  DEFAULT_ADVANCED,
  DEFAULT_ANNOUNCEMENTS,
  GroupAdvanced,
  GroupAnnouncements,
  UNAVAILABLE_STRATEGIES,
  VOICE_OPTIONS,
} from '../data/groups-data';
import { GroupDefaultsStore } from '../state/group-defaults.store';
import { TipificacionesStore, TIPIFICACION_FIELDS } from '@features/admin/repositories/instances/tipificaciones';
import { AgendasStore } from '@features/admin/repositories/instances/agendas';
import { AGENDA_FIELDS } from '@features/admin/repositories/instances/agendas';
import { RepoFormPanelComponent, RepoFormSubmission } from '@features/admin/repositories/components/repo-form-panel.component';
import { TemplatesStore } from '@features/admin/templates/state/templates.store';
import type { TemplateType } from '@features/admin/templates/data/templates-data';
import { TemplateFormPanelComponent, TemplateFormSubmission } from '@features/admin/templates/components/template-form-panel/template-form-panel.component';
import { LabelsStore } from '@features/admin/labels/state/labels.store';
import { LabelFormPanelComponent, LabelFormSubmission } from '@features/admin/labels/components/label-form-panel/label-form-panel.component';
import { GroupsStore } from '../state/groups.store';

import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import { GroupAgentLink } from '@features/admin/services/group-agent-links.types';
import { NgTemplateOutlet } from '@angular/common';
import { ScDrawerComponent as DrawerComponent } from '@smartcontact-hub/components';
import { BoardCardComponent } from '@features/admin/comparar/board-card.component';
import { BoardRowComponent } from '@features/admin/comparar/board-row.component';
import { FichaVariantBarComponent } from '@features/admin/comparar/ficha-variant-bar.component';
import { FichaVariantService } from '@features/admin/comparar/ficha-variant.service';
import { createCardsEditor } from '@features/admin/comparar/cards-editor';
import { createSectionScrollSpy } from '@features/admin/comparar/section-scroll-spy';

import {
  AgentChannelTableAgent,
  AgentChannelTableComponent,
} from '../components/agent-channel-table/agent-channel-table.component';

interface FormState {
  name: string;
  photo: string | null;
  phone: string;
  priority: GroupPriority;
  typification: string | null;
  scheduleIds: ReadonlySet<number>;
  templateIds: ReadonlySet<number>;
  labelIds: ReadonlySet<number>;
  announcements: GroupAnnouncements;
  advanced: GroupAdvanced;
  channels: ReadonlySet<GroupChannel>;
  strategy: string;
  subStrategy: string;
  ringAllAgents: number;
  chatStrategy: string;
  links: readonly GroupAgentLink[];
}

@Component({
  selector: 'sc-group-form-page',
  imports: [
    RouterLink,
    BoardCardComponent,
    DrawerComponent,
    NgTemplateOutlet,
    BoardRowComponent,
    CheckboxComponent,
    AgentChannelTableComponent,
    ButtonComponent,
    DeleteEntityDialogComponent,
    DividerComponent,
    FichaVariantBarComponent,
    FormSectionNavComponent,
    IllustratedAvatarComponent,
    InputTextComponent,
    PhotoUploadComponent,
    MultiSelectComponent,
    InputNumberComponent,
    SelectButtonComponent,
    TextareaComponent,
    ToggleSwitchComponent,
    DialogComponent,
    RepoFormPanelComponent,
    TemplateFormPanelComponent,
    LabelFormPanelComponent,
    ChipComponent,
    SectionCardComponent,
    TooltipModule,
    SelectComponent,
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
  private readonly lang = injectLangChange();
  private readonly crossTab = inject(CrossTabLockService);
  private readonly tipificacionesStore = inject(TipificacionesStore);
  private readonly agendasStore = inject(AgendasStore);
  private readonly templatesStore = inject(TemplatesStore);
  private readonly labelsStore = inject(LabelsStore);
  private readonly defaultsStore = inject(GroupDefaultsStore);

  /** Guardar/Cancelar proyectados a la TopBar (modelo "todo arriba" S59):
   * fuera la banda sticky-form-header; identidad → breadcrumb + campos del
   * cuerpo (avatar/nombre re-alojados en Identidad). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly priorities = GROUP_PRIORITIES;
  /* Widening intencional a `Record<string, string>` para que el `let-p`
   * que llega desde el `<ng-template #item>` proyectado (`any` por diseño) pueda
   * indexar sin TS7053. Seguro: las keys vienen siempre de `priorities`
   * (GroupPriority union). Mismo patrón que agent-form-page. */
  protected readonly priorityKeys: Readonly<Record<string, string>> = PRIORITY_LABEL_KEYS;
  protected readonly channels = GROUP_CHANNELS;
  protected readonly channelKeys = CHANNEL_LABEL_KEYS;
  /** Skills se ve pero no se elige, con su motivo escrito en la opción (SISMAC-1975). */
  protected readonly phoneStrategyOptions = computed(() => {
    this.lang();
    return PHONE_STRATEGIES.map((s) => ({
      label: s,
      value: s,
      disabled: UNAVAILABLE_STRATEGIES.has(s),
      note: UNAVAILABLE_STRATEGIES.has(s) ? this.translate.instant('groups.form.fields.skills_unavailable') : null,
    }));
  });
  protected readonly chatStrategies = CHAT_STRATEGIES;
  protected readonly subStrategies = SUB_STRATEGIES;
  protected readonly ringAllOptions = RING_ALL_OPTIONS;
  protected readonly voiceOptions = VOICE_OPTIONS;

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
    // Canales, estrategia y agentes son UNA sección (Rafa, 2026-09-16): marcar un canal enseña su columna en
    // la tabla de agentes justo debajo, sin ir arriba y abajo. Conserva el id de canales, que lleva la bola de error.
    const channels: FormNavSection = {
      id: 'group-section-channels',
      labelKey: 'groups.form.section.channels_agents',
      icon: 'group',
    };
    // Orden por modo (S60). En CREAR, identidad primero — es lo primero que se
    // rellena. En EDITAR, identidad al fondo: apenas se toca tras crear, y la
    // ficha del panel ya da su contexto siempre visible.
    // COMPARAR: en una sola página (`b`) el índice sigue el orden de la página.
    // Lo que se le asigna desde Repositorios, como «Recursos» en la ficha de agente.
    const resources: FormNavSection = {
      id: 'group-section-resources',
      labelKey: 'groups.form.section.resources',
      icon: 'library_books',
    };
    // Solo con teléfono: todo lo que suena en la llamada (manual de Voice, p. 13-14).
    const announcements: FormNavSection = {
      id: 'group-section-announcements',
      labelKey: 'groups.form.section.announcements',
      icon: 'volume_up',
    };
    const advanced: FormNavSection = {
      id: 'group-section-advanced',
      labelKey: 'groups.form.section.advanced',
      icon: 'tune',
    };
    const middle = this.hasPhone() ? [resources, announcements, advanced] : [resources, advanced];
    /* Al crear, Identidad primero (sin nombre no hay grupo); al editar, al fondo: casi no se toca después (Rafa,
     * 2026-09-16, también en «Una página»).
     *
     * En la DENSA (`u`) va primero SIEMPRE: una página que se lee de arriba abajo de una pasada
     * no es un índice al que se vuelve, y empezar por una tabla de doce nombres deja el grupo sin
     * presentar. Medido el 2026-09-21 en «Una página»: lo primero de la pantalla era la lista de
     * agentes y el nombre del grupo caía a 2.626px de scroll. */
    if (this.mode() === 'edit' && !this.isDense()) {
      return [channels, ...middle, identity];
    }
    return [identity, channels, ...middle];
  });

  protected readonly activeSection = signal<string>('group-section-identity');

  /* ── COMPARAR (rama `comparar/fichas`) ──────────────────────────────────────────────── */
  protected readonly variants = inject(FichaVariantService);

  /** Las dos formas que enseñan la ficha entera de una vez: «Una página» (`b`) y la densa (`u`). */
  protected readonly isOnePage = computed(() => {
    const v = this.variants.variant();
    return v === 'b' || v === 'u';
  });

  /**
   * `u` — «Una página densa». La misma página, con tres cosas medidas el 2026-09-21 sobre `b`:
   *
   *   · Identidad primero (ver `navSections`).
   *   · La tabla de agentes con tope de alto y scroll propio. Con 12 agentes ocupaba 723px, y
   *     crece con la plantilla: sin tope, un grupo de 40 agentes empuja el resto de la ficha
   *     fuera de la pantalla y la página deja de ser una página.
   *   · «Anuncios y audio» y «Avanzado» plegadas de entrada. Las dos nacen con los valores por
   *     defecto de Configuración del AED › Grupos, así que en un alta normal no se tocan: 1.391px
   *     de los 2.888 totales estaban ahí, medidos, para lo que casi nunca se cambia.
   *
   * Lo que NO se toca: el ancho. Los 920px salen del `Block` 393:12587 de Contact Center y son
   * la razón por la que esta ficha rima con él. Ensanchar la columna resolvía el alto rompiendo
   * justo lo que hay que conservar.
   */
  protected readonly isDense = computed(() => this.variants.variant() === 'u');

  /** Plegadas de entrada en la densa: lo que nace configurado y casi nadie cambia. */
  protected isCollapsedByDefault(id: string): boolean {
    return this.isDense() && (id === 'group-section-announcements' || id === 'group-section-advanced');
  }

  private readonly scrollSpy = createSectionScrollSpy({
    enabled: () => this.isOnePage(),
    ids: () => this.navSections().map((s) => s.id),
    active: this.activeSection,
  });

  protected iconOf(id: string): string | null {
    return this.navSections().find((s) => s.id === id)?.icon ?? null;
  }

  /** En `b` y `u` se ven todas; en `a` y `e`, la del índice. */
  protected showSection(id: string): boolean {
    return this.isOnePage() || this.activeSection() === id;
  }

  protected goToSection(id: string): void {
    this.scrollSpy.jump(id);
  }

  /* ── Variante `e` («Resumen + panel lateral»): las tarjetas-resumen a todo el ancho, y la
   *   sección en un panel lateral. El resumen solo LEE el estado actual del formulario. ── */
  protected readonly isCards = computed(() => this.variants.variant() === 'e');
  protected readonly cards = createCardsEditor({ enabled: () => this.isCards(), active: this.activeSection });
  /** El título del panel: el nombre de la sección que se edita. */
  protected readonly activeLabelKey = computed(
    () => this.navSections().find((s) => s.id === this.activeSection())?.labelKey ?? '',
  );

  protected yesNo(value: boolean): string {
    return value ? 'common.yes' : 'common.no';
  }

  protected orNone(value: string | number | null | undefined): string {
    return value === null || value === undefined || value === '' ? this.translate.instant('compare.board.none') : String(value);
  }

  protected channelsSummary(channels: Iterable<GroupChannel>): string {
    const labels = [...channels].map((c) => this.channelLabel(c));
    return labels.length > 0 ? labels.join(', ') : this.translate.instant('compare.board.no_channels');
  }

  protected agentName(agentId: number): string {
    return this.agentsStore.getAgent(agentId)?.name ?? `#${agentId}`;
  }

  /** Lo que ese agente hace en el grupo: en pausa, o los canales que atiende. */
  protected linkSummary(link: GroupAgentLink): string {
    return link.active ? this.channelsSummary(link.channels) : this.translate.instant('compare.board.paused');
  }



  protected readonly phoneIcon = 'call';
  protected readonly trashIcon = 'delete';
  protected readonly infoIcon = 'info';

  protected readonly editingId = signal<number | null>(null);
  /** Source name si llegó vía Duplicar (?seedFromId). NULL en create vacío. */
  protected readonly duplicatingFromName = signal<string | null>(null);
  protected readonly initial = signal<Group | null>(null);
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
   *
   * Este formulario NO tiene ningún computed de error de campo, y es correcto:
   * las dos reglas que había (nombre, y al menos un canal) son "obligatorio",
   * no contenido equivocado. No hay nada que señalar en rojo — un nombre vacío
   * o cero canales no están MAL escritos, están sin rellenar, y eso lo dice el
   * motivo del botón. El día que un campo gane una regla de formato (p.ej. el
   * teléfono), ese campo sí llevará su computed aquí.
   */

  /** Por qué NO se puede guardar, en palabras. Alimenta el `title` y el
   *  `aria-describedby` del botón: un control deshabilitado sin motivo obliga
   *  al usuario a adivinar cuál de los campos le falta. El orden replica el de
   *  `canSave()` — se nombra el primer requisito que falla. */
  protected readonly saveDisabledReason = computed<string | null>(() => {
    if (this.canSave()) return null;
    const f = this.form();
    if (f.name.trim().length === 0) return 'groups.errors.name_required';
    if (f.channels.size === 0) return 'groups.errors.channels_required';
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
  protected readonly hasPhone = computed(() => this.form().channels.has('phone'));
  protected readonly isNiveles = computed(() => this.hasPhone() && this.form().strategy === 'Niveles');
  protected readonly isRingAll = computed(() => this.hasPhone() && this.form().strategy === 'Ring All');
  protected readonly isExclusive = computed(() => this.hasPhone() && this.form().strategy === 'Agente exclusivo');

  /** Los números que ya usan los grupos; también se puede escribir uno nuevo (Voice lo deja libre). */
  protected readonly phoneOptions = computed<readonly string[]>(() => {
    const phones = new Set(this.groupsStore.groups().map((g) => g.phone).filter(Boolean));
    if (this.form().phone) phones.add(this.form().phone);
    return [...phones].sort();
  });

  /** Una tipificación por grupo: cada categoría del repositorio es un conjunto (el agente elige dentro al cerrar). */
  protected readonly typificationOptions = computed(() => {
    this.lang();
    const counts = new Map<string, number>();
    for (const t of this.tipificacionesStore.items()) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    return [
      { label: this.translate.instant('groups.form.fields.typification_none'), value: null },
      ...[...counts].sort(([a], [b]) => a.localeCompare(b, 'es')).map(([category, count]) => ({
        label: this.translate.instant('groups.form.fields.typification_option', { name: category, count }),
        value: category,
      })),
    ];
  });

  protected typificationName(): string {
    return this.form().typification ?? this.translate.instant('groups.form.fields.typification_none');
  }

  protected readonly scheduleOptions = computed(() => this.agendasStore.items().map((a) => ({ label: a.name, value: a.id })));
  protected readonly scheduleValue = computed(() => [...this.form().scheduleIds]);
  protected readonly labelOptions = computed(() => this.labelsStore.labels().map((l) => ({ label: l.name, value: l.id })));
  protected readonly labelValue = computed(() => [...this.form().labelIds]);
  private templatesOf(type: TemplateType) {
    return this.templatesStore.templates().filter((t) => t.type === type);
  }
  protected readonly chatTemplateOptions = computed(() => this.templatesOf('chat').map((t) => ({ label: t.title, value: t.id })));
  protected readonly emailTemplateOptions = computed(() => this.templatesOf('email').map((t) => ({ label: t.title, value: t.id })));
  protected readonly chatTemplateValue = computed(() => this.templatesOf('chat').filter((t) => this.form().templateIds.has(t.id)).map((t) => t.id));
  protected readonly emailTemplateValue = computed(() => this.templatesOf('email').filter((t) => this.form().templateIds.has(t.id)).map((t) => t.id));
  protected readonly hasEmail = computed(() => this.form().channels.has('email'));

  protected namesOf(options: readonly { label: string; value: number }[], ids: readonly number[]): string {
    const names = options.filter((o) => ids.includes(o.value)).map((o) => o.label);
    return names.length > 0 ? names.join(', ') : this.translate.instant('compare.board.none');
  }

  /** El código que se pega en la web para el chat de este grupo (manual de Voice, «Script de chat»). */
  protected readonly chatScript = computed(
    () => `<script src="https://chat.smart-contact.com/widget.js" data-group="${this.editingId() ?? 'nuevo'}" async></script>`,
  );

  protected readonly queueSizeOptions = computed(() => {
    this.lang();
    return [
    { label: this.translate.instant('groups.form.advanced.queue_fixed'), value: 'fixed' },
    { label: this.translate.instant('groups.form.advanced.queue_per_agent'), value: 'per_agent' },
    ];
  });
  protected readonly cardOpeningOptions = computed(() => {
    this.lang();
    return [
    { label: this.translate.instant('groups.form.advanced.card_embedded'), value: 'embedded' },
    { label: this.translate.instant('groups.form.advanced.card_new_window'), value: 'new_window' },
    ];
  });
  protected readonly audioSourceOptions = computed(() => {
    this.lang();
    return [
    { label: this.translate.instant('groups.form.announcements.source_none'), value: 'none' },
    { label: this.translate.instant('groups.form.announcements.source_tts'), value: 'tts' },
    { label: this.translate.instant('groups.form.announcements.source_file'), value: 'file' },
    ];
  });

  /** La estrategia de teléfono con lo que la completa, para el resumen. */
  protected phoneStrategySummary(): string {
    const f = this.form();
    if (this.isRingAll()) return `${f.strategy} · ${this.translate.instant('groups.form.fields.ring_all_summary', { count: f.ringAllAgents })}`;
    if (this.isNiveles()) return `${f.strategy} · ${f.subStrategy}`;
    return f.strategy;
  }

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
        photo: group.photo ?? null,
        phone: group.phone,
        priority: group.priority,
        typification: group.typification ?? null,
        scheduleIds: new Set(group.schedules ?? []),
        templateIds: new Set(group.templates ?? []),
        labelIds: new Set(group.labels ?? []),
        announcements: { ...DEFAULT_ANNOUNCEMENTS, ...group.announcements },
        advanced: { ...DEFAULT_ADVANCED, ...group.advanced },
        channels: new Set(group.channels),
        strategy: group.strategy,
        subStrategy: group.subStrategy ?? SUB_STRATEGIES[0]!,
        ringAllAgents: group.ringAllAgents ?? RING_ALL_OPTIONS[0]!,
        chatStrategy: group.chatStrategy ?? CHAT_STRATEGIES[0]!,
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
        photo: source.photo ?? null,
        phone: '',
        // Resto del payload copiado.
        priority: source.priority,
        typification: source.typification ?? null,
        scheduleIds: new Set(source.schedules ?? []),
        templateIds: new Set(source.templates ?? []),
        labelIds: new Set(source.labels ?? []),
        announcements: { ...DEFAULT_ANNOUNCEMENTS, ...source.announcements },
        advanced: { ...DEFAULT_ADVANCED, ...source.advanced },
        channels: new Set(source.channels),
        strategy: source.strategy,
        subStrategy: source.subStrategy ?? SUB_STRATEGIES[0]!,
        ringAllAgents: source.ringAllAgents ?? RING_ALL_OPTIONS[0]!,
        chatStrategy: source.chatStrategy ?? CHAT_STRATEGIES[0]!,
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

  protected onPhoneValueChange(value: unknown): void {
    this.updateField('phone', typeof value === 'string' ? value : '');
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

  protected onTypificationChange(value: unknown): void {
    this.updateField('typification', typeof value === 'string' ? value : null);
  }

  /** Crear una tipificación SIN salir de la ficha (Rafa, 2026-09-18: «me he salido del flujo solo para crear
   *  una»). Mismo formulario que Repositorios (`TIPIFICACION_FIELDS`), en un diálogo. Al guardar, el grupo
   *  queda con la categoría recién creada. */
  protected readonly creatingTipificacion = signal(false);
  protected readonly tipificacionFields = TIPIFICACION_FIELDS;
  protected readonly tipificacionExistingNames = computed(() => this.tipificacionesStore.items().map((t) => t.name));

  protected onCreateTipificacionSubmit(submission: RepoFormSubmission): void {
    const created = this.tipificacionesStore.addItem({
      name: submission['name'] ?? '',
      code: submission['code'] ?? '',
      category: submission['category'] ?? '',
      description: submission['description'] ?? '',
    });
    this.onTypificationChange(created.category);
    this.creatingTipificacion.set(false);
  }

  /** Mismo alivio que Tipificación (arriba), para los otros tres campos multiselección que solo tenían
   *  «Gestionar en Repositorios»: Agendas, Plantillas (chat y email) y Etiquetas. Al guardar, el recién
   *  creado se AÑADE a lo ya elegido, no lo sustituye. */
  protected readonly creatingAgenda = signal(false);
  protected readonly agendaFields = AGENDA_FIELDS;
  protected readonly agendaExistingNames = computed(() => this.agendasStore.items().map((a) => a.name));

  protected onCreateAgendaSubmit(submission: RepoFormSubmission): void {
    const created = this.agendasStore.addItem({
      name: submission['name'] ?? '',
      numbers: submission['numbers'] ?? '',
      description: submission['description'] ?? '',
      status: submission['status'] || 'active',
    });
    this.onIdsChange('scheduleIds', [...this.form().scheduleIds, created.id]);
    this.creatingAgenda.set(false);
  }

  protected readonly creatingChatTemplate = signal(false);
  protected readonly creatingEmailTemplate = signal(false);
  protected readonly templateExistingTitles = computed(() => this.templatesStore.templates().map((t) => t.title));

  protected onCreateTemplateSubmit(type: TemplateType, submission: TemplateFormSubmission): void {
    const created = this.templatesStore.addTemplate(submission);
    this.form.update((f) => ({ ...f, templateIds: new Set([...f.templateIds, created.id]) }));
    if (type === 'chat') this.creatingChatTemplate.set(false);
    else this.creatingEmailTemplate.set(false);
  }

  protected readonly creatingLabel = signal(false);
  protected readonly labelExistingNames = computed(() => this.labelsStore.labels().map((l) => l.name));

  protected onCreateLabelSubmit(submission: LabelFormSubmission): void {
    const created = this.labelsStore.addLabel(submission);
    this.onIdsChange('labelIds', [...this.form().labelIds, created.id]);
    this.creatingLabel.set(false);
  }

  protected onIdsChange(key: 'scheduleIds' | 'labelIds', value: unknown): void {
    if (Array.isArray(value)) this.updateField(key, new Set(value as number[]));
  }

  /** Sustituye las plantillas de UN tipo sin tocar las del otro. */
  protected onTemplatesChange(type: TemplateType, value: unknown): void {
    if (!Array.isArray(value)) return;
    const ofType = new Set(this.templatesOf(type).map((t) => t.id));
    this.form.update((f) => ({
      ...f,
      templateIds: new Set([...[...f.templateIds].filter((id) => !ofType.has(id)), ...(value as number[])]),
    }));
  }

  protected setAnnouncement<K extends keyof GroupAnnouncements>(key: K, value: GroupAnnouncements[K]): void {
    this.form.update((f) => ({ ...f, announcements: { ...f.announcements, [key]: value } }));
  }

  protected setAdvanced<K extends keyof GroupAdvanced>(key: K, value: GroupAdvanced[K]): void {
    this.form.update((f) => ({ ...f, advanced: { ...f.advanced, [key]: value } }));
  }

  /** Números: un campo vaciado no se guarda como 0, se queda en su valor anterior. */
  protected setAdvancedNumber(key: 'queueSize' | 'transferSec' | 'maxQueueWaitSec' | 'wrapUpSec' | 'serviceLevelSec' | 'cardHeight', value: number | null): void {
    if (value !== null && Number.isFinite(value) && value >= 0) this.setAdvanced(key, value);
  }

  /** «Dominios permitidos» del script de chat (Rafa, 2026-09-20): en qué webs se puede insertar sin que
   *  cualquiera lo copie. Texto libre en un campo + Enter/botón lo añade a la lista; sin duplicados. */
  protected readonly domainInput = signal('');

  protected addDomain(): void {
    const value = this.domainInput().trim().toLowerCase();
    if (!value) return;
    const current = this.form().advanced.allowedDomains;
    if (!current.includes(value)) this.setAdvanced('allowedDomains', [...current, value]);
    this.domainInput.set('');
  }

  protected removeDomain(domain: string): void {
    this.setAdvanced('allowedDomains', this.form().advanced.allowedDomains.filter((d) => d !== domain));
  }

  protected setAnnouncementNumber(key: 'avgWaitSec', value: number | null): void {
    if (value !== null && Number.isFinite(value) && value >= 0) this.setAnnouncement(key, value);
  }

  /** El .wav elegido: de momento solo se guarda su nombre (demo). */
  protected onPhotoChange(photo: string | null): void {
    this.form.update((f) => ({ ...f, photo }));
  }

  protected onAudioFile(key: 'holdMusicFile' | 'queueIdFile' | 'nextInLineFile' | 'outboundAudioFile', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setAnnouncement(key, file.name);
    input.value = '';
  }

  /** Más de un anuncio periódico, cada uno con su frecuencia (postventa, 2026-09-18). Añadir un .wav aquí
   *  crea una fila nueva; no reemplaza las que ya había. */
  protected onPeriodicFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.form.update((f) => ({
        ...f,
        announcements: {
          ...f.announcements,
          periodicAnnouncements: [...f.announcements.periodicAnnouncements, { file: file.name, everySec: 30 }],
        },
      }));
    }
    input.value = '';
  }

  protected removePeriodicAnnouncement(index: number): void {
    this.form.update((f) => ({
      ...f,
      announcements: {
        ...f.announcements,
        periodicAnnouncements: f.announcements.periodicAnnouncements.filter((_, i) => i !== index),
      },
    }));
  }

  protected setPeriodicFrequency(index: number, value: number | null): void {
    if (value === null || !Number.isFinite(value) || value < 5) return;
    this.form.update((f) => ({
      ...f,
      announcements: {
        ...f.announcements,
        periodicAnnouncements: f.announcements.periodicAnnouncements.map((a, i) =>
          i === index ? { ...a, everySec: value } : a,
        ),
      },
    }));
  }

  protected copyChatScript(): void {
    void navigator.clipboard?.writeText(this.chatScript());
    this.messages.add({ severity: 'success', summary: this.translate.instant('groups.form.advanced.script_copied'), life: TOAST_LIFE.success });
  }

  protected onSubStrategyChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('subStrategy', value);
  }

  protected onRingAllChange(value: unknown): void {
    if (typeof value === 'number') this.updateField('ringAllAgents', value);
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
        photo: f.photo ?? undefined,
        phone: f.phone.trim(),
        priority: f.priority,
        typification: f.typification ?? undefined,
        schedules: [...f.scheduleIds],
        templates: [...f.templateIds],
        labels: [...f.labelIds],
        announcements: f.announcements,
        advanced: f.advanced,
        channels: Array.from(f.channels),
        strategy: f.strategy,
        subStrategy: this.isNiveles() ? f.subStrategy : undefined,
        ringAllAgents: this.isRingAll() ? f.ringAllAgents : undefined,
        chatStrategy: f.channels.has('chat') ? f.chatStrategy : undefined,
      };

      /* Como Contact Center y la ficha de agente (Rafa, 2026-09-16): guardar se queda en la ficha, con su aviso.
       * Un alta pasa a ser la edición de lo recién creado, sin recargar. */
      const editingId = this.editingId();
      let createdId: number | null = null;
      if (editingId) {
        this.groupsStore.updateGroup(editingId, { ...payload });
        this.linksStore.replaceLinksForGroup(editingId, this.normalizeLinks(f.links, editingId));
        const refreshed = this.groupsStore.getGroup(editingId);
        if (refreshed) this.initial.set(refreshed);
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant('groups.toasts.updated', { name: payload.name }),
          life: TOAST_LIFE.success,
        });
      } else {
        const created = this.groupsStore.addGroup(payload);
        createdId = created.id;
        this.linksStore.replaceLinksForGroup(created.id, this.normalizeLinks(f.links, created.id));
        this.editingId.set(created.id);
        this.initial.set(created);
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant('groups.toasts.created', { name: created.name }),
          life: TOAST_LIFE.success,
        });
      }
      // Lo guardado pasa a ser la referencia para avisar si luego se quita un canal con agentes.
      this.initialChannels.set(new Set(f.channels));
      this.initialLinks.set(this.linksStore.linksForGroup(this.editingId()!));
      this.saving.set(false);
      this.dirtyState.markPristine();
      /* Un alta abre la edición de lo recién creado: navegar (y no solo cambiar la dirección) pone al día la miga
       * y el candado entre pestañas. */
      if (createdId !== null) void this.router.navigateByUrl(`/admin/grupos/editar/${createdId}`, { replaceUrl: true });
    }, 400);
  }

  /** Vuelve al último estado guardado (o al formulario vacío, en un alta). Es el
   *  «Deshacer» de Contact Center: vuelve atrás, no navega. */
  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
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

  /** Un grupo nuevo nace con lo guardado en Configuración del AED > Grupos. */
  private emptyForm(): FormState {
    const defaults = this.defaultsStore.defaults();
    return {
      name: '',
      photo: null,
      phone: '',
      priority: defaults.priority,
      typification: null,
      scheduleIds: new Set<number>(),
      templateIds: new Set<number>(),
      labelIds: new Set<number>(),
      announcements: { ...DEFAULT_ANNOUNCEMENTS, voice: defaults.voice },
      advanced: { ...defaults.advanced },
      channels: new Set<GroupChannel>(['phone']),
      strategy: defaults.strategy,
      subStrategy: SUB_STRATEGIES[0]!,
      ringAllAgents: RING_ALL_OPTIONS[0]!,
      chatStrategy: CHAT_STRATEGIES[0]!,
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
}
