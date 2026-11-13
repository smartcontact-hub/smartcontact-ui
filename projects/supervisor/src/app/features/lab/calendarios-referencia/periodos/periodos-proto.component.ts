import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  ScButtonComponent,
  ScCheckboxComponent,
  ScColorDotPickerComponent,
  ScDatepickerComponent,
  ScCustomModalComponent,
  ScInputTextComponent,
  ScMessageComponent,
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

import { ReferenciaCabeceraComponent } from '../cabecera.component';
import {
  copia, dateAIso, DIAS, DIAS_CORTOS, DIAS_LETRA, guardar, HORA, hhmm, horasTexto, isoADate, leer, MESES, minutos,
  NOMBRE_COLOR, PALETA, pintura, uid, ZONAS,
} from '../comun';
import {
  addDays, coverage, dayIndex, inicial, rangeDates, resolveDay, validatePeriod, validateSchedule, validDate,
  type Calendario, type Db, type DiaEspecial, type Franja, type Horario, type Periodo, type Resolucion, type Tramo,
} from './periodos-motor';

const CLAVE = 'sc-lab-referencia-periodos-v2';

type Vista = 'year' | 'month' | 'day';
interface FranjaForm { a: string; b: string }
interface DiaForm { open: boolean; slots: FranjaForm[] }
type Dialogo =
  | { kind: 'calendar'; existing: boolean; data: Calendario }
  | { kind: 'default' }
  | { kind: 'period'; existing: boolean; data: Periodo }
  | { kind: 'special'; existing: boolean; data: DiaEspecial }
  | { kind: 'schedule'; existing: boolean; data: Horario }
  | { kind: 'confirm'; title: string; text: string; action: () => void; label: string };

interface Celda { iso: string; r: Resolucion; dia: number }
interface Mes { nombre: string; first: string; huecos: number[]; dias: Celda[] }

/**
 * Prototipo «Calendarios y periodos» (v2), llevado tal cual al Supervisor: cada fecha pertenece a un periodo o a un
 * día especial; el periodo general cubre lo que queda libre. Mismas vistas, mismos diálogos, mismas validaciones y
 * los mismos datos de ejemplo; solo cambian las piezas, que son las del DS.
 */
