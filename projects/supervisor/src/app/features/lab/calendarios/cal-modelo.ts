/**
 * PROTOTIPO DE DISCOVERY (rama experimental, no se funde): el modelo de calendarios y horarios que se prueba con
 * posventa. Un CALENDARIO es lo que usa un servicio: un horario para todo el año, periodos que cambian de horario en
 * unas fechas, los festivos oficiales de su ubicación y sus propios días especiales. Un HORARIO es solo una semana tipo y
 * se puede usar en muchos calendarios. Un DÍA ESPECIAL es un objeto con sus fechas que vale para uno o varios
 * calendarios a la vez (así un festivo propio se da de alta una vez para dos calendarios).
 *
 * Qué manda en un día, de más a menos: día especial, festivo oficial, el periodo más corto que lo cubre y el horario de
 * todo el año. La locución de fuera de horario es la del periodo (o la del calendario); un festivo hereda la del periodo
 * en el que cae y un día especial puede llevar la suya.
 */

/** `[inicio, fin]` en minutos desde las 00:00, con `fin > inicio` (1440 es el final del día). */
export type Franja = readonly [number, number];
/** Las franjas de cada día, de lunes (0) a domingo (6). Un día sin franjas está cerrado. */
export type Semana = readonly (readonly Franja[])[];

export interface Horario {
  readonly id: number;
  readonly nombre: string;
  readonly semana: Semana;
}

export type ColorDePeriodo = 'info' | 'violet' | 'success' | 'primary';
export const COLORES: readonly ColorDePeriodo[] = ['info', 'violet', 'success', 'primary'];

export interface Periodo {
  readonly id: number;
  readonly nombre: string;
  /** `MM-DD`. Si `desde` es posterior a `hasta`, el periodo cruza el año (del 15 de diciembre al 15 de enero). */
  readonly desde: string;
  readonly hasta: string;
  /** `null`: se repite cada año. */
  readonly anio: number | null;
  readonly horarioId: number;
  /** `null`: la del calendario. */
  readonly locucion: string | null;
  readonly color: ColorDePeriodo;
}

export interface Calendario {
  readonly id: number;
  readonly nombre: string;
  readonly zona: string;
  readonly horarioId: number;
  /** Lo que suena fuera de horario cuando no manda nada más concreto. */
  readonly locucion: string;
  readonly periodos: readonly Periodo[];
  /** Id de `UBICACIONES`; `null`, sin festivos oficiales. */
  readonly ubicacion: string | null;
  /** Los servicios que lo eligen en su ficha (decorativo en el prototipo). */
  readonly servicios: readonly string[];
}

export interface DiaEspecial {
  readonly id: number;
  readonly nombre: string;
  /** Fechas ISO. Con `cadaAnio`, valen su día y mes de cualquier año. */
  readonly fechas: readonly string[];
  readonly cadaAnio: boolean;
  /** Sin franjas: cerrado todo el día. */
  readonly franjas: readonly Franja[];
  /** `null`: la del periodo en el que cae. */
  readonly locucion: string | null;
  readonly calendarioIds: readonly number[];
}

export interface Estado {
  readonly horarios: readonly Horario[];
  readonly calendarios: readonly Calendario[];
  readonly especiales: readonly DiaEspecial[];
}

/* ─────────────────────────────── El reloj del prototipo ─────────────────────────────── */

/** Hoy en el prototipo: así el papel de 2025 es el año en curso y el 28 de enero está por llegar. */
export const HOY = '2025-01-08';
export const AHORA_MINUTOS = 10 * 60 + 30;
export const ANIO = 2025;

/* ─────────────────────────────── Fechas ─────────────────────────────── */

