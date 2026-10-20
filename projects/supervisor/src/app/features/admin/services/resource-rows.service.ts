import { computed, inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LanguageService } from '@core/services/language.service';
import { AgendasStore } from '@features/admin/repositories/state/agendas.store';
import { EquiposStore } from '@features/admin/repositories/state/equipos.store';
import { nivelesDe } from '@features/admin/repositories/state/tipificaciones.core.mjs';
import { TipificacionesStore } from '@features/admin/repositories/state/tipificaciones.store';
import type { TemplateType } from '@features/admin/templates/data/templates-data';
import { textoPlano } from '@features/admin/templates/state/templates.core.mjs';
import { TemplatesStore } from '@features/admin/templates/state/templates.store';
import type { ResourceRow } from '@shared/components';

/** Una opción de un desplegable de Recursos (DD-217 §15): su nombre y lo que contiene, para su tooltip. */
export interface ResourceOptionData {
  readonly label: string;
  readonly value: number;
  readonly contenido: string;
}

/** Cuántas letras lleva como mucho el tooltip de una opción: con el ancho del tooltip del Kit, unas ocho líneas. Sin
 *  tope, la descripción de un equipo de 1.600 letras daba uno de 1.811 px de alto (medido con datos de estrés). */
const LETRAS_A_LA_VISTA = 160;

/** Lo que cabe en el tooltip de una opción: un texto en una línea, hasta `LETRAS_A_LA_VISTA` y con «…» si sigue. */
const aLaVista = (texto: string): string => {
  const linea = texto.replace(/\s+/g, ' ').trim();
  return linea.length > LETRAS_A_LA_VISTA ? `${linea.slice(0, LETRAS_A_LA_VISTA).trimEnd()}…` : linea;
};

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
  private readonly equiposStore = inject(EquiposStore);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  /** Las cifras, con el separador de miles del idioma: en `es`, 1250 sin punto y 12.500 con él. */
  private readonly cifra = computed(() => new Intl.NumberFormat(this.language.locale()));

  /** Una fila por agenda, en el orden en que se pusieron: cuántos contactos tiene. */
  agendas(ids: Iterable<number>, editable: boolean): ResourceRow[] {
    const porId = new Map(this.agendasStore.items().map((a) => [a.id, a]));
    return [...ids].flatMap((id) => {
      const agenda = porId.get(id);
      if (!agenda) return [];
      const contactos = this.cuenta('repositories.agendas.contacts_count', agenda.contacts.length);
      return [{ id, name: agenda.name, detail: contactos, edit: editable ? { link: `/admin/agendas/editar/${id}` } : null }];
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

  /** Las tipificaciones: cuántos niveles tienen. «Editar» abre su ficha. */
  tipificaciones(ids: Iterable<number>, editable: boolean): ResourceRow[] {
    const porId = new Map(this.tipificacionesStore.items().map((t) => [t.id, t]));
    return [...ids].flatMap((id) => {
      const t = porId.get(id);
      if (!t) return [];
      const n = nivelesDe(t);
      const niveles = this.translate.instant(`repositories.tipificaciones.levels_count${n === 1 ? '_one' : ''}`, { count: n });
      return [{ id, name: t.name, detail: niveles, edit: editable ? { link: `/admin/tipificaciones/editar/${id}` } : null }];
    });
  }

  /*
   * LO QUE CONTIENE CADA RECURSO, para el tooltip de su opción en los desplegables de Recursos de las fichas de grupo y
   * de agente (revisión de producto del 2026-10-20, DD-217 §15): elegir sabiendo qué se elige, sin ir a Repositorios.
   * Nunca vacío, para que pasar por una opción haga siempre lo mismo. Lo pinta `sc-resource-option`.
   */

  /** Las agendas: cuántos contactos tienen. Sin sus nombres: una agenda puede tener mil. */
  opcionesDeAgendas(): ResourceOptionData[] {
    return this.agendasStore.items().map((a) => ({
      label: a.name,
      value: a.id,
      contenido: a.contacts.length
        ? this.cuenta('repositories.agendas.contacts_count', a.contacts.length)
        : this.translate.instant('repositories.agendas.no_contacts'),
    }));
  }

  /** Las plantillas de un tipo: su texto, en el tooltip y sin etiquetas (las de email lo guardan en HTML). */
  opcionesDePlantillas(type: TemplateType): ResourceOptionData[] {
    return this.templatesStore
      .templates()
      .filter((t) => t.type === type)
      .map((t) => ({ label: t.title, value: t.id, contenido: aLaVista(textoPlano(t.body)) }));
  }

  /** Los equipos: qué reúnen (su descripción). */
  opcionesDeEquipos(): ResourceOptionData[] {
    return this.equiposStore.items().map((e) => ({
      label: e.name,
      value: e.id,
      contenido: aLaVista(e.description) || this.translate.instant('repositories.equipos.no_description'),
    }));
  }

  /** «1 contacto» o «12.500 contactos»: la clave en plural, y la misma con `_one` para uno. */
  private cuenta(clave: string, n: number): string {
    return this.translate.instant(n === 1 ? `${clave}_one` : clave, { count: this.cifra().format(n) });
  }
}
