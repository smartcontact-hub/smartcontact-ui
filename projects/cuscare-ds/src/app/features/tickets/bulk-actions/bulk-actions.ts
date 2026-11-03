/** Las cuatro acciones en bloque sobre las filas marcadas del listado de Tickets. */
export type BulkActionKind = 'assign' | 'status' | 'cancellation' | 'file';

/** Lo que se confirmó en el modal: la acción y su dato (agente o estado), si lo lleva. */
export interface BulkActionRequest {
  readonly kind: BulkActionKind;
  /** El agente (asignar), el estado nuevo (cambiar estado) o los servicios a cancelar (Cancellation). */
  readonly value?: string;
}

/** Estados que se pueden elegir en Cambiar estado. */
export const CHANGEABLE_STATUSES: readonly { readonly label: string; readonly value: string }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed (Spam)', value: 'closed' },
];

/** El estado que pide subestado: al elegirlo aparece un segundo desplegable obligatorio. */
export const STATUS_WITH_SUBSTATUS = 'pending';

/** Subestados de Pending. */
export const PENDING_SUBSTATUSES: readonly { readonly label: string; readonly value: string }[] = [
  { label: 'Customer', value: 'customer' },
  { label: 'Legal', value: 'legal' },
  { label: 'Technical', value: 'technical' },
  { label: 'GDPR', value: 'gdpr' },
  { label: 'Refund', value: 'refund' },
  { label: 'Partner', value: 'partner' },
  { label: 'Review', value: 'review' },
  { label: 'Agent', value: 'agent' },
  { label: 'Supervisor', value: 'supervisor' },
];
