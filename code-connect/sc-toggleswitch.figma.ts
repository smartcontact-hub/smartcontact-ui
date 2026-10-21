// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=260-11899

import figma from "figma"

const checked = figma.selectedInstance.getBoolean("Checked")
const disabled = figma.selectedInstance.getBoolean("Disabled")

// Idle/Hover/Focus son estados de interacción (:hover, :focus-visible), no inputs. Invalid no existe
// como input del componente.
export default {
  id: "toggleswitch",
  example: figma.code`<sc-toggleswitch ${_fcc_renderHtmlAttribute("checked", checked)} ${_fcc_renderHtmlAttribute("disabled", disabled)} ariaLabel="…"></sc-toggleswitch>`,
}
