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
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ScChipComponent as ChipComponent } from '@smartcontact-hub/components';
import type {
  ScMatrixColumn,
  ScMatrixColumnToggle,
  ScMatrixRow,
  ScMatrixToggle,
} from '@smartcontact-hub/components';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { CrossTabLockService } from '@core/services';
import { ScConfirmService } from '@smartcontact-hub/components';
import { EMAIL_RE, PIN_RE } from '@core/utils/validators';
import { TOAST_LIFE } from '@core/utils/toast-life';
import {
  IllustratedAvatarComponent,
  LabelChipComponent,
} from '@shared/components';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';
import {
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScDividerComponent as DividerComponent,
  ScFormSectionNavComponent as FormSectionNavComponent,
  type FormNavSection,
  ScInputTextComponent as InputTextComponent,
  ScPermissionMatrixComponent as PermissionMatrixComponent,
  ScPhotoUploadComponent as PhotoUploadComponent,
  ScMultiSelectComponent as MultiSelectComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectComponent as SelectComponent,
  ScToggleSwitchComponent as ToggleSwitchComponent,
  type TriState,
  triStateOf,
} from '@smartcontact-hub/components';
import { LabelsStore } from '@features/admin/labels/state/labels.store';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { GroupAgentLinksStore } from '@features/admin/services/group-agent-links.store';
import { GroupAgentLink } from '@features/admin/services/group-agent-links.types';
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
  DEFAULT_AGENT_PERMISSIONS,
  ExtensionType,
  PRESENCE_LABEL_KEYS,
  PickupType,
  PresenceStatus,
} from '../data/agents-data';
import { AgentsStore } from '../state/agents.store';
import {
  AgentGroupAssignmentRef,
  GroupAssignmentTableComponent,
} from '../components/group-assignment-table/group-assignment-table.component';

type DestinoKey = 'fijos' | 'moviles' | 'internacionales' | 'especial';
type DestinoCol = 'llamada' | 'transferencia';

/**
 * Maps the (destino × call/transfer) matrix cells to the flat
 * `AgentPermissions` keys. Mirrors the destino taxonomy used by the
 * canonical `/admin/aed/agentes` defaults page so both forms share the
 * same mental model.
 */
const PERMISSION_MATRIX_KEYS: Readonly<
  Record<DestinoKey, Record<DestinoCol, keyof AgentPermissions>>
> = {
  fijos: { llamada: 'callsDestFixed', transferencia: 'transfersDestFixed' },
  moviles: { llamada: 'callsDestMobile', transferencia: 'transfersDestMobile' },
  internacionales: {
    llamada: 'callsDestInternational',
    transferencia: 'transfersDestInternational',
  },
  especial: {
    llamada: 'callsDestSpecial',
    transferencia: 'transfersDestSpecial',
  },
};

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

/** ¿Son la misma selección, sin importar el orden? */
function sameIds(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((id) => set.has(id));
}

