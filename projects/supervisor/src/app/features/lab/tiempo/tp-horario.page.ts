import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  type OnInit,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { type CalendarioDeFestivos, type Festivo, FestivosStore } from '@features/admin/repositories/state/festivos.store';
import { subcanalesConHorario } from '@features/admin/repositories/state/horario-uso.service';
import {
  ahoraEn,
  coberturaAnual,
  diaDeLaSemana,
  type FechaEspecial,
  fechasEntre,
  type Horario,
  periodoCubre,
  type Periodo,
  resolverDia,
  siguienteId,
  validarSemana,
} from '@features/admin/repositories/state/horarios.core.mjs';
import { HorariosStore } from '@features/admin/repositories/state/horarios.store';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { estadoDeHorario } from '../horarios/lab-horarios-estado';
import { activarLabHorarios } from '../horarios/lab-modo';
import { type Seleccion, TpCalendarioComponent } from './tp-calendario.component';
import { TpEspecialComponent } from './tp-especial.component';
import { TpIconoComponent } from './tp-icono.component';
import { TpImportarComponent } from './tp-importar.component';
import {
  capasDe,
  capital,
  colorDeNombre,
  colorDePeriodo,
  fmtDia,
  fmtDiaAnio,
  fmtLargo,
  horas,
  iniciales,
  LETRAS,
  MESES_CORTOS,
  minutosDeSemana,
  NOMBRES,
  textoDeFranja,
  trozosDelAnio,
} from './tp-modelo';
import { TpPeriodoComponent } from './tp-periodo.component';
import { TpAvisos, TpAvisosComponent, TpHoraComponent, TpLineaComponent, TpModalComponent, TpSegComponent } from './tp-piezas';
import { TpSemanaComponent } from './tp-semana.component';
import { T } from './tp-textos';

type Borrador = Omit<Horario, 'id'>;
type Tipo = 'periodo' | 'especial' | 'lista';

