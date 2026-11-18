import type { DiaVista } from './cal-anio.component';
import {
  type Calendario,
  type DiaResuelto,
  diasDelAnio,
  type Estado,
  fechaConDia,
  resolver,
  textoDeFranjas,
} from './cal-modelo';

/** Cómo se colorea el año: por qué horas tiene cada día o por lo que suena fuera de horario. */
export type Lente = 'horas' | 'locucion';

export interface EntradaDeLeyenda {
  readonly clave: string;
  readonly tono: DiaVista['tono'];
  readonly texto: string;
  readonly cuenta: number;
  readonly rayado?: boolean;
}

const TONOS_LOCUCION: readonly DiaVista['tono'][] = ['t-danger', 't-warning', 't-info', 't-success', 't-violet', 't-primary'];

/** Por qué un día tiene sus horas, en una frase: «Festivo de Cataluña: Diada», «Periodo Verano, con Verano L-V 8 a 15». */
export function porQue(d: DiaResuelto): string {
  if (d.especial) return `Día especial: ${d.especial.nombre}`;
  if (d.festivo) return `Festivo de ${d.festivo.de}: ${d.festivo.nombre}`;
  if (d.periodo) return `Periodo ${d.periodo.nombre}, con el horario ${d.horario?.nombre ?? 'sin horario'}`;
  return `Todo el año, con el horario ${d.horario?.nombre ?? 'sin horario'}`;
}

export const etiquetaDe = (d: DiaResuelto): string =>
  `${fechaConDia(d.fecha)}: ${textoDeFranjas(d.franjas)}. ${porQue(d)}.`;

/** Los días del año con su color y la leyenda, con cuántos días lleva cada cosa. */
export function vistaDelAnio(estado: Estado, cal: Calendario, anio: number, lente: Lente): { dias: Map<string, DiaVista>; leyenda: EntradaDeLeyenda[] } {
  const dias = new Map<string, DiaVista>();
  const leyenda = new Map<string, EntradaDeLeyenda>();
  const locuciones: string[] = [];
  const anotar = (e: Omit<EntradaDeLeyenda, 'cuenta'>): void => {
    const previa = leyenda.get(e.clave);
    leyenda.set(e.clave, { ...e, cuenta: (previa?.cuenta ?? 0) + 1 });
  };

  for (const iso of diasDelAnio(anio)) {
    const d = resolver(estado, cal, iso);
    const etiqueta = etiquetaDe(d);
    const cerrado = d.franjas.length === 0;
    if (lente === 'locucion') {
      if (!locuciones.includes(d.locucion)) locuciones.push(d.locucion);
      const tono = TONOS_LOCUCION[locuciones.indexOf(d.locucion) % TONOS_LOCUCION.length]!;
      const clave = `loc:${d.locucion}`;
      dias.set(iso, { tono, clave, etiqueta, rayado: cerrado });
      anotar({ clave, tono, texto: d.locucion });
      continue;
    }
    let v: DiaVista;
    let texto: string;
    if (d.especial) {
      v = { tono: cerrado ? 't-danger' : 't-warning', clave: `especial:${d.especial.id}`, etiqueta };
      texto = `${d.especial.nombre} (${cerrado ? 'cerrado' : textoDeFranjas(d.franjas)})`;
    } else if (d.festivo) {
      v = { tono: 't-danger', clave: 'festivo', etiqueta };
      texto = 'Festivos oficiales';
    } else if (cerrado) {
      v = { tono: 'cerrado', clave: 'cerrado', etiqueta };
      texto = 'Cerrado';
    } else if (d.periodo) {
      v = { tono: `t-${d.periodo.color}`, clave: `periodo:${d.periodo.id}`, etiqueta };
      texto = d.periodo.nombre;
    } else {
      v = { tono: 'abierto', clave: 'base', etiqueta };
      texto = d.horario?.nombre ?? 'Sin horario';
    }
    dias.set(iso, v);
    anotar({ clave: v.clave, tono: v.tono, texto });
  }

  // Con muchos días especiales la leyenda no cabe: se agrupan en «cerrados» y «con otras horas» (el detalle, en el panel).
  const especiales = [...leyenda.values()].filter((e) => e.clave.startsWith('especial:'));
  if (especiales.length > 2) {
    const grupo = (tono: string): string => (tono === 't-danger' ? 'especial:cerrado' : 'especial:horas');
    for (const [iso, v] of dias) if (v.clave.startsWith('especial:')) dias.set(iso, { ...v, clave: grupo(v.tono) });
    for (const e of especiales) {
      leyenda.delete(e.clave);
      const clave = grupo(e.tono);
      const previa = leyenda.get(clave);
      leyenda.set(clave, { clave, tono: e.tono, texto: e.tono === 't-danger' ? 'Días especiales cerrados' : 'Días especiales con otras horas', cuenta: (previa?.cuenta ?? 0) + e.cuenta });
    }
  }

  const orden = (e: EntradaDeLeyenda): number =>
    e.clave === 'base' ? 0 : e.clave.startsWith('periodo') ? 1 : e.clave === 'festivo' ? 3 : e.clave.startsWith('especial') ? 4 : e.clave === 'cerrado' ? 5 : 2;
  return { dias, leyenda: [...leyenda.values()].sort((a, b) => orden(a) - orden(b)) };
}

/** «el 9 de junio» o «del 1 de junio al 31 de agosto, 92 días». */
export function textoDeRango(desde: string, hasta: string): string {
  const f = (iso: string): string => `${+iso.slice(8, 10)} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][+iso.slice(5, 7) - 1]}`;
  if (desde === hasta) return fechaConDia(desde);
  const n = Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000) + 1;
  return `Del ${f(desde)} al ${f(hasta)}, ${n} días`;
}
