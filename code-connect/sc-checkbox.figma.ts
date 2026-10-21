// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=148-6321
// source=projects/ui-smartcontact/src/lib/components/checkbox/sc-checkbox.component.ts
// component=ScCheckboxComponent

import figma from "figma"

const state = figma.selectedInstance.getEnum("Selected", {
  False: "none",
  True: "all",
  Indeterminate: "some",
})
const label = figma.selectedInstance.getString("Label")
const size = figma.selectedInstance.getEnum("Size", { Normal: 'size="md"', Small: 'size="sm"', Large: 'size="lg"' })
const disabled = figma.selectedInstance.getBoolean("Disabled", { true: "disabled", false: "" })
const filled = figma.selectedInstance.getBoolean("Filled", { true: "filled", false: "" })

// El texto del label se proyecta como contenido: <sc-checkbox>Label</sc-checkbox>.
export default {
  id: "checkbox",
  example: figma.code`<sc-checkbox state="${state}" ${size} ${disabled} ${filled}>${label}</sc-checkbox>`,
}
