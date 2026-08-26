/** Datos seed del cartón pluma del Agent (réplica fiel de la web real, sin backend). */

export type CallDirection = 'in' | 'out';
export type CallChannel = 'call' | 'chat' | 'mail' | 'whatsapp';

/**
 * Resultado de la conversación. En el Historial real el COLOR del icono es dato,
 * no estilo: verde = atendida, rojo = perdida/abandonada, negro = transferida
 * (solo chat), y 'expired' lo pinta gris. Portado de 'getIcon()' del Agent real.
 */
export type CallOutcome = 'attended' | 'lost' | 'transferred' | 'expired';

export interface CallRow {
  readonly id: number;
  readonly date: string;
  readonly number: string;
  readonly group: string;
  readonly origin: string;
  readonly destination: string;
  readonly support: string; // 1er tiempo (Support)
  readonly wait: string; // 2º tiempo (Wait) → chip
  readonly waitOver: boolean; // chip rojo si supera umbral
  readonly categorization: string;
  readonly comments: string;
  readonly direction: CallDirection; // ↗ saliente / ↙ entrante
  readonly channel: CallChannel; // teléfono · chat · mail · whatsapp
  readonly outcome: CallOutcome; // color del icono + barra de estado izquierda
}

export interface Grupo {
  readonly name: string;
  readonly on: boolean;
  /** Número del nodo; el dialpad lo muestra bajo el nombre. */
  readonly id: string;
  /**
   * Canales que el agente atiende en ese grupo. En el original se pintan como tres
   * iconos —teléfono, chat y correo— y los que no atiende bajan a 'opacity: 0.3'.
   */
  readonly channels: {
    readonly calls: boolean;
    readonly chats: boolean;
    readonly emails: boolean;
  };
}

export const CALLS: readonly CallRow[] = [
  {
    id: 1,
    date: '14:07:09',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '-',
    destination: '-',
    support: '00:02',
    wait: '00:00',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'out',
    channel: 'call',
    outcome: 'attended',
  },
  {
    id: 2,
    date: '13:26:50',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '-',
    destination: '-',
    support: '00:03',
    wait: '00:00',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'out',
    channel: 'call',
    outcome: 'attended',
  },
  {
    id: 3,
    date: '13:10:42',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: 'Pruebas AED Marketing',
    support: '00:00',
    wait: '00:20',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
  },
  {
    id: 4,
    date: '12:35:09',
    number: '689622508',
    group: 'Nodo AED 1',
    origin: '-',
    destination: '-',
    support: '00:03',
    wait: '00:00',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'out',
    channel: 'call',
    outcome: 'attended',
  },
  {
    id: 5,
    date: '12:26:35',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '-',
    destination: '-',
    support: '00:04',
    wait: '00:00',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'out',
    channel: 'call',
    outcome: 'attended',
  },
  {
    id: 6,
    date: '12:25:29',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '-',
    destination: '-',
    support: '00:00',
    wait: '00:00',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'out',
    channel: 'call',
    outcome: 'lost',
  },
  {
    id: 7,
    date: '12:24:19',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: 'Pruebas AED Marketing',
    support: '00:00',
    wait: '00:20',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
  },
  {
    id: 8,
    date: '12:20:53',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '-',
    destination: '-',
    support: '00:02',
    wait: '00:00',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'out',
    channel: 'call',
    outcome: 'attended',
  },
  {
    id: 9,
    date: '12:19:19',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: 'Pruebas AED Marketing',
    support: '00:00',
    wait: '00:20',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
  },
  {
    id: 10,
    date: '10:41:18',
    number: '689622508',
    group: 'Nodo AED 1',
    origin: '689622508',
    destination: 'Pruebas AED Marketing',
    support: '00:00',
    wait: '00:07',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
  },
  {
    id: 11,
    date: '10:39:32',
    number: '689622508',
    group: 'Nodo AED 1',
    origin: '689622508',
    destination: 'Pruebas AED Marketing',
    support: '00:00',
    wait: '00:20',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
  },
  {
    id: 12,
    date: '17 Aug',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '-',
    destination: '-',
    support: '00:00',
    wait: '00:00',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'out',
    channel: 'call',
    outcome: 'lost',
  },
  {
    id: 13,
    date: '17 Aug',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: 'Pruebas AED Marketing',
    support: '00:00',
    wait: '00:20',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
  },
  {
    id: 14,
    date: '17 Aug',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: 'Pruebas AED Marketing',
    support: '00:00',
    wait: '00:20',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
  },
  {
    id: 15,
    date: '17 Aug',
    number: '689622508',
    group: 'Nodo AED 1',
    origin: '689622508',
    destination: 'Pruebas AED Marketing',
    support: '00:00',
    wait: '00:20',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
  },
  {
    id: 16,
    date: '17 Aug',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: 'Pruebas AED Marketing',
    support: '00:11',
    wait: '00:10',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'call',
    outcome: 'attended',
  },
  {
    id: 17,
    date: '17 Aug',
    number: '676653912',
    group: 'Nodo AED 2',
    origin: '-',
    destination: '-',
    support: '05:18',
    wait: '00:00',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'out',
    channel: 'call',
    outcome: 'attended',
  },
  {
    id: 18,
    date: '17 Aug',
    number: '671030606',
    group: 'Nodo AED 1',
    origin: '671030606',
    destination: 'Pruebas AED Marketing',
    support: '04:50',
    wait: '00:10',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'call',
    outcome: 'attended',
  },
  {
    id: 19,
    date: '17 Aug',
    number: 'heye',
    group: 'Nodo AED 1',
    origin: 'heye',
    destination: 'Rafael_3AED',
    support: '01:37',
    wait: '00:22',
    waitOver: false,
    categorization: '-',
    comments: '-',
    direction: 'in',
    channel: 'chat',
    outcome: 'expired',
  },
];

