import { ChangeDetectionStrategy, Component, computed, HostListener, inject, type OnInit, signal, type TemplateRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ScButtonComponent,
  ScInputTextComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TooltipModule } from 'primeng/tooltip';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { ResultadoAccionService } from '@core/services';
import { type CalendarioDeFestivos, type Festivo, FestivosStore } from '@features/admin/repositories/state/festivos.store';
import { ahoraEn, fechasEntre, siguienteId } from '@features/admin/repositories/state/horarios.core.mjs';
import { HorariosStore } from '@features/admin/repositories/state/horarios.store';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { LabCalendarioComponent, type Seleccion } from './lab-calendario.component';
import { LabDiasListaComponent } from './lab-dias-lista.component';
import { T } from './lab-textos';

type Borrador = Omit<CalendarioDeFestivos, 'id'>;

const VACIA: Borrador = { name: '', description: '', status: 'active', days: [] };
/** Para pintar la lista en el calendario: una semana abierta todo el día, así solo destacan sus festivos. */
const TODO_EL_DIA = [[0, 1440]] as const;
const SEMANA_ABIERTA = [TODO_EL_DIA, TODO_EL_DIA, TODO_EL_DIA, TODO_EL_DIA, TODO_EL_DIA, TODO_EL_DIA, TODO_EL_DIA];
const fmt = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/**
 * LABORATORIO: una lista de festivos de «Tiempo», con el mismo molde que el horario. A la izquierda, sus datos y los
 * horarios que la aplican (se aplica o se quita desde aquí). A la derecha, el calendario arriba —pulsar un día lo
 * elige y la barra dice «Añadir como festivo» o «Quitar»— y debajo sus días, cada uno con su nombre editable en la fila,
 * «Cada año» y su ✕. Nada se hace en un diálogo salvo importar del calendario oficial.
 */
