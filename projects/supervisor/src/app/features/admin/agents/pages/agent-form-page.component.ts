import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  Injector,
  input,
  OnInit,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { LowerCasePipe, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, type UrlTree } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import type {
  ScMatrixColumn,
  ScMatrixColumnToggle,
  ScMatrixRow,
  ScMatrixToggle,
} from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent,
  ScFactRowComponent as FactRowComponent,
} from '@smartcontact-hub/components';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { SectionLinksService } from '@core/services';
import { ScConfirmService } from '@smartcontact-hub/components';
import { EMAIL_RE, PIN_RE } from '@core/utils/validators';
import { TOAST_LIFE } from '@core/utils/toast-life';
import {
  AltaPieComponent,
  NameInplaceComponent,
  NotaDecisionComponent,
  ResourceRowsComponent,
  SummaryKpiComponent,
  SummaryStatusComponent,
} from '@shared/components';
import { llegarAAncla, llegarASeccion, seccionesDeAlta } from '@shared/utils/alta-secciones';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import {
  ScCheckboxComponent as CheckboxComponent,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
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
  ScSubsectionComponent as SubsectionComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
  type TriState,
  triStateOf,
} from '@smartcontact-hub/components';
import { LabelsStore } from '@features/admin/labels/state/labels.store';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import { canonicalizeChannels, GroupAgentLink, type Channel } from '@features/admin/services/group-agent-links.types';
import { clampLinksToChannels } from '@features/admin/services/group-channels.core.mjs';
import { agendasOfrecidas, idsVivos } from '@features/admin/services/recursos.core.mjs';
import { ResourceRowsService } from '@features/admin/services/resource-rows.service';
import { CHANNEL_FAMILIES, FAMILY_LABEL_KEYS } from '@features/admin/groups/data/groups-data';
import { TemplatesStore } from '@features/admin/templates/state/templates.store';
import {
  Template,
  TemplateType,
} from '@features/admin/templates/data/templates-data';
import { AgendasStore, type Agenda } from '@features/admin/repositories/state/agendas.store';
import {
  RecursoDialogComponent,
  type RecursoAbierto,
} from '@features/admin/repositories/components/recurso-dialog/recurso-dialog.component';
import { EquiposStore } from '@features/admin/repositories/state/equipos.store';
import {
  AGENT_TYPES,
  AGENT_TYPE_LABEL_KEYS,
  Agent,
  AgentPermissions,
  AgentType,
  AVAILABLE_EXTENSIONS,
  AVAILABLE_LANGUAGES,
  CLIENTE_CON_CUSCARE,
  DESTINO_KEYS,
  DestinoCol,
  DestinoKey,
  EXTENSION_TYPES,
  ExtensionType,
  PERMISSION_MATRIX_KEYS,
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

/* Sin PIN ni «Cuenta activa» en pantalla (revisión de agentes del 2026-10-09): se guardan como estaban. Tampoco las
 * Etiquetas ni las Plantillas de email, que salen de Recursos. */
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
  iframeUrl: string;
  loginExtOverride: boolean;
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
  iframeUrl: 'agent-section-config',
  loginExtOverride: 'agent-section-config',
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
    LowerCasePipe,
    ButtonComponent,
    NameInplaceComponent,
    NotaDecisionComponent,
    SummaryKpiComponent,
    SummaryStatusComponent,
    AltaPieComponent,
    ResourceRowsComponent,
    CheckboxComponent,
    DeleteEntityDialogComponent,
    RecursoDialogComponent,
    TooltipModule,
    FormSectionNavComponent,
    GroupAssignmentTableComponent,
    InputTextComponent,
    MessageComponent,
    PermissionMatrixComponent,
    PhotoUploadComponent,
    RouterLink,
    MultiSelectComponent,
    OptionCardsComponent,
    SectionCardComponent,
    SelectButtonComponent,
    SelectComponent,
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
  private readonly sectionLinks = inject(SectionLinksService);
  private readonly injector = inject(Injector);
  private readonly agentsStore = inject(AgentsStore);
  private readonly agentDefaults = inject(AgentDefaultsStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly linksStore = inject(GroupAgentLinksStore);
  private readonly messages = inject(MessageService);
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
  private readonly confirmHost = inject(ScConfirmService);

  /** Guardar/Cancelar proyectados a la TopBar (modelo "todo arriba" S59):
   * fuera la banda sticky-form-header; identidad → breadcrumb + campos del
   * cuerpo, acciones → barra de arriba. */
  private readonly topbarActions =
    viewChild<TemplateRef<unknown>>('topbarActions');

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

  /** Dónde suena: en el navegador o en su teléfono móvil. */
  protected readonly extensionTypeOptions = computed(() => {
    this.currentLang();
    return EXTENSION_TYPES.map((value) => ({ value, label: this.translate.instant(`agents.ext_kind.${value}`) }));
  });

  /** Con la extensión en el teléfono, el móvil es obligatorio: es donde suena. */
  protected readonly phoneRequired = computed(() => this.form().extensionType === 'phone');

  /** Lo del chat (chats simultáneos, idiomas, plantillas de chat) solo sale si atiende chat. */
  protected readonly attendsChat = computed(() => this.form().allowedChannels.includes('chat'));

  /** El tipo de agente solo existe en un cliente con CusCare. */
  protected readonly conCusCare = CLIENTE_CON_CUSCARE;

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
  protected readonly availableExtensions = AVAILABLE_EXTENSIONS;
  protected readonly availableLanguages = AVAILABLE_LANGUAGES;
  protected readonly availableLabels = this.labelsStore.labels;

  /** Roster of every group in the system, with channels — fed to the
   * group-assignment table so it can render the correct chip cluster
   * per row and the picker dropdown of joinable groups. */
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

  /** Sus equipos (Repositorios › Equipos). */
  protected readonly teamOptions = computed(() =>
    this.equipos.items().map((g) => ({ label: g.name, value: g.id })),
  );
  protected readonly teamValue = computed(() => [...this.form().teamIds]);

  /** Su fila bajo el campo, como agendas y plantillas (DD-164): qué es y su «Editar», que abre la ventana sin salir. */
  protected readonly teamRows = computed(() => {
    const porId = new Map(this.equipos.items().map((g) => [g.id, g]));
    return [...this.form().teamIds].flatMap((id) => {
      const g = porId.get(id);
      return g ? [{ id, name: g.name, detail: g.description, edit: { link: `/admin/equipos/editar/${id}` } }] : [];
    });
  });

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

  /** Las agendas de `Repositorios > Agendas`: las activas, y las ya puestas aunque estén inactivas (las guardadas y las
   *  de ahora). Una inactiva puesta se puede quitar, pero no se ofrece para poner (DD-164). */
  protected readonly scheduleOptions = computed(() => {
    const puestas = [...(this.initial()?.schedules ?? []), ...this.form().scheduleIds];
    return agendasOfrecidas(this.agendasStore.items(), puestas).map((a: Agenda) => ({ label: a.name, value: a.id }));
  });
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
  protected readonly chatTemplateOptions = computed(() =>
    this.templatesOf('chat').map((t) => ({ label: t.title, value: t.id })),
  );
  protected readonly emailTemplateOptions = computed(() =>
    this.templatesOf('email').map((t) => ({ label: t.title, value: t.id })),
  );
  /* Como `computed` y no como método: el desplegable recibe la MISMA lista mientras no cambie.
   * Un método devolvía un array nuevo en cada ciclo, el desplegable lo tomaba por un cambio y
   * la página se quedaba colgada (medido el 2026-09-14 al abrir Repositorios). */
  private idsOfType(type: TemplateType): number[] {
    const ids = this.form().templateIds;
    return this.templatesOf(type).filter((t) => ids.has(t.id)).map((t) => t.id);
  }
  protected readonly chatTemplateValue = computed(() => this.idsOfType('chat'));
  protected readonly emailTemplateValue = computed(() => this.idsOfType('email'));

  /* El resumen bajo cada campo (DD-164): qué es cada recurso y, al editar, su «Editar». En el alta y al duplicar no lo
   * lleva: la dirección no guarda la sección, y Atrás caería en una ficha vacía. */
  protected readonly agendaRows = computed(() => {
    this.currentLang();
    return this.resourceRows.agendas(this.form().scheduleIds, true);
  });
  protected readonly chatTemplateRows = computed(() => {
    this.currentLang();
    return this.resourceRows.templates(this.form().templateIds, 'chat', true);
  });
  protected readonly emailTemplateRows = computed(() => {
    this.currentLang();
    return this.resourceRows.templates(this.form().templateIds, 'email', true);
  });

  /** Crear o editar una agenda, una plantilla de chat o un equipo sin salir de la ficha (DD-187): la ventana
   *  que abren el «+» de su campo y el «Editar» de sus filas, como en Recursos del grupo. El recién creado se AÑADE a lo
   *  elegido. */
  protected readonly recursoAbierto = signal<RecursoAbierto | null>(null);

  protected alCrearRecurso(r: RecursoAbierto, id: number): void {
    if (r.tipo === 'agenda') this.form.update((f) => ({ ...f, scheduleIds: new Set([...f.scheduleIds, id]) }));
    else if (r.tipo === 'equipo') this.form.update((f) => ({ ...f, teamIds: new Set([...f.teamIds, id]) }));
    else this.form.update((f) => ({ ...f, templateIds: new Set([...f.templateIds, id]) }));
  }

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
   * (Grupos). Hasta ese día eran cinco: Identidad, Grupos, Permisos, Recursos y Avanzado. El listado sigue enlazando
   * directo a Grupos (`?seccion=grupos`), que es donde se trabaja.
   */
  protected readonly navSections = computed<readonly FormNavSection[]>(() =>
    [
      { id: 'agent-section-general', labelKey: 'agents.form.section.general', icon: 'tune' },
      { id: 'agent-section-config', labelKey: 'agents.form.section.config', icon: 'verified_user' },
      // Ni el nombre ni el icono son los del menú (carpeta): con los mismos, quien buscaba la sección acababa en la
      // página Repositorios (DD-105).
      { id: 'agent-section-resources', labelKey: 'agents.form.section.resources', icon: 'library_books' },
      { id: 'agent-section-groups', labelKey: 'agents.form.section.groups', icon: 'group' },
    ].map((sec) => ({ ...sec, href: this.sectionLinks.href(this.sectionUrl(sec.id)) })),
  );

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
   * tienen algo obligatorio (`faltas`); Configuración y Recursos, no.
   */
  protected readonly alta = seccionesDeAlta({
    secciones: this.navSections,
    obligatoria: (id) => id === 'agent-section-general' || id === 'agent-section-groups',
    completa: (id) => !this.faltas().some((f) => f.seccion === id) && (id !== 'agent-section-general' || !this.formatoMal()),
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

  /** Ir a otra sección. En el alta y al duplicar, la sección se abre sin tocar la dirección: Atrás sale (DD-122, DD-143). */
  protected goTo(id: string): Promise<boolean> {
    if (this.mode() !== 'edit') {
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
   * teléfono, el grupo de sus salientes, en Grupos. De aquí salen el resumen («Falta: …»), el punto del índice y el
   * motivo junto a «Guardar»: una sola lista, así no pueden decir cosas distintas.
   */
  private readonly faltas = computed<readonly { seccion: string; resumen: string; motivo: string }[]>(() => {
    const f = this.form();
    const g = 'agent-section-general';
    const gr = 'agent-section-groups';
    const out: { seccion: string; resumen: string; motivo: string }[] = [];
    if (!f.name.trim()) out.push({ seccion: g, resumen: 'common.summary_missing_name', motivo: 'agents.errors.name_required' });
    if (!f.email.trim()) out.push({ seccion: g, resumen: 'agents.form.summary.missing_email', motivo: 'agents.errors.email_required' });
    if (!f.extension) out.push({ seccion: g, resumen: 'agents.form.summary.missing_extension', motivo: 'agents.errors.extension_required' });
    if (this.phoneRequired() && !f.phone.trim()) {
      out.push({ seccion: g, resumen: 'agents.form.summary.missing_phone', motivo: 'agents.errors.phone_required' });
    }
    if (f.allowedChannels.length === 0) {
      out.push({ seccion: g, resumen: 'agents.form.summary.missing_channel', motivo: 'agents.errors.channels_required' });
    }
    // Los grupos que valen son los que tienen algún canal: el que se queda sin ninguno sale al guardar (`save`).
    const conCanal = this.linksVistos().filter((l) => l.channels.length > 0);
    if (conCanal.length === 0) {
      out.push({ seccion: gr, resumen: 'agents.form.summary.missing_group', motivo: 'agents.errors.group_required' });
    }
    if (conCanal.length > 0 && f.allowedChannels.includes('phone') && this.outboundGroupId() === null) {
      out.push({ seccion: gr, resumen: 'agents.form.summary.missing_outbound', motivo: 'agents.errors.outbound_required' });
    }
    return out;
  });

  /** Un email o un PIN mal escritos: no faltan, se dicen en su campo, pero no dejan guardar. */
  private readonly formatoMal = computed(() => !!this.emailError() || !!this.pinError());

  /** Los enlaces como los ve la tabla: con los canales que el grupo ofrece y el agente tiene. */
  private readonly linksVistos = computed(() => {
    const f = this.form();
    const grupos = new Map(this.availableGroups().map((g) => [g.id, g.channels]));
    return f.links.map((l) => clampLinksToChannels([l], grupos.get(l.groupId) ?? [], () => f.allowedChannels)[0]);
  });

  /** Sin canales, el aviso bajo las casillas: al editar, o en el alta desde que se deja General. */
  protected readonly channelsError = computed(
    () =>
      this.form().allowedChannels.length === 0 &&
      (this.mode() !== 'create' || this.alta.dejadas().has('agent-section-general')),
  );

  /** ¿Tiene teléfono móvil? «Gestión de dispositivos» (elegir navegador o teléfono en el puesto) lo necesita. */
  protected readonly hasPhone = computed(() => !!this.form().phone.trim());

  /**
   * Lo que falta, en el índice. Al editar y al duplicar (que llega con campos vacíos a propósito), siempre. En un alta
   * recién abierta no acusa, lo dice el resumen (DD-136); desde que se deja una sección sin lo suyo, sí (DD-143).
   */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() => {
    const acusa = (id: string) => this.mode() !== 'create' || this.alta.dejadas().has(id);
    const out = new Set(this.faltas().map((f) => f.seccion).filter(acusa));
    if (this.formatoMal() && acusa('agent-section-general')) out.add('agent-section-general');
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
  protected readonly summaryFacts = computed(() => {
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
    const filas = [
      // Por dónde le llega trabajo: los canales de sus grupos habilitados (DD-147), así que lleva a Grupos, donde se
      // cambia; los que PUEDE atender son las casillas de General (barrido de consistencia, 2026-10-09).
      {
        icono: 'forum',
        valor: canales.length ? canales.map((c) => t(etiquetas[c])).join(', ') : '—',
        etiqueta: 'agents.form.summary.attends_by',
        seccion: 'agent-section-groups',
        ancla: null,
      },
      {
        icono: 'dialpad',
        valor: f.extension ? `${f.extension}, ${t(`agents.ext_kind.${f.extensionType}`).toLowerCase()}` : '—',
        etiqueta: 'agents.form.fields.extension',
        seccion: 'agent-section-general',
        ancla: 'agent-ext',
      },
      {
        icono: 'radio_button_checked',
        valor: t(f.permissions.recording ? 'common.yes' : 'common.no'),
        etiqueta: 'agents.form.section.recording',
        seccion: 'agent-section-config',
        ancla: 'agent-recording',
      },
      {
        icono: 'call_made',
        valor: saliente !== null ? (grupos.get(saliente)?.name ?? '—') : '—',
        etiqueta: 'agents.form.summary.outbound',
        seccion: 'agent-section-groups',
        ancla: null,
      },
    ];
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

  /** Lo que le llega de Repositorios en Recursos: agendas, plantillas de chat (si atiende chat) y equipos. */
  private readonly resourceCount = computed(() => {
    const f = this.form();
    return f.scheduleIds.size + (this.attendsChat() ? this.chatTemplateValue().length : 0) + f.teamIds.size;
  });

  /**
   * El grupo de sus salientes: el elegido si sigue valiendo (asignado y con Teléfono marcado) y, si no, el primero de sus
   * grupos con Teléfono. Es obligatorio (revisión de agentes), así que siempre hay uno en cuanto se puede: el radio de la tabla lo
   * enseña marcado y se cambia con un clic. Sin ningún grupo con Teléfono, falta (`faltas`).
   */
  protected readonly outboundGroupId = computed<number | null>(() => {
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
   * columns are llamada/transferencia. Each (row, col) maps to one flat
   * `AgentPermissions` key (`PERMISSION_MATRIX_KEYS`).
   */
  protected readonly destinoKeys = DESTINO_KEYS;

  protected readonly columnState = computed<Record<DestinoCol, TriState>>(
    () => {
      const p = this.form().permissions;
      const tally = (col: DestinoCol): TriState =>
        triStateOf(
          this.destinoKeys.filter((k) => p[PERMISSION_MATRIX_KEYS[k][col]])
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
      permissions[
        PERMISSION_MATRIX_KEYS[rowId as DestinoKey][columnId as DestinoCol]
      ];
  });

  protected onMatrixToggle(e: ScMatrixToggle): void {
    this.toggleMatrix(e.rowId as DestinoKey, e.columnId as DestinoCol);
  }

  protected onMatrixColumnToggle(e: ScMatrixColumnToggle): void {
    this.toggleColumnAll(e.columnId as DestinoCol, e.checked);
  }

  protected matrixValue(row: DestinoKey, col: DestinoCol): boolean {
    return this.form().permissions[PERMISSION_MATRIX_KEYS[row][col]];
  }

  protected toggleMatrix(row: DestinoKey, col: DestinoCol): void {
    this.togglePermission(PERMISSION_MATRIX_KEYS[row][col]);
  }

  protected toggleColumnAll(col: DestinoCol, next: boolean): void {
    this.form.update((f) => {
      const permissions = { ...f.permissions };
      for (const row of this.destinoKeys) {
        permissions[PERMISSION_MATRIX_KEYS[row][col]] = next;
      }
      return { ...f, permissions };
    });
  }
  /** Los estados que se pueden poner a mano, y el que tiene ahora aunque no sea de esos (Post-conversando, por ejemplo). */
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
   * En esta pantalla solo email y PIN tienen regla de CONTENIDO (los dos son
   * opcionales: si los escribes, con formato válido). Nombre y extensión son
   * solo obligatorios — no hay contenido equivocado que señalar, así que no
   * llevan computed: su ausencia la cuenta el motivo del botón.
   */
  protected readonly emailError = computed<string | null>(() => {
    const email = this.form().email.trim();
    if (email.length === 0) return null;
    return EMAIL_RE.test(email) ? null : 'agents.errors.email_invalid';
  });

  /** El PIN solo se ve (y solo cuenta) con la extensión en el teléfono. */
  protected readonly pinError = computed<string | null>(() => {
    const pin = this.form().pin.trim();
    if (!this.phoneRequired() || pin.length === 0) return null;
    return PIN_RE.test(pin) ? null : 'agents.errors.pin_invalid';
  });

  /** Por qué NO se puede guardar, en palabras. Alimenta el `title` y el
   *  `aria-describedby` del botón: un control deshabilitado sin motivo obliga
   *  al usuario a adivinar cuál de los campos le falta.
   *
   *  El orden reproduce el de `canSave()` — y no por comodidad: delante van
   *  los obligatorios vacíos (nombre, extensión), que NO tienen otro canal
   *  porque sus campos callan por diseño; detrás los de formato, que además
   *  ya se están viendo en rojo sobre el propio input.
   *
   *  Los predicados se copian de `canSave()` en vez de delegar en los
   *  computed de arriba: esos devuelven `null` con el campo en blancos, y un
   *  email de solo espacios dejaría el botón gris otra vez sin motivo. */
  protected readonly saveDisabledReason = computed<string | null>(() => {
    if (this.canSave()) return null;
    const falta = this.faltas()[0];
    if (falta) return falta.motivo;
    if (this.emailError()) return this.emailError();
    if (this.pinError()) return this.pinError();
    if (this.mode() === 'edit' && !this.dirtyState.dirty()) return 'common.no_changes';
    return null;
  });
  /** Lo que falta para poder crear, en el orden de la ficha, para el resumen (DD-136). Los errores de formato (email,
   *  PIN) no faltan: se dicen en su campo. */
  protected readonly summaryMissing = computed<readonly string[]>(() => this.faltas().map((f) => f.resumen));
  /** El motivo que se ENSEÑA junto al botón: solo lo que falta rellenar. «No hay
   *  cambios» se queda en el `title` del botón apagado, que ya lo dice. */
  protected readonly saveBlockedReason = computed(() => {
    const reason = this.saveDisabledReason();
    return reason === 'common.no_changes' ? null : reason;
  });
  protected readonly saving = signal(false);
  protected readonly deleteVisible = signal(false);

  /** Dirty-state por CAMBIO NETO (snapshot vs pristine): Guardar se reactiva
   *  solo si hay algo distinto que guardar y vuelve a apagarse si deshaces.
   *  Patrón compartido (admin/AED/builder); `formDirty` queda de alias de
   *  lectura para el guard de salida (DirtyAware) y el template. */
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;

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


  protected readonly canSave = computed(() => {
    if (this.faltas().length > 0 || this.formatoMal()) return false;
    // En EDITAR exige cambio neto; en crear/duplicar basta con que sea válido.
    if (this.mode() === 'edit' && !this.dirtyState.dirty()) return false;
    return true;
  });

  protected readonly deleteItems = computed(() => {
    const a = this.initial();
    return a ? [{ id: a.id, name: a.name }] : [];
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
        pickupType: agent.pickupType ?? 'auto',
        randomOrder: agent.randomOrder ?? false,
        maxChats: agent.maxChats ?? 4,
        iframeUrl: agent.iframeUrl ?? '',
        loginExtOverride: agent.loginExtOverride ?? false,
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

    // Modo "Duplicar": detecta ?seedFromId en query params y precarga el
    // form desde el source EXCEPTO los identificadores únicos (nombre,
    // extensión, email, PIN). El usuario debe rellenar esos 4 antes de
    // guardar — la bola roja en el nav señala la sección Identity con
    // required vacíos.
    const seedFromId = this.route.snapshot.queryParamMap.get('seedFromId');
    if (seedFromId) {
      const source = this.agentsStore.getAgent(Number(seedFromId));
      if (!source) {
        void this.router.navigateByUrl('/admin/agentes', { replaceUrl: true });
        return;
      }
      this.duplicatingFromName.set(source.name);
      this.form.set({
        // Unique identifiers — vaciados, el usuario los rellena.
        name: '',
        extension: '',
        email: '',
        pin: '',
        // Resto del payload copiado tal cual.
        extensionType: source.extensionType,
        agentType: source.agentType,
        status: source.status,
        presenceStatus: source.presenceStatus ?? 'disponible',
        phone: source.phone ?? '',
        pickupType: source.pickupType ?? 'auto',
        randomOrder: source.randomOrder ?? false,
        maxChats: source.maxChats ?? 4,
        iframeUrl: source.iframeUrl ?? '',
        loginExtOverride: source.loginExtOverride ?? false,
        links: this.linksStore.linksForAgent(source.id),
        defaultOutboundGroupId: source.defaultOutboundGroupId ?? null,
        permissions: { ...source.permissions },
        allowedChannels: source.allowedChannels ?? CHANNEL_FAMILIES,
        photo: source.photo ?? null,
        languages: source.languages ? [...source.languages] : [],
        ...this.recursosVivos(source),
      });
      // El duplicado nace "sucio" por construcción (datos sin guardar): el
      // snapshot ya difiere del pristine vacío, así que el guard de salida
      // avisa solo. No hace falta marcarlo a mano.
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
      if (this.canSave() && !this.saving()) this.save();
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

  /** El tipo de descuelgue: una de las tres tarjetas. */
  protected onPickupValueChange(value: unknown): void {
    if ((PICKUP_TYPES as readonly unknown[]).includes(value)) this.updateField('pickupType', value as PickupType);
  }

  protected onExtensionTypeChange(value: unknown): void {
    if ((EXTENSION_TYPES as readonly unknown[]).includes(value)) this.updateField('extensionType', value as ExtensionType);
  }

  protected onLoginExtOverrideChange(checked: boolean): void {
    this.updateField('loginExtOverride', checked);
  }

  protected async requestExpirePassword(): Promise<void> {
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
    });
    if (!ok) return;
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(
        'agents.form.advanced.sesion.expire_toast',
        { name }
      ),
      life: TOAST_LIFE.success,
    });
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
    if (!this.canSave() || this.saving()) return;
    const allowed = new Set(this.form().allowedChannels);
    const affected = this.form().links.filter(link => link.channels.some(channel => !allowed.has(channel)));
    if (affected.length) {
      const nombres = new Map(this.availableGroups().map(group => [group.id, group.name]));
      const quitados = canonicalizeChannels(affected.flatMap(link => link.channels.filter(channel => !allowed.has(channel))));
      const salen = this.linksVistos().filter(link => link.channels.length === 0);
      const etiquetas: Readonly<Record<string, string>> = FAMILY_LABEL_KEYS;
      const accepted = await this.confirmHost.request({
        title: this.translate.instant('groups.form.cascade.title'),
        body: this.translate.instant(salen.length ? 'agents.form.allowed.remove_body_orphaned' : 'agents.form.allowed.remove_body', {
          channels: quitados.map(c => this.translate.instant(etiquetas[c])).join(', '),
          count: affected.length,
          groups: salen.map(link => nombres.get(link.groupId) ?? String(link.groupId)).join(', '),
        }),
        acceptLabel: this.translate.instant('groups.form.cascade.confirm'),
        rejectLabel: this.translate.instant('common.cancel'),
        acceptTone: 'danger',
      });
      if (!accepted) return;
    }

    this.saving.set(true);
    setTimeout(() => {
      const f = this.form();

      const payload: Omit<Agent, 'id' | 'code'> = {
        name: f.name.trim(),
        extension: f.extension,
        extensionType: f.extensionType,
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
        iframeUrl: f.iframeUrl.trim() || undefined,
        loginExtOverride: f.loginExtOverride,
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
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant('agents.toasts.updated', {
            name: payload.name,
          }),
          life: TOAST_LIFE.success,
        });
      } else {
        this.createAgent(payload);
        return;
      }
      this.saving.set(false);
      this.dirtyState.markPristine();
    }, 400);
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
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('agents.toasts.created', { name: created.name }),
      life: TOAST_LIFE.success,
    });
    this.dirtyState.markPristine();
    void this.router
      .navigate(['/admin/agentes/editar', created.id], {
        replaceUrl: true,
        queryParams: slug && slug !== 'general' ? { seccion: slug } : {},
      })
      .finally(() => this.saving.set(false));
  }

  /** Cada enlace con su agente y sus canales recortados; el que se queda sin ninguno, fuera (ver `save`). */
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
      .filter(link => link.channels.length > 0);
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
    const agent = this.initial();
    this.agentsStore.deleteAgent(id);
    this.linksStore.removeAgent(id);
    this.deleteVisible.set(false);
    this.dirtyState.markPristine();
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('agents.toasts.deleted_single', {
        name: agent?.name ?? '',
      }),
      life: TOAST_LIFE.success,
    });
    void this.router.navigateByUrl('/admin/agentes');
  }

  /** El alta nace con lo que fija Contact Center › Agentes (DD-135): permisos y URL del iframe. */
  private emptyForm(): FormState {
    const defaults = this.agentDefaults.defaults();
    return {
      name: '',
      extension: '',
      extensionType: 'webrtc',
      agentType: 'normal',
      status: 'active',
      presenceStatus: 'disponible',
      phone: '',
      email: '',
      pin: '',
      pickupType: 'auto',
      randomOrder: false,
      maxChats: 4,
      iframeUrl: defaults.iframeUrl,
      loginExtOverride: false,
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
