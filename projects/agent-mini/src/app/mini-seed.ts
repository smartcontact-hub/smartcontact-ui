/**
 * Datos FALSOS para Historial y Agenda, al estilo de los seed de `agent`.
 * El repo es PUBLICO: aqui no va ni un dato real de la extraccion. Numeros y nombres
 * inventados. Las formas (CallRow) siguen las de projects/agent/src/app/data/seed.ts.
 */
export type CallDirection = 'in' | 'out';
export type CallChannel = 'call' | 'chat' | 'mail' | 'whatsapp';
export type CallOutcome = 'attended' | 'lost' | 'transferred' | 'expired';

export interface CallRow {
  readonly id: number;
  readonly date: string;
  readonly number: string;
  readonly group: string;
  readonly destination: string;
  readonly support: string;
  readonly wait: string;
  readonly categorization: string;
  readonly direction: CallDirection;
  readonly channel: CallChannel;
  readonly outcome: CallOutcome;
}

export const CALLS: readonly CallRow[] = [
  { id: 1, date: '14:07', number: '676653912', group: 'Nodo AED 1', destination: '-', support: '00:02', wait: '00:00', categorization: '-', direction: 'out', channel: 'call', outcome: 'attended' },
  { id: 2, date: '13:26', number: '612345678', group: 'Nodo AED 1', destination: '-', support: '00:03', wait: '00:01', categorization: 'N1 · Consulta', direction: 'in', channel: 'call', outcome: 'attended' },
  { id: 3, date: '12:58', number: '698112233', group: 'Soporte', destination: '-', support: '00:00', wait: '00:12', categorization: '-', direction: 'in', channel: 'call', outcome: 'lost' },
  { id: 4, date: '12:40', number: 'Cliente web', group: 'Chat AED', destination: '-', support: '01:20', wait: '00:04', categorization: 'N2 · Incidencia', direction: 'in', channel: 'chat', outcome: 'attended' },
  { id: 5, date: '11:15', number: '600998877', group: 'Soporte', destination: 'Nodo AED 2', support: '00:45', wait: '00:00', categorization: '-', direction: 'in', channel: 'call', outcome: 'transferred' },
  { id: 6, date: '10:30', number: '34600112233', group: 'WhatsApp', destination: '-', support: '02:10', wait: '00:03', categorization: 'N1 · Info', direction: 'in', channel: 'whatsapp', outcome: 'attended' },
  { id: 7, date: '09:52', number: 'soporte@correo', group: 'Mail AED', destination: '-', support: '-', wait: '-', categorization: '-', direction: 'in', channel: 'mail', outcome: 'lost' },
  { id: 8, date: '09:05', number: '655443322', group: 'Nodo AED 1', destination: '-', support: '00:08', wait: '00:00', categorization: '-', direction: 'out', channel: 'call', outcome: 'attended' },
];

export interface ContactRow {
  readonly id: number;
  readonly name: string;
  readonly phone: string;
  readonly company?: string;
}

export const CONTACTS: readonly ContactRow[] = [
  { id: 1, name: 'Ana García', phone: '676653912', company: 'Acme SL' },
  { id: 2, name: 'Bruno Díaz', phone: '612345678', company: 'Contoso' },
  { id: 3, name: 'Carla Ruiz', phone: '698112233' },
  { id: 4, name: 'David Soto', phone: '600998877', company: 'Globex' },
  { id: 5, name: 'Elena Vidal', phone: '655443322' },
  { id: 6, name: 'Fran López', phone: '634001122', company: 'Initech' },
  { id: 7, name: 'Gema Torres', phone: '677889900' },
  { id: 8, name: 'Hugo Marín', phone: '611223344', company: 'Umbrella' },
];

export interface ServiceGroup {
  readonly name: string;
  readonly number: string;
}

/** Grupos de servicio FALSOS para el dropup del dialpad. */
export const SERVICES: readonly ServiceGroup[] = [
  { name: 'Soporte Talco', number: '1001' },
  { name: 'Nodo AED 1', number: '2001' },
  { name: 'Nodo AED 2', number: '2002' },
  { name: 'Ventas', number: '3001' },
  { name: 'Atención cliente', number: '3002' },
];

/* ------------------------------------------------------------------ *
 *  Mensajes (pestaña Chat)                                            *
 * ------------------------------------------------------------------ */

/** Autor de una burbuja: yo (agente), el contacto, o un aviso del sistema. */
export type BubbleFrom = 'me' | 'them' | 'system';

export interface Bubble {
  readonly from: BubbleFrom;
  readonly text: string;
  /** Hora dentro de la burbuja (no en los avisos de sistema). */
  readonly time?: string;
}

export type MessageChannel = 'chat' | 'whatsapp' | 'mail';

export interface MessageRow {
  readonly id: number;
  /** Remitente (el contacto). */
  readonly name: string;
  /** Nodo/cola por la que entra; se pinta en azul (#73abf4). */
  readonly group: string;
  readonly time: string;
  /** Última línea, como vista previa en la tarjeta. */
  readonly preview: string;
  readonly unread: boolean;
  readonly channel: MessageChannel;
  readonly bubbles: readonly Bubble[];
}

/**
 * Conversaciones FALSAS para la pestaña Mensajes. En el entorno real la lista sale
 * VACIA (lo verificado en la extraccion: `.body-message` sin hijos); estas de ejemplo
 * existen para que la replica no se vea hueca, igual que Historial y Agenda. Ni un
 * dato real. Colores de burbuja del CSS del original (comunicador.md).
 */
