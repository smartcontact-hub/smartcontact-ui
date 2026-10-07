import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
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
  ScInputTextComponent as InputTextComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectComponent as SelectComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import {
  ahora,
  type EmailAction,
  EmailTriggersStore,
  MailboxesStore,
  TRIGGER_FIELDS,
  TRIGGER_OPERATORS,
  type TriggerField,
  type TriggerOperator,
} from '../state/emails.store';

interface TriggerDraft {
  readonly name: string;
  readonly description: string;
  readonly label: string;
  readonly field: TriggerField;
  readonly operator: TriggerOperator;
  readonly value: string;
  readonly action: EmailAction;
  readonly target: string;
  readonly mailboxId: number | null;
}

const VACIO: TriggerDraft = {
  name: '',
  description: '',
  label: '',
  field: 'body',
  operator: 'contains',
  value: '',
  action: 'transfer',
  target: '',
  mailboxId: null,
};

/**
 * El editor de un trigger (repositorio de Email, DD-185), con las secciones de Voice: el trigger (nombre, descripción y
 * etiqueta), la condición (un campo del correo, un operador y un valor), la acción (transferir o cola, y a qué grupo) y
 * la cuenta de correo a la que se aplica.
 */
@Component({
  selector: 'sc-email-trigger-editor-page',
  imports: [ButtonComponent, InputTextComponent, SectionCardComponent, SelectComponent, TranslateModule],
  templateUrl: './email-trigger-editor-page.component.html',
  styleUrl: './emails-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTriggerEditorPageComponent implements DirtyAware, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(EmailTriggersStore);
  private readonly mailboxes = inject(MailboxesStore);
  private readonly groups = inject(GroupsStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>('create');
  private triggerId: number | null = null;
  private createdAt = '';

  protected readonly form = signal<TriggerDraft>(VACIO);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;

  protected readonly fieldOptions = computed(() => {
    this.lang();
    return TRIGGER_FIELDS.map((value) => ({ value, label: this.translate.instant(`repositories.emails.trigger.fields.${value}`) }));
  });
  protected readonly operatorOptions = computed(() => {
    this.lang();
    return TRIGGER_OPERATORS.map((value) => ({ value, label: this.translate.instant(`repositories.emails.trigger.operators.${value}`) }));
  });
  protected readonly actionOptions = computed(() => {
    this.lang();
    return (['transfer', 'queue'] as const).map((value) => ({
      value,
      label: this.translate.instant(`repositories.emails.mailbox.action_${value}`),
    }));
  });
  protected readonly targetOptions = computed(() => {
    this.lang();
    return [
      { value: '', label: this.translate.instant('repositories.emails.mailbox.no_target') },
      ...this.groups.groups().map((g) => ({ value: g.name, label: g.name })),
    ];
  });
  protected readonly mailboxOptions = computed(() => {
    this.lang();
    return [
      { value: null, label: this.translate.instant('repositories.emails.trigger.mailbox_none') },
      ...this.mailboxes.items().map((m) => ({ value: m.id as number | null, label: m.name })),
    ];
  });

  protected readonly nameTaken = computed(() => {
    const name = this.form().name.trim().toLowerCase();
    return !!name && this.store.items().some((t) => t.id !== this.triggerId && t.name.trim().toLowerCase() === name);
  });

  protected readonly blockedReason = computed<string | null>(() => {
    this.lang();
    if (!this.form().name.trim()) {
      return this.translate.instant('common.summary_missing', { items: this.translate.instant('common.summary_missing_name') });
    }
    return this.nameTaken() ? this.translate.instant('repositories.emails.trigger.name_taken') : null;
  });

  protected readonly canSave = computed(() => !this.blockedReason() && (this.mode() === 'create' || this.formDirty()));

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      this.dirtyState.markPristine();
      return;
    }
    const trigger = this.store.items().find((t) => t.id === Number(raw));
    if (!trigger) {
      void this.router.navigateByUrl('/admin/emails', { replaceUrl: true });
      return;
    }
    this.mode.set('edit');
    this.triggerId = trigger.id;
    this.createdAt = trigger.createdAt;
    const { id: _id, createdAt: _c, modifiedAt: _m, ...draft } = trigger;
    this.form.set(draft);
    this.dirtyState.markPristine();
  }

  protected update<K extends keyof TriggerDraft>(key: K, value: TriggerDraft[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected save(): void {
    if (!this.canSave()) return;
    const f = this.form();
    const draft = { ...f, name: f.name.trim(), description: f.description.trim(), label: f.label.trim(), value: f.value.trim() };
    if (this.mode() === 'create') {
      const created = this.store.addItem({ ...draft, createdAt: ahora(), modifiedAt: ahora() });
      this.dirtyState.markPristine();
      this.toast('repositories.toasts.created', created.name);
      void this.router.navigateByUrl(`/admin/emails/triggers/editar/${created.id}`, { replaceUrl: true });
      return;
    }
    this.store.updateItem(this.triggerId!, { ...draft, createdAt: this.createdAt, modifiedAt: ahora() });
    this.form.set(draft);
    this.dirtyState.markPristine();
    this.toast('repositories.toasts.updated', draft.name);
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.formDirty()) event.preventDefault();
  }

  private toast(key: string, name: string): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(key, { entity: this.translate.instant('repositories.emails.trigger_singular'), name }),
      life: TOAST_LIFE.success,
    });
  }
}
