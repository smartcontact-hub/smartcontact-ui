import { ChangeDetectionStrategy, Component, computed, HostListener, input, output, signal } from '@angular/core';

import { type Franja, type Semana, validarSemana } from '@features/admin/repositories/state/horarios.core.mjs';

import { TpIconoComponent } from './tp-icono.component';
import { horaCorta, LETRAS, NOMBRES, trozosDelDia } from './tp-modelo';
import { TpHoraComponent } from './tp-piezas';
import { PROBLEMA } from './tp-semana.component';
import { contarUso } from './tp-usos';

/** Arrastrar va de 15 en 15 minutos; el teclado, igual (y de hora en hora con Mayús). */
const PASO = 15;
/** El primer día que se abre, sin otro del que copiar: de 9:00 a 18:00. */
const PRIMERA: Franja = [540, 1080];
/** Una pausa dura una hora y, si cabe, va de 14:00 a 15:00. */
const PAUSA = 60;
const COMIDA = 840;

/** Lo que se arrastra: el inicio, el fin, la franja entera o una franja nueva que se pinta sobre lo vacío. */
type Lado = 0 | 1 | 'mover' | 'pintar';

interface Rango {
  readonly desde: number;
  readonly hasta: number;
}

interface Arrastre {
  readonly dia: number;
  readonly franja: number;
  readonly lado: Lado;
  readonly pista: DOMRect;
  readonly x0: number;
  readonly f0: Franja;
  readonly min: number;
  readonly max: number;
  /** Las horas que se veían al empezar: no cambian mientras se arrastra; al soltar, el mapa se ajusta. */
  readonly rango: Rango;
  /** La semana de antes de empezar: Esc la devuelve. */
  readonly antes: Semana;
  movido: boolean;
}

/** Tras cambiar un día que compartía horas: los días que seguían igual y las horas que tenían. */
interface Oferta {
  readonly dia: number;
  readonly dias: readonly number[];
  readonly previas: readonly Franja[];
}

const igual = (a: readonly Franja[], b: readonly Franja[]): boolean => a.length === b.length && a.every((f, i) => f[0] === b[i][0] && f[1] === b[i][1]);
const cruza = (f: Franja): boolean => f[1] <= f[0];
const enLista = (xs: readonly string[]): string => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : (xs[0] ?? ''));

/**
 * CIERRE DE HORARIOS, la semana en una lista de siete días. Cada fila es un día y lo tiene todo: la letra lo abre o lo
 * cierra, la barra se arrastra (bordes, la franja entera, o pintar en lo vacío) y a la derecha las horas, que se
 * escriben. Un día que se abre trae las horas del día abierto de arriba, así que abrir de lunes a viernes son cinco
 * clics. «Días que comparten horas» ya no es un control: al cambiar un día que compartía horas, se ofrece cambiar
 * también los demás. Las horas que se ven se ajustan solas a lo abierto; el día entero solo con turnos de noche.
 * Siete filas fijas: nada salta al abrir, cerrar o partir un día.
 */
