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


export { IllustratedAvatarComponent } from './illustrated-avatar/illustrated-avatar.component';
export type { IllustratedAvatarPool } from './illustrated-avatar/illustrated-avatar.component';


export { LabelChipComponent } from './label-chip/label-chip.component';
export type { LabelChipModel } from './label-chip/label-chip.component';
export type { LabelColor } from './label-chip/label-chip.types';
export { LABEL_COLORS } from './label-chip/label-chip.types';

// El DS ya lo exporta (2026-07-18): re-export para no tocar los 8 consumidores.
export type { GroupRef } from '@smartcontact-hub/components';
