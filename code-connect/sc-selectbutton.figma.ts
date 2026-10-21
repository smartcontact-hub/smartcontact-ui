// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=191-6703

import figma from "figma"

const multiple = figma.selectedInstance.getBoolean("Multiple", { true: "multiple", false: "" })
const invalid = figma.selectedInstance.getBoolean("Invalid", { true: "invalid", false: "" })

// Option Amount (2, 3 o 4) y Select (cuál está activa) son DATOS: el número de botones sale de
// `options` y la activa de `value`.
export default {
  id: "selectbutton",
  example: figma.code`<sc-selectbutton [options]="options" ${multiple} ${invalid} [(value)]="value"></sc-selectbutton>`,
}
