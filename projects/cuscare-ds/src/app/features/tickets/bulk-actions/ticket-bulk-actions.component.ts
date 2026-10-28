import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, Injector, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListboxModule } from 'primeng/listbox';
import { Popover, PopoverModule } from 'primeng/popover';
import { ScButtonComponent, ScDatatableComponent, ScDialogComponent, ScSelectComponent, type ScColumnDef } from '@smartcontact-hub/components';

import { ASSIGNABLE_AGENTS, type TicketRow } from '../../../data/seed';
import { CHANGEABLE_STATUSES, PENDING_SUBSTATUSES, SPAM_STATUS, STATUS_WITH_SUBSTATUS, type BulkActionKind, type BulkActionRequest } from './bulk-actions';

/** Una fila de la tabla del modal: lo que enseña, ya resuelto. */
interface ConfirmRow {
  readonly id: string;
  readonly created: string;
  readonly service: string;
  readonly group: string;
  readonly status: string;
  readonly channel: string;
  readonly description: string;
}

const cap = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const CONFIRM_COLUMNS: readonly ScColumnDef<ConfirmRow>[] = [
  { field: 'id', header: 'Id' },
  { field: 'created', header: 'Created' },
  { field: 'service', header: 'Service' },
  { field: 'group', header: 'Group' },
  { field: 'status', header: 'Status' },
  { field: 'channel', header: 'Channel' },
  { field: 'description', header: 'Description' },
];

/**
 * Las cuatro acciones en bloque del listado de Tickets: Assign, Change status, Cancellation y File. Cada una es un botón con
 * su desplegable (Assign y Change status), o abre directo el modal de confirmación (Cancellation y File: no hay nada que
 * elegir). El modal es el mismo para las cuatro: «Vas a… N tickets», la tabla de los tickets afectados y Cancelar / confirmar.
 * CUANDO: la barra del listado de Tickets, con filas marcadas. Maqueta: no cambia los datos; avisa de lo confirmado.
 *
 * Un solo `p-popover` compartido por los dos desplegables: nunca hay más de uno abierto. Se cierra al clicar fuera, con Esc, al
 * elegir y al pulsar otro botón (el popover se recoloca bajo el nuevo disparador en vez de apilarse).
 */
