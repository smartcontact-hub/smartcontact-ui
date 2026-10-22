// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=109-10137
// source=projects/ui-smartcontact/src/lib/components/datepicker/sc-datepicker.component.ts
// component=ScDatepickerComponent

import figma from "figma"

const inline = figma.selectedInstance.getEnum("Type", { Popup: "", Inline: "inline" })
const view = figma.selectedInstance.getEnum("Picker Type", {
  Default: "",
  Time: "",
  Month: 'view="month"',
  Year: 'view="year"',
})
const showButtonBar = figma.selectedInstance.getBoolean("Show Bar", { true: "showButtonBar", false: "" })

// Picker Type = Time no tiene input: el selector de hora no existe en `sc-datepicker`. Show Week y State
// (Idle/Focus) tampoco son inputs.
export default {
  id: "datepicker",
  example: figma.code`<sc-datepicker label="Fecha" ${inline} ${view} ${showButtonBar} [(value)]="value" />`,
}
