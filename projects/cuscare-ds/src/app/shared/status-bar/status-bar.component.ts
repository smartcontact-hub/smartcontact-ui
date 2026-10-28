import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListboxModule } from 'primeng/listbox';
import { Popover, PopoverModule } from 'primeng/popover';
import { ScAvatarComponent, ScButtonComponent, ScSearchComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { SoftphoneComponent } from './softphone.component';
import { ADMIN_GROUPS, ADMIN_STATE, AgentState, SIMPLE_STATES } from './agent-states';

/**
 * Pie de la app: el estado del agente (botón que abre el panel de estados) y el avatar del usuario.
 * CUANDO: pantallas privadas de CusCare. Maqueta: el estado vive solo en el cliente y las iniciales son de la cuenta de demostración.
 *
 * El panel es un `p-popover` que NO se cierra al clicar fuera (como en producción): se cierra con la X, con Esc o al elegir un
 * estado. «Administrativo» pide un grupo: su fila lleva un buscador y despliega la lista de grupos.
 */
@Component({
  selector: 'app-status-bar',
  imports: [FormsModule, ListboxModule, PopoverModule, ScAvatarComponent, ScButtonComponent, ScIconComponent, ScSearchComponent, SoftphoneComponent],
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  protected readonly simpleStates = SIMPLE_STATES;
  protected readonly adminState = ADMIN_STATE;

  protected readonly current = signal<AgentState>(SIMPLE_STATES[1]);
  protected readonly group = signal<string | null>(null);
  protected readonly adminOpen = signal(false);
  protected readonly groupSearch = signal('');
  protected readonly open = signal(false);
  /** El comunicador abierto: el panel de estados se hace a un lado para dejarle su sitio. */
  protected readonly softphoneOpen = signal(false);

  private readonly pop = viewChild.required(Popover);
  private readonly injector = inject(Injector);

  constructor() {
    // El panel crece y encoge (plegar «Administrativo», filtrar grupos): se recoloca para seguir pegado a la píldora.
    effect(() => {
      this.adminOpen();
      this.groups();
      if (untracked(() => this.open())) {
        afterNextRender(() => this.pop().align(), { injector: this.injector });
      }
    });
  }

  protected readonly groups = computed(() => {
    const q = this.groupSearch().trim().toLowerCase();
    return ADMIN_GROUPS.filter((g) => g.toLowerCase().includes(q));
  });

  /** El panel, sin caret y pegado a la píldora, en la gama oscura del pie. */
  protected readonly popoverTokens = {
    gutter: '0px',
    root: {
      background: 'var(--sc-bg-surface)',
      borderColor: 'transparent',
      color: 'var(--sc-text-primary)',
      borderRadius: 'var(--sc-spacing-1-5)',
      shadow: 'var(--sc-shadow-popover)',
    },
    content: { padding: '0' },
  };

  /** El listbox sin marco ni fondo: el panel ya es la caja. */
  protected readonly listboxTokens = {
    root: { borderColor: 'transparent', background: 'transparent', shadow: 'none', color: 'var(--sc-text-primary)' },
    list: { padding: '0', gap: '0' },
    option: {
      color: 'var(--sc-text-primary)',
      focusColor: 'var(--sc-text-primary)',
      selectedColor: 'var(--sc-text-primary)',
      selectedFocusColor: 'var(--sc-text-primary)',
      focusBackground: 'var(--sc-bg-canvas)',
      selectedBackground: 'transparent',
      selectedFocusBackground: 'var(--sc-bg-canvas)',
      borderRadius: '0',
      padding: 'var(--sc-spacing-0-625) var(--sc-spacing-1-25)',
    },
  };

  /** La lista de grupos, con filas más bajas que las de los estados. */
  protected readonly groupsTokens = {
    ...this.listboxTokens,
    option: { ...this.listboxTokens.option, padding: 'var(--sc-spacing-0-25) var(--sc-spacing-0-75)' },
  };

  protected pickSimple(key: string | null): void {
    const state = SIMPLE_STATES.find((s) => s.key === key);
    if (!state) return;
    this.current.set(state);
    this.group.set(null);
  }

  protected pickGroup(group: string | null): void {
    if (!group) return;
    this.current.set(ADMIN_STATE);
    this.group.set(group);
  }
}
