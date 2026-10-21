// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=148-6321

import figma from "figma"

const state = figma.selectedInstance.getEnum("Selected", {
  False: "none",
  True: "all",
  Indeterminate: "some",
})
const label = figma.selectedInstance.getString("Label")
const size = figma.selectedInstance.getEnum("Size", { Normal: "md", Small: "sm", Large: "lg" })
const disabled = figma.selectedInstance.getBoolean("Disabled")
const filled = figma.selectedInstance.getBoolean("Filled")

// El texto del label se proyecta como contenido: <sc-checkbox>Label</sc-checkbox>.
export default {
  id: "checkbox",
  example: figma.code`<sc-checkbox state="${state}" ${_fcc_renderHtmlAttribute("size", size)} ${_fcc_renderHtmlAttribute("disabled", disabled)} ${_fcc_renderHtmlAttribute("filled", filled)}>${label}</sc-checkbox>`,
}
