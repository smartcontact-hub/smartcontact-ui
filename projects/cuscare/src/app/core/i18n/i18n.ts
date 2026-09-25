import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, Pipe, PipeTransform, signal } from '@angular/core';

import { ES_VIEWS_DETAIL } from './es/views-detail';
import { ES_VIEWS_MAIN } from './es/views-main';
import { ES_VIEWS_SETTINGS } from './es/views-settings';

export type Lang = 'en' | 'es';

export const LANGS: readonly { readonly value: Lang; readonly label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

/**
 * Castellano de la réplica. La CLAVE es el texto inglés que pinta la réplica; el valor sale
 * del diccionario REAL de CusCare (`assets/i18n/cuscare/es.json` y `core/es.json`, bajados el
 * 2026-09-25 del sitio vivo: son estáticos, no tocan sesión). Lo que el original no traduce
 * («Source», «Manage MO in error») se queda igual. Lo marcado «propio» no está en su
 * diccionario y lo pone la réplica.
 *
 * Aquí va el de la vista Tickets (tabla, barra, filtros y el filtro «Request type»); el resto
 * de vistas tiene el suyo en `./es/`.
 */
const ES_TICKETS: Readonly<Record<string, string>> = {
  // Shell (ASIDE.*, SETTINGS)
  Dashboard: 'Panel de control',
  Tickets: 'Tickets',
  Search: 'Búsqueda',
  Users: 'Usuarios',
  Roles: 'Roles',
  Groups: 'Grupos',
  Templates: 'Plantillas',
  Settings: 'Configuración',
  Language: 'Idioma', // propio
  // Barra y pie de la tabla (PAGES.TICKET.TABLE.*, COMMON.*, PAGINATION.*, SHARED.COLUMN_MANAGER.*)
  '+ New ticket': '+ Nuevo ticket',
  Assign: 'Asignar',
  'Change status': 'Cambiar estado',
  Unsubscribe: 'Dar de baja',
  Archive: 'Archivar',
  'Manage columns': 'Gestionar columnas',
  'Reset to default': 'Restablecer por defecto',
  'Clear selection': 'Limpiar selección',
  Download: 'Descargar',
  'Delete filters': 'Eliminar filtros',
  Filter: 'Filtro',
  'Loading data...': 'Cargando datos...',
  'No data to show': 'No hay datos que mostrar', // propio
  of: 'de',
  results: 'resultados',
  'filtered from': 'filtrado de',
  'Rows per page': 'Registros por página',
  Loading: 'Cargando', // propio
  'Select ticket': 'Seleccionar ticket', // propio
  'Ticket blocked': 'Ticket bloqueado',
  'Filter by': 'Filtrar por', // propio
  Pagination: 'Paginación', // propio
  Page: 'Página',
  // Los tres modos del popover de filtro (All / New / Update): PAGES.TICKET.TABLE.ALL, ISNEW, ISUPDATE
  'popfilter::All': 'Todos',
  'popfilter::New': 'Nuevos',
  'popfilter::Update': 'Actualizados',
  // Cabeceras de columna
  Status: 'Estado',
  'Assigned to': 'Asignado a',
  Group: 'Grupo',
  Channel: 'Canal',
  Email: 'Email',
  Country: 'País',
  Products: 'Productos',
  Created: 'Creación',
  Updated: 'Actualización',
  Description: 'Descripción',
  Priority: 'Prioridad',
  'Sub-status': 'Subestado',
  Refund: 'Devolución',
  Carrier: 'Operador',
  'MO Error Content': 'Contenido del MO',
  // «Request type» (V3): NATURE_OF_DEMAND.* y el copy de la V3 en Figma
  'Request type': 'Tipo de solicitud',
  AI: 'IA',
  Agent: 'Agente',
  'Search type': 'Buscar tipo',
  'All types': 'Todos los tipos', // propio
  'No types match': 'Ningún tipo coincide', // propio
  'Filter by Request type': 'Filtrar por Tipo de solicitud',
  'Clear Request type filter': 'Borrar el filtro de Tipo de solicitud',
  Unsubscription: 'Baja',
  'GDPR access': 'GDPR - Derecho de acceso',
  'GDPR Forgotten': 'GDPR - Derecho de olvido',
  'Withdrawal Right': 'Derecho de desistimiento',
  Information: 'Información',
  'Product problem': 'Problema con el producto',
  'Log problem': 'Problema con el login',
  'Pending to define': 'Pendiente de definir',
  Others: 'Otros',
};

/** Todo el castellano: el de Tickets (arriba) y el del resto de vistas, en `./es/`. */
const ES: Readonly<Record<string, string>> = {
  ...ES_TICKETS,
  ...ES_VIEWS_MAIN,
  ...ES_VIEWS_SETTINGS,
  ...ES_VIEWS_DETAIL,
};

/** Separador de contexto: `'action::Search'` es «Buscar»; `'Search'` a secas, «Búsqueda». */
const CTX = '::';

const STORAGE_KEY = 'cc-lang';

/**
 * El idioma al abrir: primero el del enlace (`…/tickets?lang=es`, para compartir el prototipo
 * ya en castellano), después el guardado, y si no, inglés como la réplica.
 */
function readStored(): Lang {
  const fromUrl = /[?&]lang=(en|es)\b/.exec(globalThis.location?.hash ?? '')?.[1];
  if (fromUrl === 'en' || fromUrl === 'es') return fromUrl;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

/** Idioma de la réplica: se cambia en Ajustes (el engranaje) y se recuerda al recargar. */
@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(readStored());

  constructor() {
    const doc = inject(DOCUMENT);
    effect(() => {
      doc.documentElement.lang = this.lang();
    });
  }

  set(lang: Lang): void {
    this.lang.set(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* sin almacenamiento (ventana privada): el cambio vale para esta visita */
    }
  }

  /**
   * El texto en el idioma elegido. Una clave con contexto (`'action::Search'`) pinta en
   * inglés solo lo que va tras el separador. Sin traducción, se queda en inglés.
   */
  t(en: string): string {
    const plain = en.includes(CTX) ? en.slice(en.indexOf(CTX) + CTX.length) : en;
    return this.lang() === 'es' ? (ES[en] ?? plain) : plain;
  }
}

/**
 * `{{ 'Assign' | tr }}`. Impuro a propósito: lee la señal del idioma en cada pasada, así
 * que un cambio en Ajustes repinta hasta las vistas OnPush.
 */
@Pipe({ name: 'tr', standalone: true, pure: false })
export class TrPipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(en: string): string {
    return this.i18n.t(en);
  }
}
