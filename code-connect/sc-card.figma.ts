// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=238-10355

import figma from "figma"

const header = figma.selectedInstance.getString("Header")
const subheader = figma.selectedInstance.getString("Subheader")
const icon = figma.selectedInstance.getBoolean("Show Icon", { true: 'icon="auto_awesome"', false: "" })
const content = figma.properties.children(["*"])
const __props: Record<string, unknown> = {}
if (header && header.type !== "ERROR") {
  __props["header"] = header
}
if (subheader && subheader.type !== "ERROR") {
  __props["subheader"] = subheader
}
if (icon && icon.type !== "ERROR") {
  __props["icon"] = icon
}
if (content && content.type !== "ERROR") {
  __props["content"] = content
}

export default {
  id: "card",
  example: figma.code`<sc-card header="${header}" subheader="${subheader}" ${icon}>${content}</sc-card>`,
}
