// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=327-13384
// source=projects/ui-smartcontact/src/lib/components/avatar/sc-avatar.component.ts
// component=ScAvatarComponent

import figma from "figma"

const text = figma.selectedInstance.getString("Text")
const size = figma.selectedInstance.getEnum("Size", {
  Normal: 'size="normal"',
  Large: 'size="large"',
  "X-Large": 'size="xlarge"',
})
const shape = figma.selectedInstance.getEnum("Circle", { False: 'shape="square"', True: 'shape="circle"' })
const type = figma.selectedInstance.getEnum("Type", {
  Label: "label",
  Icon: "icon",
  Image: "image",
})
const badge = figma.selectedInstance.getBoolean("Show Badge", { true: 'badge="1"', false: "" })

// Type decide QUÉ input se rellena: Label → `label`, Icon → `icon` (nombre del icono), Image → `image` (URL).
// En el snippet va el de etiqueta; con Type = Icon o Image, cambia `label` por `icon` o `image`.
export default {
  id: "avatar",
  example: figma.code`<!-- Type en Figma: ${type} -->
<sc-avatar label="${text}" ${size} ${shape} ${badge} ariaLabel="…" />`,
}
