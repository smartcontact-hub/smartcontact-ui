// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=156-5882

import figma from "figma"

const filter = figma.selectedInstance.getBoolean("Show Filter")
const __props: Record<string, unknown> = {}
if (filter && filter.type !== "ERROR") {
  __props["filter"] = filter
}

export default {
  id: "select",
  example: figma.code`<sc-select [options]="options" placeholder="Select" ${_fcc_renderHtmlAttribute(
    "filter",
    filter,
  )}></sc-select>`,
}
