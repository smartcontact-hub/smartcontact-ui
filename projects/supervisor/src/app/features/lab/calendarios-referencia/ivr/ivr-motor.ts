/**
 * Motor del prototipo «Calendarios IVR»: cada calendario tiene varios horarios con vigencia (MM-DD a MM-DD) y prioridad,
 * pintados en una parrilla semanal de tramos de 30 minutos, y días especiales (puntuales o anuales, cerrados o con tramos
 * reducidos) con su prioridad y su mensaje. Orden de evaluación: días especiales por prioridad → horario activo por
 * vigencia → tramo semanal del día y hora → mensaje asociado. Port literal del HTML original.
 */

export const DAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
export const DAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export const TIMEZONES = ['Europe/Madrid', 'Atlantic/Canary', 'UTC', 'America/Bogota', 'America/Mexico_City', 'America/Santiago'] as const;

export interface Intervalo {
  start: string;
  end: string;
}
export interface HorarioIvr {
  id: string;
  name: string;
  validityStart: string;
  validityEnd: string;
  priority: number;
  outMessage: string;
  /** Por día (0 = lunes), los tramos de 30 minutos abiertos (0…47). */
  blocks: Record<number, number[]>;
}
export interface DiaEspecialIvr {
  id: string;
  name: string;
  date: string;
  repeatsYearly: boolean;
  mode: 'closed' | 'custom';
  priority: number;
  intervals: Intervalo[];
  message: string;
}
export interface CalendarioIvr {
  id: string;
  name: string;
  description: string;
  timezone: string;
  inHoursRoute: string;
  fallbackMessage: string;
  schedules: HorarioIvr[];
  exceptions: DiaEspecialIvr[];
}
export interface EstadoIvr {
  activeCalendarId: string;
  activeScheduleId: string;
  activeTab: 'horarios' | 'especiales' | 'simulador' | 'exportar';
  status: string;
  simDate: string;
  calendars: CalendarioIvr[];
}
export interface Comprobacion {
  type: 'ok' | 'warn' | 'danger';
  text: string;
}
export interface Resultado {
  status: 'open' | 'closed';
  title: string;
  message: string;
  source: string;
  route: string;
  details: string[];
}

export const uidIvr = (prefix = 'id'): string => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export function timeToSlot(time: string): number {
  const [h, m] = String(time).split(':').map(Number);
  return Math.max(0, Math.min(48, h * 2 + (m >= 30 ? 1 : 0)));
}
export function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2);
  return `${String(h).padStart(2, '0')}:${slot % 2 ? '30' : '00'}`;
}
export function normalizeSlots(slots: number[] | undefined): number[] {
  return [...new Set(slots ?? [])].filter((n) => n >= 0 && n < 48).sort((a, b) => a - b);
}
export function rangeSlots(start: string, end: string): number[] {
  const out: number[] = [];
  for (let i = timeToSlot(start); i < timeToSlot(end); i++) out.push(i);
  return out;
}
export function makeEmptyBlocks(): Record<number, number[]> {
  const blocks: Record<number, number[]> = {};
  DAY_NAMES.forEach((_, i) => (blocks[i] = []));
  return blocks;
}
export function withRanges(days: number[], ranges: [string, string][]): Record<number, number[]> {
  const blocks = makeEmptyBlocks();
  days.forEach((day) => ranges.forEach(([s, e]) => (blocks[day] = normalizeSlots([...(blocks[day] ?? []), ...rangeSlots(s, e)]))));
  return blocks;
}
export function slotsToIntervals(slots: number[] | undefined): Intervalo[] {
  const sorted = normalizeSlots(slots);
  if (!sorted.length) return [];
  const intervals: Intervalo[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) prev = current;
    else {
      intervals.push({ start: slotToTime(start), end: slotToTime(prev + 1) });
      start = current;
      prev = current;
    }
  }
  intervals.push({ start: slotToTime(start), end: slotToTime(prev + 1) });
  return intervals;
}

