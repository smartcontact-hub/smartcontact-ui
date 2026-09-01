import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { CONTACTS, type ContactRow } from './mini-seed';

/**
 * Agenda del Comunicador (mini). Lista de contactos con avatar de iniciales; al pulsar
 * marca el numero en el dialpad. Datos FALSOS (mini-seed): el repo es publico.
 */
@Component({
  selector: 'mini-agenda',
  standalone: true,
  template: `
    <div class="list">
      @for (c of contacts; track c.id) {
      <button class="contact" type="button" (click)="dial.emit(c.phone)">
        <span class="avatar">{{ initials(c) }}</span>
        <span class="info">
          <span class="name">{{ c.name }}</span>
          <span class="sub">{{ c.company || c.phone }}</span>
        </span>
        <span class="dial-ic"><img src="icons/dialpad/telefono_pequeno_blanco.svg" alt="Llamar" /></span>
      </button>
      }
    </div>
  `,
  styles: `
    :host { display: block; height: 100%; }
    .list { height: 100%; overflow-y: auto; }
    .contact {
      display: flex;
      align-items: center;
      gap: 3vw;
      width: 100%;
      height: 8.6vh;
      padding: 0 4vw;
      background: #2d333a;
      border: 0;
      border-bottom: 1px solid #000;
      color: #fff;
      cursor: pointer;
      text-align: left;
    }
    .contact:hover { background: #1f2429; }
    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 4.4vh;
      height: 4.4vh;
      flex: 0 0 auto;
      border-radius: 50%;
      background: linear-gradient(135deg, #2b6cff, #00c2d1);
      color: #fff;
      font-family: 'Open Sans Semibold', sans-serif;
      font-weight: 600;
      font-size: 1.6vh;
    }
    .info { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 0.4vh; }
    .name {
      font-family: 'Open Sans Semibold', 'Open Sans', sans-serif;
      font-weight: 600;
      font-size: 1.9vh;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sub {
      font-size: 1.5vh;
      color: #9d9fa3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dial-ic {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 7vw;
      height: 3.2vh;
      flex: 0 0 auto;
      border-radius: 4vw;
      background: #69c663;
    }
    .dial-ic img { width: 4vw; height: 1.8vh; object-fit: contain; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaComponent {
  readonly dial = output<string>();

  protected readonly contacts: readonly ContactRow[] = CONTACTS;

  protected initials(c: ContactRow): string {
    return c.name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase();
  }
}
