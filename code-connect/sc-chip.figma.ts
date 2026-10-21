// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=334-13139

import figma from "figma"

const label = figma.selectedInstance.getString("Text")
const removable = figma.selectedInstance.getBoolean("Removable", { true: "removable", false: "" })
const icon = figma.selectedInstance.getBoolean("Show Icon", { true: 'icon="star"', false: "" })
const __props: Record<string, unknown> = {}
if (label && label.type !== "ERROR") {
  __props["label"] = label
}
if (removable && removable.type !== "ERROR") {
  __props["removable"] = removable
}
if (icon && icon.type !== "ERROR") {
  __props["icon"] = icon
}

export default {
  id: "chip",
  example: figma.code`<sc-chip label="${label}" ${icon} ${removable}></sc-chip>`,
}
