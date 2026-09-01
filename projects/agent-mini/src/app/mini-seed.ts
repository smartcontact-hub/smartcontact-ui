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
