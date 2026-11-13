import { ChangeDetectionStrategy, Component, computed, DestroyRef, type ElementRef, HostListener, inject, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { type CalendarioDeFestivos, FestivosStore } from '@features/admin/repositories/state/festivos.store';
import { HorarioUsoService, subcanalesConHorario } from '@features/admin/repositories/state/horario-uso.service';
import { ahoraEn, estadoEn, type Horario, horaDe, resumenDeLaSemana, sumarDias } from '@features/admin/repositories/state/horarios.core.mjs';
import { HorariosStore } from '@features/admin/repositories/state/horarios.store';

import { estadoDeHorario } from '../horarios/lab-horarios-estado';
import { activarLabHorarios } from '../horarios/lab-modo';
import { TpIconoComponent } from './tp-icono.component';
import { BANDERAS, TpImportarComponent } from './tp-importar.component';
import { colorDeNombre, faltan, fmtDia, iniciales, LETRAS, MESES_CORTOS, minutosDeSemana, horas, trozosDelDia } from './tp-modelo';
import { TpAvisos, TpAvisosComponent, TpModalComponent, TpSegComponent } from './tp-piezas';
import { T } from './tp-textos';

type Filtro = 'todos' | 'open' | 'closed' | 'inactive';

/** Duración en palabras cortas: «en 2 h 13 min», «en 25 min», «en 3 días». */
function dentroDe(min: number): string {
  if (min < 60) return `en ${min} min`;
  if (min < 1440) return `en ${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`;
  const d = Math.round(min / 1440);
  return `en ${d} ${d === 1 ? 'día' : 'días'}`;
}

/**
 * LABORATORIO «Tiempo» premium: la clasificación de Repositorios con lo relativo al tiempo. Dos listas en una pastilla:
 * Horarios (cada uno con su estado en vivo y su semana dibujada en siete líneas de 24 h) y Festivos (cada lista con su
 * año en una rejilla y su próximo día). Arriba, lo que interesa de un vistazo: cuántos atienden ahora, qué cambia
 * antes y el próximo festivo.
 */
@Component({
  selector: 'sc-tp-tiempo',
  imports: [TpAvisosComponent, TpIconoComponent, TpImportarComponent, TpModalComponent, TpSegComponent],
  templateUrl: './tp-tiempo.page.html',
  // Hojas globales repartidas por dueño: cada una cabe en el presupuesto de estilos por componente.
  styleUrls: ['./tp-base.scss', './tp-piezas.scss', './tp-capas.scss', './tp-listado.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpTiempoPage {
  protected readonly t = T;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly horarios = inject(HorariosStore);
  private readonly festivos = inject(FestivosStore);
  private readonly grupos = inject(GroupsStore);
  private readonly uso = inject(HorarioUsoService);
  private readonly avisos = inject(TpAvisos);

  protected readonly letras = LETRAS;
  protected readonly banderas = Object.entries(BANDERAS);
  protected readonly mesesCortos = MESES_CORTOS;
  protected readonly fmtDia = fmtDia;

  protected readonly lista = toSignal(this.route.queryParamMap.pipe(map((q) => (q.get('lista') === 'festivos' ? 'festivos' : 'horarios'))), {
    initialValue: 'horarios',
  });
  protected readonly filtro = signal<Filtro>('todos');
  protected readonly busqueda = signal('');
  protected readonly importando = signal(false);
  protected readonly menu = signal<{ id: number; x: number; y: number } | null>(null);
  protected readonly borrando = signal<Horario | null>(null);

  private readonly buscador = viewChild<ElementRef<HTMLInputElement>>('buscador');

  /** El reloj de la pantalla: el estado de cada horario se recalcula cada 30 s. */
  protected readonly ahora = signal(new Date());
  constructor() {
    const id = setInterval(() => this.ahora.set(new Date()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
    activarLabHorarios(true);
  }

  protected readonly pestanas = computed(() => [
    { valor: 'horarios', etiqueta: 'Horarios', n: this.horarios.items().length, icono: 'clock' as const },
    { valor: 'festivos', etiqueta: 'Festivos', n: this.festivos.items().length, icono: 'calendar-x' as const },
  ]);

  protected ir(valor: string): void {
    this.busqueda.set('');
    void this.router.navigate([], { queryParams: { lista: valor === 'festivos' ? 'festivos' : null }, replaceUrl: true });
  }

  /* ── Horarios ─────────────────────────────────────────────────────────────────────────────────────────────────── */

  private readonly gruposPorHorario = computed(() => {
    const m = new Map<number, string[]>();
    for (const g of this.grupos.groups()) for (const id of new Set(subcanalesConHorario(g).map((s) => s.id))) m.set(id, [...(m.get(id) ?? []), g.name]);
    return m;
  });

  private readonly todas = computed(() => {
    const cuando = this.ahora();
    const cals = this.festivos.items();
    return this.horarios.items().map((h) => {
      const e = estadoDeHorario(h, cals, cuando);
      const { fecha, minutos } = ahoraEn(h.timezone, cuando);
      const hoyDia = (new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7;
      const grupos = this.gruposPorHorario().get(h.id) ?? [];
      return {
        id: h.id,
        h,
        nombre: h.name,
        zona: h.timezone.replace(/_/g, ' '),
        estado: e.clave,
        detalle: e.detalle,
        dias: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ d, trozos: trozosDelDia(h.week, d), hoy: d === hoyDia, ahora: d === hoyDia && h.status !== 'inactive' ? minutos : null })),
        resumen: resumenDeLaSemana(h.week, LETRAS, 'Cerrado toda la semana', 'Abierto 24/7'),
        horasSemana: horas(minutosDeSemana(h.week)),
        periodos: h.periods.length,
        especiales: h.specials.length,
        listas: h.holidayCalendarIds.filter((id) => cals.some((c) => c.id === id)).length,
        grupos,
      };
    });
  });

  protected readonly cuenta = computed(() => {
    const t = this.todas();
    return { open: t.filter((x) => x.estado === 'open').length, closed: t.filter((x) => x.estado === 'closed').length, inactive: t.filter((x) => x.estado === 'inactive').length };
  });

  protected readonly filtros = computed(() => [
    { valor: 'todos', etiqueta: 'Todos', n: this.todas().length },
    { valor: 'open', etiqueta: 'Abiertos', n: this.cuenta().open },
    { valor: 'closed', etiqueta: 'Cerrados', n: this.cuenta().closed },
    { valor: 'inactive', etiqueta: 'Inactivos', n: this.cuenta().inactive },
  ]);

  protected readonly filas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const f = this.filtro();
    return this.todas().filter((x) => (f === 'todos' || x.estado === f) && (!q || x.nombre.toLowerCase().includes(q) || x.zona.toLowerCase().includes(q)));
  });

  /** El próximo cambio de todos: el horario que antes abre o cierra, y cuándo. */
  protected readonly proximoCambio = computed(() => {
    const cuando = this.ahora();
    const cals = this.festivos.items();
    let mejor: { nombre: string; abre: boolean; hora: string; en: number } | null = null;
    for (const h of this.horarios.items()) {
      if (h.status === 'inactive') continue;
      const { fecha, minutos } = ahoraEn(h.timezone, cuando);
      const e = estadoEn(h, fecha, minutos, cals);
      if (!e.cambia) continue;
      let dias = 0;
      while (sumarDias(fecha, dias) !== e.cambia.fecha && dias < 16) dias++;
      const en = dias * 1440 + e.cambia.minutos - minutos;
      if (!mejor || en < mejor.en) mejor = { nombre: h.name, abre: !e.abierto, hora: horaDe(e.cambia.minutos), en };
    }
    return mejor ? { ...mejor, texto: dentroDe(mejor.en) } : null;
  });

  protected readonly sinUso = computed(() => this.todas().filter((x) => x.estado !== 'inactive' && x.grupos.length === 0).length);

  protected readonly avatarColor = colorDeNombre;
  protected readonly iniciales = iniciales;

  protected abrir(id: number): void {
    void this.router.navigateByUrl(`/lab/tiempo/horario/${id}`);
  }

  protected crear(): void {
    void this.router.navigateByUrl(this.lista() === 'festivos' ? '/lab/tiempo/festivos/nueva' : '/lab/tiempo/horario/nuevo');
  }

  protected abrirMenu(id: number, e: MouseEvent): void {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.menu.set(this.menu()?.id === id ? null : { id, x: r.right, y: r.bottom + 6 });
  }

  protected duplicar(id: number): void {
    this.menu.set(null);
    const h = this.horarios.items().find((x) => x.id === id);
    if (!h) return;
    const { id: _id, ...datos } = h;
    const copia = this.horarios.addItem({ ...datos, name: `${h.name} (copia)` });
    this.avisos.decir(`«${copia.name}» creado`, { etiqueta: 'Deshacer', hacer: () => this.horarios.deleteItem(copia.id) });
  }

  protected pedirBorrar(id: number): void {
    this.menu.set(null);
    this.borrando.set(this.horarios.items().find((x) => x.id === id) ?? null);
  }

  protected readonly gruposDelBorrado = computed(() => {
    const h = this.borrando();
    return h ? (this.gruposPorHorario().get(h.id) ?? []) : [];
  });

  protected borrar(): void {
    const h = this.borrando();
    if (!h) return;
    this.uso.soltar([h.id]);
    this.horarios.deleteItem(h.id);
    this.borrando.set(null);
    this.avisos.decir(`«${h.name}» eliminado`, {
      etiqueta: 'Deshacer',
      hacer: () => this.horarios.setItems((l) => [...l, h].sort((a, b) => a.id - b.id)),
    });
  }

  /* ── Festivos ─────────────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly hoy = computed(() => ahoraEn('Europe/Madrid', this.ahora()).fecha);
  protected readonly anio = computed(() => Number(this.hoy().slice(0, 4)));

  /** Las fechas de una lista en un año: las de ese año y las que se repiten. */
  private fechasDe(c: CalendarioDeFestivos, anio: number): Map<string, string> {
    const m = new Map<string, string>();
    for (const d of c.days) {
      const f = d.yearly ? `${anio}${d.date.slice(4)}` : d.date;
      if (f.startsWith(String(anio))) m.set(f, d.name);
    }
    return m;
  }

  private proximoDe(c: CalendarioDeFestivos): { fecha: string; nombre: string } | null {
    const hoy = this.hoy();
    const todas = [...this.fechasDe(c, this.anio()), ...this.fechasDe(c, this.anio() + 1)].filter(([f]) => f >= hoy).sort(([a], [b]) => a.localeCompare(b));
    return todas[0] ? { fecha: todas[0][0], nombre: todas[0][1] } : null;
  }

  private readonly usosDeLista = computed(() => {
    const n = new Map<number, string[]>();
    for (const h of this.horarios.items()) for (const id of h.holidayCalendarIds) n.set(id, [...(n.get(id) ?? []), h.name]);
    return n;
  });

  protected readonly tarjetas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const anio = this.anio();
    const hoy = this.hoy();
    return this.festivos
      .items()
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .map((c) => {
        const fechas = this.fechasDe(c, anio);
        const p = this.proximoDe(c);
        return {
          id: c.id,
          nombre: c.name,
          activa: c.status !== 'inactive',
          n: c.days.length,
          usos: this.usosDeLista().get(c.id) ?? [],
          proximo: p ? { ...p, mes: MESES_CORTOS[Number(p.fecha.slice(5, 7)) - 1], dia: Number(p.fecha.slice(8)), falta: faltan(hoy, p.fecha) } : null,
          meses: Array.from({ length: 12 }, (_, m) => {
            const total = new Date(Date.UTC(anio, m + 1, 0)).getUTCDate();
            return Array.from({ length: 31 }, (_, d) => {
              if (d >= total) return 'x';
              const f = `${anio}-${String(m + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
              return `${fechas.has(f) ? 'f' : ''}${f < hoy ? 'p' : ''}${f === hoy ? 'h' : ''}`;
            });
          }),
        };
      });
  });

  /** El próximo festivo de todas las listas activas y en cuántos horarios cae. */
  protected readonly proximoFestivo = computed(() => {
    let mejor: { fecha: string; nombre: string; usos: number } | null = null;
    for (const c of this.festivos.items().filter((x) => x.status !== 'inactive')) {
      const p = this.proximoDe(c);
      if (p && (!mejor || p.fecha < mejor.fecha)) mejor = { ...p, usos: this.usosDeLista().get(c.id)?.length ?? 0 };
    }
    return mejor ? { ...mejor, mes: MESES_CORTOS[Number(mejor.fecha.slice(5, 7)) - 1], dia: Number(mejor.fecha.slice(8)), falta: faltan(this.hoy(), mejor.fecha) } : null;
  });

  protected abrirLista(id: number): void {
    void this.router.navigateByUrl(`/lab/tiempo/festivos/${id}`);
  }

  protected importada(c: CalendarioDeFestivos): void {
    this.importando.set(false);
    void this.router.navigateByUrl(`/lab/tiempo/festivos/${c.id}`);
  }

  protected salir(): void {
    activarLabHorarios(false);
    void this.router.navigateByUrl(this.lista() === 'festivos' ? '/admin/festivos' : '/admin/horarios');
  }

  /* ── Teclado y clics fuera ────────────────────────────────────────────────────────────────────────────────────── */

  @HostListener('document:keydown', ['$event'])
  protected tecla(e: KeyboardEvent): void {
    const enCampo = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable]');
    if (e.key === '/' && !enCampo && !this.importando() && !this.borrando()) {
      e.preventDefault();
      this.buscador()?.nativeElement.focus();
    }
    if (e.key === 'Escape') this.menu.set(null);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected fuera(e: PointerEvent): void {
    if (this.menu() && !(e.target as HTMLElement).closest('.tp-menu, .tp-fila__menu')) this.menu.set(null);
  }
}
