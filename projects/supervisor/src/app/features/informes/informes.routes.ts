import { Routes } from '@angular/router';

/**
 * Informes (Data Reports) — réplica EN SITIO de la app de estadísticas.
 *
 * En el producto real, `supervisor/#/private/stats/datareports` no pinta nada
 * propio: monta un **iframe cross-origin** a
 * `statssm.smartcontact.es/SmartContactStatsFN/#/token/<token>`, que es otra
 * aplicación Angular entera (PrimeNG + Roboto, paleta propia).
 *
 * Ese iframe es justo lo que rompe la captura a Figma (html.to.design sólo
 * alcanza a seleccionar `iframe.content-iframe`; su contenido queda fuera por
 * política de mismo origen). Aquí se replica el contenido NATIVAMENTE, sin
 * iframe, para que sea capturable, medible y editable.
 *
 * Valores extraídos del sitio real a viewport 1460×792 abriendo la URL del
 * iframe a nivel superior — ver `docs/informes-datareports.md`.
 */
export const informesRoutes: Routes = [
  {
    path: '',
    data: {
      breadcrumb: [
        { labelKey: 'sidebar.supervision', link: false },
        { labelKey: 'sidebar.estadisticas', link: false },
        { labelKey: 'sidebar.informes' },
      ],
    },
    loadComponent: () =>
      import('./pages/data-reports/data-reports.page').then((m) => m.DataReportsPage),
  },
  {
    path: 'constructor/:tipo',
    data: {
      breadcrumb: [
        { labelKey: 'sidebar.supervision', link: false },
        { labelKey: 'sidebar.estadisticas', link: false },
        { labelKey: 'sidebar.informes', link: '/informes' },
      ],
    },
    loadComponent: () =>
      import('./pages/report-builder/report-builder.page').then((m) => m.ReportBuilderPage),
  },
];
