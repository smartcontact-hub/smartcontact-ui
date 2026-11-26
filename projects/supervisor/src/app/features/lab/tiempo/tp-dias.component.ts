import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, HostListener, inject, input, output, signal, untracked } from '@angular/core';

import { type Franja, type Semana, validarSemana } from '@features/admin/repositories/state/horarios.core.mjs';
import {
  ScBadgeComponent,
  ScButtonComponent,
  ScDatepickerComponent,
  ScMessageComponent,
  ScSelectComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';

import { CORTOS, horaCorta, LETRAS, NOMBRES, trozosDelDia } from './tp-modelo';
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
  readonly y0: number;
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
  /** La barra entera puede ir a otro día: la fila bajo el puntero, si se copia (con ⌥) y dónde quedaría. */
  readonly otroDia: number;
  readonly duplica: boolean;
  readonly puesta: Franja;
  /** Dónde está cada fila al empezar, para saber sobre qué día va el puntero. */
  readonly filasY: readonly { readonly dia: number; readonly top: number; readonly bottom: number }[];
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
/** El icono de cada aviso, con los nombres del DS. */
const ICONO_AYUDA: Record<IconoDeAyuda, string> = { alert: 'warning', copy: 'content_copy', check: 'check_circle', info: 'info' };
/** El tono de cada aviso, en la severidad de \`sc-message\`: la guía y la oferta, info; lo hecho, éxito; un problema, error. */
const SEVERIDAD: Record<string, 'secondary' | 'info' | 'success' | 'danger'> = { neutro: 'secondary', guia: 'info', oferta: 'info', aviso: 'success', error: 'danger' };

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
/**
 * Lo que llega de otro día se funde con lo que se pisa o se toca: dos franjas no pueden solaparse. La de noche no se
 * funde. Dice cuál queda si se juntó algo.
 */
function fundir(fs: readonly Franja[]): { franjas: Franja[]; junta: Franja | null } {
  const franjas: Franja[] = [];
  let junta: Franja | null = null;
  for (const f of ordenar(fs)) {
    const prev = franjas[franjas.length - 1];
    if (prev && !cruza(prev) && !cruza(f) && f[0] <= prev[1]) {
      junta = [prev[0], Math.max(prev[1], f[1])];
      franjas[franjas.length - 1] = junta;
    } else franjas.push([f[0], f[1]]);
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
  imports: [NgTemplateOutlet, ScBadgeComponent, ScButtonComponent, ScDatepickerComponent, ScMessageComponent, ScSelectComponent, ScTagComponent, ScToggleSwitchComponent, ScIconComponent, PopoverModule, TooltipModule],
  template: `
    <div class="tp-dias" [class.is-arrastrando]="arrastre() !== null" [class.is-copiando]="arrastre()?.duplica" [attr.data-arrastre]="arrastre()?.lado ?? null" role="group" aria-label="La semana, día a día">
      <!-- La ayuda: arriba, donde se empieza a leer, y una sola cosa a la vez. -->
      <!-- El aviso del DS (\`sc-message\`): su color dice qué es (guía, oferta, hecho o problema) y la oferta lleva sus botones. -->
      <div class="tp-dias__ayuda" [attr.data-tono]="ayuda().tono">
        <sc-message class="tp-dias__ayuda-msg" [severity]="severidad()" [icon]="ICONO_AYUDA[ayuda().icono]">
          <span role="status" aria-live="polite">{{ ayuda().texto }}</span>
        </sc-message>
        @if (ofertaVisible(); as o) {
          <span class="tp-dias__ayuda-acc">
            @if (o.dias.length) {
              <sc-button size="sm" [label]="'Sí, ' + (o.dias.length === 1 ? 'también' : 'a los ' + o.dias.length)" (clicked)="aplicarOferta()" />
            }
            <sc-button size="sm" variant="secondary" appearance="outlined" [label]="'Solo ' + nombreCon(o.dia)" (clicked)="soloEse()" />
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
          <sc-select
            class="tp-dias__vista-sel"
            size="sm"
            ariaLabel="Ver desde"
            appendTo="body"
            [options]="horasDesde()"
            optionLabel="label"
            optionValue="m"
            optionDisabled="no"
            [value]="rango().desde"
            (valueChange)="verDesde($any($event))"
          />
          <span>a</span>
          <sc-select
            class="tp-dias__vista-sel"
            size="sm"
            ariaLabel="Ver hasta"
            appendTo="body"
            [options]="horasHasta()"
            optionLabel="label"
            optionValue="m"
            optionDisabled="no"
            [value]="rango().hasta"
            (valueChange)="verHasta($any($event))"
          />
          @if (ventana()) {
            <sc-button
              class="tp-dias__vista-btn"
              size="sm"
              variant="secondary"
              appearance="text"
              label="Ajustar"
              pTooltip="Volver a ajustarse a lo abierto"
              tooltipPosition="top"
              tooltipEvent="both"
              (clicked)="ventana.set(null)"
            />
          } @else if (rango().desde > 0 || rango().hasta < 1440) {
            <sc-button class="tp-dias__vista-btn" size="sm" variant="secondary" appearance="text" label="Todo el día" (clicked)="ponerVentana({ desde: 0, hasta: 1440 })" />
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
          [class.has-foco]="foco()?.dia === f.dia"
          [class.is-baja]="baja()?.dia === f.dia"
          [style.--k]="f.lejos"
          [style.--salto]="baja()?.dia === f.dia ? 'calc(' + baja()!.filas + ' * ' + pasoDeFila + ')' : null"
        >
          <!--
            El interruptor del DS, en el verde de las barras: lo encendido y lo abierto son la misma cosa. El nombre es su
            etiqueta, así que se pulsa entero.
          -->
          <span class="tp-dias__dia" [class.is-abierto]="f.abierto">
            <sc-toggleswitch
              [checked]="f.abierto"
              [inputId]="'tp-dia-' + f.dia"
              [ariaLabel]="capital(nombres[f.dia]) + (f.hoy ? ', hoy' : '')"
              (checkedChange)="alternar(f.dia)"
            />
            <!-- Hoy, sin palabra: el día en una pastilla del color de la raya de ahora (el lector oye «hoy»). -->
            <label class="tp-dias__dia-nombre sc-text-body-semibold" [class.is-hoy]="f.hoy" [for]="'tp-dia-' + f.dia">{{ capital(cortos[f.dia]) }}</label>
          </span>
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
                [class.is-elegida]="elegida()?.dia === f.dia && elegida()?.j === t.j"
                [class.is-enlazada]="foco()?.dia === f.dia && foco()?.j === t.j"
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
                  <sc-icon name="add" size="inherit" [weight]="600" />
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
                <!--
                  Lo que no cabe: «+N» abre el día entero en el globo de PrimeNG (\`p-popover\`, como «Columnas» de las listas): al
                  pulsarlo, o al ir con Intro a una hora que solo está ahí. Dentro, cada franja con sus horas y, entre ellas,
                  cada pausa con su «Quitar». Cuelga del body: \`tp-globo\` le da las medidas y los colores de la pantalla.
                -->
                <span class="tp-mas tp-dias__mas">
                  <button
                    type="button"
                    class="tp-mas__btn tp-dias__mas-btn"
                    aria-haspopup="dialog"
                    [attr.aria-expanded]="masAbierto() === f.dia"
                    [attr.aria-label]="'Ver el ' + nombres[f.dia] + ' entero: ' + f.franjas.length + ' franjas'"
                    (click)="masDe.toggle($event)"
                  >
                    <sc-badge variant="secondary" size="xl" [label]="'+' + (f.franjas.length - aLaVista)" />
                  </button>
                  <p-popover #masDe appendTo="body" styleClass="tp-globo tp-dias__mas-pop" (onShow)="masAbierto.set(f.dia)" (onHide)="cerrarMas(f.dia)">
                    <div
                      class="tp-dias__mas-lista"
                      role="group"
                      [attr.aria-label]="capital(nombres[f.dia])"
                      [attr.data-dia-lista]="f.dia"
                      (focusin)="enfocar($event, f.dia)"
                      (focusout)="foco.set(null)"
                    >
                      <span class="tp-dias__mas-tit">{{ capital(nombres[f.dia]) }}, {{ f.franjas.length }} franjas</span>
                      <div class="tp-dias__mas-cuerpo">
                      @for (fr of f.franjas; track $index; let j = $index) {
                        @if (j > 0) {
                          <span class="tp-dias__mas-pausa t-num">
                            <span>Pausa de {{ hora(f.franjas[j - 1][1]) }} a {{ hora(fr[0]) }}</span>
                            <sc-button size="sm" variant="secondary" appearance="text" label="Quitar" [ariaLabel]="'Quitar la pausa de ' + hora(f.franjas[j - 1][1]) + ' a ' + hora(fr[0])" (clicked)="quitarPausa(f.dia, j)" />
                          </span>
                        }
                        <ng-container [ngTemplateOutlet]="caja" [ngTemplateOutletContext]="{ $implicit: fr, dia: f.dia, j, n: f.franjas.length }" />
                      }
                      </div>
                    </div>
                  </p-popover>
                </span>
              } @else if (f.franjas.length > 1 && f.unible) {
                <!--
                  «− Pausa», el par de «+ Pausa»: junta las dos franjas. Solo si lo de en medio es una pausa (tres horas como
                  mucho): juntar 9–14 con 22–2 daría de 9 a 2. La × de cada caja, en cambio, quita esa franja.
                -->
                <!-- Al pasar o al llegar con el teclado, la barra enseña el hueco que se rellena. -->
                <sc-button
                  class="tp-dias__pausa tp-dias__quitar"
                  size="sm"
                  variant="secondary"
                  appearance="text"
                  icon="close"
                  label="Quitar pausa"
                  [ariaLabel]="'Quitar la pausa de ' + hora(f.franjas[0][1]) + ' a ' + hora(f.franjas[1][0])"
                  (pointerenter)="verRelleno(f.dia)"
                  (focusin)="verRelleno(f.dia)"
                  (pointerleave)="relleno.set(null)"
                  (focusout)="relleno.set(null)"
                  (clicked)="relleno.set(null); quitarPausa(f.dia, 1)"
                />
              } @else if (f.pausa !== -1) {
                <!-- Al pasar o al llegar con el teclado, la barra enseña dónde cae la pausa antes del clic. -->
                <sc-button
                  class="tp-dias__pausa"
                  size="sm"
                  variant="secondary"
                  appearance="text"
                  icon="add"
                  label="Añadir pausa"
                  [ariaLabel]="'Añadir una pausa de ' + previaTexto(f.dia)"
                  (pointerenter)="verPausa(f.dia)"
                  (focusin)="verPausa(f.dia)"
                  (pointerleave)="corte.set(null)"
                  (focusout)="corte.set(null)"
                  (clicked)="corte.set(null); pausa(f.dia)"
                />
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
        <!-- Cada hora, el selector de hora del DS, como en la ficha de horario (una hora → \`sc-datepicker\` de solo hora). -->
        <sc-datepicker
          class="tp-dias__hora"
          size="sm"
          timeOnly
          placeholder="hh:mm"
          [showIcon]="false"
          [ariaLabel]="etiqueta(dia, j, n) + ', abre'"
          [value]="aHora(fr[0])"
          (valueChange)="ponerHoraDe(dia, j, 0, $event)"
        />
        <span class="tp-franja__a" aria-hidden="true"></span>
        <sc-datepicker
          class="tp-dias__hora"
          size="sm"
          timeOnly
          placeholder="hh:mm"
          [showIcon]="false"
          [ariaLabel]="etiqueta(dia, j, n) + ', cierra'"
          [value]="aHora(fr[1])"
          (valueChange)="ponerHoraDe(dia, j, 1, $event)"
        />
        @if (fr[0] === 0 && fr[1] === 1440) {
          <sc-tag class="tp-dias__marca" severity="success" value="24 h" />
        } @else if (fr[1] <= fr[0]) {
          <sc-tag class="tp-dias__marca" severity="secondary" value="+1" pTooltip="Acaba al día siguiente" tooltipPosition="top" />
        }
        <!-- Con más de una franja, cada caja se quita con su × (aparece al pasar o al llegar con el teclado). Con una sola, se cierra el día. -->
        @if (n > 1) {
          <button
            type="button"
            class="tp-dias__borrar"
            [attr.aria-label]="'Quitar la franja de ' + hora(fr[0]) + ' a ' + hora(fr[1])"
            [pTooltip]="'Quitar la franja de ' + hora(fr[0]) + ' a ' + hora(fr[1])"
            tooltipPosition="top"
            tooltipEvent="both"
            (click)="quitarFranja(dia, j)"
          >
            <sc-icon name="close" size="inherit" [weight]="600" />
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
  /** El día cuya lista de «+N» está abierta, para `aria-expanded`. */
  protected readonly masAbierto = signal<number | null>(null);
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
  protected readonly ICONO_AYUDA = ICONO_AYUDA;
  protected readonly severidad = computed(() => SEVERIDAD[this.ayuda().tono] ?? 'secondary');
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
      const abajo = el.dia < 6 ? `, ⌘D la copia al ${NOMBRES[el.dia + 1]}` : '';
      return { texto: `${que}: ⌫ la quita, Intro escribe sus horas${abajo}${pausa}.`, icono: 'info', tono: 'guia' };
    }
    if (this.vacia()) return { texto: 'Activa un día para abrirlo. Los siguientes copian sus horas.', icono: 'info', tono: 'guia' };
    return { texto: 'Arrastra o escribe las horas. Lleva una barra a otro día para moverla; con ⌥, la copias. Pulsa en una barra para elegirla: luego puedes quitarla o partirla con una pausa.', icono: 'info', tono: 'neutro' };
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
    return Array.from({ length: 21 }, (_, k) => k * 60).map((m) => ({ m, label: String(m / 60), no: (n !== null && m > n.desde) || m > hasta - VISTA_MINIMA }));
  });
  protected readonly horasHasta = computed(() => {
    const n = this.imprescindible();
    const { desde } = this.rango();
    return Array.from({ length: 21 }, (_, k) => 240 + k * 60).map((m) => ({ m, label: String(m / 60), no: (n !== null && m < n.hasta) || m < desde + VISTA_MINIMA }));
  });
  protected verDesde(v: number | string): void {
    this.ponerVentana({ desde: Number(v), hasta: this.rango().hasta });
  }
  protected verHasta(v: number | string): void {
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
          viva:
            !!a &&
            a.movido &&
            (a.otroDia === a.dia ? a.dia === dia && a.franja === j : a.otroDia === dia && t.franja[0] <= a.puesta[0] && t.franja[1] >= a.puesta[1]),
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
  /** La hora de un minuto del día, para el selector del DS; la misma fecha para el mismo minuto, para no repintarlo en balde. */
  private readonly fechas = new Map<number, Date>();
  protected aHora(minutos: number): Date {
    const m = minutos % 1440;
    let d = this.fechas.get(m);
    if (!d) {
      d = new Date(2000, 0, 1, Math.floor(m / 60), m % 60);
      this.fechas.set(m, d);
    }
    return d;
  }
  /** Lo que devuelve el selector, en minutos. Vaciado no cambia la franja: se quita con su ×. */
  protected ponerHoraDe(dia: number, j: number, lado: 0 | 1, hora: Date | null): void {
    if (!hora) return;
    this.ponerHora(dia, j, lado, hora.getHours() * 60 + hora.getMinutes());
  }

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
   * Lleva el cursor a una hora de una franja. Si esa franja solo está en la lista de «+N», primero la abre (el globo cuelga
   * del body y solo existe abierto) y luego enfoca la hora.
   */
  private enfocarCaja(dia: number, j: number, lado: number): void {
    const fila = this.host.nativeElement.querySelector<HTMLElement>(`.tp-dias__fila[data-dia="${dia}"]`);
    const enFila = fila?.querySelector<HTMLElement>(`.tp-dias__horas > [data-franja="${j}"]`);
    if (enFila) {
      enFila.querySelectorAll('input')[lado]?.focus();
      return;
    }
    const enLista = (): HTMLElement | null => document.querySelector<HTMLElement>(`[data-dia-lista="${dia}"] [data-franja="${j}"]`);
    if (!enLista()) fila?.querySelector<HTMLElement>('.tp-dias__mas-btn')?.click();
    // El globo se pinta un poco después del clic: se espera a que esté (unos fotogramas como mucho).
    const ir = (intentos: number): void => {
      const caja = enLista();
      if (caja) caja.querySelectorAll('input')[lado]?.focus();
      else if (intentos > 0) setTimeout(() => ir(intentos - 1), 30);
    };
    setTimeout(() => ir(10));
  }

  /** Al cerrarse el «+N», el foco que se quedaba dentro vuelve a su botón (si se pulsó fuera, se queda donde se pulsó). */
  protected cerrarMas(dia: number): void {
    this.masAbierto.set(null);
    const activo = document.activeElement;
    if (activo && activo !== document.body && !activo.closest('.tp-dias__mas-pop')) return;
    this.host.nativeElement.querySelector<HTMLElement>(`.tp-dias__fila[data-dia="${dia}"] .tp-dias__mas-btn`)?.focus();
  }

  /**
   * Esc con el reloj de una hora abierto dentro del «+N» cierra solo el reloj, y el siguiente, el globo: el globo de
   * PrimeNG escucha Esc en el document y se cerraría a la vez. Si el reloj estaba abierto (su panel sigue en el body
   * mientras se va), aquí, en el body, se para antes de llegar al document.
   */
  @HostListener('body:keydown.escape', ['$event'])
  protected escEnGlobo(e: Event): void {
    if (this.masAbierto() === null || !document.querySelector('.p-datepicker-panel')) return;
    if ((e.target as HTMLElement | null)?.closest('.tp-dias__mas-lista, .p-datepicker-panel')) e.stopPropagation();
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
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#tp-dia-${dia}`)?.focus());
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.elegida.set(null);
      this.corte.set(null);
      this.enfocarCaja(dia, j, 0);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      this.corte.set(null);
      this.duplicarAbajo(dia, j);
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
    const filasY = [...this.host.nativeElement.querySelectorAll<HTMLElement>('.tp-dias__fila')].map((el) => {
      const c = el.getBoundingClientRect();
      return { dia: Number(el.dataset['dia']), top: c.top, bottom: c.bottom };
    });
    const f0 = s[dia][j];
    this.arrastre.set({ dia, franja: j, lado, pista, x0: e.clientX, y0: e.clientY, f0, rango: this.rango(), antes: s, movido: false, ...lazos, ...this.limites(dia, j, lado), otroDia: dia, duplica: false, puesta: f0, filasY });
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
    this.arrastre.set({ dia, franja: j, lado: 'pintar', pista, x0: e.clientX, y0: e.clientY, f0: nueva, rango: this.rango(), antes, movido: false, ...lazos, min: h.min, max: h.max, otroDia: dia, duplica: false, puesta: nueva, filasY: [] });
  }

  /** Una franja a mitad de arrastre: los días que siguen a este se mueven con él, a la vista. */
  private ponerFranja(dia: number, j: number, f: Franja): void {
    const s = this.actual();
    this.emitir(this.conDia(s, dia, s[dia].map((y, k) => (k === j ? f : y)), this.arrastre()?.siguen ?? []));
  }

  @HostListener('document:pointermove', ['$event'])
  protected mover(e: Pick<PointerEvent, 'clientX' | 'clientY' | 'altKey'>): void {
    let a = this.arrastre();
    if (!a) return;
    this.puntero = { x: e.clientX, y: e.clientY };
    if (!a.movido && Math.abs(e.clientX - a.x0) < 3 && (a.lado !== 'mover' || Math.abs(e.clientY - a.y0) < 3)) return;
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
      const s0 = a.antes;
      const otroDia = this.filaEn(e.clientY, a);
      if (otroDia === a.dia) {
        // En su fila, de lado, sin pisar lo que hay. Siempre desde la semana de antes: pudo pasar por otro día.
        const desde = Math.min(max - largo, Math.max(min, f0[0] + aMin(e.clientX - a.x0)));
        const puesta: Franja = [desde, desde + largo];
        this.arrastre.set({ ...a, otroDia, duplica: false, puesta });
        this.emitir(this.conDia(s0, a.dia, s0[a.dia].map((y, k) => (k === a.franja ? puesta : y)), a.siguen));
        return;
      }
      // A otro día: la barra se va (con ⌥, se queda y va una copia) y se funde con lo que pise allí.
      const desde = Math.min(1440 - largo, Math.max(0, f0[0] + aMin(e.clientX - a.x0)));
      const puesta: Franja = [desde, desde + largo];
      const duplica = e.altKey;
      this.arrastre.set({ ...a, otroDia, duplica, puesta });
      const deOrigen = duplica ? s0[a.dia] : s0[a.dia].filter((_, k) => k !== a.franja);
      const llegada = fundir([...s0[otroDia], puesta]).franjas;
      this.emitir(s0.map((fs, d) => (d === a.dia ? [...deOrigen] : d === otroDia ? llegada : fs)));
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
    if (a.lado === 'mover' && a.otroDia !== a.dia) {
      this.soltarEnOtroDia(a);
      return;
    }
    if (a.lado === 'pintar' && !a.movido) {
      // Un clic en lo vacío pone una hora; en una pausa de una hora o menos, la rellena entera.
      this.ponerFranja(a.dia, a.franja, esPausa(a) ? [a.min, a.max] : [a.f0[0], Math.min(a.f0[0] + 60, a.max)]);
    }
    if (a.lado === 'pintar') contarUso('pintar');
    else if (a.movido) contarUso('arrastrar');
    const junta = this.juntarTocadas(a.dia, a.siguen);
    // Las horas que se ven se quedan como al pulsar: si se ajustaran solas a lo nuevo, todo el mapa saltaría al soltar
    // y la barra recién hecha caería lejos de donde se soltó. «Ajustar» las vuelve a ajustar; si coinciden, no sale.
    this.fijarVista(a.rango);
    this.arrastre.set(null);
    this.gesto.emit(false);
    if (!igual(this.actual()[a.dia], a.antes[a.dia])) this.sigue.delete(a.dia);
    this.ofrecer(a.dia, a.antes[a.dia], a.siguen, a.copia);
    if (junta) this.aviso.set(`Se tocaban, así que ahora es una sola franja: ${junta}. ⌘Z lo deshace.`);
    this.corte.set(null);
  }

  /** Deja la vista con las horas dadas; si coinciden con las que saldrían solas, vuelve a ajustarse sola. */
  private fijarVista(r: Rango): void {
    this.ventana.set(r);
    setTimeout(() => {
      const v = this.ventana();
      const auto = this.automatica();
      if (v && v.desde === auto.desde && v.hasta === auto.hasta) this.ventana.set(null);
    });
  }

  /** La fila bajo el puntero, con las de los extremos para lo que quede por encima o por debajo. */
  private filaEn(y: number, a: Arrastre): number {
    const fs = a.filasY;
    if (!fs.length) return a.dia;
    const alto = fs[0].bottom - fs[0].top;
    // Lejos de la lista (más de media fila por encima o por debajo), la barra vuelve a su día: soltar fuera no la manda
    // al lunes ni al domingo.
    if (y < fs[0].top - alto / 2 || y > fs[fs.length - 1].bottom + alto / 2) return a.dia;
    // Con resistencia: se cambia de día solo con el puntero bien dentro de otra fila (no en su quinto de arriba ni de
    // abajo). Un arrastre de lado con el pulso torcido no salta al vecino.
    const dentro = fs.find((f) => y >= f.top + alto * 0.2 && y <= f.bottom - alto * 0.2);
    if (dentro) return dentro.dia;
    const actual = fs.find((f) => f.dia === a.otroDia);
    if (actual && y >= actual.top - alto * 0.5 && y <= actual.bottom + alto * 0.5) return a.otroDia;
    return a.dia;
  }

  /** ⌥ pulsada o soltada a medio arrastre: copiar o mover cambia en el acto, sin esperar a que se mueva el ratón. */
  @HostListener('document:keydown.alt', ['$event'])
  @HostListener('document:keyup.alt', ['$event'])
  protected alternarCopia(e: Event): void {
    const a = this.arrastre();
    const p = this.puntero;
    if (!a || a.lado !== 'mover' || !a.movido || !p) return;
    e.preventDefault();
    this.mover({ clientX: p.x, clientY: p.y, altKey: e.type === 'keydown' });
  }
  /** Dónde iba el puntero en el último movimiento: lo que necesita ⌥ para repintar sin otro movimiento. */
  private puntero: { x: number; y: number } | null = null;

  /** La barra soltada en otro día ya está allí (la puso `mover`): queda contarlo y que ⌘Z lo deshaga de un paso. */
  private soltarEnOtroDia(a: Arrastre): void {
    const destino = a.otroDia;
    const [ini, fin] = a.puesta;
    contarUso('arrastrar');
    this.fijarVista(a.rango);
    this.arrastre.set(null);
    this.gesto.emit(false);
    // Los dos días cambiaron a mano: ya no siguen a otro.
    this.sigue.delete(destino);
    if (!a.duplica) this.sigue.delete(a.dia);
    const s = this.actual();
    const queda = s[destino].find((f) => f[0] <= ini && f[1] >= fin && (f[0] < ini || f[1] > fin));
    const junta = queda ? ` Se junta con lo que había: de ${horaCorta(queda[0])} a ${horaCorta(queda[1])}.` : '';
    const cerrado = !a.duplica && !s[a.dia].length ? ` ${capital(this.nombreCon(a.dia))} queda cerrado.` : '';
    const hecho = a.duplica ? 'Copiada' : 'Movida';
    this.oferta.set(null);
    this.aviso.set(`${hecho} al ${NOMBRES[destino]}, de ${horaCorta(ini)} a ${horaCorta(fin)}.${junta}${cerrado} ⌘Z lo deshace.`);
    this.corte.set(null);
  }

  /** ⌘D: la barra elegida, copiada al día de abajo y elegida allí, para seguir bajándola con otro ⌘D. */
  private duplicarAbajo(dia: number, j: number): void {
    const s = this.actual();
    const f = s[dia][j];
    // El domingo no tiene día debajo: su ayuda no ofrece ⌘D, y un aviso verde diría «hecho» sin haber hecho nada.
    if (!f || dia === 6) return;
    const abajo = dia + 1;
    const { franjas, junta } = fundir([...s[abajo], f]);
    contarUso('arrastrar');
    this.sigue.delete(abajo);
    this.origen.set(abajo);
    this.emitir(s.map((fs, d) => (d === abajo ? franjas : fs)));
    const nj = franjas.findIndex((x) => x[0] <= f[0] && (cruza(x) || x[1] >= f[1]));
    const extra = junta ? ` Se junta con lo que había: de ${horaCorta(junta[0])} a ${horaCorta(junta[1])}.` : '';
    this.oferta.set(null);
    this.aviso.set(`Copiada al ${NOMBRES[abajo]}, de ${horaCorta(f[0])} a ${horaCorta(f[1])}.${extra} ⌘Z lo deshace.`);
    this.elegida.set({ dia: abajo, j: nj });
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`.tp-dias__fila[data-dia="${abajo}"] .tp-sem__barra[data-j="${nj}"]`)?.focus());
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
