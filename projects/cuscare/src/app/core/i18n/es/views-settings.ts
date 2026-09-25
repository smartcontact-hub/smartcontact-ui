/**
 * Castellano de Ajustes (usuarios, roles, grupos, plantillas), modales de ticket, acciones en bloque, tooltips y avisos.
 * Clave = texto inglés de la réplica (o `contexto::texto` cuando el mismo inglés se traduce
 * distinto según dónde esté). Valor = el del diccionario REAL de CusCare
 * (.cache/cuscare-es.json y cuscare-core-es.json); lo que no está en él lleva `// propio`.
 *
 * Lo que ya está en `ES_TICKETS` (Users, Roles, Groups, Templates, Filter, Status, Assign,
 * Unsubscribe, Change status, las diez «Nature of demand», cabeceras de la tabla...) no se
 * repite aquí.
 */
export const ES_VIEWS_SETTINGS: Readonly<Record<string, string>> = {
  // Comunes (COMMON.*, core)
  'action::Search': 'Buscar', // la acción; «Search» a secas es la sección (Búsqueda)
  Cancel: 'Cancelar',
  Save: 'Guardar',
  Close: 'Cerrar',
  Accept: 'Aceptar',
  Edit: 'Editar',
  Delete: 'Eliminar',
  Export: 'Exportar',
  Select: 'Seleccionar',
  'Select all': 'Seleccionar todas',
  Yes: 'Sí',

  // Ajustes: Users, Roles, Groups (PAGES.USER.TABLE.*, PAGES.ROLES.*, PAGES.ENTITIES.*)
  'User Name': 'Nombre del usuario',
  'Default Role': 'Rol por defecto',
  'Acd Groups': 'Grupos ACD',
  'Role Name': 'Nombre del rol',
  'Last Update': 'Última actualización',
  Permissions: 'Permisos',
  'Group Name': 'Nombre del grupo',
  Rules: 'Reglas',
  Company: 'Compañía',
  'Order By': 'Ordenar por',

  // Ajustes: Templates (PAGES.TEMPLATES.*)
  'Search templates': 'Buscar plantillas', // propio
  'Add category': 'Añadir categoría',
  'Add template': 'Añadir plantilla',
  Duplicate: 'Duplicar', // propio

  // «+ New ticket»: selector de grupo (HEADER.SELECT_GROUP_TICKET)
  'Select a group for this ticket': 'Selecciona un grupo para el ticket',
  'Search...': 'Buscar...', // propio
  'Search group': 'Buscar grupo', // propio

  // Search customer (TABLE_DETAIL.CUSTOMER_INFO.MODAL_SEARCH_CUSTOMER.*, COUNTRIES.ES)
  'Search customer': 'Buscar cliente',
  'Search criteria': 'Criterio de búsqueda', // propio
  'Spain (+34)': 'España (+34)',
  Msisdn: 'MSISDN',

  // Ticket Status (TABLE_DETAIL.SUBMIT_TICKET.*, BULK_ACTIONS.CHANGE_STATUS.*)
  'Ticket Status': 'Estado de ticket',
  'Close dialog': 'Cerrar diálogo', // propio
  'Nature of demand': 'Naturaleza de la demanda',
  Pending: 'Pendiente',
  Resolved: 'Resuelto',
  'GDPR pending': 'Pendiente GDPR',

  // Devoluciones (MODAL_REFUND.*)
  Refunds: 'Devoluciones',
  Refunded: 'Devuelto',
  'Charge(s)': 'Cobro(s)',
  Product: 'Producto',
  Date: 'Fecha',
  Amount: 'Cantidad',
  'Action not allowed': 'Acción no permitida',

  // Confirmación de baja (TABLE_DETAIL.UNSUBSCRIBE_MSG, TABLE_TICKETS.*)
  'Unsubscribe the following services': 'Dar de baja los siguientes servicios',
  Keyword: 'Palabra clave',
  Price: 'Precio',
  Expired: 'Expirado',
  Cancelled: 'Cancelado', // propio

  // Acciones en bloque: paneles y modal de confirmación (PAGES.TICKET.BULK_ACTIONS.*)
  'Search agent': 'Buscar agente', // propio
  'Unsubscribe all products': 'Todos los productos',
  'Created at': 'Creación',
  Service: 'Servicio',
  'You will assign the following {n} tickets to {name}':
    'Vas a asignar los siguientes {n} tickets a {name}',
  'You will change the status of the next {n} tickets to {name}':
    'Vas a cambiar el estado de los siguientes {n} tickets a {name}',
  'You will unsubscribe the following {n} tickets': 'Vas a dar de baja {n} tickets',
  'You will archive the following {n} tickets': 'Vas a archivar {n} tickets',

  // Avisos de las acciones en bloque (SUCCESS.BULK_ACTIONS.*). El de baja no lleva cifra
  // en castellano: así está en su diccionario.
  '{n} Tickets assigned successfully': '{n} Tickets asignados correctamente',
  '{n} Tickets changed status successfully': 'Cambio de estado correctamente de {n} tickets',
  'you have unsubscribed {n} tickets': 'La solicitud se procesó sin errores.',
  'You have archived {n} tickets': '{n} tickets archivados correctamente',

  // Tooltips ⓘ (PAGES.DASHBOARD.DASHBOARD_KPIS.TOOLTIPS.*): los pinta `app-info-tip`.
  // Literales, con sus erratas (el paréntesis sin cerrar, el «en estado,» sin estado).
  'Number of tickets assigned to you that are open or updated':
    'Número de tickets asignados a ti donde el estado es abierto o actualizado',
  'Unassigned tickets available in your groups': 'Tickets sin asignar disponibles en tus grupos',
  'Total number of new, updated, and open tickets, with or without assignment':
    'Total de tickets nuevos, actualizados y abiertos, con o sin asignación',
  'Number of tickets where the agent performed at least one action (inbound/outbound calls, cancellation, refund, GDPR configuration, email/SMS sent, or assignation changes)':
    'Número de tickets donde se realizó al menos una acción (llamadas entrantes/salientes, cancelación, reembolso, configuración GDPR, envío de email/SMS o cambios de asignación)', // el original no cierra el paréntesis
  'Average time spent per ticket': 'Tiempo medio dedicado a cada ticket',
  'Total calls (Answered inbound and outbound)':
    'Total de llamadas (Contestadas entrantes y salientes)',
  'Total connected time': 'Tiempo total conectado',
  'Tickets with \'new\' tag': 'Tickets con la etiqueta nuevo',
  'Tickets with \'updated\' tag': 'Tickets con la etiqueta actualizado',
  'Tickets in pending status without client or partner sub-status':
    'Número de tickets que se encuentran en estado pendiente, excluyendo subestado de cliente o socio', // el original omite «pendiente»
  'Number of actions performed (incoming/outgoing calls, cancellations, refunds, GDPR configuration, email/SMS sending, and assignation changes)':
    'Número de acciones realizadas (Llamadas entrantes/salientes, cancelación, reembolso, configuración GDPR u envío mail/SMS y cambio de asignación)',

  // Vacío del buscador por criterio (SEARCH_SCC.EMPTY_STATE.*): datos de `tooltips.ts`,
  // los pinta la vista Búsqueda.
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
};
