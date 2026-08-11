/**
 * Los textos de ayuda de CusCare.
 *
 * **No están transcritos de pantallazos**: la app real carga su diccionario en
 * `assets/i18n/cuscare/en.json` (1449 claves), así que estos salen de ahí
 * exactos — comas, paréntesis y erratas incluidas. La clave de la cola es
 * `QEUE`, con la errata, y así se deja anotada.
 *
 * Los nombres de aquí replican la ruta de la clave original para que se pueda
 * cruzar con su fichero si algún día cambia.
 */
export const TOOLTIPS = {
  /* PAGES.DASHBOARD.DASHBOARD_KPIS.TOOLTIPS.* */
  assigned: 'Number of tickets assigned to you that are open or updated',
  /** En el original la clave es `QEUE` (sic). */
  queue: 'Unassigned tickets available in your groups',
  workloadFooter: 'Total number of new, updated, and open tickets, with or without assignment',
  ticketsCompleted:
    'Number of tickets where the agent performed at least one action (inbound/outbound calls, cancellation, refund, GDPR configuration, email/SMS sent, or assignation changes)',
  averageTime: 'Average time spent per ticket',
  totalManagedFooter: 'Total calls (Answered inbound and outbound)',
  session: 'Total connected time',

  /* Cabeceras de la tabla Groups */
  myAssignedCol: 'Number of tickets assigned to you that are open or updated',
  newCol: "Tickets with 'new' tag",
  updatedCol: "Tickets with 'updated' tag",
  pendingCol: 'Tickets in pending status without client or partner sub-status',
  totalActionsCol:
    'Number of actions performed (incoming/outgoing calls, cancellations, refunds, GDPR configuration, email/SMS sending, and assignation changes)',

  /* PAGES.MODAL_REFUND.TOOLTIP.BUTTON.REQUEST_ACTION — sale en los botones
     API/BNK cuando la devolución no se puede pedir. */
  refundNotAllowed: 'Action not allowed',
} as const;

/**
 * El vacío del buscador, **por criterio**.
 *
 * La app real no enseña un mensaje genérico: cambia según por dónde busques
 * (`SEARCH_SCC.EMPTY_STATE.DESCRIPTION_BY_TYPE.*`). Copiado literal de su
 * diccionario, punto final incluido.
 */
export const SEARCH_EMPTY = {
  title: 'No results found',
  byCriterion: {
    Msisdn: 'Please check the phone number entered or modify the filters.',
    Alias: 'Please check the alias entered or modify the filters.',
    Email: 'Please check the email address entered or modify the filters.',
    Accountid: 'Please check the account ID entered or modify the filters.',
    Externalid: 'Please check the external ID entered or modify the filters.',
    Operationid: 'Please check the operation ID entered or modify the filters.',
  } as Record<string, string>,
} as const;

/**
 * Los avisos de las acciones en bloque, copiados literales del diccionario de
 * la app real (`SUCCESS.BULK_ACTIONS.*`).
 *
 * Ojo a la incoherencia de mayúsculas: el de baja empieza en minúscula ("you
 * have unsubscribed…") y los demás no. Es suya y se respeta — corregirla sería
 * dejar de replicar.
 */
export const BULK_TOASTS = {
  assign: (n: number) => `${n} Tickets assigned successfully`,
  status: (n: number) => `${n} Tickets changed status successfully`,
  unsubscribe: (n: number) => `you have unsubscribed ${n} tickets`,
  archive: (n: number) => `You have archived ${n} tickets`,
} as const;
