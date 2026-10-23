// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=4461-50366
// source=projects/ui-smartcontact/src/lib/components/drawer/sc-drawer.component.ts
// component=ScDrawerComponent

import figma from "figma"

const header = figma.selectedInstance.getString("Header")
const content = figma.selectedInstance.getString("Content")
const position = figma.selectedInstance.getEnum("Position", {
  Left: 'position="left"',
  Right: 'position="right"',
  Top: 'position="top"',
  Bottom: 'position="bottom"',
  "N/A": "",
})
const fullScreen = figma.selectedInstance.getBoolean("Fullscreen", { true: "fullScreen", false: "" })

// Show Header y Show Footer no son inputs: sin cabecera, no se pasa `header`; el pie no existe en el
// componente (el contenido proyectado lleva sus propios botones).
export default {
  id: "drawer",
  example: figma.code`<sc-drawer [(visible)]="visible" header="${header}" ${position} ${fullScreen}>
  ${content}
</sc-drawer>`,
}
