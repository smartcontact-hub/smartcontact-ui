import type { TreeNode } from 'primeng/api';

export interface TreeTableAgentRow {
  name: string;
  role: 'Equipo' | 'Agente';
  status?: 'online' | 'busy' | 'offline';
  tickets: number;
}

/** Equipos como nodos raíz, agentes como hijos: el caso real de un supervisor («¿cuántos tickets
 *  abiertos lleva cada equipo, y quién de cada equipo?»), no un árbol genérico de archivos. */
export const TREETABLE_LAB_TEAMS: readonly TreeNode<TreeTableAgentRow>[] = [
  {
    key: '1',
    data: { name: 'Soporte Nivel 1', role: 'Equipo', tickets: 46 },
    children: [
      { key: '1-1', data: { name: 'Marta Ferrer', role: 'Agente', status: 'online', tickets: 12 } },
      { key: '1-2', data: { name: 'Daniel Puig', role: 'Agente', status: 'busy', tickets: 7 } },
      { key: '1-3', data: { name: 'Nuria Cano', role: 'Agente', status: 'online', tickets: 15 } },
      { key: '1-4', data: { name: 'Irene Garrido', role: 'Agente', status: 'online', tickets: 9 } },
      { key: '1-5', data: { name: 'Rubén Esteve', role: 'Agente', status: 'offline', tickets: 0 } },
      { key: '1-6', data: { name: 'Laia Ferrando', role: 'Agente', status: 'online', tickets: 3 } },
    ],
  },
  {
    key: '2',
    data: { name: 'Soporte Nivel 2', role: 'Equipo', tickets: 38 },
    children: [
      { key: '2-1', data: { name: 'Carla Soriano', role: 'Agente', status: 'online', tickets: 4 } },
      { key: '2-2', data: { name: 'Lucía Prats', role: 'Agente', status: 'online', tickets: 9 } },
      { key: '2-3', data: { name: 'Alex Roig', role: 'Agente', status: 'offline', tickets: 0 } },
      { key: '2-4', data: { name: 'Sara Bosch', role: 'Agente', status: 'online', tickets: 2 } },
      { key: '2-5', data: { name: 'Oriol Puente', role: 'Agente', status: 'busy', tickets: 5 } },
      { key: '2-6', data: { name: 'Clara Vega', role: 'Agente', status: 'online', tickets: 18 } },
    ],
  },
  {
    key: '3',
    data: { name: 'Facturación', role: 'Equipo', tickets: 22 },
    children: [
      { key: '3-1', data: { name: 'Jorge Nieto', role: 'Agente', status: 'offline', tickets: 0 } },
      { key: '3-2', data: { name: 'Pablo Serra', role: 'Agente', status: 'busy', tickets: 3 } },
      { key: '3-3', data: { name: 'Elena Vidal', role: 'Agente', status: 'online', tickets: 6 } },
      { key: '3-4', data: { name: 'Hugo Camps', role: 'Agente', status: 'offline', tickets: 0 } },
      { key: '3-5', data: { name: 'Paula Montes', role: 'Agente', status: 'online', tickets: 8 } },
      { key: '3-6', data: { name: 'David Ribas', role: 'Agente', status: 'busy', tickets: 4 } },
    ],
  },
  {
    key: '4',
    data: { name: 'Ventas', role: 'Equipo', tickets: 15 },
    children: [
      { key: '4-1', data: { name: 'Berta Clavero', role: 'Agente', status: 'online', tickets: 7 } },
      { key: '4-2', data: { name: 'Quim Sala', role: 'Agente', status: 'busy', tickets: 3 } },
      { key: '4-3', data: { name: 'Mireia Pons', role: 'Agente', status: 'online', tickets: 5 } },
      { key: '4-4', data: { name: 'Gerard Soto', role: 'Agente', status: 'offline', tickets: 0 } },
    ],
  },
];
