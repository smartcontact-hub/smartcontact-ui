import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScTagComponent } from '@smartcontact-hub/components';

import { EXPLORATION_STATUS_LABEL, EXPLORATIONS, type ExplorationStatus } from './explorations.data';

/** Un enlace del directorio. `href: null` = pendiente de pegar la URL.
 *  `route` = navega dentro de este mismo sitio (no lleva `meta` de dominio). */
interface DemoLink {
  readonly label: string;
  readonly href: string | null;
  readonly route?: string;
  readonly meta?: string;
  readonly note: string;
}

interface DemoLinkGroup {
  readonly title: string;
  /** Dominio compartido por todo el grupo, para no repetirlo en cada tarjeta. */
  readonly meta?: string;
  readonly links: readonly DemoLink[];
}

/**
 * Lab · Enlaces de uso diario (todo lo desplegado, el repo, el Kit) y prototipos que
 * aún no forman parte del sistema, guardados in-repo bajo `public/explorations/`
 * (no enlazamos a sitios externos, que son frágiles). Cada enlace, verificado vivo el
 * 2026-09-01 antes de fijarlo aquí.
 */
@Component({
  selector: 'app-lab',
  imports: [RouterLink, ScTagComponent],
  templateUrl: './lab.component.html',
  styleUrl: './lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabComponent {
  /** Ramas de comparación con sus versiones: el índice para volver a una idea sin buscar enlaces. */
  protected readonly explorations = EXPLORATIONS;
  protected readonly statusLabel = EXPLORATION_STATUS_LABEL;

  protected statusSeverity(status: ExplorationStatus): 'success' | 'warn' | 'secondary' {
    if (status === 'oficial') return 'success';
    if (status === 'en-revision') return 'warn';
    return 'secondary';
  }

  protected readonly linkGroups: readonly DemoLinkGroup[] = [
    {
      title: 'En producción',
      links: [
        {
          label: 'Showcase del Design System',
          href: 'https://sc-doc.pages.dev',
          meta: 'sc-doc.pages.dev',
          note: 'Este sitio: fundaciones, componentes, tema y uso real.',
        },
        {
          label: 'Supervisor · la app real',
          href: 'https://sc-supervisor.pages.dev',
          meta: 'sc-supervisor.pages.dev',
          note: 'La app de verdad, con datos de demostración.',
        },
        {
          label: 'Agent · dashboard del agente',
          href: 'https://sc-agent.pages.dev',
          meta: 'sc-agent.pages.dev',
          note: 'Réplica del dashboard del agente de contact center (agent.smart-contact.com/aed), medida sobre el sitio real: colores, iconos y tiempos.',
        },
        {
          label: 'Agent Mini · dialpad suelto',
          href: 'https://agent-mini.pages.dev',
          meta: 'agent-mini.pages.dev',
          note: 'El Comunicador de SmartContact como producto suelto a pantalla completa (comunicatormini.smart-contact.com/aed): dialpad, navbar y barra de estado. Primo de Agent, sin el dashboard.',
        },
        {
          label: 'CusCare · gestión de tickets',
          href: 'https://sc-cuscare.pages.dev',
          meta: 'sc-cuscare.pages.dev',
          note: 'Réplica de la herramienta de tickets (cuscare.smart-contact.com/aed), medida sobre el sitio real: lista, ficha y panel.',
        },
      ],
    },
    {
      title: 'Atajos del Supervisor',
      meta: 'sc-supervisor.pages.dev',
      links: [
        {
          label: 'Sistema de reglas (en vivo)',
          href: 'https://sc-supervisor.pages.dev/conversaciones/reglas',
          meta: '/conversaciones/reglas',
          note: 'El motor de reglas funcionando dentro de la app.',
        },
        {
          label: 'Conversaciones',
          href: 'https://sc-supervisor.pages.dev/conversaciones',
          meta: '/conversaciones',
          note: 'Bandeja y transcripciones.',
        },
        {
          label: 'Administración',
          href: 'https://sc-supervisor.pages.dev/admin/usuarios',
          meta: '/admin/usuarios',
          note: 'Usuarios, grupos, agentes, etiquetas, plantillas…',
        },
      ],
    },
    {
      title: 'Código y diseño',
      links: [
        {
          label: 'Repositorio en GitHub',
          href: 'https://github.com/smartcontact-hub/smartcontact-ui',
          meta: 'github.com/smartcontact-hub/smartcontact-ui',
          note: 'Todo el código del sistema.',
        },
        {
          label: 'Kit en Figma',
          href: 'https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System',
          meta: 'figma.com/…/Smart-Contact-Design-System',
          note: 'El origen de los tokens y componentes.',
        },
        {
          label: 'Verificación del tema',
          href: null,
          route: '/tema',
          note: 'Comprueba que los componentes de PrimeNG heredan los tokens del sistema.',
        },
        {
          label: 'Conexión de variables',
          href: null,
          route: '/conexion',
          note: 'Para cada variable de los 18 componentes del showcase, si la usa una capa de Figma y si el CSS de PrimeNG la lee. Es lo que hay que abrir al empezar una card.',
        },
        {
          label: 'Cómo validar un componente',
          href: null,
          route: '/validar',
          note: 'Guía para medir en el navegador el tamaño, la tipografía, el color, el borde y los espaciados de cualquier componente, y ver si bebe de las variables. Pide clave.',
        },
      ],
    },
    {
      // Cómo trabajamos, no cómo se construye el sistema: por eso no cuelga de «Código y diseño».
      // Es una página suelta bajo `public/explorations/`, con dirección de arte propia y sin
      // tokens del DS, igual que el resto de exploraciones: documenta una propuesta, no el sistema.
      title: 'Cómo trabajamos',
      links: [
        {
          label: 'Flujo de producto · síntesis de equipo',
          href: '/explorations/flujo-producto/index.html',
          note: 'Las tres propuestas de flujo que se presentaron el 22 de septiembre, cruzadas entre sí: doce acuerdos que ya coinciden, cinco decisiones donde los documentos se contradicen y cuatro huecos que no escribió nadie. Los desempates son una postura de Diseño, no un consenso.',
        },
      ],
    },
  ];
}
