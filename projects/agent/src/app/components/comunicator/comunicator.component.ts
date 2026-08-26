import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AgentStateService } from '../../agent-state.service';
import { DialpadComponent } from './dialpad.component';
import { HistoricListComponent } from './historic-list.component';
import { TypificationComponent } from './typification.component';
import { FinalizeManagementComponent } from './finalize-management.component';
import { SettingsComponent } from './settings.component';
import { ChatListComponent } from './chat-list.component';
import { ChatConversationComponent } from './chat-conversation.component';
import type { ChatRow } from '../../data/seed';

/** Pestañas del Comunicador. 'contacts' no sale con todos los permisos. */
type ComTab = 'call' | 'chat' | 'agents' | 'contacts' | 'history';

interface ComAction {
  readonly tab: ComTab;
  readonly label: string;
  /** Base del nombre de fichero en 'public/icons/comunicator/'. */
  readonly icon: string;
  /** El de historial es más ancho que el resto (1.615 x 1.24vw). */
  readonly wide?: boolean;
}

/**
 * Widget flotante del Comunicador — carcasa + navbar.
 *
 * Medidas convertidas del real a la escala de sc-agent ('px = vw x 14.56', ver
 * 'projects/agent/docs/escala.md'). Los iconos son los SVG originales, con sus tres
 * estados (normal / hover / actived), servidos como 'background-image' igual que el real.
 *
 * La navbar se tiñe de '#762727' cuando el agente no puede llamar: es la clase
 * '.makecall-allowedstatus' del original, y la dispara el selector de estado del footer.
 */