const MS_DIA = 86_400_000;
const utc = (iso: string): number => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const isoDe = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
export const sumarDias = (iso: string, n: number): string => isoDe(utc(iso) + n * MS_DIA);
/** Lunes = 0. */
export const diaDeLaSemana = (iso: string): number => (new Date(utc(iso)).getUTCDay() + 6) % 7;
export function fechasEntre(desde: string, hasta: string): string[] {
  const [a, b] = desde <= hasta ? [desde, hasta] : [hasta, desde];
  const n = Math.round((utc(b) - utc(a)) / MS_DIA);
  return Array.from({ length: n + 1 }, (_, i) => sumarDias(a, i));
}
export const diasDelAnio = (anio: number): string[] => fechasEntre(`${anio}-01-01`, `${anio}-12-31`);

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** «28 de enero». */
export const fechaLarga = (iso: string): string => `${+iso.slice(8, 10)} de ${MESES[+iso.slice(5, 7) - 1]}`;
/** «martes, 28 de enero». */
export const fechaConDia = (iso: string): string => `${DIAS[diaDeLaSemana(iso)]}, ${fechaLarga(iso)}`;
/** «28 ene». */
export const fechaCorta = (iso: string): string => `${+iso.slice(8, 10)} ${MESES_CORTOS[+iso.slice(5, 7) - 1]}`;
/** «1 jun» desde `MM-DD`. */
export const mesDiaCorto = (md: string): string => `${+md.slice(3, 5)} ${MESES_CORTOS[+md.slice(0, 2) - 1]}`;

/* ─────────────────────────────── Horas ─────────────────────────────── */

export const horaDe = (min: number): string => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
export const minutosDe = (hhmm: string): number => +hhmm.slice(0, 2) * 60 + +hhmm.slice(3, 5);
export const textoDeFranjas = (franjas: readonly Franja[]): string =>
  franjas.length === 0 ? 'Cerrado' : franjas.map((f) => (f[0] === 0 && f[1] === 1440 ? 'Todo el día' : `${horaDe(f[0])} a ${horaDe(f[1])}`)).join(' y ');

const claveFranjas = (f: readonly Franja[]): string => f.map((x) => x.join('-')).join(',');

/** «L-V 09:00 a 18:00», «L-J 08:00 a 14:00 y 15:30 a 18:00; V 08:00 a 14:00». */
export function resumenDeSemana(semana: Semana): string {
  const grupos: { dias: number[]; franjas: readonly Franja[] }[] = [];
  semana.forEach((franjas, dia) => {
    if (franjas.length === 0) return;
    const g = grupos.find((x) => claveFranjas(x.franjas) === claveFranjas(franjas));
    if (g) g.dias.push(dia);
    else grupos.push({ dias: [dia], franjas });
  });
  if (grupos.length === 0) return 'Siempre cerrado';
  const dias = (ds: number[]): string => {
    const seguidos = ds.every((d, i) => i === 0 || d === ds[i - 1]! + 1);
    if (ds.length === 7) return 'Todos los días';
    if (seguidos && ds.length > 2) return `${LETRAS[ds[0]!]}-${LETRAS[ds[ds.length - 1]!]}`;
    return ds.map((d) => LETRAS[d]).join(', ');
  };
  const texto = (fr: readonly Franja[]): string => (claveFranjas(fr) === '0-1440' ? 'todo el día' : textoDeFranjas(fr));
  if (grupos.length === 1 && grupos[0]!.dias.length === 7 && claveFranjas(grupos[0]!.franjas) === '0-1440') return 'Siempre abierto';
  return grupos.map((g) => `${dias(g.dias)} ${texto(g.franjas)}`).join('; ');
}

export const minutosDeLaSemana = (semana: Semana): number => semana.reduce((n, d) => n + d.reduce((m, f) => m + (f[1] - f[0]), 0), 0);

/* ─────────────────────────────── Festivos oficiales ─────────────────────────────── */

export interface FestivoOficial {
  readonly fecha: string;
  readonly nombre: string;
}

export interface Ubicacion {
  readonly id: string;
  readonly nombre: string;
  /** Lo que se lee en la lista: «Barcelona, Cataluña». */
  readonly etiqueta: string;
  readonly padre: string | null;
  readonly nivel: 'país' | 'comunidad' | 'municipio';
  readonly festivos: readonly FestivoOficial[];
}

const f = (fecha: string, nombre: string): FestivoOficial => ({ fecha, nombre });

/**
 * DATOS DE EJEMPLO del prototipo: en producción saldrían de un servicio por país, comunidad y municipio, y se
 * renovarían solos cada año. 2025 está completo para España, Cataluña y Barcelona (el caso de la misión 2).
 */