@Component({
  selector: 'sc-lab-festivos-editor',
  imports: [
    LabCalendarioComponent,
    LabDiasListaComponent,
    ScButtonComponent,
    ScIconComponent,
    ScInputTextComponent,
      ScTagComponent,
    ScToggleSwitchComponent,
    TooltipModule,
  ],
  templateUrl: './lab-festivos-editor.component.html',
  styleUrls: ['./lab-horario-editor.component.scss', './lab-festivos-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabFestivosEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(FestivosStore);
  private readonly horarios = inject(HorariosStore);
  private readonly resultado = inject(ResultadoAccionService);
  protected readonly t = T;

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');
  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>('create');
  private id: number | null = null;
  protected readonly form = signal<Borrador>(VACIA);
  /** Los horarios que la aplican, en borrador: se escriben al guardar. */
  protected readonly aplicada = signal<readonly number[]>([]);
  private readonly dirtyState = createFormDirtyState(() => ({ form: this.form(), aplicada: this.aplicada() }));
  protected readonly dirty = this.dirtyState.dirty;

  protected readonly hoy = ahoraEn('Europe/Madrid').fecha;
  protected readonly inicio = signal(this.hoy.slice(0, 7));
  protected readonly vista = signal<'meses' | 'anio'>('anio');
  protected readonly seleccion = signal<Seleccion | null>(null);
  protected readonly resaltadas = signal<ReadonlySet<string>>(new Set());

  /** La lista como si ya estuviera guardada, para que el calendario la pinte. */
  private readonly comoLista = computed<CalendarioDeFestivos>(() => ({ id: -1, ...this.form(), status: 'active' }));
  protected readonly calendarios = computed(() => [this.comoLista()]);
  protected readonly reglas = { week: SEMANA_ABIERTA, periods: [], specials: [], holidayCalendarIds: [-1] };

  protected readonly anio = computed(() => Number(this.inicio().slice(0, 4)));


  /** Cada horario con su interruptor: aplicar o quitar la lista se hace aquí mismo, sin ir horario por horario. */
  protected readonly filasHorarios = computed(() => {
    const ap = new Set(this.aplicada());
    return this.horarios.items().map((h) => ({ id: h.id, nombre: h.name, aplicada: ap.has(h.id) }));
  });

  protected alternarHorario(id: number, si: boolean): void {
    this.aplicada.update((a) => (si ? [...a.filter((x) => x !== id), id] : a.filter((x) => x !== id)));
  }

  /* ── Lo elegido en el calendario ──────────────────────────────────────────────────────────────────────────────── */

  protected readonly elegido = computed(() => {
    const s = this.seleccion();
    if (!s) return null;
    const fechas = fechasEntre(s.desde, s.hasta);
    const ya = fechas.filter((f) => this.diaEn(f));
    return {
      fechas,
      ya: ya.length,
      titulo: fechas.length === 1 ? fmt.format(new Date(`${s.desde}T12:00:00`)) : `${fechas.length} días`,
      nombre: fechas.length === 1 ? (this.diaEn(s.desde)?.name ?? '') : '',
    };
  });

  private diaEn(fecha: string): Festivo | undefined {
    return this.form().days.find((d) => (d.yearly ? d.date.slice(5) === fecha.slice(5) : d.date === fecha));
  }

  protected anadirElegidos(): void {
    const e = this.elegido();
    if (!e) return;
    let nuevo: number | null = null;
    this.form.update((f) => {
      let days = [...f.days];
      for (const date of e.fechas) {
        if (this.diaEn(date)) continue;
        nuevo ??= siguienteId(days);
        days = [...days, { id: siguienteId(days), name: e.fechas.length === 1 ? '' : 'Festivo', date, yearly: false }];
      }
      return { ...f, days };
    });
    this.nuevo.set(nuevo);
    this.resultado.contar(e.fechas.length === 1 ? 'Día añadido: ponle nombre en la lista' : `${e.fechas.length - e.ya} días añadidos`);
    // El nombre se escribe en su fila: el foco va ahí.
    setTimeout(() => document.querySelector<HTMLInputElement>('.fila--nueva input')?.focus());
    this.seleccion.set(null);
  }

  protected quitarElegidos(): void {
    const e = this.elegido();
    if (!e) return;
    const fuera = new Set(e.fechas.map((f) => this.diaEn(f)?.id).filter((x) => x !== undefined));
    this.form.update((f) => ({ ...f, days: f.days.filter((d) => !fuera.has(d.id)) }));
    this.resultado.contar(fuera.size === 1 ? 'Día quitado' : `${fuera.size} días quitados`);
    this.seleccion.set(null);
  }

  /* ── Cada día, en su fila ─────────────────────────────────────────────────────────────────────────────────────── */

  /** El día recién añadido: su fila se marca y su nombre recibe el foco. */
  protected readonly nuevo = signal<number | null>(null);

  protected resaltar(fecha: string | null): void {
    this.resaltadas.set(new Set(fecha ? [fecha] : []));
  }

  protected irA(fecha: string): void {
    if (this.vista() === 'meses') this.inicio.set(fecha.slice(0, 7));
    this.seleccion.set({ desde: fecha, hasta: fecha });
  }

  /* ── Carga y guardado ─────────────────────────────────────────────────────────────────────────────────────────── */

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    const semilla = this.route.snapshot.queryParamMap.get('seedFromId');
    if (raw === null && semilla !== null) {
      const c = this.store.items().find((x) => x.id === Number(semilla));
      if (c) this.form.set({ name: `${c.name} (copia)`, description: c.description, status: c.status, days: c.days });
      this.dirtyState.markPristine();
      return;
    }
    if (raw !== null) {
      const c = this.store.items().find((x) => x.id === Number(raw));
      if (!c) {
        void this.router.navigateByUrl('/lab/horarios?lista=festivos', { replaceUrl: true });
        return;
      }
      this.mode.set('edit');
      this.id = c.id;
      const { id: _id, ...datos } = c;
      this.form.set(datos);
      this.aplicada.set(this.horarios.items().filter((h) => h.holidayCalendarIds.includes(c.id)).map((h) => h.id));
    }
    this.dirtyState.markPristine();
  }

  protected update<K extends keyof Borrador>(key: K, value: Borrador[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected readonly puedeGuardar = computed(() => !!this.form().name.trim() && (this.mode() === 'create' || this.dirty()));
  protected readonly motivo = computed(() => (!this.form().name.trim() ? 'Ponle un nombre' : this.mode() === 'edit' && !this.dirty() ? 'No hay cambios' : ''));

  protected save(): void {
    if (!this.puedeGuardar()) return;
    const f = this.form();
    const draft: Borrador = { ...f, name: f.name.trim(), days: f.days.map((d) => ({ ...d, name: d.name.trim() || 'Festivo' })) };
    let id = this.id;
    if (id === null) id = this.store.addItem(draft).id;
    else this.store.updateItem(id, draft);
    const aplicada = new Set(this.aplicada());
    for (const h of this.horarios.items()) {
      const tiene = h.holidayCalendarIds.includes(id);
      if (tiene !== aplicada.has(h.id)) {
        this.horarios.updateItem(h.id, { holidayCalendarIds: tiene ? h.holidayCalendarIds.filter((x) => x !== id) : [...h.holidayCalendarIds, id] });
      }
    }
    this.form.set(draft);
    this.dirtyState.markPristine();
    if (this.mode() === 'create') {
      void this.router.navigateByUrl(`/lab/horarios/festivos/editar/${id}`, { replaceUrl: true }).then(() => this.resultado.contar(`«${draft.name}» creada`));
      return;
    }
    this.resultado.contar(`«${draft.name}» guardada`);
  }

  protected discard(): void {
    const v = this.dirtyState.pristineValue();
    this.form.set(v.form);
    this.aplicada.set(v.aplicada);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
    }
    if (event.key === 'Escape' && !document.querySelector('.p-dialog')) this.seleccion.set(null);
  }
}
