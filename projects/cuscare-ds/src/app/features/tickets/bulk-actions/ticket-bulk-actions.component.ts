import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, Injector, input, output, signal, TemplateRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListboxModule } from 'primeng/listbox';
import { Popover, PopoverModule } from 'primeng/popover';
import { ScButtonComponent, ScDatatableComponent, ScDialogComponent, ScMultiSelectComponent, ScSelectComponent, type ScColumnCellContext, type ScColumnDef } from '@smartcontact-hub/components';

import { ASSIGNABLE_AGENTS, type TicketRow } from '../../../data/seed';
import { CHANGEABLE_STATUSES, PENDING_SUBSTATUSES, STATUS_WITH_SUBSTATUS, type BulkActionKind, type BulkActionRequest } from './bulk-actions';

/** Una fila de la tabla del modal: lo que enseña, ya resuelto. */
interface ConfirmRow {
  readonly id: string;
  readonly created: string;
  readonly service: string;
  readonly products: readonly string[];
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
 * elegir; Cancellation pide en el propio modal qué servicios cancelar). En los desplegables no hay botón de aceptar: elegir la opción que cierra la selección abre el modal (un agente; un
 * estado, o el subestado si el estado es Pending). «Closed (Spam)» es una opción más de Change status. El modal es el mismo
 * para las cuatro: «Vas a… N tickets», la tabla de los tickets afectados y Cancelar / confirmar.
 * CUANDO: la barra del listado de Tickets, con filas marcadas. Maqueta: no cambia los datos; avisa de lo confirmado.
 *
 * Un solo `p-popover` compartido por los dos desplegables: nunca hay más de uno abierto. Se cierra al clicar fuera, con Esc, al
 * elegir y al pulsar otro botón (el popover se recoloca bajo el nuevo disparador en vez de apilarse).
 */
@Component({
  selector: 'app-ticket-bulk-actions',
  imports: [FormsModule, ListboxModule, PopoverModule, ScButtonComponent, ScDatatableComponent, ScDialogComponent, ScMultiSelectComponent, ScSelectComponent],
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
  private readonly serviceCell = viewChild.required<TemplateRef<ScColumnCellContext<ConfirmRow>>>('serviceCell');
  /** La columna Service pinta en negrita los servicios elegidos (Cancellation); el resto de columnas, tal cual. */
  protected readonly columns = computed<readonly ScColumnDef<ConfirmRow>[]>(() =>
    CONFIRM_COLUMNS.map((c) => (c.field === 'service' ? { ...c, cellTemplate: this.serviceCell() } : c)),
  );

  /** Qué desplegable está abierto (el popover es uno solo). */
  protected readonly panel = signal<'assign' | 'status' | null>(null);
  protected readonly pendingStatus = signal<string | null>(null);
  protected readonly pendingSubstatus = signal<string | null>(null);
  protected readonly substatuses = PENDING_SUBSTATUSES;
  protected readonly needsSubstatus = computed(() => this.pendingStatus() === STATUS_WITH_SUBSTATUS);

  /** La acción del modal abierto, o `null` si no hay. */
  protected readonly request = signal<BulkActionRequest | null>(null);
  protected readonly dialogOpen = signal(false);

  protected readonly count = computed(() => this.tickets().length);
  protected readonly hasSelection = computed(() => this.count() > 0);

  /** El popover sin caret y pegado al botón, igual que los filtros de la tabla. */
  protected readonly popoverTokens = { gutter: '0px' };
  protected readonly listboxTokens = { root: { borderColor: 'transparent', background: 'transparent', shadow: 'none' } };

  /** Cancellation: los servicios que cuelgan de los tickets marcados (sin repetir) y los que el usuario elige cancelar. */
  protected readonly productOptions = computed(() =>
    [...new Set(this.tickets().flatMap((t) => t.products))].sort().map((p) => ({ label: p, value: p })),
  );
  protected readonly selectedProducts = signal<string[]>([]);
  protected readonly isCancellation = computed(() => this.request()?.kind === 'cancellation');

  protected readonly rows = computed<readonly ConfirmRow[]>(() =>
    this.tickets().map((t) => ({
      id: t.id,
      created: t.created,
      service: t.products.join(', ') || '—',
      products: t.products,
      group: t.group,
      status: cap(t.status),
      channel: cap(t.channel),
      description: t.description || '—',
    })),
  );

  /**
   * Con servicios elegidos, marca en la tabla qué tickets afecta la baja (llevan alguno) y cuáles no, sin quitar ninguno.
   * Es una función nueva con cada cambio de la elección: así la tabla la vuelve a leer.
   */
  protected readonly rowClass = computed(() => {
    const chosen = this.selectedProducts();
    if (!this.isCancellation() || chosen.length === 0) return undefined;
    return (row: ConfirmRow): string => (row.products.some((p) => chosen.includes(p)) ? 'bulk-row--affected' : 'bulk-row--unaffected');
  });

  /** Solo Cancellation resalta servicios: en los demás modales la elección que quedó de antes no cuenta. */
  protected isChosen(product: string): boolean {
    return this.isCancellation() && this.selectedProducts().includes(product);
  }

  private readonly noun = computed(() => (this.count() === 1 ? 'ticket' : 'tickets'));
  /** Cancellation no se confirma sin elegir al menos un servicio. */
  protected readonly canConfirm = computed(() => !this.isCancellation() || this.selectedProducts().length > 0);

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
      case 'cancellation': {
        const chosen = this.selectedProducts();
        if (chosen.length === 0) return `You are about to cancel services on ${n}.`;
        return `You are about to cancel ${chosen.join(', ')} on ${n}.`;
      }
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

  /** Cambiar de estado descarta el subestado que hubiera elegido. Pending espera su subestado; los demás abren ya el modal. */
  protected pickStatus(status: string | null): void {
    this.pendingStatus.set(status);
    this.pendingSubstatus.set(null);
    if (status && status !== STATUS_WITH_SUBSTATUS) {
      this.ask('status', status);
      this.popover().hide();
    }
  }

  /** El subestado cierra la elección de Pending: abre el modal. */
  protected pickSubstatus(substatus: string | null): void {
    const status = this.pendingStatus();
    if (!status || !substatus) return;
    this.pendingSubstatus.set(substatus);
    this.ask('status', status, PENDING_SUBSTATUSES.find((s) => s.value === substatus)?.label);
    this.popover().hide();
  }

  protected onPopoverHide(): void {
    this.panel.set(null);
  }

  /** Abre el modal de confirmación para una acción. */
  protected ask(kind: BulkActionKind, value?: string, substatus?: string): void {
    const label = kind === 'status' ? (CHANGEABLE_STATUSES.find((s) => s.value === value)?.label ?? cap(value ?? '')) : value;
    if (kind === 'cancellation') this.selectedProducts.set([]);
    this.request.set({ kind, value: substatus ? `${label} (${substatus})` : label });
    this.dialogOpen.set(true);
  }

  protected pickAgent(agent: string | null): void {
    if (agent) this.ask('assign', agent);
  }

  protected confirm(): void {
    const req = this.request();
    this.dialogOpen.set(false);
    if (!req) return;
    if (req.kind === 'cancellation') {
      this.confirmed.emit({ kind: 'cancellation', value: this.selectedProducts().join(', ') });
      return;
    }
    this.confirmed.emit(req);
  }
}
