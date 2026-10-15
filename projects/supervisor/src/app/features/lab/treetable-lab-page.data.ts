import type { TreeNode } from 'primeng/api';

export interface TreeTableAgentRow {
  /** La clave del nodo, repetida en la fila: al marcar filas, `dataKey` la busca aquí y no en el nodo. */
  key: string;
  name: string;
  role: 'Equipo' | 'Agente';
  status?: 'online' | 'busy' | 'offline';
  /** Tickets abiertos; en un equipo, la suma de sus agentes. */
  tickets: number;
  /** Tickets cerrados hoy; en un equipo, la suma de sus agentes. */
  closed: number;
}

type AgentSeed = readonly [key: string, name: string, status: NonNullable<TreeTableAgentRow['status']>, tickets: number, closed: number];

/** Equipos como nodos raíz, agentes como hijos: el caso real de un supervisor («¿cuántos tickets
 *  abiertos lleva cada equipo, y quién de cada equipo?»), no un árbol genérico de archivos. */
const TEAMS: readonly { readonly key: string; readonly name: string; readonly agents: readonly AgentSeed[] }[] = [
  {
    key: '1',
    name: 'Soporte Nivel 1',
    agents: [
      ['1-1', 'Marta Ferrer', 'online', 12, 9],
      ['1-2', 'Daniel Puig', 'busy', 7, 4],
      ['1-3', 'Nuria Cano', 'online', 15, 11],
      ['1-4', 'Irene Garrido', 'online', 9, 6],
      ['1-5', 'Rubén Esteve', 'offline', 0, 2],
      ['1-6', 'Laia Ferrando', 'online', 3, 8],
    ],
  },
  {
    key: '2',
    name: 'Soporte Nivel 2',
    agents: [
      ['2-1', 'Carla Soriano', 'online', 4, 3],
      ['2-2', 'Lucía Prats', 'online', 9, 5],
      ['2-3', 'Alex Roig', 'offline', 0, 1],
      ['2-4', 'Sara Bosch', 'online', 2, 7],
      ['2-5', 'Oriol Puente', 'busy', 5, 2],
      ['2-6', 'Clara Vega', 'online', 18, 4],
    ],
  },
  {
    key: '3',
    name: 'Facturación',
    agents: [
      ['3-1', 'Jorge Nieto', 'offline', 0, 0],
      ['3-2', 'Pablo Serra', 'busy', 3, 6],
      ['3-3', 'Elena Vidal', 'online', 6, 5],
      ['3-4', 'Hugo Camps', 'offline', 0, 3],
      ['3-5', 'Paula Montes', 'online', 8, 2],
      ['3-6', 'David Ribas', 'busy', 4, 4],
    ],
  },
  {
    key: '4',
    name: 'Ventas',
    agents: [
      ['4-1', 'Berta Clavero', 'online', 7, 10],
      ['4-2', 'Quim Sala', 'busy', 3, 2],
      ['4-3', 'Mireia Pons', 'online', 5, 6],
      ['4-4', 'Gerard Soto', 'offline', 0, 1],
    ],
  },
];

/** La suma de los agentes en la fila del equipo: al editar un agente, su equipo cambia con él. */
export function sumTeams(nodes: readonly TreeNode<TreeTableAgentRow>[]): void {
  for (const team of nodes) {
    const agents = team.children ?? [];
    if (!team.data || !agents.length) continue;
    team.data.tickets = agents.reduce((sum, agent) => sum + (agent.data?.tickets ?? 0), 0);
    team.data.closed = agents.reduce((sum, agent) => sum + (agent.data?.closed ?? 0), 0);
  }
}

/** Una copia por visita: editar escribe en la fila y reordenar columnas mueve el array. */
export function treeTableLabTeams(): TreeNode<TreeTableAgentRow>[] {
  const nodes: TreeNode<TreeTableAgentRow>[] = TEAMS.map((team) => ({
    key: team.key,
    data: { key: team.key, name: team.name, role: 'Equipo', tickets: 0, closed: 0 },
    children: team.agents.map(([key, name, status, tickets, closed]) => ({
      key,
      data: { key, name, role: 'Agente', status, tickets, closed },
    })),
  }));
  sumTeams(nodes);
  return nodes;
}

/** «Carga perezosa» (primeng.dev/treetable «Lazy Load»): los equipos de un centro grande, por páginas. */
const LAZY_TEAM_NAMES = [
  'Soporte Nivel 1', 'Soporte Nivel 2', 'Soporte Nivel 3', 'Facturación', 'Ventas', 'Retención', 'Altas', 'Bajas',
  'Cobros', 'Reclamaciones', 'Postventa', 'Clientes VIP', 'Empresas', 'Autónomos', 'Incidencias de red', 'Fibra',
  'Móvil', 'Televisión', 'Portabilidades', 'Averías', 'Instalaciones', 'Citas técnicas', 'Calidad', 'Formación',
  'Redes sociales', 'Chat web', 'Correo', 'Turno de noche', 'Fin de semana', 'Campañas', 'Encuestas', 'Fidelización',
] as const;

const LAZY_AGENT_NAMES = [
  'Aina Roca', 'Bruno Vela', 'Carmen Ollé', 'Dídac Marín', 'Eva Llorens', 'Ferran Ortiz', 'Gemma Pujol', 'Héctor Gil',
  'Ivet Sanz', 'Joan Riera', 'Kilian Mas', 'Lorena Bas', 'Marc Tena', 'Noemí Vallès', 'Óscar Duch', 'Pilar Coll',
] as const;

const LAZY_STATUSES: readonly NonNullable<TreeTableAgentRow['status']>[] = ['online', 'busy', 'offline', 'online'];

export const LAZY_TEAM_COUNT = LAZY_TEAM_NAMES.length;

/** Los equipos de una página, sin agentes: `leaf: false` pinta la flecha y sus agentes llegan al desplegar. */
export function lazyTeams(first: number, rows: number): TreeNode<TreeTableAgentRow>[] {
  return LAZY_TEAM_NAMES.slice(first, first + rows).map((name, i) => {
    const index = first + i;
    const key = `lazy-${index}`;
    return { key, leaf: false, data: { key, name, role: 'Equipo', tickets: 9 + ((index * 7) % 31), closed: 4 + ((index * 5) % 17) } };
  });
}

/** Los agentes de un equipo de la carga perezosa: de tres a seis, siempre los mismos para el mismo equipo. */
export function lazyAgents(teamKey: string): TreeNode<TreeTableAgentRow>[] {
  const index = Number(teamKey.replace('lazy-', ''));
  return Array.from({ length: 3 + (index % 4) }, (_, i) => {
    const seed = index * 3 + i;
    const key = `${teamKey}-${i + 1}`;
    return {
      key,
      data: {
        key,
        name: LAZY_AGENT_NAMES[seed % LAZY_AGENT_NAMES.length]!,
        role: 'Agente',
        status: LAZY_STATUSES[seed % LAZY_STATUSES.length],
        tickets: (seed * 5) % 13,
        closed: (seed * 3) % 9,
      },
    };
  });
}
