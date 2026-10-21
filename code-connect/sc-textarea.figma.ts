// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=6209-7402
// source=projects/ui-smartcontact/src/lib/components/textarea/sc-textarea.component.ts
// component=ScTextareaComponent

import figma from "figma"

const size = figma.selectedInstance.getEnum("🤏 Size", { Normal: 'size="md"', Small: 'size="sm"', Large: 'size="lg"' })
const invalid = figma.selectedInstance.getBoolean("❌ Invalid", { true: "invalid", false: "" })
const disabled = figma.selectedInstance.getBoolean("🚫 Disabled", { true: "disabled", false: "" })
const variant = figma.selectedInstance.getBoolean("🟦 Filled", { true: 'variant="filled"', false: "" })

// State (Default/Hover/Focus) son :hover y :focus-visible, no inputs. El texto flotante de Figma
// (Float Label) no tiene input equivalente: la etiqueta se pasa con `label`.
export default {
  id: "textarea",
  example: figma.code`<sc-textarea ${size} ${variant} ${invalid} ${disabled} [(value)]="value"></sc-textarea>`,
}
