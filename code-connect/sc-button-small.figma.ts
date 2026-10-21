// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=7593-168546
// source=projects/ui-smartcontact/src/lib/components/button/sc-button.component.ts
// component=ScButtonComponent

import figma from "figma"

const label = figma.selectedInstance.getString("Text")
const variant = figma.selectedInstance.getEnum("Severity", {
  Primary: 'variant="primary"',
  Secondary: 'variant="secondary"',
  Success: 'variant="success"',
  Info: 'variant="info"',
  Warn: 'variant="warn"',
  Help: 'variant="help"',
  Danger: 'variant="danger"',
  Contrast: 'variant="contrast"',
  Plain: 'variant="plain"',
})
const disabled = figma.selectedInstance.getBoolean("Disabled", { true: "disabled", false: "" })
const iconOnly = figma.selectedInstance.getBoolean("Icon Only", { true: "iconOnly", false: "" })
const rounded = figma.selectedInstance.getBoolean("⥰ Rounded", { true: "rounded", false: "" })
const raised = figma.selectedInstance.getBoolean("⬆️ Raised", { true: "raised", false: "" })
const outlined = figma.selectedInstance.getBoolean("🔲 Outlined", { true: "outlined", false: "" })
const text = figma.selectedInstance.getBoolean("🔤 Text", { true: "text", false: "" })
const link = figma.selectedInstance.getBoolean("Link", { true: "link", false: "" })

// Master aparte del botón pequeño: mismas propiedades que `button`, y en código es `size="sm"`.
// En Figma Outlined, Text y Link son tres booleanos sueltos; en código son UN valor, `appearance`
// (filled | outlined | text | link). Si los tres salen vacíos, es filled (el default: no se escribe).
export default {
  id: "button-small",
  example: figma.code`<sc-button size="sm" label="${label}" ${variant} ${disabled} ${iconOnly} ${rounded} ${raised}></sc-button>
<!-- appearance="${outlined}${text}${link}": solo si no está vacío; vacío = filled -->`,
}
