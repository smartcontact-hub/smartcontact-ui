// @ts-check
/**
 * Los horarios y los calendarios de festivos de ejemplo. Aparte del almacén para que `scripts/__tests__/horarios.test.mjs`
 * compruebe «Postventa» contra su hoja de 2025 sin cargar Angular.
 *
 * «Postventa» reproduce los tipos de día de esa hoja: viernes más corto, verano de junio a agosto, festivos cerrados y
 * tres vísperas con jornada reducida. La hoja no trae horas: las de aquí son de ejemplo.
 */

const semana = (laborables, finde = []) => [laborables, laborables, laborables, laborables, laborables, finde, finde];

const anual = (id, date, name) => ({ id, name, date: `2000-${date}`, yearly: true });
const fecha = (id, date, name) => ({ id, name, date, yearly: false });

/** Los festivos de Barcelona: los de fecha fija se repiten; los que cambian cada año van con su año. */
export const FESTIVOS_SEMILLA = [
  {
    id: 1,
    name: 'Festivos Barcelona',
    description: 'Nacionales, de Cataluña y locales de Barcelona',
    status: 'active',
    days: [
      anual(1, '01-01', 'Año Nuevo'),
      anual(2, '01-06', 'Reyes'),
      anual(3, '05-01', 'Día del Trabajo'),
      anual(4, '06-24', 'San Juan'),
      anual(5, '08-15', 'La Asunción'),
      anual(6, '09-11', 'Diada de Cataluña'),
      anual(7, '09-24', 'La Mercè'),
      anual(8, '10-12', 'Fiesta Nacional'),
      anual(9, '11-01', 'Todos los Santos'),
      anual(10, '12-06', 'Día de la Constitución'),
      anual(11, '12-08', 'La Inmaculada'),
      anual(12, '12-25', 'Navidad'),
      anual(13, '12-26', 'San Esteban'),
      fecha(14, '2025-04-18', 'Viernes Santo'),
      fecha(15, '2025-04-21', 'Lunes de Pascua'),
      fecha(16, '2025-06-09', 'Lunes de Pentecostés'),
      fecha(17, '2026-04-03', 'Viernes Santo'),
      fecha(18, '2026-04-06', 'Lunes de Pascua'),
      fecha(19, '2026-05-25', 'Lunes de Pentecostés'),
      fecha(20, '2027-03-26', 'Viernes Santo'),
      fecha(21, '2027-03-29', 'Lunes de Pascua'),
      fecha(22, '2027-05-17', 'Lunes de Pentecostés'),
    ],
  },
  {
    id: 3,
    name: 'Festivos España',
    description: 'Festivos nacionales: se ofrecen al crear un horario',
    status: 'active',
    days: [
      anual(1, '01-01', 'Año Nuevo'),
      anual(2, '01-06', 'Epifanía del Señor'),
      anual(3, '05-01', 'Fiesta del Trabajo'),
      anual(4, '08-15', 'La Asunción'),
      anual(5, '10-12', 'Fiesta Nacional de España'),
      anual(6, '11-01', 'Todos los Santos'),
      anual(7, '12-06', 'Día de la Constitución'),
      anual(8, '12-08', 'La Inmaculada'),
      anual(9, '12-25', 'Navidad'),
      fecha(10, '2025-04-18', 'Viernes Santo'),
      fecha(11, '2026-04-03', 'Viernes Santo'),
      fecha(12, '2027-03-26', 'Viernes Santo'),
    ],
  },
  {
    id: 2,
    name: 'Festivos México',
    description: 'Días de descanso obligatorio',
    status: 'active',
    days: [
      anual(1, '01-01', 'Año Nuevo'),
      anual(2, '05-01', 'Día del Trabajo'),
      anual(3, '09-16', 'Día de la Independencia'),
      anual(4, '12-25', 'Navidad'),
    ],
  },
];

const base = { timezone: 'Europe/Madrid', status: 'active', periods: [], specials: [], holidayCalendarIds: [] };

