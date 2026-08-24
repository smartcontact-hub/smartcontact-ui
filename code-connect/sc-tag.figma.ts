// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=373-13337

import figma from "figma"

const value = figma.selectedInstance.getString("Text")
const icon = figma.selectedInstance.getBoolean("Show Icon", {
  true: "star",
  false: undefined,
})
const __props: Record<string, unknown> = {}
if (value && value.type !== "ERROR") {
  __props["value"] = value
}
if (icon && icon.type !== "ERROR") {
  __props["icon"] = icon
}

export default {
  id: "tag",
  example: figma.code`<sc-tag ${_fcc_renderHtmlAttribute(
    "value",
    value,
  )} ${_fcc_renderHtmlAttribute("icon", icon)}></sc-tag>`,
}
