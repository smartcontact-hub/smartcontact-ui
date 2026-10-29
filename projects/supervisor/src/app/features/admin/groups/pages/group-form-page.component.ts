import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, Injector, input, OnInit, signal, type TemplateRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router, type UrlTree } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { TipificacionArbolComponent } from '@features/admin/repositories/components/tipificacion-arbol/tipificacion-arbol.component';
import { ScCheckboxComponent as CheckboxComponent } from '@smartcontact-hub/components';
import { injectAlertModal } from '@core/services';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { BreadcrumbService, ResultadoAccionService, SectionLinksService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';
import {
  AltaPieComponent,
  ChannelIconComponent,
  NameInplaceComponent,
  ResourceOptionComponent,
  type FaltaDelResumen,
} from '@shared/components';
import { changedKeys, createFormDirtyState } from '@shared/utils/form-dirty-state';
import { nombreDeCopia } from '@shared/utils/copy-name';
import {
  ayudaDeObligatorio,
  dejoElCampo,
  firmaDe,
  llegarAAncla,
  llegarASeccion,
  ocasionDeAvisar,
  seccionesDeAlta,
  type AvisoDeFicha,
} from '@shared/utils/alta-secciones';
import {
  type FormNavSection,
  ScInputTextComponent as InputTextComponent,
  ScMultiSelectComponent as MultiSelectComponent,
  ScOptionCardsComponent as OptionCardsComponent,
  ScInputNumberComponent as InputNumberComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScFileUploadComponent as FileUploadComponent,
  ScTextareaComponent as TextareaComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
  ScCustomModalComponent as DialogComponent,
  ScSelectComponent as SelectComponent,
  ScInputTagsComponent as InputTagsComponent,
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
  duplicateGroupDraft,
  CHAT_SUB_STRATEGIES,
  GROUP_CHANNELS,
  Group,
  GroupChannel,
  GroupPriority,
  OUTBOUND_NUMBERS,
  PHONE_STRATEGIES,
  PHONE_STRATEGY_HELP_KEYS,
  PRIORITY_LABEL_KEYS,
  RING_ALL_ALLOWED_MAX,
  RING_ALL_OPTIONS,
  SUB_STRATEGIES,
  DEFAULT_ANNOUNCEMENTS,
  audioFileOf,
  type AudioFile,
  GroupAdvanced,
  GroupAnnouncements,
  VOICE_OPTIONS,
  WHATSAPP_NUMBERS,
  groupDurationOptions,
  validQueueSize,
  type ChannelQueue,
  type ChatQueueMessages,
  type ChatSettings,
  type ChatSubchannel,
  DEFAULT_CHAT_SETTINGS,
  DEFAULT_WRAP_UP,
  type GroupWrapUp,
  WRAP_UP_SCOPES,
  type WrapUpScope,
  DEFAULT_CHAT_STRATEGY,
  DEFAULT_EMAIL_STRATEGY,
  EMAIL_STRATEGIES,
  FAMILY_LABEL_KEYS,
  type ChannelFamily,
  resolveGroup,
} from '../data/groups-data';
import { GroupDefaultsStore } from '../state/group-defaults.store';
import { HorariosStore } from '@features/admin/repositories/state/horarios.store';
import { TipificacionesStore } from '@features/admin/repositories/state/tipificaciones.store';
import { AgendasStore } from '@features/admin/repositories/state/agendas.store';
import { TemplatesStore } from '@features/admin/templates/state/templates.store';
import type { TemplateType } from '@features/admin/templates/data/templates-data';
import { LabelsStore } from '@features/admin/labels/state/labels.store';
import { LabelFormPanelComponent, LabelFormSubmission } from '@features/admin/labels/components/label-form-panel/label-form-panel.component';
import { GroupsStore } from '../state/groups.store';

import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import { injectConfirmarBorrado } from '@features/admin/services/confirmar-borrado';
import { idsVivos } from '@features/admin/services/recursos.core.mjs';
import { ResourceRowsService } from '@features/admin/services/resource-rows.service';
import type { GroupAgentLink } from '@features/admin/services/group-agent-links.types';
import {
  channelRemovalImpact,
  clampLinksToChannels,
  diffLinks,
  fillEmptyLinks,
  hasChatFamily,
  removedFamilies,
  toggleChatFamily,
  toggleGroupChannel,
} from '@features/admin/services/group-channels.core.mjs';
import { DOCUMENT, LocationStrategy, NgTemplateOutlet } from '@angular/common';

import {
  AgentChannelTableAgent,
  AgentChannelTableComponent,
} from '../components/agent-channel-table/agent-channel-table.component';
import { GroupIdentityFieldsComponent } from '../components/group-identity-fields/group-identity-fields.component';
import {
  GroupSummaryComponent,
  type GroupSummaryDestino,
  type GroupSummaryOutbound,
  type GroupSummaryResources,
  type GroupSummaryRouting,
  type GroupSummarySeccion,
} from '../components/group-summary/group-summary.component';

interface FormState {
  name: string;
  phone: string;
  priority: GroupPriority;
  /** Lo que pide al agente al acabar: comentario y clasificación (revisión de tipificaciones del 2026-10-09). */
  wrapUp: GroupWrapUp;
  scheduleIds: ReadonlySet<number>;
  templateIds: ReadonlySet<number>;
  labelIds: ReadonlySet<number>;
  announcements: GroupAnnouncements;
  advanced: GroupAdvanced;
  /** La cola y los tiempos de cada canal (visión de producto de grupos, 2026-09-25). */
  phoneQueue: ChannelQueue;
  chatQueue: ChannelQueue;
  emailQueue: ChannelQueue;
  chat: ChatSettings;
  channels: ReadonlySet<GroupChannel>;
  strategy: string;
  subStrategy: string;
  ringAllAgents: number;
  chatStrategy: string;
  chatSubStrategy: string;
  emailStrategy: string;
  emailSubStrategy: string;
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
  emailQueue: 'group-section-distribution',
  emailStrategy: 'group-section-distribution',
  emailSubStrategy: 'group-section-distribution',
  chat: 'group-section-distribution',
  announcements: 'group-section-distribution',
  advanced: 'group-section-distribution',
  wrapUp: 'group-section-general',
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

/** Los campos de cada tipo de recurso, en Recursos (DD-217): a ellos lleva su fila del resumen. */
const RESUMEN_RECURSOS = { agendas: 'group-agendas', chat: 'group-templates-chat', email: 'group-templates-email' } as const;

/** Los canales con cola propia, y el campo de la ficha que la guarda. */
type QueueChannel = 'phone' | 'chat' | 'email';
const QUEUE_FIELD = { phone: 'phoneQueue', chat: 'chatQueue', email: 'emailQueue' } as const satisfies Record<QueueChannel, keyof FormState>;

/** Los audios de un solo archivo de la ficha. */
type AudioKey = 'holdMusicFile' | 'queueIdFile' | 'nextInLineFile' | 'outboundAudioFile';

@Component({
  selector: 'sc-group-form-page',
  imports: [
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
    InputTextComponent,
    MultiSelectComponent,
    ResourceOptionComponent,
    OptionCardsComponent,
    InputNumberComponent,
    SelectButtonComponent,
    FileUploadComponent,
    TextareaComponent,
    ToggleSwitchComponent,
    DialogComponent,
    LabelFormPanelComponent,
    InputTagsComponent,
    TooltipModule,
    TipificacionArbolComponent,
    AltaPieComponent,
    SelectComponent,
    TranslateModule,
  ],
  templateUrl: './group-form-page.component.html',
  styleUrl: './group-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupFormPageComponent implements DirtyAware, OnInit {
  private readonly injector = inject(Injector);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmarBorrado = injectConfirmarBorrado('groups.delete_dialog.title');
  private readonly document = inject(DOCUMENT);
  private readonly groupsStore = inject(GroupsStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly sectionLinks = inject(SectionLinksService);
  private readonly tipificacionesStore = inject(TipificacionesStore);
  private readonly agendasStore = inject(AgendasStore);
  private readonly horariosStore = inject(HorariosStore);
  private readonly templatesStore = inject(TemplatesStore);
  private readonly resourceRows = inject(ResourceRowsService);
  private readonly labelsStore = inject(LabelsStore);
  private readonly defaultsStore = inject(GroupDefaultsStore);
  private readonly alertModal = injectAlertModal();
  private readonly breadcrumbs = inject(BreadcrumbService);

  /**
   * La miga de la edición dice el nombre del grupo, el guardado («Administración › Grupos › Ventas», SISMAC-4058): el
   * que se teclea aún no es el del grupo. Al crear, «Nuevo grupo», de la ruta.
   */
  private readonly migaConNombre = effect(() =>
    this.breadcrumbs.nombrar(this.route, this.mode() === 'edit' ? (this.initial()?.name ?? null) : null),
  );
  private readonly sinMiga = inject(DestroyRef).onDestroy(() => this.breadcrumbs.nombrar(this.route, null));

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
  protected readonly phoneStrategyOptions = PHONE_STRATEGIES.map((s) => ({ label: s, value: s }));
  protected readonly chatStrategies = CHAT_STRATEGIES;
  protected readonly emailStrategyOptions = EMAIL_STRATEGIES.map((s) => ({ label: s, value: s }));
  protected readonly chatSubStrategies = CHAT_SUB_STRATEGIES;
  protected readonly levelFamilies = computed<readonly ('phone' | 'chat' | 'email')[]>(() => [
    ...(this.isNiveles() ? ['phone' as const] : []),
    ...(this.hasChatFamily() && this.form().chatStrategy === 'Niveles' ? ['chat' as const] : []),
    ...(this.isEmailNiveles() ? ['email' as const] : []),
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
  protected readonly navSections = computed<readonly FormNavSection[]>(() => {
    // «Revisada» y no «Listo» donde no hay nada que cumplir: Recursos y Agentes, y Distribución sin ningún canal. Solo en el
    // alta: al editar nada se «revisa», todo está guardado.
    const alta = this.mode() === 'create';
    const sinCanales = this.form().channels.size === 0;
    return [
      { id: 'group-section-general', labelKey: 'groups.form.section.general', icon: 'tune' },
      { id: 'group-section-distribution', labelKey: 'groups.form.section.distribution', icon: 'alt_route', optional: alta && sinCanales },
      // Lo que se le asigna desde Repositorios, como «Recursos» en la ficha de agente.
      { id: 'group-section-resources', labelKey: 'groups.form.section.resources', icon: 'library_books', optional: alta },
      { id: 'group-section-agents', labelKey: 'groups.form.section.agents', icon: 'headphones', optional: alta },
    ].map((s) => ({ ...s, href: this.sectionLinks.href(this.sectionUrl(s.id)) }));
  });

  /**
   * EL ALTA, CON EL ÍNDICE DE LA EDICIÓN (DD-143): las mismas cuatro secciones, con ✓ en las que se dejan completas y
   * «Atrás / Siguiente» al pie. Se navega libre (DD-217: fuera la puerta de General de DD-121 y la de Distribución de
   * DD-158). La sección abierta no toca la dirección.
   */
  protected readonly alta = seccionesDeAlta({
    secciones: this.navSections,
    // ✓ en toda sección que se deja completa (DD-211 §6): Recursos y Agentes, con solo pasar; General y Distribución
    // (su teléfono saliente, si tiene Teléfono), con lo suyo.
    completa: (id) =>
      id === 'group-section-general' ? this.generalValid() : id !== 'group-section-distribution' || (!this.phoneMissing() && !this.whatsappMissing() && !this.queueInvalid()),
    // Lo que General decide de las demás: sus bloques de canal, sus plantillas y sus columnas. Si cambian los canales
    // desde que se dejó una sección, su ✓ se va (DD-217).
    firma: (id) => (id === 'group-section-general' ? '' : firmaDe(this.form().channels)),
  });

  /**
   * `?seccion=` de la dirección, que el router pasa a este input (`withComponentInputBinding`) en cada
   * navegación, también cuando solo cambia la query: cada fila del índice es un ENLACE (DD-122), y
   * Atrás o un enlace compartido llevan a su sección.
   */
  readonly seccion = input<string | undefined>();

  /**
   * La sección a la vista: en el alta, la abierta (DD-143); al editar, la de la dirección. Sin `?seccion=`, General:
   * abre en General en los dos modos, es la que decide lo demás.
   */
  protected readonly activeSection = computed<string>(() =>
    this.mode() === 'create'
      ? this.alta.abierta()
      : (GroupFormPageComponent.SECTION_SLUGS[this.seccion() ?? ''] ?? 'group-section-general'),
  );

  /** Se pinta la sección elegida en el índice, y solo esa. */
  protected showSection(id: string): boolean {
    return id === this.activeSection();
  }

  /** Alta o edición: la MISMA ficha (DD-121). El alta no tiene id hasta que se crea. */
  protected readonly mode = computed<'create' | 'edit'>(() => (this.editingId() === null ? 'create' : 'edit'));

  /**
   * General completa: nombre, que no se repita, y la tipificación si se tipifica. Los canales no son obligatorios
   * (DD-217): hay clientes con grupos sin canal, para agrupar a sus agentes.
   */
  protected readonly generalValid = computed(() => {
    const f = this.form();
    return f.name.trim().length > 0 && !this.typificationMissing();
  });

  /** «Clasificar llamadas» encendido sin tipificación elegida: falta la tipificación. */
  protected readonly typificationMissing = computed(
    () => this.form().wrapUp.classify && !this.sinTipificaciones() && this.form().wrapUp.typificationId === null,
  );
  /** Sin tipificaciones en Repositorios, «Tipificar conversaciones» está apagado y no se enciende (SISMAC-4058). */
  protected readonly sinTipificaciones = computed(() => this.tipificacionesStore.items().length === 0);

  /** Se tipifica de verdad: encendido y con tipificaciones que elegir. */
  protected readonly tipifica = computed(() => this.form().wrapUp.classify && !this.sinTipificaciones());

  /**
   * Hay algo que pedir al acabar: comentarios o tipificación. Con cualquiera de los dos sale «En qué conversaciones», que
   * vale para los dos (SISMAC-4058, DD-223).
   */
  protected readonly conPostconversacion = computed(() => this.form().wrapUp.comments || this.tipifica());

  /**
   * LO OBLIGATORIO, en el orden de la ficha: el nombre; la tipificación, con «Tipificar conversaciones» encendido; y el
   * teléfono saliente, con Teléfono. Cada uno con su sección, el campo al que se llega, su aviso y cómo se nombra en
   * «Falta: …» del resumen. De aquí salen el botón apagado, el aviso gris o rojo de cada campo, el índice y el resumen:
   * una sola lista, así no pueden decir cosas distintas (DD-219).
   */
  private readonly obligatorios = computed(() => {
    const f = this.form();
    return [
      { clave: 'name', falta: !f.name.trim(), seccion: 'group-section-general', ancla: 'group-name',
        aviso: 'groups.errors.name_required', etiqueta: 'common.summary_missing_name' },
      { clave: 'typification', falta: this.typificationMissing(), seccion: 'group-section-general', ancla: 'group-typification',
        aviso: 'groups.errors.typification_required', etiqueta: 'groups.form.summary.missing_typification' },
      { clave: 'phone', falta: this.phoneMissing(), seccion: 'group-section-distribution', ancla: 'group-phone',
        aviso: 'groups.errors.phone_required', etiqueta: 'groups.form.summary.missing_phone' },
      { clave: 'whatsapp', falta: this.whatsappMissing(), seccion: 'group-section-distribution', ancla: 'group-chat-whatsapp',
        aviso: 'groups.errors.whatsapp_required', etiqueta: 'groups.form.summary.missing_whatsapp' },
    ] as const;
  });

  /** Lo obligatorio que falta ahora, por clave: de aquí sale cuándo se dice en rojo (`ocasion`). */
  private readonly faltas = computed<readonly string[]>(() => this.obligatorios().filter((o) => o.falta).map((o) => o.clave));

  /**
   * Cuándo se dice en rojo lo que falta (DD-219): al dejar su campo vacío, o desde que se abre si lo guardado ya venía
   * sin ello (DD-142). Antes, en gris bajo el campo (`ayudaDe`).
   */
  private readonly ocasion = ocasionDeAvisar({
    editando: () => this.mode() === 'edit',
    cambios: () => this.dirtyState.dirty(),
    faltas: () => this.faltas(),
  });

  /** La clave del aviso rojo de un obligatorio: falta y ya se dice (DD-219). */
  private errorDe(clave: string): string | null {
    const o = this.obligatorios().find((x) => x.clave === clave);
    return o?.falta && this.ocasion.acusa(clave) ? o.aviso : null;
  }

  /** El aviso gris de un obligatorio que falta y aún no se dice en rojo, con la ayuda propia del campo detrás. */
  protected ayudaDe(clave: string, ayuda?: string): string | undefined {
    this.lang();
    const o = this.obligatorios().find((x) => x.clave === clave);
    const gris = o?.falta && !this.ocasion.acusa(clave) ? this.translate.instant(o.aviso) : null;
    return ayudaDeObligatorio(gris, ayuda ? this.translate.instant(ayuda) : undefined);
  }

  /** Se dejó el campo de un obligatorio: si sigue vacío, desde ahora en rojo. No al abrir su lista para elegir. */
  protected dejar(event: FocusEvent, clave: string): void {
    if (dejoElCampo(event) && this.faltas().includes(clave)) this.ocasion.tocar(clave);
  }

  /** El aviso rojo de la tipificación: encendida sin elegir y ya dicha (DD-219). */
  protected readonly typificationError = computed(() => this.errorDe('typification') !== null);

  /**
   * Con Teléfono, el teléfono saliente es obligatorio, como el nombre (DD-142): es el número que ven los clientes
   * cuando llama un agente del grupo. Sin Teléfono no se pide.
   */
  protected readonly phoneMissing = computed(() => this.hasPhone() && this.form().phone.trim().length === 0);

  /** El aviso rojo bajo el teléfono saliente (DD-219). */
  protected readonly phoneError = computed<string | null>(() => this.errorDe('phone'));

  /** Con WhatsApp, su número es obligatorio, como el teléfono saliente con Teléfono: sin él no tiene de dónde escribir. */
  protected readonly whatsappMissing = computed(() => this.hasWhatsApp() && this.form().advanced.whatsappNumber.trim().length === 0);

  /** El aviso rojo bajo el número de WhatsApp. */
  protected readonly whatsappError = computed<string | null>(() => this.errorDe('whatsapp'));

  /** «Falta: …» del resumen, con cada cosa llevando a su campo (DD-219). Un nombre repetido no falta: va en su campo. */
  protected readonly summaryMissing = computed<readonly FaltaDelResumen[]>(() => {
    this.lang();
    return this.obligatorios()
      .filter((o) => o.falta)
      .map((o) => ({ etiqueta: this.translate.instant(o.etiqueta), seccion: o.seccion, ancla: o.ancla }));
  });

  /** La primera cola con un tamaño que no vale, para llevar a su campo. */
  private readonly colaMal = computed<QueueChannel | null>(() => {
    const f = this.form();
    if (this.hasPhone() && !validQueueSize(f.phoneQueue)) return 'phone';
    if (this.hasChatFamily() && !validQueueSize(f.chatQueue)) return 'chat';
    if (this.hasEmail() && !validQueueSize(f.emailQueue)) return 'email';
    return null;
  });

  /**
   * Los avisos del índice, en el orden de la ficha (DD-219): lo que falta, solo si lo guardado ya venía sin ello o se
   * pulsó con ello pendiente (lo que se toca se dice bajo su campo, donde se mira), y lo que está mal escrito, en vivo
   * (una cola imposible). De aquí salen el punto del índice, lo que dice cada sección en él y
   * adónde lleva pulsar con algo pendiente.
   */
  private readonly avisos = computed<readonly AvisoDeFicha[]>(() => {
    this.lang();
    const t = (key: string) => this.translate.instant(key);
    const out: AvisoDeFicha[] = [];
    for (const o of this.obligatorios()) {
      if (o.falta && this.ocasion.acusaEnIndice(o.clave)) {
        out.push({ seccion: o.seccion, texto: t(o.aviso), ancla: o.ancla });
      }
    }
    const cola = this.colaMal();
    if (cola) {
      out.push({ seccion: 'group-section-distribution', texto: t('groups.form.advanced.queue_invalid'), ancla: `group-${cola}-queue-size` });
    }
    return out;
  });

  /** El punto rojo del índice: la sección tiene un aviso a la vista. En el alta, la que se dejó con algo por hacer. */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() =>
    this.mode() === 'create'
      ? new Set([...this.alta.estados()].filter(([, estado]) => estado === 'error').map(([id]) => id))
      : new Set(this.avisos().map((a) => a.seccion)),
  );

  /**
   * Lo que dice cada sección en el índice, en texto: TODO lo que le falta. En el alta, de todas (en gris hasta que se
   * deja la sección); al editar, solo de las que tienen un aviso a la vista (DD-219).
   */
  protected readonly sectionErrorHints = computed<Readonly<Record<string, string>>>(() => {
    const todas = this.faltasPorSeccion();
    if (this.mode() === 'create') return todas;
    const conAviso = this.sectionsWithErrors();
    return Object.fromEntries(Object.entries(todas).filter(([id]) => conAviso.has(id)));
  });

  /**
   * El marcador de cada sección, solo en el alta (el recorrido: pendiente, nuevo, actual, hecha, error). Al editar todo
   * está guardado: el índice va como siempre, sin marcadores, con el punto rojo y lo que falta bajo la sección.
   */
  protected readonly sectionStates = computed<ReadonlyMap<string, 'pendiente' | 'nuevo' | 'actual' | 'hecha' | 'error'> | null>(() =>
    this.mode() === 'create' ? this.alta.estados() : null,
  );

  /**
   * Lo que falta en cada sección, entero y en una línea para el índice del alta: «Nombre, tipificación», sin «Falta:» (el
   * rojo y el marcador ya lo dicen). Es el feedback del alta: vive en el índice, que es donde se mira al tocar canales y secciones, y ya no sobre el resumen. Un nombre repetido o una cola imposible, que no son «falta», entran con su aviso.
   */
  private readonly faltasPorSeccion = computed<Readonly<Record<string, string>>>(() => {
    this.lang();
    const t = (key: string) => this.translate.instant(key);
    const por: Record<string, string[]> = {};
    for (const o of this.obligatorios()) {
      // En el índice, el nombre más corto: «WhatsApp», no «número de WhatsApp» (la fila mide ~160 px de texto).
      if (o.falta) (por[o.seccion] ??= []).push(t(o.clave === 'whatsapp' ? 'groups.form.summary.missing_whatsapp_short' : o.etiqueta));
    }
    if (this.colaMal()) (por['group-section-distribution'] ??= []).push(t('groups.form.advanced.queue_invalid'));
    const out: Record<string, string> = {};
    for (const [id, items] of Object.entries(por)) out[id] = items.join(', ').replace(/^./, (c) => c.toUpperCase());
    return out;
  });

  /**
   * Las secciones con cambios sin guardar: su marca en el índice (DD-122). La ficha tiene un solo
   * «Guardar», y el índice dice dónde está lo que se va a guardar. Solo al editar: en el alta todo está
   * por guardar. Un cambio puede cruzar secciones —quitar un canal en General recorta, al guardar, los
   * canales de los agentes— y entonces se marcan las dos.
   */
  protected readonly sectionsWithChanges = computed<ReadonlySet<string>>(() => {
    if (this.mode() !== 'edit') return new Set();
    const out = new Set<string>();
    if (diffLinks(this.initialLinks(), this.linksVistos()).total > 0) out.add('group-section-agents');
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

  /** El aviso rojo bajo el nombre: vacío, al dejarlo así (DD-219). */
  protected readonly nameError = computed<string | null>(() => {
    return this.errorDe('name');
  });

  /**
   * Ir a otra sección, libre en los dos modos (DD-217). En el alta, la sección se abre sin tocar la dirección: Atrás
   * sale del alta (DD-122, DD-143).
   *
   * Dice si llegó: al editar, cuando acaba la navegación; en el alta, en el acto (el resumen espera a ese momento
   * para llevar a un sitio dentro de la sección).
   */
  protected goTo(id: string): Promise<boolean> {
    if (this.mode() === 'create') {
      // Dejar una sección con algo obligatorio vacío es dejarla en rojo: al volver, sus campos lo dicen en rojo, no en gris.
      const dejada = this.alta.abierta();
      if (id !== dejada) {
        // Con algo vacío, TODOS los obligatorios de la sección pasan a decirlo en rojo, también los que se enciendan luego.
        const propios = this.obligatorios().filter((o) => o.seccion === dejada);
        if (propios.some((o) => o.falta)) for (const o of propios) this.ocasion.tocar(o.clave);
      }
      this.alta.abrir(id);
      return Promise.resolve(true);
    }
    return this.sectionLinks.go(this.sectionUrl(id));
  }

  /** Lleva a un campo de la ficha: a su sección, y en ella al campo, arriba y con el foco. */
  private irACampo(seccion: string, ancla: string | null): void {
    const llegar = () => (ancla ? llegarAAncla(ancla, this.injector) : llegarASeccion(seccion, this.injector));
    if (this.activeSection() === seccion) {
      llegar();
      return;
    }
    void this.goTo(seccion).then((llego) => {
      if (llego && this.activeSection() === seccion) llegar();
    });
  }

  /** «Siguiente» y «Atrás» del alta: la sección de al lado, arriba y con el foco en su título. */
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

  protected readonly editingId = signal<number | null>(null);
  protected readonly initial = signal<Group | null>(null);
  protected readonly form = signal<FormState>(this.emptyForm());
  /*
   * R6 · una sola política de error (DD-219). Un error de CONTENIDO (una cola imposible) se dice en
   * vivo, en su campo. Lo que FALTA no es un error mientras se rellena: va en gris bajo su campo desde el principio y en
   * rojo al dejarlo vacío, y «Falta: …» del resumen lo dice entero, con cada cosa llevando a su campo. «Crear» y
   * «Guardar» se apagan mientras falte algo, y su tooltip dice qué (`motivoApagado`).
   */
  protected readonly saving = signal(false);

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
  /** «Copiar» pasa a «Copiado» dos segundos, como Primer (DD-191). */

  protected readonly queueInvalid = computed(() =>
    (this.hasPhone() && !validQueueSize(this.form().phoneQueue)) ||
    (this.hasChatFamily() && !validQueueSize(this.form().chatQueue)) ||
    (this.hasEmail() && !validQueueSize(this.form().emailQueue)));

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

  /**
   * El botón se puede pulsar sin nada pendiente: en el alta, en cuanto está lo obligatorio; al editar, además, con
   * cambios (se apaga otra vez si deshaces). Como pide SISMAC-4058 (DD-219).
   */
  protected readonly canSave = computed(() => !this.pendiente() && (this.mode() === 'create' || this.dirtyState.dirty()));

  /** Hay algo que no deja crear ni guardar: lo que falta o lo que está mal escrito. */
  private readonly pendiente = computed(() => this.faltas().length > 0 || this.queueInvalid());

  /**
   * Por qué está apagado el botón, para su tooltip: lo que falta («Falta: nombre, teléfono saliente»), lo primero mal
   * escrito o, al editar sin cambios, «No hay cambios que guardar» (DD-212). Vacío si se puede pulsar.
   */
  protected readonly motivoApagado = computed(() => {
    this.lang();
    if (this.canSave()) return '';
    const falta = this.summaryMissing();
    if (falta.length > 0) {
      return this.translate.instant('common.summary_missing', { items: falta.map((f) => f.etiqueta).join(', ') });
    }
    const mal = this.avisos()[0];
    return mal ? mal.texto : this.translate.instant('common.no_changes');
  });

  /* Chat es la MADRE de Web Chat y WhatsApp (visión de producto de grupos, 2026-09-25): comparten
   * estrategia y bloque en Distribución. Las claves no cambian: `chat` es Web Chat. */
  protected readonly hasChatFamily = computed(() => hasChatFamily(this.form().channels));
  protected readonly hasWebChat = computed(() => this.form().channels.has('chat'));
  protected readonly hasWhatsApp = computed(() => this.form().channels.has('whatsapp'));
  protected readonly hasPhone = computed(() => this.form().channels.has('phone'));
  /** Los mensajes de un subcanal, por su sitio en la ficha: el inicial y el final, y los dos que dependen del horario
   *  (solo con uno elegido). */
  protected readonly chatMessageGroups: Readonly<Record<'frame' | 'schedule', readonly { key: keyof ChatQueueMessages; labelKey: string; placeholderKey: string }[]>> = {
    frame: [
      { key: 'initial', labelKey: 'groups.form.chat.message_initial', placeholderKey: 'groups.form.chat.message_initial_placeholder' },
      { key: 'final', labelKey: 'groups.form.chat.message_final', placeholderKey: 'groups.form.chat.message_final_placeholder' },
    ],
    schedule: [
      { key: 'outOfSchedule', labelKey: 'groups.form.chat.message_schedule', placeholderKey: 'groups.form.chat.message_schedule_placeholder' },
      { key: 'nonWorkingDay', labelKey: 'groups.form.chat.message_non_working_day', placeholderKey: 'groups.form.chat.message_non_working_day_placeholder' },
    ],
  };
  protected chatMessageSet(set: 'frame' | 'schedule') {
    return this.chatMessageGroups[set];
  }
  protected chatMessage(sub: ChatSubchannel, key: keyof ChatQueueMessages): string {
    return this.form().chat.queueMessages[sub][key];
  }
  protected attendanceSchedule(sub: ChatSubchannel): number | null {
    return this.form().chat.attendanceScheduleIds?.[sub] ?? null;
  }
  /** Los números de WhatsApp de la cuenta, más el que ya tuviera guardado el grupo, y «Sin número» para quitarlo. */
  protected readonly whatsappOptions = computed(() => {
    this.lang();
    const numbers = new Set(WHATSAPP_NUMBERS);
    const current = this.form().advanced.whatsappNumber;
    if (current) numbers.add(current);
    return [{ label: this.translate.instant('groups.form.summary.no_number'), value: '' }, ...[...numbers].map((n) => ({ label: n, value: n }))];
  });
  protected setWhatsappNumber(value: unknown): void {
    this.setAdvanced('whatsappNumber', typeof value === 'string' ? value : '');
  }
  /** Los subcanales de Chat que el grupo tiene, para la cabecera de su bloque: «Web Chat · WhatsApp». */
  protected readonly chatSubchannelLabels = computed(() => {
    this.lang();
    const subchannels: readonly GroupChannel[] = ['chat', 'whatsapp'];
    return subchannels
      .filter((c) => this.form().channels.has(c))
      .map((c) => this.translate.instant(this.channelKeys[c]))
      .join(', ');
  });
  /** La casilla madre: marcada con los dos subcanales, a medias con uno. */
  protected readonly chatFamilyState = computed(() =>
    triStateOf([this.hasWebChat(), this.hasWhatsApp()].filter(Boolean).length, 2),
  );
  protected readonly isNiveles = computed(() => this.hasPhone() && this.form().strategy === 'Niveles');
  protected readonly isRingAll = computed(() => this.hasPhone() && this.form().strategy === 'Ring All');

  /** Qué hace la estrategia de teléfono elegida, en una línea bajo el campo (DD-133): `PHONE_STRATEGY_HELP_KEYS`,
   *  compartida con el selector rápido del resumen. */
  protected readonly strategyHelpKey = computed<string | null>(() => PHONE_STRATEGY_HELP_KEYS[this.form().strategy] ?? null);
  /** Email, con las mismas estrategias y la misma ayuda que Teléfono (Voice). */
  protected readonly isEmailNiveles = computed(() => this.hasEmail() && this.form().emailStrategy === 'Niveles');
  protected readonly emailStrategyHelpKey = computed<string | null>(() => PHONE_STRATEGY_HELP_KEYS[this.form().emailStrategy] ?? null);

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

  /**
   * Agendas y Plantillas de Recursos fuera de la ficha de grupo (DD-239): se asignan solo a agentes y asignar a un grupo
   * queda a futuro. El bloque «Repositorios» se queda hecho y apagado por si vuelve, y el grupo conserva las agendas y
   * plantillas que tenía (se leen y se guardan tal cual). Encenderlo es poner esto a `true`.
   */
  protected readonly conRecursosDeRepositorio: boolean = false;

  /* ── La tipificación del grupo, en General (revisión de tipificaciones del 2026-10-09) ── */

  /** Las tipificaciones de Repositorios, por su nombre: se elige UNA. */
  protected readonly typificationOptions = computed(() =>
    [...this.tipificacionesStore.items()]
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map((t) => ({ label: t.name, value: t.id })),
  );

  /** La elegida, si sigue existiendo en Repositorios: su árbol es lo que se ve al pulsar «Ver». */
  protected readonly typification = computed(() => {
    const id = this.form().wrapUp.typificationId;
    return id === null ? null : (this.tipificacionesStore.items().find((t) => t.id === id) ?? null);
  });

  /** El diálogo con lo que tiene la tipificación elegida. */
  protected readonly viendoTipificacion = signal(false);

  /** Todas, solo las entrantes o solo las salientes. */
  protected readonly wrapUpScopeOptions = computed(() => {
    this.lang();
    return WRAP_UP_SCOPES.map((value) => ({ value, label: this.translate.instant(`groups.form.wrapup.scope.${value}`) }));
  });

  protected setWrapUp<K extends keyof GroupWrapUp>(key: K, value: GroupWrapUp[K]): void {
    this.form.update((f) => ({ ...f, wrapUp: { ...f.wrapUp, [key]: value } }));
  }

  protected onTypificationChange(value: unknown): void {
    this.setWrapUp('typificationId', typeof value === 'number' ? value : null);
  }

  protected onWrapUpScopeChange(value: unknown): void {
    if ((WRAP_UP_SCOPES as readonly unknown[]).includes(value)) this.setWrapUp('scope', value as WrapUpScope);
  }

  /** Las agendas de `Repositorios > Agendas`, todas (una agenda ya no es activa ni inactiva), con lo que contiene cada
   *  una para el tooltip de su opción (DD-217). */
  protected readonly scheduleOptions = computed(() => this.resourceRows.opcionesDeAgendas());
  protected readonly scheduleValue = computed(() => [...this.form().scheduleIds]);
  protected readonly labelOptions = computed(() => this.labelsStore.labels().map((l) => ({ label: l.name, value: l.id })));
  protected readonly labelValue = computed(() => [...this.form().labelIds]);
  private templatesOf(type: TemplateType) {
    return this.templatesStore.templates().filter((t) => t.type === type);
  }
  protected readonly chatTemplateOptions = computed(() => this.resourceRows.opcionesDePlantillas('chat'));
  protected readonly emailTemplateOptions = computed(() => this.resourceRows.opcionesDePlantillas('email'));
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

  protected durationOptions(value: number) {
    this.lang();
    return groupDurationOptions(value, this.translate.currentLang || 'es');
  }

  protected queueSizeError(queue: ChannelQueue): string | undefined {
    return validQueueSize(queue) ? undefined : this.translate.instant(queue.queueSizeType === 'per_agent'
      ? 'groups.form.advanced.queue_variable_error' : 'groups.form.advanced.queue_integer_error');
  }

  protected setQueueType(channel: QueueChannel, value: unknown): void {
    if (value !== 'fixed' && value !== 'per_agent') return;
    const field = QUEUE_FIELD[channel];
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
    { label: this.translate.instant('groups.form.advanced.queue_fixed'), value: 'fixed', description: this.translate.instant('groups.form.advanced.queue_fixed_desc') },
    { label: this.translate.instant('groups.form.advanced.queue_per_agent'), value: 'per_agent', description: this.translate.instant('groups.form.advanced.queue_per_agent_desc') },
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
    if (this.isRingAll()) return `${f.strategy}, ${this.translate.instant('groups.form.fields.ring_all_summary', { count: f.ringAllAgents })}`;
    if (this.isNiveles()) return `${f.strategy}, ${f.subStrategy}`;
    return f.strategy;
  }

  /** Roster passed to the channel table — every agent in the system. */
  protected readonly availableAgents = computed<readonly AgentChannelTableAgent[]>(() =>
    this.agentsStore.agents().map((a) => ({
      id: a.id,
      name: a.name,
      photo: a.photo,
      email: a.email,
      allowedChannels: a.allowedChannels,
      selfActivate: a.permissions.selfActivate,
    })),
  );

  /** The form's group channels expressed as an array (for the table input). */
  protected readonly formGroupChannels = computed<readonly GroupChannel[]>(() =>
    GROUP_CHANNELS.filter((c) => this.form().channels.has(c)),
  );

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      // ALTA: la ficha vacía, con los valores por defecto de Grupos y Teléfono marcado (`emptyForm`). Abre en
      // General aunque la dirección pida otra sección, y se quita el parámetro: en el alta la sección abierta no vive
      // en la dirección (DD-143). El duplicado conserva su `seedFromId`.
      if (this.route.snapshot.queryParamMap.has('seccion')) {
        void this.sectionLinks.go(this.sectionUrl('group-section-general'), { replace: true });
      }
      // DUPLICAR es un alta rellena (SISMAC-4056), como la de un agente: «Online Support (1)» y todo lo del original,
      // agentes incluidos, salvo lo que no se copia (`duplicateGroupDraft`). El grupo no existe hasta «Crear grupo»; la
      // copia es el punto de partida: «Deshacer» vuelve a ella y salir sin tocar nada no pregunta.
      const seedFromId = this.route.snapshot.queryParamMap.get('seedFromId');
      if (seedFromId) {
        const source = this.groupsStore.getGroup(Number(seedFromId));
        if (!source) {
          void this.router.navigateByUrl('/admin/grupos', { replaceUrl: true });
          return;
        }
        const nombre = nombreDeCopia(source.name, this.groupsStore.groups().map((g) => g.name));
        const copia: Group = { ...duplicateGroupDraft(source, nombre), id: 0, code: '' };
        const links = this.linksDe(source).map((l) => ({ ...l, groupId: 0 }));
        this.cargar(copia, links);
        return;
      }
      this.dirtyState.markPristine();
      return;
    }
    const group = this.groupsStore.getGroup(Number(idParam));
    if (!group) {
      void this.router.navigateByUrl('/admin/grupos', { replaceUrl: true });
      return;
    }
    this.editingId.set(group.id);
    this.initial.set(group);
    this.cargar(group, this.linksDe(group));
  }

  /* Cada agente, con los canales que el grupo OFRECE: un enlace puede traer uno que el grupo ya no tiene
   * (datos de antes: en el seed, un Web Chat en un grupo solo de Teléfono). Sin recortarlo al leer, ese
   * canal fantasma revivía en cuanto el grupo volvía a ofrecerlo, y la confirmación de quitar canales
   * contaba mal a quién saca del grupo. */
  private linksDe(group: Group): readonly GroupAgentLink[] {
    return clampLinksToChannels(this.linksStore.linksForGroup(group.id), group.channels, link => this.agentsStore.getAgent(link.agentId)?.allowedChannels);
  }

  /** La ficha de un grupo (el que se edita o la copia de un duplicado), marcada como su punto de partida. */
  private cargar(group: Group, seedLinks: readonly GroupAgentLink[]): void {
    // La única vía de lectura: lo que el grupo no guardó sale de su juego de antes o de fábrica.
    const g = resolveGroup(group);
    this.form.set({
      name: g.name,
      phone: g.phone,
      priority: g.priority,
      // Lo borrado en Repositorios sale ANTES de marcar la ficha como guardada: ni se cuenta, ni se guarda de vuelta,
      // ni la ficha abre con cambios por ello (DD-164). Una tipificación borrada deja el grupo sin ella.
      wrapUp: this.tipificacionesStore.items().some((t) => t.id === g.wrapUp.typificationId)
        ? g.wrapUp
        : { ...g.wrapUp, typificationId: null, classify: false },
      scheduleIds: new Set(idsVivos(g.schedules ?? [], this.agendasStore.items())),
      templateIds: new Set(idsVivos(g.templates ?? [], this.templatesStore.templates())),
      labelIds: new Set(idsVivos(g.labels ?? [], this.labelsStore.labels())),
      announcements: {
        ...g.announcements,
        holdMusicFile: audioFileOf(g.announcements.holdMusicFile),
        queueIdFile: audioFileOf(g.announcements.queueIdFile),
        nextInLineFile: audioFileOf(g.announcements.nextInLineFile),
        outboundAudioFile: audioFileOf(g.announcements.outboundAudioFile),
      },
      advanced: g.advanced,
      phoneQueue: g.phoneQueue,
      chatQueue: g.chatQueue,
      emailQueue: g.emailQueue,
      chat: g.chat,
      channels: new Set(group.channels),
      strategy: group.strategy,
      subStrategy: group.subStrategy ?? SUB_STRATEGIES[0]!,
      // Lo guardado con más de lo permitido (antes de la revisión del 2026-10-15) se abre con lo permitido.
      ringAllAgents: Math.min(group.ringAllAgents ?? RING_ALL_OPTIONS[0]!, RING_ALL_ALLOWED_MAX),
      chatStrategy: group.chatStrategy ?? DEFAULT_CHAT_STRATEGY,
      chatSubStrategy: group.chatSubStrategy ?? CHAT_SUB_STRATEGIES[0]!,
      emailStrategy: group.emailStrategy ?? DEFAULT_EMAIL_STRATEGY,
      emailSubStrategy: group.emailSubStrategy ?? SUB_STRATEGIES[0]!,
      links: seedLinks,
    });
    this.initialChannels.set(new Set(group.channels));
    this.initialLinks.set(seedLinks);
    this.dirtyState.markPristine();
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


  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.formDirty() && !this.saving()) event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
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

  protected onEmailStrategyValueChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('emailStrategy', value);
  }

  protected onEmailSubStrategyChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('emailSubStrategy', value);
  }

  /** Etiquetas (apagado por DD-142): su ventana propia, como antes. */
  protected readonly creatingLabel = signal(false);
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
  protected setQueue<K extends keyof ChannelQueue>(channel: QueueChannel, key: K, value: ChannelQueue[K]): void {
    const field = QUEUE_FIELD[channel];
    this.form.update((f) => ({ ...f, [field]: { ...f[field], [key]: value } }));
  }

  /** Números de la cola: como los de Avanzado, un campo vaciado se queda en su valor anterior. */
  protected setQueueNumber(channel: QueueChannel, key: 'queueSize' | 'maxQueueWaitSec' | 'serviceLevelSec' | 'transferSec', value: unknown): void {
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
   *  cualquiera lo copie. `sc-inputtags` los añade y los quita (DD-195); aquí se guardan en minúsculas, sin repetir y
   *  uno por etiqueta: un dominio no lleva comas ni espacios, así que «a.com, b.com» con Enter son dos. */
  protected setDomains(domains: readonly string[]): void {
    const limpios = [...new Set(domains.flatMap((d) => d.toLowerCase().split(/[\s,]+/)).filter(Boolean))];
    this.setAdvanced('allowedDomains', limpios);
  }

  /** El audio elegido: su nombre y su tamaño (demo: el archivo no se sube a ningún sitio). */
  protected onAudioFile(key: AudioKey, files: readonly File[]): void {
    const file = files[0];
    if (file) this.setAnnouncement(key, { name: file.name, size: file.size });
  }

  /** Lo guardado de cada audio, para la lista del uploader. La misma lista mientras no cambie: el uploader la pinta
   *  cada vez que le llega una nueva. */
  private audioGuardado(key: AudioKey) {
    return computed<readonly AudioFile[]>(
      () => {
        const audio = this.form().announcements[key];
        return audio ? [audio] : [];
      },
      { equal: (a, b) => a.length === b.length && a.every((x, i) => x.name === b[i]!.name && x.size === b[i]!.size) },
    );
  }
  private readonly audiosGuardados: Readonly<Record<AudioKey, () => readonly AudioFile[]>> = {
    holdMusicFile: this.audioGuardado('holdMusicFile'),
    queueIdFile: this.audioGuardado('queueIdFile'),
    nextInLineFile: this.audioGuardado('nextInLineFile'),
    outboundAudioFile: this.audioGuardado('outboundAudioFile'),
  };
  /** Para la plantilla, que pasa la clave como texto. */
  protected audioGuardadoDe(key: string): readonly AudioFile[] {
    return this.audiosGuardados[key as AudioKey]();
  }

  /** «Audio saliente» lo habilita backoffice por cliente; sin él, el campo no sale (revisión del 2026-10-15). Esta
   *  demo lo tiene habilitado. */
  protected readonly conAudioSaliente = true;
  /** Los audios admiten .wav y .mp3 (desarrollo, 2026-10-15). */
  protected readonly audioAccept = '.wav,.mp3,audio/wav,audio/mpeg';

  /** Un mensaje periódico más por cada .wav elegido: cada 30 s hasta que se cambie. */
  protected onPeriodicFiles(files: readonly File[]): void {
    if (files.length === 0) return;
    this.setAnnouncement('periodicAnnouncements', [
      ...this.form().announcements.periodicAnnouncements,
      ...files.map((file) => ({ file: file.name, everySec: 30 })),
    ]);
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

  protected onSubStrategyChange(value: unknown): void {
    if (typeof value === 'string') this.updateField('subStrategy', value);
  }

  /** Ring All a la vez: dos agentes los tiene cualquiera; tres o más los activa el administrador (revisión del
   *  2026-10-15). Elegir más de lo permitido deja el valor en lo permitido y lo dice junto al campo. */
  protected readonly ringAllAllowedMax = RING_ALL_ALLOWED_MAX;
  /** Se intentó pasar de lo permitido: sale el aviso hasta que se cierra. */
  protected readonly ringAllBlocked = signal(false);
  private readonly ringAllSelect = viewChild<SelectComponent>('ringAllSelect');

  protected onRingAllChange(value: unknown): void {
    if (typeof value !== 'number') return;
    if (value > RING_ALL_ALLOWED_MAX) {
      this.ringAllBlocked.set(true);
      this.updateField('ringAllAgents', RING_ALL_ALLOWED_MAX);
      // El desplegable ya pinta lo elegido, y el campo no cambia (seguía en lo permitido): se le devuelve lo permitido
      // en la vuelta siguiente, cuando su `ngModel` ya ha visto lo elegido y nota el cambio.
      setTimeout(() => this.ringAllSelect()?.value.set(RING_ALL_ALLOWED_MAX));
      return;
    }
    this.updateField('ringAllAgents', value);
  }

  /**
   * Quitar un canal no toca a los agentes (DD-217): la tabla y el resumen recortan sus canales a los del grupo solo para
   * verlos (`linksVistos`), y se guardan recortados. Hasta el 2026-10-20 se recortaban aquí, y quitar y volver a poner
   * Teléfono en Online Support dejaba a sus 13 agentes sin él. Activar uno se lo da a quien no atiende ninguno y lo tiene
   * permitido, como pide SISMAC-4058 para un grupo sin canales con agentes (DD-223, `fillEmptyLinks`).
   */
  protected toggleChannel(channel: GroupChannel): void {
    this.cambiarCanales(toggleGroupChannel(this.form().channels, channel));
  }

  /** La casilla madre: enciende o apaga los dos subcanales de una vez (patrón B12 del laboratorio). */
  protected toggleChatFamily(): void {
    this.cambiarCanales(toggleChatFamily(this.form().channels) as Set<GroupChannel>);
  }

  private cambiarCanales(channels: Set<GroupChannel>): void {
    this.form.update((f) => {
      const activadas = removedFamilies(channels, f.channels);
      const links = activadas.length === 0
        ? f.links
        : fillEmptyLinks(f.links, channels, activadas, (link) => this.agentsStore.getAgent(link.agentId)?.allowedChannels);
      return { ...f, channels, links };
    });
  }

  /** Los agentes con los canales que el grupo ofrece ahora y cada uno tiene: lo que se ve y lo que se guarda. */
  protected readonly linksVistos = computed(() => {
    const f = this.form();
    return clampLinksToChannels(f.links, f.channels, (link) => this.agentsStore.getAgent(link.agentId)?.allowedChannels);
  });

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
    if (this.hasEmail()) routing.push({ family: 'email', text: this.form().emailStrategy });
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
        : destino.recurso
          ? RESUMEN_RECURSOS[destino.recurso]
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

  /** Los recursos del grupo por tipo, con cuántos tiene, para Recursos del resumen: Agendas siempre, y las plantillas de
   *  los canales que atiende, como los campos de la sección (revisión del 2026-10-14). Cada fila lleva a su campo. */
  protected readonly summaryResources = computed<readonly GroupSummaryResources[]>(() => {
    if (!this.conRecursosDeRepositorio) return [];
    const f = this.form();
    return [
      { key: 'agendas', labelKey: 'agents.form.advanced.agendas.title', count: this.resourceRows.agendas(f.scheduleIds, false).length },
      ...(this.hasChatFamily()
        ? [{ key: 'chat' as const, labelKey: 'resources.templates_chat', count: this.resourceRows.templates(f.templateIds, 'chat', false).length }]
        : []),
      ...(this.hasEmail()
        ? [{ key: 'email' as const, labelKey: 'resources.templates_email', count: this.resourceRows.templates(f.templateIds, 'email', false).length }]
        : []),
    ];
  });

  protected onLinksChange(links: readonly GroupAgentLink[]): void {
    this.form.update((f) => ({ ...f, links }));
  }

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
    // El número con su rótulo, como «Extensión 122» bajo el nombre del agente: a secas no decía qué era (barrido de
    // consistencia del 2026-10-20).
    const telefono = `${this.translate.instant('groups.form.fields.phone')} ${f.phone}`;
    return this.hasPhone() && f.phone ? `${telefono}, ${priority.toLocaleLowerCase()}` : priority;
  });

  protected save(): void {
    if (this.saving() || (this.mode() === 'edit' && !this.dirtyState.dirty())) return;
    // El botón está apagado con algo pendiente (DD-219), pero se llega aquí también por otro camino (Guardar del aviso de
    // Repositorios, Intro): no crea ni guarda, dice lo que falta en rojo y lleva al primer campo.
    if (this.pendiente()) {
      this.destinoTrasGuardar = null;
      this.ocasion.intentar();
      const primero = this.avisos()[0];
      if (primero) this.irACampo(primero.seccion, primero.ancla);
      return;
    }

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
          const orphaned = this.linksVistos().length - this.withoutOrphans(this.linksVistos()).length;
          this.cascadeConfirm.set({ removed, affected, orphaned });
          return;
        }
      }
    }

    // Quien se queda sin canales en un grupo con canales sale al guardar (DD-121). Si es por quitar canales al editar, lo
    // ha dicho la cascada; si no (al crear, o un agente que no tiene permitido el canal que se activó), lo dice este aviso
    // antes de sacarlo, y no en silencio (DD-223).
    if (!this.cascadeConfirm() && this.sacarConfirm() === null) {
      const fuera = this.linksVistos().length - this.withoutOrphans(this.linksVistos()).length;
      if (fuera > 0) {
        this.sacarConfirm.set(fuera);
        return;
      }
    }

    this.saving.set(true);
    setTimeout(() => {
      const f = this.form();
      const payload = {
        name: f.name.trim(),
        // Sin Teléfono no se guarda un saliente que no se ve (DD-217); mientras se edita, quitar y poner Teléfono lo conserva.
        phone: f.channels.has('phone') ? f.phone.trim() : '',
        priority: f.priority,
        schedules: [...f.scheduleIds],
        templates: [...f.templateIds],
        labels: [...f.labelIds],
        announcements: f.announcements,
        advanced: f.advanced,
        phoneQueue: f.phoneQueue,
        chatQueue: f.chatQueue,
        emailQueue: f.emailQueue,
        chat: f.chat,
        channels: Array.from(f.channels),
        strategy: f.strategy,
        subStrategy: this.isNiveles() ? f.subStrategy : undefined,
        ringAllAgents: this.isRingAll() ? f.ringAllAgents : undefined,
        // La de Chat vale para sus dos subcanales: un grupo solo de WhatsApp también la guarda.
        chatStrategy: hasChatFamily(f.channels) ? f.chatStrategy : undefined,
        chatSubStrategy: f.chatSubStrategy,
        emailStrategy: f.channels.has('email') ? f.emailStrategy : undefined,
        emailSubStrategy: this.isEmailNiveles() ? f.emailSubStrategy : undefined,
        // Sin clasificar (o sin tipificaciones que elegir), no guarda una tipificación que no usa.
        wrapUp: f.wrapUp.classify && !this.sinTipificaciones() ? f.wrapUp : { ...f.wrapUp, classify: false, typificationId: null },
      };

      if (this.mode() === 'create') {
        this.createGroup(payload);
        return;
      }

      // Como Contact Center y la ficha de agente (decisión de producto, 2026-09-16): guardar se queda en la ficha, con su aviso.
      const editingId = this.editingId()!;
      this.groupsStore.updateGroup(editingId, { ...payload });
      this.linksStore.replaceLinksForGroup(editingId, this.normalizeLinks(this.withoutOrphans(this.linksVistos()), editingId));
      const refreshed = this.groupsStore.getGroup(editingId);
      if (refreshed) this.initial.set(refreshed);
      this.resultado.contar(this.translate.instant('groups.toasts.updated', { name: payload.name }));
      // Lo guardado pasa a ser la referencia para avisar si luego se quita un canal con agentes.
      this.initialChannels.set(new Set(f.channels));
      this.initialLinks.set(this.linksStore.linksForGroup(editingId));
      // Lo guardado pasa a ser la ficha: también sus enlaces, ya recortados a los canales del grupo.
      this.form.update((g) => ({ ...g, links: this.initialLinks() }));
      this.saving.set(false);
      this.ocasion.olvidar();
      this.dirtyState.markPristine();
      this.irAlDestino();
    }, 400);
  }

  /**
   * Crea el grupo con lo que haya en las cuatro secciones y abre su EDICIÓN en la sección en la que se
   * estaba: navegar (y no solo cambiar la dirección) pone al día la miga, el título y el candado entre
   * pestañas. La ficha se marca limpia antes, para que el guardián de salida no pregunte.
   */
  private createGroup(payload: Omit<Group, 'id' | 'code'>): void {
    const slug = this.sectionSlug(this.activeSection());
    const created = this.groupsStore.addGroup(payload);
    this.linksStore.replaceLinksForGroup(created.id, this.normalizeLinks(this.withoutOrphans(this.linksVistos()), created.id));
    const creado = this.translate.instant('groups.toasts.created', { name: created.name });
    this.dirtyState.markPristine();
    const destino = this.destinoTrasGuardar;
    this.destinoTrasGuardar = null;
    // `saving` sigue encendido hasta que se va (ver `activeSection`).
    void this.router
      .navigate(['/admin/grupos/editar', created.id], {
        replaceUrl: true,
        queryParams: slug && slug !== 'general' ? { seccion: slug } : {},
      })
      // Si se guardó para ir a Repositorios, allí: Atrás vuelve al grupo ya creado.
      .then(() => (destino ? this.router.navigateByUrl(destino) : true))
      // El toast, ya en la ficha a la que se llega (DD-211 §5).
      .then(() => this.resultado.contar(creado))
      .finally(() => this.saving.set(false));
  }

  /* ── «Gestionar en Repositorios»: sale de la ficha, así que con cambios pide guardar antes (SISMAC-4058) ─────── */

  /** La dirección del enlace, para abrirlo en otra pestaña con Cmd+clic o el botón central, que no pregunta nada. */
  protected readonly repositoriosHref = inject(LocationStrategy).prepareExternalUrl('/admin/repositorios');
  /** Adónde ir cuando acabe de guardar; `null`, quedarse en la ficha. */
  private destinoTrasGuardar: string | null = null;

  protected irARepositorios(event: MouseEvent): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void this.salirARepositorios('/admin/repositorios');
  }

  /**
   * «Editar en Repositorios», en el detalle de la tipificación: también sale de la ficha, así que pregunta lo mismo que
   * «Gestionar en Repositorios», guardar antes, y no «¿Descartar cambios?» (DD-224).
   */
  protected editarTipificacion(destino: string): void {
    this.viendoTipificacion.set(false);
    void this.salirARepositorios(destino);
  }

  private async salirARepositorios(destino: string): Promise<void> {
    if (!this.formDirty()) {
      void this.router.navigateByUrl(destino);
      return;
    }
    const guardar = await this.alertModal({
      variant: 'info',
      title: this.translate.instant('groups.form.repositories_leave.title'),
      message: this.translate.instant('groups.form.repositories_leave.body'),
      actionLabel: this.translate.instant('common.save'),
      secondaryActionLabel: this.translate.instant('common.discard_keep'),
    });
    if (!guardar) return;
    this.destinoTrasGuardar = destino;
    this.save();
  }

  /** Tras guardar (no al crear, que ya navega), al destino pendiente, si lo hay. */
  private irAlDestino(): void {
    const destino = this.destinoTrasGuardar;
    this.destinoTrasGuardar = null;
    if (destino) void this.router.navigateByUrl(destino);
  }

  /** Vuelve al último estado guardado (o al formulario vacío, en un alta). Es el
   *  «Deshacer» de Contact Center: vuelve atrás, no navega. */
  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
    this.ocasion.olvidar();
    // En un alta, volver al vacío es volver a empezar: lo dejado antes ya no es lo que hay.
    if (this.mode() === 'create') this.alta.reiniciar();
  }

  protected cancelCascade(): void {
    this.cascadeConfirm.set(null);
    this.destinoTrasGuardar = null;
  }

  /** La frase del aviso, con su número: «1 agente pierde», no «1 agentes pierden». */
  protected cascadeBodyKey(c: { readonly affected: number; readonly orphaned: number }): string {
    const base = 'groups.form.cascade.';
    if (c.orphaned === 0) return base + (c.affected === 1 ? 'body_one' : 'body');
    if (c.affected === 1) return base + 'body_orphaned_one';
    return base + (c.orphaned === 1 ? 'body_orphaned_single' : 'body_orphaned');
  }

  protected confirmCascade(): void {
    // Re-enter save() — the guard sees `cascadeConfirm` is set and skips the check.
    this.save();
    this.cascadeConfirm.set(null);
  }

  /** Los agentes que se quedan sin canales y salen al guardar, a la espera del sí (DD-223). */
  protected readonly sacarConfirm = signal<number | null>(null);

  protected cancelSacar(): void {
    this.sacarConfirm.set(null);
    this.destinoTrasGuardar = null;
  }

  protected confirmSacar(): void {
    // Como la cascada: `save()` ve el aviso puesto y no vuelve a preguntar.
    this.save();
    this.sacarConfirm.set(null);
  }

  /** El nombre de una familia, para el aviso de cascada: «Chat», no «Web Chat, WhatsApp». */
  protected channelLabel(c: ChannelFamily): string {
    return this.translate.instant(FAMILY_LABEL_KEYS[c]);
  }

  /** Borrar la ficha: la confirmación simple del DS (DD-215), con el nombre guardado; al aceptar, vuelve al listado. */
  protected async requestDelete(): Promise<void> {
    const id = this.editingId();
    if (!id) return;
    const group = this.initial();
    if (!(await this.confirmarBorrado(group?.name ?? ''))) return;
    this.groupsStore.deleteGroup(id);
    this.linksStore.removeGroup(id);
    this.dirtyState.markPristine();
    this.resultado.contar(this.translate.instant('groups.toasts.deleted_single', { name: group?.name ?? '' }));
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
      wrapUp: DEFAULT_WRAP_UP,
      scheduleIds: new Set<number>(),
      templateIds: new Set<number>(),
      labelIds: new Set<number>(),
      announcements: { ...DEFAULT_ANNOUNCEMENTS, voice: defaults.voice },
      advanced: { ...defaults.advanced },
      // Cada canal nace con SU cola, su estrategia y (Chat) su cierre por inactividad de los valores por defecto.
      phoneQueue: { ...defaults.phoneQueue },
      chatQueue: { ...defaults.chatQueue },
      // Contact Center aún no fija los de Email: nace con la cola de Chat, el otro canal escrito.
      emailQueue: { ...defaults.chatQueue },
      chat: { ...DEFAULT_CHAT_SETTINGS, ...defaults.chat },
      channels: new Set<GroupChannel>(['phone']),
      strategy: defaults.strategy,
      subStrategy: SUB_STRATEGIES[0]!,
      ringAllAgents: RING_ALL_OPTIONS[0]!,
      chatStrategy: defaults.chatStrategy,
      chatSubStrategy: CHAT_SUB_STRATEGIES[0]!,
      emailStrategy: DEFAULT_EMAIL_STRATEGY,
      emailSubStrategy: SUB_STRATEGIES[0]!,
      links: [],
    };
  }

  /**
   * En un grupo con canales, un agente asignado tiene al menos uno (DD-121): quien se queda sin ninguno porque se
   * quitaron canales del grupo SALE del grupo al guardar, y la confirmación de cascada lo ha dicho con su cifra. En un
   * grupo sin canales (DD-217) se pertenece sin canal: nadie sale. Las filas que YA se cargaron sin canales (datos de
   * antes, o un grupo que no tenía canales) se quedan como estaban.
   */
  private withoutOrphans(links: readonly GroupAgentLink[]): readonly GroupAgentLink[] {
    if (this.form().channels.size === 0) return links;
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
