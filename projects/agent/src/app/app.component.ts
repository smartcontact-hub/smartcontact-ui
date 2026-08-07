import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AgentFooterComponent } from './components/agent-footer/agent-footer.component';
import { AgentHeaderComponent } from './components/agent-header/agent-header.component';
import { CallTableComponent } from './components/call-table/call-table.component';
import { GruposCardComponent } from './components/grupos-card/grupos-card.component';
import { KpiGaugeCardComponent } from './components/kpi-gauge-card/kpi-gauge-card.component';
import { KpiStatusCardComponent } from './components/kpi-status-card/kpi-status-card.component';
import { KpiTimeCardComponent } from './components/kpi-time-card/kpi-time-card.component';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { ThemeService } from './theme/theme.service';

/** Shell del dashboard del Agent: header · grid de KPIs · tabla · footer. */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AgentHeaderComponent,
    KpiTimeCardComponent,
    KpiStatusCardComponent,
    KpiGaugeCardComponent,
    GruposCardComponent,
    ProfileCardComponent,
    CallTableComponent,
    AgentFooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  // Inyectado como side-effect → el constructor del ThemeService aplica `.sc-dark`
  // al arrancar (Agent oscuro por defecto). El campo no se usa en la plantilla.
  private readonly _theme = inject(ThemeService);

  constructor() {
    // Réplica del escalado FLUIDO de la web real (su root es `0.8vw` + rem, así que
    // toda la UI crece con el ancho de ventana). Aquí escalamos el shell proporcional
    // al ancho, con 1456px como diseño de referencia, para que no se vea "apretado"
    // en pantallas más anchas.
    const applyZoom = (): void => {
      document.documentElement.style.setProperty('--ag-zoom', String(window.innerWidth / 1456));
    };
    applyZoom();
    window.addEventListener('resize', applyZoom);
  }
}
