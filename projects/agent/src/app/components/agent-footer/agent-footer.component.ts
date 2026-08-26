import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { AgentStateService, type StatusOpt } from '../../agent-state.service';
import { CHATS, GRUPOS, type ChatRow } from '../../data/seed';

/**
 * Footer: barra rectangular (#2d333a) con estado + avatar.
 *
 * El estado NO es local: vive en 'AgentStateService' porque el Comunicador lo lee para
 * teñir su navbar (igual que en el real). Y el avatar abre y cierra el Comunicador.
 */
@Component({
  selector: 'app-agent-footer',
  standalone: true,
  imports: [ScIconComponent],
  template: `
    <footer class="footer">
      @if (open()) {
      <div
        class="statusmenu"
        [class.aside]="state.comunicatorOpen()"
        role="menu"
      >
        <div class="statusmenu__head">
          <span class="statusmenu__title">Estados</span>
          <button
            class="statusmenu__x"
            type="button"
            (click)="open.set(false)"
            aria-label="Cerrar"
          ></button>
        </div>
        <ul class="statusmenu__list" role="list">
          @for (o of options; track o.label) { @if (o.label !==
          'Administrativo') {
          <li
            class="statusmenu__opt"
            [class.is-current]="o.label === state.status().label"
            (click)="select(o)"
          >
            <span class="dot" [class.dot--ok]="o.code === 1"></span>
            <span class="statusmenu__label">{{ o.label }}</span>
          </li>
          } @else {
          <!--
            «Administrativo» es la última y se despliega: trae buscador y una lista
            «Seleccione grupo». Es la fila que hace 127.2 de alto en el real.
          -->
          <li
            class="statusmenu__opt statusmenu__admin"
            [class.open]="adminOpen()"
          >
            <div class="admin__head">
              <span class="dot"></span>
              <span class="statusmenu__label">{{ o.label }}</span>
              <span class="admin__search">
                <span class="admin__lupa"></span>
                <input
                  type="search"
                  placeholder="Buscar..."
                  aria-label="Buscar grupo"
                />
              </span>
              <button
                class="admin__toggle"
                type="button"
                [attr.aria-expanded]="adminOpen()"
                aria-label="Desplegar grupos"
                (click)="adminOpen.update((v) => !v)"
              ></button>
            </div>
            @if (adminOpen()) {
            <span class="admin__hint">Seleccione grupo</span>
            <div class="admin__groups">
              @for (g of grupos; track g.name) {
              <button class="admin__group" type="button" (click)="select(o)">
                {{ g.name }}
              </button>
              }
            </div>
            }
          </li>
          } }
        </ul>
      </div>
      }

      <!--
        Carrusel de conversaciones EN CURSO, a la izquierda de la barra (app-shortcut-bar
        del original). Cada chip: icono de canal, nombre y hora; la hora se tine de teal
        cuando la conversacion esta en postconversando, como el .task-time-typification.
      -->
      <div class="footer__tasks">
        @for (t of tasks; track t.id) {
        <div class="task">
          <span class="task__type" [style.--g]="channelIcon(t)"></span>
          <span class="task__name">{{ t.name }}</span>
          <span
            class="task__time"
            [class.task__time--post]="t.state === 'postchat'"
            >{{ t.time }}</span
          >
        </div>
        }
      </div>

      <div class="footer__right">
        <button
          class="footer__status"
          type="button"
          [class.footer__status--busy]="!state.available()"
          (click)="open.update((v) => !v)"
        >
          {{ state.status().label }}
        </button>
        <button
          class="footer__av"
          type="button"
          [attr.aria-pressed]="state.comunicatorOpen()"
          aria-label="Abrir el Comunicador"
          (click)="state.toggleComunicator()"
        >
          R<span class="footer__badge"
            ><sc-icon name="language" [size]="9"
          /></span>
        </button>
      </div>
    </footer>
  `,
  styles: `
    /* Barra rectangular full-width con botón + avatar (como <app-shortcut-bar>). */
    .footer {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.824176vw;
      height: 2.609891vw;
      padding: 0 1.51099vw;
      background: #2d333a;
    }
    /* Carrusel de tareas: ocupa el hueco de la izquierda y empuja el estado a la derecha. */
    .footer__tasks {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 0.549451vw;
      height: 100%;
      margin-right: auto;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .footer__tasks::-webkit-scrollbar {
      display: none;
    }
    /* .task del original: 0.6vw de radio, fondo #5f6776, borde #11131a. */
    .task {
      display: flex;
      align-items: center;
      flex: none;
      height: 1.854396vw;
      border: 0.038462vw solid #11131a;
      border-radius: 0.6vw;
      background: #5f6776;
      color: #fff;
      cursor: pointer;
      white-space: nowrap;
    }
    /* .task-type: icono de canal blanco, 1.081 x 0.781, con margen lateral 0.421. */
    .task__type {
      flex: none;
      width: 1.081vw;
      height: 0.781vw;
      margin: 0 0.421vw;
      background-color: #fff;
      -webkit-mask: var(--g) no-repeat center / contain;
      mask: var(--g) no-repeat center / contain;
    }
    /* .task-description: nombre con bordes negros a los lados, tope 7.3 y elipsis. */
    .task__name {
      max-width: 7.3vw;
      padding: 0 0.26vw;
      border-left: 0.038462vw solid #000;
      border-right: 0.038462vw solid #000;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-size: 0.781vw;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* .task-time: en postconversando vira a teal #166f8d con la esquina derecha redonda. */
    .task__time {
      padding: 0 0.26vw;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-size: 0.781vw;
    }
    .task__time--post {
      background: #166f8d;
      color: #000;
      border-radius: 0 0.5vw 0.5vw 0;
    }
    .footer__right {
      display: flex;
      align-items: center;
      gap: 0.824176vw;
    }
    /* Botón de estado: 179px, verde (Available) / rojo (ocupado). */
    .footer__status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 12.293957vw;
      height: 1.854396vw;
      background: var(--ag-green);
      color: var(--ag-status-text);
      font: inherit;
      font-size: 0.803572vw;
      font-weight: 400;
      padding: 0;
      border: none;
      border-radius: 0.625vw;
      cursor: pointer;
    }
    .footer__status--busy {
      background: var(--ag-red);
      color: #fff;
    }
    .footer__av {
      position: relative;
      border: 0;
      padding: 0;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.854396vw;
      height: 1.854396vw;
      border-radius: 50%;
      font-size: 0.755495vw;
      font-weight: 700;
      color: #fff;
      background: var(--ag-red);
    }
    .footer__badge {
      position: absolute;
      right: -0.206044vw;
      bottom: -0.206044vw;
      width: 0.892858vw;
      height: 0.892858vw;
      border-radius: 50%;
      background: #2d333a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--ag-muted);
    }

    /* Panel Status (sube desde el botón) */
    /*
     * Panel de Estados — 265 x 476.1, radio 23.65, fondo #333a41 (medido en el real).
     *
     * DIVERGENCIA DELIBERADA: el original lo deja SIEMPRE en un hueco fijo a la
     * izquierda del Comunicador (right 291.1, bottom 45.5), esté el widget abierto o
     * no. Aquí solo se aparta cuando el widget está abierto —para no solaparlo— y si
     * está cerrado vuelve sobre el botón de estado, que es donde se espera encontrarlo.
     */
    .statusmenu {
      position: fixed;
      right: 1.51099vw;
      bottom: 3.125vw;
      width: 18.20055vw;
      /*
       * ALTO POR CONTENIDO, no fijo: en el original el panel mide 386.8 con
       * «Administrativo» colapsado y 476.1 desplegado, y SIEMPRE queda anclado abajo
       * a la misma altura que el Comunicador. Clavarlo deja hueco muerto al colapsar.
       */
      /*
       * Nunca mas alto que el Comunicador NI que el hueco disponible: si el contenido
       * no cabe, scrollea la lista en vez de recortarse por abajo.
       */
      max-height: min(34.800825vw, calc(100vh - 6.25vw));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #333a41;
      border-radius: 1.624314vw;
      box-shadow: 0 -0.549451vw 2.06044vw rgba(0, 0, 0, 0.4);
    }
    /* Con el Comunicador abierto se aparta a su izquierda: 291.1 medido en el real. */
    .statusmenu.aside {
      right: 19.993132vw;
    }
    /* .status-head — 45.5px de alto en el real. */
    .statusmenu__head {
      position: relative;
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 3.125vw;
    }
    .statusmenu__title {
      font-size: 0.938187vw;
      font-weight: 600;
      color: var(--ag-text);
    }
    /* .status-close — 7.6 x 17.5, a 238.5 del borde izquierdo del panel. */
    .statusmenu__x {
      position: absolute;
      top: 0.961539vw;
      right: 1.339286vw;
      width: 0.618132vw;
      height: 0.618132vw;
      background: transparent;
      border: none;
      cursor: pointer;
    }
    /* La × se dibuja: el asset del original no se sirve por URL. */
    .statusmenu__x::before,
    .statusmenu__x::after {
      content: '';
      position: absolute;
      top: 0.274726vw;
      left: 0;
      width: 0.618132vw;
      height: 0.068682vw;
      background: #fff;
    }
    .statusmenu__x::before {
      transform: rotate(45deg);
    }
    .statusmenu__x::after {
      transform: rotate(-45deg);
    }
    /* .statusList — 430.6px, esquinas inferiores redondeadas. */
    .statusmenu__list {
      flex: 1;
      min-height: 0;
      overflow: auto;
      margin: 0;
      padding: 0;
      border-radius: 0 0 1.741759vw 1.741759vw;
      list-style: none;
    }
    /* .state — 37.9 de alto, padding 0 12.98, fondo #2d333a. */
    .statusmenu__opt {
      display: flex;
      align-items: center;
      gap: 0.837913vw;
      min-height: 2.603022vw;
      padding: 0 0.891484vw;
      background: #2d333a;
      color: #fff;
      font-size: 0.800138vw;
      cursor: pointer;
    }
    .statusmenu__opt:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .statusmenu__opt.is-current .statusmenu__label {
      font-weight: 700;
    }
    /* Fila de Administrativo: se despliega y redondea las esquinas de abajo. */
    .statusmenu__admin {
      flex-direction: column;
      align-items: stretch;
      gap: 0;
      border-radius: 0 0 1.741759vw 1.741759vw;
      cursor: default;
    }
    .admin__head {
      display: flex;
      align-items: center;
      gap: 0.837913vw;
      height: 1.820055vw;
    }
    .admin__head .statusmenu__label {
      flex: none;
    }
    .admin__search {
      position: relative;
      display: flex;
      align-items: center;
      margin-left: auto;
    }
    .admin__lupa {
      position: absolute;
      left: 0.487638vw;
      width: 0.831044vw;
      height: 0.831044vw;
      background-color: #fff;
      -webkit-mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      pointer-events: none;
    }
    /* input.buscadorInterno — 91 x 18.2, #1f2429, radio 3.38. */
    .admin__search input {
      width: 6.25vw;
      height: 1.25vw;
      padding: 0.068682vw 0.289836vw 0.068682vw 1.717033vw;
      border: 0;
      border-radius: 0.232143vw;
      background: #1f2429;
      color: #fff;
      font-family: inherit;
      font-size: 0.800138vw;
      outline: none;
    }
    .admin__toggle {
      width: 0.824176vw;
      height: 0.824176vw;
      margin-left: 0.549451vw;
      border: 0;
      background-color: #fff;
      -webkit-mask: url('/icons/comunicator/flecha_1.svg') no-repeat center / 0.549451vw;
      mask: url('/icons/comunicator/flecha_1.svg') no-repeat center / 0.549451vw;
      cursor: pointer;
    }
    .statusmenu__admin.open .admin__toggle {
      -webkit-mask-image: url('/icons/comunicator/flecha_2.svg');
      mask-image: url('/icons/comunicator/flecha_2.svg');
    }
    /* «Seleccione grupo» — gris #63666a, sangrado a 27.88. */
    .admin__hint {
      padding: 0 0 0.289836vw 1.914836vw;
      color: #63666a;
      font-size: 0.800138vw;
    }
    .admin__groups {
      display: flex;
      flex-direction: column;
      border-radius: 0.549451vw;
      background: #262c33;
      overflow: hidden;
    }
    .admin__group {
      padding: 0.412088vw 0.824176vw 0.412088vw 1.914836vw;
      border: 0;
      background: transparent;
      color: #8d939d;
      font-family: inherit;
      font-size: 0.800138vw;
      text-align: left;
      cursor: pointer;
    }
    .admin__group:hover {
      background: #1f2429;
      color: #fff;
    }
    .dot {
      flex: none;
      width: 0.686814vw;
      height: 0.686814vw;
      border-radius: 50%;
      background: var(--ag-red);
    }
    .dot--ok {
      background: var(--ag-green);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentFooterComponent {
  /*
   * Conversaciones EN CURSO que se muestran como chips en la barra. El original pinta las
   * tareas activas del agente; aqui salen las de CHATS que siguen en juego (open o
   * postconversando), que es lo que el carrusel muestra.
   */
  protected readonly tasks = CHATS.filter(
    (c) => c.state === 'open' || c.state === 'postchat'
  );

  /* Todas las tareas de CHATS son de chat; si algún día hay llamadas, aquí se ramifica. */
  protected channelIcon(_c: ChatRow): string {
    return `url('/icons/grupos/chat-actived.svg')`;
  }

  protected readonly open = signal(false);
  protected readonly state = inject(AgentStateService);
  protected readonly options = this.state.options;
  protected readonly grupos = GRUPOS;
  protected readonly adminOpen = signal(true);

  protected select(o: StatusOpt): void {
    this.state.status.set(o);
    this.open.set(false);
  }
}
