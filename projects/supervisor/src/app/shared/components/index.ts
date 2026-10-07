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

export { ResourceRowsComponent } from './resource-rows/resource-rows.component';
export type { ResourceRow } from './resource-rows/resource-rows.component';

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

// Lo que le falta a un alta, hasta «Listo para crear» (DD-136).
export { SummaryStatusComponent } from './summary-status/summary-status.component';

// El pie de cada sección en un alta: «Atrás» y «Siguiente» (DD-143).
export { AltaPieComponent } from './alta-pie/alta-pie.component';

// El nombre de la ficha, fijo arriba al bajar: una copia muda de la cabecera (DD-145).
