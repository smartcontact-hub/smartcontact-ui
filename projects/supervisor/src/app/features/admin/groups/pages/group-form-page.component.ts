import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  Injector,
  input,
  OnDestroy,
  OnInit,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink, type UrlTree } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ScCheckboxComponent as CheckboxComponent } from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { CrossTabLockService, SectionLinksService } from '@core/services';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { injectLangChange } from '@core/utils/lang-change';
import { ChannelIconComponent, NameInplaceComponent } from '@shared/components';
import { changedKeys, createFormDirtyState } from '@shared/utils/form-dirty-state';
import {
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScDividerComponent as DividerComponent,
  type FormNavSection,
  ScInputTextComponent as InputTextComponent,
  ScMultiSelectComponent as MultiSelectComponent,
  ScInputNumberComponent as InputNumberComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScTextareaComponent as TextareaComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
  ScDialogComponent as DialogComponent,
  ScSelectComponent as SelectComponent,
  ScChipComponent as ChipComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  ScMessageComponent as MessageComponent,
  ScSectionCardComponent as SectionCardComponent,
  triStateOf,
} from '@smartcontact-hub/components';
import {
  CHANNEL_LABEL_KEYS,
  CHAT_STRATEGIES,
  GROUP_CHANNELS,
  Group,
  GroupChannel,
  GroupPriority,
  PHONE_STRATEGIES,
  PRIORITY_LABEL_KEYS,
  RING_ALL_OPTIONS,
  SUB_STRATEGIES,
  DEFAULT_ANNOUNCEMENTS,
  GroupAdvanced,
  GroupAnnouncements,
  UNAVAILABLE_STRATEGIES,
  VOICE_OPTIONS,
  type ChannelQueue,
  type ChatQueueMessages,
  type ChatSettings,
  type ChatSubchannel,
  DEFAULT_CHAT_SETTINGS,
  DEFAULT_CHAT_STRATEGY,
  resolveGroup,
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
import type { GroupAgentLink } from '@features/admin/services/group-agent-links.types';
import {
  channelRemovalImpact,
  clampLinksToChannels,
  hasChatFamily,
  toggleChatFamily,
  toggleGroupChannel,
} from '@features/admin/services/group-channels.core.mjs';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';

import {
  AgentChannelTableAgent,
  AgentChannelTableComponent,
} from '../components/agent-channel-table/agent-channel-table.component';
import { GroupIdentityFieldsComponent } from '../components/group-identity-fields/group-identity-fields.component';
import {
  GroupSummaryComponent,
  type GroupSummaryOutbound,
  type GroupSummaryRouting,
} from '../components/group-summary/group-summary.component';

interface FormState {
  name: string;
  phone: string;
  priority: GroupPriority;
  typification: string | null;
  scheduleIds: ReadonlySet<number>;
  templateIds: ReadonlySet<number>;
  labelIds: ReadonlySet<number>;
  announcements: GroupAnnouncements;
  advanced: GroupAdvanced;
  /** La cola y los tiempos de cada canal (visión de producto de grupos, 2026-09-25). */
  phoneQueue: ChannelQueue;
  chatQueue: ChannelQueue;
  chat: ChatSettings;
  channels: ReadonlySet<GroupChannel>;
  strategy: string;
  subStrategy: string;
  ringAllAgents: number;
  chatStrategy: string;
  links: readonly GroupAgentLink[];
}

/**
 * De qué sección es cada campo, para marcar en el índice las que tienen cambios sin guardar (DD-122).
 * `advanced` se reparte: la ficha de cliente está en Recursos y lo demás (cola, tiempos, desborde, el
 * número de WhatsApp) en Distribución y colas.
 */
const SECTION_OF_FIELD: Readonly<Record<keyof FormState, string>> = {
  name: 'group-section-general',
  priority: 'group-section-general',
  channels: 'group-section-general',
  phone: 'group-section-distribution',
  strategy: 'group-section-distribution',
  subStrategy: 'group-section-distribution',
  ringAllAgents: 'group-section-distribution',
  chatStrategy: 'group-section-distribution',
  phoneQueue: 'group-section-distribution',
  chatQueue: 'group-section-distribution',
  chat: 'group-section-distribution',
  announcements: 'group-section-distribution',
  advanced: 'group-section-distribution',
  typification: 'group-section-resources',
  scheduleIds: 'group-section-resources',
  templateIds: 'group-section-resources',
  labelIds: 'group-section-resources',
  links: 'group-section-agents',
};
const CLIENT_CARD_KEYS: ReadonlySet<string> = new Set(['cardOpening', 'cardUrl', 'cardHeight']);

@Component({
  selector: 'sc-group-form-page',
  imports: [
    RouterLink,
    NgTemplateOutlet,
    ChannelIconComponent,
    NameInplaceComponent,
    CheckboxComponent,
    AgentChannelTableComponent,
    GroupIdentityFieldsComponent,
    GroupSummaryComponent,
    FormSectionNavComponent,
    SectionCardComponent,
    MessageComponent,
    ButtonComponent,
    DeleteEntityDialogComponent,
    DividerComponent,
    InputTextComponent,
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
    TooltipModule,
    SelectComponent,
    TranslateModule,
  ],
  templateUrl: './group-form-page.component.html',
  styleUrl: './group-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupFormPageComponent implements DirtyAware, OnInit, OnDestroy {
  private readonly injector = inject(Injector);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly groupsStore = inject(GroupsStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly crossTab = inject(CrossTabLockService);
  private readonly sectionLinks = inject(SectionLinksService);
  private readonly tipificacionesStore = inject(TipificacionesStore);
  private readonly agendasStore = inject(AgendasStore);
  private readonly templatesStore = inject(TemplatesStore);
  private readonly labelsStore = inject(LabelsStore);
  private readonly defaultsStore = inject(GroupDefaultsStore);

  /** Guardar y Deshacer proyectados a la TopBar (modelo "todo arriba" S59). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  /* Widening intencional a `Record<string, string>` para que el `let-p`
   * que llega desde el `<ng-template #item>` proyectado (`any` por diseño) pueda
   * indexar sin TS7053. Seguro: las keys vienen siempre de `GROUP_PRIORITIES`
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
   * LA FORMA DE ESTA FICHA — índice lateral con las cuatro secciones de la visión de producto de
   * grupos (2026-09-25, DD-121), en el orden de sus dependencias: General define los canales, cada
   * canal se configura en Distribución y colas, los recursos dependen de los canales y los agentes
   * se asignan por canal. Una sección a la vista, como Contact Center.
   *
   * Hasta el 2026-09-26 fue «una página + pestañas» (decisión de producto del 2026-09-22 entre cinco
   * formas construidas en `comparar/fichas`, con Meridian y SnowUI de referencia). La visión pide
   * menú lateral y quitar las pestañas, y reparte lo que había en Identidad, Anuncios y Avanzado:
   * el teléfono saliente, la voz y la música pasan al bloque de Teléfono; la cola, a cada canal; la
   * ficha de cliente, a Recursos. Agente y usuario siguen con pestañas: la divergencia es a
   * propósito y está escrita en DD-121.
   */
  protected readonly navSections = computed<readonly FormNavSection[]>(() =>
    [
      { id: 'group-section-general', labelKey: 'groups.form.section.general', icon: 'tune' },
      { id: 'group-section-distribution', labelKey: 'groups.form.section.distribution', icon: 'alt_route' },
      // Lo que se le asigna desde Repositorios, como «Recursos» en la ficha de agente.
      { id: 'group-section-resources', labelKey: 'groups.form.section.resources', icon: 'library_books' },
      { id: 'group-section-agents', labelKey: 'groups.form.section.agents', icon: 'group' },
    ].map((s) => ({ ...s, href: this.sectionLinks.href(this.sectionUrl(s.id)) })),
  );

  /**
   * `?seccion=` de la dirección, que el router pasa a este input (`withComponentInputBinding`) en cada
   * navegación, también cuando solo cambia la query: cada fila del índice es un ENLACE (DD-122), y
   * Atrás o un enlace compartido llevan a su sección.
   */
  readonly seccion = input<string | undefined>();

  /**
   * La sección a la vista, la de la dirección. Sin `?seccion=`, General: abre en General en los dos
   * modos, es la que decide lo demás. En el ALTA General es la puerta: sin nombre ni canales se queda
   * en General aunque la dirección pida otra (el enlace de otra pestaña, o un `crear?seccion=` escrito).
   */
  protected readonly activeSection = computed<string>(() => {
    const id = GroupFormPageComponent.SECTION_SLUGS[this.seccion() ?? ''] ?? 'group-section-general';
    // Mientras se crea no: en cuanto el grupo existe, su nombre ya está cogido (por él mismo) y la ficha
    // pintaría General un instante antes de irse a la edición.
    if (this.mode() === 'create' && !this.saving() && id !== 'group-section-general' && !this.generalValid()) {
      return 'group-section-general';
    }
    return id;
  });

  /** Se pinta la sección elegida en el índice, y solo esa. */
  protected showSection(id: string): boolean {
    return id === this.activeSection();
  }

  /** Alta o edición: la MISMA ficha (DD-121). El alta no tiene id hasta que se crea. */
  protected readonly mode = computed<'create' | 'edit'>(() => (this.editingId() === null ? 'create' : 'edit'));

  /** General completa: nombre, que no se repita, y al menos un canal (con Chat, al menos uno de sus dos). */
  protected readonly generalValid = computed(() => {
    const f = this.form();
    return f.name.trim().length > 0 && !this.nameTaken() && f.channels.size > 0;
  });

  /**
   * Se ha intentado salir de General (o crear) sin completarla: desde entonces lo que falta se dice en su
   * campo. Antes, no: un campo vacío en un alta recién abierta todavía no es un error (R6, ver abajo).
   */
  protected readonly attemptedGeneral = signal(false);

  /**
   * Las secciones con algo obligatorio sin rellenar: su punto rojo en el índice. Solo General tiene
   * obligatorios (el nombre, y al menos un canal), y un nombre repetido tampoco deja guardar. En el alta,
   * solo después de intentar salir: el resumen ya dice qué falta sin acusar.
   */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() => {
    const show = !this.generalValid() && (this.mode() === 'edit' || this.attemptedGeneral());
    return new Set(show ? ['group-section-general'] : []);
  });

  /**
   * Las secciones con cambios sin guardar: su marca en el índice (DD-122). La ficha tiene un solo
   * «Guardar», y el índice dice dónde está lo que se va a guardar. Solo al editar: en el alta todo está
   * por guardar. Un cambio puede cruzar secciones —quitar un canal en General recorta los canales de
   * los agentes— y entonces se marcan las dos.
   */
  protected readonly sectionsWithChanges = computed<ReadonlySet<string>>(() => {
    if (this.mode() !== 'edit') return new Set();
    const out = new Set<string>();
    for (const key of this.dirtyState.changedKeys()) {
      if (key !== 'advanced') {
        out.add(SECTION_OF_FIELD[key as keyof FormState]);
        continue;
      }
      for (const sub of changedKeys(this.form().advanced, this.dirtyState.pristineValue().advanced)) {
        out.add(CLIENT_CARD_KEYS.has(sub) ? 'group-section-resources' : 'group-section-distribution');
      }
    }
    return out;
  });

  /** El aviso bajo el nombre: repetido siempre; vacío, solo tras intentar salir de General. */
  protected readonly nameError = computed<string | null>(() => {
    if (this.nameTaken()) return 'groups.errors.name_taken';
    if (this.attemptedGeneral() && this.form().name.trim().length === 0) return 'groups.errors.name_required';
    return null;
  });

  protected readonly channelsError = computed(() => this.attemptedGeneral() && this.form().channels.size === 0);

  /**
   * Ir a otra sección. Al editar, libre. En el ALTA, General es la puerta: sin nombre y sin canales las
   * demás no tienen de qué hablar (qué bloques de canal, qué recursos, qué columnas de agentes), así que
   * se queda en General y dice qué falta en cada campo.
   */
  protected goTo(id: string): void {
    if (this.mode() === 'create' && id !== 'group-section-general' && !this.generalValid()) {
      this.stayInGeneral();
      return;
    }
    // En el alta, sin rastro en el historial: Atrás sale del alta (DD-122).
    void this.sectionLinks.go(this.sectionUrl(id), { replace: this.mode() === 'create' });
  }

  /** La dirección de una sección de esta ficha: General, la de aterrizaje, sin parámetro. */
  private sectionUrl(id: string): UrlTree {
    const slug = this.sectionSlug(id);
    return this.sectionLinks.section(this.route, slug === 'general' ? null : slug);
  }

  /**
   * El alta no sale de General: cada campo dice lo que le falta y el foco va al primero, como hacía el
   * diálogo de alta. Sin eso, con teclado, «Siguiente» no hace nada visible desde donde estás.
   */
  private stayInGeneral(): void {
    this.attemptedGeneral.set(true);
    if (this.seccion()) void this.sectionLinks.go(this.sectionUrl('group-section-general'), { replace: true });
    const nameMissing = this.form().name.trim().length === 0 || this.nameTaken();
    const target = nameMissing ? 'group-name' : 'group-channels-phone';
    afterNextRender(() => document.getElementById(target)?.focus(), { injector: this.injector });
  }

  /** La sección siguiente en el índice, para «Siguiente» (solo en el alta); `null` en la última. */
  protected readonly nextSectionId = computed<string | null>(() => {
    const ids = this.navSections().map((s) => s.id);
    const i = ids.indexOf(this.activeSection());
    return i >= 0 && i < ids.length - 1 ? ids[i + 1]! : null;
  });

  protected next(): void {
    const id = this.nextSectionId();
    if (id) this.goTo(id);
  }

  protected readonly editingId = signal<number | null>(null);
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
    if (this.nameTaken()) return 'groups.errors.name_taken';
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
    /** Los que pierden algún canal. */
    readonly affected: number;
    /** De ellos, los que se quedan sin ninguno: salen del grupo al guardar. */
    readonly orphaned: number;
  } | null>(null);

  /** Dirty-state por CAMBIO NETO (snapshot vs pristine): Guardar refleja si hay
   *  algo distinto que guardar (vuelve a off si deshaces). Patrón compartido
   *  (admin/AED/builder); `formDirty` queda de alias para el guard de salida. */
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;
  protected readonly conflictWarning = signal(false);
  private releaseLock: (() => void) | null = null;

  protected readonly canSave = computed(() => {
    if (!this.generalValid()) return false;
    // Al editar exige cambio neto (Guardar se apaga otra vez si deshaces); en el alta basta con General.
    return this.mode() === 'create' || this.dirtyState.dirty();
  });

  /* Chat es la MADRE de Web Chat y WhatsApp (visión de producto de grupos, 2026-09-25): comparten
   * estrategia y bloque en Distribución. Las claves no cambian: `chat` es Web Chat. */
  protected readonly hasChatFamily = computed(() => hasChatFamily(this.form().channels));
  protected readonly hasWebChat = computed(() => this.form().channels.has('chat'));
  protected readonly hasWhatsApp = computed(() => this.form().channels.has('whatsapp'));
  protected readonly hasPhone = computed(() => this.form().channels.has('phone'));
  /** Las familias de canal que el grupo NO tiene, en el orden de Distribución y colas. */
  protected readonly inactiveFamilies = computed<readonly ('phone' | 'chat' | 'email')[]>(() => {
    const off: ('phone' | 'chat' | 'email')[] = [];
    if (!this.hasPhone()) off.push('phone');
    if (!this.hasChatFamily()) off.push('chat');
    if (!this.hasEmail()) off.push('email');
    return off;
  });
  protected readonly familyLabelKeys: Readonly<Record<'phone' | 'chat' | 'email', string>> = {
    phone: 'groups.channel.phone',
    chat: 'groups.channel.chat_family',
    email: 'groups.channel.email',
  };
  /** Los subcanales de Chat que el grupo tiene: cada uno escribe sus propios mensajes de cola. */
  protected readonly activeChatSubchannels = computed<readonly ChatSubchannel[]>(() => {
    const subchannels: readonly ChatSubchannel[] = ['chat', 'whatsapp'];
    return subchannels.filter((c) => this.form().channels.has(c));
  });
  /** Los tres mensajes de cola de un subcanal, en el orden en que los recibe el cliente. */
  protected readonly chatMessageKeys: readonly { key: keyof ChatQueueMessages; labelKey: string; placeholderKey: string }[] = [
    { key: 'onEnter', labelKey: 'groups.form.chat.message_on_enter', placeholderKey: 'groups.form.chat.message_on_enter_placeholder' },
    { key: 'whileWaiting', labelKey: 'groups.form.chat.message_waiting', placeholderKey: 'groups.form.chat.message_waiting_placeholder' },
    { key: 'noAgents', labelKey: 'groups.form.chat.message_no_agents', placeholderKey: 'groups.form.chat.message_no_agents_placeholder' },
  ];
  /** Los subcanales de Chat que el grupo tiene, para la cabecera de su bloque: «Web Chat · WhatsApp». */
  protected readonly chatSubchannelLabels = computed(() => {
    this.lang();
    const subchannels: readonly GroupChannel[] = ['chat', 'whatsapp'];
    return subchannels
      .filter((c) => this.form().channels.has(c))
      .map((c) => this.translate.instant(this.channelKeys[c]))
      .join(' · ');
  });
  /** La casilla madre: marcada con los dos subcanales, a medias con uno. */
  protected readonly chatFamilyState = computed(() =>
    triStateOf([this.hasWebChat(), this.hasWhatsApp()].filter(Boolean).length, 2),
  );
  protected readonly isNiveles = computed(() => this.hasPhone() && this.form().strategy === 'Niveles');
  protected readonly isRingAll = computed(() => this.hasPhone() && this.form().strategy === 'Ring All');

  /**
   * Qué hace la estrategia de teléfono elegida, en una línea bajo el campo (DD-133). El texto sale del manual de usuario
   * de Voice, que describe seis; Skills sale apagada con su motivo y no lleva ayuda.
   */
  private static readonly STRATEGY_HELP: Readonly<Record<string, string>> = {
    Balanceada: 'groups.form.strategy_help.balanced',
    'Menos llamadas atendidas': 'groups.form.strategy_help.fewest_calls',
    'Más tiempo inactivo': 'groups.form.strategy_help.longest_idle',
    Niveles: 'groups.form.strategy_help.levels',
    'Ring All': 'groups.form.strategy_help.ring_all',
    'Agente exclusivo': 'groups.form.strategy_help.exclusive',
  };
  protected readonly strategyHelpKey = computed<string | null>(
    () => GroupFormPageComponent.STRATEGY_HELP[this.form().strategy] ?? null,
  );

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

  /**
   * Los saltos de Distribución y colas (DD-130): uno por bloque de canal activo, en su orden, y solo con dos o más
   * (con uno, la sección ya empieza en él). Con los cuatro canales la sección mide 2.355 px y nada nace plegado
   * (DD-121 §5): el salto lleva al bloque y deja el foco en su título.
   */
  protected readonly channelJumps = computed(() => {
    const saltos: { id: string; channel: 'phone' | 'chat' | 'email'; labelKey: string }[] = [];
    if (this.hasPhone()) saltos.push({ id: 'group-channel-phone', channel: 'phone', labelKey: this.channelKeys.phone });
    if (this.hasChatFamily()) saltos.push({ id: 'group-channel-chat', channel: 'chat', labelKey: 'groups.channel.chat_family' });
    if (this.hasEmail()) saltos.push({ id: 'group-channel-email', channel: 'email', labelKey: this.channelKeys.email });
    return saltos.length > 1 ? saltos : [];
  });

  /** El enlace de un salto: la dirección de la ficha con su ancla. Un `#id` suelto se resolvería contra
   *  `<base href="/">`, y Cmd+clic abriría la raíz de la app. */
  protected jumpHref(id: string): string {
    return `${this.router.url.split('#')[0]}#${id}`;
  }

  /** El clic principal, sin teclas, salta al canal sin navegar y deja el foco en su título; con una tecla o el botón
   *  central, el enlace hace lo suyo (otra pestaña), la misma regla que el índice. */
  protected jumpToChannel(event: MouseEvent, id: string): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ block: 'start' });
    this.document.getElementById(`${id}-title`)?.focus({ preventScroll: true });
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
    if (!idParam) {
      // ALTA: la ficha vacía, con los valores por defecto de Grupos y Teléfono marcado (`emptyForm`). Abre en
      // General aunque la dirección pida otra sección: General es la puerta del alta (`goTo`). Se quita el
      // parámetro, o en cuanto General estuviera completa la ficha saltaría sola a esa sección.
      this.dirtyState.markPristine();
      if (this.route.snapshot.queryParamMap.has('seccion')) {
        void this.sectionLinks.go(this.sectionUrl('group-section-general'), { replace: true });
      }
      return;
    }
    const group = this.groupsStore.getGroup(Number(idParam));
    if (!group) {
      void this.router.navigateByUrl('/admin/grupos', { replaceUrl: true });
      return;
    }
    this.editingId.set(group.id);
    this.initial.set(group);
    /* Cada agente, con los canales que el grupo OFRECE: un enlace puede traer uno que el grupo ya no tiene
     * (datos de antes: en el seed, un Web Chat en un grupo solo de Teléfono). Sin recortarlo al leer, ese
     * canal fantasma revivía en cuanto el grupo volvía a ofrecerlo, y la confirmación de quitar canales
     * contaba mal a quién saca del grupo. */
    const seedLinks = clampLinksToChannels(this.linksStore.linksForGroup(group.id), group.channels);
    // La única vía de lectura: lo que el grupo no guardó sale de su juego de antes o de fábrica.
    const g = resolveGroup(group);
    this.form.set({
      name: g.name,
      phone: g.phone,
      priority: g.priority,
      typification: g.typification ?? null,
      scheduleIds: new Set(g.schedules ?? []),
      templateIds: new Set(g.templates ?? []),
      labelIds: new Set(g.labels ?? []),
      announcements: g.announcements,
      advanced: g.advanced,
      phoneQueue: g.phoneQueue,
      chatQueue: g.chatQueue,
      chat: g.chat,
      channels: new Set(group.channels),
      strategy: group.strategy,
      subStrategy: group.subStrategy ?? SUB_STRATEGIES[0]!,
      ringAllAgents: group.ringAllAgents ?? RING_ALL_OPTIONS[0]!,
      chatStrategy: group.chatStrategy ?? DEFAULT_CHAT_STRATEGY,
      links: seedLinks,
    });
    this.initialChannels.set(new Set(group.channels));
    this.initialLinks.set(seedLinks);
    this.dirtyState.markPristine();
    this.releaseLock = this.crossTab.acquire('group', group.id, () =>
      this.conflictWarning.set(true),
    );
  }

  /** Cada sección en la dirección (`?seccion=agentes`): el índice enlaza a ellas y el alta, al crear,
   *  sigue en la sección en la que estaba. */
  private static readonly SECTION_SLUGS: Readonly<Record<string, string>> = {
    general: 'group-section-general',
    distribucion: 'group-section-distribution',
    recursos: 'group-section-resources',
    agentes: 'group-section-agents',
  };

  private sectionSlug(id: string): string | null {
    const entry = Object.entries(GroupFormPageComponent.SECTION_SLUGS).find(([, value]) => value === id);
    return entry ? entry[0] : null;
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

  protected onStrategyValueChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('strategy', value);
  }

  protected onChatStrategyValueChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('chatStrategy', value);
  }

  protected onTypificationChange(value: unknown): void {
    this.updateField('typification', typeof value === 'string' ? value : null);
  }

  /** Crear una tipificación SIN salir de la ficha (decisión de producto, 2026-09-18): antes había que abandonar el flujo solo para
   *  dar de alta una. Mismo formulario que Repositorios (`TIPIFICACION_FIELDS`), en un diálogo. Al guardar, el grupo
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

  /** La cola de un canal: cada uno la suya. */
  protected setQueue<K extends keyof ChannelQueue>(channel: 'phone' | 'chat', key: K, value: ChannelQueue[K]): void {
    const field = channel === 'phone' ? 'phoneQueue' : 'chatQueue';
    this.form.update((f) => ({ ...f, [field]: { ...f[field], [key]: value } }));
  }

  /** Números de la cola: como los de Avanzado, un campo vaciado se queda en su valor anterior. */
  protected setQueueNumber(channel: 'phone' | 'chat', key: 'queueSize' | 'maxQueueWaitSec' | 'serviceLevelSec' | 'transferSec', value: number | null): void {
    if (value !== null && Number.isFinite(value) && value >= 0) this.setQueue(channel, key, value);
  }

  protected setChat<K extends keyof ChatSettings>(key: K, value: ChatSettings[K]): void {
    this.form.update((f) => ({ ...f, chat: { ...f.chat, [key]: value } }));
  }

  protected setInactivityMinutes(value: number | null): void {
    if (value !== null && Number.isFinite(value) && value >= 1) this.setChat('inactivityMinutes', value);
  }

  /** Un mensaje de cola de UN subcanal, sin tocar los del otro. */
  protected setChatMessage(subchannel: ChatSubchannel, key: keyof ChatQueueMessages, value: string | null): void {
    this.form.update((f) => ({
      ...f,
      chat: {
        ...f.chat,
        queueMessages: {
          ...f.chat.queueMessages,
          [subchannel]: { ...f.chat.queueMessages[subchannel], [key]: value ?? '' },
        },
      },
    }));
  }

  /** Números: un campo vaciado no se guarda como 0, se queda en su valor anterior. */
  protected setAdvancedNumber(key: 'wrapUpSec' | 'cardHeight', value: number | null): void {
    if (value !== null && Number.isFinite(value) && value >= 0) this.setAdvanced(key, value);
  }

  /** «Dominios permitidos» del script de chat (decisión de producto, 2026-09-20): en qué webs se puede insertar sin que
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

  /** El .wav elegido: de momento solo se guarda su nombre (demo). A la vista solo queda la música de espera. */
  protected onAudioFile(key: 'holdMusicFile', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setAnnouncement(key, file.name);
    input.value = '';
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
      const next = toggleGroupChannel(f.channels, channel);
      // Los canales de cada agente se recortan a los que ofrece ahora el grupo.
      return { ...f, channels: next, links: clampLinksToChannels(f.links, next) };
    });
  }

  /** La casilla madre: enciende o apaga los dos subcanales de una vez (patrón B12 del laboratorio). */
  protected toggleChatFamily(): void {
    this.form.update((f) => {
      const next = toggleChatFamily(f.channels) as Set<GroupChannel>;
      return { ...f, channels: next, links: clampLinksToChannels(f.links, next) };
    });
  }

  protected hasChannel(channel: GroupChannel): boolean {
    return this.form().channels.has(channel);
  }

  /* ── El resumen (`sc-group-summary`), en su columna a la derecha ───────────────────────── */

  /** La estrategia de cada familia que el grupo tiene: Teléfono con lo que la completa, y Chat. */
  protected readonly summaryRouting = computed<readonly GroupSummaryRouting[]>(() => {
    this.lang();
    const routing: GroupSummaryRouting[] = [];
    if (this.hasPhone()) routing.push({ family: 'phone', text: this.phoneStrategySummary() });
    if (this.hasChatFamily()) routing.push({ family: 'chat', text: this.form().chatStrategy });
    return routing;
  });

  /** Por dónde sale y recibe el grupo: el teléfono saliente y el número de WhatsApp. */
  protected readonly summaryOutbound = computed<readonly GroupSummaryOutbound[]>(() => {
    const f = this.form();
    const outbound: GroupSummaryOutbound[] = [];
    if (this.hasPhone()) outbound.push({ channel: 'phone', number: f.phone.trim() });
    if (this.hasWhatsApp()) outbound.push({ channel: 'whatsapp', number: f.advanced.whatsappNumber.trim() });
    return outbound;
  });

  /** Lo que le llega de Repositorios: tipificación, agendas, plantillas de sus canales y etiquetas. */
  protected readonly resourceCount = computed(() => {
    const f = this.form();
    const templates = (this.hasChatFamily() ? this.chatTemplateValue().length : 0) + (this.hasEmail() ? this.emailTemplateValue().length : 0);
    return (f.typification ? 1 : 0) + f.scheduleIds.size + templates + f.labelIds.size;
  });

  /** Lo que falta para poder crear, en el orden de General. Un nombre repetido no falta: se dice en su campo. */
  protected readonly summaryMissing = computed<readonly string[]>(() => {
    const f = this.form();
    const missing: string[] = [];
    if (f.name.trim().length === 0) missing.push('common.summary_missing_name');
    if (f.channels.size === 0) missing.push('groups.form.summary.missing_channels');
    return missing;
  });

  protected onLinksChange(links: readonly GroupAgentLink[]): void {
    this.form.update((f) => ({ ...f, links }));
  }

  /** Otro grupo ya se llama así: se dice en vivo bajo el campo y Guardar espera. */
  protected readonly nameTaken = computed(() => {
    const wanted = this.form().name.trim().toLocaleLowerCase('es');
    return (
      wanted.length > 0 &&
      this.groupsStore
        .groups()
        .some((g) => g.id !== this.editingId() && g.name.trim().toLocaleLowerCase('es') === wanted)
    );
  });

  protected onNameChange(name: string): void {
    this.updateField('name', name ?? '');
  }

  protected onPhoneValueChange(phone: unknown): void {
    this.updateField('phone', typeof phone === 'string' ? phone : '');
  }

  protected onPriorityValueChange(priority: GroupPriority): void {
    this.updateField('priority', priority);
  }

  /** La línea bajo el nombre: el teléfono (solo con canal Teléfono) y la prioridad, con su nombre. */
  protected readonly identitySummary = computed(() => {
    this.lang();
    const f = this.form();
    const priority = this.translate.instant('groups.form.summary.priority', {
      value: this.translate.instant(this.priorityKeys[f.priority]),
    });
    if (!this.hasPhone()) return priority;
    const phone = f.phone || this.translate.instant('groups.form.summary.no_phone');
    return `${phone} · ${priority}`;
  });

  protected save(): void {
    if (this.mode() === 'create' && !this.generalValid()) {
      this.stayInGeneral();
      return;
    }
    if (!this.canSave() || this.saving()) return;

    // If the user removed any channel the group used to own, surface the
    // cascade impact before persisting. The dialog's "Continuar" handler
    // re-enters `save()` with `cascadeConfirm` already shown so this guard
    // only fires once per save.
    if (!this.cascadeConfirm()) {
      const removed = [...this.initialChannels()].filter((c) => !this.form().channels.has(c));
      if (removed.length > 0) {
        const { affected } = channelRemovalImpact(this.initialLinks(), removed);
        if (affected > 0) {
          // Los que salen, con LA MISMA regla que los saca al guardar: la cifra dice lo que va a pasar.
          const orphaned = this.form().links.length - this.withoutOrphans(this.form().links).length;
          this.cascadeConfirm.set({ removed, affected, orphaned });
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
        typification: f.typification ?? undefined,
        schedules: [...f.scheduleIds],
        templates: [...f.templateIds],
        labels: [...f.labelIds],
        announcements: f.announcements,
        advanced: f.advanced,
        phoneQueue: f.phoneQueue,
        chatQueue: f.chatQueue,
        chat: f.chat,
        channels: Array.from(f.channels),
        strategy: f.strategy,
        subStrategy: this.isNiveles() ? f.subStrategy : undefined,
        ringAllAgents: this.isRingAll() ? f.ringAllAgents : undefined,
        // La de Chat vale para sus dos subcanales: un grupo solo de WhatsApp también la guarda.
        chatStrategy: hasChatFamily(f.channels) ? f.chatStrategy : undefined,
      };

      if (this.mode() === 'create') {
        this.createGroup(payload);
        return;
      }

      // Como Contact Center y la ficha de agente (decisión de producto, 2026-09-16): guardar se queda en la ficha, con su aviso.
      const editingId = this.editingId()!;
      this.groupsStore.updateGroup(editingId, { ...payload });
      this.linksStore.replaceLinksForGroup(editingId, this.normalizeLinks(this.withoutOrphans(f.links), editingId));
      const refreshed = this.groupsStore.getGroup(editingId);
      if (refreshed) this.initial.set(refreshed);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('groups.toasts.updated', { name: payload.name }),
        life: TOAST_LIFE.success,
      });
      // Lo guardado pasa a ser la referencia para avisar si luego se quita un canal con agentes.
      this.initialChannels.set(new Set(f.channels));
      this.initialLinks.set(this.linksStore.linksForGroup(editingId));
      this.saving.set(false);
      this.dirtyState.markPristine();
    }, 400);
  }

  /**
   * Crea el grupo con lo que haya en las cuatro secciones y abre su EDICIÓN en la sección en la que se
   * estaba: navegar (y no solo cambiar la dirección) pone al día la miga, el título y el candado entre
   * pestañas. La ficha se marca limpia antes, para que el guardián de salida no pregunte.
   */
  private createGroup(payload: Omit<Group, 'id' | 'code'>): void {
    const f = this.form();
    const slug = this.sectionSlug(this.activeSection());
    const created = this.groupsStore.addGroup(payload);
    this.linksStore.replaceLinksForGroup(created.id, this.normalizeLinks(this.withoutOrphans(f.links), created.id));
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('groups.toasts.created', { name: created.name }),
      life: TOAST_LIFE.success,
    });
    this.dirtyState.markPristine();
    // `saving` sigue encendido hasta que se va (ver `activeSection`).
    void this.router
      .navigate(['/admin/grupos/editar', created.id], {
        replaceUrl: true,
        queryParams: slug && slug !== 'general' ? { seccion: slug } : {},
      })
      .finally(() => this.saving.set(false));
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

  /** El ALTA, y el punto de partida hasta que `ngOnInit` carga el grupo al editar: los valores por defecto de Grupos,
   *  con Teléfono marcado. */
  private emptyForm(): FormState {
    const defaults = this.defaultsStore.defaults();
    return {
      name: '',
      phone: '',
      priority: defaults.priority,
      typification: null,
      scheduleIds: new Set<number>(),
      templateIds: new Set<number>(),
      labelIds: new Set<number>(),
      announcements: { ...DEFAULT_ANNOUNCEMENTS, voice: defaults.voice },
      advanced: { ...defaults.advanced },
      // Cada canal nace con SU cola, su estrategia y (Chat) su cierre por inactividad de los valores por defecto.
      phoneQueue: { ...defaults.phoneQueue },
      chatQueue: { ...defaults.chatQueue },
      chat: { ...DEFAULT_CHAT_SETTINGS, ...defaults.chat },
      channels: new Set<GroupChannel>(['phone']),
      strategy: defaults.strategy,
      subStrategy: SUB_STRATEGIES[0]!,
      ringAllAgents: RING_ALL_OPTIONS[0]!,
      chatStrategy: defaults.chatStrategy,
      links: [],
    };
  }

  /**
   * Un agente asignado tiene al menos un canal (DD-121): quien se queda sin ninguno porque se quitaron
   * canales del grupo SALE del grupo al guardar, y la confirmación de cascada lo ha dicho con su cifra.
   * Las filas que YA se cargaron sin canales (datos de antes, o la ficha del agente, que deja
   * quitarlos todos) se quedan como estaban: la tabla las marca «Sin canales».
   */
  private withoutOrphans(links: readonly GroupAgentLink[]): readonly GroupAgentLink[] {
    const loadedEmpty = new Set(this.initialLinks().filter((l) => l.channels.length === 0).map((l) => l.agentId));
    return links.filter((l) => l.channels.length > 0 || loadedEmpty.has(l.agentId));
  }

  /** Ensure every link points to the right groupId before persistence. */
  private normalizeLinks(
    links: readonly GroupAgentLink[],
    groupId: number,
  ): readonly GroupAgentLink[] {
    return links.map((l) => (l.groupId === groupId ? l : { ...l, groupId }));
  }
}
