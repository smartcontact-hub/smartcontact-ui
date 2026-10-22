// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=605-37190
// source=projects/ui-smartcontact/src/lib/components/group-popover/sc-group-popover.component.ts
// component=ScGroupPopoverComponent

import figma from "figma"

const panel = figma.selectedInstance.getEnum("Panel", {
  False: "cerrado",
  True: "abierto",
})

// El master de Figma es el popover genérico de PrimeNG; `sc-group-popover` lo usa para listar los grupos de
// una celda. `groups` son `{ id, name, active }`; `display` es `count` (la cifra) o `adaptive` (nada, un nombre
// o la cifra según cuántos haya). Panel no es un input: se abre al pasar el ratón o con el teclado.
export default {
  id: "group-popover",
  example: figma.code`<!-- Panel en Figma: ${panel} -->
<sc-group-popover [groups]="grupos" display="count" countAriaLabel="…" (activated)="abrir()" />`,
}