export const UBICACIONES: readonly Ubicacion[] = [
  {
    id: 'es', nombre: 'España', etiqueta: 'España (solo nacionales)', padre: null, nivel: 'país',
    festivos: [
      f('2025-01-01', 'Año Nuevo'), f('2025-01-06', 'Epifanía del Señor'), f('2025-04-18', 'Viernes Santo'), f('2025-05-01', 'Fiesta del Trabajo'),
      f('2025-08-15', 'Asunción de la Virgen'), f('2025-10-12', 'Fiesta Nacional de España'), f('2025-11-01', 'Todos los Santos'),
      f('2025-12-06', 'Día de la Constitución'), f('2025-12-08', 'Inmaculada Concepción'), f('2025-12-25', 'Navidad'),
      f('2026-01-01', 'Año Nuevo'), f('2026-01-06', 'Epifanía del Señor'), f('2026-04-03', 'Viernes Santo'), f('2026-05-01', 'Fiesta del Trabajo'),
      f('2026-08-15', 'Asunción de la Virgen'), f('2026-10-12', 'Fiesta Nacional de España'), f('2026-11-01', 'Todos los Santos'),
      f('2026-12-06', 'Día de la Constitución'), f('2026-12-08', 'Inmaculada Concepción'), f('2026-12-25', 'Navidad'),
    ],
  },
  {
    id: 'es-ct', nombre: 'Cataluña', etiqueta: 'Cataluña', padre: 'es', nivel: 'comunidad',
    festivos: [
      f('2025-04-21', 'Lunes de Pascua'), f('2025-06-24', 'Sant Joan'), f('2025-09-11', 'Diada Nacional de Catalunya'), f('2025-12-26', 'Sant Esteve'),
      f('2026-04-06', 'Lunes de Pascua'), f('2026-06-24', 'Sant Joan'), f('2026-09-11', 'Diada Nacional de Catalunya'), f('2026-12-26', 'Sant Esteve'),
    ],
  },
  {
    id: 'es-ct-bcn', nombre: 'Barcelona', etiqueta: 'Barcelona, Cataluña', padre: 'es-ct', nivel: 'municipio',
    festivos: [f('2025-06-09', 'Lunes de Pascua Granada'), f('2025-09-24', 'La Mercè'), f('2026-05-25', 'Lunes de Pascua Granada'), f('2026-09-24', 'La Mercè')],
  },
  {
    id: 'es-md', nombre: 'Comunidad de Madrid', etiqueta: 'Comunidad de Madrid', padre: 'es', nivel: 'comunidad',
    festivos: [f('2025-04-17', 'Jueves Santo'), f('2025-05-02', 'Fiesta de la Comunidad de Madrid'), f('2025-07-25', 'Santiago Apóstol'), f('2026-04-02', 'Jueves Santo'), f('2026-05-02', 'Fiesta de la Comunidad de Madrid')],
  },
  {
    id: 'es-md-mad', nombre: 'Madrid', etiqueta: 'Madrid, Comunidad de Madrid', padre: 'es-md', nivel: 'municipio',
    festivos: [f('2025-05-15', 'San Isidro'), f('2025-11-10', 'Nuestra Señora de la Almudena'), f('2026-05-15', 'San Isidro'), f('2026-11-09', 'Nuestra Señora de la Almudena')],
  },
  {
    id: 'es-an', nombre: 'Andalucía', etiqueta: 'Andalucía', padre: 'es', nivel: 'comunidad',
    festivos: [f('2025-02-28', 'Día de Andalucía'), f('2025-04-17', 'Jueves Santo'), f('2026-02-28', 'Día de Andalucía'), f('2026-04-02', 'Jueves Santo')],
  },
  {
    id: 'es-an-sev', nombre: 'Sevilla', etiqueta: 'Sevilla, Andalucía', padre: 'es-an', nivel: 'municipio',
    festivos: [f('2025-05-30', 'San Fernando'), f('2025-06-19', 'Corpus Christi'), f('2026-05-30', 'San Fernando'), f('2026-06-04', 'Corpus Christi')],
  },
  {
    id: 'es-cn', nombre: 'Canarias', etiqueta: 'Canarias', padre: 'es', nivel: 'comunidad',
    festivos: [f('2025-04-17', 'Jueves Santo'), f('2025-05-30', 'Día de Canarias'), f('2026-04-02', 'Jueves Santo'), f('2026-05-30', 'Día de Canarias')],
  },
  {
    id: 'es-cn-lpa', nombre: 'Las Palmas de Gran Canaria', etiqueta: 'Las Palmas de Gran Canaria, Canarias', padre: 'es-cn', nivel: 'municipio',
    festivos: [f('2025-06-24', 'Fundación de la ciudad'), f('2025-09-08', 'Virgen del Pino'), f('2026-06-24', 'Fundación de la ciudad'), f('2026-09-08', 'Virgen del Pino')],
  },
];

