import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MESSAGES, type Bubble, type MessageRow } from './mini-seed';

/**
 * Mensajes del Comunicador (mini). Dos vistas dentro del mismo hueco, como el real:
 * el LISTADO de conversaciones (`.header-message` + tarjetas) y, al pulsar una, la
 * CONVERSACION (`app-chats-conversation`: cabecera con volver, burbujas y redactor).
 *
 * En el entorno real la lista sale VACIA; aqui va poblada con datos FALSOS (mini-seed),
 * como Historial y Agenda. Colores de burbuja tomados del CSS del original
 * (comunicador.md): enviada #2179ED, recibida #1C1C1C, sistema #AAAAAA.
 */
@Component({
  selector: 'app-messages',
  standalone: true,
  template: `
    @if (current(); as c) {
    <!-- Conversación abierta -->
    <div class="conv">
      <div class="conv-head">
        <button class="back" type="button" aria-label="Volver" (click)="close()">
          <span class="back-ic"></span>
        </button>
        <span class="conv-name">{{ c.name }}</span>
        <span class="conv-time">{{ c.time }}</span>
        <span class="conv-actions">
          <button class="act transfer" type="button" aria-label="Transferir"></button>
          <button class="act closeconv" type="button" aria-label="Cerrar conversación"></button>
        </span>
      </div>
      <div class="conv-body">
        @for (b of thread(); track $index) {
        <div class="bubble-row" [class.me]="b.from === 'me'" [class.them]="b.from === 'them'" [class.sys]="b.from === 'system'">
          @if (b.from === 'system') {
          <span class="sys-text">{{ b.text }}</span>
          } @else {
          <span class="bubble">
            <span class="bubble-text">{{ b.text }}</span>
            @if (b.time) { <span class="bubble-time">{{ b.time }}</span> }
          </span>
          }
        </div>
        }
      </div>
      <div class="conv-foot">
        <textarea
          class="composer"
          rows="1"
          placeholder="Escribe un mensaje..."
          aria-label="Escribe un mensaje"
          [value]="draft()"
          (input)="draft.set($any($event.target).value)"
          (keydown.enter)="onEnter($event)"
        ></textarea>
        <button class="send" type="button" aria-label="Enviar" [disabled]="!draft().trim()" (click)="send()">
          <span class="send-ic"></span>
        </button>
      </div>
    </div>
    } @else {
    <!-- Listado de conversaciones -->
    <div class="head">
      <div class="title">Mensajes</div>
      <label class="search"><span class="lupa"></span><input type="search" placeholder="Buscar..." aria-label="Buscar" /></label>
    </div>
    <div class="list">
      @for (m of messages; track m.id) {
      <button class="msg" type="button" (click)="open(m.id)">
        <span class="unread" [class.on]="m.unread"></span>
        <span class="avatar" [class]="'ch-' + m.channel">{{ initials(m) }}</span>
        <span class="body">
          <span class="line1">
            <span class="name">{{ m.name }}</span>
            <span class="time">{{ m.time }}</span>
          </span>
          <span class="line2">
            <span class="preview">{{ m.preview }}</span>
          </span>
          <span class="grp">{{ m.group }}</span>
        </span>
      </button>
      }
    </div>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; }

    /* Cabecera del listado (header-message: título + buscador). */
    .head {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.6vh;
      padding: 2.2vh 3.4vw 1.6vh;
      border-bottom: 0.0975274725vh solid rgba(0, 0, 0, 0.4);
      flex: 0 0 auto;
    }
    .title { font-family: 'Open Sans Semibold', 'Open Sans', sans-serif; font-weight: 600; font-size: 2.05vh; }
    .search { display: flex; align-items: center; width: 100%; height: 3.6vh; padding: 0 3vw; gap: 2vw; background: #1f2429; border-radius: 2.4vw; }
    .lupa {
      width: 3.4vw; height: 1.7vh; flex: 0 0 auto; background-color: #9d9fa3;
      -webkit-mask: var(--lupa) no-repeat center / contain; mask: var(--lupa) no-repeat center / contain;
      --lupa: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z'/></svg>");
    }
    .search input { flex: 1; height: 100%; border: 0; outline: none; background: none; color: #fff; font-family: inherit; font-size: 1.8vh; }

    /* Listado. */
    .list { flex: 1; min-height: 0; overflow-y: auto; }
    .msg {
      position: relative;
      display: flex;
      align-items: center;
      gap: 3vw;
      width: 100%;
      height: 9.3vh;
      padding: 0 4vw 0 5vw;
      background: #2d333a;
      border: 0;
      border-bottom: 1px solid #000;
      color: #fff;
      cursor: pointer;
      text-align: left;
    }
    .msg:hover { background: #1f2429; }
    /* Barra de no leídos (status): azul si sin leer. */
    .unread { position: absolute; inset: 0 auto 0 0; width: 1vw; background: transparent; }
    .unread.on { background: #2179ed; }
    .avatar {
      display: flex; align-items: center; justify-content: center;
      width: 4.4vh; height: 4.4vh; flex: 0 0 auto; border-radius: 50%;
      background: linear-gradient(135deg, #2b6cff, #00c2d1);
      color: #fff; font-family: 'Open Sans Semibold', sans-serif; font-weight: 600; font-size: 1.5vh;
    }
    .avatar.ch-whatsapp { background: linear-gradient(135deg, #25d366, #128c7e); }
    .avatar.ch-mail { background: linear-gradient(135deg, #f0a23b, #e0672f); }
    .body { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 0.35vh; }
    .line1 { display: flex; align-items: baseline; justify-content: space-between; gap: 2vw; }
    .name {
      font-family: 'Open Sans Semibold', 'Open Sans', sans-serif; font-weight: 600; font-size: 1.9vh;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .time { flex: 0 0 auto; font-size: 1.45vh; color: #cdd2d8; }
    .line2 { display: flex; min-width: 0; }
    .preview { font-size: 1.55vh; color: #9d9fa3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .grp { font-size: 1.5vh; color: #73abf4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* ---- Conversación ---- */
    .conv { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; }
    .conv-head {
      display: flex; align-items: center; gap: 3vw; flex: 0 0 auto;
      height: 6.4vh; padding: 0 3.4vw; background: #333a41;
      border-bottom: 0.0975274725vh solid rgba(0, 0, 0, 0.4);
    }
    .back { display: flex; align-items: center; justify-content: center; width: 6vw; height: 3vh; background: none; border: 0; cursor: pointer; flex: 0 0 auto; }
    .back-ic {
      width: 3vw; height: 2vh; background-color: #fff;
      -webkit-mask: var(--b) no-repeat center / contain; mask: var(--b) no-repeat center / contain;
      --b: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z'/></svg>");
    }
    .conv-name { flex: 1; min-width: 0; font-family: 'Open Sans Semibold', 'Open Sans', sans-serif; font-weight: 600; font-size: 1.9vh; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .conv-time { flex: 0 0 auto; font-size: 1.45vh; color: #cdd2d8; }
    .conv-actions { display: flex; gap: 1.8vw; flex: 0 0 auto; }
    /* Botones de la cabecera: cuadrado de color + glifo enmascarado en ::before.
       Transferir = blanco con glifo oscuro (azul al hover); Cerrar = rojo con aspa blanca. */
    .act {
      position: relative; overflow: hidden;
      width: 4vh; height: 4vh; border: 0; border-radius: 1.2vw; cursor: pointer;
    }
    .act::before {
      content: ''; position: absolute; inset: 0;
      -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: 44%;
      mask-repeat: no-repeat; mask-position: center; mask-size: 44%;
    }
    .act.transfer { background: #ffffff; }
    .act.transfer::before {
      background-color: #262c32;
      -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M14 4l6 6-6 6v-4H4V8h10V4z'/></svg>");
      mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M14 4l6 6-6 6v-4H4V8h10V4z'/></svg>");
    }
    .act.transfer:hover { background: #0056fe; }
    .act.transfer:hover::before { background-color: #ffffff; }
    .act.closeconv { background: #f75454; }
    .act.closeconv::before {
      background-color: #ffffff;
      -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.3-6.3z'/></svg>");
      mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.3-6.3z'/></svg>");
    }

    .conv-body { flex: 1; min-height: 0; overflow-y: auto; background: #2d333a; padding: 2vh 3.4vw; display: flex; flex-direction: column; gap: 1.2vh; }
    .bubble-row { display: flex; }
    .bubble-row.me { justify-content: flex-end; }
    .bubble-row.them { justify-content: flex-start; }
    .bubble-row.sys { justify-content: center; }
    .bubble {
      display: inline-flex; flex-direction: column; align-items: flex-end;
      max-width: 74%; padding: 1vh 3vw 2vh; border-radius: 1.7vw; position: relative;
    }
    .bubble-text { align-self: stretch; font-size: 1.7vh; line-height: 1.35; word-break: break-word; }
    .bubble-time { font-size: 1.15vh; opacity: 0.7; margin-top: 0.3vh; }
    .me .bubble { background: #2179ed; color: #fff; border-bottom-right-radius: 0; }
    .them .bubble { background: #1c1c1c; color: #fff; border-bottom-left-radius: 0; align-items: flex-end; }
    .them .bubble .bubble-text { align-self: flex-start; }
    .sys-text { font-size: 1.35vh; color: #aaaaaa; text-align: center; padding: 0.4vh 0; }

    .conv-foot { flex: 0 0 auto; display: flex; align-items: flex-end; gap: 2.4vw; padding: 1.6vh 3.4vw; background: #333a41; }
    .composer {
      flex: 1; min-height: 4.4vh; max-height: 12vh; resize: none;
      padding: 1.1vh 3vw; background: #1f2429; border: 0; border-radius: 2.4vw;
      color: #fff; font-family: 'Open Sans', sans-serif; font-size: 1.7vh; line-height: 1.3; outline: none;
    }
    .send {
      display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
      width: 4.4vh; height: 4.4vh; border: 0; border-radius: 2.4vw; background: #2179ed; cursor: pointer;
    }
    .send:disabled { background: #3a4553; cursor: default; }
    .send-ic {
      width: 2.2vh; height: 2.2vh; background-color: #fff;
      -webkit-mask: var(--s) no-repeat center / contain; mask: var(--s) no-repeat center / contain;
      --s: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M2.01 21 23 12 2.01 3 2 10l15 2-15 2z'/></svg>");
    }
    .send:disabled .send-ic { opacity: 0.5; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesComponent {
  protected readonly messages: readonly MessageRow[] = MESSAGES;

  protected readonly openId = signal<number | null>(null);
  protected readonly draft = signal('');
  /** Burbujas enviadas en vivo desde el redactor, por conversación. */
  private readonly sent = signal<Record<number, Bubble[]>>({});

  protected readonly current = computed<MessageRow | null>(() => {
    const id = this.openId();
    return id == null ? null : (this.messages.find((m) => m.id === id) ?? null);
  });

  /** Burbujas de la conversación abierta: las del seed más las enviadas en vivo. */
  protected readonly thread = computed<readonly Bubble[]>(() => {
    const c = this.current();
    if (!c) return [];
    return [...c.bubbles, ...(this.sent()[c.id] ?? [])];
  });

  protected open(id: number): void {
    this.openId.set(id);
    this.draft.set('');
  }
  protected close(): void {
    this.openId.set(null);
  }

  protected onEnter(ev: Event): void {
    ev.preventDefault();
    this.send();
  }

  protected send(): void {
    const id = this.openId();
    const text = this.draft().trim();
    if (id == null || !text) return;
    const hh = new Date().getHours().toString().padStart(2, '0');
    const mm = new Date().getMinutes().toString().padStart(2, '0');
    const bubble: Bubble = { from: 'me', text, time: `${hh}:${mm}` };
    this.sent.update((cur) => ({ ...cur, [id]: [...(cur[id] ?? []), bubble] }));
    this.draft.set('');
  }

  protected initials(m: MessageRow): string {
    const letters = m.name
      .split(/\s+/)
      .map((w) => w[0])
      .filter((ch) => ch && /[a-zA-ZÀ-ÿ]/.test(ch));
    if (letters.length) return letters.slice(0, 2).join('').toUpperCase();
    return m.channel === 'mail' ? '@' : '#';
  }
}
