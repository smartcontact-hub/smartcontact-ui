import { ChangeDetectionStrategy, Component, computed, HostListener, inject, type OnInit, signal, type TemplateRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ScButtonComponent,
  ScCheckboxComponent,
  ScDatepickerComponent,
  ScCustomModalComponent,
  ScCustomModalFooterDirective,
  ScInputTextComponent,
  ScSelectButtonComponent,
  ScSelectComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TooltipModule } from 'primeng/tooltip';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { ResultadoAccionService } from '@core/services';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { type FechaEspecialNueva, HorarioEspecialModalComponent } from '@features/admin/repositories/components/horario/horario-especial-modal.component';
import { HorarioPeriodoModalComponent } from '@features/admin/repositories/components/horario/horario-periodo-modal.component';
import { FestivosStore } from '@features/admin/repositories/state/festivos.store';
import { subcanalesConHorario } from '@features/admin/repositories/state/horario-uso.service';
import {
  ahoraEn,
  type CalendarioDeFestivos,
  diaDeLaSemana,
  duenoDe,
  type FechaEspecial,
  fechasEntre,
  type Horario,
  periodoCubre,
  type Periodo,
  resolverDia,
  resumenDeLaSemana,
  siguienteId,
  textoDeFranja,
  validarSemana,
} from '@features/admin/repositories/state/horarios.core.mjs';
import { HorariosStore } from '@features/admin/repositories/state/horarios.store';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { LabCalendarioComponent, type Seleccion } from './lab-calendario.component';
import { diasDe, esFija, REGIONES } from './lab-festivos-catalogo';
import { estadoDeHorario } from './lab-horarios-estado';
import { LabSemanaComponent, NOMBRES } from './lab-semana.component';
import { T } from './lab-textos';

type Borrador = Omit<Horario, 'id'>;
type Tipo = 'periodo' | 'especial' | 'lista';

/** Una fila de la lista de excepciones: periodos, días especiales y listas de festivos, juntos y por fecha. */
interface Excepcion {
  readonly tipo: Tipo;
  readonly id: number;
  readonly nombre: string;
  readonly cuando: string;
  readonly horas: string;
  readonly color: string | null;
  readonly orden: string;
  readonly fechas: ReadonlySet<string>;
  readonly pasada: boolean;
}

const LABORABLE = [[540, 1080]] as const;
const VACIO: Borrador = {
  name: '',
  timezone: 'Europe/Madrid',
  description: '',
  status: 'active',
  week: [LABORABLE, LABORABLE, LABORABLE, LABORABLE, LABORABLE, [], []],
  periods: [],
  specials: [],
  holidayCalendarIds: [],
};

const DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);
const fmtDia = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
const fmtDiaAnio = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtLargo = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * LABORATORIO de Horarios: el editor sin scroll de página. A la izquierda la semana habitual (reglas con días en bolitas,
 * como Aircall); a la derecha una rejilla de dos filas: el calendario arriba, siempre a la vista, y debajo todo lo que
 * cambia la semana (periodos, días especiales y festivos) en UNA lista. Lo que se elige en el calendario se resuelve en
 * la barra entre los dos, sin saltar a ningún sitio.
 */
