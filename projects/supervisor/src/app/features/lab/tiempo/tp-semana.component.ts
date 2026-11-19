import { booleanAttribute, ChangeDetectionStrategy, Component, computed, HostListener, input, output, signal } from '@angular/core';

import { type Franja, type Semana, validarSemana } from '@features/admin/repositories/state/horarios.core.mjs';

import { TpIconoComponent } from './tp-icono.component';
import { horaCorta, horas, LETRAS, NOMBRES, semanaDe, type Tramo, tramosDe, trozosDelDia } from './tp-modelo';
import { type OpcionSeg, TpHoraComponent, TpSegComponent } from './tp-piezas';
import { T } from './tp-textos';

const PROBLEMA: Record<string, string> = {
  hora: 'falta una hora o no es válida',
  vacia: 'una franja empieza y acaba a la vez',
  solape: 'dos franjas se pisan',
  noche: 'solo la última franja puede pasar de medianoche',
  pisa_siguiente: 'la franja de noche pisa la mañana siguiente',
};

/** Lo que se arrastra en el mapa: el inicio, el fin, la franja entera o una franja nueva que se pinta sobre lo rojo. */
type Lado = 0 | 1 | 'mover' | 'pintar';
/** Arrastrar va de 15 en 15 minutos; el teclado, igual (y de hora en hora con Mayús). */
const PASO = 15;

/** Las horas que enseña el mapa, en minutos. */
interface Rango {
  readonly desde: number;
  readonly hasta: number;
}
/** La jornada: de 7:00 a 22:00 como poco. Así se ve de cerca lo que se trabaja, sin la madrugada vacía. */
const JORNADA: Rango = { desde: 420, hasta: 1320 };
const DIA: Rango = { desde: 0, hasta: 1440 };

interface Arrastre {
  readonly tramo: number;
  readonly franja: number;
  readonly lado: Lado;
  readonly dia: number;
  readonly pista: DOMRect;
  readonly x0: number;
  readonly f0: Franja;
  readonly min: number;
  readonly max: number;
  /** Las horas que enseñaba el mapa al empezar: no cambian mientras se arrastra, aunque la franja salga de ellas. */
  readonly rango: Rango;
  /** Los tramos de antes de empezar: Esc los devuelve. */
  readonly antes: Tramo[];
  /** Si el puntero se ha movido: pintar sin moverse es un clic, que pone una hora. */
  movido: boolean;
}

/** Lo que dice la guía al pasar por una fila: la hora bajo el puntero y, si ahí cabe una franja, hasta dónde iría. */
interface Guia {
  readonly dia: number;
  readonly min: number;
  readonly libre: boolean;
  readonly hasta: number;
}

/**
 * CIERRE DE HORARIOS: la semana, en dos piezas que se miran, en el orden en que se piensa un horario. Primero lo que se
 * escribe, los tramos: unos días que comparten franjas («de lunes a viernes, de 9:00 a 18:00»). Marcar un día en un
 * tramo le copia esas horas, así que copiar el lunes a martes, miércoles y jueves son tres clics y ningún diálogo. Un
 * día solo vive en un tramo: marcarlo en otro lo mueve. Debajo, cómo queda: la semana dibujada, en verde lo que se
 * trabaja y en rojo lo que no, con las horas escritas en cada barra para que un «19:35» salte a la vista; los bordes de
 * cada barra se arrastran (de 15 en 15 min) y la barra entera se mueve.
 *
 * El dibujo enseña la jornada, de 7:00 a 22:00, y crece solo hasta la primera y la última hora abiertas con una hora de
 * margen: nunca esconde una hora en la que se atiende. «De 0 a 24» enseña el día entero, para pintar de madrugada.
 *
 * Lo que hace que se sienta a mano: al pasar por lo rojo, una raya dice la hora bajo el puntero y un bloque fantasma
 * dice lo que se añadiría; arrastrar sobre lo rojo pinta una franja nueva y un clic pone una hora. Pasar por un día de
 * una fila enseña en el mapa cómo quedaría ese día. Esc cancela un arrastre a medias, y cada gesto avisa al empezar y al
 * acabar (`gesto`) para que deshacer lo cuente como un solo paso.
 */
