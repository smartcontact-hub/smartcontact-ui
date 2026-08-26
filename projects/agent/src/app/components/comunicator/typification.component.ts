import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AgentStateService } from '../../agent-state.service';

/**
 * Sección «Tipificación» — la misma ventana en sus dos entradas:
 *
 *  · tras colgar una llamada, con los tres niveles (Figma '283:1707');
 *  · desde el icono de tipificar de una conversación de chat, SIN niveles.
 *
 * Medidas tomadas en vivo sobre el widget real (escala 1456), relativas al borde
 * superior del panel: cabecera de 44.73 sobre '#333a41' con el título centrado a
 * 11.88; área de comentario de 205.54 x 184.29 a 10.01 de la cabecera; y el botón
 * Guardar de 204.01 x 40.18 a 12.52 del área.
 */
@Component({
  selector: 'app-typification',
  standalone: true,
  template: `
    <div class="typ">
      <div class="typ__head"><span class="typ__title">Tipificación</span></div>

      @if (showLevels()) {
      <div class="typ__levels">
        @for (n of levels; track n) {
        <button class="typ__level" type="button" [disabled]="n !== 1">
          <span>Nivel {{ n }}</span>
        </button>
        }
      </div>
      }

      <textarea
        class="typ__text"
        maxlength="255"
        placeholder="Escribir un comentario..."
        [value]="comment()"
        (input)="comment.set($any($event.target).value)"
      ></textarea>

      <button class="typ__save" type="button" (click)="save()">Guardar</button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    /* .container-typification — radio 1.771vw sobre #2d333a. */
    .typ {
      display: flex;
      flex-direction: column;
      height: 100%;
      border-radius: 1.771292vw 1.771292vw 0 0;
      background: #2d333a;
      color: #fff;
      overflow: hidden;
    }
    /* .header-typification — 44.73 sobre #333a41 con el titulo centrado. */
    .typ__head {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 3.072116vw;
      border-bottom: 0.052198vw solid rgba(0, 0, 0, 0.397);
      background: #333a41;
    }
    .typ__title {
      height: 1.407281vw;
      font-family: 'Open Sans Semibold', var(--ag-font);
      font-weight: 600;
      font-size: 0.938187vw;
      line-height: 1.407281vw;
    }
    /* Los tres niveles solo salen en la tipificación de llamada. */
    .typ__levels {
      flex: none;
      display: flex;
      flex-direction: column;
      gap: 0.549451vw;
      margin: 0.6875vw 1.563187vw 0 1.509616vw;
    }
    /* .boton — 14.115 x 1.875vw, radio 0.729vw, blanco con texto negro. */
    .typ__level {
      display: flex;
      align-items: center;
      height: 1.875vw;
      padding: 0 0.728022vw;
      border: 0.052198vw solid #fff;
      border-radius: 0.729396vw;
      background: #fff;
      color: #000;
      font-family: var(--ag-font);
      font-size: 0.800138vw;
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
    /* .textArea — 205.54 x 184.29 sobre #1f2429, borde #11131a, radio 0.833vw. */
    .typ__text {
      flex: none;
      height: 12.657281vw;
      margin: 0.6875vw 1.563187vw 0 1.509616vw;
      padding: 0.123627vw 0.51511vw;
      border: 0.052198vw solid #11131a;
      border-radius: 0.833105vw;
      background: #1f2429;
      color: #fff;
      font-family: var(--ag-font);
      font-size: 0.800138vw;
      resize: none;
      outline: none;
      box-sizing: border-box;
    }
    .typ__text::placeholder {
      color: var(--ag-muted);
    }
    /*
     * .buttonSave button — 204.01 x 40.18, transparente con borde blanco. El original
     * lo apaga a #5f5f5f cuando no hay nada que guardar, lo cubre de #9fa2a6 al pasar
     * por encima y lo invierte a blanco sobre negro al pulsarlo.
     */
    .typ__save {
      flex: none;
      height: 2.759616vw;
      margin: 0.859891vw 1.615385vw 0 1.5625vw;
      border: 0.052198vw solid #fff;
      border-radius: 0.833105vw;
      background-color: transparent;
      color: #fff;
      font-family: var(--ag-font);
      font-size: 0.800138vw;
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

  /** La tipificación de chat no lleva niveles; la de llamada, sí. */
  readonly showLevels = input(true);

  /** Se emite al guardar cuando la ventana la abrió un chat, no el flujo de llamada. */
  readonly saved = output<void>();

  protected save(): void {
    if (this.showLevels()) {
      this.state.saveTypification();
      return;
    }
    this.saved.emit();
  }
}
