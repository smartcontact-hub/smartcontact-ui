import { computed, inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LanguageService } from '@core/services/language.service';
import { AgendasStore } from '@features/admin/repositories/state/agendas.store';
import { TipificacionesStore } from '@features/admin/repositories/state/tipificaciones.store';
import type { TemplateType } from '@features/admin/templates/data/templates-data';
import { TemplatesStore } from '@features/admin/templates/state/templates.store';
import type { ResourceRow } from '@shared/components';

/**
 * LAS FILAS DEL RESUMEN DE RECURSOS (DD-164), las mismas en la ficha de grupo y en la de agente: qué es cada recurso
 * asignado y adónde lleva su «Editar» (sin él, `editable` a `false`, en un alta). Lo que ya no existe en Repositorios
 * no tiene fila. Se llama dentro de un `computed` que lea el idioma: los textos salen de `instant`.
 */
@Injectable({ providedIn: 'root' })
export class ResourceRowsService {
  private readonly agendasStore = inject(AgendasStore);
  private readonly templatesStore = inject(TemplatesStore);
  private readonly tipificacionesStore = inject(TipificacionesStore);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  /** Las cifras, con el separador de miles del idioma: en `es`, 1250 sin punto y 12.500 con él. */
  private readonly cifra = computed(() => new Intl.NumberFormat(this.language.locale()));

  /** Una fila por agenda, en el orden en que se pusieron: cuántos contactos tiene y si está activa. */
  agendas(ids: Iterable<number>, editable: boolean): ResourceRow[] {
    const porId = new Map(this.agendasStore.items().map((a) => [a.id, a]));
    return [...ids].flatMap((id) => {
      const agenda = porId.get(id);
      if (!agenda) return [];
      const contactos = this.cuenta('repositories.agendas.contacts_count', agenda.contacts.length);
      const estado = this.translate.instant(`repositories.status.${agenda.status}`);
      return [{ id, name: agenda.name, detail: `${contactos} · ${estado}`, edit: editable ? { link: `/admin/agendas/editar/${id}` } : null }];
    });
  }

  /** Las plantillas de un tipo: el principio de su texto, que es lo que dice qué son (el campo ya dice el canal). */
  templates(ids: ReadonlySet<number>, type: TemplateType, editable: boolean): ResourceRow[] {
    return this.templatesStore
      .templates()
      .filter((t) => t.type === type && ids.has(t.id))
      .map((t) => ({
        id: t.id,
        name: t.title,
        detail: t.body.split('\n')[0]!.trim(),
        edit: editable ? { link: '/admin/plantillas', queryParams: { editar: t.id } } : null,
      }));
  }

  /** La tipificación: cuántas tiene su categoría. Abre su repositorio buscándola, que es como se ve una categoría. */
  tipificacion(categoria: string | null, editable: boolean): ResourceRow[] {
    const n = this.tipificacionesStore.items().filter((t) => t.category === categoria).length;
    if (!categoria || n === 0) return [];
    return [
      {
        id: categoria,
        name: categoria,
        detail: this.cuenta('repositories.tipificaciones.count', n),
        edit: editable ? { link: '/admin/tipificaciones', queryParams: { buscar: categoria } } : null,
      },
    ];
  }

  /** «1 contacto» o «1.250 contactos»: la clave en plural, y la misma con `_one` para uno. */
  private cuenta(clave: string, n: number): string {
    return this.translate.instant(n === 1 ? `${clave}_one` : clave, { count: this.cifra().format(n) });
  }
}
