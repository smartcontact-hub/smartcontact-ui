import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SettingsSidebarComponent } from './settings-sidebar.component';

/**
 * Layout shell for `/config/aed/*` routes (Figma node 224:9167).
 *
 * Rail (izquierda, navegación AED) + columna de contenido. Sin cabecera
 * propia: la orientación la da el breadcrumb de la TopBar ("Configuración AED
 * / [sección]", ver `config.routes.ts`) + el rail (resalta la sección activa).
 * El contenido arranca directo, alineado con el modelo "todo arriba" del resto
 * de la app — sin banda full-width ni título de página de un solo uso.
 */
@Component({
  selector: 'sc-settings-shell',
  imports: [RouterOutlet, SettingsSidebarComponent],
  templateUrl: './settings-shell.component.html',
  styleUrl: './settings-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsShellComponent {}