/** Una fila de «Cambia la semana»: periodos, días especiales y listas de festivos, juntos. */
interface Excepcion {
  readonly tipo: Tipo;
  readonly id: number;
  readonly nombre: string;
  readonly cuando: string;
  readonly horas: string;
  readonly cerrado: boolean;
  readonly color: string | null;
  readonly orden: string;
  readonly fechas: ReadonlySet<string>;
  readonly pasada: boolean;
  readonly anual: boolean;
  readonly hoja: { readonly mes: string; readonly dia: number } | null;
  readonly barra: readonly { readonly desde: number; readonly hasta: number }[];
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

/**
 * LABORATORIO «Tiempo» premium: el editor de un horario en una pantalla. A la izquierda, la semana habitual dibujada y
 * sus tramos. A la derecha, arriba el calendario con calor (cada día dice cuánto abre) y debajo lo que cambia la semana.
 * Pulsar un día abre su ficha junto a él: sus horas en una línea de 24 h, las cuatro capas que podrían mandar y cuál
 * manda, una hora para comprobar y lo que se puede hacer con ese día. Guardar vive en una barra que aparece al cambiar.
 */
@Component({
  selector: 'sc-tp-horario',
  imports: [
    TpAvisosComponent,
    TpCalendarioComponent,
    TpEspecialComponent,
    TpHoraComponent,
    TpIconoComponent,
    TpImportarComponent,
    TpLineaComponent,
    TpModalComponent,
    TpPeriodoComponent,
    TpSegComponent,
    TpSemanaComponent,
  ],
  templateUrl: './tp-horario.page.html',
  // Hojas globales repartidas por dueño: cada una cabe en el presupuesto de estilos por componente.
  styleUrls: ['./tp-base.scss', './tp-piezas.scss', './tp-capas.scss', './tp-semana.scss', './tp-horario.scss', './tp-formas.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpHorarioPage implements OnInit {
  protected readonly t = T;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(HorariosStore);
  private readonly festivosStore = inject(FestivosStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly avisos = inject(TpAvisos);

  protected readonly capital = capital;
  protected readonly fmtLargo = fmtLargo;
  protected readonly letras = LETRAS;
  protected readonly avatarColor = colorDeNombre;
  protected readonly iniciales = iniciales;
  protected readonly marcas = [0, 6, 12, 18, 24];

  protected readonly modo = signal<'crear' | 'editar'>('crear');
  private horarioId: number | null = null;
  protected readonly form = signal<Borrador>(VACIO);
  private readonly sucio = createFormDirtyState(() => this.form());
  protected readonly dirty = this.sucio.dirty;
  protected readonly calendarios = this.festivosStore.items;

  protected readonly reglas = computed(
    () => {
      const { week, periods, specials, holidayCalendarIds } = this.form();
      return { week, periods, specials, holidayCalendarIds };
    },
    { equal: (a, b) => a.week === b.week && a.periods === b.periods && a.specials === b.specials && a.holidayCalendarIds === b.holidayCalendarIds },
  );

  /** El reloj: la raya de «ahora» y el estado se mueven solos. */
  private readonly reloj = signal(new Date());
  constructor() {
    const id = setInterval(() => this.reloj.set(new Date()), 30_000);
    const cerrarFicha = (): void => this.ficha.set(null);
    window.addEventListener('resize', cerrarFicha);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(id);
      window.removeEventListener('resize', cerrarFicha);
    });
    activarLabHorarios(true);
    // Al moverse el calendario, el día al que colgaba la ficha ya no está donde estaba.
    effect(() => {
      this.inicio();
      this.vista();
      untracked(() => this.ficha.set(null));
    });
  }

  protected readonly ahora = computed(() => ahoraEn(this.form().timezone, this.reloj()));
  protected readonly hoy = computed(() => this.ahora().fecha);
  protected readonly ahoraSemana = computed(() => ({ dia: diaDeLaSemana(this.hoy()), minutos: this.ahora().minutos }));
  protected readonly inicio = signal(new Date().toISOString().slice(0, 7));
  protected readonly vista = signal<'meses' | 'anio'>('meses');
  protected readonly seleccion = signal<Seleccion | null>(null);
  protected readonly senalado = signal<number | null>(null);
  protected readonly resaltadas = signal<ReadonlySet<string>>(new Set());

  /* ── Cabecera ─────────────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly estado = computed(() => estadoDeHorario({ id: 0, ...this.form() }, this.calendarios(), this.reloj()));
  protected readonly horasSemana = computed(() => horas(minutosDeSemana(this.form().week)));
  protected readonly faltaSemana = computed(() => validarSemana(this.form().week));
  protected readonly grupos = computed(() => {
    const id = this.horarioId;
    if (id === null) return [];
    return this.groupsStore.groups().filter((g) => subcanalesConHorario(g).some((s) => s.id === id)).map((g) => g.name);
  });
  protected readonly zonas = computed(() => {
    const conocidas = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    return [...new Set([this.form().timezone, 'UTC', ...conocidas])].sort();
  });

  /** Cómo se reparte el año entre la semana, cada periodo, los días especiales y los festivos. */
  protected readonly anio = computed(() => Number(this.inicio().slice(0, 4)));
  protected readonly reparto = computed(() => {
    const anio = this.anio();
    const c = coberturaAnual(this.reglas(), anio, this.calendarios());
    const abiertos = fechasEntre(`${anio}-01-01`, `${anio}-12-31`).filter((f) => resolverDia(this.reglas(), f, this.calendarios()).minutosAbiertos > 0).length;
    const trozos = [
      { clave: 'semana', n: c.semana, color: 'var(--tp-accent)', texto: `Semana habitual: ${c.semana} días` },
      ...c.periodos.map((p) => {
        const per = this.form().periods.find((x) => x.id === p.id);
        return { clave: `p${p.id}`, n: p.dias, color: colorDePeriodo(per?.color), texto: `${per?.name ?? 'Periodo'}: ${p.dias} días` };
      }),
      { clave: 'especiales', n: c.especiales, color: 'var(--tp-especial)', texto: `Días especiales: ${c.especiales}` },
      { clave: 'festivos', n: c.festivos, color: 'var(--tp-festivo)', texto: `Festivos: ${c.festivos}` },
    ].filter((x) => x.n > 0);
    return { total: c.total, abiertos, cerrados: c.total - abiertos, trozos, excepciones: c.total - c.semana };
  });

  protected readonly puedeGuardar = computed(() => !!this.form().name.trim() && !this.faltaSemana() && (this.modo() === 'crear' || this.dirty()));
  protected readonly motivo = computed(() => (!this.form().name.trim() ? 'Ponle un nombre' : this.faltaSemana() ? 'Revisa la semana' : ''));

  /* ── La ficha del día ─────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly ficha = signal<{ top: number | null; bottom: number | null; left: number; arriba: boolean } | null>(null);

  protected colgarFicha(e: { fecha: string; el: HTMLElement }): void {
    const r = e.el.getBoundingClientRect();
    const ancho = 352;
    const left = Math.min(Math.max(16, r.left + r.width / 2 - ancho / 2), window.innerWidth - ancho - 16);
    const cabeAbajo = r.bottom + 470 < window.innerHeight;
    this.ficha.set(cabeAbajo ? { top: r.bottom + 8, bottom: null, left, arriba: false } : { top: null, bottom: window.innerHeight - r.top + 8, left, arriba: true });
  }

  protected cerrarFicha(): void {
    this.ficha.set(null);
    this.seleccion.set(null);
  }

  protected readonly elegido = computed(() => {
    const s = this.seleccion();
    if (!s) return null;
    const fechas = fechasEntre(s.desde, s.hasta);
    const reglas = this.reglas();
    const cals = this.calendarios();
    if (fechas.length === 1) {
      const r = resolverDia(reglas, s.desde, cals);
      return {
        unDia: true as const,
        fecha: s.desde,
        titulo: capital(fmtLargo(s.desde)),
        esHoy: s.desde === this.hoy(),
        abierto: r.tramos.length > 0,
        horas: r.tramos.length ? r.tramos.map((x) => textoDeFranja(x)).join(', ') : 'Cerrado todo el día',
        trozos: r.tramos.map(([a, b]) => ({ desde: a, hasta: b, arrastre: r.arrastre && a === 0 })),
        capas: capasDe(reglas, s.desde, cals),
        r,
        dias: [],
        abiertos: 0,
        total: 1,
      };
    }
    const dias = fechas.map((f) => ({ fecha: f, r: resolverDia(reglas, f, cals) }));
    const abiertos = dias.filter((d) => d.r.tramos.length > 0).length;
    return {
      unDia: false as const,
      fecha: s.desde,
      titulo: `${fmtDia(s.desde)} – ${fmtDiaAnio(s.hasta)}`,
      esHoy: false,
      abierto: abiertos > 0,
      horas: `${fechas.length} días, ${abiertos} abiertos`,
      trozos: [],
      capas: [],
      r: null,
      dias: dias.slice(0, 14).map((d) => ({
        fecha: d.fecha,
        letra: LETRAS[diaDeLaSemana(d.fecha)],
        n: Number(d.fecha.slice(8)),
        trozos: d.r.tramos.map(([a, b]) => ({ desde: a, hasta: b, arrastre: false })),
        tipo: d.r.tipo,
      })),
      abiertos,
      total: fechas.length,
    };
  });

  protected readonly horaPrueba = signal(ahoraEn('Europe/Madrid').minutos - (ahoraEn('Europe/Madrid').minutos % 15));
  protected readonly prueba = computed(() => {
    const e = this.elegido();
    if (!e?.unDia || !e.r) return null;
    const m = this.horaPrueba();
    const abierto = e.r.tramos.some(([a, b]) => m >= a && m < b);
    const deLaVispera = abierto && e.r.arrastre && e.r.tramos[0][0] === 0 && m < e.r.tramos[0][1] && !e.r.franjas.some((f) => f[0] <= m && m < (f[1] <= f[0] ? 1440 : f[1]));
    return { abierto, nota: deLaVispera ? 'Por la franja de noche que empezó la víspera' : '' };
  });

  protected verEnSemana(fecha: string): void {
    this.senalarDia(diaDeLaSemana(fecha));
  }

  protected senalarDia(d: number): void {
    this.senalado.set(null);
    queueMicrotask(() => this.senalado.set(d));
    setTimeout(() => this.senalado.set(null), 1900);
  }

  protected verLista(id: number): void {
    void this.router.navigateByUrl(`/lab/tiempo/festivos/${id}`);
  }

  /* ── Deshacer: cada cambio de un clic se puede volver atrás desde su aviso ──────────────────────────────────────── */

  private conDeshacer(texto: string, cambio: (f: Borrador) => Borrador): void {
    const antes = this.form();
    this.form.update(cambio);
    this.avisos.decir(texto, { etiqueta: 'Deshacer', hacer: () => this.form.set(antes) });
  }

  protected cerrarElegidos(): void {
    const s = this.seleccion();
    if (!s) return;
    const fechas = fechasEntre(s.desde, s.hasta);
    this.conDeshacer(fechas.length === 1 ? 'Día cerrado' : `${fechas.length} días cerrados`, (f) => {
      let specials = f.specials.filter((e) => e.yearly || !fechas.includes(e.date));
      for (const date of fechas) specials = [...specials, { id: siguienteId(specials), name: 'Cerrado', date, yearly: false, slots: [] }];
      return { ...f, specials };
    });
    this.cerrarFicha();
  }

  protected quitarEspecialDe(fecha: string): void {
    const e = this.elegido();
    const esp = e?.r?.especial;
    if (!esp) return;
    this.conDeshacer(`«${esp.name}» quitado`, (f) => ({ ...f, specials: f.specials.filter((x) => x.id !== esp.id) }));
    this.cerrarFicha();
    void fecha;
  }

  protected otrasHoras(abrir = false): void {
    const e = this.elegido();
    if (!e) return;
    this.especialDialog.set({ especial: e.r?.tipo === 'especial' ? e.r.especial : null, fecha: e.fecha, abrir });
    this.ficha.set(null);
  }

  protected periodoDeSeleccion(): void {
    const s = this.seleccion();
    if (s) this.periodoDialog.set({ periodo: null, rango: [s.desde, s.hasta] });
    this.ficha.set(null);
  }

  /* ── Cambia la semana ─────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly filtro = signal<'todo' | Tipo>('todo');
  protected readonly verPasadas = signal(false);

  private usosDe(id: number): number {
    return this.store.items().filter((h) => h.id !== this.horarioId && h.holidayCalendarIds.includes(id)).length + 1;
  }

  protected readonly excepciones = computed<readonly Excepcion[]>(() => {
    const f = this.form();
    const hoy = this.hoy();
    const anio = this.anio();
    const filas: Excepcion[] = [];
    for (const p of f.periods) {
      const y = p.year ?? anio;
      const fechas = new Set(fechasEntre(`${y}-01-01`, `${y}-12-31`).filter((d) => periodoCubre(p, d)));
      filas.push({
        tipo: 'periodo',
        id: p.id,
        nombre: p.name,
        color: colorDePeriodo(p.color),
        cuando: `${fmtDia(`2024-${p.from}`)} – ${fmtDia(`2024-${p.to}`)}${p.year === null ? '' : ` ${p.year}`}`,
        horas: horas(minutosDeSemana(p.week)) + ' a la semana',
        cerrado: false,
        orden: `${p.year ?? 0}-${p.from}`,
        fechas,
        pasada: p.year !== null && `${p.year}-${p.to}` < hoy,
        anual: p.year === null,
        hoja: null,
        barra: trozosDelAnio(p),
      });
    }
    for (const e of f.specials) {
      const fecha = e.yearly ? `${anio}${e.date.slice(4)}` : e.date;
      filas.push({
        tipo: 'especial',
        id: e.id,
        nombre: e.name,
        color: null,
        cuando: e.yearly ? NOMBRES[diaDeLaSemana(fecha)] + ' este año' : `${NOMBRES[diaDeLaSemana(e.date)]}, ${e.date.slice(0, 4)}`,
        horas: e.slots.length ? e.slots.map((x) => textoDeFranja(x)).join(', ') : 'Cerrado',
        cerrado: e.slots.length === 0,
        orden: fecha,
        fechas: new Set([fecha]),
        pasada: !e.yearly && e.date < hoy,
        anual: e.yearly,
        hoja: { mes: MESES_CORTOS[Number(fecha.slice(5, 7)) - 1], dia: Number(fecha.slice(8)) },
        barra: [],
      });
    }
    for (const c of this.calendarios().filter((x) => f.holidayCalendarIds.includes(x.id))) {
      const fechas = new Set(c.days.map((d) => (d.yearly ? `${anio}${d.date.slice(4)}` : d.date)));
      const usos = this.usosDe(c.id);
      filas.push({
        tipo: 'lista',
        id: c.id,
        nombre: c.name,
        color: null,
        cuando: `${c.days.length} días, lista compartida${usos > 1 ? ` con ${usos - 1} ${usos - 1 === 1 ? 'horario más' : 'horarios más'}` : ''}`,
        horas: c.status === 'inactive' ? 'Apagada' : 'Cerrado',
        cerrado: true,
        orden: '0',
        fechas,
        pasada: false,
        anual: false,
        hoja: null,
        barra: [],
      });
    }
    return filas.sort((a, b) => (a.tipo === 'lista' ? -1 : 0) - (b.tipo === 'lista' ? -1 : 0) || a.orden.localeCompare(b.orden));
  });

  protected readonly filtros = computed(() => {
    const ex = this.excepciones().filter((e) => e.pasada === this.verPasadas());
    return [
      { valor: 'todo', etiqueta: 'Todo', n: ex.length },
      { valor: 'lista', etiqueta: 'Festivos', n: ex.filter((e) => e.tipo === 'lista').length },
      { valor: 'periodo', etiqueta: 'Periodos', n: ex.filter((e) => e.tipo === 'periodo').length },
      { valor: 'especial', etiqueta: 'Días', n: ex.filter((e) => e.tipo === 'especial').length },
    ];
  });

  protected readonly visibles = computed(() => {
    const t = this.filtro();
    return this.excepciones().filter((e) => (t === 'todo' || e.tipo === t) && e.pasada === this.verPasadas());
  });
  protected readonly cuantasPasadas = computed(() => this.excepciones().filter((e) => e.pasada).length);

  protected resaltar(e: Excepcion | null): void {
    this.resaltadas.set(e ? e.fechas : new Set());
  }

  protected abrir(e: Excepcion): void {
    if (e.tipo === 'periodo') this.periodoDialog.set({ periodo: this.form().periods.find((p) => p.id === e.id) ?? null, rango: null });
    else if (e.tipo === 'especial') this.especialDialog.set({ especial: this.form().specials.find((x) => x.id === e.id) ?? null, fecha: null, abrir: false });
    else void this.router.navigateByUrl(`/lab/tiempo/festivos/${e.id}`);
    const orden = [...e.fechas].sort();
    const primera = orden.find((f) => f >= this.hoy()) ?? orden[0];
    if (primera && this.vista() === 'meses' && e.tipo !== 'lista') this.inicio.set(primera.slice(0, 7));
  }

  protected quitar(e: Excepcion, ev: Event): void {
    ev.stopPropagation();
    this.resaltar(null);
    this.conDeshacer(e.tipo === 'lista' ? `«${e.nombre}» ya no se aplica` : `«${e.nombre}» quitado`, (f) =>
      e.tipo === 'periodo'
        ? { ...f, periods: f.periods.filter((p) => p.id !== e.id) }
        : e.tipo === 'especial'
          ? { ...f, specials: f.specials.filter((x) => x.id !== e.id) }
          : { ...f, holidayCalendarIds: f.holidayCalendarIds.filter((id) => id !== e.id) },
    );
  }

  /* ── Añadir ───────────────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly menuAnadir = signal(false);
  protected readonly periodoDialog = signal<{ periodo: Periodo | null; rango: readonly [string, string] | null } | null>(null);
  protected readonly especialDialog = signal<{ especial: FechaEspecial | null; fecha: string | null; abrir: boolean } | null>(null);
  protected readonly importando = signal(false);

  protected anadir(que: 'periodo' | 'especial' | 'festivos'): void {
    this.menuAnadir.set(false);
    if (que === 'periodo') this.periodoDialog.set({ periodo: null, rango: null });
    else if (que === 'especial') this.especialDialog.set({ especial: null, fecha: this.seleccion()?.desde ?? null, abrir: false });
    else this.importando.set(true);
  }

  protected guardarPeriodo(p: Periodo): void {
    const nuevo = !this.form().periods.some((x) => x.id === p.id);
    this.form.update((f) => ({ ...f, periods: nuevo ? [...f.periods, p] : f.periods.map((x) => (x.id === p.id ? p : x)) }));
    this.periodoDialog.set(null);
    this.cerrarFicha();
    this.avisos.decir(nuevo ? `Periodo «${p.name}» añadido` : `«${p.name}» actualizado`);
  }

  protected quitarPeriodo(id: number): void {
    const p = this.form().periods.find((x) => x.id === id);
    this.periodoDialog.set(null);
    if (p) this.conDeshacer(`«${p.name}» quitado`, (f) => ({ ...f, periods: f.periods.filter((x) => x.id !== id) }));
  }

  protected guardarEspecial(e: Omit<FechaEspecial, 'id'> & { id: number | null }): void {
    this.form.update((f) => ({
      ...f,
      specials: e.id !== null ? f.specials.map((x) => (x.id === e.id ? { ...e, id: e.id! } : x)) : [...f.specials, { ...e, id: siguienteId(f.specials) }],
    }));
    this.especialDialog.set(null);
    this.cerrarFicha();
    this.avisos.decir(`«${e.name}» ${e.id !== null ? 'actualizado' : 'añadido'}`);
  }

  protected quitarEspecial(id: number): void {
    const e = this.form().specials.find((x) => x.id === id);
    this.especialDialog.set(null);
    if (e) this.conDeshacer(`«${e.name}» quitado`, (f) => ({ ...f, specials: f.specials.filter((x) => x.id !== id) }));
  }

  protected aplicarLista(c: CalendarioDeFestivos | number): void {
    const id = typeof c === 'number' ? c : c.id;
    const nombre = this.calendarios().find((x) => x.id === id)?.name ?? '';
    this.importando.set(false);
    if (this.form().holidayCalendarIds.includes(id)) return;
    this.conDeshacer(`«${nombre}» aplicada`, (f) => ({ ...f, holidayCalendarIds: [...f.holidayCalendarIds, id] }));
    this.filtro.set('todo');
  }

  protected importarDias(dias: readonly Omit<Festivo, 'id'>[]): void {
    this.importando.set(false);
    this.conDeshacer(`${dias.length} festivos añadidos como días especiales`, (f) => {
      let specials = [...f.specials];
      for (const d of dias) {
        if (specials.some((e) => (d.yearly && e.yearly ? e.date.slice(5) === d.date.slice(5) : e.date === d.date))) continue;
        specials = [...specials, { id: siguienteId(specials), name: d.name, date: d.date, yearly: d.yearly, slots: [] }];
      }
      return { ...f, specials };
    });
  }

  /* ── Carga y guardado ─────────────────────────────────────────────────────────────────────────────────────────── */

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null || raw === 'nuevo') {
      this.sucio.markPristine();
      return;
    }
    const h = this.store.items().find((x) => x.id === Number(raw));
    if (!h) {
      void this.router.navigateByUrl('/lab/tiempo', { replaceUrl: true });
      return;
    }
    this.modo.set('editar');
    this.horarioId = h.id;
    const { id: _id, ...datos } = h;
    this.form.set(datos);
    this.sucio.markPristine();
  }

