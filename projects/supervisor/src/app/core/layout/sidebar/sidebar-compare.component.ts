import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ScButtonComponent,
  ScSelectButtonComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

import { SidebarVariantService, type SidebarCollapsedMode, type SidebarVariant } from './sidebar-variant.service';

/**
 * RAMA DE COMPARACIÓN (`comparar/sidebar`). El botón de la esquina inferior derecha que abre un panel
 * pequeño para alternar entre las dos propuestas del sidebar y dejarlo desplegado fijo. El cambio es
 * inmediato y el sidebar sigue funcionando: se pliega, se despliega con el ratón y navega.
 */
@Component({
  selector: 'sc-sidebar-compare',
  imports: [ScButtonComponent, ScSelectButtonComponent, ScToggleSwitchComponent, TranslateModule],
  templateUrl: './sidebar-compare.component.html',
  styleUrl: './sidebar-compare.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarCompareComponent {
  protected readonly compare = inject(SidebarVariantService);
  protected readonly open = signal(true);

  protected readonly options: readonly { value: SidebarVariant; labelKey: string }[] = [
    { value: 'figma', labelKey: 'compare_sidebar.figma' },
    { value: 'cyan', labelKey: 'compare_sidebar.cyan' },
  ];

  protected readonly modes: readonly { value: SidebarCollapsedMode; labelKey: string }[] = [
    { value: 'drawer', labelKey: 'compare_sidebar.drawer' },
    { value: 'slim', labelKey: 'compare_sidebar.slim' },
  ];

  protected selectMode(value: unknown): void {
    if (value === 'drawer' || value === 'slim') this.compare.collapsedMode.set(value);
  }

  protected selectVariant(value: unknown): void {
    if (value === 'figma' || value === 'cyan') this.compare.variant.set(value);
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.open.set(false);
  }
}
