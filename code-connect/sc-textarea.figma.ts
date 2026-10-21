// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=6209-7402

import figma from "figma"

const size = figma.selectedInstance.getEnum("🤏 Size", { Normal: "md", Small: "sm", Large: "lg" })
const invalid = figma.selectedInstance.getBoolean("❌ Invalid")
const disabled = figma.selectedInstance.getBoolean("🚫 Disabled")
const variant = figma.selectedInstance.getBoolean("🟦 Filled", { true: "filled", false: undefined })

// State (Default/Hover/Focus) son :hover y :focus-visible, no inputs. El texto flotante de Figma
// (Float Label) no tiene input equivalente: la etiqueta se pasa con `label`.
export default {
  id: "textarea",
  example: figma.code`<sc-textarea ${_fcc_renderHtmlAttribute("size", size)} ${_fcc_renderHtmlAttribute("variant", variant)} ${_fcc_renderHtmlAttribute("invalid", invalid)} ${_fcc_renderHtmlAttribute("disabled", disabled)} [(value)]="value"></sc-textarea>`,
}
