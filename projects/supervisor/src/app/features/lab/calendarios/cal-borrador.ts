import { computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ResultadoAccionService } from '@core/services/resultado-accion.service';
import { ANIO, type Calendario, type Periodo, siguienteId } from './cal-modelo';
import { CalStore } from './cal-store';

const NUEVO: Calendario = {
  id: 0,
  nombre: '',
  zona: 'Europe/Madrid',
  horarioId: 1,
  locucion: 'Cerrado_general',
  periodos: [],
  ubicacion: 'es',
  servicios: [],
};

/**
 * PROTOTIPO DE DISCOVERY: el calendario que se está editando, compartido por la página y su variante (A o B). Los
 * cambios del calendario se guardan con «Guardar»; los horarios y los días especiales son objetos propios y se guardan
 * al momento, porque los comparten varios calendarios.
 */
@Injectable()
export class CalBorrador {
  private readonly store = inject(CalStore);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly resultado = inject(ResultadoAccionService);

  readonly id = signal(0);
  readonly cal = signal<Calendario>(NUEVO);
  private readonly original = signal(JSON.stringify(NUEVO));
  private readonly saliendo = signal(false);
  readonly esNuevo = computed(() => this.id() === 0);
  readonly dirty = computed(() => !this.saliendo() && JSON.stringify(this.cal()) !== this.original());
  readonly motivo = computed(() => (this.cal().nombre.trim() ? null : 'Ponle un nombre al calendario'));

  constructor() {
    const id = Number(this.ruta.snapshot.paramMap.get('id') ?? 0);
    this.id.set(id);
    const guardado = this.store.calendario(id);
    const base = guardado ?? { ...NUEVO, horarioId: this.horarioHabitual() };
    this.original.set(JSON.stringify(base));
    let c = this.store.tomarBorrador(this.clave()) ?? base;
    // Vuelta del editor de horarios (camino A): el horario nuevo o editado, en su sitio.
    const q = this.ruta.snapshot.queryParamMap;
    const horario = Number(q.get('horario') ?? 0);
    if (horario) {
      const para = q.get('para') ?? 'base';
      if (para === 'base') c = { ...c, horarioId: horario };
      else if (para.startsWith('periodo-')) {
        const pid = Number(para.slice(8));
        c = { ...c, periodos: c.periodos.map((p) => (p.id === pid ? { ...p, horarioId: horario } : p)) };
      }
    }
    this.cal.set(c);
  }

  /** Para un calendario nuevo, el horario que más calendarios usan: lo habitual en esta empresa. */
  private horarioHabitual(): number {
    const e = this.store.estado();
    const usos = (id: number): number => e.calendarios.filter((c) => c.horarioId === id).length;
    return [...e.horarios].sort((a, b) => usos(b.id) - usos(a.id) || a.id - b.id)[0]?.id ?? 1;
  }

  private clave(): string {
    return this.id() === 0 ? 'nuevo' : String(this.id());
  }

  cambiar(parcial: Partial<Calendario>): void {
    this.cal.update((c) => ({ ...c, ...parcial }));
  }

  nuevoPeriodo(p: Partial<Periodo> = {}): Periodo {
    const c = this.cal();
    const periodo: Periodo = {
      id: siguienteId(c.periodos),
      nombre: `Periodo ${c.periodos.length + 1}`,
      desde: '06-01',
      hasta: '08-31',
      anio: null,
      horarioId: c.horarioId,
      locucion: null,
      color: this.store.colorLibre(c),
      ...p,
    };
    this.cambiar({ periodos: [...c.periodos, periodo] });
    return periodo;
  }

  cambiarPeriodo(id: number, parcial: Partial<Periodo>): void {
    this.cambiar({ periodos: this.cal().periodos.map((p) => (p.id === id ? { ...p, ...parcial } : p)) });
  }

  quitarPeriodo(id: number): void {
    this.cambiar({ periodos: this.cal().periodos.filter((p) => p.id !== id) });
  }

  /** Guarda. Con `silencioso`, sin toast (cuando hace falta guardar antes de añadir un día especial). */
  guardar(silencioso = false): Calendario | null {
    if (this.motivo()) return null;
    const nuevo = this.esNuevo();
    const hecho = this.store.guardarCalendario({ ...this.cal(), nombre: this.cal().nombre.trim() });
    this.cal.set(hecho);
    this.original.set(JSON.stringify(hecho));
    this.id.set(hecho.id);
    if (!silencioso) this.resultado.contar(nuevo ? `Calendario «${hecho.nombre}» creado` : `Calendario «${hecho.nombre}» guardado`);
    if (nuevo) void this.router.navigateByUrl(`/admin/calendarios/editar/${hecho.id}`, { replaceUrl: true });
    return hecho;
  }

  /** Camino A: se va a la página de horarios a crear o editar uno y se vuelve con él puesto. */
  irAlHorario(horarioId: number | null, para: string): void {
    this.store.guardarBorrador(this.clave(), this.cal());
    this.saliendo.set(true);
    const volver = this.esNuevo() ? '/admin/calendarios/crear' : `/admin/calendarios/editar/${this.id()}`;
    const destino = horarioId ? `/admin/horarios/editar/${horarioId}` : '/admin/horarios/crear';
    void this.router.navigate([destino], { queryParams: { volver, para } });
  }

  /** Para el año: el periodo con sus fechas de este año. */
  static rangoDe(p: Periodo): { desde: string; hasta: string } {
    const anio = p.anio ?? ANIO;
    return p.desde <= p.hasta ? { desde: `${anio}-${p.desde}`, hasta: `${anio}-${p.hasta}` } : { desde: `${anio}-${p.desde}`, hasta: `${anio}-12-31` };
  }
}
