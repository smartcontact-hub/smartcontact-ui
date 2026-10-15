import { Routes } from '@angular/router';

import { formDirtyGuard } from '@core/guards';

export const TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/templates-page.component').then((m) => m.TemplatesPageComponent),
  },
  {
    /* La plantilla tiene su editor, como las fichas y las agendas: el alta y la edición en su ruta, con la guarda de
     * siempre. La miga de «Plantillas» enlaza a la lista; la del editor es la tercera. */
    path: 'crear',
    data: { breadcrumb: { labelKey: 'templates.form.create_breadcrumb' } },
    loadComponent: () =>
      import('./pages/template-editor-page.component').then((m) => m.TemplateEditorPageComponent),
    canDeactivate: [formDirtyGuard],
  },
  {
    path: 'editar/:id',
    data: { breadcrumb: { labelKey: 'templates.form.edit_breadcrumb' } },
    loadComponent: () =>
      import('./pages/template-editor-page.component').then((m) => m.TemplateEditorPageComponent),
    canDeactivate: [formDirtyGuard],
  },
];
