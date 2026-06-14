import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

// Consumido POR NOMBRE — clúster de formulario del DS.
import {
  ScInputTextComponent,
  ScPageHeaderComponent,
  ScSectionCardComponent,
  ScSlotComponent,
  ScSubsectionComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

/**
 * Pantalla real de prototipo: formulario de agente. DOGFOOD del clúster de
 * formulario — el árbol anidado sc-section-card → sc-subsection → sc-slot con
 * sc-inputtext + sc-toggleswitch dentro de cada slot, más una sección colapsable.
 * Two-way con signals (`[(value)]`, `[checked]`/`(checkedChange)`), sin FormsModule.
 */
@Component({
  selector: 'app-agent-form',
  imports: [
    ScPageHeaderComponent,
    ScSectionCardComponent,
    ScSubsectionComponent,
    ScSlotComponent,
    ScInputTextComponent,
    ScToggleSwitchComponent,
  ],
  templateUrl: './agent-form.component.html',
  styleUrl: './agent-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentFormComponent {
  protected readonly name = signal('Inés García');
  protected readonly extension = signal('101');
  protected readonly email = signal('ines.garcia@smartcontact.io');
  protected readonly active = signal(true);
  protected readonly recordCalls = signal(false);
}
