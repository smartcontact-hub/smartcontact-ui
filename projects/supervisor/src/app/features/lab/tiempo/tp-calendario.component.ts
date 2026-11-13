import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';

import { type CalendarioDeFestivos, diaDeLaSemana, resolverDia, sumarDias } from '@features/admin/repositories/state/horarios.core.mjs';

import { TpIconoComponent } from './tp-icono.component';
import { calor, colorDePeriodo, fmtLargo, LETRAS, MESES, MESES_CORTOS, NOMBRES, type Reglas, textoDeFranja } from './tp-modelo';
import { TpSegComponent } from './tp-piezas';
import { T } from './tp-textos';

/** Lo elegido: un día (desde = hasta) o un rango. */
export interface Seleccion {
  readonly desde: string;
  readonly hasta: string;
}

interface Celda {
  readonly fecha: string;
  readonly numero: number;
  readonly calor: number;
  readonly tipo: 'semana' | 'periodo' | 'especial' | 'festivo';
  readonly color: string | null;
  readonly aria: string;
  readonly pasado: boolean;
}

interface Mes {
  readonly clave: string;
  readonly nombre: string;
  readonly anio: number;
  readonly semanas: readonly { readonly lunes: string; readonly numero: number; readonly celdas: readonly (Celda | null)[] }[];
  /** Para la vista de año: los días en fila, del 1 al último. */
  readonly dias: readonly Celda[];
}

