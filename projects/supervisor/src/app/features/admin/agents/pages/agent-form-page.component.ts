import {
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
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, type UrlTree } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import type {
  ScMatrixColumn,
  ScMatrixColumnToggle,
  ScMatrixRow,
  ScMatrixToggle,
} from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { CrossTabLockService, SectionLinksService } from '@core/services';
import { ScConfirmService } from '@smartcontact-hub/components';
import { EMAIL_RE, PIN_RE } from '@core/utils/validators';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { AltaPieComponent, NameInplaceComponent, NombreFijoComponent, SummaryKpiComponent, SummaryStatusComponent } from '@shared/components';
import { llegarASeccion, seccionesDeAlta } from '@shared/utils/alta-secciones';
import { changedKeys, createFormDirtyState } from '@shared/utils/form-dirty-state';
import {
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScDividerComponent as DividerComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
  ScMessageComponent as MessageComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScInputTextComponent as InputTextComponent,
  ScPermissionMatrixComponent as PermissionMatrixComponent,
  ScPhotoUploadComponent as PhotoUploadComponent,
  ScMultiSelectComponent as MultiSelectComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
  type TriState,
  triStateOf,
} from '@smartcontact-hub/components';
import { LabelsStore } from '@features/admin/labels/state/labels.store';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import { canonicalizeChannels, GroupAgentLink } from '@features/admin/services/group-agent-links.types';
import { clampLinksToChannels } from '@features/admin/services/group-channels.core.mjs';
import { FAMILY_LABEL_KEYS } from '@features/admin/groups/data/groups-data';
import { TemplatesStore } from '@features/admin/templates/state/templates.store';
import {
  Template,
  TemplateType,
} from '@features/admin/templates/data/templates-data';
import {
  AgendasStore,
  Agenda,
} from '@features/admin/repositories/instances/agendas';
import {
  AGENT_TYPES,
  AGENT_TYPE_LABEL_KEYS,
  Agent,
  AgentPermissions,
  AgentType,
  AVAILABLE_EXTENSIONS,
  AVAILABLE_LANGUAGES,
  DESTINO_KEYS,
  DestinoCol,
  DestinoKey,
  ExtensionType,
  PERMISSION_MATRIX_KEYS,
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

interface FormState {
  name: string;
  extension: string;
  agentType: AgentType;
  status: 'active' | 'inactive';
  presenceStatus: PresenceStatus;
  phone: string;
  email: string;
  pin: string;
  pickupType: PickupType;
  pickupTypeChat: PickupType;
  randomOrder: boolean;
  maxChats: number;
  iframeUrl: string;
  loginExtOverride: boolean;
  links: readonly GroupAgentLink[];
  permissions: AgentPermissions;
  photo: string | null;
  languages: readonly string[];
  labelIds: ReadonlySet<number>;
  scheduleIds: ReadonlySet<number>;
  templateIds: ReadonlySet<number>;
}

/**
 * De qué sección es cada campo, para marcar en el índice las que tienen cambios sin guardar (DD-122).
 * `permissions` se reparte por subcampo (ver `sectionsWithChanges`).
 */
const AGENT_SECTION_OF_FIELD: Readonly<Record<keyof FormState, string>> = {
  name: 'agent-section-identity',
  extension: 'agent-section-identity',
  agentType: 'agent-section-identity',
  status: 'agent-section-identity',
  presenceStatus: 'agent-section-identity',
  phone: 'agent-section-identity',
  email: 'agent-section-identity',
  pin: 'agent-section-identity',
  photo: 'agent-section-identity',
  links: 'agent-section-groups',
  permissions: 'agent-section-permissions',
  labelIds: 'agent-section-resources',
  scheduleIds: 'agent-section-resources',
  templateIds: 'agent-section-resources',
  pickupType: 'agent-section-advanced',
  pickupTypeChat: 'agent-section-advanced',
  randomOrder: 'agent-section-advanced',
  maxChats: 'agent-section-advanced',
  languages: 'agent-section-advanced',
  iframeUrl: 'agent-section-advanced',
  loginExtOverride: 'agent-section-advanced',
};

/** ¿Son la misma selección, sin importar el orden? */
function sameValues<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((v) => set.has(v));
}

