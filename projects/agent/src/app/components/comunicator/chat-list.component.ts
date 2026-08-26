import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
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
          <input type="search" placeholder="Buscar..." aria-label="Buscar conversación" />
        </label>
      </div>

      <div class="chats__list">
        @for (c of chats; track c.id) {
          <button class="msg" type="button" (click)="opened.emit(c)">
            <span class="msg__status" [class.unread]="c.unread > 0"></span>
            <span class="msg__avatar" [style.background]="c.color">{{ c.initial }}</span>
            <span class="msg__info">
              <span class="msg__row">
                <span class="msg__name">{{ c.name }}</span>
                <span class="msg__time">{{ c.time }}</span>
              </span>
              <span class="msg__group">{{ c.group }}</span>
              <span class="msg__preview">{{ c.preview }}</span>
            </span>
          </button>
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
      height: 93.8px;
      padding-top: 10.6px;
      box-sizing: border-box;
    }
    /* .header-message-subheader — 20.5, titulo 13.66 Semibold centrado. */
    .chats__title {
      height: 20.5px;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 13.66px;
      line-height: 20.5px;
      text-align: center;
    }
    /* .header-message-subheader-input — 204.9 x 26.5 a 22.7, radio 8.45. */
    .chats__search {
      position: relative;
      display: flex;
      align-items: center;
      width: 204.9px;
      height: 26.5px;
      margin: 17.9px 0 0 22.7px;
    }
    .chats__lupa {
      position: absolute;
      left: 10px;
      width: 11px;
      height: 11px;
      background-color: var(--ag-muted);
      -webkit-mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      pointer-events: none;
    }
    .chats__search input {
      width: 100%;
      height: 100%;
      padding: 0 10px 0 29px;
      border: 0;
      border-radius: 8.45px;
      background: #1f2429;
      color: #fff;
      font-family: inherit;
      font-size: 11.65px;
      outline: none;
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
      width: 250.3px;
      height: 88.9px;
      padding: 0;
      border: 0;
      border-bottom: 0.56px solid #000;
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
      width: 7.6px;
    }
    .msg__status.unread {
      background: #f75454;
    }
    /* .avatar-content — 28.1 cuadrado, radio 10.14, a 19.7 / 15.2. */
    .msg__avatar {
      position: absolute;
      top: 15.2px;
      left: 19.7px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28.1px;
      height: 28.1px;
      border-radius: 10.14px;
      color: #fff;
      font-size: 10.24px;
    }
    /* .message-info — a 47.8, 182 de ancho. */
    .msg__info {
      position: absolute;
      top: 7.6px;
      left: 47.8px;
      width: 182px;
    }
    .msg__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      height: 16.7px;
      padding-left: 9.1px;
    }
    .msg__name {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 11.37px;
    }
    .msg__time {
      flex: none;
      font-size: 10.63px;
    }
    /* .text-group — el nodo va en azul claro. */
    .msg__group {
      display: block;
      height: 17.1px;
      padding-left: 7.5px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: #73abf4;
      font-size: 11.37px;
      line-height: 17.1px;
    }
    .msg__preview {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      padding-left: 9.1px;
      color: var(--ag-text-2);
      font-size: 11.37px;
      line-height: 1.4;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatListComponent {
  protected readonly chats = CHATS;
  readonly opened = output<ChatRow>();
  protected readonly selected = signal<number | null>(null);
}