export const ubicacion = (id: string | null): Ubicacion | undefined => UBICACIONES.find((u) => u.id === id);

/** La ubicación y las de encima: Barcelona, Cataluña, España. */
export function cadenaDe(id: string | null): Ubicacion[] {
  const out: Ubicacion[] = [];
  let u = ubicacion(id);
  while (u) {
    out.push(u);
    u = ubicacion(u.padre);
  }
  return out;
}

export interface FestivoDe extends FestivoOficial {
  readonly de: string;
}

/** Los festivos oficiales de una ubicación en un año, con de dónde viene cada uno, por fecha. */
export function festivosDe(id: string | null, anio: number): FestivoDe[] {
  return cadenaDe(id)
    .flatMap((u) => u.festivos.filter((x) => x.fecha.startsWith(String(anio))).map((x) => ({ ...x, de: u.nombre })))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** «13 entre semana: 7 de España, 4 de Cataluña y 2 de Barcelona». */
export function resumenDeFestivos(id: string | null, anio: number): string {
  const entreSemana = festivosDe(id, anio).filter((x) => diaDeLaSemana(x.fecha) < 5);
  if (!id) return 'Sin festivos oficiales: abre como cualquier otro día.';
  const partes = cadenaDe(id)
    .reverse()
    .map((u) => ({ u, n: entreSemana.filter((x) => x.de === u.nombre).length }))
    .filter((p) => p.n > 0)
    .map((p) => `${p.n} de ${p.u.nombre}`);
  const lista = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0] ?? '';
  return `${entreSemana.length} festivos entre semana en ${anio}: ${lista}.`;
}

/* ─────────────────────────────── Locuciones ─────────────────────────────── */

/** Los audios que ya hay en la plataforma (decorativo: no suenan en el prototipo). */
export const LOCUCIONES: readonly string[] = ['Cerrado_general', 'AU_01', 'AU_02', 'AU_03', 'AU_04', 'AU_05', 'Fuera_de_horario_ES', 'Fuera_de_horario_CA'];

/* ─────────────────────────────── Qué manda en un día ─────────────────────────────── */

export type Regla = 'base' | 'periodo' | 'festivo' | 'especial';

export interface DiaResuelto {
  readonly fecha: string;
  readonly franjas: readonly Franja[];
  readonly regla: Regla;
  readonly horario: Horario | null;
  readonly periodo: Periodo | null;
  readonly festivo: FestivoDe | null;
  readonly especial: DiaEspecial | null;
  readonly locucion: string;
}

/** Cuántos días dura un periodo (para saber cuál es el más concreto). */
export function duracion(p: Pick<Periodo, 'desde' | 'hasta'>): number {
  const a = utc(`2001-${p.desde}`);
  const b = utc(`2001-${p.hasta}`);
  return (b >= a ? b - a : b + 365 * MS_DIA - a) / MS_DIA + 1;
}

export function periodoCubre(p: Pick<Periodo, 'desde' | 'hasta' | 'anio'>, iso: string): boolean {
  if (p.anio !== null && +iso.slice(0, 4) !== p.anio) return false;
  const md = iso.slice(5);
  return p.desde <= p.hasta ? md >= p.desde && md <= p.hasta : md >= p.desde || md <= p.hasta;
}