/**
 * Estado de gestión de una conversación perdida, tal cual lo devuelve el backend
 * del Agent real ('management_status'). Manda la columna «Estado»:
 *   pending       → botón primario «Gestionar»
 *   in_management → «En gestión», icono 'autorenew'
 *   managed       → «Gestionada», icono 'check' + «Gestionada por»
 */
export type PendingState = 'pending' | 'in_management' | 'managed';

/**
 * Fila de «Pendientes»: el visor de conversaciones perdidas del grupo
 * (SISMAC-3780). Mismas primeras columnas que el Historial, y cambia el final:
 * «Estado» y «Gestionada por».
 */
export interface PendingRow {
  readonly id: number;
  readonly date: string;
  readonly number: string;
  readonly group: string;
  readonly origin: string;
  readonly destination: string;
  readonly support: string;
  readonly wait: string;
  readonly waitOver: boolean;
  readonly direction: CallDirection;
  readonly channel: CallChannel;
  readonly outcome: CallOutcome;
  readonly state: PendingState;
  readonly managedBy: string;
}

export const PENDING: readonly PendingRow[] = [
  {
    id: 1,
    date: '10:41:18',
    number: '689622508',
    group: 'Nodo AED 1',
    origin: '689622508',
    destination: '919101810',
    support: '00:00',
    wait: '00:07',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'pending',
    managedBy: '-',
  },
  {
    id: 2,
    date: '10:40:29',
    number: '689622508',
    group: 'Nodo AED 1',
    origin: '689622508',
    destination: '919101810',
    support: '00:00',
    wait: '00:23',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'pending',
    managedBy: '-',
  },
  {
    id: 3,
    date: '10:40:11',
    number: '689622508',
    group: 'Nodo AED 1',
    origin: '689622508',
    destination: '919101810',
    support: '00:00',
    wait: '00:09',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'pending',
    managedBy: '-',
  },
  {
    id: 4,
    date: '10:39:32',
    number: '689622508',
    group: 'Nodo AED 1',
    origin: '689622508',
    destination: '919101810',
    support: '00:00',
    wait: '00:26',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'pending',
    managedBy: '-',
  },
  {
    id: 5,
    date: '18 Aug',
    number: '671030606',
    group: 'Nodo AED 1',
    origin: '671030606',
    destination: '919101810',
    support: '00:00',
    wait: '00:08',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'pending',
    managedBy: '-',
  },
  {
    id: 6,
    date: '10 Aug',
    number: '671030606',
    group: 'Nodo AED 1',
    origin: '671030606',
    destination: '919101810',
    support: '00:00',
    wait: '00:25',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'pending',
    managedBy: '-',
  },
  {
    id: 7,
    date: '10 Aug',
    number: '671030606',
    group: 'Nodo AED 1',
    origin: '671030606',
    destination: '919101810',
    support: '00:00',
    wait: '00:06',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'pending',
    managedBy: '-',
  },
  {
    id: 8,
    date: '10 Aug',
    number: '671030606',
    group: 'Nodo AED 1',
    origin: '671030606',
    destination: '919101810',
    support: '00:00',
    wait: '00:12',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'pending',
    managedBy: '-',
  },
  {
    id: 9,
    date: '7 Aug',
    number: '685445549',
    group: 'Nodo AED 1',
    origin: '685445549',
    destination: '919101810',
    support: '00:00',
    wait: '00:06',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'pending',
    managedBy: '-',
  },
  {
    id: 10,
    date: '7 Aug',
    number: '685445549',
    group: 'Nodo AED 1',
    origin: '685445549',
    destination: '919101810',
    support: '00:00',
    wait: '00:07',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'pending',
    managedBy: '-',
  },
  {
    id: 11,
    date: '13:21:31',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: '919101810',
    support: '00:00',
    wait: '01:00',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'managed',
    managedBy: 'Rafael_3AED',
  },
  {
    id: 12,
    date: '13:19:15',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: '919101810',
    support: '00:00',
    wait: '01:00',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'managed',
    managedBy: 'Rafael_3AED',
  },
  {
    id: 13,
    date: '13:10:40',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: '919101810',
    support: '00:00',
    wait: '01:00',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'managed',
    managedBy: 'Rafael_3AED',
  },
  {
    id: 14,
    date: '12:24:19',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: '919101810',
    support: '00:00',
    wait: '01:00',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'managed',
    managedBy: 'Rafael_3AED',
  },
  {
    id: 15,
    date: '12:19:18',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: '919101810',
    support: '00:00',
    wait: '01:01',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'managed',
    managedBy: 'Rafael_3AED',
  },
  {
    id: 16,
    date: '17 Aug',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: '919101810',
    support: '00:00',
    wait: '01:00',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'managed',
    managedBy: 'Rafael_3AED',
  },
  {
    id: 17,
    date: '17 Aug',
    number: '676653912',
    group: 'Nodo AED 1',
    origin: '676653912',
    destination: '919101810',
    support: '00:00',
    wait: '01:00',
    waitOver: false,
    direction: 'in',
    channel: 'call',
    outcome: 'lost',
    state: 'managed',
    managedBy: 'Rafael_3AED',
  },
];

