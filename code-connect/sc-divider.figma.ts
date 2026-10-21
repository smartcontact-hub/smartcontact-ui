// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=302-11810

import figma from "figma"

const layout = figma.selectedInstance.getEnum("Direction", { Horizontal: "horizontal", Vertical: "vertical" })
const type = figma.selectedInstance.getEnum("Type", { Solid: "solid", Dashed: "dashed" })
const align = figma.selectedInstance.getEnum("Align", {
  "N/A": "",
  Left: "left",
  Center: "center",
  Right: "right",
  Top: "top",
  Bottom: "bottom",
})

export default {
  id: "divider",
  example: figma.code`<sc-divider ${_fcc_renderHtmlAttribute("layout", layout)} ${_fcc_renderHtmlAttribute("type", type)} ${_fcc_renderHtmlAttribute("align", align)}></sc-divider>`,
}
