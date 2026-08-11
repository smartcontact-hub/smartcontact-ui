import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Smoke visual del preset: primitivos PrimeNG SIN wrapper, estilados solo por
 * `theme/sc-preset` + tokens. Si esta página pinta con la métrica del Kit
 * (botón 10.5/7, radio 6…), el puente --p-* → --sc-* está vivo. Los wrappers
 * `sc-*` llegan en Mitad B; esta página existe para verificar fundaciones.
 */
@Component({
  selector: 'app-theme',
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DividerModule,
    InputTextModule,
    MessageModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './theme.component.html',
  styleUrl: './theme.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeComponent {
  checked = true;
  text = '';
}
