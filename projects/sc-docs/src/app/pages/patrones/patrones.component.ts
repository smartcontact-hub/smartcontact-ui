import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScIconComponent } from '@smartcontact-hub/icons';
import { ScSkeletonComponent } from '@smartcontact-hub/components';

/** Un patrón de pantalla: qué hacer, qué evitar y con qué del sistema ya se resuelve. */
interface Principle {
  readonly icon: string;
  readonly title: string;
  /** La regla, en positivo. */
  readonly apply: string;
  /** El anti-patrón concreto que produce una pantalla amateur. */
  readonly avoid: string;
  /** El componente/token/regla que YA lo cubre en este sistema. */
  readonly have: string;
}

/**
 * Fundamentos → Patrones de pantalla.
 *
 * La barra de calidad al construir una pantalla de producto con este DS. No es teoría:
 * cada patrón apunta a lo que YA lo resuelve (token, componente o regla), para que una
 * pantalla nueva nazca consistente en vez de tener que corregirla después. El orden mezcla
 * lo que el sistema ya te da (color, iconos, carga) con las reglas que no viven en ningún
 * componente (copy, densidad, estabilidad visual).
 */
@Component({
  selector: 'app-patrones',
  standalone: true,
  imports: [ScIconComponent, ScSkeletonComponent],
  templateUrl: './patrones.component.html',
  styleUrl: './patrones.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatronesComponent {
  protected readonly heroIcon = 'auto_awesome';

  protected readonly principles: readonly Principle[] = [
    {
      icon: 'palette',
      title: 'Color funcional',
      apply: 'Cada color sale de un token --sc-* y significa algo: estado, jerarquía o feedback.',
      avoid: 'Hex a mano, o teñir botones e iconos por decoración.',
      have: 'La escala --sc-* y el puente al preset. Nunca hace falta un hex.',
    },
    {
      icon: 'progress_activity',
      title: 'Estados de carga',
      apply:
        'Mientras llegan los datos, pinta un esqueleto con la forma del contenido y reserva su hueco.',
      avoid: 'Spinner centrado, o inyectar los datos y que la página salte (layout shift).',
      have: 'sc-skeleton (rectángulo o círculo, animación de onda). Ejemplo vivo abajo.',
    },
    {
      icon: 'subject',
      title: 'Copy sin relleno',
      apply: 'Un título que se explica solo va solo. Descripción únicamente si aporta algo no obvio.',
      avoid: 'Un subtítulo decorativo de una o dos frases bajo cada cabecera.',
      have: 'Regla, no componente: menos texto, más señal. Si al quitarlo no se pierde nada, quítalo.',
    },
    {
      icon: 'grid_view',
      title: 'Iconografía consistente',
      apply: 'Una sola librería profesional, siempre vía sc-icon (Material Symbols).',
      avoid: 'Emojis en la interfaz, o mezclar dos juegos de iconos.',
      have: 'sc-icon sobre el set generado: un único idioma visual en todas las apps.',
    },
    {
      icon: 'table_rows',
      title: 'Densidad y jerarquía',
      apply:
        'Layout compacto. Acciones secundarias en un menú kebab, métricas alineadas, chips a icono cuando el color ya dice el estado.',
      avoid: 'Repetir en cada vista los KPIs que ya están en el dashboard, o tarjetas sin dato ni acción.',
      have: 'sc-datatable, sc-card y el patrón de overflow del supervisor.',
    },
    {
      icon: 'accessibility_new',
      title: 'Accesibilidad, barra mínima',
      apply:
        'Contraste 4.5:1 en texto y 3:1 en texto grande e iconos. Todo control alcanzable por teclado, con foco visible y etiqueta.',
      avoid: 'Comunicar un estado solo con color, o dejar un control sin label.',
      have: 'El contraste ya vive en los tokens; el riesgo entra al pintar un color a mano.',
    },
    {
      icon: 'animation',
      title: 'Sin saltos',
      apply:
        'Anima solo transform y opacity. Imágenes con width/height o aspect-ratio. Banners y toasts en un hueco ya reservado.',
      avoid: 'Animar top, left, width o height, o insertar algo encima del contenido al cargar.',
      have: 'La transición de tema del propio sitio ya funde con opacity, sin recolocar nada.',
    },
  ];
}