const iso = (y: number, m: number, d: number): string => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function semanaIso(fecha: string): number {
  const d = new Date(`${fecha}T00:00:00Z`);
  const jueves = new Date(d.getTime() + (3 - diaDeLaSemana(fecha)) * 86_400_000);
  const primero = new Date(Date.UTC(jueves.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((jueves.getTime() - primero.getTime()) / 86_400_000 - 3 + diaDeLaSemana(primero.toISOString().slice(0, 10))) / 7);
}

/**
 * El calendario con calor: cada día se tiñe según las horas que abre (más horas, más color), los cerrados van rayados y
 * lo que cambia la semana se ve por su color (periodo con el suyo, día especial en ámbar, festivo en rosa). Siempre
 * seis semanas por mes, así no salta al cambiar de mes. Clic elige un día, Mayús+clic un rango, el número de semana la
 * semana entera. En modo «festivos» solo se pintan los días de la lista.
 */
@Component({
  selector: 'sc-tp-calendario',
  imports: [TpIconoComponent, TpSegComponent],
  template: `
    <div class="tp-cal__head">
      <div class="tp-cal__nav">
        <button type="button" class="tp-btn tp-btn--ghost tp-btn--icon tp-btn--sm" [attr.aria-label]="t.anterior" (click)="mover(-1)">
          <sc-tp-icono nombre="chevron-left" [tam]="16" />
        </button>
        <button type="button" class="tp-btn tp-btn--ghost tp-btn--icon tp-btn--sm" [attr.aria-label]="t.siguiente" (click)="mover(1)">
          <sc-tp-icono nombre="chevron-right" [tam]="16" />
        </button>
      </div>
      <h3 class="t-title t-num tp-cal__titulo">{{ titulo() }}</h3>
      <button type="button" class="tp-btn tp-btn--sm" (click)="irAHoy()">Hoy</button>
      <span class="tp-spacer"></span>
      <sc-tp-seg pequeno [etiqueta]="t.vista" [opciones]="vistas" [valor]="vista()" (cambio)="vista.set($any($event))" />
    </div>

    @if (vista() === 'anio') {
      <div class="tp-cal__anio" role="grid" [attr.aria-label]="t.calendario">
        <span></span>
        @for (n of numeros; track n) {
          <span class="tp-cal__n t-num" aria-hidden="true">{{ n % 5 === 0 || n === 1 ? n : '' }}</span>
        }
        @for (mes of meses(); track mes.clave; let k = $index) {
          <button type="button" class="tp-cal__mesbtn t-micro t-strong" [attr.data-tip]="'Ver ' + mes.nombre" (click)="abrirMes(k)">{{ cortos[k] }}</button>
          @for (c of mes.dias; track c.fecha) {
            <button
              type="button"
              class="tp-dia tp-dia--mini"
              [attr.data-fecha]="c.fecha"
              [attr.data-tipo]="c.tipo"
              [attr.data-calor]="c.calor"
              [style.--c]="c.color"
              [class.is-hoy]="c.fecha === hoy()"
              [class.is-pasado]="c.pasado"
              [class.is-sel]="elegida(c.fecha)"
              [class.is-ext]="extremo(c.fecha)"
              [class.is-res]="resaltadas().has(c.fecha)"
              [attr.aria-label]="c.aria"
              [attr.aria-pressed]="elegida(c.fecha)"
              (click)="elegir(c.fecha, $event)"
            ></button>
          }
          @for (h of relleno(mes.dias.length); track $index) {
            <span></span>
          }
        }
      </div>
    } @else {
      <div class="tp-cal__meses" role="group" [attr.aria-label]="t.calendario">
        @for (mes of meses(); track mes.clave) {
          <section class="tp-mes" [animate.enter]="dir() > 0 ? 'tp-mes--de-dcha' : 'tp-mes--de-izda'">
            <h4 class="tp-mes__nombre t-small t-strong">{{ mes.nombre }} <span class="t-3 t-num">{{ mes.anio }}</span></h4>
            <div class="tp-mes__grid">
              <span></span>
              @for (l of letras; track d; let d = $index) {
                <button type="button" class="tp-mes__ini" [attr.data-tip]="'Ver los ' + nombres[d] + ' en la semana'" (click)="diaDeSemana.emit(d)">{{ l }}</button>
              }
              @for (s of mes.semanas; track $index) {
                @if (s.lunes) {
                  <button type="button" class="tp-mes__sem t-num" [attr.aria-label]="t.semanaN(s.numero)" (click)="elegirSemana(s.lunes)">{{ s.numero }}</button>
                } @else {
                  <span></span>
                }
                @for (c of s.celdas; track $index) {
                  @if (c) {
                    <button
                      type="button"
                      class="tp-dia"
                      [attr.data-fecha]="c.fecha"
                      [attr.data-tipo]="c.tipo"
                      [attr.data-calor]="c.calor"
                      [style.--c]="c.color"
                      [class.is-hoy]="c.fecha === hoy()"
                      [class.is-pasado]="c.pasado"
                      [class.is-sel]="elegida(c.fecha)"
                      [class.is-ext]="extremo(c.fecha)"
                      [class.is-res]="resaltadas().has(c.fecha)"
                      [attr.aria-label]="c.aria"
                      [attr.aria-pressed]="elegida(c.fecha)"
                      (click)="elegir(c.fecha, $event)"
                    >
                      {{ c.numero }}
                    </button>
                  } @else {
                    <span class="tp-dia tp-dia--vacio"></span>
                  }
                }
              }
            </div>
          </section>
        }
      </div>
    }

    <div class="tp-cal__leyenda t-micro t-2">
      @if (modo() === 'horario') {
        <span class="tp-ley"><span class="tp-ley__rampa" aria-hidden="true"><i data-calor="1"></i><i data-calor="2"></i><i data-calor="3"></i><i data-calor="4"></i></span>Horas abiertas</span>
        <span class="tp-ley"><i class="tp-ley__m" data-calor="0" aria-hidden="true"></i>Cerrado</span>
        <span class="tp-ley"><i class="tp-ley__m tp-ley__m--periodo" aria-hidden="true"></i>Periodo</span>
        <span class="tp-ley"><i class="tp-ley__m tp-ley__m--especial" aria-hidden="true"></i>Día especial</span>
        <span class="tp-ley"><i class="tp-ley__m tp-ley__m--festivo" aria-hidden="true"></i>Festivo</span>
      } @else {
        <span class="tp-ley"><i class="tp-ley__m tp-ley__m--festivo" aria-hidden="true"></i>En la lista</span>
        <span class="tp-ley"><i class="tp-ley__m tp-ley__m--hoy" aria-hidden="true"></i>Hoy</span>
      }
      <span class="tp-spacer"></span>
      <span class="t-3"><kbd class="tp-kbd">Mayús</kbd> + clic elige varios</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpCalendarioComponent {
  protected readonly t = T;
  readonly reglas = input.required<Reglas>();
  readonly calendarios = input<readonly CalendarioDeFestivos[]>([]);
  readonly hoy = input.required<string>();
  readonly resaltadas = input<ReadonlySet<string>>(new Set());
  readonly modo = input<'horario' | 'festivos'>('horario');
  readonly seleccion = model<Seleccion | null>(null);
  /** El primer mes a la vista, `YYYY-MM`. */
  readonly inicio = model.required<string>();
  readonly vista = model<'meses' | 'anio'>('meses');
  readonly diaDeSemana = output<number>();
  /** Se pulsó un día: con su botón, para colgarle la ficha. */
  readonly pulsado = output<{ fecha: string; el: HTMLElement }>();

  protected readonly letras = LETRAS;
  protected readonly nombres = NOMBRES;
  protected readonly cortos = MESES_CORTOS;
  protected readonly numeros = Array.from({ length: 31 }, (_, i) => i + 1);
  protected readonly vistas = [
    { valor: 'meses', etiqueta: '3 meses' },
    { valor: 'anio', etiqueta: 'Año' },
  ];
  /** Hacia dónde se movió: los meses nuevos entran desde ese lado. */
  protected readonly dir = signal(1);
  private ancla: string | null = null;

  protected relleno(n: number): unknown[] {
    return Array.from({ length: 31 - n });
  }

  private celda(fecha: string): Celda {
    const r = resolverDia(this.reglas(), fecha, this.calendarios());
    const festivos = this.modo() === 'festivos';
    const tipo = festivos ? (r.tipo === 'festivo' ? 'festivo' : 'semana') : r.tipo;
    const horas = r.tramos.length ? r.tramos.map((x) => textoDeFranja(x)).join(', ') : 'cerrado';
    const motivo = r.tipo === 'festivo' ? `, festivo: ${r.festivo?.name}` : r.tipo === 'especial' ? `, día especial: ${r.especial?.name}` : r.tipo === 'periodo' ? `, periodo ${r.periodo?.name}` : '';
    return {
      fecha,
      numero: Number(fecha.slice(8)),
      calor: festivos ? -1 : calor(r.minutosAbiertos),
      tipo,
      color: tipo === 'periodo' ? colorDePeriodo(r.periodo?.color) : null,
      aria: festivos ? `${fmtLargo(fecha)}${r.tipo === 'festivo' ? `: ${r.festivo?.name || 'festivo'}` : ''}` : `${fmtLargo(fecha)}: ${horas}${motivo}`,
      pasado: fecha < this.hoy(),
    };
  }

  protected readonly meses = computed<Mes[]>(() => {
    const [y0, m0] = this.inicio().split('-').map(Number);
    const anio = this.vista() === 'anio';
    const n = anio ? 12 : 3;
    const desde = anio ? { y: y0, m: 0 } : { y: y0, m: m0 - 1 };
    return Array.from({ length: n }, (_, k) => {
      const y = desde.y + Math.floor((desde.m + k) / 12);
      const m = (desde.m + k) % 12;
      const total = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const dias = Array.from({ length: total }, (_, d) => this.celda(iso(y, m, d + 1)));
      if (anio) return { clave: `${y}-${m}`, nombre: MESES[m], anio: y, semanas: [], dias };
      const huecos = diaDeLaSemana(iso(y, m, 1));
      const celdas: (Celda | null)[] = [...Array.from({ length: huecos }, () => null), ...dias];
      while (celdas.length < 42) celdas.push(null);
      const semanas = Array.from({ length: 6 }, (_, i) => {
        const fila = celdas.slice(i * 7, i * 7 + 7);
        const primera = fila.find((c) => c !== null);
        const lunes = primera ? sumarDias(primera.fecha, -diaDeLaSemana(primera.fecha)) : '';
        return { lunes, numero: lunes ? semanaIso(lunes) : 0, celdas: fila };
      });
      return { clave: `${y}-${m}`, nombre: MESES[m], anio: y, semanas, dias };
    });
  });

  protected readonly titulo = computed(() => {
    const ms = this.meses();
    if (this.vista() === 'anio') return String(ms[0].anio);
    const a = ms[0];
    const b = ms[ms.length - 1];
    const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
    return a.anio === b.anio ? `${cap(a.nombre)} – ${b.nombre} ${b.anio}` : `${cap(a.nombre)} ${a.anio} – ${b.nombre} ${b.anio}`;
  });

  protected elegida(fecha: string): boolean {
    const s = this.seleccion();
    return !!s && fecha >= s.desde && fecha <= s.hasta;
  }

  protected extremo(fecha: string): boolean {
    const s = this.seleccion();
    return !!s && (fecha === s.desde || fecha === s.hasta);
  }

  protected elegir(fecha: string, e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    if (e.shiftKey && this.ancla) {
      const [a, b] = [this.ancla, fecha].sort();
      this.seleccion.set({ desde: a, hasta: b });
      this.pulsado.emit({ fecha, el });
      return;
    }
    const s = this.seleccion();
    if (s && s.desde === fecha && s.hasta === fecha) {
      this.seleccion.set(null);
      this.ancla = null;
      return;
    }
    this.ancla = fecha;
    this.seleccion.set({ desde: fecha, hasta: fecha });
    this.pulsado.emit({ fecha, el });
  }

  protected elegirSemana(lunes: string): void {
    this.ancla = lunes;
    this.seleccion.set({ desde: lunes, hasta: sumarDias(lunes, 6) });
    queueMicrotask(() => {
      const el = document.querySelector<HTMLElement>(`.tp-dia[data-fecha="${sumarDias(lunes, 6)}"]`);
      if (el) this.pulsado.emit({ fecha: sumarDias(lunes, 6), el });
    });
  }

  protected mover(paso: number): void {
    const [y, m] = this.inicio().split('-').map(Number);
    const salto = this.vista() === 'anio' ? 12 * paso : 3 * paso;
    const t = y * 12 + (m - 1) + salto;
    this.dir.set(paso);
    this.inicio.set(`${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`);
  }

  protected abrirMes(k: number): void {
    this.inicio.set(`${this.inicio().slice(0, 4)}-${String(k + 1).padStart(2, '0')}`);
    this.vista.set('meses');
  }

  protected irAHoy(): void {
    const h = this.hoy();
    this.dir.set(h.slice(0, 7) >= this.inicio() ? 1 : -1);
    this.inicio.set(h.slice(0, 7));
    this.ancla = h;
    this.seleccion.set({ desde: h, hasta: h });
    queueMicrotask(() => {
      const el = document.querySelector<HTMLElement>(`.tp-dia[data-fecha="${h}"]`);
      if (el) this.pulsado.emit({ fecha: h, el });
    });
  }
}
