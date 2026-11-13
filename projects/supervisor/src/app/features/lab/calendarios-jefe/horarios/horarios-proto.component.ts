import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  LABEL_COLORS,
  ScButtonComponent,
  ScCheckboxComponent,
  ScColorDotPickerComponent,
  ScDatepickerComponent,
  ScCustomModalComponent,
  ScInputTextComponent,
  ScMessageComponent,
  ScSearchComponent,
  ScSelectButtonComponent,
  ScSelectComponent,
  ScTabsComponent,
  type ColorDotOption,
  type LabelColor,
  type ScTab,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TooltipModule } from 'primeng/tooltip';

import { ResultadoAccionService } from '@core/services/resultado-accion.service';

import { JefeCabeceraComponent } from '../cabecera.component';
import {
  copia, dateAIso, DIAS, DIAS_CORTOS, DIAS_LETRA, guardar, HORA, hhmm, isoADate, leer, MESES, minutos, NOMBRE_COLOR,
  pintura, uid, ZONAS,
} from '../comun';
import {
  clave, effective, fecha, idx, inicial, overlap, sumar,
  type Calendario, type Db, type Efectivo, type Franja, type Horario, type Regla,
} from './horarios-motor';

const CLAVE = 'sc-lab-jefe-horarios-calendarios';

type Vista = 'year' | 'month' | 'week' | 'day';
type Dialogo =
  | { kind: 'calendar'; existing: boolean; data: Calendario }
  | { kind: 'schedule'; existing: boolean; data: Horario }
  | { kind: 'period' | 'special'; existing: boolean; data: Regla }
  | { kind: 'confirm'; title: string; text: string; action: () => void; label: string };

interface Celda { iso: string; e: Efectivo; dia: number }

/**
 * Prototipo «Horarios y calendarios», llevado tal cual al Supervisor: define las franjas, decide cuándo se aplican y
 * comprueba el resultado. Los horarios son reutilizables y se suman; el calendario los reparte por su semana habitual,
 * periodos especiales y días especiales. Mismas vistas (año, mes, semana, día), reglas, simulador y diálogos.
 */
