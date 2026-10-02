/**
 * Castellano de detalle de ticket, panel Summary y diálogos del detalle.
 * Clave = texto inglés de la réplica (o `contexto::texto` cuando el mismo inglés se traduce
 * distinto según dónde esté). Valor = el del diccionario REAL de CusCare
 * (.cache/cuscare-es.json y cuscare-core-es.json); lo que no está en él lleva `// propio`.
 *
 * Ya vienen de `ES_TICKETS` y no se repiten aquí: Status, Refund, Carrier, Email, Channel,
 * Group, Sub-status y Unsubscription. Lo que el original deja en inglés también en castellano
 * («Unsubscription source», «Callback status», «Msisdn», «MO/MT», «Nav», «Ip», «User Agent»,
 * «Placement», «Banner», «Source», «360 Days») no lleva clave: se pinta igual.
 */
export const ES_VIEWS_DETAIL: Readonly<Record<string, string>> = {
  // Cabecera y barra de suscripciones (PAGES.TICKET.TABLE_DETAIL.*)
  Resolved: 'Resuelto',
  Refresh: 'Actualizar', // propio
  'detail::Unsubscribe': 'Baja', // TABLE_DETAIL.UNSUBSCRIBE; el «Dar de baja» de ES_TICKETS es el de la tabla
  Detail: 'Detalles',
  'Select all': 'Seleccionar todas', // core LOST-CONVERSATIONS-MANAGEMENT.ALL
  Select: 'Seleccionar',
  // Tabla de suscripciones (TABLE_DETAIL.TABLE_TICKETS.*)
  Product: 'Producto',
  'Start Date': 'Fecha alta',
  'End Date': 'Fecha baja',
  Usage: 'Uso',
  Price: 'Precio',
  Operator: 'Operador',
  Company: 'Compañía',
  Campaign: 'Campaña',
  Provider: 'Proveedor',
  Summary: 'Resumen',
  'Navigation for': 'Navegación de', // propio
  'Refunds for': 'Devoluciones de', // propio
  // Pestañas, menú «+ New» y timeline (TABLE_DETAIL.HISTORY_TICKET.*)
  'History ticket': 'Historial ticket',
  Notes: 'Notas',
  'Attached files': 'Archivos adjuntos',
  'Show details': 'Mostrar detalles',
  New: 'Nuevo',
  Note: 'Nota',
  'Attach file': 'Adjuntar archivo',
  'No Data Found': 'No se han encontrado datos',
  'Status changed to': 'Estado cambiado a',
  // ACTION_UNSUBSCRIBE sin su HTML; la mayúscula de «Ha» es del original
  // El original lo escribe con «Ha» en mayúscula tras el nombre del agente: no se replica.
  'has unsubscribe the product': 'ha dado de baja el producto',
  // ANSWERED_CALL sin el «del» final: la réplica no pinta el número tras la frase
  'has answered an incoming call': 'ha respondido una llamada entrante',
  // El original dice «se ha creado un ticket desde», que tras el nombre del agente no casa.
  'created ticket from': 'ha creado un ticket desde',
  'Start time': 'Hora de inicio',
  'Previous status': 'Estado anterior', // propio
  'Nature of demand': 'Naturaleza de la demanda',
  'Subscription id': 'Id de suscripción',
  Result: 'Resultado', // propio
  Duration: 'Duración',
  Queue: 'Cola', // propio
  'Recording available': 'Grabación disponible', // propio
  // Panel Summary (PAGES.TICKET.SUMMARY.* y TABLE_DETAIL.CUSTOMER_INFO.*)
  Close: 'Cerrar',
  Export: 'Exportar',
  Service: 'Servicio',
  Reccuring: 'Recurrente',
  Subscriptions: 'Suscripciones', // propio
  Subscribed: 'Suscrito',
  Unsubsribed: 'Baja',
  'Customer info': 'Información del cliente',
  Name: 'Nombre',
  'First name': 'Nombre', // propio
  'Last name': 'Apellido',
  Address: 'Dirección',
  'ZIP code': 'Código postal', // CUSTOMER_INFO.POSTAL_CODE («Postal code» en su inglés)
  City: 'Ciudad',
  Contact: 'Contacto',
  Phone: 'Teléfono',
  'Subs Info': 'Sub Info',
  'Expand all': 'Expandir todo',
  Collapse: 'Contraer',
  Device: 'Dispositivo',
  'Device/OS': 'Dispositivo/OS',
  Connection: 'Conexión',
  'Access to service': 'Acceso al servicio',
  'Download elements': 'Descarga elementos',
  Charges: 'Cargos',
  'See total': 'Ver total',
  Refunded: 'Devuelto',
  'Up to date': 'Actualizado',
  'Date time': 'Fecha envío',
  'Sms content': 'Contenido sms',
  Type: 'Tipo',
  Destiny: 'Destino',
  'Subscription Id': 'Id de suscripción',
  Navigation: 'Navegación',
  Date: 'Fecha',
  // Periodicidad de la oferta (SUMMARY.SERVICE.*). «360 Days» es del original y se queda
  Day: 'Día',
  Week: 'Semana',
  Month: 'Mes',
  Quarter: 'Trimestre', // el original dice «Quarto», errata que no se replica
  'Bi Annual': 'Bi Anual',
  Year: 'Año',
  '30 Days': '30 Días',
  '60 Days': '60 Días',
  '90 Days': '90 Días',
  '5 Days': '5 Días',
  '180 Days': '180 Días',
  // Diálogos del detalle (REASSIGN_MODAL, CRM_CASES, CUSTOMER_INFO.MODAL_PRIORITY, MODAL_CASES_RESOLVED)
  'Would you like to assign this Ticket to yourself?': '¿Quieres re-asignarte este Ticket?',
  Yes: 'Sí',
  'Are you sure you want to delete this note?': '¿Estás seguro de que quieres eliminar esta nota?',
  Accept: 'Aceptar',
  Cancel: 'Cancelar',
  Cases: 'Casos',
  'User id': 'Id usuario',
  'Customer request': 'Petición cliente',
  Customer: 'Cliente',
  Comment: 'Comentario',
  'Right to be forgotten': 'Derecho al olvido',
  'If you continue with the request, all customer-related information will be deleted, as well as the ticket history. In addition, all products and services of the selected companies will be unsuscribed.':
    'Si continua con la petición, se borrará toda la información relativa al cliente, así como el historial del ticket. Además se darán de baja todos los productos y servicios de las empresas seleccionadas.',
  'Date of order': 'Fecha de solicitud',
  'forgotten::Company': 'Empresa', // MODAL_PRIORITY.COMPANY; en la tabla es «Compañía»
  'Select company': 'Selecciona una empresa',
  Request: 'Solicitar',
  'Please confirm the reason why no charges have been refunded to the customer.':
    'Por favor, confirma la razón por la cual no se han reembolsado cargos al cliente.',
  'No refund requested': 'No se solicitó reembolso.',
  'Not applicable due to USE of service': 'No aplicable debido al uso del servicio.',
  'They are requesting a refund, but they are not providing the IBAN or they are going to claim through another method.':
    'Pide devolución pero no facilita el IBAN o va a reclamar por otra vía.',
  Save: 'Guardar',
};
