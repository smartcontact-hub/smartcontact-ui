import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

import {
  ScEmptyStateComponent as EmptyStateComponent,
  ScSearchComponent as SearchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';

import { LanguageService } from '@core/services/language.service';
import { LabelsStore } from '@features/admin/labels/state/labels.store';
import { TemplatesStore } from '@features/admin/templates/state/templates.store';
import { CategoriesStore } from '@features/memory/state/categories.store';
import { EntitiesStore } from '@features/memory/state/entities.store';
import { RulesStore } from '@features/memory/state/rules.store';

import type { LucideIconData } from '../components/repo-types';
import { AgendasStore } from '../state/agendas.store';
import { EntidadesStore } from '../state/entidades.store';
import { HorariosStore } from '../state/horarios.store';
import { IntencionesStore } from '../state/intenciones.store';
import { TipificacionesStore } from '../state/tipificaciones.store';
import { VariablesStore } from '../state/variables.store';

interface HubItem {
  readonly labelKey: string;
  readonly descriptionKey: string;
  readonly icon: LucideIconData;
  readonly path: string;
  /** Cuántos hay: lo que cuenta el almacén que enseña su página (DD-165). */
  readonly count: () => number;
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
  imports: [EmptyStateComponent, IconComponent, MenuModule, RouterLink, SearchComponent, TranslateModule],
  templateUrl: './repositorios-hub-page.component.html',
  styleUrl: './repositorios-hub-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoriosHubPageComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly agendas = inject(AgendasStore);
  private readonly horarios = inject(HorariosStore);
  private readonly templates = inject(TemplatesStore);
  private readonly tipificaciones = inject(TipificacionesStore);
  private readonly labels = inject(LabelsStore);
  private readonly variables = inject(VariablesStore);
  private readonly entidades = inject(EntidadesStore);
  private readonly intenciones = inject(IntencionesStore);
  // Las tres de IA llevan a Conversaciones: cuentan lo que enseñan esas páginas, no los repositorios de antes.
  private readonly reglas = inject(RulesStore);
  private readonly entidadesIA = inject(EntitiesStore);
  private readonly categorias = inject(CategoriesStore);

  /** La búsqueda: por nombre y por descripción, en minúsculas y por subcadena, como en las listas. */
  protected readonly query = signal('');
  /** Las cifras, con el separador de miles del idioma. */
  private readonly cifra = computed(() => new Intl.NumberFormat(this.language.locale()));

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
          count: () => this.agendas.items().length,
        },
        {
          labelKey: 'repositories.horarios.title',
          descriptionKey: 'repositories.hub.descriptions.horarios',
          icon: 'schedule',
          path: '/admin/horarios',
          count: () => this.horarios.items().length,
        },
        {
          labelKey: 'templates.page_title',
          descriptionKey: 'repositories.hub.descriptions.plantillas',
          icon: 'file_copy',
          path: '/admin/plantillas',
          count: () => this.templates.templates().length,
        },
        {
          labelKey: 'repositories.tipificaciones.title',
          descriptionKey: 'repositories.hub.descriptions.tipificaciones',
          icon: 'label',
          path: '/admin/tipificaciones',
          count: () => this.tipificaciones.items().length,
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
          count: () => this.labels.labels().length,
        },
        {
          labelKey: 'repositories.variables.title',
          descriptionKey: 'repositories.hub.descriptions.variables',
          icon: 'data_object',
          path: '/admin/variables',
          count: () => this.variables.items().length,
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
          count: () => this.entidades.items().length,
        },
        {
          labelKey: 'repositories.intenciones.title',
          descriptionKey: 'repositories.hub.descriptions.intenciones',
          icon: 'chat_bubble',
          path: '/admin/intenciones',
          count: () => this.intenciones.items().length,
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
          count: () => this.reglas.rules().length,
        },
        {
          labelKey: 'repositories.entidades_ia.title',
          descriptionKey: 'repositories.hub.descriptions.entidades_ia',
          icon: 'inventory_2',
          path: '/conversaciones/entidades',
          count: () => this.entidadesIA.entities().length,
        },
        {
          labelKey: 'repositories.clasificacion_ia.title',
          descriptionKey: 'repositories.hub.descriptions.clasificacion_ia',
          icon: 'label',
          path: '/conversaciones/categorias',
          count: () => this.categorias.categories().length,
        },
      ],
    },
  ];

  /** El modelo del Menu: un grupo por categoría, con lo que casa con la búsqueda (un grupo sin filas no sale); `title` es
   *  la descripción de la fila (el campo que `MenuItem` reserva para explicar un ítem).
   *
   *  ⚠️ Las etiquetas van YA TRADUCIDAS, no como claves para la plantilla: el Menu pone `item.label`
   *  como `aria-label` de la fila, y con claves un lector de pantalla leía
   *  «repositories.horarios.title» (medido en el DOM el 2026-09-13). Por lo mismo, `label` lleva la cifra
   *  («Agendas (9)», DD-165): la fila se oye por ese nombre y no por lo que pinta. Lo que se ve va en `nombre`. */
  protected readonly menu = computed<MenuItem[]>(() => {
    this.currentLang();
    const t = (k: string, params?: object): string => this.translate.instant(k, params);
    const q = this.query().trim().toLowerCase();
    return this.categories
      .map((category) => ({
        label: t(category.titleKey),
        items: category.items
          .map((item) => ({ item, nombre: t(item.labelKey), descripcion: t(item.descriptionKey) }))
          .filter(({ nombre, descripcion }) => !q || nombre.toLowerCase().includes(q) || descripcion.toLowerCase().includes(q))
          .map(({ item, nombre, descripcion }) => {
            const cifra = this.cifra().format(item.count());
            return {
              label: t('repositories.hub.item_aria', { name: nombre, count: cifra }),
              nombre,
              title: descripcion,
              cifra,
              icon: item.icon,
              routerLink: item.path,
            };
          }),
      }))
      .filter((category) => category.items.length > 0);
  });
}
