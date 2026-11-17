/**
 * PROTOTIPO DE DISCOVERY: los datos de partida de cada misión, lo que debería quedar al acabarla y cómo se corrige.
 * El caso de la misión 2 es un calendario real de posventa ANONIMIZADO (otro nombre de cliente y de locuciones): el
 * repositorio es público.
 */
import {
  ANIO,
  type Calendario,
  type DiaEspecial,
  diasDelAnio,
  type Estado,
  fechaConDia,
  firma,
  type Franja,
  type Horario,
  minutosDe,
  resolver,
  type Semana,
  textoDeFranjas,
} from './cal-modelo';

export type Mision = 1 | 2;

const fr = (a: string, b: string): Franja => [minutosDe(a), minutosDe(b)];
const lv = (franjas: Franja[]): Semana => [franjas, franjas, franjas, franjas, franjas, [], []];

const COMPLETA: Semana = [
  [fr('08:00', '14:00'), fr('15:30', '18:00')],
  [fr('08:00', '14:00'), fr('15:30', '18:00')],
  [fr('08:00', '14:00'), fr('15:30', '18:00')],
  [fr('08:00', '14:00'), fr('15:30', '18:00')],
  [fr('08:00', '14:00')],
  [],
  [],
];

const HORARIOS: readonly Horario[] = [
  { id: 1, nombre: 'Oficina L-V 9 a 18', semana: lv([fr('09:00', '18:00')]) },
  { id: 2, nombre: 'Verano L-V 8 a 15', semana: lv([fr('08:00', '15:00')]) },
  { id: 3, nombre: 'Guardias 24 h', semana: Array.from({ length: 7 }, () => [[0, 1440] as Franja]) },
  { id: 4, nombre: 'Mañanas L-V 9 a 14', semana: lv([fr('09:00', '14:00')]) },
];

const CALENDARIOS: readonly Calendario[] = [
  {
    id: 1, nombre: 'Atención Madrid', zona: 'Europe/Madrid', horarioId: 1, locucion: 'Cerrado_general', ubicacion: 'es-md-mad',
    periodos: [{ id: 1, nombre: 'Verano', desde: '07-01', hasta: '08-31', anio: null, horarioId: 2, locucion: null, color: 'info' }],
    servicios: ['Atención al cliente Madrid', 'Ventas Madrid'],
  },
  {
    id: 2, nombre: 'Soporte Sevilla', zona: 'Europe/Madrid', horarioId: 1, locucion: 'Cerrado_general', ubicacion: 'es-an-sev',
    periodos: [{ id: 1, nombre: 'Verano', desde: '06-15', hasta: '09-15', anio: null, horarioId: 2, locucion: null, color: 'info' }],
    servicios: ['Soporte Sur'],
  },
  { id: 3, nombre: 'Guardias técnicas', zona: 'Europe/Madrid', horarioId: 3, locucion: 'Cerrado_general', ubicacion: null, periodos: [], servicios: ['Incidencias 24 h'] },
  { id: 4, nombre: 'Atención Canarias', zona: 'Atlantic/Canary', horarioId: 1, locucion: 'Cerrado_general', ubicacion: 'es-cn-lpa', periodos: [], servicios: ['Atención al cliente Canarias'] },
  { id: 5, nombre: 'Secretaría Barcelona', zona: 'Europe/Madrid', horarioId: 4, locucion: 'AU_03', ubicacion: 'es-ct-bcn', periodos: [], servicios: ['Secretaría'] },
];

const ESPECIALES: readonly DiaEspecial[] = [
  { id: 1, nombre: 'Nochebuena y Nochevieja', fechas: ['2025-12-24', '2025-12-31'], cadaAnio: true, franjas: [fr('09:00', '14:00')], locucion: null, calendarioIds: [1, 2, 4] },
];

/* ───────────── El caso de la misión 2 ya montado: así debería quedar (y así arranca la misión 1) ───────────── */

export const NOMBRE_MISION_2 = 'Oficinas Barcelona';

const HORARIO_COMPLETA: Horario = { id: 5, nombre: 'Jornada completa', semana: COMPLETA };

