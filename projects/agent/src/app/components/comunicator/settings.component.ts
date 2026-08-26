import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GRUPOS, PROFILE, type Grupo } from '../../data/seed';

/**
 * Sección «Configuración» — la que abre el engranaje de la cabecera del Comunicador.
 *
 * Medidas tomadas en vivo sobre el widget real y expresadas a la escala de sc-agent
 * (ver projects/agent/docs/escala.md). Las dos pestañas son las del original:
 *
 *  · Perfil        avatar 60.9, datos del agente y el bloque «Grupos asignados» con
 *                  su buscador y su listado.
 *  · Preferencias  dos avisos con campana y control de volumen, la casilla «Con
 *                  conversación en curso» y el bloque «Login y Logout».
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="set">
      <div class="set__head">
        <div class="set__title">
          <span>Configuración</span>
          <span class="set__help"></span>
        </div>
        <!--
          Misma barra que en Agentes pero a lo ancho del panel: dos mitades de 122.24 a
          9.86 sobre una linea de 1.11 con la pildora blanca de 37.92 x 3.78. El texto
          NO va centrado: Perfil alinea a la izquierda con 17.47 de sangria y
          Preferencias a la derecha con la misma; la pildora se pega a cada extremo
          (18.96 del borde del panel, medido en el original).
        -->
        <div class="set__tabbar">
          <div class="set__tabs" role="tablist">
            @for (t of tabs; track t) {
            <button
              type="button"
              role="tab"
              [class.on]="tab() === t"
              [attr.aria-selected]="tab() === t"
              (click)="tab.set(t)"
            >
              {{ t }}
            </button>
            }
          </div>
          <div class="set__rail">
            <span
              class="set__pill"
              [style.left.px]="tab() === 'Perfil' ? 16.05 : 190.5"
            ></span>
          </div>
        </div>
      </div>

      <div class="set__body">
        @if (tab() === 'Perfil') {
        <div class="prof">
          <div class="prof__row">
            <div class="prof__avatar">{{ profile.avatarLetter }}</div>
            <div class="prof__info">
              <div class="prof__name">{{ profile.name }}</div>
              <div><span class="prof__k">PIN:</span> {{ profile.pin }}</div>
              <div>
                <span class="prof__k">Extensión:</span> {{ profile.ext }}
              </div>
              <div class="prof__type">
                <span class="prof__k">Tipo ext.:</span>
                <span class="prof__globe"></span>
              </div>
            </div>
          </div>

          <div class="prof__groups-head">
            <span class="prof__groups-name">Grupos asignados</span>
            <label class="prof__search">
              <span class="prof__lupa"></span>
              <input
                type="search"
                placeholder="Buscar..."
                aria-label="Buscar grupo"
              />
            </label>
          </div>

          <div class="prof__groups">
            @for (g of grupos; track g.name) {
            <div class="prof__group">
              <label class="switch">
                <input
                  type="checkbox"
                  [attr.aria-label]="'Atender ' + g.name"
                  [checked]="isOn(g)"
                  (change)="toggleGroup(g)"
                />
                <span class="switch__slider"></span>
              </label>
              <span class="prof__gname">{{ g.name }}</span>
              <span class="chans">
                <span
                  class="chans__ic chans__ic--call"
                  [class.off]="!g.channels.calls"
                ></span>
                <span
                  class="chans__ic chans__ic--chat"
                  [class.off]="!g.channels.chats"
                ></span>
                <span
                  class="chans__ic chans__ic--mail"
                  [class.off]="!g.channels.emails"
                ></span>
              </span>
            </div>
            }
          </div>
        </div>
        } @else {
        <div class="pref">
          <section class="pref__block">
            <h3>Aviso de conversación asignada</h3>
            <div class="pref__row">
              <span class="pref__bell" [class.mute]="assigned() === 0"></span>
              <input
                class="pref__slider"
                type="range"
                min="0"
                max="100"
                aria-label="Volumen del aviso de conversación asignada"
                [style.--v.%]="assigned()"
                [value]="assigned()"
                (input)="assigned.set(+$any($event.target).value)"
              />
            </div>
          </section>

          <section class="pref__block">
            <h3>Aviso de conversaciones en espera</h3>
            <div class="pref__row">
              <span class="pref__bell" [class.mute]="waiting() === 0"></span>
              <input
                class="pref__slider"
                type="range"
                min="0"
                max="100"
                aria-label="Volumen del aviso de conversaciones en espera"
                [style.--v.%]="waiting()"
                [value]="waiting()"
                (input)="waiting.set(+$any($event.target).value)"
              />
            </div>
            <label class="pref__check">
              <input type="checkbox" checked />
              <span>Con conversación en curso</span>
            </label>
          </section>

          <section class="pref__block">
            <h3>Login y Logout</h3>
            <label class="pref__check pref__check--left">
              <input type="checkbox" />
              <span>En el Login - Estado disponible</span>
            </label>
            <label class="pref__check pref__check--left">
              <input type="checkbox" />
              <span>En el Logout - Cerrar sesión al salir</span>
            </label>
          </section>
        </div>
        }
      </div>

      <div class="set__logout">
        <button class="set__close" type="button">Cerrar sesión</button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .set {
      display: flex;
      flex-direction: column;
      height: 433px;
      border-radius: 28.73px;
      background: #2d333a;
      color: #fff;
      overflow: hidden;
    }
    .set__head {
      flex: none;
      height: 99.6px;
      background: #333a41;
      border-radius: 28.73px 28.73px 0 0;
    }
    .set__title {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 30.3px;
      padding-left: 12.98px;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 13.66px;
    }
    .set__help {
      width: 31.3px;
    }
    /* .header-message-toggle — ocupa el ancho del panel, no los 204.9 de Agentes. */
    .set__tabbar {
      width: 244.47px;
      margin-left: 2.91px;
    }
    /* Las mitades miden 30.33 de alto y el texto se apoya abajo. */
    .set__tabs {
      display: flex;
      height: 30.33px;
    }
    .set__tabs button {
      display: flex;
      align-items: flex-end;
      width: 122.24px;
      padding: 0;
      border: 0;
      background: none;
      color: #5f6776;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 9.86px;
      cursor: pointer;
    }
    .set__tabs button:first-child {
      justify-content: flex-start;
      padding-left: 17.47px;
    }
    .set__tabs button:last-child {
      justify-content: flex-end;
      padding-right: 17.47px;
    }
    .set__tabs button.on {
      color: #fff;
    }
    .set__rail {
      position: relative;
      height: 24.3px;
    }
    /* .toggleBarLine — hr de 1.11 en #5f6776 al 25%. */
    .set__rail::before {
      content: '';
      position: absolute;
      top: 11.65px;
      left: 20.37px;
      width: 203.72px;
      height: 1.11px;
      background: #5f6776;
      opacity: 0.25;
    }
    /* Aqui la pildora monta 9.96 sobre la barra (0.95rem), no los 0.93rem de Agentes. */
    .set__pill {
      position: absolute;
      top: 9.96px;
      width: 37.92px;
      height: 3.78px;
      border-radius: 3.03px;
      background: #fff;
      transition: left 0.18s ease;
    }
    /* .body-settings — 268.4 de alto. */
    .set__body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }

    /* ── Perfil ─────────────────────────────────────────────────────────── */
    /* El bloque de Perfil ocupa 202.95 arrancando a 20.38, como en el original. */
    .prof {
      padding: 17.5px 26.95px 0 20.38px;
      font-size: 12.13px;
    }
    .prof__row {
      display: flex;
      gap: 11.6px;
      height: 70.4px;
    }
    /* ngx-avatar — 60.9 cuadrado. */
    .prof__avatar {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60.9px;
      height: 60.7px;
      border-radius: 12px;
      background: var(--ag-red);
      font-size: 26px;
      font-weight: 600;
    }
    .prof__info > div {
      height: 17.5px;
      line-height: 17.5px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .prof__name {
      font-weight: 600;
    }
    .prof__k {
      color: var(--ag-field);
    }
    .prof__type {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    /*
     * El globo es BICOLOR (disco #bfc5d3 y meridianos #1f2429): con una mascara se
     * aplana a un disco blanco. Va como imagen, con sus propios colores, a 16.38.
     */
    .prof__globe {
      width: 16.38px;
      height: 16.38px;
      background: url('/icons/globe.svg') no-repeat center / contain;
    }
    /* .serviceGroups-header — 26.5, titulo en #a3a8b0 y buscador de 94.7. */
    .prof__groups-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 26.5px;
      margin-top: 11.7px;
      color: #a3a8b0;
    }
    .prof__groups-name {
      font-size: 11.65px;
    }
    .prof__search {
      position: relative;
      display: flex;
      align-items: center;
      width: 94.7px;
      height: 26.5px;
    }
    .prof__lupa {
      position: absolute;
      left: 9px;
      width: 11px;
      height: 11px;
      background-color: var(--ag-muted);
      -webkit-mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      pointer-events: none;
    }
    .prof__search input {
      width: 100%;
      height: 100%;
      padding: 0 8px 0 26px;
      border: 0;
      border-radius: 8.45px;
      background: #1f2429;
      color: #fff;
      font-family: inherit;
      font-size: 11.65px;
      outline: none;
    }
    .prof__groups {
      margin-top: 14.3px;
    }
    /* .serviceGroupsList — 202.95 de ancho con paso de 40.58 entre filas. */
    .prof__group {
      display: flex;
      align-items: center;
      height: 17.06px;
      margin-bottom: 23.52px;
    }
    /*
     * app-switch — EL MISMO que el KPI «Grupos asignados» de la cabecera: 20.47 x 10.61,
     * pista #4F5256 que pasa a #0056fe, y un pulsador blanco de 10.61 con borde de 1px
     * que recorre 9.86.
     */
    .switch {
      position: relative;
      flex: none;
      display: inline-block;
      width: 20.47px;
      height: 10.61px;
      margin-right: 11.37px;
    }
    .switch input {
      width: 0;
      height: 0;
      opacity: 0;
    }
    .switch__slider {
      position: absolute;
      inset: 0;
      border-radius: 25.79px;
      background-color: #4f5256;
      cursor: pointer;
      transition: background-color 0.4s;
    }
    .switch__slider::before {
      content: '';
      position: absolute;
      width: 10.61px;
      height: 10.61px;
      border: 1px solid #4f5256;
      border-radius: 50%;
      background-color: #fff;
      box-sizing: border-box;
      transition: transform 0.4s;
    }
    .switch input:checked + .switch__slider {
      background-color: #0056fe;
    }
    .switch input:checked + .switch__slider::before {
      border-color: #0056fe;
      transform: translateX(9.86px);
    }
    .switch input:focus-visible + .switch__slider {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
    .prof__gname {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin-right: 7.59px;
      color: #fff;
      font-family: Roboto, var(--ag-font);
      font-size: 11.37px;
    }
    /* .channels — 50.73 x 15.17 sobre #1f2429, radio 6.07, tres iconos de 7.58. */
    .chans {
      flex: none;
      align-self: flex-start;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 50.73px;
      height: 15.17px;
      padding: 0 8.54px;
      border-radius: 6.07px;
      background: #1f2429;
      box-sizing: border-box;
    }
    .chans__ic {
      width: 7.58px;
      height: 7.58px;
      background-color: #fff;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
      -webkit-mask-size: contain;
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
    }
    /* Los canales que el agente no atiende bajan a 0.3, no cambian de color. */
    .chans__ic.off {
      opacity: 0.3;
    }
    .chans__ic--call {
      -webkit-mask-image: url('/icons/grupos/telefono-actived.svg');
      mask-image: url('/icons/grupos/telefono-actived.svg');
    }
    .chans__ic--chat {
      -webkit-mask-image: url('/icons/grupos/chat-actived.svg');
      mask-image: url('/icons/grupos/chat-actived.svg');
    }
    .chans__ic--mail {
      -webkit-mask-image: url('/icons/grupos/mail.svg');
      mask-image: url('/icons/grupos/mail.svg');
    }

    /* ── Preferencias ───────────────────────────────────────────────────── */
    .pref {
      padding: 17.5px 20.4px 0;
      font-size: 11.37px;
    }
    .pref__block {
      margin-bottom: 6px;
    }
    /* .title — 29.8 de alto, 12.13. */
    .pref__block h3 {
      height: 29.8px;
      margin: 0;
      font-size: 12.13px;
      font-weight: 400;
      line-height: 29.8px;
    }
    .pref__row {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 30.6px;
    }
    .pref__bell {
      flex: none;
      width: 15.2px;
      height: 15.2px;
      background-color: #fff;
      -webkit-mask: url('/icons/dialpad/campana.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/campana.svg') no-repeat center / contain;
    }
    /*
     * Control de volumen REAL, no una maqueta: pista de 5.3 en #5f6776, parte recorrida
     * en blanco y pulsador de 12.6. Va sobre un input[type=range] para que se pueda
     * arrastrar y para que funcione con teclado; el relleno lo pinta '--v'.
     */
    .pref__slider {
      flex: 1;
      height: 12.6px;
      margin: 0;
      padding: 0;
      background: transparent;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
    }
    .pref__slider::-webkit-slider-runnable-track {
      height: 5.3px;
      margin-top: 3.65px;
      border-radius: 3px;
      background: linear-gradient(
        to right,
        #fff 0 var(--v, 0%),
        #5f6776 var(--v, 0%) 100%
      );
    }
    .pref__slider::-moz-range-track {
      height: 5.3px;
      border-radius: 3px;
      background: #5f6776;
    }
    .pref__slider::-moz-range-progress {
      height: 5.3px;
      border-radius: 3px;
      background: #fff;
    }
    .pref__slider::-webkit-slider-thumb {
      width: 12.6px;
      height: 12.6px;
      margin-top: -3.65px;
      border: 0;
      border-radius: 50%;
      background: #fff;
      appearance: none;
      -webkit-appearance: none;
    }
    .pref__slider::-moz-range-thumb {
      width: 12.6px;
      height: 12.6px;
      border: 0;
      border-radius: 50%;
      background: #fff;
    }
    .pref__slider:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 4px;
    }
    /* Con el volumen a cero, la campana se apaga. */
    .pref__bell.mute {
      opacity: 0.3;
    }
    .pref__check {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 23.3px;
      padding-left: 29.1px;
      cursor: pointer;
    }
    .pref__check--left {
      padding-left: 0;
    }
    .pref__check input {
      flex: none;
      width: 15.2px;
      height: 15.2px;
      margin: 0;
      accent-color: #fff;
      cursor: pointer;
    }

    /* ── Pie ────────────────────────────────────────────────────────────── */
    .set__logout {
      flex: none;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      width: 244.5px;
      height: 64.9px;
      margin-left: 2.9px;
      padding-top: 17.4px;
      background: #333a41;
    }
    .set__close {
      width: 209.5px;
      height: 26.5px;
      border: 0;
      border-radius: 8.45px;
      background: #f75454;
      color: #fff;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 13.66px;
      cursor: pointer;
    }
    .set__close:hover {
      background: #f43434;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  protected readonly profile = PROFILE;
  protected readonly grupos = GRUPOS;
  protected readonly tabs = ['Perfil', 'Preferencias'] as const;
  protected readonly tab = signal<string>('Perfil');

  /** Volumen de cada aviso, 0-100; los dos sliders se mueven de verdad. */
  protected readonly assigned = signal(92);
  protected readonly waiting = signal(2);

  /** Grupos apagados a mano en esta sesión. */
  private readonly off = signal<ReadonlySet<string>>(new Set());

  protected isOn(g: Grupo): boolean {
    return g.on && !this.off().has(g.name);
  }

  protected toggleGroup(g: Grupo): void {
    this.off.update((s) => {
      const next = new Set(s);
      if (next.has(g.name)) {
        next.delete(g.name);
      } else {
        next.add(g.name);
      }
      return next;
    });
  }
}
