/*
 * SCDS local barrel — REDUCIDO tras la migración a @smartcontact-hub/* (S77).
 *
 * Solo quedan las piezas que NO se migraron al paquete publicado (ver
 * docs/NEXT-SESSION-PLAN o el commit de la migración):
 *   - icon: el `<sc-icon>` local es Outlined; el paquete publica Rounded.
 *     Alinear el set de iconos del paquete a Outlined es tarea aparte del DS.
 *   - illustrated-avatar: el paquete (sc-avatar) aún no expone tamaño en px.
 *   - label-chip: el paquete (sc-tag) aún no expone el tamaño `xs`.
 *     shape) cubre a los consumidores de `sc-group-popover` publicado.
 *
 * El resto de componentes se consumen desde `@smartcontact-hub/components`.
 */


// El avatar con su estado en una burbuja abajo a la derecha (DD-185).
export { PresenceAvatarComponent } from './presence-avatar/presence-avatar.component';

export { IllustratedAvatarComponent } from './illustrated-avatar/illustrated-avatar.component';
export type { IllustratedAvatarPool } from './illustrated-avatar/illustrated-avatar.component';


export { ListPageComponent } from './list-page/list-page.component';

// Elegir y ordenar columnas: el «Column Toggle» de primeng.dev/table (DD-176), en las listas y en la tabla de contactos.
export { ColumnToggleComponent } from './column-toggle/column-toggle.component';
export type { ColumnToggleOption } from './column-toggle/column-toggle.component';
export { normalizePrefs } from './column-toggle/column-prefs';
export type { ColumnPrefs } from './column-toggle/column-prefs';

// Importar de un CSV: el mismo diálogo en Tipificaciones, Plantillas y Agendas (DD-166, revisión del 2026-10-15).
export { ImportDialogComponent } from './import-dialog/import-dialog.component';
export type { ImportSummary } from './import-dialog/import-dialog.component';

// Una celda sin dato: «—» a la vista y «Sin dato» para el lector (DD-197).
export { CeldaVaciaComponent } from './celda-vacia/celda-vacia.component';

// Una opción de un desplegable de recursos con su lápiz de «Editar» al pasar (revisión del 2026-10-14).
export { ResourceOptionComponent } from './resource-option/resource-option.component';
export type { ResourceRow } from './resource-option/resource-option.component';

export { ChannelIconComponent } from './channel-icon/channel-icon.component';
export type { ChannelIconKind } from './channel-icon/channel-icon.component';

export { LabelChipComponent } from './label-chip/label-chip.component';
export type { LabelChipModel } from './label-chip/label-chip.component';
export type { LabelColor } from './label-chip/label-chip.types';
export { LABEL_COLORS } from './label-chip/label-chip.types';

// El DS ya lo exporta (2026-07-18): re-export para no tocar los 8 consumidores.
export type { GroupRef } from '@smartcontact-hub/components';
export { NameInplaceComponent } from './name-inplace/name-inplace.component';

// El widget del resumen de las fichas: una cifra con su anillo (DD-126).
export { SummaryKpiComponent } from './summary-kpi/summary-kpi.component';

// El pie de cada sección en un alta: «Atrás» y «Siguiente» (DD-143).
export { AltaPieComponent } from './alta-pie/alta-pie.component';

// El nombre de la ficha, fijo arriba al bajar: una copia muda de la cabecera (DD-145).

// Botón de solo icono que navega con routerLink (quick-win de la auditoría UX, 2026-10): local
// porque depende de @angular/router, que @smartcontact-hub/components no tiene como peer.
export { ScLinkButtonComponent } from './link-button/sc-link-button.component';
