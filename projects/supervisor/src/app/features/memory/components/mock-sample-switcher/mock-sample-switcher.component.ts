import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ChangeDetectionStrategy, Component, computed, HostListener, inject, signal } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import type { MenuItem } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { injectLangChange } from '@core/utils/lang-change';


import { ConversationsStore } from '../../state/conversations.store';

/**
 * MockSampleSwitcher · prototype feature permanente (S39).
 *
 * Switcher en la esquina superior derecha de `ConversationsPage` que
 * permite ciclar entre conjuntos curados de mock-data ("Todo procesado",
 * "Todo por procesar", "Solo chats"…) sin recargar datos manualmente.
 *
 * Réplica del prototipo React `MockSampleSwitcher.tsx`. El control es
 * un chip dashed amber (señal visual "este componente NO es de
 * producción") + un `p-menu` emergente con la lista de samples (antes un
 * Popover con `role="menu"` a mano, sin teclado: candidato 28 del barrido).
 *
 * El proyecto SmartContact es prototipo permanente — no se conecta a
 * backend real. Por tanto este switcher es parte canonical del demo,
 * no deuda pre-deploy.
 */
@Component({
  selector: 'sc-memory-mock-sample-switcher',
  imports: [IconComponent, MenuModule, TooltipModule, TranslateModule],
  templateUrl: './mock-sample-switcher.component.html',
  styleUrl: './mock-sample-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockSampleSwitcherComponent {
  private readonly store = inject(ConversationsStore);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  protected readonly databaseIcon = 'database';
  protected readonly checkIcon = 'check';
  protected readonly samples = this.store.samples;

  protected readonly currentId = this.store.currentSampleId;
  protected readonly currentSample = computed(
    () => this.samples.find((s) => s.id === this.currentId()) ?? this.samples[0],
  );

  protected readonly menuId = 'memory-mock-sample-menu';
  protected readonly menuOpen = signal(false);

  /** Un grupo con su título y una opción por conjunto; la que está en uso lo dice también al lector. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    this.lang();
    const actual = this.currentId();
    const t = (key: string, params?: Record<string, unknown>) => this.translate.instant(key, params);
    return [
      {
        label: t('memory.mock_sample_switcher.list_header'),
        items: this.samples.map((s) => {
          const titulo = t(s.labelKey);
          const activo = s.id === actual;
          return {
            label: activo ? t('memory.mock_sample_switcher.current_aria', { label: titulo }) : titulo,
            titulo,
            descripcion: t(s.descriptionKey),
            activo,
            command: () => this.selectSample(s.id),
          };
        }),
      },
    ];
  });

  /**
   * EXCEPCIÓN (DD-205): p-menu no desplaza su lista hasta la opción enfocada, y con once conjuntos la lista desplaza
   * (tope en `main.scss`). Sin esto, quien baja con flechas pierde de vista dónde está. Solo con el menú abierto.
   */
  @HostListener('document:keydown', ['$event'])
  protected seguirAlFoco(event: KeyboardEvent): void {
    if (!this.menuOpen() || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    requestAnimationFrame(() =>
      document.querySelector(`#${this.menuId}_list .p-focus`)?.scrollIntoView({ block: 'nearest' }),
    );
  }

  protected selectSample(id: string): void {
    this.store.setSample(id);
  }
}
