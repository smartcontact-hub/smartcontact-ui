import { ahoraEn, estadoEn, horaDe, sumarDias, type CalendarioDeFestivos, type Horario } from '@features/admin/repositories/state/horarios.core.mjs';

/** Lo que el listado dice de un horario en UNA columna: si se usa, y si se usa, cómo está ahora y cuándo cambia. */
export interface EstadoDeHorario {
  readonly clave: 'open' | 'closed' | 'inactive';
  /** «cierra a las 18:00», «abre mañana a las 09:00», «abre el lun 09:00»; vacío si no cambia en dos semanas. */
  readonly detalle: string;
}

const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

/** Cuándo, en palabras cortas y relativo a hoy en la zona del horario. */
export function cuandoCambia(hoy: string, fecha: string, minutos: number): string {
  const hora = horaDe(minutos);
  if (fecha === hoy) return `a las ${hora}`;
  if (fecha === sumarDias(hoy, 1)) return `mañana a las ${hora}`;
  for (let i = 2; i < 7; i++) {
    if (fecha === sumarDias(hoy, i)) {
      const dia = (new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7;
      return `el ${DIAS[dia]} a las ${hora}`;
    }
  }
  const [, m, d] = fecha.split('-').map(Number);
  const mes = new Intl.DateTimeFormat('es', { month: 'short' }).format(new Date(2024, m - 1, 1)).replace('.', '');
  return `el ${d} ${mes} a las ${hora}`;
}

/**
 * «Ahora» y «Estado» eran dos columnas que decían casi lo mismo con dos etiquetas verdes: un horario inactivo salía
 * «Abierto». Aquí van juntas: inactivo no tiene «ahora»; activo dice abierto o cerrado y cuándo cambia.
 */
export function estadoDeHorario(h: Horario, calendarios: readonly CalendarioDeFestivos[], cuando = new Date()): EstadoDeHorario {
  if (h.status === 'inactive') return { clave: 'inactive', detalle: '' };
  const { fecha, minutos } = ahoraEn(h.timezone, cuando);
  const estado = estadoEn(h, fecha, minutos, calendarios);
  if (!estado.cambia) return { clave: estado.abierto ? 'open' : 'closed', detalle: estado.abierto ? 'siempre' : 'sin horas próximas' };
  const cuandoTexto = cuandoCambia(fecha, estado.cambia.fecha, estado.cambia.minutos);
  return { clave: estado.abierto ? 'open' : 'closed', detalle: `${estado.abierto ? 'cierra' : 'abre'} ${cuandoTexto}` };
}
