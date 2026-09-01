import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AGENTS, GROUPS, type AgentRow, type GroupRow } from './mini-seed';

/**
 * Agentes del Comunicador (mini). Cabecera (título + buscador + toggle Agentes/Grupos)
 * y el listado, tal como sale POBLADO en la extracción del mini (a diferencia del entorno
 * de `agent`): cada fila es punto de presencia + nombre + caja de canales (teléfono/chat/
 * correo), y el canal no atendido baja a opacity 0.3 sin cambiar de color (comunicador.md).
 *
 * ⚠️ El texto del toggle NO va centrado: la 1.ª mitad alinea a la izquierda y la 2.ª a la
 * derecha, y la píldora se pega al extremo que le toca (comunicador.md). Datos FALSOS.
 */
@Component({
  selector: 'app-agents',
  standalone: true,
  template: `
    <div class="head">
      <div class="title-row">
        <button class="hbtn refresh" type="button" aria-label="Actualizar"></button>
        <span class="title">Agentes</span>
        <button class="hbtn filter" type="button" aria-label="Filtrar por estado"></button>
      </div>
      <label class="search"
        ><span class="lupa"></span
        ><input type="search" placeholder="Buscar..." aria-label="Buscar"
      /></label>
      <div class="toggle" [class.on-groups]="view() === 'groups'">
        <button class="tg tg-a" type="button" [class.on]="view() === 'agents'" (click)="view.set('agents')">Agentes</button>
        <button class="tg tg-g" type="button" [class.on]="view() === 'groups'" (click)="view.set('groups')">Grupos</button>
        <span class="pill"></span>
      </div>
    </div>

    <div class="list">
      @if (view() === 'agents') { @for (a of agents; track a.id) {
      <div class="agent">
        <span class="dot" [class]="a.presence"></span>
        <span class="name">{{ a.name }}</span>
        <span class="channels">
          <span class="ch phone" [class.off]="!a.phone"></span>
          <span class="ch chat" [class.off]="!a.chat"></span>
          <span class="ch mail" [class.off]="!a.mail"></span>
        </span>
      </div>
      } } @else { @for (g of groups; track g.id) {
      <div class="group">
        <span class="gname">{{ g.name }}</span>
        <span class="count"><span class="on">{{ g.online }}</span>/{{ g.total }}</span>
      </div>
      } }
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; }

    .head {
      display: flex; flex-direction: column; align-items: center; gap: 1.6vh;
      padding: 2.2vh 3.4vw 1.4vh;
      border-bottom: 0.0975274725vh solid rgba(0, 0, 0, 0.4);
      flex: 0 0 auto;
    }
    .title-row { display: flex; align-items: center; justify-content: center; width: 100%; position: relative; }
    .title { font-family: 'Open Sans Semibold', 'Open Sans', sans-serif; font-weight: 600; font-size: 2.05vh; }
    .hbtn {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 3.6vw; height: 1.8vh; border: 0; background: none; cursor: pointer;
    }
    .hbtn::before {
      content: ''; position: absolute; inset: 0; background-color: #9d9fa3;
      -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: contain;
      mask-repeat: no-repeat; mask-position: center; mask-size: contain;
    }
    .hbtn:hover::before { background-color: #fff; }
    .refresh { left: 0; }
    .refresh::before {
      -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6a5.9 5.9 0 0 1 4.2 1.8L13 11h7V4z'/></svg>");
      mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6a5.9 5.9 0 0 1 4.2 1.8L13 11h7V4z'/></svg>");
    }
    .filter { right: 0; }
    .filter::before {
      -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z'/></svg>");
      mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z'/></svg>");
    }

    .search { display: flex; align-items: center; width: 100%; height: 3.6vh; padding: 0 3vw; gap: 2vw; background: #1f2429; border-radius: 2.4vw; }
    .lupa {
      width: 3.4vw; height: 1.7vh; flex: 0 0 auto; background-color: #9d9fa3;
      -webkit-mask: var(--lupa) no-repeat center / contain; mask: var(--lupa) no-repeat center / contain;
      --lupa: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z'/></svg>");
    }
    .search input { flex: 1; height: 100%; border: 0; outline: none; background: none; color: #fff; font-family: inherit; font-size: 1.8vh; }

    /* Toggle Agentes/Grupos: texto NO centrado (izq/der), píldora al extremo activo. */
    .toggle { position: relative; display: flex; width: 100%; padding-bottom: 1vh; }
    .tg {
      flex: 1; background: none; border: 0; cursor: pointer; padding: 0 1vw 1vh;
      color: #5f6776; font-family: 'Open Sans Semibold', 'Open Sans', sans-serif; font-weight: 600; font-size: 1.7vh;
    }
    .tg-a { text-align: left; }
    .tg-g { text-align: right; }
    .tg.on { color: #fff; }
    /* Línea base al 25% + píldora blanca que salta de extremo. */
    .toggle::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0.4vh; height: 1px; background: rgba(95, 103, 118, 0.25); }
    .pill { position: absolute; bottom: 0.2vh; height: 0.5vh; width: 24vw; border-radius: 1vw; background: #fff; transition: left 0.18s ease; left: 0; }
    .toggle.on-groups .pill { left: calc(100% - 24vw); }

    .list { flex: 1; min-height: 0; overflow-y: auto; }
    .agent, .group {
      display: flex; align-items: center; gap: 3vw;
      width: 100%; height: 7.4vh; padding: 0 4vw;
      background: #2d333a; border-bottom: 1px solid #000; color: #fff;
    }
    .agent:hover, .group:hover { background: #1f2429; }
    .dot { width: 1.5vh; height: 1.5vh; flex: 0 0 auto; border-radius: 50%; background: #5f6776; }
    .dot.connected { background: #69c663; }
    .dot.paused { background: #e0a53b; }
    .dot.disconnected { background: #5f6776; }
    .name { flex: 1; min-width: 0; font-family: 'Roboto', sans-serif; font-size: 1.85vh; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Caja de canales: #1f2429, tres glifos; el no atendido a opacity 0.3. */
    .channels { display: flex; align-items: center; gap: 2.4vw; flex: 0 0 auto; padding: 0.6vh 2.4vw; background: #1f2429; border-radius: 1.6vw; }
    .ch { width: 2vh; height: 2vh; background-color: #cdd2d8; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: contain; mask-repeat: no-repeat; mask-position: center; mask-size: contain; }
    .ch.off { opacity: 0.3; }
    .ch.phone { -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.25 1.02l-2.2 2.2z'/></svg>"); mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.25 1.02l-2.2 2.2z'/></svg>"); }
    .ch.chat { -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z'/></svg>"); mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z'/></svg>"); }
    .ch.mail { -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z'/></svg>"); mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z'/></svg>"); }

    .gname { flex: 1; min-width: 0; font-family: 'Open Sans', sans-serif; font-size: 1.85vh; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .count { flex: 0 0 auto; font-family: 'Roboto', sans-serif; font-size: 1.7vh; color: #9d9fa3; }
    .count .on { color: #69c663; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsComponent {
  protected readonly agents: readonly AgentRow[] = AGENTS;
  protected readonly groups: readonly GroupRow[] = GROUPS;
  protected readonly view = signal<'agents' | 'groups'>('agents');
}
