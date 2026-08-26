import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
} from '@angular/core';
import { AgentStateService } from '../../agent-state.service';
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
      height: 29.739011vw;
      border-radius: 1.973215vw;
      background: #2d333a;
      color: #fff;
      overflow: hidden;
    }
    .set__head {
      flex: none;
      height: 6.84066vw;
      background: #333a41;
      border-radius: 1.973215vw 1.973215vw 0 0;
    }
    .set__title {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 2.081044vw;
      padding-left: 0.891484vw;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 0.938187vw;
    }
    .set__help {
      width: 2.149726vw;
    }
    /* .header-message-toggle — ocupa el ancho del panel, no los 204.9 de Agentes. */
    .set__tabbar {
      width: 16.790522vw;
      margin-left: 0.199863vw;
    }
    /* Las mitades miden 30.33 de alto y el texto se apoya abajo. */
    .set__tabs {
      display: flex;
      height: 2.083105vw;
    }
    .set__tabs button {
      display: flex;
      align-items: flex-end;
      width: 8.395605vw;
      padding: 0;
      border: 0;
      background: none;
      color: #5f6776;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 0.677198vw;
      cursor: pointer;
    }
    .set__tabs button:first-child {
      justify-content: flex-start;
      padding-left: 1.199863vw;
    }
    .set__tabs button:last-child {
      justify-content: flex-end;
      padding-right: 1.199863vw;
    }
    .set__tabs button.on {
      color: #fff;
    }
    .set__rail {
      position: relative;
      height: 1.668957vw;
    }
    /* .toggleBarLine — hr de 1.11 en #5f6776 al 25%. */
    .set__rail::before {
      content: '';
      position: absolute;
      top: 0.800138vw;
      left: 1.399039vw;
      width: 13.991759vw;
      height: 0.076237vw;
      background: #5f6776;
      opacity: 0.25;
    }
    /* Aqui la pildora monta 9.96 sobre la barra (0.95rem), no los 0.93rem de Agentes. */
    .set__pill {
      position: absolute;
      top: 0.684066vw;
      width: 2.604396vw;
      height: 0.259616vw;
      border-radius: 0.208105vw;
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
      padding: 1.201924vw 1.850962vw 0 1.399726vw;
      font-size: 0.833105vw;
    }
    .prof__row {
      display: flex;
      gap: 0.796704vw;
      height: 4.835165vw;
    }
    /* ngx-avatar — 60.9 cuadrado. */
    .prof__avatar {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 4.182693vw;
      height: 4.168957vw;
      border-radius: 0.824176vw;
      background: var(--ag-red);
      font-size: 1.785715vw;
      font-weight: 600;
    }
    .prof__info > div {
      height: 1.201924vw;
      line-height: 1.201924vw;
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
      gap: 0.343407vw;
    }
    /*
     * El globo es BICOLOR (disco #bfc5d3 y meridianos #1f2429): con una mascara se
     * aplana a un disco blanco. Va como imagen, con sus propios colores, a 16.38.
     */
    .prof__globe {
      width: 1.125vw;
      height: 1.125vw;
      background: url('/icons/globe.svg') no-repeat center / contain;
    }
    /* .serviceGroups-header — 26.5, titulo en #a3a8b0 y buscador de 94.7. */
    .prof__groups-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 1.820055vw;
      margin-top: 0.803572vw;
      color: #a3a8b0;
    }
    .prof__groups-name {
      font-size: 0.800138vw;
    }
    .prof__search {
      position: relative;
      display: flex;
      align-items: center;
      width: 6.504121vw;
      height: 1.820055vw;
    }
    .prof__lupa {
      position: absolute;
      left: 0.618132vw;
      width: 0.755495vw;
      height: 0.755495vw;
      background-color: var(--ag-muted);
      -webkit-mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      pointer-events: none;
    }
    .prof__search input {
      width: 100%;
      height: 100%;
      padding: 0 0.549451vw 0 1.785715vw;
      border: 0;
      border-radius: 0.580358vw;
      background: #1f2429;
      color: #fff;
      font-family: inherit;
      font-size: 0.800138vw;
      outline: none;
    }
    .prof__groups {
      margin-top: 0.982143vw;
    }
    /* .serviceGroupsList — 202.95 de ancho con paso de 40.58 entre filas. */
    .prof__group {
      display: flex;
      align-items: center;
      height: 1.171704vw;
      margin-bottom: 1.615385vw;
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
      width: 1.405907vw;
      height: 0.728709vw;
      margin-right: 0.780907vw;
    }
    .switch input {
      width: 0;
      height: 0;
      opacity: 0;
    }
    .switch__slider {
      position: absolute;
      inset: 0;
      border-radius: 1.771292vw;
      background-color: #4f5256;
      cursor: pointer;
      transition: background-color 0.4s;
    }
    .switch__slider::before {
      content: '';
      position: absolute;
      width: 0.728709vw;
      height: 0.728709vw;
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
      transform: translateX(0.677198vw);
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
      margin-right: 0.521292vw;
      color: #fff;
      font-family: Roboto, var(--ag-font);
      font-size: 0.780907vw;
    }
    /* .channels — 50.73 x 15.17 sobre #1f2429, radio 6.07, tres iconos de 7.58. */
    .chans {
      flex: none;
      align-self: flex-start;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 3.484204vw;
      height: 1.041896vw;
      padding: 0 0.586539vw;
      border-radius: 0.416896vw;
      background: #1f2429;
      box-sizing: border-box;
    }
    .chans__ic {
      width: 0.520605vw;
      height: 0.520605vw;
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
      padding: 1.201924vw 1.401099vw 0;
      font-size: 0.780907vw;
    }
    .pref__block {
      margin-bottom: 0.412088vw;
    }
    /* .title — 29.8 de alto, 12.13. */
    .pref__block h3 {
      height: 2.046704vw;
      margin: 0;
      font-size: 0.833105vw;
      font-weight: 400;
      line-height: 2.046704vw;
    }
    .pref__row {
      display: flex;
      align-items: center;
      gap: 0.686814vw;
      height: 2.101649vw;
    }
    .pref__bell {
      flex: none;
      width: 1.043957vw;
      height: 1.043957vw;
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
      height: 0.865385vw;
      margin: 0;
      padding: 0;
      background: transparent;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
    }
    .pref__slider::-webkit-slider-runnable-track {
      height: 0.364011vw;
      margin-top: 0.250687vw;
      border-radius: 0.206044vw;
      background: linear-gradient(
        to right,
        #fff 0 var(--v, 0%),
        #5f6776 var(--v, 0%) 100%
      );
    }
    .pref__slider::-moz-range-track {
      height: 0.364011vw;
      border-radius: 0.206044vw;
      background: #5f6776;
    }
    .pref__slider::-moz-range-progress {
      height: 0.364011vw;
      border-radius: 0.206044vw;
      background: #fff;
    }
    .pref__slider::-webkit-slider-thumb {
      width: 0.865385vw;
      height: 0.865385vw;
      margin-top: -0.250687vw;
      border: 0;
      border-radius: 50%;
      background: #fff;
      appearance: none;
      -webkit-appearance: none;
    }
    .pref__slider::-moz-range-thumb {
      width: 0.865385vw;
      height: 0.865385vw;
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
      gap: 0.549451vw;
      height: 1.600275vw;
      padding-left: 1.998627vw;
      cursor: pointer;
    }
    .pref__check--left {
      padding-left: 0;
    }
    .pref__check input {
      flex: none;
      width: 1.043957vw;
      height: 1.043957vw;
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
      width: 16.792583vw;
      height: 4.457418vw;
      margin-left: 0.199176vw;
      padding-top: 1.195055vw;
      background: #333a41;
    }
    .set__close {
      width: 14.388737vw;
      height: 1.820055vw;
      border: 0;
      border-radius: 0.580358vw;
      background: #f75454;
      color: #fff;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 0.938187vw;
      cursor: pointer;
    }
    .set__close:hover {
      background: #f43434;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly state = inject(AgentStateService);
  protected readonly profile = PROFILE;
  protected readonly grupos = GRUPOS;
  protected readonly tabs = ['Perfil', 'Preferencias'] as const;
  protected readonly tab = signal<string>('Perfil');

  /** Volumen de cada aviso, 0-100; los dos sliders se mueven de verdad. */
  protected readonly assigned = signal(92);
  protected readonly waiting = signal(2);

  /* Delegado al servicio: el mismo interruptor sale aquí y en el otro sitio. */
  protected isOn(g: Grupo): boolean {
    return this.state.grupoActivo(g);
  }

  protected toggleGroup(g: Grupo): void {
    this.state.toggleGrupo(g);
  }
}
