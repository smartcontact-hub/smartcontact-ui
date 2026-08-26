import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { AgentStateService, type StatusOpt } from '../../agent-state.service';
import { GRUPOS } from '../../data/seed';

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
      gap: 12px;
      height: 38px;
      padding: 0 22px;
      background: #2d333a;
    }
    .footer__right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    /* Botón de estado: 179px, verde (Available) / rojo (ocupado). */
    .footer__status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 179px;
      height: 27px;
      background: var(--ag-green);
      color: var(--ag-status-text);
      font: inherit;
      font-size: 11.7px;
      font-weight: 400;
      padding: 0;
      border: none;
      border-radius: 9.1px;
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
      width: 27px;
      height: 27px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      background: var(--ag-red);
    }
    .footer__badge {
      position: absolute;
      right: -3px;
      bottom: -3px;
      width: 13px;
      height: 13px;
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
      right: 22px;
      bottom: 45.5px;
      width: 265px;
      /*
       * ALTO POR CONTENIDO, no fijo: en el original el panel mide 386.8 con
       * «Administrativo» colapsado y 476.1 desplegado, y SIEMPRE queda anclado abajo
       * a la misma altura que el Comunicador. Clavarlo deja hueco muerto al colapsar.
       */
      /*
       * Nunca mas alto que el Comunicador NI que el hueco disponible: si el contenido
       * no cabe, scrollea la lista en vez de recortarse por abajo.
       */
      max-height: min(506.7px, calc(100vh - 91px));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #333a41;
      border-radius: 23.65px;
      box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.4);
    }
    /* Con el Comunicador abierto se aparta a su izquierda: 291.1 medido en el real. */
    .statusmenu.aside {
      right: 291.1px;
    }
    /* .status-head — 45.5px de alto en el real. */
    .statusmenu__head {
      position: relative;
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 45.5px;
    }
    .statusmenu__title {
      font-size: 13.66px;
      font-weight: 600;
      color: var(--ag-text);
    }
    /* .status-close — 7.6 x 17.5, a 238.5 del borde izquierdo del panel. */
    .statusmenu__x {
      position: absolute;
      top: 14px;
      right: 19.5px;
      width: 9px;
      height: 9px;
      background: transparent;
      border: none;
      cursor: pointer;
    }
    /* La × se dibuja: el asset del original no se sirve por URL. */
    .statusmenu__x::before,
    .statusmenu__x::after {
      content: '';
      position: absolute;
      top: 4px;
      left: 0;
      width: 9px;
      height: 1px;
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
      border-radius: 0 0 25.36px 25.36px;
      list-style: none;
    }
    /* .state — 37.9 de alto, padding 0 12.98, fondo #2d333a. */
    .statusmenu__opt {
      display: flex;
      align-items: center;
      gap: 12.2px;
      min-height: 37.9px;
      padding: 0 12.98px;
      background: #2d333a;
      color: #fff;
      font-size: 11.65px;
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
      border-radius: 0 0 25.36px 25.36px;
      cursor: default;
    }
    .admin__head {
      display: flex;
      align-items: center;
      gap: 12.2px;
      height: 26.5px;
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
      left: 7.1px;
      width: 12.1px;
      height: 12.1px;
      background-color: #fff;
      -webkit-mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      mask: url('/icons/dialpad/lupa.svg') no-repeat center / contain;
      pointer-events: none;
    }
    /* input.buscadorInterno — 91 x 18.2, #1f2429, radio 3.38. */
    .admin__search input {
      width: 91px;
      height: 18.2px;
      padding: 1px 4.22px 1px 25px;
      border: 0;
      border-radius: 3.38px;
      background: #1f2429;
      color: #fff;
      font-family: inherit;
      font-size: 11.65px;
      outline: none;
    }
    .admin__toggle {
      width: 12px;
      height: 12px;
      margin-left: 8px;
      border: 0;
      background-color: #fff;
      -webkit-mask: url('/icons/comunicator/flecha_1.svg') no-repeat center / 8px;
      mask: url('/icons/comunicator/flecha_1.svg') no-repeat center / 8px;
      cursor: pointer;
    }
    .statusmenu__admin.open .admin__toggle {
      -webkit-mask-image: url('/icons/comunicator/flecha_2.svg');
      mask-image: url('/icons/comunicator/flecha_2.svg');
    }
    /* «Seleccione grupo» — gris #63666a, sangrado a 27.88. */
    .admin__hint {
      padding: 0 0 4.22px 27.88px;
      color: #63666a;
      font-size: 11.65px;
    }
    .admin__groups {
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      background: #262c33;
      overflow: hidden;
    }
    .admin__group {
      padding: 6px 12px 6px 27.88px;
      border: 0;
      background: transparent;
      color: #8d939d;
      font-family: inherit;
      font-size: 11.65px;
      text-align: left;
      cursor: pointer;
    }
    .admin__group:hover {
      background: #1f2429;
      color: #fff;
    }
    .dot {
      flex: none;
      width: 10px;
      height: 10px;
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