export const MESSAGES: readonly MessageRow[] = [
  {
    id: 1, name: 'Cliente web', group: 'Chat AED', time: '14:12', unread: true, channel: 'chat',
    preview: '¿Me podéis confirmar el estado del pedido?',
    bubbles: [
      { from: 'system', text: 'Conversación asignada a Nodo AED 1' },
      { from: 'them', text: 'Hola, buenas tardes', time: '14:08' },
      { from: 'them', text: '¿Me podéis confirmar el estado del pedido?', time: '14:09' },
      { from: 'me', text: 'Hola, ahora mismo lo reviso', time: '14:10' },
    ],
  },
  {
    id: 2, name: '676 653 912', group: 'WhatsApp', time: '13:47', unread: true, channel: 'whatsapp',
    preview: 'Perfecto, muchas gracias',
    bubbles: [
      { from: 'them', text: 'Necesito cambiar la cita del martes', time: '13:40' },
      { from: 'me', text: 'Claro, ¿para qué día la movemos?', time: '13:42' },
      { from: 'them', text: 'El jueves por la mañana si puede ser', time: '13:44' },
      { from: 'me', text: 'Hecho, cita movida al jueves a las 10:00', time: '13:46' },
      { from: 'them', text: 'Perfecto, muchas gracias', time: '13:47' },
    ],
  },
  {
    id: 3, name: 'Elena Vidal', group: 'Ventas', time: '12:31', unread: false, channel: 'chat',
    preview: 'Vale, me lo pienso y os digo',
    bubbles: [
      { from: 'them', text: 'Quería información sobre la tarifa nueva', time: '12:20' },
      { from: 'me', text: 'Te paso el detalle por correo ahora mismo', time: '12:25' },
      { from: 'them', text: 'Vale, me lo pienso y os digo', time: '12:31' },
    ],
  },
  {
    id: 4, name: 'soporte@correo', group: 'Mail AED', time: '11:05', unread: false, channel: 'mail',
    preview: 'Adjunto la factura rectificada.',
    bubbles: [
      { from: 'them', text: 'Buenos días, adjunto la factura rectificada.', time: '11:05' },
      { from: 'me', text: 'Recibida, la tramito hoy mismo', time: '11:18' },
    ],
  },
  {
    id: 5, name: 'Hugo Marín', group: 'Nodo AED 2', time: '10:22', unread: false, channel: 'chat',
    preview: 'Gracias por la ayuda',
    bubbles: [
      { from: 'them', text: 'Ya me funciona, era el navegador', time: '10:20' },
      { from: 'them', text: 'Gracias por la ayuda', time: '10:22' },
      { from: 'system', text: 'Conversación finalizada' },
    ],
  },
  {
    id: 6, name: '612 345 678', group: 'Soporte', time: '09:48', unread: false, channel: 'whatsapp',
    preview: 'Os escribo si vuelve a pasar',
    bubbles: [
      { from: 'them', text: 'La app se cierra sola al abrir', time: '09:30' },
      { from: 'me', text: '¿Podrías probar a reinstalarla?', time: '09:35' },
      { from: 'them', text: 'Listo, ya no se cierra', time: '09:46' },
      { from: 'them', text: 'Os escribo si vuelve a pasar', time: '09:48' },
    ],
  },
];

/* ------------------------------------------------------------------ *
 *  Agentes y grupos (pestaña Agentes)                                 *
 * ------------------------------------------------------------------ */

/** Presencia del agente: pinta el punto (verde / gris / ambar). */
export type AgentPresence = 'connected' | 'disconnected' | 'paused';

export interface AgentRow {
  readonly id: number;
  readonly name: string;
  readonly presence: AgentPresence;
  /** Canales que atiende; el que no, baja a opacity 0.3 (no cambia de color). */
  readonly phone: boolean;
  readonly chat: boolean;
  readonly mail: boolean;
}

/**
 * Roster FALSO para la pestaña Agentes. En la extraccion del mini esta pestaña SI sale
 * poblada (a diferencia del entorno de `agent`), con punto de estado, nombre y los tres
 * canales. Nombres INVENTADOS: los reales de la captura no entran en un repo publico.
 */
export const AGENTS: readonly AgentRow[] = [
  { id: 1, name: 'Lucía Prieto', presence: 'connected', phone: true, chat: true, mail: false },
  { id: 2, name: 'Marcos Gil', presence: 'paused', phone: true, chat: false, mail: false },
  { id: 3, name: 'Nuria Blanco', presence: 'connected', phone: true, chat: true, mail: true },
  { id: 4, name: 'Pablo Ferrer', presence: 'disconnected', phone: true, chat: false, mail: false },
  { id: 5, name: 'Rosa Campos', presence: 'connected', phone: false, chat: true, mail: true },
  { id: 6, name: 'Sergio Ibáñez', presence: 'disconnected', phone: true, chat: true, mail: false },
  { id: 7, name: 'Teresa Molina', presence: 'paused', phone: true, chat: false, mail: true },
  { id: 8, name: 'Víctor Rey', presence: 'connected', phone: true, chat: true, mail: true },
];

export interface GroupRow {
  readonly id: number;
  readonly name: string;
  /** Agentes conectados / total en el grupo. */
  readonly online: number;
  readonly total: number;
}

/** Grupos FALSOS para la sub-pestaña Grupos. */
export const GROUPS: readonly GroupRow[] = [
  { id: 1, name: 'Nodo AED 1', online: 4, total: 6 },
  { id: 2, name: 'Nodo AED 2', online: 2, total: 4 },
  { id: 3, name: 'Soporte Talco', online: 1, total: 3 },
  { id: 4, name: 'Ventas', online: 3, total: 5 },
  { id: 5, name: 'Atención cliente', online: 5, total: 8 },
];
