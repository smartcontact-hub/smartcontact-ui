import { ChangeDetectionStrategy, Component, TemplateRef, computed, viewChild } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

import { ScButtonComponent, ScTagComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const ICONO_SNIPPET = `<!-- Un icono que significa algo dice su nombre, siempre. El lector lo oye por su aria-label. -->
<sc-tag severity="secondary" icon="description" role="img" aria-label="Transcribe" pTooltip="Transcribe" tooltipPosition="top" />`;

const CORTADO_SNIPPET = `<!-- Un texto cortado se enseña entero solo si se ve «…»: el que cabe no lleva tooltip.
     showOnEllipsis mide el elemento que lleva el pTooltip, así que va en el que recorta. -->
<span class="nombre" pTooltip="Atención al cliente" showOnEllipsis tooltipPosition="top">Atención al cliente</span>
<span class="nombre" pTooltip="Reclamaciones de facturación y cobros indebidos" showOnEllipsis tooltipPosition="top">
  Reclamaciones de facturación y cobros indebidos
</span>`;

const APAGADO_SNIPPET = `<!-- Un botón apagado dice por qué, siempre. -->
<sc-button label="Guardar" [disabled]="true" pTooltip="No hay cambios que guardar" tooltipPosition="top" />`;

const TECLADO_SNIPPET = `<!-- En algo que se enfoca, también con el teclado: por defecto el tooltip solo sale con el ratón. -->
<sc-button
  label="Datos de demo"
  variant="secondary"
  pTooltip="Cambia el conjunto de datos del prototipo"
  tooltipPosition="top"
  tooltipEvent="both"
/>`;

/**
 * Demo del tooltip del Kit en formato story. No hay `sc-tooltip`: es el `pTooltip` de PrimeNG tal cual, con el tema del
 * DS (DD-212), y su API, en la tabla de abajo, es la de la versión instalada. Sin Playground: sus knobs escribirían un
 * `<pTooltip>` que no existe, porque es una directiva y va sobre otro elemento.
 */
@Component({
  selector: 'app-tooltip-demo',
  imports: [ScButtonComponent, ScTagComponent, StoryHostComponent, TooltipModule],
  templateUrl: './tooltip-demo.component.html',
  styleUrl: './tooltip-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipDemoComponent {
  protected readonly iconoTpl = viewChild<TemplateRef<StoryContext>>('icono');
  protected readonly cortadoTpl = viewChild<TemplateRef<StoryContext>>('cortado');
  protected readonly apagadoTpl = viewChild<TemplateRef<StoryContext>>('apagado');
  protected readonly tecladoTpl = viewChild<TemplateRef<StoryContext>>('teclado');

  protected readonly meta: StoryMeta = {
    tag: 'pTooltip',
    title: 'Tooltip',
    description:
      'Lo que se lee al pasar el ratón: el nombre de un icono, un texto cortado o por qué un botón está apagado. Es el pTooltip de PrimeNG tal cual, con el tema del DS, sobre el elemento que lo necesita; nunca un title, que el navegador enseña con su globo del sistema (DD-212).',
    argTypes: [],
    defaultArgs: {},
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const ic = this.iconoTpl();
    const co = this.cortadoTpl();
    const ap = this.apagadoTpl();
    const te = this.tecladoTpl();
    if (!ic || !co || !ap || !te) return [];
    return [
      { name: 'Un icono con significado', template: ic, snippet: ICONO_SNIPPET },
      { name: 'Un texto cortado', template: co, snippet: CORTADO_SNIPPET },
      { name: 'Un botón apagado', template: ap, snippet: APAGADO_SNIPPET },
      { name: 'Con teclado', template: te, snippet: TECLADO_SNIPPET },
    ];
  });
}
