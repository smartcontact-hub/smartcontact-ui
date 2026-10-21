// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=10-125

import figma from "figma"

const label = figma.selectedInstance.getString("Text")
const variant = figma.selectedInstance.getEnum("Severity", {
  Primary: "primary",
  Secondary: "secondary",
  Success: "success",
  Info: "info",
  Warn: "warn",
  Help: "help",
  Danger: "danger",
  Contrast: "contrast",
  Plain: "plain",
})
const disabled = figma.selectedInstance.getBoolean("Disabled")
const iconOnly = figma.selectedInstance.getBoolean("Icon Only")
const rounded = figma.selectedInstance.getBoolean("⥰ Rounded")
const raised = figma.selectedInstance.getBoolean("⬆️ Raised")
const outlined = figma.selectedInstance.getBoolean("🔲 Outlined", { true: "outlined", false: "" })
const text = figma.selectedInstance.getBoolean("🔤 Text", { true: "text", false: "" })
const link = figma.selectedInstance.getBoolean("Link", { true: "link", false: "" })

// En Figma Outlined, Text y Link son tres booleanos sueltos; en código son UN valor, `appearance`
// (filled | outlined | text | link). Si los tres salen vacíos, es filled (el default: no se escribe).
export default {
  id: "button",
  example: figma.code`<sc-button ${_fcc_renderHtmlAttribute("label", label)} ${_fcc_renderHtmlAttribute("variant", variant)} ${_fcc_renderHtmlAttribute("disabled", disabled)} ${_fcc_renderHtmlAttribute("iconOnly", iconOnly)} ${_fcc_renderHtmlAttribute("rounded", rounded)} ${_fcc_renderHtmlAttribute("raised", raised)}></sc-button>
<!-- appearance="${outlined}${text}${link}": solo si no está vacío; vacío = filled -->`,
}
