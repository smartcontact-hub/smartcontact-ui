// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=140-5820
// source=projects/ui-smartcontact/src/lib/components/radiobutton/sc-radiobutton.component.ts
// component=ScRadioButtonComponent

import figma from "figma"

const label = figma.selectedInstance.getString("Label")
const size = figma.selectedInstance.getEnum("Size", {
  Normal: 'size="md"',
  Small: 'size="sm"',
  Large: 'size="lg"',
})
const variant = figma.selectedInstance.getBoolean("Filled", { true: 'variant="filled"', false: "" })
const disabled = figma.selectedInstance.getBoolean("Disabled", { true: "[disabled]=\"true\"", false: "" })

// Un radio es UNA opción de un grupo: `value` es el de esta opción y `[(modelValue)]` el elegido del grupo (todos
// los radios del grupo comparten `name` y el mismo modelo). Selected no es un input: sale de modelValue === value.
export default {
  id: "radiobutton",
  example: figma.code`<sc-radiobutton name="grupo" [value]="opcion" [(modelValue)]="elegido" ${size} ${variant} ${disabled}>${label}</sc-radiobutton>`,
}
