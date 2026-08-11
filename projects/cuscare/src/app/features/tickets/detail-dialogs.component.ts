import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

/** Los cinco diálogos que cuelgan del detalle, además de los ya replicados. */
export type DetailDialog = 'selfAssign' | 'crm' | 'forgotten' | 'deleteNote' | 'noRefund';

/**
 * Diálogos del detalle de ticket.
 *
 * Medidos en la app real **forzando su `display` desde la consola del navegador**
 * — un override de CSS en mi sesión, sin clics, sin peticiones y sin tocar la
 * lógica de la app — sobre un ticket que YA estaba abierto. Hizo falta ese rodeo
 * porque en esta pantalla abrir un ticket cambia su estado (ver NEXT-SESSION).
 *
 * Lo que se aprende midiéndolos, y que no se ve desde fuera:
 *
 * 1. **Hay DOS familias de diálogo conviviendo.** Tres van estilados como el
 *    resto de la app (fondo `#f4f6fc`, botones redondeados `#233155`/`#8d939d`),
 *    pero **"assign to yourself" y "delete note" usan los botones NATIVOS del
 *    navegador** — `#efefef` con borde `2px outset`. Son pantallas sin terminar,
 *    y se replican así: es lo que ve el agente.
 * 2. **`app-modal-priority-customer` no es de prioridad**: es el **"Right to be
 *    forgotten"** del RGPD, el diálogo más ancho de la app (1298.8px) y el más
 *    serio — borra al cliente y el historial del ticket.
 * 3. El de reembolsos ofrece **tres razones** en radios, una de ellas un párrafo
 *    entero.
 */
@Component({
  selector: 'app-detail-dialogs',
  standalone: true,
  templateUrl: './detail-dialogs.component.html',
  styleUrl: './detail-dialogs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailDialogsComponent {
  readonly dialog = input.required<DetailDialog | null>();
  readonly closed = output<void>();

  /** Las tres razones del diálogo de reembolso, con su texto literal. */
  protected readonly refundReasons = [
    'No refund requested',
    'Not applicable due to USE of service',
    'They are requesting a refund, but they are not providing the IBAN or they are going to claim through another method.',
  ];

  protected readonly refundReason = signal<string | null>(null);

  /** Los ocho campos de la ficha "Cases" del CRM, en su orden. */
  protected readonly crmFields = [
    'User id',
    'Customer request',
    'Unsubscription source',
    'Customer',
    'Callback status',
    'Status',
    'Service',
    'Comment',
  ];

  protected onBackdrop(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).classList.contains('dlg')) this.closed.emit();
  }
}