/** El periodo que manda en una fecha: el más corto de los que la cubren; a igualdad, el último añadido. */
export function periodoDe(cal: Calendario, iso: string): Periodo | null {
  let mejor: Periodo | null = null;
  for (const p of cal.periodos) {
    if (!periodoCubre(p, iso)) continue;
    if (!mejor || duracion(p) <= duracion(mejor)) mejor = p;
  }
  return mejor;
}

export const especialCubre = (e: DiaEspecial, iso: string): boolean =>
  e.fechas.includes(iso) || (e.cadaAnio && e.fechas.some((x) => x.slice(5) === iso.slice(5)));

export function resolver(estado: Estado, cal: Calendario, iso: string): DiaResuelto {
  const periodo = periodoDe(cal, iso);
  const horario = estado.horarios.find((h) => h.id === (periodo ? periodo.horarioId : cal.horarioId)) ?? null;
  const locucion = periodo?.locucion ?? cal.locucion;
  const base = { fecha: iso, horario, periodo, festivo: null, especial: null, locucion };

  const especial = [...estado.especiales].reverse().find((e) => e.calendarioIds.includes(cal.id) && especialCubre(e, iso));
  if (especial) return { ...base, franjas: especial.franjas, regla: 'especial', especial, locucion: especial.locucion ?? locucion };

  const festivo = festivosDe(cal.ubicacion, +iso.slice(0, 4)).find((x) => x.fecha === iso);
  if (festivo) return { ...base, franjas: [], regla: 'festivo', festivo };

  const franjas = horario?.semana[diaDeLaSemana(iso)] ?? [];
  return { ...base, franjas, regla: periodo ? 'periodo' : 'base' };
}

/** Lo que se compara en la prueba: las horas del día y lo que suena fuera de ellas. */
export const firma = (d: DiaResuelto): string => `${claveFranjas(d.franjas)}|${d.locucion}`;

/** «Abierto hasta las 14:00», «Cerrado, abre mañana a las 08:00». */
export function ahoraEn(estado: Estado, cal: Calendario): { abierto: boolean; texto: string } {
  const hoy = resolver(estado, cal, HOY);
  const dentro = hoy.franjas.find((x) => AHORA_MINUTOS >= x[0] && AHORA_MINUTOS < x[1]);
  if (dentro) return { abierto: true, texto: dentro[1] === 1440 ? 'Abierto todo el día' : `Abierto hasta las ${horaDe(dentro[1])}` };
  const luego = hoy.franjas.find((x) => x[0] > AHORA_MINUTOS);
  if (luego) return { abierto: false, texto: `Cerrado, abre a las ${horaDe(luego[0])}` };
  for (let i = 1; i <= 21; i++) {
    const d = resolver(estado, cal, sumarDias(HOY, i));
    if (d.franjas.length) {
      const cuando = i === 1 ? 'mañana' : `el ${DIAS[diaDeLaSemana(d.fecha)]}`;
      return { abierto: false, texto: `Cerrado, abre ${cuando} a las ${horaDe(d.franjas[0]![0])}` };
    }
  }
  return { abierto: false, texto: 'Cerrado' };
}

/** Los calendarios que usan un horario, para todo el año o en algún periodo. */
export const usosDe = (estado: Estado, horarioId: number): Calendario[] =>
  estado.calendarios.filter((c) => c.horarioId === horarioId || c.periodos.some((p) => p.horarioId === horarioId));

export const siguienteId = (lista: readonly { id: number }[]): number => lista.reduce((m, x) => Math.max(m, x.id), 0) + 1;

/** «Calendario» y «Calendario (2)». */
export function nombreLibre(base: string, usados: readonly string[]): string {
  if (!usados.includes(base)) return base;
  let n = 2;
  while (usados.includes(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}

export const ZONAS: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'Europe/Madrid', label: 'Península y Baleares (Europe/Madrid)' },
  { value: 'Atlantic/Canary', label: 'Canarias (Atlantic/Canary)' },
  { value: 'America/Lima', label: 'Perú (America/Lima)' },
  { value: 'America/Mexico_City', label: 'México (America/Mexico_City)' },
];
