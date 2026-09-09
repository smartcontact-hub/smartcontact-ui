import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ScSkeletonComponent } from '@smartcontact-hub/components';

/** Una sección de una versión («Novedades», «Cambios», «Retirado»…). */
interface Seccion {
  readonly titulo: string;
  readonly items: readonly string[];
}

/** Una versión publicada, tal y como la cuenta el CHANGELOG. */
interface Version {
  readonly version: string;
  readonly fecha: string | null;
  readonly intro: readonly string[];
  readonly secciones: readonly Seccion[];
}

const RELEASES = 'https://github.com/smartcontact-hub/smartcontact-ui/releases';

/**
 * Novedades del design system: qué versión hay, qué trae y de dónde se baja.
 *
 * El contenido NO se escribe aquí. Lo genera `scripts/gen-novedades.mjs` desde
 * `CHANGELOG.md`, que es la única fuente, y `novedades:check` (dentro de `verify`) pone rojo
 * si el artefacto se queda atrás. Escribir la nota dos veces es cómo una de las dos empieza
 * a mentir sin que nadie se entere.
 *
 * El HTML de cada punto viene YA convertido del generador (negrita, `código`, enlaces): el
 * origen es un fichero del propio repo, así que no viaja ningún parser de markdown al bundle.
 */
@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [ScSkeletonComponent],
  templateUrl: './novedades.component.html',
  styleUrl: './novedades.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovedadesComponent {
  protected readonly versiones = signal<readonly Version[] | null>(null);
  /** Distingue «aún cargando» de «no se pudo»: un vacío mudo parecería que no hay versiones. */
  protected readonly fallo = signal(false);

  protected readonly releases = RELEASES;

  constructor() {
    fetch('/novedades/_novedades.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { versiones: Version[] }) => this.versiones.set(d.versiones))
      .catch(() => this.fallo.set(true));
  }

  /** La primera es la última publicada: el CHANGELOG va de nueva a vieja. */
  protected ultima(): Version | null {
    return this.versiones()?.[0] ?? null;
  }

  protected descarga(paquete: string, version: string): string {
    return `${RELEASES}/download/v${version}/smartcontact-hub-${paquete}-${version}.tgz`;
  }

  protected fechaLarga(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
}
