// @ts-check
/**
 * Los calendarios oficiales de festivos que vienen ya definidos, por país o región. Son de ejemplo para el prototipo: no salen
 * de ningún servicio.
 *
 * Cada festivo es `{ mes-día, nombre }` si cae siempre el mismo día, sea el año que sea (Navidad, el 25 de diciembre): al
 * añadirlo se repite cada año. Los que cambian de fecha (Semana Santa) van con su fecha completa, año a año: al añadirlos
 * valen solo para ese año.
 */

/** Los que caen siempre el mismo día, con su `MM-DD`. */
const fijo = (mmdd, nombre) => ({ fecha: `2000-${mmdd}`, nombre, anual: true });
/** Los que cambian cada año, con su fecha completa. */
const movil = (fecha, nombre) => ({ fecha, nombre, anual: false });

const NACIONALES_ES = [
  fijo('01-01', 'Año Nuevo'),
  fijo('01-06', 'Epifanía del Señor'),
  fijo('05-01', 'Fiesta del Trabajo'),
  fijo('08-15', 'Asunción de la Virgen'),
  fijo('10-12', 'Fiesta Nacional de España'),
  fijo('11-01', 'Todos los Santos'),
  fijo('12-06', 'Día de la Constitución'),
  fijo('12-08', 'La Inmaculada Concepción'),
  fijo('12-25', 'Navidad'),
  movil('2025-04-18', 'Viernes Santo'),
  movil('2026-04-03', 'Viernes Santo'),
  movil('2027-03-26', 'Viernes Santo'),
];

/** @type {readonly { id: string, nombre: string, dias: readonly { fecha: string, nombre: string, anual: boolean }[] }[]} */
export const CALENDARIOS_OFICIALES = [
  { id: 'es', nombre: 'España (nacionales)', dias: NACIONALES_ES },
  {
    id: 'es-md',
    nombre: 'España, Comunidad de Madrid',
    dias: [
      ...NACIONALES_ES,
      fijo('05-02', 'Fiesta de la Comunidad de Madrid'),
      movil('2025-04-17', 'Jueves Santo'),
      movil('2026-04-02', 'Jueves Santo'),
      movil('2027-03-25', 'Jueves Santo'),
    ],
  },
  {
    id: 'es-ct',
    nombre: 'España, Cataluña',
    dias: [
      ...NACIONALES_ES,
      fijo('06-24', 'San Juan'),
      fijo('09-11', 'Diada de Cataluña'),
      fijo('09-24', 'La Mercè'),
      fijo('12-26', 'San Esteban'),
      movil('2025-04-21', 'Lunes de Pascua'),
      movil('2026-04-06', 'Lunes de Pascua'),
      movil('2027-03-29', 'Lunes de Pascua'),
    ],
  },
  {
    id: 'mx',
    nombre: 'México',
    dias: [fijo('01-01', 'Año Nuevo'), fijo('05-01', 'Día del Trabajo'), fijo('09-16', 'Día de la Independencia'), fijo('12-25', 'Navidad')],
  },
  {
    id: 'pe',
    nombre: 'Perú',
    dias: [
      fijo('01-01', 'Año Nuevo'),
      fijo('05-01', 'Día del Trabajo'),
      fijo('06-29', 'San Pedro y San Pablo'),
      fijo('07-28', 'Fiestas Patrias'),
      fijo('07-29', 'Fiestas Patrias'),
      fijo('08-30', 'Santa Rosa de Lima'),
      fijo('10-08', 'Combate de Angamos'),
      fijo('11-01', 'Todos los Santos'),
      fijo('12-08', 'La Inmaculada Concepción'),
      fijo('12-25', 'Navidad'),
      movil('2025-04-17', 'Jueves Santo'),
      movil('2026-04-02', 'Jueves Santo'),
      movil('2025-04-18', 'Viernes Santo'),
      movil('2026-04-03', 'Viernes Santo'),
    ],
  },
];
