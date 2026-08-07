/** Datos seed del cartón pluma del Agent (réplica fiel de la web real, sin backend). */

export type CallDirection = 'in' | 'out' | 'missed';
export type CallChannel = 'call' | 'chat';

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
  readonly direction: CallDirection; // flecha ↗ (out) / ↙ (in)
  readonly channel: CallChannel; // 2º icono: teléfono (call) / bocadillo (chat)
  readonly selected?: boolean;
}

export interface Grupo {
  readonly name: string;
  readonly on: boolean;
}

export const CALLS: readonly CallRow[] = [
  { id: 1, date: '6 Aug', number: 'Mario Per…', group: 'Soporte T…', origin: 'Rafael', destination: 'Mario Per…', support: '00:00', wait: '00:10', waitOver: false, categorization: '-', comments: '-', direction: 'out', channel: 'chat' },
  { id: 2, date: '21 May', number: 'Agente Jo…', group: 'Soporte T…', origin: 'Agente Jo…', destination: '-', support: '00:09', wait: '02:24', waitOver: true, categorization: '-', comments: '-', direction: 'in', channel: 'call' },
  { id: 3, date: '21 May', number: '34609502…', group: 'Grupo de…', origin: '34609502…', destination: 'Demo Sm…', support: '00:00', wait: '00:01', waitOver: false, categorization: '-', comments: '-', direction: 'in', channel: 'call', selected: true },
  { id: 4, date: '21 May', number: '34609502…', group: 'Grupo de…', origin: '34609502…', destination: 'Demo Sm…', support: '01:05', wait: '00:05', waitOver: false, categorization: '-', comments: '-', direction: 'in', channel: 'call' },
  { id: 5, date: '21 May', number: 'Agente Jo…', group: 'Grupo de…', origin: 'Agente Jo…', destination: 'Demo Sm…', support: '00:24', wait: '01:26', waitOver: true, categorization: '-', comments: '-', direction: 'in', channel: 'call' },
];

export const GRUPOS: readonly Grupo[] = [
  { name: 'ACD Demo C2CB', on: true },
  { name: 'ACD demo cuscare', on: true },
  { name: 'ACD outbound', on: true },
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
  total: 0,
  art: '-',
  act: '-',
} as const;
