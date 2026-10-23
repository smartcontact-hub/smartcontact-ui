// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=23-835
// source=projects/ui-smartcontact/src/lib/components/inputtext/sc-inputtext.component.ts
// component=ScInputTextComponent

import figma from "figma"

const label = figma.selectedInstance.getString("↳ Label")
const helperText = figma.selectedInstance.getString("↳ Helper Text")
const size = figma.selectedInstance.getEnum("🤏 Size", { Normal: 'size="md"', Small: 'size="sm"', Large: 'size="lg"' })
const invalid = figma.selectedInstance.getBoolean("❌ Invalid", { true: "invalid", false: "" })
const disabled = figma.selectedInstance.getBoolean("🚫 Disabled", { true: "disabled", false: "" })
const filled = figma.selectedInstance.getBoolean("🟦 Filled", { true: "filled", false: "" })
const iftaLabel = figma.selectedInstance.getBoolean("▭ Ifta Label", { true: "iftaLabel", false: "" })

export default {
  id: "inputtext",
  example: figma.code`<sc-inputtext label="${label}" helperText="${helperText}" ${size} ${invalid} ${disabled} ${filled} ${iftaLabel} [(value)]="value"></sc-inputtext>`,
}
