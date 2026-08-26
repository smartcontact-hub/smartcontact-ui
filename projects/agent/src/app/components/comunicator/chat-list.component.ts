import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { CHATS, type ChatRow } from '../../data/seed';

/**
 * Sección «Mensajes» — el listado de conversaciones de chat.
 *
 * Medidas tomadas en vivo sobre el widget real (escala 1456): tarjeta de 250.3 x 88.9
 * sobre #2d333a, barra de estado de 7.6, avatar de 28.1 con radio 10.14, y el nombre y
 * el grupo en dos lineas con la vista previa debajo.
 */
@Component({
  selector: 'app-chat-list',
  standalone: true,
  template: `
    <div class="chats">
      <div class="chats__head">
        <div class="chats__title">Mensajes</div>
        <label class="chats__search">
          <span class="chats__lupa"></span>
          <input
            type="search"
            placeholder="Buscar..."
            aria-label="Buscar conversación"
          />
        </label>
      </div>

      <div class="chats__list">
        @for (c of chats; track c.id) {
        <div
          class="msg"
          role="button"
          tabindex="0"
          (click)="opened.emit(c)"
          (keydown.enter)="opened.emit(c)"
          (keydown.space)="opened.emit(c)"
        >
          <span class="msg__status" [class]="statusFor(c)"></span>
          <span class="msg__avatar" [style.background]="c.color">{{
            c.initial
          }}</span>
          <span class="msg__info">
            <span class="msg__row">
              <span class="msg__name">{{ c.name }}</span>
              <span class="msg__time">{{ c.time }}</span>
            </span>
            <span class="msg__group">
              <span class="msg__gtext">{{ c.group }}</span>
              @if (needsTypifying(c)) {
              <button
                class="msg__typify"
                type="button"
                aria-label="Tipificar conversación"
                (click)="askTypify(c, $event)"
              ></button>
              }
            </span>
            <span class="msg__preview">{{ c.preview }}</span>
          </span>
        </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .chats {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: #fff;
    }
    /* .header-message — 93.8 de alto. */
    .chats__head {
      flex: none;
      height: 6.442308vw;
      padding-top: 0.728022vw;
      box-sizing: border-box;
    }
    /* .header-message-subheader — 20.5, titulo 13.66 Semibold centrado. */
    .chats__title {
      height: 1.407968vw;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 0.938187vw;
      line-height: 1.407968vw;
      text-align: center;
    }
    /* .buscador — 204.89 x 26.54 a 22.7, radio 7.59, con la lupa de 12.12 a 11.88. */
    .chats__search {
      position: relative;
      display: flex;
      align-items: center;
      width: 14.072116vw;
      height: 1.822803vw;
      margin: 1.229396vw 0 0 1.559066vw;
    }
    .chats__lupa {
      position: absolute;
      left: 0.815935vw;
      width: 0.832418vw;
      height: 0.832418vw;
      background-color: var(--ag-muted);
      -webkit-mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      pointer-events: none;
    }
    .chats__search input {
      width: 100%;
      height: 100%;
      padding: 0 0.815935vw 0 2.251374vw;
      border: 0;
      border-radius: 0.521292vw;
      background: #1f2429;
      color: #fff;
      font-family: inherit;
      font-size: 0.800138vw;
      outline: none;
      box-sizing: border-box;
    }

    .chats__list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    /* .message — 250.3 x 88.9 sobre #2d333a. */
    .msg {
      position: relative;
      display: block;
      width: 17.190935vw;
      height: 6.10577vw;
      padding: 0;
      border: 0;
      border-bottom: 0.038462vw solid #000;
      background: #2d333a;
      text-align: left;
      cursor: pointer;
    }
    .msg:hover {
      background: #333a41;
    }
    /* .status — barra de 7.6; en el original marca los no leidos. */
    .msg__status {
      position: absolute;
      inset: 0 auto 0 0;
      width: 0.521979vw;
    }
    /* Colores del original: rojo sin leer, teal a la espera de tipificar, gris caducada. */
    .msg__status.busy {
      background: #f75454;
    }
    .msg__status.postchat {
      background: #166f8d;
    }
    .msg__status.expired {
      background: #8d939d;
    }
    /* .avatar-content — 28.1 cuadrado, radio 10.14, a 19.7 / 15.2. */
    .msg__avatar {
      position: absolute;
      top: 1.043957vw;
      left: 1.353022vw;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.929946vw;
      height: 1.929946vw;
      border-radius: 0.696429vw;
      color: #fff;
      font-size: 0.703297vw;
    }
    /* .message-info — a 47.8, 182 de ancho. */
    .msg__info {
      position: absolute;
      top: 0.521979vw;
      left: 3.282968vw;
      width: 12.5vw;
    }
    .msg__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.412088vw;
      height: 1.146979vw;
      padding-left: 0.625vw;
    }
    .msg__name {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 0.780907vw;
    }
    .msg__time {
      flex: none;
      font-size: 0.730083vw;
    }
    /*
     * .message-info-group — contenedor relativo de 16.69 minimo con padding 0 13.66 0 7.59.
     * Aloja el nodo (en azul claro) y, pegado a la derecha, el boton de tipificar.
     */
    .msg__group {
      position: relative;
      display: flex;
      align-items: center;
      min-height: 1.146292vw;
      padding: 0 0.938187vw 0 0.521292vw;
    }
    /* .text-group — tope de 151.7 y elipsis, para no chocar con el boton. */
    .msg__gtext {
      max-width: 10.418957vw;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: #73abf4;
      font-size: 0.780907vw;
      line-height: 1.174451vw;
    }
    /*
     * .subcontainerIconMessagePrivate — 15.93 cuadrado, radio 4.37, fondo blanco con el
     * glifo en #262c32. Nace OCULTO y solo aparece al pasar por encima de la tarjeta;
     * al pasar por el propio boton, el fondo vira a azul y el glifo a blanco.
     */
    .msg__typify {
      position: absolute;
      top: 0;
      right: 0;
      display: none;
      padding: 0;
      border: 0;
      width: 1.094094vw;
      height: 1.094094vw;
      margin-top: 0.050138vw;
      border-radius: 0.300138vw;
      background: #fff;
      cursor: pointer;
    }
    .msg:hover .msg__typify {
      display: block;
    }
    .msg__typify::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0.469094vw;
      height: 0.469094vw;
      transform: translate(-50%, -50%);
      background-color: #262c32;
      -webkit-mask: url('/icons/dialpad/tipificar.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/tipificar.svg') no-repeat center / contain;
    }
    .msg__typify:hover {
      background: #0056fe;
    }
    .msg__typify:hover::after {
      background-color: #fff;
    }
    .msg__preview {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      padding-left: 0.625vw;
      color: var(--ag-text-2);
      font-size: 0.780907vw;
      line-height: 1.4;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatListComponent {
  protected readonly chats = CHATS;
  readonly opened = output<ChatRow>();
  protected readonly selected = signal<number | null>(null);

  /** Ids ya tipificados; los decide el Comunicador y los baja por entrada. */
  readonly typified = input<ReadonlySet<number>>(new Set());

  /** Petición de abrir la ventana de Tipificación para esa conversación. */
  readonly typifyRequested = output<ChatRow>();

  /**
   * El original solo ofrece tipificar cuando la conversación es con un CLIENTE y ha
   * quedado en postconversando. Entre agentes no hay nada que tipificar, y mientras
   * sigue viva la tipificación llega al cerrarla.
   */
  protected needsTypifying(c: ChatRow): boolean {
    return (
      c.kind === 'client' &&
      c.state === 'postchat' &&
      !this.typified().has(c.id)
    );
  }

  /**
   * La barra lateral dice en qué quedó la conversación: roja si la abandonaron,
   * turquesa mientras falta tipificar y sin color si acabó con normalidad.
   */
  protected statusFor(c: ChatRow): string {
    if (c.state === 'abandoned') {
      return 'msg__status busy';
    }
    if (this.needsTypifying(c)) {
      return 'msg__status postchat';
    }
    return 'msg__status';
  }

  /**
   * Tipificar NO abre la conversación: es la otra acción de la tarjeta. Al hacerlo, la
   * conversación deja de estar en postconversando y la barra turquesa desaparece, que
   * es lo que libera al agente para volver a ponerse disponible.
   */
  protected askTypify(c: ChatRow, ev: Event): void {
    ev.stopPropagation();
    this.typifyRequested.emit(c);
  }
}