@Component({
  selector: 'app-referencia-periodos-proto',
  standalone: true,
  imports: [
    TooltipModule, ReferenciaCabeceraComponent, ScButtonComponent, ScCheckboxComponent, ScColorDotPickerComponent, ScDatepickerComponent,
    ScCustomModalComponent, ScIconComponent, ScInputTextComponent, ScMessageComponent, ScSelectButtonComponent,
    ScSelectComponent, ScTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './periodos-proto.component.html',
  styleUrls: ['../comun.scss', './periodos-proto.component.scss'],
})
export class PeriodosProtoComponent {
  private readonly resultado = inject(ResultadoAccionService);

  protected readonly DIAS = DIAS;
  protected readonly DIAS_CORTOS = DIAS_CORTOS;
  protected readonly DIAS_LETRA = DIAS_LETRA;
  protected readonly hhmm = hhmm;
  protected readonly horasTexto = horasTexto;
  protected readonly pintura = pintura;
  protected readonly isoADate = isoADate;

  protected readonly db = signal<Db>(this.cargar());
  protected readonly section = signal<'cal' | 'sch'>('cal');
  protected readonly calId = signal(this.db().calendars[0].id);
  protected readonly year = signal(2026);
  protected readonly view = signal<Vista>('year');
  protected readonly sub = signal<'calendar' | 'rules'>('calendar');
  protected readonly selected = signal('2026-08-14');
  protected readonly anchor = signal('2026-08-14');

  protected readonly tabs: ScTab[] = [
    { value: 'cal', label: 'Calendarios' },
    { value: 'sch', label: 'Horarios' },
  ];
  protected readonly subtabs = [
    { value: 'calendar', label: 'Vista calendario' },
    { value: 'rules', label: 'Periodos y días especiales' },
  ];
  protected readonly vistas = [
    { value: 'year', label: 'Año' },
    { value: 'month', label: 'Mes' },
    { value: 'day', label: 'Día' },
  ];
  protected readonly zonas = ZONAS.map((z) => ({ label: z, value: z }));
  protected readonly colores: ColorDotOption[] = PALETA.map((c) => ({
    value: c, label: NOMBRE_COLOR[c], color: `var(--sc-label-${c}-dot)`,
  }));
  protected readonly modos = [
    { label: 'Cerrado todo el día', value: 'closed' },
    { label: 'Aplicar un horario semanal', value: 'schedule' },
  ];
  protected readonly ticks = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];

  protected readonly cal = computed(() => this.db().calendars.find((c) => c.id === this.calId()) ?? this.db().calendars[0]);
  protected readonly cov = computed(() => coverage(this.cal(), this.year()));
  protected readonly opcionesHorario = computed(() => this.db().schedules.map((s) => ({ label: s.name, value: s.id })));
  protected readonly detalle = computed(() => this.res(this.selected()));

  protected readonly titulo = computed(() => {
    const v = this.view();
    if (v === 'year') return String(this.year());
    if (v === 'month') return MESES[+this.anchor().slice(5, 7) - 1] + ' ' + this.year();
    return this.df(this.selected(), { day: 'numeric', month: 'long', year: 'numeric' });
  });

  protected readonly meses = computed<Mes[]>(() => {
    const y = this.year();
    return MESES.map((nombre, i) => {
      const first = `${y}-${String(i + 1).padStart(2, '0')}-01`;
      const last = new Date(Date.UTC(y, i + 1, 0)).getUTCDate();
      return {
        nombre, first,
        huecos: Array.from({ length: dayIndex(first) }, (_, n) => n),
        dias: Array.from({ length: last }, (_, n) => this.celda(addDays(first, n))),
      };
    });
  });

  protected readonly mes = computed(() => {
    const first = this.anchor().slice(0, 7) + '-01';
    const i = +this.anchor().slice(5, 7);
    const last = new Date(Date.UTC(this.year(), i, 0)).getUTCDate();
    const antes = dayIndex(first);
    return {
      antes: Array.from({ length: antes }, (_, n) => n),
      dias: Array.from({ length: last }, (_, n) => this.celda(addDays(first, n))),
      despues: Array.from({ length: (7 - ((antes + last) % 7)) % 7 }, (_, n) => n),
    };
  });

  protected readonly leyenda = computed(() =>
    this.cov().rows.map((r) => ({ name: r.name, color: r.type === 'default' ? this.cal().default.color : r.period!.color })),
  );

  protected readonly distribucion = computed(() => {
    const result: { id: string; days: number; name: string; color: LabelColor | 'special' }[] = [];
    const y = this.year();
    for (const d of rangeDates(`${y}-01-01`, `${y}-12-31`)) {
      const r = this.res(d);
      const last = result[result.length - 1];
      const id = r.ownerType + ':' + r.ownerId;
      if (last?.id === id) last.days++;
      else result.push({ id, days: 1, name: this.ownerName(r), color: r.ownerType === 'special' ? 'special' : this.ownerColor(r) });
    }
    return result;
  });

  protected readonly especialesDelAno = computed(() =>
    this.cal().specials.filter((x) => x.date.startsWith(String(this.year()))).sort((a, b) => a.date.localeCompare(b.date)),
  );

  // ── Diálogos ────────────────────────────────────────────────────────────
  protected readonly dialogo = signal<Dialogo | null>(null);
  protected readonly error = signal('');
  protected readonly fName = signal('');
  protected readonly fZone = signal<string>('Europe/Madrid');
  protected readonly fSchedule = signal('');
  protected readonly fFrom = signal('');
  protected readonly fTo = signal('');
  protected readonly fColor = signal<string>('teal');
  protected readonly fDate = signal('');
  protected readonly fMode = signal<'' | 'closed' | 'schedule'>('');
  protected readonly fWeek = signal<DiaForm[]>([]);
  protected readonly fCopy = signal<boolean[]>([true, true, true, true, false, false]);

  /** Las fechas de los formularios como `Date`, con identidad estable para `sc-datepicker`. */
  protected readonly dFrom = computed(() => isoADate(this.fFrom()));
  protected readonly dTo = computed(() => isoADate(this.fTo()));
  protected readonly dDate = computed(() => isoADate(this.fDate()));
  protected readonly dMin = computed(() => new Date(this.year(), 0, 1));
  protected readonly dMax = computed(() => new Date(this.year(), 11, 31));

  protected readonly periodPreview = computed(() => {
    const d = this.dialogo();
    if (d?.kind !== 'period') return null;
    const p = this.periodCandidate(d.data);
    let v = validatePeriod(this.cal(), p, this.db().schedules);
    const y = this.year();
    if (v.ok && (+p.from.slice(0, 4) !== y || +p.to.slice(0, 4) !== y)) v = { ok: false, error: 'Elige fechas del año ' + y + '.' };
    if (!v.ok) return { kind: 'error' as const, text: v.error };
    const temp = copia(this.cal());
    temp.periods = temp.periods.filter((x) => x.id !== p.id);
    temp.periods.push(p);
    const c = coverage(temp, y);
    const row = c.rows.find((x) => x.id === p.id)!;
    const base = c.rows.find((x) => x.type === 'default')!;
    return { kind: 'ok' as const, row, base, sinNombre: !this.fName().trim() };
  });

  protected readonly specialPreview = computed(() => {
    const d = this.dialogo();
    if (d?.kind !== 'special') return '';
    const s = this.fDate();
    if (!validDate(s)) return 'Selecciona una fecha válida.';
    const temp = copia(this.cal());
    temp.specials = temp.specials.filter((x) => x.id !== d.data.id);
    const r = resolveDay(temp, s, this.db().schedules);
    const name = r.ownerType === 'special' ? r.special!.name : r.ownerType === 'period' ? r.period!.name : temp.default.name;
    return r.ownerType === 'special'
      ? `Ya existe el día especial «${name}» para esta fecha.`
      : `Esta fecha saldrá de «${name}» y pasará a ser un día especial independiente. Si lo eliminas, la fecha volverá al periodo que le corresponda.`;
  });

  // ── Lectura ─────────────────────────────────────────────────────────────
  protected res(s: string): Resolucion {
    return resolveDay(this.cal(), s, this.db().schedules);
  }
  protected schedule(id: string | null): Horario | undefined {
    return this.db().schedules.find((s) => s.id === id);
  }
  protected ownerColor(r: Resolucion): LabelColor {
    return r.ownerType === 'special' ? 'amber' : r.ownerType === 'period' ? r.period!.color : this.cal().default.color;
  }
  protected ownerName(r: Resolucion): string {
    return r.ownerType === 'special' ? r.special!.name : r.ownerType === 'period' ? r.period!.name : this.cal().default.name;
  }
  protected hoursText(r: { slots: Franja[] }): string {
    return r.slots.length ? r.slots.map(([a, b]) => hhmm(a) + '–' + hhmm(b)).join(' · ') : 'Cerrado';
  }
  protected df(s: string, opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
    return new Date(s + 'T12:00:00Z').toLocaleDateString('es-ES', { ...opt, timeZone: 'UTC' });
  }
  protected rangeLabel(r: Tramo): string {
    return this.df(r.from) + (r.to !== r.from ? ' – ' + this.df(r.to) : '');
  }
  protected diaLargo(s: string): string {
    return this.df(s, { weekday: 'long', day: 'numeric', month: 'long' });
  }
  protected tituloDia(c: Celda): string {
    return this.diaLargo(c.iso) + ' · ' + this.ownerName(c.r) + ' · ' + this.hoursText(c.r);
  }
  protected resumenCalendario(c: Calendario): string {
    const y = String(this.year());
    return `${c.periods.filter((p) => p.from.startsWith(y)).length + 1} periodo(s) · ${c.specials.filter((s) => s.date.startsWith(y)).length} especiales`;
  }
  protected usedBy(id: string): Calendario[] {
    return this.db().calendars.filter(
      (c) => c.default.scheduleId === id || c.periods.some((p) => p.scheduleId === id) || c.specials.some((p) => p.scheduleId === id),
    );
  }
  protected nombresDe(cals: Calendario[]): string {
    return cals.map((c) => c.name).join(', ');
  }
  protected franjasDia(h: Horario, i: number): string {
    return h.week[i].map(([a, b]) => hhmm(a) + '–' + hhmm(b)).join(' · ');
  }
  protected dayExplain(r: Resolucion): string {
    if (r.ownerType === 'special') return 'El día especial determina la disponibilidad de esta fecha.';
    if (r.slots.length) return 'Se aplica la fila de ' + DIAS[dayIndex(this.selected())].toLowerCase() + ' del horario seleccionado.';
    return 'La fecha pertenece al periodo, pero su horario semanal la mantiene cerrada.';
  }
  protected diaSemana(): string {
    return DIAS[dayIndex(this.selected())];
  }
  protected filaColor(r: { type: string; period: Periodo | null }): LabelColor {
    return r.type === 'default' ? this.cal().default.color : r.period!.color;
  }
  protected pinturaDist(c: LabelColor | 'special'): string {
    return c === 'special' ? pintura('amber') : pintura(c);
  }

  private celda(iso: string): Celda {
    return { iso, r: this.res(iso), dia: +iso.slice(8) };
  }

  // ── Navegación ──────────────────────────────────────────────────────────
  protected setSection(v: unknown): void {
    if (v === 'cal' || v === 'sch') this.section.set(v);
  }
  protected setSub(v: unknown): void {
    if (v === 'calendar' || v === 'rules') this.sub.set(v);
  }
  protected setView(v: unknown): void {
    if (v !== 'year' && v !== 'month' && v !== 'day') return;
    this.view.set(v);
    this.anchor.set(this.selected());
  }
  protected pickDay(s: string): void {
    this.selected.set(s);
    this.anchor.set(s);
    this.year.set(+s.slice(0, 4));
  }
  protected openMonth(first: string): void {
    this.selected.set(first);
    this.setView('month');
  }
  protected changeYear(n: number): void {
    const y = this.year() + n;
    if (y < 1000 || y > 9999) return this.toast('Elige un año entre 1000 y 9999.');
    this.year.set(y);
    let s = y + this.selected().slice(4);
    if (!validDate(s) && s.endsWith('02-29')) s = y + '-02-28';
    this.selected.set(s);
    this.anchor.set(s);
  }
  protected moveView(n: number): void {
    const v = this.view();
    if (v === 'year') return this.changeYear(n);
    if (v === 'month') {
      const d = new Date(this.anchor() + 'T12:00:00Z');
      d.setUTCMonth(d.getUTCMonth() + n, 1);
      this.pickDay(d.toISOString().slice(0, 10));
    } else this.pickDay(addDays(this.anchor(), n));
  }
  protected chooseCal(id: string): void {
    this.calId.set(id);
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
      case 'calendar': return d.existing ? 'Editar calendario' : 'Nuevo calendario';
      case 'default': return 'Editar periodo general';
      case 'period': return d.existing ? 'Editar periodo' : 'Añadir periodo';
      case 'special': return d.existing ? 'Editar día especial' : 'Añadir día especial';
      case 'schedule': return d.existing ? 'Editar horario semanal' : 'Nuevo horario semanal';
      case 'confirm': return d.title;
    }
  }

  protected calendarForm(id?: string): void {
    const c: Calendario = id
      ? copia(this.db().calendars.find((x) => x.id === id)!)
      : { id: uid(), name: '', zone: 'Europe/Madrid', default: { name: 'Periodo general', scheduleId: this.db().schedules[0]?.id ?? '', color: 'blue' }, periods: [], specials: [] };
    this.fName.set(c.name);
    this.fZone.set(c.zone);
    this.fSchedule.set(c.default.scheduleId);
    this.abrir({ kind: 'calendar', existing: !!id, data: c });
  }

  protected defaultForm(): void {
    this.fName.set(this.cal().default.name);
    this.fSchedule.set(this.cal().default.scheduleId);
    this.abrir({ kind: 'default' });
  }

  protected periodForm(id?: string): void {
    const ranges = this.cov().rows[0].ranges;
    const sel = this.selected();
    const y = this.year();
    const free = ranges.find((r) => r.to >= sel) ?? ranges[0];
    const start = free ? (free.from > sel ? free.from : free.to >= sel ? sel : free.from) : y + '-01-01';
    const end = free ? (addDays(start, 29) < free.to ? addDays(start, 29) : free.to) : y + '-01-31';
    const p: Periodo = id
      ? copia(this.cal().periods.find((x) => x.id === id)!)
      : { id: uid(), name: '', from: start, to: end, scheduleId: this.db().schedules[0]?.id ?? '', color: PALETA[(this.cal().periods.length + 1) % PALETA.length] };
    this.fName.set(p.name);
    this.fFrom.set(p.from);
    this.fTo.set(p.to);
    this.fSchedule.set(p.scheduleId);
    this.fColor.set(p.color);
    this.abrir({ kind: 'period', existing: !!id, data: p });
  }

  private periodCandidate(base: Periodo): Periodo {
    return {
      ...base,
      name: this.fName().trim() || 'Nuevo periodo',
      from: this.fFrom(),
      to: this.fTo(),
      scheduleId: this.fSchedule(),
      color: (this.fColor() as LabelColor) || 'teal',
    };
  }

  protected specialForm(id?: string, date?: string): void {
    const x: DiaEspecial = id
      ? copia(this.cal().specials.find((s) => s.id === id)!)
      : { id: uid(), name: '', date: date || this.selected(), scheduleId: null };
    this.fName.set(x.name);
    this.fDate.set(x.date);
    this.fMode.set(x.scheduleId ? 'schedule' : id ? 'closed' : '');
    this.fSchedule.set(x.scheduleId ?? '');
    this.abrir({ kind: 'special', existing: !!id, data: x });
  }

  protected scheduleForm(id?: string): void {
    const s: Horario = id
      ? copia(this.schedule(id)!)
      : { id: uid(), name: '', week: DIAS.map((_, i): Franja[] => (i < 5 ? [[540, 1080]] : [])) };
    this.fName.set(s.name);
    this.fWeek.set(s.week.map((slots) => ({
      open: slots.length > 0,
      slots: (slots.length ? slots : [[540, 1080] as Franja]).map(([a, b]) => ({ a: hhmm(a), b: hhmm(b) })),
    })));
    this.fCopy.set([true, true, true, true, false, false]);
    this.abrir({ kind: 'schedule', existing: !!id, data: s });
  }

  protected toggleDay(i: number, open: boolean): void {
    this.fWeek.update((w) => w.map((d, j) => (j === i ? { ...d, open } : d)));
  }
  protected addSlot(i: number): void {
    this.fWeek.update((w) => w.map((d, j) => (j === i ? { ...d, slots: [...d.slots, { a: '16:00', b: '18:00' }] } : d)));
  }
  protected removeSlot(i: number, k: number): void {
    this.fWeek.update((w) => w.map((d, j) => (j === i ? { ...d, slots: d.slots.filter((_, n) => n !== k) } : d)));
  }
  protected setSlot(i: number, k: number, campo: 'a' | 'b', v: string): void {
    this.fWeek.update((w) => w.map((d, j) => (j === i ? { ...d, slots: d.slots.map((s, n) => (n === k ? { ...s, [campo]: v } : s)) } : d)));
  }
  protected toggleCopy(i: number): void {
    this.fCopy.update((c) => c.map((v, j) => (j === i ? !v : v)));
  }
  protected copyMonday(): void {
    const lunes = this.fWeek()[0];
    const marcados = this.fCopy();
    this.fWeek.update((w) => w.map((d, i) => (i > 0 && marcados[i - 1] ? { open: lunes.open, slots: lunes.slots.map((s) => ({ ...s })) } : d)));
    this.toast('Lunes copiado a los días seleccionados');
  }

  private readWeek(): Franja[][] {
    return this.fWeek().map((d) =>
      d.open
        ? d.slots.map(({ a, b }): Franja => [HORA.test(a) ? minutos(a) : NaN, HORA.test(b) || b === '24:00' ? minutos(b) : NaN])
        : [],
    );
  }

  protected commit(): void {
    const d = this.dialogo();
    if (!d || d.kind === 'confirm') return;
    const name = this.fName().trim();
    if (!name) return this.error.set('Introduce un nombre.');
    const db = copia(this.db());
    const cal = db.calendars.find((c) => c.id === this.calId())!;

    if (d.kind === 'calendar') {
      const p = d.data;
      p.name = name;
      if (db.calendars.some((x) => x.id !== p.id && x.name.toLowerCase() === name.toLowerCase())) return this.error.set('Ya existe un calendario con ese nombre.');
      if (!this.fSchedule()) return this.error.set('Selecciona el horario del periodo general.');
      p.zone = this.fZone();
      p.default.scheduleId = this.fSchedule();
      const i = db.calendars.findIndex((x) => x.id === p.id);
      if (i < 0) db.calendars.push(p);
      else db.calendars[i] = p;
      this.calId.set(p.id);
    } else if (d.kind === 'default') {
      cal.default = { ...cal.default, name, scheduleId: this.fSchedule() };
    } else if (d.kind === 'period') {
      const p = this.periodCandidate(d.data);
      let v = validatePeriod(cal, p, db.schedules);
      const y = this.year();
      if (v.ok && (+p.from.slice(0, 4) !== y || +p.to.slice(0, 4) !== y)) v = { ok: false, error: 'Elige fechas del año ' + y + '.' };
      if (!v.ok) return this.error.set(v.error);
      if (!p.scheduleId) return this.error.set('Selecciona un horario.');
      const i = cal.periods.findIndex((x) => x.id === p.id);
      if (i < 0) cal.periods.push(p);
      else cal.periods[i] = p;
    } else if (d.kind === 'special') {
      const p = { ...d.data, name, date: this.fDate() };
      if (!validDate(p.date) || +p.date.slice(0, 4) !== this.year()) return this.error.set('Selecciona una fecha del año ' + this.year() + '.');
      if (cal.specials.some((x) => x.id !== p.id && x.date === p.date)) return this.error.set('Ya existe un día especial en esa fecha. Edita el existente.');
      const mode = this.fMode();
      if (!mode) return this.error.set('Elige explícitamente si estará cerrado o tendrá horario.');
      if (mode === 'schedule' && !this.fSchedule()) return this.error.set('Selecciona un horario semanal.');
      p.scheduleId = mode === 'closed' ? null : this.fSchedule();
      const i = cal.specials.findIndex((x) => x.id === p.id);
      if (i < 0) cal.specials.push(p);
      else cal.specials[i] = p;
      this.selected.set(p.date);
      this.anchor.set(p.date);
    } else if (d.kind === 'schedule') {
      const p = d.data;
      p.name = name;
      if (db.schedules.some((x) => x.id !== p.id && x.name.toLowerCase() === name.toLowerCase())) return this.error.set('Ya existe un horario con ese nombre.');
      const week = this.readWeek();
      const form = this.fWeek();
      for (let i = 0; i < 7; i++) {
        if (form[i].open && !week[i].length) return this.error.set('Añade al menos una franja en ' + DIAS[i] + ' o desmarca «Con horario».');
      }
      p.week = week.map((day) => day.sort((a, b) => a[0] - b[0]));
      const v = validateSchedule(p);
      if (!v.ok) return this.error.set(v.error);
      const i = db.schedules.findIndex((x) => x.id === p.id);
      if (i < 0) db.schedules.push(p);
      else db.schedules[i] = p;
    }
    this.cerrar();
    this.persist(db);
  }

  private confirmar(title: string, text: string, action: () => void, label = 'Eliminar'): void {
    this.abrir({ kind: 'confirm', title, text, action, label });
  }

  protected removePeriod(): void {
    const d = this.dialogo();
    if (d?.kind !== 'period') return;
    const id = d.data.id;
    this.confirmar('Eliminar periodo', `Las fechas de «${d.data.name}» volverán al periodo general. Los días especiales se conservarán.`, () => {
      this.mutar((db) => {
        const c = db.calendars.find((x) => x.id === this.calId())!;
        c.periods = c.periods.filter((x) => x.id !== id);
      }, 'Periodo eliminado');
    });
  }
  protected removeSpecial(): void {
    const d = this.dialogo();
    if (d?.kind !== 'special') return;
    const id = d.data.id;
    this.confirmar('Eliminar día especial', 'La fecha volverá al periodo que le corresponda, con su horario semanal.', () => {
      this.mutar((db) => {
        const c = db.calendars.find((x) => x.id === this.calId())!;
        c.specials = c.specials.filter((x) => x.id !== id);
      }, 'Día especial eliminado');
    });
  }
  protected deleteCalendar(): void {
    const d = this.dialogo();
    if (d?.kind !== 'calendar') return;
    if (this.db().calendars.length === 1) return this.error.set('Conserva al menos un calendario en la demo.');
    const id = d.data.id;
    this.confirmar('Eliminar calendario', `Se eliminará «${d.data.name}» con sus periodos y días especiales. Los horarios se conservarán.`, () => {
      this.mutar((db) => {
        db.calendars = db.calendars.filter((x) => x.id !== id);
        this.calId.set(db.calendars[0].id);
      }, 'Calendario eliminado');
    });
  }
  protected duplicateSchedule(id: string): void {
    this.mutar((db) => {
      const s = copia(db.schedules.find((x) => x.id === id)!);
      const base = s.name + ' (copia)';
      let name = base;
      let n = 2;
      while (db.schedules.some((x) => x.name === name)) name = base + ' ' + n++;
      s.id = uid();
      s.name = name;
      db.schedules.push(s);
    }, 'Horario duplicado');
  }
  protected deleteSchedule(id: string): void {
    if (this.usedBy(id).length) return this.toast('Retira las asociaciones de este horario antes de eliminarlo.');
    this.confirmar('Eliminar horario', `¿Eliminar «${this.schedule(id)?.name}»?`, () => {
      this.mutar((db) => {
        db.schedules = db.schedules.filter((x) => x.id !== id);
      }, 'Horario eliminado');
    });
  }
  protected resetDemo(): void {
    this.confirmar('Restablecer demo', 'Los cambios realizados se sustituirán por los datos de ejemplo.', () => {
      const db = inicial();
      this.calId.set(db.calendars[0].id);
      this.year.set(2026);
      this.selected.set('2026-08-14');
      this.anchor.set('2026-08-14');
      this.persist(db, 'Demo restablecida');
    }, 'Restablecer');
  }
  protected ejecutar(d: Dialogo): void {
    if (d.kind !== 'confirm') return;
    this.cerrar();
    d.action();
  }

  private mutar(fn: (db: Db) => void, msg: string): void {
    const db = copia(this.db());
    fn(db);
    this.persist(db, msg);
  }

  private persist(db: Db, msg = 'Cambios guardados'): void {
    this.db.set(db);
    this.toast(guardar(CLAVE, db) ? msg : 'Cambios conservados durante esta sesión');
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
