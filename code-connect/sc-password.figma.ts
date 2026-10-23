// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=287-10430
// source=projects/ui-smartcontact/src/lib/components/password/sc-password.component.ts
// component=ScPasswordComponent

import figma from "figma"

const toggleMask = figma.selectedInstance.getEnum("Toggle Mask", {
  False: '[toggleMask]="false"',
  True: "",
})

// El ojo para ver la contraseña (`toggleMask`) vale true por defecto: solo se escribe cuando Figma lo apaga.
// State (Idle/Open/Selected) es :focus y el panel abierto, y Password Visible es el estado del ojo: no son inputs.
export default {
  id: "password",
  example: figma.code`<sc-password label="Contraseña" ${toggleMask} [(value)]="value" />`,
}
