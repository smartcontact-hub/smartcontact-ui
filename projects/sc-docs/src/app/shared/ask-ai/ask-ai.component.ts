import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { ScIconComponent } from '@smartcontact-hub/icons';

import { AskAiPanelComponent } from './ask-ai-panel.component';
import { AskAiService } from './ask-ai.service';

/**
 * «Pregunta a la IA»: el botón flotante, abajo a la derecha, y el panel que abre (`AskAiPanelComponent`).
 *
 * El panel llega con `@defer`: se descarga cuando el navegador está libre (`prefetch on idle`) y se monta la primera vez
 * que se abre. Montado en la carga inicial sumaba ~73 kB a CADA ficha de la doc (2,83 → 2,90 MB, medido con el build de
 * sc-docs), para un panel que la mayoría de visitas no abre.
 */
@Component({
  selector: 'app-ask-ai',
  imports: [AskAiPanelComponent, TranslatePipe, ScIconComponent],
  templateUrl: './ask-ai.component.html',
  styleUrl: './ask-ai.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskAiComponent {
  /** La ruta abierta, sin consulta: el panel la usa para la ficha y las preguntas sugeridas. */
  readonly ruta = input.required<string>();

  protected readonly ask = inject(AskAiService);

  private readonly injector = inject(Injector);
  private readonly fab = viewChild.required<ElementRef<HTMLButtonElement>>('fab');

  constructor() {
    // Al cerrar el panel (con su X o con Escape), el foco vuelve al botón flotante, que es de donde se abrió.
    let estabaAbierto = false;
    effect(() => {
      const abierto = this.ask.abierto();
      if (estabaAbierto && !abierto) this.devolverFoco();
      estabaAbierto = abierto;
    });
  }

  /**
   * Tras el siguiente repintado: hasta entonces el botón sigue con `is-oculto` (`visibility: hidden`) y no admite el
   * foco. Con un `setTimeout` el foco acababa en el `body` (medido con Escape y con la X). Y no se escucha el `hidden`
   * del cajón: PrimeNG solo lo emite cuando cierra él (Escape), no con la X propia del panel. Solo si el foco estaba
   * dentro del cajón o se había perdido: si quien lee ya está en otra parte de la página, no se le mueve.
   */
  private devolverFoco(): void {
    afterNextRender(
      () => {
        const activo = document.activeElement;
        if (!activo || activo === document.body || activo.closest('.p-drawer')) this.fab().nativeElement.focus();
      },
      { injector: this.injector },
    );
  }
}
