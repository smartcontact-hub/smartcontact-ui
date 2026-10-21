// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=263-10540
// source=projects/ui-smartcontact/src/lib/components/inputgroup/sc-inputgroup.component.ts
// component=ScInputGroupComponent

import figma from "figma"

const left = figma.selectedInstance.getEnum("Left", { False: "", True: "<p-inputgroup-addon>$</p-inputgroup-addon>" })
const right = figma.selectedInstance.getEnum("Right", { False: "", True: "<p-inputgroup-addon>.00</p-inputgroup-addon>" })

// Left, Right, Second Left y Second Right son los huecos de addon (texto, icono, botón, checkbox o radio) a cada lado
// del input: no son inputs del componente, son contenido proyectado como `<p-inputgroup-addon>`.
export default {
  id: "inputgroup",
  example: figma.code`<sc-inputgroup>
  ${left}
  <sc-inputtext [(value)]="value" />
  ${right}
</sc-inputgroup>`,
}
