import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, HostListener, inject, input, output, signal, untracked } from '@angular/core';

import { type Franja, type Semana, validarSemana } from '@features/admin/repositories/state/horarios.core.mjs';

import { TpIconoComponent } from './tp-icono.component';
import { CORTOS, horaCorta, LETRAS, NOMBRES, trozosDelDia } from './tp-modelo';
import { TpHoraComponent } from './tp-piezas';
import { PROBLEMA } from './tp-semana.component';
import { contarUso } from './tp-usos';

/** Arrastrar va de 15 en 15 minutos. */
const PASO = 15;
/** El primer día que se abre, sin otro del que copiar: de 9:00 a 18:00. */
const PRIMERA: Franja = [540, 1080];
/** Una pausa dura una hora y, si cabe, va de 14:00 a 15:00. */
const PAUSA = 60;
const COMIDA = 840;
/** Lo más largo que se lee como pausa (de 14:00 a 17:00): más, son dos turnos y «− Pausa» no se ofrece. */
const PAUSA_MAXIMA = 180;
/** Lo menos que enseña la vista elegida en la regla: cuatro horas. */
const VISTA_MINIMA = 240;

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
  /** Las horas que se veían al empezar: no cambian mientras se arrastra; al soltar, la vista se ajusta. */
  readonly rango: Rango;
  /** La semana de antes de empezar: Esc la devuelve. */
  readonly antes: Semana;
  readonly movido: boolean;
  /** Los días que siguen a este y se mueven con él; y si este era una copia que aún no se había tocado. */
  readonly siguen: readonly number[];
  readonly copia: boolean;
}

/**
 * Tras cambiar un día: los días que lo siguieron solos (se abrieron copiándolo), los que tenían sus mismas horas sin
 * seguirlo (se ofrecen) y las horas de antes, para «Solo el lunes».
 */
interface Oferta {
  readonly dia: number;
  readonly dias: readonly number[];
  readonly siguen: readonly number[];
  readonly previas: readonly Franja[];
}

type IconoDeAyuda = 'alert' | 'copy' | 'check' | 'info';

const igual = (a: readonly Franja[], b: readonly Franja[]): boolean => a.length === b.length && a.every((f, i) => f[0] === b[i][0] && f[1] === b[i][1]);
const cruza = (f: Franja): boolean => f[1] <= f[0];
const enLista = (xs: readonly string[]): string => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : (xs[0] ?? ''));
const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const copiar = (fs: readonly Franja[]): Franja[] => fs.map((f) => [f[0], f[1]] as Franja);
/** Las franjas de un día por su hora de inicio; la de noche, si la hay, la última. */
const ordenar = (fs: readonly Franja[]): Franja[] => [...fs].sort((a, b) => Number(cruza(a)) - Number(cruza(b)) || a[0] - b[0]);
/** Las cajas de horas que caben al lado de la barra; con más franjas, «+N» enseña el día entero. */
const A_LA_VISTA = 2;
/** Lo que separa una fila de la siguiente (2,5rem de fila y 0,375rem de hueco): lo que baja una copia. */
const PASO_DE_FILA = '2.875rem';

/** Dos franjas que se tocan son una: en atención, de 9 a 14 y de 14 a 18 es de 9 a 18. Dice cuál queda. */
function juntar(fs: readonly Franja[]): { franjas: Franja[]; junta: Franja | null } {
  const franjas: Franja[] = [];
  let junta: Franja | null = null;
  for (const f of fs) {
    const prev = franjas[franjas.length - 1];
    if (prev && !cruza(prev) && !cruza(f) && prev[1] === f[0]) {
      junta = [prev[0], f[1]];
      franjas[franjas.length - 1] = junta;
    } else franjas.push(f);
  }
  return { franjas, junta };
}
/** Un hueco entre dos franjas de una hora o menos: una pausa. */
const esPausa = (h: { readonly min: number; readonly max: number }): boolean => h.max - h.min <= 60 && h.min > 0 && h.max < 1440;

/**
 * CIERRE DE HORARIOS, la semana en una lista de siete días. Arriba, una línea de ayuda que dice lo único que hace falta
 * ahora: cómo empezar, «¿También M, X, J y V?» tras cambiar un día que compartía horas, o qué está mal. Cada fila es un
 * día y lo tiene todo: el interruptor lo abre o lo cierra, la barra se arrastra (bordes, la franja entera, o pintar en
 * lo vacío) y a la derecha cada franja en su caja, con las horas que se escriben. Abrir un día trae las horas del día
 * abierto de arriba y lo SIGUE mientras no se toque: se hace el lunes y el resto de la semana va detrás, sin preguntar.
 * Las horas que se ven se ajustan solas a lo abierto, y «Ver de … a …» deja elegir otras. Hoy lleva su nombre y la raya
 * de ahora; Intro en una hora baja a la misma hora del día siguiente, como en una hoja de cálculo.
 * Siete filas fijas y una ayuda de una línea: nada salta al abrir, cerrar o partir un día.
 */
