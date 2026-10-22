// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=373-13726
// source=projects/ui-smartcontact/src/lib/components/skeleton/sc-skeleton.component.ts
// component=ScSkeletonComponent

import figma from "figma"

// El master no tiene propiedades: la forma y el tamaño del hueco los pone quien lo coloca. `shape` es
// `rectangle` (por defecto) o `circle`; `animation`, `wave` o `none`.
export default {
  id: "skeleton",
  example: figma.code`<sc-skeleton width="100%" height="1rem" />`,
}
