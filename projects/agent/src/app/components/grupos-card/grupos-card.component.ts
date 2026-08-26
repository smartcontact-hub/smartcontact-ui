import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AgIconComponent } from '../ui/app-icon.component';

import { GRUPOS, type Grupo } from '../../data/seed';

/** Tile KPI: Assigned groups — search + filas con nombre + pill de canal (tel/chat/mail). */
@Component({
  selector: 'app-grupos-card',
  standalone: true,
  imports: [AgIconComponent],
  template: `
    <div class="agent-card grupos">
      <div class="grupos__head">
        <span class="grupos__title">Assigned groups</span>
        <label class="grupos__search">
          <app-icon name="search" [size]="12" />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search groups"
          />
        </label>
      </div>
      <ul class="grupos__list" role="list">
        @for (g of grupos; track $index) {
        <li class="grupos__row">
          <!--
            El interruptor por grupo lo tiene el original y aquí faltaba. Es el mismo
            app-switch del Comunicador: 20.47 x 10.61, pista #4F5256 que pasa a #0056fe, y
            un pulsador blanco de 10.61 con borde de 1px que recorre 9.86.
          -->
          <label class="switch">
            <input
              type="checkbox"
              [attr.aria-label]="'Atender ' + g.name"
              [checked]="isOn(g)"
              (change)="toggle(g)"
            />
            <span class="switch__slider"></span>
          </label>
          <span class="grupos__name">{{ g.name }}</span>
          <span class="grupos__ch" aria-hidden="true">
            <app-icon name="phone" [size]="12" />
            <app-icon name="chat" [size]="13" />
            <app-icon name="mail" [size]="12" />
          </span>
        </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .grupos {
      display: flex;
      flex-direction: column;
      gap: 0.549451vw;
      height: 100%;
      padding: 0.824176vw 0.961539vw;
    }
    .grupos__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.686814vw;
    }
    .grupos__title {
      font-size: 0.803572vw;
      font-weight: 400;
      color: var(--ag-text);
      white-space: nowrap;
    }
    /* .buscadorContainer del original: 87.37 x 26.54 sobre NEGRO, radio 7.59. */
    .grupos__search {
      position: relative;
      display: flex;
      align-items: center;
      width: 5.999313vw;
      height: 1.822802vw;
      border-radius: 0.521291vw;
      background: var(--ag-search-bg);
    }
    .grupos__search input {
      width: 100%;
      height: 100%;
      padding: 0 0.549451vw 0 1.8vw;
      border: 0;
      border-radius: inherit;
      background: none;
      color: var(--ag-text);
      font-family: inherit;
      font-size: 0.780907vw;
      outline: none;
      box-sizing: border-box;
    }
    .grupos__search app-icon {
      position: absolute;
      left: 0.549451vw;
      pointer-events: none;
    }
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
      border-radius: 1.771vw;
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
    .grupos__list {
      display: flex;
      flex-direction: column;
      gap: 0.412088vw;
      margin: 0;
      padding: 0;
      overflow: auto;
    }
    .grupos__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.549451vw;
      font-size: 0.803572vw;
      color: var(--ag-row);
    }
    .grupos__name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* Pill de canal: negro (#000), radio 6px, 3 iconos dentro (exacto). */
    .grupos__ch {
      display: inline-flex;
      align-items: center;
      gap: 0.412088vw;
      flex: none;
      background: var(--ag-ch-off);
      color: var(--ag-ch-on-ic);
      border-radius: 0.412088vw;
      padding: 0.137363vw 0.343407vw;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GruposCardComponent {
  protected readonly grupos = GRUPOS;

  /** Grupos apagados a mano en esta sesión. */
  private readonly off = signal<ReadonlySet<string>>(new Set());

  protected isOn(g: Grupo): boolean {
    return g.on && !this.off().has(g.name);
  }

  protected toggle(g: Grupo): void {
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
