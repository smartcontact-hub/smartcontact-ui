import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { SC_ICON_RESERVADOS, SC_ICONS, ScIconComponent, ScIconTono } from '@smartcontact-hub/icons';
import { ScButtonComponent } from '@smartcontact-hub/components';

/**
 * Fundamentos → Iconos (DD-200).
 *
 * Cuándo un icono va solo, con texto o no va; qué iconos tienen un solo significado; qué icono lleva cada concepto;
 * talla, color y accesibilidad. Las dos tablas salen del paquete de iconos (`SC_ICONS`, `SC_ICON_RESERVADOS`), las
 * mismas que lee `audit:icons`: la doc no puede decir una cosa y el gate otra.
 */
@Component({
  selector: 'app-iconos',
  standalone: true,
  imports: [ScButtonComponent, ScIconComponent, TranslatePipe],
  templateUrl: './iconos.component.html',
  styleUrl: './iconos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconosComponent {
  protected readonly reservados = Object.entries(SC_ICON_RESERVADOS).map(([icono, r]) => ({ icono, ...r }));

  protected readonly conceptos = Object.entries(SC_ICONS).map(([clave, icono]) => ({ clave, icono }));

  /** Cada tono con la forma que lo acompaña: el color nunca va solo. */
  protected readonly tonos: readonly { tono: ScIconTono; icono: string; clave: string }[] = [
    { tono: 'success', icono: 'check_circle', clave: 'success' },
    { tono: 'warning', icono: 'warning', clave: 'warning' },
    { tono: 'error', icono: 'error', clave: 'error' },
    { tono: 'info', icono: 'info', clave: 'info' },
  ];
}