export function toDatetimeLocal(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function getDateParts(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  return {
    iso: `${date.getFullYear()}-${month}-${day}`,
    mmdd: `${month}-${day}`,
    dayIndex: (date.getDay() + 6) % 7,
    time: `${hh}:${String(date.getMinutes()).padStart(2, '0')}`,
    slot: timeToSlot(`${hh}:${date.getMinutes() < 30 ? '00' : '30'}`),
  };
}

function mmddInRange(mmdd: string, start: string, end: string): boolean {
  if (!start || !end) return true;
  if (start <= end) return mmdd >= start && mmdd <= end;
  return mmdd >= start || mmdd <= end;
}

function findActiveSchedule(cal: CalendarioIvr, date: Date, fallback: HorarioIvr): HorarioIvr {
  const parts = getDateParts(date);
  const candidates = cal.schedules
    .filter((s) => mmddInRange(parts.mmdd, s.validityStart, s.validityEnd))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return candidates[0] ?? fallback;
}

function matchesException(ex: DiaEspecialIvr, parts: { iso: string; mmdd: string }): boolean {
  if (!ex.date) return false;
  return ex.repeatsYearly ? ex.date.slice(5) === parts.mmdd : ex.date === parts.iso;
}

export function evaluateCalendar(cal: CalendarioIvr, dateValue: string, fallback: HorarioIvr): Resultado {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) {
    return { status: 'closed', title: 'Fecha no válida', message: 'Selecciona una fecha y hora válidas para ejecutar la simulación.', source: 'Simulador', route: 'No evaluar', details: [] };
  }
  const parts = getDateParts(date);
  const matching = cal.exceptions.filter((ex) => matchesException(ex, parts)).sort((a, b) => (b.priority || 0) - (a.priority || 0));

  if (matching.length) {
    const ex = matching[0];
    const tramos = (ex.intervals ?? []).map((i) => `${i.start}-${i.end}`).join(', ');
    if (ex.mode === 'closed') {
      return {
        status: 'closed', title: 'Fuera de hora', message: ex.message || cal.fallbackMessage, source: `Día especial · ${ex.name}`,
        route: 'Reproducir mensaje especial',
        details: [`Regla aplicada: ${ex.name}`, `Prioridad: ${ex.priority || 0}`, ex.repeatsYearly ? 'Se repite todos los años' : 'Fecha puntual'],
      };
    }
    const openNow = (ex.intervals ?? []).some((i) => parts.time >= i.start && parts.time < i.end);
    if (openNow) {
      return {
        status: 'open', title: 'En hora',
        message: 'El día especial define un horario reducido y la llamada cae dentro de un tramo abierto.',
        source: `Día especial · ${ex.name}`, route: cal.inHoursRoute,
        details: [`Regla aplicada: ${ex.name}`, `Tramos: ${tramos || 'sin tramos'}`, 'Acción IVR: continuar flujo'],
      };
    }
    return {
      status: 'closed', title: 'Fuera de hora', message: ex.message || cal.fallbackMessage, source: `Día especial · ${ex.name}`,
      route: 'Reproducir mensaje especial',
      details: [`Regla aplicada: ${ex.name}`, `Tramos abiertos: ${tramos || 'ninguno'}`, 'La hora consultada no cae dentro de los tramos especiales'],
    };
  }

  const schedule = findActiveSchedule(cal, date, fallback);
  const openNow = normalizeSlots(schedule.blocks?.[parts.dayIndex]).includes(parts.slot);
  return {
    status: openNow ? 'open' : 'closed',
    title: openNow ? 'En hora' : 'Fuera de hora',
    message: openNow
      ? 'La llamada cae dentro del horario semanal activo. El IVR debería continuar con el flujo normal.'
      : schedule.outMessage || cal.fallbackMessage,
    source: `Horario · ${schedule.name}`,
    route: openNow ? cal.inHoursRoute : 'Reproducir mensaje fuera de hora',
    details: [
      `Horario activo por vigencia: ${schedule.name}`,
      `Día evaluado: ${DAY_NAMES[parts.dayIndex]}`,
      `Franja evaluada: ${slotToTime(parts.slot)}-${slotToTime(Math.min(48, parts.slot + 1))}`,
    ],
  };
}

export function validateCalendar(cal: CalendarioIvr): Comprobacion[] {
  const checks: Comprobacion[] = [];
  checks.push({
    type: cal.schedules.length >= 2 ? 'ok' : 'danger',
    text: cal.schedules.length >= 2
      ? 'El calendario tiene al menos dos horarios o periodos configurados.'
      : 'Falta el requisito mínimo: cada calendario debe tener al menos dos horarios.',
  });
  const empty = cal.schedules.filter((s) => DAY_NAMES.every((_, i) => normalizeSlots(s.blocks?.[i]).length === 0));
  checks.push({
    type: empty.length ? 'warn' : 'ok',
    text: empty.length ? `Hay horarios sin tramos abiertos: ${empty.map((s) => s.name).join(', ')}.` : 'Todos los horarios tienen al menos un tramo abierto.',
  });
  const noMessage = cal.schedules.filter((s) => !String(s.outMessage || '').trim());
  checks.push({
    type: noMessage.length ? 'warn' : 'ok',
    text: noMessage.length ? `Hay horarios sin mensaje de fuera de hora: ${noMessage.map((s) => s.name).join(', ')}.` : 'Cada horario tiene su mensaje de fuera de hora.',
  });
  const keys: Record<string, number> = {};
  cal.exceptions.forEach((ex) => {
    const k = ex.repeatsYearly ? `annual:${ex.date?.slice(5)}` : `exact:${ex.date}`;
    keys[k] = (keys[k] || 0) + 1;
  });
  const duplicated = Object.values(keys).some((n) => n > 1);
  checks.push({
    type: duplicated ? 'warn' : 'ok',
    text: duplicated ? 'Existen días especiales duplicados para la misma fecha; se aplicará el de mayor prioridad.' : 'No se detectan fechas especiales duplicadas.',
  });
  const exNoMsg = cal.exceptions.filter((ex) => !String(ex.message || '').trim());
  checks.push({
    type: exNoMsg.length ? 'warn' : 'ok',
    text: exNoMsg.length ? `Hay días especiales sin mensaje: ${exNoMsg.map((ex) => ex.name).join(', ')}.` : 'Todos los días especiales tienen mensaje asociado.',
  });
  return checks;
}

