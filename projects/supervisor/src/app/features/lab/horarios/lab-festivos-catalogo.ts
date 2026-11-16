/**
 * Festivos precargados para no crearlos uno a uno. DATOS DE EJEMPLO del laboratorio, 2026: en producción saldrían de un
 * servicio (p. ej. un calendario oficial por país y región) y se actualizarían cada año. Los móviles (Semana Santa,
 * lunes de México) ya vienen con su fecha del año.
 */
export interface FestivoDeCatalogo {
  readonly date: string;
  readonly name: string;
}

export interface Region {
  readonly id: string;
  readonly nombre: string;
  /** Lo que se suma a la región de arriba (una comunidad suma los nacionales). */
  readonly base?: string;
  readonly dias: readonly FestivoDeCatalogo[];
}

export const REGIONES: readonly Region[] = [
  {
    id: 'es',
    nombre: 'España, nacionales',
    dias: [
      { date: '2026-01-01', name: 'Año Nuevo' },
      { date: '2026-01-06', name: 'Epifanía del Señor' },
      { date: '2026-04-03', name: 'Viernes Santo' },
      { date: '2026-05-01', name: 'Fiesta del Trabajo' },
      { date: '2026-08-15', name: 'Asunción de la Virgen' },
      { date: '2026-10-12', name: 'Fiesta Nacional de España' },
      { date: '2026-11-01', name: 'Todos los Santos' },
      { date: '2026-12-06', name: 'Día de la Constitución' },
      { date: '2026-12-08', name: 'Inmaculada Concepción' },
      { date: '2026-12-25', name: 'Navidad' },
    ],
  },
  {
    id: 'es-md',
    nombre: 'España, Comunidad de Madrid',
    base: 'es',
    dias: [
      { date: '2026-04-02', name: 'Jueves Santo' },
      { date: '2026-05-02', name: 'Fiesta de la Comunidad de Madrid' },
    ],
  },
  {
    id: 'es-ct',
    nombre: 'España, Cataluña',
    base: 'es',
    dias: [
      { date: '2026-04-06', name: 'Lunes de Pascua' },
      { date: '2026-06-24', name: 'Sant Joan' },
      { date: '2026-09-11', name: 'Diada Nacional de Catalunya' },
      { date: '2026-12-26', name: 'Sant Esteve' },
    ],
  },
  {
    id: 'es-an',
    nombre: 'España, Andalucía',
    base: 'es',
    dias: [
      { date: '2026-02-28', name: 'Día de Andalucía' },
      { date: '2026-04-02', name: 'Jueves Santo' },
    ],
  },
  {
    id: 'mx',
    nombre: 'México, nacionales',
    dias: [
      { date: '2026-01-01', name: 'Año Nuevo' },
      { date: '2026-02-02', name: 'Día de la Constitución' },
      { date: '2026-03-16', name: 'Natalicio de Benito Juárez' },
      { date: '2026-05-01', name: 'Día del Trabajo' },
      { date: '2026-09-16', name: 'Día de la Independencia' },
      { date: '2026-11-16', name: 'Día de la Revolución' },
      { date: '2026-12-25', name: 'Navidad' },
    ],
  },
];

/** Los días de una región con los de su base, por fecha. */
export function diasDe(id: string): FestivoDeCatalogo[] {
  const r = REGIONES.find((x) => x.id === id);
  if (!r) return [];
  const base = r.base ? diasDe(r.base) : [];
  return [...base, ...r.dias].sort((a, b) => a.date.localeCompare(b.date));
}

/** Fechas que se repiten cada año en el mismo día y mes (las demás, como Semana Santa, cambian). */
const FIJAS = new Set(['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-06', '12-08', '12-25', '12-26', '06-24', '09-11', '02-28', '05-02', '09-16']);
export const esFija = (date: string): boolean => FIJAS.has(date.slice(5));
