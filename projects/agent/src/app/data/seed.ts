/** Datos seed del esqueleto del Agent (sin backend). */

export type CallDirection = 'in' | 'out' | 'missed';
export type Tipificacion = 'N1' | 'N2' | 'N3';

export interface CallRow {
  readonly id: number;
  readonly fecha: string;
  readonly numero: string;
  readonly grupo: string;
  readonly origen: string;
  readonly destino: string;
  readonly duracion: string;
  readonly direction: CallDirection;
  readonly tipo: readonly Tipificacion[];
  readonly comentarios: string;
}

export interface Grupo {
  readonly name: string;
  readonly on: boolean;
}

const COMENTARIO = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod';

export const CALLS: readonly CallRow[] = [
  { id: 1, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Madrid', destino: 'Ext 101', duracion: '00:31', direction: 'in', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 2, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Sevilla', destino: 'Ext 104', duracion: '00:00', direction: 'missed', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 3, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Valencia', destino: 'Ext 101', duracion: '00:31', direction: 'in', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 4, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Bilbao', destino: 'Ext 102', duracion: '01:12', direction: 'out', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 5, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Madrid', destino: 'Ext 101', duracion: '00:31', direction: 'in', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 6, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Málaga', destino: 'Ext 103', duracion: '00:45', direction: 'in', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 7, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Madrid', destino: 'Ext 101', duracion: '00:31', direction: 'out', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 8, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Vigo', destino: 'Ext 105', duracion: '00:00', direction: 'missed', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 9, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Madrid', destino: 'Ext 101', duracion: '00:31', direction: 'in', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 10, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Sevilla', destino: 'Ext 102', duracion: '02:03', direction: 'in', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 11, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Madrid', destino: 'Ext 101', duracion: '00:31', direction: 'out', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 12, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Granada', destino: 'Ext 104', duracion: '00:31', direction: 'in', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 13, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Madrid', destino: 'Ext 101', duracion: '00:31', direction: 'in', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 14, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Murcia', destino: 'Ext 103', duracion: '00:31', direction: 'out', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
  { id: 15, fecha: '18/06 12:14', numero: '900345678', grupo: 'Pedidos', origen: 'Madrid', destino: 'Ext 101', duracion: '00:31', direction: 'in', tipo: ['N1', 'N2', 'N3'], comentarios: COMENTARIO },
];

export const GRUPOS: readonly Grupo[] = [
  { name: 'Nombre Grupo 1', on: true },
  { name: 'Nombre Grupo 1', on: true },
  { name: 'Nombre Grupo 1', on: true },
  { name: 'Nombre Grupo 1', on: true },
];

export const PROFILE = {
  name: 'Nombre apellido',
  pin: '4855458745641',
  ext: 'Extensión',
  photo: 'https://i.pravatar.cc/128?img=47',
} as const;

export const KPIS = {
  activeTime: '05:32:11',
  connectedAt: '09:00 am',
  statusTime: '00:32:21',
  total: 234,
  attended: 180,
  missed: 54,
  tmr: '00:31',
  tmc: '00:31',
} as const;