export function summarizeDay(schedule: HorarioIvr, dayIndex: number): string {
  const intervals = slotsToIntervals(schedule.blocks?.[dayIndex]);
  return intervals.length ? intervals.map((i) => `${i.start}-${i.end}`).join(' · ') : 'cerrado';
}

export function duplicateExceptionWarning(ex: DiaEspecialIvr, cal: CalendarioIvr): boolean {
  const key = ex.repeatsYearly ? ex.date?.slice(5) : ex.date;
  if (!key) return false;
  return cal.exceptions.some((o) => o.id !== ex.id && o.repeatsYearly === ex.repeatsYearly && (o.repeatsYearly ? o.date?.slice(5) === key : o.date === key));
}

export function buildExport(cal: CalendarioIvr) {
  return {
    id: cal.id,
    name: cal.name,
    description: cal.description,
    timezone: cal.timezone,
    inHoursRoute: cal.inHoursRoute,
    fallbackMessage: cal.fallbackMessage,
    schedules: cal.schedules.map((s) => ({
      id: s.id,
      name: s.name,
      validity: { start: s.validityStart, end: s.validityEnd },
      priority: Number(s.priority || 0),
      outOfHoursMessage: s.outMessage,
      weeklyRules: DAY_NAMES.map((day, index) => ({ day, openIntervals: slotsToIntervals(s.blocks?.[index]) })),
    })),
    specialDays: cal.exceptions.map((ex) => ({
      id: ex.id,
      name: ex.name,
      date: ex.date,
      repeatsYearly: Boolean(ex.repeatsYearly),
      mode: ex.mode,
      priority: Number(ex.priority || 0),
      openIntervals: ex.mode === 'custom' ? ex.intervals ?? [] : [],
      message: ex.message,
    })),
  };
}

/** Los datos de ejemplo del prototipo. */
export function createDefaultState(): EstadoIvr {
  return {
    activeCalendarId: 'cal_enel',
    activeScheduleId: 'sch_invierno',
    activeTab: 'horarios',
    status: 'Borrador',
    simDate: toDatetimeLocal(new Date()),
    calendars: [
      {
        id: 'cal_enel',
        name: 'ENEL',
        description: 'Calendario general para IVR con horarios por periodo y días especiales.',
        timezone: 'Europe/Madrid',
        inHoursRoute: 'Continuar flujo de atención',
        fallbackMessage: 'Nuestro horario de atención es de lunes a viernes. Por favor, vuelve a contactar dentro del horario indicado.',
        schedules: [
          {
            id: 'sch_invierno', name: 'Periodo invierno', validityStart: '10-01', validityEnd: '05-31', priority: 10,
            outMessage: 'Nuestro horario de atención en periodo de invierno es de lunes a viernes de 08:00 a 13:00 y de 15:00 a 18:30.',
            blocks: withRanges([0, 1, 2, 3, 4], [['08:00', '13:00'], ['15:00', '18:30']]),
          },
          {
            id: 'sch_verano', name: 'Periodo verano', validityStart: '06-01', validityEnd: '09-30', priority: 20,
            outMessage: 'Nuestro horario de verano es de lunes a viernes de 08:00 a 15:00.',
            blocks: withRanges([0, 1, 2, 3, 4], [['08:00', '15:00']]),
          },
        ],
        exceptions: [
          { id: 'ex_navidad', name: 'Navidad', date: '2025-12-25', repeatsYearly: true, mode: 'closed', priority: 100, intervals: [], message: 'Por ser hoy Navidad no prestamos servicio. Felices fiestas.' },
          { id: 'ex_huelga', name: 'Huelga / servicios mínimos', date: '2025-02-02', repeatsYearly: false, mode: 'custom', priority: 90, intervals: [{ start: '08:00', end: '12:00' }], message: 'Hoy nuestros servicios son mínimos. Te atenderemos dentro del horario reducido.' },
          { id: 'ex_halloween', name: 'Halloween', date: '2025-10-31', repeatsYearly: true, mode: 'closed', priority: 80, intervals: [], message: 'Feliz Halloween. Hoy no hay servicio.' },
          { id: 'ex_cena', name: 'Cena de Navidad', date: '2025-12-30', repeatsYearly: true, mode: 'custom', priority: 80, intervals: [{ start: '08:00', end: '14:00' }], message: 'Por cena de Navidad nos vamos antes. Felices fiestas.' },
        ],
      },
    ],
  };
}
