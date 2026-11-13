import { ChangeDetectionStrategy, Component, computed, HostListener, inject, type OnInit, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { type CalendarioDeFestivos, type Festivo, FestivosStore } from '@features/admin/repositories/state/festivos.store';
import { ahoraEn, diaDeLaSemana, fechasEntre, siguienteId } from '@features/admin/repositories/state/horarios.core.mjs';
import { HorariosStore } from '@features/admin/repositories/state/horarios.store';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { estadoDeHorario } from '../horarios/lab-horarios-estado';
import { activarLabHorarios } from '../horarios/lab-modo';
import { TpIconoComponent } from './tp-icono.component';
import { TpImportarComponent } from './tp-importar.component';
import { capital, colorDeNombre, faltan, fmtLargo, iniciales, LETRAS, MESES, MESES_CORTOS, NOMBRES } from './tp-modelo';
import { TpAvisos, TpAvisosComponent, TpModalComponent } from './tp-piezas';
import { T } from './tp-textos';

type Borrador = Omit<CalendarioDeFestivos, 'id'>;
const VACIA: Borrador = { name: '', description: '', status: 'active', days: [] };
const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * LABORATORIO «Tiempo» premium: una lista de festivos. El año entero a la vista en doce meses: pulsar un día lo añade o
 * lo quita (Mayús+clic, varios seguidos). A la derecha, los horarios que la aplican, cada uno con su interruptor, y sus
 * días con el nombre editable en la fila.
 */
@Component({
  selector: 'sc-tp-festivos',
  imports: [TpAvisosComponent, TpIconoComponent, TpImportarComponent, TpModalComponent],
  templateUrl: './tp-festivos.page.html',
  // Hojas globales repartidas por dueño: cada una cabe en el presupuesto de estilos por componente.
  styleUrls: ['./tp-base.scss', './tp-piezas.scss', './tp-capas.scss', './tp-festivos.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpFestivosPage implements OnInit {
  protected readonly t = T;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(FestivosStore);
  private readonly horarios = inject(HorariosStore);
  private readonly avisos = inject(TpAvisos);

  protected readonly letras = LETRAS;
  protected readonly avatarColor = colorDeNombre;
  protected readonly iniciales = iniciales;

  protected readonly modo = signal<'crear' | 'editar'>('crear');
  private id: number | null = null;
  protected readonly form = signal<Borrador>(VACIA);
  /** Los horarios que la aplican, en borrador: se escriben al guardar. */
  protected readonly aplicada = signal<readonly number[]>([]);
  private readonly sucio = createFormDirtyState(() => ({ form: this.form(), aplicada: this.aplicada() }));
  protected readonly dirty = this.sucio.dirty;

  protected readonly hoy = ahoraEn('Europe/Madrid').fecha;
  protected readonly anio = signal(Number(this.hoy.slice(0, 4)));
  protected readonly nuevo = signal<number | null>(null);
  protected readonly resaltada = signal<string | null>(null);
  protected readonly importando = signal(false);
  private ancla: string | null = null;

  constructor() {
    activarLabHorarios(true);
  }

  /** La fecha de cada día de la lista en el año a la vista. */
  private readonly enAnio = computed(() => {
    const a = this.anio();
    const m = new Map<string, Festivo>();
    for (const d of this.form().days) {
      const f = d.yearly ? `${a}${d.date.slice(4)}` : d.date;
      if (f.startsWith(String(a))) m.set(f, d);
    }
    return m;
  });

  protected readonly meses = computed(() => {
    const a = this.anio();
    const marcados = this.enAnio();
    return Array.from({ length: 12 }, (_, m) => {
      const total = new Date(Date.UTC(a, m + 1, 0)).getUTCDate();
      const primero = `${a}-${pad(m + 1)}-01`;
      const celdas: ({ fecha: string; n: number; f: Festivo | null; finde: boolean } | null)[] = Array.from({ length: diaDeLaSemana(primero) }, () => null);
      for (let d = 1; d <= total; d++) {
        const fecha = `${a}-${pad(m + 1)}-${pad(d)}`;
        celdas.push({ fecha, n: d, f: marcados.get(fecha) ?? null, finde: diaDeLaSemana(fecha) >= 5 });
      }
      while (celdas.length < 42) celdas.push(null);
      return { nombre: MESES[m], celdas, cuantos: [...marcados.keys()].filter((f) => f.slice(5, 7) === pad(m + 1)).length };
    });
  });

  protected readonly filas = computed(() => {
    const a = this.anio();
    return [...this.form().days]
      .map((d) => {
        const fecha = d.yearly ? `${a}${d.date.slice(4)}` : d.date;
        return {
          ...d,
          fecha,
          mes: MESES_CORTOS[Number(fecha.slice(5, 7)) - 1],
          dia: Number(fecha.slice(8)),
          semana: NOMBRES[diaDeLaSemana(fecha)],
          pasado: fecha < this.hoy,
          otroAnio: !d.yearly && !d.date.startsWith(String(a)),
        };
      })
      .sort((x, y) => Number(x.pasado) - Number(y.pasado) || x.fecha.localeCompare(y.fecha));
  });
  protected readonly primerPasado = computed(() => this.filas().find((f) => f.pasado)?.id ?? null);

  protected readonly proximo = computed(() => {
    const p = this.filas().find((f) => !f.pasado);
    return p ? { nombre: p.name || 'Festivo', cuando: faltan(this.hoy, p.fecha) } : null;
  });

  protected readonly filasHorarios = computed(() => {
    const ap = new Set(this.aplicada());
    return this.horarios.items().map((h) => ({ id: h.id, nombre: h.name, aplicada: ap.has(h.id), estado: estadoDeHorario(h, []) }));
  });

  /* ── Marcar en el calendario ──────────────────────────────────────────────────────────────────────────────────── */

  private diaEn(fecha: string): Festivo | undefined {
    return this.form().days.find((d) => (d.yearly ? d.date.slice(5) === fecha.slice(5) : d.date === fecha));
  }

  private conDeshacer(texto: string, cambio: (f: Borrador) => Borrador): void {
    const antes = this.form();
    this.form.update(cambio);
    this.avisos.decir(texto, { etiqueta: 'Deshacer', hacer: () => this.form.set(antes) });
  }

  protected pulsar(fecha: string, e: MouseEvent): void {
    if (e.shiftKey && this.ancla) {
      const [a, b] = [this.ancla, fecha].sort();
      const nuevas = fechasEntre(a, b).filter((f) => !this.diaEn(f));
      if (nuevas.length === 0) return;
      this.conDeshacer(`${nuevas.length} días añadidos`, (f) => {
        let days = [...f.days];
        for (const date of nuevas) days = [...days, { id: siguienteId(days), name: 'Festivo', date, yearly: false }];
        return { ...f, days };
      });
      this.ancla = fecha;
      return;
    }
    this.ancla = fecha;
    const ya = this.diaEn(fecha);
    if (ya) {
      this.conDeshacer(`«${ya.name || 'Festivo'}» quitado`, (f) => ({ ...f, days: f.days.filter((d) => d.id !== ya.id) }));
      return;
    }
    const id = siguienteId(this.form().days);
    this.form.update((f) => ({ ...f, days: [...f.days, { id, name: '', date: fecha, yearly: false }] }));
    this.nuevo.set(id);
    // El nombre se escribe en su fila: el foco va ahí.
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(`[data-dia="${id}"] input`);
      input?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      input?.focus();
    });
  }

  protected cambiar(id: number, cambio: Partial<Festivo>): void {
    this.form.update((f) => ({ ...f, days: f.days.map((d) => (d.id === id ? { ...d, ...cambio } : d)) }));
  }

  protected quitar(id: number): void {
    const d = this.form().days.find((x) => x.id === id);
    this.conDeshacer(`«${d?.name || 'Festivo'}» quitado`, (f) => ({ ...f, days: f.days.filter((x) => x.id !== id) }));
  }

  protected sumar(dias: readonly Omit<Festivo, 'id'>[]): void {
    this.importando.set(false);
    let n = 0;
    this.conDeshacer('Festivos añadidos', (f) => {
      let days = [...f.days];
      for (const d of dias) {
        if (days.some((x) => (d.yearly && x.yearly ? x.date.slice(5) === d.date.slice(5) : x.date === d.date))) continue;
        days = [...days, { ...d, id: siguienteId(days) }];
        n++;
      }
      return { ...f, days };
    });
    void n;
  }

  protected alternarHorario(id: number): void {
    this.aplicada.update((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  protected etiquetaDia(c: { fecha: string; f: Festivo | null }): string {
    return `${capital(fmtLargo(c.fecha))}${c.f ? `: ${c.f.name || 'festivo'}` : ''}`;
  }

  /* ── Carga y guardado ─────────────────────────────────────────────────────────────────────────────────────────── */

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw !== null && raw !== 'nueva') {
      const c = this.store.items().find((x) => x.id === Number(raw));
      if (!c) {
        void this.router.navigateByUrl('/lab/tiempo?lista=festivos', { replaceUrl: true });
        return;
      }
      this.modo.set('editar');
      this.id = c.id;
      const { id: _id, ...datos } = c;
      this.form.set(datos);
      this.aplicada.set(this.horarios.items().filter((h) => h.holidayCalendarIds.includes(c.id)).map((h) => h.id));
    }
    this.sucio.markPristine();
  }

  protected update<K extends keyof Borrador>(key: K, value: Borrador[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected readonly puedeGuardar = computed(() => !!this.form().name.trim() && (this.modo() === 'crear' || this.dirty()));

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
      if (tiene !== aplicada.has(h.id)) this.horarios.updateItem(h.id, { holidayCalendarIds: tiene ? h.holidayCalendarIds.filter((x) => x !== id) : [...h.holidayCalendarIds, id] });
    }
    this.form.set(draft);
    this.sucio.markPristine();
    if (this.modo() === 'crear') {
      void this.router.navigateByUrl(`/lab/tiempo/festivos/${id}`, { replaceUrl: true }).then(() => this.avisos.decir(`«${draft.name}» creada`));
      return;
    }
    this.avisos.decir('Cambios guardados');
  }

  protected discard(): void {
    const v = this.sucio.pristineValue();
    this.form.set(v.form);
    this.aplicada.set(v.aplicada);
  }

  protected volver(): void {
    void this.router.navigateByUrl('/lab/tiempo?lista=festivos');
  }

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

  @HostListener('document:keydown', ['$event'])
  protected tecla(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      this.save();
    }
  }
}
