import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import type { LucideIconData } from '../components/repo-types';

interface HubItem {
  readonly labelKey: string;
  readonly descriptionKey: string;
  readonly icon: LucideIconData;
  readonly path: string;
  readonly ready: boolean;
}

interface HubCategory {
  readonly titleKey: string;
  readonly items: readonly HubItem[];
}

/**
 * Repositories hub — grid of cards grouped by category, mirrors the React
 * prototype's RepositoriosHubPage. Cards marked `ready: false` render in
 * disabled "próximamente" state; today every card is ready.
 */
@Component({
  selector: 'sc-repositorios-hub-page',
  imports: [IconComponent, TranslateModule],
  templateUrl: './repositorios-hub-page.component.html',
  styleUrl: './repositorios-hub-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoriosHubPageComponent {
  private readonly router = inject(Router);

  protected readonly chevronIcon = 'chevron_right';

  protected readonly categories: readonly HubCategory[] = [
    {
      titleKey: 'repositories.hub.categories.communication',
      items: [
        {
          labelKey: 'repositories.agendas.title',
          descriptionKey: 'repositories.hub.descriptions.agendas',
          icon: 'call',
          path: '/admin/agendas',
          ready: true,
        },
        {
          labelKey: 'repositories.horarios.title',
          descriptionKey: 'repositories.hub.descriptions.horarios',
          icon: 'schedule',
          path: '/admin/horarios',
          ready: true,
        },
        {
          labelKey: 'templates.page_title',
          descriptionKey: 'repositories.hub.descriptions.plantillas',
          icon: 'file_copy',
          path: '/admin/plantillas',
          ready: true,
        },
        {
          labelKey: 'repositories.tipificaciones.title',
          descriptionKey: 'repositories.hub.descriptions.tipificaciones',
          icon: 'label',
          path: '/admin/tipificaciones',
          ready: true,
        },
      ],
    },
    {
      titleKey: 'repositories.hub.categories.classification',
      items: [
        {
          labelKey: 'labels.page_title',
          descriptionKey: 'repositories.hub.descriptions.labels',
          icon: 'label',
          path: '/admin/labels',
          ready: true,
        },
        {
          labelKey: 'repositories.variables.title',
          descriptionKey: 'repositories.hub.descriptions.variables',
          icon: 'data_object',
          path: '/admin/variables',
          ready: true,
        },
      ],
    },
    {
      titleKey: 'repositories.hub.categories.conversational_designer',
      items: [
        {
          labelKey: 'repositories.entidades.title',
          descriptionKey: 'repositories.hub.descriptions.entidades',
          icon: 'inventory_2',
          path: '/admin/entidades',
          ready: true,
        },
        {
          labelKey: 'repositories.intenciones.title',
          descriptionKey: 'repositories.hub.descriptions.intenciones',
          icon: 'chat_bubble',
          path: '/admin/intenciones',
          ready: true,
        },
      ],
    },
    {
      titleKey: 'repositories.hub.categories.ai',
      items: [
        {
          // S38 decisión B fusión hubs: redirigir a vistas Memory reales.
          labelKey: 'repositories.reglas_ia.title',
          descriptionKey: 'repositories.hub.descriptions.reglas_ia',
          icon: 'auto_awesome',
          path: '/conversaciones/reglas',
          ready: true,
        },
        {
          labelKey: 'repositories.entidades_ia.title',
          descriptionKey: 'repositories.hub.descriptions.entidades_ia',
          icon: 'inventory_2',
          path: '/conversaciones/entidades',
          ready: true,
        },
        {
          labelKey: 'repositories.clasificacion_ia.title',
          descriptionKey: 'repositories.hub.descriptions.clasificacion_ia',
          icon: 'label',
          path: '/conversaciones/categorias',
          ready: true,
        },
      ],
    },
  ];

  protected onItemClick(item: HubItem): void {
    if (!item.ready) return;
    void this.router.navigateByUrl(item.path);
  }
}
