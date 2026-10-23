// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=203-8804
// source=projects/ui-smartcontact/src/lib/components/inputnumber/sc-inputnumber.component.ts
// component=ScInputNumberComponent

import figma from "figma"

const type = figma.selectedInstance.getEnum("Type", {
  Stacked: "Stacked",
  "Horizontal with Step": "Horizontal with Step",
  Vertical: "Vertical",
})

// El componente no expone la disposición de los botones de paso: `Type` es solo de Figma.
export default {
  id: "inputnumber",
  example: figma.code`<!-- Type en Figma: ${type} (no es un input) -->
<sc-inputnumber [min]="0" [max]="100" [step]="1" [(value)]="value"></sc-inputnumber>`,
}
