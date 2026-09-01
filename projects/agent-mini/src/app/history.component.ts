import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CALLS, type CallRow } from './mini-seed';

/**
 * Historial del Comunicador (mini, pantalla completa). Estructura y logica de iconos
 * adaptadas de projects/agent (HistoricListComponent): el COLOR del icono es dato
 * (verde atendida, rojo perdida, negro transferida en chat), no estilo. Iconos
 * reutilizados de agent/public/icons/historial. Datos FALSOS (mini-seed).
 */
@Component({
  selector: 'mini-history',
  standalone: true,
  template: `
    <div class="list">
      @for (r of calls; track r.id) {
      <div class="row">
        <article class="card" [class.open]="open() === r.id" (click)="toggle(r.id)">
          <span class="status" [class.lost]="r.outcome === 'lost'"></span>
          <img class="ic" [src]="iconFor(r)" [alt]="altFor(r)" />
          <span class="main">
            <span class="num">{{ r.number }}</span>
            <span class="grp">{{ r.group }}</span>
          </span>
          <span class="meta">
            <span class="time">{{ r.date }}</span>
            <button
              class="dial"
              type="button"
              aria-label="Llamar"
              (click)="onDial($event, r.number)"
            >
              <img src="icons/dialpad/telefono_pequeno_blanco.svg" alt="" />
            </button>
          </span>
        </article>
        @if (open() === r.id) {
        <div class="extra">
          @if (r.destination !== '-') {
          <div class="ln"><span class="lb">Destino:</span><span class="vl">{{ r.destination }}</span></div>
          }
          <div class="ln">
            <span class="lb">Atención:</span><span class="vl">{{ r.support }}</span>
            <span class="lb">Espera:</span><span class="chip">{{ r.wait }}</span>
          </div>
          <div class="ln"><span class="lb">Tipificación:</span><span class="vl">{{ r.categorization }}</span></div>
        </div>
        }
      </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; height: 100%; }
    .list { height: 100%; overflow-y: auto; color: #fff; }
    .card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 3vw;
      height: 9.3vh;
      padding: 0 4vw 0 5vw;
      background: #2d333a;
      border-bottom: 1px solid #000;
      cursor: pointer;
    }
    .card:hover { background: #1f2429; }
    .status { position: absolute; inset: 0 auto 0 0; width: 1vw; }
    .status.lost { background: #f75454; }
    .ic { width: 6vw; height: 2.4vh; object-fit: contain; flex: 0 0 auto; }
    .main { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 0.5vh; }
    .num {
      font-family: 'Roboto', sans-serif;
      font-size: 1.9vh;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .grp {
      font-size: 1.5vh;
      color: #9d9fa3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.8vh; flex: 0 0 auto; }
    .time { font-size: 1.5vh; color: #cdd2d8; }
    .dial {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 7vw;
      height: 3.2vh;
      border: 0;
      border-radius: 4vw;
      background: #69c663;
      cursor: pointer;
    }
    .dial img { width: 4vw; height: 1.8vh; object-fit: contain; }
    .extra { padding: 1.6vh 5vw; background: #1f2429; }
    .ln { display: flex; align-items: center; gap: 1.6vw; margin-bottom: 1vh; font-size: 1.6vh; }
    .ln:last-child { margin-bottom: 0; }
    .lb { color: #afb1b4; }
    .vl { color: #fff; }
    .chip { padding: 0.2vh 1.4vw; border-radius: 3vw; background: #5f6776; color: #fff; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  readonly dial = output<string>();

  protected readonly calls: readonly CallRow[] = CALLS;
  protected readonly open = signal<number | null>(null);

  protected toggle(id: number): void {
    this.open.update((cur) => (cur === id ? null : id));
  }

  protected onDial(ev: Event, number: string): void {
    ev.stopPropagation();
    this.dial.emit(number);
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
    return r.direction === 'in' ? 'Conversación entrante' : 'Conversación saliente';
  }
}