@Component({
  selector: 'sc-tp-dias',
  imports: [TpIconoComponent, TpHoraComponent],
  template: `
    <div class="tp-dias" [class.is-arrastrando]="arrastre() !== null" [attr.data-arrastre]="arrastre()?.lado ?? null" role="group" aria-label="La semana, día a día">
      <div class="tp-dias__eje t-micro t-3 t-num" aria-hidden="true">
        <span class="tp-dias__horas-eje">
          @for (h of marcas(); track h) {
            <span [class.is-ini]="h === rango().desde" [class.is-fin]="h === rango().hasta" [style.left.%]="pos(h)">{{ h / 60 }}</span>
          }
        </span>
      </div>
      @for (f of filas(); track f.dia) {
        <div
          class="tp-dias__fila"
          [attr.data-dia]="f.dia"
          [class.is-abierto]="f.abierto"
          [class.is-mal]="f.mal"
          [class.is-ofrecido]="oferta()?.dias?.includes(f.dia) ?? false"
        >
          <button
            type="button"
            class="tp-chip tp-dias__dia"
            [attr.aria-pressed]="f.abierto"
            [attr.aria-label]="capital(nombres[f.dia])"
            [attr.data-tip]="(f.abierto ? 'Cerrar el ' : 'Abrir el ') + nombres[f.dia]"
            (click)="alternar(f.dia)"
          >
            {{ letras[f.dia] }}
          </button>
          <span class="tp-sem__pista tp-dias__pista" [class.is-cerrada]="!f.abierto" (pointerdown)="pintar($event, f.dia)" (pointermove)="apuntar($event, f.dia)" (pointerleave)="guia.set(null)">
            <span class="tp-sem__guias" aria-hidden="true">
              @for (l of lineas(); track l.m) {
                <span class="tp-sem__guia" [class.is-fuerte]="l.fuerte" [style.left.%]="pos(l.m)"></span>
              }
            </span>
            @for (t of f.trozos; track $index) {
              <span
                class="tp-sem__barra"
                [class.is-arrastre]="t.arrastre"
                [class.is-movible]="t.movible"
                [class.is-viva]="t.viva"
                [style.left.%]="pos(t.desde)"
                [style.width.%]="pos(t.hasta) - pos(t.desde)"
                (pointerdown)="t.movible && empezar($event, f.dia, t.j, 'mover')"
              >
                @if (t.viva) {
                  <span class="tp-sem__globo t-num" aria-hidden="true">{{ t.texto }}</span>
                }
                @if (t.asaIni) {
                  <span
                    class="tp-sem__asa tp-sem__asa--ini"
                    role="slider"
                    tabindex="0"
                    [attr.aria-label]="capital(nombres[f.dia]) + ', empieza'"
                    aria-valuemin="0"
                    aria-valuemax="1440"
                    [attr.aria-valuenow]="t.franja[0]"
                    [attr.aria-valuetext]="hora(t.franja[0])"
                    (pointerdown)="empezar($event, f.dia, t.j, 0)"
                    (keydown)="tecla($event, f.dia, t.j, 0)"
                  ></span>
                }
                @if (t.asaFin) {
                  <span
                    class="tp-sem__asa tp-sem__asa--fin"
                    role="slider"
                    tabindex="0"
                    [attr.aria-label]="capital(nombres[f.dia]) + ', acaba'"
                    aria-valuemin="0"
                    aria-valuemax="1440"
                    [attr.aria-valuenow]="t.franja[1]"
                    [attr.aria-valuetext]="hora(t.franja[1])"
                    (pointerdown)="empezar($event, f.dia, t.j, 1)"
                    (keydown)="tecla($event, f.dia, t.j, 1)"
                  ></span>
                }
              </span>
            }
            @if (guia(); as g) {
              @if (g.dia === f.dia && !arrastre()) {
                <span class="tp-sem__nueva" aria-hidden="true" [style.left.%]="pos(g.min)" [style.width.%]="pos(g.hasta) - pos(g.min)">
                  <sc-tp-icono nombre="plus" [tam]="12" />
                </span>
                <span class="tp-sem__cursor t-num" aria-hidden="true" [style.left.%]="pos(g.min)">
                  <span class="tp-sem__cursor-hora">{{ hora(g.min) }}</span>
                </span>
              }
            }
            @if (ahora()?.dia === f.dia && seVe(ahora()!.minutos)) {
              <span class="tp-sem__ahora" [style.left.%]="pos(ahora()!.minutos)" [attr.data-tip]="guia()?.dia === f.dia ? null : 'Ahora'"></span>
            }
          </span>
          <div class="tp-dias__horas">
            @if (f.abierto) {
              @for (fr of f.franjas; track $index; let j = $index) {
                <span class="tp-dias__franja">
                  <sc-tp-hora [valor]="fr[0]" [etiqueta]="capital(nombres[f.dia]) + ', abre'" (cambio)="ponerHora(f.dia, j, 0, $event)" />
                  <span class="tp-franja__a" aria-hidden="true"></span>
                  <sc-tp-hora [valor]="fr[1]" fin [etiqueta]="capital(nombres[f.dia]) + ', cierra'" (cambio)="ponerHora(f.dia, j, 1, $event)" />
                  @if (fr[0] === 0 && fr[1] === 1440) {
                    <span class="tp-pill tp-franja__noche">24 h</span>
                  } @else if (fr[1] <= fr[0]) {
                    <span class="tp-pill tp-pill--accent tp-franja__noche" data-tip="Acaba al día siguiente"><sc-tp-icono nombre="moon" [tam]="12" />+1</span>
                  }
                </span>
              }
              @if (f.franjas.length > 1) {
                <button type="button" class="tp-btn tp-btn--ghost tp-btn--icon tp-btn--sm tp-dias__quitar" aria-label="Quitar la pausa" data-tip="Quitar la pausa" (click)="quitarPausa(f.dia)">
                  <sc-tp-icono nombre="x" [tam]="14" />
                </button>
              } @else if (f.pausa !== -1) {
                <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm tp-dias__pausa" (click)="pausa(f.dia)">
                  <sc-tp-icono nombre="plus" [tam]="14" />
                  Pausa
                </button>
              }
            } @else {
              <span class="tp-dias__cerrado t-small">Cerrado</span>
            }
            @if (oferta(); as o) {
              @if (o.dia === f.dia) {
                <div class="tp-dias__oferta" role="group" aria-label="Cambiar también otros días">
                  <span class="t-small">¿También {{ diasTexto(o.dias) }}?</span>
                  <button type="button" class="tp-dias__oferta-si" (click)="aplicarOferta()">Sí</button>
                  <button type="button" class="tp-dias__oferta-x" aria-label="Solo este día" data-tip="Solo este día (Esc)" (click)="oferta.set(null)">
                    <sc-tp-icono nombre="x" [tam]="14" />
                  </button>
                </div>
              }
            }
          </div>
        </div>
      }
      <p class="tp-dias__pie t-micro" [class.tp-error]="!!error()" [attr.role]="error() ? 'alert' : null">
        @if (error(); as e) {
          <sc-tp-icono nombre="alert" [tam]="14" />
          {{ capital(nombres[e.dia]) }}: {{ problema[e.codigo] }}
        } @else if (vacia()) {
          Pulsa la letra de un día para abrirlo; los que abras después copian sus horas.
        }
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpDiasComponent {
  readonly semana = input.required<Semana>();
  /** El día de la semana y el minuto de ahora, para la raya de «ahora». */
  readonly ahora = input<{ dia: number; minutos: number } | null>(null);
  readonly semanaChange = output<Semana>();
  /** `true` al empezar un arrastre y `false` al acabarlo: lo que cambia entre medias es un solo paso de deshacer. */
  readonly gesto = output<boolean>();

  protected readonly letras = LETRAS;
  protected readonly nombres = NOMBRES;
  protected readonly problema = PROBLEMA;
  protected readonly hora = horaCorta;
  protected readonly capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
  protected readonly arrastre = signal<Arrastre | null>(null);
  /** Al pasar por lo vacío: la hora bajo el puntero y la hora que se añadiría con un clic. */
  protected readonly guia = signal<{ dia: number; min: number; hasta: number } | null>(null);
  protected readonly oferta = signal<Oferta | null>(null);
  /** El día recién abierto con horas copiadas: cambiarlo no ofrece cambiar los demás (abrir el sábado y acortarlo no es tocar L–V). */
  private recien: number | null = null;

  /* La semana de ahora mismo, aunque lo emitido aún no haya vuelto por la entrada (varios movimientos de un arrastre). */
  private entrada: Semana | null = null;
  private local: Semana = [];
  private actual(): Semana {
    const s = this.semana();
    if (s !== this.entrada) {
      this.entrada = s;
      this.local = s;
    }
    return this.local;
  }
  private emitir(s: Semana): void {
    this.local = s;
    this.semanaChange.emit(s);
  }

  protected readonly vacia = computed(() => this.semana().every((d) => d.length === 0));
  protected readonly error = computed(() => validarSemana(this.semana()));

  /** Las horas que se ven: una hora antes de la primera apertura y una después del último cierre, diez como poco. */
  protected readonly rango = computed<Rango>(() => this.arrastre()?.rango ?? ajuste(this.semana()));

  protected readonly filas = computed(() => {
    const s = this.semana();
    const a = this.arrastre();
    const mal = this.error()?.dia ?? -1;
    return LETRAS.map((_, dia) => {
      const propias = s[dia] ?? [];
      const trozos = trozosDelDia(s, dia).map((t) => {
        const j = t.arrastre ? -1 : propias.indexOf(t.franja);
        return {
          ...t,
          j,
          movible: !t.arrastre && !cruza(t.franja),
          viva: !!a && a.movido && a.dia === dia && a.franja === j,
          asaIni: !t.arrastre,
          asaFin: !t.arrastre && !cruza(t.franja),
          texto: `${horaCorta(t.franja[0])}–${horaCorta(t.franja[1])}`,
        };
      });
      return { dia, abierto: propias.length > 0, franjas: propias, trozos, mal: mal === dia, pausa: dondePausa(propias) };
    });
  });

  /** Las horas escritas encima: cada hora si caben, si no cada dos o cada tres. */
  protected readonly marcas = computed(() => {
    const { desde, hasta } = this.rango();
    const paso = hasta - desde <= 840 ? 60 : hasta - desde <= 1080 ? 120 : 180;
    const out: number[] = [];
    for (let m = Math.ceil(desde / paso) * paso; m <= hasta; m += paso) out.push(m);
    return out;
  });
  /** Una línea cada hora y una más marcada cada tres. */
  protected readonly lineas = computed(() => {
    const { desde, hasta } = this.rango();
    const out: { m: number; fuerte: boolean }[] = [];
    for (let m = desde + 60; m < hasta; m += 60) out.push({ m, fuerte: m % 180 === 0 });
    return out;
  });

  protected pos(m: number): number {
    const { desde, hasta } = this.rango();
    return Math.min(100, Math.max(0, ((m - desde) / (hasta - desde)) * 100));
  }
  protected seVe(m: number): boolean {
    const { desde, hasta } = this.rango();
    return m >= desde && m <= hasta;
  }

  /** «el martes» o, con varios, sus letras: «M, X, J y V». */
  protected diasTexto(dias: readonly number[]): string {
    return dias.length === 1 ? `el ${NOMBRES[dias[0]]}` : enLista(dias.map((d) => LETRAS[d]));
  }

  /* ── Abrir y cerrar, horas, pausa ─────────────────────────────────────────────────────────────────────────────── */

  /** Abrir un día trae las horas del día abierto más cercano por arriba (o por abajo); el primero, de 9:00 a 18:00. */
  protected alternar(dia: number): void {
    const s = this.actual();
    this.oferta.set(null);
    if (s[dia].length) {
      contarUso('cerrar');
      this.emitir(s.map((f, d) => (d === dia ? [] : f)));
      return;
    }
    contarUso('abrir');
    this.recien = dia;
    const orden = [...Array.from({ length: dia }, (_, k) => dia - 1 - k), ...Array.from({ length: 6 - dia }, (_, k) => dia + 1 + k)];
    const fuente = orden.find((d) => s[d].length > 0);
    const franjas: Franja[] = fuente === undefined ? [[...PRIMERA]] : s[fuente].map((f) => [f[0], f[1]] as Franja);
    this.emitir(s.map((f, d) => (d === dia ? franjas : f)));
  }

  protected ponerHora(dia: number, j: number, lado: 0 | 1, minutos: number): void {
    const f = this.actual()[dia]?.[j];
    if (!f) return;
    contarUso('escribir');
    this.cambiarDia(
      dia,
      this.actual()[dia].map((x, k) => (k === j ? ((lado === 0 ? [minutos, x[1]] : [x[0], minutos]) as Franja) : x)),
    );
  }

  /** Parte en dos la franja más larga con una hora de pausa: de 14:00 a 15:00 si cabe, si no en medio. */
  protected pausa(dia: number): void {
    const fs = this.actual()[dia];
    const j = dondePausa(fs);
    if (j === -1) return;
    const [a, b] = fs[j];
    const ini = COMIDA - a >= 60 && b - (COMIDA + PAUSA) >= 60 ? COMIDA : Math.round(((a + b) / 2 - PAUSA / 2) / PASO) * PASO;
    contarUso('dividir');
    this.cambiarDia(dia, [...fs.slice(0, j), [a, ini], [ini + PAUSA, b], ...fs.slice(j + 1)]);
  }

  /** Quitar la pausa junta las dos últimas franjas en una. */
  protected quitarPausa(dia: number): void {
    const fs = this.actual()[dia];
    if (fs.length < 2) return;
    const n = fs.length;
    contarUso('borrar');
    this.cambiarDia(dia, [...fs.slice(0, n - 2), [fs[n - 2][0], fs[n - 1][1]]]);
  }

  private cambiarDia(dia: number, franjas: readonly Franja[]): void {
    const s = this.actual();
    const previas = s[dia];
    this.emitir(s.map((f, d) => (d === dia ? [...franjas] : f)));
    this.ofrecer(dia, previas);
  }

  /**
   * Tras cambiar un día: si otros días abiertos tenían sus mismas horas, se ofrece cambiarlos también. Varios cambios
   * seguidos en el mismo día mantienen la oferta con las horas de antes del primero.
   */
  private ofrecer(dia: number, previas: readonly Franja[]): void {
    const s = this.actual();
    if (dia !== this.recien) this.recien = null;
    if (dia === this.recien) {
      this.oferta.set(null);
      return;
    }
    const o = this.oferta();
    const sigue = o?.dia === dia;
    const base = sigue ? o.previas : previas;
    const dias = sigue ? o.dias : s.map((f, d) => (d !== dia && f.length > 0 && igual(f, previas) ? d : -1)).filter((d) => d !== -1);
    this.oferta.set(dias.length && !igual(s[dia], base) ? { dia, dias, previas: base } : null);
  }

  protected aplicarOferta(): void {
    const o = this.oferta();
    if (!o) return;
    const s = this.actual();
    contarUso('tambien');
    this.oferta.set(null);
    this.emitir(s.map((f, d) => (o.dias.includes(d) ? s[o.dia].map((x) => [x[0], x[1]] as Franja) : f)));
  }

  /* ── Arrastrar ────────────────────────────────────────────────────────────────────────────────────────────────── */

  /** Hasta dónde puede ir un borde sin pisar lo que ya hay ese día. Una franja mide al menos 15 minutos. */
  private limites(dia: number, j: number, lado: Lado): { min: number; max: number } {
    const s = this.actual();
    const f = s[dia][j];
    const otros = trozosDelDia(s, dia).filter((t) => t.franja !== f);
    const antes = Math.max(0, ...otros.filter((t) => t.hasta <= f[0]).map((t) => t.hasta));
    const despues = Math.min(1440, ...otros.filter((t) => t.desde > f[0]).map((t) => t.desde));
    if (lado === 0) return { min: antes, max: cruza(f) ? 1440 - PASO : f[1] - PASO };
    if (lado === 1) return { min: f[0] + PASO, max: despues };
    return { min: antes, max: despues };
  }

  private minutoEn(e: { readonly clientX: number }, pista: DOMRect): number {
    const { desde, hasta } = this.rango();
    const m = desde + Math.round((((e.clientX - pista.left) / pista.width) * (hasta - desde)) / PASO) * PASO;
    return Math.min(hasta, Math.max(desde, m));
  }

  private hueco(dia: number, m: number): { min: number; max: number } | null {
    const trozos = trozosDelDia(this.actual(), dia);
    if (trozos.some((t) => m >= t.desde && m < t.hasta)) return null;
    const min = Math.max(0, ...trozos.filter((t) => t.hasta <= m).map((t) => t.hasta));
    const max = Math.min(1440, ...trozos.filter((t) => t.desde >= m).map((t) => t.desde));
    return max - min >= PASO ? { min, max } : null;
  }

  protected apuntar(e: PointerEvent, dia: number): void {
    if (this.arrastre() || e.pointerType === 'touch') return;
    const pista = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const m = this.minutoEn(e, pista);
    const h = this.hueco(dia, Math.min(m, 1440 - PASO));
    if (!h || (e.target as HTMLElement).closest('.tp-sem__barra')) {
      if (this.guia()) this.guia.set(null);
      return;
    }
    const desde = Math.min(Math.max(m, h.min), h.max - PASO);
    const ya = this.guia();
    if (ya?.dia === dia && ya.min === desde) return;
    this.guia.set({ dia, min: desde, hasta: Math.min(desde + 60, h.max) });
  }

  protected empezar(e: PointerEvent, dia: number, j: number, lado: Lado): void {
    if (e.button !== 0 || j < 0) return;
    e.preventDefault();
    e.stopPropagation();
    const pista = (e.currentTarget as HTMLElement).closest('.tp-sem__pista')!.getBoundingClientRect();
    const s = this.actual();
    this.guia.set(null);
    this.gesto.emit(true);
    this.arrastre.set({ dia, franja: j, lado, pista, x0: e.clientX, f0: s[dia][j], rango: this.rango(), antes: s, movido: false, ...this.limites(dia, j, lado) });
  }

  /** Pintar sobre lo vacío: nace una franja donde se pulsa y crece hacia donde se arrastre. En un día cerrado, lo abre. */
  protected pintar(e: PointerEvent, dia: number): void {
    if (e.button !== 0 || this.arrastre()) return;
    const pista = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const m = this.minutoEn(e, pista);
    const h = this.hueco(dia, Math.min(m, 1440 - PASO));
    if (!h) return;
    e.preventDefault();
    const antes = this.actual();
    const desde = Math.min(Math.max(m, h.min), h.max - PASO);
    const nueva: Franja = [desde, desde + PASO];
    const franjas = antes[dia];
    // En su sitio por la hora de inicio: la franja de noche, si la hay, sigue siendo la última.
    const j = franjas.filter((f) => f[0] < desde).length;
    this.guia.set(null);
    this.gesto.emit(true);
    this.emitir(antes.map((f, d) => (d === dia ? [...franjas.slice(0, j), nueva, ...franjas.slice(j)] : f)));
    this.arrastre.set({ dia, franja: j, lado: 'pintar', pista, x0: e.clientX, f0: nueva, rango: this.rango(), antes, movido: false, min: h.min, max: h.max });
  }

  private ponerFranja(dia: number, j: number, f: Franja): void {
    const s = this.actual();
    this.emitir(s.map((x, d) => (d === dia ? x.map((y, k) => (k === j ? f : y)) : x)));
  }

  @HostListener('document:pointermove', ['$event'])
  protected mover(e: PointerEvent): void {
    const a = this.arrastre();
    if (!a) return;
    if (!a.movido && Math.abs(e.clientX - a.x0) < 3) return;
    if (!a.movido) this.arrastre.set({ ...a, movido: true });
    a.movido = true;
    const aMin = (px: number): number => Math.round(((px / a.pista.width) * (a.rango.hasta - a.rango.desde)) / PASO) * PASO;
    const enPista = (x: number): number => a.rango.desde + aMin(x - a.pista.left);
    const dentro = (n: number): number => Math.min(a.max, Math.max(a.min, n));
    if (a.lado === 'mover') {
      const largo = a.f0[1] - a.f0[0];
      const desde = Math.min(a.max - largo, Math.max(a.min, a.f0[0] + aMin(e.clientX - a.x0)));
      this.ponerFranja(a.dia, a.franja, [desde, desde + largo]);
      return;
    }
    if (a.lado === 'pintar') {
      const m = dentro(enPista(e.clientX));
      const ini = Math.min(a.f0[0], m);
      const fin = Math.max(a.f0[0] + PASO, m);
      this.ponerFranja(a.dia, a.franja, [Math.min(ini, a.max - PASO), Math.min(Math.max(fin, ini + PASO), a.max)]);
      return;
    }
    const m = dentro(enPista(e.clientX));
    this.ponerFranja(a.dia, a.franja, a.lado === 0 ? [m, a.f0[1]] : [a.f0[0], m]);
  }

  @HostListener('document:pointerup')
  protected soltar(): void {
    const a = this.arrastre();
    if (!a) return;
    // Un clic en lo vacío, sin arrastrar, pone una hora (o lo que quepa).
    if (a.lado === 'pintar' && !a.movido) this.ponerFranja(a.dia, a.franja, [a.f0[0], Math.min(a.f0[0] + 60, a.max)]);
    if (a.lado === 'pintar') contarUso('pintar');
    else if (a.movido) contarUso('arrastrar');
    this.juntarTocadas(a.dia);
    this.arrastre.set(null);
    this.gesto.emit(false);
    this.ofrecer(a.dia, a.antes[a.dia]);
  }

  /** Dos franjas que se tocan son una: en atención, de 9 a 14 y de 14 a 18 es de 9 a 18. */
  private juntarTocadas(dia: number): void {
    const s = this.actual();
    const franjas: Franja[] = [];
    for (const f of s[dia]) {
      const prev = franjas[franjas.length - 1];
      if (prev && !cruza(prev) && !cruza(f) && prev[1] === f[0]) franjas[franjas.length - 1] = [prev[0], f[1]];
      else franjas.push(f);
    }
    if (franjas.length !== s[dia].length) this.emitir(s.map((x, d) => (d === dia ? franjas : x)));
  }

  /** Esc: a medio arrastre, todo vuelve a como estaba; si no, se descarta la oferta. */
  @HostListener('document:pointercancel')
  @HostListener('document:keydown.escape')
  protected cancelar(): void {
    const a = this.arrastre();
    if (!a) {
      this.oferta.set(null);
      return;
    }
    this.arrastre.set(null);
    this.emitir(a.antes);
    this.gesto.emit(false);
  }

  /** Pulsar fuera del día de la oferta la descarta: lo siguiente ya es otra cosa. */
  @HostListener('document:pointerdown', ['$event'])
  protected fuera(e: PointerEvent): void {
    const o = this.oferta();
    if (!o) return;
    const fila = (e.target as HTMLElement | null)?.closest?.('.tp-dias__fila');
    if (fila?.getAttribute('data-dia') !== String(o.dia)) this.oferta.set(null);
  }

  /** Flechas en un borde: 15 minutos; con Mayús, una hora. */
  protected tecla(e: KeyboardEvent, dia: number, j: number, lado: 0 | 1): void {
    const paso = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!paso || j < 0) return;
    e.preventDefault();
    const { min, max } = this.limites(dia, j, lado);
    const f = this.actual()[dia][j];
    const m = Math.min(max, Math.max(min, f[lado] + paso * (e.shiftKey ? 60 : PASO)));
    this.cambiarDia(
      dia,
      this.actual()[dia].map((x, k) => (k === j ? ((lado === 0 ? [m, f[1]] : [f[0], m]) as Franja) : x)),
    );
  }
}

/** Las horas que se ven: con turnos de noche o 24 h, el día entero; si no, una hora de margen y diez horas como poco. */
function ajuste(s: Semana): Rango {
  const fs = s.flat();
  if (fs.some((f) => cruza(f) || (f[0] === 0 && f[1] === 1440))) return { desde: 0, hasta: 1440 };
  if (!fs.length) return { desde: 480, hasta: 1200 };
  let desde = Math.max(0, Math.floor(Math.min(...fs.map((f) => f[0])) / 60) * 60 - 60);
  let hasta = Math.min(1440, Math.ceil(Math.max(...fs.map((f) => f[1])) / 60) * 60 + 60);
  while (hasta - desde < 600) {
    if (hasta < 1440) hasta += 60;
    if (hasta - desde < 600 && desde > 0) desde -= 60;
  }
  return { desde, hasta };
}

/** La franja donde cabe una pausa de una hora con una hora a cada lado (la más larga), o -1. Una sola pausa por día. */
function dondePausa(fs: readonly Franja[]): number {
  if (fs.length !== 1) return -1;
  return !cruza(fs[0]) && fs[0][1] - fs[0][0] >= PAUSA + 120 ? 0 : -1;
}
