import { booleanAttribute, ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, input, output, signal, untracked } from '@angular/core';

import { type Franja, type Semana, validarSemana } from '@features/admin/repositories/state/horarios.core.mjs';

import { TpIconoComponent } from './tp-icono.component';
import { horaCorta, horas, LETRAS, NOMBRES, semanaDe, type Tramo, tramosDe, trozosDelDia } from './tp-modelo';
import { TpAvisos, TpHoraComponent } from './tp-piezas';
import { T } from './tp-textos';
import { contarUso } from './tp-usos';

export const PROBLEMA: Record<string, string> = {
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

/** Lo seleccionado en el mapa: un día entero (`franja: null`) o una franja suelta de un día. */
interface Elegido {
  readonly dia: number;
  readonly franja: number | null;
}

/**
 * Lo copiado: los días en orden y, de cada uno, sus franjas. Vive fuera del componente, y en la pestaña, a propósito: se
 * copia en un horario y se pega en otro, aunque entre medias se recargue la página.
 */
interface Copiado {
  readonly dias: readonly number[];
  readonly franjas: readonly (readonly Franja[])[];
}
const CLAVE_COPIADO = 'sc-tp-copiado';
const PORTAPAPELES = signal<Copiado | null>(
  (() => {
    try {
      const c = JSON.parse(sessionStorage.getItem(CLAVE_COPIADO) ?? 'null') as Copiado | null;
      return c && Array.isArray(c.dias) && Array.isArray(c.franjas) ? c : null;
    } catch {
      return null;
    }
  })(),
);

const enLista = (xs: readonly string[]): string => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : (xs[0] ?? ''));

/** Los días de un aviso: tres o más seguidos, «de lunes a viernes»; si no, uno a uno. Van en orden. */
const losDias = (dias: readonly number[]): string =>
  dias.length >= 3 && dias.every((d, i) => i === 0 || d === dias[i - 1] + 1)
    ? `de ${NOMBRES[dias[0]]} a ${NOMBRES[dias[dias.length - 1]]}`
    : enLista(dias.map((d) => NOMBRES[d]));

/**
 * Lo que dice la guía al pasar por una fila: la hora bajo el puntero y, si ahí cabe una franja, hasta dónde iría. Sobre
 * una barra es la raya de corte, como el cabezal de un editor de vídeo: `corte` dice qué franja corta.
 */
interface Guia {
  readonly dia: number;
  readonly min: number;
  readonly libre: boolean;
  readonly hasta: number;
  readonly corte?: { readonly tramo: number; readonly franja: number; readonly f: Franja };
}

/** La pausa que deja «dividir» si cabe: una hora, la de comer. Luego se ajusta arrastrando los bordes. */
const PAUSA = 60;

/** Donde se pulsó una barra: ahí se queda la raya, y la barrita de acciones corta lo elegido a esa hora. */
interface Marca {
  readonly dia: number;
  readonly min: number;
}

/** Lo que ofrece la barrita de lo elegido, cada cosa con su tecla: el ratón lo puede todo y el teclado se aprende mirando. */
type Accion = 'dividir' | 'antes' | 'despues' | 'copiar' | 'pegar' | 'borrar';
interface BotonDeAccion {
  readonly accion: Accion;
  readonly texto: string;
  readonly tecla: string;
  readonly aria: string;
}
const BOTONES: Record<Accion, BotonDeAccion> = {
  dividir: { accion: 'dividir', texto: 'Dividir', tecla: 'B', aria: 'B' },
  antes: { accion: 'antes', texto: 'Quitar antes', tecla: 'Q', aria: 'Q' },
  despues: { accion: 'despues', texto: 'Quitar después', tecla: 'W', aria: 'W' },
  copiar: { accion: 'copiar', texto: 'Copiar', tecla: '⌘C', aria: 'Meta+C' },
  pegar: { accion: 'pegar', texto: 'Pegar', tecla: '⌘V', aria: 'Meta+V' },
  borrar: { accion: 'borrar', texto: 'Borrar', tecla: 'Supr', aria: 'Delete' },
};

/**
 * CIERRE DE HORARIOS: la semana, en dos piezas que se miran, en el orden en que se piensa un horario. Primero lo que se
 * escribe, los tramos: unos días que comparten franjas («de lunes a viernes, de 9:00 a 18:00»). Marcar un día en un
 * tramo le copia esas horas, así que copiar el lunes a martes, miércoles y jueves son tres clics y ningún diálogo. Un
 * día solo vive en un tramo: marcarlo en otro lo mueve. Debajo, cómo queda: la semana dibujada, en verde lo que se
 * trabaja y en rojo lo que no, con las horas escritas en cada barra para que un «19:35» salte a la vista; los bordes de
 * cada barra se arrastran (de 15 en 15 min) y la barra entera se mueve.
 *
 * Se selecciona como en una hoja de cálculo: un clic en una barra elige esa franja de ese día y un clic en la letra, el
 * día entero (con Mayús, de un día a otro; con ⌘, uno más). ⌘C copia, ⌘V pega en los días elegidos o en el día por el
 * que pasa el puntero (pegar deja ese día igual que lo copiado), ⌘X corta y Supr borra. Va por días, no por filas: borrar
 * la franja del lunes de una fila «L–V» deja el lunes aparte. Cada acción es un paso de ⌘Z.
 *
 * Sobre una barra, la raya es de corte, como el cabezal de un editor de vídeo, y cruza todos los días de su fila: B (o
 * C) divide ahí y deja una pausa de una hora si cabe, Q quita lo de antes de la raya, W lo de después y Supr la franja
 * entera. Eso sí va por filas, como arrastrar un borde. Las teclas van escritas en la misma raya.
 *
 * Que se vea qué se puede hacer: un clic en una barra deja la raya fija donde se pulsó y abre encima una barrita con
 * cada acción y su tecla (dividir, quitar antes o después, copiar, borrar). El ratón lo puede todo y el teclado se
 * aprende mirando. Con algo elegido, las acciones y las teclas van a lo elegido, por días, y la raya de pasar no sale.
 *
 * Dos franjas que se tocan al soltar un arrastre se juntan: para atender, de 9 a 14 y de 14 a 18 es de 9 a 18.
 *
 * El dibujo enseña la jornada, de 7:00 a 22:00, y crece solo hasta la primera y la última hora abiertas con una hora de
 * margen: nunca esconde una hora en la que se atiende. Encima, una regla con el día entero en pequeño (lo abierto en
 * verde) enmarca lo que se ve, como la barra de zoom de un editor de vídeo: se arrastra el marco o sus bordes, y un doble
 * clic enseña las 24 h, para pintar de madrugada.
 *
 * Lo que hace que se sienta a mano: al pasar por lo rojo, una raya dice la hora bajo el puntero y un bloque fantasma
 * dice lo que se añadiría; arrastrar sobre lo rojo pinta una franja nueva y un clic pone una hora. Pasar por un día de
 * una fila enseña en el mapa cómo quedaría ese día. Esc cancela un arrastre a medias, y cada gesto avisa al empezar y al
 * acabar (`gesto`) para que deshacer lo cuente como un solo paso.
 */
