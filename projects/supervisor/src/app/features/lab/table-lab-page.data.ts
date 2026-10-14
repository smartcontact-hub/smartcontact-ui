export interface TableLabAgent {
  id: number;
  name: string;
  team: string;
  status: 'online' | 'busy' | 'offline';
  tickets: number;
  /** Valoración de 0 a 5: para enseñar una celda con contenido rico (`p-rating`), no solo texto. */
  rating: number;
  /** Foto de ejemplo (picsum, seed fija por fila): demuestra `sc-avatar [image]`, sin inventar caras
   *  realistas, es una foto cualquiera, no un retrato de una persona que no existe. */
  avatarUrl: string;
  /** Código ISO del país del contacto (no del agente): el caso real de un AED internacional,
   *  qué bandera enseñar al lado del ticket para saber de qué mercado viene la llamada. */
  country: 'ES' | 'FR' | 'PT' | 'MX' | 'CO' | 'AR' | 'GB' | 'DE' | 'IT' | 'BR';
}

const FIRST_NAMES = [
  'Marta', 'Daniel', 'Carla', 'Jorge', 'Lucía', 'Pablo', 'Nuria', 'Alex', 'Elena', 'Marc',
  'Sara', 'Hugo', 'Irene', 'Oriol', 'Paula', 'Rubén', 'Clara', 'David', 'Laia', 'Toni',
  'Berta', 'Quim', 'Mireia', 'Gerard', 'Anna', 'Victor', 'Noa', 'Biel', 'Judit', 'Marçal',
] as const;

const LAST_NAMES = [
  'Ferrer', 'Puig', 'Soriano', 'Nieto', 'Prats', 'Serra', 'Cano', 'Roig', 'Vidal', 'Oliver',
  'Bosch', 'Camps', 'Garrido', 'Puente', 'Montes', 'Esteve', 'Vega', 'Ribas', 'Ferrando', 'Marquez',
  'Clavero', 'Sala', 'Pons', 'Soto', 'Alsina', 'Bartra', 'Casas', 'Duran', 'Escoda', 'Fuster',
] as const;

const TEAMS = ['Soporte Nivel 1', 'Soporte Nivel 2', 'Facturación'] as const;
const STATUSES = ['online', 'busy', 'offline'] as const satisfies readonly TableLabAgent['status'][];
const COUNTRIES = ['ES', 'FR', 'PT', 'MX', 'CO', 'AR', 'GB', 'DE', 'IT', 'BR'] as const satisfies readonly TableLabAgent['country'][];

/** 150 filas: por debajo de las 100, `sc-datatable` no activa la lista virtual (DD-176,
 *  `ScDatatableComponent.VIRTUAL_MIN_ROWS`), con menos muestra ese control del laboratorio no
 *  tendría nada que demostrar.
 *
 *  Con los dos índices atados a `i % 30` el par nombre+apellido se repetía IDÉNTICO cada 30 filas
 *  (30 filas, 5 veces en la muestra: cinco «Pablo Serra» exactos). El apellido suma un desplazamiento
 *  por cada vuelta de 30 (`Math.floor(i / 30)`), así que el par no repite en las 150 filas Y sigue
 *  cambiando fila a fila, no solo cada 5 (eso dejaba 5 apellidos iguales seguidos en el orden por
 *  defecto). (Medido 2026-10-14.) */
export const TABLE_LAB_AGENTS: readonly TableLabAgent[] = Array.from({ length: 150 }, (_, i) => {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * 7 + Math.floor(i / 30)) % LAST_NAMES.length];
  const status = STATUSES[i % STATUSES.length];
  return {
    id: i + 1,
    name: `${first} ${last}`,
    team: TEAMS[i % TEAMS.length],
    status,
    tickets: status === 'offline' ? 0 : ((i * 3) % 20) + 1,
    rating: (i % 5) + 1,
    avatarUrl: `https://picsum.photos/seed/sc-table-lab-${i + 1}/128`,
    country: COUNTRIES[(i * 3) % COUNTRIES.length],
  };
});
