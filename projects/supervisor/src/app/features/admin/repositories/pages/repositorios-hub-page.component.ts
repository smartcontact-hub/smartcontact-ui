import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import type { LucideIconData } from '../components/repo-types';

interface HubItem {
  readonly labelKey: string;
  readonly descriptionKey: string;
  readonly icon: LucideIconData;
  readonly path: string;
}

interface HubCategory {
  readonly titleKey: string;
  readonly items: readonly HubItem[];
}

/**
 * Hub de Repositorios — una lista de destinos agrupada por categoría.
 *
 * DD-77 (2026-09-13): era una fila de navegación hecha a mano (botón con icono enmarcado, título,
 * descripción, flecha, hover y deshabilitado propios). Ahora es el `Menu` de PrimeNG en línea, que
 * ya resuelve exactamente eso con el tema: título de grupo, fila con hover y foco, teclado con
 * flechas. De la página solo queda el CONTENIDO de cada fila (icono, título y descripción con los
 * estilos de texto del DS), por la plantilla `#item` que enseña primeng.dev. Las filas son enlaces
 * de verdad (`routerLink`): se abren en otra pestaña como cualquier enlace.
 *
 * Fuera, por sencillez: el marco del icono (ruido; el Menu de Aura pinta el icono sin caja), la
 * flecha (la fila entera ya dice que lleva a algún sitio) y el estado «Próximamente», que no usaba
 * ninguna fila.
 */
@Component({
  selector: 'sc-repositorios-hub-page',
  imports: [IconComponent, MenuModule, RouterLink, TranslateModule],
  templateUrl: './repositorios-hub-page.component.html',
  styleUrl: './repositorios-hub-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoriosHubPageComponent {
  private readonly translate = inject(TranslateService);

  /** Idioma vivo: `translate.instant()` no es reactivo, y sin esta dependencia el menú se quedaría
   *  en el idioma con el que se abrió la página. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang),
    ),
    { initialValue: this.translate.currentLang },
  );

  private readonly categories: readonly HubCategory[] = [
    {
      titleKey: 'repositories.hub.categories.communication',
      items: [
        {
          labelKey: 'repositories.agendas.title',
          descriptionKey: 'repositories.hub.descriptions.agendas',
          icon: 'call',
          path: '/admin/agendas',
        },
        {
          labelKey: 'repositories.horarios.title',
          descriptionKey: 'repositories.hub.descriptions.horarios',
          icon: 'schedule',
          path: '/admin/horarios',
        },
        {
          labelKey: 'templates.page_title',
          descriptionKey: 'repositories.hub.descriptions.plantillas',
          icon: 'file_copy',
          path: '/admin/plantillas',
        },
        {
          labelKey: 'repositories.tipificaciones.title',
          descriptionKey: 'repositories.hub.descriptions.tipificaciones',
          icon: 'label',
          path: '/admin/tipificaciones',
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
        },
        {
          labelKey: 'repositories.variables.title',
          descriptionKey: 'repositories.hub.descriptions.variables',
          icon: 'data_object',
          path: '/admin/variables',
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
        },
        {
          labelKey: 'repositories.intenciones.title',
          descriptionKey: 'repositories.hub.descriptions.intenciones',
          icon: 'chat_bubble',
          path: '/admin/intenciones',
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
        },
        {
          labelKey: 'repositories.entidades_ia.title',
          descriptionKey: 'repositories.hub.descriptions.entidades_ia',
          icon: 'inventory_2',
          path: '/conversaciones/entidades',
        },
        {
          labelKey: 'repositories.clasificacion_ia.title',
          descriptionKey: 'repositories.hub.descriptions.clasificacion_ia',
          icon: 'label',
          path: '/conversaciones/categorias',
        },
      ],
    },
  ];

  /** El modelo del Menu: un grupo por categoría; `title` es la descripción de la fila (el campo que
   *  `MenuItem` reserva para explicar un ítem).
   *
   *  ⚠️ Las etiquetas van YA TRADUCIDAS, no como claves para la plantilla: el Menu pone `item.label`
   *  como `aria-label` de la fila, y con claves un lector de pantalla leía
   *  «repositories.horarios.title» (medido en el DOM el 2026-09-13). */
  protected readonly menu = computed<MenuItem[]>(() => {
    this.currentLang();
    const t = (k: string): string => this.translate.instant(k);
    return this.categories.map((category) => ({
      label: t(category.titleKey),
      items: category.items.map((item) => ({
        label: t(item.labelKey),
        title: t(item.descriptionKey),
        icon: item.icon,
        routerLink: item.path,
      })),
    }));
  });
}
