// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=23-835

import figma from "figma"

const label = figma.selectedInstance.getString("↳ Label")
const helperText = figma.selectedInstance.getString("↳ Helper Text")
const size = figma.selectedInstance.getEnum("🤏 Size", { Normal: "md", Small: "sm", Large: "lg" })
const invalid = figma.selectedInstance.getBoolean("❌ Invalid")
const disabled = figma.selectedInstance.getBoolean("🚫 Disabled")
const filled = figma.selectedInstance.getBoolean("🟦 Filled")
const iftaLabel = figma.selectedInstance.getBoolean("▭ Ifta Label")

export default {
  id: "inputtext",
  example: figma.code`<sc-inputtext ${_fcc_renderHtmlAttribute("label", label)} ${_fcc_renderHtmlAttribute("helperText", helperText)} ${_fcc_renderHtmlAttribute("size", size)} ${_fcc_renderHtmlAttribute("invalid", invalid)} ${_fcc_renderHtmlAttribute("disabled", disabled)} ${_fcc_renderHtmlAttribute("filled", filled)} ${_fcc_renderHtmlAttribute("iftaLabel", iftaLabel)} [(value)]="value"></sc-inputtext>`,
}
