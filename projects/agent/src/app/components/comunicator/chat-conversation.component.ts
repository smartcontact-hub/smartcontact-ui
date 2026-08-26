import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import type { ChatRow } from '../../data/seed';

/**
 * Conversación de chat abierta — lo que sale al pulsar una fila de «Mensajes».
 *
 * Medidas tomadas en vivo sobre el widget real (escala 1456):
 *   cabecera 44 sobre #333a41 con la flecha atrás, nombre, hora y dos botones de 19;
 *   cuerpo 298.5 sobre #2d333a con las burbujas;
 *   pie 122.2 sobre #333a41 con la fila de iconos, el area de texto y el enviar.
 *
 * Colores de burbuja del original: enviada #2179ED, recibida #1C1C1C, sistema #AAAAAA.
 */
@Component({
  selector: 'app-chat-conversation',
  standalone: true,
  template: `
    <div class="conv">
      <div class="conv__head">
        <button
          class="conv__back"
          type="button"
          aria-label="Volver"
          (click)="closed.emit()"
        ></button>
        <span class="conv__name">{{ chat().name }}</span>
        <span class="conv__time">{{ chat().time }}</span>
        <button
          class="conv__act conv__act--transfer"
          type="button"
          aria-label="Transferir conversación"
          [class.off]="!live()"
          [disabled]="!live()"
        ></button>
        <button
          class="conv__act conv__act--cancel"
          type="button"
          aria-label="Cerrar conversación"
          [class.off]="!live()"
          [disabled]="!live()"
        ></button>
      </div>

      <div class="conv__body">
        @for (m of chat().thread; track $index) { @if (m.from === 'server') {
        <div class="line line--server">
          <span>{{ m.text }}</span>
        </div>
        } @else {
        <div class="line" [class.line--send]="m.from === 'send'">
          <span class="bubble" [class.bubble--send]="m.from === 'send'">
            {{ m.text }}
            <span class="bubble__time">{{ m.time }}</span>
          </span>
        </div>
        } }
      </div>

      <div class="conv__foot">
        <div class="conv__tools">
          <span
            class="tool tool--off"
            aria-hidden="true"
            style="--g: url('/icons/dialpad/adjuntar.svg')"
          ></span>
          <span
            class="tool tool--off"
            aria-hidden="true"
            style="--g: url('/icons/dialpad/plantilla.svg')"
          ></span>
          <span
            class="tool tool--on"
            aria-hidden="true"
            style="--g: url('/icons/dialpad/tipificar.svg')"
          ></span>
        </div>
        <div class="conv__send">
          <textarea
            placeholder="Escribe tu mensaje..."
            aria-label="Escribe tu mensaje"
            [value]="draft()"
            (input)="draft.set($any($event.target).value)"
          ></textarea>
          <button
            class="conv__go"
            type="button"
            aria-label="Enviar"
            [disabled]="!draft().trim()"
          ></button>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .conv {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: #fff;
      font-size: 0.800138vw;
    }

    /* .header-message-private — 44 sobre #333a41. */
    .conv__head {
      position: relative;
      flex: none;
      height: 3.021979vw;
      background: #333a41;
      border-radius: 1.973215vw 1.973215vw 0 0;
    }
    .conv__back {
      position: absolute;
      top: 0.892858vw;
      left: 1.600275vw;
      width: 0.782968vw;
      height: 1.201924vw;
      padding: 0;
      border: 0;
      background-color: #fff;
      -webkit-mask: url('/icons/dialpad/atras.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/atras.svg') no-repeat center / contain;
      cursor: pointer;
    }
    .conv__name {
      position: absolute;
      top: 1.023352vw;
      left: 3.159341vw;
      width: 6.181319vw;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .conv__time {
      position: absolute;
      top: 1.071429vw;
      left: 9.917583vw;
    }
    /*
     * .subcontainerIconMessagePrivate de la cabecera: 18.96 cuadrado, radio 4.37, fondo
     * blanco y glifo oscuro; al pasar por encima vira a azul con el glifo en blanco.
     * Cuando la conversación ya no está viva, el original los apaga: transferir a
     * #8d939d y cerrar a #824549 con el aspa en gris.
     */
    .conv__act {
      position: absolute;
      top: 1.023352vw;
      width: 1.302198vw;
      height: 1.302198vw;
      padding: 0;
      border: 0;
      border-radius: 0.300138vw;
      background: #fff;
      cursor: pointer;
    }
    .conv__act::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0.572803vw;
      height: 0.625vw;
      transform: translate(-50%, -50%);
      background-color: #262c32;
      -webkit-mask: var(--g) no-repeat center / contain;
      mask: var(--g) no-repeat center / contain;
    }
    .conv__act:not(.off):hover {
      background: #0056fe;
    }
    .conv__act:not(.off):hover::after {
      background-color: #fff;
    }
    .conv__act--transfer {
      left: 13.242446vw;
      --g: url('/icons/dialpad/transferencia-chat.svg');
    }
    .conv__act--cancel {
      left: 15.013737vw;
      background: #f75454;
      --g: url('/icons/dialpad/cancelar.svg');
    }
    .conv__act--cancel::after {
      background-color: #fff;
    }
    .conv__act--transfer.off {
      background: #8d939d;
      cursor: not-allowed;
    }
    .conv__act--cancel.off {
      background: #824549;
      cursor: not-allowed;
    }
    .conv__act--cancel.off::after {
      background-color: #8d939d;
    }

    /* .body-container-message-private — #2d333a. */
    .conv__body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 1.394231vw 0.817308vw 0.906594vw;
      background: #2d333a;
    }
    .line {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 0.521979vw;
    }
    .line--send {
      justify-content: flex-end;
    }
    /* .server — texto gris centrado, sin burbuja. */
    .line--server {
      justify-content: center;
      margin-bottom: 0.782968vw;
      padding: 0 0.137363vw;
      color: #aaaaaa;
      text-align: center;
    }
    /* .msg — radio 5.92 con la esquina inferior del lado propio a cero. */
    .bubble {
      position: relative;
      max-width: 10.247253vw;
      padding: 0.234204vw 0.579671vw 1.276786vw;
      border-radius: 0.406594vw 0.406594vw 0.406594vw 0;
      background: #1c1c1c;
      color: #fff;
      line-height: 1.35;
    }
    .bubble--send {
      border-radius: 0.406594vw 0.406594vw 0 0.406594vw;
      background: #2179ed;
    }
    .bubble__time {
      position: absolute;
      right: 0.579671vw;
      bottom: 0.274726vw;
      font-size: 0.693682vw;
      opacity: 0.85;
    }

    /* .footer-container-message-private — 122.2 sobre #333a41. */
    .conv__foot {
      flex: none;
      height: 8.392858vw;
      padding-top: 0.782968vw;
      background: #333a41;
      box-sizing: border-box;
    }
    .conv__tools {
      position: relative;
      height: 1.304946vw;
      padding: 0 0.66827vw;
    }
    /* Iconos de 19 con radio 4.87: gris cuando estan deshabilitados. */
    .tool {
      position: absolute;
      top: 0;
      display: block;
      width: 1.304946vw;
      height: 1.304946vw;
      border-radius: 0.334479vw;
    }
    .tool::after {
      content: '';
      position: absolute;
      inset: 0.274726vw;
      background-color: #fff;
      -webkit-mask: var(--g) no-repeat center / contain;
      mask: var(--g) no-repeat center / contain;
    }
    .tool--off {
      background: #8d939d;
    }
    .tool--off:nth-of-type(1) {
      left: 0.597528vw;
    }
    .tool--off:nth-of-type(2) {
      left: 2.369506vw;
    }
    .tool--on {
      left: 15.288462vw;
      background: #fff;
    }
    .tool--on::after {
      background-color: #000;
    }
    /* .containerSendMessage — textarea de 187.3 x 44.9 y boton de 32. */
    .conv__send {
      display: flex;
      align-items: flex-start;
      gap: 0.570055vw;
      margin-top: 0.989011vw;
      padding: 0 0.776099vw;
    }
    .conv__send textarea {
      width: 12.864011vw;
      height: 3.083792vw;
      padding: 0.580358vw 0.580358vw 0.522665vw;
      border: 0;
      border-radius: 0.696429vw;
      background: #1f2429;
      color: #fff;
      font-family: inherit;
      font-size: 0.800138vw;
      resize: none;
      outline: none;
      box-sizing: border-box;
    }
    .conv__go {
      position: relative;
      flex: none;
      width: 2.197803vw;
      height: 2.197803vw;
      margin-top: 0.439561vw;
      border: 0;
      border-radius: 0.696429vw;
      background: #2179ed;
      cursor: pointer;
    }
    .conv__go:disabled {
      background: #8d939d;
      cursor: default;
    }
    .conv__go::after {
      content: '';
      position: absolute;
      inset: 0.453297vw;
      background-color: #fff;
      -webkit-mask: url('/icons/dialpad/avion_envio.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/avion_envio.svg') no-repeat center / contain;
    }
    .conv__go:disabled::after {
      background-color: rgba(16, 16, 16, 0.4);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatConversationComponent {
  readonly chat = input.required<ChatRow>();
  readonly closed = output<void>();
  protected readonly draft = signal('');

  /** Transferir y cerrar solo tienen sentido con la conversación viva. */
  protected readonly live = computed(() => this.chat().state === 'open');
}