@Component({
  selector: 'app-jefe-horarios-proto',
  standalone: true,
  imports: [
    TooltipModule, JefeCabeceraComponent, NgTemplateOutlet, ScButtonComponent, ScCheckboxComponent, ScColorDotPickerComponent, ScDatepickerComponent,
    ScCustomModalComponent, ScIconComponent, ScInputTextComponent, ScMessageComponent, ScSearchComponent,
    ScSelectButtonComponent, ScSelectComponent, ScTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './horarios-proto.component.html',
  styleUrls: ['../comun.scss', './horarios-proto.component.scss'],
})
export class HorariosProtoComponent {
  private readonly resultado = inject(ResultadoAccionService);

  protected readonly DIAS = DIAS;
  protected readonly DIAS_CORTOS = DIAS_CORTOS;
  protected readonly DIAS_LETRA = DIAS_LETRA;
  protected readonly hhmm = hhmm;
  protected readonly pintura = pintura;
  protected readonly isoADate = isoADate;
  protected readonly fecha = fecha;
  protected readonly reglas = Array.from({ length: 13 }, (_, i) => i);

  protected readonly db = signal<Db>(this.cargar());
  protected readonly section = signal<'cal' | 'sch'>('cal');
  protected readonly calId = signal(this.db().calendars[0].id);
  protected readonly sub = signal<'view' | 'rules' | 'sim'>('view');
  protected readonly view = signal<Vista>('year');
  protected readonly selected = signal('2026-10-27');
  protected readonly anchor = signal('2026-10-27');
  protected readonly query = signal('');

  protected readonly tabs: ScTab[] = [
    { value: 'cal', label: 'Calendarios' },
    { value: 'sch', label: 'Horarios reutilizables' },
  ];
  protected readonly subtabs = [
    { value: 'view', label: 'Vista calendario' },
    { value: 'rules', label: 'Reglas y días especiales' },
    { value: 'sim', label: 'Comprobar fecha' },
  ];
  protected readonly vistas = [
    { value: 'year', label: 'Año' },
    { value: 'month', label: 'Mes' },
    { value: 'week', label: 'Semana' },
    { value: 'day', label: 'Día' },
  ];
  protected readonly zonas = ZONAS.map((z) => ({ label: z, value: z }));
  protected readonly colores: ColorDotOption[] = LABEL_COLORS.filter((c) => c !== 'gray').map((c) => ({
    value: c, label: NOMBRE_COLOR[c], color: `var(--sc-label-${c}-dot)`,
  }));
  protected readonly modos = [
    { label: 'Cerrado todo el día', value: 'closed' },
    { label: 'Aplicar uno o varios horarios', value: 'custom' },
  ];

  protected readonly cal = computed(() => this.db().calendars.find((c) => c.id === this.calId()) ?? this.db().calendars[0]);
  protected readonly lista = computed(() => {
    const q = this.query().toLowerCase();
    return this.db().calendars.filter((c) => c.name.toLowerCase().includes(q));
  });
  protected readonly detalle = computed(() => this.eff(this.selected()));

  protected readonly titulo = computed(() => {
    const d = fecha(this.anchor());
    switch (this.view()) {
      case 'year': return String(d.getFullYear());
      case 'month': return MESES[d.getMonth()] + ' ' + d.getFullYear();
      case 'day': return this.fmt(this.anchor());
      case 'week': return this.fmt(sumar(this.anchor(), -idx(this.anchor()))) + ' – ' + this.fmt(sumar(this.anchor(), 6 - idx(this.anchor())));
    }
  });

  protected readonly meses = computed(() => {
    const y = fecha(this.anchor()).getFullYear();
    return MESES.map((nombre, i) => {
      const first = clave(new Date(y, i, 1, 12));
      const len = new Date(y, i + 1, 0).getDate();
      return { nombre, first, huecos: Array.from({ length: idx(first) }, (_, n) => n), dias: Array.from({ length: len }, (_, n) => this.celda(sumar(first, n))) };
    });
  });

  protected readonly mes = computed(() => {
    const d = fecha(this.anchor());
    const first = clave(new Date(d.getFullYear(), d.getMonth(), 1, 12));
    const len = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const antes = idx(first);
    return {
      antes: Array.from({ length: antes }, (_, n) => n),
      dias: Array.from({ length: len }, (_, n) => this.celda(sumar(first, n))),
      despues: Array.from({ length: (7 - ((antes + len) % 7)) % 7 }, (_, n) => n),
    };
  });

  protected readonly dias = computed(() => {
    const a = this.anchor();
    const lista = this.view() === 'day' ? [a] : Array.from({ length: 7 }, (_, i) => sumar(a, i - idx(a)));
    return lista.map((s) => ({ iso: s, e: this.eff(s) }));
  });

  protected readonly leyenda = computed(() => this.db().schedules.filter((s) => this.uses(s.id).includes(this.calId())));

  // ── Simulador ───────────────────────────────────────────────────────────
  protected readonly simDate = signal('2026-10-27');
  protected readonly simTime = signal('10:00');
  protected readonly simResult = signal<{ s: string; t: string; open: boolean; e: Efectivo } | null>(null);

  /** Las fechas como `Date`, con identidad estable para `sc-datepicker`. */
  protected readonly dSim = computed(() => isoADate(this.simDate()));
  protected readonly dFrom = computed(() => isoADate(this.fFrom()));
  protected readonly dTo = computed(() => isoADate(this.fTo()));

  // ── Diálogos ────────────────────────────────────────────────────────────
  protected readonly dialogo = signal<Dialogo | null>(null);
  protected readonly error = signal('');
  protected readonly fName = signal('');
  protected readonly fZone = signal<string>('Europe/Madrid');
  protected readonly fWeek = signal<string[][]>([]);
  protected readonly fColor = signal<string>('blue');
  protected readonly fSlots = signal<{ a: string; b: string }[]>([]);
  protected readonly fFrom = signal('');
  protected readonly fTo = signal('');
  protected readonly fAnnual = signal(false);
  protected readonly fDays = signal<number[]>([]);
  protected readonly fMode = signal<'closed' | 'custom'>('closed');
  protected readonly fPicks = signal<string[]>([]);

  // ── Lectura ─────────────────────────────────────────────────────────────
  protected sch(id: string): Horario | undefined {
    return this.db().schedules.find((s) => s.id === id);
  }
  protected eff(s: string): Efectivo {
    return effective(this.cal(), this.db().schedules, s);
  }
  private celda(iso: string): Celda {
    return { iso, e: this.eff(iso), dia: fecha(iso).getDate() };
  }
  protected fmt(s: string, opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }): string {
    return fecha(s).toLocaleDateString('es-ES', opt);
  }
  protected unionText(e: Efectivo): string {
    return e.union.length ? e.union.map(([a, b]) => hhmm(a) + '–' + hhmm(b)).join(' · ') : 'Cerrado todo el día';
  }
  protected hours(e: Efectivo): string {
    const h = e.union.reduce((n, [a, b]) => n + b - a, 0);
    return Math.floor(h / 60) + ' h' + (h % 60 ? ' ' + (h % 60) + ' min' : '');
  }
  protected colorDe(id: string): LabelColor {
    return this.sch(id)?.color ?? 'gray';
  }
  protected estilo(e: Efectivo): string {
    return e.ids.length ? pintura(this.colorDe(e.ids[0])) : '';
  }
  protected uses(id: string): string[] {
    return this.db().calendars
      .filter((c) => c.week.some((w) => w.includes(id)) || c.periods.some((p) => p.ids.includes(id)) || c.specials.some((p) => p.ids.includes(id)))
      .map((c) => c.id);
  }
  protected nombresUso(id: string): string {
    return this.uses(id).map((i) => this.db().calendars.find((c) => c.id === i)!.name).join(', ');
  }
  protected resumenCal(c: Calendario): string {
    return `${c.week.filter((x) => x.length).length} días con inicio de horario · ${c.specials.length} excepciones`;
  }
  protected franjaTexto([a, b]: Franja): string {
    return hhmm(a) + '–' + hhmm(b > 1440 ? b - 1440 : b) + (b > 1440 ? ' (+1 día)' : '');
  }
  protected dispDia(i: number): string {
    return this.cal().week[i].flatMap((id) => (this.sch(id)?.slots ?? []).map(([a, b]) => hhmm(a) + '–' + hhmm(b > 1440 ? b - 1440 : b) + (b > 1440 ? ' (+1)' : ''))).join(' · ') || '—';
  }
  protected reglaFechas(p: Regla, type: 'period' | 'special'): string {
    return this.fmt(p.from) + (p.to !== p.from ? ' – ' + this.fmt(p.to) : '') + ' ' + (p.annual ? '· Cada año' : '· ' + fecha(p.from).getFullYear()) +
      (type === 'period' ? ' · ' + p.days.map((i) => DIAS[i].slice(0, 3)).join(', ') : '');
  }
  protected reglaHorarios(p: Regla): string {
    return p.ids.map((id) => this.sch(id)?.name).join(' + ') || 'Cerrado todo el día';
  }
  protected tituloCelda(c: Celda): string {
    return `${this.fmt(c.iso)}: ${this.unionText(c.e)} · ${c.e.source}`;
  }
  protected segmentosDe(e: Efectivo, id: string): string[] {
    return e.segments.filter((x) => x.id === id).map((x) => hhmm(x.a) + '–' + hhmm(x.b) + (x.carry ? ' ↳ día anterior' : ''));
  }
  protected eventoEstilo(e: Efectivo, x: { id: string; a: number; b: number }): string {
    const lane = e.ids.indexOf(x.id);
    const count = e.ids.length;
    return `${pintura(this.colorDe(x.id))}; top:${x.a / 14.4}%; height:${(x.b - x.a) / 14.4}%; left:calc(${(lane / count) * 100}% + 2px); width:calc(${100 / count}% - 4px)`;
  }
  protected tieneCarry(e: Efectivo): boolean {
    return e.segments.some((x) => x.carry);
  }

  // ── Navegación ──────────────────────────────────────────────────────────
  protected setSection(s: unknown): void {
    if (s !== 'cal' && s !== 'sch') return;
    this.section.set(s);
    this.query.set('');
  }
  protected setSub(s: unknown): void {
    if (s === 'view' || s === 'rules' || s === 'sim') this.sub.set(s);
  }
  protected setView(v: unknown): void {
    if (v !== 'year' && v !== 'month' && v !== 'week' && v !== 'day') return;
    this.view.set(v);
    this.anchor.set(this.selected());
  }
  protected choose(s: string): void {
    this.selected.set(s);
    this.anchor.set(s);
  }
  protected openMonth(first: string): void {
    this.selected.set(first);
    this.setView('month');
  }
  protected changeCal(id: string): void {
    this.calId.set(id);
  }
  protected move(n: number): void {
    let d = fecha(this.anchor());
    const v = this.view();
    if (v === 'year') d.setFullYear(d.getFullYear() + n);
    else if (v === 'month') d = new Date(d.getFullYear(), d.getMonth() + n, 1, 12);
    else d.setDate(d.getDate() + n * (v === 'week' ? 7 : 1));
    this.choose(clave(d));
  }
  protected today(): void {
    const s = new Intl.DateTimeFormat('sv-SE', { timeZone: this.cal().zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    this.choose(s);
  }

  protected simulate(): void {
    const s = this.simDate();
    const t = this.simTime();
    if (!s || !HORA.test(t)) return this.toast('Completa fecha y hora');
    const e = this.eff(s);
    const open = e.union.some(([a, b]) => minutos(t) >= a && minutos(t) < b);
    this.simResult.set({ s, t, open, e });
  }
  protected verDia(s: string): void {
    this.choose(s);
    this.sub.set('view');
    this.view.set('day');
  }

  // ── Formularios ─────────────────────────────────────────────────────────
  private abrir(d: Dialogo): void {
    this.error.set('');
    this.dialogo.set(d);
  }
  protected cerrar(): void {
    this.dialogo.set(null);
  }
  protected tituloDialogo(d: Dialogo): string {
    switch (d.kind) {
      case 'calendar': return d.existing ? 'Configurar calendario' : 'Nuevo calendario';
      case 'schedule': return d.existing ? 'Editar horario' : 'Nuevo horario';
      case 'period': return 'Periodo especial';
      case 'special': return 'Día especial';
      case 'confirm': return d.title;
    }
  }

  protected calendarForm(id?: string): void {
    const first = this.db().schedules[0]?.id;
    const c: Calendario = id
      ? copia(this.db().calendars.find((x) => x.id === id)!)
      : { id: uid(), name: '', zone: 'Europe/Madrid', week: Array.from({ length: 7 }, (_, i) => (i < 5 && first ? [first] : [])), periods: [], specials: [] };
    this.fName.set(c.name);
    this.fZone.set(c.zone);
    this.fWeek.set(c.week.map((w) => [...w]));
    this.abrir({ kind: 'calendar', existing: !!id, data: c });
  }
  protected toggleWeek(i: number, id: string): void {
    this.fWeek.update((w) => w.map((d, j) => (j === i ? (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]) : d)));
  }

  protected scheduleForm(id?: string): void {
    const s: Horario = id ? copia(this.sch(id)!) : { id: uid(), name: '', color: 'blue', slots: [[540, 1020]] };
    this.fName.set(s.name);
    this.fColor.set(s.color);
    this.fSlots.set(s.slots.map(([a, b]) => ({ a: hhmm(a), b: hhmm(b > 1440 ? b - 1440 : b) })));
    this.abrir({ kind: 'schedule', existing: !!id, data: s });
  }
  protected addSlot(): void {
    this.fSlots.update((s) => [...s, { a: '16:00', b: '18:00' }]);
  }
  protected removeSlot(k: number): void {
    this.fSlots.update((s) => s.filter((_, n) => n !== k));
  }
  protected setSlot(k: number, campo: 'a' | 'b', v: string): void {
    this.fSlots.update((s) => s.map((x, n) => (n === k ? { ...x, [campo]: v } : x)));
  }

  protected ruleForm(kind: 'period' | 'special', id?: string, s?: string): void {
    const arr = kind === 'period' ? this.cal().periods : this.cal().specials;
    const p: Regla = id
      ? copia(arr.find((x) => x.id === id)!)
      : { id: uid(), name: '', from: s || this.selected(), to: s || this.selected(), annual: false, ids: kind === 'period' ? ['v'].filter((x) => this.sch(x)) : [], days: [0, 1, 2, 3, 4] };
    this.fName.set(p.name);
    this.fFrom.set(p.from);
    this.fTo.set(p.to);
    this.fAnnual.set(p.annual);
    this.fDays.set([...p.days]);
    this.fMode.set(p.ids.length ? 'custom' : 'closed');
    this.fPicks.set([...p.ids]);
    this.abrir({ kind, existing: !!id, data: p });
  }
  protected toggleDia(i: number): void {
    this.fDays.update((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()));
  }
  protected togglePick(id: string): void {
    this.fPicks.update((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  }

  protected commit(): void {
    const d = this.dialogo();
    if (!d || d.kind === 'confirm') return;
    const name = this.fName().trim();
    if (!name) return this.error.set('Introduce un nombre.');
    const db = copia(this.db());

    if (d.kind === 'calendar') {
      const c = { ...d.data, name };
      if (db.calendars.some((x) => x.id !== c.id && x.name.toLowerCase() === name.toLowerCase())) return this.error.set('Ya existe un calendario con ese nombre.');
      c.zone = this.fZone();
      c.week = this.fWeek().map((w) => [...w]);
      const i = db.calendars.findIndex((x) => x.id === c.id);
      if (i >= 0) db.calendars[i] = c;
      else db.calendars.push(c);
      this.calId.set(c.id);
    } else if (d.kind === 'schedule') {
      const s = { ...d.data, name };
      if (db.schedules.some((x) => x.id !== s.id && x.name.toLowerCase() === name.toLowerCase())) return this.error.set('Ya existe un horario con ese nombre.');
      const slots: Franja[] = [];
      let valid = true;
      for (const { a, b } of this.fSlots()) {
        if (!HORA.test(a) || (!HORA.test(b) && b !== '24:00') || a === b) {
          valid = false;
          break;
        }
        const x = minutos(a);
        const y = minutos(b);
        slots.push([x, y < x ? y + 1440 : y]);
      }
      if (!valid || !slots.length) return this.error.set('Añade al menos una franja válida. Usa hh:mm; el inicio y el fin deben ser distintos. Para 24 horas usa 00:00–24:00.');
      s.slots = slots;
      s.color = this.fColor() as LabelColor;
      const i = db.schedules.findIndex((x) => x.id === s.id);
      if (i >= 0) db.schedules[i] = s;
      else db.schedules.push(s);
    } else {
      const cal = db.calendars.find((c) => c.id === this.calId())!;
      const p: Regla = { ...d.data, name, from: this.fFrom(), to: this.fTo(), annual: d.kind === 'special' && this.fAnnual() };
      p.ids = this.fMode() === 'closed' ? [] : [...this.fPicks()];
      if (!p.from || !p.to || p.from > p.to) return this.error.set('Revisa las fechas: el fin debe ser igual o posterior al inicio.');
      if (fecha(p.to).getFullYear() - fecha(p.from).getFullYear() > 20) return this.error.set('Utiliza un rango de hasta 20 años.');
      if (p.annual && p.from !== p.to) return this.error.set('La repetición anual está disponible para una fecha única.');
      if (this.fMode() === 'custom' && !p.ids.length) return this.error.set('Selecciona al menos un horario.');
      if (d.kind === 'period') p.days = [...this.fDays()];
      const arr = d.kind === 'period' ? cal.periods : cal.specials;
      const conflict = arr.find((x) => x.id !== p.id && overlap(x, p));
      if (conflict) return this.error.set(`Estas fechas coinciden con «${conflict.name}». Edita esa regla o ajusta el rango para evitar dos sustituciones del mismo nivel.`);
      const i = arr.findIndex((x) => x.id === p.id);
      if (i >= 0) arr[i] = p;
      else arr.push(p);
    }
    this.cerrar();
    this.save(db);
  }

  private confirmar(title: string, text: string, action: () => void, label = 'Eliminar'): void {
    this.abrir({ kind: 'confirm', title, text, action, label });
  }
  protected ejecutar(d: Dialogo): void {
    if (d.kind !== 'confirm') return;
    this.cerrar();
    d.action();
  }
  private mutar(fn: (db: Db) => void, msg?: string): void {
    const db = copia(this.db());
    fn(db);
    this.save(db, msg);
  }

  protected duplicateSchedule(id: string): void {
    this.mutar((db) => {
      const s = copia(db.schedules.find((x) => x.id === id)!);
      const base = s.name + ' (copia)';
      let name = base;
      let n = 2;
      while (db.schedules.some((x) => x.name.toLowerCase() === name.toLowerCase())) name = base + ' ' + n++;
      s.id = uid();
      s.name = name;
      db.schedules.push(s);
    }, 'Horario duplicado; puedes editar la copia');
  }
  protected deleteSchedule(id: string): void {
    if (this.uses(id).length) return this.toast('El horario está vinculado. Retira sus asociaciones antes de eliminarlo.');
    this.confirmar('Eliminar horario', `¿Eliminar «${this.sch(id)?.name}»?`, () =>
      this.mutar((db) => (db.schedules = db.schedules.filter((s) => s.id !== id)), 'Horario eliminado'),
    );
  }
  protected removeRule(): void {
    const d = this.dialogo();
    if (d?.kind !== 'period' && d?.kind !== 'special') return;
    const key = d.kind === 'period' ? 'periods' : 'specials';
    const ruleId = d.data.id;
    this.confirmar('Eliminar regla', `¿Eliminar «${d.data.name}»? Volverá a aplicarse la siguiente regla disponible.`, () =>
      this.mutar((db) => {
        const c = db.calendars.find((x) => x.id === this.calId())!;
        c[key] = c[key].filter((p) => p.id !== ruleId);
      }, 'Regla eliminada'),
    );
  }
  protected deleteCalendar(): void {
    const d = this.dialogo();
    if (d?.kind !== 'calendar') return;
    if (this.db().calendars.length === 1) return this.error.set('Conserva al menos un calendario en el prototipo.');
    const id = d.data.id;
    this.confirmar('Eliminar calendario', `¿Eliminar «${d.data.name}» y sus reglas? Los horarios reutilizables se conservan.`, () =>
      this.mutar((db) => {
        db.calendars = db.calendars.filter((c) => c.id !== id);
        this.calId.set(db.calendars[0].id);
      }, 'Calendario eliminado'),
    );
  }
  protected resetForm(): void {
    this.confirmar('Restablecer datos de ejemplo', 'Se reemplazarán los cambios de esta demo por sus datos iniciales.', () => {
      const db = inicial();
      this.calId.set(db.calendars[0].id);
      this.save(db, 'Demo restablecida');
    }, 'Restablecer');
  }

  private save(db: Db, msg?: string): void {
    this.db.set(db);
    this.toast(guardar(CLAVE, db) ? msg || 'Cambios guardados en este navegador' : 'Cambios mantenidos en esta sesión; el navegador impide guardarlos');
  }
  private toast(summary: string): void {
    this.resultado.contar(summary);
  }
  private cargar(): Db {
    const db = leer<Db>(CLAVE);
    return db?.calendars?.length ? db : inicial();
  }

  protected fromIso(v: Date | null, set: (s: string) => void): void {
    set(dateAIso(v));
  }
}
