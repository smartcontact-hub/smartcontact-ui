import { ChangeDetectionStrategy, Component, computed, HostListener, inject, signal } from '@angular/core';
import {
  ScButtonComponent,
  ScCheckboxComponent,
  ScDatepickerComponent,
  ScCustomModalComponent,
  ScEmptyStateComponent,
  ScInputNumberComponent,
  ScInputTextComponent,
  ScSelectComponent,
  ScTabsComponent,
  ScTagComponent,
  ScTextareaComponent,
  type ScTab,
} from '@smartcontact-hub/components';
import { TooltipModule } from 'primeng/tooltip';

import { ResultadoAccionService } from '@core/services/resultado-accion.service';

import { JefeCabeceraComponent } from '../cabecera.component';
import { copia, dateAIso, isoADate, leer, guardar } from '../comun';
import {
  buildExport, createDefaultState, DAY_NAMES, DAY_SHORT, duplicateExceptionWarning, evaluateCalendar, makeEmptyBlocks,
  normalizeSlots, rangeSlots, slotToTime, summarizeDay, timeToSlot, TIMEZONES, uidIvr, validateCalendar, withRanges,
  type CalendarioIvr, type DiaEspecialIvr, type EstadoIvr, type HorarioIvr,
} from './ivr-motor';

const STORAGE_KEY = 'sc-lab-jefe-ivr-calendar';

type Dialogo =
  | { kind: 'addCalendar' }
  | { kind: 'addSchedule' }
  | { kind: 'confirm'; title: string; text: string; action: () => void; label: string };

/**
 * Prototipo «Calendarios IVR», llevado tal cual al Supervisor: definir horarios, excepciones y mensajes de fuera de
 * hora sin depender de una hoja de cálculo. La parrilla semanal se pinta arrastrando en tramos de 30 minutos; los
 * días especiales se editan en línea; el simulador dice qué haría el IVR y la exportación propone el contrato JSON.
 * Los `prompt()` y `confirm()` del original pasan a diálogos del DS.
 */
