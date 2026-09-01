import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MiniStateService } from './mini-state.service';

type Tab = 'call' | 'chat' | 'agents' | 'contacts' | 'history';

interface NavAction {
  readonly tab: Tab;
  readonly label: string;
  /** Base del nombre en 'public/icons/comunicator/' (se reusan los de 'agent'). */
  readonly icon: string;
  readonly wide?: boolean;
}

/**
 * Agent Mini — el Comunicador de SmartContact como producto STANDALONE a pantalla
 * completa (no el widget acoplado del dashboard de 'agent'). Medidas en 'vw'/'vh'
 * TAL CUAL la extensión real (relativas a la ventana, que aquí es el viewport).
 *
 * v1: el dialpad en reposo + la navbar + la barra de estado inferior. Las otras
 * pestañas (chat/agentes/agenda/historial) salen vacías, como en el entorno real.
 * La navbar se tiñe de rojo ('#762727') cuando el estado no permite llamar.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="app" [class.cant-call]="!state.canCall()">
      <!-- Cuerpo: la sección activa -->
      <div class="body">
        @if (tab() === 'call') {
        <div class="dialpad">
          <div class="keypad">
            <div class="display">
              <span class="flags"></span>
              <span class="num">{{ state.phoneNumber() }}</span>
              <button class="del" type="button" aria-label="Borrar" (click)="state.del()">
                <img src="icons/dialpad/borrar.svg" alt="" />
              </button>
            </div>
            <div class="keys">
              @for (k of KEYS; track k) {
              <button class="key" type="button" (click)="state.press(k)">
                <span class="n">{{ k }}</span>
              </button>
              }
            </div>
          </div>

          <div class="spacer"></div>

          <!-- Selector de servicio (dropup del real; nombre cortado a 12) -->
          <div class="service">
            <button class="svc" type="button" disabled>
              <span class="svc-name">Soporte Tal</span>
              <img class="svc-arrow" src="icons/comunicator/flecha_1.svg" alt="" />
            </button>
          </div>

          <!-- Botón llamar: verde solo si el estado permite y hay número -->
          <div class="call">
            <button
              class="btn-call"
              type="button"
              [class.makecall]="canMakeCall()"
              [disabled]="!canMakeCall()"
              aria-label="Llamar"
            >
              <img src="icons/dialpad/telefono_pequeno_blanco.svg" alt="" />
            </button>
          </div>
        </div>
        } @else {
        <p class="empty">Sin contenido</p>
        }
      </div>

      <!-- Navbar del Comunicador -->
      <nav class="nav" aria-label="Comunicador">
        @for (a of actions; track a.tab) {
        <button
          type="button"
          class="tab"
          [class.actived]="tab() === a.tab"
          [class.wide]="a.wide"
          [style.--i]="'url(icons/comunicator/' + a.icon + '.svg)'"
          [style.--ih]="'url(icons/comunicator/' + a.icon + '-hover.svg)'"
          [style.--ia]="'url(icons/comunicator/' + a.icon + '-actived.svg)'"
          [attr.aria-label]="a.label"
          [attr.aria-pressed]="tab() === a.tab"
          (click)="tab.set(a.tab)"
        ></button>
        }
      </nav>

      <!-- Barra de estado (shortcut-bar): estado + avatar -->
      <div class="bar">
        <div class="queue"></div>
        <button
          type="button"
          [class]="'status ' + state.status().cls"
          [attr.aria-label]="'Estado: ' + state.status().label + ' (clic para cambiar)'"
          (click)="state.cycleStatus()"
        >
          <span class="label">{{ state.status().label }}</span>
        </button>
        <div class="agent-info" title="Ajustes"><span class="avatar">SC</span></div>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }

    .app {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #333a41;
      color: #fff;
      overflow: hidden;
      user-select: none;
    }

    /* Cuerpo — ocupa lo que queda entre navbar y barra de estado. */
    .body { position: relative; flex: 1; min-height: 0; display: flex; }
    .empty { margin: auto; color: #9d9fa3; font-size: 2vh; }

    .dialpad { display: flex; flex-direction: column; width: 100%; }

    .keypad {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 7.70467vh;
    }

    /* Display: [flags 20%] [número 60%] [borrar 20%], con línea inferior. */
    .display {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      width: 76.396vw;
      height: 5.364vh;
      border-bottom: 0.0975274725vh solid rgba(255, 255, 255, 0.5);
    }
    .flags { width: 20%; }
    .num {
      width: 60%;
      text-align: center;
      font-family: 'Roboto', sans-serif;
      font-size: 2.6332417582vh;
      color: #fff;
      overflow: hidden;
      white-space: nowrap;
    }
    .del {
      width: 20%;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      background: none;
      border: 0;
      cursor: pointer;
    }
    .del img { width: 6.248vw; height: 1.3653846154vh; object-fit: contain; }

    /* Teclas 3x4. */
    .keys {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      width: 76.396vw;
      height: 30.2335vh;
      margin-top: 9.9478vh;
    }
    .key {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 15.336vw;
      height: 5.26648vh;
      border-radius: 6.532vw;
      margin: 0.33647vh 2.556vw;
      background: none;
      border: 0;
      cursor: pointer;
      transition: background-color 0.1s ease;
    }
    .key:hover { background-color: #1f2429; }
    .key:active { background-color: #fff; }
    .key:active .n { color: #000; }
    .n { font-size: 2.34066vh; color: #fff; line-height: 1; }

    .spacer { flex: 1; }

    /* Pastilla de servicio. */
    .service { display: flex; justify-content: center; }
    .svc {
      display: inline-flex;
      align-items: center;
      gap: 1.4vw;
      border: 1px solid #fff;
      border-radius: 29px;
      padding: 0.9vh 2vw 0.9vh 3.4vw;
      background: transparent;
      color: #fff;
      font-family: 'Roboto', sans-serif;
      font-size: 2.1vh;
      white-space: nowrap;
    }
    .svc-name { overflow: hidden; text-overflow: ellipsis; max-width: 40vw; }
    .svc-arrow { width: 3.4vw; height: 1.6vh; object-fit: contain; filter: invert(1); }

    /* Botón llamar. */
    .call { display: flex; justify-content: center; margin: 2vh 0 2.4vh; }
    .btn-call {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60.776vw;
      height: 5.16896vh;
      border-radius: 4.544vw;
      background: transparent;
      border: 1px solid #85898d;
      cursor: default;
      transition: background-color 0.12s ease, border-color 0.12s ease;
    }
    .btn-call img { width: 6.816vw; height: 2.34066vh; object-fit: contain; opacity: 0.4; }
    .btn-call.makecall { background: #69c663; border-color: transparent; cursor: pointer; }
    .btn-call.makecall img { opacity: 1; }
    .btn-call.makecall:hover { background: #2bae22; }

    /* Navbar (footer-comunicator). */
    .nav {
      height: 8.005vh;
      background: #1f2429;
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
      align-items: center;
    }
    .cant-call .nav { background: #762727; }
    .tab {
      width: 6.816vw;
      height: 2.3406593407vh;
      padding: 0;
      border: 0;
      cursor: pointer;
      background: var(--i) no-repeat center / 100% 100%;
    }
    .tab.wide { width: 8.08vw; }
    .tab:hover:not(.actived) { background-image: var(--ih); }
    .tab.actived { background-image: var(--ia); }
    .cant-call .tab:hover:not(.actived) { background-image: var(--i); }

    /* Barra de estado (shortcut-bar). */
    .bar {
      height: 5.34vh;
      background: #11131a;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 0 4.26vw;
      gap: 1.4vw;
    }
    .queue { min-width: 6vw; }
    .status {
      flex: 1;
      max-width: 76.68vw;
      height: 3.510989011vh;
      border: 0;
      border-radius: 3.408vw;
      color: #11131a;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .status .label {
      font-family: 'Open Sans', sans-serif;
      font-weight: 600;
      font-size: 1.4629120879vh;
      letter-spacing: 0.4px;
      white-space: nowrap;
    }
    .status.available { background: #2bae22; }
    .status.available:hover { background: #69c663; }
    .status.no-available { background: #f75454; }
    .status.no-available:hover { background: #f98686; }
    .status.administrative { background: #930f0f; color: #fff; }
    .agent-info { display: flex; align-items: center; cursor: pointer; }
    .avatar {
      width: 3.9vh;
      height: 3.9vh;
      border-radius: 50%;
      background: linear-gradient(135deg, #2b6cff, #00c2d1);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Open Sans', sans-serif;
      font-weight: 700;
      font-size: 1.5vh;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly state = inject(MiniStateService);

  protected readonly KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  protected readonly tab = signal<Tab>('call');

  protected readonly actions: readonly NavAction[] = [
    { tab: 'call', label: 'Teléfono', icon: 'telefono' },
    { tab: 'chat', label: 'Mensajes', icon: 'chat' },
    { tab: 'agents', label: 'Agentes', icon: 'agentes' },
    { tab: 'contacts', label: 'Agenda', icon: 'agenda' },
    { tab: 'history', label: 'Historial', icon: 'historial', wide: true },
  ];

  /** Verde solo si el estado permite llamar Y hay número marcado. */
  protected readonly canMakeCall = computed(
    () => this.state.canCall() && this.state.phoneNumber().length > 0
  );
}