@Component({
  selector: 'sc-tp-semana',
  imports: [TpHoraComponent, TpIconoComponent, TpSegComponent],
  template: `
    <div class="tp-sem" [class.tp-sem--compacta]="compacta()" [class.is-arrastrando]="arrastre() !== null" [attr.data-arrastre]="arrastre()?.lado ?? null">
      <!-- Lo que se escribe: los días que comparten horas -->
      <div class="tp-sem__tramos-cab">
        <span class="t-eyebrow">Días que comparten horas</span>
        <span class="t-micro t-3">Marca un día para darle las horas de su fila</span>
      </div>
      <ol class="tp-tramos" role="list">
        @for (tramo of tramos(); track $index; let i = $index) {
          <li
            class="tp-tramo"
            [class.is-on]="activo() === i"
            (mouseenter)="activo.set(i)"
            (mouseleave)="activo.set(null)"
            (focusin)="activo.set(i)"
            (focusout)="activo.set(null)"
          >
            <div class="tp-tramo__dias" role="group" [attr.aria-label]="t.diasDelTramo(i)">
              @for (l of letras; track d; let d = $index) {
                <button
                  type="button"
                  class="tp-chip"
                  [class.is-otro]="!tramo.dias.includes(d) && tramoDe(d) !== -1"
                  [attr.aria-pressed]="tramo.dias.includes(d)"
                  [attr.aria-label]="nombres[d]"
                  [attr.data-tip]="ayudaDeChip(i, d)"
                  (mouseenter)="vista.set({ tramo: i, dia: d })"
                  (mouseleave)="vista.set(null)"
                  (focus)="vista.set({ tramo: i, dia: d })"
                  (blur)="vista.set(null)"
                  (click)="alternar(i, d)"
                >
                  {{ l }}
                </button>
              }
            </div>
            <div class="tp-tramo__franjas">
              @if (es24(tramo)) {
                <span class="tp-tramo__siempre t-small t-2"><sc-tp-icono nombre="clock" [tam]="14" />Todo el día, de 0:00 a 24:00</span>
              } @else {
                @for (f of tramo.franjas; track $index; let j = $index) {
                  <div class="tp-franja">
                    <sc-tp-hora [valor]="f[0]" [etiqueta]="t.desde" (cambio)="ponerHora(i, j, 0, $event)" />
                    <span class="tp-franja__a" aria-hidden="true"></span>
                    <sc-tp-hora [valor]="f[1]" fin [etiqueta]="t.hasta" (cambio)="ponerHora(i, j, 1, $event)" />
                    @if (f[1] <= f[0]) {
                      <span class="tp-pill tp-pill--accent tp-franja__noche" data-tip="Acaba al día siguiente"><sc-tp-icono nombre="moon" [tam]="12" />+1</span>
                    }
                    @if (tramo.franjas.length > 1) {
                      <button type="button" class="tp-btn tp-btn--ghost tp-btn--icon tp-btn--sm tp-franja__x" [attr.aria-label]="t.quitarFranja" (click)="quitarFranja(i, j)">
                        <sc-tp-icono nombre="x" [tam]="14" />
                      </button>
                    }
                  </div>
                }
                <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm tp-tramo__mas" (click)="anadirFranja(i)">
                  <sc-tp-icono nombre="plus" [tam]="14" />
                  Franja
                </button>
              }
            </div>
            <span class="tp-spacer"></span>
            <div class="tp-tramo__acc">
              <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm tp-tramo__24" [attr.aria-pressed]="es24(tramo)" (click)="poner24(i)">24 h</button>
              <button type="button" class="tp-btn tp-btn--ghost tp-btn--icon tp-btn--sm" [attr.aria-label]="t.quitarTramo(i)" data-tip="Cerrar estos días" (click)="quitar(i)">
                <sc-tp-icono nombre="x" [tam]="14" />
              </button>
            </div>
          </li>
        }
      </ol>

      <div class="tp-sem__pie">
        <button type="button" class="tp-btn tp-btn--sm" [disabled]="cerrados().length === 0" (click)="anadir()">
          <sc-tp-icono nombre="plus" [tam]="14" />
          Días con otro horario
        </button>
        @if (cerrados().length > 0 && cerrados().length < 7) {
          <span class="t-micro t-3">Cerrado {{ cerradosTexto() }}</span>
        }
      </div>

      <!-- Cómo queda: la semana dibujada, que también se edita -->
      <div class="tp-sem__mapa" role="group" [attr.aria-label]="resumenAccesible()">
        <div class="tp-sem__mapa-cab">
          <span class="t-eyebrow">Así queda la semana</span>
          @if (vistas(); as vs) {
            <sc-tp-seg pequeno [etiqueta]="t.horasQueSeVen" [opciones]="vs" [valor]="dia24() ? 'dia' : 'jornada'" (cambio)="dia24.set($event === 'dia')" />
          }
        </div>
        <div class="tp-sem__eje t-micro t-3 t-num" aria-hidden="true">
          <span></span>
          <span class="tp-sem__horas">
            @for (h of marcas(); track h) {
              <span [class.is-ini]="h === rango().desde" [class.is-fin]="h === rango().hasta" [style.left.%]="pos(h)">{{ h / 60 }}</span>
            }
          </span>
          <span></span>
        </div>
        @for (f of filas(); track f.dia) {
          <div
            class="tp-sem__fila"
            [class.is-on]="filaEncendida(f.dia)"
            [class.is-hoy]="ahora()?.dia === f.dia"
            [class.is-mal]="error()?.dia === f.dia"
            [class.is-senalado]="senalado() === f.dia"
            [class.is-vista]="vista()?.dia === f.dia"
            (mouseenter)="activo.set(f.tramo)"
            (mouseleave)="activo.set(null)"
          >
            <span class="tp-sem__letra t-small t-strong" [attr.data-tip]="capital(nombres[f.dia])">{{ letras[f.dia] }}</span>
            <span
              class="tp-sem__pista"
              [class.is-cerrada]="f.trozos.length === 0"
              (pointerdown)="pintar($event, f.dia)"
              (pointermove)="apuntar($event, f.dia)"
              (pointerleave)="guia.set(null)"
            >
              <span class="tp-sem__guias" aria-hidden="true">
                @for (l of lineas(); track l.m) {
                  <span class="tp-sem__guia" [class.is-fuerte]="l.fuerte" [style.left.%]="l.x"></span>
                }
              </span>
              @for (t of f.trozos; track $index) {
                <span
                  class="tp-sem__barra"
                  [class.is-arrastre]="t.arrastre"
                  [class.is-movible]="t.movible"
                  [class.is-viva]="t.vivo"
                  [class.is-sale]="f.sale"
                  [style.left.%]="pos(t.desde)"
                  [style.width.%]="largo(t.desde, t.hasta)"
                  [attr.data-tip]="t.vivo || arrastre() ? null : t.texto"
                  (pointerdown)="t.movible && empezar($event, f.dia, t.tramo, t.franja, 'mover')"
                >
                  @if (t.etiqueta) {
                    <span class="tp-sem__txt t-num">{{ t.etiqueta }}</span>
                  }
                  @if (t.vivo) {
                    <span class="tp-sem__globo t-num" aria-hidden="true">{{ t.texto }}</span>
                  }
                  @if (t.asaInicio) {
                    <span
                      class="tp-sem__asa tp-sem__asa--ini"
                      role="slider"
                      tabindex="0"
                      [attr.aria-label]="capital(nombres[f.dia]) + ', empieza'"
                      aria-valuemin="0"
                      aria-valuemax="1440"
                      [attr.aria-valuenow]="t.inicio"
                      [attr.aria-valuetext]="hora(t.inicio)"
                      (pointerdown)="empezar($event, f.dia, t.tramo, t.franja, 0)"
                      (keydown)="tecla($event, f.dia, t.tramo, t.franja, 0)"
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
                      [attr.aria-valuenow]="t.fin"
                      [attr.aria-valuetext]="hora(t.fin)"
                      (pointerdown)="empezar($event, f.dia, t.tramo, t.franja, 1)"
                      (keydown)="tecla($event, f.dia, t.tramo, t.franja, 1)"
                    ></span>
                  }
                </span>
              }
              <!-- Lo que tendría este día si se marca en la fila que se está mirando. -->
              @for (g of f.fantasmas; track $index) {
                <span class="tp-sem__fantasma" aria-hidden="true" [style.left.%]="pos(g.desde)" [style.width.%]="largo(g.desde, g.hasta)"></span>
              }
              <!-- Al pasar por lo rojo: la hora bajo el puntero y la hora que se añadiría con un clic. -->
              @if (guia(); as gu) {
                @if (gu.dia === f.dia && !arrastre()) {
                  @if (gu.libre) {
                    <span class="tp-sem__nueva" aria-hidden="true" [style.left.%]="pos(gu.min)" [style.width.%]="largo(gu.min, gu.hasta)">
                      <sc-tp-icono nombre="plus" [tam]="12" />
                    </span>
                  }
                  <span class="tp-sem__cursor t-num" aria-hidden="true" [style.left.%]="pos(gu.min)">
                    <span class="tp-sem__cursor-hora">{{ hora(gu.min) }}</span>
                  </span>
                }
              }
              @if (ahora()?.dia === f.dia && seVe(ahora()!.minutos)) {
                <span class="tp-sem__ahora" [style.left.%]="pos(ahora()!.minutos)" data-tip="Ahora"></span>
              }
            </span>
            <span class="tp-sem__total t-small t-num" [class.is-cerrado]="f.minutos === 0">{{ f.minutos === 0 ? 'Cerrado' : horasTxt(f.minutos) }}</span>
          </div>
        }
        <div class="tp-sem__leyenda t-micro t-3" aria-hidden="true">
          <span class="tp-sem__clave tp-sem__clave--si"></span>Se atiende
          <span class="tp-sem__clave tp-sem__clave--no"></span>No se atiende
          <span class="tp-spacer"></span>
          Arrastra sobre el rojo para añadir horas y los bordes para cambiarlas
        </div>
        @if (error(); as e) {
          <p class="tp-error tp-sem__error" role="alert">
            <sc-tp-icono nombre="alert" [tam]="14" />
            {{ capital(nombres[e.dia]) }}: {{ problema[e.codigo] }}
          </p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpSemanaComponent {
  protected readonly t = T;
  readonly semana = input.required<Semana>();
  /** Un día a señalar. */
  readonly senalado = input<number | null>(null);
  /** El día de la semana y el minuto de ahora, para la raya de «ahora». */
  readonly ahora = input<{ dia: number; minutos: number } | null>(null);
  readonly compacta = input(false, { transform: booleanAttribute });
  readonly semanaChange = output<Semana>();
  /** `true` al empezar un arrastre y `false` al acabarlo: lo que cambia entre medias es un solo paso de deshacer. */
  readonly gesto = output<boolean>();

  protected readonly letras = LETRAS;
  protected readonly nombres = NOMBRES;
  protected readonly problema = PROBLEMA;
  protected readonly capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
  protected readonly horasTxt = horas;
  protected readonly hora = horaCorta;
  protected readonly activo = signal<number | null>(null);
  protected readonly arrastre = signal<Arrastre | null>(null);
  protected readonly guia = signal<Guia | null>(null);
  /** El día de una fila de tramos por el que pasa el puntero: el mapa enseña cómo quedaría. */
  protected readonly vista = signal<{ tramo: number; dia: number } | null>(null);
  /** El mapa enseña el día entero en vez de la jornada. */
  protected readonly dia24 = signal(false);

  /* Los tramos viven aparte mientras se editan: uno recién añadido aún no tiene días y la semana no puede contarlo. Se
   * recalculan cuando la semana llega de fuera (deshacer, cargar). */
  private ultima: Semana | null = null;
  private borrador: Tramo[] = [];
  protected readonly tramos = computed<Tramo[]>(() => {
    const s = this.semana();
    if (s !== this.ultima) this.borrador = tramosDe(s);
    return this.borrador;
  });
  /** Los tramos de ahora mismo, aunque la semana que acabamos de emitir aún no haya vuelto por la entrada. */
  private vivos(): Tramo[] {
    this.tramos();
    return this.borrador;
  }

  protected tramoDe(dia: number): number {
    return this.tramos().findIndex((t) => t.dias.includes(dia));
  }

  /* ── Las horas que se ven ─────────────────────────────────────────────────────────────────────────────────────── */

  /** La jornada de esta semana: de 7:00 a 22:00, o más si abre antes o cierra después, con una hora de margen. */
  protected readonly jornada = computed<Rango>(() => {
    const s = this.semana();
    const trozos = [0, 1, 2, 3, 4, 5, 6].flatMap((d) => trozosDelDia(s, d));
    if (!trozos.length) return JORNADA;
    const ini = Math.min(...trozos.map((t) => t.desde));
    const fin = Math.max(...trozos.map((t) => t.hasta));
    return {
      desde: Math.max(0, Math.min(JORNADA.desde, Math.floor(ini / 60) * 60 - 60)),
      hasta: Math.min(1440, Math.max(JORNADA.hasta, Math.ceil(fin / 60) * 60 + 60)),
    };
  });

  /** Lo que enseña el mapa. Mientras se arrastra no cambia: la escala no se mueve bajo el dedo. */
  protected readonly rango = computed<Rango>(() => this.arrastre()?.rango ?? (this.dia24() ? DIA : this.jornada()));

  /** Jornada o 24 h; si la jornada ya es el día entero, no hay nada que elegir. */
  protected readonly vistas = computed<readonly OpcionSeg[] | null>(() => {
    const j = this.jornada();
    if (j.desde === 0 && j.hasta === 1440) return null;
    return [
      { valor: 'jornada', etiqueta: `De ${j.desde / 60} a ${j.hasta / 60}` },
      { valor: 'dia', etiqueta: 'De 0 a 24' },
    ];
  });

  /** Las horas escritas encima: cada hora en la jornada; cada tres, si se ven más de 16. */
  protected readonly marcas = computed(() => {
    const { desde, hasta } = this.rango();
    const cada = hasta - desde > 960 ? 180 : 60;
    const out: number[] = [];
    for (let m = Math.ceil(desde / cada) * cada; m <= hasta; m += cada) out.push(m);
    return out;
  });

  /** La cuadrícula: una raya cada hora, más marcada cada tres. */
  protected readonly lineas = computed(() => {
    const { desde, hasta } = this.rango();
    const out: { m: number; x: number; fuerte: boolean }[] = [];
    for (let m = Math.ceil((desde + 1) / 60) * 60; m < hasta; m += 60) out.push({ m, x: this.pos(m), fuerte: m % 180 === 0 });
    return out;
  });

  /** Dónde cae un minuto en el mapa, en %, sin salirse de lo que se ve. */
  protected pos(m: number): number {
    const r = this.rango();
    return ((Math.min(Math.max(m, r.desde), r.hasta) - r.desde) / (r.hasta - r.desde)) * 100;
  }

  protected largo(desde: number, hasta: number): number {
    return this.pos(hasta) - this.pos(desde);
  }

  protected seVe(m: number): boolean {
    const r = this.rango();
    return m >= r.desde && m <= r.hasta;
  }

  protected readonly filas = computed(() => {
    const s = this.semana();
    const tramos = this.tramos();
    const a = this.arrastre();
    const v = this.vista();
    // Las horas caben en la barra según lo que ocupa en pantalla, no en el reloj: en la jornada caben antes.
    const { desde: r0, hasta: r1 } = this.rango();
    const escala = 1440 / (r1 - r0);
    return [0, 1, 2, 3, 4, 5, 6].map((dia) => {
      const trozos = trozosDelDia(s, dia).map((tz) => {
        // El trozo que viene de la víspera es la cola de una franja de la víspera: su fin se arrastra desde aquí.
        const de = tz.arrastre ? (dia + 6) % 7 : dia;
        const tramo = tramos.findIndex((t) => t.dias.includes(de));
        const franja = (s[de] ?? []).indexOf(tz.franja);
        const cruza = tz.franja[1] <= tz.franja[0];
        const ancho = tz.hasta - tz.desde;
        const texto = tz.arrastre ? `Viene de la víspera, hasta las ${horaCorta(tz.franja[1])}` : `${horaCorta(tz.franja[0])}–${horaCorta(tz.franja[1])}`;
        const etiqueta = ancho * escala < 170 ? '' : tz.arrastre ? `→ ${horaCorta(tz.franja[1])}` : cruza ? `${horaCorta(tz.franja[0])} →` : texto;
        return {
          ...tz,
          tramo,
          franja,
          texto,
          etiqueta,
          inicio: tz.franja[0],
          fin: tz.franja[1],
          asaInicio: !tz.arrastre && tramo >= 0,
          asaFin: tramo >= 0 && (tz.arrastre || !cruza),
          movible: !tz.arrastre && !cruza && tramo >= 0,
          vivo: !!a && a.tramo === tramo && a.franja === franja && a.dia === dia,
        };
      });
      // Pasando por un día en una fila de tramos: si no está en ella, sus horas en fantasma; si está, lo suyo se apaga.
      const visto = v?.dia === dia ? tramos[v.tramo] : undefined;
      const entra = !!visto && !visto.dias.includes(dia);
      const fantasmas = entra ? visto.franjas.map((f) => ({ desde: f[0], hasta: f[1] > f[0] ? f[1] : 1440 })) : [];
      return { dia, trozos, fantasmas, sale: !!visto && !entra, tramo: this.tramoDe(dia), minutos: trozos.reduce((n, t) => n + t.hasta - t.desde, 0) };
    });
  });

  protected filaEncendida(dia: number): boolean {
    const a = this.arrastre()?.tramo ?? this.activo();
    return a !== null && a >= 0 && (this.tramos()[a]?.dias.includes(dia) ?? false);
  }

  protected readonly error = computed(() => validarSemana(this.semana()));

  protected readonly cerrados = computed(() => {
    const usados = new Set(this.tramos().flatMap((t) => t.dias));
    return [0, 1, 2, 3, 4, 5, 6].filter((d) => !usados.has(d));
  });
  protected readonly cerradosTexto = computed(() => {
    const n = this.cerrados().map((d) => NOMBRES[d]);
    return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}` : n[0];
  });

  protected readonly resumenAccesible = computed(() =>
    this.filas()
      .map((f) => `${NOMBRES[f.dia]}: ${f.trozos.length ? f.trozos.map((t) => t.texto).join(', ') : 'cerrado'}`)
      .join('; '),
  );

  protected ayudaDeChip(i: number, d: number): string {
    const dia = this.capital(NOMBRES[d]);
    if (this.tramos()[i].dias.includes(d)) return `${dia}: quitar de esta fila (queda cerrado)`;
    return this.tramoDe(d) === -1 ? `${dia}: darle estas horas` : `${dia}: pasarlo a estas horas`;
  }

  protected es24(t: Tramo): boolean {
    return t.franjas.length === 1 && t.franjas[0][0] === 0 && t.franjas[0][1] === 1440;
  }

  private emitir(tramos: Tramo[]): void {
    this.borrador = tramos;
    const s = semanaDe(tramos);
    this.ultima = s;
    this.semanaChange.emit(s);
  }

  protected alternar(i: number, dia: number): void {
    const tramos = this.vivos();
    const ya = tramos[i].dias.includes(dia);
    this.emitir(tramos.map((t, j) => (j === i ? { ...t, dias: ya ? t.dias.filter((d) => d !== dia) : [...t.dias, dia].sort() } : ya ? t : { ...t, dias: t.dias.filter((d) => d !== dia) })));
  }

  private ponerFranja(i: number, j: number, f: Franja): void {
    this.emitir(this.vivos().map((t, k) => (k === i ? { ...t, franjas: t.franjas.map((x, m) => (m === j ? f : x)) } : t)));
  }

  protected ponerHora(i: number, j: number, lado: 0 | 1, minutos: number): void {
    const f = this.vivos()[i]?.franjas[j];
    if (f) this.ponerFranja(i, j, lado === 0 ? [minutos, f[1]] : [f[0], minutos]);
  }

  protected poner24(i: number): void {
    this.emitir(this.vivos().map((t, k) => (k === i ? { ...t, franjas: this.es24(t) ? [[540, 1080] as Franja] : [[0, 1440] as Franja] } : t)));
  }

  protected anadirFranja(i: number): void {
    this.emitir(
      this.vivos().map((t, k) => {
        if (k !== i) return t;
        const ultima = t.franjas[t.franjas.length - 1];
        if (!ultima) return { ...t, franjas: [[540, 1080] as Franja] };
        const desde = Math.min((ultima[1] > ultima[0] ? ultima[1] : 1380) + 60, 1380);
        return { ...t, franjas: [...t.franjas, [desde, Math.min(desde + 180, 1440)] as Franja] };
      }),
    );
  }

  protected quitarFranja(i: number, j: number): void {
    this.emitir(this.vivos().map((t, k) => (k === i ? { ...t, franjas: t.franjas.filter((_, m) => m !== j) } : t)));
  }

  protected quitar(i: number): void {
    this.activo.set(null);
    this.vista.set(null);
    this.emitir(this.vivos().filter((_, j) => j !== i));
  }

  /** El tramo nuevo nace con los días que quedan cerrados y 10:00–14:00: lo normal es que sea el fin de semana. */
  protected anadir(): void {
    this.emitir([...this.vivos(), { dias: this.cerrados(), franjas: [[600, 840]] }]);
  }

  /* ── Arrastrar en el mapa ─────────────────────────────────────────────────────────────────────────────────────── */

  /**
   * Hasta dónde puede ir un borde sin pisar lo que ya hay ese día: el inicio no pasa del fin de lo anterior (ni de la
   * cola de la víspera) y el fin no pasa del inicio de lo siguiente. Una franja mide al menos 15 minutos.
   */
  private limites(dia: number, tramo: number, franja: number, lado: Lado): { min: number; max: number } {
    const s = this.semana();
    const f = this.vivos()[tramo].franjas[franja];
    const cruza = f[1] <= f[0];
    // El fin de una franja que cruza la medianoche cae en la fila del día siguiente, que es donde se arrastra.
    const otros = trozosDelDia(s, dia).filter((tz) => tz.franja !== f);
    const antes = Math.max(0, ...otros.filter((tz) => tz.hasta <= (lado === 1 && cruza ? 0 : f[0])).map((tz) => tz.hasta));
    const despues = Math.min(1440, ...otros.filter((tz) => tz.desde >= (lado === 1 && cruza ? f[1] : f[0] + 1)).map((tz) => tz.desde));
    if (lado === 0) return { min: antes, max: cruza ? 1440 - PASO : f[1] - PASO };
    if (lado === 1) return cruza ? { min: PASO, max: despues } : { min: f[0] + PASO, max: despues };
    return { min: antes, max: despues };
  }

  /** El minuto (de 15 en 15) bajo el puntero en una pista. */
  private minutoEn(e: PointerEvent, pista: DOMRect): number {
    const { desde, hasta } = this.rango();
    const m = desde + Math.round((((e.clientX - pista.left) / pista.width) * (hasta - desde)) / PASO) * PASO;
    return Math.min(hasta, Math.max(desde, m));
  }

  /** El hueco libre de un día alrededor de un minuto, o `null` si ahí ya hay horas o no cabe una franja. */
  private hueco(dia: number, m: number): { min: number; max: number } | null {
    const trozos = trozosDelDia(this.semana(), dia);
    if (trozos.some((tz) => m >= tz.desde && m < tz.hasta)) return null;
    const min = Math.max(0, ...trozos.filter((tz) => tz.hasta <= m).map((tz) => tz.hasta));
    const max = Math.min(1440, ...trozos.filter((tz) => tz.desde >= m).map((tz) => tz.desde));
    return max - min >= PASO ? { min, max } : null;
  }

  protected apuntar(e: PointerEvent, dia: number): void {
    if (this.arrastre() || e.pointerType === 'touch') return;
    const pista = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const m = this.minutoEn(e, pista);
    const h = this.hueco(dia, Math.min(m, 1440 - PASO));
    // Sobre una barra la guía se calla: ahí habla la barra.
    if (!h) {
      if (this.guia()) this.guia.set(null);
      return;
    }
    const desde = Math.min(Math.max(m, h.min), h.max - PASO);
    const ahora = this.guia();
    if (ahora?.dia === dia && ahora.min === desde) return;
    this.guia.set({ dia, min: desde, libre: true, hasta: Math.min(desde + 60, h.max) });
  }

  protected empezar(e: PointerEvent, dia: number, tramo: number, franja: number, lado: Lado): void {
    if (e.button !== 0 || tramo < 0 || franja < 0) return;
    e.preventDefault();
    e.stopPropagation();
    const pista = (e.currentTarget as HTMLElement).closest('.tp-sem__pista')!.getBoundingClientRect();
    const f0 = this.vivos()[tramo].franjas[franja];
    this.guia.set(null);
    this.gesto.emit(true);
    this.arrastre.set({ tramo, franja, lado, dia, pista, x0: e.clientX, f0, rango: this.rango(), antes: this.vivos(), movido: false, ...this.limites(dia, tramo, franja, lado) });
  }

  /**
   * Pintar sobre lo rojo: nace una franja de 15 min donde se pulsa y crece hacia donde se arrastre, sin salir del hueco.
   * Va a la fila de tramos del día (sus días comparten horas, como al arrastrar un borde); un día cerrado estrena fila.
   */
  protected pintar(e: PointerEvent, dia: number): void {
    if (e.button !== 0 || this.arrastre()) return;
    const pista = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const m = this.minutoEn(e, pista);
    const h = this.hueco(dia, Math.min(m, 1440 - PASO));
    if (!h) return;
    e.preventDefault();
    const desde = Math.min(Math.max(m, h.min), h.max - PASO);
    const nueva: Franja = [desde, desde + PASO];
    const antes = this.vivos();
    const i = this.tramoDe(dia);
    let tramo: number;
    let franja: number;
    let tramos: Tramo[];
    if (i === -1) {
      tramos = [...antes, { dias: [dia], franjas: [nueva] }];
      tramo = tramos.length - 1;
      franja = 0;
    } else {
      // En su sitio por la hora de inicio: la franja de noche, si la hay, sigue siendo la última.
      const franjas = antes[i].franjas;
      franja = franjas.filter((f) => f[0] < desde).length;
      tramos = antes.map((t, k) => (k === i ? { ...t, franjas: [...franjas.slice(0, franja), nueva, ...franjas.slice(franja)] } : t));
      tramo = i;
    }
    this.guia.set(null);
    this.gesto.emit(true);
    this.emitir(tramos);
    this.arrastre.set({ tramo, franja, lado: 'pintar', dia, pista, x0: e.clientX, f0: nueva, rango: this.rango(), antes, movido: false, min: h.min, max: h.max });
  }

  @HostListener('document:pointermove', ['$event'])
  protected mover(e: PointerEvent): void {
    const a = this.arrastre();
    if (!a) return;
    if (!a.movido && Math.abs(e.clientX - a.x0) < 3) return;
    a.movido = true;
    // Los píxeles, en minutos de lo que se veía al empezar. Pasarse del borde sigue contando: al soltar, el mapa crece.
    const aMin = (px: number): number => Math.round(((px / a.pista.width) * (a.rango.hasta - a.rango.desde)) / PASO) * PASO;
    const enPista = (x: number): number => a.rango.desde + aMin(x - a.pista.left);
    const dentro = (n: number): number => Math.min(a.max, Math.max(a.min, n));
    if (a.lado === 'mover') {
      const largo = a.f0[1] - a.f0[0];
      const desde = Math.min(a.max - largo, Math.max(a.min, a.f0[0] + aMin(e.clientX - a.x0)));
      this.ponerFranja(a.tramo, a.franja, [desde, desde + largo]);
      return;
    }
    if (a.lado === 'pintar') {
      // Desde donde se pulsó hasta el puntero, hacia un lado o hacia el otro.
      const m = dentro(enPista(e.clientX));
      const ini = Math.min(a.f0[0], m);
      const fin = Math.max(a.f0[0] + PASO, m);
      this.ponerFranja(a.tramo, a.franja, [Math.min(ini, a.max - PASO), Math.min(Math.max(fin, ini + PASO), a.max)]);
      return;
    }
    // Solo se mueve un borde: el otro es el de cuando empezó el arrastre.
    const m = dentro(enPista(e.clientX));
    this.ponerFranja(a.tramo, a.franja, a.lado === 0 ? [m, a.f0[1]] : [a.f0[0], m]);
  }

  @HostListener('document:pointerup')
  protected soltar(): void {
    const a = this.arrastre();
    if (!a) return;
    // Un clic en lo rojo, sin arrastrar, pone una hora (o lo que quepa).
    if (a.lado === 'pintar' && !a.movido) this.ponerFranja(a.tramo, a.franja, [a.f0[0], Math.min(a.f0[0] + 60, a.max)]);
    this.arrastre.set(null);
    this.gesto.emit(false);
  }

  /** Esc a medio arrastre: todo vuelve a como estaba al empezar. */
  @HostListener('document:pointercancel')
  @HostListener('document:keydown.escape')
  protected cancelar(): void {
    const a = this.arrastre();
    if (!a) return;
    this.arrastre.set(null);
    this.emitir(a.antes);
    this.gesto.emit(false);
  }

  /** Flechas: 15 minutos; con Mayús, una hora. */
  protected tecla(e: KeyboardEvent, dia: number, tramo: number, franja: number, lado: 0 | 1): void {
    const paso = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!paso || tramo < 0 || franja < 0) return;
    e.preventDefault();
    const { min, max } = this.limites(dia, tramo, franja, lado);
    const f = this.vivos()[tramo].franjas[franja];
    const m = Math.min(max, Math.max(min, f[lado] + paso * (e.shiftKey ? 60 : PASO)));
    this.ponerFranja(tramo, franja, lado === 0 ? [m, f[1]] : [f[0], m]);
  }
}