  protected update<K extends keyof Borrador>(key: K, value: Borrador[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected readonly guardado = signal(false);

  protected save(): void {
    if (!this.puedeGuardar()) return;
    const f = this.form();
    const draft: Borrador = { ...f, name: f.name.trim(), description: f.description.trim() };
    if (this.modo() === 'crear') {
      const creado = this.store.addItem(draft);
      this.sucio.markPristine();
      void this.router.navigateByUrl(`/lab/tiempo/horario/${creado.id}`, { replaceUrl: true }).then(() => this.avisos.decir(`«${creado.name}» creado`));
      return;
    }
    this.store.updateItem(this.horarioId!, draft);
    this.form.set(draft);
    this.sucio.markPristine();
    this.avisos.decir('Cambios guardados');
  }

  protected discard(): void {
    this.form.set(this.sucio.pristineValue());
  }

  protected volver(): void {
    void this.router.navigateByUrl('/lab/tiempo');
  }

  /* ── Salir con cambios: lo pregunta la ruta (`tpSalirGuard`) ────────────────────────────────────────────────────── */

  protected readonly saliendo = signal<((v: boolean) => void) | null>(null);

  puedeSalir(): boolean | Promise<boolean> {
    if (!this.dirty() || this.modo() === 'crear') return true;
    return new Promise((ok) => this.saliendo.set(ok));
  }

  protected responderSalida(v: 'seguir' | 'descartar' | 'guardar'): void {
    const ok = this.saliendo();
    this.saliendo.set(null);
    if (!ok) return;
    if (v === 'guardar') this.save();
    if (v === 'descartar') this.discard();
    ok(v !== 'seguir');
  }

  /* ── Teclado y clics fuera ────────────────────────────────────────────────────────────────────────────────────── */

  private hayModal(): boolean {
    return !!(this.periodoDialog() || this.especialDialog() || this.importando() || this.saliendo());
  }

  @HostListener('document:keydown', ['$event'])
  protected tecla(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      this.save();
      return;
    }
    if (e.key === 'Escape' && !this.hayModal()) {
      if (this.menuAnadir()) this.menuAnadir.set(false);
      else this.cerrarFicha();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected fuera(e: PointerEvent): void {
    const t = e.target as HTMLElement;
    if (this.menuAnadir() && !t.closest('.tp-menu, .tp-anadir')) this.menuAnadir.set(false);
    if (this.hayModal() || t.closest('.tp-capa')) return;
    if ((this.ficha() || this.seleccion()) && !t.closest('.tp-ficha, .tp-dia, .tp-mes__sem, .tp-cal__head')) this.cerrarFicha();
  }

  protected readonly nombresDia = NOMBRES;
}
