// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=302-11810

import figma from "figma"

const layout = figma.selectedInstance.getEnum("Direction", { Horizontal: 'layout="horizontal"', Vertical: 'layout="vertical"' })
const type = figma.selectedInstance.getEnum("Type", { Solid: 'type="solid"', Dashed: 'type="dashed"' })
const align = figma.selectedInstance.getEnum("Align", {
  "N/A": "",
  Left: 'align="left"',
  Center: 'align="center"',
  Right: 'align="right"',
  Top: 'align="top"',
  Bottom: 'align="bottom"',
})

export default {
  id: "divider",
  example: figma.code`<sc-divider ${layout} ${type} ${align}></sc-divider>`,
}
