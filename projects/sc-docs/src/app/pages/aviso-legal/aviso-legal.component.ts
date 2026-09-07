import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Uno de los cinco sitios públicos que cubre este aviso. */
interface Sitio {
  readonly url: string;
  readonly que: string;
}

/**
 * Aviso legal de los cinco sitios públicos del DS.
 *
 * Vive AQUÍ y no en cada app a propósito: `agent`, `cuscare` y `agent-mini` son réplicas
 * fieles de herramientas reales (DD-35) y un pie de «aviso legal» que el original no tiene
 * rompería justo lo que replican. sc-docs es el único con cromo propio, así que es el que
 * lo publica y el que enlaza; el texto habla de los cinco.
 *
 * Todo lo que afirma esta página está MEDIDO en el repo, no supuesto: cero `document.cookie`
 * en el código de las apps, cero analítica, y desde el 2026-09-07 cero peticiones a un
 * tercero (las tipografías se sirven desde el propio bundle, ver `src/fonts.css`). Si
 * alguna de esas tres cosas cambia, esta página se queda MINTIENDO: es texto legal, no
 * decoración. Quien añada una analítica, una fuente remota o una cookie, la actualiza.
 */
@Component({
  selector: 'app-aviso-legal',
  standalone: true,
  templateUrl: './aviso-legal.component.html',
  styleUrl: './aviso-legal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisoLegalComponent {
  protected readonly actualizado = '7 de septiembre de 2026';

  protected readonly sitios: readonly Sitio[] = [
    { url: 'sc-doc.pages.dev', que: 'esta vitrina del design system' },
    { url: 'sc-supervisor.pages.dev', que: 'el módulo de supervisión, con datos de demostración' },
    { url: 'sc-agent.pages.dev', que: 'réplica del escritorio del agente' },
    { url: 'sc-cuscare.pages.dev', que: 'réplica de la herramienta de tickets' },
    { url: 'agent-mini.pages.dev', que: 'réplica del dialpad reducido' },
  ];
}