/** Un mensaje del hilo. `server` son los avisos del sistema, centrados y en gris. */
export interface ChatMsg {
  readonly from: 'send' | 'received' | 'server';
  readonly text: string;
  readonly time?: string;
}

/**
 * Conversación del listado de Mensajes del Comunicador.
 *
 * 'kind' y 'state' gobiernan el icono de tipificar: el original solo lo ofrece cuando
 * la conversación es con un CLIENTE y ha quedado en postconversando. Entre agentes no
 * hay nada que tipificar, y mientras sigue viva tampoco.
 */
export interface ChatRow {
  readonly id: number;
  readonly name: string;
  readonly initial: string;
  readonly color: string;
  readonly group: string;
  readonly time: string;
  readonly preview: string;
  readonly unread: number;
  /** Con quién se habla: 'client' se tipifica, 'agent' no. */
  readonly kind: 'client' | 'agent';
  /**
   * Vida de la conversación, que es lo que pinta la barra lateral de la tarjeta:
   *   'open'       en curso, sin barra;
   *   'ended'      acabada con normalidad, sin barra;
   *   'abandoned'  el cliente colgó, barra roja;
   *   'postchat'   acabada y a la espera de tipificar, barra turquesa.
   */
  readonly state: 'open' | 'ended' | 'abandoned' | 'postchat';
  readonly thread: readonly ChatMsg[];
}

