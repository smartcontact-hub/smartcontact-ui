import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PopoverModule } from 'primeng/popover';
import { TranslateModule } from '@ngx-translate/core';


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
 * producción") + popover con la lista de samples.
 *
 * El proyecto SmartContact es prototipo permanente — no se conecta a
 * backend real. Por tanto este switcher es parte canonical del demo,
 * no deuda pre-deploy.
 */
@Component({
  selector: 'sc-memory-mock-sample-switcher',
  imports: [IconComponent, PopoverModule, TranslateModule],
  templateUrl: './mock-sample-switcher.component.html',
  styleUrl: './mock-sample-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockSampleSwitcherComponent {
  private readonly store = inject(ConversationsStore);

  protected readonly databaseIcon = 'database';
  protected readonly checkIcon = 'check';
  protected readonly samples = this.store.samples;

  protected readonly currentId = this.store.currentSampleId;
  protected readonly currentSample = computed(
    () => this.samples.find((s) => s.id === this.currentId()) ?? this.samples[0],
  );

  protected selectSample(id: string): void {
    this.store.setSample(id);
  }
}
