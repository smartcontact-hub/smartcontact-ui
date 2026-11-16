import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ScIconTileComponent, ScTagComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import {
  EXPLORATION_STATUS_LABEL,
  EXPLORATIONS,
  LABS,
  type ExplorationStatus,
} from './explorations.data';
import { HORARIOS } from './horarios.data';
import { LabArteComponent } from './lab-arte.component';
import { LabHorariosComponent } from './lab-horarios.component';

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
  readonly icon: string;
  readonly links: readonly DemoLink[];
}

/** Un boceto guardado: se mira, no se compara. */
interface Guardado {
  readonly title: string;
  readonly by: string;
  readonly href: string;
  /** Cómo se enseña la miniatura: la página en un iframe o la imagen tal cual. */
  readonly preview: 'pagina' | 'imagen';
  readonly alt?: string;
}

const GUARDADO: readonly Guardado[] = [
  {
    title: 'Pantalla de carga (esqueleto)',
    by: 'Marta Recio · jul 2026 · HTML sin tokens',
    href: '/explorations/skeleton-screen/index.html',
    preview: 'pagina',
  },
  {
    title: 'Icono de carga (búsqueda)',
    by: 'Marta Recio · jul 2026 · Lottie y GIF',
    href: '/explorations/search-loading/search_loading_icon.gif',
    preview: 'imagen',
    alt: 'Icono animado de carga: una lupa buscando con el texto Cargando resultados',
  },
];

type SectionId = 'horarios' | 'exploraciones' | 'laboratorios' | 'enlaces' | 'guardado';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Lab, con la composición de la portada (`/`): título centrado sobre el gris, tarjetas blancas grandes con ilustración
 * y secciones de tarjetas debajo. El marco la trata como la portada (`app.component.ts`, `esPortada`): a todo el ancho y
 * sin «En esta página», porque el índice de arriba ya lleva a cada sección.
 *
 * Cinco familias, y cada una responde a algo distinto:
 *
 *   · HORARIOS      — el frente que se prueba ahora, con todas sus versiones y quién hizo cada una.
 *   · EXPLORACIONES — versiones que se comparan abriendo enlaces; esperan una decisión.
 *   · LABORATORIOS  — una página con su conmutador dentro; se usan.
 *   · ENLACES       — la agenda de destinos.
 *   · GUARDADO      — bocetos que se miran.
 *
 * La página se rehízo el 2026-09-22 (demasiada densidad y ruido visual: las notas largas del directorio se fueron y el
 * historial de cada exploración vive plegado en su tarjeta) y otra vez el 2026-11-16, para que se pareciera a la
 * portada: ilustraciones, movimiento al entrar y una sección por familia.
 */
@Component({
  selector: 'app-lab',
  imports: [RouterLink, ScIconComponent, ScIconTileComponent, ScTagComponent, LabArteComponent, LabHorariosComponent],
  templateUrl: './lab.component.html',
  styleUrl: './lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly explorations = EXPLORATIONS;
  protected readonly labs = LABS;
  protected readonly statusLabel = EXPLORATION_STATUS_LABEL;

  /** Los bocetos, con la miniatura de los que son una página ya resuelta: una ruta fija de este mismo sitio. */
  protected readonly guardado = GUARDADO.map((g) => ({
    ...g,
    src: g.preview === 'pagina' ? this.sanitizer.bypassSecurityTrustResourceUrl(g.href) : null,
  }));

  /** La agenda: nombre y dominio. Lo que hace cada sitio se explica DENTRO del sitio. */
  protected readonly linkGroups: readonly DemoLinkGroup[] = [
    {
      title: 'En producción',
      icon: 'rocket_launch',
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
      icon: 'bolt',
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
      icon: 'code',
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
      icon: 'build',
      links: [
        { label: 'Verificación del tema', href: null, route: '/tema' },
        { label: 'Conexión de variables', href: null, route: '/conexion' },
        { label: 'Cómo validar un componente', href: null, route: '/validar' },
      ],
    },
    {
      // Cómo trabajamos, no cómo se construye el sistema: por eso no cuelga de «Código y diseño» (#226). Es una página
      // suelta bajo `public/explorations/`, con dirección de arte propia y sin tokens del DS: documenta una propuesta,
      // no el sistema. Lo que cuenta lo cuenta la página al abrirla; el directorio no lleva notas desde el 2026-09-22.
      title: 'Cómo trabajamos',
      icon: 'groups',
      links: [
        {
          label: 'Flujo de producto · síntesis de equipo',
          href: '/explorations/flujo-producto/index.html',
          meta: 'Las tres propuestas del 22 de septiembre, cruzadas',
        },
      ],
    },
  ];

  /**
   * El índice de arriba. Cuenta lo que hay de verdad en cada lista, así que no puede mentir cuando alguien añade una
   * exploración y se olvida de esta cabecera.
   */
  protected readonly sections: readonly {
    readonly id: SectionId;
    readonly icon: string;
    readonly count: number;
    readonly label: string;
    readonly hint: string;
  }[] = [
    {
      id: 'horarios',
      icon: 'calendar_month',
      count: HORARIOS.reduce((n, g) => n + g.versions.length, 0),
      label: 'Horarios',
      hint: 'Se prueba ahora',
    },
    { id: 'exploraciones', icon: 'compare', count: EXPLORATIONS.length, label: 'Exploraciones', hint: 'Esperan decisión' },
    { id: 'laboratorios', icon: 'science', count: LABS.length, label: 'Laboratorios', hint: 'Para tocar' },
    {
      id: 'enlaces',
      icon: 'link',
      count: this.linkGroups.reduce((n, g) => n + g.links.length, 0),
      label: 'Enlaces',
      hint: 'La agenda',
    },
    { id: 'guardado', icon: 'bookmark', count: this.guardado.length, label: 'Guardado', hint: 'Bocetos' },
  ];

  protected statusSeverity(status: ExplorationStatus): 'success' | 'warn' | 'secondary' {
    if (status === 'oficial') return 'success';
    if (status === 'en-revision') return 'warn';
    return 'secondary';
  }

  /** «2026-09-16» → «16 sep 2026». */
  protected fecha(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${MESES[m - 1]} ${y}`;
  }

  /**
   * Scroll por código y no un `href="#…"`: este sitio enruta por hash (`/#/lab`), así que un ancla de toda la vida se
   * lleva por delante la ruta. Medido el 2026-09-22. El hueco de la cabecera fija lo pone `scroll-margin-top`.
   */
  protected goTo(id: SectionId): void {
    this.host.nativeElement.querySelector(`#sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
