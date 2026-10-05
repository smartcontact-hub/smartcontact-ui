import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import {
  ScButtonComponent as ButtonComponent,
  ScDialogComponent as DialogComponent,
  ScInputTextComponent as InputTextComponent,
  ScMessageComponent as MessageComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectComponent as SelectComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { CrossTabLockService } from '@core/services';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { injectLangChange } from '@core/utils/lang-change';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { AgendaContactsTableComponent } from '../components/agenda-contacts-table/agenda-contacts-table.component';
import { RepoFormPanelComponent, type RepoFormSubmission } from '../components/repo-form-panel.component';
import type { RepoFieldDef } from '../components/repo-types';
import { normalizarTelefono, telefonoValido } from '../state/agenda-contacts.core.mjs';
import { AgendasStore, type AgendaContact } from '../state/agendas.store';

interface AgendaDraft {
  readonly name: string;
  readonly description: string;
  readonly status: string;
  readonly contacts: readonly AgendaContact[];
}

const VACIA: AgendaDraft = { name: '', description: '', status: 'active', contacts: [] };

/** Los campos de un contacto, con el formulario de los «+» de Recursos (`sc-repo-form-panel`). */
const CAMPOS_DE_CONTACTO: readonly RepoFieldDef[] = [
  { key: 'name', labelKey: 'repositories.columns.name', type: 'text', required: true },
  { key: 'phone', labelKey: 'repositories.agendas.phone', type: 'text', inputType: 'tel', required: true },
];

/**
 * El editor de una agenda (DD-163): su nombre, su estado y sus contactos. Va en su propia ruta, como las fichas, para que
 * Atrás vuelva a donde se estaba y la guarda avise de lo que no se ha guardado; Guardar y Deshacer suben a la barra de
 * arriba. Los contactos son una tabla dentro de su sección (DD-160), en su propio componente.
 */
@Component({
  selector: 'sc-agenda-editor-page',
  imports: [
    AgendaContactsTableComponent,
    ButtonComponent,
    DialogComponent,
    InputTextComponent,
    MessageComponent,
    RepoFormPanelComponent,
    SectionCardComponent,
    SelectComponent,
    TranslateModule,
  ],
  templateUrl: './agenda-editor-page.component.html',
  styleUrl: './agenda-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaEditorPageComponent implements DirtyAware, OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(AgendasStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly crossTab = inject(CrossTabLockService);
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>('create');
  private agendaId: number | null = null;
  private releaseLock: (() => void) | null = null;
  protected readonly conflictWarning = signal(false);

  protected readonly form = signal<AgendaDraft>(VACIA);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;

  protected readonly statusOptions = computed(() => {
    this.lang();
    return [
      { label: this.translate.instant('repositories.status.active'), value: 'active' },
      { label: this.translate.instant('repositories.status.inactive'), value: 'inactive' },
    ];
  });

  /** El nombre no se repite entre agendas (sin contar la propia), como en el panel de la lista. */
  protected readonly nameTaken = computed(() => {
    const name = this.form().name.trim().toLowerCase();
    return !!name && this.store.items().some((a) => a.id !== this.agendaId && a.name.trim().toLowerCase() === name);
  });

  /** Por qué no se puede guardar, dicho en la barra como en las fichas: falta el nombre, o ya lo tiene otra agenda. */
  protected readonly blockedReason = computed<string | null>(() => {
    this.lang();
    if (!this.form().name.trim()) {
      return this.translate.instant('common.summary_missing', { items: this.translate.instant('common.summary_missing_name') });
    }
    return this.nameTaken() ? this.translate.instant('repositories.agendas.errors.name_taken') : null;
  });

  protected readonly canSave = computed(() => !this.blockedReason() && (this.mode() === 'create' || this.formDirty()));

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      this.dirtyState.markPristine();
      return;
    }
    const agenda = this.store.items().find((a) => a.id === Number(raw));
    if (!agenda) {
      void this.router.navigateByUrl('/admin/agendas', { replaceUrl: true });
      return;
    }
    this.mode.set('edit');
    this.agendaId = agenda.id;
    this.form.set({ name: agenda.name, description: agenda.description, status: agenda.status, contacts: agenda.contacts });
    this.dirtyState.markPristine();
    this.releaseLock = this.crossTab.acquire('agenda', agenda.id, () => this.conflictWarning.set(true));
  }

  ngOnDestroy(): void {
    this.releaseLock?.();
    this.releaseLock = null;
  }

  protected update<K extends keyof AgendaDraft>(key: K, value: AgendaDraft[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected save(): void {
    if (!this.canSave()) return;
    const f = this.form();
    const draft = { ...f, name: f.name.trim(), description: f.description.trim() };
    if (this.mode() === 'create') {
      const created = this.store.addItem(draft);
      this.dirtyState.markPristine();
      this.toast('repositories.toasts.created', created.name);
      void this.router.navigateByUrl(`/admin/agendas/editar/${created.id}`, { replaceUrl: true });
      return;
    }
    this.store.updateItem(this.agendaId!, draft);
    this.form.set(draft);
    this.dirtyState.markPristine();
    this.toast('repositories.toasts.updated', draft.name);
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
  }

  /* ── Contactos ────────────────────────────────────────────────────────── */

  protected readonly contactFields = CAMPOS_DE_CONTACTO;
  /** El diálogo de un contacto: `null` cerrado; con `contact: null`, para añadir. */
  protected readonly contactDialog = signal<{ readonly contact: AgendaContact | null } | null>(null);

  /** El teléfono, válido y sin repetir en la agenda (comparado por sus cifras). Devuelve la clave del error. */
  protected readonly validateContact = (values: RepoFormSubmission): string | null => {
    const phone = values['phone'] ?? '';
    if (!telefonoValido(phone)) return 'repositories.agendas.errors.phone_invalid';
    const propio = this.contactDialog()?.contact?.id ?? null;
    const clave = normalizarTelefono(phone);
    const repetido = this.form().contacts.some((c) => c.id !== propio && normalizarTelefono(c.phone) === clave);
    return repetido ? 'repositories.agendas.errors.phone_taken' : null;
  };

  protected onContactSave(values: RepoFormSubmission): void {
    const editing = this.contactDialog()?.contact ?? null;
    const name = values['name'] ?? '';
    const phone = values['phone'] ?? '';
    this.form.update((f) => {
      if (editing) return { ...f, contacts: f.contacts.map((c) => (c.id === editing.id ? { ...c, name, phone } : c)) };
      // Arriba, donde se ve: al final, en la agenda grande caería en la última página.
      const id = f.contacts.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      return { ...f, contacts: [{ id, name, phone }, ...f.contacts] };
    });
    this.contactDialog.set(null);
  }

  protected removeContact(contact: AgendaContact): void {
    this.form.update((f) => ({ ...f, contacts: f.contacts.filter((c) => c.id !== contact.id) }));
  }

  /* ── Teclado y pestaña ────────────────────────────────────────────────── */

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.formDirty()) event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
    }
  }

  private toast(key: string, name: string): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(key, { entity: this.translate.instant('repositories.agendas.singular'), name }),
      life: TOAST_LIFE.success,
    });
  }
}
