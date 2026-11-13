import { TooltipModule } from 'primeng/tooltip';
import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { ScButtonComponent, ScSelectButtonComponent } from '@smartcontact-hub/components';

import {
  type CalendarioDeFestivos,
  diaDeLaSemana,
  type Horario,
  resolverDia,
  sumarDias,
} from '@features/admin/repositories/state/horarios.core.mjs';

import { LETRAS, NOMBRES } from './lab-semana.component';
import { T } from './lab-textos';

type Reglas = Pick<Horario, 'week' | 'periods' | 'specials' | 'holidayCalendarIds'>;

/** Lo elegido en el calendario: un día (desde = hasta) o un rango. */
export interface Seleccion {
  readonly desde: string;
  readonly hasta: string;
}

interface Celda {
  readonly fecha: string;
  readonly numero: number;
  readonly abierto: boolean;
  readonly color: string | null;
  readonly marca: boolean;
  readonly aria: string;
}

interface Semana {
  readonly lunes: string;
  readonly numero: number;
  readonly celdas: readonly (Celda | null)[];
}

interface Mes {
  readonly clave: string;
  readonly nombre: string;
  readonly semanas: readonly Semana[];
}

const iso = (y: number, m: number, d: number): string => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Número de semana ISO 8601. */
function semanaIso(fecha: string): number {
  const d = new Date(`${fecha}T00:00:00Z`);
  const jueves = new Date(d.getTime() + (3 - diaDeLaSemana(fecha)) * 86_400_000);
  const primero = new Date(Date.UTC(jueves.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((jueves.getTime() - primero.getTime()) / 86_400_000 - 3 + diaDeLaSemana(primero.toISOString().slice(0, 10))) / 7);
}

/**
 * El calendario del horario, pensado para estar siempre a la vista (arriba en la rejilla de dos filas) y para elegir:
 * un clic elige un día, Mayús+clic alarga a un rango, y el número de semana elige la semana entera. Lo elegido no salta a
 * ningún sitio: lo recoge la barra de acciones de debajo. Dos vistas: tres meses (por defecto, días grandes) o el año.
 */
@Component({
  selector: 'sc-lab-calendario',
  imports: [ScButtonComponent, ScSelectButtonComponent, TooltipModule],
  templateUrl: './lab-calendario.component.html',
  styleUrl: './lab-calendario.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabCalendarioComponent {
  protected readonly t = T;
  readonly reglas = input.required<Reglas>();
  readonly calendarios = input<readonly CalendarioDeFestivos[]>([]);
  readonly hoy = input.required<string>();
  /** Fechas a señalar (las de la excepción por la que pasa el ratón en la lista). */
  readonly resaltadas = input<ReadonlySet<string>>(new Set());
  readonly seleccion = model<Seleccion | null>(null);
  /** Primer mes a la vista, `YYYY-MM`. */
  readonly inicio = model.required<string>();
  readonly vista = model<'meses' | 'anio'>('meses');
  /** Se pulsó la inicial de un día de la semana: señalarlo en la semana habitual. */
  readonly diaDeSemana = output<number>();

  protected readonly letras = LETRAS;
  protected readonly nombres = NOMBRES;
  protected readonly vistas = [
    { value: 'meses', label: '3 meses' },
    { value: 'anio', label: 'Año' },
  ];

  private ancla: string | null = null;
  protected readonly numeros = Array.from({ length: 31 }, (_, i) => i + 1);

  protected esFinde(fecha: string): boolean {
    return diaDeLaSemana(fecha) >= 5;
  }

  /** Lo que le falta a un mes para llegar a 31 columnas. */
  protected huecosFinDeMes(semanas: readonly Semana[]): number[] {
    const dias = semanas.flatMap((s) => s.celdas).filter((c) => c !== null).length;
    return Array.from({ length: 31 - dias });
  }

  protected readonly meses = computed<Mes[]>(() => {
    const [y0, m0] = this.inicio().split('-').map(Number);
    const anio = this.vista() === 'anio';
    const n = anio ? 12 : 3;
    const desde = anio ? { y: y0, m: 0 } : { y: y0, m: m0 - 1 };
    const reglas = this.reglas();
    const calendarios = this.calendarios();
    const fmtMes = new Intl.DateTimeFormat('es', { month: 'long', year: anio ? undefined : 'numeric' });
    const fmtDia = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
    return Array.from({ length: n }, (_, k) => {
      const y = desde.y + Math.floor((desde.m + k) / 12);
      const m = (desde.m + k) % 12;
      const dias = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const primero = iso(y, m, 1);
      const celdas: (Celda | null)[] = Array.from({ length: diaDeLaSemana(primero) }, () => null);
      for (let d = 1; d <= dias; d++) {
        const fecha = iso(y, m, d);
        const r = resolverDia(reglas, fecha, calendarios);
        const horas = r.tramos.map(([a, b]) => `${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}–${String(Math.floor(b / 60)).padStart(2, '0')}:${String(b % 60).padStart(2, '0')}`).join(', ');
        celdas.push({
          fecha,
          numero: d,
          abierto: r.tramos.length > 0,
          color: r.tipo === 'periodo' ? (r.periodo?.color ?? null) : null,
          marca: r.tipo === 'especial' || r.tipo === 'festivo',
          aria: `${fmtDia.format(new Date(y, m, d))}: ${r.tramos.length > 0 ? horas : 'cerrado'}`,
        });
      }
      while (celdas.length % 7) celdas.push(null);
      const semanas: Semana[] = [];
      for (let i = 0; i < celdas.length; i += 7) {
        const fila = celdas.slice(i, i + 7);
        const primera = fila.find((c) => c !== null)!;
        const lunes = sumarDias(primera.fecha, -diaDeLaSemana(primera.fecha));
        semanas.push({ lunes, numero: semanaIso(lunes), celdas: fila });
      }
      return { clave: `${y}-${m}`, nombre: fmtMes.format(new Date(y, m, 1)), semanas };
    });
  });

  protected readonly titulo = computed(() => {
    const ms = this.meses();
    if (this.vista() === 'anio') return this.inicio().slice(0, 4);
    return `${ms[0].nombre} – ${ms[ms.length - 1].nombre}`;
  });

  protected elegida(fecha: string): boolean {
    const s = this.seleccion();
    return !!s && fecha >= s.desde && fecha <= s.hasta;
  }

  protected extremo(fecha: string): boolean {
    const s = this.seleccion();
    return !!s && (fecha === s.desde || fecha === s.hasta);
  }

  protected elegir(fecha: string, evento: MouseEvent): void {
    if (evento.shiftKey && this.ancla) {
      const [a, b] = [this.ancla, fecha].sort();
      this.seleccion.set({ desde: a, hasta: b });
      return;
    }
    const s = this.seleccion();
    // Pulsar el mismo día elegido lo suelta.
    if (s && s.desde === fecha && s.hasta === fecha) {
      this.seleccion.set(null);
      this.ancla = null;
      return;
    }
    this.ancla = fecha;
    this.seleccion.set({ desde: fecha, hasta: fecha });
  }

  protected elegirSemana(lunes: string): void {
    this.ancla = lunes;
    this.seleccion.set({ desde: lunes, hasta: sumarDias(lunes, 6) });
  }

  protected mover(paso: number): void {
    const [y, m] = this.inicio().split('-').map(Number);
    const salto = this.vista() === 'anio' ? 12 * paso : 3 * paso;
    const t = y * 12 + (m - 1) + salto;
    this.inicio.set(`${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`);
  }

  protected irAHoy(): void {
    this.inicio.set(this.hoy().slice(0, 7));
    this.seleccion.set({ desde: this.hoy(), hasta: this.hoy() });
    this.ancla = this.hoy();
  }

  protected teclado(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      this.seleccion.set(null);
      this.ancla = null;
    }
  }
}
