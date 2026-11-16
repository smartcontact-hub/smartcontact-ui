import { computed, effect, Injectable, signal } from '@angular/core';

import { estadoInicial, type Mision } from './cal-misiones';
import { type Calendario, COLORES, type DiaEspecial, type Estado, type Horario, nombreLibre, siguienteId } from './cal-modelo';

const CLAVE = 'sc-cal-prueba-estado-v1';

function cargar(): Estado | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as Estado) : null;
  } catch {
    return null;
  }
}

/**
 * PROTOTIPO DE DISCOVERY: los calendarios, horarios y días especiales del prototipo, en memoria y guardados en el
 * navegador para que un recargón a mitad de prueba no pierda nada. Cada misión arranca con `reiniciar`.
 */
@Injectable({ providedIn: 'root' })
export class CalStore {
  private readonly _estado = signal<Estado>(cargar() ?? estadoInicial(1));
  readonly estado = this._estado.asReadonly();
  readonly horarios = computed(() => [...this._estado().horarios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
  readonly calendarios = computed(() => [...this._estado().calendarios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
  readonly especiales = computed(() => this._estado().especiales);

  /** Lo que un calendario a medio editar deja guardado al ir a crear un horario (camino A): se recupera al volver. */
  private readonly borradores = new Map<string, Calendario>();

  constructor() {
    effect(() => {
      const e = this._estado();
      try {
        localStorage.setItem(CLAVE, JSON.stringify(e));
      } catch {
        /* Sin almacenamiento, el prototipo sigue en memoria. */
      }
    });
  }

  reiniciar(m: Mision): void {
    this.borradores.clear();
    this._estado.set(estadoInicial(m));
  }

  calendario(id: number): Calendario | undefined {
    return this._estado().calendarios.find((c) => c.id === id);
  }

  horario(id: number): Horario | undefined {
    return this._estado().horarios.find((h) => h.id === id);
  }

  /** Crea (id 0) o reemplaza. Devuelve el guardado, con su id. */
  guardarCalendario(c: Calendario): Calendario {
    const e = this._estado();
    const nuevo = c.id === 0 ? { ...c, id: siguienteId(e.calendarios) } : c;
    this._estado.set({ ...e, calendarios: c.id === 0 ? [...e.calendarios, nuevo] : e.calendarios.map((x) => (x.id === c.id ? nuevo : x)) });
    return nuevo;
  }

  borrarCalendario(id: number): void {
    const e = this._estado();
    this._estado.set({
      ...e,
      calendarios: e.calendarios.filter((c) => c.id !== id),
      especiales: e.especiales.map((x) => ({ ...x, calendarioIds: x.calendarioIds.filter((c) => c !== id) })).filter((x) => x.calendarioIds.length > 0),
    });
  }

  guardarHorario(h: Horario): Horario {
    const e = this._estado();
    const nuevo = h.id === 0 ? { ...h, id: siguienteId(e.horarios) } : h;
    this._estado.set({ ...e, horarios: h.id === 0 ? [...e.horarios, nuevo] : e.horarios.map((x) => (x.id === h.id ? nuevo : x)) });
    return nuevo;
  }

  /** Una copia con otro nombre: «Verano L-V 8 a 15 (copia)». */
  copiarHorario(h: Horario): Horario {
    const nombre = nombreLibre(`${h.nombre} (copia)`, this._estado().horarios.map((x) => x.nombre));
    return this.guardarHorario({ ...h, id: 0, nombre });
  }

  /** Cambia un horario por otro en un calendario (al guardar un cambio «solo en este calendario»). */
  cambiarHorarioEn(calendarioId: number, de: number, a: number): void {
    const c = this.calendario(calendarioId);
    if (!c) return;
    this.guardarCalendario({
      ...c,
      horarioId: c.horarioId === de ? a : c.horarioId,
      periodos: c.periodos.map((p) => (p.horarioId === de ? { ...p, horarioId: a } : p)),
    });
  }

  borrarHorario(id: number): void {
    const e = this._estado();
    this._estado.set({ ...e, horarios: e.horarios.filter((h) => h.id !== id) });
  }

  guardarEspecial(d: DiaEspecial): DiaEspecial {
    const e = this._estado();
    const nuevo = d.id === 0 ? { ...d, id: siguienteId(e.especiales) } : d;
    this._estado.set({ ...e, especiales: d.id === 0 ? [...e.especiales, nuevo] : e.especiales.map((x) => (x.id === d.id ? nuevo : x)) });
    return nuevo;
  }

  borrarEspecial(id: number): void {
    const e = this._estado();
    this._estado.set({ ...e, especiales: e.especiales.filter((x) => x.id !== id) });
  }

  /** Quita un día especial de un calendario; si se queda sin ninguno, desaparece. */
  quitarEspecialDe(id: number, calendarioId: number): void {
    const x = this._estado().especiales.find((d) => d.id === id);
    if (!x) return;
    const ids = x.calendarioIds.filter((c) => c !== calendarioId);
    if (ids.length === 0) this.borrarEspecial(id);
    else this.guardarEspecial({ ...x, calendarioIds: ids });
  }

  guardarBorrador(clave: string, c: Calendario): void {
    this.borradores.set(clave, c);
  }

  tomarBorrador(clave: string): Calendario | undefined {
    const c = this.borradores.get(clave);
    this.borradores.delete(clave);
    return c;
  }

  /** El color del siguiente periodo de un calendario: el primero que no use, o el que toque por turno. */
  colorLibre(c: Calendario): (typeof COLORES)[number] {
    return COLORES.find((x) => !c.periodos.some((p) => p.color === x)) ?? COLORES[c.periodos.length % COLORES.length]!;
  }
}
