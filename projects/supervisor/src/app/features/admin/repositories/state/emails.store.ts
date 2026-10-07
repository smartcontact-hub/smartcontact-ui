import { createRepoStore } from '@core/services/local-store.factory';

/** Los datos de un servidor de correo: el entrante (IMAP/POP) o el saliente (SMTP). */
export interface MailServer {
  readonly host: string;
  readonly port: string;
  readonly user: string;
  readonly password: string;
}

/** Qué se hace con un correo que no casa con ningún trigger: transferirlo a un grupo o dejarlo en una cola. */
export type EmailAction = 'transfer' | 'queue';

/**
 * Una cuenta de correo: el buzón del que el grupo recibe los emails (repositorio de Email, DD-185). Como en Voice,
 * lleva los datos del servidor entrante y del saliente, los triggers que se le aplican y la acción por defecto.
 * `name` es la dirección del buzón.
 */
export interface Mailbox {
  readonly id: number;
  readonly name: string;
  readonly createdAt: string;
  readonly modifiedAt: string;
  /** Los emails que ha recibido. */
  readonly totalEmails: number;
  readonly incoming: MailServer;
  readonly outgoing: MailServer;
  /** Los triggers marcados: se prueban sobre cada correo que entra. */
  readonly triggerIds: readonly number[];
  readonly defaultAction: EmailAction;
  /** El grupo al que va por defecto (su nombre); vacío, ninguno. */
  readonly defaultTarget: string;
}

/** El campo del correo sobre el que mira una condición. */
export type TriggerField = 'body' | 'date' | 'from' | 'subject' | 'time' | 'to';
export const TRIGGER_FIELDS: readonly TriggerField[] = ['body', 'date', 'from', 'subject', 'time', 'to'];

export type TriggerOperator = 'contains' | 'not_contains' | 'equals' | 'starts_with';
export const TRIGGER_OPERATORS: readonly TriggerOperator[] = ['contains', 'not_contains', 'equals', 'starts_with'];

/**
 * Un trigger: una condición sobre un correo y qué hacer cuando se cumple (transferirlo a un grupo o dejarlo en una cola).
 * Cuelga de un buzón (`mailboxId`), que es de quien lo aplica.
 */
export interface EmailTrigger {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly label: string;
  readonly createdAt: string;
  readonly modifiedAt: string;
  readonly field: TriggerField;
  readonly operator: TriggerOperator;
  readonly value: string;
  readonly action: EmailAction;
  /** El grupo de destino (su nombre); vacío, «Ningún grupo». */
  readonly target: string;
  readonly mailboxId: number | null;
}

const SIN_SERVIDOR: MailServer = { host: '', port: '', user: '', password: '' };

const MAILBOX_SEED: readonly Mailbox[] = [
  {
    id: 1,
    name: 'soporte@example.com',
    createdAt: '2026-04-08T09:53:53',
    modifiedAt: '2026-10-05T16:33:12',
    totalEmails: 0,
    incoming: { host: 'imap.example.com', port: '993', user: 'soporte@example.com', password: '' },
    outgoing: { host: 'smtp.example.com', port: '587', user: 'soporte@example.com', password: '' },
    triggerIds: [1],
    defaultAction: 'queue',
    defaultTarget: '',
  },
];

const TRIGGER_SEED: readonly EmailTrigger[] = [
  {
    id: 1,
    name: 'Facturas',
    description: 'Correos que hablan de facturación',
    label: 'facturación',
    createdAt: '2026-06-08T08:29:04',
    modifiedAt: '2026-06-08T13:51:53',
    field: 'subject',
    operator: 'contains',
    value: 'factura',
    action: 'transfer',
    target: '',
    mailboxId: 1,
  },
  {
    id: 2,
    name: 'Prueba de cola',
    description: '',
    label: '',
    createdAt: '2026-10-05T15:52:23',
    modifiedAt: '2026-10-05T16:33:05',
    field: 'body',
    operator: 'contains',
    value: 'urgente',
    action: 'queue',
    target: '',
    mailboxId: 1,
  },
];

export const MailboxesStore = createRepoStore<Mailbox>('MailboxesStore', {
  storageKey: 'sc-mailboxes-repo',
  versionKey: 'sc-mailboxes-repo-v',
  currentVersion: 1,
  defaults: MAILBOX_SEED,
});

export const EmailTriggersStore = createRepoStore<EmailTrigger>('EmailTriggersStore', {
  storageKey: 'sc-email-triggers-repo',
  versionKey: 'sc-email-triggers-repo-v',
  currentVersion: 1,
  defaults: TRIGGER_SEED,
});

export const SERVIDOR_VACIO = SIN_SERVIDOR;

/** La fecha de un buzón o un trigger, tal como se guarda: ISO sin zona, hasta el segundo. */
export function ahora(): string {
  return new Date().toISOString().slice(0, 19);
}
