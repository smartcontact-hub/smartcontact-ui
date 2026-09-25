/**
 * Castellano de shell (barra de estado), Panel de control, Búsqueda y Manage MO in error.
 * Clave = texto inglés de la réplica (o `contexto::texto` cuando el mismo inglés se traduce
 * distinto según dónde esté). Valor = el del diccionario REAL de CusCare
 * (.cache/cuscare-es.json y cuscare-core-es.json); lo que no está en él lleva `// propio`.
 *
 * Ya vienen de ES_TICKETS y no se redefinen aquí: Groups, Tickets, Status, Assigned to, Group,
 * Channel, Email, Country, Created, Carrier, Rows per page, of, results, Loading data... y
 * No data to show. Lo que el original deja igual en los dos idiomas (ID, Source, Msisdn,
 * Ticket ID, Ticket, Emails, SMS, MO) no necesita entrada.
 */
export const ES_VIEWS_MAIN: Readonly<Record<string, string>> = {
  // Shell: barra de estado (AGENT-STATUS.*) y el rótulo del menú
  'Managed ticket': 'Gestionando Ticket',
  Available: 'Disponible',
  'No available': 'No disponible',
  Main: 'Principal', // propio

  // Panel de control: KPIs (PAGES.DASHBOARD.DASHBOARD_KPIS.*)
  Workload: 'Carga de trabajo',
  'My assigned': 'Mis asignados',
  'Team queue': 'En cola',
  'Total workload': 'Carga de trabajo total',
  Contacts: 'Contactos',
  Calls: 'Llamadas',
  Inbound: 'Entrantes',
  Answered: 'Respondidos',
  Missed: 'Perdidos',
  Outbound: 'Salientes',
  'Total handled': 'Gestionadas',
  In: 'Entradas',
  Out: 'Salidas',
  // En plural bajo el contador; en el historial del ticket son «Enviado» y «Resuelto».
  'kpi::Sent': 'Enviados',
  'kpi::Resolved': 'Resueltos',
  Session: 'Sesión',
  'Tickets completed': 'Tickets completados',

  // Panel de control: tooltips (DASHBOARD_KPIS.TOOLTIPS.*), literales del original
  'Number of tickets assigned to you that are open or updated':
    'Número de tickets asignados a ti donde el estado es abierto o actualizado',
  'Unassigned tickets available in your groups': 'Tickets sin asignar disponibles en tus grupos',
  'Total number of new, updated, and open tickets, with or without assignment':
    'Total de tickets nuevos, actualizados y abiertos, con o sin asignación',
  // Sin el paréntesis de cierre en el original.
  'Number of tickets where the agent performed at least one action (inbound/outbound calls, cancellation, refund, GDPR configuration, email/SMS sent, or assignation changes)':
    'Número de tickets donde se realizó al menos una acción (llamadas entrantes/salientes, cancelación, reembolso, configuración GDPR, envío de email/SMS o cambios de asignación)', // el original no cierra el paréntesis
  'Total calls (Answered inbound and outbound)':
    'Total de llamadas (Contestadas entrantes y salientes)',
  'Total connected time': 'Tiempo total conectado',
  "Tickets with 'new' tag": 'Tickets con la etiqueta nuevo',
  "Tickets with 'updated' tag": 'Tickets con la etiqueta actualizado',
  'Tickets in pending status without client or partner sub-status':
    'Número de tickets que se encuentran en estado pendiente, excluyendo subestado de cliente o socio', // el original omite «pendiente»
  'Number of actions performed (incoming/outgoing calls, cancellations, refunds, GDPR configuration, email/SMS sending, and assignation changes)':
    'Número de acciones realizadas (Llamadas entrantes/salientes, cancelación, reembolso, configuración GDPR u envío mail/SMS y cambio de asignación)',

  // Panel de control: tabla Groups (DASHBOARD_GROUPS.*) y su paginador
  'Search groups': 'Buscar grupos',
  'Select columns': 'Seleccionar columnas', // propio
  Columns: 'Columnas', // propio
  'Group name': 'Nombre del grupo',
  New: 'Nuevo',
  // En Tickets la columna es «Actualización»; aquí el original dice «Actualizado».
  'groups::Updated': 'Actualizado',
  Pending: 'Pendiente',
  'Emails sent': 'Emails enviados',
  'SMS sent': 'Sms enviados',
  'Total actions': 'Acciones totales',
  Totals: 'Totales',
  Pagination: 'Paginación', // propio
  'First page': 'Primera página', // propio
  'Previous page': 'Página anterior', // propio
  'Next page': 'Página siguiente', // propio
  'Last page': 'Última página', // propio
  // PAGES.STADISTICS.NO_DATA, en mayúsculas como lo pinta la réplica.
  'NO DATA': 'NO HAY DATOS',

  // Búsqueda (SEARCH_SCC.*, PAGES.CARRIER.SELECT_COUNTRY)
  'Select country': 'Selecciona país',
  'Search criteria': 'Criterio de búsqueda', // propio
  // «Search» a secas es el menú («Búsqueda»); la acción de buscar es «Buscar».
  'action::Search': 'Buscar',
  'Search term': 'Término de búsqueda', // propio
  Searching: 'Buscando', // propio
  'No results found': 'No encontramos resultados',
  'Please check the phone number entered or modify the filters.':
    'Revisa el número introducido o cambia los filtros.',
  'Please check the alias entered or modify the filters.':
    'Revisa el alias introducido o cambia los filtros.',
  'Please check the email address entered or modify the filters.':
    'Revisa el correo electrónico introducido o cambia los filtros.',
  'Please check the account ID entered or modify the filters.':
    'Revisa el identificador de cuenta introducido o cambia los filtros.',
  'Please check the external ID entered or modify the filters.':
    'Revisa el identificador externo introducido o cambia los filtros.',
  'Please check the operation ID entered or modify the filters.':
    'Revisa el identificador de operación introducido o cambia los filtros.',

  // Manage MO in error (MO_MANAGEMENT.*, COMMON.EXPORT, PAGINATION.*)
  Export: 'Exportar',
  'Search in': 'Buscar en', // propio
  'Short Code': 'Número Corto',
  'MO Content': 'Contenido del MO',
  'Local Creation Date': 'Fecha de Creación Local',
  Page: 'Página',
  'total results': 'resultados totales',
  Previous: 'Anterior', // propio
  Next: 'Siguiente', // propio
};