const OFICINAS: Calendario = {
  id: 6, nombre: NOMBRE_MISION_2, zona: 'Europe/Madrid', horarioId: 5, locucion: 'AU_03', ubicacion: 'es-ct-bcn',
  periodos: [{ id: 1, nombre: 'Jornada intensiva', desde: '06-01', hasta: '08-31', anio: null, horarioId: 2, locucion: 'AU_04', color: 'info' }],
  servicios: ['Atención usuario Barcelona'],
};

const REDUCIDA: DiaEspecial = {
  id: 2, nombre: 'Jornada reducida', fechas: ['2025-04-17', '2025-12-24', '2025-12-31'], cadaAnio: false, franjas: [fr('08:00', '15:00')], locucion: 'AU_05', calendarioIds: [6],
};

/** Lo que se carga al empezar cada misión. */
export function estadoInicial(m: Mision): Estado {
  return m === 1
    ? { horarios: [...HORARIOS, HORARIO_COMPLETA], calendarios: [...CALENDARIOS, OFICINAS], especiales: [...ESPECIALES, REDUCIDA] }
    : { horarios: HORARIOS, calendarios: CALENDARIOS, especiales: ESPECIALES };
}

/** El caso de la misión 2 montado como debe quedar (para corregir y para pintar el papel). */
export const ESTADO_OBJETIVO: Estado = estadoInicial(1);
export const CALENDARIO_OBJETIVO = OFICINAS;

export const MISIONES: Record<Mision, { readonly titulo: string; readonly enunciado: string; readonly nota?: string }> = {
  1: {
    titulo: 'Dar de alta un festivo en dos calendarios',
    enunciado:
      'Cada 28 de enero, Santo Tomás de Aquino, no se atiende en todo el día ni en Oficinas Barcelona ni en Secretaría Barcelona. Dalo de alta para que valga todos los años.',
  },
  2: {
    titulo: 'Montar el calendario complejo de posventa',
    enunciado: `Crea el calendario «${NOMBRE_MISION_2}» para que funcione en 2025 tal como dice el papel de posventa.`,
    nota: 'La locución de bienvenida (AU_01) la pone el flujo del servicio, no el calendario.',
  },
};

/* ─────────────────────────────── Corregir ─────────────────────────────── */

export interface Fallo {
  readonly fecha: string;
  readonly esperado: string;
  readonly hay: string;
}

export interface Correccion {
  /** Lo que se lee de un vistazo: «362 de 365 días bien». */
  readonly titular: string;
  readonly bien: number;
  readonly total: number;
  /** Comprobaciones con su resultado, para la tabla del resultado. */
  readonly puntos: readonly { readonly texto: string; readonly ok: boolean }[];
  readonly fallos: readonly Fallo[];
}

const describir = (estado: Estado, cal: Calendario, iso: string): string => {
  const d = resolver(estado, cal, iso);
  return `${textoDeFranjas(d.franjas)}, fuera de horario ${d.locucion}`;
};

function compararAnio(objetivo: Estado, calObj: Calendario, real: Estado, calReal: Calendario): { bien: number; horas: number; fallos: Fallo[] } {
  let bien = 0;
  let horas = 0;
  const fallos: Fallo[] = [];
  for (const iso of diasDelAnio(ANIO)) {
    const a = resolver(objetivo, calObj, iso);
    const b = resolver(real, calReal, iso);
    if (firma(a) === firma(b)) bien++;
    else fallos.push({ fecha: fechaConDia(iso), esperado: describir(objetivo, calObj, iso), hay: describir(real, calReal, iso) });
    if (a.franjas.map((x) => x.join('-')).join() === b.franjas.map((x) => x.join('-')).join()) horas++;
  }
  return { bien, horas, fallos };
}

