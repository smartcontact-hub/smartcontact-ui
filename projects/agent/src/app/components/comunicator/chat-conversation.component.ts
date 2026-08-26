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
      font-size: 11.65px;
    }

    /* .header-message-private — 44 sobre #333a41. */
    .conv__head {
      position: relative;
      flex: none;
      height: 44px;
      background: #333a41;
      border-radius: 28.73px 28.73px 0 0;
    }
    .conv__back {
      position: absolute;
      top: 13px;
      left: 23.3px;
      width: 11.4px;
      height: 17.5px;
      padding: 0;
      border: 0;
      background-color: #fff;
      -webkit-mask: url('/icons/dialpad/atras.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/atras.svg') no-repeat center / contain;
      cursor: pointer;
    }
    .conv__name {
      position: absolute;
      top: 14.9px;
      left: 46px;
      width: 90px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .conv__time {
      position: absolute;
      top: 15.6px;
      left: 144.4px;
    }
    /*
     * .subcontainerIconMessagePrivate de la cabecera: 18.96 cuadrado, radio 4.37, fondo
     * blanco y glifo oscuro; al pasar por encima vira a azul con el glifo en blanco.
     * Cuando la conversación ya no está viva, el original los apaga: transferir a
     * #8d939d y cerrar a #824549 con el aspa en gris.
     */
    .conv__act {
      position: absolute;
      top: 14.9px;
      width: 18.96px;
      height: 18.96px;
      padding: 0;
      border: 0;
      border-radius: 4.37px;
      background: #fff;
      cursor: pointer;
    }
    .conv__act::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 8.34px;
      height: 9.1px;
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
      left: 192.81px;
      --g: url('/icons/dialpad/transferencia-chat.svg');
    }
    .conv__act--cancel {
      left: 218.6px;
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
      padding: 20.3px 11.9px 13.2px;
      background: #2d333a;
    }
    .line {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 7.6px;
    }
    .line--send {
      justify-content: flex-end;
    }
    /* .server — texto gris centrado, sin burbuja. */
    .line--server {
      justify-content: center;
      margin-bottom: 11.4px;
      padding: 0 2px;
      color: #aaaaaa;
      text-align: center;
    }
    /* .msg — radio 5.92 con la esquina inferior del lado propio a cero. */
    .bubble {
      position: relative;
      max-width: 149.2px;
      padding: 3.41px 8.44px 18.59px;
      border-radius: 5.92px 5.92px 5.92px 0;
      background: #1c1c1c;
      color: #fff;
      line-height: 1.35;
    }
    .bubble--send {
      border-radius: 5.92px 5.92px 0 5.92px;
      background: #2179ed;
    }
    .bubble__time {
      position: absolute;
      right: 8.44px;
      bottom: 4px;
      font-size: 10.1px;
      opacity: 0.85;
    }

    /* .footer-container-message-private — 122.2 sobre #333a41. */
    .conv__foot {
      flex: none;
      height: 122.2px;
      padding-top: 11.4px;
      background: #333a41;
      box-sizing: border-box;
    }
    .conv__tools {
      position: relative;
      height: 19px;
      padding: 0 9.73px;
    }
    /* Iconos de 19 con radio 4.87: gris cuando estan deshabilitados. */
    .tool {
      position: absolute;
      top: 0;
      display: block;
      width: 19px;
      height: 19px;
      border-radius: 4.87px;
    }
    .tool::after {
      content: '';
      position: absolute;
      inset: 4px;
      background-color: #fff;
      -webkit-mask: var(--g) no-repeat center / contain;
      mask: var(--g) no-repeat center / contain;
    }
    .tool--off {
      background: #8d939d;
    }
    .tool--off:nth-of-type(1) {
      left: 8.7px;
    }
    .tool--off:nth-of-type(2) {
      left: 34.5px;
    }
    .tool--on {
      left: 222.6px;
      background: #fff;
    }
    .tool--on::after {
      background-color: #000;
    }
    /* .containerSendMessage — textarea de 187.3 x 44.9 y boton de 32. */
    .conv__send {
      display: flex;
      align-items: flex-start;
      gap: 8.3px;
      margin-top: 14.4px;
      padding: 0 11.3px;
    }
    .conv__send textarea {
      width: 187.3px;
      height: 44.9px;
      padding: 8.45px 8.45px 7.61px;
      border: 0;
      border-radius: 10.14px;
      background: #1f2429;
      color: #fff;
      font-family: inherit;
      font-size: 11.65px;
      resize: none;
      outline: none;
      box-sizing: border-box;
    }
    .conv__go {
      position: relative;
      flex: none;
      width: 32px;
      height: 32px;
      margin-top: 6.4px;
      border: 0;
      border-radius: 10.14px;
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
      inset: 6.6px;
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