@Component({
  selector: 'app-jefe-ivr-proto',
  standalone: true,
  imports: [
    TooltipModule, JefeCabeceraComponent, ScButtonComponent, ScCheckboxComponent, ScDatepickerComponent, ScCustomModalComponent,
    ScEmptyStateComponent, ScInputNumberComponent, ScInputTextComponent, ScSelectComponent, ScTabsComponent,
    ScTagComponent, ScTextareaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ivr-proto.component.html',
  styleUrls: ['../comun.scss', './ivr-proto.component.scss'],
})
export class IvrProtoComponent {
  private readonly resultado = inject(ResultadoAccionService);

  protected readonly DAY_NAMES = DAY_NAMES;
  protected readonly DAY_SHORT = DAY_SHORT;
  protected readonly slotToTime = slotToTime;
  protected readonly summarizeDay = summarizeDay;
  protected readonly isoADate = isoADate;
  protected readonly slots = Array.from({ length: 48 }, (_, i) => i);
  protected readonly timezones = TIMEZONES.map((z) => ({ label: z, value: z }));
  protected readonly repeticiones = [
    { label: 'Puntual', value: false },
    { label: 'Anual', value: true },
  ];
  protected readonly comportamientos = [
    { label: 'Cerrado completo', value: 'closed' },
    { label: 'Horario reducido', value: 'custom' },
  ];
  protected readonly tabs: ScTab[] = [
    { value: 'horarios', label: 'Horarios' },
    { value: 'especiales', label: 'Días especiales' },
    { value: 'simulador', label: 'Simulador IVR' },
    { value: 'exportar', label: 'Exportar JSON' },
  ];

  protected readonly state = signal<EstadoIvr>(this.loadState());

  protected readonly cal = computed(() => {
    const s = this.state();
    return s.calendars.find((c) => c.id === s.activeCalendarId) ?? s.calendars[0];
  });
  protected readonly schedule = computed(() => {
    const c = this.cal();
    return c.schedules.find((s) => s.id === this.state().activeScheduleId) ?? c.schedules[0];
  });
  protected readonly checks = computed(() => validateCalendar(this.cal()));
  protected readonly issues = computed(() => {
    const danger = this.checks().filter((c) => c.type === 'danger').length;
    const warn = this.checks().filter((c) => c.type === 'warn').length;
    if (danger) return { severity: 'danger' as const, text: `${danger} bloqueo(s)` };
    if (warn) return { severity: 'warn' as const, text: `${warn} aviso(s)` };
    return { severity: 'success' as const, text: 'Validado' };
  });
  protected readonly result = computed(() => evaluateCalendar(this.cal(), this.state().simDate, this.schedule()));
  protected readonly exportJson = computed(() => JSON.stringify(buildExport(this.cal()), null, 2));
  protected readonly exceptionsOrdenadas = computed(() => this.cal().exceptions.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0)));
  /** Las fechas de cada día especial como `Date`, con identidad estable para `sc-datepicker`. */
  protected readonly fechasEx = computed(() => new Map(this.cal().exceptions.map((ex) => [ex.id, isoADate(ex.date)])));
  protected readonly simFecha = computed(() => isoADate(this.state().simDate.slice(0, 10)));
  protected readonly abiertos = computed(() => {
    const s = this.schedule();
    return DAY_NAMES.map((_, d) => new Set(normalizeSlots(s.blocks?.[d])));
  });

  // Edición rápida de tramos
  protected readonly quickDays = signal<boolean[]>([true, true, true, true, true, false, false]);
  protected readonly rangeStart = signal('08:00');
  protected readonly rangeEnd = signal('15:00');
  /** El tramo nuevo de cada día especial, por id. */
  protected readonly nuevosTramos = signal<Record<string, { start: string; end: string }>>({});

  protected readonly dialogo = signal<Dialogo | null>(null);
  protected readonly fName = signal('');

  // ── Lectura ─────────────────────────────────────────────────────────────
  protected esPublicado(): boolean {
    return this.state().status.startsWith('Publicado');
  }
  protected modeText(ex: DiaEspecialIvr): string {
    return ex.mode === 'closed' ? 'Cierre completo' : 'Horario especial';
  }
  protected duplicada(ex: DiaEspecialIvr): boolean {
    return duplicateExceptionWarning(ex, this.cal());
  }
  protected etiquetaCelda(day: number, slot: number): string {
    const open = this.abiertos()[day].has(slot);
    return `${DAY_NAMES[day]}, ${slotToTime(slot)} a ${slotToTime(slot + 1)}: ${open ? 'en hora' : 'fuera de hora'}`;
  }
  protected tramo(id: string): { start: string; end: string } {
    return this.nuevosTramos()[id] ?? { start: '08:00', end: '12:00' };
  }
  protected simHora(): string {
    return this.state().simDate.slice(11, 16);
  }

  // ── Estado ──────────────────────────────────────────────────────────────
  private mutate(fn: (s: EstadoIvr, cal: CalendarioIvr, sch: HorarioIvr) => void, borrador = true): void {
    const s = copia(this.state());
    const cal = s.calendars.find((c) => c.id === s.activeCalendarId) ?? s.calendars[0];
    const sch = cal.schedules.find((x) => x.id === s.activeScheduleId) ?? cal.schedules[0];
    fn(s, cal, sch);
    if (borrador) s.status = 'Borrador';
    const c2 = s.calendars.find((c) => c.id === s.activeCalendarId) ?? s.calendars[0];
    s.activeCalendarId = c2.id;
    if (!c2.schedules.some((x) => x.id === s.activeScheduleId)) s.activeScheduleId = c2.schedules[0]?.id;
    this.state.set(s);
    guardar(STORAGE_KEY, s);
  }
  private loadState(): EstadoIvr {
    const parsed = leer<EstadoIvr>(STORAGE_KEY);
    return parsed && Array.isArray(parsed.calendars) ? parsed : createDefaultState();
  }
  private toast(summary: string): void {
    this.resultado.contar(summary);
  }

  protected setTab(tab: unknown): void {
    if (tab === 'horarios' || tab === 'especiales' || tab === 'simulador' || tab === 'exportar') {
      this.mutate((s) => (s.activeTab = tab), false);
    }
  }
  protected selectCalendar(id: string): void {
    this.mutate((s) => {
      s.activeCalendarId = id;
      s.activeScheduleId = s.calendars.find((c) => c.id === id)?.schedules[0]?.id ?? '';
    }, false);
  }
  protected selectSchedule(id: string): void {
    this.mutate((s) => (s.activeScheduleId = id), false);
  }
  protected updateCalendarField(field: 'name' | 'timezone' | 'description' | 'inHoursRoute' | 'fallbackMessage', value: string): void {
    this.mutate((_, cal) => (cal[field] = value));
  }
  protected updateScheduleField(field: 'name' | 'validityStart' | 'validityEnd' | 'outMessage', value: string): void {
    this.mutate((_, __, sch) => (sch[field] = value));
  }
  protected updatePriority(value: number | null): void {
    this.mutate((_, __, sch) => (sch.priority = Number(value || 0)));
  }

  // ── Parrilla ────────────────────────────────────────────────────────────
  private paintMode: boolean | null = null;

  private updateSlot(sch: HorarioIvr, day: number, slot: number, open: boolean): void {
    if (!sch.blocks) sch.blocks = makeEmptyBlocks();
    const set = new Set(normalizeSlots(sch.blocks[day]));
    if (open) set.add(slot);
    else set.delete(slot);
    sch.blocks[day] = normalizeSlots([...set]);
  }
  protected cellDown(event: MouseEvent, day: number, slot: number): void {
    event.preventDefault();
    this.paintMode = !this.abiertos()[day].has(slot);
    this.paint(day, slot, this.paintMode);
  }
  protected cellEnter(day: number, slot: number): void {
    if (this.paintMode !== null) this.paint(day, slot, this.paintMode);
  }
  protected cellKey(event: KeyboardEvent, day: number, slot: number): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.paint(day, slot, !this.abiertos()[day].has(slot));
  }
  private paint(day: number, slot: number, open: boolean): void {
    this.mutate((_, __, sch) => this.updateSlot(sch, day, slot, open));
  }
  @HostListener('document:mouseup')
  protected endPaint(): void {
    this.paintMode = null;
  }

  protected toggleQuickDay(i: number): void {
    this.quickDays.update((d) => d.map((v, j) => (j === i ? !v : v)));
  }
  private getQuickDays(): number[] {
    return this.quickDays().flatMap((v, i) => (v ? [i] : []));
  }
  protected applyRange(open: boolean): void {
    const days = this.getQuickDays();
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (!days.length) return this.toast('Selecciona al menos un día.');
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || timeToSlot(start) >= timeToSlot(end)) {
      return this.toast('El tramo debe tener una hora de inicio menor que la de fin.');
    }
    const slots = rangeSlots(start, end);
    this.mutate((_, __, sch) => days.forEach((day) => slots.forEach((slot) => this.updateSlot(sch, day, slot, open))));
  }
  protected clearSelectedDays(): void {
    const days = this.getQuickDays();
    if (!days.length) return this.toast('Selecciona al menos un día.');
    this.mutate((_, __, sch) => days.forEach((day) => (sch.blocks[day] = [])));
  }

  // ── Calendarios y horarios ──────────────────────────────────────────────
  protected addCalendar(): void {
    this.fName.set('Nuevo calendario');
    this.dialogo.set({ kind: 'addCalendar' });
  }
  protected addSchedule(): void {
    this.fName.set(`Horario ${this.cal().schedules.length + 1}`);
    this.dialogo.set({ kind: 'addSchedule' });
  }
  protected aceptarNombre(): void {
    const d = this.dialogo();
    const name = this.fName().trim();
    if (!d || !name) return;
    this.dialogo.set(null);
    if (d.kind === 'addCalendar') {
      const id = uidIvr('cal');
      const a: HorarioIvr = {
        id: uidIvr('sch'), name: 'Horario principal', validityStart: '01-01', validityEnd: '06-30', priority: 10,
        outMessage: 'Estamos fuera de horario. Nuestro horario principal es de lunes a viernes de 09:00 a 17:00.',
        blocks: withRanges([0, 1, 2, 3, 4], [['09:00', '17:00']]),
      };
      const b: HorarioIvr = {
        id: uidIvr('sch'), name: 'Horario alternativo', validityStart: '07-01', validityEnd: '12-31', priority: 10,
        outMessage: 'Estamos fuera de horario. Nuestro horario alternativo es de lunes a viernes de 08:00 a 15:00.',
        blocks: withRanges([0, 1, 2, 3, 4], [['08:00', '15:00']]),
      };
      this.mutate((s) => {
        s.calendars.push({
          id, name, description: 'Calendario creado desde el mockup.', timezone: 'Europe/Madrid',
          inHoursRoute: 'Continuar flujo de atención', fallbackMessage: 'En este momento estamos fuera de horario.',
          schedules: [a, b], exceptions: [],
        });
        s.activeCalendarId = id;
        s.activeScheduleId = a.id;
        s.activeTab = 'horarios';
      });
      this.toast('Calendario creado con dos horarios base.');
    } else if (d.kind === 'addSchedule') {
      const sch: HorarioIvr = {
        id: uidIvr('sch'), name, validityStart: '01-01', validityEnd: '12-31', priority: 5,
        outMessage: 'Estamos fuera del horario configurado.', blocks: withRanges([0, 1, 2, 3, 4], [['09:00', '14:00']]),
      };
      this.mutate((s, cal) => {
        cal.schedules.push(sch);
        s.activeScheduleId = sch.id;
      });
    }
  }

  private confirmar(title: string, text: string, action: () => void, label = 'Eliminar'): void {
    this.dialogo.set({ kind: 'confirm', title, text, action, label });
  }
  protected ejecutar(d: Dialogo): void {
    if (d.kind !== 'confirm') return;
    this.dialogo.set(null);
    d.action();
  }
  protected cerrar(): void {
    this.dialogo.set(null);
  }
  protected tituloDialogo(d: Dialogo): string {
    return d.kind === 'confirm' ? d.title : d.kind === 'addCalendar' ? 'Nombre del nuevo calendario' : 'Nombre del nuevo horario';
  }

  protected deleteCalendar(): void {
    if (this.state().calendars.length <= 1) return this.toast('Debe existir al menos un calendario.');
    const cal = this.cal();
    this.confirmar('Eliminar calendario', `¿Eliminar el calendario "${cal.name}"?`, () =>
      this.mutate((s) => {
        s.calendars = s.calendars.filter((c) => c.id !== cal.id);
        s.activeCalendarId = s.calendars[0].id;
        s.activeScheduleId = s.calendars[0].schedules[0]?.id;
      }),
    );
  }
  protected deleteSchedule(id: string): void {
    const cal = this.cal();
    if (cal.schedules.length <= 2) return this.toast('Requisito: cada calendario debe mantener al menos dos horarios.');
    const sch = cal.schedules.find((s) => s.id === id);
    if (!sch) return;
    this.confirmar('Eliminar horario', `¿Eliminar el horario "${sch.name}"?`, () =>
      this.mutate((s, c) => {
        c.schedules = c.schedules.filter((x) => x.id !== id);
        s.activeScheduleId = c.schedules[0].id;
      }),
    );
  }

  // ── Días especiales ─────────────────────────────────────────────────────
  protected addException(): void {
    const ex: DiaEspecialIvr = {
      id: uidIvr('ex'), name: 'Nuevo día especial', date: new Date().toISOString().slice(0, 10), repeatsYearly: false,
      mode: 'closed', priority: 50, intervals: [], message: 'Hoy no prestamos servicio. Disculpa las molestias.',
    };
    this.mutate((s, cal) => {
      cal.exceptions.push(ex);
      s.activeTab = 'especiales';
    });
  }
  protected updateException<K extends keyof DiaEspecialIvr>(id: string, field: K, value: DiaEspecialIvr[K]): void {
    if (this.cal().exceptions.find((x) => x.id === id)?.[field] === value) return;
    this.mutate((_, cal) => {
      const ex = cal.exceptions.find((x) => x.id === id);
      if (!ex) return;
      ex[field] = value;
      if (field === 'mode' && value === 'custom' && !ex.intervals?.length) ex.intervals = [{ start: '08:00', end: '12:00' }];
    });
  }
  protected aNumero(v: number | null): number {
    return Number(v || 0);
  }
  protected setExceptionDate(id: string, d: Date | null): void {
    const iso = dateAIso(d);
    if (iso && iso !== this.cal().exceptions.find((x) => x.id === id)?.date) this.updateException(id, 'date', iso);
  }
  protected deleteException(id: string): void {
    const ex = this.cal().exceptions.find((x) => x.id === id);
    if (!ex) return;
    this.confirmar('Eliminar día especial', `¿Eliminar el día especial "${ex.name}"?`, () =>
      this.mutate((_, cal) => (cal.exceptions = cal.exceptions.filter((x) => x.id !== id))),
    );
  }
  protected setTramo(id: string, campo: 'start' | 'end', v: string): void {
    this.nuevosTramos.update((t) => ({ ...t, [id]: { ...this.tramo(id), [campo]: v } }));
  }
  protected addExceptionInterval(id: string): void {
    const { start, end } = this.tramo(id);
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || timeToSlot(start) >= timeToSlot(end)) {
      return this.toast('El tramo especial debe tener inicio menor que fin.');
    }
    this.mutate((_, cal) => {
      const ex = cal.exceptions.find((x) => x.id === id);
      if (!ex) return;
      ex.intervals = [...(ex.intervals ?? []), { start, end }].sort((a, b) => a.start.localeCompare(b.start));
    });
  }
  protected removeExceptionInterval(id: string, index: number): void {
    this.mutate((_, cal) => cal.exceptions.find((x) => x.id === id)?.intervals.splice(index, 1));
  }

  // ── Simulador, versiones y exportación ──────────────────────────────────
  protected setSimFecha(d: Date | null): void {
    const iso = dateAIso(d);
    if (iso && iso !== this.state().simDate.slice(0, 10)) this.mutate((s) => (s.simDate = `${iso}T${this.simHora() || '00:00'}`), false);
  }
  protected setSimHora(t: string): void {
    if (/^\d{2}:\d{2}$/.test(t) && t !== this.simHora()) this.mutate((s) => (s.simDate = `${s.simDate.slice(0, 10)}T${t}`), false);
  }
  protected runSimulation(): void {
    this.state.set({ ...this.state() });
    this.toast('Simulación ejecutada.');
  }
  protected saveVersion(): void {
    this.mutate((s) => (s.status = 'Borrador guardado · ' + new Date().toLocaleString()), false);
    this.toast('Versión guardada en el navegador.');
  }
  protected publish(): void {
    if (this.checks().some((c) => c.type === 'danger')) return this.toast('No se puede publicar: hay bloqueos de validación.');
    this.mutate((s) => (s.status = 'Publicado · ' + new Date().toLocaleString()), false);
    this.toast('Calendario publicado en modo demo.');
  }
  protected copyJson(): void {
    void navigator.clipboard?.writeText(this.exportJson()).then(
      () => this.toast('JSON copiado al portapapeles.'),
      () => this.toast('No se pudo copiar automáticamente.'),
    );
  }
  protected downloadJson(): void {
    const blob = new Blob([this.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.cal().name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-ivr-calendar.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  protected resetDemo(): void {
    this.confirmar('Restablecer demo', '¿Restablecer el mockup a los datos de ejemplo?', () => {
      const s = createDefaultState();
      this.state.set(s);
      guardar(STORAGE_KEY, s);
    }, 'Restablecer');
  }
}
