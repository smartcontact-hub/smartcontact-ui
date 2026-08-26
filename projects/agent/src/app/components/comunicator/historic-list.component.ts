import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CALLS, type CallRow } from '../../data/seed';

/**
 * Sección «Histórico» del Comunicador — la lista de conversaciones recientes.
 *
 * Todas las posiciones están medidas en vivo sobre el widget real y expresadas a la
 * escala de sc-agent ('px = vw x 14.56', ver 'projects/agent/docs/escala.md'). La
 * tarjeta se posiciona en absoluto porque el original coloca sus cuatro piezas en
 * coordenadas fijas, no en un flujo.
 */
@Component({
  selector: 'app-historic-list',
  standalone: true,
  template: `
    <div class="recents">
      <div class="recents__title">
        <span class="recents__text">Histórico</span>
      </div>

      <div class="recents__cards">
        @for (r of calls; track r.id) {
        <div class="slot">
          <article class="card" [class.open]="open() === r.id">
            <div class="card__status" [class.busy]="r.outcome === 'lost'"></div>

            <span class="card__icon">
              <img
                [src]="iconFor(r)"
                [alt]="altFor(r)"
                width="20.5"
                height="11.4"
              />
            </span>

            <span class="card__origin">{{ r.number }}</span>
            <span class="card__date">{{ r.date }}</span>
            <span class="card__group">{{ r.group }}</span>

            <button
              class="card__toggle"
              type="button"
              [attr.aria-expanded]="open() === r.id"
              [attr.aria-label]="
                open() === r.id ? 'Ocultar detalle' : 'Ver detalle'
              "
              (click)="toggle(r.id)"
            >
              <span class="card__chevron"></span>
            </button>
          </article>

          @if (open() === r.id) {
          <div class="extra">
            @if (r.destination !== '-') {
            <div class="extra__line">
              <span class="extra__label">Destino:</span>
              <span class="extra__value">{{ r.destination }}</span>
            </div>
            }
            <div class="extra__line">
              <span class="extra__label">Atención:</span>
              <span class="extra__value">{{ r.support }}</span>
              <span class="extra__label">Espera:</span>
              <span class="extra__chip">{{ r.wait }}</span>
            </div>
            <div class="extra__line">
              <span class="extra__label">Tipificación:</span>
              <span class="extra__level">{{
                r.categorization === '-' ? 'N1' : 'N1'
              }}</span>
              <span class="extra__value">{{ r.categorization }}</span>
            </div>
          </div>
          }
        </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .recents {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: #fff;
      font-size: 11.65px;
    }
    .recents__title {
      flex: none;
      height: 20.5px;
      margin-top: 10.6px;
      text-align: center;
    }
    .recents__text {
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 13.66px;
      line-height: 20.5px;
    }
    .recents__cards {
      flex: 1;
      min-height: 0;
      margin-top: 17.9px;
      overflow-y: auto;
    }

    /* .card-recents — 250.3 x 63.4 sobre #2d333a, separador negro de 0.56. */
    .card {
      position: relative;
      height: 63.4px;
      border-bottom: 0.56px solid #000;
      background: #2d333a;
    }
    /* El original resalta la tarjeta entera al pasar por encima. */
    .card:hover {
      background: #1f2429;
    }
    /* .status — barra de 7.6, roja si la conversación se perdió. */
    .card__status {
      position: absolute;
      inset: 0 auto 0 0;
      width: 7.6px;
    }
    .card__status.busy {
      background: #f75454;
    }
    /* .event-type — el icono a 16.7 / 13.3, 20.5 x 11.4. */
    .card__icon {
      position: absolute;
      top: 13.3px;
      left: 16.7px;
      display: block;
    }
    /* .origin / .date / .service-group — coordenadas del original. */
    .card__origin,
    .card__date,
    .card__group {
      position: absolute;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .card__origin {
      top: 9.1px;
      left: 49.3px;
      width: 129.3px;
    }
    .card__date {
      top: 9.1px;
      left: 178.6px;
      width: 55.4px;
    }
    .card__group {
      top: 36px;
      left: 49.3px;
      width: 120px;
    }
    /*
     * .extra-info / .show-extra-info — la píldora del chevron va pegada abajo, centrada
     * y ocupando 9.375vw (136.5). Nace OCULTA ('visibility: hidden') y solo aparece al
     * pasar por encima de la tarjeta; el fondo es negro, no el gris del hover.
     */
    .card__toggle {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 136.5px;
      height: 9.9px;
      padding: 0;
      border: 0;
      border-radius: 7.6px 7.6px 0.76px 0;
      background: #000;
      visibility: hidden;
      cursor: pointer;
    }
    .card:hover .card__toggle,
    .card.open .card__toggle {
      visibility: visible;
    }
    .card__chevron {
      width: 6.8px;
      height: 9.9px;
      background-color: #fff;
      -webkit-mask: url('/icons/comunicator/flecha_2.svg') no-repeat center / contain;
      mask: url('/icons/comunicator/flecha_2.svg') no-repeat center / contain;
    }
    .card.open .card__chevron {
      transform: rotate(180deg);
    }

    /* .extra-info-container — 88.5 de alto sobre #1f2429, padding 12.67 17.75. */
    .extra {
      padding: 12.67px 17.75px;
      background: #1f2429;
    }
    .extra__line {
      display: flex;
      align-items: center;
      height: 17.5px;
      margin-bottom: 15.6px;
    }
    .extra__line:last-child {
      margin-bottom: 0;
    }
    .extra__label {
      padding-right: 8.45px;
      color: #afb1b4;
    }
    .extra__value {
      padding-right: 8.45px;
      color: #fff;
    }
    /* La espera va en chip #5f6776, radio 6.76. */
    .extra__chip {
      padding: 0 4.22px;
      border-radius: 6.76px;
      background: #5f6776;
      color: #fff;
    }
    /* El nivel de tipificación va en azul. */
    .extra__level {
      padding-right: 8.45px;
      color: #3e7fff;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricListComponent {
  protected readonly calls: readonly CallRow[] = CALLS;

  /** Id de la tarjeta desplegada; el original solo abre una a la vez. */
  protected readonly open = signal<number | null>(null);

  protected toggle(id: number): void {
    this.open.update((cur) => (cur === id ? null : id));
  }

  protected iconFor(r: CallRow): string {
    const dir = r.direction === 'in' ? 'entrante' : 'saliente';
    if (r.channel === 'whatsapp') {
      return `icons/historial/whatsapp_${dir}.svg`;
    }
    const folder = r.channel === 'call' ? 'telefono' : r.channel;
    const color =
      r.outcome === 'transferred' && r.channel === 'chat'
        ? 'negro'
        : r.outcome === 'attended'
        ? 'verde'
        : 'rojo';
    return `icons/historial/${folder}/${color}_${dir}.svg`;
  }

  protected altFor(r: CallRow): string {
    return r.direction === 'in'
      ? 'Conversación entrante'
      : 'Conversación saliente';
  }
}
