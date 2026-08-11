import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { TICKETS } from '../../data/seed';
import { DetailDialog, DetailDialogsComponent } from './detail-dialogs.component';
import { SearchCustomerModalComponent } from './search-customer-modal.component';
import { RefundModalComponent } from './refund-modal.component';
import { SummaryPanelComponent } from './summary-panel.component';
import { TicketStatusModalComponent } from './ticket-status-modal.component';
import { UnsubscribeConfirmModalComponent } from './unsubscribe-confirm-modal.component';

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
  imports: [
    SearchCustomerModalComponent,
    TicketStatusModalComponent,
    DetailDialogsComponent,
    SummaryPanelComponent,
    RefundModalComponent,
    UnsubscribeConfirmModalComponent,
  ],
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

  /* ── Controles de la barra de pestañas ──────────────────────────────────
   * Los dos eran adorno; en la real hacen algo. El menú de "+ New" trae
   * CUATRO entradas, leídas de su DOM sin abrirlo. */
  protected readonly detailsOpen = signal(false);
  protected readonly newMenuOpen = signal(false);
  protected readonly newMenuItems = ['Email', 'Note', 'SMS', 'Attach file'];

  /* ── Los cinco diálogos del detalle ─────────────────────────────────────
   * Disparadores CONFIRMADOS: el de auto-asignación sale solo al abrir un
   * ticket sin asignar (medido: abrir uno `new` lo pasa a OPEN y te lo asigna);
   * el del CRM cuelga de la ficha de cliente de la barra de metadatos; el de
   * borrado sale de la papelera de una nota.
   *
   * "Right to be forgotten" y el de motivo de no reembolso colgaban de
   * Unsubscribe y Refund por una suposición mía que resultó FALSA: esos dos
   * botones abren `app-modal-confirmation-unsubscribe` y `app-new-modal-refund`
   * (ya replicados aparte). Ahora cuelgan de las dos celdas sin uso de la barra
   * de metadatos hasta saber su disparador real. */
  protected readonly dialog = signal<DetailDialog | null>(null);

  /** Los dos modales REALES de esa barra de acciones. */
  protected readonly unsubOpen = signal(false);
  protected readonly refundFor = signal<string | null>(null);

  /* ── Selección de suscripciones ─────────────────────────────────────────
   * Los tres botones de la barra (Unsubscribe · Refund · Detail) NO actúan
   * sobre el ticket entero: actúan sobre las filas marcadas, y sin selección
   * no hacen nada. Se descubrió pulsando "Refund" en la real sin marcar nada y
   * viendo que no abría absolutamente nada — parecía un botón roto. */
  protected readonly selectedSubs = signal<ReadonlySet<string>>(new Set());

  protected isSubSelected(product: string): boolean {
    return this.selectedSubs().has(product);
  }

  protected readonly hasSubSelection = computed(() => this.selectedSubs().size > 0);

  protected firstSelectedSub(): string {
    return [...this.selectedSubs()][0] ?? this.subscriptions[0].product;
  }

  protected toggleSub(product: string): void {
    this.selectedSubs.update((prev) => {
      const next = new Set(prev);
      if (next.has(product)) next.delete(product);
      else next.add(product);
      return next;
    });
  }

  protected readonly allSubsSelected = computed(
    () => this.selectedSubs().size === this.subscriptions.length,
  );

  protected toggleAllSubs(): void {
    this.selectedSubs.set(
      this.allSubsSelected() ? new Set() : new Set(this.subscriptions.map((s) => s.product)),
    );
  }

  /** Cargos del producto, con la forma de los reales (inventados). */
  protected readonly refundCharges = [
    { date: '05-08-2026 15:54:26', amount: '4.5 €' },
    { date: '29-07-2026 15:53:31', amount: '4.5 €' },
  ];

  /** Lo que lista el modal de baja: 5 columnas, no las 13 de la tabla. */
  protected readonly unsubServices = [
    { product: 'playweez', keyword: 'PLAYWEEZ', status: 'Cancelled', price: '4.5', expired: 'Yes' },
    { product: 'iTrip', keyword: 'ITRIP', status: 'Expired', price: '4.5', expired: 'Yes' },
  ];

  protected openDialog(d: DetailDialog): void {
    this.dialog.set(d);
  }

  /**
   * El botón "Summary" de cada suscripción. No abre un modal: abre una VISTA
   * entera a pantalla completa, la superficie más densa de la app (y la última
   * grande que quedaba sin replicar).
   */
  protected readonly summaryFor = signal<string | null>(null);

  /** Por qué botón se entró: "Nav" lo abre por la sección Navigation. */
  protected readonly summaryFocus = signal<'summary' | 'nav'>('summary');

  protected openSummary(product: string, focus: 'summary' | 'nav' = 'summary'): void {
    this.summaryFocus.set(focus);
    this.summaryFor.set(product);
  }

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