/** Cuántos días de 2025 cambiaron en los calendarios que la misión no pedía tocar. */
function tocadosDeMas(inicial: Estado, real: Estado, intactos: readonly number[]): number {
  let n = 0;
  for (const id of intactos) {
    const a = inicial.calendarios.find((c) => c.id === id);
    const b = real.calendarios.find((c) => c.id === id);
    if (!a || !b) {
      n += 365;
      continue;
    }
    for (const iso of diasDelAnio(ANIO)) if (firma(resolver(inicial, a, iso)) !== firma(resolver(real, b, iso))) n++;
  }
  return n;
}

export function corregir(m: Mision, real: Estado): Correccion {
  const inicial = estadoInicial(m);
  if (m === 1) return corregirFestivo(FESTIVOS['festivo-1'], real);

  // Misión 2: el calendario nuevo que más se parezca al objetivo (si hay varios), día a día durante 2025.
  const nuevos = real.calendarios.filter((c) => !inicial.calendarios.some((x) => x.id === c.id));
  if (nuevos.length === 0) {
    return { titular: 'No ha creado ningún calendario', bien: 0, total: 365, puntos: [{ texto: 'Hay un calendario nuevo', ok: false }], fallos: [] };
  }
  const notas = nuevos.map((c) => ({ c, r: compararAnio(ESTADO_OBJETIVO, OFICINAS, real, c) })).sort((a, b) => b.r.bien - a.r.bien);
  const { c, r } = notas[0]!;
  const deMas = tocadosDeMas(inicial, real, inicial.calendarios.map((x) => x.id));
  const puntos = [
    { texto: `Calendario «${c.nombre}»`, ok: c.nombre.trim().toLowerCase() === NOMBRE_MISION_2.toLowerCase() },
    { texto: `Horas bien en ${r.horas} de 365 días`, ok: r.horas === 365 },
    { texto: `Horas y locución bien en ${r.bien} de 365 días`, ok: r.bien === 365 },
    { texto: deMas === 0 ? 'No ha cambiado otros calendarios' : `Ha cambiado ${deMas} ${deMas === 1 ? 'día' : 'días'} de otros calendarios`, ok: deMas === 0 },
  ];
  return { titular: `${r.bien} de 365 días bien`, bien: r.bien, total: 365, puntos, fallos: r.fallos };
}

/* ─────────────────── El festivo del modo prueba común (DD-256): dos gemelas ─────────────────── */

/** Una gemela de la tarea «Dar de alta un festivo»: el mismo trabajo con otro día y otros dos calendarios. */
export interface Festivo {
  /** «01-28». */
  readonly dia: string;
  readonly calendarioIds: readonly number[];
}

/**
 * Las dos gemelas, por la vuelta en que se hacen (no por versión): la 1 es la que la persona hace primero. Las dos
 * arrancan con los mismos datos (`estadoInicial(1)`), que traen los cuatro calendarios.
 */
export const FESTIVOS: Readonly<Record<'festivo-1' | 'festivo-2', Festivo>> = {
  'festivo-1': { dia: '01-28', calendarioIds: [6, 5] },
  'festivo-2': { dia: '10-07', calendarioIds: [1, 2] },
};

/**
 * Corrige una gemela: cada calendario pedido cierra todo el día ese día en 2025 y en 2026 (cada año), y no cambia
 * ningún otro día de 2025 en ningún calendario.
 */
