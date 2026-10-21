// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=15482-72269
// source=projects/ui-smartcontact/src/lib/components/icon-tile/sc-icon-tile.component.ts
// component=ScIconTileComponent

import figma from "figma"

const size = figma.selectedInstance.getEnum("Size", { md: 'size="md"', sm: 'size="sm"' })
const tone = figma.selectedInstance.getEnum("Tone", {
  default: 'tone="default"',
  strong: 'tone="strong"',
  brand: 'tone="brand"',
})

// El glifo de Figma (Icono, un swap) es `icon`, el nombre del icono: aquí va uno de ejemplo.
export default {
  id: "icon-tile",
  example: figma.code`<sc-icon-tile icon="headphones" ${size} ${tone} />`,
}