@Component({
  selector: 'app-ticket-bulk-actions',
  imports: [FormsModule, ListboxModule, PopoverModule, ScButtonComponent, ScDatatableComponent, ScDialogComponent, ScSelectComponent],
  templateUrl: './ticket-bulk-actions.component.html',
  styleUrl: './ticket-bulk-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class TicketBulkActionsComponent {
  /** Las filas marcadas. Sin ninguna, los cuatro botones están apagados. */
  readonly tickets = input.required<readonly TicketRow[]>();
  /** Se confirmó una acción en el modal. */
  readonly confirmed = output<BulkActionRequest>();

  protected readonly agents = ASSIGNABLE_AGENTS;
  protected readonly statuses = CHANGEABLE_STATUSES;
  protected readonly columns = CONFIRM_COLUMNS;

  /** Qué desplegable está abierto (el popover es uno solo). */
  protected readonly panel = signal<'assign' | 'status' | null>(null);
  protected readonly pendingStatus = signal<string | null>(null);
  protected readonly pendingSubstatus = signal<string | null>(null);
  protected readonly substatuses = PENDING_SUBSTATUSES;
  protected readonly needsSubstatus = computed(() => this.pendingStatus() === STATUS_WITH_SUBSTATUS);
  /** Aceptar se enciende con el estado elegido y, si es Pending, también su subestado (obligatorio). */
  protected readonly canAccept = computed(() => !!this.pendingStatus() && (!this.needsSubstatus() || !!this.pendingSubstatus()));

  /** La acción del modal abierto, o `null` si no hay. */
  protected readonly request = signal<BulkActionRequest | null>(null);
  protected readonly dialogOpen = signal(false);

  protected readonly count = computed(() => this.tickets().length);
  protected readonly hasSelection = computed(() => this.count() > 0);

  /** El popover sin caret y pegado al botón, igual que los filtros de la tabla. */
  protected readonly popoverTokens = { gutter: '0px' };
  protected readonly listboxTokens = { root: { borderColor: 'transparent', background: 'transparent', shadow: 'none' } };

  protected readonly rows = computed<readonly ConfirmRow[]>(() =>
    this.tickets().map((t) => ({
      id: t.id,
      created: t.created,
      service: t.products.join(', ') || '—',
      group: t.group,
      status: cap(t.status),
      channel: cap(t.channel),
      description: t.description || '—',
    })),
  );

  private readonly noun = computed(() => (this.count() === 1 ? 'ticket' : 'tickets'));

  protected readonly title = computed(() => {
    switch (this.request()?.kind) {
      case 'assign':
        return 'Assign tickets';
      case 'status':
        return 'Change status';
      case 'cancellation':
        return 'Cancellation';
      case 'file':
        return 'File tickets';
      default:
        return '';
    }
  });

  /** «Vas a… N tickets», con el dato de la acción. */
  protected readonly subtitle = computed(() => {
    const n = `${this.count()} ${this.noun()}`;
    const req = this.request();
    switch (req?.kind) {
      case 'assign':
        return `You are about to assign ${n} to ${req.value}.`;
      case 'status':
        return `You are about to change the status of ${n} to ${req.value}.`;
      case 'cancellation':
        return `You are about to cancel the service of all products on ${n}.`;
      case 'file':
        return `You are about to file ${n}.`;
      default:
        return '';
    }
  });

  protected readonly confirmLabel = computed(
    () => ({ assign: 'Assign', status: 'Change status', cancellation: 'Confirm cancellation', file: 'File' })[this.request()?.kind ?? 'file'],
  );

  /** Cancelar el servicio es lo único destructivo: su botón de confirmar va en peligro. */
  protected readonly confirmVariant = computed(() => (this.request()?.kind === 'cancellation' ? 'danger' : 'primary'));

  private readonly popover = viewChild.required(Popover);
  private readonly injector = inject(Injector);

  /**
   * Abre, cierra o cambia el desplegable. Con uno abierto, pulsar el MISMO botón lo cierra; pulsar OTRO cambia el contenido del
   * mismo popover y lo recoloca bajo el botón nuevo, sin cerrarlo ni abrir un segundo (PrimeNG lo deja a medias).
   */
  protected toggle(event: Event, kind: 'assign' | 'status'): void {
    const target = event.currentTarget as HTMLElement;
    const popover = this.popover();
    // Que el clic no llegue al documento, que lo leería como «fuera» y cerraría el popover que acabamos de mover.
    event.stopPropagation();
    if (popover.overlayVisible()) {
      if (this.panel() === kind) {
        popover.hide();
        return;
      }
      this.panel.set(kind);
      this.resetStatus();
      popover.target = target;
      afterNextRender(() => popover.align(), { injector: this.injector });
      return;
    }
    this.panel.set(kind);
    this.resetStatus();
    popover.show(event, target);
  }

  private resetStatus(): void {
    this.pendingStatus.set(null);
    this.pendingSubstatus.set(null);
  }

  /** Cambiar de estado descarta el subestado que hubiera elegido. */
  protected pickStatus(status: string | null): void {
    this.pendingStatus.set(status);
    this.pendingSubstatus.set(null);
  }

  protected onPopoverHide(): void {
    this.panel.set(null);
  }

  /** Abre el modal de confirmación para una acción. */
  protected ask(kind: BulkActionKind, value?: string, substatus?: string): void {
    const label = kind === 'status' ? (CHANGEABLE_STATUSES.find((s) => s.value === value)?.label ?? cap(value ?? '')) : value;
    this.request.set({ kind, value: substatus ? `${label} (${substatus})` : label });
    this.dialogOpen.set(true);
  }

  protected pickAgent(agent: string | null): void {
    if (agent) this.ask('assign', agent);
  }

  protected acceptStatus(): void {
    const status = this.pendingStatus();
    if (!status || !this.canAccept()) return;
    const sub = PENDING_SUBSTATUSES.find((s) => s.value === this.pendingSubstatus())?.label;
    this.ask('status', status, sub);
  }

  protected markSpam(): void {
    this.ask('status', SPAM_STATUS);
  }

  protected confirm(): void {
    const req = this.request();
    this.dialogOpen.set(false);
    if (req) this.confirmed.emit(req);
  }
}