@Component({
  selector: 'sc-agent-form-page',
  imports: [
    NgTemplateOutlet,
    ButtonComponent,
    NameInplaceComponent,
    SummaryKpiComponent,
    SummaryStatusComponent,
    AltaPieComponent,
    NombreFijoComponent,
    DeleteEntityDialogComponent,
    DividerComponent,
    FormSectionNavComponent,
    GroupAssignmentTableComponent,
    IconComponent,
    InputTextComponent,
    MessageComponent,
    PermissionMatrixComponent,
    PhotoUploadComponent,
    RouterLink,
    MultiSelectComponent,
    SectionCardComponent,
    SelectComponent,
    ToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './agent-form-page.component.html',
  styleUrl: './agent-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentFormPageComponent implements DirtyAware, OnInit, OnDestroy {
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

  private readonly crossTab = inject(CrossTabLockService);
  private readonly labelsStore = inject(LabelsStore);
  private readonly templatesStore = inject(TemplatesStore);
  private readonly agendasStore = inject(AgendasStore);
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


  /** Opciones de descuelgue, traducidas UNA vez por idioma (antes eran un literal
   *  dentro de la plantilla, repetido en los dos selects). */
  protected readonly pickupOptions = computed(() => {
    this.currentLang();
    return [
      { label: this.translate.instant('agents.form.fields.pickup_auto'), value: 'auto' },
      { label: this.translate.instant('agents.form.fields.pickup_manual'), value: 'manual' },
    ];
  });

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

  /** Las agendas de `Repositorios > Agendas`. */
  private readonly availableSchedules = this.agendasStore.items;
  protected readonly scheduleOptions = computed(() =>
    this.availableSchedules().map((a: Agenda) => ({ label: a.name, value: a.id })),
  );
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
   * EL ÍNDICE DE LA FICHA (DD-122): el mismo de la ficha de grupo y de Contact Center, con UN orden en
   * los dos modos, el de sus dependencias: quién es (Identidad), dónde atiende (Grupos), qué puede hacer
   * (Permisos), qué se le asigna (Recursos) y lo demás (Avanzado). Hasta el 2026-09-27 fueron pestañas
   * y, al editar, Identidad bajaba al segundo puesto. Abre en la primera; el listado enlaza directo a
   * Grupos (`?seccion=grupos`), que es donde se trabaja, así que el clic de siempre sigue llegando ahí.
   */
  protected readonly navSections = computed<readonly FormNavSection[]>(() => {
    const identity: FormNavSection = {
      id: 'agent-section-identity',
      labelKey: 'agents.form.section.identity',
      icon: 'badge',
    };
    const groups: FormNavSection = {
      id: 'agent-section-groups',
      labelKey: 'agents.form.section.groups',
      icon: 'group',
    };
    const permissions: FormNavSection = {
      id: 'agent-section-permissions',
      labelKey: 'agents.form.section.permissions',
      icon: 'verified_user',
    };
    const advanced: FormNavSection = {
      id: 'agent-section-advanced',
      labelKey: 'agents.form.section.advanced',
      icon: 'tune',
    };
    // Lo que se le ASIGNA al agente desde Repositorios (2026-09-14): antes eran tres
    // desplegables al final de Avanzado. Ni el nombre ni el icono son los del menú (carpeta): con
    // los mismos, quien buscaba la sección acababa en la página Repositorios.
    const resources: FormNavSection = {
      id: 'agent-section-resources',
      labelKey: 'agents.form.section.resources',
      icon: 'library_books',
    };
    return [identity, groups, permissions, resources, advanced].map((sec) => ({
      ...sec,
      href: this.sectionLinks.href(this.sectionUrl(sec.id)),
    }));
  });

  /** Cada sección en la dirección (`?seccion=grupos`). */
  private static readonly SECTION_SLUGS: Readonly<Record<string, string>> = {
    identidad: 'agent-section-identity',
    grupos: 'agent-section-groups',
    permisos: 'agent-section-permissions',
    recursos: 'agent-section-resources',
    avanzado: 'agent-section-advanced',
  };

  /** `?seccion=` de la dirección (`withComponentInputBinding`), también cuando solo cambia la query. */
  readonly seccion = input<string | undefined>();

  /**
   * EL ALTA, CON EL ÍNDICE DE LA EDICIÓN (DD-143), también al duplicar: las mismas cinco secciones, en cualquier orden
   * (DD-130: aquí no hay puerta), con ✓ en las que se dejan completas y «Atrás / Siguiente» al pie. Identidad está
   * completa con nombre, extensión y, si se escriben, email y PIN bien escritos; las demás no piden nada.
   */
  protected readonly alta = seccionesDeAlta({
    secciones: this.navSections,
    completa: (id) => id !== 'agent-section-identity' || this.identidadCompleta(),
  });

  /** La sección a la vista: en el alta y al duplicar, la abierta; al editar, la de la dirección (Identidad sin parámetro). */
  protected readonly activeSection = computed<string>(() =>
    this.mode() === 'edit'
      ? (AgentFormPageComponent.SECTION_SLUGS[this.seccion() ?? ''] ?? 'agent-section-identity')
      : this.alta.abierta(),
  );

  /** La dirección de una sección: la primera, sin parámetro (es la dirección de la ficha). */
  private sectionUrl(id: string): UrlTree {
    const slug = Object.entries(AgentFormPageComponent.SECTION_SLUGS).find(([, v]) => v === id)?.[0] ?? null;
    return this.sectionLinks.section(this.route, id === 'agent-section-identity' ? null : slug);
  }

  /** Ir a otra sección. En el alta y al duplicar, la sección se abre sin tocar la dirección: Atrás sale (DD-122, DD-143). */
  protected goTo(id: string): void {
    if (this.mode() !== 'edit') {
      this.alta.abrir(id);
      return;
    }
    void this.sectionLinks.go(this.sectionUrl(id));
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
    this.goTo(id);
    llegarASeccion(id, this.injector);
  }

  /** Identidad completa: lo que pide «Crear agente» de esa sección. */
  private identidadCompleta(): boolean {
    const f = this.form();
    if (!f.name.trim() || !f.extension) return false;
    if (f.email && !EMAIL_RE.test(f.email.trim())) return false;
    return !(f.pin && !PIN_RE.test(f.pin.trim()));
  }

  /**
   * Lo que falta para poder guardar, en el índice: el nombre y la extensión, en Identidad. Al editar y al
   * duplicar (que llega con esos campos vacíos a propósito). En un alta recién abierta no acusa, lo dice el
   * resumen (DD-136); desde que se deja Identidad sin ellos, sí, como la ✓ de la que se deja completa (DD-143).
   */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() => {
    const f = this.form();
    const falta = !f.name.trim() || !f.extension;
    const acusa = this.mode() !== 'create' || this.alta.dejadas().has('agent-section-identity');
    return new Set(acusa && falta ? ['agent-section-identity'] : []);
  });

  /**
   * Las secciones con cambios sin guardar (DD-122), al editar. `permissions` se reparte: la grabación está
   * en Identidad y los dispositivos externos en Avanzado; lo demás, en Permisos.
   */
  protected readonly sectionsWithChanges = computed<ReadonlySet<string>>(() => {
    if (this.mode() !== 'edit') return new Set<string>();
    const out = new Set<string>();
    for (const key of this.dirtyState.changedKeys()) {
      if (key !== 'permissions') {
        out.add(AGENT_SECTION_OF_FIELD[key as keyof FormState]);
        continue;
      }
      for (const sub of changedKeys(this.form().permissions, this.dirtyState.pristineValue().permissions)) {
        out.add(
          sub === 'recording'
            ? 'agent-section-identity'
            : sub === 'externalDevices'
              ? 'agent-section-advanced'
              : 'agent-section-permissions',
        );
      }
    }
    return out;
  });

  /** Grupos activos sobre asignados, la cifra con anillo del resumen (DD-126). */
  protected readonly summaryGroups = computed(() => {
    const links = this.form().links;
    return { activos: links.filter((l) => l.active).length, total: links.length };
  });

  /**
   * Lo que el resumen dice sin anillo, porque no es una proporción: por qué canales le llega trabajo (los de sus
   * grupos activos) y de qué tipo es. Los grupos van en su widget (`summaryGroups`).
   */
  protected readonly summaryFacts = computed(() => {
    this.currentLang();
    const f = this.form();
    const grupos = new Map(this.availableGroups().map((g) => [g.id, g.channels]));
    const canales = canonicalizeChannels(f.links.filter((l) => l.active).flatMap((l) =>
      clampLinksToChannels([l], grupos.get(l.groupId) ?? [])[0].channels,
    ));
    // Familias (DD-147): «Chat» es Web Chat y WhatsApp.
    const etiquetas: Readonly<Record<string, string>> = FAMILY_LABEL_KEYS;
    return [
      {
        icono: 'forum',
        valor: canales.length ? canales.map((c) => this.translate.instant(etiquetas[c])).join(', ') : '—',
        etiqueta: 'agents.form.section.channels',
      },
      { icono: 'badge', valor: this.translate.instant(this.typeLabelKeys[f.agentType]), etiqueta: 'agents.form.fields.type' },
    ];
  });

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

  protected readonly pinError = computed<string | null>(() => {
    const pin = this.form().pin.trim();
    if (pin.length === 0) return null;
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
    const f = this.form();
    if (!f.name.trim()) return 'agents.errors.name_required';
    if (!f.extension) return 'agents.errors.extension_required';
    if (f.email && !EMAIL_RE.test(f.email.trim()))
      return 'agents.errors.email_invalid';
    if (f.pin && !PIN_RE.test(f.pin.trim())) return 'agents.errors.pin_invalid';
    if (this.mode() === 'edit' && !this.dirtyState.dirty())
      return 'common.no_changes';
    return null;
  });
  /** Lo que falta para poder crear, en el orden de Identidad, para el resumen (DD-136). Los errores de
   *  formato (email, PIN) no faltan: se dicen en su campo. */
  protected readonly summaryMissing = computed<readonly string[]>(() => {
    const f = this.form();
    const missing: string[] = [];
    if (!f.name.trim()) missing.push('common.summary_missing_name');
    if (!f.extension) missing.push('agents.form.summary.missing_extension');
    return missing;
  });
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
  /** True while another tab also holds the edit lock (DD#169). */
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
    this.mode() === 'edit' ? 'edit' : 'create'
  );


  protected readonly canSave = computed(() => {
    const f = this.form();
    if (!f.name.trim() || !f.extension) return false;
    if (f.email && !EMAIL_RE.test(f.email.trim())) return false;
    if (f.pin && !PIN_RE.test(f.pin.trim())) return false;
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
        agentType: agent.agentType,
        status: agent.status,
        presenceStatus: agent.presenceStatus ?? 'disponible',
        phone: agent.phone ?? '',
        email: agent.email ?? '',
        pin: agent.pin ?? '',
        pickupType: agent.pickupType ?? 'auto',
        pickupTypeChat: agent.pickupTypeChat ?? 'auto',
        randomOrder: agent.randomOrder ?? false,
        maxChats: agent.maxChats ?? 4,
        iframeUrl: agent.iframeUrl ?? '',
        loginExtOverride: agent.loginExtOverride ?? false,
        links: this.linksStore.linksForAgent(agent.id),
        permissions: { ...agent.permissions },
        photo: agent.photo ?? null,
        languages: agent.languages ? [...agent.languages] : [],
        labelIds: new Set(agent.labels ?? []),
        scheduleIds: new Set(agent.schedules ?? []),
        templateIds: new Set(agent.templates ?? []),
      });
      this.dirtyState.markPristine();
      this.releaseLock = this.crossTab.acquire('agent', agent.id, () =>
        this.conflictWarning.set(true)
      );
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
        agentType: source.agentType,
        status: source.status,
        presenceStatus: source.presenceStatus ?? 'disponible',
        phone: source.phone ?? '',
        pickupType: source.pickupType ?? 'auto',
        pickupTypeChat: source.pickupTypeChat ?? 'auto',
        randomOrder: source.randomOrder ?? false,
        maxChats: source.maxChats ?? 4,
        iframeUrl: source.iframeUrl ?? '',
        loginExtOverride: source.loginExtOverride ?? false,
        links: this.linksStore.linksForAgent(source.id),
        permissions: { ...source.permissions },
        photo: source.photo ?? null,
        languages: source.languages ? [...source.languages] : [],
        labelIds: new Set(source.labels ?? []),
        scheduleIds: new Set(source.schedules ?? []),
        templateIds: new Set(source.templates ?? []),
      });
      // El duplicado nace "sucio" por construcción (datos sin guardar): el
      // snapshot ya difiere del pristine vacío, así que el guard de salida
      // avisa solo. No hace falta marcarlo a mano.
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
      this.presenceStates.includes(value as PresenceStatus)
    ) {
      this.updateField('presenceStatus', value as PresenceStatus);
    }
  }

  /**
   * Adapter para `<sc-select>` (pickup call + chat). Las options se pasan
   * como array literal `[{label: 'auto' | translate, value: 'auto'}, ...]`
   * desde el template, así el pipe traduce reactivo al cambio de idioma.
   */
  protected onPickupValueChange<K extends 'pickupType' | 'pickupTypeChat'>(
    key: K,
    value: unknown
  ): void {
    if (value === 'auto' || value === 'manual') {
      this.updateField(key, value);
    }
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

  protected getExtensionType(extension: string): ExtensionType | null {
    return (
      this.availableExtensions.find((e) => e.number === extension)?.type ?? null
    );
  }

  protected onStatusChange(checked: boolean): void {
    this.updateField('status', checked ? 'active' : 'inactive');
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

  protected save(): void {
    if (!this.canSave() || this.saving()) return;

    this.saving.set(true);
    setTimeout(() => {
      const f = this.form();

      const payload: Omit<Agent, 'id' | 'code'> = {
        name: f.name.trim(),
        extension: f.extension,
        extensionType: this.getExtensionType(f.extension) ?? 'webrtc',
        agentType: f.agentType,
        status: f.status,
        presenceStatus: f.presenceStatus,
        phone: f.phone.trim() || undefined,
        email: f.email.trim() || undefined,
        pin: f.pin.trim() || undefined,
        permissions: f.permissions,
        pickupType: f.pickupType,
        pickupTypeChat: f.pickupTypeChat,
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
      };

      const editingId = this.editingId();
      if (editingId) {
        this.agentsStore.updateAgent(editingId, { ...payload });
        this.linksStore.replaceLinksForAgent(
          editingId,
          this.normalizeLinks(f.links, editingId)
        );
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
        queryParams: slug && slug !== 'identidad' ? { seccion: slug } : {},
      })
      .finally(() => this.saving.set(false));
  }

  /** Ensure every link points at the right agentId before persistence. */
  private normalizeLinks(
    links: readonly GroupAgentLink[],
    agentId: number
  ): readonly GroupAgentLink[] {
    return links.map((l) => (l.agentId === agentId ? l : { ...l, agentId }));
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
      agentType: 'normal',
      status: 'active',
      presenceStatus: 'disponible',
      phone: '',
      email: '',
      pin: '',
      pickupType: 'auto',
      pickupTypeChat: 'auto',
      randomOrder: false,
      maxChats: 4,
      iframeUrl: defaults.iframeUrl,
      loginExtOverride: false,
      links: [],
      permissions: { ...defaults.permissions },
      photo: null,
      languages: [],
      labelIds: new Set(),
      scheduleIds: new Set(),
      templateIds: new Set(),
    };
  }
}