@Component({
  selector: 'sc-agent-form-page',
  imports: [
    ChipComponent,
    ButtonComponent,
    DeleteEntityDialogComponent,
    DividerComponent,
    FormSectionNavComponent,
    GroupAssignmentTableComponent,
    IllustratedAvatarComponent,
    InputTextComponent,
    LabelChipComponent,
    PermissionMatrixComponent,
    PhotoUploadComponent,
    RouterLink,
    SectionCardComponent,
    MultiSelectComponent,
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
  private readonly location = inject(Location);
  private readonly agentsStore = inject(AgentsStore);
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

  /** Selected labels resolved to {id, name, color} for chip rendering. */
  protected readonly selectedLabelChips = computed(() => {
    const ids = this.form().labelIds;
    return this.labelsStore
      .labels()
      .filter((label) => ids.has(label.id))
      .map((label) => ({ id: label.id, name: label.name, color: label.color }));
  });

  /** Labels still available to add — current store minus already-selected. */
  protected readonly addableLabels = computed(() => {
    const ids = this.form().labelIds;
    return this.labelsStore.labels().filter((label) => !ids.has(label.id));
  });

  /** Idiomas aún no añadidos — para alimentar el `<sc-select>` action-add. */
  protected readonly addableLanguages = computed(() => {
    const set = new Set(this.form().languages);
    return this.availableLanguages.filter((l) => !set.has(l));
  });

  /**
   * Signals "transitorios" del valor del select action-add. Siempre vuelven
   * a `null` tras un pick exitoso porque el patrón es "elegir uno → se va
   * al chip de fuera → el select queda vacío para el siguiente". Con un
   * `<select>` nativo bastaba con `event.target.value = ''`; con sc-select
   * (bind unidireccional) hay que mover el reset al signal del consumer.
   */
  protected readonly labelPickValue = signal<number | null>(null);
  protected readonly languagePickValue = signal<string | null>(null);

  /* ── Repositorios ─────────────────────────────────────────────────────────────
   *
   * Desde el 2026-09-14 cada repositorio es UN campo que enseña lo asignado y deja añadir o
   * quitar desde el desplegable del DS. Antes Plantillas y Agendas eran dos tablas completas
   * dentro de la tarjeta, con buscador, pestañas, casilla por fila y vista previa, listando
   * TODO lo que existe para responder una sola pregunta: qué tiene este agente. Rafa: «es
   * mucho ruido». El formulario sigue guardando un `Set` de ids por repositorio; aquí solo
   * se traduce a lo que habla `sc-multiselect` (una lista de ids) y de vuelta. */

  /** Las agendas de `Repositorios > Agendas`. */
  private readonly availableSchedules = this.agendasStore.items;
  protected readonly scheduleOptions = computed(() =>
    this.availableSchedules().map((a: Agenda) => ({ label: a.name, value: a.id })),
  );
  protected readonly scheduleValue = computed(() => [...this.form().scheduleIds]);

  protected onSchedulesChange(ids: unknown[]): void {
    if (sameIds(ids as number[], this.scheduleValue())) return;
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
    if (sameIds(ids as number[], current)) return;
    const ofType = new Set(this.templatesOf(type).map((t) => t.id));
    this.form.update((f) => {
      const next = new Set([...f.templateIds].filter((id) => !ofType.has(id)));
      for (const id of ids as number[]) next.add(id);
      return { ...f, templateIds: next };
    });
  }

  /**
   * Section index for the form shell. In `edit` mode, Identity drops to
   * the end of the list — once the agent exists, you rarely re-edit
   * identity fields, so the index leads with what gets iterated on.
   * Delete is *not* in the nav — it lives at the bottom of the Identity
   * tab (danger zone pattern, GitHub / Stripe).
   */
  protected readonly navSections = computed<readonly FormNavSection[]>(() => {
    const identity: FormNavSection = {
      id: 'agent-section-identity',
      labelKey: 'agents.form.section.identification',
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
    // desplegables al final de Avanzado.
    const repositories: FormNavSection = {
      id: 'agent-section-repositories',
      labelKey: 'agents.form.section.repositories',
      icon: 'folder_open',
    };
    // Orden por modo (S60). En CREAR, identidad primero — es lo primero que se
    // rellena. En EDITAR, identidad al fondo: apenas se toca tras crear, y la
    // ficha del panel ya da su contexto siempre visible.
    if (this.mode() === 'edit') {
      return [groups, permissions, advanced, repositories, identity];
    }
    return [identity, groups, permissions, advanced, repositories];
  });

  protected readonly activeSection = signal<string>('agent-section-identity');

  protected readonly activeIcon = computed(() => {
    const id = this.activeSection();
    return this.navSections().find((s) => s.id === id)?.icon ?? null;
  });

  /**
   * Matrix layout for the calls/transfers permissions, matching the
   * canonical `sc-agentes` defaults page. Rows are destination categories,
   * columns are llamada/transferencia. Each (row, col) maps to one flat
   * `AgentPermissions` key.
   */
  protected readonly destinoKeys: readonly DestinoKey[] = [
    'fijos',
    'moviles',
    'internacionales',
    'especial',
  ];

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

  /**
   * Set de section ids con required vacíos. El `<sc-form-section-nav>`
   * pinta una bola roja al lado de cada label aquí presente. Updates en
   * tiempo real al rellenar.
   *
   * Solo señala REQUIRED VACÍOS, no errores de formato (e.g. email
   * malformado). Razón: la bola roja en el nav comunica "te falta
   * algo aquí" — errors de formato se ven en el input mismo.
   */
  protected readonly sectionsWithErrors = computed<ReadonlySet<string>>(() => {
    const f = this.form();
    const errors = new Set<string>();
    // Identity section: name + extension son required.
    if (!f.name.trim() || !f.extension) errors.add('agent-section-identity');
    return errors;
  });

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
      // En edición aterriza en Grupos (1ª del orden de edición): identidad va
      // al fondo porque casi no se toca tras crear; la ficha ya la resume (S60).
      this.activeSection.set('agent-section-groups');
      this.releaseLock = this.crossTab.acquire('agent', agent.id, () =>
        this.conflictWarning.set(true)
      );
      return;
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

  /**
   * Adapter `<sc-select>` para el patrón action-add de idiomas. El select
   * usa `addableLanguages()` (filtra ya añadidos) — el guard de duplicados
   * queda como red de seguridad. Reset del signal a null tras el pick.
   */
  protected onLanguageValueAdd(value: unknown): void {
    if (typeof value !== 'string' || !value) return;
    this.form.update((f) =>
      f.languages.includes(value)
        ? f
        : { ...f, languages: [...f.languages, value] }
    );
    this.languagePickValue.set(null);
  }

  protected onLanguageRemove(lang: string): void {
    this.form.update((f) => ({
      ...f,
      languages: f.languages.filter((l) => l !== lang),
    }));
  }

  /**
   * Adapter `<sc-select>` para el patrón action-add de labels. El select
   * usa `addableLabels()` con `optionValue="id"` así emite el number directo.
   * Reset del signal a null tras el pick para volver a placeholder.
   */
  protected onLabelValueAdd(value: unknown): void {
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    this.form.update((f) => {
      if (f.labelIds.has(value)) return f;
      const next = new Set(f.labelIds);
      next.add(value);
      return { ...f, labelIds: next };
    });
    this.labelPickValue.set(null);
  }

  protected onLabelRemove(id: number): void {
    this.form.update((f) => {
      const next = new Set(f.labelIds);
      next.delete(id);
      return { ...f, labelIds: next };
    });
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
        const created = this.agentsStore.addAgent(payload);
        this.linksStore.replaceLinksForAgent(
          created.id,
          this.normalizeLinks(f.links, created.id)
        );
        this.editingId.set(created.id);
        this.initial.set(created);
        this.location.replaceState(`/admin/agentes/editar/${created.id}`);
        this.releaseLock?.();
        this.releaseLock = this.crossTab.acquire('agent', created.id, () =>
          this.conflictWarning.set(true)
        );
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant('agents.toasts.created', {
            name: created.name,
          }),
          life: TOAST_LIFE.success,
        });
      }
      this.saving.set(false);
      this.dirtyState.markPristine();
    }, 400);
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

  private emptyForm(): FormState {
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
      iframeUrl: '',
      loginExtOverride: false,
      links: [],
      permissions: { ...DEFAULT_AGENT_PERMISSIONS },
      photo: null,
      languages: [],
      labelIds: new Set(),
      scheduleIds: new Set(),
      templateIds: new Set(),
    };
  }
}