@Component({
  selector: 'sc-tp-semana',
  imports: [TpHoraComponent, TpIconoComponent],
  template: `
    <div class="tp-sem" [class.tp-sem--compacta]="compacta()" [class.is-arrastrando]="arrastre() !== null" [attr.data-arrastre]="arrastre()?.lado ?? null">
      <!-- Lo que se escribe: los días que comparten horas. Con sitio, en una columna a la izquierda del mapa. -->
      <div class="tp-sem__escribir">
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
            @if (tramo.dias.length === 0) {
              <span class="tp-tramo__guia t-micro">
                <sc-tp-icono nombre="arrow-left" [tam]="12" />
                Marca los días que abren con estas horas
              </span>
            }
            <span class="tp-spacer"></span>
            <div class="tp-tramo__acc">
              <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm tp-tramo__24" [attr.aria-pressed]="es24(tramo)" (click)="poner24(i)">24 h</button>
              @if (tramo.dias.length > 0) {
                <button type="button" class="tp-btn tp-btn--ghost tp-btn--icon tp-btn--sm" [attr.aria-label]="t.quitarTramo(i)" data-tip="Cerrar estos días" (click)="quitar(i)">
                  <sc-tp-icono nombre="x" [tam]="14" />
                </button>
              }
            </div>
          </li>
        }
      </ol>

      <div class="tp-sem__pie">
        <button type="button" class="tp-btn tp-btn--sm" [disabled]="cerrados().length === 0 || vacia()" (click)="anadir()">
          <sc-tp-icono nombre="plus" [tam]="14" />
          Días con otro horario
        </button>
        @if (vacia()) {
          <span class="t-micro t-3">Primero, los días de la fila de arriba</span>
        } @else if (cerrados().length > 0 && cerrados().length < 7) {
          <span class="t-micro t-3">Cerrado {{ cerradosTexto() }}</span>
        }
      </div>
      </div>

      <!-- Cómo queda: la semana dibujada, que también se edita -->
      <div class="tp-sem__mapa" role="group" [attr.aria-label]="resumenAccesible()">
        <div class="tp-sem__mapa-cab">
          <span class="t-eyebrow">Así queda la semana</span>
          <!-- Las horas que se ven: el día entero en pequeño, con lo abierto en verde y lo que se ve enmarcado. -->
          <div class="tp-sem__nav" role="group" [attr.aria-label]="t.horasQueSeVen">
            <span class="tp-sem__nav-txt t-micro t-3 t-num">Se ve de {{ rango().desde / 60 }} a {{ rango().hasta / 60 }}</span>
            <span
              class="tp-sem__nav-pista"
              [attr.data-tip]="'Arrastra el marco o sus bordes para elegir qué horas se ven. Doble clic: el día entero'"
              (pointerdown)="navEmpezar($event)"
              (pointermove)="navMover($event)"
              (pointerup)="navSoltar($event)"
              (pointercancel)="navSoltar($event)"
              (dblclick)="navDiaEntero()"
            >
              <!-- Una marca cada seis horas: 6, 12 y 18. -->
              @for (q of [25, 50, 75]; track q) {
                <span class="tp-sem__nav-marca" [style.left.%]="q"></span>
              }
              @for (a of abiertas(); track a.desde) {
                <span class="tp-sem__nav-abierto" [style.left.%]="a.desde / 14.4" [style.width.%]="(a.hasta - a.desde) / 14.4"></span>
              }
              <span class="tp-sem__nav-fuera" [style.width.%]="rango().desde / 14.4"></span>
              <span class="tp-sem__nav-fuera is-fin" [style.width.%]="(1440 - rango().hasta) / 14.4"></span>
              <span class="tp-sem__nav-marco" [style.left.%]="rango().desde / 14.4" [style.width.%]="(rango().hasta - rango().desde) / 14.4">
                <span
                  class="tp-sem__nav-asa is-ini"
                  role="slider"
                  tabindex="0"
                  aria-label="Se ve desde"
                  aria-valuemin="0"
                  aria-valuemax="1440"
                  [attr.aria-valuenow]="rango().desde"
                  [attr.aria-valuetext]="hora(rango().desde)"
                  (keydown)="navTecla($event, 'desde')"
                ></span>
                <span
                  class="tp-sem__nav-asa is-fin"
                  role="slider"
                  tabindex="0"
                  aria-label="Se ve hasta"
                  aria-valuemin="0"
                  aria-valuemax="1440"
                  [attr.aria-valuenow]="rango().hasta"
                  [attr.aria-valuetext]="hora(rango().hasta)"
                  (keydown)="navTecla($event, 'hasta')"
                ></span>
              </span>
            </span>
          </div>
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
            [class.is-dia-elegido]="diaEntero(f.dia)"
            [class.is-pegado]="pegados().includes(f.dia)"
            (mouseenter)="activo.set(f.tramo); encima = f.dia"
            (mouseleave)="activo.set(null); encima = null"
          >
            <button
              type="button"
              class="tp-sem__letra t-small t-strong"
              [class.is-elegido]="diaEntero(f.dia)"
              [attr.aria-pressed]="diaEntero(f.dia)"
              [attr.aria-label]="capital(nombres[f.dia]) + ': elegir para copiar, pegar o borrar'"
              [attr.data-tip]="barrita()?.dia === f.dia ? null : capital(nombres[f.dia])"
              (click)="elegirDia($event, f.dia)"
            >
              {{ letras[f.dia] }}
            </button>
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
                  [class.is-elegida]="barraElegida(t.de, t.franja)"
                  [style.left.%]="pos(t.desde)"
                  [style.width.%]="largo(t.desde, t.hasta)"
                  [attr.data-tip]="tipDeBarra(t, f.dia)"
                  (pointerdown)="t.movible && empezar($event, f.dia, t.tramo, t.franja, 'mover')"
                  (click)="elegirBarra($event, t.de, t.franja)"
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
              <!-- Al pasar por lo rojo: la hora bajo el puntero y la hora que se añadiría con un clic. Sobre una barra, la raya de corte. -->
              @if (guia(); as gu) {
                <!-- La raya de corte cruza todos los días de la fila, como el cabezal cruza las pistas: cambian todos. -->
                @if (!arrastre() && (gu.dia === f.dia || (gu.corte && f.tramo === gu.corte.tramo))) {
                  @if (gu.libre && gu.dia === f.dia) {
                    <span class="tp-sem__nueva" aria-hidden="true" [style.left.%]="pos(gu.min)" [style.width.%]="largo(gu.min, gu.hasta)">
                      <sc-tp-icono nombre="plus" [tam]="12" />
                    </span>
                  }
                  <span
                    class="tp-sem__cursor t-num"
                    aria-hidden="true"
                    [class.is-corte]="!!gu.corte"
                    [class.is-eco]="gu.dia !== f.dia"
                    [style.left.%]="pos(gu.min)"
                  >
                    @if (gu.dia === f.dia) {
                      <span class="tp-sem__cursor-hora" [class.is-izq]="gu.corte && pos(gu.min) < 25" [class.is-der]="gu.corte && pos(gu.min) > 75">
                        <!-- Una barra estrecha no lleva sus horas escritas: van aquí, y no en un tooltip aparte que se pisaría con este. -->
                        @if (franjaSinRotulo(gu); as fr) {
                          <span class="tp-sem__globo-franja">{{ fr }}</span>
                        }
                        {{ hora(gu.min) }}
                        @if (gu.corte) {
                          <!-- Las teclas, en la misma raya: se ven justo cuando sirven. -->
                          <span class="tp-sem__teclas">
                            <kbd class="tp-kbd">B</kbd> divide <kbd class="tp-kbd">Q</kbd> quita antes <kbd class="tp-kbd">W</kbd> quita después
                          </span>
                        }
                      </span>
                    }
                  </span>
                }
              }
              <!-- Lo elegido con un clic en una barra: la raya se queda donde se pulsó, en cada día elegido. -->
              @if (marca(); as mk) {
                @if (diaElegido(f.dia) && seVe(mk.min) && !arrastre()) {
                  <span class="tp-sem__cursor is-corte is-fija" aria-hidden="true" [style.left.%]="pos(mk.min)"></span>
                }
              }
              @if (barrita(); as b) {
                @if (b.dia === f.dia) {
                  <div
                    class="tp-sem__barrita"
                    role="toolbar"
                    aria-label="Qué hacer con lo elegido"
                    [class.is-inicio]="b.min === null"
                    [class.is-izq]="b.min !== null && b.x < 30"
                    [class.is-der]="b.x > 70"
                    [style.left.%]="b.x"
                    (pointerdown)="$event.stopPropagation()"
                    (pointermove)="$event.stopPropagation()"
                    (pointerenter)="guia.set(null)"
                  >
                    @if (b.min !== null) {
                      <span class="tp-sem__barrita-hora t-num">{{ hora(b.min) }}</span>
                    }
                    @for (a of b.botones; track a.accion) {
                      <button type="button" class="tp-sem__barrita-btn" [attr.aria-keyshortcuts]="a.aria" (click)="hacer(a.accion)">
                        {{ a.texto }} <kbd class="tp-kbd">{{ a.tecla }}</kbd>
                      </button>
                    }
                    <button type="button" class="tp-sem__barrita-x" aria-label="Soltar lo elegido" data-tip="Soltar (Esc)" (click)="soltarEleccion()">
                      <sc-tp-icono nombre="x" [tam]="14" />
                    </button>
                  </div>
                }
              }
              @if (ahora()?.dia === f.dia && seVe(ahora()!.minutos)) {
                <span class="tp-sem__ahora" [style.left.%]="pos(ahora()!.minutos)" [attr.data-tip]="guia()?.dia === f.dia || barrita()?.dia === f.dia ? null : 'Ahora'"></span>
              }
            </span>
            <span class="tp-sem__total t-small t-num" [class.is-cerrado]="f.minutos === 0">{{ f.minutos === 0 ? 'Cerrado' : horasTxt(f.minutos) }}</span>
          </div>
        }
        <div class="tp-sem__leyenda t-micro t-3" aria-hidden="true">
          <span class="tp-sem__clave tp-sem__clave--si"></span>Se atiende
          <span class="tp-sem__clave tp-sem__clave--no"></span>No se atiende
          <span class="tp-spacer"></span>
          {{ ayuda() }}
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
  /** Las horas que se ven, si se eligieron en la regla de 24 h; `null` es la jornada, que se ajusta sola. */
  protected readonly ventana = signal<Rango | null>(null);
  /** El arrastre en la regla: qué se mueve, desde qué minuto y cómo estaba al empezar. */
  private nav: { modo: 'desde' | 'hasta' | 'mover'; m0: number; r0: Rango; caja: DOMRect } | null = null;
  private readonly avisos = inject(TpAvisos);
  protected readonly seleccion = signal<readonly Elegido[]>([]);
  /** Dónde se pulsó la última barra elegida; con días elegidos por su letra, ninguna. */
  protected readonly marca = signal<Marca | null>(null);
  /** Los días recién pegados, que se iluminan un momento. */
  protected readonly pegados = signal<readonly number[]>([]);
  /** La fila por la que pasa el puntero: ahí pega ⌘V si no hay otros días elegidos. */
  protected encima: number | null = null;
  /** El último día elegido, desde el que Mayús elige un rango. */
  private ancla: number | null = null;
  /** Tras un arrastre, el clic que llega al soltar no elige. */
  private trasArrastre = false;

  /* Los tramos viven aparte mientras se editan: uno recién añadido aún no tiene días y la semana no puede contarlo. Se
   * recalculan cuando la semana llega de fuera (deshacer, cargar). */
  private ultima: Semana | null = null;
  private borrador: Tramo[] = [];
  protected readonly tramos = computed<Tramo[]>(() => {
    const s = this.semana();
    if (s !== this.ultima) this.borrador = tramosDe(s);
    // Sin ningún día abierto (un horario nuevo, o al cerrarlo todo), queda una fila sin días: se van marcando y nada salta.
    if (!this.borrador.length) this.borrador = [{ dias: [], franjas: [[540, 1080]] }];
    return this.borrador;
  });
  /** Ningún día abre todavía: la semana enseña cómo empezar. */
  protected readonly vacia = computed(() => this.tramos().every((t) => t.dias.length === 0));
  /** Los tramos de ahora mismo, aunque la semana que acabamos de emitir aún no haya vuelto por la entrada. */
  private vivos(): Tramo[] {
    this.tramos();
    return this.borrador;
  }

  protected tramoDe(dia: number): number {
    return this.tramos().findIndex((t) => t.dias.includes(dia));
  }

  constructor() {
    // Si la semana cambia desde fuera (deshacer, cargar otro horario), lo elegido ya no apunta a lo mismo.
    effect(() => {
      if (this.semana() !== this.ultima) untracked(() => this.seleccion.set([]));
    });
  }

  /* ── Elegir, copiar, pegar y borrar ───────────────────────────────────────────────────────────────────────────── */

  protected diaEntero(dia: number): boolean {
    return this.seleccion().some((x) => x.dia === dia && x.franja === null);
  }

  protected barraElegida(dia: number, franja: number): boolean {
    return this.seleccion().some((x) => x.dia === dia && x.franja === franja);
  }

  /** Lo que dice la leyenda: cómo seguir con lo que hay elegido o copiado. */
  protected readonly ayuda = computed(() => {
    if (this.guia()?.corte) return 'Pulsa la barra para fijar la raya y ver qué puedes hacer; Supr quita la franja entera';
    if (this.seleccion().length) return 'Pulsa en otro punto de la barra para mover la raya; Esc suelta lo elegido';
    if (this.vacia()) return 'Ningún día abre todavía: márcalos en la fila de arriba o arrastra sobre uno aquí';
    if (PORTAPAPELES()) return 'Pasa por un día o pulsa su letra, y ⌘V pega lo copiado';
    return 'Arrastra sobre el rojo para añadir horas; pulsa una barra o un día para copiarlo';
  });

  protected elegirDia(e: MouseEvent, dia: number): void {
    contarUso('elegir');
    this.marca.set(null);
    const antes = this.seleccion();
    if (e.shiftKey && this.ancla !== null) {
      const [a, b] = [Math.min(this.ancla, dia), Math.max(this.ancla, dia)];
      this.seleccion.set(Array.from({ length: b - a + 1 }, (_, i) => ({ dia: a + i, franja: null })));
      return;
    }
    const ya = this.diaEntero(dia);
    if (e.metaKey || e.ctrlKey) {
      this.seleccion.set(ya ? antes.filter((x) => x.dia !== dia) : [...antes.filter((x) => x.dia !== dia), { dia, franja: null }]);
    } else {
      this.seleccion.set(ya && antes.length === 1 ? [] : [{ dia, franja: null }]);
    }
    this.ancla = dia;
  }

  /**
   * Un clic en una barra la elige y deja la raya donde se pulsó, con la barrita encima. Otro clic en la misma barra mueve
   * la raya; en el mismo sitio, la suelta. Con Mayús o ⌘ se suman o quitan barras, y la raya va a la última pulsada.
   */
  protected elegirBarra(e: MouseEvent, dia: number, franja: number): void {
    if (this.trasArrastre || franja < 0) return;
    contarUso('elegir');
    const pista = (e.currentTarget as HTMLElement).closest('.tp-sem__pista')?.getBoundingClientRect();
    const m = pista ? this.minutoEn(e, pista) : null;
    const antes = this.seleccion();
    const ya = antes.some((x) => x.dia === dia && x.franja === franja);
    const mk = this.marca();
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      this.seleccion.set(ya ? antes.filter((x) => !(x.dia === dia && x.franja === franja)) : [...antes.filter((x) => !(x.dia === dia && x.franja === null)), { dia, franja }]);
    } else {
      const mismoSitio = ya && antes.length === 1 && (m === null || (mk?.dia === dia && Math.abs(mk.min - m) <= PASO));
      this.seleccion.set(mismoSitio ? [] : [{ dia, franja }]);
    }
    const queda = this.seleccion().some((x) => x.dia === dia && x.franja === franja);
    this.marca.set(queda && m !== null ? { dia, min: m } : this.seleccion().length ? mk : null);
    this.guia.set(null);
    this.ancla = dia;
  }

  /**
   * El tooltip de una barra, solo cuando no hay otro globo en su fila: al pasar por una barra ya sale la raya con su hora
   * y sus teclas, y con algo elegido, la barrita. Dos globos a la vez se pisan.
   */
  protected tipDeBarra(t: { vivo: boolean; movible: boolean; de: number; franja: number; texto: string }, dia: number): string | null {
    if (t.vivo || this.arrastre() || this.barraElegida(t.de, t.franja) || this.barrita()?.dia === dia) return null;
    return t.movible && !this.seleccion().length ? null : t.texto;
  }

  /** Las horas de la barra bajo la raya, si la barra es tan estrecha que no las lleva escritas. */
  protected franjaSinRotulo(g: Guia): string | null {
    const c = g.corte;
    if (!c) return null;
    const t = this.filas()[g.dia]?.trozos.find((x) => x.movible && x.tramo === c.tramo && x.franja === c.franja);
    return t && !t.etiqueta ? t.texto : null;
  }

  protected diaElegido(dia: number): boolean {
    return this.seleccion().some((x) => x.dia === dia);
  }

  protected soltarEleccion(): void {
    this.seleccion.set([]);
    this.marca.set(null);
  }

  /** La barrita de lo elegido: encima de la última barra pulsada, a la hora de la raya; con días, al principio de su fila. */
  protected readonly barrita = computed(() => {
    const sel = this.seleccion();
    if (!sel.length || this.arrastre()) return null;
    const mk = this.marca();
    const conRaya = mk !== null && sel.some((x) => x.dia === mk.dia);
    const soloDias = sel.every((x) => x.franja === null);
    const acciones: Accion[] = [...(conRaya ? (['dividir', 'antes', 'despues'] as const) : []), 'copiar', ...(soloDias && PORTAPAPELES() ? (['pegar'] as const) : []), 'borrar'];
    return {
      dia: conRaya ? mk.dia : sel[sel.length - 1].dia,
      min: conRaya ? mk.min : null,
      x: conRaya ? Math.min(100, Math.max(0, this.pos(mk.min))) : 0,
      botones: acciones.map((a) => BOTONES[a]),
    };
  });

  protected hacer(accion: Accion): void {
    if (accion === 'dividir' || accion === 'antes' || accion === 'despues') this.cortarElegido(accion);
    else if (accion === 'copiar') {
      if (this.copiar()) contarUso('copiar');
    } else if (accion === 'pegar') this.pegar();
    else if (this.borrar()) contarUso('borrar');
  }

  /** Lo elegido que aún existe, y sus días en orden. */
  private elegido(): { sel: readonly Elegido[]; dias: number[] } {
    const s = this.semana();
    const sel = this.seleccion().filter((x) => x.franja === null || !!s[x.dia]?.[x.franja]);
    return { sel, dias: [...new Set(sel.map((x) => x.dia))].sort((a, b) => a - b) };
  }

  private textoDe(dias: readonly number[], franjas: readonly (readonly Franja[])[]): string {
    return dias
      .map((d, i) => `${this.capital(NOMBRES[d])}: ${franjas[i].length ? franjas[i].map((f) => `${horaCorta(f[0])}–${horaCorta(f[1])}`).join(' y ') : 'cerrado'}`)
      .join('\n');
  }

  private copiar(): boolean {
    const { sel, dias } = this.elegido();
    if (!dias.length) return false;
    const s = this.semana();
    const franjas = dias.map((d) =>
      sel.some((x) => x.dia === d && x.franja === null)
        ? [...(s[d] ?? [])]
        : sel.filter((x) => x.dia === d && x.franja !== null).map((x) => s[d][x.franja!]).sort((a, b) => a[0] - b[0]),
    );
    PORTAPAPELES.set({ dias, franjas });
    try {
      sessionStorage.setItem(CLAVE_COPIADO, JSON.stringify({ dias, franjas }));
    } catch {
      // almacenamiento bloqueado: lo copiado vive hasta recargar
    }
    try {
      void navigator.clipboard?.writeText(this.textoDe(dias, franjas)).catch(() => undefined);
    } catch {
      // sin portapapeles del sistema: se pega igual dentro de Horarios
    }
    const que = dias.length === 1 ? this.textoDe(dias, franjas).replace(':', '') : losDias(dias);
    this.avisos.decir(`Copiado: ${que.charAt(0).toLowerCase()}${que.slice(1)}. Señala otro día y pulsa ⌘V`);
    return true;
  }

  private pegar(): boolean {
    const p = PORTAPAPELES();
    if (!p) return false;
    let destino = this.elegido().dias;
    const mismo = destino.length === p.dias.length && destino.every((d, i) => d === p.dias[i]);
    if (!destino.length || mismo) destino = this.encima !== null ? [this.encima] : [];
    if (!destino.length) {
      this.avisos.decir('Señala dónde pegar: pulsa la letra de un día o pasa por su fila');
      return true;
    }
    const antes = JSON.stringify(this.semana());
    const nueva: Franja[][] = this.semana().map((d) => [...(d ?? [])]);
    // Un día copiado va a cada día elegido; varios, uno tras otro desde el primero elegido.
    const tocados: number[] = [];
    if (p.franjas.length === 1 || destino.length === p.franjas.length) {
      destino.forEach((d, i) => {
        nueva[d] = [...p.franjas[p.franjas.length === 1 ? 0 : i]];
        tocados.push(d);
      });
    } else {
      p.franjas.forEach((fr, i) => {
        const d = destino[0] + i;
        if (d > 6) return;
        nueva[d] = [...fr];
        tocados.push(d);
      });
    }
    if (JSON.stringify(nueva) === antes) {
      this.avisos.decir(`${this.capital(losDias(tocados))} ${tocados.length > 1 ? 'ya tienen' : 'ya tiene'} esas horas: señala otro día`);
      return true;
    }
    this.seleccion.set([]);
    this.emitir(tramosDe(nueva));
    contarUso('pegar');
    this.pegados.set(tocados);
    setTimeout(() => this.pegados.set([]), 900);
    const donde = losDias(tocados);
    this.avisos.decir(`Pegado ${donde.startsWith('de ') ? donde : `en ${donde}`}. ⌘Z lo deshace`);
    return true;
  }

  private borrar(corte = false): boolean {
    const { sel, dias } = this.elegido();
    if (!dias.length) return false;
    const nueva: Franja[][] = this.semana().map((d) => [...(d ?? [])]);
    for (const d of dias) {
      const entero = sel.some((x) => x.dia === d && x.franja === null);
      const fuera = new Set(sel.filter((x) => x.dia === d).map((x) => x.franja));
      nueva[d] = entero ? [] : nueva[d].filter((_, i) => !fuera.has(i));
    }
    this.seleccion.set([]);
    this.emitir(tramosDe(nueva));
    const todo = dias.every((d) => nueva[d].length === 0);
    const que = losDias(dias);
    this.avisos.decir(`${corte ? 'Cortado' : todo ? 'Cerrado' : 'Borrado'}: ${que}. ⌘Z lo deshace`);
    return true;
  }

  /**
   * Lo que hacen las teclas con la raya de corte sobre una barra, como en un editor de vídeo: B (o C) divide ahí y deja
   * una pausa de una hora si cabe; Q quita lo de antes de la raya, W lo de después, y Supr la franja entera. Cambia la
   * fila de días que comparten esas horas, como arrastrar un borde.
   */
  private cortar(accion: 'dividir' | 'antes' | 'despues' | 'quitar'): boolean {
    const g = this.guia();
    const c = g?.corte;
    if (!g || !c) return false;
    const tramos = this.vivos();
    const t = tramos[c.tramo];
    const [ini, fin] = t?.franjas[c.franja] ?? [0, 0];
    if (!t || ini !== c.f[0] || fin !== c.f[1]) return false;
    const m = g.min;
    const dias = losDias(t.dias);
    let franjas: Franja[];
    let aviso: string;
    if (accion === 'dividir') {
      const pausa = Math.min(PAUSA, Math.floor((fin - m - PASO) / PASO) * PASO);
      if (m - ini < PASO || pausa < PASO) {
        this.avisos.decir('Aquí no cabe una pausa: divide más lejos de los bordes');
        return true;
      }
      franjas = t.franjas.flatMap((f, i) => (i === c.franja ? [[ini, m] as Franja, [m + pausa, fin] as Franja] : [f]));
      aviso = `Dividido a las ${horaCorta(m)}, con pausa hasta las ${horaCorta(m + pausa)}`;
    } else if (accion === 'antes' || accion === 'despues') {
      const nueva: Franja = accion === 'antes' ? [m, fin] : [ini, m];
      if (nueva[1] - nueva[0] < PASO) return true;
      franjas = t.franjas.map((f, i) => (i === c.franja ? nueva : f));
      aviso = accion === 'antes' ? `Ahora empieza a las ${horaCorta(m)}` : `Ahora acaba a las ${horaCorta(m)}`;
    } else {
      franjas = t.franjas.filter((_, i) => i !== c.franja);
      aviso = `Quitada la franja de ${horaCorta(ini)} a ${horaCorta(fin)}`;
    }
    // Sin franjas, la fila se va y sus días quedan cerrados.
    this.emitir(franjas.length ? tramos.map((x, i) => (i === c.tramo ? { ...x, franjas } : x)) : tramos.filter((_, i) => i !== c.tramo));
    contarUso(accion === 'dividir' ? 'dividir' : accion === 'quitar' ? 'borrar' : 'recortar');
    this.guia.set(null);
    this.seleccion.set([]);
    this.avisos.decir(`${this.capital(dias)}: ${aviso.charAt(0).toLowerCase()}${aviso.slice(1)}. ⌘Z lo deshace`);
    return true;
  }

  /**
   * Lo mismo que la raya de corte, pero sobre lo elegido y a la hora de la raya que dejó el clic: va por días, como copiar
   * y borrar. Elegir el lunes y el martes y pulsar B divide esos dos; los demás días de su fila quedan como estaban.
   */
  private cortarElegido(accion: 'dividir' | 'antes' | 'despues'): boolean {
    const mk = this.marca();
    const { sel, dias } = this.elegido();
    if (!mk || !dias.length) return false;
    const m = mk.min;
    const nueva: Franja[][] = this.semana().map((d) => [...(d ?? [])]);
    const hechos = new Set<number>();
    let pausa = PAUSA;
    let noCabe = false;
    for (const d of dias) {
      const entero = sel.some((x) => x.dia === d && x.franja === null);
      const cuales = new Set(sel.filter((x) => x.dia === d).map((x) => x.franja));
      nueva[d] = nueva[d].flatMap((f, i): Franja[] => {
        const [ini, fin] = f;
        if ((!entero && !cuales.has(i)) || fin <= ini || m <= ini || m >= fin) return [f];
        if (accion === 'dividir') {
          const p = Math.min(PAUSA, Math.floor((fin - m - PASO) / PASO) * PASO);
          if (m - ini < PASO || p < PASO) {
            noCabe = true;
            return [f];
          }
          pausa = p;
          hechos.add(d);
          return [
            [ini, m],
            [m + p, fin],
          ];
        }
        hechos.add(d);
        return [accion === 'antes' ? [m, fin] : [ini, m]];
      });
    }
    if (!hechos.size) {
      this.avisos.decir(noCabe ? 'Aquí no cabe una pausa: divide más lejos de los bordes' : `La raya de las ${horaCorta(m)} no cae dentro de lo elegido`);
      return true;
    }
    this.emitir(tramosDe(nueva));
    contarUso(accion === 'dividir' ? 'dividir' : 'recortar');
    this.soltarEleccion();
    const varios = hechos.size > 1;
    const que =
      accion === 'dividir'
        ? `${varios ? 'divididos' : 'dividido'} a las ${horaCorta(m)}, con pausa hasta las ${horaCorta(m + pausa)}`
        : accion === 'antes'
          ? `ahora ${varios ? 'empiezan' : 'empieza'} a las ${horaCorta(m)}`
          : `ahora ${varios ? 'acaban' : 'acaba'} a las ${horaCorta(m)}`;
    this.avisos.decir(`${this.capital(losDias([...hechos].sort((a, b) => a - b)))}: ${que}. ⌘Z lo deshace`);
    return true;
  }

  /** ⌘C, ⌘X, ⌘V y Supr sobre el mapa. Escribiendo en un campo o con un diálogo abierto, el teclado es suyo. */
  @HostListener('document:keydown', ['$event'])
  protected teclado(e: KeyboardEvent): void {
    const el = e.target as HTMLElement | null;
    if (this.arrastre() || el?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], sc-tp-modal')) return;
    const mod = (e.metaKey || e.ctrlKey) && !e.altKey;
    const k = e.key.toLowerCase();
    // Con la raya de corte sobre una barra: teclas de editor de vídeo, sin modificadores.
    const corte = this.guia()?.corte;
    // Supr va antes a lo elegido, si lo hay.
    const borraElegido = (k === 'delete' || k === 'backspace') && this.seleccion().length > 0;
    // Con algo elegido y su raya, B, Q y W cortan lo elegido, igual que la barrita.
    if (this.marca() && this.seleccion().length && !mod && !e.altKey && !e.shiftKey && ['b', 'c', 'q', 'w'].includes(k)) {
      if (this.cortarElegido(k === 'b' || k === 'c' ? 'dividir' : k === 'q' ? 'antes' : 'despues')) e.preventDefault();
      return;
    }
    if (corte && !mod && !e.altKey && !e.shiftKey && !borraElegido && ['b', 'c', 'q', 'w', 'delete', 'backspace'].includes(k)) {
      if (this.cortar(k === 'b' || k === 'c' ? 'dividir' : k === 'q' ? 'antes' : k === 'w' ? 'despues' : 'quitar')) e.preventDefault();
      return;
    }
    // Con texto seleccionado en la página, ⌘C copia ese texto, como siempre.
    const hayTexto = (window.getSelection()?.toString() ?? '') !== '';
    if (mod && !e.shiftKey && k === 'c' && !hayTexto) {
      if (this.copiar()) {
        e.preventDefault();
        contarUso('copiar');
      }
    } else if (mod && !e.shiftKey && k === 'x' && !hayTexto) {
      if (this.copiar() && this.borrar(true)) {
        e.preventDefault();
        contarUso('cortar');
      }
    } else if (mod && !e.shiftKey && k === 'v') {
      if (this.pegar()) e.preventDefault();
    } else if (!mod && (e.key === 'Delete' || e.key === 'Backspace')) {
      if (this.borrar()) {
        e.preventDefault();
        contarUso('borrar');
      }
    } else if (e.key === 'Escape' && !this.arrastre()) {
      this.soltarEleccion();
    }
  }

  /** Pulsar fuera del mapa suelta lo elegido. */
  @HostListener('document:pointerdown', ['$event'])
  protected fuera(e: PointerEvent): void {
    if (this.seleccion().length && !(e.target as HTMLElement | null)?.closest('.tp-sem__mapa, sc-tp-avisos')) this.soltarEleccion();
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

  /**
   * Las horas abiertas en algún día de la semana, juntas: lo verde de la regla. Y lo que no se puede dejar fuera de la
   * vista, redondeado a horas: nunca se esconde una hora en la que se atiende.
   */
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
  private readonly imprescindible = computed<Rango | null>(() => {
    const a = this.abiertas();
    return a.length ? { desde: Math.floor(a[0].desde / 60) * 60, hasta: Math.ceil(a[a.length - 1].hasta / 60) * 60 } : null;
  });

  /** Lo que enseña el mapa. Mientras se arrastra una barra no cambia: la escala no se mueve bajo el dedo. */
  protected readonly rango = computed<Rango>(() => {
    const a = this.arrastre();
    if (a) return a.rango;
    const v = this.ventana();
    const n = this.imprescindible();
    if (!v) return this.jornada();
    return n ? { desde: Math.min(v.desde, n.desde), hasta: Math.max(v.hasta, n.hasta) } : v;
  });

  /* ── La regla de 24 h: arrastrar el marco o sus bordes ─────────────────────────────────────────────────────────── */

  private horaEn(e: PointerEvent, caja: DOMRect): number {
    return Math.min(1440, Math.max(0, Math.round((((e.clientX - caja.left) / caja.width) * 1440) / 60) * 60));
  }

  /** Lo pedido, dentro del día, con 4 h como poco y sin dejar fuera horas abiertas. */
  private ponerVentana(r: Rango): void {
    const n = this.imprescindible();
    let { desde, hasta } = r;
    if (n) {
      desde = Math.min(desde, n.desde);
      hasta = Math.max(hasta, n.hasta);
    }
    desde = Math.max(0, Math.min(desde, 1440 - 240));
    hasta = Math.min(1440, Math.max(hasta, desde + 240));
    const j = this.jornada();
    this.ventana.set(desde === j.desde && hasta === j.hasta ? null : { desde, hasta });
  }

  protected navEmpezar(e: PointerEvent): void {
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    const caja = el.getBoundingClientRect();
    const m = this.horaEn(e, caja);
    const r = this.rango();
    const asa = (e.target as HTMLElement).closest('.tp-sem__nav-asa');
    let modo: 'desde' | 'hasta' | 'mover';
    if (asa) modo = asa.classList.contains('is-ini') ? 'desde' : 'hasta';
    else if (m > r.desde && m < r.hasta) modo = 'mover';
    else {
      // Fuera del marco: el borde más cercano salta ahí y se sigue arrastrando.
      modo = m <= r.desde ? 'desde' : 'hasta';
      this.ponerVentana(modo === 'desde' ? { desde: m, hasta: r.hasta } : { desde: r.desde, hasta: m });
    }
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    this.nav = { modo, m0: m, r0: this.rango(), caja };
  }

  protected navMover(e: PointerEvent): void {
    const n = this.nav;
    if (!n) return;
    const m = this.horaEn(e, n.caja);
    if (n.modo === 'desde') this.ponerVentana({ desde: m, hasta: n.r0.hasta });
    else if (n.modo === 'hasta') this.ponerVentana({ desde: n.r0.desde, hasta: m });
    else {
      // El marco se mueve entero y se para donde dejaría fuera una hora abierta: moverlo nunca lo estira.
      const largo = n.r0.hasta - n.r0.desde;
      const abierto = this.imprescindible();
      const min = Math.max(0, abierto ? abierto.hasta - largo : 0);
      const max = Math.min(1440 - largo, abierto ? abierto.desde : 1440);
      const desde = Math.min(max, Math.max(min, n.r0.desde + m - n.m0));
      this.ponerVentana({ desde, hasta: desde + largo });
    }
  }

  protected navSoltar(e: PointerEvent): void {
    if (!this.nav) return;
    this.nav = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  /** Doble clic: el día entero; otra vez, la jornada. */
  protected navDiaEntero(): void {
    const r = this.rango();
    if (r.desde === 0 && r.hasta === 1440) this.ventana.set(null);
    else this.ponerVentana(DIA);
  }

  protected navTecla(e: KeyboardEvent, lado: 'desde' | 'hasta'): void {
    const r = this.rango();
    const paso = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -60 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 60 : 0;
    const fin = e.key === 'Home' ? 0 : e.key === 'End' ? 1440 : null;
    if (!paso && fin === null) return;
    e.preventDefault();
    const m = fin ?? (lado === 'desde' ? r.desde : r.hasta) + paso;
    this.ponerVentana(lado === 'desde' ? { desde: m, hasta: r.hasta } : { desde: r.desde, hasta: m });
  }

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
          de,
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
  private minutoEn(e: { readonly clientX: number }, pista: DOMRect): number {
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
    if (!h) {
      // Sobre una barra: la raya de corte, salvo en sus bordes (ahí se arrastra) y en las que cruzan la medianoche.
      // Con algo elegido, manda su raya fija: la de pasar no sale, para que no haya dos.
      const t =
        (e.target as HTMLElement).closest('.tp-sem__asa') || this.seleccion().length ? null : this.filas()[dia].trozos.find((x) => x.movible && m > x.desde && m < x.hasta);
      if (!t) {
        if (this.guia()) this.guia.set(null);
        return;
      }
      const ya = this.guia();
      if (ya?.dia === dia && ya.min === m && ya.corte) return;
      this.guia.set({ dia, min: m, libre: false, hasta: m, corte: { tramo: t.tramo, franja: t.franja, f: [t.inicio, t.fin] } });
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
    const sinDias = antes.findIndex((t) => t.dias.length === 0);
    if (i === -1 && sinDias !== -1) {
      // La fila sin días (la de un horario nuevo) se estrena con este día: así no sale otra fila y el mapa no salta.
      tramos = antes.map((t, k) => (k === sinDias ? { dias: [dia], franjas: [nueva] } : t));
      tramo = sinDias;
      franja = 0;
    } else if (i === -1) {
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
    this.seleccion.set([]);
    this.gesto.emit(true);
    this.emitir(tramos);
    this.arrastre.set({ tramo, franja, lado: 'pintar', dia, pista, x0: e.clientX, f0: nueva, rango: this.rango(), antes, movido: false, min: h.min, max: h.max });
  }

  @HostListener('document:pointermove', ['$event'])
  protected mover(e: PointerEvent): void {
    const a = this.arrastre();
    if (!a) return;
    if (!a.movido && Math.abs(e.clientX - a.x0) < 3) return;
    // Arrastrar una barra de verdad suelta lo elegido: la raya fija ya no estaría donde se pulsó.
    if (!a.movido && this.seleccion().length) this.soltarEleccion();
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
    if (a.lado === 'pintar') contarUso('pintar');
    else if (a.movido) contarUso('arrastrar');
    // Dos franjas que se tocan son una: en atención, de 9 a 14 y de 14 a 18 es de 9 a 18. Dentro del mismo paso de ⌘Z.
    const junta = this.juntarTocadas(a.tramo);
    if (junta) this.avisos.decir(`Se tocaban, así que ahora son una: ${junta}. ⌘Z lo deshace`);
    // El clic que sigue a soltar un arrastre no elige la barra.
    if (a.movido) {
      this.trasArrastre = true;
      setTimeout(() => (this.trasArrastre = false));
    }
    this.arrastre.set(null);
    this.gesto.emit(false);
  }

  /** Junta en una las franjas de un tramo que se tocan (la de noche, no) y dice cuál queda; si no hay, `null`. */
  private juntarTocadas(tramo: number): string | null {
    const tramos = this.vivos();
    const t = tramos[tramo];
    if (!t) return null;
    const franjas: Franja[] = [];
    let junta: Franja | null = null;
    for (const f of t.franjas) {
      const prev = franjas[franjas.length - 1];
      if (prev && prev[1] > prev[0] && f[1] > f[0] && prev[1] === f[0]) {
        junta = [prev[0], f[1]];
        franjas[franjas.length - 1] = junta;
      } else franjas.push(f);
    }
    if (!junta) return null;
    this.emitir(tramos.map((x, i) => (i === tramo ? { ...x, franjas } : x)));
    return `de ${horaCorta(junta[0])} a ${horaCorta(junta[1])}`;
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
