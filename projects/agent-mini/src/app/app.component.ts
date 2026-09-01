import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MiniStateService, type StatusOpt } from './mini-state.service';
import { HistoryComponent } from './history.component';
import { AgendaComponent } from './agenda.component';
import { MessagesComponent } from './messages.component';
import { AgentsComponent } from './agents.component';
import { SERVICES, type ServiceGroup } from './mini-seed';

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
  imports: [HistoryComponent, AgendaComponent, MessagesComponent, AgentsComponent],
  template: `
    <div class="app" [class.cant-call]="!state.canCall()">
      <!-- Cuerpo: la sección activa -->
      <div class="body">
        @if (tab() === 'call') { @if (inCall()) {
        <div class="incall">
          <div class="ic-info">
            <span class="ic-num">{{ state.phoneNumber() }}</span>
            <span class="ic-timer">{{ timerText() }}</span>
            <span class="ic-grp">{{ held() ? 'En espera' : selectedService().name }}</span>
          </div>
          <div class="ic-actions">
            <button class="ic-ctl" type="button" [class.on]="muted()" (click)="muted.set(!muted())">
              <span class="ic-ic mute"></span><span class="ic-lbl">Silencio</span>
            </button>
            <button class="ic-ctl" type="button" [class.on]="held()" (click)="held.set(!held())">
              <span class="ic-ic hold"></span><span class="ic-lbl">Espera</span>
            </button>
            <button class="ic-ctl" type="button">
              <span class="ic-ic keypad"></span><span class="ic-lbl">Teclado</span>
            </button>
            <button class="ic-ctl" type="button">
              <span class="ic-ic transfer"></span><span class="ic-lbl">Transferir</span>
            </button>
            <button class="ic-ctl" type="button">
              <span class="ic-ic typify"></span><span class="ic-lbl">Tipificar</span>
            </button>
          </div>
          <div class="call">
            <button class="btn-call hangup" type="button" (click)="hangup()" aria-label="Colgar">
              <img src="icons/dialpad/colgar-grande-blanco.svg" alt="" width="24" height="9" />
            </button>
          </div>
        </div>
        } @else {
        <div class="dialpad">
          <div class="keypad">
            <div class="display">
              <span class="flags"></span>
              <span class="num">{{ state.phoneNumber() }}</span>
              <button class="del" type="button" aria-label="Borrar" (click)="state.del()">
                <img src="icons/dialpad/borrar.svg" alt="" width="24" height="17" />
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

          <!-- Selector de servicio (dropup del real; nombre cortado a 12) -->
          <div class="service">
            @if (svcOpen()) {
            <div class="svc-menu">
              @for (s of services; track s.number) {
              <button
                class="svc-item"
                type="button"
                [class.on]="s.number === selectedService().number"
                (click)="selectService(s)"
              >
                <span class="svc-item-name">{{ s.name }}</span>
                <span class="svc-item-num">{{ s.number }}</span>
              </button>
              }
            </div>
            }
            <button class="svc" [class.open]="svcOpen()" type="button" (click)="toggleSvc()">
              <span class="svc-name">{{ svcSlice(selectedService().name) }}</span>
              <img
                class="svc-arrow"
                src="icons/comunicator/flecha_1.svg"
                alt=""
                width="14"
                height="8"
              />
            </button>
          </div>

          <!-- Botón llamar: verde solo si el estado permite y hay número -->
          <div class="call">
            <button
              class="btn-call"
              type="button"
              [class.makecall]="canMakeCall()"
              [disabled]="!canMakeCall()"
              (click)="startCall()"
              aria-label="Llamar"
            >
              <img src="icons/dialpad/telefono_pequeno_blanco.svg" alt="" width="15" height="15" />
            </button>
          </div>
        </div>
        }
        } @else if (tab() === 'history') {
        <div class="section">
          <div class="sec-head"><div class="sec-title">Historial</div></div>
          <app-history class="fill" (dial)="onDial($event)" />
        </div>
        } @else if (tab() === 'contacts') {
        <div class="section">
          <div class="sec-head">
            <div class="sec-title">Agenda</div>
            <label class="search"
              ><input type="search" placeholder="Buscar..." aria-label="Buscar"
            /></label>
          </div>
          <app-agenda class="fill" (dial)="onDial($event)" />
        </div>
        } @else if (tab() === 'chat') {
        <app-messages class="panel" />
        } @else {
        <app-agents class="panel" />
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
          [attr.aria-label]="'Estado: ' + state.status().label + ' (clic para elegir estado)'"
          aria-haspopup="true"
          [attr.aria-expanded]="statusOpen()"
          (click)="openStatus()"
        >
          <span class="label">{{ state.status().label }}</span>
        </button>
        <div class="agent-info" title="Ajustes"><span class="avatar">SC</span></div>
      </div>

      <!-- Panel de Estados (el desplegable de la barra inferior). Sube como hoja desde
           abajo; el original lo ancla a la izquierda del widget, aquí a pantalla completa. -->
      @if (statusOpen()) {
      <div class="states-scrim" (click)="closeStatus()"></div>
      <div class="states" role="dialog" aria-label="Estados">
        <div class="states-head">Estados</div>
        <div class="states-list">
          @for (o of state.options; track o.label) { @if (o.expandable) {
          <button
            type="button"
            class="state expandable"
            [class.current]="o === state.status()"
            [class.open]="admExpanded()"
            (click)="toggleAdm()"
          >
            <span class="st-dot" [class.green]="o.cls === 'available'"></span>
            <span class="st-label">{{ o.label }}</span>
            <span class="st-caret"></span>
          </button>
          @if (admExpanded()) {
          <div class="adm">
            <label class="adm-search"
              ><span class="lupa"></span
              ><input type="search" placeholder="Buscar..." aria-label="Buscar grupo"
            /></label>
            <div class="adm-hint">Seleccione grupo</div>
            @for (g of services; track g.number) {
            <button type="button" class="adm-item" (click)="pickStatus(o)">
              <span class="adm-name">{{ g.name }}</span>
              <span class="adm-num">{{ g.number }}</span>
            </button>
            }
          </div>
          } } @else {
          <button
            type="button"
            class="state"
            [class.current]="o === state.status()"
            (click)="pickStatus(o)"
          >
            <span class="st-dot" [class.green]="o.cls === 'available'"></span>
            <span class="st-label">{{ o.label }}</span>
          </button>
          } }
        </div>
      </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; }

    .app {
      position: relative;
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
    .panel { flex: 1; min-width: 0; min-height: 0; }

    /* Secciones no-call: cabecera + estado vacío (chat/agentes/agenda/historial). */
    .section { display: flex; flex-direction: column; width: 100%; height: 100%; }
    .fill { flex: 1; min-height: 0; }
    .sec-head {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2.2vh 3.4vw 0;
      border-bottom: 0.0975274725vh solid rgba(0, 0, 0, 0.4);
      gap: 1.6vh;
    }
    .sec-title {
      font-family: 'Open Sans Semibold', 'Open Sans', sans-serif;
      font-weight: 600;
      font-size: 2.05vh;
    }
    .search {
      display: flex;
      align-items: center;
      width: 100%;
      height: 3.6vh;
      background: #1f2429;
      border-radius: 1.8vw;
    }
    .search input {
      width: 100%;
      height: 100%;
      padding: 0 3vw;
      border: 0;
      outline: none;
      background: none;
      color: #fff;
      font-family: inherit;
      font-size: 1.8vh;
    }
    .dialpad { position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; }

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
    .n { font-family: 'Roboto', sans-serif; font-size: 2.34066vh; color: #fff; line-height: 1; }

    /* Pastilla de servicio + dropup. Posicion real: top 58.698vh (medido en el censo). */
    .service {
      position: absolute;
      left: 0;
      right: 0;
      top: 58.698vh;
      display: flex;
      justify-content: center;
    }
    .svc {
      display: inline-flex;
      align-items: center;
      gap: 1.4vw;
      border: 1px solid #fff;
      border-radius: 29px;
      padding: 0.9vh 2vw 0.9vh 3.4vw;
      background: transparent;
      color: #fff;
      cursor: pointer;
      font-family: 'Roboto', sans-serif;
      font-size: 2.1vh;
      white-space: nowrap;
    }
    /* Al abrir se invierte: fondo blanco, texto oscuro, flecha negra (como el real). */
    .svc.open { background: #fff; color: #333a41; }
    .svc-name { overflow: hidden; text-overflow: ellipsis; max-width: 40vw; }
    .svc-arrow {
      width: 3.4vw;
      height: 1.6vh;
      object-fit: contain;
      filter: invert(1);
      transition: transform 0.15s ease;
    }
    .svc.open .svc-arrow { filter: none; transform: rotate(180deg); }
    /* Desplegable que SUBE desde la pastilla: fondo #1f2429, filas nombre + numero. */
    .svc-menu {
      position: absolute;
      left: 50%;
      bottom: calc(100% + 1vh);
      transform: translateX(-50%);
      width: 62vw;
      max-height: 26vh;
      overflow-y: auto;
      background: #1f2429;
      border-radius: 2.4vw;
      box-shadow: 0 0.6vh 2vh rgba(0, 0, 0, 0.4);
    }
    .svc-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 1.4vh 3.4vw;
      background: none;
      border: 0;
      border-bottom: 1px solid #000;
      color: #fff;
      cursor: pointer;
      opacity: 0.75;
      font-family: 'Roboto', sans-serif;
      font-size: 1.9vh;
      text-align: left;
    }
    .svc-item:last-child { border-bottom: 0; }
    .svc-item.on,
    .svc-item:hover { opacity: 1; }
    .svc-item-num { color: #9d9fa3; font-size: 1.6vh; }

    /* Botón llamar. En el dialpad va absoluto (top 64vh, como el real); en la vista
       en llamada va en flujo al fondo de la columna. */
    .call { display: flex; justify-content: center; margin: 0 0 2.4vh; }
    .dialpad .call { position: absolute; left: 0; right: 0; top: 64vh; margin: 0; }
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
    /* Boton colgar (rojo). */
    .btn-call.hangup { background: #f75454; border-color: transparent; cursor: pointer; }
    .btn-call.hangup img { opacity: 1; width: 9.656vw; height: 3.31593vh; }
    .btn-call.hangup:hover { background: #f43434; }

    /* Vista en llamada. */
    .incall { display: flex; flex-direction: column; width: 100%; height: 100%; align-items: center; }
    .ic-info { display: flex; flex-direction: column; align-items: center; gap: 1vh; margin-top: 10vh; }
    .ic-num { font-family: 'Roboto', sans-serif; font-size: 3.2vh; color: #fff; }
    .ic-timer { font-family: 'Roboto', sans-serif; font-size: 2.2vh; color: #cdd2d8; }
    .ic-grp { font-size: 1.7vh; color: #9d9fa3; }
    .ic-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      justify-items: center;
      gap: 3.2vh 2vw;
      margin-top: auto;
      margin-bottom: 3.5vh;
      width: 74vw;
    }
    .ic-ctl {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.8vh;
      width: 16vw;
      background: none;
      border: 0;
      color: #cdd2d8;
      cursor: pointer;
      font-family: 'Open Sans', sans-serif;
      font-size: 1.4vh;
    }
    .ic-ic {
      width: 6vw;
      height: 6vw;
      background-color: #cdd2d8;
      -webkit-mask: var(--m) no-repeat center / contain;
      mask: var(--m) no-repeat center / contain;
    }
    .ic-ctl.on { color: #69c663; }
    .ic-ctl.on .ic-ic { background-color: #69c663; }
    .ic-ic.mute { --m: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z'/></svg>"); }
    .ic-ic.hold { --m: url('/icons/dialpad/pausa.svg'); }
    .ic-ic.keypad { --m: url('/icons/dialpad/keypad.svg'); }
    .ic-ic.transfer { --m: url('/icons/dialpad/transferencia.svg'); }
    .ic-ic.typify { --m: url('/icons/dialpad/tipificacion.svg'); }

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
      font-family: 'Open Sans Semibold', 'Open Sans', sans-serif;
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
      font-family: 'Open Sans Semibold', 'Open Sans', sans-serif;
      font-weight: 600;
      font-size: 1.5vh;
    }

    /* ---- Panel de Estados (desplegable de la barra inferior) ---- */
    .states-scrim { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 5; }
    .states {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 6;
      max-height: 82vh;
      display: flex;
      flex-direction: column;
      background: #333a41;
      border-radius: 6.6vw 6.6vw 0 0;
      box-shadow: 0 -1vh 3vh rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
    .states-head {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 5.4vh;
      font-family: 'Open Sans', sans-serif;
      font-size: 1.9vh;
      color: #fff;
      border-bottom: 0.0975274725vh solid rgba(0, 0, 0, 0.35);
    }
    .states-list { overflow-y: auto; min-height: 0; }
    .state {
      display: flex;
      align-items: center;
      width: 100%;
      height: 4.62vh;
      padding: 0 3.68vw;
      background: #2d333a;
      border: 0;
      border-bottom: 1px solid #262c32;
      color: #fff;
      cursor: pointer;
      text-align: left;
    }
    .state:hover { background: #1f2429; }
    .st-dot {
      width: 1.13vh;
      height: 1.13vh;
      flex: 0 0 auto;
      margin-right: 2.85vw;
      border-radius: 50%;
      background: transparent;
    }
    .st-dot.green { background: #69c663; }
    .st-label {
      flex: 1;
      font-family: 'Open Sans', sans-serif;
      font-size: 1.75vh;
    }
    .state.current .st-label { font-family: 'Open Sans Semibold', 'Open Sans', sans-serif; font-weight: 600; }
    .st-caret {
      width: 2.6vw;
      height: 1.4vh;
      flex: 0 0 auto;
      background-color: #9d9fa3;
      -webkit-mask: var(--c) no-repeat center / contain;
      mask: var(--c) no-repeat center / contain;
      --c: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M7 10l5 5 5-5z'/></svg>");
      transition: transform 0.15s ease;
    }
    .state.open .st-caret { transform: rotate(180deg); }

    /* Administrativo desplegado: buscador + «Seleccione grupo» + lista. */
    .adm { background: #2d333a; border-bottom: 1px solid #262c32; padding: 0 3.68vw 1.4vh; }
    .adm-search {
      display: flex;
      align-items: center;
      gap: 2vw;
      height: 3vh;
      margin: 0.6vh 0 1vh;
      padding: 0 2.6vw;
      background: #1f2429;
      border-radius: 1vw;
    }
    .adm-search .lupa {
      width: 3vw;
      height: 1.5vh;
      flex: 0 0 auto;
      background-color: #9d9fa3;
      -webkit-mask: var(--lupa) no-repeat center / contain;
      mask: var(--lupa) no-repeat center / contain;
      --lupa: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z'/></svg>");
    }
    .adm-search input { flex: 1; height: 100%; border: 0; outline: none; background: none; color: #fff; font-family: inherit; font-size: 1.5vh; }
    .adm-hint { color: #63666a; font-size: 1.45vh; margin-bottom: 0.6vh; }
    .adm-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 1vh 0;
      background: none;
      border: 0;
      border-bottom: 1px solid #262c32;
      color: #fff;
      cursor: pointer;
      opacity: 0.85;
      font-family: 'Roboto', sans-serif;
      font-size: 1.6vh;
      text-align: left;
    }
    .adm-item:last-child { border-bottom: 0; }
    .adm-item:hover { opacity: 1; }
    .adm-num { color: #9d9fa3; font-size: 1.4vh; }
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

  // Selector de servicio (dropup).
  protected readonly services = SERVICES;
  protected readonly selectedService = signal<ServiceGroup>(SERVICES[0]);
  protected readonly svcOpen = signal(false);

  protected toggleSvc(): void {
    if (this.services.length > 1) {
      this.svcOpen.update((v) => !v);
    }
  }
  protected selectService(s: ServiceGroup): void {
    this.selectedService.set(s);
    this.svcOpen.set(false);
  }
  protected svcSlice(name: string): string {
    return name.length > 12 ? name.slice(0, 12) + '…' : name;
  }

  /** Verde solo si el estado permite llamar Y hay número marcado. */
  protected readonly canMakeCall = computed(
    () => this.state.canCall() && this.state.phoneNumber().length > 0
  );

  // Panel de Estados (el desplegable de la barra de estado inferior).
  protected readonly statusOpen = signal(false);
  protected readonly admExpanded = signal(false);

  protected openStatus(): void {
    this.admExpanded.set(false);
    this.statusOpen.set(true);
  }
  protected closeStatus(): void {
    this.statusOpen.set(false);
  }
  protected toggleAdm(): void {
    this.admExpanded.update((v) => !v);
  }
  protected pickStatus(o: StatusOpt): void {
    this.state.setStatus(o);
    this.closeStatus();
  }

  /** Marca un numero desde Historial/Agenda: lo carga en el dialpad y va a Telefono. */
  protected onDial(number: string): void {
    this.state.phoneNumber.set(number.replace(/[^0-9*#+]/g, ''));
    this.tab.set('call');
  }

  // Vista EN LLAMADA (doc-based: el estado real no estaba en la extraccion).
  protected readonly inCall = signal(false);
  protected readonly muted = signal(false);
  protected readonly held = signal(false);
  private readonly seconds = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly timerText = computed(() => {
    const s = this.seconds();
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return mm + ':' + ss;
  });

  protected startCall(): void {
    if (!this.canMakeCall()) {
      return;
    }
    this.inCall.set(true);
    this.muted.set(false);
    this.held.set(false);
    this.seconds.set(0);
    this.timer = setInterval(() => this.seconds.update((s) => s + 1), 1000);
  }

  protected hangup(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.inCall.set(false);
  }
}
