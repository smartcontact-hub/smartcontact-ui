import { ChangeDetectionStrategy, Component, ElementRef, computed, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScTagComponent } from '@smartcontact-hub/components';

import {
  EXPLORATION_STATUS_LABEL,
  EXPLORATIONS,
  LABS,
  type ExplorationStatus,
} from './explorations.data';

/** Un destino del directorio. `route` = navega dentro de este mismo sitio. */
interface DemoLink {
  readonly label: string;
  readonly href: string | null;
  readonly route?: string;
  /** El dominio o la ruta, que es lo único que hace falta para reconocerlo. */
  readonly meta?: string;
}

interface DemoLinkGroup {
  readonly title: string;
  readonly links: readonly DemoLink[];
}

/**
 * Lab · tres familias, y cada una responde a algo distinto:
 *
 *   · EXPLORACIONES — versiones que se comparan abriendo enlaces; esperan una decisión.
 *   · LABORATORIOS  — una página con su conmutador dentro; se usan.
 *   · ENLACES       — la agenda de destinos.
 *
 * La página se rehízo el 2026-09-22 (Rafa: «es muy mess»). Antes eran 2.809px de alto, 764
 * palabras y cuatro niveles de título en una sola columna, con una nota de tres líneas por
 * enlace. Lo que se fue: las notas largas del directorio (lo que explica un sitio está en ese
 * sitio, no en su agenda) y el historial, que ahora vive plegado dentro de su tarjeta.
 */
@Component({
  selector: 'app-lab',
  imports: [RouterLink, ScTagComponent],
  templateUrl: './lab.component.html',
  styleUrl: './lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabComponent {
  protected readonly explorations = EXPLORATIONS;
  protected readonly labs = LABS;
  protected readonly statusLabel = EXPLORATION_STATUS_LABEL;

  private readonly secExploraciones = viewChild<ElementRef<HTMLElement>>('secExploraciones');
  private readonly secLaboratorios = viewChild<ElementRef<HTMLElement>>('secLaboratorios');
  private readonly secEnlaces = viewChild<ElementRef<HTMLElement>>('secEnlaces');

  protected statusSeverity(status: ExplorationStatus): 'success' | 'warn' | 'secondary' {
    if (status === 'oficial') return 'success';
    if (status === 'en-revision') return 'warn';
    return 'secondary';
  }

  /**
   * El índice de arriba. Cuenta lo que hay de verdad en cada lista, así que no puede mentir
   * cuando alguien añade una exploración y se olvida de esta cabecera.
   *
   * `computed` y NO un array calculado al vuelo: un campo que se evalúa al construir la clase lee
   * `linkGroups` antes de que exista y revienta con «Cannot read properties of undefined». El
   * `computed` no corre hasta el primer render, cuando la clase ya está entera.
   */
  protected readonly sections = computed(() => [
    {
      id: 'exploraciones' as const,
      count: this.explorations.length,
      label: 'Exploraciones',
      hint: 'Esperan decisión',
    },
    { id: 'laboratorios' as const, count: this.labs.length, label: 'Laboratorios', hint: 'Para tocar' },
    {
      id: 'enlaces' as const,
      count: this.linkGroups.reduce((n, g) => n + g.links.length, 0),
      label: 'Enlaces',
      hint: 'La agenda',
    },
  ]);

  /**
   * Scroll por código y no un `href="#…"`: este sitio enruta por hash (`/#/lab`), así que un
   * ancla de toda la vida se lleva por delante la ruta. Medido el 2026-09-22.
   */
  protected goTo(id: 'exploraciones' | 'laboratorios' | 'enlaces'): void {
    const target =
      id === 'exploraciones'
        ? this.secExploraciones()
        : id === 'laboratorios'
          ? this.secLaboratorios()
          : this.secEnlaces();
    target?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** La agenda: nombre y dominio. Lo que hace cada sitio se explica DENTRO del sitio. */
  protected readonly linkGroups: readonly DemoLinkGroup[] = [
    {
      title: 'En producción',
      links: [
        { label: 'Showcase del Design System', href: 'https://sc-doc.pages.dev', meta: 'sc-doc.pages.dev' },
        { label: 'Supervisor · la app real', href: 'https://sc-supervisor.pages.dev', meta: 'sc-supervisor.pages.dev' },
        { label: 'Agent · dashboard del agente', href: 'https://sc-agent.pages.dev', meta: 'sc-agent.pages.dev' },
        { label: 'Agent Mini · dialpad suelto', href: 'https://agent-mini.pages.dev', meta: 'agent-mini.pages.dev' },
        { label: 'CusCare · gestión de tickets', href: 'https://sc-cuscare.pages.dev', meta: 'sc-cuscare.pages.dev' },
      ],
    },
    {
      title: 'Atajos del Supervisor',
      links: [
        {
          label: 'Sistema de reglas',
          href: 'https://sc-supervisor.pages.dev/conversaciones/reglas',
          meta: '/conversaciones/reglas',
        },
        { label: 'Conversaciones', href: 'https://sc-supervisor.pages.dev/conversaciones', meta: '/conversaciones' },
        { label: 'Administración', href: 'https://sc-supervisor.pages.dev/admin/usuarios', meta: '/admin/usuarios' },
      ],
    },
    {
      title: 'Código y diseño',
      links: [
        {
          label: 'Repositorio en GitHub',
          href: 'https://github.com/smartcontact-hub/smartcontact-ui',
          meta: 'github.com/smartcontact-hub',
        },
        {
          label: 'Kit en Figma',
          href: 'https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System',
          meta: 'figma.com · Smart Contact DS',
        },
      ],
    },
    {
      title: 'Herramientas de este sitio',
      links: [
        { label: 'Verificación del tema', href: null, route: '/tema' },
        { label: 'Conexión de variables', href: null, route: '/conexion' },
        { label: 'Cómo validar un componente', href: null, route: '/validar' },
      ],
    },
  ];
}
