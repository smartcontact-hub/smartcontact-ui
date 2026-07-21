import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Un enlace del directorio. `href: null` = lo tenemos pendiente de pegar
 *  (p. ej. el Kit de Figma, cuya URL no vive en el repo). */
interface DemoLink {
  readonly label: string;
  readonly href: string | null;
  readonly note: string;
}

interface DemoLinkGroup {
  readonly title: string;
  readonly links: readonly DemoLink[];
}

/**
 * Lab · Banco de trabajo. Reúne dos cosas que, si no, se pierden:
 *
 * 1. **Enlaces** — todo lo desplegado (showcase + app real), el repositorio y
 *    el Kit, en un solo sitio para no memorizar URLs. Cada uno verificado vivo
 *    (200) el 2026-07-21 antes de fijarlo aquí; los `href` son data-driven para
 *    que añadir o corregir uno sea una línea, no una edición de plantilla.
 * 2. **Exploraciones** — prototipos de diseño que AÚN NO forman parte del
 *    sistema, guardados in-repo bajo `public/explorations/` (no enlazamos a
 *    repos externos, que son frágiles). Llevar cada uno a un patrón real del DS
 *    es trabajo aparte.
 */
@Component({
  selector: 'app-lab',
  templateUrl: './lab.component.html',
  styleUrl: './lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabComponent {
  protected readonly linkGroups: readonly DemoLinkGroup[] = [
    {
      title: 'En producción (rama main)',
      links: [
        {
          label: 'Showcase del Design System',
          href: 'https://sc-demo.pages.dev',
          note: 'Este mismo sitio: fundaciones, componentes, tema y uso real.',
        },
        {
          label: 'Supervisor · la app real',
          href: 'https://sc-supervisor.pages.dev',
          note: 'La aplicación de verdad, con datos de demostración.',
        },
      ],
    },
    {
      title: 'Atajos dentro del Supervisor',
      links: [
        {
          label: 'Sistema de reglas (en vivo)',
          href: 'https://sc-supervisor.pages.dev/conversaciones/reglas',
          note: 'El motor de reglas funcionando dentro de la app.',
        },
        {
          label: 'Conversaciones',
          href: 'https://sc-supervisor.pages.dev/conversaciones',
          note: 'Bandeja y transcripciones.',
        },
        {
          label: 'Administración',
          href: 'https://sc-supervisor.pages.dev/admin/usuarios',
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
          note: 'Todo el código del sistema.',
        },
        {
          label: 'Kit en Figma',
          href: null,
          note: 'El origen de los tokens. Pásame la URL y la fijo aquí.',
        },
      ],
    },
  ];

  /** URL sin el `https://` para mostrarla más corta y legible. */
  protected display(href: string): string {
    return href.replace(/^https?:\/\//, '');
  }
}
