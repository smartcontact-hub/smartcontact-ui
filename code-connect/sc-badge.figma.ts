// url=https://www.figma.com/design/khNq9dJKNi13pNllrqm6dx/Smart-Contact-Design-System?node-id=330-13237
// source=projects/ui-smartcontact/src/lib/components/badge/sc-badge.component.ts
// component=ScBadgeComponent

import figma from "figma"

const label = figma.selectedInstance.getString("Text")
const variant = figma.selectedInstance.getEnum("Severity", {
  Primary: 'variant="primary"',
  Success: 'variant="success"',
  Info: 'variant="info"',
  Warn: 'variant="warn"',
  Danger: 'variant="danger"',
  Secondary: 'variant="secondary"',
  Contrast: 'variant="contrast"',
})
const size = figma.selectedInstance.getEnum("Size", {
  Small: 'size="sm"',
  Default: 'size="md"',
  Large: 'size="lg"',
  "X-Large": 'size="xl"',
})

// `Circle` de Figma (redondo con una cifra, píldora con texto largo) lo decide el ancho del contenido, no un input.
export default {
  id: "badge",
  example: figma.code`<sc-badge label="${label}" ${variant} ${size} />`,
}
