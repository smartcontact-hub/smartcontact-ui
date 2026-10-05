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
import { AltaPieComponent, ChannelIconComponent, NameInplaceComponent, NombreFijoComponent, ResourceRowsComponent } from '@shared/components';
import { changedKeys, createFormDirtyState } from '@shared/utils/form-dirty-state';
import { llegarAAncla, llegarASeccion, seccionesDeAlta } from '@shared/utils/alta-secciones';
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
  ScSlotComponent as SlotComponent,
  ScSubsectionComponent as SubsectionComponent,
  triStateOf,
} from '@smartcontact-hub/components';
import {
  CHANNEL_LABEL_KEYS,
  CHAT_STRATEGIES,
  CHAT_SUB_STRATEGIES,
  GROUP_CHANNELS,
  Group,
  GroupChannel,
  GroupPriority,
  OUTBOUND_NUMBERS,
  PHONE_STRATEGIES,
  PRIORITY_LABEL_KEYS,
  RING_ALL_OPTIONS,
  SUB_STRATEGIES,
  DEFAULT_ANNOUNCEMENTS,
  GroupAdvanced,
  GroupAnnouncements,
  UNAVAILABLE_STRATEGIES,
  VOICE_OPTIONS,
  groupDurationOptions,
  validQueueSize,
  type ChannelQueue,
  type ChatQueueMessages,
  type ChatSettings,
  type ChatSubchannel,
  DEFAULT_CHAT_SETTINGS,
  DEFAULT_CHAT_STRATEGY,
  FAMILY_LABEL_KEYS,
  type ChannelFamily,
  resolveGroup,
} from '../data/groups-data';
import { GroupDefaultsStore } from '../state/group-defaults.store';
import { TipificacionesStore, TIPIFICACION_FIELDS } from '@features/admin/repositories/instances/tipificaciones';
import { HorariosStore } from '@features/admin/repositories/instances/horarios';
import { AgendasStore } from '@features/admin/repositories/state/agendas.store';
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
import { agendasOfrecidas, idsVivos, tipificacionViva } from '@features/admin/services/recursos.core.mjs';
import { ResourceRowsService } from '@features/admin/services/resource-rows.service';
import type { GroupAgentLink } from '@features/admin/services/group-agent-links.types';
import {
  channelRemovalImpact,
  clampLinksToChannels,
  hasChatFamily,
  removedFamilies,
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
  type GroupSummaryDestino,
  type GroupSummaryOutbound,
  type GroupSummaryRouting,
  type GroupSummarySeccion,
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
  chatSubStrategy: string;
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
  chatSubStrategy: 'group-section-distribution',
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

/** Las secciones de la ficha a las que lleva el resumen (DD-146). */
const RESUMEN_SECCIONES: Readonly<Record<GroupSummarySeccion, string>> = {
  agentes: 'group-section-agents',
  distribucion: 'group-section-distribution',
  recursos: 'group-section-resources',
};

/** Los campos de los números de Salida, en Distribución y colas: el teléfono saliente y el de WhatsApp. */
const RESUMEN_NUMEROS = { phone: 'group-phone', whatsapp: 'group-chat-whatsapp' } as const;

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
    SubsectionComponent,
    SlotComponent,
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
    AltaPieComponent,
    NombreFijoComponent,
    ResourceRowsComponent,
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
  private readonly horariosStore = inject(HorariosStore);
  private readonly templatesStore = inject(TemplatesStore);
  private readonly resourceRows = inject(ResourceRowsService);
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
  protected readonly chatSubStrategies = CHAT_SUB_STRATEGIES;
  protected readonly levelFamilies = computed<readonly ('phone' | 'chat')[]>(() => [
    ...(this.isNiveles() ? ['phone' as const] : []),
    ...(this.hasChatFamily() && this.form().chatStrategy === 'Niveles' ? ['chat' as const] : []),
  ]);
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
   * EL ALTA, CON EL ÍNDICE DE LA EDICIÓN (DD-143): las mismas cuatro secciones, con ✓ en las que se dejan completas y
   * «Atrás / Siguiente» al pie. General es la puerta (DD-121): sin nombre y sin canales no se sale de ella (`goTo`).
   * La sección abierta no toca la dirección.
   */
  protected readonly alta = seccionesDeAlta({
    secciones: this.navSections,
    // ✓ solo donde hay algo obligatorio (DD-158): General, y Distribución si el grupo tiene Teléfono (su teléfono
    // saliente). Recursos y Agentes no lo llevan nunca.
    obligatoria: (id) => id === 'group-section-general' || (id === 'group-section-distribution' && this.hasPhone()),
    completa: (id) =>
      id === 'group-section-general' ? this.generalValid() : id !== 'group-section-distribution' || (!this.phoneMissing() && !this.queueInvalid()),
  });

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
    // En el alta, la sección abierta (DD-143); al editar, la dirección.
    const id =
      this.mode() === 'create'
        ? this.alta.abierta()
        : (GroupFormPageComponent.SECTION_SLUGS[this.seccion() ?? ''] ?? 'group-section-general');
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
   * Con Teléfono, el teléfono saliente es obligatorio, como el nombre (DD-142): es el número que ven los clientes
   * cuando llama un agente del grupo. Sin Teléfono no se pide.
   */
  protected readonly phoneMissing = computed(() => this.hasPhone() && this.form().phone.trim().length === 0);

  /** En el alta se ha salido de Distribución y colas sin él: desde entonces lo dice su campo, como el nombre. */
  private readonly attemptedDistribution = signal(false);

  /** El aviso bajo el teléfono saliente: al editar, siempre que falte; en el alta, tras salir de su sección sin él. */
  protected readonly phoneError = computed<string | null>(() =>
    this.phoneMissing() && (this.mode() === 'edit' || this.attemptedDistribution()) ? 'groups.errors.phone_required' : null,
  );

  /**
   * Las secciones con algo obligatorio sin rellenar: su punto rojo en el índice. General (el nombre, y al menos un
   * canal; un nombre repetido tampoco deja guardar) y, con Teléfono, Distribución y colas (su teléfono saliente). En
   * el alta, solo después de intentar salir: el resumen ya dice qué falta sin acusar.
   */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() => {
    const out = new Set<string>();
    if (!this.generalValid() && (this.mode() === 'edit' || this.attemptedGeneral())) out.add('group-section-general');
    if (this.phoneError() || this.queueInvalid()) out.add('group-section-distribution');
    return out;
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
   *
   * Dice si llegó: al editar, cuando acaba la navegación; en el alta, en el acto (el resumen espera a ese momento
   * para llevar a un sitio dentro de la sección).
   */
  protected goTo(id: string): Promise<boolean> {
    if (this.mode() === 'create' && id !== 'group-section-general' && !this.generalValid()) {
      this.stayInGeneral();
      return Promise.resolve(false);
    }
    // La segunda puerta del alta (DD-158): con Teléfono y sin teléfono saliente no se pasa de Distribución y colas,
    // como no se pasa de General sin nombre. Se puede volver a General, que es donde se quita Teléfono.
    if (
      this.mode() === 'create' &&
      id !== 'group-section-general' &&
      id !== 'group-section-distribution' &&
      this.phoneMissing()
    ) {
      this.stayInDistribution();
      return Promise.resolve(false);
    }
    // Al editar, salir de Distribución sin el teléfono saliente se deja, pero desde ahí su campo dice que falta.
    if (this.activeSection() === 'group-section-distribution' && id !== 'group-section-distribution' && this.phoneMissing()) {
      this.attemptedDistribution.set(true);
    }
    // En el alta, la sección se abre sin tocar la dirección: Atrás sale del alta (DD-122, DD-143).
    if (this.mode() === 'create') {
      this.alta.abrir(id);
      return Promise.resolve(true);
    }
    return this.sectionLinks.go(this.sectionUrl(id));
  }

  /**
   * «Siguiente» y «Atrás» del alta: la sección de al lado, arriba y con el foco en su título. Sin General completa,
   * «Siguiente» se queda en ella y dice lo que falta, con el foco en el campo.
   */
  protected siguiente(): void {
    this.irAlLado(this.alta.siguiente());
  }

  protected anterior(): void {
    this.irAlLado(this.alta.anterior());
  }

  private irAlLado(id: string | null): void {
    if (!id) return;
    void this.goTo(id);
    if (this.activeSection() === id) llegarASeccion(id, this.injector);
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
  /** Distribución y colas, abierta, con lo que falta dicho bajo el campo y el foco en él. */
  private stayInDistribution(): void {
    this.attemptedDistribution.set(true);
    this.alta.abrir('group-section-distribution');
    llegarAAncla('group-phone', this.injector);
  }

  private stayInGeneral(): void {
    this.attemptedGeneral.set(true);
    // General, abierta: es donde se dice lo que falta.
    this.alta.abrir('group-section-general');
    const nameMissing = this.form().name.trim().length === 0 || this.nameTaken();
    const target = nameMissing ? 'group-name' : 'group-channels-phone';
    afterNextRender(() => document.getElementById(target)?.focus(), { injector: this.injector });
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
    if (this.phoneMissing()) return 'groups.errors.phone_required';
    if (this.queueInvalid()) return 'groups.form.advanced.queue_invalid';
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
    /** Las familias que el grupo deja de ofrecer (DD-147): quitar solo WhatsApp, con Web Chat, no quita Chat. */
    readonly removed: readonly ChannelFamily[];
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

  protected readonly queueInvalid = computed(() =>
    (this.hasPhone() && !validQueueSize(this.form().phoneQueue)) ||
    (this.hasChatFamily() && !validQueueSize(this.form().chatQueue)));

  protected attendanceOptions(channel: ChatSubchannel) {
    this.lang();
    const current = this.form().chat.attendanceScheduleIds?.[channel];
    return [{ label: this.translate.instant('groups.form.chat.schedule_always'), value: null, disabled: false },
      ...this.horariosStore.items().filter(h => h.status === 'active' || h.id === current)
        .map(h => ({ label: h.name, value: h.id, disabled: h.status !== 'active' }))];
  }

  protected setAttendanceSchedule(channel: ChatSubchannel, value: unknown): void {
    if (value !== null && (typeof value !== 'number' || !this.horariosStore.items().some(h => h.id === value && h.status === 'active'))) return;
    this.setChat('attendanceScheduleIds', { ...this.form().chat.attendanceScheduleIds, [channel]: value });
  }

  protected readonly canSave = computed(() => {
    if (!this.generalValid() || this.phoneMissing() || this.queueInvalid()) return false;
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
  protected readonly familyLabelKeys = FAMILY_LABEL_KEYS;
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
    'Menos conversaciones atendidas': 'groups.form.strategy_help.fewest_conversations',
    'Más tiempo inactivo': 'groups.form.strategy_help.longest_idle',
    Niveles: 'groups.form.strategy_help.levels',
    'Ring All': 'groups.form.strategy_help.ring_all',
    'Agente exclusivo': 'groups.form.strategy_help.exclusive',
  };
  protected readonly strategyHelpKey = computed<string | null>(
    () => GroupFormPageComponent.STRATEGY_HELP[this.form().strategy] ?? null,
  );

  /** Los números asignados a la cuenta, sin escribir uno nuevo (DD-142). Y el que ya tuviera guardado el grupo, aunque
   *  no esté entre ellos: abrir la ficha no lo borra. */
  protected readonly phoneOptions = computed<readonly string[]>(() => {
    const phones = new Set(OUTBOUND_NUMBERS);
    if (this.form().phone) phones.add(this.form().phone);
    return [...phones].sort();
  });

  /**
   * Recursos sin Etiquetas (DD-142): el campo se queda hecho y apagado por si vuelve, y el grupo conserva las que
   * tenía (se leen y se guardan tal cual). Encenderlo es poner esto a `true`.
   */
  protected readonly conEtiquetas: boolean = false;

  /** Una tipificación por grupo: cada categoría del repositorio es un conjunto (el agente elige dentro al cerrar). Va
   *  por su nombre (DD-141): llevaba al lado cuántas tipificaciones tiene, y se leía como niveles o como grupos. */
  protected readonly typificationOptions = computed(() => {
    this.lang();
    const categories = [...new Set(this.tipificacionesStore.items().map((t) => t.category))];
    return [
      { label: this.translate.instant('groups.form.fields.typification_none'), value: null },
      ...categories.sort((a, b) => a.localeCompare(b, 'es')).map((category) => ({ label: category, value: category })),
    ];
  });

  /** Las agendas activas, y las ya puestas aunque estén inactivas (las guardadas y las de ahora): una inactiva puesta
   *  se puede quitar, pero no se ofrece para poner (DD-164). */
  protected readonly scheduleOptions = computed(() => {
    const puestas = [...(this.initial()?.schedules ?? []), ...this.form().scheduleIds];
    return agendasOfrecidas(this.agendasStore.items(), puestas).map((a) => ({ label: a.name, value: a.id }));
  });
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

  /* El resumen bajo cada campo (DD-164): qué es cada recurso y, al editar, su «Editar». En el alta no lo lleva: la
   * dirección no guarda la sección, y Atrás caería en un General vacío. */
  protected readonly typificationRows = computed(() => {
    this.lang();
    return this.resourceRows.tipificacion(this.form().typification, this.mode() === 'edit');
  });
  protected readonly agendaRows = computed(() => {
    this.lang();
    return this.resourceRows.agendas(this.form().scheduleIds, this.mode() === 'edit');
  });
  protected readonly chatTemplateRows = computed(() => {
    this.lang();
    return this.resourceRows.templates(this.form().templateIds, 'chat', this.mode() === 'edit');
  });
  protected readonly emailTemplateRows = computed(() => {
    this.lang();
    return this.resourceRows.templates(this.form().templateIds, 'email', this.mode() === 'edit');
  });

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

  protected durationOptions(value: number, minutes = false) {
    this.lang();
    return groupDurationOptions(value, minutes, this.translate.currentLang || 'es');
  }

  protected queueSizeError(queue: ChannelQueue): string | undefined {
    return validQueueSize(queue) ? undefined : this.translate.instant(queue.queueSizeType === 'per_agent'
      ? 'groups.form.advanced.queue_variable_error' : 'groups.form.advanced.queue_integer_error');
  }

  protected setQueueType(channel: 'phone' | 'chat', value: unknown): void {
    if (value !== 'fixed' && value !== 'per_agent') return;
    const field = channel === 'phone' ? 'phoneQueue' : 'chatQueue';
    this.form.update(f => ({ ...f, [field]: { ...f[field], queueSizeType: value,
      queueSize: value === 'per_agent' && f[field].queueSizeType !== value ? 2 : f[field].queueSize } }));
  }

  /** De dónde sale cada mensaje de la cola de Teléfono: nada, la voz sintética o un .wav propio. */
  protected readonly audioSourceOptions = computed(() => {
    this.lang();
    return (['none', 'tts', 'file'] as const).map((value) => ({
      label: this.translate.instant(`groups.form.announcements.source_${value}`),
      value,
    }));
  });

  /** «Mensajes en cola» de Teléfono, aparte de la música: casi nunca se tocan, así que nacen plegados (DD-157). */
  protected readonly phoneMessagesOpen = signal(false);

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
      email: a.email,
      presenceStatus: a.presenceStatus,
      allowedChannels: a.allowedChannels,
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
      // parámetro: en el alta la sección abierta no vive en la dirección (DD-143).
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
    const seedLinks = clampLinksToChannels(this.linksStore.linksForGroup(group.id), group.channels, link => this.agentsStore.getAgent(link.agentId)?.allowedChannels);
    // La única vía de lectura: lo que el grupo no guardó sale de su juego de antes o de fábrica.
    const g = resolveGroup(group);
    this.form.set({
      name: g.name,
      phone: g.phone,
      priority: g.priority,
      // Lo borrado en Repositorios sale ANTES de marcar la ficha como guardada: ni se cuenta, ni se guarda de vuelta,
      // ni la ficha abre con cambios por ello (DD-164).
      typification: tipificacionViva(g.typification, this.tipificacionesStore.items()) ? g.typification! : null,
      scheduleIds: new Set(idsVivos(g.schedules ?? [], this.agendasStore.items())),
      templateIds: new Set(idsVivos(g.templates ?? [], this.templatesStore.templates())),
      labelIds: new Set(idsVivos(g.labels ?? [], this.labelsStore.labels())),
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
      chatSubStrategy: group.chatSubStrategy ?? CHAT_SUB_STRATEGIES[0]!,
      links: seedLinks,
    });
    this.initialChannels.set(new Set(group.channels));
    this.initialLinks.set(seedLinks);
    this.dirtyState.markPristine();
    this.releaseLock = this.crossTab.acquire('group', group.id, () =>
      this.conflictWarning.set(true),
    );
  }

  /** Cada sección en la dirección (`?seccion=agentes`): el índice enlaza a ellas, y al crear se abre la edición en
   *  la sección abierta (DD-143). */
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

  protected onChatSubStrategyChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('chatSubStrategy', value);
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
      contacts: [],
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
  protected setQueueNumber(channel: 'phone' | 'chat', key: 'queueSize' | 'maxQueueWaitSec' | 'serviceLevelSec' | 'transferSec', value: unknown): void {
    if (typeof value === 'number' && Number.isFinite(value)) this.setQueue(channel, key, value);
  }

  protected setChat<K extends keyof ChatSettings>(key: K, value: ChatSettings[K]): void {
    this.form.update((f) => ({ ...f, chat: { ...f.chat, [key]: value } }));
  }

  protected setInactivityMinutes(value: unknown): void {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 1) this.setChat('inactivityMinutes', value);
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
  protected setAdvancedNumber(key: 'wrapUpSec' | 'cardHeight', value: unknown): void {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) this.setAdvanced(key, value);
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

  /** El .wav elegido: de momento solo se guarda su nombre (demo). */
  protected onAudioFile(key: 'holdMusicFile' | 'queueIdFile' | 'nextInLineFile', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setAnnouncement(key, file.name);
    input.value = '';
  }

  /** Segundos de un aviso: un campo vaciado se queda en su valor anterior, como los de la cola. */
  protected setAnnouncementNumber(key: 'avgWaitSec', value: unknown): void {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) this.setAnnouncement(key, value);
  }

  /** Un mensaje periódico más: su .wav, cada 30 s hasta que se cambie. */
  protected onPeriodicFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setAnnouncement('periodicAnnouncements', [...this.form().announcements.periodicAnnouncements, { file: file.name, everySec: 30 }]);
    input.value = '';
  }

  protected setPeriodicFrequency(index: number, value: unknown): void {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 5) return;
    this.setAnnouncement(
      'periodicAnnouncements',
      this.form().announcements.periodicAnnouncements.map((a, i) => (i === index ? { ...a, everySec: value } : a)),
    );
  }

  protected removePeriodicAnnouncement(index: number): void {
    this.setAnnouncement('periodicAnnouncements', this.form().announcements.periodicAnnouncements.filter((_, i) => i !== index));
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
      return { ...f, channels: next, links: clampLinksToChannels(f.links, next, link => this.agentsStore.getAgent(link.agentId)?.allowedChannels) };
    });
  }

  /** La casilla madre: enciende o apaga los dos subcanales de una vez (patrón B12 del laboratorio). */
  protected toggleChatFamily(): void {
    this.form.update((f) => {
      const next = toggleChatFamily(f.channels) as Set<GroupChannel>;
      return { ...f, channels: next, links: clampLinksToChannels(f.links, next, link => this.agentsStore.getAgent(link.agentId)?.allowedChannels) };
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

  /** La dirección de cada sección a la que lleva el resumen, como la escribe el índice (DD-146). */
  protected readonly summaryHrefs = computed<Readonly<Record<GroupSummarySeccion, string>>>(() => ({
    agentes: this.sectionLinks.href(this.sectionUrl(RESUMEN_SECCIONES.agentes)),
    distribucion: this.sectionLinks.href(this.sectionUrl(RESUMEN_SECCIONES.distribucion)),
    recursos: this.sectionLinks.href(this.sectionUrl(RESUMEN_SECCIONES.recursos)),
  }));

  /**
   * Lo que se pulsa en el resumen lleva a su sitio (DD-146): su sección, como el índice (en el alta, sin tocar la
   * dirección y con General de puerta), y dentro de ella el bloque del canal o el campo del número. Llega cuando la
   * sección ya está pintada, arriba y con el foco en el título, o en el sitio.
   */
  protected irDesdeResumen(destino: GroupSummaryDestino): void {
    const id = RESUMEN_SECCIONES[destino.seccion];
    const ancla = destino.canal
      ? `group-channel-${destino.canal}-title`
      : destino.salida
        ? RESUMEN_NUMEROS[destino.salida]
        : null;
    const llegar = () => (ancla ? llegarAAncla(ancla, this.injector) : llegarASeccion(id, this.injector));
    if (this.activeSection() === id) {
      llegar();
      return;
    }
    void this.goTo(id).then((llego) => {
      if (llego && this.activeSection() === id) llegar();
    });
  }

  /** Lo que le llega de Repositorios: tipificación, agendas, plantillas de sus canales y etiquetas. */
  protected readonly resourceCount = computed(() => {
    const f = this.form();
    const templates = (this.hasChatFamily() ? this.chatTemplateValue().length : 0) + (this.hasEmail() ? this.emailTemplateValue().length : 0);
    // Las etiquetas cuentan solo si se ven (DD-142); la tipificación, si a su categoría le queda alguna (DD-164).
    const tipificacion = tipificacionViva(f.typification, this.tipificacionesStore.items()) ? 1 : 0;
    return tipificacion + f.scheduleIds.size + templates + (this.conEtiquetas ? f.labelIds.size : 0);
  });

  /** Lo que falta para poder crear, en el orden de la ficha. Un nombre repetido no falta: se dice en su campo. */
  protected readonly summaryMissing = computed<readonly string[]>(() => {
    const f = this.form();
    const missing: string[] = [];
    if (f.name.trim().length === 0) missing.push('common.summary_missing_name');
    if (f.channels.size === 0) missing.push('groups.form.summary.missing_channels');
    if (this.phoneMissing()) missing.push('groups.form.summary.missing_phone');
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
      // Por familia (DD-147): el agente atiende Chat, así que quitar WhatsApp con Web Chat puesto no le quita nada.
      const removed = removedFamilies(this.initialChannels(), this.form().channels);
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
        chatSubStrategy: f.chatSubStrategy,
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

  /** El nombre de una familia, para el aviso de cascada: «Chat», no «Web Chat, WhatsApp». */
  protected channelLabel(c: ChannelFamily): string {
    return this.translate.instant(FAMILY_LABEL_KEYS[c]);
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
      chatSubStrategy: CHAT_SUB_STRATEGIES[0]!,
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
    return clampLinksToChannels(links, this.form().channels, link => this.agentsStore.getAgent(link.agentId)?.allowedChannels)
      .map((l) => (l.groupId === groupId ? l : { ...l, groupId }));
  }
}