@Component({
  selector: 'sc-tp-dias',
  imports: [NgTemplateOutlet, TpIconoComponent, TpHoraComponent],
  template: `
    <div class="tp-dias" [class.is-arrastrando]="arrastre() !== null" [attr.data-arrastre]="arrastre()?.lado ?? null" role="group" aria-label="La semana, día a día">
      <!-- La ayuda: arriba, donde se empieza a leer, y una sola cosa a la vez. -->
      <div class="tp-dias__ayuda" [attr.data-tono]="ayuda().tono" role="status" aria-live="polite">
        <sc-tp-icono [nombre]="ayuda().icono" [tam]="16" />
        <span class="tp-dias__ayuda-txt">{{ ayuda().texto }}</span>
        @if (ofertaVisible(); as o) {
          <span class="tp-dias__ayuda-acc">
            @if (o.dias.length) {
              <button type="button" class="tp-btn tp-btn--sm tp-btn--primary" (click)="aplicarOferta()">Sí, {{ o.dias.length === 1 ? 'también' : 'a los ' + o.dias.length }}</button>
            }
            <button type="button" class="tp-btn tp-btn--sm tp-btn--ghost" (click)="soloEse()">Solo {{ nombreCon(o.dia) }}</button>
          </span>
        }
      </div>

      <div class="tp-dias__eje t-micro t-3 t-num">
        <span class="tp-dias__horas-eje" aria-hidden="true">
          @for (h of marcas(); track h) {
            <span [class.is-ini]="h === rango().desde" [class.is-fin]="h === rango().hasta" [class.is-impar]="(h / 60) % 2 === 1" [class.is-junto]="h === rango().desde + 60 || h === rango().hasta - 60" [style.left.%]="pos(h)">{{ h / 60 }}</span>
          }
        </span>
        <!-- Las horas que se ven: solas se ajustan a lo abierto; dos desplegables dejan elegir otras. -->
        <div class="tp-dias__vista" role="group" aria-label="Horas que se ven">
          <span>Ver de</span>
          <span class="tp-dias__vista-sel">
            <select aria-label="Ver desde" (change)="verDesde($any($event.target).value)">
              @for (h of horasDesde(); track h.m) {
                <option [value]="h.m" [selected]="h.m === rango().desde" [disabled]="h.no">{{ h.m / 60 }}</option>
              }
            </select>
          </span>
          <span>a</span>
          <span class="tp-dias__vista-sel">
            <select aria-label="Ver hasta" (change)="verHasta($any($event.target).value)">
              @for (h of horasHasta(); track h.m) {
                <option [value]="h.m" [selected]="h.m === rango().hasta" [disabled]="h.no">{{ h.m / 60 }}</option>
              }
            </select>
          </span>
          @if (ventana()) {
            <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm tp-dias__vista-btn" data-tip="Volver a ajustarse a lo abierto" (click)="ventana.set(null)">Ajustar</button>
          } @else if (rango().desde > 0 || rango().hasta < 1440) {
            <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm tp-dias__vista-btn" (click)="ponerVentana({ desde: 0, hasta: 1440 })">Todo el día</button>
          }
        </div>
      </div>

      @for (f of filas(); track f.dia) {
        <div
          class="tp-dias__fila"
          [attr.data-dia]="f.dia"
          [class.is-abierto]="f.abierto"
          [class.is-mal]="f.mal"
          [class.is-ofrecido]="f.ofrecido"
          [class.is-baja]="baja()?.dia === f.dia"
          [style.--k]="f.lejos"
          [style.--salto]="baja()?.dia === f.dia ? 'calc(' + baja()!.filas + ' * ' + pasoDeFila + ')' : null"
        >
          <button
            type="button"
            role="switch"
            class="tp-dias__dia"
            [attr.aria-checked]="f.abierto"
            [attr.aria-label]="capital(nombres[f.dia]) + (f.hoy ? ', hoy' : '')"
            (click)="alternar(f.dia)"
          >
            <span class="tp-dias__interruptor" aria-hidden="true"></span>
            <!-- Hoy, sin palabra: el día en una pastilla del color de la raya de ahora (el lector oye «hoy»). -->
            <span class="tp-dias__dia-nombre" [class.is-hoy]="f.hoy">{{ capital(cortos[f.dia]) }}</span>
          </button>
          <span class="tp-sem__pista tp-dias__pista" [class.is-cerrada]="!f.abierto" [class.is-cortando]="corte()?.dia === f.dia && !arrastre()" (pointerdown)="pintar($event, f.dia)" (pointermove)="apuntar($event, f.dia)" (pointerleave)="guia.set(null); corte.set(null)">
            <span class="tp-sem__guias" aria-hidden="true">
              @for (l of lineas(); track l.m) {
                <span class="tp-sem__guia" [class.is-fuerte]="l.fuerte" [style.left.%]="pos(l.m)"></span>
              }
            </span>
            @for (t of f.trozos; track $index) {
              <span
                class="tp-sem__barra"
                [attr.data-j]="t.j"
                [class.is-arrastre]="t.arrastre"
                [class.is-movible]="t.movible"
                [class.is-viva]="t.viva"
                [class.is-elegida]="(foco()?.dia === f.dia && foco()?.j === t.j) || (elegida()?.dia === f.dia && elegida()?.j === t.j)"
                [style.left.%]="pos(t.desde)"
                [style.width.%]="pos(t.hasta) - pos(t.desde)"
                [attr.tabindex]="t.j >= 0 ? -1 : null"
                [attr.role]="t.j >= 0 ? 'button' : null"
                [attr.aria-pressed]="t.j >= 0 ? elegida()?.dia === f.dia && elegida()?.j === t.j : null"
                [attr.aria-label]="t.j >= 0 ? capital(nombres[f.dia]) + ', de ' + t.texto.replace('–', ' a ') : null"
                (pointerdown)="t.movible && empezar($event, f.dia, t.j, 'mover')"
                (keydown)="teclaBarra($event, f.dia, t.j)"
                (blur)="soltarEleccion(f.dia, t.j)"
              >
                @if (t.viva) {
                  <span class="tp-sem__globo t-num" aria-hidden="true">{{ t.texto }}</span>
                }
                <!-- Los bordes, para el ratón: con el teclado, las horas se escriben (y las flechas suben o bajan 15 min). -->
                @if (t.asaIni) {
                  <span class="tp-sem__asa tp-sem__asa--ini" aria-hidden="true" (pointerdown)="empezar($event, f.dia, t.j, 0)"></span>
                }
                @if (t.asaFin) {
                  <span class="tp-sem__asa tp-sem__asa--fin" aria-hidden="true" (pointerdown)="empezar($event, f.dia, t.j, 1)"></span>
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
            @if (corte(); as c) {
              @if (c.dia === f.dia && !arrastre()) {
                <span class="tp-dias__corte" aria-hidden="true" [style.left.%]="pos(c.desde)" [style.width.%]="pos(c.hasta) - pos(c.desde)">
                  <span class="tp-sem__globo t-num">Pausa {{ hora(c.desde) }}–{{ hora(c.hasta) }}</span>
                </span>
              }
            }
            @if (relleno(); as r) {
              @if (r.dia === f.dia && !arrastre()) {
                <span class="tp-dias__corte tp-dias__corte--relleno" aria-hidden="true" [style.left.%]="pos(r.desde)" [style.width.%]="pos(r.hasta) - pos(r.desde)">
                  <span class="tp-sem__globo t-num">Seguido de {{ hora(r.de) }} a {{ hora(r.a) }}</span>
                </span>
              }
            }
            @if (ahora()?.dia === f.dia && seVe(ahora()!.minutos)) {
              <span class="tp-sem__ahora" [style.left.%]="pos(ahora()!.minutos)" [attr.data-tip]="guia()?.dia === f.dia ? null : 'Ahora, ' + hora(ahora()!.minutos)"></span>
            }
          </span>
          <div
            class="tp-dias__horas"
            (keydown.enter)="bajar($event, f.dia, 1)"
            (keydown.shift.enter)="bajar($event, f.dia, -1)"
            (focusin)="enfocar($event, f.dia)"
            (focusout)="foco.set(null)"
          >
            @if (f.abierto) {
              @for (fr of f.franjas; track $index; let j = $index) {
                @if (j < aLaVista) {
                  <ng-container [ngTemplateOutlet]="caja" [ngTemplateOutletContext]="{ $implicit: fr, dia: f.dia, j, n: f.franjas.length }" />
                }
              }
              @if (f.franjas.length > aLaVista) {
                <!-- Lo que no cabe: «+N» enseña el día entero al pasar, al llegar con el teclado o al pulsar su barra. -->
                <span class="tp-mas tp-dias__mas" (pointerenter)="orientar($event)" (focusin)="orientar($event)">
                  <button type="button" class="tp-mas__btn tp-dias__mas-btn" [attr.aria-label]="'Ver el ' + nombres[f.dia] + ' entero: ' + f.franjas.length + ' franjas'">
                    +{{ f.franjas.length - aLaVista }}
                  </button>
                  <span class="tp-mas__pop tp-dias__mas-pop">
                    <span class="tp-dias__mas-tit">{{ capital(nombres[f.dia]) }}, {{ f.franjas.length }} franjas</span>
                    @for (fr of f.franjas; track $index; let j = $index) {
                      @if (j > 0) {
                        <span class="tp-dias__mas-pausa t-num">
                          <span>Pausa de {{ hora(f.franjas[j - 1][1]) }} a {{ hora(fr[0]) }}</span>
                          <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm" [attr.aria-label]="'Quitar la pausa de ' + hora(f.franjas[j - 1][1]) + ' a ' + hora(fr[0])" (click)="quitarPausa(f.dia, j)">
                            Quitar
                          </button>
                        </span>
                      }
                      <ng-container [ngTemplateOutlet]="caja" [ngTemplateOutletContext]="{ $implicit: fr, dia: f.dia, j, n: f.franjas.length }" />
                    }
                  </span>
                </span>
              } @else if (f.franjas.length > 1 && f.unible) {
                <!--
                  «− Pausa», el par de «+ Pausa»: junta las dos franjas. Solo si lo de en medio es una pausa (tres horas como
                  mucho): juntar 9–14 con 22–2 daría de 9 a 2. La × de cada caja, en cambio, quita esa franja.
                -->
                <!-- Al pasar o al llegar con el teclado, la barra enseña el hueco que se rellena. -->
                <button
                  type="button"
                  class="tp-btn tp-btn--ghost tp-btn--sm tp-dias__pausa tp-dias__quitar"
                  [attr.aria-label]="'Quitar la pausa de ' + hora(f.franjas[0][1]) + ' a ' + hora(f.franjas[1][0])"
                  (pointerenter)="verRelleno(f.dia)"
                  (focus)="verRelleno(f.dia)"
                  (pointerleave)="relleno.set(null)"
                  (blur)="relleno.set(null)"
                  (click)="relleno.set(null); quitarPausa(f.dia, 1)"
                >
                  <sc-tp-icono nombre="minus" [tam]="14" />
                  Quitar pausa
                </button>
              } @else if (f.pausa !== -1) {
                <!-- Al pasar o al llegar con el teclado, la barra enseña dónde cae la pausa antes del clic. -->
                <button
                  type="button"
                  class="tp-btn tp-btn--ghost tp-btn--sm tp-dias__pausa"
                  [attr.aria-label]="'Añadir una pausa de ' + previaTexto(f.dia)"
                  (pointerenter)="verPausa(f.dia)"
                  (focus)="verPausa(f.dia)"
                  (pointerleave)="corte.set(null)"
                  (blur)="corte.set(null)"
                  (click)="corte.set(null); pausa(f.dia)"
                >
                  <sc-tp-icono nombre="plus" [tam]="14" />
                  Añadir pausa
                </button>
              }
            } @else {
              <span class="tp-dias__cerrado t-small">Cerrado</span>
            }
          </div>
        </div>
      }
    </div>

    <!-- Una franja, en su caja: sus dos horas, que se escriben, y «+1» o «24 h» si toca. -->
    <ng-template #caja let-fr let-dia="dia" let-j="j" let-n="n">
      <span class="tp-dias__franja" [attr.data-franja]="j" [class.is-elegida]="elegida()?.dia === dia && elegida()?.j === j">
        <sc-tp-hora [valor]="fr[0]" [etiqueta]="etiqueta(dia, j, n) + ', abre'" (cambio)="ponerHora(dia, j, 0, $event)" />
        <span class="tp-franja__a" aria-hidden="true"></span>
        <sc-tp-hora [valor]="fr[1]" fin [etiqueta]="etiqueta(dia, j, n) + ', cierra'" (cambio)="ponerHora(dia, j, 1, $event)" />
        @if (fr[0] === 0 && fr[1] === 1440) {
          <span class="tp-dias__marca">24 h</span>
        } @else if (fr[1] <= fr[0]) {
          <span class="tp-dias__marca" data-tip="Acaba al día siguiente"><sc-tp-icono nombre="moon" [tam]="12" />+1</span>
        }
        <!-- Con más de una franja, cada caja se quita con su × (aparece al pasar o al llegar con el teclado). Con una sola, se cierra el día. -->
        @if (n > 1) {
          <button
            type="button"
            class="tp-dias__borrar"
            [attr.aria-label]="'Quitar la franja de ' + hora(fr[0]) + ' a ' + hora(fr[1])"
            [attr.data-tip]="'Quitar la franja de ' + hora(fr[0]) + ' a ' + hora(fr[1])"
            (click)="quitarFranja(dia, j)"
          >
            <sc-tp-icono nombre="x" [tam]="10" />
          </button>
        }
      </span>
    </ng-template>
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

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly nombres = NOMBRES;
  protected readonly cortos = CORTOS;
  protected readonly hora = horaCorta;
  protected readonly capital = capital;
  protected readonly aLaVista = A_LA_VISTA;
  protected readonly pasoDeFila = PASO_DE_FILA;
  /** El día que se acaba de abrir copiando a otro y cuántas filas hay hasta él: sus barras bajan (o suben) desde allí. */
  protected readonly baja = signal<{ dia: number; filas: number } | null>(null);
  /** El día que se está cambiando: los que lo siguen se mueven tras él, más despacio cuanto más lejos (la cascada). */
  private readonly origen = signal<number | null>(null);
  protected readonly arrastre = signal<Arrastre | null>(null);
  /** Al pasar por lo vacío: la hora bajo el puntero y lo que se añadiría con un clic. */
  protected readonly guia = signal<{ dia: number; min: number; hasta: number } | null>(null);
  /** Al pasar por una barra: dónde iría una pausa de una hora con un clic. */
  protected readonly corte = signal<{ dia: number; j: number; desde: number; hasta: number } | null>(null);
  /** Al pasar por «Quitar pausa»: el hueco que se rellena (`desde`–`hasta`) y cómo queda el día (`de`–`a`). */
  protected readonly relleno = signal<{ dia: number; desde: number; hasta: number; de: number; a: number } | null>(null);
  /**
   * La franja elegida con un clic en su barra: se resalta con su caja, ⌫ la quita, Intro lleva a sus horas y otro clic
   * en ella pone una pausa donde se ve. Se suelta con Esc, al arrastrar o al pulsar en otro sitio.
   */
  protected readonly elegida = signal<{ dia: number; j: number } | null>(null);
  /** Dónde estaba el puntero sobre la pista: al elegir una barra, su pausa se enseña sin esperar a que se mueva. */
  private ultimoMinuto = 0;
  /** La franja cuyas horas se están escribiendo: su caja y su barra se resaltan juntas. */
  protected readonly foco = signal<{ dia: number; j: number } | null>(null);
  protected readonly oferta = signal<Oferta | null>(null);
  /** Lo que pasó solo y conviene decir (dos franjas que se tocaban y ahora son una), hasta el siguiente cambio. */
  protected readonly aviso = signal<string | null>(null);
  /** Las horas que se ven, si se eligieron en la regla; `null` es que se ajustan solas a lo abierto. */
  protected readonly ventana = signal<Rango | null>(null);
  /**
   * Quién sigue a quién: el día abierto copiando a otro lo sigue hasta que se toca (o se cierra). Cambiar un día cambia
   * con él a los que lo siguen, y a los que siguen a esos: se hace el lunes y la semana va detrás.
   */
  private readonly sigue = new Map<number, number>();

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
    this.aviso.set(null);
    this.semanaChange.emit(s);
  }

  constructor() {
    // Una semana que no salió de aquí (⌘Z, ⇧⌘Z) deja sin sentido la pregunta y el aviso de lo último que se hizo, y pasa
    // a ser la de ahora: ⌘Z devuelve la semana de antes, la MISMA, y sin esto `actual()` seguiría con la deshecha.
    effect(() => {
      const s = this.semana();
      if (s !== this.local)
        untracked(() => {
          this.entrada = s;
          this.local = s;
          // Vaciada desde fuera, los días ya no se siguen: los que se abran después empiezan su propia cadena.
          if (s.every((d) => !d.length)) this.sigue.clear();
          this.elegida.set(null);
          this.corte.set(null);
          this.oferta.set(null);
          this.aviso.set(null);
        });
    });
  }

  protected readonly vacia = computed(() => this.semana().every((d) => d.length === 0));
  protected readonly error = computed(() => validarSemana(this.semana()));
  /** La oferta se calla mientras el día tiene un error: primero se arregla, luego se ofrece. */
  protected readonly ofertaVisible = computed(() => {
    const o = this.oferta();
    return o && this.error()?.dia !== o.dia ? o : null;
  });

  /** Una línea, lo más urgente primero: lo que está mal, «¿También…?», lo que pasó solo, cómo empezar, cómo se edita. */
  protected readonly ayuda = computed<{ texto: string; icono: IconoDeAyuda; tono: string }>(() => {
    const e = this.error();
    if (e) return { texto: `${capital(NOMBRES[e.dia])}: ${PROBLEMA[e.codigo]}.`, icono: 'alert', tono: 'error' };
    const o = this.ofertaVisible();
    if (o?.dias.length) return { texto: `¿${this.diasTexto(o.dias)} también, como ${this.nombreCon(o.dia)}?`, icono: 'copy', tono: 'oferta' };
    if (o) {
      const texto = this.siguenTexto(o.siguen, o.dia, '');
      return { texto, icono: 'copy', tono: 'aviso' };
    }
    const a = this.aviso();
    if (a) return { texto: a, icono: 'check', tono: 'aviso' };
    const el = this.elegida();
    const f = el ? this.semana()[el.dia]?.[el.j] : undefined;
    if (el && f) {
      const que = `${capital(NOMBRES[el.dia])}, de ${horaCorta(f[0])} a ${horaCorta(f[1])}`;
      const pausa = partible(f) ? ' y otro clic en la barra pone una pausa donde la ves' : '';
      return { texto: `${que}: ⌫ la quita, Intro escribe sus horas${pausa}.`, icono: 'info', tono: 'guia' };
    }
    if (this.vacia()) return { texto: 'Activa un día para abrirlo. Los siguientes copian sus horas.', icono: 'info', tono: 'guia' };
    return { texto: 'Arrastra o escribe las horas. Pulsa en una barra para elegirla: luego puedes quitarla o partirla con una pausa.', icono: 'info', tono: 'neutro' };
  });

  /* ── Las horas que se ven ─────────────────────────────────────────────────────────────────────────────────────── */

  /** Lo abierto de la semana, en tramos que no se pisan (lo de la víspera incluido): lo que la vista no deja fuera. */
  protected readonly abiertas = computed<Rango[]>(() => {
    const s = this.semana();
    const trozos = [0, 1, 2, 3, 4, 5, 6]
      .flatMap((d) => trozosDelDia(s, d))
      .map((t) => ({ desde: t.desde, hasta: t.hasta }))
      .sort((a, b) => a.desde - b.desde);
    const out: Rango[] = [];
    for (const t of trozos) {
      const u = out[out.length - 1];
      if (u && t.desde <= u.hasta) out[out.length - 1] = { desde: u.desde, hasta: Math.max(u.hasta, t.hasta) };
      else out.push(t);
    }
    return out;
  });
  /** Lo que la vista nunca deja fuera: de la primera hora abierta a la última. */
  private readonly imprescindible = computed<Rango | null>(() => {
    const a = this.abiertas();
    return a.length ? { desde: Math.floor(a[0].desde / 60) * 60, hasta: Math.ceil(a[a.length - 1].hasta / 60) * 60 } : null;
  });
  private readonly automatica = computed(() => ajuste(this.semana()));
  protected readonly rango = computed<Rango>(() => {
    const a = this.arrastre();
    if (a) return a.rango;
    const v = this.ventana();
    const n = this.imprescindible();
    if (!v) return this.automatica();
    return n ? { desde: Math.min(v.desde, n.desde), hasta: Math.max(v.hasta, n.hasta) } : v;
  });

  /** Lo pedido, dentro del día, con cuatro horas como poco y sin dejar fuera horas abiertas. Si es lo de siempre, vuelve a ajustarse solo. */
  protected ponerVentana(r: Rango): void {
    const n = this.imprescindible();
    let { desde, hasta } = r;
    if (n) {
      desde = Math.min(desde, n.desde);
      hasta = Math.max(hasta, n.hasta);
    }
    desde = Math.max(0, Math.min(desde, 1440 - VISTA_MINIMA));
    hasta = Math.min(1440, Math.max(hasta, desde + VISTA_MINIMA));
    const auto = this.automatica();
    this.ventana.set(desde === auto.desde && hasta === auto.hasta ? null : { desde, hasta });
  }

  /** Las horas que se pueden elegir en «Ver de … a …»: las que dejarían fuera algo abierto, o menos de cuatro horas, no. */
  protected readonly horasDesde = computed(() => {
    const n = this.imprescindible();
    const { hasta } = this.rango();
    return Array.from({ length: 21 }, (_, k) => k * 60).map((m) => ({ m, no: (n !== null && m > n.desde) || m > hasta - VISTA_MINIMA }));
  });
  protected readonly horasHasta = computed(() => {
    const n = this.imprescindible();
    const { desde } = this.rango();
    return Array.from({ length: 21 }, (_, k) => 240 + k * 60).map((m) => ({ m, no: (n !== null && m < n.hasta) || m < desde + VISTA_MINIMA }));
  });
  protected verDesde(v: string): void {
    this.ponerVentana({ desde: Number(v), hasta: this.rango().hasta });
  }
  protected verHasta(v: string): void {
    this.ponerVentana({ desde: this.rango().desde, hasta: Number(v) });
  }

  /* ── Las filas ────────────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly filas = computed(() => {
    const s = this.semana();
    const a = this.arrastre();
    const mal = this.error()?.dia ?? -1;
    const o = this.ofertaVisible();
    const ofrecidos = o ? [...o.dias, ...o.siguen] : [];
    const hoy = this.ahora()?.dia ?? -1;
    const origen = this.origen();
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
      const lejos = origen === null ? 0 : Math.abs(dia - origen);
      const unible = propias.length === 2 && !cruza(propias[0]) && propias[1][0] - propias[0][1] <= PAUSA_MAXIMA;
      return { dia, abierto: propias.length > 0, franjas: propias, trozos, mal: mal === dia, ofrecido: ofrecidos.includes(dia), pausa: dondePausa(propias), hoy: hoy === dia, lejos, unible };
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
    for (let m = Math.ceil((desde + 1) / 60) * 60; m < hasta; m += 60) out.push({ m, fuerte: m % 180 === 0 });
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

  /** «Lunes» o, con varias franjas, «Lunes, franja 2»: lo que lee un lector de pantalla en cada hora. */
  protected etiqueta(dia: number, j: number, n: number): string {
    return capital(NOMBRES[dia]) + (n > 1 ? `, franja ${j + 1}` : '');
  }

  /** «El martes» o, con varios, sus letras: «M, X, J y V». */
  protected diasTexto(dias: readonly number[]): string {
    return dias.length === 1 ? `El ${NOMBRES[dias[0]]}` : enLista(dias.map((d) => LETRAS[d]));
  }
  /** «el lunes». */
  protected nombreCon(dia: number): string {
    return `el ${NOMBRES[dia]}`;
  }
  /** «M, X, J y V siguen al lunes mientras no los toques», o con «copian el lunes y lo siguen» al abrirlos. */
  private siguenTexto(dias: readonly number[], dia: number, copian: '' | 'copian'): string {
    const uno = dias.length === 1;
    const verbo = copian ? `${uno ? 'copia' : 'copian'} ${this.nombreCon(dia)} y lo ${uno ? 'sigue' : 'siguen'}` : `${uno ? 'sigue' : 'siguen'} al ${NOMBRES[dia]}`;
    return `${this.diasTexto(dias)} ${verbo} mientras no ${uno ? 'lo' : 'los'} toques.`;
  }

  /* ── Abrir y cerrar, horas, pausa ─────────────────────────────────────────────────────────────────────────────── */

  /**
   * Abrir un día trae las horas del día abierto más cercano por arriba (o por abajo) y lo sigue desde entonces; el
   * primero, de 9:00 a 18:00. Cerrar un día lo suelta, y suelta a los que lo seguían (cerrar no se contagia).
   */
  protected alternar(dia: number): void {
    const s = this.actual();
    this.oferta.set(null);
    if (s[dia].length) {
      contarUso('cerrar');
      this.soltarDe(dia);
      this.emitir(s.map((f, d) => (d === dia ? [] : f)));
      return;
    }
    contarUso('abrir');
    const orden = [...Array.from({ length: dia }, (_, k) => dia - 1 - k), ...Array.from({ length: 6 - dia }, (_, k) => dia + 1 + k)];
    const fuente = orden.find((d) => s[d].length > 0);
    this.emitir(s.map((f, d) => (d === dia ? (fuente === undefined ? [[...PRIMERA]] : copiar(s[fuente])) : f)));
    if (fuente === undefined) return;
    this.llegaDe(dia, fuente);
    this.sigue.set(dia, fuente);
    // Se dice desde el primero de la cadena: abrir M, X, J y V tras el lunes es «M, X, J y V copian el lunes».
    const ahora = this.actual();
    let raiz = fuente;
    for (let k = 0, arriba = this.sigue.get(raiz); k < 7 && arriba !== undefined && this.seguidores(arriba, ahora).includes(raiz); k++, arriba = this.sigue.get(raiz)) raiz = arriba;
    this.aviso.set(this.siguenTexto(this.seguidores(raiz, ahora), raiz, 'copian'));
  }

  /** Las barras de una copia llegan desde la fila de la que salen: dice sin palabras de dónde vienen las horas. */
  private llegaTimer = 0;
  private llegaDe(dia: number, fuente: number): void {
    clearTimeout(this.llegaTimer);
    this.baja.set({ dia, filas: fuente - dia });
    this.llegaTimer = window.setTimeout(() => this.baja.set(null), 400);
  }

  /** Un día deja de seguir al suyo y nadie lo sigue a él. */
  private soltarDe(dia: number): void {
    this.sigue.delete(dia);
    for (const [d, fuente] of this.sigue) if (fuente === dia) this.sigue.delete(d);
  }

  /**
   * Los días que van detrás de uno: los que se abrieron copiándolo, y los que copiaron a esos, mientras sigan con sus
   * mismas horas. Lo de las horas cuida de ⌘Z: un día que ya no es igual, por lo que sea, no se arrastra.
   */
  private seguidores(dia: number, s: Semana): number[] {
    const out: number[] = [];
    const pendientes = [dia];
    while (pendientes.length) {
      const de = pendientes.pop()!;
      for (const [d, fuente] of this.sigue) {
        if (fuente !== de || d === dia || out.includes(d) || !s[d]?.length || !igual(s[d], s[dia])) continue;
        out.push(d);
        pendientes.push(d);
      }
    }
    return out.sort((a, b) => a - b);
  }

  /** La semana con un día cambiado y los que lo siguen, iguales a él. */
  private conDia(s: Semana, dia: number, franjas: readonly Franja[], siguen: readonly number[]): Semana {
    return s.map((f, d) => (d === dia ? [...franjas] : siguen.includes(d) ? copiar(franjas) : f));
  }

  /**
   * Escribir una hora. Cerrar a las 00:00 es cerrar a medianoche (24:00). Abrir después de la hora de cierre mueve el
   * cierre con la franja entera, como en una agenda; la noche se escribe en el cierre (de 22:00 a 06:00 lleva «+1»).
   */
  protected ponerHora(dia: number, j: number, lado: 0 | 1, minutos: number): void {
    const x = this.actual()[dia]?.[j];
    if (!x) return;
    contarUso('escribir');
    let f: Franja;
    if (lado === 1) f = [x[0], minutos === 0 && x[0] > 0 ? 1440 : minutos];
    else if (!cruza(x) && minutos >= x[1]) f = [minutos, Math.min(1440, minutos + (x[1] - x[0]))];
    else f = [minutos, x[1]];
    // Las franjas van siempre por su hora, y dos que se tocan son una: escribir no deja un día desordenado.
    const ordenadas = ordenar(this.actual()[dia].map((y, k) => (k === j ? f : y)));
    const { franjas, junta } = juntar(ordenadas);
    const k = franjas.findIndex((y) => y === f || (junta !== null && y === junta && y[0] <= f[0] && f[1] <= y[1]));
    const aqui = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>(`.tp-dias__fila[data-dia="${dia}"] [data-franja="${j}"]`);
    this.cambiarDia(dia, franjas);
    if (junta) this.aviso.set(`Se tocaban, así que ahora es una sola franja: de ${horaCorta(junta[0])} a ${horaCorta(junta[1])}. ⌘Z lo deshace.`);
    // Si la franja cambió de sitio, el cursor va con ella.
    if (aqui && k !== -1 && k !== j) setTimeout(() => this.enfocarCaja(dia, k, lado));
  }

  /** Dónde cae la pausa de «Añadir pausa»: de 14:00 a 15:00 si cabe, si no en medio de la franja. */
  private dondeCae(dia: number): { j: number; ini: number } | null {
    const fs = this.actual()[dia];
    const j = dondePausa(fs);
    if (j === -1) return null;
    const [a, b] = fs[j];
    const ini = COMIDA - a >= 60 && b - (COMIDA + PAUSA) >= 60 ? COMIDA : Math.round(((a + b) / 2 - PAUSA / 2) / PASO) * PASO;
    return { j, ini };
  }

  /** Parte en dos la franja con una hora de pausa, donde dice `dondeCae`. */
  protected pausa(dia: number): void {
    const c = this.dondeCae(dia);
    if (!c) return;
    const fs = this.actual()[dia];
    const [a, b] = fs[c.j];
    contarUso('dividir');
    this.cambiarDia(dia, [...fs.slice(0, c.j), [a, c.ini], [c.ini + PAUSA, b], ...fs.slice(c.j + 1)]);
  }

  /** La pausa de «Añadir pausa», dibujada en la barra antes del clic. */
  protected verPausa(dia: number): void {
    const c = this.dondeCae(dia);
    this.corte.set(c ? { dia, j: c.j, desde: c.ini, hasta: c.ini + PAUSA } : null);
  }

  /** «de 14:00 a 15:00», para que el lector diga lo mismo que la barra enseña. */
  protected previaTexto(dia: number): string {
    const c = this.dondeCae(dia);
    return c ? `${horaCorta(c.ini)} a ${horaCorta(c.ini + PAUSA)}` : '';
  }

  /** El hueco que rellena «Quitar pausa», dibujado en la barra antes del clic. */
  protected verRelleno(dia: number): void {
    const fs = this.actual()[dia];
    if (fs.length < 2) return;
    this.relleno.set({ dia, desde: fs[0][1], hasta: fs[1][0], de: fs[0][0], a: fs[1][1] });
  }

  /** Quitar la pausa que hay antes de la franja `j`: esa franja y la de antes quedan en una. */
  protected quitarPausa(dia: number, j: number): void {
    const fs = this.actual()[dia];
    if (j < 1 || j >= fs.length) return;
    contarUso('borrar');
    this.cambiarDia(dia, [...fs.slice(0, j - 1), [fs[j - 1][0], fs[j][1]], ...fs.slice(j + 1)]);
    // El botón pulsado ya no está (la lista se rehace o se va): con el teclado, el cursor sigue en la franja que queda.
    setTimeout(() => {
      const activo = document.activeElement;
      if (!activo || activo === document.body) this.enfocarCaja(dia, j - 1, 1);
    });
  }

  /**
   * Quitar una franja entera (la de la tarde, una pintada sin querer). Lo dice en la ayuda, con ⌘Z para devolverla. Si el
   * botón se va con ella, el cursor pasa a la franja de antes.
   */
  protected quitarFranja(dia: number, j: number): void {
    const fs = this.actual()[dia];
    const f = fs[j];
    if (!f || fs.length < 2) return;
    contarUso('borrar');
    this.cambiarDia(dia, fs.filter((_, k) => k !== j));
    this.aviso.set(`Quitada la franja de ${horaCorta(f[0])} a ${horaCorta(f[1])}. ⌘Z la devuelve.`);
    setTimeout(() => {
      const activo = document.activeElement;
      if (!activo || activo === document.body) this.enfocarCaja(dia, Math.max(0, j - 1), 1);
    });
  }

  /** Cambiar un día a mano: deja de seguir al suyo y se lleva con él a los que lo siguen. */
  private cambiarDia(dia: number, franjas: readonly Franja[]): void {
    const s = this.actual();
    const copia = this.sigue.has(dia);
    const siguen = this.seguidores(dia, s);
    this.sigue.delete(dia);
    this.origen.set(dia);
    this.emitir(this.conDia(s, dia, franjas, siguen));
    this.ofrecer(dia, s[dia], siguen, copia);
  }

  /**
   * Tras cambiar un día: si otros días abiertos tenían sus mismas horas sin seguirlo, se ofrece cambiarlos también; los
   * que lo siguen ya cambiaron y se dice. Una copia que se toca por primera vez no ofrece nada: abrir el sábado y acortarlo
   * no es tocar L–V. Varios cambios seguidos en el mismo día guardan las horas de antes del primero.
   */
  private ofrecer(dia: number, previas: readonly Franja[], siguen: readonly number[], copia: boolean): void {
    const s = this.actual();
    const o = this.oferta();
    const mismo = o?.dia === dia;
    const base = mismo ? o.previas : previas;
    const todos = mismo ? [...new Set([...o.siguen, ...siguen])].sort((a, b) => a - b) : siguen;
    const dias = mismo
      ? o.dias
      : copia
        ? []
        : s.map((f, d) => (d !== dia && !siguen.includes(d) && f.length > 0 && igual(f, previas) ? d : -1)).filter((d) => d !== -1);
    this.oferta.set((dias.length || todos.length) && !igual(s[dia], base) ? { dia, dias, siguen: todos, previas: base } : null);
  }

  /** «Sí»: los ofrecidos quedan como el día cambiado y desde ahora lo siguen. */
  protected aplicarOferta(): void {
    const o = this.ofertaVisible();
    if (!o) return;
    const s = this.actual();
    contarUso('tambien');
    this.oferta.set(null);
    this.origen.set(o.dia);
    this.emitir(s.map((f, d) => (o.dias.includes(d) ? copiar(s[o.dia]) : f)));
    for (const d of o.dias) this.sigue.set(d, o.dia);
    const quien = o.dias.length === 1 ? `el ${NOMBRES[o.dias[0]]} queda` : `${enLista(o.dias.map((d) => LETRAS[d]))} quedan`;
    this.aviso.set(`Hecho: ${quien} como ${this.nombreCon(o.dia)}. ⌘Z lo deshace.`);
  }

  /** «Solo el lunes»: los que lo siguieron vuelven a sus horas y dejan de seguirlo; lo ofrecido se queda como estaba. */
  protected soloEse(): void {
    const o = this.ofertaVisible();
    if (!o) return;
    this.oferta.set(null);
    if (!o.siguen.length) return;
    contarUso('separar');
    const s = this.actual();
    this.emitir(s.map((f, d) => (o.siguen.includes(d) ? copiar(o.previas) : f)));
    for (const [d, fuente] of this.sigue) if (fuente === o.dia) this.sigue.delete(d);
    this.aviso.set(`Solo cambia ${this.nombreCon(o.dia)}. ⌘Z lo deshace.`);
  }

  /**
   * Intro en una hora baja a la misma hora del siguiente día abierto (Mayús+Intro, al de arriba), como en una hoja de
   * cálculo: escribir la semana entera sin el ratón. Antes, la hora escrita se fija (lo hace el campo).
   */
  protected bajar(e: Event, dia: number, paso: 1 | -1): void {
    const campo = e.target as HTMLElement;
    if (!(campo instanceof HTMLInputElement) || (paso === 1 && (e as KeyboardEvent).shiftKey)) return;
    const caja = campo.closest<HTMLElement>('[data-franja]');
    if (!caja) return;
    const j = Number(caja.dataset['franja']);
    const lado = [...caja.querySelectorAll('input')].indexOf(campo);
    e.preventDefault();
    setTimeout(() => {
      const s = this.actual();
      for (let d = dia + paso; d >= 0 && d < 7; d += paso) {
        if (!s[d]?.length) continue;
        this.enfocarCaja(d, Math.min(j, s[d].length - 1), lado);
        return;
      }
    });
  }

  /**
   * Lleva el cursor a una hora de una franja. Si esa franja solo está en la lista de «+N», primero se enfoca «+N», que la
   * abre (una lista escondida no se puede enfocar), y luego la hora.
   */
  private enfocarCaja(dia: number, j: number, lado: number): void {
    const fila = this.host.nativeElement.querySelector<HTMLElement>(`.tp-dias__fila[data-dia="${dia}"]`);
    const caja = fila?.querySelector<HTMLElement>(`[data-franja="${j}"]`);
    if (!fila || !caja) return;
    if (caja.closest('.tp-mas__pop')) fila.querySelector<HTMLElement>('.tp-dias__mas-btn')?.focus();
    caja.querySelectorAll('input')[lado]?.focus();
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
    const barra = (e.target as HTMLElement).closest<HTMLElement>('.tp-sem__barra');
    this.ultimoMinuto = m;
    this.apuntarCorte(dia, m, barra && !(e.target as HTMLElement).closest('.tp-sem__asa') ? Number(barra.dataset['j']) : -1);
    const h = this.hueco(dia, Math.min(m, 1440 - PASO));
    if (!h || barra) {
      if (this.guia()) this.guia.set(null);
      return;
    }
    // Una pausa de una hora o menos se rellena entera con un clic: así se ve antes de pulsar.
    const corto = esPausa(h);
    const desde = corto ? h.min : Math.min(Math.max(m, h.min), h.max - PASO);
    const hasta = corto ? h.max : Math.min(desde + 60, h.max);
    const ya = this.guia();
    if (ya?.dia === dia && ya.min === desde && ya.hasta === hasta) return;
    this.guia.set({ dia, min: desde, hasta });
  }

  /** Una pausa de una hora que empieza en el puntero, con un cuarto de hora como poco a cada lado; si no cabe, nada. */
  private apuntarCorte(dia: number, m: number, j: number): void {
    // Solo en la barra elegida: un clic en una barra la elige; el segundo, en la elegida, pone la pausa.
    const el = this.elegida();
    const f = j >= 0 && el?.dia === dia && el.j === j ? this.actual()[dia]?.[j] : undefined;
    let c: { dia: number; j: number; desde: number; hasta: number } | null = null;
    if (f && partible(f)) {
      const desde = Math.min(f[1] - PASO - PAUSA, Math.max(f[0] + PASO, Math.round(m / PASO) * PASO));
      c = { dia, j, desde, hasta: desde + PAUSA };
    }
    const ya = this.corte();
    if (ya?.dia === c?.dia && ya?.j === c?.j && ya?.desde === c?.desde) return;
    this.corte.set(c);
  }

  /** Partir una franja con la pausa que se veía al pasar: de una hora, donde se pulsó. */
  private cortar(c: { dia: number; j: number; desde: number; hasta: number }): void {
    const fs = this.actual()[c.dia];
    const f = fs[c.j];
    if (!f) return;
    contarUso('dividir');
    this.corte.set(null);
    this.cambiarDia(c.dia, [...fs.slice(0, c.j), [f[0], c.desde], [c.hasta, f[1]], ...fs.slice(c.j + 1)]);
    this.aviso.set(`Pausa de ${horaCorta(c.desde)} a ${horaCorta(c.hasta)}. Sus bordes se arrastran y sus horas se escriben.`);
  }

  /**
   * La lista de «+N» se abre hacia abajo si cabe en la ventana y, si no, hacia arriba: se mide al llegar a ella, porque
   * depende de dónde esté la fila en la pantalla.
   */
  protected orientar(e: Event): void {
    const el = e.currentTarget as HTMLElement;
    const pop = el.querySelector<HTMLElement>('.tp-mas__pop');
    if (!pop) return;
    const r = el.getBoundingClientRect();
    const abajo = window.innerHeight - r.bottom - 8;
    el.classList.toggle('tp-dias__mas--arriba', abajo < pop.offsetHeight && r.top > abajo);
  }

  /** Elige una franja: la barra se queda con el foco (para ⌫ e Intro) y, si cabe, ya enseña su pausa. */
  private elegir(dia: number, j: number): void {
    this.aviso.set(null);
    this.elegida.set({ dia, j });
    this.apuntarCorte(dia, this.ultimoMinuto, j);
    this.host.nativeElement.querySelector<HTMLElement>(`.tp-dias__fila[data-dia="${dia}"] .tp-sem__barra[data-j="${j}"]`)?.focus();
  }

  /** Pulsar fuera de la barra elegida la suelta: el foco no siempre se va (la pista no lo coge al pintar). */
  @HostListener('document:pointerdown', ['$event'])
  protected pulsarFuera(e: PointerEvent): void {
    const el = this.elegida();
    if (!el) return;
    const barra = (e.target as HTMLElement | null)?.closest<HTMLElement>('.tp-sem__barra');
    const fila = barra?.closest<HTMLElement>('.tp-dias__fila');
    if (barra && fila?.dataset['dia'] === String(el.dia) && barra.dataset['j'] === String(el.j)) return;
    this.elegida.set(null);
    this.corte.set(null);
    const activo = document.activeElement as HTMLElement | null;
    if (activo?.matches('.tp-sem__barra')) activo.blur();
  }

  protected soltarEleccion(dia: number, j: number): void {
    const el = this.elegida();
    if (el?.dia === dia && el.j === j) {
      this.elegida.set(null);
      this.corte.set(null);
    }
  }

  /** Con una barra elegida: ⌫ (o Supr) la quita, y si era la única el día queda cerrado; Intro lleva a sus horas. */
  protected teclaBarra(e: KeyboardEvent, dia: number, j: number): void {
    const el = this.elegida();
    if (j < 0 || el?.dia !== dia || el.j !== j) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.elegida.set(null);
      this.corte.set(null);
      if (this.actual()[dia].length > 1) {
        this.quitarFranja(dia, j);
        setTimeout(() => this.enfocarCaja(dia, Math.max(0, j - 1), 1));
        return;
      }
      this.alternar(dia);
      this.aviso.set(`${capital(this.nombreCon(dia))} queda cerrado. ⌘Z lo deshace.`);
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`.tp-dias__fila[data-dia="${dia}"] .tp-dias__dia`)?.focus());
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.elegida.set(null);
      this.corte.set(null);
      this.enfocarCaja(dia, j, 0);
    }
  }

  protected enfocar(e: FocusEvent, dia: number): void {
    const caja = (e.target as HTMLElement).closest<HTMLElement>('[data-franja]');
    this.foco.set(caja ? { dia, j: Number(caja.dataset['franja']) } : null);
  }

  protected empezar(e: PointerEvent, dia: number, j: number, lado: Lado): void {
    if (e.button !== 0 || j < 0) return;
    e.preventDefault();
    e.stopPropagation();
    const pista = (e.currentTarget as HTMLElement).closest('.tp-sem__pista')!.getBoundingClientRect();
    const s = this.actual();
    this.guia.set(null);
    if (lado !== 'mover') this.corte.set(null);
    this.origen.set(dia);
    this.gesto.emit(true);
    const lazos = { siguen: this.seguidores(dia, s), copia: this.sigue.has(dia) };
    this.arrastre.set({ dia, franja: j, lado, pista, x0: e.clientX, f0: s[dia][j], rango: this.rango(), antes: s, movido: false, ...lazos, ...this.limites(dia, j, lado) });
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
    this.origen.set(dia);
    this.gesto.emit(true);
    const lazos = { siguen: this.seguidores(dia, antes), copia: this.sigue.has(dia) };
    this.emitir(this.conDia(antes, dia, [...franjas.slice(0, j), nueva, ...franjas.slice(j)], lazos.siguen));
    this.arrastre.set({ dia, franja: j, lado: 'pintar', pista, x0: e.clientX, f0: nueva, rango: this.rango(), antes, movido: false, ...lazos, min: h.min, max: h.max });
  }

  /** Una franja a mitad de arrastre: los días que siguen a este se mueven con él, a la vista. */
  private ponerFranja(dia: number, j: number, f: Franja): void {
    const s = this.actual();
    this.emitir(this.conDia(s, dia, s[dia].map((y, k) => (k === j ? f : y)), this.arrastre()?.siguen ?? []));
  }

  @HostListener('document:pointermove', ['$event'])
  protected mover(e: PointerEvent): void {
    let a = this.arrastre();
    if (!a) return;
    if (!a.movido && Math.abs(e.clientX - a.x0) < 3) return;
    if (!a.movido) {
      this.elegida.set(null);
      a = { ...a, movido: true };
      this.arrastre.set(a);
    }
    const { rango: r, pista, max, min, f0 } = a;
    const aMin = (px: number): number => Math.round(((px / pista.width) * (r.hasta - r.desde)) / PASO) * PASO;
    const enPista = (x: number): number => r.desde + aMin(x - pista.left);
    const dentro = (n: number): number => Math.min(max, Math.max(min, n));
    if (a.lado === 'mover') {
      const largo = f0[1] - f0[0];
      const desde = Math.min(max - largo, Math.max(min, f0[0] + aMin(e.clientX - a.x0)));
      this.ponerFranja(a.dia, a.franja, [desde, desde + largo]);
      return;
    }
    if (a.lado === 'pintar') {
      const m = dentro(enPista(e.clientX));
      const ini = Math.min(f0[0], m);
      const fin = Math.max(f0[0] + PASO, m);
      this.ponerFranja(a.dia, a.franja, [Math.min(ini, max - PASO), Math.min(Math.max(fin, ini + PASO), max)]);
      return;
    }
    const m = dentro(enPista(e.clientX));
    this.ponerFranja(a.dia, a.franja, a.lado === 0 ? [m, f0[1]] : [f0[0], m]);
  }

  @HostListener('document:pointerup')
  protected soltar(): void {
    const a = this.arrastre();
    if (!a) return;
    if (a.lado === 'mover' && !a.movido) {
      // Un clic en una barra, sin arrastrarla, la elige; en la ya elegida, pone la pausa que se veía al pasar.
      this.arrastre.set(null);
      this.gesto.emit(false);
      const c = this.corte();
      const el = this.elegida();
      if (el?.dia === a.dia && el.j === a.franja && c?.dia === a.dia && c.j === a.franja) {
        this.elegida.set(null);
        this.cortar(c);
      } else this.elegir(a.dia, a.franja);
      return;
    }
    if (a.lado === 'pintar' && !a.movido) {
      // Un clic en lo vacío pone una hora; en una pausa de una hora o menos, la rellena entera.
      this.ponerFranja(a.dia, a.franja, esPausa(a) ? [a.min, a.max] : [a.f0[0], Math.min(a.f0[0] + 60, a.max)]);
    }
    if (a.lado === 'pintar') contarUso('pintar');
    else if (a.movido) contarUso('arrastrar');
    const junta = this.juntarTocadas(a.dia, a.siguen);
    this.arrastre.set(null);
    this.gesto.emit(false);
    if (!igual(this.actual()[a.dia], a.antes[a.dia])) this.sigue.delete(a.dia);
    this.ofrecer(a.dia, a.antes[a.dia], a.siguen, a.copia);
    if (junta) this.aviso.set(`Se tocaban, así que ahora es una sola franja: ${junta}. ⌘Z lo deshace.`);
    this.corte.set(null);
  }

  /** Al soltar, dos franjas que se tocan quedan en una (`juntar`). Dice cuál queda. */
  private juntarTocadas(dia: number, siguen: readonly number[]): string | null {
    const s = this.actual();
    const { franjas, junta } = juntar(s[dia]);
    if (!junta) return null;
    this.emitir(this.conDia(s, dia, franjas, siguen));
    return `de ${horaCorta(junta[0])} a ${horaCorta(junta[1])}`;
  }

  /** Esc: a medio arrastre, todo vuelve a como estaba; si no, se descarta la oferta. */
  @HostListener('document:pointercancel')
  @HostListener('document:keydown.escape')
  protected cancelar(): void {
    const a = this.arrastre();
    if (!a) {
      if (this.elegida()) {
        this.elegida.set(null);
        this.corte.set(null);
        (document.activeElement as HTMLElement | null)?.blur();
        return;
      }
      this.oferta.set(null);
      return;
    }
    this.arrastre.set(null);
    this.emitir(a.antes);
    this.gesto.emit(false);
  }
}

/** Las horas que se ven solas: con turnos de noche o 24 h, el día entero; si no, una hora de margen y diez horas como poco. */
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

/** Si se puede partir con una pausa de una hora y un cuarto de hora a cada lado: no pasa de medianoche y dura 1 h 30 o más. */
function partible(f: Franja): boolean {
  return !cruza(f) && f[1] - f[0] >= PAUSA + 2 * PASO;
}

/** Si cabe una pausa de una hora con una hora a cada lado: solo en un día de una franja que no pase de medianoche. */
function dondePausa(fs: readonly Franja[]): number {
  if (fs.length !== 1) return -1;
  return !cruza(fs[0]) && fs[0][1] - fs[0][0] >= PAUSA + 120 ? 0 : -1;
}
