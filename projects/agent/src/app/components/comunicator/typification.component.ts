import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { AgentStateService } from '../../agent-state.service';

/**
 * Sección «Tipificación» — el paso posterior a colgar (Figma '283:1707').
 *
 * Medidas del componente real convertidas con 'px = vw x 14.56': los desplegables de
 * nivel '14.115 x 1.875vw', el área de comentario '14.115 x 12.656vw' sobre '#1f2429'
 * y el botón Guardar '14.01 x 2.76vw' con borde blanco.
 */
@Component({
  selector: 'app-typification',
  standalone: true,
  template: `
    <div class="typ">
      <div class="typ__head"><span class="typ__title">Tipificación</span></div>

      <div class="typ__body">
        @for (n of levels; track n) {
        <button class="typ__level" type="button" [disabled]="n !== 1">
          <span>Nivel {{ n }}</span>
        </button>
        }

        <textarea
          class="typ__text"
          maxlength="255"
          rows="10"
          placeholder="Escribir un comentario..."
          [value]="comment()"
          (input)="comment.set($any($event.target).value)"
        ></textarea>
      </div>

      <div class="typ__foot">
        <button
          class="typ__save"
          type="button"
          (click)="state.saveTypification()"
        >
          Guardar
        </button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .typ {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: #fff;
    }
    .typ__head {
      flex: none;
      height: 33.6px;
      margin-top: 10.6px;
      text-align: center;
    }
    .typ__title {
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 13.66px;
    }
    .typ__body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    /* .boton — 14.115 x 1.875vw, radio 0.729vw, blanco con texto negro. */
    .typ__level {
      display: flex;
      align-items: center;
      width: 205.5px;
      height: 27.3px;
      padding: 0 10.6px;
      border: 0.76px solid #fff;
      border-radius: 10.6px;
      background: #fff;
      color: #000;
      font-family: var(--ag-font);
      font-size: 11.7px;
      text-align: left;
      cursor: pointer;
    }
    .typ__level:hover:not(:disabled) {
      background-color: #8d939d;
      color: #fff;
    }
    /* .disableButton — los niveles 2 y 3 llegan bloqueados hasta elegir el anterior. */
    .typ__level:disabled {
      border-color: #5f5f5f;
      background: transparent;
      color: #5f5f5f;
      cursor: default;
    }
    /* .textArea — 14.115 x 12.656vw sobre #1f2429, borde #11131a, radio 0.833vw. */
    .typ__text {
      width: 205.5px;
      height: 184.3px;
      margin-top: 4px;
      padding: 8px 10px;
      border: 0.76px solid #11131a;
      border-radius: 12.1px;
      background: #1f2429;
      color: #fff;
      font-family: var(--ag-font);
      font-size: 11.7px;
      resize: none;
      outline: none;
      box-sizing: border-box;
    }
    .typ__foot {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 82.2px;
    }
    /* .buttonSave button — 14.01 x 2.76vw, borde blanco, radio 0.833vw. */
    .typ__save {
      width: 204px;
      height: 40.2px;
      border: 0.76px solid #fff;
      border-radius: 12.1px;
      background-color: transparent;
      color: #fff;
      font-family: var(--ag-font);
      font-size: 11.7px;
      cursor: pointer;
    }
    .typ__save:hover {
      border-color: #5f5f5f;
      background-color: #9fa2a6;
      color: #fff;
    }
    .typ__save:active {
      border-color: #5f5f5f;
      background-color: #fff;
      color: #000;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypificationComponent {
  protected readonly state = inject(AgentStateService);
  protected readonly levels = [1, 2, 3];
  protected readonly comment = signal('');
}