export const HORARIOS_SEMILLA = [
  { ...base, id: 1, name: 'Horario General', description: 'Horario estándar de oficina', week: semana([[540, 1080]]), holidayCalendarIds: [1] },
  { ...base, id: 2, name: 'Turno Mañana', description: 'Turno de mañana para soporte', week: semana([[420, 900]]) },
  { ...base, id: 3, name: 'Turno Tarde', description: 'Turno de tarde para soporte', week: semana([[900, 1380]]) },
  { ...base, id: 4, name: 'Turno Noche', description: 'Cobertura nocturna para emergencias', week: semana([[1380, 420]], [[1380, 420]]) },
  { ...base, id: 5, name: 'Fines de Semana', description: 'Cobertura reducida fines de semana', week: semana([], [[600, 840]]) },
  {
    ...base,
    id: 6,
    name: 'Horario LATAM',
    timezone: 'America/Mexico_City',
    description: 'Adaptado al horario de Latinoamérica',
    week: semana([[840, 1320]]),
    holidayCalendarIds: [2],
  },
  { ...base, id: 7, name: '24/7 Emergencias', description: 'Cobertura continua sin interrupciones', week: semana([[0, 1440]], [[0, 1440]]) },
  { ...base, id: 8, name: 'Horario Verano', description: 'Jornada intensiva de verano (julio–agosto)', status: 'inactive', week: semana([[480, 900]]) },
  {
    ...base,
    id: 9,
    name: 'Postventa',
    description: 'Atención de postventa: viernes corto, verano y vísperas',
    week: [[[540, 1080]], [[540, 1080]], [[540, 1080]], [[540, 1080]], [[540, 900]], [], []],
    periods: [{ id: 1, name: 'Verano', color: 'blue', from: '06-01', to: '08-31', year: null, week: semana([[480, 900]]) }],
    specials: [
      { id: 1, name: 'Nochebuena', date: '2000-12-24', yearly: true, slots: [[540, 840]] },
      { id: 2, name: 'Nochevieja', date: '2000-12-31', yearly: true, slots: [[540, 840]] },
      { id: 3, name: 'Jueves Santo', date: '2025-04-17', yearly: false, slots: [[540, 840]] },
      { id: 4, name: 'Jueves Santo', date: '2026-04-02', yearly: false, slots: [[540, 840]] },
      { id: 5, name: 'Jueves Santo', date: '2027-03-25', yearly: false, slots: [[540, 840]] },
    ],
    holidayCalendarIds: [1],
  },
  {
    ...base,
    id: 10,
    name: 'TRDBCN · Oficina de atención al usuario',
    description: 'Calendario real de un cliente (2025). Teléfono 93 217 55 10. Entrada: locución OMAR_01',
    outMessage: 'Locución OMAR_03: fuera de este horario no entra la llamada.',
    // Jornada completa: lunes a jueves de 8 a 14 y de 15:30 a 18; viernes de 8 a 14. Cubre de enero a mayo y de septiembre a diciembre.
    week: [[[480, 840], [930, 1080]], [[480, 840], [930, 1080]], [[480, 840], [930, 1080]], [[480, 840], [930, 1080]], [[480, 840]], [], []],
    // Jornada intensiva: de lunes a viernes de 8 a 15, del 1 de junio al 31 de agosto.
    periods: [
      {
        id: 1,
        name: 'Jornada intensiva',
        color: 'blue',
        from: '06-01',
        to: '08-31',
        year: null,
        outMessage: 'Locución OMAR_04: fuera de este horario no entra la llamada.',
        week: semana([[480, 900]]),
      },
    ],
    // Los días verdes del calendario: de 8 a 15, con su propia locución.
    specials: [
      { id: 1, name: 'Jueves Santo', date: '2025-04-17', yearly: false, slots: [[480, 900]], message: 'Locución OMAR_05: fuera de este horario no entra la llamada.' },
      { id: 2, name: 'Nochebuena', date: '2000-12-24', yearly: true, slots: [[480, 900]], message: 'Locución OMAR_05: fuera de este horario no entra la llamada.' },
      { id: 3, name: 'Nochevieja', date: '2000-12-31', yearly: true, slots: [[480, 900]], message: 'Locución OMAR_05: fuera de este horario no entra la llamada.' },
    ],
    // Los festivos (rojo en lectivo, naranja en verano) suenan como el periodo en el que caen: no llevan mensaje propio.
    holidayCalendarIds: [1],
  },
];
