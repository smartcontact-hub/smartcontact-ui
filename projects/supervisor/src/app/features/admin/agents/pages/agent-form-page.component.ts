import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, Injector, input, OnInit, signal, type TemplateRef, viewChild } from '@angular/core';
import { LocationStrategy, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, type UrlTree } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import type {
  ScMatrixColumn,
  ScMatrixColumnToggle,
  ScMatrixRow,
  ScMatrixToggle,
} from '@smartcontact-hub/components';
import { injectAlertModal } from '@core/services';
import { ScButtonComponent as ButtonComponent,
  ScFactRowComponent as FactRowComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { BreadcrumbService, ResultadoAccionService, SectionLinksService } from '@core/services';
import { ScConfirmService } from '@smartcontact-hub/components';
import { EMAIL_RE } from '@core/utils/validators';
import {
  AltaPieComponent,
  ChannelIconComponent,
  NameInplaceComponent,
  ResourceOptionComponent,
  SummaryKpiComponent,
  type FaltaDelResumen,
} from '@shared/components';
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
import { nombreDeCopia } from '@shared/utils/copy-name';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import {
  ScCheckboxComponent as CheckboxComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
  ScMessageComponent as MessageComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScInputTextComponent as InputTextComponent,
  ScPermissionMatrixComponent as PermissionMatrixComponent,
  ScPhotoUploadComponent as PhotoUploadComponent,
  ScMultiSelectComponent as MultiSelectComponent,
  ScOptionCardsComponent as OptionCardsComponent,
  ScSelectButtonComponent as SelectButtonComponent,
  ScSelectComponent as SelectComponent,
  ScSlotComponent as SlotComponent,
  ScSubsectionComponent as SubsectionComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
  type TriState,
  triStateOf,
} from '@smartcontact-hub/components';
import { LabelsStore } from '@features/admin/labels/state/labels.store';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import { injectConfirmarBorrado } from '@features/admin/services/confirmar-borrado';
import { canonicalizeChannels, GroupAgentLink, type Channel } from '@features/admin/services/group-agent-links.types';
import { clampLinksToChannels } from '@features/admin/services/group-channels.core.mjs';
import { idsVivos } from '@features/admin/services/recursos.core.mjs';
import { CHANNEL_FAMILIES, FAMILY_LABEL_KEYS } from '@features/admin/groups/data/groups-data';
import { TemplatesStore } from '@features/admin/templates/state/templates.store';
import {
  Template,
  TemplateType,
} from '@features/admin/templates/data/templates-data';
import { AgendasStore } from '@features/admin/repositories/state/agendas.store';
import { telefonoValido } from '@features/admin/repositories/state/agenda-contacts.core.mjs';
import { EquiposStore } from '@features/admin/repositories/state/equipos.store';
import { ResourceRowsService } from '@features/admin/services/resource-rows.service';
import {
  AGENT_TYPES,
  AGENT_TYPE_LABEL_KEYS,
  Agent,
  AgentPermissions,
  AgentType,
  AVAILABLE_EXTENSIONS,
  AVAILABLE_LANGUAGES,
  CLIENTE_CON_CALL_BLENDING,
  CLIENTE_CON_CUSCARE,
  CLIENTE_CON_WEBRTC,
  DESTINO_KEYS,
  DestinoCol,
  DestinoKey,
  EXTENSION_ICONS,
  EXTENSION_TYPES,
  ExtensionOption,
  ExtensionType,
  IFRAME_MODES,
  IframeMode,
  iframeModeOf,
  matrixCell,
  setMatrixCell,
  PICKUP_TYPES,
  PRESENCE_LABEL_KEYS,
  PickupType,
  PresenceStatus,
} from '../data/agents-data';
import { AgentDefaultsStore } from '../state/agent-defaults.store';
import { AgentsStore } from '../state/agents.store';
import {
  AgentGroupAssignmentRef,
  GroupAssignmentTableComponent,
} from '../components/group-assignment-table/group-assignment-table.component';

/* Sin «Cuenta activa» en pantalla (revisión de agentes del 2026-10-09): se guarda como estaba. Tampoco las Etiquetas ni
 * las Plantillas de email, que salen de Recursos. El PIN, de solo lectura: lo asigna el store al crear (DD-211 §2). */
interface FormState {
  name: string;
  extension: string;
  extensionType: ExtensionType;
  agentType: AgentType;
  status: 'active' | 'inactive';
  presenceStatus: PresenceStatus;
  phone: string;
  email: string;
  pin: string;
  pickupType: PickupType;
  randomOrder: boolean;
  maxChats: number;
  iframeMode: IframeMode;
  iframeUrl: string;
  iframeTitle: string;
  links: readonly GroupAgentLink[];
  defaultOutboundGroupId: number | null;
  permissions: AgentPermissions;
  allowedChannels: readonly Channel[];
  photo: string | null;
  languages: readonly string[];
  labelIds: ReadonlySet<number>;
  scheduleIds: ReadonlySet<number>;
  templateIds: ReadonlySet<number>;
  teamIds: ReadonlySet<number>;
}

/**
 * De qué sección es cada campo, para marcar en el índice las que tienen cambios sin guardar (DD-122).
 * `permissions` se reparte por subcampo (ver `sectionsWithChanges`).
 */
const AGENT_SECTION_OF_FIELD: Readonly<Record<keyof FormState, string>> = {
  name: 'agent-section-general',
  extension: 'agent-section-general',
  extensionType: 'agent-section-general',
  agentType: 'agent-section-general',
  status: 'agent-section-general',
  presenceStatus: 'agent-section-general',
  phone: 'agent-section-general',
  email: 'agent-section-general',
  pin: 'agent-section-general',
  photo: 'agent-section-general',
  allowedChannels: 'agent-section-general',
  permissions: 'agent-section-config',
  pickupType: 'agent-section-config',
  randomOrder: 'agent-section-config',
  maxChats: 'agent-section-config',
  languages: 'agent-section-config',
  iframeMode: 'agent-section-config',
  iframeUrl: 'agent-section-config',
  iframeTitle: 'agent-section-config',
  labelIds: 'agent-section-resources',
  scheduleIds: 'agent-section-resources',
  templateIds: 'agent-section-resources',
  teamIds: 'agent-section-resources',
  links: 'agent-section-groups',
  defaultOutboundGroupId: 'agent-section-groups',
};

/** Adónde lleva cada dato del resumen: su sección y, si lo tiene, su campo. */
interface DestinoDelResumen {
  readonly seccion: string;
  readonly ancla?: string | null;
}

/**
 * Una fila del resumen: su clave, su valor en texto y adónde lleva. Tres se dicen con iconos, como en la lista
 * (revisión de producto del 2026-10-15): los canales, cada uno con el suyo; la extensión, con el de dónde suena; y la
 * grabación, con el REC propio, rojo si graba y gris si no.
 */
interface FilaDelResumen extends DestinoDelResumen {
  readonly icono: string;
  readonly valor: string;
  readonly etiqueta: string;
  readonly canales?: readonly Channel[];
  readonly extension?: { readonly numero: string; readonly tipo: ExtensionType };
  readonly graba?: boolean;
}

/** Algo obligatorio que falta: su sección, su aviso, el sitio al que se llega y cómo se nombra en «Falta: …» (DD-219). */
interface FaltaDelAgente {
  readonly seccion: string;
  readonly motivo: string;
  readonly ancla: string | null;
  readonly etiqueta: string;
}

/** ¿Son la misma selección, sin importar el orden? */
function sameValues<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((v) => set.has(v));
}