@Component({
  selector: 'sc-lab-horario-editor',
  imports: [
    HorarioEspecialModalComponent,
    HorarioPeriodoModalComponent,
    LabCalendarioComponent,
    LabSemanaComponent,
    ScButtonComponent,
    ScCheckboxComponent,
    ScDatepickerComponent,
    ScCustomModalComponent,
    ScCustomModalFooterDirective,
    ScIconComponent,
    ScInputTextComponent,
    ScSelectButtonComponent,
    ScSelectComponent,
    ScTagComponent,
    ScToggleSwitchComponent,
    TooltipModule,
  ],
  templateUrl: './lab-horario-editor.component.html',
  styleUrl: './lab-horario-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabHorarioEditorComponent implements OnInit {
  protected readonly t = T;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(HorariosStore);
  private readonly festivosStore = inject(FestivosStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly resultado = inject(ResultadoAccionService);

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');
  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>('create');
  private horarioId: number | null = null;

  protected readonly form = signal<Borrador>(VACIO);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  protected readonly dirty = this.dirtyState.dirty;
  protected readonly calendarios = this.festivosStore.items;

  protected readonly reglas = computed(
    () => {
      const { week, periods, specials, holidayCalendarIds } = this.form();
      return { week, periods, specials, holidayCalendarIds };
    },
    { equal: (a, b) => a.week === b.week && a.periods === b.periods && a.specials === b.specials && a.holidayCalendarIds === b.holidayCalendarIds },
  );

  protected readonly hoy = computed(() => ahoraEn(this.form().timezone).fecha);
  protected readonly inicio = signal(new Date().toISOString().slice(0, 7));
  protected readonly vista = signal<'meses' | 'anio'>('meses');
  protected readonly seleccion = signal<Seleccion | null>(null);
  protected readonly diaResaltado = signal<number | null>(null);
  protected readonly resaltadas = signal<ReadonlySet<string>>(new Set());

  /* ── Cabecera ─────────────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly estado = computed(() => estadoDeHorario({ id: 0, ...this.form() }, this.calendarios()));
  protected readonly resumen = computed(() => resumenDeLaSemana(this.form().week, DIAS_CORTOS, 'Cerrado toda la semana', 'Abierto 24/7'));
  protected readonly faltaSemana = computed(() => validarSemana(this.form().week));
  protected readonly grupos = computed(() => {
    const id = this.horarioId;
    if (id === null) return [];
    return this.groupsStore.groups().filter((g) => subcanalesConHorario(g).some((s) => s.id === id));
  });
  protected readonly zonas = computed(() => {
    const conocidas = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    return [...new Set([this.form().timezone, 'UTC', ...conocidas])].sort().map((z) => ({ value: z, label: z.replace(/_/g, ' ') }));
  });
  protected readonly datosAbiertos = signal(false);

  protected readonly puedeGuardar = computed(() => !!this.form().name.trim() && !this.faltaSemana() && (this.mode() === 'create' || this.dirty()));
  protected readonly motivo = computed(() =>
    !this.form().name.trim() ? 'Ponle un nombre' : this.faltaSemana() ? 'Revisa las franjas de la semana' : this.mode() === 'edit' && !this.dirty() ? 'No hay cambios' : '',
  );

  /* ── La barra de lo elegido ───────────────────────────────────────────────────────────────────────────────────── */

  protected readonly elegido = computed(() => {
    const s = this.seleccion();
    if (!s) return null;
    const fechas = fechasEntre(s.desde, s.hasta);
    if (fechas.length === 1) {
      const r = resolverDia(this.reglas(), s.desde, this.calendarios());
      const horas = r.tramos.length > 0 ? r.tramos.map(textoDeFranja).join(', ') : 'Cerrado';
      const origen =
        r.tipo === 'especial' ? `Día especial «${r.especial!.name}»`
        : r.tipo === 'festivo' ? `Festivo «${r.festivo!.name}», lista ${r.calendario!.name}`
        : r.tipo === 'periodo' ? `Periodo «${r.periodo!.name}»`
        : `Semana habitual (${NOMBRES[diaDeLaSemana(s.desde)]})`;
      return { unDia: true as const, fecha: s.desde, titulo: fmtLargo.format(aFecha(s.desde)), abierto: r.tramos.length > 0, horas, origen, dueno: r };
    }
    const cerrados = fechas.filter((f) => resolverDia(this.reglas(), f, this.calendarios()).tramos.length === 0).length;
    return {
      unDia: false as const,
      fecha: s.desde,
      titulo: `${fmtDia.format(aFecha(s.desde))} – ${fmtDiaAnio.format(aFecha(s.hasta))}`,
      abierto: cerrados < fechas.length,
      horas: `${fechas.length} días, ${fechas.length - cerrados} abiertos`,
      origen: '',
      dueno: null,
    };
  });

  /* ── Comprobar una hora: el día elegido y una hora dicen si se atiende y por qué ────────────────────────────────── */

  protected readonly horaPrueba = signal<Date>((() => {
    const { minutos } = ahoraEn('Europe/Madrid');
    return new Date(2000, 0, 1, Math.floor(minutos / 60), minutos % 60);
  })());

  protected readonly prueba = computed(() => {
    const s = this.seleccion();
    if (!s || s.desde !== s.hasta) return null;
    const h = this.horaPrueba();
    const minutos = h.getHours() * 60 + h.getMinutes();
    const r = resolverDia(this.reglas(), s.desde, this.calendarios());
    const abierto = r.tramos.some(([a, b]) => minutos >= a && minutos < b);
    // Si la hora cae en la madrugada que viene de la víspera, lo dice: es lo que más confunde.
    const deLaVispera = abierto && r.arrastre && r.tramos[0][0] === 0 && minutos < r.tramos[0][1] && !r.franjas.some((f) => f[0] <= minutos && minutos < (f[1] <= f[0] ? 1440 : f[1]));
    return { abierto, nota: deLaVispera ? 'por la franja nocturna que empezó la víspera' : '' };
  });

  protected editarSemanaDe(fecha: string): void {
    const d = diaDeLaSemana(fecha);
    this.diaResaltado.set(null);
    queueMicrotask(() => this.diaResaltado.set(d));
    setTimeout(() => this.diaResaltado.set(null), 2400);
  }

  protected senalarDia(d: number): void {
    this.diaResaltado.set(d);
    setTimeout(() => this.diaResaltado.set(null), 2400);
  }

  /** Cierra los días elegidos de golpe: un día especial cerrado por fecha, sin diálogo. Deshacer lo devuelve. */
  protected cerrarElegidos(): void {
    const s = this.seleccion();
    if (!s) return;
    const fechas = fechasEntre(s.desde, s.hasta);
    this.form.update((f) => {
      let specials = f.specials.filter((e) => e.yearly || !fechas.includes(e.date));
      for (const date of fechas) specials = [...specials, { id: siguienteId(specials), name: 'Cerrado', date, yearly: false, slots: [] }];
      return { ...f, specials };
    });
    this.resultado.contar(fechas.length === 1 ? 'Día cerrado' : `${fechas.length} días cerrados`);
  }

  protected cambiarHorasDelDia(): void {
    const s = this.seleccion();
    if (!s) return;
    const dueno = duenoDe(this.form(), s.desde, this.calendarios());
    this.especialDialog.set({ especial: dueno.especial, fecha: s.desde });
  }

  protected crearPeriodoDeSeleccion(): void {
    const s = this.seleccion();
    if (s) this.periodoDialog.set({ periodo: null, rango: [s.desde, s.hasta] });
  }

  /* ── La lista de excepciones ──────────────────────────────────────────────────────────────────────────────────── */

  protected readonly filtro = signal<'todo' | Tipo>('todo');
  protected readonly verPasadas = signal(false);
  protected readonly filtros = [
    { value: 'todo', label: 'Todo' },
    { value: 'periodo', label: 'Periodos' },
    { value: 'especial', label: 'Días especiales' },
    { value: 'lista', label: 'Festivos' },
  ];

  /** El año en curso del calendario, para contar los días de un periodo que se repite. */
  private readonly anioVista = computed(() => Number(this.inicio().slice(0, 4)));

  protected readonly excepciones = computed<readonly Excepcion[]>(() => {
    const f = this.form();
    const hoy = this.hoy();
    const anio = this.anioVista();
    const filas: Excepcion[] = [];
    for (const p of f.periods) {
      const y = p.year ?? anio;
      const fechas = new Set(fechasEntre(`${y}-01-01`, `${y + (p.from > p.to ? 1 : 0)}-12-31`).filter((d) => periodoCubre(p, d)));
      const desde = fmtDia.format(aFecha(`2024-${p.from}`));
      const hasta = (p.year === null ? fmtDia : fmtDiaAnio).format(aFecha(`${p.year ?? 2024}-${p.to}`));
      filas.push({
        tipo: 'periodo', id: p.id, nombre: p.name, color: p.color,
        cuando: `${desde} – ${hasta}${p.year === null ? ', cada año' : ''}`,
        horas: resumenDeLaSemana(p.week, DIAS_CORTOS, 'Cerrado', '24 h'),
        orden: `${p.year ?? 0}-${p.from}`, fechas, pasada: p.year !== null && `${p.year}-${p.to}` < hoy,
      });
    }
    for (const e of f.specials) {
      const fecha = e.yearly ? `${anio}${e.date.slice(4)}` : e.date;
      filas.push({
        tipo: 'especial', id: e.id, nombre: e.name, color: null,
        cuando: e.yearly ? `${fmtDia.format(aFecha(fecha))}, cada año` : fmtDiaAnio.format(aFecha(e.date)),
        horas: e.slots.length ? e.slots.map(textoDeFranja).join(', ') : 'Cerrado',
        orden: fecha, fechas: new Set([fecha]), pasada: !e.yearly && e.date < hoy,
      });
    }
    for (const c of this.calendarios().filter((x) => f.holidayCalendarIds.includes(x.id))) {
      const fechas = new Set(c.days.map((d) => (d.yearly ? `${anio}${d.date.slice(4)}` : d.date)));
      filas.push({
        tipo: 'lista', id: c.id, nombre: c.name, color: null,
        cuando: `${c.days.length} días, lista compartida, en ${this.usosDe(c.id)} horario${this.usosDe(c.id) === 1 ? '' : 's'}`,
        horas: 'Cerrado', orden: '0', fechas, pasada: false,
      });
    }
    return filas.sort((a, b) => (a.tipo === 'lista' ? -1 : 0) - (b.tipo === 'lista' ? -1 : 0) || a.orden.localeCompare(b.orden));
  });

  protected readonly visibles = computed(() => {
    const t = this.filtro();
    return this.excepciones().filter((e) => (t === 'todo' || e.tipo === t) && e.pasada === this.verPasadas());
  });
  protected readonly cuantasPasadas = computed(() => this.excepciones().filter((e) => e.pasada).length);

  private usosDe(id: number): number {
    return this.store.items().filter((h) => h.id !== this.horarioId && h.holidayCalendarIds.includes(id)).length + 1;
  }

  protected resaltar(e: Excepcion | null): void {
    this.resaltadas.set(e ? e.fechas : new Set());
  }

  protected abrir(e: Excepcion): void {
    if (e.tipo === 'periodo') this.periodoDialog.set({ periodo: this.form().periods.find((p) => p.id === e.id) ?? null, rango: null });
    else if (e.tipo === 'especial') this.especialDialog.set({ especial: this.form().specials.find((x) => x.id === e.id) ?? null, fecha: null });
    else this.listaAbierta.set(this.calendarios().find((c) => c.id === e.id) ?? null);
    // Y el calendario va a su primer día.
    const orden = [...e.fechas].sort();
    const primera = orden.find((f) => f >= this.hoy()) ?? orden[0];
    if (primera && this.vista() === 'meses') this.inicio.set(primera.slice(0, 7));
  }

  protected quitar(e: Excepcion): void {
    this.form.update((f) =>
      e.tipo === 'periodo' ? { ...f, periods: f.periods.filter((p) => p.id !== e.id) }
      : e.tipo === 'especial' ? { ...f, specials: f.specials.filter((x) => x.id !== e.id) }
      : { ...f, holidayCalendarIds: f.holidayCalendarIds.filter((id) => id !== e.id) },
    );
    this.resaltar(null);
    this.resultado.contar(e.tipo === 'lista' ? `«${e.nombre}» ya no se aplica` : `«${e.nombre}» quitado`);
  }

  /* ── Diálogos ─────────────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly periodoDialog = signal<{ periodo: Periodo | null; rango: readonly [string, string] | null } | null>(null);
  protected readonly especialDialog = signal<{ especial: FechaEspecial | null; fecha: string | null } | null>(null);
  protected readonly listaAbierta = signal<CalendarioDeFestivos | null>(null);

  protected guardarPeriodo(periodo: Periodo): void {
    this.form.update((f) => ({
      ...f,
      periods: f.periods.some((p) => p.id === periodo.id) ? f.periods.map((p) => (p.id === periodo.id ? periodo : p)) : [...f.periods, periodo],
    }));
    this.periodoDialog.set(null);
  }

  protected guardarEspeciales(nuevas: readonly FechaEspecialNueva[]): void {
    this.form.update((f) => {
      let specials = [...f.specials];
      for (const n of nuevas) {
        if (n.id !== null) specials = specials.map((e) => (e.id === n.id ? { ...n, id: n.id! } : e));
        else specials.push({ ...n, id: siguienteId(specials) });
      }
      return { ...f, specials };
    });
    this.especialDialog.set(null);
  }

  /* ── Festivos precargados ─────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly importarAbierto = signal(false);
  protected readonly regiones = REGIONES.map((r) => ({ value: r.id, label: r.nombre }));
  protected readonly region = signal('es-md');
  protected readonly descartados = signal<ReadonlySet<string>>(new Set());
  protected readonly destino = signal<'lista' | 'horario'>('horario');
  protected readonly destinos = [
    { value: 'horario', label: 'Como días especiales' },
    { value: 'lista', label: 'Como lista compartida' },
  ];
  protected readonly diasRegion = computed(() => diasDe(this.region()));
  protected readonly nombreRegion = computed(() => REGIONES.find((r) => r.id === this.region())?.nombre ?? '');
  /** Si ya hay una lista con ese nombre, se aplica esa en vez de duplicarla. */
  protected readonly listaExistente = computed(() => this.calendarios().find((c) => c.name === `Festivos ${this.nombreRegion()} 2026`) ?? null);
  /** Las listas que ya existen, para aplicarlas de un clic. */
  protected readonly listasDisponibles = computed(() => this.calendarios().filter((c) => c.status !== 'inactive' && !this.form().holidayCalendarIds.includes(c.id)));

  protected cambiarRegion(id: string): void {
    this.region.set(id);
    this.descartados.set(new Set());
  }

  protected alternarDia(date: string): void {
    this.descartados.update((s) => {
      const n = new Set(s);
      if (n.has(date)) n.delete(date);
      else n.add(date);
      return n;
    });
  }

  protected aplicarLista(id: number): void {
    this.form.update((f) => ({ ...f, holidayCalendarIds: [...f.holidayCalendarIds, id] }));
    this.importarAbierto.set(false);
  }

  protected importar(): void {
    const dias = this.diasRegion().filter((d) => !this.descartados().has(d.date));
    if (this.destino() === 'horario') {
      this.form.update((f) => {
        let specials = [...f.specials];
        for (const d of dias) {
          const yearly = esFija(d.date);
          if (specials.some((e) => (yearly && e.yearly ? e.date.slice(5) === d.date.slice(5) : e.date === d.date))) continue;
          specials = [...specials, { id: siguienteId(specials), name: d.name, date: d.date, yearly, slots: [] }];
        }
        return { ...f, specials };
      });
      this.resultado.contar(`${dias.length} festivos añadidos a este horario`);
    } else {
      const existente = this.listaExistente();
      const lista =
        existente ??
        this.festivosStore.addItem({
          name: `Festivos ${this.nombreRegion()} 2026`,
          description: 'Importados del catálogo',
          status: 'active',
          days: dias.map((d, i) => ({ id: i + 1, name: d.name, date: d.date, yearly: esFija(d.date) })),
        });
      this.form.update((f) => ({ ...f, holidayCalendarIds: f.holidayCalendarIds.includes(lista.id) ? f.holidayCalendarIds : [...f.holidayCalendarIds, lista.id] }));
      this.resultado.contar(`Lista «${lista.name}» aplicada`);
    }
    this.descartados.set(new Set());
    this.importarAbierto.set(false);
    this.filtro.set('todo');
  }

  /* ── Carga y guardado ─────────────────────────────────────────────────────────────────────────────────────────── */

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      this.dirtyState.markPristine();
      return;
    }
    const h = this.store.items().find((x) => x.id === Number(raw));
    if (!h) {
      void this.router.navigateByUrl('/lab/horarios', { replaceUrl: true });
      return;
    }
    this.mode.set('edit');
    this.horarioId = h.id;
    const { id: _id, ...datos } = h;
    this.form.set(datos);
    this.dirtyState.markPristine();
  }

  protected update<K extends keyof Borrador>(key: K, value: Borrador[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected save(): void {
    if (!this.puedeGuardar()) return;
    const f = this.form();
    const draft: Borrador = { ...f, name: f.name.trim(), description: f.description.trim() };
    if (this.mode() === 'create') {
      const creado = this.store.addItem(draft);
      this.dirtyState.markPristine();
      void this.router.navigateByUrl(`/lab/horarios/editar/${creado.id}`, { replaceUrl: true }).then(() => this.resultado.contar(`«${creado.name}» creado`));
      return;
    }
    this.store.updateItem(this.horarioId!, draft);
    this.form.set(draft);
    this.dirtyState.markPristine();
    this.resultado.contar(`«${draft.name}» guardado`);
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
    }
    if (event.key === 'Escape' && !this.periodoDialog() && !this.especialDialog() && !this.importarAbierto() && !this.datosAbiertos()) this.seleccion.set(null);
  }
}