@Component({
  selector: 'app-comunicator',
  standalone: true,
  imports: [
    DialpadComponent,
    HistoricListComponent,
    TypificationComponent,
    FinalizeManagementComponent,
    SettingsComponent,
    ChatListComponent,
    ChatConversationComponent,
  ],
  template: `
    @if (state.comunicatorOpen()) {
    <div class="com" [class.cant-call]="!state.canCall()">
      <div class="com__plate">
        <button
          class="com__icon com__icon--min"
          type="button"
          aria-label="Minimizar"
          (click)="state.toggleComunicator()"
        ></button>
        <button
          class="com__icon com__icon--set"
          type="button"
          aria-label="Ajustes"
          [class.actived]="tab() === null"
          (click)="toggleSettings()"
        ></button>
      </div>

      <div class="com__body">
        <div class="com__content">
          <!--
            El flujo de gestión manda sobre la pestaña: al colgar, el Comunicador pasa a
            Tipificación y de ahí a «Finalizar gestión» (Figma 283:1707 → 283:3186).
          -->
          @if (state.step() === 'typifying') {
          <app-typification />
          } @else if (state.step() === 'finishing') {
          <app-finalize-management />
          } @else if (tab() === 'call') {
          <app-dialpad />
          } @else if (tab() === 'history') {
          <app-historic-list />
          } @else if (tab() === null) {
          <app-settings />
          } @else if (tab() === 'chat') { @if (openChat(); as c) {
          <app-chat-conversation [chat]="c" (closed)="openChat.set(null)" />
          } @else {
          <app-chat-list (opened)="openChat.set($event)" />
          } } @else {
          <!--
            La cabecera de sección es DE CADA SECCIÓN, no del widget: medido en el real,
            el dialpad arranca pegado al borde del panel y no lleva ninguna.
          -->
          <div
            class="com__head"
            [class.tall]="tab() === 'chat'"
            [class.taller]="tab() === 'agents'"
          >
            <div class="com__title">
              @if (tab() === 'agents') {
              <button
                class="com__hicon com__hicon--refresh"
                type="button"
                aria-label="Refrescar"
              ></button>
              }
              <span>{{ sectionTitle() }}</span>
              @if (tab() === 'agents') {
              <button
                class="com__hicon com__hicon--filter"
                type="button"
                aria-label="Filtrar"
              ></button>
              }
            </div>

            @if (tab() === 'chat' || tab() === 'agents') {
            <!-- .header-message-subheader-input — 26.5px de alto, a 48.6 del panel. -->
            <label class="com__search">
              <span class="com__search-ic"></span>
              <input
                type="search"
                placeholder="Buscar..."
                aria-label="Buscar conversación"
              />
            </label>
            } @if (tab() === 'agents') {
            <!--
              .internal-toggle — dos mitades de 99.54 a 9.86 sobre una linea de 1.11, con
              una pildora blanca de 37.92 x 3.78 que se desliza al cambiar de pestaña.
              OJO: el texto NO va centrado. La primera mitad alinea a la IZQUIERDA y la
              segunda a la DERECHA, y la pildora se pega al extremo que le toca; medido
              en el original (Agentes a 3.53 del borde del toggle, Grupos a 166.35).
            -->
            <div class="tabbar">
              <div class="tabbar__tabs" role="tablist">
                @for (t of agentTabs; track t) {
                <button
                  type="button"
                  role="tab"
                  [class.on]="agentTab() === t"
                  [attr.aria-selected]="agentTab() === t"
                  (click)="agentTab.set(t)"
                >
                  {{ t }}
                </button>
                }
              </div>
              <div class="tabbar__rail">
                <span
                  class="tabbar__pill"
                  [style.left.px]="agentTab() === 'Agentes' ? 0.63 : 163.45"
                ></span>
              </div>
            </div>
            }
          </div>
          <p class="com__empty">
            @if (tab() === 'chat' || tab() === 'agents') { No hay conversaciones
            } @else if (tab() === 'agents') { No hay
            {{ agentTab().toLowerCase() }} } @else { Sin contenido }
          </p>
          }
        </div>
      </div>

      <nav class="com__nav" aria-label="Comunicador">
        @for (a of actions; track a.tab) {
        <button
          type="button"
          class="com__tab"
          [class.wide]="a.wide"
          [class.actived]="tab() === a.tab"
          [style.--icon]="'url(icons/comunicator/' + a.icon + '.svg)'"
          [style.--icon-hover]="
            'url(icons/comunicator/' + a.icon + '-hover.svg)'
          "
          [style.--icon-actived]="
            'url(icons/comunicator/' + a.icon + '-actived.svg)'
          "
          [attr.aria-label]="a.label"
          [attr.aria-pressed]="tab() === a.tab"
          (click)="tab.set(a.tab)"
        >
          @if (a.tab === 'history' && lostCalls > 0) {
          <span class="com__lost">{{ lostCalls }}</span>
          } @if (a.tab === 'chat' && unread > 0) {
          <span class="com__unread">{{ unread }}</span>
          }
        </button>
        }
      </nav>
    </div>
    }
  `,
  styles: `
    /* Widget: 17.188 x 34.792vw -> 250.3 x 506.7px. Anclado abajo a la derecha. */
    .com {
      position: fixed;
      right: 16.2px;
      bottom: 45.5px;
      width: 250.3px;
      height: 506.7px;
      border-radius: 23.67px;
      box-shadow: -15.2px 12.7px 21.1px -10.1px rgba(0, 0, 0, 0.5);
      font-family: var(--ag-font);
      z-index: 40;
    }

    /* Plancha oscura del fondo: 96.25% del alto, radio ligeramente mayor. */
    .com__plate {
      position: absolute;
      inset: 0 0 auto 0;
      height: 487.7px;
      border-radius: 28.75px;
      background: #1f2429;
    }
    /*
     * Los SVG de cabecera van por MÁSCARA, no como background-image: el real los
     * repinta por CSS (el engranaje viene con fill #1f2429 y se pone blanco, o negro
     * cuando Ajustes está activo), y un background-image no se puede recolorear.
     */
    /*
     * El glifo va en un ::after enmascarado, no en el propio botón: así el fondo del
     * botón y el color del icono son independientes, que es lo que necesita el estado
     * activo de Ajustes (fondo blanco + icono negro).
     */
    .com__icon {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0;
      padding: 0;
      background: transparent;
      cursor: pointer;
    }
    .com__icon::after {
      content: '';
      width: 9.1px;
      height: 9.1px;
      background-color: #fff;
      -webkit-mask: var(--glyph) no-repeat center / contain;
      mask: var(--glyph) no-repeat center / contain;
    }
    .com__icon--min {
      top: 0;
      left: 101.1px;
      width: 48px;
      height: 19px;
      --glyph: url('/icons/comunicator/flecha_2.svg');
    }
    /*
     * Ajustes ocupa la esquina superior derecha: 62.6 de ancho por la franja de 19 que
     * asoma sobre el panel. Activo pinta el bloque de BLANCO y el icono de NEGRO.
     */
    .com__icon--set {
      top: 0;
      right: 0;
      width: 62.6px;
      height: 19px;
      border-radius: 0 27.58px 0 0;
      --glyph: url('/icons/comunicator/engranaje.svg');
    }
    .com__icon--set.actived {
      background: #fff;
    }
    .com__icon--set.actived::after {
      background-color: #000;
    }
    .com__icon:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
      border-radius: 4px;
    }

    /* Panel de la sección activa. */
    .com__body {
      position: absolute;
      inset: 19px 0 auto 0;
      height: 482.6px;
      border-radius: 28.75px;
      background: #333a41;
      color: #fff;
      overflow: hidden;
    }
    /*
     * Cabecera de sección. El real la dimensiona por sección: 93.8px en Mensajes
     * (título + buscador) y 140.2px en Agentes (título + dos pestañas). El título va
     * a 10.6px del borde del panel en las tres.
     */
    .com__head {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 33.6px;
      padding: 10.63px 22.7px 0;
      border-bottom: 0.75px solid rgba(0, 0, 0, 0.397);
      background: #333a41;
      box-sizing: border-box;
    }
    .com__head.tall {
      height: 93.8px;
      gap: 17.47px;
    }
    /* Agentes es mas alta: titulo + buscador + pestañas. */
    .com__head.taller {
      height: 140.18px;
      gap: 17.47px;
    }
    /* .buscador — 204.89 x 26.54 sobre #1f2429 con radio 7.59, no una pildora. */
    .com__search {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 26.54px;
      border-radius: 7.59px;
      background: #1f2429;
    }
    /* .icon-search — 12.12 cuadrado a 11.88 del borde. */
    .com__search-ic {
      position: absolute;
      left: 11.88px;
      width: 12.12px;
      height: 12.12px;
      background-color: var(--ag-muted);
      -webkit-mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      pointer-events: none;
    }
    .com__search input {
      width: 100%;
      height: 100%;
      padding: 0 11.88px 0 32.78px;
      border: 0;
      outline: none;
      background: none;
      color: #fff;
      font-family: inherit;
      font-size: 11.65px;
      box-sizing: border-box;
    }
    /* .internal-title — el titulo comparte fila con refrescar y filtrar. */
    .com__title {
      position: relative;
    }
    .com__hicon {
      position: absolute;
      top: 2px;
      width: 10.2px;
      height: 16px;
      padding: 0;
      border: 0;
      background-color: #fff;
      cursor: pointer;
    }
    .com__hicon--refresh {
      left: 0;
      -webkit-mask: url('/icons/dialpad/refresh.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/refresh.svg') no-repeat center / contain;
    }
    .com__hicon--filter {
      right: 0;
      -webkit-mask: url('/icons/dialpad/filter.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/filter.svg') no-repeat center / contain;
    }

    /* Barra de pestañas del original: mitades + linea + pildora deslizante. */
    .tabbar {
      width: 204.89px;
      /* El hueco buscador-pestañas es 18.2, algo mayor que el gap de la cabecera. */
      margin-top: 0.73px;
    }
    .tabbar__tabs {
      display: flex;
      height: 14.78px;
      margin: 0 2.91px;
    }
    /* Las dos mitades comparten tipografia; solo cambia el color. */
    .tabbar__tabs button {
      display: flex;
      align-items: flex-end;
      width: 99.54px;
      padding: 0;
      border: 0;
      background: none;
      color: #5f6776;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 9.86px;
      cursor: pointer;
    }
    /* La primera alinea a la izquierda; la segunda, a la derecha. */
    .tabbar__tabs button:first-child {
      justify-content: flex-start;
    }
    .tabbar__tabs button:last-child {
      justify-content: flex-end;
    }
    .tabbar__tabs button.on {
      color: #fff;
    }
    .tabbar__rail {
      position: relative;
      width: 199.07px;
      height: 24.3px;
      margin-left: 2.91px;
    }
    /* .toggleBarLine — hr de 1.11 en #5f6776 al 25%, no una linea blanca. */
    .tabbar__rail::before {
      content: '';
      position: absolute;
      top: 11.65px;
      left: 2.91px;
      width: 193.26px;
      height: 1.11px;
      background: #5f6776;
      opacity: 0.25;
    }
    /* .toggleSelected — 37.92 x 3.78, radio 3.03, montada sobre la linea. */
    .tabbar__pill {
      position: absolute;
      top: 10.83px;
      width: 37.92px;
      height: 3.78px;
      border-radius: 3.03px;
      background: #fff;
      transition: left 0.18s ease;
    }
    /* Título canónico de cabecera del Comunicador: 0.938vw Semibold. */
    .com__title {
      width: 100%;
      text-align: center;
      font-size: 13.66px;
      font-weight: 600;
    }
    /*
     * Zona útil: 430.8px medidos en el real desde el borde del panel hasta donde
     * empieza la navbar. Cada sección se organiza dentro.
     */
    .com__content {
      /* El contenido arranca 1.4px por debajo del panel, medido en el real. */
      padding-top: 1.4px;
      height: 430.8px;
      box-sizing: content-box;
    }
    /*
     * Chat y Agentes salen VACÍOS en el entorno de desarrollo real (ni conversaciones
     * ni agentes listados), así que se replica el vacío en vez de inventar contenido.
     */
    .com__empty {
      margin: 0;
      padding: 24px 22.7px;
      color: var(--ag-muted);
      font-size: 11.7px;
      text-align: center;
    }

    /* Navbar: 11.23% del alto -> 56.9px, iconos repartidos con space-evenly. */
    .com__nav {
      position: absolute;
      inset: auto 0 0 0;
      height: 56.9px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-evenly;
      border-radius: 23.67px;
      background: #1f2429;
    }
    .com__tab {
      position: relative;
      width: 18.2px;
      height: 18.2px;
      padding: 0;
      border: 0;
      cursor: pointer;
      background: var(--icon) no-repeat center / 100% 100%;
    }
    .com__tab.wide {
      width: 23.5px;
      height: 18.1px;
    }
    .com__tab:hover:not(.actived) {
      background-image: var(--icon-hover);
    }
    .com__tab.actived {
      background-image: var(--icon-actived);
    }
    .com__tab:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 3px;
    }

    /*
     * Estado del agente que NO permite llamar (INACTIVO / INACTIVE_AGENT): el real
     * tiñe la navbar y ADEMÁS anula los hover, que vuelven al icono base.
     */
    .com.cant-call .com__nav {
      background: #762727;
    }
    .com.cant-call .com__tab:hover:not(.actived) {
      background-image: var(--icon);
    }

    /* Avisos superpuestos: perdidas (rojo) y mensajes sin leer. */
    .com__lost,
    .com__unread {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 19px;
      height: 19px;
      border-radius: 50%;
      background: #f75454;
      color: #fff;
      font-size: 10px;
      font-weight: 600;
    }
    .com__lost {
      right: -10.8px;
      bottom: 5.8px;
    }
    .com__unread {
      right: -8px;
      bottom: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComunicatorComponent {
  protected readonly state = inject(AgentStateService);

  /** 'null' = pestaña Ajustes (el engranaje de la cabecera). */
  protected readonly tab = signal<ComTab | null>('call');

  /** Pestaña previa, para que el segundo clic en Ajustes devuelva donde estabas. */
  private previous: ComTab = 'call';

  /** Ajustes funciona como interruptor, igual que en el original. */
  protected toggleSettings(): void {
    if (this.tab() === null) {
      this.tab.set(this.previous);
      return;
    }
    this.previous = (this.tab() ?? 'call') as ComTab;
    this.tab.set(null);
  }

  constructor() {
    // «Gestionar» fuerza la pestaña de Teléfono; al finalizar, vuelve a Mensajes.
    effect(() => {
      const forced = this.state.forcedTab();
      if (forced) {
        this.tab.set(forced as ComTab);
        this.state.forcedTab.set(null);
      }
    });
  }

  /**
   * En el entorno de desarrollo la navbar sale con CUATRO pestañas: 'contacts' es
   * condicional según los permisos del agente, así que no está en la lista.
   */
  protected readonly actions: readonly ComAction[] = [
    { tab: 'call', label: 'Teléfono', icon: 'telefono' },
    { tab: 'chat', label: 'Mensajes', icon: 'chat' },
    { tab: 'agents', label: 'Agentes', icon: 'agentes' },
    { tab: 'history', label: 'Historial', icon: 'historial', wide: true },
  ];

  /** El real parte «Agentes» en dos pestañas internas. */
  protected readonly agentTabs = ['Agentes', 'Grupos'] as const;
  protected readonly agentTab = signal<string>('Agentes');

  /** Conversación abierta dentro de Mensajes; null = listado. */
  protected readonly openChat = signal<ChatRow | null>(null);

  protected readonly lostCalls = 0;
  protected readonly unread = 0;

  protected sectionTitle(): string {
    switch (this.tab()) {
      case 'call':
        return 'Teléfono';
      case 'chat':
        return 'Mensajes';
      case 'agents':
        return 'Agentes';
      case 'contacts':
        return 'Agenda';
      case 'history':
        return 'Historial';
      default:
        return 'Ajustes';
    }
  }
}
