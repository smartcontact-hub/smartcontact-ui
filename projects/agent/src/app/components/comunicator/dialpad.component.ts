import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AgentStateService } from '../../agent-state.service';
import { GRUPOS, type Grupo } from '../../data/seed';

const KEYS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '*',
  '0',
  '#',
] as const;

/**
 * Dialpad en REPOSO — la sección 'call' del Comunicador cuando no hay llamada.
 *
 * En el real, '.container-call' alterna dos cuerpos según 'callInProgress': '.dialpad'
 * (esto) y '.current-call'. Aquí está montado el primero: teclado, selector de nodo y
 * el botón de llamar. Medidas del real copiadas TAL CUAL en vw (ver docs/escala.md;
 * los comentarios dan el px equivalente a 1456, que es como se midieron)
 * (ver 'projects/agent/docs/escala.md').
 *
 * Cuando el agente no puede llamar, el real atenúa teclado y selector al 30 % y los
 * deja inertes, y en su lugar el pie muestra el aviso rojo '.security'.
 */
@Component({
  selector: 'app-dialpad',
  standalone: true,
  template: `
    <div class="dial">
      <div class="dial__body">
        <div class="keypad" [class.blocked]="!state.canCall()">
          <div class="display">
            <div class="display__spacer"></div>
            <div class="display__num">
              <input
                type="text"
                inputmode="numeric"
                pattern="^[0-9]*$"
                aria-label="Número a marcar"
                [value]="number()"
                (input)="onInput($event)"
              />
            </div>
            <button
              class="display__del"
              type="button"
              aria-label="Borrar"
              (click)="del()"
            ></button>
          </div>

          <div class="keys">
            @for (k of keys; track k) {
            <button
              type="button"
              class="key"
              [class.pressed]="pressed() === k"
              (click)="press(k)"
            >
              <span class="key__n">{{ k }}</span>
            </button>
            }
          </div>
        </div>

        <div class="group" [class.blocked]="!state.canCall()">
          @if (listOpen()) {
          <div class="group__list" role="listbox">
            @for (g of grupos; track g.name + g.id) {
            <button
              class="group__item"
              type="button"
              role="option"
              [attr.aria-selected]="g.name === node().name"
              (click)="pick(g)"
            >
              <span class="group__name">{{ g.name }}</span>
              <span class="group__id">{{ g.id }}</span>
            </button>
            }
          </div>
          }
          <button
            class="group__btn"
            type="button"
            [class.open]="listOpen()"
            [attr.aria-expanded]="listOpen()"
            (click)="listOpen.update((v) => !v)"
          >
            {{ node().name }}
          </button>
        </div>
      </div>

      <div class="dial__foot">
        @if (state.step() === 'incall') {
        <button
          class="btn-call hangup"
          type="button"
          aria-label="Colgar"
          (click)="state.hangUp()"
        ></button>
        } @else if (state.canCall()) {
        <button
          class="btn-call makecall"
          type="button"
          aria-label="Llamar"
          [disabled]="!number()"
          (click)="state.startCall()"
        ></button>
        } @else {
        <p class="security">No se puede llamar desde el estado actual</p>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .dial {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: #fff;
    }
    .dial__body {
      flex: 1;
      min-height: 0;
    }

    /* .dialpad .keypad — margin 3.438 1.823 2.396 1.875vw */
    .keypad {
      margin: 3.440935vw 1.820055vw 2.396979vw 1.875vw;
    }
    /* Estado que no permite llamar: el real lo atenúa y lo deja inerte. */
    .keypad.blocked,
    .group.blocked {
      opacity: 0.3;
      pointer-events: none;
    }

    /* .display — 13.542 x 2.344vw */
    .display {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      width: 13.543957vw;
      height: 2.342033vw;
      border-bottom: 0.052198vw solid rgba(255, 255, 255, 0.5);
    }
    .display__spacer {
      width: 20%;
    }
    .display__num {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80%;
      height: 1.407968vw;
    }
    .display__num input {
      width: 12.115385vw;
      border: none;
      outline: none;
      background: none;
      color: #fff;
      /* El número usa Roboto en el real, no Open Sans. */
      font-family: 'Roboto', var(--ag-font);
      font-size: 1.407968vw;
      text-align: center;
    }
    .display__del {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      width: 20%;
      height: 100%;
      border: 0;
      background: none;
      cursor: pointer;
    }
    .display__del::after {
      content: '';
      width: 1.146979vw;
      height: 0.728022vw;
      background-color: #fff;
      -webkit-mask: url('/icons/dialpad/borrar.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/borrar.svg') no-repeat center / contain;
    }

    /* .keys-container — 11.198vw de ancho, margin-top 2.344vw, margin-left 1.094vw */
    .keys {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      width: 11.195055vw;
      margin-top: 2.342033vw;
      margin-left: 1.092033vw;
      user-select: none;
    }
    /* .keys — 2.813vw, radio 1.146vw */
    .key {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.815935vw;
      height: 2.815935vw;
      border: 0;
      border-radius: 1.146979vw;
      background: transparent;
      cursor: pointer;
    }
    .key:hover {
      background-color: #1f2429;
    }
    .key.pressed,
    .key:active {
      background-color: #fff;
    }
    .key.pressed .key__n,
    .key:active .key__n {
      color: #000;
    }
    .key__n {
      color: #fff;
      font-family: var(--ag-font);
      font-size: 1.25vw;
    }

    /* .service-group — margin 2.344 1.823 0 1.875vw */
    .group {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2.342033vw 1.820055vw 0 1.875vw;
    }
    /*
     * .containerButtonSelect — el desplegable sube desde el botón: mismo ancho
     * (123.6), fondo #1f2429, radio 13.5, tope de 199.4 y scroll.
     */
    .group__list {
      position: absolute;
      bottom: calc(100% + 0.432693vw);
      width: 8.489011vw;
      max-height: 13.695055vw;
      overflow-y: auto;
      border-radius: 0.927198vw;
      background: #1f2429;
      box-shadow: 0.157968vw 0.157968vw 0.052198vw rgba(0, 0, 0, 0.18);
      z-index: 2;
    }
    /* .service-group-info — 44px de alto, dos líneas, opacidad 0.75. */
    .group__item {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 0.068682vw;
      width: 100%;
      height: 3.021979vw;
      /*
       * Padding del original (0.521 / 1.563 / 0.677vw). El que había era mayor y, con el
       * line-height 1.3 que hereda del shell, las DOS líneas —nombre y número— sumaban
       * 27.6 en una caja de 26.5: se recortaban y se leían encima la una de la otra.
       */
      padding: 0.521978vw 1.563187vw 0.521978vw 0.677198vw;
      border: 0;
      border-bottom: 0.038462vw solid #000;
      background: transparent;
      color: #fff;
      font-family: var(--ag-font);
      /*
       * El real declara font-size DOS VECES aquí (0.729vw y luego 1.406vw) y gana la
       * segunda: el texto se sale de la caja. Es un fallo suyo, no un diseño, así que
       * se replica la primera — la que cuadra con la caja.
       */
      font-size: 0.728022vw;
      line-height: 1.2;
      opacity: 0.75;
      text-align: left;
      cursor: pointer;
    }
    .group__item:last-child {
      border-bottom: 0;
    }
    .group__item:hover {
      background-color: #181c20;
    }
    .group__name {
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .group__id {
      opacity: 0.7;
    }
    /*
     * .buttonGroup — 8.49 x 1.875vw. Es EXACTAMENTE la misma caja que el botón
     * «Finalizar» del Figma de SISMAC-3780: el patrón de control del dialpad.
     */
    .group__btn {
      width: 8.489011vw;
      height: 1.875vw;
      padding-left: 0.508242vw;
      border: 0.052198vw solid #fff;
      border-radius: 0.625vw;
      /* background-COLOR, no el atajo: el atajo resetea la flecha de background-image. */
      background-color: transparent;
      color: #fff;
      font-family: var(--ag-font);
      font-size: 0.803572vw;
      text-align: left;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: pointer;
    }
    /* Con el desplegable abierto el botón se invierte: fondo blanco y texto #333a41. */
    .group__btn.open {
      background-color: #fff;
      color: #333a41;
    }
    .group__btn:hover:not(.open) {
      background-color: #9fa2a6;
    }
    /* La flecha del real (0.521vw al 90% del ancho), en negro sobre el fondo blanco. */
    .group__btn {
      background-image: var(--arrow);
      background-repeat: no-repeat;
      background-position: 90% 50%;
      background-size: 0.521979vw 0.521979vw;
      --arrow: url('/icons/comunicator/flecha_2.svg');
    }
    .group__btn.open {
      --arrow: url('/icons/comunicator/flecha_2_black.svg');
    }

    /* .footer-call — 82.2px medidos en el real (el 5.99vw del CSS lo recorta el flex). */
    .dial__foot {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 5.645605vw;
      flex: none;
    }
    /* .btn-call — 11.146 x 2.76vw, radio 0.833vw */
    .btn-call {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 11.146979vw;
      height: 2.76099vw;
      border: none;
      border-radius: 0.831044vw;
      outline: none;
      cursor: pointer;
    }
    .btn-call::after {
      content: '';
      width: 1.25vw;
      height: 1.25vw;
      background-color: #fff;
      -webkit-mask: url('/icons/dialpad/telefono_pequeno_blanco.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/telefono_pequeno_blanco.svg') no-repeat center / contain;
    }
    .btn-call.makecall {
      background: #69c663;
    }
    /* .btn-call.hangup — #f75454 (hover #f43434) y el icono más grande, 1.771vw. */
    .btn-call.hangup {
      background: #f75454;
    }
    .btn-call.hangup:hover {
      background: #f43434;
    }
    .btn-call.hangup::after {
      width: 1.771979vw;
      height: 1.771979vw;
      -webkit-mask-image: url('/icons/dialpad/colgar-grande-blanco.svg');
      mask-image: url('/icons/dialpad/colgar-grande-blanco.svg');
    }
    .btn-call.makecall:hover:not(:disabled) {
      background: #2bae22;
    }
    .btn-call:disabled {
      background: transparent;
      border: 0.052198vw solid #85898d;
      cursor: default;
    }
    .btn-call:disabled::after {
      background-color: #85898d;
    }

    /* .security — el aviso rojo que sustituye al botón cuando no se puede llamar. */
    .security {
      width: 90%;
      margin: 0;
      padding: 0.418957vw 1.146979vw;
      border-radius: 0.625vw;
      background-color: #762727;
      color: #fff;
      font-family: var(--ag-font);
      font-size: 0.625vw;
      font-weight: 700;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialpadComponent {
  protected readonly state = inject(AgentStateService);
  protected readonly keys = KEYS;
  protected readonly grupos = GRUPOS;
  protected readonly node = signal<Grupo>(GRUPOS[2]);
  protected readonly listOpen = signal(false);

  constructor() {
    effect(() => {
      const n = this.state.dialNumber();
      if (n) {
        this.number.set(n);
      }
    });
  }

  protected pick(g: Grupo): void {
    this.node.set(g);
    this.listOpen.set(false);
  }

  /** El número lo puede precargar «Gestionar» desde la tabla de Pendientes. */
  protected readonly number = signal('');
  protected readonly pressed = signal<string | null>(null);

  protected press(k: string): void {
    this.number.update((n) => n + k);
    this.pressed.set(k);
    setTimeout(() => this.pressed.set(null), 120);
  }

  protected del(): void {
    this.number.update((n) => n.slice(0, -1));
  }

  /**
   * Escribiendo solo entran DÍGITOS — en una línea de marcación no se escriben letras.
   * ('*' y '#' sí entran, pero por las teclas, como en el real.)
   *
   * Hay que reescribir el valor del input a mano: si el filtro no cambia la señal
   * —teclear una letra deja el mismo número—, Angular no repinta y el carácter se
   * queda visible en el DOM aunque el modelo esté limpio.
   */
  protected onInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    const clean = el.value.replace(/[^0-9]/g, '');
    if (el.value !== clean) {
      el.value = clean;
    }
    this.number.set(clean);
  }
}
