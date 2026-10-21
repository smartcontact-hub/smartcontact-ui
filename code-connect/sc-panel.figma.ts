// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=229-10217
// source=projects/ui-smartcontact/src/lib/components/panel/sc-panel.component.ts
// component=ScPanelComponent

import figma from "figma"

const header = figma.selectedInstance.getString("Header")
const content = figma.selectedInstance.getString("Content")
const toggleable = figma.selectedInstance.getEnum("Toggleable", { False: "", True: "toggleable" })
const collapsed = figma.selectedInstance.getEnum("Toggle Status", {
  Expanded: "",
  Collapsed: "[collapsed]=\"true\"",
  "N/A": "",
})

// Show Footer, Footer y Custom Icon de Figma no tienen input: el pie y el icono van dentro del contenido.
export default {
  id: "panel",
  example: figma.code`<sc-panel header="${header}" ${toggleable} ${collapsed}>
  ${content}
</sc-panel>`,
}
