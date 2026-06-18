import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ScToggleSwitchComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { ThemeService } from '../../theme/theme.service';

/** Barra superior: logo SmartContact·Agent + toggle claro/oscuro. */
@Component({
  selector: 'app-agent-header',
  standalone: true,
  imports: [ScToggleSwitchComponent, ScIconComponent],
  template: `
    <header class="hdr">
      <div class="hdr__brand">
        <span class="hdr__logo"><sc-icon name="graphic_eq" [size]="20" /></span>
        <span class="hdr__name"><strong>SmartContact</strong> <span class="agent-muted">Agent</span></span>
      </div>
      <label class="hdr__theme">
        <sc-icon name="dark_mode" [size]="15" />
        <sc-toggleswitch
          [checked]="isDark()"
          (checkedChange)="onToggle($event)"
          ariaLabel="Cambiar tema claro/oscuro"
        />
        <sc-icon name="light_mode" [size]="15" />
      </label>
    </header>
  `,
  styles: `
    .hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-spacing-0-75) var(--sc-spacing-1-5);
    }
    .hdr__brand {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-0-75);
    }
    .hdr__logo {
      display: inline-flex;
      color: var(--sc-icon-accent);
    }
    .hdr__name {
      font-size: var(--sc-font-size-300);
      color: var(--sc-text-primary);
    }
    .hdr__theme {
      display: inline-flex;
      align-items: center;
      gap: var(--sc-spacing-0-5);
      color: var(--sc-text-secondary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentHeaderComponent {
  private readonly theme = inject(ThemeService);
  protected readonly isDark = computed(() => this.theme.effectiveMode() === 'dark');

  protected onToggle(checked: boolean): void {
    this.theme.set(checked ? 'dark' : 'light');
  }
}