export function corregirFestivo(f: Festivo, real: Estado): Correccion {
  const inicial = estadoInicial(1);
  const cerrado = (id: number, iso: string): boolean => {
    const c = real.calendarios.find((x) => x.id === id);
    return !!c && resolver(real, c, iso).franjas.length === 0;
  };
  const nombre = (id: number): string => inicial.calendarios.find((c) => c.id === id)?.nombre ?? `Calendario ${id}`;
  const iso25 = `${ANIO}-${f.dia}`;
  const iso26 = `${ANIO + 1}-${f.dia}`;
  const otros = inicial.calendarios.map((c) => c.id).filter((id) => !f.calendarioIds.includes(id));
  // Lo que cambia de más en los calendarios de la misión: cualquier día de 2025 que no sea el del festivo.
  const deMasEnObjetivos = f.calendarioIds.reduce((n, id) => {
    const a = inicial.calendarios.find((c) => c.id === id)!;
    const b = real.calendarios.find((c) => c.id === id);
    if (!b) return n + 365;
    return n + diasDelAnio(ANIO).filter((iso) => iso !== iso25 && firma(resolver(inicial, a, iso)) !== firma(resolver(real, b, iso))).length;
  }, 0);
  const deMas = tocadosDeMas(inicial, real, otros) + deMasEnObjetivos;
  const fecha = fechaLarga(iso25);
  const faltan = f.calendarioIds.filter((id) => !cerrado(id, iso25));
  const sinCadaAnio = f.calendarioIds.filter((id) => cerrado(id, iso25) && !cerrado(id, iso26));
  const puntos = [
    ...f.calendarioIds.map((id) => ({ texto: `${nombre(id)} cierra el ${fecha}`, ok: !faltan.includes(id) })),
    { texto: `Y cierran también el ${fechaLarga(iso26)}`, ok: f.calendarioIds.every((id) => cerrado(id, iso26)) },
    { texto: deMas === 0 ? 'No ha cambiado nada más' : `Ha cambiado ${deMas} ${deMas === 1 ? 'día' : 'días'} que no tocaba`, ok: deMas === 0 },
  ];
  const bien = puntos.filter((p) => p.ok).length;
  const titular =
    bien === puntos.length
      ? 'Festivo bien en los dos calendarios'
      : faltan.length > 0
        ? `Falta ${faltan.map(nombre).join(' y ')}`
        : sinCadaAnio.length > 0
          ? 'No vale para todos los años'
          : `Ha cambiado ${deMas} ${deMas === 1 ? 'día' : 'días'} que no tocaba`;
  return { titular, bien, total: puntos.length, puntos, fallos: [] };
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** «28 de enero de 2025». */
const fechaLarga = (iso: string): string => `${+iso.slice(8, 10)} de ${MESES[+iso.slice(5, 7) - 1]} de ${iso.slice(0, 4)}`;

/* ─────────────────────────────── El papel de posventa ─────────────────────────────── */

/** Los colores del papel, como los pinta posventa: no son los del prototipo, son los suyos. */
export type ColorDelPapel = 'blanco' | 'amarillo' | 'azul' | 'verde' | 'rojo' | 'naranja';

export function colorDelPapel(iso: string): ColorDelPapel {
  const d = resolver(ESTADO_OBJETIVO, OFICINAS, iso);
  if (d.regla === 'especial') return 'verde';
  const verano = d.periodo !== null;
  if (d.franjas.length === 0) return verano ? 'naranja' : 'rojo';
  if (verano) return 'azul';
  return d.franjas.length === 1 ? 'amarillo' : 'blanco';
}

export const LEYENDA_DEL_PAPEL: readonly { readonly color: ColorDelPapel; readonly texto: string }[] = [
  { color: 'rojo', texto: 'Festivos y fines de semana del curso. Suena AU_03 todo el día y no entran llamadas.' },
  { color: 'naranja', texto: 'Festivos y fines de semana de verano. Suena AU_04 todo el día y no entran llamadas.' },
  { color: 'blanco', texto: 'De 08:00 a 14:00 y de 15:30 a 18:00. Fuera de este horario suena AU_03. Dentro, AU_01.' },
  { color: 'amarillo', texto: 'De 08:00 a 14:00. Fuera de este horario suena AU_03. Dentro, AU_01.' },
  { color: 'azul', texto: 'De 08:00 a 15:00. Fuera de este horario suena AU_04. Dentro, AU_01.' },
  { color: 'verde', texto: 'De 08:00 a 15:00. Fuera de este horario suena AU_05. Dentro, AU_01.' },
];

export const TABLA_DEL_PAPEL = {
  columnas: ['Jornada completa', 'Jornada intensiva'],
  fechas: ['Del 1 de enero al 31 de mayo y del 1 de septiembre al 31 de diciembre', 'Del 1 de junio al 31 de agosto'],
  horario: ['Lunes a jueves de 8 a 14 y de 15:30 a 18. Viernes de 8 a 14', 'Lunes a viernes de 8 a 15'],
};
