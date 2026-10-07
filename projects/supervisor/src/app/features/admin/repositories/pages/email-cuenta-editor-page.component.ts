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
  ScCheckboxComponent as CheckboxComponent,
  ScInputTextComponent as InputTextComponent,
  ScPasswordComponent as PasswordComponent,
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
  type MailServer,
  MailboxesStore,
  SERVIDOR_VACIO,
} from '../state/emails.store';

interface MailboxDraft {
  readonly name: string;
  readonly incoming: MailServer;
  readonly outgoing: MailServer;
  readonly triggerIds: readonly number[];
  readonly defaultAction: EmailAction;
  readonly defaultTarget: string;
}

const VACIO: MailboxDraft = {
  name: '',
  incoming: SERVIDOR_VACIO,
  outgoing: SERVIDOR_VACIO,
  triggerIds: [],
  defaultAction: 'transfer',
  defaultTarget: '',
};

/**
 * El editor de una cuenta de correo (repositorio de Email, DD-185), con las secciones de Voice: la cuenta, los datos del
 * correo entrante y del saliente (cada uno con su prueba), los triggers que se le aplican y la acción por defecto. Va en
 * su propia ruta, como las agendas: Guardar y Deshacer suben a la barra de arriba y la guarda avisa de lo no guardado.
 */
@Component({
  selector: 'sc-email-cuenta-editor-page',
  imports: [
    ButtonComponent,
    CheckboxComponent,
    InputTextComponent,
    PasswordComponent,
    SectionCardComponent,
    SelectComponent,
    TranslateModule,
  ],
  templateUrl: './email-cuenta-editor-page.component.html',
  styleUrl: './emails-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailCuentaEditorPageComponent implements DirtyAware, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(MailboxesStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  protected readonly triggers = inject(EmailTriggersStore);
  private readonly groups = inject(GroupsStore);

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>('create');
  private mailboxId: number | null = null;
  private createdAt = '';
  private totalEmails = 0;

  protected readonly form = signal<MailboxDraft>(VACIO);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;

  protected readonly actionOptions = computed(() => {
    this.lang();
    return (['transfer', 'queue'] as const).map((value) => ({
      value,
      label: this.translate.instant(`repositories.emails.mailbox.action_${value}`),
    }));
  });

  /** Los grupos a los que se puede llevar un correo, por su nombre. */
  protected readonly targetOptions = computed(() => {
    this.lang();
    return [
      { value: '', label: this.translate.instant('repositories.emails.mailbox.no_target') },
      ...this.groups.groups().map((g) => ({ value: g.name, label: g.name })),
    ];
  });

  protected readonly nameTaken = computed(() => {
    const name = this.form().name.trim().toLowerCase();
    return !!name && this.store.items().some((m) => m.id !== this.mailboxId && m.name.trim().toLowerCase() === name);
  });

  protected readonly blockedReason = computed<string | null>(() => {
    this.lang();
    if (!this.form().name.trim()) {
      return this.translate.instant('common.summary_missing', { items: this.translate.instant('common.summary_missing_name') });
    }
    return this.nameTaken() ? this.translate.instant('repositories.emails.mailbox.name_taken') : null;
  });

  protected readonly canSave = computed(() => !this.blockedReason() && (this.mode() === 'create' || this.formDirty()));

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      this.dirtyState.markPristine();
      return;
    }
    const mailbox = this.store.items().find((m) => m.id === Number(raw));
    if (!mailbox) {
      void this.router.navigateByUrl('/admin/emails', { replaceUrl: true });
      return;
    }
    this.mode.set('edit');
    this.mailboxId = mailbox.id;
    this.createdAt = mailbox.createdAt;
    this.totalEmails = mailbox.totalEmails;
    this.form.set({
      name: mailbox.name,
      incoming: mailbox.incoming,
      outgoing: mailbox.outgoing,
      triggerIds: mailbox.triggerIds,
      defaultAction: mailbox.defaultAction,
      defaultTarget: mailbox.defaultTarget,
    });
    this.dirtyState.markPristine();
  }

  protected setName(name: string): void {
    this.form.update((f) => ({ ...f, name }));
  }

  protected setServer(which: 'incoming' | 'outgoing', key: keyof MailServer, value: string): void {
    this.form.update((f) => ({ ...f, [which]: { ...f[which], [key]: value } }));
  }

  protected hasTrigger(id: number): boolean {
    return this.form().triggerIds.includes(id);
  }

  protected toggleTrigger(id: number): void {
    this.form.update((f) => ({
      ...f,
      triggerIds: f.triggerIds.includes(id) ? f.triggerIds.filter((t) => t !== id) : [...f.triggerIds, id],
    }));
  }

  protected setAction(value: unknown): void {
    if (value === 'transfer' || value === 'queue') this.form.update((f) => ({ ...f, defaultAction: value }));
  }

  protected setTarget(value: unknown): void {
    this.form.update((f) => ({ ...f, defaultTarget: typeof value === 'string' ? value : '' }));
  }

  /** La prueba de un servidor: de momento no sale a ninguna parte; dice si hay datos para intentarla. */
  protected test(which: 'incoming' | 'outgoing'): void {
    const s = this.form()[which];
    const ok = !!(s.host.trim() && s.port.trim() && s.user.trim());
    this.messages.add({
      severity: ok ? 'success' : 'warn',
      summary: this.translate.instant(ok ? `repositories.emails.mailbox.test_ok_${which}` : 'repositories.emails.mailbox.test_missing'),
      life: ok ? TOAST_LIFE.success : TOAST_LIFE.warn,
    });
  }

  protected save(): void {
    if (!this.canSave()) return;
    const f = this.form();
    const draft = { ...f, name: f.name.trim() };
    if (this.mode() === 'create') {
      const created = this.store.addItem({ ...draft, createdAt: ahora(), modifiedAt: ahora(), totalEmails: 0 });
      this.dirtyState.markPristine();
      this.toast('repositories.toasts.created', created.name);
      void this.router.navigateByUrl(`/admin/emails/cuentas/editar/${created.id}`, { replaceUrl: true });
      return;
    }
    this.store.updateItem(this.mailboxId!, { ...draft, createdAt: this.createdAt, modifiedAt: ahora(), totalEmails: this.totalEmails });
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
      summary: this.translate.instant(key, { entity: this.translate.instant('repositories.emails.mailbox_singular'), name }),
      life: TOAST_LIFE.success,
    });
  }
}
