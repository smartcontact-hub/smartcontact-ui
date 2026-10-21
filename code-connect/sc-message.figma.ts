// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=393-39252

import figma from "figma"

const text = figma.selectedInstance.getString("Text")
const severity = figma.selectedInstance.getEnum("Severity", {
  Success: "success",
  Info: "info",
  Warn: "warn",
  Error: "danger",
  Secondary: "secondary",
  Contrast: "contrast",
})
const variant = figma.selectedInstance.getEnum("Type", {
  Default: "simple",
  Simple: "simple",
  Outlined: "outlined",
})
const size = figma.selectedInstance.getEnum("Size", { Normal: "md", Small: "sm", Large: "lg" })
const closable = figma.selectedInstance.getBoolean("Closable")
const icon = figma.selectedInstance.getBoolean("Show Icon", { true: "info", false: undefined })

export default {
  id: "message",
  example: figma.code`<sc-message ${_fcc_renderHtmlAttribute("text", text)} ${_fcc_renderHtmlAttribute("severity", severity)} ${_fcc_renderHtmlAttribute("variant", variant)} ${_fcc_renderHtmlAttribute("size", size)} ${_fcc_renderHtmlAttribute("closable", closable)} ${_fcc_renderHtmlAttribute("icon", icon)}></sc-message>`,
}