@Component({
  selector: 'sc-agent-form-page',
  imports: [
    FactRowComponent,
    NgTemplateOutlet,
    ButtonComponent,
    ChannelIconComponent,
    IconComponent,
    NameInplaceComponent,
    SummaryKpiComponent,
    AltaPieComponent,
    ResourceOptionComponent,
    CheckboxComponent,
    TooltipModule,
    FormSectionNavComponent,
    GroupAssignmentTableComponent,
    InputTextComponent,
    MessageComponent,
    PermissionMatrixComponent,
    PhotoUploadComponent,
    MultiSelectComponent,
    OptionCardsComponent,
    SectionCardComponent,
    SelectButtonComponent,
    SelectComponent,
    SlotComponent,
    SubsectionComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './agent-form-page.component.html',
  styleUrl: './agent-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentFormPageComponent implements DirtyAware, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmarBorrado = injectConfirmarBorrado('agents.delete_dialog.title');
  private readonly sectionLinks = inject(SectionLinksService);
  private readonly injector = inject(Injector);
  private readonly agentsStore = inject(AgentsStore);
  private readonly agentDefaults = inject(AgentDefaultsStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  /* El idioma como DEPENDENCIA de los computed de abajo. `translate.instant()`
   * es una llamada, no una señal: sin esto las cabeceras y los nombres de fila
   * se calculan una vez y se congelan al cambiar de idioma. Es la §6 de
   * `audit:datatables`, que solo sabe mirar un computed llamado `columns` — el
   * defecto es el mismo se llame como se llame. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang)
    ),
    { initialValue: this.translate.currentLang }
  );

  private readonly labelsStore = inject(LabelsStore);
  private readonly templatesStore = inject(TemplatesStore);
  private readonly agendasStore = inject(AgendasStore);
  private readonly equipos = inject(EquiposStore);
  private readonly resourceRows = inject(ResourceRowsService);
  private readonly alertModal = injectAlertModal();
  private readonly confirmHost = inject(ScConfirmService);

  /** Guardar/Cancelar proyectados a la TopBar (modelo "todo arriba" S59):
   * fuera la banda sticky-form-header; identidad → breadcrumb + campos del
   * cuerpo, acciones → barra de arriba. */
  private readonly topbarActions =
    viewChild<TemplateRef<unknown>>('topbarActions');

  /**
   * La miga de la edición dice el nombre del agente, el guardado, como la ficha de grupo («Administración › Agentes ›
   * Tom Hanks», SISMAC-4058). Al crear o duplicar, la de la ruta.
   */
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly migaConNombre = effect(() =>
    this.breadcrumbs.nombrar(this.route, this.mode() === 'edit' ? (this.initial()?.name ?? null) : null),
  );
  private readonly sinMiga = inject(DestroyRef).onDestroy(() => this.breadcrumbs.nombrar(this.route, null));

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly trashIcon = 'delete';
  protected readonly keyIcon = 'key';


  /** El tipo de descuelgue, uno para llamadas y chats, con las tarjetas y las palabras de Contact Center › Servicio. */
  protected readonly pickupOptions = computed(() => {
    this.currentLang();
    return PICKUP_TYPES.map((key) => ({
      value: key,
      label: this.translate.instant(`config.aed.subpages.servicio.aviso.descuelgue_options.${key}.label`),
      description: this.translate.instant(`config.aed.subpages.servicio.aviso.descuelgue_options.${key}.desc`),
    }));
  });

  /** Dónde suena: en el navegador o en su teléfono móvil. Sin WebRTC contratado, el navegador se ve pero no se elige. */
  protected readonly extensionTypeOptions = computed(() => {
    this.currentLang();
    return EXTENSION_TYPES.map((value) => ({
      value,
      label: this.translate.instant(`agents.ext_kind.${value}`),
      disabled: value === 'webrtc' && !this.conWebRtc,
    }));
  });

  /** Qué ve en su iframe (SISMAC-4062): solo el dashboard de Agent, la URL de Contact Center o una suya. */
  protected readonly iframeModeOptions = computed(() => {
    this.currentLang();
    return IFRAME_MODES.map((value) => ({
      value,
      label: this.translate.instant(`agents.form.advanced.integracion.iframe_${value}`),
    }));
  });

  /** La ayuda del desplegable: qué verá con «Dashboard» y cuál es la URL con «General». Con «Personalizado» lo dice
   *  su campo. */
  protected readonly iframeModeHint = computed(() => {
    this.currentLang();
    const k = 'agents.form.advanced.integracion.';
    switch (this.form().iframeMode) {
      case 'dashboard':
        return this.translate.instant(k + 'iframe_dashboard_hint');
      case 'general': {
        const url = this.agentDefaults.defaults().iframeUrl.trim();
        return url ? this.translate.instant(k + 'iframe_general_hint', { url }) : this.translate.instant(k + 'iframe_general_hint_empty');
      }
      default:
        return undefined;
    }
  });

  protected onIframeModeChange(value: unknown): void {
    if (typeof value === 'string' && (IFRAME_MODES as readonly string[]).includes(value)) {
      this.updateField('iframeMode', value as IframeMode);
    }
  }

  /** El cliente tiene agentes en el navegador: si no, la extensión suena siempre en el teléfono (DD-211 §2). */
  protected readonly conWebRtc = CLIENTE_CON_WEBRTC;

  /** La ayuda del tipo de extensión: dónde suena o, sin WebRTC, por qué solo puede ser el teléfono. */
  protected readonly extensionTypeHint = computed(() =>
    this.conWebRtc ? `agents.form.fields.extension_type_hint.${this.form().extensionType}` : 'agents.form.fields.extension_type_hint.sin_webrtc',
  );

  /** El tipo de extensión que se puede guardar: sin WebRTC, el teléfono. */
  private tipoExtension(tipo: ExtensionType): ExtensionType {
    return this.conWebRtc ? tipo : 'phone';
  }

  /** Con la extensión en el teléfono, el móvil es obligatorio: es donde suena. */
  protected readonly phoneRequired = computed(() => this.form().extensionType === 'phone');

  /** Lo del chat (chats simultáneos, idiomas, plantillas de chat) solo sale si atiende chat. */
  protected readonly attendsChat = computed(() => this.form().allowedChannels.includes('chat'));

  /** Lo de las llamadas (grabarlas, a quién llama y transfiere, la grabación y las salientes del resumen) solo sale si
   *  atiende teléfono (DD-211 §2). Lo guardado se queda como estaba, oculto, como lo del chat. */
  protected readonly attendsPhone = computed(() => this.form().allowedChannels.includes('phone'));

  /** El tipo de agente solo existe en un cliente con CusCare. */
  protected readonly conCusCare = CLIENTE_CON_CUSCARE;

  /** El grupo para llamadas salientes solo existe en un cliente con Call Blending (SISMAC-4062, DD-211 §9). */
  protected readonly conCallBlending = CLIENTE_CON_CALL_BLENDING;

  /** Choices for the "Chats simultáneos" select inside Comportamiento. */
  protected readonly maxChatsOptions: readonly number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  ];
  protected readonly agentTypes = AGENT_TYPES;
  /* Widening intencional a `Record<string, string>` para que los templates
   * que reciben `let-t` desde el `<ng-template #item>` proyectado (tipo `any`
   * por diseño de PrimeNG) puedan indexar sin TS7053. El lookup sigue siendo
   * seguro: las
   * keys vienen siempre de `agentTypes` (AgentType union). */
  protected readonly typeLabelKeys: Readonly<Record<string, string>> =
    AGENT_TYPE_LABEL_KEYS;
  /* Widening intencional — ver typeLabelKeys arriba. Mismo razonamiento:
   * el `let-p` de la plantilla proyectada viene como `any` y hay que indexar con
   * cualquier string. Seguro: las keys vienen de presenceStates. */
  protected readonly presenceKeys: Readonly<Record<string, string>> =
    PRESENCE_LABEL_KEYS;
  /**
   * Las extensiones que se pueden elegir: las libres y, al editar, también la suya, la guardada (SISMAC-4062, DD-225).
   * Hasta entonces salían todas, también las de otros agentes, y la de un agente fuera de la lista no salía.
   */
  protected readonly extensionOptions = computed<readonly ExtensionOption[]>(() => {
    const yo = this.editingId();
    const usadas = new Set(this.agentsStore.agents().filter((a) => a.id !== yo).map((a) => a.extension));
    const libres = AVAILABLE_EXTENSIONS.filter((e) => !usadas.has(e.number));
    const propia = this.initial();
    if (!propia?.extension || libres.some((e) => e.number === propia.extension)) return libres;
    return [...libres, { number: propia.extension, type: propia.extensionType }].sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true }),
    );
  });
  protected readonly availableLanguages = AVAILABLE_LANGUAGES;
  protected readonly availableLabels = this.labelsStore.labels;

  /** Roster of every group in the system, with its channels — fed to the
   * group-assignment table so it can render the correct chip cluster per row
   * and the picker dropdown of joinable groups. */
  protected readonly availableGroups = computed<
    readonly AgentGroupAssignmentRef[]
  >(() =>
    this.groupsStore.groups().map((g) => ({
      id: g.id,
      name: g.name,
      channels: g.channels,
    }))
  );

  /* Idiomas y Etiquetas ACUMULAN, así que son un `sc-multiselect` como Agendas y Plantillas
   * (DD-105). Antes eran un select que se vaciaba tras cada elección más una fila de
   * pastillas debajo. Valores `computed` por lo mismo que las plantillas: una lista estable. */
  protected readonly languageValue = computed(() => [...this.form().languages]);

  protected onLanguagesChange(langs: unknown[]): void {
    if (sameValues(langs as string[], this.languageValue())) return;
    this.form.update((f) => ({ ...f, languages: [...(langs as string[])] }));
  }

  /** Sus equipos (Repositorios › Equipos), con lo que reúne cada uno para el tooltip de su opción (DD-217). */
  protected readonly teamOptions = computed(() => this.resourceRows.opcionesDeEquipos());
  protected readonly teamValue = computed(() => [...this.form().teamIds]);

  protected onTeamsChange(ids: unknown[]): void {
    if (sameValues(ids as number[], this.teamValue())) return;
    this.form.update((f) => ({ ...f, teamIds: new Set(ids as number[]) }));
  }

  protected readonly labelOptions = computed(() =>
    this.labelsStore.labels().map((l) => ({ label: l.name, value: l.id })),
  );
  protected readonly labelValue = computed(() => [...this.form().labelIds]);

  protected onLabelsChange(ids: unknown[]): void {
    if (sameValues(ids as number[], this.labelValue())) return;
    this.form.update((f) => ({ ...f, labelIds: new Set(ids as number[]) }));
  }

  /* ── Repositorios ─────────────────────────────────────────────────────────────
   *
   * Desde el 2026-09-14 cada repositorio es UN campo que enseña lo asignado y deja añadir o
   * quitar desde el desplegable del DS. Antes Plantillas y Agendas eran dos tablas completas
   * dentro de la tarjeta, con buscador, pestañas, casilla por fila y vista previa, listando
   * TODO lo que existe para responder una sola pregunta: qué tiene este agente. Demasiado
   * ruido para tan poca información. El formulario sigue guardando un `Set` de ids por repositorio; aquí solo
   * se traduce a lo que habla `sc-multiselect` (una lista de ids) y de vuelta. */

  /** Las agendas de `Repositorios > Agendas`, todas (una agenda ya no es activa ni inactiva), con lo que contiene cada
   *  una para el tooltip de su opción (DD-217). */
  protected readonly scheduleOptions = computed(() => this.resourceRows.opcionesDeAgendas());
  protected readonly scheduleValue = computed(() => [...this.form().scheduleIds]);

  protected onSchedulesChange(ids: unknown[]): void {
    if (sameValues(ids as number[], this.scheduleValue())) return;
    this.form.update((f) => ({ ...f, scheduleIds: new Set(ids as number[]) }));
  }

  /** Las plantillas, partidas por tipo: una de chat no se asigna al canal de email. */
  private readonly availableTemplates = this.templatesStore.templates;
  private templatesOf(type: TemplateType): readonly Template[] {
    return this.availableTemplates().filter((t) => t.type === type);
  }
  protected readonly chatTemplateOptions = computed(() => this.resourceRows.opcionesDePlantillas('chat'));
  protected readonly emailTemplateOptions = computed(() => this.resourceRows.opcionesDePlantillas('email'));
  /* Como `computed` y no como método: el desplegable recibe la MISMA lista mientras no cambie.
   * Un método devolvía un array nuevo en cada ciclo, el desplegable lo tomaba por un cambio y
   * la página se quedaba colgada (medido el 2026-09-14 al abrir Repositorios). */
  private idsOfType(type: TemplateType): number[] {
    const ids = this.form().templateIds;
    return this.templatesOf(type).filter((t) => ids.has(t.id)).map((t) => t.id);
  }
  protected readonly chatTemplateValue = computed(() => this.idsOfType('chat'));
  protected readonly emailTemplateValue = computed(() => this.idsOfType('email'));

  /** Sustituye las de UN tipo sin tocar las del otro. */
  protected onTemplatesChange(type: TemplateType, ids: unknown[]): void {
    const current = type === 'chat' ? this.chatTemplateValue() : this.emailTemplateValue();
    if (sameValues(ids as number[], current)) return;
    const ofType = new Set(this.templatesOf(type).map((t) => t.id));
    this.form.update((f) => {
      const next = new Set([...f.templateIds].filter((id) => !ofType.has(id)));
      for (const id of ids as number[]) next.add(id);
      return { ...f, templateIds: next };
    });
  }

  /**
   * EL ÍNDICE DE LA FICHA (DD-122): cuatro secciones, como la ficha de grupo (revisión de agentes del 2026-10-09):
   * quién es y por dónde atiende (General), qué puede hacer (Configuración), qué se le asigna (Recursos) y dónde atiende
   * (Grupos). Hasta ese día eran cinco: Identidad, Grupos, Permisos, Recursos y Avanzado. Desde el listado se entra
   * por General; a Grupos (`?seccion=grupos`) lleva la cifra de grupos (DD-213).
   */
  protected readonly navSections = computed<readonly FormNavSection[]>(() => {
    // «Revisada» y no «Completa» donde no hay nada que cumplir, como en el grupo (DD-222): Configuración y Recursos. Solo
    // en el alta y al duplicar: al editar todo está guardado.
    const alta = this.mode() !== 'edit';
    return [
      { id: 'agent-section-general', labelKey: 'agents.form.section.general', icon: 'tune' },
      { id: 'agent-section-config', labelKey: 'agents.form.section.config', icon: 'verified_user', optional: alta },
      // Ni el nombre ni el icono son los del menú (carpeta): con los mismos, quien buscaba la sección acababa en la
      // página Repositorios (DD-105).
      { id: 'agent-section-resources', labelKey: 'agents.form.section.resources', icon: 'library_books', optional: alta },
      { id: 'agent-section-groups', labelKey: 'agents.form.section.groups', icon: 'group' },
    ].map((sec) => ({ ...sec, href: this.sectionLinks.href(this.sectionUrl(sec.id)) }));
  });

  /** Cada sección en la dirección (`?seccion=grupos`). General, la primera, va sin parámetro. */
  private static readonly SECTION_SLUGS: Readonly<Record<string, string>> = {
    general: 'agent-section-general',
    configuracion: 'agent-section-config',
    recursos: 'agent-section-resources',
    grupos: 'agent-section-groups',
  };

  /** Las direcciones de antes de las cuatro secciones siguen llevando a su sitio (un enlace guardado, una prueba). */
  private static readonly OLD_SLUGS: Readonly<Record<string, string>> = {
    identidad: 'agent-section-general',
    permisos: 'agent-section-config',
    avanzado: 'agent-section-config',
  };

  /** `?seccion=` de la dirección (`withComponentInputBinding`), también cuando solo cambia la query. */
  readonly seccion = input<string | undefined>();

  /**
   * EL ALTA, CON EL ÍNDICE DE LA EDICIÓN (DD-143), también al duplicar: las mismas secciones, en cualquier orden
   * (DD-130: aquí no hay puerta), con ✓ en las que se dejan completas y «Atrás / Siguiente» al pie. General y Grupos
   * tienen algo obligatorio (`faltas`); Configuración y Recursos, no, y llevan ✓ al dejarlas (DD-211 §6). Los canales de
   * General deciden lo que se ve en las demás (lo de las llamadas, lo del chat, las columnas de sus grupos): si cambian
   * desde que se dejó una, su ✓ se va (DD-217).
   */
  protected readonly alta = seccionesDeAlta({
    secciones: this.navSections,
    completa: (id) => !this.faltas().some((f) => f.seccion === id) && (id !== 'agent-section-general' || !this.formatoMal()),
    firma: (id) => (id === 'agent-section-general' ? '' : firmaDe(this.form().allowedChannels)),
  });

  /** La sección a la vista: en el alta y al duplicar, la abierta; al editar, la de la dirección (General sin parámetro). */
  protected readonly activeSection = computed<string>(() => {
    if (this.mode() !== 'edit') return this.alta.abierta();
    const slug = this.seccion() ?? '';
    return AgentFormPageComponent.SECTION_SLUGS[slug] ?? AgentFormPageComponent.OLD_SLUGS[slug] ?? 'agent-section-general';
  });

  /** La dirección de una sección: la primera, sin parámetro (es la dirección de la ficha). */
  private sectionUrl(id: string): UrlTree {
    const slug = Object.entries(AgentFormPageComponent.SECTION_SLUGS).find(([, v]) => v === id)?.[0] ?? null;
    return this.sectionLinks.section(this.route, id === 'agent-section-general' ? null : slug);
  }

  /**
   * Todo lo obligatorio de cada sección, falte ahora o no: al dejar una sección con algo vacío, todo lo suyo pasa a decirse
   * en rojo, también lo que aparezca después (el móvil al pasar la extensión a «Teléfono»), como en el grupo (DD-222 §6).
   */
  private static readonly OBLIGATORIOS_DE: Readonly<Record<string, readonly string[]>> = {
    'agent-section-general': [
      'agents.errors.name_required',
      'agents.errors.email_required',
      'agents.errors.extension_required',
      'agents.errors.phone_required',
      'agents.errors.channels_required',
    ],
    'agent-section-groups': ['agents.errors.group_required', 'agents.errors.outbound_required'],
    'agent-section-config': ['agents.errors.iframe_url_required'],
  };

  /** Ir a otra sección. En el alta y al duplicar, la sección se abre sin tocar la dirección: Atrás sale (DD-122, DD-143). */
  protected goTo(id: string): Promise<boolean> {
    if (this.mode() !== 'edit') {
      const dejada = this.alta.abierta();
      if (id !== dejada && this.faltas().some((f) => f.seccion === dejada)) {
        for (const motivo of AgentFormPageComponent.OBLIGATORIOS_DE[dejada] ?? []) this.ocasion.tocar(motivo);
      }
      this.alta.abrir(id);
      return Promise.resolve(true);
    }
    return this.sectionLinks.go(this.sectionUrl(id));
  }

  /** «Siguiente» y «Atrás» del alta: atajos a la sección de al lado, no puertas (la puerta es solo del grupo). Llegan
   *  arriba, con el foco en su título (DD-143). */
  protected siguiente(): void {
    this.irAlLado(this.alta.siguiente());
  }

  protected anterior(): void {
    this.irAlLado(this.alta.anterior());
  }

  private irAlLado(id: string | null): void {
    if (!id) return;
    void this.goTo(id);
    llegarASeccion(id, this.injector);
  }

  /**
   * LO OBLIGATORIO, en el orden de la ficha (la revisión de agentes de producto, 2026-10-09): nombre, email, extensión, el
   * móvil si suena en el teléfono y al menos un canal, en General; al menos un grupo, un canal en cada uno y, si atiende
   * teléfono y el cliente tiene Call Blending, el grupo de sus salientes, en Grupos (SISMAC-4062). Cada uno con el campo
   * al que se llega (`ancla`) y cómo se nombra en «Falta: …» del botón y en el índice (`etiqueta`). De aquí salen el botón
   * apagado, el aviso gris o rojo de cada campo y el índice: una sola lista, así no pueden decir cosas distintas (DD-219).
   */
  private readonly faltas = computed<readonly FaltaDelAgente[]>(() => {
    const f = this.form();
    const g = 'agent-section-general';
    const gr = 'agent-section-groups';
    const s = 'agents.form.summary.';
    const out: FaltaDelAgente[] = [];
    if (!f.name.trim()) {
      out.push({ seccion: g, motivo: 'agents.errors.name_required', ancla: 'agent-name', etiqueta: 'common.summary_missing_name' });
    }
    if (!f.email.trim()) out.push({ seccion: g, motivo: 'agents.errors.email_required', ancla: 'agent-email', etiqueta: s + 'missing_email' });
    if (!f.extension) {
      out.push({ seccion: g, motivo: 'agents.errors.extension_required', ancla: 'agent-ext', etiqueta: s + 'missing_extension' });
    }
    if (this.phoneRequired() && !f.phone.trim()) {
      out.push({ seccion: g, motivo: 'agents.errors.phone_required', ancla: 'agent-phone', etiqueta: s + 'missing_phone' });
    }
    if (f.allowedChannels.length === 0) {
      out.push({ seccion: g, motivo: 'agents.errors.channels_required', ancla: 'agent-channels-title', etiqueta: s + 'missing_channel' });
    }
    // Los grupos que valen son los que le dejan algún canal, y los que no tienen ninguno (DD-217: ahí se pertenece sin
    // canal). El que se queda sin canales porque se le quitaron sale al guardar (`save`).
    const sinCanales = new Set(this.availableGroups().filter((grupo) => grupo.channels.length === 0).map((grupo) => grupo.id));
    const valen = this.linksVistos().filter((l) => l.channels.length > 0 || sinCanales.has(l.groupId));
    if (valen.length === 0) {
      out.push({ seccion: gr, motivo: 'agents.errors.group_required', ancla: 'agent-groups-error', etiqueta: s + 'missing_group' });
    }
    if (valen.length > 0 && this.conCallBlending && f.allowedChannels.includes('phone') && this.outboundGroupId() === null) {
      out.push({ seccion: gr, motivo: 'agents.errors.outbound_required', ancla: 'agent-outbound', etiqueta: s + 'missing_outbound' });
    }
    // Con «Personalizado», su URL: sin ella no hay nada que enseñarle.
    if (f.iframeMode === 'custom' && !f.iframeUrl.trim()) {
      out.push({
        seccion: 'agent-section-config',
        motivo: 'agents.errors.iframe_url_required',
        ancla: 'agent-iframe-url',
        etiqueta: s + 'missing_iframe_url',
      });
    }
    return out;
  });

  /** Un email o un teléfono mal escritos, o un email de otro agente: no faltan, se dicen en su campo, pero no dejan guardar. */
  private readonly formatoMal = computed(() => !!this.emailError() || !!this.phoneError());

  /** Los enlaces como los ve la tabla: con los canales que el grupo ofrece y el agente tiene. */
  private readonly linksVistos = computed(() => {
    const f = this.form();
    const grupos = new Map(this.availableGroups().map((g) => [g.id, g.channels]));
    return f.links.map((l) => clampLinksToChannels([l], grupos.get(l.groupId) ?? [], () => f.allowedChannels)[0]);
  });

  /**
   * Cuándo se dice en rojo lo que falta (DD-219): al dejar su campo vacío, o desde que se abre si lo guardado ya venía
   * sin ello (DD-142). Antes, en gris bajo el campo (`ayuda`). Duplicar es un alta: lo que llega vacío a propósito va
   * en gris. Un email o un teléfono mal escritos, en su campo y en vivo.
   */
  private readonly ocasion = ocasionDeAvisar({
    editando: () => this.mode() === 'edit',
    cambios: () => this.dirtyState.dirty(),
    faltas: () => this.faltas().map((f) => f.motivo),
  });

  /** Lo que falta y ya se dice en rojo, por su motivo: el aviso de cada campo sale de aquí. */
  private readonly faltasDichas = computed(() => new Set(this.faltas().map((f) => f.motivo).filter((m) => this.ocasion.acusa(m))));

  /** Lo que falta y aún va en gris (DD-219). */
  private readonly faltasCalladas = computed(() => new Set(this.faltas().map((f) => f.motivo).filter((m) => !this.ocasion.acusa(m))));

  /** El aviso rojo bajo un campo obligatorio vacío (DD-219); `undefined` si no hay nada que decir en rojo. */
  protected falta(motivo: string): string | undefined {
    return this.faltasDichas().has(motivo) ? this.translate.instant(motivo) : undefined;
  }

  /** La ayuda del campo: el aviso gris de su obligatorio vacío, y detrás la ayuda propia del campo, si la tiene. */
  protected ayuda(motivo: string, ayudaKey?: string | null): string | undefined {
    this.currentLang();
    const gris = this.faltasCalladas().has(motivo) ? this.translate.instant(motivo) : null;
    return ayudaDeObligatorio(gris, ayudaKey ? this.translate.instant(ayudaKey) : undefined);
  }

  /** Se dejó el campo de un obligatorio: si sigue vacío, desde ahora en rojo. No al abrir su lista para elegir. */
  protected dejar(event: FocusEvent, motivo: string): void {
    if (dejoElCampo(event) && this.faltas().some((f) => f.motivo === motivo)) this.ocasion.tocar(motivo);
  }

  /** Sin canales, el aviso bajo las casillas: rojo si ya se dice, gris si aún no (DD-219). */
  protected readonly channelsError = computed(() => this.faltasDichas().has('agents.errors.channels_required'));
  protected readonly channelsHint = computed(() => this.faltasCalladas().has('agents.errors.channels_required'));
  protected readonly groupsError = computed(() => this.faltasDichas().has('agents.errors.group_required'));
  protected readonly groupsHint = computed(() => this.faltasCalladas().has('agents.errors.group_required'));

  /** Lo que falta, para el tooltip de «Crear agente» o «Guardar» apagado («Falta: email, extensión», DD-219). */
  protected readonly summaryMissing = computed<readonly FaltaDelResumen[]>(() => {
    this.currentLang();
    return this.faltas().map((f) => ({ etiqueta: this.translate.instant(f.etiqueta), seccion: f.seccion, ancla: f.ancla }));
  });

  /** ¿Tiene teléfono móvil? «Gestión de dispositivos» (elegir navegador o teléfono en el puesto) lo necesita. */
  protected readonly hasPhone = computed(() => !!this.form().phone.trim());

  /**
   * Los avisos del índice, en el orden de la ficha (DD-219): lo que falta, solo si lo guardado ya venía sin ello o se
   * pulsó con ello pendiente (lo que se toca se dice bajo su campo, donde se mira), y lo mal escrito (email, teléfono),
   * en vivo. De aquí salen el punto del índice, lo que dice en él y adónde lleva pulsar con algo pendiente.
   */
  private readonly avisos = computed<readonly AvisoDeFicha[]>(() => {
    this.currentLang();
    const g = 'agent-section-general';
    const out: AvisoDeFicha[] = this.faltas()
      .filter((f) => this.ocasion.acusaEnIndice(f.motivo))
      .map((f) => ({ seccion: f.seccion, texto: this.translate.instant(f.motivo), ancla: f.ancla }));
    const email = this.emailError();
    if (email) out.unshift({ seccion: g, texto: this.translate.instant(email), ancla: 'agent-email' });
    const movil = this.phoneError();
    if (movil) out.unshift({ seccion: g, texto: this.translate.instant(movil), ancla: 'agent-phone' });
    return out;
  });

  /** El punto rojo del índice: la sección tiene un aviso a la vista. En el alta, la que se dejó con algo por hacer (DD-222). */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() =>
    this.mode() !== 'edit'
      ? new Set([...this.alta.estados()].filter(([, estado]) => estado === 'error').map(([id]) => id))
      : new Set(this.avisos().map((a) => a.seccion)),
  );

  /**
   * Lo que dice cada sección en el índice, en texto: TODO lo que le falta, con la etiqueta corta («Un grupo»), como en el
   * grupo (DD-222). En el alta, de todas (en gris hasta que se deja la sección); al editar, solo de las que tienen un aviso
   * a la vista. Hasta DD-225, al editar decía el aviso entero del primero («Hace falta al menos un grupo»).
   */
  protected readonly sectionErrorHints = computed<Readonly<Record<string, string>>>(() => {
    const todas = this.faltasPorSeccion();
    if (this.mode() !== 'edit') return todas;
    const conAviso = this.sectionsWithErrors();
    return Object.fromEntries(Object.entries(todas).filter(([id]) => conAviso.has(id)));
  });

  /**
   * El marcador de cada sección, en el alta y al duplicar (DD-222, SISMAC-4062): sin revisar, en curso, con novedades,
   * completa (o revisada) y en rojo. Al editar no hay marcadores: el punto rojo y lo que falta bajo la sección.
   */
  protected readonly sectionStates = computed(() => (this.mode() !== 'edit' ? this.alta.estados() : null));

  /**
   * Lo que falta en cada sección, en una línea para el índice: «Nombre, email, extensión», «Un grupo», sin «Falta:» (el
   * rojo y el marcador ya lo dicen). Lo mal escrito de General («El email no es válido», «Ya hay un agente con este
   * email») entra detrás, con su aviso.
   */
  private readonly faltasPorSeccion = computed<Readonly<Record<string, string>>>(() => {
    this.currentLang();
    const t = (key: string) => this.translate.instant(key);
    const por: Record<string, string[]> = {};
    for (const f of this.faltas()) (por[f.seccion] ??= []).push(t(f.etiqueta));
    for (const mal of [this.emailError(), this.phoneError()]) {
      if (mal) (por['agent-section-general'] ??= []).push(t(mal).replace(/^./, (c: string) => c.toLowerCase()));
    }
    const out: Record<string, string> = {};
    for (const [id, items] of Object.entries(por)) out[id] = items.join(', ').replace(/^./, (c) => c.toUpperCase());
    return out;
  });

  /** Las secciones con cambios sin guardar (DD-122), al editar. Todos los permisos viven ya en Configuración. */
  protected readonly sectionsWithChanges = computed<ReadonlySet<string>>(() => {
    if (this.mode() !== 'edit') return new Set<string>();
    return new Set([...this.dirtyState.changedKeys()].map((key) => AGENT_SECTION_OF_FIELD[key as keyof FormState]));
  });

  /** Grupos donde está habilitado sobre asignados, la cifra con anillo del resumen (DD-126). */
  protected readonly summaryGroups = computed(() => {
    const links = this.form().links;
    return { activos: links.filter((l) => l.active).length, total: links.length };
  });

  /**
   * Lo que el resumen dice sin anillo: lo que más pesa del agente, lo mismo que se mira en el listado (revisión de
   * agentes del 2026-10-09). Por qué canales le llega trabajo (los de sus grupos activos), su extensión y dónde suena,
   * si se graban sus llamadas, por qué grupo salen y, en un cliente con CusCare, de qué tipo es. Cada fila lleva a su
   * campo (DD-146).
   */
  protected readonly summaryFacts = computed<readonly FilaDelResumen[]>(() => {
    this.currentLang();
    const f = this.form();
    const t = (key: string) => this.translate.instant(key);
    const grupos = new Map(this.availableGroups().map((g) => [g.id, g]));
    const canales = canonicalizeChannels(f.links.filter((l) => l.active).flatMap((l) =>
      clampLinksToChannels([l], grupos.get(l.groupId)?.channels ?? [], () => f.allowedChannels)[0].channels,
    ));
    // Familias (DD-147): «Chat» es Web Chat y WhatsApp.
    const etiquetas: Readonly<Record<string, string>> = FAMILY_LABEL_KEYS;
    const saliente = this.outboundGroupId();
    const filas: FilaDelResumen[] = [
      // Por dónde le llega trabajo: los canales de sus grupos habilitados (DD-147), así que lleva a Grupos, donde se
      // cambia; los que PUEDE atender son las casillas de General (barrido de consistencia, 2026-10-09). «Canales», con
      // el icono de cada uno, como la columna de la lista (revisión de producto del 2026-10-15; antes, «Atiende por»).
      {
        icono: 'forum',
        // Sin grupos habilitados lo dice así: «Sin canales» contradecía las casillas de General, que sí los tienen
        // (barrido de consistencia del 2026-10-20).
        valor: canales.length
          ? canales.map((c) => t(etiquetas[c])).join(', ')
          : t(f.links.some((l) => l.active) ? 'agents.form.summary.no_channels' : 'agents.form.summary.no_enabled_groups'),
        etiqueta: 'agents.form.summary.channels',
        seccion: 'agent-section-groups',
        ancla: null,
        canales,
      },
      // El número, con el icono de dónde suena (navegador o teléfono) en vez de la palabra, como la lista.
      {
        icono: 'dialpad',
        valor: f.extension || t('agents.form.fields.extension_empty'),
        etiqueta: 'agents.form.fields.extension',
        seccion: 'agent-section-general',
        ancla: 'agent-ext',
        extension: f.extension ? { numero: f.extension, tipo: f.extensionType } : undefined,
      },
    ];
    // La grabación y las salientes son de las llamadas: sin Teléfono no se dicen (DD-211 §2). Las salientes, además, solo
    // con Call Blending (DD-211 §9).
    if (this.attendsPhone()) {
      filas.push({
        icono: 'radio_button_checked',
        valor: t(f.permissions.recording ? 'common.yes' : 'common.no'),
        etiqueta: 'agents.form.section.recording',
        seccion: 'agent-section-config',
        ancla: 'agent-recording',
        graba: f.permissions.recording,
      });
      if (this.conCallBlending) {
        filas.push({
          icono: 'call_made',
          valor: (saliente !== null ? grupos.get(saliente)?.name : null) ?? t('agents.form.summary.none'),
          etiqueta: 'agents.form.summary.outbound',
          seccion: 'agent-section-groups',
          ancla: null,
        });
      }
    }
    // Lo que le llega de Repositorios, como en el resumen del grupo.
    filas.push({
      icono: 'library_books',
      valor: String(this.resourceCount()),
      etiqueta: 'agents.form.section.resources',
      seccion: 'agent-section-resources',
      ancla: null,
    });
    if (this.conCusCare) {
      filas.push({
        icono: 'badge',
        valor: t(this.typeLabelKeys[f.agentType]),
        etiqueta: 'agents.form.fields.type',
        seccion: 'agent-section-general',
        ancla: 'agent-type',
      });
    }
    return filas;
  });

  /** El glifo de cada tipo de extensión y el nombre de cada canal, para los iconos de la cabecera y del resumen. */
  protected extensionIcon(tipo: ExtensionType): string {
    return EXTENSION_ICONS[tipo];
  }
  protected readonly familyLabelKeys: Readonly<Record<string, string>> = FAMILY_LABEL_KEYS;

  /** Lo que le llega de Repositorios en Recursos: agendas, plantillas de chat (si atiende chat) y equipos. */
  private readonly resourceCount = computed(() => {
    const f = this.form();
    return f.scheduleIds.size + (this.attendsChat() ? this.chatTemplateValue().length : 0) + f.teamIds.size;
  });

  /**
   * El grupo de sus salientes: el elegido si sigue valiendo (asignado y con Teléfono marcado) y, si no, el primero de sus
   * grupos con Teléfono. Es obligatorio (revisión de agentes), así que siempre hay uno en cuanto se puede: el desplegable
   * bajo la tabla lo enseña elegido. Sin ningún grupo con Teléfono, falta (`faltas`). Sin Call Blending no hay (DD-211 §9).
   */
  protected readonly outboundGroupId = computed<number | null>(() => {
    if (!this.conCallBlending) return null;
    const elegibles = this.linksVistos().filter((l) => l.channels.includes('phone'));
    const id = this.form().defaultOutboundGroupId;
    if (id !== null && elegibles.some((l) => l.groupId === id)) return id;
    return elegibles[0]?.groupId ?? null;
  });

  /** La dirección de cada sección a la que lleva el resumen, como la escribe el índice (DD-146). */
  protected readonly summaryHrefs = computed<Readonly<Record<string, string>>>(() =>
    Object.fromEntries(this.navSections().map((s) => [s.id, s.href ?? ''])),
  );

  /** Un clic normal en el resumen se queda en la ficha; con Cmd o Ctrl, el enlace abre otra pestaña. */
  protected pulsarResumen(evento: MouseEvent, destino: DestinoDelResumen): void {
    if (evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    this.irDesdeResumen(destino);
  }

  /** Lo que se pulsa en el resumen lleva a su sección y, dentro de ella, a su campo (DD-146), como en la ficha de grupo. */
  /** Lleva a un campo de la ficha (o al título de su sección): lo que pulsar «Crear agente» con algo pendiente hace. */
  private irACampo(seccion: string, ancla: string | null): void {
    this.irDesdeResumen({ seccion, ancla });
  }

  protected irDesdeResumen(destino: DestinoDelResumen): void {
    const llegar = () =>
      destino.ancla ? llegarAAncla(destino.ancla, this.injector) : llegarASeccion(destino.seccion, this.injector);
    if (this.activeSection() === destino.seccion) {
      llegar();
      return;
    }
    void this.goTo(destino.seccion).then((llego) => {
      if (llego && this.activeSection() === destino.seccion) llegar();
    });
  }

  /**
   * Matrix layout for the calls/transfers permissions, the same one as
   * Contact Center › Agentes (DD-135). Rows are destination categories,
   * columns are llamada/transferencia. Each (row, col) maps to one or two
   * flat `AgentPermissions` keys (`matrixCell`).
   */
  protected readonly destinoKeys = DESTINO_KEYS;

  protected readonly columnState = computed<Record<DestinoCol, TriState>>(
    () => {
      const p = this.form().permissions;
      const tally = (col: DestinoCol): TriState =>
        triStateOf(
          this.destinoKeys.filter((k) => matrixCell(p, k, col))
            .length,
          this.destinoKeys.length
        );
      return {
        llamada: tally('llamada'),
        transferencia: tally('transferencia'),
      };
    }
  );

  /** Filas y columnas de la matriz, ya traducidas: el DS no traduce contenido. */
  protected readonly matrixRows = computed<readonly ScMatrixRow[]>(() => {
    this.currentLang();
    return this.destinoKeys.map((row) => ({
      id: row,
      label: this.translate.instant('agents.form.permissions.row_' + row),
    }));
  });

  protected readonly matrixColumns = computed<readonly ScMatrixColumn[]>(() => {
    this.currentLang();
    return [
      {
        id: 'llamada',
        label: this.translate.instant('agents.form.permissions.col_llamada'),
      },
      {
        id: 'transferencia',
        label: this.translate.instant(
          'agents.form.permissions.col_transferencia'
        ),
      },
    ];
  });

  protected readonly matrixChecked = computed(() => {
    const permissions = this.form().permissions;
    return (rowId: string, columnId: string): boolean =>
      matrixCell(permissions, rowId as DestinoKey, columnId as DestinoCol);
  });

  protected onMatrixToggle(e: ScMatrixToggle): void {
    this.toggleMatrix(e.rowId as DestinoKey, e.columnId as DestinoCol);
  }

  protected onMatrixColumnToggle(e: ScMatrixColumnToggle): void {
    this.toggleColumnAll(e.columnId as DestinoCol, e.checked);
  }

  protected matrixValue(row: DestinoKey, col: DestinoCol): boolean {
    return matrixCell(this.form().permissions, row, col);
  }

  protected toggleMatrix(row: DestinoKey, col: DestinoCol): void {
    this.form.update((f) => {
      const permissions = { ...f.permissions };
      setMatrixCell(permissions, row, col, !matrixCell(f.permissions, row, col));
      return { ...f, permissions };
    });
  }

  protected toggleColumnAll(col: DestinoCol, next: boolean): void {
    this.form.update((f) => {
      const permissions = { ...f.permissions };
      for (const row of this.destinoKeys) {
        setMatrixCell(permissions, row, col, next);
      }
      return { ...f, permissions };
    });
  }
  /** Los estados que se pueden poner a mano, y el que tiene ahora aunque no sea de esos (Post-conversando, por ejemplo).
   *  Desconectado nunca se elige, y con él el campo se apaga: no hay sesión a la que cambiarle el estado. */
  protected readonly presenceOptions = computed<readonly PresenceStatus[]>(() => {
    const actual = this.form().presenceStatus;
    return this.presenceStates.includes(actual) ? this.presenceStates : [...this.presenceStates, actual];
  });

  protected readonly presenceStates: readonly PresenceStatus[] = [
    'disponible',
    'no_disponible',
    'bano',
    'comida',
    'formacion',
  ];

  protected readonly editingId = signal<number | null>(null);
  /**
   * Si el usuario llegó vía "Duplicar" desde un row-menu, este signal guarda
   * el nombre del agente origen para mostrar en el title + breadcrumb. NULL
   * cuando es create vacío normal. Coexiste con `editingId === null` —
   * juntos describen los 3 modos: edit (editingId truthy), duplicate
   * (editingId null + duplicatingFromName truthy), create (ambos null).
   */
  protected readonly duplicatingFromName = signal<string | null>(null);
  protected readonly initial = signal<Agent | null>(null);
  protected readonly form = signal<FormState>(this.emptyForm());
  /*
   * R6 · una sola política de error (DD-217). Un error de CONTENIDO (un email o un teléfono mal escritos) se dice en
   * vivo, en su campo. Lo que FALTA no es un error mientras se rellena: se dice al pulsar «Crear agente» o «Guardar», en
   * su campo (también nombre, email y extensión, que hasta el 2026-10-20 solo lo decían el índice y el botón) y en el
   * índice, con su texto.
   */
  protected readonly emailError = computed<string | null>(() => {
    const email = this.form().email.trim();
    if (email.length === 0) return null;
    if (!EMAIL_RE.test(email)) return 'agents.errors.email_invalid';
    // No puede repetirse: el de otro agente se dice en vivo, como lo mal escrito (SISMAC-4062, DD-225).
    const yo = this.editingId();
    const propio = email.toLowerCase();
    return this.agentsStore.agents().some((a) => a.id !== yo && a.email?.trim().toLowerCase() === propio)
      ? 'agents.errors.email_taken'
      : null;
  });

  /**
   * El teléfono, si se escribe, con la misma regla que la agenda (`telefonoValido`, DD-163): un `+` opcional y de 3
   * a 15 cifras. Es el móvil donde suena la extensión: «abc» no se puede guardar (candidato 18 del barrido).
   */
  protected readonly phoneError = computed<string | null>(() => {
    const phone = this.form().phone.trim();
    if (phone.length === 0) return null;
    return telefonoValido(phone) ? null : 'agents.errors.phone_invalid';
  });

  protected readonly saving = signal(false);

  /** Dirty-state por CAMBIO NETO (snapshot vs pristine): Guardar se reactiva
   *  solo si hay algo distinto que guardar y vuelve a apagarse si deshaces.
   *  Patrón compartido (admin/AED/builder); `formDirty` queda de alias de
   *  lectura para el guard de salida (DirtyAware) y el template. */
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;
  /** Lo que dice «Caducar contraseña» al hacerse, junto a su botón (DD-191). */
  protected readonly expiraAviso = signal<string | null>(null);

  protected readonly mode = computed<'edit' | 'duplicate' | 'create'>(() => {
    if (this.editingId()) return 'edit';
    if (this.duplicatingFromName()) return 'duplicate';
    return 'create';
  });

  /** Mode pasado al SCDS <sc-sticky-form-header>, que solo conoce edit/create.
   *  `duplicate` se mapea a `create` (la entidad NO existe aún hasta Guardar). */
  protected readonly headerMode = computed<'edit' | 'create'>(() =>
    this.mode() === 'edit' ? 'edit' : 'create'
  );


  /** Hay algo que no deja crear ni guardar: lo que falta o lo mal escrito. */
  private readonly pendiente = computed(() => this.faltas().length > 0 || this.formatoMal());

  /**
   * El botón se puede pulsar sin nada pendiente: al crear y al duplicar, en cuanto está lo obligatorio; al editar,
   * además, con cambios (se apaga otra vez si deshaces). Como pide SISMAC-4058 para el grupo (DD-219).
   */
  protected readonly canSave = computed(() => !this.pendiente() && (this.mode() !== 'edit' || this.dirtyState.dirty()));

  /**
   * Por qué está apagado el botón, para su tooltip: lo que falta («Falta: nombre, email»), lo primero mal escrito o, al
   * editar sin cambios, «No hay cambios que guardar» (DD-212). Vacío si se puede pulsar.
   */
  protected readonly motivoApagado = computed(() => {
    this.currentLang();
    if (this.canSave()) return '';
    const falta = this.summaryMissing();
    if (falta.length > 0) {
      return this.translate.instant('common.summary_missing', { items: falta.map((f) => f.etiqueta).join(', ') });
    }
    const mal = this.avisos()[0];
    return mal ? mal.texto : this.translate.instant('common.no_changes');
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const agent = this.agentsStore.getAgent(Number(idParam));
      if (!agent) {
        void this.router.navigateByUrl('/admin/agentes', { replaceUrl: true });
        return;
      }
      this.editingId.set(agent.id);
      this.initial.set(agent);
      this.form.set({
        name: agent.name,
        extension: agent.extension,
        extensionType: agent.extensionType,
        agentType: agent.agentType,
        status: agent.status,
        presenceStatus: agent.presenceStatus ?? 'disponible',
        phone: agent.phone ?? '',
        email: agent.email ?? '',
        pin: agent.pin ?? '',
        // Lo guardado con «Automático con preview», que ya no existe, se lee como automático (DD-211 §2).
        pickupType: agent.pickupType === 'manual' ? 'manual' : 'auto',
        randomOrder: agent.randomOrder ?? false,
        maxChats: agent.maxChats ?? 4,
        iframeMode: iframeModeOf(agent),
        iframeUrl: agent.iframeUrl ?? '',
        iframeTitle: agent.iframeTitle ?? '',
        links: this.linksStore.linksForAgent(agent.id),
        defaultOutboundGroupId: agent.defaultOutboundGroupId ?? null,
        permissions: { ...agent.permissions },
        allowedChannels: agent.allowedChannels ?? CHANNEL_FAMILIES,
        photo: agent.photo ?? null,
        languages: agent.languages ? [...agent.languages] : [],
        // Lo borrado en Repositorios sale ANTES de marcar la ficha como guardada (DD-164).
        ...this.recursosVivos(agent),
      });
      this.dirtyState.markPristine();
      return;
    }

    // En el alta la dirección no dice sección (DD-143), y se quita la que traiga (el duplicado conserva su
    // `seedFromId`).
    if (this.route.snapshot.queryParamMap.has('seccion')) {
      void this.sectionLinks.go(this.sectionLinks.section(this.route, null), { replace: true });
    }

    // Modo "Duplicar": detecta ?seedFromId en query params y precarga el form desde el source. El nombre, como al
    // duplicar un grupo: «Tom Hanks (1)», el siguiente número libre (DD-217). Lo que identifica a una persona y no
    // puede repetirse (extensión, email, PIN) se vacía: lo pide cada campo al pulsar «Crear agente». Por eso el
    // agente no se crea en el acto, como el grupo: sin esos tres no es un agente válido. La foto y el móvil, que son
    // de otra persona, también, y el estado no se copia: nace «Desconectado», como todo agente nuevo (SISMAC-4060, DD-225).
    const seedFromId = this.route.snapshot.queryParamMap.get('seedFromId');
    if (seedFromId) {
      const source = this.agentsStore.getAgent(Number(seedFromId));
      if (!source) {
        void this.router.navigateByUrl('/admin/agentes', { replaceUrl: true });
        return;
      }
      this.duplicatingFromName.set(source.name);
      this.form.set({
        // El nombre, como el de la copia de un grupo; extensión, email y PIN, vacíos: no pueden repetirse. La foto y el
        // móvil, vacíos: son de otra persona.
        name: nombreDeCopia(source.name, this.agentsStore.agents().map((a) => a.name)),
        extension: '',
        email: '',
        pin: '',
        photo: null,
        phone: '',
        presenceStatus: 'desconectado',
        // Resto del payload copiado tal cual.
        extensionType: this.tipoExtension(source.extensionType),
        agentType: source.agentType,
        status: source.status,
        // Lo guardado con «Automático con preview», que ya no existe, se lee como automático (DD-211 §2).
        pickupType: source.pickupType === 'manual' ? 'manual' : 'auto',
        randomOrder: source.randomOrder ?? false,
        maxChats: source.maxChats ?? 4,
        iframeMode: iframeModeOf(source),
        iframeUrl: source.iframeUrl ?? '',
        iframeTitle: source.iframeTitle ?? '',
        links: this.linksStore.linksForAgent(source.id),
        // El grupo de sus salientes, solo con Call Blending (SISMAC-4060).
        defaultOutboundGroupId: this.conCallBlending ? (source.defaultOutboundGroupId ?? null) : null,
        permissions: { ...source.permissions },
        allowedChannels: source.allowedChannels ?? CHANNEL_FAMILIES,
        languages: source.languages ? [...source.languages] : [],
        ...this.recursosVivos(source),
      });
      // La copia es el punto de partida, como el formulario vacío de un alta: «Deshacer» vuelve a ella y no la vacía,
      // y salir sin tocar nada no pregunta (barrido de consistencia del 2026-10-20: Deshacer dejaba la copia en
      // blanco sin confirmar, con 12 grupos asignados).
      this.dirtyState.markPristine();
    }
  }

  /** Etiquetas, agendas y plantillas de un agente guardado, sin lo que ya no existe en Repositorios: ni se cuenta, ni
   *  se guarda de vuelta, ni la ficha abre con cambios por ello (DD-164). */
  private recursosVivos(agent: Agent): Pick<FormState, 'labelIds' | 'scheduleIds' | 'templateIds' | 'teamIds'> {
    return {
      labelIds: new Set(idsVivos(agent.labels ?? [], this.labelsStore.labels())),
      scheduleIds: new Set(idsVivos(agent.schedules ?? [], this.agendasStore.items())),
      templateIds: new Set(idsVivos(agent.templates ?? [], this.templatesStore.templates())),
      teamIds: new Set(idsVivos(agent.teams ?? [], this.equipos.items())),
    };
  }


  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.formDirty() && !this.saving()) event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void this.save();
    }
  }

  protected updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  /**
   * Adapter para `<sc-select>` con primitive `AgentType[]` options + label
   * via `<ng-template #item>` (proyectado al `<p-select>` de PrimeNG).
   * Valida que el value emitido sea un AgentType conocido antes de actualizar.
   */
  protected onAgentTypeValueChange(value: unknown): void {
    if (
      typeof value === 'string' &&
      (AGENT_TYPES as readonly string[]).includes(value)
    ) {
      this.updateField('agentType', value as AgentType);
    }
  }

  protected onAgentTypeChange(event: Event): void {
    this.updateField(
      'agentType',
      (event.target as HTMLSelectElement).value as AgentType
    );
  }

  protected onPresenceChange(event: Event): void {
    this.updateField(
      'presenceStatus',
      (event.target as HTMLSelectElement).value as PresenceStatus
    );
  }

  /** Adapter para `<sc-select>` con whitelist de PresenceStatus. */
  protected onPresenceValueChange(value: unknown): void {
    if (
      typeof value === 'string' &&
      this.presenceOptions().includes(value as PresenceStatus)
    ) {
      this.updateField('presenceStatus', value as PresenceStatus);
    }
  }

  /** El tipo de descuelgue: una de las dos tarjetas. */
  protected onPickupValueChange(value: unknown): void {
    if ((PICKUP_TYPES as readonly unknown[]).includes(value)) this.updateField('pickupType', value as PickupType);
  }

  protected onExtensionTypeChange(value: unknown): void {
    if ((EXTENSION_TYPES as readonly unknown[]).includes(value)) this.updateField('extensionType', value as ExtensionType);
  }

  /** Pregunta en un globo pegado al botón (no en un diálogo centrado): pregunta y resultado, en el mismo sitio. */
  protected async requestExpirePassword(event?: MouseEvent): Promise<void> {
    const name =
      this.form().name || this.translate.instant('agents.entity_singular');
    const ok = await this.confirmHost.request({
      title: this.translate.instant('agents.form.advanced.sesion.expire_title'),
      body: this.translate.instant('agents.form.advanced.sesion.expire_body', {
        name,
      }),
      acceptLabel: this.translate.instant(
        'agents.form.advanced.sesion.expire_accept'
      ),
      rejectLabel: this.translate.instant('common.cancel'),
      acceptTone: 'danger',
      target: event?.currentTarget ?? event?.target ?? null,
    });
    if (!ok) return;
    this.expiraAviso.set(this.translate.instant('agents.form.advanced.sesion.expire_toast', { name }));
  }

  protected onRandomOrderChange(checked: boolean): void {
    this.updateField('randomOrder', checked);
  }

  /**
   * Adapter para `<sc-select>` (`number[]` options). El componente emite el
   * primitive directamente — no necesita parseo de string como el handler
   * legacy de `<select>` native.
   */
  protected onMaxChatsValueChange(value: unknown): void {
    if (typeof value === 'number' && Number.isFinite(value)) {
      this.updateField('maxChats', value);
    }
  }

  protected onExtensionChange(event: Event): void {
    this.updateField('extension', (event.target as HTMLSelectElement).value);
  }

  /**
   * Adapter para `<sc-select>` con `optionValue="number"` (objetos
   * `ExtensionOption`). Permite valor vacío `''` para el caso "deseleccionar"
   * (showClear). El value emitido es la string `number` de la extension.
   */
  protected onExtensionValueChange(value: unknown): void {
    if (value === undefined || value === null) {
      this.updateField('extension', '');
      return;
    }
    if (typeof value === 'string') this.updateField('extension', value);
  }

  protected onStatusChange(checked: boolean): void {
    this.updateField('status', checked ? 'active' : 'inactive');
  }

  protected readonly allowedFamilies = CHANNEL_FAMILIES;
  protected readonly allowedFamilyLabels = FAMILY_LABEL_KEYS;

  protected setAllowedChannel(channel: Channel, checked: boolean): void {
    this.form.update(form => ({ ...form, allowedChannels: CHANNEL_FAMILIES.filter(family => family === channel ? checked : form.allowedChannels.includes(family)) }));
  }

  protected onLinksChange(links: readonly GroupAgentLink[]): void {
    this.form.update((f) => ({ ...f, links }));
  }

  protected togglePermission(key: keyof AgentPermissions): void {
    this.form.update((f) => ({
      ...f,
      permissions: { ...f.permissions, [key]: !f.permissions[key] },
    }));
  }

  protected onRecordingChange(checked: boolean): void {
    this.form.update((f) => ({
      ...f,
      permissions: { ...f.permissions, recording: checked },
    }));
  }

  protected onPhotoChange(photo: string | null): void {
    this.form.update((f) => ({ ...f, photo }));
  }

  protected onNameRename(name: string): void {
    this.updateField('name', name);
  }

  /**
   * QUITAR CANALES, IGUAL QUE EN LA FICHA DE GRUPO (revisión del 2026-10-09): una asignación sin canales no existe. Si
   * al quitar un canal de General algún grupo se queda sin ninguno, el agente sale de él al guardar, y antes se pregunta
   * con las palabras del grupo («Vas a quitar canales», «Sí, quitar»), diciendo de cuáles. Hasta ese día esta ficha
   * conservaba la asignación vacía (DD-150) y la del grupo la quitaba (DD-147): la misma acción daba dos resultados.
   */
  protected async save(): Promise<void> {
    if (this.saving() || (this.mode() === 'edit' && !this.dirtyState.dirty())) return;
    // El botón está apagado con algo pendiente (DD-219), pero se llega aquí también por otro camino (Guardar del aviso de
    // Repositorios, Ctrl+S): no crea ni guarda, dice lo que falta en rojo y lleva al primer campo.
    if (this.pendiente()) {
      this.destinoTrasGuardar = null;
      this.ocasion.intentar();
      const primero = this.avisos()[0];
      if (primero) this.irACampo(primero.seccion, primero.ancla);
      return;
    }
    const allowed = new Set(this.form().allowedChannels);
    const affected = this.form().links.filter(link => link.channels.some(channel => !allowed.has(channel)));
    if (affected.length) {
      const nombres = new Map(this.availableGroups().map(group => [group.id, group.name]));
      const quitados = canonicalizeChannels(affected.flatMap(link => link.channels.filter(channel => !allowed.has(channel))));
      const sinCanales = new Set(this.availableGroups().filter(group => group.channels.length === 0).map(group => group.id));
      const salen = this.linksVistos().filter(link => link.channels.length === 0 && !sinCanales.has(link.groupId));
      const etiquetas: Readonly<Record<string, string>> = FAMILY_LABEL_KEYS;
      const accepted = await this.alertModal({
        variant: 'error',
        title: this.translate.instant('groups.form.cascade.title'),
        message: this.translate.instant(this.removeBodyKey(affected.length, salen.length), {
          channels: quitados.map(c => this.translate.instant(etiquetas[c])).join(', '),
          count: affected.length,
          groups: salen.map(link => nombres.get(link.groupId) ?? String(link.groupId)).join(', '),
        }),
        actionLabel: this.translate.instant('groups.form.cascade.confirm'),
        secondaryActionLabel: this.translate.instant('common.cancel'),
      });
      if (!accepted) {
        this.destinoTrasGuardar = null;
        return;
      }
    }

    this.saving.set(true);
    setTimeout(() => {
      const f = this.form();

      const payload: Omit<Agent, 'id' | 'code'> = {
        name: f.name.trim(),
        extension: f.extension,
        extensionType: this.tipoExtension(f.extensionType),
        // Sin CusCare no hay tipos: todos son normales.
        agentType: this.conCusCare ? f.agentType : 'normal',
        status: f.status,
        presenceStatus: f.presenceStatus,
        phone: f.phone.trim() || undefined,
        email: f.email.trim() || undefined,
        pin: f.pin.trim() || undefined,
        // Elegir navegador o teléfono en el puesto pide un móvil: sin él, no se guarda encendido.
        permissions: { ...f.permissions, manageDevices: f.permissions.manageDevices && !!f.phone.trim() },
        allowedChannels: f.allowedChannels,
        pickupType: f.pickupType,
        randomOrder: f.randomOrder,
        maxChats: f.maxChats,
        iframeMode: f.iframeMode,
        // La URL y el título propios solo se guardan con «Personalizado»; con las otras dos no se leen.
        iframeUrl: f.iframeMode === 'custom' ? f.iframeUrl.trim() || undefined : undefined,
        iframeTitle: f.iframeMode === 'custom' ? f.iframeTitle.trim() || undefined : undefined,
        photo: f.photo ?? undefined,
        languages: f.languages.length > 0 ? f.languages : undefined,
        labels: f.labelIds.size > 0 ? Array.from(f.labelIds) : undefined,
        schedules:
          f.scheduleIds.size > 0 ? Array.from(f.scheduleIds) : undefined,
        templates:
          f.templateIds.size > 0 ? Array.from(f.templateIds) : undefined,
        teams: f.teamIds.size > 0 ? Array.from(f.teamIds) : undefined,
        // Solo si sigue siendo uno de sus grupos con Teléfono.
        defaultOutboundGroupId: this.outboundGroupId() ?? undefined,
      };

      const editingId = this.editingId();
      if (editingId) {
        this.agentsStore.updateAgent(editingId, { ...payload });
        this.linksStore.replaceLinksForAgent(
          editingId,
          this.normalizeLinks(f.links, editingId)
        );
        this.form.update(current => ({ ...current, links: this.linksStore.linksForAgent(editingId) }));
        const refreshed = this.agentsStore.getAgent(editingId);
        if (refreshed) this.initial.set(refreshed);
        this.resultado.contar(this.translate.instant('agents.toasts.updated', { name: payload.name }));
      } else {
        this.createAgent(payload);
        return;
      }
      this.saving.set(false);
      this.ocasion.olvidar();
      this.dirtyState.markPristine();
      this.irAlDestino();
    }, 400);
  }

  /** La frase del aviso de quitar canales, con su número: «en 1 grupo», no «en 1 grupos» (SISMAC-4062, DD-225). */
  private removeBodyKey(grupos: number, salen: number): string {
    const base = 'agents.form.allowed.remove_body';
    if (salen === 0) return grupos === 1 ? `${base}_one` : base;
    if (grupos === 1) return `${base}_orphaned_one`;
    return salen === 1 ? `${base}_orphaned_single` : `${base}_orphaned`;
  }

  /* ── «Gestionar en Repositorios»: sale de la ficha, así que con cambios pide guardar antes, como la de grupo ──── */

  /** La dirección del enlace, para abrirlo en otra pestaña con Cmd+clic o el botón central, que no pregunta nada. */
  protected readonly repositoriosHref = inject(LocationStrategy).prepareExternalUrl('/admin/repositorios');
  /** Adónde ir cuando acabe de guardar; `null`, quedarse en la ficha. */
  private destinoTrasGuardar: string | null = null;

  protected async irARepositorios(event: MouseEvent): Promise<void> {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!this.formDirty()) {
      void this.router.navigateByUrl('/admin/repositorios');
      return;
    }
    const guardar = await this.alertModal({
      variant: 'info',
      title: this.translate.instant('agents.form.repositories_leave.title'),
      message: this.translate.instant('agents.form.repositories_leave.body'),
      actionLabel: this.translate.instant('common.save'),
      secondaryActionLabel: this.translate.instant('common.discard_keep'),
    });
    if (!guardar) return;
    this.destinoTrasGuardar = '/admin/repositorios';
    void this.save();
  }

  /** Tras guardar, al destino que se pidió (Repositorios), si lo hay. */
  private irAlDestino(): void {
    const destino = this.destinoTrasGuardar;
    this.destinoTrasGuardar = null;
    if (destino) void this.router.navigateByUrl(destino);
  }

  /**
   * Da de alta el agente y abre su EDICIÓN en la sección en la que se estaba, como la ficha de grupo.
   * Navegar (y no solo cambiar la dirección con `Location.replaceState`, como hasta el 2026-09-27) pone
   * al día el router: con la dirección cambiada a mano el router seguía en `crear`, y cada enlace del
   * índice llevaba a un alta vacía. La nueva ficha coge su candado al cargar. Se marca limpia antes,
   * para que el guardián de salida no pregunte.
   */
  private createAgent(payload: Parameters<AgentsStore['addAgent']>[0]): void {
    const f = this.form();
    const slug = Object.entries(AgentFormPageComponent.SECTION_SLUGS).find(([, v]) => v === this.activeSection())?.[0];
    const created = this.agentsStore.addAgent(payload);
    this.linksStore.replaceLinksForAgent(created.id, this.normalizeLinks(f.links, created.id));
    const creado = this.translate.instant('agents.toasts.created', { name: created.name });
    this.dirtyState.markPristine();
    const destino = this.destinoTrasGuardar;
    this.destinoTrasGuardar = null;
    void this.router
      .navigate(['/admin/agentes/editar', created.id], {
        replaceUrl: true,
        queryParams: slug && slug !== 'general' ? { seccion: slug } : {},
      })
      // Si se guardó para ir a Repositorios, allí: Atrás vuelve al agente ya creado.
      .then(() => (destino ? this.router.navigateByUrl(destino) : true))
      // El toast, ya en la ficha a la que se llega (DD-211 §5).
      .then(() => this.resultado.contar(creado))
      .finally(() => this.saving.set(false));
  }

  /**
   * Cada enlace con su agente y sus canales recortados; el que se queda sin ninguno, fuera (ver `save`), salvo en un
   * grupo sin canales, donde se pertenece sin canal (DD-217).
   */
  private normalizeLinks(
    links: readonly GroupAgentLink[],
    agentId: number
  ): readonly GroupAgentLink[] {
    const groups = new Map(this.availableGroups().map(group => [group.id, group.channels]));
    return links
      .map(link => {
        const clamped = clampLinksToChannels([link], groups.get(link.groupId) ?? [], () => this.form().allowedChannels)[0];
        return clamped.agentId === agentId ? clamped : { ...clamped, agentId };
      })
      .filter(link => link.channels.length > 0 || (groups.get(link.groupId) ?? []).length === 0);
  }

  /** Vuelve al último estado guardado (al formulario vacío en un alta; a la copia, al duplicar). Es el
   *  «Deshacer» de Contact Center: vuelve atrás, no navega. En el alta deja también el índice como al empezar: la sección
   *  abierta sigue abierta y las demás vuelven a «Sin revisar», como en el grupo (SISMAC-4062, DD-225). */
  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
    this.ocasion.olvidar();
    if (this.mode() !== 'edit') this.alta.reiniciar();
  }

  /** Borrar la ficha: la confirmación simple del DS (DD-215), con el nombre guardado; al aceptar, vuelve al listado. */
  protected async requestDelete(): Promise<void> {
    const id = this.editingId();
    if (!id) return;
    const agent = this.initial();
    if (!(await this.confirmarBorrado(agent?.name ?? ''))) return;
    this.agentsStore.deleteAgent(id);
    this.linksStore.removeAgent(id);
    this.dirtyState.markPristine();
    this.resultado.contar(this.translate.instant('agents.toasts.deleted_single', { name: agent?.name ?? '' }));
    void this.router.navigateByUrl('/admin/agentes');
  }

  /** El alta nace con lo que fija Contact Center › Agentes (DD-135): permisos y URL del iframe. Y «Desconectado», hasta
   *  que el agente entra (SISMAC-4062, DD-225); hasta entonces nacía «Disponible». */
  private emptyForm(): FormState {
    const defaults = this.agentDefaults.defaults();
    return {
      name: '',
      extension: '',
      extensionType: this.tipoExtension('webrtc'),
      agentType: 'normal',
      status: 'active',
      presenceStatus: 'desconectado',
      phone: '',
      email: '',
      pin: '',
      pickupType: 'auto',
      randomOrder: false,
      maxChats: 4,
      // Nace con la URL de Contact Center › Agentes, y la sigue si allí cambia.
      iframeMode: 'general',
      iframeUrl: '',
      iframeTitle: '',
      links: [],
      defaultOutboundGroupId: null,
      permissions: { ...defaults.permissions },
      allowedChannels: defaults.allowedChannels,
      photo: null,
      languages: [],
      labelIds: new Set(),
      scheduleIds: new Set(),
      templateIds: new Set(),
      teamIds: new Set(),
    };
  }
}