/** Copies de agente real: saludo del bot, consultas de cliente y respuestas del agente. */
export const CHATS: readonly ChatRow[] = [
  {
    id: 1,
    name: 'Prueba',
    initial: 'P',
    color: '#e74c3c',
    group: 'Nodo AED 1',
    time: '8min',
    preview: 'Tú: Hola! Bienvenido al grupo 1',
    unread: 0,
    kind: 'client',
    state: 'postchat',

    thread: [
      { from: 'server', text: 'Estás conectado con Prueba' },
      { from: 'send', text: 'Hola! Bienvenido al grupo 1', time: '15:41' },
      { from: 'server', text: 'La conversación ha caducado por inactividad' },
    ],
  },
  {
    id: 2,
    name: 'Marta Ruiz',
    initial: 'M',
    color: '#3e7fff',
    group: 'Nodo AED 2',
    time: '14min',
    preview:
      'Buenas, sigo sin poder acceder con mi PIN. Me dice que ha caducado.',
    unread: 2,
    kind: 'agent',
    state: 'open',

    thread: [
      { from: 'server', text: 'Estás conectado con Marta Ruiz' },
      {
        from: 'received',
        text: 'Buenas, sigo sin poder acceder con mi PIN. Me dice que ha caducado.',
        time: '16:02',
      },
      {
        from: 'send',
        text: 'Hola Marta, soy Rafael del equipo de soporte. Ahora mismo lo reviso.',
        time: '16:03',
      },
      {
        from: 'send',
        text: '¿Me confirmas la extensión desde la que entras?',
        time: '16:03',
      },
      { from: 'received', text: 'La 113.', time: '16:04' },
      {
        from: 'send',
        text: 'Perfecto. Te he generado un PIN nuevo, te llega al correo en un par de minutos.',
        time: '16:05',
      },
      { from: 'received', text: 'Genial, muchas gracias.', time: '16:06' },
    ],
  },
  {
    id: 3,
    name: '676653912',
    initial: '6',
    color: '#2bae22',
    group: 'Grupo 3',
    time: '32min',
    preview:
      'Tú: Le he pasado la incidencia al equipo. En cuanto tenga respuesta le aviso.',
    unread: 0,
    kind: 'client',
    state: 'postchat',

    thread: [
      { from: 'server', text: 'Estás conectado con 676653912' },
      {
        from: 'received',
        text: 'Llamé esta mañana y se me cortó la llamada.',
        time: '15:12',
      },
      {
        from: 'send',
        text: 'Lo siento. Veo la incidencia registrada, la he escalado al equipo técnico.',
        time: '15:14',
      },
      {
        from: 'send',
        text: 'Le he pasado la incidencia al equipo. En cuanto tenga respuesta le aviso.',
        time: '15:15',
      },
      { from: 'server', text: 'La conversación ha finalizado' },
    ],
  },
  {
    id: 4,
    name: 'Javier Soler',
    initial: 'J',
    color: '#f39c12',
    group: 'Nodo AED 1',
    time: '1h',
    preview: '¿Puede confirmarme el número de pedido? Es el 4471-B.',
    unread: 1,
    kind: 'client',
    state: 'open',

    thread: [
      { from: 'server', text: 'Estás conectado con Javier Soler' },
      {
        from: 'send',
        text: 'Buenos días Javier, ¿en qué puedo ayudarle?',
        time: '14:38',
      },
      {
        from: 'received',
        text: '¿Puede confirmarme el número de pedido? Es el 4471-B.',
        time: '14:40',
      },
    ],
  },
  {
    id: 5,
    name: 'Ana Pérez',
    initial: 'A',
    color: '#9b59b6',
    group: 'Nodo AED 2',
    time: '2h',
    preview: 'Tú: Perfecto, queda resuelto. Gracias por su paciencia.',
    unread: 0,
    kind: 'client',
    state: 'abandoned',

    thread: [
      { from: 'server', text: 'Estás conectado con Ana Pérez' },
      { from: 'received', text: 'Ya me funciona, gracias.', time: '13:20' },
      {
        from: 'send',
        text: 'Perfecto, queda resuelto. Gracias por su paciencia.',
        time: '13:21',
      },
      { from: 'server', text: 'El cliente ha abandonado la conversación' },
    ],
  },
];

export const GRUPOS: readonly Grupo[] = [
  {
    name: 'Nodo AED 2',
    id: '910220135',
    on: true,
    channels: { calls: true, chats: true, emails: true },
  },
  {
    name: 'Grupo 3',
    id: '910220134',
    on: true,
    channels: { calls: true, chats: true, emails: false },
  },
  {
    name: 'Nodo AED 1',
    id: '910220134',
    on: true,
    channels: { calls: true, chats: true, emails: false },
  },
];

export const PROFILE = {
  name: 'Rafael',
  pin: '694124',
  ext: '113',
  extType: 'language', // Material Symbol: globo (Type of ext.)
  avatarLetter: 'R',
} as const;

export const KPIS = {
  activeTime: '00:24:29',
  connectedAt: '9:45 am',
  disconnectedAt: '10:36 am',
  statusTime: '00:04:18',
  /* El total sale de CALLS; se deja aquí por compatibilidad con quien lea KPIS. */
  total: 0,
  /* Medidos en el original: sus TMR y TMC. */
  art: '00:11',
  act: '02:08',
} as const;
