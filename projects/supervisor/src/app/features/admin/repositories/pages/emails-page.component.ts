import { ChangeDetectionStrategy, Component, computed, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  type ScColumnCellContext,
  type ScColumnDef,
  ScButtonComponent as ButtonComponent,
  ScDatatableComponent as DatatableComponent,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScSectionCardComponent as SectionCardComponent,
} from '@smartcontact-hub/components';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import { type EmailTrigger, EmailTriggersStore, type Mailbox, MailboxesStore } from '../state/emails.store';

const ACCIONES = 'acciones';

/**
 * El repositorio de Email (DD-185): las cuentas de correo y los triggers que se les aplican, cada uno en su lista con
 * su «Crear», como la pestaña Emails de Voice. El alta y la edición van en su propia ruta (como las agendas, DD-163),
 * porque una cuenta lleva dos servidores y los triggers que la usan, y un panel no los aguanta.
 */
@Component({
  selector: 'sc-emails-page',
  imports: [
    ButtonComponent,
    DatatableComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    SectionCardComponent,
    TranslateModule,
  ],
  templateUrl: './emails-page.component.html',
  styleUrl: './emails-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailsPageComponent {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();
  protected readonly mailboxes = inject(MailboxesStore);
  protected readonly triggers = inject(EmailTriggersStore);

  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Mailbox>>>('nameTpl');
  private readonly createdTpl = viewChild<TemplateRef<unknown>>('createdTpl');
  private readonly modifiedTpl = viewChild<TemplateRef<unknown>>('modifiedTpl');
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<Mailbox | EmailTrigger>>>('actionsTpl');

  /** La fecha de una fila, como la escribe el idioma de la pantalla (día, mes, año y hora con segundos). */
  protected fecha(iso: string): string {
    return new Intl.DateTimeFormat(this.language.locale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
  }

  protected readonly mailboxColumns = computed<readonly ScColumnDef<Mailbox>[]>(() => {
    this.lang();
    const t = (k: string) => this.translate.instant(k);
    return [
      { field: 'name', header: t('repositories.columns.name'), cellTemplate: this.nameTpl() },
      { field: 'createdAt', header: t('repositories.emails.created'), width: '12.5rem', cellTemplate: this.createdTpl() as never },
      { field: 'modifiedAt', header: t('repositories.emails.modified'), width: '12.5rem', cellTemplate: this.modifiedTpl() as never },
      { field: 'totalEmails', header: t('repositories.emails.total'), width: '8rem', align: 'right' },
      this.actionsColumn(),
    ];
  });

  protected readonly triggerColumns = computed<readonly ScColumnDef<EmailTrigger>[]>(() => {
    this.lang();
    const t = (k: string) => this.translate.instant(k);
    return [
      { field: 'name', header: t('repositories.columns.name') },
      { field: 'createdAt', header: t('repositories.emails.created'), width: '12.5rem', cellTemplate: this.createdTpl() as never },
      { field: 'modifiedAt', header: t('repositories.emails.modified'), width: '12.5rem', cellTemplate: this.modifiedTpl() as never },
      this.actionsColumn(),
    ];
  });

  private actionsColumn(): ScColumnDef<never> {
    return {
      field: ACCIONES,
      header: '',
      headerAriaLabel: this.translate.instant('common.actions'),
      width: 'var(--sc-spacing-5)',
      align: 'right',
      stopRowClick: true,
      cellTemplate: this.actionsTpl(),
    } as ScColumnDef<never>;
  }

  protected crear(tipo: 'cuentas' | 'triggers'): void {
    void this.router.navigateByUrl(`/admin/emails/${tipo}/crear`);
  }

  protected editar(tipo: 'cuentas' | 'triggers', id: number): void {
    void this.router.navigateByUrl(`/admin/emails/${tipo}/editar/${id}`);
  }

  /* ── Quitar ─────────────────────────────────────────────────────────────── */

  protected readonly borrar = signal<{ readonly tipo: 'cuentas' | 'triggers'; readonly id: number; readonly name: string } | null>(null);
  protected readonly borrarItems = computed(() => {
    const b = this.borrar();
    return b ? [{ id: b.id, name: b.name }] : [];
  });

  protected pedirBorrar(tipo: 'cuentas' | 'triggers', row: { readonly id: number; readonly name: string }): void {
    this.borrar.set({ tipo, id: row.id, name: row.name });
  }

  protected confirmarBorrar(): void {
    const b = this.borrar();
    if (!b) return;
    if (b.tipo === 'cuentas') this.mailboxes.deleteItem(b.id);
    else this.triggers.deleteItem(b.id);
    this.borrar.set(null);
  }
}
