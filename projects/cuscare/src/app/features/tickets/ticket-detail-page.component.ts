import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { TICKETS } from '../../data/seed';
import { SearchCustomerModalComponent } from './search-customer-modal.component';
import { TicketStatusModalComponent } from './ticket-status-modal.component';

/** Una línea de la tabla de suscripciones del detalle. */
interface Subscription {
  readonly product: string;
  readonly status: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly price: string;
  readonly refund: string;
  readonly operator: string;
  readonly company: string;
  readonly campaign: string;
  readonly provider: string;
  readonly ip: string;
}

/** Un evento del timeline (History ticket). */
interface HistoryEvent {
  readonly time: string;
  readonly kind: 'status' | 'unsubscribe' | 'call' | 'created';
  readonly text: string;
  readonly highlight?: string;
}

/**
 * Detalle de un ticket. Estructura medida del real: cabecera con estado, barra de
 * metadatos, tabla de suscripciones, 3 pestañas (History / Notes / Attached files)
 * y timeline de eventos.
 *
 * `id` entra por binding de ruta (`withComponentInputBinding` no está activo, así
 * que se resuelve contra el seed por si el id no existe).
 */
@Component({
  selector: 'app-ticket-detail-page',
  standalone: true,
  imports: [SearchCustomerModalComponent, TicketStatusModalComponent],
  templateUrl: './ticket-detail-page.component.html',
  styleUrl: './ticket-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDetailPageComponent {
  readonly id = input<string>('2050567');

  private readonly route = inject(ActivatedRoute);

  /**
   * **Modo pre-ticket** — lo que sale de verdad al pulsar "Save" en el selector
   * de grupo de "+ New ticket".
   *
   * No es un formulario: es ESTA misma pantalla en vacío (`#0`, guiones, ceros)
   * con el modal "Search customer" encima. El ticket ya existe antes de rellenar
   * nada; la app real navega a `…/tickets/ticket/2051827/pre-ticket` y lo primero
   * que pide es enganchar un cliente.
   *
   * Se lee de la URL porque este proyecto no usa `withComponentInputBinding`.
   */
  protected readonly isPreTicket = this.route.snapshot.url.some((s) => s.path === 'pre-ticket');

  protected readonly searchCustomerOpen = signal(this.isPreTicket);

  /** El pill de estado abre "Ticket Status" (10 naturalezas + 2 estados). */
  protected readonly statusModalOpen = signal(false);

  protected readonly ticket = computed(
    () => TICKETS.find((t) => t.id === this.id()) ?? TICKETS[1],
  );

  protected readonly tab = signal<'history' | 'notes' | 'files'>('history');

  protected readonly subCols = [
    'Product',
    'Status',
    'Start Date',
    'End Date',
    'Usage',
    'Price',
    'Refund',
    'Operator',
    'Company',
    'Campaign',
    'Provider',
    'Ip',
    'Summary',
  ];

  protected readonly subscriptions: readonly Subscription[] = [
    {
      product: 'playweez',
      status: 'Cancelled',
      startDate: '11-08-2026 13:09:04',
      endDate: '11-08-2026 13:20:45',
      price: '4.5',
      refund: '',
      operator: 'Orange',
      company: 'Digital Virgo',
      campaign: '',
      provider: '',
      ip: '10.0.113.4',
    },
    {
      product: 'iTrip',
      status: 'Expired',
      startDate: '29-07-2026 15:53:30',
      endDate: '11-08-2026 13:20:54',
      price: '4.5',
      refund: '2',
      operator: 'Orange',
      company: 'Digital Virgo…',
      campaign: '',
      provider: '',
      ip: '10.0.113.4',
    },
  ];

  protected readonly history: readonly HistoryEvent[] = [
    { time: '13:21', kind: 'status', text: 'ES Agent - M. Angeles Status changed to', highlight: 'RESOLVED' },
    { time: '13:20', kind: 'unsubscribe', text: 'ES Agent - M. Angeles has unsubscribe the product', highlight: 'iTrip' },
    { time: '13:20', kind: 'unsubscribe', text: 'ES Agent - M. Angeles has unsubscribe the product', highlight: 'playweez' },
    { time: '13:19', kind: 'call', text: 'ES Agent - M. Angeles has answered an incoming call' },
    { time: '13:19', kind: 'created', text: 'ES Agent - M. Angeles created ticket from', highlight: 'call' },
  ];
}
